from psycopg.rows import dict_row

from app.db.plans import connect


def list_recipes():
    with connect() as c:
        return (
            c.cursor(row_factory=dict_row)
            .execute(
                "SELECT id,nombre,categoria,rendimiento FROM recetas WHERE activo ORDER BY categoria,nombre"
            )
            .fetchall()
        )


def list_menus():
    with connect() as c:
        menus = (
            c.cursor(row_factory=dict_row)
            .execute(
                "SELECT id,nombre,precio_menu FROM ofertas_menu WHERE activo ORDER BY id DESC"
            )
            .fetchall()
        )
        for menu in menus:
            menu["componentes"] = (
                c.cursor(row_factory=dict_row)
                .execute(
                    "SELECT r.id,r.nombre,r.categoria,oc.porciones_por_menu FROM oferta_componentes oc JOIN recetas r ON r.id=oc.receta_id WHERE oc.oferta_id=%s ORDER BY r.categoria",
                    (menu["id"],),
                )
                .fetchall()
            )
        return menus


def create_menu(data):
    with connect() as c:
        rows = c.execute(
            "SELECT id,categoria FROM recetas WHERE id=ANY(%s) AND activo FOR SHARE",
            (data.recetas,),
        ).fetchall()
        if len(rows) != 3 or {r[1] for r in rows} != {"caldo", "segundo", "refresco"}:
            raise ValueError(
                "El menú debe contener un caldo, un segundo y un refresco activos"
            )
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
        return menu
