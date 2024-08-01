<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" version="2.0" exclude-result-prefixes="xsl tei xs local">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes"
        omit-xml-declaration="yes"/>
    <xsl:import href="./partials/shared.xsl"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="./partials/html_footer.xsl"/>
    <xsl:import href="./partials/aot-options.xsl"/>
    <xsl:import href="./partials/osd-container.xsl"/>
    <xsl:import href="./partials/witness_tabs.xsl"/>
    <xsl:variable name="prev">
        <xsl:value-of select="replace(tokenize(data(tei:TEI/@prev), '/')[last()], '.xml', '.html')"
        />
    </xsl:variable>
    <xsl:variable name="next">
        <xsl:value-of select="replace(tokenize(data(tei:TEI/@next), '/')[last()], '.xml', '.html')"
        />
    </xsl:variable>
    <xsl:variable name="teiSource">
        <xsl:value-of select="data(tei:TEI/@xml:id)"/>
    </xsl:variable>
    <xsl:variable name="link">
        <xsl:value-of select="replace($teiSource, '.xml', '.html')"/>
    </xsl:variable>
    <xsl:variable name="doc_title">
        <xsl:value-of select=".//tei:titleStmt/tei:title[1]/text()"/>
    </xsl:variable>
    <xsl:template match="//tei:figure/tei:figDesc">
        <div class="icon_desc">
            <xsl:value-of select="./text()"/>
        </div>
    </xsl:template>
    <xsl:template match="tei:docImprint">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="/">
        <html class="h-100">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
                <style>
                    .navBarNavDropdown ul li:nth-child(2) {
                        display: none !important;
                    }</style>
            </head>
            <body class="d-flex flex-column h-100">
                <xsl:call-template name="nav_bar"/>
                <main class="flex-shrink-0">
                    <div class="container">
                        <div class="row">
                            <div class="col-md-2 col-lg-2 col-sm-12">
                                <xsl:if test="ends-with($prev, '.html')">
                                    <h1>
                                        <a>
                                            <xsl:attribute name="href">
                                                <xsl:value-of select="$prev"/>
                                            </xsl:attribute>
                                            <i class="bi bi-chevron-left" title="zurück"/>
                                        </a>
                                    </h1>
                                </xsl:if>
                            </div>
                            <div class="col-md-8 col-lg-8 col-sm-12">
                                <h1 align="center">
                                    <xsl:value-of select="$doc_title"/>
                                </h1>
                                <xsl:call-template name="witness_tabs"/>
                                <h3 align="center">
                                    <a href="{$teiSource}">
                                        <i class="bi bi-download" title="TEI/XML"/>
                                    </a>
                                </h3>
                            </div>
                            <div class="col-md-2 col-lg-2 col-sm-12" style="text-align:right">
                                <xsl:if test="ends-with($next, '.html')">
                                    <h1>
                                        <a>
                                            <xsl:attribute name="href">
                                                <xsl:value-of select="$next"/>
                                            </xsl:attribute>
                                            <i class="bi bi-chevron-right" title="weiter"/>
                                        </a>
                                    </h1>
                                </xsl:if>
                            </div>
                            <!-- <div id="editor-widget">
                                <xsl:call-template name="annotation-options"/>
                            </div>-->
                        </div>
                        <div class="edition-content row">
                            <div id="facsimiles" class="col-6">
                                <xsl:call-template name="osd-container"/>
                            </div>
                            <div id="edition-text" class="col-6">
                                <xsl:apply-templates
                                    select="//tei:text/tei:*[not(local-name() = 'fs' or local-name() = 'back')]"
                                />
                            </div>
                        </div>
                        <div class="footnotes">
                            <xsl:for-each select="//tei:note">
                                <div class="footnote" id="{local:makeId(.)}">
                                    <xsl:element name="a">
                                        <xsl:attribute name="name">
                                            <xsl:text>fn</xsl:text>
                                            <xsl:number level="any" format="1" count="tei:note"/>
                                        </xsl:attribute>
                                        <a>
                                            <xsl:attribute name="href">
                                                <xsl:text>#fna_</xsl:text>
                                                <xsl:number level="any" format="1" count="tei:note"
                                                />
                                            </xsl:attribute>
                                            <span
                                                style="font-size:7pt;vertical-align:super; margin-right: 0.4em">
                                                <xsl:number level="any" format="1" count="tei:note"
                                                />
                                            </span>
                                        </a>
                                    </xsl:element>
                                    <!--<xsl:apply-templates select="./tei:rdg" mode="app"/>-->
                                    <xsl:apply-templates/>
                                </div>
                            </xsl:for-each>
                        </div>
                        <xsl:if test="count(//tei:app) != 0">
                            <div class="variants">
                                <xsl:for-each select="//tei:app">
                                    <xsl:variable name="num">
                                        <xsl:number level="any"/>
                                    </xsl:variable>
                                    <xsl:variable name="app_id">
                                        <xsl:value-of select="concat('app_', $num)"/>
                                    </xsl:variable>
                                    <xsl:variable name="var_id">
                                        <xsl:value-of select="concat('var_', $num)"/>
                                    </xsl:variable>
                                    <p class="app" id="{$app_id}">
                                        <a href="#{$var_id}">
                                            <span class="lemma">
                                                <xsl:choose>
                                                  <xsl:when test="./tei:lem">
                                                  <xsl:apply-templates select="./tei:lem" mode="app"
                                                  />
                                                  </xsl:when>
                                                  <xsl:otherwise>
                                                  <xsl:text> ] </xsl:text>
                                                  </xsl:otherwise>
                                                </xsl:choose>
                                            </span>
                                        </a>
                                        <xsl:choose>
                                            <xsl:when test="count(./tei:rdg) = 0">
                                                <xsl:variable name="witname">
                                                  <xsl:value-of
                                                  select="substring-after(./tei:lem/@wit, '#')"/>
                                                </xsl:variable>
                                                <span class="editor_comment">
                                                  <xsl:text>nur in </xsl:text>
                                                  <a href="#witness_overview">
                                                  <xsl:value-of select="$witname"/>
                                                  </a>
                                                </span>
                                            </xsl:when>
                                            <xsl:otherwise>
                                                <xsl:apply-templates select="./tei:rdg" mode="app"/>
                                            </xsl:otherwise>
                                        </xsl:choose>
                                    </p>
                                </xsl:for-each>
                            </div>
                        </xsl:if>
                    </div>
                    <xsl:call-template name="place_fullimages"/>
                    <xsl:for-each select="//tei:back">
                        <div class="tei-back">
                            <xsl:apply-templates/>
                        </div>
                    </xsl:for-each>
                </main>
                <xsl:call-template name="html_footer"/>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js"/>
                <script src="js/osd_scroll.js"/>
                <!--<script src="https://unpkg.com/de-micro-editor@0.3.4/dist/de-editor.min.js"/>-->
                <!-- <script type="text/javascript" src="js/run.js"/> -->
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
