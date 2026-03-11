<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet 
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar"
    version="2.0" exclude-result-prefixes="xsl tei xs local">
    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes" name="xml"/>

    <xsl:variable name="file_path_1">
        <xsl:value-of select="tokenize(tokenize(replace(document-uri(/), '.xml', ''), '/')[last()], '_')[1]"/>
    </xsl:variable>
    <xsl:variable name="file_path_2">
        <xsl:value-of select="tokenize(tokenize(replace(document-uri(/), '.xml', ''), '/')[last()], '_')[2]"/>
    </xsl:variable>
    <xsl:variable name="file_path_3">
        <xsl:value-of select="tokenize(tokenize(replace(document-uri(/), '.xml', ''), '/')[last()], '_')[3]"/>
    </xsl:variable>
    <xsl:variable name="file_path_source">
        <xsl:value-of select="concat($file_path_1, '_', $file_path_2, '_', $file_path_3, '.xml')"/>
    </xsl:variable>
    <xsl:variable name="doc" select="document(concat('../../data/editions/', $file_path_source))//tei:TEI"/>

    <xsl:template match="node()|@*">
        <xsl:copy>
            <xsl:apply-templates select="node()|@*"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="tei:TEI">
        <xsl:copy>
            <xsl:copy-of select="$doc//tei:teiHeader"/>
            <xsl:copy-of select="$doc//tei:standOff"/>
            <xsl:apply-templates />
        </xsl:copy> 
    </xsl:template>

</xsl:stylesheet>