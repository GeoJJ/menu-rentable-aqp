import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "backend"))
from app.db.plans import connect
from dotenv import load_dotenv

load_dotenv(root / ".env")
data = json.loads(
    (root / "database/catalogo_demo.json").read_text(encoding="utf-8-sig")
)
with connect() as c:
    for i in data["ingredients"]:
        c.execute(
            "INSERT INTO ingredientes(codigo_legacy,nombre,unidad_codigo) VALUES (%s,%s,%s) ON CONFLICT(codigo_legacy) DO NOTHING",
            (i["id"], i["name"], i["unit"]),
        )
    ids = dict(c.execute("SELECT codigo_legacy,id FROM ingredientes").fetchall())
    for r in data["recipes"]:
        row = c.execute(
            "INSERT INTO recetas(codigo_legacy,nombre,categoria,estilo,rendimiento,preparacion) VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT(codigo_legacy) DO NOTHING RETURNING id",
            (
                r["id"],
                r["name"],
                {
                    "main": "segundo",
                    "soup": "caldo",
                    "drink": "refresco",
                    "starter": "entrada",
                }[r["category"]],
                r.get("style"),
                r["yield"],
                r.get("preparation"),
            ),
        ).fetchone()
        if row:
            for ingredient, qty in r["items"].items():
                if qty > 0:
                    c.execute(
                        "INSERT INTO receta_ingredientes VALUES (%s,%s,%s)",
                        (row[0], ids[ingredient], qty),
                    )
print(
    "Catálogo inicial importado sin precios individuales ni inventario ficticio. No se importaron ventas de demostración."
)
