#! /bin/bash
data_dir="./data/"
mkdir $data_dir
cp data_repo/out/xml/editions $data_dir
cp -r data_repo/out/xml/indices $data_dir
cp -r data_repo/out/json .
python ./pyscripts/setup_typesense.py
python ./pyscripts/setup_person_typesense.py