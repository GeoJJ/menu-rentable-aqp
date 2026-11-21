import logging

import psycopg
from fastapi import APIRouter, HTTPException

from app.repositories import menus
from app.schemas.menus import MenuInput

router = APIRouter()


def database_call(operation, *args):
    try:
        return operation(*args)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except psycopg.errors.UniqueViolation:
        raise HTTPException(
            409, "Ya existe un registro para esa fecha o identificación"
        )
    except (psycopg.Error, RuntimeError):
        logging.exception("Error de persistencia de menús")
        raise HTTPException(503, "No se pudo acceder a PostgreSQL")


@router.get("/recipes")
def recipes():
    return database_call(menus.list_recipes)


@router.get("/menus")
def get_menus():
    return database_call(menus.list_menus)


@router.post("/menus", status_code=201)
def post_menu(data: MenuInput):
    return database_call(menus.create_menu, data)


from app.repositories import menu_plans
from app.schemas.menu_plans import MenuPlanInput


@router.get("/menus/{menu_id}/requirements")
def menu_requirements(menu_id: int):
    return database_call(menu_plans.requirements, menu_id)


@router.post("/menus/{menu_id}/calculate")
def menu_calculation(menu_id: int, data: MenuPlanInput):
    return database_call(menu_plans.calculate_menu, menu_id, data)


@router.post("/menus/{menu_id}/plans", status_code=201)
def menu_save_plan(menu_id: int, data: MenuPlanInput):
    return database_call(menu_plans.save_menu_plan, menu_id, data)


@router.get("/menu-plans")
def menu_plans_list():
    return database_call(menu_plans.saved_menu_plans)
