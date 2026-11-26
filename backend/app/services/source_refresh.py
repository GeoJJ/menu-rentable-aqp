"""Actualización controlada; un fallo nunca borra el último dato válido."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import httpx
from pypdf.errors import PdfReadError

from app.db.connection import connect
from app.integrations.sources import midagri
from app.integrations.sources.errors import SourceError
from app.integrations.sources.plazavea import PlazaVeaConnector
from app.integrations.sources.adra import AdraConnector
from app.repositories import sources


class SourceRefreshService:
    """Actualización de fuentes con caché y conservación ante errores."""

    @staticmethod
    def refresh(force=False, key=sources.KEY):
        connectors = {
            sources.KEY: midagri.MidagriConnector.retrieve,
            "plazavea": PlazaVeaConnector.retrieve,
            "adra": AdraConnector.retrieve,
        }
        if key not in connectors:
            raise ValueError("Conector no disponible")
        current = sources.SourceRepository.status(key)
        with connect() as guard:
            if not guard.execute(
                "SELECT pg_try_advisory_xact_lock(%s)", (20261120 + current["id"],)
            ).fetchone()[0]:
                return {**sources.SourceRepository.status(key), "en_progreso": True}
            current = sources.SourceRepository.status(key)
            now = datetime.now(timezone.utc)
            attempt = current["ultimo_intento"]
            last = current["ultimo_dato"]
            if attempt and now - attempt["iniciado_en"] < timedelta(seconds=60):
                return {**current, "en_cache": True}
            if not force and last and now - last["recuperado_en"] < timedelta(hours=6):
                return {**current, "en_cache": True}
            attempt_id = sources.SourceRepository.begin(current["id"])
            try:
                record = connectors[key](datetime.now(ZoneInfo("America/Lima")).date())
                sources.SourceRepository.success(attempt_id, record)
            except SourceError as error:
                sources.SourceRepository.failure(attempt_id, str(error))
            except httpx.HTTPError:
                sources.SourceRepository.failure(
                    attempt_id,
                    "La fuente no respondió correctamente. Puedes volver a intentarlo más tarde.",
                )
            except (PdfReadError, ValueError, UnicodeError, KeyError, TypeError):
                sources.SourceRepository.failure(
                    attempt_id,
                    "El formato del boletín cambió y no se pudo interpretar con confianza.",
                )
            return sources.SourceRepository.status(key)
