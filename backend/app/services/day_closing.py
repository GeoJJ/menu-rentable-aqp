"""DayClosingCalculator: reglas del negocio sin acceso a HTTP o PostgreSQL."""

from decimal import Decimal, ROUND_HALF_UP


class DayClosingCalculator:
    """Consumo según producción y resultado económico de un cierre."""

    @staticmethod
    def required(planned_quantity, planned_menus, prepared):
        return (planned_quantity * Decimal(prepared) / Decimal(planned_menus)).quantize(
            Decimal("0.00000001"), rounding=ROUND_HALF_UP
        )

    @staticmethod
    def totals(prepared, sold, price, ingredient_cost, expenses):
        if sold > prepared:
            raise ValueError("Las ventas superan la producción")
        income = sold * price
        return {
            "preparadas": prepared,
            "vendidas": sold,
            "sobrantes": prepared - sold,
            "ingreso_real": income,
            "costo_ingredientes_real": ingredient_cost,
            "gastos_adicionales": expenses,
            "margen_real": income - ingredient_cost - expenses,
        }
