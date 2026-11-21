"""Actualización controlada; un fallo nunca borra el último dato válido."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import httpx
from pypdf.errors import PdfReadError

from app.db.plans import connect
from app.integrations.sources import midagri
from app.repositories import sources


def refresh(force=False):
    with connect() as guard:
        if not guard.execute("SELECT pg_try_advisory_xact_lock(20261120)").fetchone()[
            0
        ]:
            return {**sources.status(), "en_progreso": True}
        current = sources.status()
        now = datetime.now(timezone.utc)
        attempt = current["ultimo_intento"]
        last = current["ultimo_dato"]
        if attempt and now - attempt["iniciado_en"] < timedelta(seconds=60):
            return {**current, "en_cache": True}
        if not force and last and now - last["recuperado_en"] < timedelta(hours=6):
            return {**current, "en_cache": True}
        attempt_id = sources.begin(current["id"])
        try:
            record = midagri.retrieve(datetime.now(ZoneInfo("America/Lima")).date())
            sources.success(attempt_id, record)
        except midagri.SourceError as error:
            sources.failure(attempt_id, str(error))
        except httpx.HTTPError:
            sources.failure(
                attempt_id,
                "MIDAGRI no respondió correctamente. Puedes volver a intentarlo más tarde.",
            )
        except (PdfReadError, ValueError, UnicodeError):
            sources.failure(
                attempt_id,
                "El formato del boletín cambió y no se pudo interpretar con confianza.",
            )
        return sources.status()
