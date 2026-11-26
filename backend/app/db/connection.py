"""Único punto de conexión a PostgreSQL, configurado mediante DATABASE_URL."""

import os
import psycopg


class Database:
    @staticmethod
    def connect():
        url = os.getenv("DATABASE_URL")
        if not url:
            raise RuntimeError("Configura DATABASE_URL para PostgreSQL")
        return psycopg.connect(url, connect_timeout=5)


connect = Database.connect
