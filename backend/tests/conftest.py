import json
import os
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.engine import make_url

from backend.db.connection import make_engine

BACKEND = Path(__file__).resolve().parents[1]


def migration_config(connection):
    config = Config(str(BACKEND / "alembic.ini"))
    config.attributes["connection"] = connection
    return config


@pytest.fixture
def document():
    # Pin the BE-01 v1 contract; the frontend sample evolves independently.
    return json.loads(
        (BACKEND / "tests/fixtures/project-v1.wireproj").read_text(encoding="utf-8")
    )


@pytest.fixture
def engine():
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set TEST_DATABASE_URL to run real PostgreSQL integration tests")
    # Each test owns a fresh schema. Never drop or truncate a pre-existing table.
    schema = "test_" + uuid4().hex
    admin = make_engine(url)
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    scoped_url = make_url(url).update_query_dict(
        {
            "options": (
                f"-csearch_path={schema} -clock_timeout=5000 -cstatement_timeout=10000"
            )
        }
    )
    scoped = make_engine(scoped_url.render_as_string(hide_password=False))
    try:
        with scoped.begin() as connection:
            command.upgrade(migration_config(connection), "head")
        yield scoped
    finally:
        scoped.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()
