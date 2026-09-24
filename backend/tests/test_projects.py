from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from queue import Queue
from threading import Barrier
from time import monotonic, sleep

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from conftest import migration_config
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.db.models import Base, ProjectMember, ProjectRecord
from backend.db.projects import (
    ProjectNotFound,
    ProjectPermissionDenied,
    ProjectRepository,
    RevisionConflict,
)


def create_project(engine, document):
    with Session(engine) as session, session.begin():
        return ProjectRepository(session, actor_id="owner").create(document)


def test_round_trip_preserves_entire_file(engine, document):
    document["project"]["revision"] = 42
    document["project"]["ownerId"] = "untrusted-file-owner"
    document["project"]["bom"]["manualItems"] = [
        {"id": "m1", "name": "케이블", "quantity": 2}
    ]
    document["parts"] = [{"id": "part1", "imageAssetId": "asset1"}]
    document["assets"] = [{"id": "asset1", "storageKey": "reference-only"}]
    second = deepcopy(document["project"]["sheets"][0])
    second["id"] = "sheet2"
    second["annotations"] = [{"id": "a1", "text": "연결 확인", "x": 1, "y": 2}]
    document["project"]["sheets"].append(second)
    document["extension"] = {"keep": ["future", 1]}
    stored = create_project(engine, document)
    assert stored.revision == 0
    assert stored.owner_id == "owner"
    with Session(engine) as session:
        loaded = ProjectRepository(session, actor_id="owner").get(stored.id)
        assert loaded.document == document
        assert loaded.created_at.tzinfo is not None
        # Returned documents are detached copies, not mutable ORM state.
        loaded.document["project"]["name"] = "not saved"
        assert (
            ProjectRepository(session, actor_id="owner").get(stored.id).document
            == document
        )
    with Session(engine) as session:
        with pytest.raises(ProjectNotFound):
            ProjectRepository(session, actor_id="untrusted-file-owner").get(stored.id)


def test_save_updates_document_and_server_revision_atomically(engine, document):
    stored = create_project(engine, document)
    document["project"]["name"] = "변경된 이름"
    with Session(engine) as session, session.begin():
        saved = ProjectRepository(session, actor_id="owner").save(
            stored.id, document, expected_revision=0
        )
        assert saved.revision == 1
        assert saved.document == document
        assert saved.updated_at >= saved.created_at
    with Session(engine) as session, session.begin():
        repo = ProjectRepository(session, actor_id="owner")
        with pytest.raises(RevisionConflict) as conflict:
            repo.save(stored.id, document, expected_revision=0)
        assert conflict.value.actual == 1
        assert repo.get(stored.id).document == document


def test_transaction_failure_rolls_back_document_revision_and_members(engine, document):
    stored = create_project(engine, document)
    changed = deepcopy(document)
    changed["project"]["name"] = "must roll back"
    with pytest.raises(RuntimeError), Session(engine) as session, session.begin():
        repo = ProjectRepository(session, actor_id="owner")
        repo.save(stored.id, changed, expected_revision=0)
        repo.set_member(stored.id, "reader", "viewer")
        raise RuntimeError("later service step failed")
    with Session(engine) as session:
        loaded = ProjectRepository(session, actor_id="owner").get(stored.id)
        assert loaded.revision == 0
        assert loaded.document == document
        assert session.scalar(select(func.count()).select_from(ProjectMember)) == 0


@pytest.mark.parametrize("actor", ["stranger", "viewer", "editor"])
def test_access_rules(engine, document, actor):
    stored = create_project(engine, document)
    with Session(engine) as session, session.begin():
        repo = ProjectRepository(session, actor_id="owner")
        repo.set_member(stored.id, "viewer", "viewer")
        repo.set_member(stored.id, "editor", "editor")
    with Session(engine) as session, session.begin():
        repo = ProjectRepository(session, actor_id=actor)
        assert len(repo.list()) == (0 if actor == "stranger" else 1)
        if actor == "stranger":
            with pytest.raises(ProjectNotFound):
                repo.get(stored.id)
        else:
            assert repo.get(stored.id).document == document
        if actor == "editor":
            repo.save(stored.id, document, expected_revision=0)
        else:
            error = ProjectNotFound if actor == "stranger" else ProjectPermissionDenied
            with pytest.raises(error):
                repo.save(stored.id, document, expected_revision=0)
        error = ProjectNotFound if actor == "stranger" else ProjectPermissionDenied
        with pytest.raises(error):
            repo.set_member(stored.id, "intruder", "editor")
        with pytest.raises(error):
            repo.remove_member(stored.id, "viewer")
        with pytest.raises(error):
            repo.delete(stored.id, expected_revision=0)


def test_membership_changes_and_delete_cascade(engine, document):
    stored = create_project(engine, document)
    with Session(engine) as session, session.begin():
        repo = ProjectRepository(session, actor_id="owner")
        repo.set_member(stored.id, "member", "editor")
        repo.set_member(stored.id, "member", "viewer")
    with Session(engine) as session, session.begin():
        with pytest.raises(ProjectPermissionDenied):
            ProjectRepository(session, actor_id="member").save(
                stored.id, document, expected_revision=0
            )
    with Session(engine) as session, session.begin():
        ProjectRepository(session, actor_id="owner").remove_member(stored.id, "member")
    with Session(engine) as session:
        assert ProjectRepository(session, actor_id="member").list() == []
    with Session(engine) as session, session.begin():
        repo = ProjectRepository(session, actor_id="owner")
        repo.set_member(stored.id, "member", "viewer")
        with pytest.raises(RevisionConflict):
            repo.delete(stored.id, expected_revision=1)
        repo.delete(stored.id, expected_revision=0)
    with Session(engine) as session:
        assert session.scalar(select(func.count()).select_from(ProjectMember)) == 0
        assert ProjectRepository(session, actor_id="owner").list() == []


@pytest.mark.parametrize("kind", ["duplicate", "missing_project", "invalid_role"])
def test_database_rejects_invalid_membership(engine, document, kind):
    stored = create_project(engine, document)
    with Session(engine) as session, session.begin():
        ProjectRepository(session, actor_id="owner").set_member(
            stored.id, "member", "viewer"
        )
    with pytest.raises(IntegrityError), Session(engine) as session, session.begin():
        session.add(
            ProjectMember(
                project_id="missing" if kind == "missing_project" else stored.id,
                user_id="other" if kind == "invalid_role" else "member",
                role="admin" if kind == "invalid_role" else "viewer",
            )
        )
        session.flush()


@pytest.mark.parametrize(
    "kind", ["empty", "version", "id", "sheets", "assets", "revision"]
)
def test_database_enforces_envelope_and_revision(engine, document, kind):
    project_id = document["project"]["id"]
    if kind == "empty":
        document = {}
    elif kind == "version":
        document["version"] = 2
    elif kind == "id":
        document["project"]["id"] = "mismatch"
    elif kind == "sheets":
        document["project"]["sheets"] = []
    elif kind == "assets":
        del document["assets"]
    with pytest.raises(IntegrityError), Session(engine) as session, session.begin():
        session.add(
            ProjectRecord(
                id=project_id,
                owner_id="owner",
                document=document,
                revision=-1 if kind == "revision" else 0,
            )
        )
        session.flush()


def test_concurrent_saves_have_exactly_one_winner(engine, document):
    stored = create_project(engine, document)
    ready = Barrier(2)

    def save(name):
        edited = deepcopy(document)
        edited["project"]["name"] = name
        with Session(engine) as session, session.begin():
            repo = ProjectRepository(session, actor_id="owner")
            assert repo.get(stored.id).revision == 0
            ready.wait(timeout=5)
            try:
                repo.save(stored.id, edited, expected_revision=0)
                return name
            except RevisionConflict:
                return None

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(save, ["tab-a", "tab-b"]))
    winners = [value for value in results if value is not None]
    assert len(winners) == 1
    with Session(engine) as session:
        loaded = ProjectRepository(session, actor_id="owner").get(stored.id)
        assert loaded.revision == 1
        assert loaded.document["project"]["name"] == winners[0]


def test_revocation_blocks_save_already_waiting_for_project_lock(engine, document):
    stored = create_project(engine, document)
    with Session(engine) as session, session.begin():
        ProjectRepository(session, actor_id="owner").set_member(
            stored.id, "editor", "editor"
        )
    pid_queue = Queue()

    def editor_save():
        with Session(engine) as session, session.begin():
            pid_queue.put(session.scalar(text("SELECT pg_backend_pid()")))
            with pytest.raises(ProjectNotFound):
                ProjectRepository(session, actor_id="editor").save(
                    stored.id, document, expected_revision=0
                )

    with ThreadPoolExecutor(max_workers=1) as pool:
        with Session(engine) as session, session.begin():
            ProjectRepository(session, actor_id="owner").remove_member(
                stored.id, "editor"
            )
            future = pool.submit(editor_save)
            pid = pid_queue.get(timeout=5)
            # Ensure the editor's SELECT began while the old membership was
            # still visible and is actually waiting on the owner's row lock.
            deadline = monotonic() + 3
            with engine.connect().execution_options(
                isolation_level="AUTOCOMMIT"
            ) as observer:
                while (
                    observer.scalar(
                        text(
                            "SELECT wait_event_type FROM pg_stat_activity "
                            "WHERE pid = :pid"
                        ),
                        {"pid": pid},
                    )
                    != "Lock"
                ):
                    assert monotonic() < deadline, "Editor did not wait for row lock"
                    sleep(0.01)
        future.result(timeout=5)
    with Session(engine) as session:
        assert ProjectRepository(session, actor_id="owner").get(stored.id).revision == 0


def test_migration_matches_models_and_can_reapply(engine, document):
    create_project(engine, document)
    with engine.begin() as connection:
        assert (
            compare_metadata(MigrationContext.configure(connection), Base.metadata)
            == []
        )
        # Re-running upgrade head preserves stored data.
        command.upgrade(migration_config(connection), "head")
    with Session(engine) as session:
        assert (
            ProjectRepository(session, actor_id="owner")
            .get(document["project"]["id"])
            .document
            == document
        )
    # Downgrade is intentionally destructive and only exercised in our test schema.
    with engine.begin() as connection:
        command.downgrade(migration_config(connection), "base")
        command.upgrade(migration_config(connection), "head")
        assert (
            compare_metadata(MigrationContext.configure(connection), Base.metadata)
            == []
        )
