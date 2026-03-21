import asyncio
from core.llm import _get_client
from core.transcriber import _load_whisper, _load_spacy

async def main():
    print("--- 1. Testing LLM Client ---")
    try:
        client = _get_client()
        print("✅ LLM Client initialized successfully!")
    except Exception as e:
        print(f"❌ LLM Client failed: {e}")

    print("\n--- 2. Testing spaCy Model ---")
    try:
        _load_spacy()
        print("✅ spaCy Model loaded successfully!")
    except Exception as e:
        print(f"❌ spaCy Model failed: {e}")

    print("\n--- 3. Testing Whisper Model ---")
    try:
        # This will download the whisper base model (~140MB) if not cached
        _load_whisper()
        print("✅ Whisper Model loaded successfully!")
    except Exception as e:
        print(f"❌ Whisper Model failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
