"""Planificación, guardado y consulta de menús completos."""

from fastapi import APIRouter

from app.api.errors import database_call
from app.repositories import menu_plans
from app.schemas.menu_plans import MenuPlanInput, MenuPlanUpdate

router = APIRouter()


@router.get("/menus/{menu_id}/requirements")
def menu_requirements(menu_id: int):
    return database_call(menu_plans.MenuPlanRepository.requirements, menu_id)


@router.post("/menus/{menu_id}/calculate")
def menu_calculation(menu_id: int, data: MenuPlanInput):
    return database_call(menu_plans.MenuPlanRepository.calculate_menu, menu_id, data)


@router.post("/menus/{menu_id}/plans", status_code=201)
def menu_save_plan(menu_id: int, data: MenuPlanInput):
    return database_call(menu_plans.MenuPlanRepository.save_menu_plan, menu_id, data)


@router.get("/menu-plans")
def menu_plans_list():
    return database_call(menu_plans.MenuPlanRepository.saved_menu_plans)


@router.get("/menu-plans/{plan_id}")
def menu_plan_detail(plan_id: int):
    return database_call(menu_plans.MenuPlanRepository.saved_menu_plan, plan_id)


@router.put("/menu-plans/{plan_id}")
def menu_plan_update(plan_id: int, data: MenuPlanUpdate):
    return database_call(menu_plans.MenuPlanRepository.update_menu_plan, plan_id, data)


@router.get("/menu-plans/{plan_id}/revisions")
def menu_plan_revisions(plan_id: int):
    return database_call(menu_plans.MenuPlanRepository.revisions, plan_id)
