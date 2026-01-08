<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" version="2.0" exclude-result-prefixes="xsl tei xs local">

    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>

    <xsl:param name="showBanner" select="'showBanner'"/>


    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_footer.xsl"/>

    <xsl:template match="/">
        <xsl:variable name="doc_title">
            <xsl:value-of select='"Armesünderblätter Online"'/>
        </xsl:variable>
        <xsl:variable name="landing_meta" select="doc('../data/meta/index.xml')" as="document-node()"/>
        <xsl:variable name="landing_divs" as="element(tei:div)*">
            <xsl:choose>
                <xsl:when test="exists($landing_meta//tei:text/tei:body/tei:div)">
                    <xsl:sequence select="$landing_meta//tei:text/tei:body/tei:div"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:sequence select=".//tei:text/tei:body/tei:div"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <html class="h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
            </head>
            <body class="d-flex flex-column h-100 landing has-site-top">
                <xsl:call-template name="nav_bar">
                    <xsl:with-param name="site_top_variant" select="'image'"/>
                </xsl:call-template>

                <main class="flex-shrink-0 landing-main">
                    <xsl:for-each select="$landing_divs">
                        <section class="landing-section landing-section--light">
                            <div class="container landing-section-inner">
                                <div class="landing-section-text">
                                    <xsl:apply-templates select="." mode="landing"/>
                                </div>
                            </div>
                        </section>

                        <xsl:if test="position() lt last()">
                            <xsl:call-template name="landing_carousel"/>
                        </xsl:if>
                    </xsl:for-each>
                </main>

                <xsl:call-template name="html_footer"/>
            </body>
        </html>
    </xsl:template>

    <xsl:template name="landing_carousel">
        <section class="landing-section landing-section--banner">
            <div class="container landing-section-inner">
                <div class="landing-thumbs landing-thumbs--carousel" aria-label="Armesünderblätter Vorschau">
                    <div class="landing-thumbs-viewport">
                        <div class="landing-thumbs-strip">
                            <a class="landing-thumb" href="fb_17000316_HanssGeorgWagner.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17000316_HanssGeorgWagner_a_oenb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Hanß Georg Wagner"/></a>
                            <a class="landing-thumb" href="fb_17240808_FrantzCasparScheff.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17240808_FrantzCasparScheffner_a_wmW.jp2/full/260,/0/default.jpg" alt="Deckblatt: Frantz Caspar Scheffner"/></a>
                            <a class="landing-thumb" href="fb_17350114_AndreN.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350114_AndreN_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Andre N."/></a>
                            <a class="landing-thumb" href="fb_17350128_JohannK.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350128_JohannK_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Johann K."/></a>
                            <a class="landing-thumb" href="fb_17350215_JohannFerdinandH.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350215_JohannFerdinandH_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Johann Ferdinand H."/></a>
                            <a class="landing-thumb" href="fb_17350720_CasparB.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350720_CasparB_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Caspar B."/></a>

<a class="landing-thumb" href="fb_17351006_MathiasH.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17351006_MathiasH_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Mathias H."/></a>
                            <a class="landing-thumb" href="fb_17351123_AnnaClaraE.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17351123_AnnaClaraE_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Anna Clara E."/></a>
                            <a class="landing-thumb" href="fb_17360103_PaulK.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17360103_PaulK_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Paul K."/></a>
                             <a class="landing-thumb" href="fb_17580818_CatharinaO.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17580818_CatharinaO_a_oenb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Catharina O."/></a>
                            <a class="landing-thumb" href="fb_17520707_JohannGeorgH.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17520707_JohannGeorgH_a_oenb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Johann Georg H."/></a>


                            <div class="landing-thumb landing-thumb--cta" role="group" aria-label="Armesünderblätter ansehen">
                                <div class="landing-thumbs-cta-title"><span>ARME</span><span>SÜNDER</span><span>BLÄTTER</span></div>
                                <a class="landing-thumbs-cta-button" href="toc.html">Ansehen</a>
                            </div>
                            <!--
                            <a class="landing-thumb" href="fb_17850228_Hora_Kloczka.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17850228_Hora-Kloczka_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Hora-Kloczka"/></a>
                            <a class="landing-thumb" href="fb_17741110_KarlL.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17741110_KarlL_a_wb1.jp2/full/260,/0/default.jpg" alt="Deckblatt: Karl L."/></a>
                            <a class="landing-thumb" href="fb_17571022_NiclasSt.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17571022_NiclasSt_a_oenb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Niclas St."/></a>
                            <a class="landing-thumb" href="fb_17720917_LeopoldS.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17720917_LeopoldS_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Leopold S."/></a>-->
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </xsl:template>

    <xsl:template match="tei:div" mode="landing">
        <div>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates select="node()" mode="landing"/>
            <xsl:if test="@type = 'contents' and not(preceding-sibling::tei:div[@type = 'contents'])">
                <div class="landing-cta">
                    <a class="site-top-project-button" href="about.html">Mehr über das Projekt</a>
                </div>
            </xsl:if>
        </div>
    </xsl:template>

    <xsl:template match="tei:h2" mode="landing">
        <h2>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates mode="landing"/>
        </h2>
    </xsl:template>

    <xsl:template match="tei:p" mode="landing">
        <p>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates mode="landing"/>
        </p>
    </xsl:template>

    <xsl:template match="tei:ref" mode="landing">
        <a>
            <xsl:attribute name="href">
                <xsl:value-of select="@target"/>
            </xsl:attribute>
            <xsl:copy-of select="@*[not(local-name() = 'target')]"/>
            <xsl:if test="not(@class)">
                <xsl:attribute name="class">landing-button</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates mode="landing"/>
        </a>
    </xsl:template>
    <xsl:template match="tei:div//tei:head">
        <h2 id="{generate-id()}">
            <xsl:apply-templates/>
        </h2>
    </xsl:template>

    <xsl:template match="tei:p">
        <p id="{generate-id()}">
            <xsl:apply-templates/>
        </p>
    </xsl:template>

    <xsl:template match="tei:list">
        <ul id="{generate-id()}">
            <xsl:apply-templates/>
        </ul>
    </xsl:template>

    <xsl:template match="tei:item">
        <li id="{generate-id()}">
            <xsl:apply-templates/>
        </li>
    </xsl:template>
    <xsl:template match="tei:ref">
        <xsl:choose>
            <xsl:when test="starts-with(data(@target), 'http')">
                <a>
                    <xsl:attribute name="href">
                        <xsl:value-of select="@target"/>
                    </xsl:attribute>
                    <xsl:value-of select="."/>
                </a>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>