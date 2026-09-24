from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ProjectRecord(Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint("length(id) > 0", name="projects_id_nonempty"),
        CheckConstraint("length(owner_id) > 0", name="projects_owner_nonempty"),
        CheckConstraint("revision >= 0", name="projects_revision_nonnegative"),
        CheckConstraint(
            "(jsonb_typeof(document) = 'object' "
            "AND document->>'format' = 'ezwire-project' "
            "AND document->'version' = '1'::jsonb "
            "AND jsonb_typeof(document->'project') = 'object' "
            "AND jsonb_typeof(document->'project'->'id') = 'string' "
            "AND document->'project'->>'id' = id "
            "AND document->'project'->'formatVersion' = '1'::jsonb "
            "AND jsonb_typeof(document->'project'->'sheets') = 'array' "
            "AND document->'project'->'sheets' <> '[]'::jsonb "
            "AND jsonb_typeof(document->'parts') = 'array' "
            "AND jsonb_typeof(document->'assets') = 'array') IS TRUE",
            name="projects_document_envelope",
        ),
        Index("ix_projects_owner_updated", "owner_id", "updated_at", "id"),
    )

    # Local project IDs are opaque strings (the shipped sample is not a UUID).
    id: Mapped[str] = mapped_column(Text, primary_key=True)
    owner_id: Mapped[str] = mapped_column(Text)
    revision: Mapped[int] = mapped_column(BigInteger, server_default=text("0"))
    document: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (
        CheckConstraint("role IN ('viewer', 'editor')", name="members_role"),
        CheckConstraint("length(user_id) > 0", name="members_user_nonempty"),
        Index("ix_project_members_user", "user_id", "project_id"),
    )

    project_id: Mapped[str] = mapped_column(
        Text, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    role: Mapped[str] = mapped_column(Text)
