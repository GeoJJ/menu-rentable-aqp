from datetime import date
from decimal import Decimal
import pytest
from app.services.demand_forecast import DemandForecaster
from app.services.inventory import InventoryCalculator


def prepare(api):
    ingredient = api.post(
        "/api/ingredients", json={"nombre": "Arroz", "unidad_codigo": "kg"}
    ).json()["id"]
    for recipe_id in [1, 2, 3]:
        response = api.put(
            f"/api/recipes/{recipe_id}",
            json={
                "nombre": str(recipe_id),
                "categoria": {1: "caldo", 2: "segundo", 3: "refresco"}[recipe_id],
                "rendimiento": 10,
                "preparacion": "Prueba",
                "ingredientes": [{"ingrediente_id": ingredient, "cantidad": "1"}],
            },
        )
        assert response.status_code == 200, response.text
    menu = api.post(
        "/api/menus",
        json={"nombre": "Completo", "precio_menu": "12", "recetas": [1, 2, 3]},
    ).json()["id"]
    plan = api.post(
        f"/api/menus/{menu}/plans",
        json={
            "fecha": "2026-11-20",
            "cantidad": 10,
            "presupuesto": 100,
            "insumos": {
                str(ingredient): {
                    "existencia": "1",
                    "costo_unitario": "2",
                    "precio_compra": "3",
                }
            },
        },
    )
    assert plan.status_code == 201, plan.text
    return ingredient, menu, plan.json()["id"]


def test_close_rollback_purchase_idempotency_and_report(client):
    api, c = client
    ingredient, menu, plan = prepare(api)
    closing = {
        "preparadas": 10,
        "vendidas": 8,
        "precio_menu_real": "12",
        "gastos_adicionales": "5",
    }
    # La falta de stock no deja ni registro diario ni movimientos parciales.
    assert api.post(f"/api/menu-plans/{plan}/close", json=closing).status_code == 422
    with c() as db:
        assert db.execute("SELECT count(*) FROM registros_diarios").fetchone()[0] == 0
        assert db.execute("SELECT existencia FROM inventario").fetchone()[0] == 1
    purchase = api.post(
        "/api/inventory/movements",
        json={
            "ingrediente_id": ingredient,
            "tipo": "compra",
            "cantidad": "3",
            "costo_unitario": "4",
            "motivo": "Compra real",
        },
    )
    assert purchase.status_code == 201, purchase.text
    closed = api.post(f"/api/menu-plans/{plan}/close", json=closing)
    assert closed.status_code == 201, closed.text
    result = closed.json()
    assert Decimal(str(result["ingreso_real"])) == 96
    assert Decimal(str(result["costo_ingredientes_real"])) == Decimal("10.5")
    assert Decimal(str(result["margen_real"])) == Decimal("80.5")
    assert result["sobrantes"] == 2
    assert api.post(f"/api/menu-plans/{plan}/close", json=closing).status_code == 422
    assert (
        api.post(
            f"/api/menu-plans/{plan}/cancel", json={"motivo": "Prueba"}
        ).status_code
        == 422
    )
    with c() as db:
        assert db.execute("SELECT existencia FROM inventario").fetchone()[0] == 1
        assert (
            db.execute(
                "SELECT count(*) FROM movimientos_inventario WHERE tipo='consumo'"
            ).fetchone()[0]
            == 1
        )
    report = api.get("/api/reports/results?desde=2026-11-01&hasta=2026-11-30").json()
    assert report["dias_cerrados"] == 1
    assert Decimal(str(report["margen_real"])) == Decimal("80.5")
    csv = api.get("/api/reports/results.csv?desde=2026-11-01&hasta=2026-11-30")
    assert csv.status_code == 200 and "80.5000" in csv.text
    forecast = api.get(f"/api/menus/{menu}/forecast?fecha=2026-11-27").json()
    assert forecast["cantidad_sugerida"] == 8 and forecast["muestras"] == 1


def test_cancel_and_input_validation(client):
    api, c = client
    ingredient, menu, plan = prepare(api)
    assert (
        api.post(
            f"/api/menu-plans/{plan}/close",
            json={"preparadas": 5, "vendidas": 6, "precio_menu_real": 12},
        ).status_code
        == 422
    )
    assert (
        api.post(
            "/api/inventory/movements",
            json={
                "ingrediente_id": ingredient,
                "tipo": "merma",
                "cantidad": 10,
                "motivo": "Prueba",
            },
        ).status_code
        == 422
    )
    assert (
        api.post(
            f"/api/menu-plans/{plan}/cancel", json={"motivo": "No se abrirá el negocio"}
        ).status_code
        == 200
    )
    assert (
        api.post(
            f"/api/menu-plans/{plan}/close",
            json={"preparadas": 0, "vendidas": 0, "precio_menu_real": 12},
        ).status_code
        == 422
    )
    assert (
        api.get("/api/reports/results?desde=2026-12-01&hasta=2026-11-01").status_code
        == 422
    )


def test_forecast_uses_only_previous_matching_weekdays():
    rows = [
        {"fecha": date(2026, 11, 27), "vendidas": 1000, "preparadas": 1000},
        {"fecha": date(2026, 11, 20), "vendidas": 20, "preparadas": 20},
        {"fecha": date(2026, 11, 19), "vendidas": 100, "preparadas": 100},
    ]
    result = DemandForecaster.forecast(rows, date(2026, 11, 27))
    assert result["cantidad_sugerida"] == 20 and result["agotamientos"] == 1
    assert (
        DemandForecaster.forecast([], date(2026, 11, 27))["cantidad_sugerida"] is None
    )


def test_purchase_cost_is_weighted():
    stock, cost = InventoryCalculator.purchase(
        Decimal(1), Decimal(2), Decimal(3), Decimal(4)
    )
    assert stock == 4 and cost == Decimal("3.5")
    with pytest.raises(ValueError):
        InventoryCalculator.consume(Decimal(1), Decimal(2))


def test_late_stock_failure_rolls_back_previous_ingredient(client):
    api, c = client
    ingredient, menu, plan = prepare(api)
    with c() as db:
        second = db.execute(
            "INSERT INTO ingredientes(nombre,unidad_codigo) VALUES ('Segundo','kg') RETURNING id"
        ).fetchone()[0]
        db.execute("INSERT INTO inventario VALUES (%s,0,1,now())", (second,))
        db.execute(
            "INSERT INTO plan_insumos(plan_id,ingrediente_id,nombre_ingrediente,unidad_codigo,necesario,existencia_inicial,faltante,costo_existencia_unitario,envases,costo_consumido) VALUES (%s,%s,'Segundo','kg',1,0,1,1,0,1)",
            (plan, second),
        )
        db.execute(
            "UPDATE inventario SET existencia=10 WHERE ingrediente_id=%s", (ingredient,)
        )
    response = api.post(
        f"/api/menu-plans/{plan}/close",
        json={"preparadas": 10, "vendidas": 10, "precio_menu_real": 12},
    )
    assert response.status_code == 422
    with c() as db:
        assert (
            db.execute(
                "SELECT existencia FROM inventario WHERE ingrediente_id=%s",
                (ingredient,),
            ).fetchone()[0]
            == 10
        )
        assert (
            db.execute(
                "SELECT count(*) FROM movimientos_inventario WHERE tipo='consumo'"
            ).fetchone()[0]
            == 0
        )
        assert db.execute("SELECT count(*) FROM registros_diarios").fetchone()[0] == 0


def test_new_plan_does_not_reset_real_stock(client):
    api, c = client
    ingredient, menu, plan = prepare(api)
    api.post(
        "/api/inventory/movements",
        json={
            "ingrediente_id": ingredient,
            "tipo": "compra",
            "cantidad": 3,
            "costo_unitario": 4,
            "motivo": "Compra real",
        },
    )
    response = api.post(
        f"/api/menus/{menu}/plans",
        json={
            "fecha": "2026-11-21",
            "cantidad": 10,
            "presupuesto": 100,
            "insumos": {
                str(ingredient): {
                    "existencia": 100,
                    "costo_unitario": 1,
                    "precio_compra": 1,
                }
            },
        },
    )
    assert response.status_code == 201
    with c() as db:
        assert (
            db.execute(
                "SELECT existencia FROM inventario WHERE ingrediente_id=%s",
                (ingredient,),
            ).fetchone()[0]
            == 4
        )


def test_concurrent_closings_only_consume_once(client):
    from concurrent.futures import ThreadPoolExecutor

    api, connection = client
    ingredient, menu, plan = prepare(api)
    with connection() as c:
        c.execute(
            "UPDATE inventario SET existencia=10 WHERE ingrediente_id=%s", (ingredient,)
        )
    payload = {"preparadas": 10, "vendidas": 8, "precio_menu_real": "12"}
    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(
            executor.map(
                lambda _: api.post(
                    f"/api/menu-plans/{plan}/close", json=payload
                ).status_code,
                range(2),
            )
        )
    assert sorted(statuses) == [201, 422]
    with connection() as c:
        assert (
            c.execute(
                "SELECT existencia FROM inventario WHERE ingrediente_id=%s",
                (ingredient,),
            ).fetchone()[0]
            == 7
        )
        assert c.execute("SELECT count(*) FROM registros_diarios").fetchone()[0] == 1


def test_purchase_accepts_total_paid_and_converts_in_python(client):
    api, connection = client
    ingredient, menu, plan = prepare(api)
    response = api.post(
        "/api/inventory/movements",
        json={
            "ingrediente_id": ingredient,
            "tipo": "compra",
            "cantidad": "5",
            "importe_total": "20",
            "motivo": "Bolsa de arroz",
        },
    )
    assert response.status_code == 201, response.text
    assert Decimal(str(response.json()["costo_unitario"])) == 4
    assert Decimal(str(response.json()["saldo"])) == 6
    with connection() as c:
        assert c.execute(
            "SELECT costo_unitario FROM inventario WHERE ingrediente_id=%s",
            (ingredient,),
        ).fetchone()[0] == Decimal("3.66666667")
        assert (
            c.execute(
                "SELECT precio FROM cotizaciones ORDER BY id DESC LIMIT 1"
            ).fetchone()[0]
            == 4
        )
    for body in [
        {"tipo": "compra", "importe_total": "-1"},
        {"tipo": "compra", "importe_total": "20", "costo_unitario": "4"},
        {"tipo": "merma", "importe_total": "20"},
    ]:
        assert (
            api.post(
                "/api/inventory/movements",
                json={
                    "ingrediente_id": ingredient,
                    "cantidad": 1,
                    "motivo": "Prueba",
                    **body,
                },
            ).status_code
            == 422
        )


def test_closing_preview_does_not_write_and_close_rechecks_stock(client):
    api, connection = client
    ingredient, menu, plan = prepare(api)
    closing = {
        "preparadas": 10,
        "vendidas": 8,
        "precio_menu_real": "12",
        "gastos_adicionales": "5",
    }
    preview = api.post(f"/api/menu-plans/{plan}/closing-preview", json=closing)
    assert preview.status_code == 200, preview.text
    result = preview.json()
    assert not result["puede_cerrar"] and result["resultado"] is None
    assert Decimal(str(result["insumos"][0]["faltante"])) == 2
    with connection() as c:
        assert c.execute("SELECT count(*) FROM registros_diarios").fetchone()[0] == 0
        assert c.execute("SELECT existencia FROM inventario").fetchone()[0] == 1
        assert (
            c.execute("SELECT count(*) FROM movimientos_inventario").fetchone()[0] == 0
        )
    api.post(
        "/api/inventory/movements",
        json={
            "ingrediente_id": ingredient,
            "tipo": "compra",
            "cantidad": 3,
            "importe_total": 12,
            "motivo": "Compra real",
        },
    )
    result = api.post(f"/api/menu-plans/{plan}/closing-preview", json=closing).json()
    assert result["puede_cerrar"]
    assert Decimal(str(result["resultado"]["margen_real"])) == Decimal("80.5")
    # Una vista previa no reserva stock ni descuenta: se valida otra vez al confirmar.
    api.post(
        "/api/inventory/movements",
        json={
            "ingrediente_id": ingredient,
            "tipo": "merma",
            "cantidad": 2,
            "motivo": "Se perdió ingrediente",
        },
    )
    response = api.post(f"/api/menu-plans/{plan}/close", json=closing)
    assert response.status_code == 422 and "Arroz" in response.json()["detail"]
    with connection() as c:
        assert c.execute("SELECT count(*) FROM registros_diarios").fetchone()[0] == 0
        assert c.execute("SELECT existencia FROM inventario").fetchone()[0] == 2
