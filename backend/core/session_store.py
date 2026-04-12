import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from core.config import settings


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _db_path() -> Path:
    return Path(settings.SESSION_DB_PATH)


def init_session_store() -> None:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                status TEXT NOT NULL,
                transcript_chunks TEXT,
                notes_chunks TEXT,
                merged_notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def save_session(session_id: str, data: dict[str, Any]) -> None:
    now = _now_iso()
    filename = str(data.get("filename", ""))
    status = str(data.get("status", "transcribed"))
    transcript_chunks = json.dumps(data.get("transcript_chunks", []), ensure_ascii=False)
    notes_chunks = json.dumps(data.get("notes_chunks"), ensure_ascii=False)
    merged_notes = data.get("merged_notes")

    with sqlite3.connect(_db_path()) as conn:
        cursor = conn.execute("SELECT created_at FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        created_at = row[0] if row else now

        conn.execute(
            """
            INSERT OR REPLACE INTO sessions (
                session_id, filename, status, transcript_chunks, notes_chunks, merged_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                filename,
                status,
                transcript_chunks,
                notes_chunks,
                merged_notes,
                created_at,
                now,
            ),
        )
        conn.commit()


def get_session(session_id: str) -> dict[str, Any] | None:
    with sqlite3.connect(_db_path()) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT session_id, filename, status, transcript_chunks, notes_chunks, merged_notes, created_at, updated_at
            FROM sessions
            WHERE session_id = ?
            """,
            (session_id,),
        ).fetchone()

    if not row:
        return None

    transcript_chunks = json.loads(row["transcript_chunks"]) if row["transcript_chunks"] else []
    notes_chunks = json.loads(row["notes_chunks"]) if row["notes_chunks"] else None
    return {
        "session_id": row["session_id"],
        "filename": row["filename"],
        "status": row["status"],
        "transcript_chunks": transcript_chunks,
        "notes_chunks": notes_chunks,
        "merged_notes": row["merged_notes"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_recent_sessions(limit: int = 30) -> list[dict[str, Any]]:
    safe_limit = max(1, min(limit, 100))
    with sqlite3.connect(_db_path()) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT session_id, filename, status, transcript_chunks, notes_chunks, created_at, updated_at
            FROM sessions
            WHERE status = 'completed'
            ORDER BY updated_at DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()

    out: list[dict[str, Any]] = []
    for row in rows:
        notes_chunks = json.loads(row["notes_chunks"]) if row["notes_chunks"] else None
        transcript_chunks = json.loads(row["transcript_chunks"]) if row["transcript_chunks"] else []
        chunk_count = len(notes_chunks) if isinstance(notes_chunks, list) and notes_chunks else len(transcript_chunks)
        out.append(
            {
                "session_id": row["session_id"],
                "filename": row["filename"],
                "status": row["status"],
                "chunk_count": chunk_count,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
        )
    return out
