from fastapi import APIRouter

from app.api.errors import database_call
from app.repositories import sources
from app.services.source_refresh import SourceRefreshService

router = APIRouter()


@router.get("/sources")
def source_list():
    return database_call(sources.SourceRepository.list_sources)


@router.post("/sources/{key}/refresh")
def refresh_source(key: str, force: bool = False):
    key = sources.KEY if key == "midagri" else key
    return database_call(SourceRefreshService.refresh, force, key)


@router.get("/sources/midagri")
def source_status():
    return database_call(sources.SourceRepository.status)
