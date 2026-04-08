# Audio2Notes AI

Audio2Notes AI transforms lecture audio into structured study notes and provides grounded Q&A over the transcript.

## Table of Contents
- Overview
- Features
- Architecture
- Tech Stack
- Project Structure
- Prerequisites
- Quick Start (Local)
- Environment Variables
- API Endpoints
- Usage Flow
- Troubleshooting
- Current Limitations
- Roadmap

## Overview
This project has two apps:
- Backend: FastAPI service for audio processing, transcription, note generation, retrieval, and export
- Frontend: React + Vite interface for upload, transcript review, notes, and Q&A

## Features
- Upload lecture audio (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`)
- Whisper-based transcription with timeline-aware chunk metadata
- Transcript cleaning (disfluency and duplicate reduction)
- Structured notes generation (Mistral -> OpenRouter -> Ollama fallback)
- Retrieval-augmented Q&A over transcript chunks
- Export notes as PDF, DOCX, and TXT
- Transcript approval step before note generation

## Architecture
1. Upload audio file
2. Convert to mono 16kHz WAV
3. Silence-aware chunking with min/max duration rules
4. Whisper transcription per chunk
5. Transcript cleanup
6. User reviews transcript
7. LLM generates structured notes
8. FAISS index built from cleaned chunks
9. Q&A and export endpoints enabled

## Tech Stack
- Backend: FastAPI, Uvicorn, pydantic-settings
- Audio: librosa, pydub, soundfile, Whisper
- NLP cleanup: spaCy, rapidfuzz
- Notes/Q&A LLMs: Mistral API, OpenRouter, Ollama fallback
- Retrieval: sentence-transformers, FAISS
- Export: reportlab, python-docx
- Frontend: React, React Router, Vite

## Project Structure
```text
.
├── backend/
│   ├── api/routers/
│   │   ├── audio.py
│   │   ├── notes.py
│   │   ├── qa.py
│   │   └── export.py
│   ├── core/
│   │   ├── audio_processor.py
│   │   ├── transcriber.py
│   │   ├── llm.py
│   │   ├── rag.py
│   │   └── config.py
│   ├── models/session.py
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .env
├── .env.example
└── improvements.md
```

## Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+
- FFmpeg (required by audio pipeline dependencies)

## Quick Start (Local)

### 1) Clone and create virtual environment
```powershell
git clone <your-repo-url>
cd audio2notes-ai
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2) Install backend dependencies
```powershell
pip install -r backend\requirements.txt
```

If Whisper is not installed from your requirements lock, install it explicitly:
```powershell
pip install openai-whisper
```

Install spaCy English model:
```powershell
python -m spacy download en_core_web_sm
```

### 3) Configure environment
```powershell
Copy-Item .env.example .env
```
Update `.env` with at least one LLM provider key:
- `MISTRAL_API_KEY` (recommended)
- or `OPENROUTER_API_KEY`

### 4) Start backend
```powershell
cd backend
..\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend URLs:
- API root: `http://127.0.0.1:8000/`
- Health: `http://127.0.0.1:8000/health`
- Docs: `http://127.0.0.1:8000/docs`

### 5) Start frontend
Open a second terminal at repo root:
```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend URL:
- `http://127.0.0.1:5173`

## Environment Variables
Defined in `.env.example` and loaded by `backend/core/config.py`.

### Core LLM
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

### Audio + Chunking
- `WHISPER_MODEL_SIZE`
- `AUDIO_SAMPLE_RATE`
- `AUDIO_TEMP_DIR`
- `MIN_SILENCE_LEN_MS`
- `SILENCE_THRESH_DB`
- `KEEP_SILENCE_MS`
- `MIN_CHUNK_LEN_MS`
- `MAX_CHUNK_LEN_MS`

### Retrieval
- `EMBEDDING_MODEL`
- `FAISS_INDEX_DIR`

## API Endpoints

### Audio
- `POST /api/v1/audio/upload`
  - Upload and transcribe audio
  - Returns `session_id`, `transcript_chunks`, and status `transcribed`
- `POST /api/v1/audio/process`
  - Generate notes and create retrieval index from approved transcript

### Notes
- `GET /api/v1/notes/{session_id}`
  - Fetch structured notes and merged notes

### Q&A
- `POST /api/v1/qa/ask`
  - Ask grounded questions against lecture transcript context

### Export
- `GET /api/v1/export/{session_id}/pdf`
- `GET /api/v1/export/{session_id}/docx`
- `GET /api/v1/export/{session_id}/txt`

## Usage Flow
1. Open frontend and upload audio
2. Wait for transcription
3. Review transcript in preview
4. Approve to generate notes and index
5. Open notes and use Q&A
6. Export final notes

## Troubleshooting

### `npm ERR! enoent ... package.json` at repo root
Cause: `package.json` is under `frontend/`.
Fix:
```powershell
npm --prefix frontend run dev
```
or:
```powershell
cd frontend
npm run dev
```

### Backend shows `RequestsDependencyWarning`
This is usually a version mismatch in `requests` dependency tree (`urllib3/chardet/charset_normalizer`).
Fix by updating/pinning compatible versions in your Python environment.

### `spawn EPERM` while starting Vite
This can happen in restricted shells/sandboxes. Run terminal with normal local permissions and retry.

### Whisper/spaCy errors on first run
Install missing dependencies:
```powershell
pip install openai-whisper
python -m spacy download en_core_web_sm
```

## Current Limitations
- Session store is in-memory (non-persistent)
- Long-running jobs are synchronous from user perspective (no background job queue)
- Export endpoints assume processed notes exist

## Roadmap
Planned improvements are tracked in:
- `improvements.md`
