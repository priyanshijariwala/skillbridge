import io
import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.errors import AppException
from app.integrations.speech_to_text.providers.mock_stt import MockSTTProvider
from app.integrations.text_to_speech.providers.mock_tts import MockTTSProvider, generate_mock_wav
from app.services.speech.stt_service import SpeechToTextService
from app.services.speech.tts_service import TextToSpeechService
from tests.conftest import register_and_login


# 1. Unit Tests for Speech Services
@pytest.mark.asyncio
async def test_stt_service_unit():
    mock_stt = MockSTTProvider(canned_text="I would use Redis with Lua scripts.")
    service = SpeechToTextService(stt_provider=mock_stt)

    # Generate a valid WAV file buffer
    wav_bytes = generate_mock_wav(duration_seconds=1.0)
    fake_upload = io.BytesIO(wav_bytes)

    from starlette.datastructures import UploadFile as StarletteUploadFile
    file_obj = StarletteUploadFile(file=fake_upload, filename="answer.wav", headers={"content-type": "audio/wav"})

    resp = await service.transcribe_audio_upload(file_obj)
    assert resp.text == "I would use Redis with Lua scripts."
    assert resp.confidence is not None


@pytest.mark.asyncio
async def test_stt_service_rejects_empty():
    service = SpeechToTextService(stt_provider=MockSTTProvider())

    fake_upload = io.BytesIO(b"")
    from starlette.datastructures import UploadFile as StarletteUploadFile
    file_obj = StarletteUploadFile(file=fake_upload, filename="empty.wav", headers={"content-type": "audio/wav"})

    with pytest.raises(AppException) as exc_info:
        await service.transcribe_audio_upload(file_obj)
    assert exc_info.value.code == "EMPTY_AUDIO"


@pytest.mark.asyncio
async def test_stt_service_rejects_unsupported():
    service = SpeechToTextService(stt_provider=MockSTTProvider())

    # Text data pretending to be audio
    fake_upload = io.BytesIO(b"This is just a plain text file pretending to be audio data for testing..." * 5)
    from starlette.datastructures import UploadFile as StarletteUploadFile
    file_obj = StarletteUploadFile(file=fake_upload, filename="test.txt", headers={"content-type": "text/plain"})

    with pytest.raises(AppException) as exc_info:
        await service.transcribe_audio_upload(file_obj)
    assert exc_info.value.code == "UNSUPPORTED_AUDIO_FORMAT"


@pytest.mark.asyncio
async def test_tts_service_unit():
    mock_tts = MockTTSProvider()
    service = TextToSpeechService(tts_provider=mock_tts)

    from app.schemas.speech import TTSRequest
    audio_bytes, media_type = await service.synthesize_speech(
        TTSRequest(text="How would you design a distributed rate limiter?", voice="alloy")
    )
    assert len(audio_bytes) > 40
    assert "audio" in media_type


# 2. Endpoints Integration Tests
@pytest.mark.asyncio
async def test_transcribe_endpoint_success(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_headers = await register_and_login(async_client, email="voice_user@example.com")

    # Prepare valid audio upload
    wav_bytes = generate_mock_wav(duration_seconds=1.0)
    files = {
        "file": ("recording.wav", wav_bytes, "audio/wav"),
    }

    res = await async_client.post(
        "/api/v1/speech/transcribe",
        headers=auth_headers,
        files=files,
    )
    assert res.status_code == 200
    data = res.json()
    assert "text" in data
    assert len(data["text"]) > 0


@pytest.mark.asyncio
async def test_transcribe_unauthenticated(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    wav_bytes = generate_mock_wav(duration_seconds=1.0)
    files = {"file": ("recording.wav", wav_bytes, "audio/wav")}

    res = await async_client.post("/api/v1/speech/transcribe", files=files)
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_transcribe_empty_file_rejected(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_headers = await register_and_login(async_client, email="voice_user2@example.com")

    files = {"file": ("empty.wav", b"", "audio/wav")}
    res = await async_client.post(
        "/api/v1/speech/transcribe",
        headers=auth_headers,
        files=files,
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "EMPTY_AUDIO"


@pytest.mark.asyncio
async def test_synthesize_endpoint_success(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_headers = await register_and_login(async_client, email="voice_user3@example.com")

    res = await async_client.post(
        "/api/v1/speech/synthesize",
        headers=auth_headers,
        json={
            "text": "Explain the difference between synchronous and asynchronous operations in Python.",
            "voice": "alloy",
            "speed": 1.0,
        },
    )
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("audio/")
    assert len(res.content) > 40


@pytest.mark.asyncio
async def test_synthesize_empty_input_rejected(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_headers = await register_and_login(async_client, email="voice_user4@example.com")

    res = await async_client.post(
        "/api/v1/speech/synthesize",
        headers=auth_headers,
        json={"text": "   "},
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "EMPTY_TTS_INPUT"


@pytest.mark.asyncio
async def test_synthesize_too_long_rejected(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    auth_headers = await register_and_login(async_client, email="voice_user5@example.com")

    res = await async_client.post(
        "/api/v1/speech/synthesize",
        headers=auth_headers,
        json={"text": "A" * 2500},
    )
    assert res.status_code == 422 or res.status_code == 400


@pytest.mark.asyncio
async def test_synthesize_unauthenticated(
    async_client: AsyncClient,
    test_db: AsyncIOMotorDatabase,
):
    res = await async_client.post(
        "/api/v1/speech/synthesize",
        json={"text": "Sample text"},
    )
    assert res.status_code == 401

