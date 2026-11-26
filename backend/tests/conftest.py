"""Base aislada por prueba; nunca se escriben menús en el esquema del negocio."""

import os
import uuid
from pathlib import Path

import psycopg
import pytest
from app.main import app
from app.repositories import menus
from fastapi.testclient import TestClient


@pytest.fixture
def client(monkeypatch):
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requiere TEST_DATABASE_URL")
    schema = "test_menu_" + uuid.uuid4().hex
    with psycopg.connect(url, autocommit=True) as c:
        c.execute(
            psycopg.sql.SQL("CREATE SCHEMA {}").format(psycopg.sql.Identifier(schema))
        )

    def connection():
        return psycopg.connect(url, options=f"-c search_path={schema}")

    try:
        with connection() as c:
            c.execute(
                (
                    Path(__file__).resolve().parents[2]
                    / "database/migrations/001_relacional_menu.sql"
                ).read_text(encoding="utf-8-sig")
            )
            c.execute(
                (
                    Path(__file__).resolve().parents[2]
                    / "database/migrations/003_operacion_diaria.sql"
                ).read_text(encoding="utf-8-sig")
            )
            c.execute(
                (
                    Path(__file__).resolve().parents[2]
                    / "database/migrations/005_edicion_planes.sql"
                ).read_text(encoding="utf-8-sig")
            )
            for category in ["caldo", "segundo", "refresco"]:
                c.execute(
                    "INSERT INTO recetas(nombre,categoria,rendimiento) VALUES (%s,%s,10)",
                    (category, category),
                )
        monkeypatch.setattr(menus, "connect", connection)
        from app.repositories import catalog, menu_plans, operations, sources
        from app.services import source_refresh

        for module in (catalog, menu_plans, operations, sources, source_refresh):
            monkeypatch.setattr(module, "connect", connection)
        yield TestClient(app), connection
    finally:
        with psycopg.connect(url, autocommit=True) as c:
            c.execute(
                psycopg.sql.SQL("DROP SCHEMA {} CASCADE").format(
                    psycopg.sql.Identifier(schema)
                )
            )
