from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field, field_validator

Number = Annotated[
    Decimal, Field(ge=0, max_digits=14, decimal_places=4, allow_inf_nan=False)
]


class PlanIngredientInput(BaseModel):
    existencia: Number
    costo_unitario: Number
    precio_compra: Number


class MenuPlanInput(BaseModel):
    fecha: date
    cantidad: int = Field(gt=0, le=100000)
    presupuesto: Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2)]
    insumos: dict[int, PlanIngredientInput]


class MenuPlanUpdate(MenuPlanInput):
    menu_id: int = Field(gt=0)
    version: int = Field(gt=0)
    motivo: str = Field(min_length=3, max_length=500)

    @field_validator("motivo", mode="before")
    @classmethod
    def trim_reason(cls, value):
        return value.strip() if isinstance(value, str) else value
