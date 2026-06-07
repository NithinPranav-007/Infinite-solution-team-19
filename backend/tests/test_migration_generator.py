from __future__ import annotations

from services.migration_generator import MigrationGenerator


def test_renamed_column_compatibility_view_uses_new_column_name():
    generator = MigrationGenerator()
    changes = [
        {
            "table": "customers",
            "change": "renamed_column",
            "from": "customer_name",
            "to": "fullname",
        }
    ]
    analysis = {"severity_label": "Medium", "risk_score": 20}

    result = generator.generate(changes, analysis)

    assert "SELECT fullname AS customer_name FROM customers" in result["compatibility_views"]
