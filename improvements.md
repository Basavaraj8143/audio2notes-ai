# Audio2Notes AI - Needed Improvements

## P0 (Do First)

1. Preserve HTTP status semantics and avoid leaking raw exceptions
- Issue: Broad `except Exception` in routers converts expected errors into `500` and exposes internal messages.
- Improve: Re-raise `HTTPException`, map known failures to safe messages, return generic `500` for unknown errors.
- Files:
  - `backend/api/routers/audio.py`
  - `backend/api/routers/qa.py`

2. Guarantee temp-file cleanup on all paths
- Issue: Temporary audio files can remain on disk after failures.
- Improve: Use `try/finally` in preprocessing and upload pipeline to always delete `tmp_path`, converted wav, and chunk files.
- Files:
  - `backend/core/audio_processor.py`
  - `backend/api/routers/audio.py`

3. Add upload limits and safer input validation
- Issue: `await file.read()` loads full file into memory without size limits.
- Improve: Enforce max upload size, reject empty/corrupt files early, validate content type + extension.
- Files:
  - `backend/api/routers/audio.py`

4. Replace in-memory sessions with bounded/expiring storage
- Issue: Session data is process-local and unbounded (lost on restart, can grow indefinitely).
- Improve: Add TTL + cleanup job at minimum; ideally move to Redis/DB-backed session store.
- Files:
  - `backend/models/session.py`
  - `backend/api/routers/audio.py`
  - `backend/api/routers/qa.py`
  - `backend/api/routers/export.py`

5. Remove runtime spaCy installation from request path
- Issue: `spacy download` during requests is fragile and slow.
- Improve: Install models at setup/deploy time and fail fast with a clear startup check.
- Files:
  - `backend/core/transcriber.py`

## P1 (High Value)

6. Fix frontend interval cleanup leak in upload flow
- Issue: Progress interval can continue if `fetch` throws before `clearInterval`.
- Improve: Keep interval handle outside `try`; clear it in `finally`.
- Files:
  - `frontend/src/pages/HomePage.jsx`

7. Add cancellation/abort for long-running requests
- Issue: User cannot reliably cancel in-flight upload/process requests.
- Improve: Use `AbortController` and cleanup on unmount/back action.
- Files:
  - `frontend/src/pages/HomePage.jsx`

8. Validate export readiness before streaming
- Issue: Export endpoints assume `notes_chunks`/`merged_notes` exist.
- Improve: Return `400` with `notes not ready` if session is not completed.
- Files:
  - `backend/api/routers/export.py`

9. Strengthen QA fallback behavior
- Issue: If retrieval returns empty context, model call still proceeds.
- Improve: Short-circuit with a clear grounded response when no chunks are found.
- Files:
  - `backend/api/routers/qa.py`
  - `backend/core/rag.py`

10. Stop importing private LLM helpers in router
- Issue: Router depends on private functions (`_mistral_chat`, `_openrouter_chat`, `_get_ollama_client`).
- Improve: Expose public service-layer APIs for QA generation.
- Files:
  - `backend/api/routers/qa.py`
  - `backend/core/llm.py`

## P2 (Quality / Maintainability)

11. Add structured logging and request IDs
- Issue: Debugging production issues is hard with plain `print`.
- Improve: Use structured logger (request id/session id/model/fallback path/timing).
- Files:
  - `backend/api/routers/*.py`
  - `backend/core/*.py`

12. Add API response models
- Issue: Responses are untyped dicts; contract drift risk.
- Improve: Add Pydantic response schemas for upload/process/qa/export metadata.
- Files:
  - `backend/api/routers/audio.py`
  - `backend/api/routers/qa.py`

13. Improve note generation throughput safely
- Issue: Notes are generated strictly sequentially.
- Improve: Add bounded concurrency (e.g., semaphore) for chunk note generation with provider rate-limit awareness.
- Files:
  - `backend/core/llm.py`

14. Clean up minor code hygiene issues
- Issue: Unused imports and legacy style leftovers.
- Improve: Remove unused imports (example: `textwrap` in export router), run linting/format checks.
- Files:
  - `backend/api/routers/export.py`

15. Add test coverage for critical paths
- Needed tests:
  - Upload success/failure and cleanup behavior
  - Transcript chunk timestamp continuity
  - Process endpoint status transitions
  - QA with/without index
  - Export before/after completion
- Files:
  - `backend/test/*` (new/expanded)
  - `frontend` basic flow tests (optional but recommended)
