<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    <xsl:variable name="fraktur_title" select="'Armesünderblätter Online'"/>
    <xsl:template match="/" name="nav_bar">
        <xsl:param name="site_top_variant" as="xs:string" select="'button'"/>
        <xsl:param name="show_site_top" as="xs:boolean" select="true()"/>
        <xsl:param name="show_site_top_fastforward" as="xs:boolean" select="false()"/>
        <xsl:param name="site_top_corner_href" as="xs:string" select="'toc.html'"/>
        <xsl:param name="site_top_corner_icon_class" as="xs:string" select="'bi bi-chevron-double-right'"/>
        <xsl:param name="site_top_corner_aria_label" as="xs:string" select="'Schnellvorlauf'"/>

        <header class="site-header">
            <div class="container-fluid site-header-inner">
                <button class="site-button site-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#siteMenu" aria-controls="siteMenu" aria-label="Menü öffnen">
                    <i class="bi bi-list" aria-hidden="true"></i>
                </button>
            </div>
        </header>

        <div class="offcanvas offcanvas-start site-offcanvas" tabindex="-1" id="siteMenu" aria-labelledby="siteMenuLabel" data-bs-scroll="true">
            <div class="offcanvas-header">
                <!-- <h2 class="offcanvas-title h5" id="siteMenuLabel">
                    <xsl:value-of select="$fraktur_title"/>
                </h2> -->
                <!-- make the offcanvas close visually match the site burger -->
                <button type="button" class="site-button site-close" data-bs-dismiss="offcanvas" aria-label="Schließen">
                    <i class="bi bi-x" aria-hidden="true"></i>
                </button>
            </div>
            <div class="offcanvas-body">
                <nav class="site-menu" aria-label="Hauptmenü">
                    <div class="site-menu-section">Das Projekt</div>
                    <a class="site-menu-link site-menu-link--leaf" href="about.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Armesünderblätter</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="edition.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Edition und Korpus</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="team.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Team</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="publications.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Publikationen</span>
                    </a>

                    <div class="site-menu-section">Edition</div>
                    <a class="site-menu-link site-menu-link--leaf" href="toc.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Übersicht</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="./search.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Suche</span>
                    </a>
                    <!--
                    <div class="site-menu-section">Info</div>
                    <a class="site-menu-link site-menu-link- -leaf" href="imprint.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Impressum</span>
                    </a>
                    <a class="site-menu-link site-menu-link- -leaf" href="imprint.html">
                        <span class="site-menu-bullet" aria-hidden="true">
                            <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                        </span>
                        <span class="site-menu-text">Datenschutzt</span>
                    </a> -->
                </nav>
            </div>
        </div>
        <!-- <script src="https://use.edgefonts.net/unifrakturmaguntia.js" /> -->

        <xsl:if test="$show_site_top">
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
                            <!-- <xsl:choose>
                                <xsl:when test="$site_top_variant = 'image'">
                                    <img class="site-top-image" src="images/vienna.png" alt="Titelbild"/>
                                </xsl:when>
                                <xsl:otherwise>
                                    <a class="section-button bgc site-top-project-button" href="about.html">Mehr über das Projekt</a>
                                </xsl:otherwise>
                            </xsl:choose> -->
                            <img class="site-top-image" src="images/vienna.png" alt="Titelbild"/>
                        </div>
                    </div>
                    
                </div>
                <xsl:choose>
                        <xsl:when test="$site_top_variant = 'image'">
                            <div class="site-top-strip bild" aria-hidden="true">
                                <a class="site-button site-bottom-button semitrans" href="{$site_top_corner_href}" role="button" aria-label="{$site_top_corner_aria_label}">
                                    <i class="{$site_top_corner_icon_class}" aria-hidden="true"></i>
                                </a>
                            </div>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:choose>
                                <xsl:when test="$show_site_top_fastforward">
                                    <div class="site-top-strip meta">
                                        <a class="site-button site-bottom-button semitrans" href="{$site_top_corner_href}" role="button" aria-label="{$site_top_corner_aria_label}">
                                            <i class="{$site_top_corner_icon_class}" aria-hidden="true"></i>
                                        </a>
                                    </div>
                                </xsl:when>
                                <xsl:otherwise>
                                    <div class="site-top-strip hidden" aria-hidden="true" />
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:otherwise>
                    </xsl:choose>
            </section>
        </xsl:if>
        <!-- script removed: offcanvas toggle behavior reverted -->
    </xsl:template>
</xsl:stylesheet>
