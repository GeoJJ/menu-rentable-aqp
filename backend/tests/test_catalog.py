from decimal import Decimal

from app.repositories import catalog


def test_recipe_status_distinguishes_missing_or_inactive_ingredients_from_stock(client):
    api, connection = client
    empty = api.get("/api/recipes").json()
    assert all(
        not r["lista_para_planificar"] and r["ingredientes_registrados"] == 0
        for r in empty
    )
    ingredient = api.post(
        "/api/ingredients", json={"nombre": "Papa", "unidad_codigo": "kg"}
    ).json()
    data = {
        "nombre": "Caldo de papa",
        "categoria": "caldo",
        "rendimiento": 10,
        "ingredientes": [{"ingrediente_id": ingredient["id"], "cantidad": "1"}],
    }
    assert api.put("/api/recipes/1", json=data).status_code == 200
    complete = next(r for r in api.get("/api/recipes").json() if r["id"] == 1)
    assert (
        complete["lista_para_planificar"] and complete["ingredientes_registrados"] == 1
    )
    # Una receta completa no significa que exista stock. La marca solo describe la receta.
    assert api.get("/api/ingredients").json()[0]["existencia"] is None
    with connection() as c:
        c.execute(
            "UPDATE ingredientes SET activo=false WHERE id=%s", (ingredient["id"],)
        )
    assert not next(r for r in api.get("/api/recipes").json() if r["id"] == 1)[
        "lista_para_planificar"
    ]


def test_catalog_crud_and_planning_inputs(client, monkeypatch):
    api, connection = client
    from app.repositories import menu_plans

    monkeypatch.setattr(catalog, "connect", connection)
    monkeypatch.setattr(menu_plans, "connect", connection)
    ingredient = api.post(
        "/api/ingredients", json={"nombre": "Arroz de prueba", "unidad_codigo": "kg"}
    )
    assert ingredient.status_code == 201
    iid = ingredient.json()["id"]
    assert (
        api.post(
            "/api/ingredients",
            json={"nombre": "arroz de prueba", "unidad_codigo": "kg"},
        ).status_code
        == 422
    )
    stock = {
        "existencia": "2",
        "costo_unitario": "4",
        "precio_compra": "4.5",
        "proveedor": "Mercado local",
        "ubicacion": "Arequipa",
    }
    assert api.put(f"/api/ingredients/{iid}/stock", json=stock).status_code == 200
    listed = api.get("/api/ingredients").json()[0]
    assert Decimal(str(listed["precio_compra"])) == Decimal("4.5")
    assert listed["proveedor"] == "Mercado local"
    recipe = {
        "nombre": "Receta nueva",
        "categoria": "caldo",
        "rendimiento": 10,
        "preparacion": "Hervir.",
        "ingredientes": [{"ingrediente_id": iid, "cantidad": "1.2"}],
    }
    response = api.post("/api/recipes", json=recipe)
    assert response.status_code == 201
    rid = response.json()["id"]
    assert api.get(f"/api/recipes/{rid}").json()["preparacion"] == "Hervir."
    recipe["rendimiento"] = 20
    assert api.put(f"/api/recipes/{rid}", json=recipe).status_code == 200
    assert api.get(f"/api/recipes/{rid}").json()["rendimiento"] == 20
    # La receta entra al mismo catálogo que consume la creación de menús.
    assert any(r["id"] == rid for r in api.get("/api/recipes").json())
    assert api.delete(f"/api/recipes/{rid}").status_code == 200
    assert not any(r["id"] == rid for r in api.get("/api/recipes").json())
    stock["existencia"] = "-1"
    assert api.put(f"/api/ingredients/{iid}/stock", json=stock).status_code == 422


def test_recipe_validation_and_active_menu_protection(client, monkeypatch):
    api, connection = client
    monkeypatch.setattr(catalog, "connect", connection)
    with connection() as c:
        iid = c.execute(
            "INSERT INTO ingredientes(nombre,unidad_codigo) VALUES ('Arroz','kg') RETURNING id"
        ).fetchone()[0]
        for rid in [1, 2, 3]:
            c.execute("INSERT INTO receta_ingredientes VALUES (%s,%s,1)", (rid, iid))
    api.post(
        "/api/menus", json={"nombre": "Menú", "precio_menu": "12", "recetas": [1, 2, 3]}
    )
    body = {
        "nombre": "Caldo editado",
        "categoria": "segundo",
        "rendimiento": 10,
        "ingredientes": [{"ingrediente_id": iid, "cantidad": 1}],
    }
    assert api.put("/api/recipes/1", json=body).status_code == 422
    assert api.delete("/api/recipes/1").status_code == 422
    body["categoria"] = "caldo"
    body["ingredientes"] = [{"ingrediente_id": 999999, "cantidad": 1}]
    assert api.put("/api/recipes/1", json=body).status_code == 422
    assert api.get("/api/recipes/1").json()["nombre"] == "caldo"
    body["ingredientes"] = [
        {"ingrediente_id": iid, "cantidad": 1},
        {"ingrediente_id": iid, "cantidad": 2},
    ]
    assert api.post("/api/recipes", json=body).status_code == 422
