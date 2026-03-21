import asyncio
import re
import ollama
from google import genai

from core.config import settings

_gemini_client = None
_ollama_client = None

NOTES_JSON_PROMPT = """Extract notes from the transcript. 
Return ONLY a JSON object in this format:
{{"topic": "...", "key_points": ["...", "..."], "definitions": {{"word": "definition"}}, "summary": "...", "confidence": "HIGH"}}

Example:
Input: "Hi, today we will talk about Photosynthesis. It's the process where plants convert sunlight into energy."
Output: {{"topic": "Photosynthesis", "key_points": ["Plants convert sunlight to energy"], "definitions": {{"Photosynthesis": "Energy conversion process in plants"}}, "summary": "Introduction to how plants use sunlight.", "confidence": "HIGH"}}

Transcript:
{chunk_text}
"""

GRAPH_JSON_PROMPT = """Extract concept relationships as JSON triples.
Return a JSON object with a key 'triples' which is a list of objects:
{{"source": "Concept A", "relation": "is a", "target": "Concept B"}}

Notes:
{notes_text}
"""


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None and settings.GEMINI_API_KEY:
        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _gemini_client


def _get_ollama_client():
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = ollama.Client(host=settings.OLLAMA_BASE_URL)
    return _ollama_client


async def generate_notes_for_chunk(chunk_text: str) -> dict:
    """Send a transcript chunk to the configured LLM and parse structured notes response."""
    print(f"--- [LLM] Attempting local inference with {settings.OLLAMA_MODEL} ---")
    
    # Try Ollama first as requested
    try:
        client = _get_ollama_client()
        system_msg = "You are a data extraction bot. You ONLY output JSON. No thinking, no chatting."
        
        # Short timeout to fail fast if Ollama is not running
        response = client.chat(
            model=settings.OLLAMA_MODEL,
            format='json',
            messages=[
                {'role': 'system', 'content': system_msg},
                {'role': 'user', 'content': NOTES_JSON_PROMPT.format(chunk_text=chunk_text)}
            ],
        )
        import json
        raw = response['message']['content']
        raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
        data = json.loads(raw)
        data['raw'] = raw
        print("✅ Local inference successful.")
        return data
        
    except Exception as ollama_err:
        print(f"⚠️ Ollama failed: {ollama_err}")
        print(f"--- [LLM] Falling back to Gemini ({settings.GEMINI_MODEL}) ---")
        
        gemini = _get_gemini_client()
        if not gemini:
            return {"topic": "Ollama Error", "key_points": [], "definitions": {}, "summary": f"Ollama failed and no Gemini key: {ollama_err}", "confidence": "LOW", "raw": ""}
        
        try:
            prompt = f"Follow this format exactly: TOPIC: ... KEY POINTS: ... DEFINITIONS: ... SUMMARY: ... CONFIDENCE: ...\n\nTranscript:\n{chunk_text}"
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: gemini.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt),
            )
            return _parse_notes_response(response.text)
        except Exception as gemini_err:
            error_msg = str(gemini_err)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                return {
                    "topic": "Quota Limit Reached",
                    "key_points": ["Ollama failed to respond (local LLM not running?)", "Gemini API quota exhausted (429 Error)"],
                    "definitions": {},
                    "summary": "Both local LLM and Cloud LLM failed. Please ensure Ollama is running locally for free unlimited processing.",
                    "confidence": "LOW",
                    "raw": error_msg
                }
            return {"topic": "LLM Error", "key_points": [], "definitions": {}, "summary": f"Multiple LLM failures: {gemini_err}", "confidence": "LOW", "raw": error_msg}


def _parse_notes_response(raw: str) -> dict:
    """Fallback manual parser for Gemini/text responses."""
    result = {"topic": "", "key_points": [], "definitions": {}, "summary": "", "confidence": "MEDIUM", "raw": raw}
    m = re.search(r"TOPIC:\s*(.+)", raw)
    if m: result["topic"] = m.group(1).strip()
    kp_match = re.search(r"KEY POINTS:\s*((?:[-•]\s*.+\n?)+)", raw)
    if kp_match:
        result["key_points"] = [re.sub(r"^[-•]\s*", "", l).strip() for l in kp_match.group(1).strip().split("\n") if l.strip()]
    def_match = re.search(r"DEFINITIONS:\s*((?:[-•]\s*.+:.+\n?)+)", raw)
    if def_match:
        for line in def_match.group(1).strip().split("\n"):
            if ":" in line:
                term, defn = line.split(":", 1)
                result["definitions"][re.sub(r"^[-•]\s*", "", term).strip()] = defn.strip()
    m = re.search(r"SUMMARY:\s*(.+?)(?=\nCONFIDENCE|$)", raw, re.DOTALL)
    if m: result["summary"] = m.group(1).strip()
    m = re.search(r"CONFIDENCE:\s*(HIGH|MEDIUM|LOW)", raw, re.IGNORECASE)
    if m: result["confidence"] = m.group(1).upper()
    return result


async def generate_all_notes(transcript_chunks: list[dict]) -> list[dict]:
    """Generate notes for all transcript chunks sequentially."""
    results = []
    for chunk in transcript_chunks:
        res = await generate_notes_for_chunk(chunk["cleaned_text"])
        results.append(res)
    return results


async def extract_graph_triples(merged_notes: str) -> list[dict]:
    """Ask LLM to extract concept relationship triples using JSON format."""
    try:
        client = _get_ollama_client()
        response = client.chat(
            model=settings.OLLAMA_MODEL,
            format='json',
            messages=[
                {'role': 'system', 'content': "You are a graph extraction bot. ONLY output JSON."},
                {'role': 'user', 'content': GRAPH_JSON_PROMPT.format(notes_text=merged_notes)}
            ],
        )
        import json
        raw = re.sub(r"<think>.*?</think>", "", response['message']['content'], flags=re.DOTALL).strip()
        data = json.loads(raw)
        return data.get('triples', [])
    except Exception as e:
        print(f"⚠️ Ollama graph failed, falling back to Gemini: {e}")
        gemini = _get_gemini_client()
        if not gemini: return []
        
        prompt = f"Extract triples like CONCEPT A -> RELATION -> CONCEPT B. ONE PER LINE.\n\nNotes:\n{merged_notes}"
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(None, lambda: gemini.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt))
        triples = []
        for line in res.text.strip().split("\n"):
            parts = [p.strip() for p in line.split("->")]
            if len(parts) == 3: triples.append({"source": parts[0], "relation": parts[1], "target": parts[2]})
        return triples
