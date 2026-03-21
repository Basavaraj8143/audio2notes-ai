import asyncio
import os
from core.audio_processor import preprocess_audio
from core.transcriber import transcribe_all_chunks

async def verify_transcription(audio_file_path: str):
    print(f"--- 1. Verification Started for: {audio_file_path} ---")
    
    if not os.path.exists(audio_file_path):
        print(f"❌ Error: File {audio_file_path} not found!")
        return

    # Read bytes
    with open(audio_file_path, "rb") as f:
        file_bytes = f.read()

    print("--- 2. Preprocessing & Chunking ---")
    chunk_paths = await preprocess_audio(file_bytes, os.path.basename(audio_file_path))
    print(f"✅ Created {len(chunk_paths)} chunks.")

    print("--- 3. Transcribing Chunks (Sequential) ---")
    try:
        transcript_chunks = await transcribe_all_chunks(chunk_paths)
        print("\n--- 4. Results ---")
        for i, chunk in enumerate(transcript_chunks):
            print(f"\n[Chunk {i+1}]")
            print(f"RAW: {chunk['raw_text']}")
            print(f"CLEANED: {chunk['cleaned_text']}")
            print(f"CONFIDENCE: {chunk['avg_confidence']:.2f}")
    except Exception as e:
        print(f"❌ Transcription Failed: {e}")
    finally:
        # Cleanup
        for path in chunk_paths:
            if os.path.exists(path):
                os.unlink(path)

if __name__ == "__main__":
    # Change this to your test file name!
    TEST_FILE = "test/audio.mp3" 
    
    # Try to find any mp3 in the current or temp folder if sample doesn't exist
    if not os.path.exists(TEST_FILE):
        print(f"⚠️ {TEST_FILE} not found. Please provide an audio file path.")
    else:
        asyncio.run(verify_transcription(TEST_FILE))
