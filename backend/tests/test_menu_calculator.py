from decimal import Decimal as D
from app.schemas.menu_plans import MenuPlanInput
from app.services.menu_planning import MenuPlanningCalculator


def test_shared_ingredients_are_aggregated_before_stock_and_rounding():
    menu = {"precio_menu": D(13)}
    components = [
        {
            "rendimiento": 10,
            "porciones_por_menu": D(1),
            "ingredientes": [
                {"id": 1, "nombre": "Pollo", "unidad_codigo": "kg", "cantidad": D("2")}
            ],
        },
        {
            "rendimiento": 10,
            "porciones_por_menu": D(1),
            "ingredientes": [
                {"id": 1, "nombre": "Pollo", "unidad_codigo": "kg", "cantidad": D(".5")}
            ],
        },
    ]
    data = MenuPlanInput(
        fecha="2026-11-26",
        cantidad=30,
        presupuesto=100,
        insumos={1: {"existencia": 2, "costo_unitario": 10, "precio_compra": 12}},
    )
    result = MenuPlanningCalculator.compute(menu, components, data)
    assert len(result["insumos"]) == 1
    supply = result["insumos"][0]
    assert supply["necesario"] == D("7.5")
    assert supply["faltante"] == D("5.5") and supply["envases"] == 6
    assert result["compra"] == 72 and result["costo_ingredientes"] == 86
    assert result["ingreso_estimado"] == 390 and result["margen_estimado"] == 304
