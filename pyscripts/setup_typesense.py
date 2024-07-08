import json
from typesense.api_call import ObjectNotFound
from acdh_cfts_pyutils import TYPESENSE_CLIENT as client
import re
# from acdh_tei_pyutils.tei import TeiReader
# from tqdm import tqdm


page_base_url = ""
typesense_collection_name = "flugblaetter_todesurteile"
xml_path = "./data/editions/*.xml"
tei_ns = ""
json_ts_index_path = "./json/typesense_entries.json"
json_punishments_path = "./json/punishments.json"


# current_typesense_schema = {
#     "name": typesense_collection_name,
#     "enable_nested_fields": False,
#     "default_sorting_field": "execution_date",
#     "fields": [
#         {"name": "execution_date", "type": "int32"},
#         {"name": "identifier", "type": "string"},
#         {"name": "filename", "type": "string"},
#         {"name": "fulltext", "type": "string"},
#         {"name": "title", "type": "string"}
#     ],
# }


current_typesense_schema = {
    "name": typesense_collection_name,
    "enable_nested_fields": False,
    "default_sorting_field": "sorting_date",
    "fields": [
        {"name": "thumbnail", "type": "string"},
        {"name": "title", "type": "string"},
        {"name": "id", "type": "string"},
        {"name": "sorting_date", "type": "int32"},
        {"name": "label_date", "type": "int32", "facet": True},
        {"name": "filename", "type": "string"},
        {"name": "fulltext", "type": "string"},
        {"name": "print_date", "type": "string"},
        {"name": "printer", "type": "string",  "facet": True},
        {"name": "printing_location", "type": "string", "facet": True},
        {"name": "archives", "type": "string[]", "facet": True}
    ],
}


def load_json(path):
    json_data = None
    with open(path) as json_file:
        json_data = json.load(json_file)
    return json_data


def create_records():
    print(f"loading from {json_ts_index_path}")
    docindex_json = load_json(json_ts_index_path)
    entries = list(docindex_json.values())
    fields = [f["name"] for f in current_typesense_schema["fields"]]
    errors = []
    for e in entries:
        for f in fields:
            if not f in e:
                errors.append(f"missing {f} in {e['id']}")
    if errors:
        for e in errors:
            print(e)
        raise ValueError
    return entries


def create_records_bak(punishments_by_id: dict):
    document_records = []
    docindex_json = load_json(json_ts_index_path)
    for id, doc_info in docindex_json.items():
        trial_results = [ punishments_by_id[e_id] for e_id in doc_info["contains_events"] if "trial_result" in e_id ]
        execution = [trial_result for trial_result in trial_results if trial_result["type"] == "execution"]
        if len(execution) == 1:
            execution = execution[0]
        elif len(execution) == 0:
            # z.B.
            # 303_annot_tei/17970000_JohannMüllner-JgnazMenz-GeorgDürnböck-ThomasSchedel.xml 
            #input(f"doc {id} contains no execution")
            pass
        else:
            # z.B.
            # fb_17780827_JohannH_MichaelH
            #input(f"doc {id} contains more then one execution")
            execution = trial_results[-1]
        document_record = {
            "title": doc_info["title"],
            "execution_date" : int(re.sub("-", "", execution["date"][0])) if execution else 17490000,
            "identifier" : doc_info["id"],
            "filename" : doc_info["filename"],
            "fulltext" : doc_info["fulltext"],
        }
        document_records.append(document_record)
    return document_records

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
        print(f"\n\n\nerrors while building ts-index!!\n\n\n")
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
    # punishments_by_id = load_json(json_punishments_path)
    records = create_records()
    result = upload_records(records)
