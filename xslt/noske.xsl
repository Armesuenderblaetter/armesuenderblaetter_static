<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:import href="partials/tabulator_js.xsl"/>
    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Textsuche'"/>
        <html class="h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
            </head>
            <body class="d-flex flex-column h-100 has-site-top page-search page-noske-search">
                <main id="searchPage">
                    <div id="searchContainer" class="search-container">
                        <!-- LEFT COLUMN: Search Controls and Help -->
                        <div class="search-col-left">
                            <div class="noske-left-header">
                                <h1 class="noske-title"><xsl:value-of select="$doc_title"/></h1>
                            </div>
                            
                            <div class="noske-left-section">
                                <!-- <h3 class="noske-left-heading">Suche</h3> -->
                                <div id="noske-search">
                                    <div id="custom-noske-input" class="noske-search-div">
                                        <button id="noske-search-button" class="noske-search-button p-2" aria-label="Suche">
                                            <i class="bi bi-search" aria-hidden="true"></i>
                                        </button>
                                        <div class="noske-search-pill">
                                            <input type="search" id="custom-noske-input-input" class="noske-search-input" placeholder="suchen" autocomplete="off" />
                                        </div>
                                        <select id="custom-noske-input-select" class="noske-search-select">
                                            <option value="simple">Textsuche</option>
                                            <option value="cql">CQL</option>
                                        </select>
                                    </div>
                                </div>
                                <div id="custom-noske-stats" class="noske-stats"/>
                            </div>

                            <div class="noske-left-section noske-left-section-inline">
                                <a href="https://flugblaetter-noske.acdh-dev.oeaw.ac.at/crystal/#open" class="noske-crystal-link">Erweiterte Suche (Extern)</a>
                                <span class="noske-left-spacer"></span>
                                <button id="infoBoxBtn" class="noske-info-btn">ⓘ</button>
                            </div>
                            
                            
                            <div class="person-left-tailpiece" aria-hidden="true"></div>
                        </div>
                        
                        <!-- RIGHT COLUMN: Results -->
                        <div class="search-col-right">
                            <xsl:call-template name="nav_bar"/>
                            
                            <!-- Results Area -->
                            <div class="noske-results-area">
                                <div id="custom-noske-hits"/>
                                <div id="custom-noske-pagination" style="display:none;" />
                            </div>

						<div id="pagination" />
                            
                            <div class="search-col-right-strip"></div>
						<button type="button" class="site-button scroll-to-top" id="scrollToTopBtn" aria-label="Nach oben scrollen">
							<i class="bi bi-chevron-double-up" aria-hidden="true"></i>
						</button>
                        </div>
                    </div>
                </main>
                
                <!-- Modal for Help -->
                <div id="infoBox" class="modal noske-modal">
                    <div class="modal-content noske-modal-content">
                        <span class="close">×</span>
                        <div>
                            <h2>Textsuche</h2>
                            <div class="section">
                                <h3>🔹 Wildcard (Platzhalterzeichen)</h3>
                                <ul>
                                    <li>
                                        <code>.</code>, <code>*</code>, <code>?</code>, <code>+</code>
                                    </li>
                                    <li>
                                        Beispiel: <code>.*we.?g.+</code> → <em>wegen</em>, und <em>aufgezwengten</em>, <em>unweigerlich</em>.
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div>
                            <h2>CQL Suche (Corpus Query Language)</h2>
                            <div class="section">
                                <h3>🔹 Grundlegende Syntax</h3>
                                <ul>
                                    <li><code>[Attribut="Wert"]</code></li>
                                    <li>Attribute erlauben Platzhalterzeichen. Mögliche Attribute sind:</li>
                                    <ul>
                                        <li>
                                            <code>pos</code><br/>
                                            <a href="https://www.sketchengine.eu/german-stts-part-of-speech-tagset">German Stuttgart–Tubingen Tagset</a><br/>
                                            Beispiele: <code>ADJA</code>, <code>NN</code>, <code>VMINF</code>, <code>V*</code>, <code>APP?</code>
                                        </li>
                                        <li>
                                            <code>lemma</code><br/>
                                            Formen des gegebenen Lemmas<br/>
                                            Beispiele: <code>gehen</code>, <code>er</code>, <code>Schwert</code>
                                        </li>
                                        <li>
                                            <code>word</code><br/>
                                            Genaues Token<br/>
                                            Beispiele: <code>ging</code>, <code>ihm</code>, <code>Schwerte</code>
                                        </li>
                                    </ul>
                                </ul>
                            </div>
                            <div class="section">
                                <h3>🔹 Logische Operatoren</h3>
                                <ul>
                                    <li>
                                        <code>[Attribut != "Wert"]</code> → Negation<br/>
                                        Treffer für alles außer <code>Wert</code>.<br/>
                                        Beispiel: <code>[lemma!="sein"]</code> → Alles außer <em>sein</em>. Beispielhafte Anwendung in Filtern
                                    </li>
                                    <li>
                                        <code>a|b</code> → Oder / Alternativen<br/>
                                        Treffer für <em>a</em> oder <em>b</em>.<br/>
                                        Beispiel: <code>[lemma="nehmen|gehen"]</code> → <em>genommen</em>, <em>gegangen</em>.
                                    </li>
                                    <li>
                                        <code>a &amp; b</code> → Und / Einschränkungen<br/>
                                        Treffer für *a* and *b*<br/>
                                        Beispiel: <code>[lemma="sein" &amp; pos="P.*"]</code> → Treffer ausschließlich für Formen des Pronomens <em>sein</em>. Formen des Verbs <em>sein</em> sind z.B. ausgeschlossen: <em>seiner</em> aber nicht <em>seye</em>.
                                    </li>
                                </ul>
                            </div>
                            <div class="section">
                                <h3>🔹 Wortfolge</h3>
                                <ul>
                                    <li>
                                        <code>[lemma="sein"] [word="nicht"] [pos="ADJ"]</code> → z. B. <em>ist nicht klug</em>.
                                    </li>
                                    <li>
                                        <code>[lemma="sein"]{2,3}</code> → Zwei bis drei aufeinanderfolgende Formen von <em>sein</em>.<br/>
                                        Beispiel: „...seye seiner..." (Verb <em>sein</em>, Possesivpronomen <em>sein</em>)
                                    </li>
                                </ul>
                            </div>
                            <a href="https://www.sketchengine.eu/documentation/corpus-querying/" alt="Offizielle Webseite von SketchEngine">Weitere Informationen</a>
                        </div>
                    </div>
                </div>
                
                <script type="module" src="js/noske/noske_cfg.js"></script>
                <script type="application/javascript" src="js/modalbox.js"></script>
				<script type="application/javascript" src="js/noske_pagination.js"></script>
                <xsl:call-template name="html_footer"/>
                <xsl:call-template name="tabulator_js">
                    <xsl:with-param name="tableconf" select="'noske'"/>
                </xsl:call-template>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
