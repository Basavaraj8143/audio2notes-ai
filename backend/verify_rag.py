import asyncio
from core.rag import create_index, search_index

async def verify_rag():
    print("--- 1. Verification Started: Vector Search (RAG) ---")
    
    # Sample chunks (simulating Whisper output)
    CHUNKS = [
        {"cleaned_text": "Mom, can I help you? I want to wash some dishes."},
        {"cleaned_text": "After that, let's clean the kitchen table together."},
        {"cleaned_text": "We should also take out the trash eventually."},
        {"cleaned_text": "The lecture was about photosynthesis and plants."}
    ]

    try:
        print("--- 2. Creating FAISS Index ---")
        session_id = create_index(CHUNKS)
        print(f"✅ Index created! Session ID: {session_id}")

        # Test Case 1: Searching for "dishes"
        print("\n--- 3. Testing Semantic Search (Query: 'dishes') ---")
        results = search_index(session_id, "dishes", top_k=2)
        print("RESULTS:")
        for r in results:
            print(f"  - {r}")
        
        if "wash some dishes" in results[0]:
            print("✅ Accurate match!")
        else:
            print("⚠️ Match quality might be low.")

        # Test Case 2: Searching for "garden" (semantic test)
        print("\n--- 4. Testing Semantic Search (Query: 'plants and garden') ---")
        results = search_index(session_id, "plants and garden", top_k=1)
        print(f"  Result: {results[0] if results else 'None'}")
        
        if results and "photosynthesis" in results[0]:
            print("✅ Semantic match worked!")

    except Exception as e:
        print(f"❌ RAG Verification Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_rag())
