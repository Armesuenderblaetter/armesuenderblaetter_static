<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" exclude-result-prefixes="#all" version="2.0">
    <xsl:param name="showBanner" select="''"/>
    <xsl:template match="/" name="html_footer">
        <footer class="footer mt-auto py-3 bg-body-tertiary">
            <div>
                <xsl:attribute name="class">
                    <xsl:text>row banner </xsl:text>
                    <xsl:value-of select="$showBanner"/>
                </xsl:attribute>
            </div>
            <div class="wrapper" id="wrapper-footer-full">
                <div class="container" id="footer-full-content" tabindex="-1">
                    <div class="footer-separator">
                        <span class="texts">KONTAKT</span>
                        <hr/>
                    </div>
                    <div class="row">
                        <div class="col-md-2 col-12 text-left">
                            <div class="row">
                                <div class="col-md-12 col-6" style="margin-bottom: 2em;">
                                    <a href="https://www.oeaw.ac.at/acdh">
                                        <img src="images/logo_acdh.png" width="60" alt="Austrian Centre for Digital Humanities" title="Austrian Centre for Digital Humanities"/>
                                    </a>
                                </div>
                                <!-- <div class="col-md-0 col-6" /> -->
                            </div>
                        </div>
                        <div class="col-md-8 col-12 texts">
                            <p>
                           ACDH – ÖAW<xsl:value-of disable-output-escaping="yes">&lt;br /&gt;</xsl:value-of>
                           Austrian Centre for Digital Humanities<xsl:value-of disable-output-escaping="yes">&lt;br /&gt;</xsl:value-of>
                           Österreichische Akademie der Wissenschaften
                            </p>
                            <p>
                           Bäckerstraße 13, 1010 Wien
                            </p>
                            <p class="link-in-footer">
                                <i class="bi bi-telephone" aria-hidden="true"/>
                                <span class="visually-hidden">Telefon</span>&#160;<a href="tel:+431515812200">+43 1 51581-2200</a>
                                <xsl:value-of disable-output-escaping="yes">&lt;br /&gt;</xsl:value-of>
                                <i class="bi bi-envelope-at" aria-hidden="true" />
                                <span class="visually-hidden">E-Mail</span>&#160;<a href="mailto:acdh-ch-helpdesk@oeaw.ac.at">acdh-ch-helpdesk@oeaw.ac.at</a>
                            </p>
                        </div>
                        <div class="col-md-2 col-12 text-right">
                             <div class="col-md-12 col-6 mobile-align-right" style="padding-left:auto;">
                                    <a href="http://www.oeaw.ac.at/oesterreichische-akademie-der-wissenschaften/">
                                        <img src="images/logo_oeaw.png" width="80" alt="Österreichische Akademie der Wissenschaften" title="Österreichische Akademie der Wissenschaften"/>
                                    </a>
                                </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-imprint-bar hide-reading" id="wrapper-footer-secondary" style="text-align:center; padding:0.4rem 0; font-size: 0.9rem;"> © 2025 ÖAW | <a href="imprint.html">Impressum</a> |                <a href="{$github_url}">
                    <i class="bi bi-github" title="GitHub" alt="GitHub" aria-hidden="true" />
                    <span class="visually-hidden">GitHub</span>
                </a>
            </div>
        </footer>
        <script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/openseadragon@4.1/build/openseadragon/openseadragon.min.js"></script>
    </xsl:template>
</xsl:stylesheet>