#!/bin/bash
denormalize-indices -f "./data/editions/*.xml" -i "./data/indices/listperson.xml" -x ".//tei:title[1]/text()" --standoff
# denormalize-indices -f "./data/indices/listperson.xml" -i "./data/indices/events.xml" -x ".//tei:title[1]/text()" --standoff

# add-attributes -g "./data/editions/output/*.xml" -b "https://id.acdh.oeaw.ac.at/armesuenderblaetter"