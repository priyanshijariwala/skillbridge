import logging
import os
import re
import tempfile
from typing import Optional, Set
from fastapi import UploadFile, status

from app.core.config import settings
from app.core.errors import AppException
from app.integrations.speech_to_text.base import BaseSTTProvider
from app.integrations.speech_to_text.provider_factory import get_stt_provider
from app.schemas.speech import TranscriptionResponse

logger = logging.getLogger(__name__)

ALLOWED_MIME_PREFIXES: Set[str] = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/aac",
    "audio/ogg",
}

# Standard audio magic byte signatures
MAGIC_SIGNATURES = [
    (b"\x1a\x45\xdf\xa3", ".webm"),          # WebM / Matroska
    (b"RIFF", ".wav"),                       # WAV (starts with RIFF, bytes 8-11: WAVE)
    (b"ID3", ".mp3"),                        # MP3 with ID3 header
    (b"\xff\xfb", ".mp3"),                    # MP3 frame
    (b"\xff\xf3", ".mp3"),                    # MP3 frame
    (b"\xff\xf2", ".mp3"),                    # MP3 frame
    (b"OggS", ".ogg"),                       # OGG container
    (b"ftyp", ".m4a"),                       # MP4 / M4A (offset 4)
]


class SpeechToTextService:
    def __init__(self, stt_provider: Optional[BaseSTTProvider] = None) -> None:
        self.stt_provider = stt_provider or get_stt_provider()

    @classmethod
    def detect_extension_from_magic_bytes(cls, header: bytes) -> Optional[str]:
        """Detect valid audio file extension based on magic signature bytes."""
        if len(header) < 4:
            return None

        # Check at offset 0
        for sig, ext in MAGIC_SIGNATURES:
            if sig == b"ftyp":
                continue
            if header.startswith(sig):
                if sig == b"RIFF" and len(header) >= 12 and header[8:12] != b"WAVE":
                    continue
                return ext

        # Check MP4 / M4A ftyp box at offset 4
        if len(header) >= 8 and header[4:8] == b"ftyp":
            return ".m4a"

        return None

    @classmethod
    def validate_content_type(cls, content_type: Optional[str]) -> bool:
        if not content_type:
            return False
        normalized = content_type.lower().split(";")[0].strip()
        return any(normalized == prefix or normalized.startswith(prefix) for prefix in ALLOWED_MIME_PREFIXES)

    async def transcribe_audio_upload(self, upload_file: UploadFile) -> TranscriptionResponse:
        """Validate, temporarily stage, and transcribe an uploaded audio file."""
        max_bytes = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024

        # Read audio payload
        try:
            audio_bytes = await upload_file.read()
        except Exception as e:
            logger.error("Failed to read uploaded audio stream: %s", e)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="AUDIO_READ_ERROR",
                message="Could not read uploaded audio file.",
            )

        # 1. Non-empty validation
        if not audio_bytes or len(audio_bytes) < 100:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="EMPTY_AUDIO",
                message="Audio file is empty or too short to contain valid speech data.",
            )

        # 2. Size validation
        if len(audio_bytes) > max_bytes:
            raise AppException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                code="AUDIO_TOO_LARGE",
                message=f"Audio file size exceeds the maximum allowed limit of {settings.MAX_AUDIO_SIZE_MB}MB.",
            )

        # 3. MIME type validation
        raw_mime = upload_file.content_type or "audio/webm"
        is_mime_valid = self.validate_content_type(raw_mime)

        # 4. Signature validation
        detected_ext = self.detect_extension_from_magic_bytes(audio_bytes[:32])

        if not is_mime_valid and not detected_ext:
            logger.warning("Rejected audio upload with unsupported MIME type '%s' and signature.", raw_mime)
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="UNSUPPORTED_AUDIO_FORMAT",
                message="Unsupported audio format. Supported formats: WebM, WAV, MP3, M4A, OGG.",
            )

        extension = detected_ext or ".webm"
        safe_filename = f"audio_recording{extension}"

        logger.info(
            "Processing audio transcription: size=%d bytes, mime=%s, extension=%s",
            len(audio_bytes),
            raw_mime,
            extension,
        )

        # 5. Staging with guaranteed temporary file cleanup
        temp_file_path: Optional[str] = None
        try:
            with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_file_path = temp_audio.name

            # Delegate to STT provider
            result = await self.stt_provider.transcribe(
                audio_bytes=audio_bytes,
                filename=safe_filename,
                content_type=raw_mime,
            )

            text = result.get("text", "").strip()
            return TranscriptionResponse(
                text=text,
                duration_seconds=result.get("duration_seconds"),
                language=result.get("language") or "en",
                confidence=result.get("confidence", 0.95),
            )
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logger.warning("Failed to clean up temporary audio file %s: %s", temp_file_path, e)

