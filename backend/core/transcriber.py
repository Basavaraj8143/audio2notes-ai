import asyncio
import re

import spacy
import whisper
from rapidfuzz import fuzz

from core.config import settings

_whisper_model = None
_nlp = None
_spacy_unavailable = False

# Keep this list conservative: removing semantic words like "like" hurts transcript quality.
DISFLUENCY_WORDS = re.compile(r"\b(uh+|um+|hmm+|erm+|ah+|mm+)\b", re.IGNORECASE)
DISFLUENCY_PHRASES = re.compile(r"\b(you know|i mean)\b", re.IGNORECASE)


def _load_whisper():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model(settings.WHISPER_MODEL_SIZE)
    return _whisper_model


def _load_spacy():
    global _nlp, _spacy_unavailable
    if _nlp is None and not _spacy_unavailable:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Model not available - use regex fallback
            _spacy_unavailable = True
    return _nlp


def check_spacy_model():
    """Check if spaCy model is available at startup."""
    try:
        spacy.load("en_core_web_sm")
        return True
    except OSError:
        return False


def transcribe_chunk(chunk_path: str) -> dict:
    """Run Whisper ASR on a single audio chunk. Returns text, segments, confidence."""
    model = _load_whisper()
    result = model.transcribe(chunk_path, language="en", fp16=False)
    avg_conf = sum(s.get("avg_logprob", -0.3) for s in result["segments"]) / max(len(result["segments"]), 1)
    return {"text": result["text"].strip(), "segments": result["segments"], "avg_confidence": avg_conf}


def _normalize_for_match(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _cleanup_disfluencies(text: str) -> str:
    text = DISFLUENCY_PHRASES.sub(" ", text)
    text = DISFLUENCY_WORDS.sub(" ", text)
    # Remove immediate word stutter: "the the" -> "the"
    text = re.sub(r"\b(\w+)(\s+\1\b)+", r"\1", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+([,;:.!?])", r"\1", text)
    text = re.sub(r"([,;:.!?])\1+", r"\1", text)
    return re.sub(r"\s{2,}", " ", text).strip()


def _dedupe_clauses(sentence: str, threshold: int = 95) -> str:
    """
    Remove repeated comma/semicolon clauses inside one sentence.
    Useful for ASR loops like repeated lyric or repeated phrase chunks.
    """
    chunks = [c.strip() for c in re.split(r"[;,]+", sentence) if c.strip()]
    if len(chunks) < 2:
        return sentence.strip()

    kept_clauses: list[str] = []
    kept_norms: list[str] = []
    for clause in chunks:
        norm = _normalize_for_match(clause)
        if not norm:
            continue

        # Compare with recent clauses only, preserving some recurring structure.
        recent = kept_norms[-4:]
        is_dup = any(fuzz.ratio(norm, prev) >= threshold for prev in recent)
        if is_dup:
            continue

        kept_clauses.append(clause)
        kept_norms.append(norm)

    if not kept_clauses:
        return sentence.strip()

    ending = sentence.strip()[-1] if sentence.strip() and sentence.strip()[-1] in ".!?" else ""
    cleaned = ", ".join(kept_clauses)
    if ending and not cleaned.endswith(ending):
        cleaned += ending
    return cleaned


def remove_duplicates(sentences: list[str], threshold: int = 90) -> list[str]:
    """Remove near-duplicate sentences while preserving overall flow."""
    unique = []
    unique_norms: list[str] = []
    for sent in sentences:
        norm = _normalize_for_match(sent)
        if not norm:
            continue

        recent = unique_norms[-8:]
        # For short lines, require exact match; for longer lines, fuzzy match is useful.
        if len(norm.split()) < 4:
            is_dup = norm in recent
        else:
            is_dup = any(fuzz.ratio(norm, u) >= threshold for u in recent)

        if not is_dup:
            unique.append(sent)
            unique_norms.append(norm)
    return unique


def clean_transcript(raw_text: str) -> str:
    """Conservative transcript cleaning: remove disfluencies and obvious repetition."""
    text = _cleanup_disfluencies(raw_text)

    nlp = _load_spacy()
    sentences: list[str] = []
    if nlp is not None:
        doc = nlp(text)
        for sent in doc.sents:
            s = _dedupe_clauses(sent.text.strip())
            s = re.sub(r"\s{2,}", " ", s).strip()
            if len(_normalize_for_match(s)) >= 10:
                sentences.append(s)
    else:
        # Lightweight fallback when spaCy model is unavailable.
        rough_sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        for sent in rough_sentences:
            s = _dedupe_clauses(sent.strip())
            s = re.sub(r"\s{2,}", " ", s).strip()
            if len(_normalize_for_match(s)) >= 10:
                sentences.append(s)

    unique_sentences = remove_duplicates(sentences)
    cleaned = " ".join(unique_sentences).strip()
    return cleaned or raw_text.strip()


async def transcribe_all_chunks(chunk_paths: list[dict | str]) -> list[dict]:
    """Transcribe all audio chunks sequentially to avoid CPU/RAM overload."""
    loop = asyncio.get_event_loop()
    cleaned = []
    
    for i, chunk in enumerate(chunk_paths):
        path = chunk["path"] if isinstance(chunk, dict) else chunk
        chunk_start_sec = float(chunk.get("start_sec", 0)) if isinstance(chunk, dict) else 0.0
        chunk_end_sec = float(chunk.get("end_sec", 0)) if isinstance(chunk, dict) else 0.0
        print(f"--- Transcribing chunk {i+1}/{len(chunk_paths)}: {path} ---")
        # Transcribe
        r = await loop.run_in_executor(None, transcribe_chunk, path)
        shifted_segments = []
        for seg in r["segments"]:
            item = dict(seg)
            if isinstance(item.get("start"), (int, float)):
                item["start"] = round(float(item["start"]) + chunk_start_sec, 3)
            if isinstance(item.get("end"), (int, float)):
                item["end"] = round(float(item["end"]) + chunk_start_sec, 3)
            shifted_segments.append(item)

        if chunk_end_sec <= chunk_start_sec and shifted_segments:
            end_candidate = shifted_segments[-1].get("end")
            if isinstance(end_candidate, (int, float)):
                chunk_end_sec = float(end_candidate)
        # Clean
        cleaned_text = await loop.run_in_executor(None, clean_transcript, r["text"])
        cleaned.append(
            {
                "raw_text": r["text"],
                "cleaned_text": cleaned_text,
                "segments": shifted_segments,
                "avg_confidence": r["avg_confidence"],
                "chunk_start_sec": round(chunk_start_sec, 3),
                "chunk_end_sec": round(chunk_end_sec, 3) if chunk_end_sec > 0 else None,
            }
        )
    return cleaned
