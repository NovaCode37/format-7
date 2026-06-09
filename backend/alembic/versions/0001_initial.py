from __future__ import annotations

from alembic import op
from sqlalchemy import inspect

import models
from database import Base

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing = set(inspector.get_table_names())
    tables_to_create = [
        t for t in Base.metadata.sorted_tables if t.name not in existing
    ]
    if tables_to_create:
        Base.metadata.create_all(bind=bind, tables=tables_to_create)

def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
