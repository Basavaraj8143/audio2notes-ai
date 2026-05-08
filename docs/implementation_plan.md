# Audio2Notes AI Implementation Plan

## Goal Description
Build an end-to-end system that takes raw lecture audio files and automatically produces clean, structured, human-readable notes, a concept graph, and enables RAG-based Q&A against the transcript. The system is divided logically into several distinct processing layers ranging from audio ingestion to knowledge processing and export.

## Proposed System Architecture
The project will be split into a robust **Python FastAPI backend** for audio analysis/AI processing, and a **modern React frontend** for the user interface.

### Backend Tech Stack
- **API Framework**: FastAPI
- **Audio Processing**: `pydub`, `librosa`
- **ASR Pipeline**: `openai-whisper`
- **NLP & Cleaning**: `spacy`, `fuzzywuzzy`
- **LLM Integrations**: `google-genai` (Gemini Flash) or `ollama` (LLaMA)
- **Vector DB**: `faiss-cpu`, `sentence-transformers`
- **Graph Generation**: `networkx`
- **Exporting Modules**: `reportlab`, `python-docx`

### Frontend Tech Stack
- **Framework**: React (built with Vite)
- **Styling**: Vanilla CSS with modern dynamic aesthetics (glassmorphism, micro-animations, curated palettes)
- **Graph Visualization**: `vis-network` (or `d3`)
- **State Management & Routing**: Standard React Hooks, React Router

---

## Proposed Changes / Workstreams

### 1. Project Initialization
- Create a monorepo structure with `backend/` and `frontend/` directories in the main project folder.
- Initialize `requirements.txt` and a basic FastAPI app with routers for `audio`, `notes`, `graph`, and `qa`.
- Initialize a React front-end application via `npx create-vite-app`.

### 2. Audio Processing Pipeline (Layers 1-3)
- Implement `/api/v1/upload` endpoint to receive lecture audio files.
- Process audio file to a standard mono 16kHz format.
- Split audio into logical chunks using `pydub`'s silence detection.
- Process each audio chunk through `Whisper` to obtain text, timestamps, and confidence scores.
- Clean resulting transcripts by removing filler words and repairing sentence boundaries with `spacy`.

### 3. LLM Processing & Note Gen (Layer 4)
- Create strict structured LLM prompts to force schema outputs (Topics, Key Points, Definitions, Summary, Confidence).
- Implement an async mechanism to send chunks to the LLM in parallel to reduce processing time.
- Aggregate chunk outputs into a master consolidated notes document.

### 4. Knowledge Graph & RAG QA (Layers 5-6)
- Send the merged notes (or transcript) to the LLM/spaCy to extract `(concept -> relates to -> concept)` triples.
- Construct a mathematical graph using `networkx` and serialize it for frontend rendering.
- Compute dense vector embeddings for each transcript chunk using `sentence-transformers` and load them into a `faiss` index.
- Expose a `/api/v1/qa` endpoint that uses FAISS similarity search to retrieve relevant chunks and feeds them to the LLM for a grounded answer.

### 5. Export System (Layer 7)
- Provide endpoints to fetch the finalized notes as PDF (`reportlab`), DOCX (`python-docx`), and raw JSON.
- Ensure exported documents maintain a professional layout and hierarchy.

### 6. Frontend UI/UX
- Construct a vibrant, responsive layout highlighting the core pipeline.
- Implement an interactive file uploader showing live processing stages (Audio Upload -> Chunking -> Transcribing -> Summarizing).
- **Core Dashboard**:
  - A comprehensive viewer displaying the structured markdown notes.
  - An embedded graph visualization mapping concept relationships.
  - A chat widget utilizing the backend RAG mechanism to ask contextual queries about the lecture.

---

## User Review Required
> [!IMPORTANT]
> - Which LLM would you prefer to build the connection for first? (e.g. Google Gemini 2.0 Flash via API, or LLaMA 3 via local Ollama endpoint?)
> - Do you approve of establishing the structured monorepo using standard frameworks (React + FastAPI)? Let me know if you would like me to use Next.js instead.
> - Can I proceed to initialize the project folder and the foundational setup scripts?

## Verification Plan
### Automated Tests
- Simple unit test mocking the ASR process to test the LLM structured prompting independently.
- Setup script verifying that local models (like `whisper` and `sentence-transformers`) can be loaded successfully by python.

### Manual Verification
- We will boot up both the React development server and the FastAPI server. 
- You provide a short audio clip or lecture to test the end-to-end functionality (Upload -> Visual Notes -> Q&A interaction). 
