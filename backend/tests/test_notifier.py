from __future__ import annotations

from services.notifier import DiscordNotifier


class _WebhookResponse:
    status_code = 204

    def raise_for_status(self) -> None:
        return None


def test_discord_notifier_sends_message(monkeypatch):
    calls = {}

    def fake_post(url, json, timeout):
        calls["url"] = url
        calls["json"] = json
        calls["timeout"] = timeout
        return _WebhookResponse()

    monkeypatch.setattr("services.notifier.requests.post", fake_post)
    notifier = DiscordNotifier(webhook_url="https://discord.test/webhook")
    result = notifier.send("Schema drift detected", severity="Critical")

    assert result["sent"] is True
    assert calls["url"] == "https://discord.test/webhook"
    assert calls["json"]["embeds"][0]["title"] == "Schema Drift Detected"
