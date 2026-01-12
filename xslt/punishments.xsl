<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">

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

            <body class="d-flex flex-column h-100 has-site-top">
                <xsl:call-template name="nav_bar"/>
                <main class="flex-shrink-0 container">
                    <div class="title">
                        <h1>
                            <xsl:value-of select="$doc_title"/>
                        </h1>
                    </div>
                    <div class="body">
                        <table class="table" id="myTable">
                            <thead>
                                <tr>
                                    <th scope="col">Typ</th>
                                    <th scope="col">Methode</th>
                                    <th scope="col">Datum</th>
                                    <th scope="col">Ort</th>
                                    <th scope="col">Siehe auch</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select=".//tei:event[@type=('punishment', 'execution')]">
                                    <xsl:variable name="id">
                                        <xsl:value-of select="data(@xml:id)"/>
                                    </xsl:variable>
                                    <xsl:variable name="full_path">
                                        <xsl:value-of select="document-uri(/)"/>
                                    </xsl:variable>
                                    <tr>
                                        <!-- Typ -->
                                        <td>
                                            <a>
                                                <xsl:attribute name="id">
                                                    <xsl:value-of select="$id"/>
                                                </xsl:attribute>
                                                <xsl:choose>
                                                    <xsl:when test="data(@type) = 'execution'">Hinrichtung</xsl:when>
                                                    <xsl:when test="data(@type) = 'punishment'">Bestrafung</xsl:when>
                                                    <xsl:otherwise>
                                                        <xsl:value-of select="@type"/>
                                                    </xsl:otherwise>
                                                </xsl:choose>
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
                                        <!-- <td>
                                            <xsl:value-of select="./tei:desc/tei:date/text()"/>
                                        </td> -->
                                        <xsl:variable name="fileName" select="tokenize($id, '/')[last()]" />
                                        <xsl:variable name="dateStr" select="replace($fileName, '.*?(\d{8}).*', '$1')" />
                                        <xsl:variable name="eventDate" select="(
                ./tei:desc/tei:date/@when[normalize-space()],
                concat(
                  substring($dateStr, 1, 4), '-',   (: YYYY :)
                  substring($dateStr, 5, 2), '-',   (: MM :)
                  substring($dateStr, 7, 2)         (: DD :)
                )
              )[1]" />
                                        <td>
                                            <xsl:attribute name="tabulator-data-sort" select="$eventDate" />
                                            <xsl:value-of select="$eventDate" />
                                        </td>
                                        <!-- Ort -->
                                        <td>
                                            <xsl:value-of select="./tei:desc/tei:placeName/text()"/>
                                        </td>
                                        <!-- ID -->
                                        <td>
                                            <xsl:variable name="iiifbase" select="'https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/'" />
                                            <xsl:variable name="iiifpars" select="'/full/260,/0/default.jpg'" />
                                            <xsl:variable name="xmlfile" select="replace($id, '^trial_result_(fb_.*)_[^_]+$', '$1.xml')"/>
                                            <xsl:variable name="iiiffile" select="(document(concat('../data/editions/', $xmlfile))//*:pb/@facs)[1]"/>
                                            <a>
                                                <xsl:attribute name="href">
                                                    <xsl:value-of select="replace($xmlfile, 'xml$', 'html')"/>
                                                </xsl:attribute>
                                                <img>
                                                    <xsl:attribute name="src" select="concat($iiifbase, $iiiffile, $iiifpars)" />
                                                    <xsl:attribute name="alt" select="'Deckblatt/Erste Seite des Armesünderblattes'" />
                                                    <xsl:attribute name="class" select="'thumbnail'" />
                                                </img>
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                        <xsl:call-template name="tabulator_dl_buttons"/>
                        <!-- <xsl:call-template name="tabulator_dl_buttons"/> -->
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
                <!-- <xsl:call-template name="tabulator_js"/> -->
                <!--<link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet"/>
                <link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator_bootstrap5.min.css" rel="stylesheet" />
                <script type="text/javascript" src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js"></script> -->
                <!-- <script type="text/javascript" src="./js/tabulator/punishments.js"></script> -->
                <xsl:call-template name="tabulator_js">
                    <xsl:with-param name="tableconf" select="'punishments'"/>
                </xsl:call-template>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
