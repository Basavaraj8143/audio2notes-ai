from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import audio, notes, graph, qa, export

app = FastAPI(
    title="Audio2Notes AI API",
    description="Transforms lecture audio into structured notes, concept graphs, and enables RAG-based Q&A.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio.router, prefix="/api/v1/audio", tags=["Audio"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["Notes"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["Graph"])
app.include_router(qa.router, prefix="/api/v1/qa", tags=["Q&A"])
app.include_router(export.router, prefix="/api/v1/export", tags=["Export"])


@app.get("/")
async def root():
    return {"message": "Audio2Notes AI API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
