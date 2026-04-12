from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parents[2] / '.env'


class Settings(BaseSettings):
    # Mistral (primary for notes generation)
    MISTRAL_API_KEY: str = ''
    MISTRELL_MODEL_API_KEY: str = ''  # Backward-compatible alias from local env.
    MISTRAL_BASE_URL: str = 'https://api.mistral.ai/v1'
    MISTRAL_MODEL: str = 'mistral-small-latest'

    # OpenRouter fallback (free models only)
    OPENROUTER_API_KEY: str = ''
    OPEN_ROUTERAPI_KEY: str = ''  # Backward-compatible alias from local env.
    OPENROUTER_BASE_URL: str = 'https://openrouter.ai/api/v1'
    OPENROUTER_MODEL: str = 'mistralai/mistral-7b-instruct:free'
    OPENROUTER_HTTP_REFERER: str = 'http://localhost:8000'
    OPENROUTER_APP_TITLE: str = 'Audio2Notes AI'
    OPENROUTER_FREE_ONLY: bool = True

    # Optional local Ollama fallback
    OLLAMA_BASE_URL: str = 'http://localhost:11434'
    OLLAMA_MODEL: str = 'llama2:latest'

    # Whisper ASR model size: tiny | base | small | medium | large
    WHISPER_MODEL_SIZE: str = 'base'

    # Audio processing
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_TEMP_DIR: str = 'temp_audio'

    # Chunking
    MIN_SILENCE_LEN_MS: int = 700
    SILENCE_THRESH_DB: int = -40
    KEEP_SILENCE_MS: int = 300
    MIN_CHUNK_LEN_MS: int = 45_000
    MAX_CHUNK_LEN_MS: int = 120_000
    MAX_WORDS_PER_CHUNK: int = 500

    # FAISS vector index
    FAISS_INDEX_DIR: str = 'faiss_index'
    EMBEDDING_MODEL: str = 'all-MiniLM-L6-v2'

    # Persistent session storage
    SESSION_DB_PATH: str = str(Path(__file__).resolve().parents[1] / 'session_store.db')

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding='utf-8',
        extra='ignore',
    )


settings = Settings()
