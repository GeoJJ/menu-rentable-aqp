import os
from pathlib import Path

import psycopg
from psycopg.types.json import Jsonb


def connect():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("Configura DATABASE_URL para PostgreSQL")
    return psycopg.connect(url, connect_timeout=5)


def initialize():
    with connect() as connection:
        connection.execute(
            Path(__file__).with_name("schema.sql").read_text(encoding="utf-8-sig")
        )


def save_plan(day, document):
    with connect() as connection:
        connection.execute(
            "INSERT INTO daily_plans (plan_date, document) VALUES (%s, %s) ON CONFLICT (plan_date) DO UPDATE SET document=EXCLUDED.document, updated_at=now()",
            (day, Jsonb(document)),
        )


def list_plans():
    with connect() as connection:
        return [
            row[0]
            for row in connection.execute(
                "SELECT document FROM daily_plans ORDER BY plan_date DESC"
            )
        ]
