from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class MenuInput(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    precio_menu: Annotated[
        Decimal, Field(gt=0, max_digits=14, decimal_places=2, allow_inf_nan=False)
    ]
    recetas: list[int] = Field(min_length=3, max_length=3)

    @field_validator("nombre")
    @classmethod
    def clean_name(cls, value):
        if not value.strip():
            raise ValueError("Escribe el nombre del menú")
        return value.strip()

    @field_validator("recetas")
    @classmethod
    def distinct(cls, value):
        if len(set(value)) != 3:
            raise ValueError("Selecciona tres componentes distintos")
        return value
