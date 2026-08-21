"""
AI Resume Analyzer - Python Flask backend with SQLite database.

Run:
    cd backend
    python -m venv venv
    source venv/bin/activate      # Windows: venv\\Scripts\\activate
    pip install -r requirements.txt
    python app.py                 # http://127.0.0.1:5000

Endpoints:
    GET  /api/health              -> service status
    POST /api/analyze             -> upload resume (PDF/DOCX) + optional job description
    GET  /api/history             -> last 20 saved analyses
    GET  /api/history/<id>        -> one saved analysis
    DELETE /api/history/<id>      -> delete one saved analysis
"""

import json
import os
import re
import sqlite3
from datetime import datetime

from flask import Flask, g, jsonify, request
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "resume_analyzer.db")

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------- database ---

SCHEMA = """
CREATE TABLE IF NOT EXISTS analyses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name       TEXT    NOT NULL,
    score           INTEGER NOT NULL,
    match_percent   INTEGER,
    skills_found    TEXT    NOT NULL,   -- JSON array
    skills_missing  TEXT    NOT NULL,   -- JSON array
    suggestions     TEXT    NOT NULL,   -- JSON array
    word_count      INTEGER NOT NULL,
    created_at      TEXT    NOT NULL
);
"""


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    con = sqlite3.connect(DB_PATH)
    con.executescript(SCHEMA)
    con.commit()
    con.close()


# ------------------------------------------------------- text extraction ----


def extract_text(file_storage) -> str:
    name = (file_storage.filename or "").lower()
    data = file_storage.read()

    if name.endswith(".pdf"):
        from pypdf import PdfReader
        from io import BytesIO

        reader = PdfReader(BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if name.endswith(".docx"):
        import docx2txt
        from io import BytesIO

        return docx2txt.process(BytesIO(data)) or ""

    if name.endswith(".txt"):
        return data.decode("utf-8", errors="ignore")

    raise ValueError("Unsupported file type. Use PDF, DOCX or TXT.")


# -------------------------------------------------------------- analysis ----

SKILLS = [
    "python", "java", "c", "c++", "javascript", "typescript", "sql", "html",
    "css", "react", "node.js", "flask", "django", "mysql", "sqlite",
    "mongodb", "git", "github", "linux", "docker", "aws", "rest api",
    "data structures", "algorithms", "machine learning", "pandas", "numpy",
    "communication", "teamwork", "problem solving", "leadership",
]

SECTIONS = {
    "education": ["education", "academic"],
    "experience": ["experience", "internship", "work history"],
    "skills": ["skills", "technical skills"],
    "projects": ["projects", "project work"],
    "achievements": ["achievements", "awards", "certifications"],
}

ACTION_VERBS = [
    "built", "designed", "developed", "implemented", "led", "created",
    "improved", "optimized", "managed", "automated", "reduced", "increased",
]


def find_skills(text: str):
    low = text.lower()
    return [s for s in SKILLS if re.search(r"(?<!\w)" + re.escape(s) + r"(?!\w)", low)]


def keywords(text: str):
    stop = {
        "the", "and", "for", "with", "you", "our", "are", "will", "have", "this",
        "that", "from", "your", "who", "all", "any", "job", "role", "work",
        "team", "must", "should", "candidate", "experience", "years", "plus",
    }
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.]{2,}", text.lower())
    freq = {}
    for w in words:
        if w in stop:
            continue
        freq[w] = freq.get(w, 0) + 1
    return sorted(freq, key=lambda w: -freq[w])[:40]


def analyze(text: str, job_description: str = ""):
    words = text.split()
    word_count = len(words)
    low = text.lower()

    found = find_skills(text)
    sections_present = [
        name for name, keys in SECTIONS.items() if any(k in low for k in keys)
    ]

    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text))
    has_phone = bool(re.search(r"(\+?\d[\d\s-]{8,}\d)", text))
    verbs_used = [v for v in ACTION_VERBS if v in low]
    has_numbers = bool(re.search(r"\d+%|\d+\+", text))

    contact_score = (10 if has_email else 0) + (5 if has_phone else 0)          # 15
    section_score = round(len(sections_present) / len(SECTIONS) * 25)            # 25
    skill_score = min(20, round(len(found) / 12 * 20))                          # 20
    length_score = 15 if 250 <= word_count <= 900 else (8 if word_count > 120 else 3)
    impact_score = min(15, len(verbs_used) * 2 + (5 if has_numbers else 0))     # 15

    missing = []
    match_percent = None
    jd_score = 0                                                                # 10
    if job_description.strip():
        jd_keys = keywords(job_description)
        matched = [k for k in jd_keys if k in low]
        match_percent = round(len(matched) / max(1, len(jd_keys)) * 100)
        jd_score = round(match_percent / 100 * 10)
        jd_skills = find_skills(job_description)
        missing = [s for s in jd_skills if s not in found]
    else:
        missing = [s for s in SKILLS[:12] if s not in found][:6]

    score = min(
        100,
        contact_score + section_score + skill_score + length_score + impact_score + jd_score,
    )

    suggestions = []
    if not has_email or not has_phone:
        suggestions.append("Add complete contact details (email and phone number).")
    for name in SECTIONS:
        if name not in sections_present:
            suggestions.append(f"Add a clear '{name.title()}' section.")
    if len(verbs_used) < 4:
        suggestions.append("Start bullet points with strong action verbs like 'built' or 'optimized'.")
    if not has_numbers:
        suggestions.append("Quantify results with numbers (e.g. 'improved speed by 30%').")
    if word_count < 250:
        suggestions.append("Your resume is short — expand project and skill descriptions.")
    if word_count > 900:
        suggestions.append("Your resume is long — trim it to one or two focused pages.")
    if missing:
        suggestions.append("Learn or highlight these skills: " + ", ".join(missing[:5]) + ".")
    if not suggestions:
        suggestions.append("Great resume! Keep it updated with your latest projects.")

    return {
        "score": score,
        "match_percent": match_percent,
        "word_count": word_count,
        "sections_present": sections_present,
        "skills_found": found,
        "skills_missing": missing,
        "suggestions": suggestions,
        "breakdown": {
            "contact": contact_score,
            "sections": section_score,
            "skills": skill_score,
            "length": length_score,
            "impact": impact_score,
            "job_match": jd_score,
        },
    }


# ---------------------------------------------------------------- routes ----


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "database": os.path.basename(DB_PATH)})


@app.post("/api/analyze")
def analyze_route():
    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded (field name: 'resume')."}), 400

    file = request.files["resume"]
    job_description = request.form.get("job_description", "")

    try:
        text = extract_text(file)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 400

    if len(text.strip()) < 40:
        return jsonify({"error": "Could not extract readable text from this file."}), 400

    result = analyze(text, job_description)

    db = get_db()
    cur = db.execute(
        """INSERT INTO analyses
           (file_name, score, match_percent, skills_found, skills_missing,
            suggestions, word_count, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            file.filename,
            result["score"],
            result["match_percent"],
            json.dumps(result["skills_found"]),
            json.dumps(result["skills_missing"]),
            json.dumps(result["suggestions"]),
            result["word_count"],
            datetime.utcnow().isoformat(timespec="seconds"),
        ),
    )
    db.commit()

    result["id"] = cur.lastrowid
    return jsonify(result)


def row_to_dict(row):
    return {
        "id": row["id"],
        "file_name": row["file_name"],
        "score": row["score"],
        "match_percent": row["match_percent"],
        "skills_found": json.loads(row["skills_found"]),
        "skills_missing": json.loads(row["skills_missing"]),
        "suggestions": json.loads(row["suggestions"]),
        "word_count": row["word_count"],
        "created_at": row["created_at"],
    }


@app.get("/api/history")
def history():
    rows = get_db().execute(
        "SELECT * FROM analyses ORDER BY id DESC LIMIT 20"
    ).fetchall()
    return jsonify([row_to_dict(r) for r in rows])


@app.get("/api/history/<int:item_id>")
def history_item(item_id: int):
    row = get_db().execute("SELECT * FROM analyses WHERE id = ?", (item_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(row_to_dict(row))


@app.delete("/api/history/<int:item_id>")
def delete_item(item_id: int):
    db = get_db()
    db.execute("DELETE FROM analyses WHERE id = ?", (item_id,))
    db.commit()
    return jsonify({"deleted": item_id})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
