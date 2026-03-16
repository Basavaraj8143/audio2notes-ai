import os
import uuid

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

from core.config import settings

_model = None
_sessions: dict[str, dict] = {}  # session_id -> {"index": faiss.Index, "chunks": [str]}


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def create_index(transcript_chunks: list[dict]) -> str:
    """Create a FAISS index from transcript chunks; return session_id."""
    model = _get_model()
    texts = [c["cleaned_text"] for c in transcript_chunks]
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings.astype(np.float32))

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {"index": index, "chunks": texts}
    return session_id


def search_index(session_id: str, query: str, top_k: int = 3) -> list[str]:
    """Embed the query and retrieve top-k most relevant transcript chunks."""
    if session_id not in _sessions:
        raise KeyError(f"Session {session_id} not found.")
    model = _get_model()
    session = _sessions[session_id]
    query_vec = model.encode([query], convert_to_numpy=True, normalize_embeddings=True).astype(np.float32)
    _, I = session["index"].search(query_vec, top_k)
    return [session["chunks"][i] for i in I[0] if i < len(session["chunks"])]
