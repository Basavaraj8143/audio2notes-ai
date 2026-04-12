from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from core.session_store import get_session, list_recent_sessions
from models.session import sessions

router = APIRouter()


@router.get("/history")
async def get_notes_history(limit: int = 30):
    """Retrieve recently processed sessions for history UI."""
    items = list_recent_sessions(limit=limit)
    return JSONResponse(content={"items": items})


@router.get("/{session_id}")
async def get_notes(session_id: str):
    """Retrieve the structured notes for a given session."""
    if session_id not in sessions:
        stored = get_session(session_id)
        if not stored:
            raise HTTPException(status_code=404, detail="Session not found.")
        sessions[session_id] = {
            "filename": stored["filename"],
            "status": stored["status"],
            "transcript_chunks": stored["transcript_chunks"],
            "notes_chunks": stored["notes_chunks"],
            "merged_notes": stored["merged_notes"],
        }

    data = sessions[session_id]
    return JSONResponse(
        content={
            "session_id": session_id,
            "filename": data["filename"],
            "notes": data["notes_chunks"],
            "merged_notes": data["merged_notes"],
        }
    )
