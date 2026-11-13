from fastapi import FastAPI

from app.api.router import api_router

app = FastAPI(
    title="MenúRentable AQP API",
    description="API para la planificación de porciones y compras de pequeños negocios de comida.",
    version="0.1.0",
)

app.include_router(api_router, prefix="/api")
