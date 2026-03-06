<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">

    <!--
        Compatibility wrapper:
        `nosketch.html` is produced from the Noske search page stylesheet.
        The project historically used `noske.xsl`; some builds/tools reference `nosketch.xsl`.
    -->

    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>

    <xsl:import href="./noske.xsl"/>

</xsl:stylesheet>
