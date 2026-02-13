#!/usr/bin/env python3
"""
Unified Typesense indexing script for Armesuenderblaetter.

Creates a single document-based collection that includes:
- Document-level fields (title, date, printer, fulltext, etc.)
- Aggregated person facets (names, sex, age, offences, etc.)

Replaces both setup_typesense.py and setup_person_typesense.py.
"""
import json
import re
from typesense.api_call import ObjectNotFound
from acdh_cfts_pyutils import TYPESENSE_CLIENT as client


typesense_collection_name = "flugblaetter_todesurteile"
json_ts_index_path = "./json/typesense_entries.json"
json_persons_path = "./json/persons.json"


current_typesense_schema = {
    "name": typesense_collection_name,
    "enable_nested_fields": False,
    "default_sorting_field": "sorting_date",
    "fields": [
        # Document-level fields
        {"name": "thumbnail", "type": "string"},
        {"name": "title", "type": "string", "sort": True},
        {"name": "id", "type": "string"},
        {"name": "sorting_date", "type": "int32"},
        {"name": "label_date", "type": "int32", "facet": True},
        {"name": "filename", "type": "string"},
        {"name": "fulltext", "type": "string"},
        {"name": "archives", "type": "string[]", "facet": True},
        # Aggregated person facets (arrays – one document may have multiple persons)
        {"name": "person_names", "type": "string[]", "facet": True},
        {"name": "person_sex", "type": "string[]", "facet": True},
        {"name": "person_age", "type": "string[]", "facet": False},
        {"name": "person_decade_age", "type": "string[]", "facet": True},
        {"name": "person_birth_place", "type": "string[]", "facet": True},
        {"name": "person_marriage_status", "type": "string[]", "facet": True},
        {"name": "person_faith", "type": "string[]", "facet": True},
        {"name": "person_occupation", "type": "string[]", "facet": True},
        {"name": "person_offences", "type": "string[]", "facet": True},
        {"name": "person_execution", "type": "string[]", "facet": True},
        {"name": "person_execution_places", "type": "string[]", "facet": True},
        {"name": "person_punishments", "type": "string[]", "facet": True},
    ],
}


def load_json(path):
    with open(path) as json_file:
        return json.load(json_file)


def unique_list(lst):
    """Return unique items preserving order."""
    seen = set()
    result = []
    for item in lst:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def aggregate_person_field(persons, field):
    """Collect all values from a field across persons, flatten arrays, deduplicate."""
    values = []
    for p in persons:
        val = p.get(field, "")
        if isinstance(val, list):
            values.extend(val)
        elif val:
            values.append(val)
    return unique_list(values)


def create_records():
    print(f"Loading documents from {json_ts_index_path}")
    doc_data = load_json(json_ts_index_path)

    print(f"Loading persons from {json_persons_path}")
    persons_data = load_json(json_persons_path)

    # Group persons by file_identifier
    persons_by_doc = {}
    for pid, person in persons_data.items():
        file_id = person.get("file_identifier", "")
        if file_id:
            persons_by_doc.setdefault(file_id, []).append(person)

    records = []
    for doc_id, doc in doc_data.items():
        persons = persons_by_doc.get(doc.get("id", doc_id), [])

        record = {
            # Document fields
            "thumbnail": doc.get("thumbnail", ""),
            "title": doc.get("title", ""),
            "id": doc.get("id", doc_id),
            "sorting_date": doc.get("sorting_date", 0),
            "label_date": doc.get("label_date", 0),
            "filename": doc.get("filename", ""),
            "fulltext": doc.get("fulltext", ""),
            "archives": doc.get("archives", []),
            # Aggregated person facets
            "person_names": aggregate_person_field(persons, "fullname"),
            "person_sex": aggregate_person_field(persons, "sex"),
            "person_age": aggregate_person_field(persons, "age"),
            "person_decade_age": aggregate_person_field(persons, "decade_age"),
            "person_birth_place": aggregate_person_field(persons, "birth_place"),
            "person_marriage_status": aggregate_person_field(
                persons, "marriage_status"
            ),
            "person_faith": aggregate_person_field(persons, "faith"),
            "person_occupation": aggregate_person_field(persons, "occupation"),
            "person_offences": aggregate_person_field(persons, "offences"),
            "person_execution": aggregate_person_field(persons, "execution"),
            "person_execution_places": aggregate_person_field(
                persons, "execution_places"
            ),
            "person_punishments": aggregate_person_field(persons, "punishments"),
        }
        records.append(record)

    # Validate
    fields = [f["name"] for f in current_typesense_schema["fields"]]
    errors = []
    for rec in records:
        for f in fields:
            if f not in rec:
                errors.append(f"missing '{f}' in {rec.get('id', '?')}")
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
        raise ValueError(f"{len(errors)} validation errors found")

    docs_with_persons = sum(1 for r in records if r["person_names"])
    docs_without = sum(1 for r in records if not r["person_names"])
    print(
        f"Created {len(records)} document records "
        f"({docs_with_persons} with persons, {docs_without} without)"
    )

    return records


def setup_collection():
    print(f"Setting up collection '{typesense_collection_name}'")
    try:
        client.collections[typesense_collection_name].delete()
        print(f"  Deleted existing collection")
    except ObjectNotFound:
        pass
    client.collections.create(current_typesense_schema)
    print(f"  Created collection")


def upload_records(records):
    setup_collection()
    print(f"Uploading {len(records)} records to '{typesense_collection_name}'")
    make_index = client.collections[typesense_collection_name].documents.import_(
        records, {"action": "upsert"}
    )
    errors = [
        msg for msg in make_index if (msg != '"{\\"success\\":true}"' and msg != '""')
    ]
    if errors:
        print("\n\nERRORS while building ts-index:\n")
        for err in errors:
            match = re.search(r",\\\"error\\\":\\\"(.*)\\\",\\\"", str(err))
            if match:
                print(f"  {match.group(1)}")
            print(f"  {err}\n")
    else:
        print("  No errors")
    print(f'Done with indexing "{typesense_collection_name}"')
    return make_index


if __name__ == "__main__":
    records = create_records()
    result = upload_records(records)
