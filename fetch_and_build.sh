#! /bin/bash
# this rebuilds all the data & recreates all the index stuff
secrets_path=".typesense_sec"
if [ -f "$secrets_path" ]
then
    source "$secrets_path"
else
    echo "please provide api keys in the file $secrets_path"
    echo 'export TYPESENSE_API_KEY=""' >> $secrets_path
    echo 'export TYPESENSE_SRCH_KEY=""' >> $secrets_path
    echo 'export TYPESENSE_COL_NAME=""' >> $secrets_path
    exit 1
fi
pip install -r requirements.txt
./fetch_data.sh
sleep 3
python ./pyscripts/setup_typesense.py
python ./pyscripts/setup_person_typesense.py
ant