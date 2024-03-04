# bin/bash

echo "fetching transkriptions"
# prepare folders
rm -rf data/editions && mkdir data/editions
# #rm -rf data/indices && mkdir data/indices
# #rm -rf data/meta && mkdir data/meta
# get the data
(cd ../flugblaetter_data/ && \
    ./shellscripts/extract_infos.sh
) && cp ../todesurteile-daten/303_annot_tei/*.xml ./data/editions/

# ## distribute the data
# #mv ./dse-static-data-main/data/editions/ ./data
# #mv ./dse-static-data-main/data/indices/ ./data
# #mv ./dse-static-data-main/data/meta/ ./data
# ## clean up
# #rm main.zip
# #rm -rf ./dse-static-data-main
