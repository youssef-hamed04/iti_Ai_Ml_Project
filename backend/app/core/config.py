from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """App settings, overridable via a .env file (see .env.example)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MODEL_PATH: str = str(BASE_DIR / "models" / "house_price.pkl")
    LOCATIONS_PATH: str = str(BASE_DIR / "models" / "locations.json")

    # Comma-separated origins are split into a list.
    CORS_ORIGINS_RAW: str = "http://localhost:5173"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]


settings = Settings()
