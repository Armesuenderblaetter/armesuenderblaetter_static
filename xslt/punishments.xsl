<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">

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
        <html class="h-100">

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

                        <table class="table" id="offences">
                            <thead>
                                <tr>
                                    <th scope="col" tabulator-headerFilter="input">Typ</th>
                                    <th scope="col" tabulator-headerFilter="input">Methode</th>
                                    <th scope="col" tabulator-headerFilter="input">Datum</th>
                                    <th scope="col" tabulator-headerFilter="input">Ort</th>
                                    <th scope="col" tabulator-headerFilter="input">ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select=".//tei:event[@type=('punishment', 'execution')]">
                                    <xsl:variable name="id">
                                        <xsl:value-of select="data(@xml:id)"/>
                                    </xsl:variable>
                                    <tr>
                                        <!-- Typ -->
                                        <td>
                                            <a>
                                                <xsl:attribute name="id">
                                                    <xsl:value-of select="$id"/>
                                                </xsl:attribute>
                                                <xsl:value-of select="@type"/>
                                            </a>
                                        </td>
                                        <!-- Methode -->
                                        <td>
                                            <ul>
                                                <xsl:choose>
                                                    <xsl:when test="./tei:desc/tei:trait//tei:item">
                                                        <xsl:for-each select="./tei:desc/tei:trait//tei:item">
                                                            <li>
                                                                <xsl:value-of select="text()"/>
                                                            </li>
                                                        </xsl:for-each>
                                                    </xsl:when>
                                                    <xsl:otherwise>
                                                        <xsl:value-of select="./tei:desc/tei:trait/tei:desc/text()|./tei:desc/tei:desc/text()"/>
                                                    </xsl:otherwise>
                                                </xsl:choose>
                                            </ul>
                                        </td>
                                        <!-- Datum -->
                                        <td>
                                            <xsl:value-of select="./tei:desc/tei:date/text()"/>
                                        </td>
                                        <!-- Ort -->
                                        <td>
                                            <xsl:value-of select="./tei:desc/tei:placeName/text()"/>
                                        </td>
                                        <!-- ID -->
                                        <td>
                                            <xsl:value-of select="$id"/>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                        <!-- <xsl:call-template name="tabulator_dl_buttons"/> -->
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
                <!-- <xsl:call-template name="tabulator_js"/> -->
                <link href="https://unpkg.com/tabulator-tables/dist/css/tabulator.min.css" rel="stylesheet"/>
                <script type="text/javascript" src="https://unpkg.com/tabulator-tables/dist/js/tabulator.min.js"></script>
                <script type="text/javascript" src="./js/tabulator/punishments.js"></script>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>