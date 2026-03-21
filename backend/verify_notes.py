import asyncio
from core.config import settings
from core.llm import generate_notes_for_chunk

async def verify_notes(transcript_text: str):
    print("--- 1. Verification Started: Text to Structured Notes ---", flush=True)
    print(f"Input Text: {transcript_text[:100]}...", flush=True)

    try:
        print(f"--- 2. Sending to {settings.OLLAMA_MODEL} (JSON Mode) ---", flush=True)
        from core.llm import generate_notes_for_chunk
        structured_notes = await generate_notes_for_chunk(transcript_text)
        print(f"RAW JSON DATA: {structured_notes.get('raw')}", flush=True)
        
        print("\n--- 3. Results ---", flush=True)
        print(f"TOPIC: {structured_notes.get('topic')}", flush=True)
        print("KEY POINTS:", flush=True)
        for kp in structured_notes.get('key_points', []):
            print(f"  - {kp}", flush=True)
        print("DEFINITIONS:", flush=True)
        for term, defn in structured_notes.get('definitions', {}).items():
            print(f"  - {term}: {defn}", flush=True)
        print(f"SUMMARY: {structured_notes.get('summary')}", flush=True)
        print(f"CONFIDENCE: {structured_notes.get('confidence')}", flush=True)
        
    except Exception as e:
        print(f"❌ Notes Generation Failed: {e}", flush=True)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("--- Script Starting ---", flush=True)
    # Using the cleaned text from our Step 1 test
    SAMPLE_TRANSCRIPT = "Mom, can I help you? Do you want to wash dishes? I can do it. What should I do after that? Let's clean the table."
    try:
        asyncio.run(verify_notes(SAMPLE_TRANSCRIPT))
    except Exception as e:
        print(f"--- Main Error: {e} ---", flush=True)
    print("--- Script Finished ---", flush=True)
