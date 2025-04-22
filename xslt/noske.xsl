<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Korpus-Suche'"/>
        <html class="h-100">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
            </head>
            <body class="d-flex flex-column h-100">
                <xsl:call-template name="nav_bar"/>
                <div id="searchPage">
                    <h1>
                        <xsl:value-of select="$doc_title"/>
                    </h1>
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
                            <h2>CQL Suche (Corpus Query Language)</h2>
                            <div class="section">
                                <h3> 🔹 Grundlegende Syntax</h3>
                                <ul>
                                    <li>
                                        <code>[pos="NN"]</code>
                                        <br/>
→ Findet Substantive.  
                                        <br/>
                                        <em>Beispiel: „Todesurteil“, „Weibsperson“, „Religion“</em>
                                    </li>

                                    <li>
                                        <code>[lemma="gehen"]</code>
                                        <br/>
→ Findet alle Formen von *gehen*.  
                                        <br/>
                                        <em>(Flektierte Formen des gegebenen Stammworts)</em>
                                    </li>
                                </ul>
                            </div>

                            <div class="section">
                                <h3>🔹 Kombinationen</h3>
                                <ul>
                                    <li>
                                        <code>[lemma="sein"] [word="nicht"] [pos="ADJ"]</code>
                                        <br/>
→ z. B. *ist nicht klug*  
                                        <br/>
                                        <em>(Analog zu: „[...] nicht nur Geld, sondern auch [...]“)</em>
                                    </li>

                                    <li>
                                        <code>[lemma="sein"]{2,3}</code>
                                        <br/>
→ Zwei bis drei aufeinanderfolgende Formen von *sein*.  
                                        <br/>
                                        <em>Beispiel: „...seye seiner...“ (Verb *sein*, Possesivpronomen *sein*)</em>
                                    </li>
                                </ul>
                            </div>

                            <div class="section">
                                <h3>🔹 Oder / Alternativen</h3>
                                <ul>
                                    <li>
                                        <code>[lemma="nehmen|geben"]</code>
                                        <br/>
→ Treffer für *nehmen* oder *geben*.  
                                        <br/>
                                        <em>Beispiel: *genommen* (von *nehmen*)</em>
                                    </li>
                                </ul>
                            </div>

                            <div class="section">
                                <h3>🔹 Und / Einschränkungen</h3>
                                <ul>
                                    <li>
                                        <code>[lemma="sein" &amp; pos="P.*"]</code>
                                        <br/>→ Treffer ausschließlich für Formen des Pronomens *sein*. (Formen des Verbs *sein* sind z.B. ausgeschlossen) 
                                        <br/>
                                        <em>Beispiel: *seiner*, aber nicht *seye*</em>
                                    </li>
                                </ul>
                            </div>
                             

                            <div class="section">
                                <h3>🔹 Negation</h3>
                                <ul>
                                    <li>
                                        <code>[lemma!="sein"]</code>
                                        <br/>
→ Alles außer *sein*.  
                                        <br/>
                                        <em>Beispielhafte Anwendung in Filtern</em>
                                    </li>
                                </ul>
                            </div>
                            <div class="section">
                                <h3>🔹 Wildcard (Platzhalter)</h3>
                                <ul>
                                    <li>
                                        <code>[word="*urteil"]</code>
                                        <br/>
→ Wörter, die auf *urteil* enden.  
                                        <br/>
                                        <em>Beispiel: *Todesurteil*</em>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div>
                            <div id="custom-noske-hits"/>
                            <div id="custom-noske-pagination"/>
                            <div id="custom-noske-stats" />
                        </div>
                    </div>
                </div>
                <script type="module" src="js/noske/noske_cfg.js"></script>
                <script type="module" src="js/modalbox.js"></script>
                <xsl:call-template name="html_footer"/>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
