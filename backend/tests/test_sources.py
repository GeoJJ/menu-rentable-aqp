from datetime import date
from decimal import Decimal

import pytest
from app.integrations.sources import midagri


def test_discovery_uses_document_date_and_excludes_future():
    html = """<a href="https://cdn.www.gob.pe/uploads/aves-19-11-2026.pdf">PDF</a><a href="https://cdn.www.gob.pe/uploads/aves-21-11-2026.pdf">Futuro</a><a href="https://other.test/aves-20-11-2026.pdf">Otro dominio</a>"""
    result = midagri.MidagriConnector.discover_documents(html, date(2026, 11, 20))
    assert len(result) == 1 and result[0][0] == date(2026, 11, 19)


def test_arequipa_price_is_latest_column_not_average_or_lima():
    text = """LIMA\nAl mayorista 10.00 11.00 12.00 0.0%\nAREQUIPA\nOferta de pollo vivo y precio mayorista\nPollo Precio promedio mié 18 jue 19 Var.\nAl mayorista 6.68 6.57 6.66 1.46%\n"""
    result = midagri.MidagriConnector.parse_arequipa(text, date(2026, 11, 20))
    assert Decimal(result["precio"]) == Decimal("6.66")
    assert result["fecha_precio"] == "2026-11-19"
    assert result["producto"] == "Pollo vivo"


def test_changed_format_is_rejected():
    with pytest.raises(midagri.SourceError):
        midagri.MidagriConnector.parse_arequipa(
            "AREQUIPA: sin tabla", date(2026, 11, 20)
        )


def test_price_date_can_be_previous_month():
    text = """AREQUIPA\nOferta de pollo vivo y precio mayorista\nPollo Precio promedio jue 30 vie 31 Var.\nAl mayorista 6.68 6.57 6.66 1.46%"""
    assert (
        midagri.MidagriConnector.parse_arequipa(text, date(2026, 11, 1))["fecha_precio"]
        == "2026-10-31"
    )


def test_source_refresh_cache_and_failure_preserve_last_data(client, monkeypatch):
    from app.repositories import sources
    from app.services import source_refresh

    api, connection = client
    monkeypatch.setattr(sources, "connect", connection)
    monkeypatch.setattr(source_refresh, "connect", connection)
    with connection() as c:
        c.execute(
            "INSERT INTO fuentes_externas(nombre,tipo,url_base,conector) VALUES ('MIDAGRI','estado',%s,%s)",
            (midagri.COLLECTION_URL, sources.KEY),
        )
    record = {
        "titulo": "Precio de prueba",
        "publicado_en": "2026-11-20",
        "url_origen": "https://cdn.www.gob.pe/aves-20-11-2026.pdf",
        "contenido": {
            "precio": "6.66",
            "producto": "Pollo vivo",
            "ubicacion": "Arequipa",
            "fecha_precio": "2026-11-19",
            "moneda": "PEN",
            "unidad": "kg",
        },
    }
    calls = []

    def retrieve(today):
        calls.append(today)
        return record

    monkeypatch.setattr(midagri.MidagriConnector, "retrieve", retrieve)
    response = api.post("/api/sources/midagri/refresh")
    assert response.status_code == 200
    result = response.json()
    assert result["ultimo_intento"]["estado"] == "correcto"
    rid = result["ultimo_dato"]["id"]
    assert len(calls) == 1
    assert api.post("/api/sources/midagri/refresh").json()["en_cache"]
    assert len(calls) == 1
    with connection() as c:
        c.execute(
            "UPDATE consultas_fuentes SET iniciado_en=now()-interval '7 hours',terminado_en=now()-interval '7 hours'"
        )

    def unavailable(today):
        raise midagri.SourceError("La fuente no está disponible")

    monkeypatch.setattr(midagri.MidagriConnector, "retrieve", unavailable)
    result = api.post("/api/sources/midagri/refresh").json()
    assert result["ultimo_intento"]["estado"] == "error"
    assert result["ultimo_dato"]["id"] == rid
    assert Decimal(result["ultimo_dato"]["contenido"]["precio"]) == Decimal("6.66")
    with connection() as c:
        assert c.execute("SELECT count(*) FROM cotizaciones").fetchone()[0] == 0
        assert c.execute("SELECT count(*) FROM inventario").fetchone()[0] == 0
        assert c.execute("SELECT count(*) FROM consultas_fuentes").fetchone()[0] == 2
