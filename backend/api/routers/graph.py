from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from models.session import sessions

router = APIRouter()


@router.get("/{session_id}")
async def get_graph(session_id: str):
    """Retrieve the knowledge graph data for a given session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    # Ensure the session has graph data
    session_data = sessions.get(session_id)
    if not session_data or "graph" not in session_data:
        return JSONResponse(content={"session_id": session_id, "graph": {"nodes": [], "edges": []}})
        
    return JSONResponse(content={"session_id": session_id, "graph": session_data["graph"]})
