<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" exclude-result-prefixes="#all" version="2.0">
    <xsl:param name="showBanner" select="''"/>
    <xsl:template match="/" name="html_footer">
        <footer class="footer mt-auto py-3 bg-body-tertiary">
            <div class="wrapper" id="wrapper-footer-full">
                <div class="container" id="footer-full-content" tabindex="-1">
                    <div class="row">
                        <div class="col-3 text-left">
                            <div class="footer-1">
                                LP – LITERATURWISSENSCHAFT &amp; PRINTKULTURFORSCHUNG<br/>
                            </div>
                            <div class="footer-2">Bäckerstraße 13<br/>
                            1010 Wien
                            </div>
                            <!-- <div class="footer-3"><div>T: +43 1 51581-2223</div><div>
                                E: <a href="mailto:ace@oeaw.ac.at">ace@oeaw.ac.at</a></div>
                            </div> -->
                        </div>
                          <div class="col-3 logo" style="padding-right: 0px">
                                <!-- <a href="http://www.oeaw.ac.at/oesterreichische-akademie-der-wissenschaften/">
                                <img src="images/logo_oeaw.svg" width="120" alt="Austrian Corpora and Editions" title="Austrian Corpora and Editions"/>
                            </a>
                            <div class="footer-2">Austrian Corpora and Editions</div> -->
                        </div>
                         <div class="col-3 logo" style="padding-right: 0px">
                                <a href="https://www.oeaw.ac.at/acdh">
                            <img src="images/logo_acdh.svg" width="90" alt="Austrian Centre for Digital Humanities" title="Austrian Centre for Digital Humanities"/>
                            </a>
                             <div class="footer-2">Austrian Centre for Digital Humanities</div>
                        </div>
                        <div class="col-3 logo">
                         <a href="http://www.oeaw.ac.at/oesterreichische-akademie-der-wissenschaften/">
                                <img src="images/logo_oeaw.png" width="120" alt="Österreichische Akademie der Wissenschaften" title="Österreichische Akademie der Wissenschaften"/>
                            </a>
                            <div class="footer-2">Österreichische Akademie der Wissenschaften</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-imprint-bar hide-reading" id="wrapper-footer-secondary" style="text-align:center; padding:0.4rem 0; font-size: x-small;"> © 2026 ÖAW | <a href="imprint.html">Impressum</a> |                <a href="{$github_url}">
                    <i class="bi bi-github" title="GitHub" alt="GitHub" aria-hidden="true" />
                    <span class="visually-hidden">GitHub</span>
                </a>
            </div>
        </footer>
        <script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/openseadragon@4.1/build/openseadragon/openseadragon.min.js"></script>
        <script><![CDATA[
            (function(){
                function setCTAWidth(){
                    try{
                        var $first = document.querySelector('.landing-thumbs.landing-thumbs--carousel .landing-thumb:not(.landing-thumb--cta)');
                        var $ctas = document.querySelectorAll('.landing-thumb--cta');
                        if(!$first || !$ctas.length) return;
                        var w = $first.getBoundingClientRect().width;
                        $ctas.forEach(function(el){ el.style.width = w + 'px'; el.style.flex = '0 0 ' + w + 'px'; });
                    }catch(e){ if(window && window.console) window.console.error(e); }
                }

                function setCarouselMaxTranslate(){
                    try{
                        var $carousels = document.querySelectorAll('.landing-thumbs.landing-thumbs--carousel');
                        if(!$carousels || !$carousels.length) return;
                        $carousels.forEach(function($carousel){
                            var $viewport = $carousel.querySelector('.landing-thumbs-viewport');
                            var $strip = $carousel.querySelector('.landing-thumbs-strip');
                            if(!$viewport || !$strip) return;
                            var maxShift = Math.max(0, $strip.scrollWidth - $viewport.clientWidth);
                            $strip.style.setProperty('--landing-carousel-max-translate', (-1 * maxShift) + 'px');
                        });
                    }catch(e){ if(window && window.console) window.console.error(e); }
                }
                var resizeTimer;
                document.addEventListener('DOMContentLoaded', function(){
                    setCTAWidth();
                    setCarouselMaxTranslate();
                    // images might load after DOMContentLoaded
                    window.setTimeout(setCTAWidth, 250);
                    window.setTimeout(setCarouselMaxTranslate, 250);
                });
                window.addEventListener('resize', function(){
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function(){
                        setCTAWidth();
                        setCarouselMaxTranslate();
                    }, 150);
                });
                // also update when images in the carousel finish loading
                document.addEventListener('load', function(e){
                    if(e.target && e.target.closest && e.target.closest('.landing-thumbs-viewport')){
                        setCTAWidth();
                        setCarouselMaxTranslate();
                    }
                }, true);
            })();
        ]]></script>
    </xsl:template>
</xsl:stylesheet>
