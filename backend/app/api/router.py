from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.menus import router as menus_router
from app.api.routes.planning import router as planning_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["estado"])
api_router.include_router(menus_router, tags=["menus"])
api_router.include_router(planning_router, tags=["planificacion-legada"])
