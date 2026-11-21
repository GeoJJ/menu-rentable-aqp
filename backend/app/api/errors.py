"""Traduce errores de persistencia a respuestas HTTP de la API."""

import logging

import psycopg
from fastapi import HTTPException


def database_call(operation, *args):
    try:
        return operation(*args)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except psycopg.errors.UniqueViolation:
        raise HTTPException(
            409, "Ya existe un registro para esa fecha o identificación"
        )
    except (psycopg.Error, RuntimeError):
        logging.exception("Error de persistencia")
        raise HTTPException(503, "No se pudo acceder a PostgreSQL")
