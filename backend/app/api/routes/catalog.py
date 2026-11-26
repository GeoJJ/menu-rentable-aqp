from fastapi import APIRouter

from app.api.errors import database_call
from app.repositories import catalog
from app.schemas.catalog import IngredientInput, RecipeInput, StockInput

router = APIRouter()


@router.get("/ingredients")
def list_ingredients():
    return database_call(catalog.CatalogRepository.ingredients)


@router.post("/ingredients", status_code=201)
def ingredient_create(data: IngredientInput):
    return database_call(catalog.CatalogRepository.create_ingredient, data)


@router.put("/ingredients/{ingredient_id}/stock")
def ingredient_stock(ingredient_id: int, data: StockInput):
    return database_call(catalog.CatalogRepository.stock, ingredient_id, data)


@router.get("/recipes/{recipe_id}")
def get_recipe(recipe_id: int):
    return database_call(catalog.CatalogRepository.recipe_detail, recipe_id)


@router.post("/recipes", status_code=201)
def create_recipe(data: RecipeInput):
    return database_call(catalog.CatalogRepository.save_recipe, data)


@router.put("/recipes/{recipe_id}")
def update_recipe(recipe_id: int, data: RecipeInput):
    return database_call(catalog.CatalogRepository.save_recipe, data, recipe_id)


@router.delete("/recipes/{recipe_id}")
def archive_recipe(recipe_id: int):
    return database_call(catalog.CatalogRepository.archive_recipe, recipe_id)


@router.get("/recipes")
def recipes():
    return database_call(catalog.CatalogRepository.list_recipes)
