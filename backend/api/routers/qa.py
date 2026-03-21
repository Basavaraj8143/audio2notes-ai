import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from core.rag import search_index
from core.llm import _get_gemini_client, _get_ollama_client
from core.config import settings
from models.session import sessions

router = APIRouter()


class QARequest(BaseModel):
    session_id: str
    question: str


@router.post("/ask")
async def ask_question(req: QARequest):
    """RAG-based Q&A: retrieve relevant transcript chunks and answer grounded in lecture content."""
    if req.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found.")

    try:
        relevant_chunks = search_index(req.session_id, req.question, top_k=3)
        context = "\n\n---\n\n".join(relevant_chunks)

        prompt = f"""You are a helpful assistant. Answer the student's question using ONLY the provided lecture context below.
If the answer is not in the context, say "This was not covered in the lecture."

Lecture Context:
{context}

Student Question: {req.question}

Answer:"""

        # Try Ollama first
        try:
            client = _get_ollama_client()
            response = client.chat(
                model=settings.OLLAMA_MODEL,
                messages=[{'role': 'user', 'content': prompt}],
            )
            answer = response['message']['content']
        except Exception as e:
            print(f"⚠️ QA: Ollama failed, falling back to Gemini: {e}")
            gemini = _get_gemini_client()
            if not gemini:
                raise e
            
            loop = asyncio.get_event_loop()
            res = await loop.run_in_executor(
                None,
                lambda: gemini.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt),
            )
            answer = res.text

        return JSONResponse(
            content={
                "question": req.question,
                "answer": answer,
                "source_chunks": relevant_chunks,
            }
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Session RAG index not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
