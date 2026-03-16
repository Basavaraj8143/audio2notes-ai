from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from models.session import sessions

router = APIRouter()


@router.get("/{session_id}")
async def get_notes(session_id: str):
    """Retrieve the structured notes for a given session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    data = sessions[session_id]
    return JSONResponse(
        content={
            "session_id": session_id,
            "filename": data["filename"],
            "notes": data["notes_chunks"],
            "merged_notes": data["merged_notes"],
        }
    )
