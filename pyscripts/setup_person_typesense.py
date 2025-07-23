#!/usr/bin/env python
import json
from typesense.api_call import ObjectNotFound
from acdh_cfts_pyutils import TYPESENSE_CLIENT as client
import re


page_base_url = ""
typesense_collection_name = "flugblaetter_todesurteile_persons"
xml_path = "./data/editions/*.xml"
tei_ns = ""
json_ts_index_path = "./json/persons.json"

current_typesense_schema = {
    "name": typesense_collection_name,
    "enable_nested_fields": False,
    "default_sorting_field": "fullname",
    "fields": [
        {"name": "sorter", "type": "int32"},
        {"name": "global_id", "type": "string"},
        {"name": "forename", "type": "string"},
        {"name": "surname", "type": "string"},
        {"name": "fullname", "type": "string", "facet": True},
        {"name": "birth_place", "type": "string", "facet": True},
        {"name": "sex", "type": "string", "facet": True},
        {"name": "age", "type": "string", "facet": False},
        {"name": "decade_age", "type": "string", "facet": True},
        {"name": "type", "type": "string", "facet": True},
        {"name": "marriage_status", "type": "string", "facet": True},
        {"name": "faith", "type": "string", "facet": True},
        {"name": "occupation", "type": "string", "facet": True},
        {"name": "offences", "type": "string[]", "facet": True},
        {"name": "execution", "type": "string[]", "facet": True},
        {"name": "execution_places", "type": "string[]", "facet": True},
        {"name": "punishments", "type": "string[]", "facet": True},
        {"name": "file_identifier", "type": "string", "facet": False},
        {"name": "archives", "type": "string[]", "facet": False},
        {"name": "id", "type": "string", "facet": False},
        {"name": "thumbnail", "type": "string"},
    ]
}


def load_json(path):
    json_data = None
    with open(path) as json_file:
        json_data = json.load(json_file)
    return json_data


def create_records():
    docindex_json = load_json(json_ts_index_path)
    return list(docindex_json.values())


def setup_collection():
    print(f"setting up collection '{typesense_collection_name}'")
    try:
        client.collections[typesense_collection_name].delete()
        print(f"resetted collection '{typesense_collection_name}'")
    except ObjectNotFound:
        pass
    client.collections.create(current_typesense_schema)
    print(f"created collection '{typesense_collection_name}'")


def upload_records(records):
    print(f"uploading '{len(records)}' records")
    setup_collection()
    print(f"uploading to {typesense_collection_name}")
    make_index = client.collections[typesense_collection_name].documents.import_(
        records, {"action": "upsert"}
    )
    errors = [
        msg for msg in make_index if (msg != '"{\\"success\\":true}"' and msg != '""')
    ]
    if errors:
        print("\n\n\nerrors while building ts-index!!\n\n\n")
        for err in errors:
            result = re.search(
                r',\\\"error\\\":\\\"(.*)\\\",\\\"',
                str(err)
            ).group(1)
            print(f"\n\n{result}\n")
            print(err)
    else:
        print("\nno errors")
    print(f'\ndone with indexing "{typesense_collection_name}"')
    return make_index


if __name__ == "__main__":
    records = create_records()
    result = upload_records(records)
