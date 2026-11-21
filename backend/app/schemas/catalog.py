from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Amount = Annotated[
    Decimal, Field(ge=0, max_digits=14, decimal_places=4, allow_inf_nan=False)
]


class IngredientInput(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    unidad_codigo: Literal["kg", "L", "unidad"]

    @field_validator("nombre")
    @classmethod
    def trim(cls, value):
        if not value.strip():
            raise ValueError("Escribe un nombre")
        return value.strip()


class StockInput(BaseModel):
    existencia: Amount
    costo_unitario: Amount
    precio_compra: Amount
    proveedor: str = Field(
        default="Cotización ingresada por el usuario", min_length=1, max_length=200
    )
    ubicacion: str = Field(default="Arequipa", min_length=1, max_length=200)


class RecipeItem(BaseModel):
    ingrediente_id: int = Field(gt=0)
    cantidad: Annotated[
        Decimal, Field(gt=0, max_digits=14, decimal_places=4, allow_inf_nan=False)
    ]


class RecipeInput(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    categoria: Literal["caldo", "segundo", "refresco", "entrada"]
    rendimiento: int = Field(gt=0, le=100000)
    preparacion: str = Field(default="", max_length=20000)
    ingredientes: list[RecipeItem] = Field(min_length=1, max_length=200)

    @field_validator("nombre")
    @classmethod
    def trim(cls, value):
        if not value.strip():
            raise ValueError("Escribe el nombre de la receta")
        return value.strip()

    @model_validator(mode="after")
    def unique_items(self):
        if len({i.ingrediente_id for i in self.ingredientes}) != len(self.ingredientes):
            raise ValueError("No repitas ingredientes")
        return self
