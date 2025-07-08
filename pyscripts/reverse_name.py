#!/usr/bin/env python
import json
import sys
import os


def add_archive():
    with open("json/documents.json", 'r', encoding='utf-8') as filename:
        data = json.load(filename)

    id_arch = {}
    for doc_id, doc_data in data.items():
        print(doc_data)
        id_arch[doc_id] = doc_data["archives"]
    return id_arch


def get_archive(archive, idKey):
    new_key = "_".join(idKey.split("_")[1:-1])
    return archive[new_key]


def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <path_to_json_file>")
        sys.exit(1)

    json_path = sys.argv[1]

    if not os.path.isfile(json_path):
        print(f"Error: File '{json_path}' not found.")
        sys.exit(1)

    # Load the JSON file
    with open(json_path, 'r', encoding='utf-8') as filename:
        data = json.load(filename)

    doc_archives = add_archive()
    # Add 'fullnameB' to each person
    for person_id, person_data in data.items():
        forename = person_data.get("forename", "")
        surname = person_data.get("surname", "")
        if surname == "k. A.":
            surname = ""
        person_data["fullnameB"] = f"{forename} {surname}".strip()
        person_data["archives"] = get_archive(doc_archives, person_id)

    # Save the updated JSON back to the file
    with open(json_path, 'w', encoding='utf-8') as filename:
        json.dump(data, filename, ensure_ascii=False, indent=2)

    print(f"Updated file saved: {json_path}")


if __name__ == "__main__":
    main()
