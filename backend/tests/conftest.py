from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import pytest


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.storage import StorageService


@pytest.fixture()
def temp_workspace(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture()
def storage(temp_workspace: Path) -> StorageService:
    service = StorageService(base_dir=temp_workspace)
    service.initialize()
    return service


@pytest.fixture()
def sqlite_db(temp_workspace: Path) -> Path:
    db_path = temp_workspace / "sample.db"
    with sqlite3.connect(db_path) as connection:
        connection.execute(
            """
            CREATE TABLE customers (
                id INTEGER PRIMARY KEY,
                customer_name TEXT NOT NULL,
                email TEXT
            )
            """
        )
        connection.commit()
    return db_path
