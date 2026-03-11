import os
import glob
import tqdm
import json
from lxml import etree as ET


SOURCE_DIR = os.path.join('data', 'editions', 'output2')
SOURCE_FILE = '*.xml'
source = os.path.join(SOURCE_DIR, SOURCE_FILE)
source_glob = glob.glob(source)

group = dict()

for file in tqdm.tqdm(sorted(source_glob), total=len(source_glob)):
    # group files by witness
    edition = file.split('/')[-1].split('_')[2]
    try:
        add = file.split('/')[-1].split('_')[3]
        if len(add) > 1:
            edition += f"_{add}"
    except IndexError:
        pass
    witness = file.split('/')[-1].split('_')[-1].split('.')[0]
    key = f"{edition}_{witness}"
    if key not in group:
        group[key] = []
    group[key].append(file)

with open('data/facsimiles.json', 'w') as f:
    json.dump(group, f, indent=4)

for witness, files in group.items():
    wit = witness.split('_')[-1]
    facsimile = ET.Element('facsimile')
    for file in files:
        doc = ET.parse(file)
        pb = doc.xpath('//tei:pb',
                       namespaces={"tei": "http://www.tei-c.org/ns/1.0"})
        for p in pb:
            try:
                facs = p.attrib.get('facs').split('.')[0]
            except AttributeError:
                facs = "pb_" + "{0:04d}".format(pb.index(p) + 1)
            if facs is not None and wit in facs:
                surface = ET.SubElement(facsimile, 'surface')
                surface.attrib['source'] = facs
                graphic = ET.SubElement(surface, 'graphic')
                graphic.attrib['url'] = f"{facs}.jp2"
    for file in files:
        doc = ET.parse(file)
        for bad in doc.xpath('//tei:facsimile',
                             namespaces={"tei": "http://www.tei-c.org/ns/1.0"}):
            bad.getparent().remove(bad)
        doc.getroot().insert(1, facsimile)
        doc.write(file, encoding='utf-8', xml_declaration=True)
