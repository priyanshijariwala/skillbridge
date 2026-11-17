import struct
from typing import Optional
from app.integrations.text_to_speech.base import BaseTTSProvider


def generate_mock_wav(duration_seconds: float = 0.5, sample_rate: int = 8000) -> bytes:
    """Generate minimal valid PCM 16-bit mono WAV audio bytes for testing and fallback."""
    num_samples = int(sample_rate * duration_seconds)
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align
    chunk_size = 36 + data_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        chunk_size,
        b"WAVE",
        b"fmt ",
        16,
        1,  # PCM
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size,
    )
    return header + (b"\x00" * data_size)


class MockTTSProvider(BaseTTSProvider):
    def __init__(
        self,
        canned_audio: Optional[bytes] = None,
        output_format: str = "mp3",
    ) -> None:
        self._canned_audio = canned_audio
        self._output_format = output_format

    @property
    def provider_name(self) -> str:
        return "mock_tts"

    @property
    def model_name(self) -> str:
        return "mock-tts-v1"

    @property
    def output_format(self) -> str:
        return self._output_format

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
    ) -> bytes:
        if self._canned_audio:
            return self._canned_audio
        # Generate minimal valid silent audio stream
        return generate_mock_wav(duration_seconds=0.6)

