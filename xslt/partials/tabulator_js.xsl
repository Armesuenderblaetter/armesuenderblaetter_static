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
                <script type="text/javascript" src="./js/tabulator/punishments.js" />
            </xsl:when>
            <xsl:when test="$tableconf = 'noske'">
                <script type="text/javascript" src="./js/tabulator/noske.js" />
            </xsl:when>
            <xsl:otherwise>
                <script type="text/javascript" src="./js/tabulator/toc.js" />
            </xsl:otherwise>
        </xsl:choose>
        <script  type="text/javascript" src="js/tabulator/basic.js" />
    </xsl:template>
</xsl:stylesheet>
