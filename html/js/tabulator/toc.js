const iiif_server_base_path =
  "https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/";
const iiif_attribs = "/full/260,/0/default.jpg";

function htmlStringSorter(a, b) {
  const toText = (value) => {
    if (value == null) {
      return "";
    }
    const div = document.createElement("div");
    div.innerHTML = value;
    return div.textContent ? div.textContent.trim() : "";
  };

  const textA = toText(a);
  const textB = toText(b);

  return textA.localeCompare(textB, "de", { sensitivity: "base" });
}

var config = {
    //height: 800,
    layout: "fitDataStretch",
    responsiveLayout: false,
    tooltips: true,
    dataLoader: true,
    columns:[
        {title:"", field:"", formatter:"html", download:"false", headerSort:"false"},
        {title:"Titel", field:"titel", widthGrow: 3, headerFilter:"input", formatter:"html", download:"false", headerSort:"true", sorter: htmlStringSorter}, //add input editor to the name column
        {title:"Datum", field:"datum",  widthGrow: 1, headerFilter:true, hozAlign: "center", headerSort:"true"}, //add header filters to the age column
        {title:"Ort", field:"ort",  widthGrow: 1, headerFilter:true, hozAlign: "center", headerSort:"true"}, //add header filters to the age column
    ],
};
