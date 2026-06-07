"""Orchestrates the schema guardian agent loop."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from services.ai_analyzer import AIImpactAnalyzer
from services.drift_detector import DriftDetector
from services.migration_generator import MigrationGenerator
from services.schema_snapshot import SchemaSnapshotService
from services.storage import StorageService

logger = logging.getLogger(__name__)


class SchemaGuardianAgent:
    def __init__(
        self,
        storage: StorageService,
        snapshot_service: SchemaSnapshotService,
        drift_detector: DriftDetector,
        analyzer: AIImpactAnalyzer,
        generator: MigrationGenerator,
        db_path: str | None = None,
    ) -> None:
        self.storage = storage
        self.snapshot_service = snapshot_service
        self.drift_detector = drift_detector
        self.analyzer = analyzer
        self.generator = generator
        self.db_path = db_path

    def run(self) -> dict[str, Any]:
        latest_capture = self.snapshot_service.capture(self.db_path)
        current_snapshot = latest_capture["snapshot"]
        current_snapshot_path = latest_capture["snapshot_path"]
        previous_record = self._previous_snapshot(current_snapshot["schema_version"])

        if not previous_record:
            report = self._build_report(
                current_snapshot=current_snapshot,
                previous_snapshot=None,
                changes=[],
                analysis={"severity_label": "Low", "risk_score": 0, "executive_summary": "Baseline snapshot created."},
                mitigation={"sql_migration_script": "-- Baseline snapshot only"},
            )
            self.storage.save_report(report["report_name"], report)
            return report

        changes = self.drift_detector.compare(previous_record, current_snapshot)

        if not changes:
            report = self._build_report(
                current_snapshot=current_snapshot,
                previous_snapshot=previous_record,
                changes=[],
                analysis={
                    "severity_label": "Low",
                    "risk_score": 0,
                    "executive_summary": "No schema changes detected since the last snapshot.",
                },
                mitigation={"sql_migration_script": "-- No migration required"},
                current_snapshot_path=current_snapshot_path,
            )
            self.storage.save_report(report["report_name"], report)
            return report

        analysis = self.analyzer.analyze(previous_record, current_snapshot, changes)
        mitigation = self.generator.generate(changes, analysis)

        drift_record = {
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "previous_snapshot": previous_record.get("schema_version"),
            "current_snapshot": current_snapshot.get("schema_version"),
            "severity": analysis.get("severity_label"),
            "risk_score": analysis.get("risk_score"),
            "changes": changes,
            "analysis": analysis,
            "mitigation": mitigation,
        }
        self.storage.save_drift(drift_record)

        report = self._build_report(
            current_snapshot=current_snapshot,
            previous_snapshot=previous_record,
            changes=changes,
            analysis=analysis,
            mitigation=mitigation,
            current_snapshot_path=current_snapshot_path,
        )
        self.storage.save_report(report["report_name"], report)
        return report

    def _previous_snapshot(self, current_schema_version: str) -> dict[str, Any] | None:
        snapshots = self.storage.list_snapshots()
        for snapshot in snapshots:
            if snapshot["snapshot_name"] != f"{current_schema_version}.json":
                return self.storage.read_json(self.storage.snapshots_dir / snapshot["snapshot_name"])
        return None

    def _build_report(
        self,
        current_snapshot: dict[str, Any],
        previous_snapshot: dict[str, Any] | None,
        changes: list[dict[str, Any]],
        analysis: dict[str, Any],
        mitigation: dict[str, Any],
        current_snapshot_path: str | None = None,
    ) -> dict[str, Any]:
        report_name = f"report_{datetime.now(timezone.utc).strftime('%Y_%m_%d_%H%M%S')}.json"
        return {
            "report_name": report_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "drift_summary": self.drift_detector.summarize(changes),
            "previous_snapshot": previous_snapshot.get("schema_version") if previous_snapshot else None,
            "current_snapshot": current_snapshot.get("schema_version"),
            "snapshot_path": current_snapshot_path,
            "drift_changes": changes,
            "impact_analysis": analysis,
            "suggested_fixes": mitigation,
        }
