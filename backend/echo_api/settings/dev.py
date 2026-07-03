"""Local development settings (docker-compose Postgres/Redis)."""

from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env before base reads the environment.
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from .base import *  # noqa: E402,F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
