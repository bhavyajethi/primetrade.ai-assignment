from pydantic_settings import BaseSettings, SettingsConfigDict
from urllib.parse import quote_plus


class Settings(BaseSettings):
    # Database Settings
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_NAME: str

    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Configuration source
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

# Instance of the settings
settings = Settings()

# print(f"--- DEBUG ---")
# print(f"DB_USER from settings: '{settings.DB_USER}'")
# print(f"DB_HOST from settings: '{settings.DB_HOST}'")
# print(f"--- END DEBUG ---")

# Construct the MySQL connection URL
SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{settings.DB_USER}:{quote_plus(settings.DB_PASSWORD)}@{settings.DB_HOST}/{settings.DB_NAME}"
)