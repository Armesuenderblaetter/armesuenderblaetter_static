#!/usr/bin/env python3
"""Filter Typesense JSON files to keep only entries whose editions survived filtering.

Run this AFTER filter_editions.py and BEFORE ts_index.py so that only
the editions still present in
data/editions are indexed.
"""

import argparse
import json
import sys
from pathlib import Path


def get_surviving_edition_ids(editions_dir: Path) -> set:
    """Return the set of edition IDs (stems) that remain after filtering."""
    return {p.stem for p in editions_dir.glob("fb_*.xml")}


def filter_typesense_entries(json_path: Path, edition_ids: set) -> int:
    """Remove entries from typesense_entries.json whose key is not in *edition_ids*.

    Returns the number of removed entries.
    """
    with open(json_path) as fh:
        data = json.load(fh)

    original_count = len(data)
    filtered = {k: v for k, v in data.items() if k in edition_ids}

    with open(json_path, "w") as fh:
        json.dump(filtered, fh, ensure_ascii=False, indent=2)

    removed = original_count - len(filtered)
    print(f"typesense_entries: {original_count} → {len(filtered)} (removed {removed})")
    return removed


def filter_person_entries(json_path: Path, edition_ids: set) -> int:
    """Remove person entries whose file_identifier is not in *edition_ids*.

    Returns the number of removed entries.
    """
    with open(json_path) as fh:
        data = json.load(fh)

    original_count = len(data)
    filtered = {
        k: v for k, v in data.items()
        if v.get("file_identifier") in edition_ids
    }

    with open(json_path, "w") as fh:
        json.dump(filtered, fh, ensure_ascii=False, indent=2)

    removed = original_count - len(filtered)
    print(f"persons: {original_count} → {len(filtered)} (removed {removed})")
    return removed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--editions-dir",
        type=Path,
        default=Path("data/editions"),
        help="Directory containing the (already filtered) edition XML files.",
    )
    parser.add_argument(
        "--typesense-json",
        type=Path,
        default=Path("json/typesense_entries.json"),
        help="Path to typesense_entries.json.",
    )
    parser.add_argument(
        "--persons-json",
        type=Path,
        default=Path("json/persons.json"),
        help="Path to persons.json.",
    )
    args = parser.parse_args()

    edition_ids = get_surviving_edition_ids(args.editions_dir)
    if not edition_ids:
        print("WARNING: no editions found – refusing to wipe all JSON entries.",
              file=sys.stderr)
        sys.exit(1)

    print(f"Surviving editions: {len(edition_ids)}")
    filter_typesense_entries(args.typesense_json, edition_ids)
    filter_person_entries(args.persons_json, edition_ids)


if __name__ == "__main__":
    main()
