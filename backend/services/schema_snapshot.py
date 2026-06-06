"""Schema snapshot capture service."""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path
from typing import Any

from services.models import ColumnDefinition, SnapshotDocument, TableDefinition, utc_now
from services.storage import StorageService

logger = logging.getLogger(__name__)


class SchemaSnapshotService:
    def __init__(self, storage: StorageService, default_database: str | None = None) -> None:
        self.storage = storage
        self.default_database = default_database or str(storage.base_dir / "sample.db")

    def capture(self, database_path: str | Path | None = None) -> dict[str, Any]:
        target_path = Path(database_path or self.default_database)
        if not target_path.exists():
            raise FileNotFoundError(f"SQLite database not found: {target_path}")

        tables: list[TableDefinition] = []
        with sqlite3.connect(target_path) as connection:
            connection.row_factory = sqlite3.Row
            table_rows = connection.execute(
                """
                SELECT name
                FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
                """
            ).fetchall()

            for table_row in table_rows:
                table_name = table_row["name"]
                column_rows = connection.execute(f"PRAGMA table_info('{table_name}')").fetchall()
                fk_rows = connection.execute(f"PRAGMA foreign_key_list('{table_name}')").fetchall()
                columns = [
                    ColumnDefinition(
                        name=column["name"],
                        data_type=column["type"] or "TEXT",
                        not_null=bool(column["notnull"]),
                        default_value=column["dflt_value"],
                        primary_key=bool(column["pk"]),
                    )
                    for column in column_rows
                ]
                tables.append(
                    TableDefinition(
                        name=table_name,
                        columns=columns,
                        constraints={
                            "primary_key": [column["name"] for column in column_rows if column["pk"]],
                            "foreign_keys": [
                                {
                                    "from": fk["from"],
                                    "to": fk["to"],
                                    "table": fk["table"],
                                }
                                for fk in fk_rows
                            ],
                        },
                    )
                )

        schema_version = f"schema_{int(__import__('time').time())}"
        snapshot = SnapshotDocument(
            schema_version=schema_version,
            source_database=str(target_path),
            captured_at=utc_now(),
            tables=tables,
        )
        payload = snapshot.to_dict()
        payload["tables"] = [table.to_dict() for table in tables]

        snapshot_path = self.storage.snapshots_dir / f"{schema_version}.json"
        self.storage.write_json(snapshot_path, payload)
        self.storage.save_snapshot_record(snapshot_path.name, payload)
        logger.info("Captured schema snapshot %s", snapshot_path)
        return {"snapshot_path": str(snapshot_path), "snapshot": payload}
