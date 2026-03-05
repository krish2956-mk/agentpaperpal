import json
import os

RULES_DIR = os.path.join(os.path.dirname(__file__), "..", "rules")

JOURNAL_MAP: dict[str, str] = {
    "APA 7th Edition": "apa7.json",
    "IEEE": "ieee.json",
    "Vancouver": "vancouver.json",
    "Springer": "springer.json",
    "Chicago": "chicago.json",
}


def load_rules(journal_name: str) -> dict:
    """
    Load journal formatting rules from the pre-built JSON file.

    Args:
        journal_name: One of the keys in JOURNAL_MAP.

    Returns:
        Dict containing the complete journal rules schema.

    Raises:
        ValueError: If journal_name is not in JOURNAL_MAP or file not found.
    """
    filename = JOURNAL_MAP.get(journal_name)
    if not filename:
        raise ValueError(
            f"Unsupported journal: '{journal_name}'. "
            f"Supported: {list(JOURNAL_MAP.keys())}"
        )

    filepath = os.path.join(RULES_DIR, filename)
    if not os.path.exists(filepath):
        raise ValueError(f"Rules file not found: {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)
