#!/usr/bin/env python3
"""Filter edition XML files to keep only Vienna-related executions."""

import argparse
import sys
from pathlib import Path
from typing import Dict, Set
import xml.etree.ElementTree as ET


TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"

# Allowed execution places (normalized to match events.xml content)
ALLOWED_PLACES = {
    "Erdberger Rossweide",
    "G\u00e4nseweide",
    "Milit\u00e4rische Richtstatt vor K\u00e4rntnertor",
    "Rabenstein vor Schottentor",
    "Stubentor",
    "Wienerberg",
    "Wiennerberg",
}


def load_execution_places(events_file: Path) -> Dict[str, Set[str]]:
    """Return mapping of edition id to the set of execution places."""

    tree = ET.parse(events_file)
    root = tree.getroot()
    edition_places: Dict[str, Set[str]] = {}

    for event in root.findall('.//tei:event[@type="execution"]', namespaces=TEI_NS):
        xml_id = event.get(XML_ID)
        if not xml_id:
            continue

        # Expect identifiers like "trial_result_fb_YYYYMMDD_Name_0001"
        if xml_id.startswith("trial_result_"):
            xml_id = xml_id[len("trial_result_") :]

        if "_" not in xml_id:
            continue

        edition_id = xml_id.rsplit("_", 1)[0]

        place_elem = event.find(".//tei:placeName", namespaces=TEI_NS)
        place_text = ""
        if place_elem is not None:
            place_text = "".join(place_elem.itertext()).strip()

        if place_text:
            edition_places.setdefault(edition_id, set()).add(place_text)

    return edition_places


def is_printed_in_vienna(edition_file: Path) -> bool:
    """Return True if any pubPlace mentions Vienna."""

    tree = ET.parse(edition_file)
    root = tree.getroot()
    pub_places = [
        "".join(elem.itertext()).strip()
        for elem in root.findall(".//tei:pubPlace", namespaces=TEI_NS)
    ]

    return any("wien" in place.lower() for place in pub_places)


def filter_editions(editions_dir: Path, events_file: Path) -> int:
    """Delete edition files that do not meet the Vienna criteria.

    Returns the number of files removed.
    """

    edition_places = load_execution_places(events_file)
    removed = 0

    for edition_path in sorted(editions_dir.glob("fb_*.xml")):
        edition_id = edition_path.stem

        places = edition_places.get(edition_id, set())

        valid_places = places and all(place in ALLOWED_PLACES for place in places)
        printed_in_vienna = False

        if valid_places:
            try:
                printed_in_vienna = is_printed_in_vienna(edition_path)
            except ET.ParseError as exc:  # pragma: no cover - safeguard for malformed XML
                print(f"Failed to parse {edition_path}: {exc}", file=sys.stderr)

        if not (valid_places and printed_in_vienna):
            edition_path.unlink(missing_ok=True)
            removed += 1

    return removed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--editions-dir",
        type=Path,
        default=Path("data/editions"),
        help="Directory containing edition XML files.",
    )
    parser.add_argument(
        "--events-file",
        type=Path,
        default=Path("data/indices/events.xml"),
        help="TEI events index file.",
    )
    args = parser.parse_args()

    editions_dir: Path = args.editions_dir
    events_file: Path = args.events_file

    if not editions_dir.exists() or not editions_dir.is_dir():
        parser.error(f"Editions directory not found: {editions_dir}")

    if not events_file.exists():
        parser.error(f"Events file not found: {events_file}")

    removed = filter_editions(editions_dir, events_file)
    kept = len(list(editions_dir.glob("fb_*.xml")))

    print(
        f"Filtered editions: removed {removed} file(s), kept {kept} file(s) in {editions_dir}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
