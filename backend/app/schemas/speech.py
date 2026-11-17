from typing import Optional
from pydantic import BaseModel, Field


class TranscriptionResponse(BaseModel):
    text: str = Field(..., description="Transcribed textual response")
    duration_seconds: Optional[float] = Field(None, description="Audio duration in seconds")
    language: Optional[str] = Field("en", description="Detected language code")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence score")


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Text to synthesize to speech")
    voice: Optional[str] = Field(None, description="Voice identifier (e.g. alloy, echo, fable, onyx, nova, shimmer)")
    speed: Optional[float] = Field(1.0, ge=0.5, le=2.0, description="Speech playback speed rate")

