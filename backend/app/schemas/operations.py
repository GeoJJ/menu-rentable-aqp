from decimal import Decimal
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Amount = Annotated[
    Decimal, Field(ge=0, max_digits=14, decimal_places=4, allow_inf_nan=False)
]
Money = Annotated[
    Decimal, Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False)
]


class InventoryMovementInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    ingrediente_id: int = Field(gt=0)
    tipo: Literal["compra", "merma"]
    cantidad: Annotated[
        Decimal, Field(gt=0, max_digits=14, decimal_places=4, allow_inf_nan=False)
    ]
    costo_unitario: Amount = Decimal(0)
    importe_total: Money | None = None
    motivo: str = Field(min_length=3, max_length=500)

    @model_validator(mode="after")
    def validate_price(self):
        if self.importe_total is not None and (
            self.tipo != "compra" or self.costo_unitario != 0
        ):
            raise ValueError(
                "En una compra indica el total pagado o el precio unitario, no ambos"
            )
        return self


class DayClosingInput(BaseModel):
    preparadas: int = Field(ge=0, le=100000)
    vendidas: int = Field(ge=0, le=100000)
    precio_menu_real: Money
    gastos_adicionales: Money = Decimal(0)

    @model_validator(mode="after")
    def validate_sales(self):
        if self.vendidas > self.preparadas:
            raise ValueError("Las ventas no pueden superar los menús preparados")
        return self


class CancellationInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    motivo: str = Field(min_length=3, max_length=500)
