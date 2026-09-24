import os
from pathlib import Path

from dotenv import dotenv_values
from sqlalchemy import Engine, create_engine
from sqlalchemy.engine import URL, make_url

ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


def database_url(*, migration: bool = False) -> str | URL:
    # Use this backend's file regardless of cwd, without changing process env.
    # Disable interpolation to preserve literal ${...} in passwords.
    settings = {**dotenv_values(ENV_FILE, interpolate=False), **os.environ}
    variable = "MIGRATION_DATABASE_URL" if migration else "DATABASE_URL"
    if variable in settings:
        value = settings[variable]
        if not value:
            raise RuntimeError(f"{variable} must not be empty")
        return value

    # Explicit shared-account configuration, selected for the initial deployment.
    # Per-purpose URLs above still support separate application/migration roles.
    required = ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD")
    if any(not settings.get(key) for key in required):
        raise RuntimeError(
            f"Set {variable} or all of {', '.join(required)} in backend/.env "
            "or the environment"
        )
    try:
        port = int(settings.get("DB_PORT", "5432"))
        if not 1 <= port <= 65535:
            raise ValueError
    except (TypeError, ValueError):
        raise RuntimeError("DB_PORT must be an integer from 1 to 65535") from None
    return URL.create(
        "postgresql+psycopg",
        username=settings["DB_USER"],
        password=settings["DB_PASSWORD"],
        host=settings["DB_HOST"],
        port=port,
        database=settings["DB_NAME"],
    )


def make_engine(url: str | URL | None = None) -> Engine:
    parsed = make_url(url or database_url())
    if parsed.get_backend_name() != "postgresql":
        raise ValueError("PostgreSQL is required")
    return create_engine(
        parsed.set(drivername="postgresql+psycopg"), pool_pre_ping=True
    )
