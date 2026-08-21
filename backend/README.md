# AI Resume Analyzer — Python Backend (Flask + SQLite)

Optional Python backend for the mini project. The web app also works fully in
the browser, but this backend lets you demonstrate a real server-side
architecture with a database.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Server runs at `http://127.0.0.1:5000`. The SQLite file `resume_analyzer.db`
is created automatically on first run (schema also in `schema.sql`).

## API

| Method | Endpoint             | Description                                   |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/api/health`        | Service status                                |
| POST   | `/api/analyze`       | `resume` file + optional `job_description`    |
| GET    | `/api/history`       | Last 20 saved analyses                        |
| GET    | `/api/history/<id>`  | One saved analysis                            |
| DELETE | `/api/history/<id>`  | Delete a saved analysis                       |

Example:

```bash
curl -F "resume=@resume.pdf" -F "job_description=Python Flask SQL developer" \
  http://127.0.0.1:5000/api/analyze
```

## Modules

1. **Text extraction** — `pypdf` for PDF, `docx2txt` for DOCX, plain read for TXT.
2. **Analysis engine** — skill detection, section detection, action-verb/impact
   check, job-description keyword matching.
3. **Scoring** — 100 points: contact 15, sections 25, skills 20, length 15,
   impact 15, job match 10.
4. **Storage** — every analysis is saved in the SQLite `analyses` table.

## Connecting the frontend

Set the API base URL in a `.env` file at the project root:

```
VITE_API_URL=http://127.0.0.1:5000
```

The frontend helper `src/lib/backend.ts` will then send resumes to Flask
instead of analyzing in the browser, and can also load the history list.
