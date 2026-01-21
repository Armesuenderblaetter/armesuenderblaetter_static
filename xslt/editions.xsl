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
    <xsl:import href="./partials/person_cards.xsl"/>

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
                <link rel="stylesheet" href="css/micro-editor.css" />
                <link rel="stylesheet" href="css/variant-switcher.css" />
                <link rel="stylesheet" href="css/person-cards.css" />
            </head>
             <body class="d-flex flex-column h-100 has-site-top page-search page-person-search">
                <xsl:call-template name="nav_bar">
                    <xsl:with-param name="show_site_top" select="false()"/>
                </xsl:call-template>
                <main id="searchPage">
                    <div id="searchContainer" class="search-container">
                        <!-- LEFT COLUMN: Person Information -->
                        <div class="search-col-left">
                            <h1 class="edition-title" align="center">
                                <xsl:value-of select="$doc_title"/>
                            </h1>
                            
                            <!-- Person Cards -->
                            <xsl:call-template name="person_cards"/>
                            
                            <!-- Witness Metadata (Archive info) -->
                            <div class="witness-metadata-section">
                                <h4>Quellenangaben</h4>
                                <xsl:call-template name="witness_tabs"/>
                            </div>
                            
                            <!-- XML Link -->
                            <div class="xml-link-section" align="center">
                                <a href="{$teiSource}" class="bgc site-top-project-button xml-tei-link" title="XML/TEI">
                                    <i class="bi bi-filetype-xml" title="XML/TEI"></i> XML/TEI
                                </a>
                            </div>
                            <div class="citation" />
                        </div>
                        
                        <!-- RIGHT COLUMN: Facsimile and Edition Text -->
                        <div class="search-col-right">
                            <!-- Pagination in top right -->
                            <div class="edition-pagination-header">
                                <xsl:call-template name="witness_pagination"/>
                            </div>
                           
                            <!-- Facsimile and Edition Content -->
                            <div class="edition-content row body">

                                <div id="facsimiles" class="col-6">
                                    <xsl:call-template name="osd-container"/>
                                </div>
                                <div id="edition-text" class="col-6">
                                    <xsl:apply-templates select="//tei:text/tei:*[not(local-name() = 'fs' or local-name() = 'back')]" />
                                    <xsl:for-each select="//tei:back">
                                        <div class="tei-back">
                                            <xsl:apply-templates/>
                                        </div>
                                    </xsl:for-each>
                                </div>
                            </div>
                            <xsl:if test="count(//tei:body//tei:note[not(@anchored = 'true')]) != 0">
                                <div class="footnotes">
                                    <xsl:for-each select="//tei:body//tei:note[not(@anchored = 'true')]">
                                        <div class="footnote" id="{local:makeId(.)}">
                                            <xsl:element name="a">
                                                <xsl:attribute name="name">
                                                    <xsl:text>fn</xsl:text>
                                                    <xsl:number level="any" format="1" count="tei:note[not(@anchored = 'true')]" />
                                                </xsl:attribute>
                                                <a>
                                                    <xsl:attribute name="href">
                                                        <xsl:text>#fna_</xsl:text>
                                                        <xsl:number level="any" format="1" count="tei:note[not(@anchored = 'true')]"/>
                                                    </xsl:attribute>
                                                    <span style="font-size:7pt;vertical-align:super; margin-right: 0.4em">
                                                        <xsl:number level="any" format="1" count="tei:note[not(@anchored = 'true')]"/>
                                                    </span>
                                                </a>
                                            </xsl:element>
                                            <!--<xsl:apply-templates select="./tei:rdg" mode="app"/>-->
                                            <xsl:apply-templates/>
                                        </div>
                                    </xsl:for-each>
                                </div>
                            </xsl:if>
                            <xsl:call-template name="place_fullimages"/>       
                            
                            <!-- Back to overview button - bottom right -->
                            <div class="back-to-overview">
                                <span class="back-to-overview-label">ZUR ÜBERSICHT</span>
                                <a href="toc.html" class="site-button back-to-overview-btn" aria-label="Zur Übersicht">
                                    <i class="bi bi-chevron-double-left" aria-hidden="true"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js"/>
                <script type="text/javascript" src="js/osd_scroll.js"/>
                <script type="text/javascript" src="js/witness_switcher.js"/>
                <script src="https://unpkg.com/de-micro-editor@0.3.4/dist/de-editor.min.js"/>
                <script type="text/javascript" src="js/run.js"/>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
