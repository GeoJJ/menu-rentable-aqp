from fastapi import APIRouter

from app.api.errors import database_call
from app.repositories import sources
from app.services.source_refresh import refresh

router = APIRouter()


@router.get("/sources/midagri")
def source_status():
    return database_call(sources.status)


@router.post("/sources/midagri/refresh")
def source_refresh(force: bool = False):
    return database_call(refresh, force)
