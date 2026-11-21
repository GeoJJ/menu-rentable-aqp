"""Persistencia de consultas y de los últimos datos externos válidos."""

import hashlib
import json

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.db.plans import connect

KEY = "midagri_aves_arequipa"


def status(key=KEY):
    with connect() as c:
        cursor = c.cursor(row_factory=dict_row)
        source = cursor.execute(
            "SELECT id,nombre,tipo,url_base,conector FROM fuentes_externas WHERE conector=%s AND activo",
            (key,),
        ).fetchone()
        if not source:
            raise ValueError("Fuente no disponible. Ejecuta las migraciones.")
        source["ultimo_intento"] = cursor.execute(
            "SELECT id,iniciado_en,terminado_en,estado,mensaje_error FROM consultas_fuentes WHERE fuente_id=%s ORDER BY iniciado_en DESC,id DESC LIMIT 1",
            (source["id"],),
        ).fetchone()
        source["ultimo_dato"] = cursor.execute(
            "SELECT r.id,r.titulo,r.url_origen,r.publicado_en,r.contenido,q.terminado_en AS recuperado_en FROM registros_externos r JOIN consultas_fuentes q ON q.id=r.consulta_id WHERE q.fuente_id=%s AND q.estado='correcto' ORDER BY q.terminado_en DESC,r.id DESC LIMIT 1",
            (source["id"],),
        ).fetchone()
        return source


def begin(source_id):
    with connect() as c:
        return c.execute(
            "INSERT INTO consultas_fuentes(fuente_id,estado) VALUES (%s,'ejecutando') RETURNING id",
            (source_id,),
        ).fetchone()[0]


def success(attempt_id, record):
    digest = hashlib.sha256(
        json.dumps(record, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()
    with connect() as c:
        c.execute(
            "INSERT INTO registros_externos(consulta_id,tipo_dato,titulo,url_origen,publicado_en,ubicacion,contenido,hash_contenido) VALUES (%s,'precio',%s,%s,%s,%s,%s,%s)",
            (
                attempt_id,
                record["titulo"],
                record["url_origen"],
                record["publicado_en"],
                record["contenido"]["ubicacion"],
                Jsonb(record["contenido"]),
                digest,
            ),
        )
        c.execute(
            "UPDATE consultas_fuentes SET estado='correcto',registros_obtenidos=1,terminado_en=now(),mensaje_error=NULL WHERE id=%s",
            (attempt_id,),
        )


def failure(attempt_id, message):
    with connect() as c:
        c.execute(
            "UPDATE consultas_fuentes SET estado='error',terminado_en=now(),mensaje_error=%s WHERE id=%s",
            (message[:500], attempt_id),
        )
