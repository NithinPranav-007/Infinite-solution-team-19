"""HTTP routes for Schema Evolution Guardian."""

from __future__ import annotations

import re
import sqlite3
from pathlib import Path

from fastapi import APIRouter, Body, HTTPException, Request

from services.agent import SchemaGuardianAgent
from services.ai_analyzer import AIImpactAnalyzer
from services.drift_detector import DriftDetector
from services.migration_generator import MigrationGenerator
from services.schema_snapshot import SchemaSnapshotService
from services.storage import StorageService

router = APIRouter()

# Safe identifier regex — only allow simple column/table names
_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _storage(request: Request) -> StorageService:
    return request.app.state.storage


def _database_path(storage: StorageService, db_path: str | None = None) -> Path:
    if db_path:
        return Path(db_path)
    configured_db_path = storage.get_setting("target_db_path")
    if configured_db_path:
        return Path(configured_db_path)
    latest = storage.get_latest_snapshot_record()
    if latest and latest.get("source_database"):
        return Path(latest["source_database"])
    return storage.base_dir / "sample.db"


def _build_agent(storage: StorageService, db_path: str | None = None) -> SchemaGuardianAgent:
    resolved_db_path = db_path
    if not resolved_db_path:
        configured_db_path = storage.get_setting("target_db_path")
        if configured_db_path:
            resolved_db_path = configured_db_path

    return SchemaGuardianAgent(
        storage=storage,
        snapshot_service=SchemaSnapshotService(storage=storage),
        drift_detector=DriftDetector(),
        analyzer=AIImpactAnalyzer(),
        generator=MigrationGenerator(),
        db_path=resolved_db_path,
    )


@router.get("/schema/latest")
def latest_schema(request: Request) -> dict:
    storage = _storage(request)
    latest = storage.get_latest_snapshot_record()
    if not latest:
        raise HTTPException(status_code=404, detail="No schema snapshot found")
    return latest


@router.get("/drifts")
def list_drifts(request: Request) -> list[dict]:
    return _storage(request).list_drifts()


@router.post("/scan")
def scan_schema(
    request: Request,
    payload: dict = Body(default_factory=dict),
) -> dict:
    storage = _storage(request)
    db_path = payload.get("db_path")

    # Validate db_path exists before scanning
    resolved_path = _database_path(storage, db_path)
    if not resolved_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"SQLite database not found: {resolved_path}",
        )

    try:
        agent = _build_agent(storage, db_path=db_path)
        return agent.run()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scan failed: {exc}")


@router.post("/analyze")
def analyze_changes(
    request: Request,
    payload: dict = Body(default_factory=dict),
) -> dict:
    changes = payload.get("changes") or []
    if not isinstance(changes, list):
        raise HTTPException(status_code=400, detail="changes must be a list")

    previous_schema = payload.get("previous_schema") or {}
    current_schema = payload.get("current_schema") or {}
    analyzer = AIImpactAnalyzer()
    return analyzer.analyze(previous_schema, current_schema, changes)


@router.get("/reports")
def list_reports(request: Request) -> list[dict]:
    return _storage(request).list_reports()


@router.get("/database/preview")
def preview_database(request: Request, db_path: str | None = None, table: str | None = None, limit: int = 5) -> dict:
    storage = _storage(request)
    target_path = _database_path(storage, db_path)
    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"SQLite database not found: {target_path}")

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

        tables: list[dict] = []
        for table_row in table_rows:
            table_name = table_row["name"]
            column_rows = connection.execute(f"PRAGMA table_info('{table_name}')").fetchall()
            row_count = connection.execute(f"SELECT COUNT(*) AS count FROM '{table_name}'").fetchone()["count"]

            if table and table != table_name:
                continue

            sample_rows = connection.execute(f"SELECT * FROM '{table_name}' LIMIT ?", (limit,)).fetchall()
            tables.append(
                {
                    "name": table_name,
                    "columns": [column["name"] for column in column_rows],
                    "row_count": row_count,
                    "sample_rows": [dict(row) for row in sample_rows],
                }
            )

    return {
        "database": str(target_path),
        "table_count": len(tables),
        "tables": tables,
    }


@router.get("/settings")
def get_settings(request: Request) -> dict:
    storage = _storage(request)
    target_db = storage.get_setting("target_db_path", "")
    if not target_db:
        target_db = str(storage.base_dir / "sample.db")
    return {"target_db_path": target_db}


@router.post("/settings")
def update_settings(request: Request, payload: dict = Body(...)) -> dict:
    storage = _storage(request)
    if "target_db_path" in payload:
        storage.set_setting("target_db_path", payload["target_db_path"])
    return {"status": "success", "message": "Settings updated successfully"}


# ── New endpoints ─────────────────────────────────────────────────────


@router.get("/snapshots")
def list_snapshots(request: Request) -> list[dict]:
    """Return all snapshot records (newest first)."""
    return _storage(request).list_snapshots()


@router.post("/compare")
def compare_snapshots(
    request: Request,
    payload: dict = Body(...),
) -> dict:
    """Compare two arbitrary snapshots by their version names."""
    storage = _storage(request)
    previous_name = payload.get("previous_snapshot")
    current_name = payload.get("current_snapshot")

    if not previous_name or not current_name:
        raise HTTPException(status_code=400, detail="Both previous_snapshot and current_snapshot are required")

    # Ensure both end with .json for lookup
    if not previous_name.endswith(".json"):
        previous_name += ".json"
    if not current_name.endswith(".json"):
        current_name += ".json"

    previous = storage.get_snapshot_by_name(previous_name)
    current = storage.get_snapshot_by_name(current_name)

    if not previous:
        raise HTTPException(status_code=404, detail=f"Previous snapshot not found: {previous_name}")
    if not current:
        raise HTTPException(status_code=404, detail=f"Current snapshot not found: {current_name}")

    detector = DriftDetector()
    changes = detector.compare(previous, current)
    summary = detector.summarize(changes)

    # Run analysis if there are changes
    analysis = {}
    mitigation = {}
    if changes:
        analyzer = AIImpactAnalyzer()
        analysis = analyzer.analyze(previous, current, changes)
        generator = MigrationGenerator()
        mitigation = generator.generate(changes, analysis)

    return {
        "previous_snapshot": previous.get("schema_version"),
        "current_snapshot": current.get("schema_version"),
        "drift_summary": summary,
        "drift_changes": changes,
        "impact_analysis": analysis,
        "suggested_fixes": mitigation,
    }


@router.post("/simulate")
def simulate_drift(
    request: Request,
    payload: dict = Body(...),
) -> dict:
    """Simulate a schema change on the target database for testing drift detection."""
    storage = _storage(request)
    action = payload.get("action")
    table_name = payload.get("table", "customers")
    column_name = payload.get("column", "notes")
    new_name = payload.get("new_name", "")
    new_table = payload.get("new_table", "audit_log")
    column_type = payload.get("column_type", "TEXT")

    valid_actions = {"add_column", "rename_column", "drop_column", "add_table"}
    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{action}'. Must be one of: {', '.join(sorted(valid_actions))}",
        )

    # Validate identifiers to prevent SQL injection
    for name, label in [(table_name, "table"), (column_name, "column"), (new_name, "new_name"), (new_table, "new_table"), (column_type, "column_type")]:
        if name and not _SAFE_IDENTIFIER.match(name):
            raise HTTPException(status_code=400, detail=f"Invalid {label} name: {name}")

    target_path = _database_path(storage)
    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Target database not found: {target_path}")

    try:
        with sqlite3.connect(target_path) as connection:
            if action == "add_column":
                connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                message = f"Added column '{column_name}' ({column_type}) to table '{table_name}'"

            elif action == "rename_column":
                if not new_name:
                    raise HTTPException(status_code=400, detail="new_name is required for rename_column")
                connection.execute(f"ALTER TABLE {table_name} RENAME COLUMN {column_name} TO {new_name}")
                message = f"Renamed column '{column_name}' to '{new_name}' in table '{table_name}'"

            elif action == "drop_column":
                connection.execute(f"ALTER TABLE {table_name} DROP COLUMN {column_name}")
                message = f"Dropped column '{column_name}' from table '{table_name}'"

            elif action == "add_table":
                connection.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS {new_table} (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_type TEXT NOT NULL,
                        event_data TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
                message = f"Created new table '{new_table}'"

            connection.commit()

        return {"status": "success", "message": message, "action": action}

    except sqlite3.OperationalError as exc:
        raise HTTPException(status_code=400, detail=f"SQLite error: {exc}")


@router.post("/reset")
def reset_all_data(request: Request) -> dict:
    """Delete all drifts, reports, and snapshots."""
    storage = _storage(request)
    counts = storage.reset_all()
    return {
        "status": "success",
        "message": "All data has been reset",
        "deleted": counts,
    }
