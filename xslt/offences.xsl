<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"
    version="2.0" exclude-result-prefixes="xsl tei xs">
    
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    
    
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="./partials/html_footer.xsl"/>
    <xsl:import href="partials/tabulator_dl_buttons.xsl"/>
    <xsl:import href="partials/tabulator_js.xsl"/>
    <xsl:import href="./partials/person.xsl"/>

    <xsl:template match="/">
        <xsl:variable name="doc_title">
            <xsl:value-of select=".//tei:titleStmt/tei:title[1]/text()"/>
        </xsl:variable>
        <html class="h-100" lang="de">
            
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>
            
            <body class="d-flex flex-column h-100">
                <xsl:call-template name="nav_bar"/>

                <main>
                    <div class="container">

                        <h1>
                            <xsl:value-of select="$doc_title"/>
                        </h1>

                        <table class="table" id="offences" tabulator-sorter="Datum">
                            <thead>
                                <tr>
                                    <th scope="col" tabulator-headerFilter="input">Beschreibung</th>
                                    <th scope="col" tabulator-headerFilter="input">Datum</th>
                                    <th scope="col" tabulator-headerFilter="input">Ort</th>
                                    <th scope="col" tabulator-headerFilter="input">ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select=".//tei:event[contains(@type, 'ffenc')]">
                                    <xsl:variable name="id">
                                        <xsl:value-of select="data(@xml:id)"/>
                                    </xsl:variable>
                                    <tr>
                                        <td>
                                            <a>
                                                <xsl:attribute name="id">
                                                    <xsl:value-of select="$id"/>
                                                </xsl:attribute>
                                                <xsl:choose>
                                                    <xsl:when test="./tei:desc/tei:desc">
                                                        <xsl:value-of select="normalize-space(./tei:desc/tei:desc/text())"/> 
                                                    </xsl:when>
                                                    <xsl:otherwise>
                                                        <xsl:value-of select="normalize-space(./tei:desc/tei:list/item[1]/text())"/>
                                                    </xsl:otherwise>
                                                </xsl:choose>
                                            </a>
                                        </td>
                                        <td>
                                            <xsl:value-of select="./tei:desc/tei:date/text()"/>
                                        </td>
                                        <td>
                                            <xsl:value-of select="./tei:desc/tei:placeName/text()"/>
                                        </td>
                                        <td>
                                            <xsl:value-of select="$id"/>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                        <xsl:call-template name="tabulator_dl_buttons"/>
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
                <xsl:call-template name="tabulator_js"/>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
