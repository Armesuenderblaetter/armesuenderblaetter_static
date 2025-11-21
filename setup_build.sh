#!/bin/bash
data_dir="./data/"
mkdir $data_dir
cp -r data_repo/xml/editions $data_dir
cp -r data_repo/xml/indices $data_dir
cp -r data_repo/json .
mkdir -p html/json
cp -r data_repo/json/* html/json/
python ./pyscripts/setup_typesense.py
python ./pyscripts/setup_person_typesense.py