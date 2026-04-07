import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from core.rag import search_index
from core.llm import _get_ollama_client, _mistral_chat, _openrouter_chat
from core.config import settings
from models.session import sessions

router = APIRouter()


class QARequest(BaseModel):
    session_id: str
    question: str


@router.post('/ask')
async def ask_question(req: QARequest):
    """RAG-based Q&A: retrieve relevant transcript chunks and answer grounded in lecture content."""
    if req.session_id not in sessions:
        raise HTTPException(status_code=404, detail='Session not found.')

    try:
        relevant_chunks = search_index(req.session_id, req.question, top_k=3)
        context = '\n\n---\n\n'.join(relevant_chunks)

        prompt = f"""You are a helpful assistant. Answer the student's question using ONLY the provided lecture context below.
If the answer is not in the context, say \"This was not covered in the lecture.\"

Lecture Context:
{context}

Student Question: {req.question}

Answer:"""

        # Try Mistral first
        try:
            loop = asyncio.get_event_loop()
            answer = await loop.run_in_executor(
                None,
                lambda: _mistral_chat([
                    {'role': 'system', 'content': 'Answer using only the provided context. Be concise.'},
                    {'role': 'user', 'content': prompt},
                ], model=settings.MISTRAL_MODEL, temperature=0.1, response_format_json=False),
            )
        except Exception as mistral_err:
            print(f'[QA] Mistral failed, falling back to OpenRouter: {mistral_err}')
            try:
                loop = asyncio.get_event_loop()
                answer = await loop.run_in_executor(
                    None,
                    lambda: _openrouter_chat([
                        {'role': 'system', 'content': 'Answer using only the provided context. Be concise.'},
                        {'role': 'user', 'content': prompt},
                    ], model=settings.OPENROUTER_MODEL, temperature=0.1, response_format_json=False),
                )
            except Exception as openrouter_err:
                print(f'[QA] OpenRouter failed, falling back to Ollama: {openrouter_err}')
                client = _get_ollama_client()
                response = client.chat(
                    model=settings.OLLAMA_MODEL,
                    messages=[{'role': 'user', 'content': prompt}],
                )
                answer = response['message']['content']

        return JSONResponse(
            content={
                'question': req.question,
                'answer': answer,
                'source_chunks': relevant_chunks,
            }
        )
    except KeyError:
        raise HTTPException(status_code=404, detail='Session RAG index not found.')
    except Exception as e:
        print(f"[ask_question] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail='Q&A processing failed.')
