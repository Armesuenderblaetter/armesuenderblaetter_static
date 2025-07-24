var config = {
    //height: 800,
    layout: "fitDataStretch",
    responsiveLayout: false,
    tooltips: true,
    dataLoader: true,
    columns:[
        {title:"Titel", field:"titel", widthGrow: 3, headerFilter:"input", formatter:"html", download:"false", editor:"input", headerSort:"true"}, //add input editor to the name column
        {title:"Datum", field:"datum",  widthGrow: 1, headerFilter:true, hozAlign: "center", headerSort:"true"}, //add header filters to the age column
    ],
};
