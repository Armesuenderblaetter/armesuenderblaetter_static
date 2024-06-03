#!/bin/bash
data_dir="./data/"
mkdir $data_dir
cp -r data_repo/xml/editions $data_dir
cp -r data_repo/xml/indices $data_dir
cp -r data_repo/json .
cp -r meta $data_dir
python ./pyscripts/setup_typesense.py
python ./pyscripts/setup_person_typesense.py