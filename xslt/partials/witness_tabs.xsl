<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    
    <!-- Template for witness pagination - used in right column header -->
    <xsl:template name="witness_pagination">
        <xsl:variable name="witness_count" select="count(//tei:witness)"/>
        <div class="witness-pagination-container">
            <xsl:if test="$witness_count &gt;= 2">
                <ul class="nav nav-tabs nav-tabs-sm" id="witness_pagination_tabs" role="tablist">
                    <xsl:call-template name="primary-wit-pagination"/>
                    <xsl:call-template name="secondary-wit-pagination"/>
                </ul>
            </xsl:if>
            <div class="tab-content">
                <xsl:for-each select="//tei:witness">
                    <xsl:variable name="wit_id" select="@xml:id"/>
                    <div id="{$wit_id}-pagination" role="tabpanel" aria-labelledby="#{$wit_id}-pagination-tab">
                        <xsl:choose>
                            <xsl:when test="$witness_count &gt;= 2">
                                <xsl:attribute name="class">
                                    <xsl:value-of select="'tab-pane fade'"/>
                                </xsl:attribute>
                                <xsl:if test="@type = 'primary'">
                                    <xsl:attribute name="class">
                                        <xsl:value-of select="'tab-pane fade show active'"/>
                                    </xsl:attribute>
                                </xsl:if>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:attribute name="class">
                                    <xsl:value-of select="'show'"/>
                                </xsl:attribute>
                            </xsl:otherwise>
                        </xsl:choose>
                        
                        <div class="witness-pages">
                            <nav class="witness-pagination ais-Pagination" aria-label="Seitennavigation">
                                <ul class="page-links ais-Pagination-list">
                                    <!-- Pagination items are injected dynamically by witness_switcher.js -->
                                </ul>
                            </nav>
                        </div>
                    </div>
                </xsl:for-each>
            </div>
        </div>
    </xsl:template>
    
    <xsl:template name="primary-wit-pagination">
        <xsl:for-each select="//tei:witness[@type = 'primary']">
            <xsl:variable name="p_wit_id" select="@xml:id"/>
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="{$p_wit_id}-pagination-tab" data-bs-toggle="tab"
                    data-bs-target="#{$p_wit_id}-pagination" type="button" role="tab"
                    aria-controls="{$p_wit_id}-pagination-aria" aria-selected="true">
                    <xsl:value-of select="$p_wit_id"/>
                </button>
            </li>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template name="secondary-wit-pagination">
        <xsl:for-each select="//tei:witness[@type = 'secondary']">
            <xsl:variable name="s_wit_id" select="@xml:id"/>
            <xsl:if test="$s_wit_id != ''">
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="{$s_wit_id}-pagination-tab" data-bs-toggle="tab"
                        data-bs-target="#{$s_wit_id}-pagination" type="button" role="tab"
                        aria-controls="{$s_wit_id}-pagination-aria" aria-selected="false">
                        <xsl:value-of select="$s_wit_id"/>
                    </button>
                </li>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    
    <!-- Original witness_tabs template - kept for backward compatibility -->
    <xsl:template name="primary-wit">
        <xsl:for-each select="//tei:witness[@type = 'primary']">
            <xsl:variable name="p_wit_id">
                <xsl:value-of select="@xml:id"/>
            </xsl:variable>
            <li class="nav-item" role="presentation">
                <button class="nav-link active bgc site-top-project-button" id="{$p_wit_id}-tab" data-bs-toggle="tab"
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
                    <button class="nav-link bgc site-top-project-button" id="{$s_wit_id}-tab" data-bs-toggle="tab"
                        data-bs-target="#{$s_wit_id}-meta-data" type="button" role="tab"
                        aria-controls="{$s_wit_id}-aria" aria-selected="false"> Textzeuge
                            <xsl:value-of select="$s_wit_id"/>
                    </button>
                </li>
            </xsl:if>
        </xsl:for-each>
    </xsl:template>
    
    <xsl:template match="tei:listWit" name="witness_tabs">
        <xsl:variable name="witness_count" select="count(//tei:witness)"/>
        <xsl:if test="$witness_count &gt;= 2">
            <ul class="nav nav-tabs" id="witness_overview" role="tablist">
                <xsl:call-template name="primary-wit"/>
                <xsl:call-template name="secondary-wit"/>
            </ul>
        </xsl:if>
        <div class="tab-content">
        
            <div class="person-card-header">
                <span class="person-badge">QUELLENANGABEN</span>
            </div>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7/themes/algolia-min.css" />
            <xsl:for-each select="//tei:witness">
                <xsl:variable name="wit_id">
                    <xsl:value-of select="@xml:id"/>
                </xsl:variable>
                <div id="{$wit_id}-meta-data" role="tabpanel" aria-labelledby="#{$wit_id}-tab">
                    <xsl:choose>
                        <xsl:when test="$witness_count &gt;= 2">
                            <xsl:attribute name="class">
                                <xsl:value-of select="'tab-pane fade'"/>
                            </xsl:attribute>
                            <xsl:if test="@type = 'primary'">
                                <xsl:attribute name="class">
                                    <xsl:value-of select="'tab-pane fade show active'"/>
                                </xsl:attribute>
                            </xsl:if>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="class">
                                <xsl:value-of select="'show'"/>
                            </xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                    <table class="person-info-table witness-info-table">
                        <tbody>
                            <tr>
                                <td class="info-label">Jahr:</td>
                                <td class="info-value">
                                    <xsl:variable name="date_when" select="string((.//tei:date[@when][1]/@when)[1])"/>
                                    <xsl:variable name="date_text" select="normalize-space(string((.//tei:date[1])[1]))"/>
                                    <xsl:variable name="doc_xml_id" select="string((root(.)/*[1]/@xml:id)[1])"/>
                                    <xsl:variable name="presumed" select="if (matches($doc_xml_id, '^fb_\d{4}')) then replace($doc_xml_id, '^fb_(\d{4}).*$', '$1') else ''"/>
                                    <xsl:choose>
                                        <xsl:when test="$date_when != ''">
                                            <xsl:value-of select="substring($date_when, 1, 4)"/>
                                        </xsl:when>
                                        <xsl:when test="$date_text != '' and not(matches(lower-case($date_text), '^k\.\s*a\.?$'))">
                                            <xsl:value-of select="$date_text"/>
                                        </xsl:when>
                                        <xsl:otherwise>
                                            <xsl:choose>
                                                <xsl:when test="$presumed != ''">
                                                    <xsl:value-of select="concat('[', $presumed, ']')"/>
                                                </xsl:when>
                                                <xsl:otherwise>k. A.</xsl:otherwise>
                                            </xsl:choose>
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </td>
                            </tr>
                            <tr>
                                <td class="info-label">Ort:</td>
                                <td class="info-value"><xsl:value-of select=".//tei:pubPlace/text()"/></td>
                            </tr>
                            <tr>
                                <td class="info-label">Drucker:</td>
                                <td class="info-value"><xsl:value-of select="(.//tei:publisher/text())[1]"/></td>
                            </tr>
                            <tr>
                                <td class="info-label">Archiv:</td>
                                <td class="info-value">
                                    <xsl:value-of select=".//tei:msDesc//tei:institution/text()"/>
                                    <xsl:value-of select="concat(' (', .//tei:msDesc//tei:idno/text(), ')')"/>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <!-- Pagination removed - now in right column header via witness_pagination template -->
                </div>
            </xsl:for-each>
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
