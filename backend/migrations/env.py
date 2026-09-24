from alembic import context

from backend.db.connection import database_url, make_engine
from backend.db.models import Base


def run_migrations(connection):
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    from sqlalchemy.engine import make_url

    url = make_url(database_url(migration=True)).set(drivername="postgresql+psycopg")
    context.configure(
        url=url,
        target_metadata=Base.metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()
elif context.config.attributes.get("connection") is not None:
    run_migrations(context.config.attributes["connection"])
else:
    engine = make_engine(database_url(migration=True))
    try:
        with engine.connect() as connection:
            run_migrations(connection)
    finally:
        engine.dispose()
