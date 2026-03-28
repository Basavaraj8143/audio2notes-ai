import asyncio
import json
import re

import ollama
import requests

from core.config import settings

_ollama_client = None

NOTES_JSON_PROMPT = """You are a highly precise academic assistant trained to generate structured study notes from lecture transcripts.

INSTRUCTIONS:
- Extract only meaningful academic content
- Remove filler words, repetitions, and noise
- Organize information logically
- Keep explanations concise but informative
- Highlight important concepts clearly
- Do NOT invent or assume missing information

OUTPUT FORMAT (STRICT):

TOPIC:
<Detected topic>

KEY POINTS:
- ...

DEFINITIONS:
- ...

IMPORTANT EXPLANATIONS:
- ...

EXAMPLES (if present in transcript):
- ...

SUMMARY:
<Short academic summary>

CONFIDENCE:
<HIGH / MEDIUM / LOW based on clarity>

If the transcript is poor quality, still attempt output but reduce confidence.

IMPORTANT: Return ONLY JSON using this schema:
{{
  "topic": "...",
  "key_points": ["...", "..."],
  "definitions": {{"term": "definition"}},
  "important_explanations": ["...", "..."],
  "examples": ["...", "..."],
  "summary": "...",
  "confidence": "HIGH"
}}

TRANSCRIPT:
{chunk_text}
"""


def _get_ollama_client():
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = ollama.Client(host=settings.OLLAMA_BASE_URL)
    return _ollama_client


def _get_openrouter_api_key() -> str:
    return (settings.OPENROUTER_API_KEY or settings.OPEN_ROUTERAPI_KEY or '').strip()


def _get_mistral_api_key() -> str:
    # Supports both standard and local alias env names.
    return (settings.MISTRAL_API_KEY or settings.MISTRELL_MODEL_API_KEY or '').strip()


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith('```'):
        text = re.sub(r'^```[a-zA-Z0-9_-]*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)
    return text.strip()


def _extract_text_content(content) -> str:
    """Normalize provider response content to plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                if isinstance(item.get('text'), str):
                    parts.append(item['text'])
            elif isinstance(item, str):
                parts.append(item)
        return '\n'.join(parts)
    return str(content or '')


def _openrouter_chat(
    messages: list[dict],
    *,
    model: str | None = None,
    temperature: float = 0.2,
    response_format_json: bool = False,
    timeout: int = 90,
) -> str:
    api_key = _get_openrouter_api_key()
    if not api_key:
        raise RuntimeError('OPENROUTER_API_KEY is not configured.')

    selected_model = model or settings.OPENROUTER_MODEL
    if settings.OPENROUTER_FREE_ONLY and ':free' not in selected_model:
        raise RuntimeError(f"OpenRouter model '{selected_model}' is not marked free (:free).")

    url = f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    if settings.OPENROUTER_HTTP_REFERER:
        headers['HTTP-Referer'] = settings.OPENROUTER_HTTP_REFERER
    if settings.OPENROUTER_APP_TITLE:
        headers['X-Title'] = settings.OPENROUTER_APP_TITLE

    payload = {
        'model': selected_model,
        'temperature': temperature,
        'messages': messages,
    }
    if response_format_json:
        payload['response_format'] = {'type': 'json_object'}

    resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
    resp.raise_for_status()

    body = resp.json()
    content = body.get('choices', [{}])[0].get('message', {}).get('content', '')
    text = _extract_text_content(content)
    if not text:
        raise RuntimeError('OpenRouter returned empty content.')

    raw = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
    return _strip_code_fences(raw)


def _mistral_chat(
    messages: list[dict],
    *,
    model: str | None = None,
    temperature: float = 0.2,
    response_format_json: bool = False,
    timeout: int = 90,
) -> str:
    api_key = _get_mistral_api_key()
    if not api_key:
        raise RuntimeError('MISTRAL_API_KEY is not configured.')

    selected_model = model or settings.MISTRAL_MODEL
    url = f"{settings.MISTRAL_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': selected_model,
        'temperature': temperature,
        'messages': messages,
    }
    if response_format_json:
        payload['response_format'] = {'type': 'json_object'}

    resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
    resp.raise_for_status()

    body = resp.json()
    content = body.get('choices', [{}])[0].get('message', {}).get('content', '')
    text = _extract_text_content(content)
    if not text:
        raise RuntimeError('Mistral returned empty content.')

    raw = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
    return _strip_code_fences(raw)


def _normalize_notes_payload(data: dict, raw: str) -> dict:
    return {
        'topic': str(data.get('topic', '')).strip(),
        'key_points': data.get('key_points', []) if isinstance(data.get('key_points', []), list) else [],
        'definitions': data.get('definitions', {}) if isinstance(data.get('definitions', {}), dict) else {},
        'important_explanations': data.get('important_explanations', []) if isinstance(data.get('important_explanations', []), list) else [],
        'examples': data.get('examples', []) if isinstance(data.get('examples', []), list) else [],
        'summary': str(data.get('summary', '')).strip(),
        'confidence': str(data.get('confidence', 'MEDIUM')).upper(),
        'raw': raw,
    }


def _call_mistral_for_notes(chunk_text: str) -> dict:
    raw = _mistral_chat(
        [
            {'role': 'system', 'content': 'You are a data extraction bot. You ONLY output valid JSON. No extra text.'},
            {'role': 'user', 'content': NOTES_JSON_PROMPT.format(chunk_text=chunk_text)},
        ],
        response_format_json=True,
    )
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise RuntimeError('Mistral response JSON is not an object.')
    return _normalize_notes_payload(data, raw)


def _call_openrouter_for_notes(chunk_text: str) -> dict:
    raw = _openrouter_chat(
        [
            {'role': 'system', 'content': 'You are a data extraction bot. You ONLY output valid JSON. No extra text.'},
            {'role': 'user', 'content': NOTES_JSON_PROMPT.format(chunk_text=chunk_text)},
        ],
        response_format_json=True,
    )
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise RuntimeError('OpenRouter response JSON is not an object.')
    return _normalize_notes_payload(data, raw)


async def generate_notes_for_chunk(chunk_text: str) -> dict:
    """Generate structured notes for a transcript chunk.

    Priority order:
    1) Mistral API key (free tier)
    2) OpenRouter free model fallback
    3) Optional local Ollama fallback
    """
    loop = asyncio.get_event_loop()

    print(f"--- [LLM] Attempting Mistral inference with {settings.MISTRAL_MODEL} ---")
    try:
        return await loop.run_in_executor(None, _call_mistral_for_notes, chunk_text)
    except Exception as mistral_err:
        print(f"[LLM] Mistral failed: {mistral_err}")
        print(f"--- [LLM] Falling back to OpenRouter ({settings.OPENROUTER_MODEL}) ---")

    try:
        return await loop.run_in_executor(None, _call_openrouter_for_notes, chunk_text)
    except Exception as openrouter_err:
        print(f"[LLM] OpenRouter failed: {openrouter_err}")
        print(f"--- [LLM] Falling back to Ollama ({settings.OLLAMA_MODEL}) ---")

    try:
        client = _get_ollama_client()
        response = client.chat(
            model=settings.OLLAMA_MODEL,
            format='json',
            messages=[
                {'role': 'system', 'content': 'You are a data extraction bot. You ONLY output valid JSON. No extra text.'},
                {'role': 'user', 'content': NOTES_JSON_PROMPT.format(chunk_text=chunk_text)},
            ],
        )
        raw = re.sub(r'<think>.*?</think>', '', response['message']['content'], flags=re.DOTALL).strip()
        data = json.loads(raw)
        return _normalize_notes_payload(data, raw)

    except Exception as ollama_err:
        print(f"[LLM] Ollama failed: {ollama_err}")
        return {
            'topic': 'LLM Error',
            'key_points': [],
            'definitions': {},
            'important_explanations': [],
            'examples': [],
            'summary': f'Mistral, OpenRouter, and Ollama all failed. Last error: {ollama_err}',
            'confidence': 'LOW',
            'raw': '',
        }


async def generate_all_notes(transcript_chunks: list[dict]) -> list[dict]:
    """Generate notes for all transcript chunks sequentially."""
    results = []
    for chunk in transcript_chunks:
        res = await generate_notes_for_chunk(chunk['cleaned_text'])
        results.append(res)
    return results
