import asyncio
import re

import spacy
import whisper
from rapidfuzz import fuzz

from core.config import settings

_whisper_model = None
_nlp = None

FILLER_WORDS = re.compile(
    r"\b(uh+|um+|hmm+|like|you know|basically|actually|literally|right|okay|so|well)\b",
    re.IGNORECASE,
)


def _load_whisper():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model(settings.WHISPER_MODEL_SIZE)
    return _whisper_model


def _load_spacy():
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            import sys
            subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
            _nlp = spacy.load("en_core_web_sm")
    return _nlp


def transcribe_chunk(chunk_path: str) -> dict:
    """Run Whisper ASR on a single audio chunk. Returns text, segments, confidence."""
    model = _load_whisper()
    result = model.transcribe(chunk_path, language="en", fp16=False)
    avg_conf = sum(s.get("avg_logprob", -0.3) for s in result["segments"]) / max(len(result["segments"]), 1)
    return {"text": result["text"].strip(), "segments": result["segments"], "avg_confidence": avg_conf}


def remove_duplicates(sentences: list[str], threshold: int = 85) -> list[str]:
    """Remove near-duplicate sentences using fuzzy matching."""
    unique = []
    for sent in sentences:
        is_dup = any(fuzz.ratio(sent, u) > threshold for u in unique)
        if not is_dup:
            unique.append(sent)
    return unique


def clean_transcript(raw_text: str) -> str:
    """Remove filler words, fix sentences, and remove near-duplicates."""
    text = FILLER_WORDS.sub("", raw_text)
    text = re.sub(r"\s{2,}", " ", text).strip()

    nlp = _load_spacy()
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
    unique_sentences = remove_duplicates(sentences)
    return " ".join(unique_sentences)


async def transcribe_all_chunks(chunk_paths: list[str]) -> list[dict]:
    """Transcribe all audio chunks sequentially to avoid CPU/RAM overload."""
    loop = asyncio.get_event_loop()
    cleaned = []
    
    for i, path in enumerate(chunk_paths):
        print(f"--- Transcribing chunk {i+1}/{len(chunk_paths)}: {path} ---")
        # Transcribe
        r = await loop.run_in_executor(None, transcribe_chunk, path)
        # Clean
        cleaned_text = await loop.run_in_executor(None, clean_transcript, r["text"])
        cleaned.append(
            {
                "raw_text": r["text"],
                "cleaned_text": cleaned_text,
                "segments": r["segments"],
                "avg_confidence": r["avg_confidence"],
            }
        )
    return cleaned
