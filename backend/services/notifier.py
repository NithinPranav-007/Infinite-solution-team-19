"""Discord webhook notification service."""

from __future__ import annotations

import logging
import os
from typing import Any

import requests

logger = logging.getLogger(__name__)


class DiscordNotifier:
    def __init__(self, webhook_url: str | None = None, timeout: int = 20) -> None:
        self.webhook_url = webhook_url or os.getenv("DISCORD_WEBHOOK_URL")
        self.timeout = timeout

    def send(self, message: str, severity: str = "Medium", details: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = {
            "content": message,
            "embeds": [
                {
                    "title": "Schema Drift Detected",
                    "color": self._severity_color(severity),
                    "fields": self._build_fields(severity, details or {}),
                }
            ],
        }

        if not self.webhook_url:
            logger.info("Discord webhook not configured; returning dry-run response.")
            return {"sent": False, "dry_run": True, "message": message, "severity": severity}

        response = requests.post(self.webhook_url, json=payload, timeout=self.timeout)
        response.raise_for_status()
        return {"sent": True, "status_code": response.status_code, "severity": severity}

    def _build_fields(self, severity: str, details: dict[str, Any]) -> list[dict[str, str]]:
        fields = [
            {"name": "Severity", "value": severity, "inline": True},
            {"name": "Risk Score", "value": str(details.get("risk_score", "N/A")), "inline": True},
        ]
        for key in ("table", "change", "mitigation"):
            if key in details:
                fields.append({"name": key.capitalize(), "value": str(details[key]), "inline": False})
        return fields

    def _severity_color(self, severity: str) -> int:
        return {
            "Low": 0x2ECC71,
            "Medium": 0xF1C40F,
            "High": 0xE67E22,
            "Critical": 0xE74C3C,
        }.get(severity, 0x95A5A6)
