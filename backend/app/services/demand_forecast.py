"""DemandForecaster: reglas del negocio sin acceso a HTTP o PostgreSQL."""

from decimal import Decimal, ROUND_HALF_UP
from statistics import mean


class DemandForecaster:
    """Sugerencia explicable mediante promedio de ventas anteriores."""

    @staticmethod
    def forecast(rows, target):
        # Solo cierres reales anteriores; priorizar el mismo día de semana.
        history = [r for r in rows if r["fecha"] < target]
        comparable = [r for r in history if r["fecha"].weekday() == target.weekday()]
        samples = sorted(
            comparable if comparable else history,
            key=lambda r: r["fecha"],
            reverse=True,
        )[:8]
        if not samples:
            return {
                "cantidad_sugerida": None,
                "muestras": 0,
                "metodo": "Sin cierres anteriores: ingresa una cantidad inicial",
                "agotamientos": 0,
            }
        suggested = int(
            Decimal(str(mean(r["vendidas"] for r in samples))).quantize(
                Decimal("1"), rounding=ROUND_HALF_UP
            )
        )
        return {
            "cantidad_sugerida": suggested,
            "muestras": len(samples),
            "metodo": (
                "Promedio de ventas del mismo día de semana"
                if comparable
                else "Promedio de últimas ventas reales"
            ),
            "agotamientos": sum(
                r["preparadas"] > 0 and r["vendidas"] == r["preparadas"]
                for r in samples
            ),
            "advertencia": "La venta no mide demanda no atendida; revisa días con agotamiento.",
        }
