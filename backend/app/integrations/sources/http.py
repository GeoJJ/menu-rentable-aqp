"""Descarga acotada de páginas públicas de los conectores configurados."""

from urllib.parse import urlparse
import httpx
from app.integrations.sources.errors import SourceError


def download(url):
    # URLs de los conectores, nunca una URL arbitraria enviada por el navegador.
    if urlparse(url).scheme != "https" or urlparse(url).hostname not in {
        "www.plazavea.com.pe",
        "adra.org.pe",
    }:
        raise SourceError("Dominio de fuente no permitido")
    with httpx.Client(timeout=20) as client:
        with client.stream("GET", url) as response:
            response.raise_for_status()
            content = bytearray()
            for block in response.iter_bytes():
                content.extend(block)
                if len(content) > 6_000_000:
                    raise SourceError("Respuesta demasiado grande")
    return bytes(content)
