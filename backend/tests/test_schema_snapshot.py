from __future__ import annotations

from services.schema_snapshot import SchemaSnapshotService


def test_schema_snapshot_capture(storage, sqlite_db):
    service = SchemaSnapshotService(storage=storage, default_database=str(sqlite_db))
    result = service.capture()

    snapshot = result["snapshot"]
    assert snapshot["table_count"] == 1
    assert snapshot["tables"][0]["name"] == "customers"
    column_names = [column["name"] for column in snapshot["tables"][0]["columns"]]
    assert column_names == ["id", "customer_name", "email"]
