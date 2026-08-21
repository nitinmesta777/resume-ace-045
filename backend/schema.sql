-- SQLite schema for AI Resume Analyzer
CREATE TABLE IF NOT EXISTS analyses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name       TEXT    NOT NULL,
    score           INTEGER NOT NULL,
    match_percent   INTEGER,
    skills_found    TEXT    NOT NULL,
    skills_missing  TEXT    NOT NULL,
    suggestions     TEXT    NOT NULL,
    word_count      INTEGER NOT NULL,
    created_at      TEXT    NOT NULL
);
