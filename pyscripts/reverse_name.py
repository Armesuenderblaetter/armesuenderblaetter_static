#!/usr/bin/env python
import json
import sys
import os


def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <path_to_json_file>")
        sys.exit(1)

    json_path = sys.argv[1]

    if not os.path.isfile(json_path):
        print(f"Error: File '{json_path}' not found.")
        sys.exit(1)

    # Load the JSON file
    with open(json_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Add 'fullnameB' to each person
    for person_id, person_data in data.items():
        forename = person_data.get("forename", "")
        surname = person_data.get("surname", "")
        person_data["fullnameB"] = f"{forename} {surname}".strip()

    # Save the updated JSON back to the file
    with open(json_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    print(f"Updated file saved: {json_path}")


if __name__ == "__main__":
    main()
