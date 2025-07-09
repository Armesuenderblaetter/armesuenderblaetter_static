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
        <xsl:variable name="doc_title" select="'Linguistische Suche'"/>
        <html class="h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
            </head>
            <body class="d-flex flex-column h-100">
                <xsl:call-template name="nav_bar"/>
                <main id="searchPage" class="flex-shrink-0 container">
                    <div class="title">
                        <h1>
                            <xsl:value-of select="$doc_title"/>
                        </h1>
                    </div>
                    <div class="body">
                        <div>
                            <a href="https://flugblaetter-noske.acdh-dev.oeaw.ac.at/crystal/#open">Erweiterte Suche in Crystal</a>
                        </div>
                        <div id="noske-search">
                            <div id="custom-noske-input"></div>
                        </div>
                        <button id="infoBoxBtn">Info</button>
                        <div id="infoBox" class="modal">
                            <!-- Modal content -->
                            <div class="modal-content">
                                <span class="close">×</span>
                                <div>
                                    <h2>Einfache Suche</h2>
                                    <div class="section">
                                        <h3>🔹 Wildcard (Platzhalterzeichen)</h3>
                                        <ul>
                                            <li>
                                                <code>.</code>,                                                <code>*</code>,                                                <code>?</code>,                                                <code>+</code>
                                            </li>
                                            <li>
                                            Beispiel: <code>.*we.?g.+</code>  →                                                <em>wegen</em>, und <em>aufgezwengten</em>,                                                <em>unweigerlich</em>.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div>
                                    <h2>CQL Suche (Corpus Query Language)</h2>
                                    <div class="section">
                                        <h3> 🔹 Grundlegende Syntax</h3>
                                        <ul>
                                            <li>
                                                <code>[Attribut="Wert"]</code>
                                            </li>
                                            <li>Attribute erlauben Platzhalterzeichen. Mögliche Attribute sind:</li>
                                            <ul>
                                                <li>
                                                    <code>pos</code>
                                                    <br/>
                                                    <a href="https://www.sketchengine.eu/german-stts-part-of-speech-tagset">German Stuttgart–Tubingen Tagset</a>
                                                    <br/>
                                                Beispiele: <code>ADJA</code>,                                                    <code>NN</code>,                                                    <code>VMINF</code>,                                                    <code>V*</code>,                                                    <code>APP?</code>
                                                </li>
                                                <li>
                                                    <code>lemma</code>
                                                    <br/>
                                                Formen des gegebenen Lemmas
                                                    <br/>
                                                    <br/>
                                                Beispiele: <code>gehen</code>,                                                    <code>er</code>,                                                    <code>Schwert</code>
                                                </li>
                                                <li>
                                                    <code>word</code>
                                                    <br/>
                                                Genaues Token
                                                    <br/>
                                                Beispiele: <code>ging</code>,                                                    <code>ihm</code>,                                                    <code>Schwerte</code>
                                                </li>
                                            </ul>
                                        </ul>
                                    </div>
                                    <div class="section">
                                        <h3>🔹 Logische Operatoren  </h3>
                                        <ul>
                                            <li>
                                                <code>[Attribut != "Wert"]</code> → Negation<br/>
                                                Treffer für alles außer <code>Wert</code>.
                                            <br/>
                                                Beispiel: <code>[lemma!="sein"]</code> → Alles außer <em>sein</em>. Beispielhafte Anwendung in Filtern
                                        </li>
                                        <li>
                                            <code>a|b</code> → Oder / Alternativen<br/>
                                                Treffer für <em>a</em> oder <em>b</em>.
                                        <br/>
                                                Beispiel: <code>[lemma="nehmen|gehen"]</code>  →                                        <em>genommen</em>,                                        <em>gegangen</em>.
                                    </li>
                                    <li>
                                        <code>a &amp; b</code>  → Und / Einschränkungen<br/>
                                                Treffer für *a* and *b*<br/>
                                                Beispiel: <code>[lemma="sein" &amp; pos="P.*"]</code>  →  Treffer ausschließlich für Formen des Pronomens <em>sein</em>. Formen des Verbs <em>sein</em> sind z.B. ausgeschlossen:  <em>seiner</em> aber nicht <em>seye</em>.
                            </li>
                        </ul>
                    </div>
                    <div class="section">
                        <h3>🔹 Wortfolge</h3>
                        <ul>
                            <li>
                                <code>[lemma="sein"] [word="nicht"] [pos="ADJ"]</code> → z. B. <em>ist nicht klug</em>.
                            </li>
                            <li>
                                <code>[lemma="sein"]{2,3}</code> → Zwei bis drei aufeinanderfolgende Formen von <em>sein</em>.
                                <br/>
                                                Beispiel: „...seye seiner...“ (Verb <em>sein</em>, Possesivpronomen <em>sein</em>)
                            </li>
                        </ul>
                    </div>
                    <a href="https://www.sketchengine.eu/documentation/corpus-querying/" alt="Offizielle Webseite von SketchEngine">Weitere Informationen</a>
                </div>
            </div>
        </div>
        <div>
            <div id="custom-noske-hits"/>
             <div id="custom-noske-pagination"/>
            <div id="custom-noske-stats" />
        </div>
    </div>
</main>
<script type="application/javascript" src="js/noske/noske_cfg.js"></script>
<script type="application/javascript" src="js/modalbox.js"></script>
<xsl:call-template name="html_footer"/>
<xsl:call-template name="tabulator_js">
    <xsl:with-param name="tableconf" select="'noske'"/>
</xsl:call-template>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
