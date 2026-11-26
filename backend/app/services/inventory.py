"""InventoryCalculator: reglas del negocio sin acceso a HTTP o PostgreSQL."""

from decimal import Decimal, ROUND_HALF_UP


class InventoryCalculator:
    """Saldos y costo promedio de ingredientes en unidades base."""

    @staticmethod
    def unit_price(quantity, total):
        return (total / quantity).quantize(
            Decimal("0.00000001"), rounding=ROUND_HALF_UP
        )

    @staticmethod
    def purchase(stock, cost, quantity, price):
        balance = stock + quantity
        average = (stock * cost + quantity * price) / balance
        return balance, average.quantize(Decimal("0.00000001"), rounding=ROUND_HALF_UP)

    @staticmethod
    def consume(stock, quantity):
        if quantity > stock:
            raise ValueError(
                "Existencia insuficiente. Registra las compras reales antes de cerrar"
            )
        return stock - quantity
