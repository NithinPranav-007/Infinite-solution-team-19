"""HTTP routes for Schema Evolution Guardian."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Body, HTTPException, Request

from services.agent import SchemaGuardianAgent
from services.ai_analyzer import AIImpactAnalyzer
from services.drift_detector import DriftDetector
from services.migration_generator import MigrationGenerator
from services.notifier import DiscordNotifier
from services.schema_snapshot import SchemaSnapshotService
from services.storage import StorageService

router = APIRouter()


def _storage(request: Request) -> StorageService:
    return request.app.state.storage


def _build_agent(storage: StorageService, db_path: str | None = None) -> SchemaGuardianAgent:
    snapshot_service = SchemaSnapshotService(storage=storage)
    drift_detector = DriftDetector()
    analyzer = AIImpactAnalyzer()
    generator = MigrationGenerator()
    notifier = DiscordNotifier()
    return SchemaGuardianAgent(
        storage=storage,
        snapshot_service=snapshot_service,
        drift_detector=drift_detector,
        analyzer=analyzer,
        generator=generator,
        notifier=notifier,
        db_path=db_path,
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
    agent = _build_agent(storage, db_path=payload.get("db_path"))
    return agent.run()


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


@router.post("/notify")
def notify(request: Request, payload: dict = Body(default_factory=dict)) -> dict:
    notifier = DiscordNotifier()
    message = payload.get("message") or "Schema drift notification"
    return notifier.send(message=message, severity=payload.get("severity", "Medium"))


@router.get("/reports/{report_name}")
def get_report(request: Request, report_name: str) -> dict:
    storage = _storage(request)
    report_path = storage.reports_dir / report_name
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return storage.read_json(report_path)
