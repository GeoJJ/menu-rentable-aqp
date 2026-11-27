from psycopg.rows import dict_row

from app.db.connection import connect


class CatalogRepository:
    """Persistencia de recetas, ingredientes y existencias."""

    @staticmethod
    def ingredients():
        with connect() as c:
            return (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT i.id,i.nombre,i.unidad_codigo,inv.existencia,inv.costo_unitario,q.precio/q.cantidad_base AS precio_compra,q.fecha_precio,q.proveedor,q.ubicacion FROM ingredientes i LEFT JOIN inventario inv ON inv.ingrediente_id=i.id LEFT JOIN LATERAL (SELECT precio,cantidad_base,fecha_precio,proveedor,ubicacion FROM cotizaciones WHERE ingrediente_id=i.id AND tipo_precio='compra' ORDER BY recuperado_en DESC,id DESC LIMIT 1) q ON true WHERE i.activo ORDER BY i.nombre"
                )
                .fetchall()
            )

    @staticmethod
    def create_ingredient(data):
        with connect() as c:
            if c.execute(
                "SELECT 1 FROM ingredientes WHERE lower(nombre)=lower(%s) AND activo",
                (data.nombre,),
            ).fetchone():
                raise ValueError("Ya existe un ingrediente con ese nombre")
            return (
                c.cursor(row_factory=dict_row)
                .execute(
                    "INSERT INTO ingredientes(nombre,unidad_codigo) VALUES (%s,%s) RETURNING id,nombre,unidad_codigo",
                    (data.nombre, data.unidad_codigo),
                )
                .fetchone()
            )

    @staticmethod
    def stock(ingredient_id, data):
        with connect() as c:
            c.execute("SELECT pg_advisory_xact_lock(20261126)")
            row = c.execute(
                "SELECT nombre FROM ingredientes WHERE id=%s AND activo FOR UPDATE",
                (ingredient_id,),
            ).fetchone()
            if not row:
                raise ValueError("Ingrediente no encontrado")
            previous = c.execute(
                "SELECT existencia FROM inventario WHERE ingrediente_id=%s FOR UPDATE",
                (ingredient_id,),
            ).fetchone()
            difference = data.existencia - (previous[0] if previous else 0)
            c.execute(
                "INSERT INTO inventario(ingrediente_id,existencia,costo_unitario) VALUES (%s,%s,%s) ON CONFLICT(ingrediente_id) DO UPDATE SET existencia=EXCLUDED.existencia,costo_unitario=EXCLUDED.costo_unitario,actualizado_en=now()",
                (ingredient_id, data.existencia, data.costo_unitario),
            )
            if difference:
                c.execute(
                    "INSERT INTO movimientos_inventario(ingrediente_id,tipo,cantidad,costo_unitario,saldo,motivo) VALUES (%s,'ajuste',%s,%s,%s,'Actualización manual de despensa')",
                    (ingredient_id, difference, data.costo_unitario, data.existencia),
                )
            product = c.execute(
                "SELECT id FROM productos WHERE ingrediente_id=%s AND codigo_externo=%s",
                (ingredient_id, f"local-{ingredient_id}"),
            ).fetchone()
            pid = (
                product[0]
                if product
                else c.execute(
                    "INSERT INTO productos(ingrediente_id,nombre,codigo_externo,contenido_base) VALUES (%s,%s,%s,1) RETURNING id",
                    (ingredient_id, row[0], f"local-{ingredient_id}"),
                ).fetchone()[0]
            )
            c.execute(
                "INSERT INTO cotizaciones(ingrediente_id,producto_id,origen,tipo_precio,proveedor,ubicacion,fecha_precio,precio,cantidad_base) VALUES (%s,%s,'manual','compra',%s,%s,CURRENT_DATE,%s,1)",
                (
                    ingredient_id,
                    pid,
                    data.proveedor.strip() or "Cotización manual",
                    data.ubicacion.strip() or "No especificada",
                    data.precio_compra,
                ),
            )
            return {"ingrediente_id": ingredient_id, "guardado": True}

    @staticmethod
    def recipe_detail(recipe_id):
        with connect() as c:
            cursor = c.cursor(row_factory=dict_row)
            recipe = cursor.execute(
                "SELECT id,nombre,categoria,rendimiento,preparacion FROM recetas WHERE id=%s AND activo",
                (recipe_id,),
            ).fetchone()
            if not recipe:
                raise ValueError("Receta no encontrada")
            recipe["ingredientes"] = cursor.execute(
                "SELECT ingrediente_id,cantidad FROM receta_ingredientes WHERE receta_id=%s ORDER BY ingrediente_id",
                (recipe_id,),
            ).fetchall()
            return recipe

    @staticmethod
    def save_recipe(data, recipe_id=None):
        with connect() as c:
            if recipe_id is not None:
                current = c.execute(
                    "SELECT categoria FROM recetas WHERE id=%s AND activo FOR UPDATE",
                    (recipe_id,),
                ).fetchone()
                if not current:
                    raise ValueError("Receta no encontrada")
                if (
                    current[0] != data.categoria
                    and c.execute(
                        "SELECT 1 FROM oferta_componentes WHERE receta_id=%s",
                        (recipe_id,),
                    ).fetchone()
                ):
                    raise ValueError(
                        "Esta receta ya forma parte de un menú. Conserva su categoría."
                    )
            ids = [i.ingrediente_id for i in data.ingredientes]
            if len(
                c.execute(
                    "SELECT id FROM ingredientes WHERE id=ANY(%s) AND activo FOR SHARE",
                    (ids,),
                ).fetchall()
            ) != len(ids):
                raise ValueError("Hay ingredientes que no están disponibles")
            if recipe_id is None:
                recipe_id = c.execute(
                    "INSERT INTO recetas(nombre,categoria,rendimiento,preparacion) VALUES (%s,%s,%s,%s) RETURNING id",
                    (data.nombre, data.categoria, data.rendimiento, data.preparacion),
                ).fetchone()[0]
            else:
                c.execute(
                    "UPDATE recetas SET nombre=%s,categoria=%s,rendimiento=%s,preparacion=%s WHERE id=%s",
                    (
                        data.nombre,
                        data.categoria,
                        data.rendimiento,
                        data.preparacion,
                        recipe_id,
                    ),
                )
                c.execute(
                    "DELETE FROM receta_ingredientes WHERE receta_id=%s", (recipe_id,)
                )
            for item in data.ingredientes:
                c.execute(
                    "INSERT INTO receta_ingredientes VALUES (%s,%s,%s)",
                    (recipe_id, item.ingrediente_id, item.cantidad),
                )
            return {
                "id": recipe_id,
                "nombre": data.nombre,
                "categoria": data.categoria,
                "rendimiento": data.rendimiento,
            }

    @staticmethod
    def archive_recipe(recipe_id):
        with connect() as c:
            if c.execute(
                "SELECT 1 FROM oferta_componentes oc JOIN ofertas_menu o ON o.id=oc.oferta_id WHERE oc.receta_id=%s AND o.activo",
                (recipe_id,),
            ).fetchone():
                raise ValueError(
                    "La receta está en uso por un menú. No puede archivarse."
                )
            if not c.execute(
                "UPDATE recetas SET activo=false WHERE id=%s AND activo RETURNING id",
                (recipe_id,),
            ).fetchone():
                raise ValueError("Receta no encontrada")
            return {"archivada": True}

    @staticmethod
    def list_recipes():
        with connect() as c:
            return (
                c.cursor(row_factory=dict_row)
                .execute("""SELECT r.id,r.nombre,r.categoria,r.rendimiento,
                    (SELECT count(*) FROM receta_ingredientes ri WHERE ri.receta_id=r.id) AS ingredientes_registrados,
                    (EXISTS(SELECT 1 FROM receta_ingredientes ri WHERE ri.receta_id=r.id)
                    AND NOT EXISTS(SELECT 1 FROM receta_ingredientes ri JOIN ingredientes i ON i.id=ri.ingrediente_id WHERE ri.receta_id=r.id AND NOT i.activo)) AS lista_para_planificar
                    FROM recetas r WHERE r.activo ORDER BY r.categoria,r.nombre""")
                .fetchall()
            )
