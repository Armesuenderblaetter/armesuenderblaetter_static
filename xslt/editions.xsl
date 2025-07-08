<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" version="2.0" exclude-result-prefixes="xsl tei xs local">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    <xsl:import href="./partials/shared.xsl"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="./partials/html_footer.xsl"/>
    <xsl:import href="./partials/aot-options.xsl"/>
    <xsl:import href="./partials/osd-container.xsl"/>
    <xsl:import href="./partials/witness_tabs.xsl"/>
    <xsl:variable name="full_path">
        <xsl:value-of select="document-uri(/)"/>
    </xsl:variable>
    <xsl:variable name="prev">
        <xsl:value-of select="replace(tokenize(data(tei:TEI/@prev), '/')[last()], '.xml', '.html')" />
    </xsl:variable>
    <xsl:variable name="next">
        <xsl:value-of select="replace(tokenize(data(tei:TEI/@next), '/')[last()], '.xml', '.html')" />
    </xsl:variable>
    <xsl:variable name="teiSource">
        <!-- <xsl:value-of select="replace(data(tei:TEI/@xml:id), '.html', '.xml')"/> -->
        <xsl:value-of select="tokenize($full_path, '/')[last()]" />
    </xsl:variable>
    <xsl:variable name="link">
        <xsl:value-of select="replace($teiSource, '.xml', '.html')"/>
    </xsl:variable>
    <xsl:variable name="doc_title">
        <xsl:value-of select=".//tei:titleStmt/tei:title[1]/text()"/>
    </xsl:variable>
    <xsl:template match="tei:figure/tei:figDesc">
        <div class="icon_desc">
            <xsl:value-of select="./text()"/>
        </div>
    </xsl:template>
    <xsl:template match="/">
        <html class="h-100" lang="de">
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
                <main class="flex-shrink-0 container">
                    <div class="row title">
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
                    <div class="edition-content body">
                        <div id="facsimiles" class="col-6">
                            <xsl:call-template name="osd-container"/>
                        </div>
                        <div id="edition-text" class="col-6">
                            <xsl:apply-templates select="//tei:text/tei:*[not(local-name() = 'fs' or local-name() = 'back')]" />
                        </div>
                    </div>
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
