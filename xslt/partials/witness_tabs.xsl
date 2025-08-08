<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    <xsl:template name="primary-wit">
        <xsl:for-each select="//tei:witness[@type = 'primary']">
            <xsl:variable name="p_wit_id">
                <xsl:value-of select="@xml:id"/>
            </xsl:variable>
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="{$p_wit_id}-tab" data-bs-toggle="tab"
                    data-bs-target="#{$p_wit_id}-meta-data" type="button" role="tab"
                    aria-controls="{$p_wit_id}-aria" aria-selected="true"> Textzeuge <xsl:value-of
                        select="$p_wit_id"/>
                </button>
            </li>
        </xsl:for-each>
    </xsl:template>
    <xsl:template name="secondary-wit">
        <xsl:for-each select="//tei:witness[@type = 'secondary']">
            <xsl:variable name="s_wit_id">
                <xsl:value-of select="@xml:id"/>
            </xsl:variable>
            <xsl:if test="$s_wit_id != ''">
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="{$s_wit_id}-tab" data-bs-toggle="tab"
                        data-bs-target="#{$s_wit_id}-meta-data" type="button" role="tab"
                        aria-controls="{$s_wit_id}-aria" aria-selected="false"> Textzeuge
                            <xsl:value-of select="$s_wit_id"/>
                    </button>
                </li>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    <xsl:template match="tei:listWit" name="witness_tabs">
        <ul class="nav nav-tabs" id="witness_overview" role="tablist">
            <xsl:call-template name="primary-wit"/>
            <xsl:call-template name="secondary-wit"/>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="person_overview-tab" data-bs-toggle="tab"
                    data-bs-target="#person_overview-tab-meta-data" type="button" role="tab"
                    aria-controls="person_overview-tab-aria" aria-selected="false">
                    <xsl:text>Personen</xsl:text>
                </button>
            </li>
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
                    <xsl:if test="@type = 'primary'">
                        <xsl:attribute name="class">
                            <xsl:value-of select="'tab-pane fade show active'"/>
                        </xsl:attribute>
                    </xsl:if>
                    <table>
                        <tbody>
                            <tr>
                                <td>Publikationsort: </td>
                                <td>
                                    <xsl:value-of select=".//tei:pubPlace/text()"/>
                                </td>
                            </tr>
                            <tr>
                                <td>Drucker: </td>
                                <td>
                                    <xsl:value-of select=".//tei:publisher/text()"/>
                                </td>
                            </tr>
                            <tr>
                                <td>Archiv: </td>
                                <td>
                                    <xsl:value-of select=".//tei:msDesc//tei:institution/text()"/>
                                    <xsl:value-of
                                        select="concat(' (', .//tei:msDesc//tei:idno/text(), ')')"/>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <!-- <xsl:if test="@type = 'secondary'">
                        <xsl:for-each select="//tei:pb[@edRef = concat('#', $wit_id)]">
                            <xsl:variable name="facs">
                                <xsl:value-of select="@facs"/>
                            </xsl:variable>
                            <xsl:variable name="facs_id">
                                <xsl:value-of select="substring-before(@facs, '.')"/>
                            </xsl:variable>
                            <span data-bs-toggle="modal" data-bs-target="#full_{$facs_id}"
                                class="image_preview">
                                <img
                                    src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$facs}/full/260,/0/default.jpg"
                                    alt="Seite des Flugblatts"/>
                            </span>
                        </xsl:for-each>
                    </xsl:if> -->
                </div>
            </xsl:for-each>
            <div id="person_overview-tab-meta-data" role="tabpanel" aria-labelledby="#person_overview-tab">
                <xsl:attribute name="class">
                    <xsl:value-of select="'tab-pane fade'"/>
                </xsl:attribute>
               <xsl:call-template name="build_persons_overview"/>
            </div>
        </div>
    </xsl:template>
    <xsl:template name="build_persons_overview">
        <div class="person_overview">
            <ul class="person_overview">
                <xsl:for-each select="//tei:back/tei:listPerson/tei:person">
                    <li>
                        <a class="personview">
                            <xsl:attribute name="href">
                                <xsl:value-of select="concat(@xml:id, '.html')"/>
                            </xsl:attribute>
                            <span>
                                <xsl:choose>
                                    <xsl:when test="@role = 'delinquent'">
                                        <xsl:value-of
                                            select="concat(.//tei:persName/tei:forename, ' ', .//tei:persName/tei:surname, ' (DelinquentIn)')"
                                        />
                                    </xsl:when>
                                    <xsl:otherwise>
                                        <xsl:value-of
                                            select="concat(.//tei:persName/tei:forename, ' ', .//tei:persName/tei:surname)"
                                        />
                                    </xsl:otherwise>
                                </xsl:choose>
                            </span>
                        </a>
                    </li>
                </xsl:for-each>
            </ul>
        </div>
    </xsl:template>
    <xsl:template name="place_fullimages">
        <xsl:for-each select="//tei:pb[@type = 'secondary']">
            <xsl:variable name="facs_id">
                <xsl:value-of select="substring-before(@facs, '.')"/>
            </xsl:variable>
            <xsl:variable name="facs">
                <xsl:value-of select="@facs"/>
            </xsl:variable>
            <div class="modal fade" id="full_{$facs_id}" data-bs-keyboard="false" tabindex="-1"
                aria-labelledby="" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-body">
                            <img
                                src="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$facs}/full/max/0/default.jpg"
                                alt="Seite des Flugblatts"/>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
                                >Schließen</button>
                        </div>
                    </div>
                </div>
            </div>
        </xsl:for-each>
    </xsl:template>
</xsl:stylesheet>
