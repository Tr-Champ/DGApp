import os
from pydantic_settings import BaseSettings  # <-- Updated import for Pydantic v2

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dg.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_key_change_me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"

settings = Settings()