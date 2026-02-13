#!/bin/bash
data_dir="./data/"
mkdir $data_dir
cp -r data_repo/xml/editions $data_dir
cp -r data_repo/xml/indices $data_dir
cp -r data_repo/json .
mkdir -p html/json
cp -r data_repo/json/* html/json/
python ./pyscripts/ts_index.py