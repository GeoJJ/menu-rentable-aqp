"""Alta, edición y consulta de combinaciones de menú."""

from fastapi import APIRouter

from app.api.errors import database_call
from app.repositories import menus
from app.schemas.menus import MenuInput

router = APIRouter()


@router.get("/menus")
def get_menus():
    return database_call(menus.MenuRepository.list_menus)


@router.post("/menus", status_code=201)
def post_menu(data: MenuInput):
    return database_call(menus.MenuRepository.create_menu, data)


@router.get("/menus/{menu_id}")
def get_menu(menu_id: int):
    return database_call(menus.MenuRepository.get_menu, menu_id)


@router.put("/menus/{menu_id}")
def update_menu(menu_id: int, data: MenuInput):
    return database_call(menus.MenuRepository.update_menu, menu_id, data)
