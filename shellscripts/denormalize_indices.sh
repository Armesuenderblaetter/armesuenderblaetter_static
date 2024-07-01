#!/bin/bash
denormalize-indices -f "./data/editions/*.xml" -i "./data/indices/listperson.xml" -x ".//tei:title[1]/text()"