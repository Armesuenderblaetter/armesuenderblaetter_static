<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">

    <xsl:template name="primary-wit">
        <xsl:for-each select="//tei:witness[@type='primary']">
            <xsl:variable name="p_wit_id">
                <xsl:value-of select="@xml:id"/>
            </xsl:variable>
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="{$p_wit_id}-tab" data-bs-toggle="tab" data-bs-target="#{$p_wit_id}-meta-data" type="button" role="tab" aria-controls="{$p_wit_id}-aria" aria-selected="true">
                Textzeuge <xsl:value-of select="$p_wit_id"/>
                </button>
            </li>

        </xsl:for-each>
    </xsl:template>
    <xsl:template name="secondary-wit">
        <xsl:for-each select="//tei:witness[@type='secondary']">
            <xsl:variable name="s_wit_id">
                <xsl:value-of select="@xml:id"/>
            </xsl:variable>
            <xsl:if test="$s_wit_id != ''">
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="{$s_wit_id}-tab" data-bs-toggle="tab" data-bs-target="#{$s_wit_id}-meta-data" type="button" role="tab" aria-controls="{$s_wit_id}-aria" aria-selected="false">
                Textzeuge <xsl:value-of select="$s_wit_id"/>
                    </button>
                </li>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    <xsl:template match="tei:listWit" name="witness_tabs">
        <ul class="nav nav-tabs" role="tablist">
            <xsl:call-template name="primary-wit"/>
            <xsl:call-template name="secondary-wit"/>
        </ul>
        <div class="tab-content">
            <xsl:for-each select="//tei:witness">
                <xsl:variable name="wit_id">
                    <xsl:value-of select="@xml:id"/>
                </xsl:variable>
                <div id="{$wit_id}-meta-data" role="tabpanel" aria-labelledby="#{$wit_id}-tab">
                    <xsl:attribute name="class">
                        <xsl:value-of select="'tab-pane fade'"/>
                    </xsl:attribute>
                    <xsl:if test="@type='primary'">
                        <xsl:attribute name="class">
                            <xsl:value-of select="'tab-pane fade show active'"/>
                        </xsl:attribute>
                    </xsl:if>
                    <table>
                        <tbody>
                            <tr>
                                <td>Publikationsort:</td>
                                <td>
                                    <xsl:value-of select=".//tei:pubPlace/text()"/>
                                </td>
                            </tr>
                            <tr>
                                <td>Drucker:</td>
                                <td>
                                    <xsl:value-of select=".//tei:publisher/text()"/>
                                </td>
                            </tr>
                            <tr>
                                <td>Archiv:</td>
                                <td>
                                    <xsl:value-of select=".//tei:msDesc//tei:institution/text()"/>
                                    <xsl:value-of select="concat(' (', .//tei:msDesc//tei:idno/text(), ')')"/>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <xsl:if test="@type='secondary'">
                        <xsl:for-each select="//tei:pb[@edRef=concat('#', $wit_id)]">
                            <xsl:variable name="facs">
                                <xsl:value-of select="@facs"/>
                            </xsl:variable>
                            <a href="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$facs}/full/max/0/default.jpg">
                                <img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$facs}/full/260,/0/default.jpg" alt="Seite des Flugblatts" style="height: 9rem; width: auto;" />
                            </a>
                            <!-- <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal_{$facs}">
                                <img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$facs}/full/260,/0/default.jpg" alt="Seite des Flugblatts" style="height: 9rem; width: auto;" />
                            </button>
                            <div class="modal fade" id="modal_{$facs}" tabindex="-1" role="dialog" aria-labelledby="modal_{$facs}_title" aria-hidden="true">
                                <div class="modal-dialog" role="document">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="modal_{$facs}_title">test</h5>
                                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true"></span>
                                            </button>
                                        </div>
                                        <div class="modal-body">
                                            <img src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$facs}/full/max/0/default.jpg" alt="Seite des Flugblatts" style="height: 40rem; width: auto;" />
                                        </div>
                                    </div>
                                </div>
                            </div> -->
                        </xsl:for-each>
                    </xsl:if>
                </div>
            </xsl:for-each>
        </div>
        <!-- Button trigger modal -->
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModalCenter">
    Launch demo modal
        </button>

        <!-- Modal -->
        <div class="modal fade" id="exampleModalCenter" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLongTitle">Modal title</h5>
                    </div>
                    <div class="modal-body">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </xsl:template>

</xsl:stylesheet>