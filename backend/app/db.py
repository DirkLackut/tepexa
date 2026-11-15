"""Conexión a PostgreSQL (Neon) con un pool pequeño (D-12)."""
import os
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool, PoolTimeout

from .errors import dataset_unavailable

_pool: ConnectionPool | None = None


def _get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        url = os.getenv("DATABASE_URL")
        if not url:
            raise dataset_unavailable()
        _pool = ConnectionPool(url, min_size=0, max_size=4, timeout=5, open=True,
                               kwargs={"row_factory": dict_row, "connect_timeout": 5})
    return _pool


def reset_pool() -> None:
    """Cierra el pool (pruebas y cambios de configuración)."""
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def connection():
    """Conexión del pool; cualquier fallo de la base se traduce en 503 sin detalles (RF-001-05)."""
    try:
        with _get_pool().connection() as conn:
            yield conn
    except (psycopg.OperationalError, PoolTimeout):
        raise dataset_unavailable() from None
