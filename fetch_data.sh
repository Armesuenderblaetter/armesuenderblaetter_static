#! /bin/bash
data_dir="./data/"
echo "fetching transkriptions"
# get the data
(cd ../flugblaetter_data/ && \
    ./shellscripts/extract_infos.sh
) && cp -r ../flugblaetter_data/out/xml/editions $data_dir &&
cp -r ../flugblaetter_data/out/xml/indices $data_dir
cp -r ../flugblaetter_data/out/json .