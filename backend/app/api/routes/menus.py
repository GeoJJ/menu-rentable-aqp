"""Alta y consulta de combinaciones de menú."""

from fastapi import APIRouter

from app.api.errors import database_call
from app.repositories import menus
from app.schemas.menus import MenuInput

router = APIRouter()


@router.get("/menus")
def get_menus():
    return database_call(menus.list_menus)


@router.post("/menus", status_code=201)
def post_menu(data: MenuInput):
    return database_call(menus.create_menu, data)
