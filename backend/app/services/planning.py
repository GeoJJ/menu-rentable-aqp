from datetime import date
from math import ceil, floor
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

NonNegative = Annotated[float, Field(ge=0, allow_inf_nan=False)]


class Recipe(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)
    id: str
    name: str
    portions: Annotated[float, Field(gt=0, allow_inf_nan=False)] = Field(alias="yield")
    price: NonNegative
    items: dict[str, NonNegative]


class Ingredient(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    unit: str
    stock: NonNegative
    cost: NonNegative


class Product(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    ingredient: str
    name: str
    size: Annotated[float, Field(gt=0, allow_inf_nan=False)]
    price: NonNegative


class Entry(BaseModel):
    date: date
    recipeId: str
    sold: Annotated[int, Field(ge=0)]
    demo: bool = False
    soldOut: bool = False


class PlanningRequest(BaseModel):
    date: date
    selected: list[Recipe]
    inventory: list[Ingredient]
    catalog: list[Product]
    entries: list[Entry] = []
    choices: dict[str, str] = {}
    overrides: dict[str, Annotated[int, Field(ge=0)]] = {}
    budget: NonNegative
    scenario: str = ""

    @model_validator(mode="after")
    def validate_references(self):
        for rows in (self.selected, self.inventory, self.catalog):
            ids = [r.id for r in rows]
            if len(ids) != len(set(ids)):
                raise ValueError("Los identificadores deben ser unicos")
        ingredients = {i.id for i in self.inventory}
        for recipe in self.selected:
            if set(recipe.items) - ingredients:
                raise ValueError("La receta contiene ingredientes sin inventario")
        products = {p.id: p for p in self.catalog}
        for ingredient, product in self.choices.items():
            if product not in products or products[product].ingredient != ingredient:
                raise ValueError("La cotizacion no corresponde al ingrediente")
        return self


def estimate(recipe, target, entries):
    matching = [
        r
        for r in entries
        if r.date < target
        and r.recipeId == recipe.id
        and r.date.weekday() == target.weekday()
    ]
    actual = [r for r in matching if not r.demo]
    samples = actual or matching
    return {
        "count": floor(sum(r.sold for r in samples) / len(samples) + 0.5)
        if samples
        else {"arroz-pollo": 30, "estofado": 20}.get(recipe.id, recipe.portions),
        "samples": len(samples),
        "demo": not bool(actual),
        "soldOut": sum(r.soldOut for r in samples),
    }


def calculate(request, name, factor, estimates, overrides=None):
    plates = []
    for recipe in request.selected:
        demand = estimates[recipe.id]["count"]
        quantity = (overrides or {}).get(recipe.id, floor(demand * factor + 0.5))
        sold = min(quantity, demand)
        plates.append(
            {
                "recipe": recipe.model_dump(by_alias=True),
                "quantity": quantity,
                "sold": sold,
                "leftovers": quantity - sold,
            }
        )
    supplies = []
    for item in request.inventory:
        required = sum(
            p["recipe"]["items"].get(item.id, 0) * p["quantity"] / p["recipe"]["yield"]
            for p in plates
        )
        if required <= 0:
            continue
        missing = max(0, required - item.stock)
        options = [p for p in request.catalog if p.ingredient == item.id]
        product = next(
            (p for p in options if p.id == request.choices.get(item.id)),
            options[0] if options else None,
        )
        packages = (
            ceil(missing / product.size - 1e-8) if missing > 1e-8 and product else 0
        )
        supplies.append(
            {
                **item.model_dump(),
                "required": required,
                "missing": missing,
                "product": product.model_dump() if product else None,
                "packages": packages,
                "purchase": packages * product.price if product else 0,
                "consumed": min(required, item.stock) * item.cost
                + missing * (product.price / product.size if product else item.cost),
                "remaining": max(
                    0,
                    item.stock + packages * (product.size if product else 0) - required,
                ),
            }
        )
    purchase = sum(s["purchase"] for s in supplies)
    consumed = sum(s["consumed"] for s in supplies)
    revenue = sum(p["sold"] * p["recipe"]["price"] for p in plates)
    pending = any(s["missing"] > 1e-8 and not s["product"] for s in supplies)
    return {
        "name": name,
        "factor": factor,
        "plates": plates,
        "supplies": supplies,
        "purchase": purchase,
        "consumed": consumed,
        "revenue": revenue,
        "margin": revenue - consumed,
        "pending": pending,
        "feasible": not pending and purchase <= request.budget + 1e-8,
        **{
            key: sum(p[key] for p in plates)
            for key in ("quantity", "sold", "leftovers")
        },
    }


def plan(request):
    estimates = {
        r.id: estimate(r, request.date, request.entries) for r in request.selected
    }
    scenarios = [
        calculate(request, name, factor, estimates)
        for name, factor in [("Conservador", 0.85), ("Base", 1), ("Ampliado", 1.15)]
    ]
    feasible = [s for s in scenarios if s["feasible"]]
    recommendation = max(feasible, key=lambda s: s["margin"]) if feasible else None
    base = next(
        (s for s in scenarios if s["name"] == request.scenario),
        recommendation or scenarios[1],
    )
    return {
        "estimates": estimates,
        "scenarios": scenarios,
        "recommendation": recommendation,
        "base": base,
        "active": calculate(
            request, base["name"], base["factor"], estimates, request.overrides
        ),
    }
