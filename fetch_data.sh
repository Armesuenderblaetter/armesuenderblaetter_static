# bin/bash

echo "fetching transkriptions from data_repo"
rm -rf data/editions && mkdir data/editions
rm -rf data/indices && mkdir data/indices
rm -rf data/meta && mkdir data/meta
curl -LO https://github.com/acdh-oeaw/dse-static-cookiecutter/dse-static-data/archive/refs/heads/main.zip
unzip main

mv ./dse-static-data-main/data/editions/ ./data
mv ./dse-static-data-main/data/indices/ ./data
mv ./dse-static-data-main/data/meta/ ./data

rm main.zip
rm -rf ./dse-static-data-main
