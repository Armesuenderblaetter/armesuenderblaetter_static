<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" version="2.0" exclude-result-prefixes="xsl tei xs local">

    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>


    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
     <xsl:import href="partials/shared.xsl"/>

    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Impressum'"/>


        <html class="h-100" lang="de">

            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>

            <body class="d-flex flex-column h-100 has-site-top page-meta">
                 <xsl:call-template name="nav_bar">
                    <xsl:with-param name="site_top_variant" select="'button'"/>
                    <xsl:with-param name="show_site_top_fastforward" select="true()"/>
                    <xsl:with-param name="site_top_corner_href" select="'index.html'"/>
                    <xsl:with-param name="site_top_corner_icon_class" select="'bi bi-house'"/>
                    <xsl:with-param name="site_top_corner_aria_label" select="'Zur Startseite'"/>
                </xsl:call-template>
                <main class="contents-frame">
                    <a class="sitebutton site-button-bis" href="index.html" role="button" aria-label="Zur Startseite">
                        ZUR STARTSEITE
                    </a>
                    <div class="container body">
                        <xsl:apply-templates select="/*/*"/>
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="*">
        <xsl:element name="{local-name()}" namespace="http://www.w3.org/1999/xhtml">
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="text()">
        <xsl:value-of select="."/>
    </xsl:template>
</xsl:stylesheet>
