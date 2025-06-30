var config = {
    //height: 800,
    layout: "fitColumns",
    tooltips: true,
    dataLoader: true,
    columns:[
        {title:"Titel", field:"titel", headerFilter:"input", formatter:"html", download:"false", editor:"input", headerSort:"true"}, //add input editor to the name column
        {title:"Datum", field:"datum", data:"eventDate", headerFilter:true, width: 300, hozAlign: "center", headerSort:"true"}, //add header filters to the age column
    ],
};
