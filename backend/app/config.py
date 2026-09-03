from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/ai_housing"
    mapbox_access_token: str = ""
    mapbox_base_url: str = "https://api.mapbox.com"
    overpass_api_url: str = "https://overpass-api.de/api/interpreter"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
