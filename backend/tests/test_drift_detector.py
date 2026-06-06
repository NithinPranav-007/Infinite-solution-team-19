from __future__ import annotations

from services.drift_detector import DriftDetector


def test_drift_detector_identifies_changes():
    previous_snapshot = {
        "tables": [
            {
                "name": "customers",
                "columns": [
                    {"name": "id", "data_type": "INTEGER"},
                    {"name": "customer_id", "data_type": "TEXT"},
                ],
            }
        ]
    }
    current_snapshot = {
        "tables": [
            {
                "name": "customers",
                "columns": [
                    {"name": "id", "data_type": "INTEGER"},
                    {"name": "customer_identifier", "data_type": "TEXT"},
                ],
            },
            {"name": "orders", "columns": [{"name": "id", "data_type": "INTEGER"}]},
        ]
    }

    detector = DriftDetector()
    changes = detector.compare(previous_snapshot, current_snapshot)

    change_types = {change["change"] for change in changes}
    assert "added_table" in change_types
    assert "renamed_column" in change_types or "removed_column" in change_types
