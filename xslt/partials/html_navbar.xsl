<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    <xsl:variable name="fraktur_title" select="'Armesünderblätter Online'"/>
    <xsl:template match="/" name="nav_bar">
        <xsl:param name="site_top_variant" as="xs:string" select="'button'"/>

        <header class="site-header">
            <div class="container-fluid site-header-inner">
                <button class="site-button site-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#siteMenu" aria-controls="siteMenu" aria-label="Menü öffnen">
                    <i class="bi bi-list" aria-hidden="true"></i>
                </button>
            </div>
        </header>

        <div class="offcanvas offcanvas-start site-offcanvas" tabindex="-1" id="siteMenu" aria-labelledby="siteMenuLabel" data-bs-scroll="true">
            <div class="offcanvas-header">
                <h2 class="offcanvas-title h5" id="siteMenuLabel">
                    <xsl:value-of select="$fraktur_title"/>
                </h2>
                <!-- make the offcanvas close visually match the site burger -->
                <button type="button" class="site-button site-close" data-bs-dismiss="offcanvas" aria-label="Schließen">
                    <i class="bi bi-x" aria-hidden="true"></i>
                </button>
            </div>
            <div class="offcanvas-body">
                <nav class="site-menu" aria-label="Hauptmenü">
                    <div class="site-menu-section">Das Projekt</div>
                    <a class="site-menu-link" href="toc.html">Armersünderblätter</a>
                    <a class="site-menu-link" href="about.html">Über das Projekt</a>
                    <a class="site-menu-link" href="publications.html">Publikationen</a>
                    <a class="site-menu-link" href="citation.html">Zitiervorschlag</a>
                    <a class="site-menu-link" href="team.html">Team</a>

  <div class="site-menu-section">Suche</div>
                    <a class="site-menu-link" href="person_search.html">Personensuche</a>
                    <!-- <a class="site-menu-link" href="search.html">Volltextsuche</a> -->
                    <a class="site-menu-link" href="./nosketch.html?corpname=flugblaetter&amp;q=q%3Cdoc%3E%22.*%22+&amp;viewmode=kwic&amp;attrs=word%2Clemma%2Cpos%2Cvocab%2Cid&amp;format=json&amp;structs=doc%2Chead%2Cp%2Clg%2Cl%2CplaceName%2Cquote%2Cbibl%2CpersName%2Cdate%2Ccit%2Cg&amp;kwicrightctx=45%23&amp;kwicleftctx=45%23&amp;refs=doc.id%2Cl.id%2Cp.id%2CplaceName.id%2CpersName.id%2Cdate.id%2Cdoc.title%2Cdoc.delinquent_sexes%2Cdoc.attrs%2Clg.type&amp;pagesize=10&amp;fromp=1&amp;selectQueryValue=url">Volltextsuche/Linguistische Suche</a>
                    <!-- <a class="site-menu-link" href="goals.html">Ziele</a>
                    <a class="site-menu-link" href="toc.html">Übersicht</a>
                    <a class="site-menu-link" href="punishments.html">Strafen</a> -->

                    <div class="site-menu-section">Info</div>
                    <a class="site-menu-link" href="imprint.html">Impressum</a>
                    <a class="site-menu-link" href="imprint.html">Datenschutzt</a>
                    <!-- <a class="site-menu-link" href="edition.html">Erschließung</a>
                    <a class="site-menu-link" href="usage.html">Nutzung</a>
                    <a class="site-menu-link" href="data.html">Daten</a>

                  

                    <div class="site-menu-section">Über das Projekt</div>
                    
                    <a class="site-menu-link" href="contact.html">Kontakt</a> -->              
                </nav>
            </div>
        </div>
        <!-- <script src="https://use.edgefonts.net/unifrakturmaguntia.js" /> -->

        <section class="site-top" aria-label="Start">
            <div class="container site-top-inner">
                <div class="site-top-grid">
                    <div class="site-top-left">
                        <a class="site-top-title-link" href="index.html" aria-label="Zur Startseite">
                            <div class="site-top-title">
                                <span>ARME</span>
                                <span>SÜNDER</span>
                                <span>BLÄTTER</span>
                            </div>
                        </a>
                    </div>
                    <div class="site-top-right">
                        <xsl:choose>
                            <xsl:when test="$site_top_variant = 'image'">
                                <img class="site-top-image" src="images/vienna.png" alt="Titelbild"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <a class="section-button bgc site-top-project-button" href="about.html">Mehr über das Projekt</a>
                            </xsl:otherwise>
                        </xsl:choose>
                    </div>
                </div>
                <div class="site-top-strip" aria-hidden="true">
                    <a class="site-button site-bottom-button semitrans" href="toc.html" role="button" aria-label="Schnellvorlauf">
                        <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                    </a>
                </div>
            </div>
        </section>
        <!-- script removed: offcanvas toggle behavior reverted -->
    </xsl:template>
</xsl:stylesheet>
