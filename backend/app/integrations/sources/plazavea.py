"""Lectura y validación de la fuente externa."""

import json
import re
from datetime import date
from decimal import Decimal
from urllib.parse import urlparse
from app.integrations.sources.errors import SourceError
from app.integrations.sources.http import download


class PlazaVeaConnector:
    URL = "https://www.plazavea.com.pe/api/catalog_system/pub/products/search?ft=arroz&_from=0&_to=2"

    @staticmethod
    def parse(products, today):
        records = []
        for product in products:
            name = product.get("productName", "")
            size = re.search(r"(\d+(?:[.,]\d+)?)\s*kg\b", name, re.I)
            url = product.get("link", "")
            if (
                not name.lower().startswith("arroz ")
                or not size
                or urlparse(url).hostname != "www.plazavea.com.pe"
            ):
                continue
            kg = Decimal(size[1].replace(",", "."))
            if kg <= 0:
                continue
            for item in product.get("items", []):
                sellers = [s for s in item.get("sellers", []) if s.get("sellerDefault")]
                for seller in sellers:
                    offer = seller.get("commertialOffer", {})
                    price = Decimal(str(offer.get("Price", 0)))
                    if (
                        not price.is_finite()
                        or price <= 0
                        or offer.get("AvailableQuantity", 0) <= 0
                    ):
                        continue
                    records.append(
                        {
                            "titulo": name,
                            "url_origen": url,
                            "publicado_en": None,
                            "tipo_dato": "producto",
                            "contenido": {
                                "producto": name,
                                "codigo_externo": str(product["productId"]),
                                "precio": str(price),
                                "contenido_kg": str(kg),
                                "precio_por_kg": str(
                                    (price / kg).quantize(Decimal(".0001"))
                                ),
                                "moneda": "PEN",
                                "unidad": "envase",
                                "fecha_precio": today.isoformat(),
                                "ubicacion": "Catálogo online · cobertura y tienda sin verificar",
                                "advertencia": "Precio observado online, sujeto a condiciones de tienda. Confirma entrega en Arequipa y condiciones antes de comprar; no modifica tu inventario.",
                            },
                        }
                    )
                    break
        if not records:
            raise SourceError(
                "El catálogo no entregó arroz con precio y contenido verificables"
            )
        return records

    @classmethod
    def retrieve(cls, today=None):
        return cls.parse(json.loads(download(cls.URL)), today or date.today())
