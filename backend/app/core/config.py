from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HackStrom API"
    debug: bool = False
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "hackstrom"
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 60
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    otp_ttl_minutes: int = 10
    otp_length: int = 6
    invite_ttl_days: int = 7
    public_app_url: str = "http://localhost:8000"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "no-reply@example.com"
    smtp_use_tls: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()