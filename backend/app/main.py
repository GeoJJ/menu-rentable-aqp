from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router

app = FastAPI(
    title="MenúRentable AQP API",
    description="API para la planificación de porciones y compras de pequeños negocios de comida.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)

app.include_router(api_router, prefix="/api")
