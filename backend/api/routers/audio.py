"""API router for audio upload and full transcription pipeline."""
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from core.audio_processor import preprocess_audio
from core.transcriber import transcribe_all_chunks
from core.llm import generate_all_notes, extract_graph_triples
from core.rag import create_index
from core.graph_builder import build_graph
from models.session import sessions

router = APIRouter()


@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """
    Full pipeline: Upload audio → preprocess → transcribe → clean → 
    generate notes → build graph → create RAG index.
    Returns session_id for subsequent calls.
    """
    allowed = {".mp3", ".wav", ".m4a", ".ogg", ".flac"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    try:
        file_bytes = await file.read()

        # Layer 1 & 2: Audio preprocessing and chunking
        chunk_paths = await preprocess_audio(file_bytes, file.filename)
        if not chunk_paths:
            raise HTTPException(status_code=422, detail="No audio chunks detected.")

        # Layer 2 & 3: ASR transcription + cleaning
        transcript_chunks = await transcribe_all_chunks(chunk_paths)

        # Layer 4: LLM notes generation
        notes_chunks = await generate_all_notes(transcript_chunks)

        # Build merged notes text for graph extraction and export
        merged_notes = _merge_notes(notes_chunks)

        # Layer 5: Knowledge graph triples
        triples = await extract_graph_triples(merged_notes)
        graph_data = build_graph(triples)

        # Layer 6: FAISS index creation
        session_id = create_index(transcript_chunks)

        # Store session data
        sessions[session_id] = {
            "transcript_chunks": transcript_chunks,
            "notes_chunks": notes_chunks,
            "merged_notes": merged_notes,
            "graph": graph_data,
            "triples": triples,
            "filename": file.filename,
        }

        # Clean up temp audio files
        for path in chunk_paths:
            if os.path.exists(path):
                os.unlink(path)

        return JSONResponse(
            status_code=200,
            content={
                "session_id": session_id,
                "filename": file.filename,
                "chunk_count": len(transcript_chunks),
                "notes": notes_chunks,
                "graph": graph_data,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        parts.append(f"Summary: {chunk.get('summary', '')}")
        parts.append("")
    return "\n".join(parts)
