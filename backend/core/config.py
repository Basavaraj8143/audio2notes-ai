import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Gemini LLM API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Whisper ASR model size: tiny | base | small | medium | large
    WHISPER_MODEL_SIZE: str = "base"

    # Audio processing
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_TEMP_DIR: str = "temp_audio"

    # Chunking
    MIN_SILENCE_LEN_MS: int = 700
    SILENCE_THRESH_DB: int = -40
    MAX_WORDS_PER_CHUNK: int = 500

    # FAISS vector index
    FAISS_INDEX_DIR: str = "faiss_index"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    class Config:
        env_file = ".env"


settings = Settings()
