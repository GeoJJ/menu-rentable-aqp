"""Operaciones reales en transacciones: compras, merma, cierre y consultas."""

from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from psycopg.rows import dict_row

from app.db.connection import connect
from app.services.day_closing import DayClosingCalculator
from app.services.demand_forecast import DemandForecaster
from app.services.inventory import InventoryCalculator
from app.services.reports import ReportCalculator


class OperationsRepository:
    @staticmethod
    def movement(data):
        with connect() as c:
            c.execute("SELECT pg_advisory_xact_lock(20261126)")
            ingredient = c.execute(
                "SELECT nombre FROM ingredientes WHERE id=%s AND activo FOR UPDATE",
                (data.ingrediente_id,),
            ).fetchone()
            if not ingredient:
                raise ValueError("Ingrediente no encontrado")
            c.execute(
                "INSERT INTO inventario VALUES (%s,0,0,now()) ON CONFLICT DO NOTHING",
                (data.ingrediente_id,),
            )
            stock, cost = c.execute(
                "SELECT existencia,costo_unitario FROM inventario WHERE ingrediente_id=%s FOR UPDATE",
                (data.ingrediente_id,),
            ).fetchone()
            if data.tipo == "compra":
                price = (
                    InventoryCalculator.unit_price(data.cantidad, data.importe_total)
                    if data.importe_total is not None
                    else data.costo_unitario
                )
                balance, average = InventoryCalculator.purchase(
                    stock, cost, data.cantidad, price
                )
                quantity, unit_cost = data.cantidad, price
                c.execute(
                    "INSERT INTO cotizaciones(ingrediente_id,origen,tipo_precio,proveedor,ubicacion,fecha_precio,precio,cantidad_base) VALUES (%s,'manual','compra',%s,'No especificada',CURRENT_DATE,%s,1)",
                    (data.ingrediente_id, data.motivo.strip(), price),
                )
            else:
                balance = InventoryCalculator.consume(stock, data.cantidad)
                quantity, unit_cost, average = -data.cantidad, cost, cost
            c.execute(
                "UPDATE inventario SET existencia=%s,costo_unitario=%s,actualizado_en=now() WHERE ingrediente_id=%s",
                (balance, average, data.ingrediente_id),
            )
            return (
                c.cursor(row_factory=dict_row)
                .execute(
                    "INSERT INTO movimientos_inventario(ingrediente_id,tipo,cantidad,costo_unitario,saldo,motivo) VALUES (%s,%s,%s,%s,%s,%s) RETURNING *",
                    (
                        data.ingrediente_id,
                        data.tipo,
                        quantity,
                        unit_cost,
                        balance,
                        data.motivo.strip(),
                    ),
                )
                .fetchone()
            )

    @staticmethod
    def movements():
        with connect() as c:
            return (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT m.*,i.nombre,i.unidad_codigo FROM movimientos_inventario m JOIN ingredientes i ON i.id=m.ingrediente_id ORDER BY m.id DESC LIMIT 500"
                )
                .fetchall()
            )

    @staticmethod
    def _closing_context(c, plan_id, data):
        cursor = c.cursor(row_factory=dict_row)
        plan = cursor.execute(
            "SELECT p.id,p.fecha,p.estado,p.version,o.oferta_id,o.nombre_oferta,o.menus_planificados FROM planes_diarios p JOIN plan_ofertas o ON o.plan_id=p.id WHERE p.id=%s FOR UPDATE OF p",
            (plan_id,),
        ).fetchone()
        if not plan or plan["estado"] != "planificado":
            raise ValueError("El plan no existe, está cancelado o ya fue cerrado")
        if plan["version"] != data.version:
            raise ValueError(
                "El plan cambió de versión. Vuelve a abrirlo y revisa el cierre con los datos actuales."
            )
        if plan["fecha"] > datetime.now(ZoneInfo("America/Lima")).date():
            raise ValueError(
                "Puedes registrar el cierre el día del plan o después, cuando sepas cuánto preparaste y vendiste"
            )
        supplies = cursor.execute(
            "SELECT ingrediente_id,nombre_ingrediente,unidad_codigo,necesario FROM plan_insumos WHERE plan_id=%s ORDER BY ingrediente_id",
            (plan_id,),
        ).fetchall()
        items = []
        cost = Decimal(0)
        for item in supplies:
            stock = cursor.execute(
                "SELECT existencia,costo_unitario FROM inventario WHERE ingrediente_id=%s FOR UPDATE",
                (item["ingrediente_id"],),
            ).fetchone()
            quantity = DayClosingCalculator.required(
                item["necesario"], plan["menus_planificados"], data.preparadas
            )
            available = stock["existencia"] if stock else Decimal(0)
            unit_cost = stock["costo_unitario"] if stock else Decimal(0)
            items.append(
                {
                    "ingrediente_id": item["ingrediente_id"],
                    "nombre": item["nombre_ingrediente"],
                    "unidad": item["unidad_codigo"],
                    "necesario": quantity,
                    "disponible": available,
                    "faltante": max(Decimal(0), quantity - available),
                    "costo_unitario": unit_cost,
                }
            )
            cost += quantity * unit_cost
        return plan, items, cost.quantize(Decimal("0.0001"))

    @staticmethod
    def preview_closing(plan_id, data):
        with connect() as c:
            c.execute("SELECT pg_advisory_xact_lock(20261126)")
            _plan, items, cost = OperationsRepository._closing_context(c, plan_id, data)
            possible = all(i["faltante"] == 0 for i in items)
            return {
                "plan_id": plan_id,
                "datos": data.model_dump(),
                "puede_cerrar": possible,
                "insumos": items,
                "resultado": (
                    DayClosingCalculator.totals(
                        data.preparadas,
                        data.vendidas,
                        data.precio_menu_real,
                        cost,
                        data.gastos_adicionales,
                    )
                    if possible
                    else None
                ),
            }

    @staticmethod
    def close(plan_id, data):
        with connect() as c:
            c.execute("SELECT pg_advisory_xact_lock(20261126)")
            plan, items, cost = OperationsRepository._closing_context(c, plan_id, data)
            for item in items:
                if item["faltante"]:
                    raise ValueError(
                        f"Falta {item['faltante']:f} {item['unidad']} de {item['nombre']}. Registra lo que compraste o revisa tus existencias antes de cerrar."
                    )
            for item in items:
                quantity = item["necesario"]
                balance = InventoryCalculator.consume(item["disponible"], quantity)
                if quantity:
                    c.execute(
                        "UPDATE inventario SET existencia=%s,actualizado_en=now() WHERE ingrediente_id=%s",
                        (balance, item["ingrediente_id"]),
                    )
                    c.execute(
                        "INSERT INTO movimientos_inventario(ingrediente_id,plan_id,tipo,cantidad,costo_unitario,saldo,motivo) VALUES (%s,%s,'consumo',%s,%s,%s,'Consumo del cierre diario')",
                        (
                            item["ingrediente_id"],
                            plan_id,
                            -quantity,
                            item["costo_unitario"],
                            balance,
                        ),
                    )
            c.execute(
                "INSERT INTO registros_diarios(fecha,oferta_id,nombre_oferta,preparadas,vendidas,precio_menu_real,origen,plan_id,costo_ingredientes_real,gastos_adicionales) VALUES (%s,%s,%s,%s,%s,%s,'propio',%s,%s,%s)",
                (
                    plan["fecha"],
                    plan["oferta_id"],
                    plan["nombre_oferta"],
                    data.preparadas,
                    data.vendidas,
                    data.precio_menu_real,
                    plan_id,
                    cost,
                    data.gastos_adicionales,
                ),
            )
            c.execute(
                "UPDATE planes_diarios SET estado='cerrado',actualizado_en=now() WHERE id=%s",
                (plan_id,),
            )
            return {
                "plan_id": plan_id,
                **DayClosingCalculator.totals(
                    data.preparadas,
                    data.vendidas,
                    data.precio_menu_real,
                    cost,
                    data.gastos_adicionales,
                ),
            }

    @staticmethod
    def cancel(plan_id, data):
        with connect() as c:
            if not c.execute(
                "UPDATE planes_diarios SET estado='cancelado',motivo_cancelacion=%s,actualizado_en=now() WHERE id=%s AND estado='planificado' RETURNING id",
                (data.motivo.strip(), plan_id),
            ).fetchone():
                raise ValueError(
                    "Solo se puede cancelar un plan pendiente; no se elimina su historial"
                )
            return {"id": plan_id, "estado": "cancelado"}

    @staticmethod
    def closing(plan_id):
        with connect() as c:
            row = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT * FROM registros_diarios WHERE plan_id=%s",
                    (plan_id,),
                )
                .fetchone()
            )
            if not row:
                return None
            return {
                **row,
                **DayClosingCalculator.totals(
                    row["preparadas"],
                    row["vendidas"],
                    row["precio_menu_real"],
                    row["costo_ingredientes_real"],
                    row["gastos_adicionales"],
                ),
            }

    @staticmethod
    def forecast(menu_id, target):
        with connect() as c:
            if not c.execute(
                "SELECT 1 FROM ofertas_menu WHERE id=%s AND activo", (menu_id,)
            ).fetchone():
                raise ValueError("Menú no encontrado")
            rows = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT fecha,preparadas,vendidas FROM registros_diarios WHERE oferta_id=%s AND origen='propio' AND plan_id IS NOT NULL AND fecha<%s ORDER BY fecha DESC LIMIT 365",
                    (menu_id, target),
                )
                .fetchall()
            )
            return {
                "oferta_id": menu_id,
                "fecha": target,
                **DemandForecaster.forecast(rows, target),
            }

    @staticmethod
    def report(start, end):
        if start > end or (end - start).days > 366:
            raise ValueError("Selecciona un intervalo ordenado de hasta 366 días")
        with connect() as c:
            rows = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT r.plan_id,r.fecha,r.nombre_oferta,r.preparadas,r.vendidas,r.precio_menu_real,r.costo_ingredientes_real,r.gastos_adicionales,o.menus_planificados,o.menus_venta_estimada,o.precio_menu AS precio_estimado,(SELECT sum(costo_consumido) FROM plan_insumos WHERE plan_id=r.plan_id) AS costo_estimado FROM registros_diarios r JOIN plan_ofertas o ON o.plan_id=r.plan_id WHERE r.fecha BETWEEN %s AND %s AND r.origen='propio' ORDER BY r.fecha",
                    (start, end),
                )
                .fetchall()
            )
            return {"desde": start, "hasta": end, **ReportCalculator.summarize(rows)}
