from psycopg.rows import dict_row

from app.db.connection import connect


class MenuRepository:
    """Persistencia de ofertas con un precio único por menú."""

    @staticmethod
    def _validate_recipes(c, data):
        rows = c.execute(
            "SELECT id,categoria FROM recetas WHERE id=ANY(%s) AND activo ORDER BY id FOR SHARE",
            (data.recetas,),
        ).fetchall()
        if len(rows) != 3 or {r[1] for r in rows} != {"caldo", "segundo", "refresco"}:
            raise ValueError(
                "El menú debe contener un caldo, un segundo y un refresco activos"
            )

    @staticmethod
    def _components(c, menu_id):
        return (
            c.cursor(row_factory=dict_row)
            .execute(
                "SELECT r.id,r.nombre,r.categoria,oc.porciones_por_menu FROM oferta_componentes oc JOIN recetas r ON r.id=oc.receta_id WHERE oc.oferta_id=%s ORDER BY r.categoria",
                (menu_id,),
            )
            .fetchall()
        )

    @staticmethod
    def get_menu(menu_id):
        with connect() as c:
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
            return {**menu, "componentes": MenuRepository._components(c, menu_id)}

    @staticmethod
    def list_menus():
        with connect() as c:
            menus = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT id,nombre,precio_menu FROM ofertas_menu WHERE activo ORDER BY id DESC FOR SHARE"
                )
                .fetchall()
            )
            for menu in menus:
                menu["componentes"] = MenuRepository._components(c, menu["id"])
            return menus

    @staticmethod
    def create_menu(data):
        with connect() as c:
            MenuRepository._validate_recipes(c, data)
            menu = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "INSERT INTO ofertas_menu(nombre,precio_menu) VALUES (%s,%s) RETURNING id,nombre,precio_menu",
                    (data.nombre, data.precio_menu),
                )
                .fetchone()
            )
            for recipe in data.recetas:
                c.execute(
                    "INSERT INTO oferta_componentes(oferta_id,receta_id,porciones_por_menu) VALUES (%s,%s,1)",
                    (menu["id"], recipe),
                )
            return {**menu, "componentes": MenuRepository._components(c, menu["id"])}

    @staticmethod
    def update_menu(menu_id, data):
        """Edita el catálogo; las capturas de planes guardados no se modifican."""
        with connect() as c:
            if not c.execute(
                "SELECT id FROM ofertas_menu WHERE id=%s AND activo FOR UPDATE",
                (menu_id,),
            ).fetchone():
                raise ValueError("Menú no encontrado")
            MenuRepository._validate_recipes(c, data)
            menu = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "UPDATE ofertas_menu SET nombre=%s,precio_menu=%s WHERE id=%s RETURNING id,nombre,precio_menu",
                    (data.nombre, data.precio_menu, menu_id),
                )
                .fetchone()
            )
            c.execute("DELETE FROM oferta_componentes WHERE oferta_id=%s", (menu_id,))
            for recipe in data.recetas:
                c.execute(
                    "INSERT INTO oferta_componentes(oferta_id,receta_id,porciones_por_menu) VALUES (%s,%s,1)",
                    (menu_id, recipe),
                )
            return {**menu, "componentes": MenuRepository._components(c, menu_id)}
