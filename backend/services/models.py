"""Shared models used by services and API routes."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(slots=True)
class ColumnDefinition:
    name: str
    data_type: str
    not_null: bool = False
    default_value: str | None = None
    primary_key: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "data_type": self.data_type,
            "not_null": self.not_null,
            "default_value": self.default_value,
            "primary_key": self.primary_key,
        }


@dataclass(slots=True)
class TableDefinition:
    name: str
    columns: list[ColumnDefinition] = field(default_factory=list)
    constraints: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "columns": [column.to_dict() for column in self.columns],
            "constraints": self.constraints,
        }


@dataclass(slots=True)
class SnapshotDocument:
    schema_version: str
    source_database: str
    captured_at: str
    tables: list[TableDefinition]

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "source_database": self.source_database,
            "captured_at": self.captured_at,
            "tables": [table.to_dict() for table in self.tables],
            "table_count": len(self.tables),
        }
