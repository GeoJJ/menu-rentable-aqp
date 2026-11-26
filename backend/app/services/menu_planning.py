"""Cálculo puro de producción y compras con precio único por menú."""

from decimal import ROUND_CEILING, Decimal


class MenuPlanningCalculator:
    """Fórmulas de porciones, faltantes, compras y margen estimado."""

    @staticmethod
    def compute(menu, components, data):
        supplies = {}
        for r in components:
            for i in r["ingredientes"]:
                row = supplies.setdefault(
                    i["id"],
                    {
                        "id": i["id"],
                        "nombre": i["nombre"],
                        "unidad": i["unidad_codigo"],
                        "necesario": Decimal(0),
                    },
                )
                row["necesario"] += (
                    i["cantidad"]
                    * Decimal(data.cantidad)
                    * r["porciones_por_menu"]
                    / r["rendimiento"]
                )
        if set(data.insumos) != set(supplies):
            raise ValueError(
                "Completa existencias, costo y precio de compra de todos los insumos"
            )
        for key, row in supplies.items():
            entered = data.insumos[key]
            missing = max(Decimal(0), row["necesario"] - entered.existencia)
            packages = int(missing.to_integral_value(rounding=ROUND_CEILING))
            row.update(
                existencia=entered.existencia,
                costo_unitario=entered.costo_unitario,
                precio_compra=entered.precio_compra,
                faltante=missing,
                envases=packages,
                compra=packages * entered.precio_compra,
                costo_consumido=min(row["necesario"], entered.existencia)
                * entered.costo_unitario
                + missing * entered.precio_compra,
            )
        purchase = sum((s["compra"] for s in supplies.values()), Decimal(0))
        cost = sum((s["costo_consumido"] for s in supplies.values()), Decimal(0))
        income = data.cantidad * menu["precio_menu"]
        return {
            "menu": menu,
            "fecha": data.fecha,
            "cantidad": data.cantidad,
            "presupuesto": data.presupuesto,
            "ingreso_estimado": income,
            "costo_ingredientes": cost,
            "compra": purchase,
            "margen_estimado": income - cost,
            "factible": purchase <= data.presupuesto,
            "componentes": components,
            "insumos": list(supplies.values()),
        }
