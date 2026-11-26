"""Persistencia de consultas y de los últimos datos externos válidos."""

import hashlib
import json

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.db.connection import connect

KEY = "midagri_aves_arequipa"


class SourceRepository:
    """Persistencia y trazabilidad de consultas externas."""

    @staticmethod
    def list_sources():
        with connect() as c:
            keys = [
                r[0]
                for r in c.execute(
                    "SELECT conector FROM fuentes_externas WHERE activo ORDER BY id"
                )
            ]
        return [SourceRepository.status(key) for key in keys]

    @staticmethod
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
            source["registros"] = cursor.execute(
                "SELECT r.id,r.titulo,r.url_origen,r.publicado_en,r.contenido FROM registros_externos r WHERE r.consulta_id=(SELECT id FROM consultas_fuentes WHERE fuente_id=%s AND estado='correcto' ORDER BY terminado_en DESC,id DESC LIMIT 1) ORDER BY r.id",
                (source["id"],),
            ).fetchall()
            return source

    @staticmethod
    def begin(source_id):
        with connect() as c:
            return c.execute(
                "INSERT INTO consultas_fuentes(fuente_id,estado) VALUES (%s,'ejecutando') RETURNING id",
                (source_id,),
            ).fetchone()[0]

    @staticmethod
    def success(attempt_id, record):
        records = record if isinstance(record, list) else [record]
        if not records:
            raise ValueError("La fuente no entregó registros")
        with connect() as c:
            for record in records:
                digest = hashlib.sha256(
                    json.dumps(record, sort_keys=True, ensure_ascii=False).encode()
                ).hexdigest()
                c.execute(
                    "INSERT INTO registros_externos(consulta_id,tipo_dato,titulo,url_origen,publicado_en,ubicacion,contenido,hash_contenido) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        attempt_id,
                        record.get("tipo_dato", "precio"),
                        record["titulo"],
                        record["url_origen"],
                        record["publicado_en"],
                        record["contenido"]["ubicacion"],
                        Jsonb(record["contenido"]),
                        digest,
                    ),
                )
            c.execute(
                "UPDATE consultas_fuentes SET estado='correcto',registros_obtenidos=%s,terminado_en=now(),mensaje_error=NULL WHERE id=%s",
                (len(records), attempt_id),
            )

    @staticmethod
    def failure(attempt_id, message):
        with connect() as c:
            c.execute(
                "UPDATE consultas_fuentes SET estado='error',terminado_en=now(),mensaje_error=%s WHERE id=%s",
                (message[:500], attempt_id),
            )
