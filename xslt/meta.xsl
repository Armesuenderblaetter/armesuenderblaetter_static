<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">

    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>


    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:import href="partials/shared.xsl"/>

    <xsl:template match="/">
        <xsl:variable name="doc_title">
            <xsl:value-of select=".//tei:title[@type='main'][1]/text()"/>
        </xsl:variable>

        <!-- Keep the site-top header consistent across meta pages (no image strip) -->

        <html class="h-100" lang="de">

            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>

            <body class="page-meta">
                <xsl:call-template name="nav_bar">
                    <xsl:with-param name="site_top_variant" select="'button'"/>
                    <xsl:with-param name="show_site_top_fastforward" select="true()"/>
                </xsl:call-template>

                <main class="meta">
                    <div class="contents">
                        <a class="sitebutton square-button-nebentext" href="toc.html" role="button" aria-label="Zum Inhaltsverzeichnis">
                            ZUR EDITION
                        </a>
                        <div class="container-inner">
                            <xsl:apply-templates select=".//tei:body"/>
                        </div>
                    </div>
                </main>

                <xsl:call-template name="html_footer"/>
            </body>
        </html>
    </xsl:template>

    <!-- <xsl:template match="tei:p">
        <p id="{generate-id()}"><xsl:apply-templates/></p>
    </xsl:template> -->
  

    <xsl:template match="tei:section">
        <div class="section">
        <xsl:apply-templates/>
        </div>
    </xsl:template>

    <xsl:template match="tei:head" mode="#all">
        <h2>
            <xsl:apply-templates/>
        </h2>
    </xsl:template>

    <xsl:template match="tei:h2" mode="#all">
        <h2>
            <xsl:apply-templates/>
        </h2>
    </xsl:template>

    <xsl:template match="tei:h3" mode="#all">
        <h3>
            <xsl:apply-templates/>
        </h3>
    </xsl:template>

    <xsl:template match="tei:h4" mode="#all">
        <h4>
            <xsl:apply-templates/>
        </h4>
    </xsl:template>
    <xsl:template match="tei:lb">
        <br/>
    </xsl:template>
    <xsl:template match="tei:unclear">
        <abbr title="unclear">
            <xsl:apply-templates/>
        </abbr>
    </xsl:template>
    <xsl:template match="tei:del">
        <del>
            <xsl:apply-templates/>
        </del>
    </xsl:template>
</xsl:stylesheet>
