from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # API Keys
    openai_api_key: str
    eleven_labs_api_key: str
    suno_api_key: str = ""
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    # File Storage
    upload_dir: str = "./uploads"
    max_file_size: int = 10485760
    # Eleven Labs
    eleven_labs_base_url: str = "https://api.elevenlabs.io/v1"
    eleven_labs_model: str = "eleven_monolingual_v1"
    # OpenAI
    openai_model: str = "gpt-4"
    openai_max_tokens: int = 1000
    openai_temperature: float = 0.7
    # Suno
    suno_base_url: str = "https://api.suno.ai/v1"
    # Database
    database_url: str = "sqlite:///./mindful_coach.db"
    # JWT
    secret_key: str = "my-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    # Redis
    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
os.makedirs(settings.upload_dir, exist_ok=True) 