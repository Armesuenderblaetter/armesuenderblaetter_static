#!/bin/bash
denormalize-indices -f "./data/editions/*.xml" -i "./data/indices/listperson.xml" -x ".//tei:title[1]/text()"
# denormalize-indices -f "./data/indices/listperson.xml" -i "./data/indices/events.xml" -x ".//tei:title[1]/text()"