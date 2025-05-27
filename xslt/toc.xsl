<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" version="2.0" exclude-result-prefixes="xsl tei xs local">

    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>


    <xsl:import href="partials/html_navbar.xsl"/>
    <xsl:import href="partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:import href="partials/tabulator_dl_buttons.xsl"/>
    <xsl:import href="partials/tabulator_js.xsl"/>


    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Übersicht'"/>



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
                        <h1>Übersicht</h1>
                        <table class="table" id="myTable">
                            <thead>
                                <tr>
                                    <th scope="col" tabulator-headerFilter="input" tabulator-formatter="html" tabulator-download="false" tabulator-headerSort="false">Titel</th>
                                    <th scope="col" tabulator-data="eventDate" tabulator-headerFilter="input">Datum</th>
                                    <!-- <th scope="col" tabulator-headerFilter="input">Dateiname</th> -->
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select="collection('../data/editions?select=*.xml')[not(matches(document-uri(.), '/fb_'))]//tei:TEI">
                                    <xsl:variable name="full_path">
                                        <xsl:value-of select="document-uri(/)"/>
                                    </xsl:variable>

                                    <tr>
                                        <td>
                                            <a>
                                                <xsl:attribute name="href">
                                                    <xsl:value-of select="replace(tokenize($full_path, '/')[last()], '.xml', '.html')" />
                                                </xsl:attribute>
                                                <xsl:value-of select=".//tei:titleStmt/tei:title[1]/text()"/>
                                            </a>
                                        </td>
                                        <xsl:variable name="eventDate">
                                            <xsl:choose>
                                                <xsl:when test=".//tei:event[@type='execution']/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event[@type='execution']/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:when test=".//tei:event[@type='verdict']/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event[@type='verdict']/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:when test=".//tei:event[@type='offence']/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event[@type='offence']/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:when test=".//tei:event/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:when test=".//tei:date/@when">
                                                    <xsl:value-of select="(.//tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:otherwise>
                                                    <xsl:value-of select="substring(tokenize($full_path, '/')[last()], 1, 4)" />
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </xsl:variable>
                                        <xsl:variable name="rawDate">
                                            <xsl:choose>
                                                <xsl:when test=".//tei:event[@type='execution']/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event[@type='execution']/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:when test=".//tei:event[@type='verdict']/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event[@type='verdict']/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:when test=".//tei:event[@type='offence']/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event[@type='offence']/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:when test=".//tei:event/tei:desc/tei:date/@when">
                                                    <xsl:value-of select="(.//tei:event/tei:desc/tei:date/@when)[1]" />
                                                </xsl:when>
                                                <xsl:otherwise>
                                                    <xsl:value-of select="(.//tei:date/@when)[1]" />
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </xsl:variable>

                                        <xsl:variable name="eventDateSort">
                                            <xsl:choose>
                                                <!-- yyyy -->
                                                <xsl:when test="matches($rawDate, '^\d{4}$')">
                                                    <xsl:value-of select="concat($rawDate, '-01-01')" />
                                                </xsl:when>

                                                <!-- yyyy-mm -->
                                                <xsl:when test="matches($rawDate, '^\d{4}-\d{2}$')">
                                                    <xsl:value-of select="concat($rawDate, '-01')" />
                                                </xsl:when>

                                                <!-- already yyyy-mm-dd -->
                                                <xsl:when test="matches($rawDate, '^\d{4}-\d{2}-\d{2}$')">
                                                    <xsl:value-of select="$rawDate" />
                                                </xsl:when>

                                                <!-- fallback -->
                                                <xsl:otherwise>
                                                    <xsl:text>0000-00-00</xsl:text>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </xsl:variable>
                                        <td>
                                            <xsl:attribute name="tabulator-data-sort">
                                                <xsl:choose>
                                                    <xsl:when test="$eventDateSort">
                                                        <xsl:value-of select="$eventDateSort" />
                                                    </xsl:when>
                                                    <xsl:otherwise>
                                                        1900-01-01
                                                    </xsl:otherwise>
                                                </xsl:choose>
                                            </xsl:attribute>
                                            <xsl:choose>
                                                <xsl:when test="$eventDate">
                                                    <xsl:value-of select="$eventDate" />
                                                </xsl:when>
                                                <xsl:otherwise>
                                                    <xsl:text>k.A.</xsl:text>
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </td>
                                        <!-- <td>
                                            <xsl:value-of select="tokenize($full_path, '/')[last()]" />
                                        </td> -->
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
