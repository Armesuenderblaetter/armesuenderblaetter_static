#! /bin/bash
editions_dir="./data/editions/"
indices_dir="./data/indices/"
echo "fetching transkriptions"
# get the data
(cd ../flugblaetter_data/ && \
    ./shellscripts/extract_infos.sh
) && cp ../flugblaetter_data/todesurteile_master/303_annot_tei/*.xml $editions_dir &&
cp -r ../flugblaetter_data/out/xml/* $indices_dir
cp -r ../flugblaetter_data/out/json .

