# Audio2Notes AI

Audio2Notes AI converts lecture audio into structured study notes and supports grounded Q&A over the transcript.

## Overview

This project is a three-part application:

- **Backend**: FastAPI service for audio preprocessing, transcription, note generation, retrieval, session persistence, and exports
- **Web Frontend**: React + Vite interface for upload, transcript review, notes viewing, history, and Q&A
- **Mobile App**: Expo + React Native client for upload, transcript review, note generation, history, Q&A, and export

The current workflow is review-first: users upload audio, inspect the transcript, and only then approve note generation.

## Current Features

- Upload lecture audio in `.mp3`, `.wav`, `.m4a`, `.ogg`, and `.flac`
- Convert audio to mono 16 kHz WAV before transcription
- Silence-aware chunking with timeline-preserving metadata
- Whisper transcription for each chunk
- Transcript cleanup with disfluency removal and duplicate reduction
- Transcript approval step before note generation
- Structured notes generation with provider fallback:
  - Mistral
  - OpenRouter
  - Ollama
- Grounded Q&A using FAISS retrieval over transcript chunks
- Export notes as PDF, DOCX, and TXT
- Session history for completed runs
- SQLite-backed session persistence
- Expo mobile client with on-device backend URL configuration and connection testing

## Architecture

1. User uploads an audio file from the frontend.
2. Backend validates and temporarily stores the file.
3. Audio is normalized to mono 16 kHz WAV.
4. Audio is split into chunks using silence detection.
5. Whisper transcribes each chunk.
6. The transcript is cleaned and returned for review.
7. User approves the transcript.
8. An LLM generates structured notes for each chunk.
9. A FAISS index is built from cleaned transcript chunks.
10. Notes, exports, and grounded Q&A become available.

## Tech Stack

- **Backend**: FastAPI, Uvicorn, pydantic-settings
- **Audio**: librosa, pydub, soundfile
- **ASR**: Whisper
- **Transcript cleanup**: spaCy, rapidfuzz
- **LLM providers**: Mistral, OpenRouter, Ollama
- **Retrieval**: sentence-transformers, FAISS
- **Export**: reportlab, python-docx
- **Web Frontend**: React, React Router, Vite
- **Mobile**: Expo, React Native, TypeScript

## Project Structure

```text
.
|-- backend/
|   |-- api/routers/
|   |   |-- audio.py
|   |   |-- export.py
|   |   |-- notes.py
|   |   `-- qa.py
|   |-- core/
|   |   |-- audio_processor.py
|   |   |-- config.py
|   |   |-- llm.py
|   |   |-- rag.py
|   |   |-- session_store.py
|   |   `-- transcriber.py
|   |-- models/
|   |   `-- session.py
|   |-- main.py
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- config/
|   |   `-- pages/
|   |-- package.json
|   |-- vercel.json
|   `-- vite.config.js
|-- mobile/
|   |-- app/
|   |   `-- App.tsx
|   |-- src/
|   |   |-- components/
|   |   |-- screens/
|   |   |-- services/
|   |   `-- types/
|   |-- App.tsx
|   |-- app.json
|   |-- index.ts
|   `-- package.json
|-- .env.example
|-- DEPLOYMENT.md
|-- PROJECT_REPORT_REFERENCE.md
|-- implementation_plan.md
|-- improvements.md
`-- render.yaml
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+
- FFmpeg available on the machine

## Quick Start

### 1. Create a virtual environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install backend dependencies

```powershell
pip install -r backend\requirements.txt
pip install openai-whisper
python -m spacy download en_core_web_sm
```

### 3. Configure environment files

Backend:

```powershell
Copy-Item .env.example .env
```

Frontend:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

At minimum, set one remote LLM provider key in `.env`:

- `MISTRAL_API_KEY`
- or `OPENROUTER_API_KEY`

If both are missing, the app can still use Ollama if a local Ollama server is running and configured.

### 4. Start the backend

```powershell
cd backend
..\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend URLs:

- API root: `http://127.0.0.1:8000/`
- Health: `http://127.0.0.1:8000/health`
- Docs: `http://127.0.0.1:8000/docs`

### 5. Start the frontend

From the repository root in a second terminal:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend URL:

- `http://127.0.0.1:5173`

### 6. Start the mobile app

From the repository root in a third terminal:

```powershell
npm --prefix mobile install
npm --prefix mobile run start
```

This starts the Expo dev server for the React Native app in `mobile/`.

Mobile notes:

- **Android emulator** uses `http://10.0.2.2:8000`
- **iOS simulator** uses `http://localhost:8000`
- **Physical device** should use your computer's LAN IP, for example `http://192.168.1.10:8000`
- The mobile app includes a **Settings** screen where you can save the backend URL and run a connection test against `/health`
- For real devices, start the backend with `--host 0.0.0.0`

Typical mobile run flow:

1. Start the backend.
2. Run `npm --prefix mobile run start`.
3. Open Expo Go or a simulator.
4. In the mobile app, confirm the backend URL in **Settings**.
5. Tap **Test Connection** before uploading audio on a physical device.

## Deploying to Vercel + Render

This repo is prepared for:

- **Frontend** on Vercel
- **Backend** on Render

### Vercel

- Set the Vercel project root to `frontend`
- Keep the framework preset as Vite
- Set:
  - `VITE_API_BASE_URL=https://your-render-service.onrender.com`
  - `VITE_API_DOCS_URL=https://your-render-service.onrender.com/docs`

### Render

- Deploy the `backend` folder as a Python web service
- Use:
  - build command:
    `pip install -r requirements.txt && pip install openai-whisper && python -m spacy download en_core_web_sm`
  - start command:
    `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set:
  - `CORS_ORIGINS=https://your-frontend.vercel.app`
  - `OPENROUTER_HTTP_REFERER=https://your-frontend.vercel.app`
  - your API keys
- On Render free, prefer `WHISPER_MODEL_SIZE=tiny` to reduce memory pressure

The repository also includes [render.yaml](D:/projects/audio2notes-ai/render.yaml:1) for Render Blueprint setup and [frontend/vercel.json](D:/projects/audio2notes-ai/frontend/vercel.json:1) for SPA rewrites.

Important note:

- Render free web services use an ephemeral filesystem, so local SQLite and on-disk artifacts are not durable there
- for persistent local storage on Render, use a paid web service with a persistent disk

## Environment Variables

Environment is loaded by `backend/core/config.py` and the frontend Vite config.

### Backend `.env`

#### LLM providers

- `MISTRAL_API_KEY`
- `MISTRAL_MODEL`
- `MISTRAL_BASE_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_HTTP_REFERER`
- `OPENROUTER_APP_TITLE`
- `OPENROUTER_FREE_ONLY`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

#### CORS

- `CORS_ORIGINS`
- `CORS_ORIGIN_REGEX`

#### Audio and chunking

- `WHISPER_MODEL_SIZE`
- `AUDIO_SAMPLE_RATE`
- `AUDIO_TEMP_DIR`
- `MIN_SILENCE_LEN_MS`
- `SILENCE_THRESH_DB`
- `KEEP_SILENCE_MS`
- `MIN_CHUNK_LEN_MS`
- `MAX_CHUNK_LEN_MS`
- `MAX_WORDS_PER_CHUNK`

#### Retrieval and storage

- `EMBEDDING_MODEL`
- `FAISS_INDEX_DIR`
- `SESSION_DB_PATH`

### Frontend `frontend/.env`

- `VITE_API_BASE_URL`
- `VITE_API_DOCS_URL`

### Mobile app

The Expo mobile app currently reads its backend URL at runtime from the in-app Settings screen rather than from a committed `.env` file. It can also suggest the Expo host machine address automatically during local development.

## API Endpoints

### Audio

- `POST /api/v1/audio/upload`
  - Uploads audio, preprocesses it, transcribes it, and returns transcript data for review
- `POST /api/v1/audio/process`
  - Generates notes and builds the retrieval index for an approved transcript

### Notes

- `GET /api/v1/notes/history`
  - Returns recently completed sessions
- `GET /api/v1/notes/{session_id}`
  - Returns structured notes for a session

### Q&A

- `POST /api/v1/qa/ask`
  - Answers questions grounded in retrieved transcript context

### Export

- `GET /api/v1/export/{session_id}/pdf`
- `GET /api/v1/export/{session_id}/docx`
- `GET /api/v1/export/{session_id}/txt`

## Usage Flow

1. Open the frontend and upload a lecture file.
2. Wait for transcription to finish.
3. Review the transcript in full or by segment.
4. Approve the transcript.
5. View generated notes.
6. Ask grounded questions in the Q&A tab.
7. Export results if needed.
8. Reopen completed sessions from History later.

## Notes on Implementation Scope

The repository includes planning documents that mention concept graphs and broader future scope. Those items are not part of the current shipped implementation.

Implemented today:

- transcript processing
- structured notes
- retrieval-based Q&A
- export
- session history

Still future scope:

- concept graph generation
- graph visualization
- background job orchestration
- fuller automated test coverage

## Troubleshooting

### `npm ERR! enoent ... package.json` at repo root

The frontend `package.json` lives under `frontend/`.

Use:

```powershell
npm --prefix frontend run dev
```

or:

```powershell
cd frontend
npm run dev
```

### Whisper or spaCy fails on first run

Install the missing pieces explicitly:

```powershell
pip install openai-whisper
python -m spacy download en_core_web_sm
```

### Vite cannot reach the backend

Make sure:

- backend is running on `127.0.0.1:8000`
- frontend `.env` points `VITE_API_BASE_URL` to the correct backend URL if you are not relying on the dev proxy

### Mobile app gets stuck on the upload pipeline

Check the following:

- backend is running and reachable at `/health`
- for a physical phone, the mobile Settings screen points to `http://YOUR_LAN_IP:8000`, not `10.0.2.2`
- backend was started with `--host 0.0.0.0`
- phone and development machine are on the same Wi-Fi network
- firewall is not blocking port `8000`

Remember that mobile upload is not instant: the backend finishes chunking and transcription before `/api/v1/audio/upload` returns, so longer audio files can remain on the pipeline screen for a while even when the connection is correct.

### CORS errors after Vercel + Render deployment

Check that:

- Render `CORS_ORIGINS` includes your Vercel production URL
- the backend was redeployed after changing env vars

### Long processing times for large files

This is expected for long lectures because:

- audio is chunked and transcribed sequentially
- note generation is also sequential
- embeddings and retrieval index creation happen after approval

## Current Limitations

- Long-running tasks are synchronous from the user perspective
- Note generation is sequential and can be slow for large lectures
- FAISS indexes live in memory and may need to be rebuilt after restart
- No concept graph feature is currently implemented
- Render free deployments do not provide durable local filesystem storage
- Automated tests are still limited

## Additional Docs

- [DEPLOYMENT.md](D:/projects/audio2notes-ai/DEPLOYMENT.md:1): Vercel + Render deployment walkthrough
- [PROJECT_REPORT_REFERENCE.md](D:/projects/audio2notes-ai/PROJECT_REPORT_REFERENCE.md:1): detailed report-ready explanation of the project
- [implementation_plan.md](D:/projects/audio2notes-ai/implementation_plan.md:1): original implementation plan
- [improvements.md](D:/projects/audio2notes-ai/improvements.md:1): future fixes and enhancement ideas
