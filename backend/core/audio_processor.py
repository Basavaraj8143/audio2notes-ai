import asyncio
import os
import tempfile
from pathlib import Path

import librosa
import soundfile as sf
from pydub import AudioSegment
from pydub.silence import detect_nonsilent

from core.config import settings


def convert_to_standard_format(input_path: str) -> str:
    """Convert audio file to mono 16kHz WAV using librosa."""
    y, _ = librosa.load(input_path, sr=settings.AUDIO_SAMPLE_RATE, mono=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False, dir=settings.AUDIO_TEMP_DIR) as f:
        out_path = f.name
    sf.write(out_path, y, settings.AUDIO_SAMPLE_RATE)
    return out_path


def _merge_overlapping_ranges(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    if not ranges:
        return []
    merged = [ranges[0]]
    for start, end in ranges[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


def _build_chunk_ranges(sound: AudioSegment) -> list[tuple[int, int]]:
    """Build absolute chunk ranges in milliseconds while preserving original timeline."""
    nonsilent = detect_nonsilent(
        sound,
        min_silence_len=settings.MIN_SILENCE_LEN_MS,
        silence_thresh=settings.SILENCE_THRESH_DB,
    )
    if not nonsilent:
        return [(0, len(sound))]

    keep_silence = settings.KEEP_SILENCE_MS
    expanded = [
        (max(0, start - keep_silence), min(len(sound), end + keep_silence))
        for start, end in nonsilent
    ]
    expanded = _merge_overlapping_ranges(expanded)

    # Pass 1: merge small units into chunks that are at least MIN_CHUNK_LEN_MS when possible.
    coarse: list[tuple[int, int]] = []
    active_start = None
    active_end = None
    for start, end in expanded:
        if active_start is None:
            active_start, active_end = start, end
        else:
            active_end = end

        if active_end - active_start >= settings.MIN_CHUNK_LEN_MS:
            coarse.append((active_start, active_end))
            active_start = None
            active_end = None

    if active_start is not None and active_end is not None:
        coarse.append((active_start, active_end))

    if not coarse:
        coarse = expanded

    # Pass 2: cap chunk size to avoid very long sections.
    final_ranges: list[tuple[int, int]] = []
    for start, end in coarse:
        cursor = start
        while cursor < end:
            next_end = min(cursor + settings.MAX_CHUNK_LEN_MS, end)
            final_ranges.append((cursor, next_end))
            cursor = next_end
    return final_ranges


def split_audio_into_chunks(wav_path: str) -> list[dict]:
    """Split WAV into timeline-preserving chunks and return chunk metadata."""
    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    sound = AudioSegment.from_wav(wav_path)
    ranges = _build_chunk_ranges(sound)

    chunk_items = []
    for i, (start_ms, end_ms) in enumerate(ranges):
        chunk = sound[start_ms:end_ms]
        chunk_path = os.path.join(settings.AUDIO_TEMP_DIR, f"chunk_{i}.wav")
        chunk.export(chunk_path, format="wav")
        chunk_items.append(
            {
                "path": chunk_path,
                "start_sec": round(start_ms / 1000, 3),
                "end_sec": round(end_ms / 1000, 3),
            }
        )
    return chunk_items


async def preprocess_audio(file_bytes: bytes, filename: str) -> list[dict]:
    """Full async preprocessing pipeline: save -> convert -> chunk."""
    os.makedirs(settings.AUDIO_TEMP_DIR, exist_ok=True)
    tmp_path = None
    wav_path = None
    suffix = Path(filename).suffix
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False, dir=settings.AUDIO_TEMP_DIR) as f:
            f.write(file_bytes)
            tmp_path = f.name

        loop = asyncio.get_event_loop()
        wav_path = await loop.run_in_executor(None, convert_to_standard_format, tmp_path)
        chunk_items = await loop.run_in_executor(None, split_audio_into_chunks, wav_path)
        return chunk_items
    finally:
        for path in (tmp_path, wav_path):
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except OSError:
                    pass
