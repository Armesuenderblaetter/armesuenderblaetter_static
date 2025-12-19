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
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>
            <body class="d-flex flex-column h-100 landing">
                <header class="landing-header">
                    <div class="container-fluid landing-header-inner">
                        <button class="btn landing-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#landingMenu" aria-controls="landingMenu" aria-label="Menü öffnen">
                            <i class="bi bi-list" aria-hidden="true"></i>
                        </button>
                    </div>
                </header>

                <div class="offcanvas offcanvas-start landing-offcanvas" tabindex="-1" id="landingMenu" aria-labelledby="landingMenuLabel" data-bs-scroll="true">
                    <div class="offcanvas-header">
                        <h2 class="offcanvas-title h5" id="landingMenuLabel">Menü</h2>
                        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Schließen"></button>
                    </div>
                    <div class="offcanvas-body">
                        <nav class="landing-menu" aria-label="Hauptmenü">
                            <div class="landing-menu-section">Edition</div>
                            <a class="landing-menu-link" href="about.html">Armesünderblätter</a>
                            <a class="landing-menu-link" href="goals.html">Ziele</a>
                            <a class="landing-menu-link" href="toc.html">Übersicht</a>
                            <a class="landing-menu-link" href="punishments.html">Strafen</a>

                            <div class="landing-menu-section">Dokumentation</div>
                            <a class="landing-menu-link" href="edition.html">Erschließung</a>
                            <a class="landing-menu-link" href="usage.html">Nutzung</a>
                            <a class="landing-menu-link" href="data.html">Daten</a>

                            <div class="landing-menu-section">Suche</div>
                            <a class="landing-menu-link" href="person_search.html">Personensuche</a>
                            <a class="landing-menu-link" href="search.html">Volltextsuche</a>
                            <a class="landing-menu-link" href="./nosketch.html?corpname=flugblaetter&amp;q=q%3Cdoc%3E%22.*%22+&amp;viewmode=kwic&amp;attrs=word%2Clemma%2Cpos%2Cvocab%2Cid&amp;format=json&amp;structs=doc%2Chead%2Cp%2Clg%2Cl%2CplaceName%2Cquote%2Cbibl%2CpersName%2Cdate%2Ccit%2Cg&amp;kwicrightctx=45%23&amp;kwicleftctx=45%23&amp;refs=doc.id%2Cl.id%2Cp.id%2CplaceName.id%2CpersName.id%2Cdate.id%2Cdoc.title%2Cdoc.delinquent_sexes%2Cdoc.attrs%2Clg.type&amp;pagesize=10&amp;fromp=1&amp;selectQueryValue=url">Linguistische Suche</a>

                            <div class="landing-menu-section">Über das Projekt</div>
                            <a class="landing-menu-link" href="team.html">Team</a>
                            <a class="landing-menu-link" href="contact.html">Kontakt</a>
                            <a class="landing-menu-link" href="publications.html">Publikationen</a>
                            <a class="landing-menu-link" href="imprint.html">Impressum</a>
                        </nav>
                    </div>
                </div>

                <main class="flex-shrink-0 landing-main">
                    <section class="landing-top" aria-label="Start">
                        <div class="container landing-top-inner">
                            <div class="landing-top-grid">
                                <div class="landing-top-left">
                                    <h1 class="landing-top-title">
                                        ARME<br/>
                                        SÜNDER<br/>
                                        BLÄTTER
                                    </h1>
                                </div>
                                <div class="landing-top-right">
                                    <img class="landing-top-image" src="images/vienna.png" alt="Titelbild"/>
                                </div>
                            </div>
                            <div class="landing-top-strip" aria-hidden="true"></div>
                        </div>
                    </section>

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
        <section class="landing-section landing-section--mid landing-section--banner" aria-label="Blätter">
            <div class="container landing-section-inner">
                <div class="landing-thumbs" aria-label="Auswahl an Armesünderblättern">
                    <a class="landing-thumb" href="fb_17000316_HanssGeorgWagner.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17000316_HanssGeorgWagner_a_oenb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Hanß Georg Wagner"/></a>
                    <a class="landing-thumb" href="fb_17240808_FrantzCasparScheff.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17240808_FrantzCasparScheffner_a_wmW.jp2/full/260,/0/default.jpg" alt="Deckblatt: Frantz Caspar Scheffner"/></a>
                    <a class="landing-thumb" href="fb_17350114_AndreN.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350114_AndreN_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Andre N."/></a>
                    <a class="landing-thumb" href="fb_17350128_JohannK.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350128_JohannK_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Johann K."/></a>
                    <a class="landing-thumb" href="fb_17350215_JohannFerdinandH.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350215_JohannFerdinandH_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Johann Ferdinand H."/></a>
                    <a class="landing-thumb" href="fb_17350720_CasparB.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17350720_CasparB_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Caspar B."/></a>
                    <a class="landing-thumb" href="fb_17351006_MathiasH.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17351006_MathiasH_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Mathias H."/></a>
                    <a class="landing-thumb" href="fb_17351123_AnnaClaraE.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17351123_AnnaClaraE_a_wb.jp2/full/260,/0/default.jpg" alt="Deckblatt: Anna Clara E."/></a>
                    <a class="landing-thumb" href="toc.html"><img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/17360103_PaulK_a_wb.jp2/full/260,/0/default.jpg" alt="Weitere Blätter anzeigen"/></a>
                </div>
            </div>
        </section>
    </xsl:template>

    <xsl:template match="tei:div" mode="landing">
        <div>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates select="node()" mode="landing"/>
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
