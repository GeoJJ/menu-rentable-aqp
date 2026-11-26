from decimal import Decimal

from psycopg.rows import dict_row

from app.db.connection import connect
from app.services.menu_planning import MenuPlanningCalculator


class MenuPlanRepository:
    """Persistencia transaccional y capturas históricas de planes."""

    @staticmethod
    def load_menu(c, menu_id):
        menu = (
            c.cursor(row_factory=dict_row)
            .execute(
                "SELECT id,nombre,precio_menu FROM ofertas_menu WHERE id=%s AND activo FOR SHARE",
                (menu_id,),
            )
            .fetchone()
        )
        if not menu:
            raise ValueError("Menú no encontrado")
        components = (
            c.cursor(row_factory=dict_row)
            .execute(
                "SELECT r.id,r.nombre,r.categoria,r.rendimiento,oc.porciones_por_menu FROM oferta_componentes oc JOIN recetas r ON r.id=oc.receta_id WHERE oc.oferta_id=%s AND r.activo ORDER BY r.id FOR SHARE OF r",
                (menu_id,),
            )
            .fetchall()
        )
        if len(components) != 3 or {r["categoria"] for r in components} != {
            "caldo",
            "segundo",
            "refresco",
        }:
            raise ValueError(
                "El menú necesita un caldo, un segundo y un refresco activos"
            )
        for component in components:
            component["ingredientes"] = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT i.id,i.nombre,i.unidad_codigo,ri.cantidad,inv.existencia,inv.costo_unitario,(SELECT precio/cantidad_base FROM cotizaciones WHERE ingrediente_id=i.id AND tipo_precio='compra' ORDER BY recuperado_en DESC,id DESC LIMIT 1) AS precio_compra FROM receta_ingredientes ri JOIN ingredientes i ON i.id=ri.ingrediente_id LEFT JOIN inventario inv ON inv.ingrediente_id=i.id WHERE ri.receta_id=%s AND i.activo",
                    (component["id"],),
                )
                .fetchall()
            )
            expected = c.execute(
                "SELECT count(*) FROM receta_ingredientes WHERE receta_id=%s",
                (component["id"],),
            ).fetchone()[0]
            if not expected or len(component["ingredientes"]) != expected:
                raise ValueError(
                    "Una receta está incompleta o contiene ingredientes inactivos"
                )
        return menu, components

    @staticmethod
    def requirements(menu_id):
        with connect() as c:
            menu, components = MenuPlanRepository.load_menu(c, menu_id)
            items = {i["id"]: i for r in components for i in r["ingredientes"]}
            return {
                "menu": menu,
                "componentes": components,
                "insumos": sorted(items.values(), key=lambda i: i["nombre"]),
            }

    @staticmethod
    def calculate_menu(menu_id, data):
        with connect() as c:
            return MenuPlanningCalculator.compute(
                *MenuPlanRepository.load_menu(c, menu_id), data
            )

    @staticmethod
    def save_menu_plan(menu_id, data):
        with connect() as c:
            c.execute("SELECT pg_advisory_xact_lock(20261126)")
            # Recalcular en la misma transacción. La cabecera única resuelve conflictos por fecha.
            result = MenuPlanningCalculator.compute(
                *MenuPlanRepository.load_menu(c, menu_id), data
            )
            if not result["factible"]:
                raise ValueError("La compra supera el presupuesto")
            if c.execute(
                "SELECT 1 FROM planes_diarios WHERE fecha=%s", (data.fecha,)
            ).fetchone():
                raise ValueError(
                    "Ya existe un plan para esa fecha. Elige otra fecha; no se reemplazará automáticamente."
                )
            plan_id = c.execute(
                "INSERT INTO planes_diarios(fecha,presupuesto,escenario,origen,version_calculo) VALUES (%s,%s,'base','propio','menu-unico-v1') RETURNING id",
                (data.fecha, data.presupuesto),
            ).fetchone()[0]
            offer_plan = c.execute(
                "INSERT INTO plan_ofertas(plan_id,oferta_id,nombre_oferta,precio_menu,menus_planificados,demanda_estimada,menus_venta_estimada) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (
                    plan_id,
                    menu_id,
                    result["menu"]["nombre"],
                    result["menu"]["precio_menu"],
                    data.cantidad,
                    data.cantidad,
                    data.cantidad,
                ),
            ).fetchone()[0]
            for r in result["componentes"]:
                portions = Decimal(data.cantidad) * r["porciones_por_menu"]
                if portions != int(portions):
                    raise ValueError("Las porciones de recetas deben ser enteras")
                plate = c.execute(
                    "INSERT INTO plan_platos(plan_id,receta_id,nombre_receta,categoria,rendimiento_base,porciones,demanda_estimada,ventas_estimadas,muestras_historicas,usa_demostracion) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,0,false) RETURNING id",
                    (
                        plan_id,
                        r["id"],
                        r["nombre"],
                        r["categoria"],
                        r["rendimiento"],
                        int(portions),
                        int(portions),
                        int(portions),
                    ),
                ).fetchone()[0]
                c.execute(
                    "INSERT INTO plan_oferta_componentes VALUES (%s,%s,%s,%s)",
                    (offer_plan, plate, plan_id, r["porciones_por_menu"]),
                )
            for s in result["insumos"]:
                product = c.execute(
                    "INSERT INTO productos(ingrediente_id,nombre,contenido_base) VALUES (%s,%s,1) RETURNING id",
                    (s["id"], s["nombre"] + " · compra por " + s["unidad"]),
                ).fetchone()[0]
                quote = c.execute(
                    "INSERT INTO cotizaciones(ingrediente_id,producto_id,origen,tipo_precio,proveedor,ubicacion,fecha_precio,precio,cantidad_base) VALUES (%s,%s,'manual','compra','Cotización ingresada por el usuario','No especificada',CURRENT_DATE,%s,1) RETURNING id",
                    (s["id"], product, s["precio_compra"]),
                ).fetchone()[0]
                c.execute(
                    "INSERT INTO inventario(ingrediente_id,existencia,costo_unitario) VALUES (%s,%s,%s) ON CONFLICT(ingrediente_id) DO NOTHING",
                    (s["id"], s["existencia"], s["costo_unitario"]),
                )
                c.execute(
                    "INSERT INTO plan_insumos(plan_id,ingrediente_id,producto_id,cotizacion_id,nombre_ingrediente,unidad_codigo,necesario,existencia_inicial,faltante,costo_existencia_unitario,nombre_producto,contenido_envase,precio_envase,envases,costo_consumido,procedencia) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1,%s,%s,%s,%s)",
                    (
                        plan_id,
                        s["id"],
                        product,
                        quote,
                        s["nombre"],
                        s["unidad"],
                        s["necesario"],
                        s["existencia"],
                        s["faltante"],
                        s["costo_unitario"],
                        s["nombre"] + " · " + s["unidad"],
                        s["precio_compra"],
                        s["envases"],
                        s["costo_consumido"],
                        "Cotización manual; ubicación no especificada",
                    ),
                )
            return {"id": plan_id, **result}

    @staticmethod
    def saved_menu_plans():
        with connect() as c:
            return (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT p.id,p.fecha,p.estado,p.presupuesto,o.nombre_oferta,o.precio_menu,o.menus_planificados,o.menus_venta_estimada*o.precio_menu AS ingreso_estimado,(SELECT sum(costo_consumido) FROM plan_insumos WHERE plan_id=p.id) AS costo_ingredientes,(SELECT sum(envases*precio_envase) FROM plan_insumos WHERE plan_id=p.id) AS compra FROM planes_diarios p JOIN plan_ofertas o ON o.plan_id=p.id ORDER BY p.fecha DESC"
                )
                .fetchall()
            )

    @staticmethod
    def saved_menu_plan(plan_id):
        """Reconstruye un resumen a partir de las capturas históricas del plan."""
        with connect() as c:
            cursor = c.cursor(row_factory=dict_row)
            plan = cursor.execute(
                "SELECT p.id,p.fecha,p.estado,p.presupuesto,o.oferta_id,o.nombre_oferta,o.precio_menu,o.menus_planificados,o.menus_venta_estimada FROM planes_diarios p JOIN plan_ofertas o ON o.plan_id=p.id WHERE p.id=%s",
                (plan_id,),
            ).fetchone()
            if not plan:
                raise ValueError("No se encontró el plan guardado")
            components = cursor.execute(
                "SELECT receta_id AS id,nombre_receta AS nombre,categoria FROM plan_platos WHERE plan_id=%s ORDER BY id",
                (plan_id,),
            ).fetchall()
            supplies = cursor.execute(
                "SELECT ingrediente_id AS id,nombre_ingrediente AS nombre,unidad_codigo AS unidad,necesario,faltante,envases,envases*precio_envase AS compra,costo_consumido FROM plan_insumos WHERE plan_id=%s ORDER BY nombre_ingrediente",
                (plan_id,),
            ).fetchall()
            purchase = sum((s["compra"] for s in supplies), Decimal(0))
            cost = sum((s["costo_consumido"] for s in supplies), Decimal(0))
            income = plan["precio_menu"] * plan["menus_venta_estimada"]
            return {
                "id": plan["id"],
                "menu": {
                    "id": plan["oferta_id"],
                    "nombre": plan["nombre_oferta"],
                    "precio_menu": plan["precio_menu"],
                },
                "fecha": plan["fecha"],
                "estado": plan["estado"],
                "cantidad": plan["menus_planificados"],
                "presupuesto": plan["presupuesto"],
                "ingreso_estimado": income,
                "compra": purchase,
                "costo_ingredientes": cost,
                "margen_estimado": income - cost,
                "factible": purchase <= plan["presupuesto"],
                "componentes": components,
                "insumos": supplies,
            }
