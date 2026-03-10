<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    
    <!-- Template for witness pagination - used in right column header -->
    <xsl:template name="witness_pagination">
        <xsl:param name="current_witness_id" select="''"/>
        <xsl:variable name="witness_count" select="count(//tei:witness)"/>
        <!-- Ordered witnesses: primary-typed first, then the rest in document order -->
        <xsl:variable name="ordered_witnesses" as="element(tei:witness)*"
            select="(
                //tei:witness[lower-case(normalize-space(@type)) = 'primary'],
                //tei:witness[not(lower-case(normalize-space(@type)) = 'primary')]
            )"/>
        <xsl:choose>
            <!-- Per-witness mode: single witness pagination (no tabs) -->
            <xsl:when test="$current_witness_id != ''">
                <div class="witness-pagination-container">
                    <div class="tab-content">
                        <div id="single-pagination" role="tabpanel" class="show">
                            <div class="witness-pages">
                                <nav class="witness-pagination ais-Pagination" aria-label="Seitennavigation">
                                    <ul class="page-links ais-Pagination-list">
                                        <!-- Pagination items are injected dynamically by osd_scroll.js -->
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </xsl:when>
            <xsl:when test="$witness_count &gt;= 2">
                <div class="witness-pagination-container">
                    <ul class="nav nav-tabs nav-tabs-sm" id="witness_pagination_tabs" role="tablist">
                        <xsl:for-each select="$ordered_witnesses">
                            <xsl:variable name="wit_pos" select="position()"/>
                            <xsl:variable name="wit_label">
                                <xsl:choose>
                                    <xsl:when test="$wit_pos = 1">primary</xsl:when>
                                    <xsl:when test="$wit_pos = 2">secondary</xsl:when>
                                    <xsl:when test="$wit_pos = 3">tertiary</xsl:when>
                                    <xsl:when test="$wit_pos = 4">quaternary</xsl:when>
                                    <xsl:otherwise><xsl:value-of select="concat('witness-', $wit_pos)"/></xsl:otherwise>
                                </xsl:choose>
                            </xsl:variable>
                            <li class="nav-item" role="presentation">
                                <button type="button" role="tab"
                                    id="wit-{$wit_label}-pagination-tab"
                                    data-bs-toggle="tab"
                                    data-bs-target="#wit-{$wit_label}-pagination"
                                    aria-controls="wit-{$wit_label}-pagination-aria">
                                    <xsl:attribute name="class">
                                        <xsl:choose>
                                            <xsl:when test="$wit_pos = 1">nav-link active</xsl:when>
                                            <xsl:otherwise>nav-link</xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:attribute>
                                    <xsl:attribute name="aria-selected">
                                        <xsl:choose>
                                            <xsl:when test="$wit_pos = 1">true</xsl:when>
                                            <xsl:otherwise>false</xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:attribute>
                                    <xsl:text>Textzeuge </xsl:text><xsl:value-of select="$wit_pos"/>
                                </button>
                            </li>
                        </xsl:for-each>
                    </ul>
                    <div class="tab-content">
                        <xsl:for-each select="$ordered_witnesses">
                            <xsl:variable name="wit_pos" select="position()"/>
                            <xsl:variable name="wit_label">
                                <xsl:choose>
                                    <xsl:when test="$wit_pos = 1">primary</xsl:when>
                                    <xsl:when test="$wit_pos = 2">secondary</xsl:when>
                                    <xsl:when test="$wit_pos = 3">tertiary</xsl:when>
                                    <xsl:when test="$wit_pos = 4">quaternary</xsl:when>
                                    <xsl:otherwise><xsl:value-of select="concat('witness-', $wit_pos)"/></xsl:otherwise>
                                </xsl:choose>
                            </xsl:variable>
                            <div id="wit-{$wit_label}-pagination" role="tabpanel" aria-labelledby="#wit-{$wit_label}-pagination-tab" data-witness="{$wit_label}">
                                <xsl:attribute name="class">
                                    <xsl:choose>
                                        <xsl:when test="$wit_pos = 1">tab-pane fade show active</xsl:when>
                                        <xsl:otherwise>tab-pane fade</xsl:otherwise>
                                    </xsl:choose>
                                </xsl:attribute>
                                
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
            </xsl:when>
            <xsl:when test="$witness_count = 1">
                <div class="witness-pagination-container">
                    <div class="tab-content">
                        <div id="single-pagination" role="tabpanel" class="show">
                            <div class="witness-pages">
                                <nav class="witness-pagination ais-Pagination" aria-label="Seitennavigation">
                                    <ul class="page-links ais-Pagination-list">
                                        <!-- Pagination items are injected dynamically by osd_scroll.js -->
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="tei:listWit" name="witness_tabs">
        <xsl:param name="current_witness_id" select="''"/>
        <xsl:param name="base_name" select="''"/>
        <xsl:variable name="witness_count" select="count(//tei:witness)"/>
        <!-- Ordered witnesses: primary-typed first, then the rest in document order -->
        <xsl:variable name="ordered_witnesses" as="element(tei:witness)*"
            select="(
                //tei:witness[lower-case(normalize-space(@type)) = 'primary'],
                //tei:witness[not(lower-case(normalize-space(@type)) = 'primary')]
            )"/>
        <xsl:choose>
            <!-- Per-witness mode: show all witnesses as linked tabs, current one's metadata expanded -->
            <xsl:when test="$current_witness_id != ''">
                <xsl:if test="$witness_count &gt;= 2">
                    <ul class="nav nav-tabs" id="witness_overview" role="tablist">
                        <xsl:for-each select="$ordered_witnesses">
                            <xsl:variable name="wit_pos" select="position()"/>
                            <xsl:variable name="is_current" select="@xml:id = $current_witness_id"/>
                            <li class="nav-item" role="presentation">
                                <a href="{concat($base_name, '_', $wit_pos, '.html')}" role="tab">
                                    <xsl:attribute name="class">
                                        <xsl:choose>
                                            <xsl:when test="$is_current">nav-link active bgc site-top-project-button</xsl:when>
                                            <xsl:otherwise>nav-link bgc site-top-project-button</xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:attribute>
                                    <xsl:if test="$is_current">
                                        <xsl:attribute name="aria-current">page</xsl:attribute>
                                    </xsl:if>
                                    <xsl:text> Textzeuge </xsl:text><xsl:value-of select="$wit_pos"/>
                                </a>
                            </li>
                        </xsl:for-each>
                    </ul>
                </xsl:if>
                <div class="person-card-header">
                    <span class="person-badge">QUELLENANGABEN</span>
                </div>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7/themes/algolia-min.css" />
                <xsl:for-each select="//tei:witness[@xml:id = $current_witness_id]">
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
                </xsl:for-each>
            </xsl:when>
            <xsl:when test="$witness_count &gt;= 2">
                <ul class="nav nav-tabs" id="witness_overview" role="tablist">
                    <xsl:for-each select="$ordered_witnesses">
                        <xsl:variable name="wit_pos" select="position()"/>
                        <xsl:variable name="wit_label">
                            <xsl:choose>
                                <xsl:when test="$wit_pos = 1">primary</xsl:when>
                                <xsl:when test="$wit_pos = 2">secondary</xsl:when>
                                <xsl:when test="$wit_pos = 3">tertiary</xsl:when>
                                <xsl:when test="$wit_pos = 4">quaternary</xsl:when>
                                <xsl:otherwise><xsl:value-of select="concat('witness-', $wit_pos)"/></xsl:otherwise>
                            </xsl:choose>
                        </xsl:variable>
                        <li class="nav-item" role="presentation">
                            <button type="button" role="tab"
                                id="wit-{$wit_label}-tab"
                                data-bs-toggle="tab"
                                data-bs-target="#wit-{$wit_label}-meta-data"
                                aria-controls="wit-{$wit_label}-aria">
                                <xsl:attribute name="class">
                                    <xsl:choose>
                                        <xsl:when test="$wit_pos = 1">nav-link active bgc site-top-project-button</xsl:when>
                                        <xsl:otherwise>nav-link bgc site-top-project-button</xsl:otherwise>
                                    </xsl:choose>
                                </xsl:attribute>
                                <xsl:attribute name="aria-selected">
                                    <xsl:choose>
                                        <xsl:when test="$wit_pos = 1">true</xsl:when>
                                        <xsl:otherwise>false</xsl:otherwise>
                                    </xsl:choose>
                                </xsl:attribute>
                                <xsl:text> Textzeuge </xsl:text><xsl:value-of select="$wit_pos"/>
                            </button>
                        </li>
                    </xsl:for-each>
                </ul>
                <div class="tab-content">
                    <div class="person-card-header">
                        <span class="person-badge">QUELLENANGABEN</span>
                    </div>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7/themes/algolia-min.css" />
                    <xsl:for-each select="$ordered_witnesses">
                        <xsl:variable name="wit_pos" select="position()"/>
                        <xsl:variable name="wit_label">
                            <xsl:choose>
                                <xsl:when test="$wit_pos = 1">primary</xsl:when>
                                <xsl:when test="$wit_pos = 2">secondary</xsl:when>
                                <xsl:when test="$wit_pos = 3">tertiary</xsl:when>
                                <xsl:when test="$wit_pos = 4">quaternary</xsl:when>
                                <xsl:otherwise><xsl:value-of select="concat('witness-', $wit_pos)"/></xsl:otherwise>
                            </xsl:choose>
                        </xsl:variable>
                        <div id="wit-{$wit_label}-meta-data" role="tabpanel" aria-labelledby="#wit-{$wit_label}-tab" data-witness="{$wit_label}">
                            <xsl:attribute name="class">
                                <xsl:choose>
                                    <xsl:when test="$wit_pos = 1">tab-pane fade show active</xsl:when>
                                    <xsl:otherwise>tab-pane fade</xsl:otherwise>
                                </xsl:choose>
                            </xsl:attribute>
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
            </xsl:when>
            <xsl:otherwise>
                <div class="person-card-header">
                    <span class="person-badge">QUELLENANGABEN</span>
                </div>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7/themes/algolia-min.css" />
                <xsl:for-each select="//tei:witness[1]">
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
                </xsl:for-each>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template name="place_fullimages">
        <xsl:param name="current_witness_id" select="''"/>
        <xsl:variable name="pbs_to_process" select="if ($current_witness_id != '')
            then //tei:pb[replace(@edRef, '^#', '') = $current_witness_id or (not(@edRef) and @facs)]
            else //tei:pb[@type = 'secondary']"/>
        <xsl:for-each select="$pbs_to_process">
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
