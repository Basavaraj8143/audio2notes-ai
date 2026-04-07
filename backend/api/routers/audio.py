"""API router for audio upload and step-by-step transcription pipeline."""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse

from core.audio_processor import preprocess_audio
from core.transcriber import transcribe_all_chunks
from core.llm import generate_all_notes
from core.rag import create_index
from models.session import sessions

router = APIRouter()


@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Step 1: Upload audio -> preprocess -> transcribe -> clean.
    Returns session_id and transcript for user approval.
    """
    allowed = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    chunk_paths: list[dict | str] = []
    try:
        file_bytes = await file.read()

        # Generate session ID
        session_id = str(uuid.uuid4())

        # Layer 1 & 2: Audio preprocessing and chunking
        chunk_paths = await preprocess_audio(file_bytes, file.filename)
        if not chunk_paths:
            raise HTTPException(status_code=422, detail="No audio chunks detected.")

        # Layer 2 & 3: ASR transcription + cleaning
        transcript_chunks = await transcribe_all_chunks(chunk_paths)

        # Store initial session data (transcription only)
        sessions[session_id] = {
            "filename": file.filename,
            "transcript_chunks": transcript_chunks,
            "status": "transcribed",  # waiting for user approval
            "notes_chunks": None,
            "merged_notes": None,
        }

        return JSONResponse(
            status_code=200,
            content={
                "session_id": session_id,
                "filename": file.filename,
                "chunk_count": len(transcript_chunks),
                "transcript_chunks": transcript_chunks,
                "status": "transcribed"
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[upload_audio] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Audio upload processing failed.")
    finally:
        # Always clean up chunk files if they were created.
        for chunk in chunk_paths:
            path = chunk["path"] if isinstance(chunk, dict) else chunk
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    pass


@router.post("/process")
async def process_transcription(request_data: dict = Body(...)):
    """
    Step 2: User approved transcript -> generate notes -> create RAG index.
    Takes session_id from step 1 and completes the pipeline.
    """
    session_id = request_data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = sessions[session_id]
    if session_data["status"] != "transcribed":
        raise HTTPException(status_code=400, detail="Session already processed or invalid status")

    try:
        transcript_chunks = session_data["transcript_chunks"]

        # Layer 4: LLM notes generation
        notes_chunks = await generate_all_notes(transcript_chunks)

        # Build merged notes text for export and QA context
        merged_notes = _merge_notes(notes_chunks)

        # Layer 5: FAISS index creation
        create_index(session_id, transcript_chunks)

        # Update session data with processed results
        sessions[session_id].update({
            "notes_chunks": notes_chunks,
            "merged_notes": merged_notes,
            "status": "completed"
        })

        return JSONResponse(
            status_code=200,
            content={
                "session_id": session_id,
                "filename": session_data["filename"],
                "chunk_count": len(transcript_chunks),
                "notes": notes_chunks,
                "status": "completed"
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[process_transcription] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Transcription post-processing failed.")


def _merge_notes(notes_chunks: list[dict]) -> str:
    """Merge structured notes chunks into a single text string for downstream processing."""
    parts = []
    for i, chunk in enumerate(notes_chunks):
        parts.append(f"--- Section {i + 1}: {chunk.get('topic', 'Unknown')} ---")
        parts.append("Key Points:")
        for kp in chunk.get("key_points", []):
            parts.append(f"  - {kp}")
        if chunk.get("definitions"):
            parts.append("Definitions:")
            for term, defn in chunk["definitions"].items():
                parts.append(f"  - {term}: {defn}")
        if chunk.get("important_explanations"):
            parts.append("Important Explanations:")
            for explanation in chunk["important_explanations"]:
                parts.append(f"  - {explanation}")
        if chunk.get("examples"):
            parts.append("Examples:")
            for example in chunk["examples"]:
                parts.append(f"  - {example}")
        parts.append(f"Summary: {chunk.get('summary', '')}")
        parts.append(f"Confidence: {chunk.get('confidence', 'MEDIUM')}")
        parts.append("")
    return "\n".join(parts)
