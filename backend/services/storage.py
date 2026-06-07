"""Persistent storage helpers for schema snapshots, drifts, and reports."""

from __future__ import annotations

import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.db_path = self.base_dir / "guardian.sqlite3"
        self.snapshots_dir = self.base_dir / "snapshots"
        self.reports_dir = self.base_dir / "reports"
        self.snapshots_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def initialize(self) -> None:
        with sqlite3.connect(self.db_path) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS drifts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    captured_at TEXT NOT NULL,
                    previous_snapshot TEXT,
                    current_snapshot TEXT,
                    severity TEXT,
                    risk_score INTEGER,
                    drift_payload TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    report_name TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL,
                    report_payload TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    snapshot_name TEXT NOT NULL UNIQUE,
                    captured_at TEXT NOT NULL,
                    source_database TEXT NOT NULL,
                    snapshot_payload TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def bootstrap_demo_database(self, database_name: str = "sample.db") -> Path:
        demo_db_path = self.base_dir / database_name
        with sqlite3.connect(demo_db_path) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY,
                    customer_name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY,
                    customer_id INTEGER NOT NULL,
                    total_amount REAL NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(customer_id) REFERENCES customers(id)
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY,
                    order_id INTEGER NOT NULL,
                    sku TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    unit_price REAL NOT NULL,
                    FOREIGN KEY(order_id) REFERENCES orders(id)
                )
                """
            )
            customer_count = connection.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
            if customer_count == 0:
                connection.execute(
                    "INSERT OR IGNORE INTO customers (customer_name, email) VALUES (?, ?)",
                    ("Acme Corp", "ops@acme.example"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO customers (customer_name, email) VALUES (?, ?)",
                    ("Northwind", "data@northwind.example"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO customers (customer_name, email) VALUES (?, ?)",
                    ("Blue Peak Labs", "contact@bluepeak.example"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)",
                    (1, 1499.50, "active"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)",
                    (2, 249.00, "pending"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)",
                    (3, 895.75, "active"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO order_items (order_id, sku, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    (1, "SKU-001", 4, 199.95),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO order_items (order_id, sku, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    (2, "SKU-014", 2, 124.50),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO order_items (order_id, sku, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    (3, "SKU-021", 5, 179.15),
                )
            elif customer_count < 5:
                connection.execute(
                    "INSERT OR IGNORE INTO customers (customer_name, email) VALUES (?, ?)",
                    ("Skyline Retail", "hello@skylineretail.example"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO customers (customer_name, email) VALUES (?, ?)",
                    ("Vertex Health", "team@vertexhealth.example"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)",
                    (4, 1799.99, "active"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)",
                    (5, 640.25, "pending"),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO order_items (order_id, sku, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    (4, "SKU-033", 3, 399.99),
                )
                connection.execute(
                    "INSERT OR IGNORE INTO order_items (order_id, sku, quantity, unit_price) VALUES (?, ?, ?, ?)",
                    (5, "SKU-044", 1, 640.25),
                )
            connection.commit()
        return demo_db_path

    def write_json(self, path: Path, payload: dict[str, Any]) -> None:
        path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")

    def read_json(self, path: Path) -> dict[str, Any]:
        return json.loads(path.read_text(encoding="utf-8"))

    def save_snapshot_record(self, snapshot_name: str, payload: dict[str, Any]) -> None:
        with sqlite3.connect(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO snapshots (snapshot_name, captured_at, source_database, snapshot_payload)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(snapshot_name) DO UPDATE SET
                    captured_at=excluded.captured_at,
                    source_database=excluded.source_database,
                    snapshot_payload=excluded.snapshot_payload
                """,
                (
                    snapshot_name,
                    payload.get("captured_at", datetime.utcnow().isoformat()),
                    payload.get("source_database", ""),
                    json.dumps(payload),
                ),
            )
            connection.commit()

    def get_latest_snapshot_record(self) -> dict[str, Any] | None:
        with sqlite3.connect(self.db_path) as connection:
            row = connection.execute(
                "SELECT snapshot_name, captured_at, source_database, snapshot_payload FROM snapshots ORDER BY id DESC LIMIT 1"
            ).fetchone()
        if not row:
            return None
        payload = json.loads(row[3])
        payload["snapshot_name"] = row[0]
        payload["captured_at"] = row[1]
        payload["source_database"] = row[2]
        return payload

    def list_snapshots(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.db_path) as connection:
            rows = connection.execute(
                "SELECT snapshot_name, captured_at, source_database FROM snapshots ORDER BY id DESC"
            ).fetchall()
        return [
            {"snapshot_name": row[0], "captured_at": row[1], "source_database": row[2]}
            for row in rows
        ]

    def save_drift(self, payload: dict[str, Any]) -> None:
        with sqlite3.connect(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO drifts (captured_at, previous_snapshot, current_snapshot, severity, risk_score, drift_payload)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.get("captured_at", datetime.utcnow().isoformat()),
                    payload.get("previous_snapshot"),
                    payload.get("current_snapshot"),
                    payload.get("severity"),
                    payload.get("risk_score"),
                    json.dumps(payload),
                ),
            )
            connection.commit()

    def list_drifts(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.db_path) as connection:
            rows = connection.execute(
                "SELECT captured_at, previous_snapshot, current_snapshot, severity, risk_score, drift_payload FROM drifts ORDER BY id DESC"
            ).fetchall()
        items: list[dict[str, Any]] = []
        for row in rows:
            payload = json.loads(row[5])
            payload.update(
                {
                    "captured_at": row[0],
                    "previous_snapshot": row[1],
                    "current_snapshot": row[2],
                    "severity": row[3],
                    "risk_score": row[4],
                }
            )
            items.append(payload)
        return items

    def save_report(self, report_name: str, payload: dict[str, Any]) -> Path:
        report_path = self.reports_dir / report_name
        self.write_json(report_path, payload)
        with sqlite3.connect(self.db_path) as connection:
            connection.execute(
                """
                INSERT INTO reports (report_name, created_at, report_payload)
                VALUES (?, ?, ?)
                ON CONFLICT(report_name) DO UPDATE SET
                    created_at=excluded.created_at,
                    report_payload=excluded.report_payload
                """,
                (report_name, payload.get("created_at", datetime.utcnow().isoformat()), json.dumps(payload)),
            )
            connection.commit()
        return report_path

    def list_reports(self) -> list[dict[str, Any]]:
        with sqlite3.connect(self.db_path) as connection:
            rows = connection.execute(
                "SELECT report_name, created_at, report_payload FROM reports ORDER BY id DESC"
            ).fetchall()
        results: list[dict[str, Any]] = []
        for row in rows:
            payload = json.loads(row[2])
            payload.update({"report_name": row[0], "created_at": row[1]})
            results.append(payload)
        return results
