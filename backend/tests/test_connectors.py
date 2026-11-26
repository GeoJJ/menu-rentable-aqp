from datetime import date
from decimal import Decimal
import pytest
from app.integrations.sources.plazavea import PlazaVeaConnector
from app.integrations.sources.adra import AdraConnector
from app.integrations.sources.errors import SourceError


def test_private_connector_filters_appliances_and_unavailable_prices():
    def product(name, price, stock=5):
        return {
            "productId": "561",
            "productName": name,
            "link": "https://www.plazavea.com.pe/arroz/p",
            "items": [
                {
                    "sellers": [
                        {
                            "sellerDefault": True,
                            "commertialOffer": {
                                "Price": price,
                                "AvailableQuantity": stock,
                            },
                        }
                    ]
                }
            ],
        }

    data = [
        product("Olla arrocera 5Kg", 100),
        product("Arroz bolsa 5Kg", 20),
        product("Arroz bolsa 1Kg", 3, 0),
    ]
    result = PlazaVeaConnector.parse(data, date(2026, 11, 26))
    assert len(result) == 1
    assert Decimal(result[0]["contenido"]["precio_por_kg"]) == 4
    assert result[0]["publicado_en"] is None
    assert result[0]["contenido"]["fecha_precio"] == "2026-11-26"


def test_private_connector_rejects_changed_or_empty_format():
    with pytest.raises(SourceError):
        PlazaVeaConnector.parse([], date(2026, 11, 26))


def test_ngo_extracts_arequipa_numbers_and_publication_date():
    html = """<script type="application/ld+json">{"datePublished":"2026-02-05T12:00:00Z"}</script><h3>Impacto en Arequipa</h3><p>372,54 toneladas y aproximadamente 85 000 personas.</p>"""
    record = AdraConnector.parse(html)
    assert record["contenido"]["toneladas_rescatadas"] == "372.54"
    assert record["contenido"]["personas_beneficiadas_aprox"] == 85000
    assert record["publicado_en"] == "2026-02-05"
    assert "precio" not in record["contenido"]
    with pytest.raises(SourceError):
        AdraConnector.parse("<h1>Página distinta</h1>")


def test_private_refresh_persists_records_and_preserves_on_failure(client, monkeypatch):
    api, connection = client
    with connection() as c:
        c.execute(
            "INSERT INTO fuentes_externas(nombre,tipo,url_base,conector) VALUES ('Privada','privada','https://www.plazavea.com.pe','plazavea')"
        )
    record = {
        "titulo": "Arroz",
        "tipo_dato": "producto",
        "url_origen": "https://www.plazavea.com.pe/arroz/p",
        "publicado_en": None,
        "contenido": {"ubicacion": "Online", "precio": "20"},
    }
    monkeypatch.setattr(PlazaVeaConnector, "retrieve", lambda today: [record])
    initial = api.post("/api/sources/plazavea/refresh").json()
    assert initial["ultimo_intento"]["estado"] == "correcto"
    assert len(initial["registros"]) == 1
    with connection() as c:
        c.execute(
            "UPDATE consultas_fuentes SET iniciado_en=now()-interval '7 hours',terminado_en=now()-interval '7 hours'"
        )

    def fail(today):
        raise SourceError("Cambio de formato")

    monkeypatch.setattr(PlazaVeaConnector, "retrieve", fail)
    failed = api.post("/api/sources/plazavea/refresh").json()
    assert failed["ultimo_intento"]["estado"] == "error"
    assert failed["ultimo_dato"]["id"] == initial["ultimo_dato"]["id"]
