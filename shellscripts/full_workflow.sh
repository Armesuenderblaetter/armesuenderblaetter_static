#!/bin/bash
./shellscripts/dl_saxon.sh
rm -rf data_repo  data
mkdir data
git clone https://github.com/Armesuenderblaetter/armesuenderblaetter_data_ouput.git data_repo
cp -r data_repo/xml/editions/ data
cp -r data_repo/xml/indices/ data
cp -r data_repo/json .
cp -r data_repo/meta/ data
./shellscripts/dl_imprint.sh
./pyscripts/filter_editions.py --editions-dir data/editions --events-file data/indices/events.xml
./pyscripts/filter_typesense_json.py --editions-dir data/editions --typesense-json json/typesense_entries.json --persons-json json/persons.json
# ./pyscripts/ts_index.py
./shellscripts/denormalize_indices.sh
ant

# clone target
mkdir target
git clone "https://gitlab.oeaw.ac.at/acdh-ch/todesurteile/flugblaetter-static-page.git" target
if [ -d ./html/json ]
	then rm -rf ./html/json
fi
mkdir -p ./html/json
cp json/punishments.json ./html/json/
cp json/offences.json ./html/json/
if [ -d target/html ]; then
	find target/html -maxdepth 1 -type f -delete
fi
mkdir -p target/html
cp -a html/. target/html/
mkdir -p target/data/editions
cp -a data/editions/. target/data/editions/
cd target
if [[ -n "$(git status --porcelain)" ]]; then
	echo "changes detected"
	git add html data/editions
	git commit -m "$(date) new html and edition xml data"
	git push
else
	echo "nothing to push"
fi
