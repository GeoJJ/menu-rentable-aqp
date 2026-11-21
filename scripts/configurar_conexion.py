"""Guarda una conexión local verificada sin exponer la contraseña en la terminal."""

import getpass
from pathlib import Path
from urllib.parse import quote

import psycopg

root = Path(__file__).resolve().parents[1]


def main():
    host = input("Host [127.0.0.1]: ").strip() or "127.0.0.1"
    port = int(input("Puerto [5432]: ").strip() or "5432")
    database = input("Base de datos [menu_rentable]: ").strip() or "menu_rentable"
    user = input("Usuario [postgres]: ").strip() or "postgres"
    password = getpass.getpass("Contraseña del servidor: ")
    with psycopg.connect(
        host=host,
        port=port,
        dbname=database,
        user=user,
        password=password,
        connect_timeout=5,
    ):
        pass
    target = root / ".env"
    if (
        target.exists()
        and input("Ya existe .env. ¿Reemplazarlo? Escribe SI: ").strip() != "SI"
    ):
        print("No se modificó la configuración.")
        return
    url = f"postgresql://{quote(user, safe='')}:{quote(password, safe='')}@{host}:{port}/{quote(database, safe='')}"
    target.write_text(
        "DATABASE_URL="
        + url
        + "\nCORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173\n",
        encoding="utf-8",
    )
    print("Conexión verificada y guardada en .env. Ejecuta scripts/migrar_base.py.")


if __name__ == "__main__":
    try:
        main()
    except psycopg.Error:
        print(
            "No se pudo verificar la conexión. Comprueba host, puerto, base, usuario y contraseña. No se modificó .env."
        )
        raise SystemExit(1)
