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

    <xsl:param name="site_bottom_corner_toc_href" as="xs:string" select="'toc.html'"/>
    <xsl:param name="site_bottom_corner_toc_icon_class" as="xs:string" select="'bi bi-chevron-double-right'"/>
    <xsl:param name="site_bottom_corner_toc_aria_label" as="xs:string" select="'Zur Edition'"/>
    <xsl:param name="site_bottom_corner_home_href" as="xs:string" select="'index.html'"/>
    <xsl:param name="site_bottom_corner_home_icon_class" as="xs:string" select="'bi bi-house'"/>
    <xsl:param name="site_bottom_corner_home_aria_label" as="xs:string" select="'Zur Startseite'"/>


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
        <!-- Ordered witnesses: primary-typed first, then the rest in document order -->
        <xsl:variable name="ordered_witnesses" as="element(tei:witness)*"
            select="(
                //tei:witness[lower-case(normalize-space(@type)) = 'primary'],
                //tei:witness[not(lower-case(normalize-space(@type)) = 'primary')]
            )"/>
        <xsl:variable name="base_name" select="replace($teiSource, '\.xml$', '')"/>
        <xsl:variable name="witness_count" select="count($ordered_witnesses)"/>

        <!-- Generate one HTML page per witness -->
        <xsl:for-each select="$ordered_witnesses">
            <xsl:variable name="wit_pos" select="position()"/>
            <xsl:variable name="wit_id" select="string(@xml:id)"/>

            <xsl:result-document href="{concat($base_name, '_', $wit_pos, '.html')}">
                <!-- Switch context back to document root -->
                <xsl:for-each select="/">
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
                            <link rel="stylesheet" href="css/toc.css" />
                            <link rel="stylesheet" href="css/person-cards.css" />
                            <link rel="stylesheet" href="css/edition.css" />
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

                                        <!-- Witness Metadata (Archive info) -->
                                        <div class="witness-metadata-section">
                                            <xsl:call-template name="witness_tabs">
                                                <xsl:with-param name="current_witness_id" select="$wit_id"/>
                                                <xsl:with-param name="base_name" select="$base_name"/>
                                            </xsl:call-template>
                                        </div>

                                        <!-- Person Cards -->
                                        <xsl:call-template name="person_cards"/>

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
                                            <xsl:call-template name="witness_pagination">
                                                <xsl:with-param name="current_witness_id" select="$wit_id"/>
                                            </xsl:call-template>
                                        </div>

                                        <!-- Facsimile and Edition Content -->
                                        <div class="edition-content row body">

                                            <div id="facsimiles" class="col-6">
                                                <xsl:call-template name="osd-container"/>
                                            </div>
                                            <div id="edition-text" class="col-6">
                                                <div class="edition-text-inner">
                                                    <xsl:apply-templates select="//tei:text/tei:*[not(local-name() = 'fs' or local-name() = 'back')]">
                                                        <xsl:with-param name="current_witness_id" select="$wit_id" tunnel="yes"/>
                                                    </xsl:apply-templates>
                                                    <xsl:for-each select="//tei:back">
                                                        <div class="tei-back">
                                                            <xsl:apply-templates>
                                                                <xsl:with-param name="current_witness_id" select="$wit_id" tunnel="yes"/>
                                                            </xsl:apply-templates>
                                                        </div>
                                                    </xsl:for-each>
                                                </div>
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
                                                        <xsl:apply-templates>
                                                            <xsl:with-param name="current_witness_id" select="$wit_id" tunnel="yes"/>
                                                        </xsl:apply-templates>
                                                    </div>
                                                </xsl:for-each>
                                            </div>
                                        </xsl:if>
                                        <xsl:call-template name="place_fullimages">
                                            <xsl:with-param name="current_witness_id" select="$wit_id"/>
                                        </xsl:call-template>

                                        <!-- Back to overview button - bottom right -->
                                        <div class="nav-buttons">
                                            <a class="square-button bottom-button  ais-Pagination-item" href="{$site_bottom_corner_toc_href}" role="button" aria-label="{$site_bottom_corner_toc_aria_label}" alt="{$site_bottom_corner_home_aria_label}">
                                                <i class="{$site_bottom_corner_toc_icon_class}" aria-hidden="true"></i>
                                            </a>
                                            <a class="square-button bottom-button  ais-Pagination-item" href="{$site_bottom_corner_home_href}" role="button" aria-label="{$site_bottom_corner_home_aria_label}" alt="{$site_bottom_corner_home_aria_label}">
                                                <i class="{$site_bottom_corner_home_icon_class}" aria-hidden="true"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </main>
                            <xsl:call-template name="html_footer"/>
                            <script src="js/openseadragon/openseadragon.min.js"/>
                            <script type="text/javascript" src="js/osd_scroll.js"/>
                            <script type="text/javascript" src="js/witness_preserve_pag.js"/>
                            <script src="https://unpkg.com/de-micro-editor@0.3.4/dist/de-editor.min.js"/>
                            <script type="text/javascript" src="js/run.js"/>
                        </body>
                    </html>
                </xsl:for-each>
            </xsl:result-document>
        </xsl:for-each>

              <!-- Default Ant output: redirect to witness 1 page -->
        <html lang="de">
            <head>
                <meta http-equiv="refresh" content="0;url={concat($base_name, '_1.html')}"/>
                <title><xsl:value-of select="$doc_title"/></title>
            </head> 
            <body/>
        </html> 
    </xsl:template>
</xsl:stylesheet>
