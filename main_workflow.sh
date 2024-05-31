#! /bin/bash
data_dir="./data/"
echo "fetching transkriptions"
cp data/out/xml/editions $data_dir &&
cp -r data/out/xml/indices $data_dir
cp -r data/out/json .
sleep 3
python ./pyscripts/setup_typesense.py
python ./pyscripts/setup_person_typesense.py