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



        <html class="h-100" lang="de">

            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>

            <body class="d-flex flex-column h-100">
                <xsl:call-template name="nav_bar"/>
                <main class="container flex-shrink-0">
                    <div class="title">
                        <h1>Übersicht</h1>
                    </div>
                    <div class="body">
                        <table class="table" id="myTable">
                            <thead>
                                <tr>
                                    <th scope="col">Titel</th>
                                    <th scope="col">Datum</th>
                                    <!-- <th scope="col" tabulator-headerFilter="input">Dateiname</th> -->
                                </tr>
                            </thead>
                           <tbody>
                                <!-- <xsl:for-each select="collection('../data/editions?select=*.xml')[not(matches(document-uri(.), '/fb_'))]//tei:TEI"> -->
                                <xsl:for-each select="collection('../data/editions?select=*.xml')[matches(document-uri(.), '/fb_')]//tei:TEI">
                                    <xsl:sort select="
        let $filename := tokenize(document-uri(/), '/')[last()]
        return
            replace($filename,
                '^fb_(\d{4})$', 'fb_$1-01-01')
            => replace('^fb_(\d{4})(\d{2})$', 'fb_$1-$2-01')
            => replace('^fb_(\d{4})(\d{2})(\d{2}).*$', 'fb_$1-$2-$3')
    " data-type="text" order="ascending" />
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
                                        <xsl:variable name="alt_path" select="replace($full_path, '/fb_([^/]+)$', '/$1')" />
                                        <xsl:variable name="eventDate" select="substring(tokenize($alt_path, '/')[last()], 1, 4)" />
                                        <xsl:variable name="rawDate" select="substring(tokenize($alt_path, '/')[last()], 1, 4)" />
                                        <xsl:variable name="filename" select="tokenize($full_path, '/')[last()]" />
                                        <xsl:variable name="ymd" select="replace($filename, '^fb_(\d{4})(\d{2})(\d{2}).*$', '$1-$2-$3')" />
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
                                                        <xsl:value-of select="$ymd" />
                                                    </xsl:when>
                                                    <xsl:otherwise>
                                                        <xsl:value-of select="$eventDateSort" />
                                                    </xsl:otherwise>
                                                </xsl:choose>
                                            </xsl:attribute>
                                            <xsl:choose>
                                                <xsl:when test="$ymd">
                                                    <xsl:choose>
                                                        <xsl:when test="matches($ymd, '^\d{4}-00-00$')">
                                                            <xsl:value-of select="substring($ymd, 1, 4)" />
                                                        </xsl:when>
                                                        <xsl:otherwise>
                                                            <xsl:value-of select="$ymd" />
                                                        </xsl:otherwise>
                                                    </xsl:choose>
                                                </xsl:when>
                                                <xsl:otherwise>
                                                    <xsl:value-of select="$eventDate" />
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
                <xsl:call-template name="tabulator_js">
                    <xsl:with-param name="tableconf" select="'toc'"/>
                </xsl:call-template>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
