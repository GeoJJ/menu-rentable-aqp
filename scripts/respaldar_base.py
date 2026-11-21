"""Genera un respaldo sin poner la contraseña en argumentos ni archivos versionados."""

import argparse
import os
import subprocess
from pathlib import Path

import psycopg
from dotenv import dotenv_values


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pg-dump", default=r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
    )
    parser.add_argument("--salida", default="database/backups/menu_rentable.sql")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    url = os.getenv("DATABASE_URL") or dotenv_values(root / ".env").get("DATABASE_URL")
    if not url:
        raise SystemExit("Configura DATABASE_URL antes de respaldar.")
    output = Path(args.salida).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with psycopg.connect(url) as connection:
        info = connection.info
        env = os.environ.copy()
        env["PGPASSWORD"] = info.password
        subprocess.run(
            [
                args.pg_dump,
                "-h",
                info.host,
                "-p",
                str(info.port),
                "-U",
                info.user,
                "-d",
                info.dbname,
                "--no-owner",
                "--no-acl",
                "-f",
                str(output),
            ],
            env=env,
            check=True,
        )
    print(f"Respaldo creado: {output}")


if __name__ == "__main__":
    main()
