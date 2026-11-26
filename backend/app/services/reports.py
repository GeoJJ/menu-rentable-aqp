"""ReportCalculator: reglas del negocio sin acceso a HTTP o PostgreSQL."""

from decimal import Decimal
from app.services.day_closing import DayClosingCalculator


class ReportCalculator:
    """Reutiliza las fórmulas del cierre y totaliza el periodo solicitado."""

    @staticmethod
    def summarize(rows):
        rows = [
            {
                **r,
                **DayClosingCalculator.totals(
                    r["preparadas"],
                    r["vendidas"],
                    r["precio_menu_real"],
                    r["costo_ingredientes_real"],
                    r["gastos_adicionales"],
                ),
                "ingreso_estimado": r["menus_venta_estimada"] * r["precio_estimado"],
            }
            for r in rows
        ]
        totals = {
            k: sum((r[k] for r in rows), Decimal(0))
            for k in [
                "preparadas",
                "vendidas",
                "sobrantes",
                "ingreso_real",
                "costo_ingredientes_real",
                "gastos_adicionales",
                "margen_real",
            ]
        }
        return {
            "dias_cerrados": len(rows),
            **totals,
            "detalle": rows,
            "nota": "Margen tras ingredientes y gastos adicionales declarados. No garantiza incluir todos los gastos del negocio.",
        }
