import asyncio
import os
import re
import tempfile
from pathlib import Path

import librosa
import soundfile as sf
from pydub import AudioSegment
from pydub.silence import split_on_silence

from core.config import settings


def convert_to_standard_format(input_path: str) -> str:
    """Convert audio file to mono 16kHz WAV using librosa."""
    y, sr = librosa.load(input_path, sr=settings.AUDIO_SAMPLE_RATE, mono=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False, dir=settings.AUDIO_TEMP_DIR) as f:
        out_path = f.name
    sf.write(out_path, y, settings.AUDIO_SAMPLE_RATE)
    return out_path


def split_audio_into_chunks(wav_path: str) -> list[str]:
    """Split a WAV file into chunks on silence boundaries."""
    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    sound = AudioSegment.from_wav(wav_path)
    chunks = split_on_silence(
        sound,
        min_silence_len=settings.MIN_SILENCE_LEN_MS,
        silence_thresh=settings.SILENCE_THRESH_DB,
        keep_silence=300,
    )
    # Merge very short chunks to avoid tiny segments
    merged = []
    buffer = AudioSegment.empty()
    for chunk in chunks:
        buffer += chunk
        if len(buffer) >= 30_000:  # ~30 seconds
            merged.append(buffer)
            buffer = AudioSegment.empty()
    if len(buffer) > 0:
        merged.append(buffer)

    chunk_paths = []
    for i, chunk in enumerate(merged):
        chunk_path = os.path.join(settings.AUDIO_TEMP_DIR, f"chunk_{i}.wav")
        chunk.export(chunk_path, format="wav")
        chunk_paths.append(chunk_path)

    return chunk_paths


async def preprocess_audio(file_bytes: bytes, filename: str) -> list[str]:
    """Full async preprocessing pipeline: save → convert → chunk."""
    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    suffix = Path(filename).suffix
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False, dir=settings.AUDIO_TEMP_DIR) as f:
        f.write(file_bytes)
        tmp_path = f.name

    loop = asyncio.get_event_loop()
    wav_path = await loop.run_in_executor(None, convert_to_standard_format, tmp_path)
    chunk_paths = await loop.run_in_executor(None, split_audio_into_chunks, wav_path)
    os.unlink(tmp_path)
    return chunk_paths
