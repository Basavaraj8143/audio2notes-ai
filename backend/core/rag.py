import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from core.config import settings

_model = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def create_index(session_id: str, transcript_chunks: list[dict]) -> None:
    """Create a FAISS index from transcript chunks and store in session."""
    model = _get_model()
    texts = [c["cleaned_text"] for c in transcript_chunks]
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings.astype(np.float32))

    # Import here to avoid circular imports
    from models.session import sessions
    sessions[session_id]["rag_index"] = {"index": index, "chunks": texts}


def search_index(session_id: str, query: str, top_k: int = 3) -> list[str]:
    """Embed the query and retrieve top-k most relevant transcript chunks."""
    from models.session import sessions
    
    if session_id not in sessions or "rag_index" not in sessions[session_id]:
        raise KeyError(f"Session {session_id} not found or no RAG index available.")
    
    model = _get_model()
    rag_data = sessions[session_id]["rag_index"]
    query_vec = model.encode([query], convert_to_numpy=True, normalize_embeddings=True).astype(np.float32)
    _, I = rag_data["index"].search(query_vec, top_k)
    return [rag_data["chunks"][i] for i in I[0] if i < len(rag_data["chunks"])]
