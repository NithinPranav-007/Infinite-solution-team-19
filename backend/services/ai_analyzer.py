"""AI impact analysis powered by Ollama with a deterministic fallback."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import requests

logger = logging.getLogger(__name__)


class AIImpactAnalyzer:
    def __init__(self, base_url: str | None = None, model: str | None = None, timeout: int = 10) -> None:
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.2")
        self.timeout = timeout

    def analyze(self, previous_schema: dict[str, Any], current_schema: dict[str, Any], changes: list[dict[str, Any]]) -> dict[str, Any]:
        prompt = self._build_prompt(previous_schema, current_schema, changes)
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "You are a senior Data Architect."},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": False,
                    "format": "json",
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            content = response.json().get("message", {}).get("content", "{}")
            parsed = self._extract_json(content)
            return self._normalize_output(parsed, changes)
        except Exception as exc:  # pragma: no cover - exercised via fallback in production failures
            logger.warning("Falling back to heuristic analysis: %s", exc)
            return self._heuristic_analysis(changes)

    def _build_prompt(self, previous_schema: dict[str, Any], current_schema: dict[str, Any], changes: list[dict[str, Any]]) -> str:
        return (
            "Analyze the schema drift between the previous and current schema snapshots.\n"
            "Return JSON with the following keys exactly:\n"
            "severity_score, severity_label, systems_potentially_affected, business_impact, technical_impact, mitigation_plan,\n"
            "blast_radius, risk_score, executive_summary, recommended_actions.\n\n"
            f"Previous schema: {json.dumps(previous_schema, indent=2)}\n\n"
            f"Current schema: {json.dumps(current_schema, indent=2)}\n\n"
            f"Detected changes: {json.dumps(changes, indent=2)}\n"
        )

    def _extract_json(self, content: str) -> dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start >= 0 and end > start:
                return json.loads(content[start : end + 1])
            raise

    def _normalize_output(self, payload: dict[str, Any], changes: list[dict[str, Any]]) -> dict[str, Any]:
        severity_label = payload.get("severity_label") or payload.get("severity") or "Medium"
        risk_score = int(payload.get("risk_score") or self._risk_score_from_severity(severity_label, changes))
        return {
            "severity_score": payload.get("severity_score", severity_label),
            "severity_label": severity_label,
            "systems_potentially_affected": payload.get("systems_potentially_affected", []),
            "business_impact": payload.get("business_impact", "Schema changes may affect downstream consumers."),
            "technical_impact": payload.get("technical_impact", "Potential query, pipeline, and API breakage."),
            "mitigation_plan": payload.get("mitigation_plan", []),
            "blast_radius": payload.get("blast_radius", []),
            "risk_score": risk_score,
            "executive_summary": payload.get("executive_summary", "Schema drift requires attention before deployment."),
            "recommended_actions": payload.get("recommended_actions", []),
            "ai_provider": "ollama",
        }

    def _heuristic_analysis(self, changes: list[dict[str, Any]]) -> dict[str, Any]:
        risk_score = self._risk_score_from_changes(changes)
        severity_label = self._severity_from_score(risk_score)
        impacted_tables = sorted({change.get("table", "unknown") for change in changes})
        return {
            "severity_score": severity_label,
            "severity_label": severity_label,
            "systems_potentially_affected": ["ETL pipelines", "BI dashboards", "application queries"],
            "business_impact": "Data contracts may break for analytics and application consumers.",
            "technical_impact": "Column renames, removals, and type shifts can fail queries or integrations.",
            "mitigation_plan": [
                "Review impacted tables with owners.",
                "Create compatibility views for renamed or removed columns.",
                "Apply migration with rollback script and verify downstream jobs.",
            ],
            "blast_radius": impacted_tables,
            "risk_score": risk_score,
            "executive_summary": f"Schema drift touched {len(impacted_tables)} table(s) and is assessed as {severity_label}.",
            "recommended_actions": ["Generate migration script", "Notify stakeholders", "Validate compatibility views"],
            "ai_provider": "heuristic-fallback",
        }

    def _risk_score_from_changes(self, changes: list[dict[str, Any]]) -> int:
        score = 0
        for change in changes:
            kind = change.get("change")
            if kind in {"removed_table", "removed_column"}:
                score += 30
            elif kind in {"renamed_column", "data_type_changed"}:
                score += 20
            elif kind == "added_table":
                score += 10
            elif kind == "added_column":
                score += 5
        return min(score or 10, 100)

    def _risk_score_from_severity(self, severity: str, changes: list[dict[str, Any]]) -> int:
        risk_map = {"Low": 20, "Medium": 45, "High": 70, "Critical": 90}
        return max(risk_map.get(severity, 45), self._risk_score_from_changes(changes))

    def _severity_from_score(self, score: int) -> str:
        if score >= 85:
            return "Critical"
        if score >= 60:
            return "High"
        if score >= 30:
            return "Medium"
        return "Low"
