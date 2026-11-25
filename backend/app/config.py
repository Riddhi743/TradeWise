from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/tradewise?charset=utf8mb4"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173"
    INITIAL_CAPITAL: float = 1000000


settings = Settings()