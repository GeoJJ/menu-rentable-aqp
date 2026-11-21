import os
import uuid
from decimal import Decimal
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
            for category in ["caldo", "segundo", "refresco"]:
                c.execute(
                    "INSERT INTO recetas(nombre,categoria,rendimiento) VALUES (%s,%s,10)",
                    (category, category),
                )
        monkeypatch.setattr(menus, "connect", connection)
        yield TestClient(app), connection
    finally:
        with psycopg.connect(url, autocommit=True) as c:
            c.execute(
                psycopg.sql.SQL("DROP SCHEMA {} CASCADE").format(
                    psycopg.sql.Identifier(schema)
                )
            )


def test_menu_roundtrip_single_price(client):
    api, connection = client
    response = api.post(
        "/api/menus",
        json={"nombre": "Menú de prueba", "precio_menu": "12.50", "recetas": [1, 2, 3]},
    )
    assert response.status_code == 201
    rows = api.get("/api/menus").json()
    assert len(rows) == 1 and Decimal(str(rows[0]["precio_menu"])) == Decimal("12.50")
    assert len(rows[0]["componentes"]) == 3
    assert "precio_venta" not in api.get("/api/recipes").json()[0]
    with connection() as c:
        assert c.execute("SELECT count(*) FROM oferta_componentes").fetchone()[0] == 3


def test_invalid_components_no_partial_write(client):
    api, connection = client
    assert (
        api.post(
            "/api/menus",
            json={"nombre": "Inválido", "precio_menu": 12, "recetas": [1, 2, 999]},
        ).status_code
        == 422
    )
    assert api.get("/api/menus").json() == []


def test_price_and_duplicate_validation(client):
    api, _ = client
    for price, recipes in [
        ("0", [1, 2, 3]),
        ("-1", [1, 2, 3]),
        ("12.345", [1, 2, 3]),
        ("12", [1, 1, 2]),
    ]:
        assert (
            api.post(
                "/api/menus",
                json={"nombre": "Prueba", "precio_menu": price, "recetas": recipes},
            ).status_code
            == 422
        )


def test_complete_menu_price_and_saved_snapshot(client, monkeypatch):
    api, connection = client
    from app.repositories import menu_plans

    monkeypatch.setattr(menu_plans, "connect", connection)
    with connection() as c:
        c.execute(
            "INSERT INTO ingredientes(nombre,unidad_codigo) VALUES ('Arroz','kg')"
        )
        for recipe in [1, 2, 3]:
            c.execute("INSERT INTO receta_ingredientes VALUES (%s,1,1)", (recipe,))
    menu = api.post(
        "/api/menus",
        json={"nombre": "Completo", "precio_menu": "12", "recetas": [1, 2, 3]},
    ).json()
    payload = {
        "fecha": "2026-11-21",
        "cantidad": 30,
        "presupuesto": 100,
        "insumos": {
            "1": {"existencia": "1", "costo_unitario": "2", "precio_compra": "3"}
        },
    }
    response = api.post(f"/api/menus/{menu['id']}/calculate", json=payload)
    assert response.status_code == 200
    r = response.json()
    assert Decimal(str(r["ingreso_estimado"])) == 360
    assert Decimal(str(r["insumos"][0]["necesario"])) == 9
    assert Decimal(str(r["compra"])) == 24
    assert Decimal(str(r["costo_ingredientes"])) == 26
    assert Decimal(str(r["margen_estimado"])) == 334
    assert api.post(f"/api/menus/{menu['id']}/plans", json=payload).status_code == 201
    # Un cambio posterior de precio no altera el histórico.
    with connection() as c:
        c.execute("UPDATE ofertas_menu SET precio_menu=15 WHERE id=%s", (menu["id"],))
        assert (
            c.execute(
                "SELECT existencia FROM inventario WHERE ingrediente_id=1"
            ).fetchone()[0]
            == 1
        )
    saved = api.get("/api/menu-plans").json()[0]
    assert Decimal(str(saved["ingreso_estimado"])) == 360
    assert Decimal(str(saved["precio_menu"])) == 12
    assert api.post(f"/api/menus/{menu['id']}/plans", json=payload).status_code == 422
    with connection() as c:
        assert c.execute("SELECT count(*) FROM planes_diarios").fetchone()[0] == 1
        assert (
            c.execute("SELECT count(*) FROM plan_oferta_componentes").fetchone()[0] == 3
        )
    payload["fecha"] = "2026-11-22"
    payload["presupuesto"] = 1
    assert api.post(f"/api/menus/{menu['id']}/plans", json=payload).status_code == 422
    with connection() as c:
        assert c.execute("SELECT count(*) FROM planes_diarios").fetchone()[0] == 1


def test_incomplete_cost_inputs_block_calculation(client, monkeypatch):
    api, connection = client
    from app.repositories import menu_plans

    monkeypatch.setattr(menu_plans, "connect", connection)
    with connection() as c:
        c.execute(
            "INSERT INTO ingredientes(nombre,unidad_codigo) VALUES ('Arroz','kg')"
        )
        for recipe in [1, 2, 3]:
            c.execute("INSERT INTO receta_ingredientes VALUES (%s,1,1)", (recipe,))
    menu = api.post(
        "/api/menus",
        json={"nombre": "Completo", "precio_menu": "12", "recetas": [1, 2, 3]},
    ).json()
    assert (
        api.post(
            f"/api/menus/{menu['id']}/calculate",
            json={
                "fecha": "2026-11-21",
                "cantidad": 30,
                "presupuesto": 100,
                "insumos": {},
            },
        ).status_code
        == 422
    )
