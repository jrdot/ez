"""Repository for validated project files and server-managed access metadata.

Call inside ``with Session(engine) as session, session.begin():``. The caller
owns commit/rollback. Actor IDs must come from a trusted authentication service,
never from file contents or an unverified request parameter.
"""

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session

from backend.db.models import ProjectMember, ProjectRecord


class ProjectNotFound(LookupError):
    """Missing and inaccessible projects deliberately share the same error."""


class ProjectPermissionDenied(PermissionError):
    pass


class RevisionConflict(Exception):
    def __init__(self, expected: int, actual: int):
        self.expected = expected
        self.actual = actual
        super().__init__(f"Expected server revision {expected}, found {actual}")


@dataclass(frozen=True)
class StoredProject:
    id: str
    owner_id: str
    revision: int
    document: dict[str, Any]
    created_at: datetime
    updated_at: datetime


def _snapshot(row: ProjectRecord) -> StoredProject:
    return StoredProject(
        row.id,
        row.owner_id,
        row.revision,
        deepcopy(row.document),
        row.created_at,
        row.updated_at,
    )


def _nonempty(value: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("A non-empty identifier is required")


def _project_id(document: dict[str, Any]) -> str:
    """Validate storage envelope only; domain validation belongs to the service."""
    if not isinstance(document, dict):
        raise ValueError("A project file object is required")
    project = document.get("project")
    if (
        document.get("format") != "ezwire-project"
        or type(document.get("version")) is not int
        or document["version"] != 1
        or not isinstance(project, dict)
        or type(project.get("formatVersion")) is not int
        or project["formatVersion"] != 1
        or not isinstance(project.get("sheets"), list)
        or not project["sheets"]
        or not isinstance(document.get("parts"), list)
        or not isinstance(document.get("assets"), list)
    ):
        raise ValueError("Unsupported or incomplete project file envelope")
    identifier = project.get("id")
    _nonempty(identifier)
    return identifier


class ProjectRepository:
    def __init__(self, session: Session, *, actor_id: str):
        _nonempty(actor_id)
        self.session = session
        self.actor_id = actor_id

    def _access(self):
        return or_(
            ProjectRecord.owner_id == self.actor_id,
            exists().where(
                ProjectMember.project_id == ProjectRecord.id,
                ProjectMember.user_id == self.actor_id,
            ),
        )

    def _record(self, project_id: str, *, lock: bool = False) -> ProjectRecord:
        query = (
            select(ProjectRecord)
            .where(ProjectRecord.id == project_id, self._access())
            .execution_options(populate_existing=True)
        )
        if lock:
            query = query.with_for_update()
        row = self.session.scalar(query)
        if row is None:
            raise ProjectNotFound(project_id)
        return row

    def _write_record(self, project_id: str, *, owner_only=False) -> ProjectRecord:
        # All writes (including membership changes) lock the same project row.
        # Recheck membership AFTER acquiring the lock so revocation cannot race
        # with a save that began before the revocation committed.
        row = self._record(project_id, lock=True)
        if row.owner_id == self.actor_id:
            return row
        role = self.session.scalar(
            select(ProjectMember.role).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == self.actor_id,
            )
        )
        if role is None:
            raise ProjectNotFound(project_id)
        if owner_only or role != "editor":
            raise ProjectPermissionDenied(project_id)
        return row

    def create(self, document: dict[str, Any]) -> StoredProject:
        row = ProjectRecord(
            id=_project_id(document),
            owner_id=self.actor_id,
            document=deepcopy(document),
            revision=0,
        )
        self.session.add(row)
        self.session.flush()
        return _snapshot(row)

    def get(self, project_id: str) -> StoredProject:
        return _snapshot(self._record(project_id))

    def list(self, *, limit: int = 50, offset: int = 0) -> list[StoredProject]:
        if not 1 <= limit <= 100 or offset < 0:
            raise ValueError("limit must be 1..100 and offset must be non-negative")
        rows = self.session.scalars(
            select(ProjectRecord)
            .where(self._access())
            .order_by(ProjectRecord.updated_at.desc(), ProjectRecord.id)
            .limit(limit)
            .offset(offset)
            .execution_options(populate_existing=True)
        )
        return [_snapshot(row) for row in rows]

    @staticmethod
    def _check_revision(row: ProjectRecord, expected: int) -> None:
        if type(expected) is not int or expected < 0:
            raise ValueError("expected_revision must be a non-negative integer")
        if row.revision != expected:
            raise RevisionConflict(expected, row.revision)

    def save(
        self, project_id: str, document: dict[str, Any], *, expected_revision: int
    ) -> StoredProject:
        row = self._write_record(project_id)
        self._check_revision(row, expected_revision)
        if _project_id(document) != project_id:
            raise ValueError("Document project ID cannot change")
        row.document = deepcopy(document)
        row.revision += 1
        row.updated_at = func.clock_timestamp()
        self.session.flush()
        return _snapshot(row)

    def set_member(
        self, project_id: str, user_id: str, role: Literal["viewer", "editor"]
    ) -> None:
        row = self._write_record(project_id, owner_only=True)
        _nonempty(user_id)
        if user_id == row.owner_id or role not in ("viewer", "editor"):
            raise ValueError("Owner is stored separately; role must be viewer/editor")
        member = self.session.get(
            ProjectMember, (project_id, user_id), populate_existing=True
        )
        if member is None:
            self.session.add(
                ProjectMember(project_id=project_id, user_id=user_id, role=role)
            )
        else:
            member.role = role
        self.session.flush()

    def remove_member(self, project_id: str, user_id: str) -> None:
        self._write_record(project_id, owner_only=True)
        member = self.session.get(
            ProjectMember, (project_id, user_id), populate_existing=True
        )
        if member is not None:
            self.session.delete(member)
            self.session.flush()

    def delete(self, project_id: str, *, expected_revision: int) -> None:
        row = self._write_record(project_id, owner_only=True)
        self._check_revision(row, expected_revision)
        self.session.delete(row)
        self.session.flush()
