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
    <xsl:template
        match="//text()[following-sibling::*[1][local-name() = 'pc' and normalize-space() != '/' and normalize-space() != '(']]">
        <xsl:value-of select="normalize-space(.)"/>
    </xsl:template>
    <xsl:template
        match="//text()[preceding-sibling::*[1][local-name() = 'pc' and normalize-space() = '(']]">
        <xsl:value-of select="normalize-space(.)"/>
    </xsl:template>
    <xsl:template match="tei:titlePage">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:titlePart">
        <xsl:apply-templates/>
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
                            <div id="editor-widget">
                                <xsl:call-template name="annotation-options"/>
                            </div>
                        </div>
                        <div class="edition-content row">
                            <div id="facsimiles" class="col-6">
                                <xsl:call-template name="osd-container"/>
                            </div>
                            <div id="editon-text" class="col-6">
                                <xsl:apply-templates
                                    select="//tei:text/tei:*[not(local-name() = 'fs' or local-name() = 'back')]"/>
                            </div>
                        </div>
                        <div class="footnotes">
                            <p style="text-align:center;">
                                <xsl:for-each select=".//tei:note[not(./tei:p)]">
                                    <div class="footnotes" id="{local:makeId(.)}">
                                        <xsl:element name="a">
                                            <xsl:attribute name="name">
                                                <xsl:text>fn</xsl:text>
                                                <xsl:number level="any" format="1" count="tei:note"
                                                />
                                            </xsl:attribute>
                                            <a>
                                                <xsl:attribute name="href">
                                                  <xsl:text>#fna_</xsl:text>
                                                  <xsl:number level="any" format="1"
                                                  count="tei:note"/>
                                                </xsl:attribute>
                                                <span
                                                  style="font-size:7pt;vertical-align:super; margin-right: 0.4em">
                                                  <xsl:number level="any" format="1"
                                                  count="tei:note"/>
                                                </span>
                                            </a>
                                        </xsl:element>
                                        <xsl:apply-templates/>
                                    </div>
                                </xsl:for-each>
                            </p>
                        </div>
                        <div class="variants">
                            <xsl:for-each select="//tei:app[count(./tei:rdg) gt 0 and count(./tei:lem) gt 0]">
                                <xsl:variable name="w_id">
                                    <xsl:value-of select="parent::tei:w/@xml:id"/>
                                </xsl:variable>
                                <p class="app" id="app_{$w_id}">
                                    <a href="#{$w_id}">
                                        <span class="lemma">
                                            <xsl:value-of
                                                select="concat(./tei:lem/normalize-space(), '] ')"/>
                                        </span>
                                    </a>
                                    <xsl:for-each select="./tei:rdg">
                                        <span class="variant">
                                            <xsl:variable name="witness_name">
                                                <xsl:value-of select="substring-after(@wit, '#')"/>
                                            </xsl:variable>
                                            <xsl:message>
                                                <xsl:value-of select="$witness_name"/></xsl:message>
                                            <xsl:variable name="image_name">
                                                <xsl:value-of select=".//preceding::tei:pb[@edRef=concat('#', $witness_name)][1]/@facs"/>
                                            </xsl:variable>
                                            <a href="#witness_overview">
                                                <xsl:value-of select="$witness_name"/>
                                            </a><xsl:text>:</xsl:text>
                                            <a href="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$image_name}/full/max/0/default.jpg"><xsl:value-of select=".//text()"/></a>
                                        </span>
                                    </xsl:for-each>
                                </p>
                            </xsl:for-each>
                        </div>
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
                <script src="https://unpkg.com/de-micro-editor@0.3.4/dist/de-editor.min.js"/>
                <script type="text/javascript" src="js/run.js"/>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
