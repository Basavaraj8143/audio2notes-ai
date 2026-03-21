import ollama
from core.config import settings

client = ollama.Client(host=settings.OLLAMA_BASE_URL)
try:
    print(f"Testing Ollama at {settings.OLLAMA_BASE_URL} with model {settings.OLLAMA_MODEL}...")
    response = client.chat(
        model=settings.OLLAMA_MODEL,
        format='json',
        messages=[{'role': 'user', 'content': 'Respond with {"test": "ok"}. Return ONLY JSON.'}],
    )
    print("SUCCESS!")
    print(response['message']['content'])
except Exception as e:
    print(f"FAILED: {e}")
