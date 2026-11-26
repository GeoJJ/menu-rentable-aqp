"""Lectura y validación de la fuente externa."""

import json
import re
from datetime import date
from decimal import Decimal
from bs4 import BeautifulSoup
from app.integrations.sources.errors import SourceError
from app.integrations.sources.http import download


class AdraConnector:
    URL = "https://adra.org.pe/adra-peru-rescata-mas-de-900-toneladas-de-alimentos-en-2025/"

    @classmethod
    def parse(cls, html):
        soup = BeautifulSoup(html, "html.parser")
        heading = soup.find(
            lambda tag: tag.name in ("h2", "h3")
            and tag.get_text(strip=True).lower() == "impacto en arequipa"
        )
        paragraph = heading.find_next("p") if heading else None
        text = paragraph.get_text(" ", strip=True) if paragraph else ""
        tonnes = re.search(r"(\d+[.,]\d+)\s+toneladas", text, re.I)
        beneficiaries = re.search(r"(\d[\d\s.,]*)\s+personas", text, re.I)
        published = None
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or script.get_text())
            except (ValueError, TypeError):
                continue
            nodes = data.get("@graph", [data]) if isinstance(data, dict) else data
            for node in nodes:
                if isinstance(node, dict) and node.get("datePublished"):
                    published = date.fromisoformat(
                        node["datePublished"][:10]
                    ).isoformat()
        if not tonnes or not beneficiaries or not published:
            raise SourceError(
                "La publicación de ADRA cambió y no permite verificar las cifras"
            )
        return {
            "titulo": "Rescate de alimentos en Arequipa · ADRA 2025",
            "url_origen": cls.URL,
            "publicado_en": published,
            "tipo_dato": "publicacion",
            "contenido": {
                "ubicacion": "Arequipa",
                "periodo": 2025,
                "toneladas_rescatadas": str(Decimal(tonnes[1].replace(",", "."))),
                "personas_beneficiadas_aprox": int(re.sub(r"\D", "", beneficiaries[1])),
                "advertencia": "Indicador histórico de una publicación de ADRA. No es precio ni disponibilidad para recibir sobrantes; verifica condiciones con la organización.",
            },
        }

    @classmethod
    def retrieve(cls, today=None):
        return cls.parse(download(cls.URL))
