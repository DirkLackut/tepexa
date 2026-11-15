"""Aplica migraciones y semillas a una base PostgreSQL (uso local y pruebas).

En Neon las migraciones se pegan en el SQL Editor. Este script es para bases a las que sí hay
conexión directa.

Uso: python backend/db/migrate.py "<cadena de conexión>" [--seed]
"""
import sys
from pathlib import Path

import psycopg

HERE = Path(__file__).resolve().parent
MIGRATIONS = HERE / "migrations"
SEEDS = HERE / "seeds"


def _applied(conn) -> set[str]:
    exists = conn.execute("select to_regclass('public.schema_migrations') is not null").fetchone()[0]
    if not exists:
        return set()
    return {r[0] for r in conn.execute("select version from schema_migrations")}


def apply_migrations(url: str) -> list[str]:
    """Aplica en orden las migraciones que faltan. Devuelve las versiones aplicadas."""
    done = []
    with psycopg.connect(url, autocommit=True) as conn:
        applied = _applied(conn)
        for path in sorted(MIGRATIONS.glob("*.sql")):
            if path.stem in applied:
                continue
            conn.execute(path.read_text(encoding="utf-8"))
            done.append(path.stem)
    return done


def apply_seeds(url: str) -> list[str]:
    """Las semillas son idempotentes: se pueden aplicar varias veces."""
    done = []
    with psycopg.connect(url, autocommit=True) as conn:
        for path in sorted(SEEDS.glob("*.sql")):
            conn.execute(path.read_text(encoding="utf-8"))
            done.append(path.stem)
    return done


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    print("migraciones:", apply_migrations(sys.argv[1]) or "ninguna pendiente")
    if "--seed" in sys.argv:
        print("semillas:", apply_seeds(sys.argv[1]))
