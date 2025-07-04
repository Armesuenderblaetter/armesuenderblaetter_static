<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="xs" version="2.0">
    <xsl:template match="/" name="tabulator_js">
        <xsl:param name="tableconf"/>
        <link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet" />
        <link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator_bootstrap5.min.css" rel="stylesheet" />
        <script type="text/javascript" src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js" />
        <xsl:choose>
            <xsl:when test="$tableconf = 'punishments'">
                <script src="./js/tabulator/punishments.js" />
            </xsl:when>
            <xsl:otherwise>
                <script src="./js/tabulator/toc.js" />
            </xsl:otherwise>
        </xsl:choose>
        <script>
            var table = new Tabulator("#myTable", config);
            //trigger download of data.csv file
            document.getElementById("download-csv").addEventListener("click", function(){
            table.download("csv", "data.csv");
            });

            //trigger download of data.json file
            document.getElementById("download-json").addEventListener("click", function(){
            table.download("json", "data.json");
            });

            //trigger download of data.html file
            document.getElementById("download-html").addEventListener("click", function(){
            table.download("html", "data.html", {style:true});
            });
        </script>
    </xsl:template>
</xsl:stylesheet>