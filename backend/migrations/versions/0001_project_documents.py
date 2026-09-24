"""Store versioned project files and project membership."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "projects",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("owner_id", sa.Text(), nullable=False),
        sa.Column("revision", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("document", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("length(id) > 0", name="projects_id_nonempty"),
        sa.CheckConstraint("length(owner_id) > 0", name="projects_owner_nonempty"),
        sa.CheckConstraint("revision >= 0", name="projects_revision_nonnegative"),
        sa.CheckConstraint(
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
    )
    op.create_index(
        "ix_projects_owner_updated", "projects", ["owner_id", "updated_at", "id"]
    )
    op.create_table(
        "project_members",
        sa.Column(
            "project_id",
            sa.Text(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("user_id", sa.Text(), primary_key=True),
        sa.Column("role", sa.Text(), nullable=False),
        sa.CheckConstraint("role IN ('viewer', 'editor')", name="members_role"),
        sa.CheckConstraint("length(user_id) > 0", name="members_user_nonempty"),
    )
    op.create_index(
        "ix_project_members_user", "project_members", ["user_id", "project_id"]
    )


def downgrade():
    op.drop_table("project_members")
    op.drop_table("projects")
