import pytest
from app.main import app
from app.services.planning import PlanningRequest, plan
from fastapi.testclient import TestClient


@pytest.fixture
def payload():
    return {
        "date": "2026-11-20",
        "budget": 100,
        "selected": [
            {
                "id": "rice",
                "name": "Arroz",
                "yield": 10,
                "price": 12,
                "items": {"arroz": 1},
            }
        ],
        "inventory": [
            {"id": "arroz", "name": "Arroz", "unit": "kg", "stock": 0, "cost": 4}
        ],
        "catalog": [
            {"id": "bag", "ingredient": "arroz", "name": "Bolsa", "size": 1, "price": 4}
        ],
        "entries": [],
        "scenario": "Base",
    }


def test_packages_margin_and_budget(payload):
    result = plan(PlanningRequest(**payload))["active"]
    assert result["quantity"] == 10
    assert result["purchase"] == 4
    assert result["margin"] == 116
    payload["budget"] = 3
    assert not plan(PlanningRequest(**payload))["active"]["feasible"]


def test_real_history_preferred_and_future_excluded(payload):
    payload["entries"] = [
        {"date": "2026-11-13", "recipeId": "rice", "sold": 20},
        {"date": "2026-11-06", "recipeId": "rice", "sold": 100, "demo": True},
        {"date": "2026-11-27", "recipeId": "rice", "sold": 999},
    ]
    assert plan(PlanningRequest(**payload))["estimates"]["rice"]["count"] == 20


def test_missing_quote_is_not_feasible(payload):
    payload["catalog"] = []
    result = plan(PlanningRequest(**payload))["active"]
    assert result["pending"] and not result["feasible"]


def test_zero_yield_and_unknown_ingredient_rejected(payload):
    client = TestClient(app)
    payload["selected"][0]["yield"] = 0
    assert client.post("/api/planning/calculate", json=payload).status_code == 422
    payload["selected"][0]["yield"] = 10
    payload["selected"][0]["items"]["unknown"] = 1
    assert client.post("/api/planning/calculate", json=payload).status_code == 422


def test_wrong_quote_rejected(payload):
    payload["choices"] = {"arroz": "unknown"}
    assert (
        TestClient(app).post("/api/planning/calculate", json=payload).status_code == 422
    )


def test_postgres_roundtrip(payload, monkeypatch):
    import os

    if not os.getenv("TEST_DATABASE_URL"):
        pytest.skip("Requiere TEST_DATABASE_URL de una base de pruebas")
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    from app.db.plans import connect, initialize

    initialize()
    client = TestClient(app)
    try:
        response = client.post("/api/plans", json=payload)
        assert response.status_code == 200
        assert any(
            p["date"] == payload["date"] and p["margin"] == 116
            for p in client.get("/api/plans").json()
        )
    finally:
        with connect() as connection:
            connection.execute(
                "DELETE FROM daily_plans WHERE plan_date=%s", (payload["date"],)
            )
