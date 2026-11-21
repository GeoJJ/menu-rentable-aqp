from fastapi import APIRouter

from app.services.planning import PlanningRequest, plan

router = APIRouter()


@router.post("/planning/calculate")
def calculate_plan(request: PlanningRequest):
    return plan(request)


import logging

import psycopg
from fastapi import HTTPException

from app.db.plans import list_plans, save_plan


@router.post("/plans")
def persist_plan(request: PlanningRequest):
    result = plan(request)["active"]
    if not result["feasible"] or not result["quantity"]:
        raise HTTPException(
            422, "El plan debe contener porciones y respetar el presupuesto"
        )
    document = {**result, "date": request.date.isoformat(), "budget": request.budget}
    try:
        save_plan(request.date, document)
    except (psycopg.Error, RuntimeError):
        logging.exception("No se pudo guardar el plan")
        raise HTTPException(503, "No se pudo guardar en PostgreSQL")
    return document


@router.get("/plans")
def get_plans():
    try:
        return list_plans()
    except (psycopg.Error, RuntimeError):
        raise HTTPException(503, "No se pudieron consultar los planes en PostgreSQL")
