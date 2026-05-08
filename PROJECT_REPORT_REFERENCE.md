# Audio2Notes AI Project Reference

## 1. Project Overview

**Audio2Notes AI** is a full-stack academic productivity application that converts lecture audio into structured study notes and supports question answering over the lecture transcript. The system is designed to reduce the manual effort students or academic teams spend on listening, transcribing, summarizing, and organizing spoken learning material.

At a high level, the platform accepts an uploaded audio file, converts it into a standardized format, splits it into manageable chunks, transcribes each chunk using Whisper, cleans the transcript, generates structured notes using large language models, builds a retrieval index over the transcript, and finally exposes the results through a React-based user interface.

The project is implemented as a monorepo with:

- a **FastAPI backend** for audio processing, transcription, note generation, retrieval, session storage, and export
- a **React + Vite frontend** for upload, transcript review, notes viewing, history, and grounded Q&A

## 2. Problem Statement

Lecture recordings are often long, unstructured, and difficult to revisit efficiently. Students may need to replay large portions of audio just to recover key concepts, definitions, or examples. Manual note-taking is time-consuming and can miss important details. This project addresses that problem by transforming raw lecture audio into organized notes that are easier to review, search, and export.

## 3. Main Objectives

- Accept common lecture audio formats through a web interface
- Convert raw audio into a transcript with chunk-level timing metadata
- Clean noisy transcript output by reducing filler words and duplicate phrases
- Generate structured notes with sections such as topic, key points, definitions, explanations, examples, and summary
- Support question answering grounded in the lecture transcript rather than general model memory
- Export generated notes into PDF, DOCX, and TXT formats
- Persist completed sessions so users can revisit previous results

## 4. Current Feature Set

### Implemented Features

- Audio upload for `.mp3`, `.wav`, `.m4a`, `.ogg`, and `.flac`
- File-size validation with a 100 MB upload limit
- Audio conversion to mono 16 kHz WAV for a consistent ASR pipeline
- Silence-aware chunking with chunk start and end timeline preservation
- Whisper-based transcription
- Transcript cleaning using regex rules, fuzzy duplicate detection, and spaCy sentence segmentation when available
- Transcript review screen before note generation
- Structured note generation with provider fallback:
  - Mistral as primary
  - OpenRouter as secondary
  - local Ollama as tertiary fallback
- FAISS-based transcript retrieval for grounded Q&A
- Session history page for previously completed results
- Export of notes to PDF, DOCX, and TXT
- SQLite-backed session persistence with in-memory runtime caching

### Planned or Mentioned Elsewhere but Not Currently Implemented

- Concept graph generation and graph visualization
- Background job processing
- Automated test coverage
- Multi-user authentication and authorization

This distinction is important for report writing, because some planning documents in the repository describe ideas that are broader than the current shipped implementation.

## 5. Technology Stack

### Backend

- **FastAPI** for REST API endpoints
- **Uvicorn** as the ASGI server
- **pydantic-settings** for configuration management
- **python-multipart** for file uploads
- **requests** for external LLM API calls

### Audio Processing

- **librosa** for audio loading and resampling
- **soundfile** for writing normalized WAV files
- **pydub** for handling audio segments and silence-based chunking

### Speech Recognition and NLP

- **openai-whisper** for speech-to-text transcription
- **spaCy** for sentence segmentation during transcript cleanup
- **rapidfuzz** for duplicate sentence and clause detection

### LLM and Retrieval

- **Mistral API** for primary note generation and QA answering
- **OpenRouter** as fallback provider
- **Ollama** as local fallback provider
- **sentence-transformers** for transcript embeddings
- **FAISS** for similarity search over transcript chunks

### Frontend

- **React 18**
- **React Router**
- **Vite**
- **lucide-react** and custom SVGs for UI visuals

### Export

- **reportlab** for PDF generation
- **python-docx** for DOCX generation

## 6. System Architecture

The application follows a client-server architecture with a clear separation between presentation, processing, and storage responsibilities.

### High-Level Flow

1. User uploads an audio file from the frontend.
2. Backend validates the file and saves it temporarily.
3. Audio is converted to a standardized mono 16 kHz WAV format.
4. The WAV file is split into timeline-preserving chunks using silence detection.
5. Each chunk is transcribed using Whisper.
6. Raw transcript text is cleaned to reduce filler and repeated content.
7. The cleaned transcript is returned to the user for review.
8. After user approval, the backend sends each cleaned chunk to an LLM for note generation.
9. The backend merges all chunk notes into a single exportable note body.
10. A FAISS index is created over cleaned transcript chunks for retrieval.
11. The frontend displays structured notes and enables grounded Q&A.
12. Users can export notes to PDF, DOCX, or TXT.

### Logical Layers

- **Presentation layer**: React pages and components
- **API layer**: FastAPI routers
- **Processing layer**: audio preprocessing, transcription, cleaning, note generation, retrieval
- **Persistence layer**: SQLite session store plus in-memory session cache

## 7. Repository Structure

```text
audio2notes-ai/
|-- backend/
|   |-- api/routers/
|   |   |-- audio.py
|   |   |-- notes.py
|   |   |-- qa.py
|   |   `-- export.py
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
|   |   |   |-- Navbar.jsx
|   |   |   |-- QAChat.jsx
|   |   |   `-- TranscriptPreview.jsx
|   |   |-- config/
|   |   |   `-- api.js
|   |   |-- pages/
|   |   |   |-- HistoryPage.jsx
|   |   |   |-- HomePage.jsx
|   |   |   `-- NotesPage.jsx
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- styles/index.css
|   |-- package.json
|   `-- vite.config.js
|-- README.md
|-- DEPLOYMENT.md
|-- implementation_plan.md
|-- improvements.md
`-- PROJECT_REPORT_REFERENCE.md
```

## 8. Backend Design and Module Responsibilities

### 8.1 `backend/main.py`

This file is the backend entry point. It:

- creates the FastAPI application
- configures CORS for frontend development URLs
- mounts routers for audio, notes, Q&A, and export
- initializes the session database on startup
- checks whether the spaCy English model is installed
- exposes root and `/health` endpoints

### 8.2 `backend/core/config.py`

This module centralizes runtime configuration using `BaseSettings`. It reads values from the root `.env` file and defines:

- LLM provider credentials and models
- Whisper model size
- audio sample rate
- chunking thresholds
- FAISS embedding model
- session database path

It also includes backward-compatible aliases for some older environment variable names.

### 8.3 `backend/core/audio_processor.py`

This module is responsible for the entire preprocessing pipeline before ASR:

- saving the uploaded file temporarily
- converting it to mono 16 kHz WAV
- detecting nonsilent regions
- merging overlapping regions
- building chunk ranges that preserve original timing
- exporting chunk WAV files
- cleaning up temporary files afterward

#### Important Audio Logic

- `convert_to_standard_format()` ensures every file enters the ASR stage in a consistent format
- `_build_chunk_ranges()` uses silence detection plus minimum and maximum chunk durations
- `split_audio_into_chunks()` exports each chunk and records `start_sec` and `end_sec`
- `preprocess_audio()` orchestrates the full save-convert-split flow asynchronously

This design makes the downstream transcription stage more stable and helps preserve timing data that is later used in transcript preview.

### 8.4 `backend/core/transcriber.py`

This module handles speech recognition and transcript cleanup.

#### Whisper Loading

- Whisper is loaded lazily and cached in `_whisper_model`
- The model size is controlled by `WHISPER_MODEL_SIZE`

#### spaCy Handling

- spaCy is loaded lazily
- if `en_core_web_sm` is missing, the code falls back to regex-based sentence splitting

#### Transcript Cleanup

The cleaning pipeline is intentionally conservative so it does not over-edit academic content. It:

- removes disfluency words such as `uh`, `um`, and `erm`
- removes phrases such as `you know` and `I mean`
- removes immediate stutters like repeated words
- deduplicates repeated clauses inside a sentence
- removes near-duplicate sentences using fuzzy matching

#### Output Per Chunk

Each transcript chunk contains:

- `raw_text`
- `cleaned_text`
- `segments`
- `avg_confidence`
- `chunk_start_sec`
- `chunk_end_sec`

This gives the frontend both the original and cleaned version for review.

### 8.5 `backend/core/llm.py`

This module handles note generation and model fallback behavior.

#### Prompt Design

The project uses a strict JSON prompt that asks the model to return:

- `topic`
- `key_points`
- `definitions`
- `important_explanations`
- `examples`
- `summary`
- `confidence`

This approach makes note output more structured and easier to render, export, and reuse.

#### Provider Strategy

The current provider order is:

1. Mistral API
2. OpenRouter
3. local Ollama

If all providers fail, the code returns a fallback note object with low confidence and an error summary.

#### Key Design Choice

`generate_all_notes()` currently processes chunks sequentially. This is slower than concurrent execution, but it reduces rate-limit and resource pressure and keeps the logic simpler.

### 8.6 `backend/core/rag.py`

This module implements retrieval augmentation.

#### Index Creation

- cleaned transcript chunks are embedded with `sentence-transformers`
- embeddings are normalized
- a FAISS inner-product index is built
- the index and source chunk texts are stored in runtime session memory

#### Query Flow

- the question is embedded
- top matching transcript chunks are retrieved
- those chunks are sent to the LLM as grounding context

This enables the Q&A system to answer based on lecture content rather than generic pretrained knowledge alone.

### 8.7 `backend/core/session_store.py`

This file implements lightweight persistence using SQLite.

It:

- creates the `sessions` table if needed
- stores filename, status, transcript chunks, notes, merged notes, and timestamps
- loads sessions by `session_id`
- lists recent completed sessions for the History page

This means the application is not purely in-memory anymore. Completed sessions can survive server restarts as long as the SQLite file remains available.

### 8.8 `backend/models/session.py`

This module contains an in-memory `sessions` dictionary used as the runtime cache. The application combines:

- **in-memory cache** for active runtime access
- **SQLite persistence** for recovery and history

## 9. API Layer

### 9.1 Audio Router

The `audio.py` router contains the two most important pipeline endpoints.

#### `POST /api/v1/audio/upload`

Responsibilities:

- validate upload size and file extension
- read the uploaded file
- generate a unique session ID
- preprocess audio into chunks
- transcribe and clean each chunk
- save the transcribed session
- return transcript data for user approval

#### `POST /api/v1/audio/process`

Responsibilities:

- accept a `session_id`
- verify the session is still in `transcribed` state
- generate structured notes from cleaned transcript chunks
- merge note sections into a single text block
- build the RAG index
- update the session to `completed`

This two-step design is a strong product decision because it inserts a **human review checkpoint** between transcription and note generation.

### 9.2 Notes Router

The `notes.py` router exposes:

- `GET /api/v1/notes/history`
- `GET /api/v1/notes/{session_id}`

This supports both the History page and reloading of existing result pages directly by URL.

### 9.3 Q&A Router

The `qa.py` router exposes:

- `POST /api/v1/qa/ask`

It:

- restores session data from SQLite if needed
- creates a FAISS index on demand if missing in memory
- retrieves the most relevant transcript chunks
- constructs a context-constrained prompt
- answers with Mistral, then OpenRouter, then Ollama fallback

The response includes:

- the original question
- the generated answer
- the retrieved source chunks

### 9.4 Export Router

The `export.py` router exposes:

- `GET /api/v1/export/{session_id}/pdf`
- `GET /api/v1/export/{session_id}/docx`
- `GET /api/v1/export/{session_id}/txt`

It checks that notes exist before exporting and then streams the generated file back to the client.

## 10. Frontend Design and User Experience

The frontend is a single-page React application built around a simple academic workflow.

### 10.1 Application Routing

The main routes are:

- `/` for upload and transcript review
- `/history` for previously completed sessions
- `/results/:sessionId` for structured notes and Q&A

### 10.2 Home Page

`HomePage.jsx` is the main entry experience. It provides:

- hero section explaining the product
- drag-and-drop upload area
- file validation before upload
- animated pipeline progress indicator
- transcript review handoff
- section describing core capabilities

After upload succeeds, the user is shown the transcript preview instead of immediately generating notes.

### 10.3 Transcript Preview

`TranscriptPreview.jsx` is a key usability feature because it lets the user inspect transcription quality before downstream AI processing.

It provides:

- full transcript view
- segmented chunk view
- raw transcript mode
- cleaned transcript mode
- transcript word count
- duration estimate from chunk timing
- average confidence display per segment

This improves transparency and gives the system a quality-control step.

### 10.4 Notes Page

`NotesPage.jsx` displays completed results. It includes:

- filename and section statistics
- count of high-confidence note sections
- tabbed navigation between Notes and Q&A
- export actions for PDF, DOCX, and TXT
- per-section rendering of topic, key points, definitions, and summary

### 10.5 Q&A Chat

`QAChat.jsx` provides a lightweight chat experience with:

- suggested starter questions
- user and assistant message rendering
- loading state
- transcript-source count display for each answer

This keeps the interface simple while still exposing the retrieval feature clearly.

### 10.6 History Page

`HistoryPage.jsx` shows completed sessions stored in SQLite and lets the user reopen them by clicking an item.

Each item shows:

- original filename
- number of processed sections
- last updated time
- shortened session ID

## 11. End-to-End Data Flow

### Stage 1: Upload

The browser sends a `multipart/form-data` request containing the audio file.

### Stage 2: Preprocessing

The backend saves the file temporarily, normalizes audio format, and builds chunk ranges from silence-aware segmentation.

### Stage 3: Transcription

Whisper transcribes each chunk. Segment timestamps are shifted so they align with the original lecture timeline instead of resetting per chunk.

### Stage 4: Cleanup

Raw text is cleaned to reduce filler and repeated content. Both raw and cleaned forms are retained.

### Stage 5: User Review

The frontend shows the transcription preview and waits for user approval.

### Stage 6: Note Generation

Approved cleaned chunks are sent one by one to the LLM note-generation pipeline. The backend returns structured note objects for each chunk.

### Stage 7: Retrieval Indexing

The cleaned transcript chunks are embedded and inserted into a FAISS index for semantic search.

### Stage 8: Viewing and Export

The user can:

- read structured notes
- ask grounded questions
- export notes to different file formats
- revisit the session later through History

## 12. Session and Data Model

The project does not currently use a full ORM model layer. Instead, it stores session-shaped dictionaries with fields such as:

- `session_id`
- `filename`
- `status`
- `transcript_chunks`
- `notes_chunks`
- `merged_notes`
- `created_at`
- `updated_at`

### Status Lifecycle

- `transcribed`: transcript ready for review
- `completed`: notes generated and export-ready

This state machine is simple but effective for the current product scope.

## 13. Export Design

The project supports three export modes for practical usability:

- **PDF** for formal submission or printing
- **DOCX** for editable office documents
- **TXT** for lightweight plain-text sharing

The PDF builder applies title, section headings, separators, bullet points, and summaries. The DOCX builder creates heading hierarchy and bullet lists. TXT export uses the merged text assembled from all note chunks.

## 14. Configuration and Environment

The backend is configured through `.env` values. Important groups include:

- LLM API keys and model names
- Whisper model size
- chunking settings
- audio temp directory
- embedding model
- session database path

The frontend supports:

- `VITE_API_BASE_URL`
- `VITE_API_DOCS_URL`

For local development, Vite proxies `/api` requests to `http://localhost:8000`.

## 15. Strengths of the Current Design

- Clear separation between transcription and note generation
- Human approval step before expensive or irreversible AI processing
- Conservative transcript cleanup instead of aggressive rewriting
- Multi-provider LLM fallback increases resilience
- Retrieval-based Q&A improves grounding
- Export support makes the app useful beyond the browser
- History and persistence improve repeat usability

## 16. Current Limitations

### Technical Limitations

- No automated tests are present in the active codebase
- Long-running tasks are synchronous from the user perspective
- Note generation is sequential and may be slow for long lectures
- FAISS indexes are kept in memory and recreated after restart if needed
- Some frontend API and docs links are still hardcoded to localhost instead of fully using the config helper

### Product Limitations

- No concept graph is currently implemented
- No user authentication or per-user workspace isolation
- No background progress streaming from the backend
- No transcript editing workflow beyond approve/back review
- No persistent storage for uploaded source audio after processing

## 17. Security and Reliability Notes

- Upload size is limited to 100 MB
- unsupported audio formats are rejected
- temporary chunk files are cleaned up in `finally` blocks
- internal exceptions are mostly hidden behind generic API errors
- CORS is currently configured mainly for local development hosts

For a production-grade deployment, stronger logging, request tracing, auth, and more robust storage separation would still be valuable.

## 18. Comparison Between Plan and Current Implementation

The repository includes an `implementation_plan.md` that describes a broader target system. Compared with that plan:

### Already Implemented

- monorepo structure
- FastAPI backend
- React frontend
- audio normalization and chunking
- Whisper transcription
- transcript cleanup
- structured note generation
- retrieval-based Q&A
- exports

### Not Yet Implemented from the Broader Vision

- concept graph extraction
- graph visualization
- advanced background processing
- more formal testing strategy

This is useful in a report because it shows both the achieved scope and the remaining future scope.

## 19. Possible Report Sections You Can Reuse

If you are writing an academic or internship-style report, the project naturally maps into these chapters:

1. Introduction
2. Problem Statement
3. Objectives
4. Literature or Tooling Background
5. System Architecture
6. Backend Implementation
7. Frontend Implementation
8. Audio Processing Pipeline
9. Transcript Cleaning Strategy
10. Note Generation and Prompt Engineering
11. Retrieval-Augmented Question Answering
12. Export System
13. Testing and Validation
14. Limitations
15. Future Enhancements
16. Conclusion

## 20. Suggested Future Enhancements

- Add background task processing and progress updates
- Persist FAISS indexes to disk
- Add transcript editing before approval
- Implement concept graph generation
- Add user authentication and project ownership
- Improve export formatting with richer templates
- Add structured logging and request IDs
- Add unit and integration tests
- Support multi-language transcription
- Improve scalability with external storage and queue-based processing

## 21. Conclusion

Audio2Notes AI is a practical AI-assisted lecture understanding system that combines speech recognition, transcript cleanup, structured note generation, retrieval, and export in a single workflow. Its strongest design choice is the approval-based pipeline, where users can review the transcript before the system generates notes. This improves trust, keeps the workflow grounded in source material, and reduces the risk of low-quality downstream summaries.

From a software engineering perspective, the project demonstrates integration across audio processing, NLP cleanup, LLM orchestration, retrieval, persistence, and frontend UX. It is already a meaningful end-to-end application and also has a clear path for future enhancements such as concept graphs, background jobs, and production hardening.
