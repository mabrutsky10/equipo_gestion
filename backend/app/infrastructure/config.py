import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DB_HOST: str
    DB_PORT: int = 5432
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    
    # Auth
    AUTH_SECRET_KEY: str
    AUTH_ALGORITHM: str = "HS256"
    AUTH_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # CORS - stored as string, converted to list via property
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

