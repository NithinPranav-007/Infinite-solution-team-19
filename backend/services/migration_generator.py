"""Generate SQL migrations, compatibility views, and rollback scripts."""

from __future__ import annotations

from typing import Any


class MigrationGenerator:
    def generate(self, changes: list[dict[str, Any]], analysis: dict[str, Any]) -> dict[str, Any]:
        migration_sql: list[str] = []
        compatibility_sql: list[str] = []
        rollback_sql: list[str] = []

        for change in changes:
            table = change.get("table")
            kind = change.get("change")
            if kind == "added_column" and table:
                migration_sql.append(f"ALTER TABLE {table} ADD COLUMN {change['column']} TEXT;")
                rollback_sql.append(f"-- SQLite does not support DROP COLUMN directly for {table}.{change['column']}")
            elif kind == "data_type_changed" and table:
                migration_sql.append(f"-- Review type change for {table}.{change['column']} from {change.get('from')} to {change.get('to')}")
                rollback_sql.append(f"-- Restore original type for {table}.{change['column']} if needed")
            elif kind == "renamed_column" and table:
                compatibility_sql.append(
                    f"CREATE VIEW IF NOT EXISTS {table}_compatibility AS SELECT {change['from']} AS {change['to']} FROM {table};"
                )
                rollback_sql.append(f"-- Drop compatibility view for {table} when migration is complete")
            elif kind == "removed_column" and table:
                compatibility_sql.append(
                    f"CREATE VIEW IF NOT EXISTS {table}_compatibility AS SELECT *, NULL AS {change['column']} FROM {table};"
                )
                rollback_sql.append(f"-- Backfill {table}.{change['column']} before removal")
            elif kind == "added_table" and table:
                migration_sql.append(f"-- Review and create table {table} if required by the new contract")
            elif kind == "removed_table" and table:
                rollback_sql.append(f"-- Preserve and back up table {table} before deletion")

        if not compatibility_sql and analysis.get("severity_label") in {"High", "Critical"}:
            compatibility_sql.append("-- Compatibility view suggested for downstream consumers")

        return {
            "sql_migration_script": "\n".join(migration_sql) or "-- No direct SQL migration required",
            "compatibility_views": "\n".join(compatibility_sql) or "-- No compatibility view required",
            "rollback_script": "\n".join(rollback_sql) or "-- No rollback actions required",
            "summary": {
                "severity": analysis.get("severity_label", "Medium"),
                "risk_score": analysis.get("risk_score", 0),
            },
        }
