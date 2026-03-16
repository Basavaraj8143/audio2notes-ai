import asyncio
import re

from google import genai

from core.config import settings

_client = None

NOTES_PROMPT = """You are an academic notes assistant. Given the following lecture transcript chunk, generate structured notes.

Output MUST follow this exact format with NO deviations:
TOPIC: <detected topic name>
KEY POINTS:
- <point 1>
- <point 2>
- <point 3>
DEFINITIONS:
- <term>: <definition>
SUMMARY: <2-3 sentence summary>
CONFIDENCE: <HIGH/MEDIUM/LOW based on transcript clarity>

Transcript:
{chunk_text}
"""

GRAPH_PROMPT = """Analyze the following lecture notes and extract concept relationships as a list of triples.
Each triple MUST be on its own line in this exact format:
CONCEPT_A -> RELATION -> CONCEPT_B

Extract at least 5 meaningful relationships. Focus on definitions, subset relationships, dependencies, and uses.

Notes:
{notes_text}
"""


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


async def generate_notes_for_chunk(chunk_text: str) -> dict:
    """Send a transcript chunk to Gemini and parse structured notes response."""
    client = _get_client()
    prompt = NOTES_PROMPT.format(chunk_text=chunk_text)

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt),
    )
    raw = response.text
    return _parse_notes_response(raw)


def _parse_notes_response(raw: str) -> dict:
    """Parse the LLM structured response into a dictionary."""
    result = {"topic": "", "key_points": [], "definitions": {}, "summary": "", "confidence": "MEDIUM", "raw": raw}

    # Topic
    m = re.search(r"TOPIC:\s*(.+)", raw)
    if m:
        result["topic"] = m.group(1).strip()

    # Key points
    kp_match = re.search(r"KEY POINTS:\s*((?:[-•]\s*.+\n?)+)", raw)
    if kp_match:
        result["key_points"] = [
            re.sub(r"^[-•]\s*", "", line).strip()
            for line in kp_match.group(1).strip().split("\n")
            if line.strip()
        ]

    # Definitions
    def_match = re.search(r"DEFINITIONS:\s*((?:[-•]\s*.+:.+\n?)+)", raw)
    if def_match:
        for line in def_match.group(1).strip().split("\n"):
            if ":" in line:
                term, defn = line.split(":", 1)
                result["definitions"][re.sub(r"^[-•]\s*", "", term).strip()] = defn.strip()

    # Summary
    m = re.search(r"SUMMARY:\s*(.+?)(?=\nCONFIDENCE|$)", raw, re.DOTALL)
    if m:
        result["summary"] = m.group(1).strip()

    # Confidence
    m = re.search(r"CONFIDENCE:\s*(HIGH|MEDIUM|LOW)", raw, re.IGNORECASE)
    if m:
        result["confidence"] = m.group(1).upper()

    return result


async def generate_all_notes(transcript_chunks: list[dict]) -> list[dict]:
    """Generate notes for all transcript chunks in parallel."""
    tasks = [generate_notes_for_chunk(c["cleaned_text"]) for c in transcript_chunks]
    return await asyncio.gather(*tasks)


async def extract_graph_triples(merged_notes: str) -> list[dict]:
    """Ask Gemini to extract concept relationship triples from the merged notes."""
    client = _get_client()
    prompt = GRAPH_PROMPT.format(notes_text=merged_notes)

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt),
    )
    triples = []
    for line in response.text.strip().split("\n"):
        parts = [p.strip() for p in line.split("->")]
        if len(parts) == 3:
            triples.append({"source": parts[0], "relation": parts[1], "target": parts[2]})
    return triples
