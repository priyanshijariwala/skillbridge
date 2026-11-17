from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillBridge AI"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "skillbridge"

    # JWT Authentication
    JWT_SECRET_KEY: str = "skillbridge-super-secret-development-key-change-in-prod-12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # Cookie Settings
    AUTH_COOKIE_NAME: str = "skillbridge_refresh"
    AUTH_COOKIE_SECURE: bool = False
    AUTH_COOKIE_SAMESITE: str = "lax"

    # File uploads
    RESUME_STORAGE_PATH: str = "./private_uploads/resumes"
    MAX_RESUME_SIZE_MB: int = 5

    @property
    def max_resume_size_bytes(self) -> int:
        return self.MAX_RESUME_SIZE_MB * 1024 * 1024

    # AI Provider Settings
    AI_PROVIDER: str = "openai"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-4o-mini"
    AI_TIMEOUT_SECONDS: int = 60
    AI_BASE_URL: Optional[str] = None

    # Speech Provider Settings (STT & TTS)
    STT_PROVIDER: str = "openai"
    STT_MODEL: str = "whisper-1"
    STT_TIMEOUT_SECONDS: int = 30
    MAX_AUDIO_SIZE_MB: int = 25

    TTS_PROVIDER: str = "openai"
    TTS_MODEL: str = "tts-1"
    TTS_VOICE: str = "alloy"
    TTS_TIMEOUT_SECONDS: int = 30
    TTS_MAX_CHARACTERS: int = 2000

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

