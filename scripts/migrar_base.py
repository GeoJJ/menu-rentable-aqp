"""Aplica migraciones versionadas sin borrar las tablas existentes."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.db.connection import connect
from dotenv import load_dotenv


def main():
    load_dotenv(ROOT / ".env")
    with connect() as connection:
        connection.autocommit = True
        connection.execute("SELECT pg_advisory_lock(27112026)")
        try:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
            )
            for migration in sorted((ROOT / "database/migrations").glob("*.sql")):
                if connection.execute(
                    "SELECT 1 FROM schema_migrations WHERE version=%s",
                    (migration.stem,),
                ).fetchone():
                    print(f"{migration.stem}: ya aplicada")
                    continue
                connection.execute(migration.read_text(encoding="utf-8-sig"))
                print(f"{migration.stem}: aplicada")
        finally:
            connection.execute("SELECT pg_advisory_unlock(27112026)")


if __name__ == "__main__":
    main()
