<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Übersicht'"/>
        <html class="h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>

            <body class="d-flex flex-column h-100 has-site-top page-search page-person-search">
                <main id="searchPage">
                    <div id="searchContainer" class="search-container">
                        <div class="search-col-left">
                            <div class="person-left-togglebar">
                                <label class="person-view-toggle" for="personViewToggle">
                                    <input type="checkbox" id="personViewToggle" />
                                    <span class="person-view-toggle-text">Detailansicht</span>
                                </label>
                            </div>

                            <!-- Document-level facets -->
                            <div class="person-left-section person-left-section--name">
                                <h3 class="person-left-heading">TITEL</h3>
                                <div class="person-name-search">
                                    <div class="person-name-search-inner">
                                        <div id="searchbox"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Publikationsdatum</h3>
                                <div id="label_date"></div>
                            </div>
                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Archiv</h3>
                                <div id="archives"></div>
                            </div>

                            <!-- Person-level facets -->
                            <div class="person-left-section person-left-section--birth-place">
                                <h3 class="person-left-heading">Personen</h3>
                                <div class="person-name-search">
                                    <div class="person-name-search-inner">
                                        <div class="ais-SearchBox" aria-label="Name filtern">
                                            <form class="ais-SearchBox-form" role="search" onsubmit="return false;">
                                                <input class="ais-SearchBox-input person-facet-filter" id="personNameFilter" type="search" placeholder="Suchen" autocomplete="off" />
                                            </form>
                                        </div>
                                        <button type="button" class="person-view-list-btn" id="personNameListBtn">Als Liste zeigen</button>
                                    </div>
                                </div>
                                <div id="person_names"></div>
                            </div>
                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Geschlecht</h3>
                                <div id="person_sex"></div>
                            </div>
                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Alter</h3>
                                    <div class="person-age-pill" aria-label="Alter filtern">
                                        <div class="person-age-pill-slider">
                                            <div id="decadeAgeSlider"></div>
                                        </div>
                                        <div class="person-age-pill-count" aria-label="Anzahl Treffer">
                                            <span id="decadeAgeCount"></span>
                                        </div>
                                    </div>
                                    <div id="person_decade_age" class="person-age-hidden"></div>
                            </div>
                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Familienstand</h3>
                                <div id="person_marriage_status"></div>
                            </div>
                            <div class="person-left-section person-left-section--birth-place">
                                <h3 class="person-left-heading">Geburtsort</h3>
                                <div class="person-name-search">
                                    <div class="person-name-search-inner">
                                        <div class="ais-SearchBox" aria-label="Geburtsort filtern">
                                            <form class="ais-SearchBox-form" role="search" onsubmit="return false;">
                                                <input class="ais-SearchBox-input person-facet-filter" id="birthPlaceFilter" type="search" placeholder="Suchen" autocomplete="off" />
                                            </form>
                                        </div>
                                        <button type="button" class="person-view-list-btn" id="birthPlaceListBtn">Als Liste zeigen</button>
                                    </div>
                                </div>
                                <div id="person_birth_place"></div>
                            </div>
                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Konfession</h3>
                                <div id="person_faith"></div>
                            </div>
                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Verbrechen</h3>
                                <div id="person_offences"></div>
                            </div>
                            <div class="person-left-section person-left-section--execution-place">
                                <h3 class="person-left-heading">Hinrichtungsort</h3>
                                <div class="person-name-search">
                                    <div class="person-name-search-inner">
                                        <div class="ais-SearchBox" aria-label="Hinrichtungsort filtern">
                                            <form class="ais-SearchBox-form" role="search" onsubmit="return false;">
                                                <input class="ais-SearchBox-input person-facet-filter" id="executionPlaceFilter" type="search" placeholder="Suchen" autocomplete="off" />
                                            </form>
                                        </div>
                                        <button type="button" class="person-view-list-btn" id="executionPlaceListBtn">Als Liste zeigen</button>
                                    </div>
                                </div>
                                <div id="person_execution_places"></div>
                            </div>
                            <div class="person-left-facet">
                                <h3 class="person-left-heading">Hinrichtungsart</h3>
                                <div id="person_execution"></div>
                            </div>
                            <div id="sort-by"></div>
                            <div id="clear-refinements"></div>
                            <div class="person-left-tailpiece" aria-hidden="true"></div>
                        </div>
                        <div class="search-col-right">
                            <xsl:call-template name="nav_bar"/>
                            <div>
                                <div class="d-flex flex-column align-items-center" id="current-refinements"></div>
                            </div>
                            <div id="hits" />
                            <div id="pagination" />
                            <div class="search-col-right-strip" />
                            <button type="button" class="site-button scroll-to-top" id="scrollToTopBtn" aria-label="Nach oben scrollen">
                                <i class="bi bi-chevron-double-up" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>

                </main>



                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7/themes/algolia-min.css"></link>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nouislider@15.7.1/dist/nouislider.min.css"></link>
                <script src="https://cdn.jsdelivr.net/npm/instantsearch.js@4.46.0"></script>
                <script src="https://cdn.jsdelivr.net/npm/nouislider@15.7.1/dist/nouislider.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/typesense-instantsearch-adapter@2/dist/typesense-instantsearch-adapter.min.js"></script>
                <script src="js/document_search.js"></script>
                <xsl:call-template name="html_footer"/>
            </body>

        </html>
    </xsl:template>
</xsl:stylesheet>
