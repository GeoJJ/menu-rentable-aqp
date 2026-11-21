"""Descubre el boletín de aves de MIDAGRI y extrae su referencia para Arequipa."""

import calendar
import io
import re
from datetime import date, timedelta
from decimal import Decimal
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader

COLLECTION_URL = "https://www.gob.pe/institucion/midagri/colecciones/94858-boletin-de-comercializacion-y-precios-de-aves-ano-2026"
ALLOWED_HOSTS = {"www.gob.pe", "cdn.www.gob.pe"}


class SourceError(Exception):
    """La fuente no se pudo leer o su formato no permite obtener un dato fiable."""


def read(client, url, limit=6_000_000):
    for _ in range(5):
        if (
            urlparse(url).scheme != "https"
            or urlparse(url).hostname not in ALLOWED_HOSTS
        ):
            raise SourceError("La fuente redirige a un dominio no reconocido.")
        with client.stream("GET", url) as response:
            if response.is_redirect:
                url = urljoin(url, response.headers.get("location", ""))
                continue
            response.raise_for_status()
            chunks = []
            size = 0
            for chunk in response.iter_bytes():
                size += len(chunk)
                if size > limit:
                    raise SourceError("El documento supera el tamaño admitido.")
                chunks.append(chunk)
            return b"".join(chunks)
    raise SourceError("La fuente realizó demasiadas redirecciones.")


def discover_months(html):
    result = {}
    for a in BeautifulSoup(html, "html.parser").find_all("a", href=True):
        url = urljoin(COLLECTION_URL, a["href"])
        match = re.search(
            r"/informes-publicaciones/(\d+)-boletin-de-comercializacion-y-precios-de-aves-[a-z]+-(\d{4})$",
            urlparse(url).path,
        )
        if match and urlparse(url).hostname == "www.gob.pe":
            result[int(match[1])] = url
    if not result:
        raise SourceError(
            "No se encontraron boletines mensuales en la colección oficial."
        )
    return [result[key] for key in sorted(result, reverse=True)]


def discover_documents(html, today):
    result = {}
    for a in BeautifulSoup(html, "html.parser").find_all("a", href=True):
        url = urljoin(COLLECTION_URL, a["href"])
        match = re.search(r"aves-(\d{2})-(\d{2})-(\d{4})\.pdf", urlparse(url).path)
        if not match or urlparse(url).hostname != "cdn.www.gob.pe":
            continue
        try:
            day = date(int(match[3]), int(match[2]), int(match[1]))
        except ValueError:
            continue
        if day <= today:
            result.setdefault(day, url)
    return sorted(result.items(), reverse=True)


def parse_arequipa(text, published):
    # Solo la tabla de pollo vivo de Arequipa; no confundir con Lima ni promedios mensuales.
    sections = re.split(r"\bAREQUIPA\b", text, flags=re.I)
    for section in sections[1:]:
        if not re.search(r"Oferta de pollo vivo y precio mayorista", section, re.I):
            continue
        match = re.search(
            r"^\s*Al mayorista\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+[-\d.,]+%",
            section,
            re.M,
        )
        if not match:
            continue
        header = section[: match.start()]
        days = re.findall(
            r"\b(?:lun|mar|mi[eé]|jue|vie|s[aá]b|dom)\.?\s+(\d{1,2})\b", header, re.I
        )
        if len(days) < 2:
            raise SourceError("No se pudo identificar la fecha del precio de Arequipa.")
        day = int(days[-1])
        year, month = published.year, published.month
        if day > published.day:
            previous = published.replace(day=1) - timedelta(days=1)
            year, month = previous.year, previous.month
        if day > calendar.monthrange(year, month)[1]:
            raise SourceError("La fecha de la tabla no es válida.")
        observed = date(year, month, day)
        if (published - observed).days > 7:
            raise SourceError(
                "La fecha extraída no corresponde a una observación reciente del boletín."
            )
        price = Decimal(match[3].replace(",", "."))
        if not Decimal("0") < price < Decimal("100"):
            raise SourceError("El precio extraído está fuera del rango esperado.")
        return {
            "producto": "Pollo vivo",
            "tipo_precio": "referencial",
            "precio": str(price),
            "moneda": "PEN",
            "unidad": "kg",
            "fecha_precio": observed.isoformat(),
            "ubicacion": "Arequipa · centros de distribución mayorista",
            "advertencia": "Es pollo vivo al mayorista. No equivale al pollo eviscerado de tus recetas ni garantiza el precio de compra de tu proveedor.",
            "extracto": match[0].strip(),
        }
    raise SourceError(
        "El boletín no contiene la tabla esperada de pollo vivo de Arequipa. Se conservan los últimos datos válidos."
    )


def retrieve(today=None):
    today = today or date.today()
    with httpx.Client(
        timeout=httpx.Timeout(18, connect=8),
        headers={"User-Agent": "MenuRentableAQP/0.2 (consulta de boletines publicos)"},
    ) as client:
        months = discover_months(read(client, COLLECTION_URL).decode("utf-8"))
        documents = []
        for month in months[:2]:
            documents = discover_documents(read(client, month).decode("utf-8"), today)
            if documents:
                break
        if not documents:
            raise SourceError("No se encontraron documentos con fecha válida.")
        published, url = documents[0]
        content = read(client, url)
        if not content.startswith(b"%PDF"):
            raise SourceError("La fuente no entregó un PDF válido.")
        reader = PdfReader(io.BytesIO(content))
        if len(reader.pages) > 12:
            raise SourceError(
                "El documento no tiene el tamaño esperado de un boletín diario."
            )
        for page in reader.pages:
            text = page.extract_text(extraction_mode="layout") or ""
            if re.search(r"Oferta de pollo vivo y precio mayorista", text, re.I):
                observation = parse_arequipa(text, published)
                return {
                    "titulo": "Precio referencial de pollo vivo en Arequipa",
                    "publicado_en": published.isoformat(),
                    "url_origen": url,
                    "contenido": observation,
                }
        raise SourceError("No se encontró la sección esperada de Arequipa.")
