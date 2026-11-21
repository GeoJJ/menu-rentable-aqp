from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.menu_plans import router as menu_plans_router
from app.api.routes.menus import router as menus_router
from app.api.routes.planning import router as planning_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["estado"])
api_router.include_router(menus_router, tags=["menus"])
api_router.include_router(menu_plans_router, tags=["planes"])
api_router.include_router(planning_router, tags=["planificacion-legada"])

from app.api.routes.catalog import router as catalog_router

api_router.include_router(catalog_router, tags=["cocina"])

from app.api.routes.sources import router as sources_router

api_router.include_router(sources_router, tags=["fuentes-externas"])
