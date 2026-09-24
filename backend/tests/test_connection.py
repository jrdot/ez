import pytest
from sqlalchemy.engine import make_url

from backend.db import connection
from backend.db.connection import database_url, make_engine
from backend.db.projects import ProjectRepository, _project_id


@pytest.fixture(autouse=True)
def isolated_settings(monkeypatch, tmp_path):
    # Tests must never read deployment credentials from the real backend/.env.
    monkeypatch.setattr(connection, "ENV_FILE", tmp_path / ".env")
    for key in (
        "DATABASE_URL",
        "MIGRATION_DATABASE_URL",
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
    ):
        monkeypatch.delenv(key, raising=False)


@pytest.fixture
def shared_settings():
    connection.ENV_FILE.write_text(
        "DB_HOST=192.168.0.4\nDB_NAME=ezwire\nDB_USER=ezwire\n"
        "DB_PASSWORD='p@ss:#%/${literal}'\n",
        encoding="utf-8",
    )


def test_dotenv_works_from_other_directory_and_preserves_password(
    shared_settings, monkeypatch, tmp_path
):
    elsewhere = tmp_path / "other"
    elsewhere.mkdir()
    monkeypatch.chdir(elsewhere)
    for migration in (False, True):
        engine = make_engine(database_url(migration=migration))
        try:
            assert engine.url.host == "192.168.0.4"
            assert engine.url.database == engine.url.username == "ezwire"
            assert engine.url.port == 5432
            assert engine.url.password == "p@ss:#%/${literal}"
        finally:
            engine.dispose()


def test_environment_overrides_file_without_mutating_environment(
    shared_settings, monkeypatch
):
    monkeypatch.setenv("DB_HOST", "test-db")
    assert make_url(database_url()).host == "test-db"
    assert "DB_PASSWORD" not in connection.os.environ


def test_separate_urls_override_shared_account(shared_settings, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://app@localhost/ezwire")
    monkeypatch.setenv("MIGRATION_DATABASE_URL", "postgresql://ddl@localhost/ezwire")
    assert make_url(database_url()).username == "app"
    assert make_url(database_url(migration=True)).username == "ddl"


def test_url_can_also_be_loaded_from_file():
    connection.ENV_FILE.write_text(
        "DATABASE_URL=postgresql://app@localhost/ezwire\n", encoding="utf-8"
    )
    assert make_url(database_url()).username == "app"
    with pytest.raises(RuntimeError, match="MIGRATION_DATABASE_URL"):
        database_url(migration=True)


@pytest.mark.parametrize("port", ["bad", "0", "65536", ""])
def test_invalid_port_fails_without_exposing_value(shared_settings, monkeypatch, port):
    monkeypatch.setenv("DB_PORT", port)
    with pytest.raises(RuntimeError, match="DB_PORT must be an integer"):
        database_url()


def test_empty_url_override_does_not_silently_use_shared_credentials(
    shared_settings, monkeypatch
):
    monkeypatch.setenv("MIGRATION_DATABASE_URL", "")
    with pytest.raises(RuntimeError, match="MIGRATION_DATABASE_URL must not be empty"):
        database_url(migration=True)


def test_migration_credentials_do_not_fall_back_to_runtime(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://runtime@localhost/ezwire")
    monkeypatch.delenv("MIGRATION_DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match="MIGRATION_DATABASE_URL"):
        database_url(migration=True)


def test_rejects_non_postgresql_engine():
    with pytest.raises(ValueError, match="PostgreSQL"):
        make_engine("sqlite://")


@pytest.mark.parametrize("value", [None, "", " "])
def test_requires_trusted_actor(value):
    with pytest.raises(ValueError):
        ProjectRepository(None, actor_id=value)


@pytest.mark.parametrize("field", ["version", "formatVersion"])
def test_boolean_is_not_a_version(document, field):
    target = document if field == "version" else document["project"]
    target[field] = True
    with pytest.raises(ValueError):
        _project_id(document)
