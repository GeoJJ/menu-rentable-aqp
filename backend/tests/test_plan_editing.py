"""Ediciones reales en PostgreSQL: historial, atomicidad y concurrencia."""

from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from test_reports_and_editing import saved_plan


def update_input(original_menu_id, **changes):
    return {
        "menu_id": original_menu_id,
        "version": 1,
        "motivo": "Recibí una reserva adicional",
        "fecha": "2026-11-21",
        "cantidad": 20,
        "presupuesto": "150",
        "insumos": {
            "1": {"existencia": "0", "costo_unitario": "0", "precio_compra": "3"}
        },
        **changes,
    }


def test_edit_recalculates_same_plan_and_preserves_full_history_without_stock_changes(
    client,
):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    other = api.post(
        "/api/menus",
        json={"nombre": "Otra combinación", "precio_menu": "20", "recetas": [4, 2, 3]},
    ).json()
    data = update_input(other["id"])
    preview = api.post(f'/api/menus/{other["id"]}/calculate', json=data)
    assert preview.status_code == 200, preview.text
    assert api.get(f'/api/menu-plans/{plan["id"]}/revisions').json()["revisiones"] == []
    response = api.put(f'/api/menu-plans/{plan["id"]}', json=data)
    assert response.status_code == 200, response.text
    edited = response.json()
    assert edited["id"] == plan["id"] and edited["version"] == 2
    assert edited["fecha"] == data["fecha"] and edited["cantidad"] == 20
    assert (
        edited["menu"]["id"] == other["id"]
        and Decimal(str(edited["presupuesto"])) == 150
    )
    for field in ("compra", "costo_ingredientes", "margen_estimado"):
        assert Decimal(str(edited[field])) == Decimal(str(preview.json()[field]))
    assert Decimal(str(edited["costo_ingredientes"])) == 24
    assert Decimal(str(edited["margen_estimado"])) == 376
    revision = api.get(f'/api/menu-plans/{plan["id"]}/revisions').json()["revisiones"][
        0
    ]
    assert revision["version"] == 1 and revision["motivo"] == data["motivo"]
    original = revision["resumen"]
    assert original["menu"]["nombre"] == plan["menu"]["nombre"]
    assert (
        original["fecha"] == plan["fecha"] and original["cantidad"] == plan["cantidad"]
    )
    assert Decimal(original["costo_ingredientes"]) == Decimal(
        str(plan["costo_ingredientes"])
    )
    assert Decimal(original["menu"]["precio_menu"]) == 12
    with connection() as c:
        assert c.execute(
            "SELECT existencia,costo_unitario FROM inventario"
        ).fetchone() == (10, 2)
        assert (
            c.execute("SELECT count(*) FROM movimientos_inventario").fetchone()[0] == 0
        )
        snapshot = c.execute("SELECT datos FROM plan_revisiones").fetchone()[0]
        assert len(snapshot["plan_platos"]) == 3
        assert snapshot["plan_insumos"][0]["existencia_inicial"] == "10.0000"
        assert c.execute("SELECT count(*) FROM planes_diarios").fetchone()[0] == 1
    # El historial conserva los nombres y precios originales tras otro cambio del catálogo.
    api.put(
        f'/api/menus/{menu["id"]}',
        json={"nombre": "Otro nombre", "precio_menu": "99", "recetas": [4, 2, 3]},
    )
    assert (
        api.get(f'/api/menu-plans/{plan["id"]}/revisions').json()["revisiones"][0]
        == revision
    )


def test_failed_edits_keep_plan_and_history_intact(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    other_data = update_input(menu["id"], fecha="2026-11-22")
    assert (
        api.post(f'/api/menus/{menu["id"]}/plans', json=other_data).status_code == 201
    )
    for changes in (
        {"fecha": "2026-11-22"},
        {"presupuesto": "0"},
        {"menu_id": 999},
        {"insumos": {}},
        {"motivo": "   "},
        {"motivo": "a" * 501},
    ):
        response = api.put(
            f'/api/menu-plans/{plan["id"]}', json=update_input(menu["id"], **changes)
        )
        assert response.status_code == 422, response.text
        assert api.get(f'/api/menu-plans/{plan["id"]}').json() == plan
        assert (
            api.get(f'/api/menu-plans/{plan["id"]}/revisions').json()["revisiones"]
            == []
        )
    # Fallo después de insertar el historial y borrar los detalles: también revierte todo.
    with connection() as c:
        c.execute(
            "UPDATE oferta_componentes SET porciones_por_menu=0.5 WHERE receta_id=1"
        )
    response = api.put(
        f'/api/menu-plans/{plan["id"]}', json=update_input(menu["id"], cantidad=11)
    )
    assert response.status_code == 422, response.text
    assert api.get(f'/api/menu-plans/{plan["id"]}').json() == plan
    with connection() as c:
        assert c.execute("SELECT count(*) FROM plan_revisiones").fetchone()[0] == 0
        assert (
            c.execute(
                "SELECT count(*) FROM plan_oferta_componentes WHERE plan_id=%s",
                (plan["id"],),
            ).fetchone()[0]
            == 3
        )


@pytest.mark.parametrize("state", ["cerrado", "cancelado"])
def test_closed_or_cancelled_plans_cannot_be_edited(client, state):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    if state == "cerrado":
        response = api.post(
            f'/api/menu-plans/{plan["id"]}/close',
            json={
                "preparadas": 10,
                "vendidas": 8,
                "precio_menu_real": "12",
                "gastos_adicionales": "5",
            },
        )
        assert response.status_code == 201, response.text
    else:
        with connection() as c:
            c.execute(
                "UPDATE planes_diarios SET estado='cancelado' WHERE id=%s",
                (plan["id"],),
            )
    before = api.get(f'/api/menu-plans/{plan["id"]}').json()
    response = api.put(f'/api/menu-plans/{plan["id"]}', json=update_input(menu["id"]))
    assert response.status_code == 422 and "pendiente" in response.text
    assert api.get(f'/api/menu-plans/{plan["id"]}').json() == before
    assert api.get(f'/api/menu-plans/{plan["id"]}/revisions').json()["revisiones"] == []


def test_same_date_multiple_revisions_and_stale_edit_rejected(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    path = f'/api/menu-plans/{plan["id"]}'
    data = update_input(menu["id"], fecha=plan["fecha"])
    assert api.put(path, json=data).status_code == 200
    stale = api.put(path, json=data)
    assert stale.status_code == 422 and "cambió" in stale.text
    data.update(version=2, cantidad=30, motivo="Ajuste de cantidad confirmado")
    response = api.put(path, json=data)
    assert response.status_code == 200, response.text
    assert response.json()["version"] == 3
    history = api.get(path + "/revisions").json()
    assert history["version_actual"] == 3
    assert [r["version"] for r in history["revisiones"]] == [2, 1]
    assert history["revisiones"][0]["resumen"]["cantidad"] == 20


def test_two_concurrent_edits_do_not_overwrite_each_other(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    path = f'/api/menu-plans/{plan["id"]}'
    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(
            executor.map(
                lambda qty: api.put(path, json=update_input(menu["id"], cantidad=qty)),
                [20, 30],
            )
        )
    assert sorted(r.status_code for r in responses) == [200, 422]
    successful = next(r.json() for r in responses if r.status_code == 200)
    assert api.get(path).json() == successful
    assert len(api.get(path + "/revisions").json()["revisiones"]) == 1
    assert (
        api.put("/api/menu-plans/999", json=update_input(menu["id"])).status_code == 422
    )
    assert api.get("/api/menu-plans/999/revisions").status_code == 422


def test_closing_preview_from_an_older_plan_version_cannot_apply_consumption(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    path = f'/api/menu-plans/{plan["id"]}'
    closing = {"preparadas": 10, "vendidas": 8, "precio_menu_real": "12"}
    preview = api.post(path + "/closing-preview", json=closing)
    assert preview.status_code == 200, preview.text
    assert api.put(path, json=update_input(menu["id"])).status_code == 200
    response = api.post(path + "/close", json=preview.json()["datos"])
    assert response.status_code == 422 and "versión" in response.text
    with connection() as c:
        assert c.execute("SELECT count(*) FROM registros_diarios").fetchone()[0] == 0
        assert c.execute("SELECT existencia FROM inventario").fetchone()[0] == 10
    # La misma operación funciona después de revisar la versión vigente.
    closing["version"] = 2
    assert api.post(path + "/close", json=closing).status_code == 201
