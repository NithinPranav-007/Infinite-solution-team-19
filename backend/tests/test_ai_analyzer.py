from __future__ import annotations

from services.ai_analyzer import AIImpactAnalyzer


class _FakeResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {
            "message": {
                "content": '{"severity_label":"High","systems_potentially_affected":["ETL"],"business_impact":"Risk","technical_impact":"Breakage","mitigation_plan":["Use view"],"blast_radius":["orders"],"risk_score":78,"executive_summary":"High risk","recommended_actions":["Deploy migration"]}'
            }
        }


def test_ai_analyzer_normalizes_ollama_response(monkeypatch):
    def fake_post(*args, **kwargs):
        return _FakeResponse()

    monkeypatch.setattr("services.ai_analyzer.requests.post", fake_post)
    analyzer = AIImpactAnalyzer(base_url="http://localhost:11434", model="llama3.2")
    result = analyzer.analyze({}, {}, [{"table": "orders", "change": "removed_column", "column": "customer_id"}])

    assert result["severity_label"] == "High"
    assert result["risk_score"] == 78
    assert result["ai_provider"] == "ollama"
