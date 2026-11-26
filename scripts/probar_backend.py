"""Ejecuta pruebas en una base exclusiva, nunca en la base del negocio."""

import os
from pathlib import Path
import psycopg
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from dotenv import load_dotenv
import pytest

ROOT = Path(__file__).resolve().parents[1]


def main():
    load_dotenv(ROOT / ".env")
    production = conninfo_to_dict(os.environ["DATABASE_URL"])
    target = os.getenv("TEST_DATABASE_URL")
    if not target:
        options = {**production, "dbname": "menu_rentable_backend_test"}
        if production.get("dbname") == options["dbname"]:
            raise SystemExit("La base del negocio no puede usarse como base de pruebas")
        with psycopg.connect(
            **{**production, "dbname": "postgres"}, autocommit=True
        ) as c:
            if not c.execute(
                "SELECT 1 FROM pg_database WHERE datname=%s", (options["dbname"],)
            ).fetchone():
                c.execute("CREATE DATABASE menu_rentable_backend_test")
        target = make_conninfo(**options)
    test = conninfo_to_dict(target)
    if (
        test.get("dbname") == production.get("dbname")
        or "test" not in test.get("dbname", "").lower()
    ):
        raise SystemExit(
            "TEST_DATABASE_URL debe señalar una base distinta y con test en el nombre"
        )
    os.environ["TEST_DATABASE_URL"] = target
    os.chdir(ROOT)
    raise SystemExit(pytest.main(["backend/tests", "-q"]))


if __name__ == "__main__":
    main()
