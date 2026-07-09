"""
Light, additive-only SQLite migrations.

No Alembic in this project — new tables are created by Base.metadata.create_all,
but SQLAlchemy never adds columns to existing tables. This module fills that gap
with idempotent `ALTER TABLE ... ADD COLUMN` calls, safe to run on every startup.
"""

from sqlalchemy import text
from sqlalchemy.engine import Engine

NEW_COLUMNS: dict[str, dict[str, str]] = {
    "transactions": {
        "account_id": "TEXT",
        "party_id": "TEXT",
        "tax_relevant": "BOOLEAN DEFAULT 0",
        "withholding_tax_amount": "FLOAT",
        "vat_amount": "FLOAT",
        "source": "TEXT DEFAULT 'manual'",
    },
    "documents": {
        "document_type": "TEXT DEFAULT 'slip'",
        "project_id": "TEXT",
    },
}


def run_light_migrations(engine: Engine) -> None:
    """Add any missing columns listed in NEW_COLUMNS. Never drops or renames."""
    with engine.connect() as conn:
        for table, columns in NEW_COLUMNS.items():
            existing = {
                row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))
            }
            for col, ddl_type in columns.items():
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl_type}"))
        conn.commit()
