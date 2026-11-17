import logging
from fastapi import APIRouter, Depends, File, Response, UploadFile, status

from app.dependencies.auth import get_current_user
from app.schemas.speech import TranscriptionResponse, TTSRequest
from app.schemas.user import UserRead
from app.services.speech.stt_service import SpeechToTextService
from app.services.speech.tts_service import TextToSpeechService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/speech", tags=["Voice & Speech Services"])


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe uploaded speech audio to text",
)
async def transcribe_audio(
    file: UploadFile = File(..., description="Recorded audio file (WebM, WAV, MP3, M4A, OGG)"),
    current_user: UserRead = Depends(get_current_user),
) -> TranscriptionResponse:
    """
    Transcribe candidate's recorded spoken answer into text for review and submission.
    Requires authenticated session.
    """
    service = SpeechToTextService()
    return await service.transcribe_audio_upload(file)


@router.post(
    "/synthesize",
    status_code=status.HTTP_200_OK,
    summary="Synthesize interview question text to spoken audio",
    responses={
        200: {
            "content": {"audio/mpeg": {}},
            "description": "Binary audio stream of synthesized speech",
        }
    },
)
async def synthesize_speech(
    payload: TTSRequest,
    current_user: UserRead = Depends(get_current_user),
) -> Response:
    """
    Synthesize interviewer question or follow-up into natural spoken audio for candidate playback.
    Requires authenticated session.
    """
    service = TextToSpeechService()
    audio_bytes, media_type = await service.synthesize_speech(payload)

    return Response(
        content=audio_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": "inline; filename=interview_question.mp3",
            "Content-Length": str(len(audio_bytes)),
            "Cache-Control": "private, max-age=3600",
        },
    )

