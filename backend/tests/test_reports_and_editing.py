import io
from datetime import date
from decimal import Decimal
from pypdf import PdfReader
from app.services.reports import ReportCalculator
from app.services.pdf_reports import ReportPDFExporter


def saved_plan(api, connection):
    with connection() as c:
        c.execute(
            "INSERT INTO ingredientes(nombre,unidad_codigo) VALUES ('Arroz','kg')"
        )
        for recipe_id in [1, 2, 3]:
            c.execute("INSERT INTO receta_ingredientes VALUES (%s,1,1)", (recipe_id,))
        c.execute(
            "INSERT INTO recetas(nombre,categoria,rendimiento) VALUES ('Otro caldo','caldo',10)"
        )
        c.execute("INSERT INTO receta_ingredientes VALUES (4,1,2)")
    menu = api.post(
        "/api/menus",
        json={"nombre": "Menú original", "precio_menu": "12", "recetas": [1, 2, 3]},
    ).json()
    response = api.post(
        f'/api/menus/{menu["id"]}/plans',
        json={
            "fecha": "2026-11-20",
            "cantidad": 10,
            "presupuesto": 100,
            "insumos": {
                "1": {"existencia": 10, "costo_unitario": 2, "precio_compra": 3}
            },
        },
    )
    assert response.status_code == 201, response.text
    return menu, response.json()


def test_edit_menu_updates_future_requirements_but_keeps_saved_snapshot(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    response = api.put(
        f'/api/menus/{menu["id"]}',
        json={"nombre": "Menú actualizado", "precio_menu": "20", "recetas": [4, 2, 3]},
    )
    assert response.status_code == 200, response.text
    edited = api.get(f'/api/menus/{menu["id"]}').json()
    assert (
        edited["nombre"] == "Menú actualizado"
        and Decimal(str(edited["precio_menu"])) == 20
    )
    assert {r["id"] for r in edited["componentes"]} == {4, 2, 3}
    future = api.get(f'/api/menus/{menu["id"]}/requirements').json()
    assert {r["id"] for r in future["componentes"]} == {4, 2, 3}
    historical = api.get(f'/api/menu-plans/{plan["id"]}').json()
    assert historical["menu"]["nombre"] == "Menú original"
    assert Decimal(str(historical["menu"]["precio_menu"])) == 12
    assert Decimal(str(historical["costo_ingredientes"])) == 6
    assert {r["id"] for r in historical["componentes"]} == {1, 2, 3}
    with connection() as c:
        assert c.execute("SELECT count(*) FROM ofertas_menu").fetchone()[0] == 1
        assert c.execute("SELECT count(*) FROM oferta_componentes").fetchone()[0] == 3


def test_invalid_menu_edits_do_not_partially_replace_name_price_or_components(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    for recipes in [[1, 2, 999], [1, 2, 4], [1, 1, 3]]:
        assert (
            api.put(
                f'/api/menus/{menu["id"]}',
                json={
                    "nombre": "No debe guardarse",
                    "precio_menu": "99",
                    "recetas": recipes,
                },
            ).status_code
            == 422
        )
    original = api.get(f'/api/menus/{menu["id"]}').json()
    assert (
        original["nombre"] == "Menú original"
        and Decimal(str(original["precio_menu"])) == 12
    )
    assert {r["id"] for r in original["componentes"]} == {1, 2, 3}
    assert (
        api.put(
            "/api/menus/999",
            json={"nombre": "No existe", "precio_menu": "12", "recetas": [1, 2, 3]},
        ).status_code
        == 422
    )


def test_plan_pdf_uses_original_names_and_prices_after_menu_edit(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    api.put(
        f'/api/menus/{menu["id"]}',
        json={"nombre": "Nuevo menú", "precio_menu": "20", "recetas": [4, 2, 3]},
    )
    response = api.get(f'/api/menu-plans/{plan["id"]}/report.pdf')
    assert (
        response.status_code == 200
        and response.headers["content-type"] == "application/pdf"
    )
    assert response.content.startswith(b"%PDF")
    text = "\n".join(
        p.extract_text() for p in PdfReader(io.BytesIO(response.content)).pages
    )
    assert "Menú original" in text and "S/ 12.00" in text and "S/ 120.00" in text
    assert "Nuevo menú" not in text
    assert api.get("/api/menu-plans/999/report.pdf").status_code == 422


def test_results_pdf_matches_real_closing_and_csv(client):
    api, connection = client
    menu, plan = saved_plan(api, connection)
    close = api.post(
        f'/api/menu-plans/{plan["id"]}/close',
        json={
            "preparadas": 10,
            "vendidas": 8,
            "precio_menu_real": "12",
            "gastos_adicionales": "5",
        },
    )
    assert close.status_code == 201, close.text
    response = api.get("/api/reports/results.pdf?desde=2026-11-01&hasta=2026-11-30")
    assert response.status_code == 200
    assert "attachment;" in response.headers["content-disposition"]
    text = "\n".join(
        p.extract_text() for p in PdfReader(io.BytesIO(response.content)).pages
    )
    assert "Menú original" in text and "S/ 96.00" in text and "S/ 85.00" in text
    assert "Comparación con lo planificado" in text
    report = api.get("/api/reports/results?desde=2026-11-01&hasta=2026-11-30").json()
    assert Decimal(str(report["margen_real"])) == 85
    assert (
        "85.0000"
        in api.get("/api/reports/results.csv?desde=2026-11-01&hasta=2026-11-30").text
    )


def test_empty_results_pdf_and_invalid_range(client):
    api, _ = client
    response = api.get("/api/reports/results.pdf?desde=2026-11-01&hasta=2026-11-30")
    assert response.status_code == 200
    text = "\n".join(
        p.extract_text() for p in PdfReader(io.BytesIO(response.content)).pages
    )
    assert "No hay cierres registrados" in text
    assert (
        api.get(
            "/api/reports/results.pdf?desde=2026-11-30&hasta=2026-11-01"
        ).status_code
        == 422
    )


def test_multipage_pdf_preserves_all_days_and_escapes_menu_names():
    rows = []
    for day in range(1, 31):
        rows.append(
            {
                "fecha": date(2026, 11, day),
                "plan_id": day,
                "nombre_oferta": "Menú de la casa <especial> & familiar "
                + ("largo " * 15),
                "menus_planificados": 20,
                "menus_venta_estimada": 20,
                "precio_estimado": Decimal("13"),
                "preparadas": 20,
                "vendidas": 18,
                "precio_menu_real": Decimal("13"),
                "costo_estimado": Decimal("70"),
                "costo_ingredientes_real": Decimal("75"),
                "gastos_adicionales": Decimal("10"),
            }
        )
    report = {
        "desde": date(2026, 11, 1),
        "hasta": date(2026, 11, 30),
        **ReportCalculator.summarize(rows),
    }
    pdf = ReportPDFExporter().results(report)
    reader = PdfReader(io.BytesIO(pdf))
    assert len(reader.pages) > 1
    text = "\n".join(p.extract_text() for p in reader.pages)
    assert "<especial> & familiar" in text
    assert "S/ 4,470.00" in text
    for day in range(1, 31):
        assert f"{day:02d}/11/2026" in text
