"""Schema drift comparison engine."""

from __future__ import annotations

from collections import defaultdict
from difflib import SequenceMatcher
from typing import Any


class DriftDetector:
    def compare(self, previous_snapshot: dict[str, Any], current_snapshot: dict[str, Any]) -> list[dict[str, Any]]:
        previous_tables = {table["name"]: table for table in previous_snapshot.get("tables", [])}
        current_tables = {table["name"]: table for table in current_snapshot.get("tables", [])}
        drifts: list[dict[str, Any]] = []

        for table_name in sorted(previous_tables.keys() - current_tables.keys()):
            drifts.append({"table": table_name, "change": "removed_table"})

        for table_name in sorted(current_tables.keys() - previous_tables.keys()):
            drifts.append({"table": table_name, "change": "added_table"})

        for table_name in sorted(previous_tables.keys() & current_tables.keys()):
            drifts.extend(self._compare_table(table_name, previous_tables[table_name], current_tables[table_name]))

        return drifts

    def _compare_table(self, table_name: str, previous_table: dict[str, Any], current_table: dict[str, Any]) -> list[dict[str, Any]]:
        changes: list[dict[str, Any]] = []
        previous_columns = {column["name"]: column for column in previous_table.get("columns", [])}
        current_columns = {column["name"]: column for column in current_table.get("columns", [])}

        removed_columns = {name: column for name, column in previous_columns.items() if name not in current_columns}
        added_columns = {name: column for name, column in current_columns.items() if name not in previous_columns}

        renamed_pairs = self._guess_renames(removed_columns, added_columns)
        renamed_removed = {old_name for old_name, _ in renamed_pairs}
        renamed_added = {new_name for _, new_name in renamed_pairs}

        for old_name, new_name in renamed_pairs:
            changes.append(
                {
                    "table": table_name,
                    "change": "renamed_column",
                    "from": old_name,
                    "to": new_name,
                }
            )

        for column_name in sorted(removed_columns.keys() - renamed_removed):
            changes.append({"table": table_name, "change": "removed_column", "column": column_name})

        for column_name in sorted(added_columns.keys() - renamed_added):
            changes.append({"table": table_name, "change": "added_column", "column": column_name})

        for column_name in sorted(previous_columns.keys() & current_columns.keys()):
            previous_column = previous_columns[column_name]
            current_column = current_columns[column_name]
            if previous_column.get("data_type") != current_column.get("data_type"):
                changes.append(
                    {
                        "table": table_name,
                        "change": "data_type_changed",
                        "column": column_name,
                        "from": previous_column.get("data_type"),
                        "to": current_column.get("data_type"),
                    }
                )

        return changes

    def _guess_renames(
        self,
        removed_columns: dict[str, dict[str, Any]],
        added_columns: dict[str, dict[str, Any]],
    ) -> list[tuple[str, str]]:
        pairs: list[tuple[str, str]] = []
        used_new_names: set[str] = set()
        for old_name, old_column in removed_columns.items():
            best_match: tuple[str, float] | None = None
            for new_name, new_column in added_columns.items():
                if new_name in used_new_names:
                    continue
                if old_column.get("data_type") != new_column.get("data_type"):
                    continue
                score = SequenceMatcher(None, old_name.lower(), new_name.lower()).ratio()
                if score >= 0.55 and (best_match is None or score > best_match[1]):
                    best_match = (new_name, score)
            if best_match:
                used_new_names.add(best_match[0])
                pairs.append((old_name, best_match[0]))
        return pairs

    def summarize(self, changes: list[dict[str, Any]]) -> dict[str, Any]:
        summary = defaultdict(int)
        for change in changes:
            summary[change["change"]] += 1
        return {"total_changes": len(changes), "by_type": dict(summary)}
