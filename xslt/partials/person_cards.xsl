<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" 
    exclude-result-prefixes="#all" version="2.0">
    
    <!-- Load the listperson.xml index file -->
    <xsl:variable name="listperson_doc" select="document('../../data/indices/listperson.xml')"/>
    <xsl:variable name="offences_doc" select="document('../../data/indices/offences.xml')"/>
    <xsl:variable name="punishments_doc" select="document('../../data/indices/punishments.xml')"/>
    
    <!-- Get current document filename for matching persons -->
    <xsl:variable name="current_filename">
        <xsl:value-of select="tokenize(document-uri(/), '/')[last()]"/>
    </xsl:variable>
    
    <xsl:variable name="current_filename_html">
        <xsl:value-of select="replace($current_filename, '.xml', '.html')"/>
    </xsl:variable>
    
    <!-- Template to build person cards for the left column -->
    <xsl:template name="person_cards">
        <div class="person-cards-container">
            <!-- Find persons related to current document from listperson.xml -->
            <xsl:variable name="matching_persons" 
                select="$listperson_doc//tei:person[tei:noteGrp/tei:note[contains(@target, replace($current_filename, '.xml', ''))]]"/>
            
            <xsl:choose>
                <xsl:when test="count($matching_persons) > 0">
                    <xsl:for-each select="$matching_persons">
                        <xsl:variable name="person_index" select="position()"/>
                        <xsl:call-template name="render_person_card">
                            <xsl:with-param name="person" select="."/>
                            <xsl:with-param name="index" select="$person_index"/>
                        </xsl:call-template>
                    </xsl:for-each>
                </xsl:when>
                <xsl:otherwise>
                    <!-- Fallback: try to get persons from back/listPerson in the document itself -->
                    <xsl:for-each select="//tei:back/tei:listPerson/tei:person">
                        <xsl:variable name="person_index" select="position()"/>
                        <xsl:call-template name="render_person_card_from_back">
                            <xsl:with-param name="person" select="."/>
                            <xsl:with-param name="index" select="$person_index"/>
                        </xsl:call-template>
                    </xsl:for-each>
                </xsl:otherwise>
            </xsl:choose>
        </div>
    </xsl:template>
    
    <!-- Render a person card from listperson.xml data -->
    <xsl:template name="render_person_card">
        <xsl:param name="person"/>
        <xsl:param name="index"/>
        
        <div class="person-card">
            <!-- Person Name Header -->
            <div class="person-card-header">
                <h3 class="person-name">
                    <xsl:value-of select="upper-case(concat($person/tei:persName/tei:forename, ' ', $person/tei:persName/tei:surname))"/>
                </h3>
                <span class="person-badge">PERSON <xsl:value-of select="$index"/></span>
            </div>
            
            <div class="person-card-body">
                <table class="person-info-table">
                    <tbody>
                        <!-- Age -->
                        <tr>
                            <td class="info-label">ALTER:</td>
                            <td class="info-value">
                                <xsl:choose>
                                    <xsl:when test="$person/tei:age and $person/tei:age != 'k. A.'">
                                        <xsl:value-of select="$person/tei:age"/>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Birthplace -->
                        <tr>
                            <td class="info-label">GEBURTSORT:</td>
                            <td class="info-value">
                                <xsl:choose>
                                    <xsl:when test="$person/tei:birth/tei:placeName/tei:settlement and $person/tei:birth/tei:placeName/tei:settlement != 'k. A.'">
                                        <xsl:value-of select="$person/tei:birth/tei:placeName/tei:settlement"/>
                                        <xsl:if test="$person/tei:birth/tei:placeName/tei:country and $person/tei:birth/tei:placeName/tei:country != '' and $person/tei:birth/tei:placeName/tei:country != 'k. A.'">
                                            <xsl:text>, </xsl:text>
                                            <xsl:value-of select="$person/tei:birth/tei:placeName/tei:country"/>
                                        </xsl:if>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Marital Status -->
                        <tr>
                            <td class="info-label">FAMILIENSTAND:</td>
                            <td class="info-value">
                                <xsl:choose>
                                    <xsl:when test="$person/tei:state[@type='civil']/tei:desc">
                                        <xsl:choose>
                                            <xsl:when test="$person/tei:state[@type='civil']/tei:desc = 'married'">verheiratet</xsl:when>
                                            <xsl:when test="$person/tei:state[@type='civil']/tei:desc = 'unwed'">ledig</xsl:when>
                                            <xsl:when test="$person/tei:state[@type='civil']/tei:desc = 'widowed'">verwitwet</xsl:when>
                                            <xsl:when test="$person/tei:state[@type='civil']/tei:desc = 'k. A.'">k.A.</xsl:when>
                                            <xsl:otherwise><xsl:value-of select="$person/tei:state[@type='civil']/tei:desc"/></xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Religion -->
                        <tr>
                            <td class="info-label">KONFESSION:</td>
                            <td class="info-value">
                                <xsl:choose>
                                    <xsl:when test="$person/tei:faith and $person/tei:faith != 'k. A.'">
                                        <xsl:choose>
                                            <xsl:when test="$person/tei:faith = 'cath'">katholisch</xsl:when>
                                            <xsl:when test="$person/tei:faith = 'luth'">evangelisch</xsl:when>
                                            <xsl:when test="$person/tei:faith = 'jud'">jüdisch</xsl:when>
                                            <xsl:otherwise><xsl:value-of select="$person/tei:faith"/></xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Occupation -->
                        <tr>
                            <td class="info-label">BERUF:</td>
                            <td class="info-value">
                                <xsl:choose>
                                    <xsl:when test="$person/tei:occupation and $person/tei:occupation != 'k. A.'">
                                        <xsl:value-of select="$person/tei:occupation"/>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Execution Place (from punishments) -->
                        <tr>
                            <td class="info-label">HINR.-ORT:</td>
                            <td class="info-value">
                                <xsl:variable name="execution_ref" select="($person/tei:rs[@type='execution']/@ref)[1]"/>
                                <xsl:variable name="punishment_ref" select="($person/tei:rs[@type='punishment']/@ref)[1]"/>
                                <xsl:choose>
                                    <xsl:when test="$execution_ref">
                                        <xsl:variable name="execution_id" select="substring-after($execution_ref, '#')"/>
                                        <xsl:variable name="execution_event" select="$punishments_doc//tei:event[@xml:id = $execution_id]"/>
                                        <xsl:choose>
                                            <xsl:when test="$execution_event//tei:placeName">
                                                <xsl:value-of select="$execution_event//tei:placeName"/>
                                            </xsl:when>
                                            <xsl:otherwise>k.A.</xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:when>
                                    <xsl:when test="$punishment_ref">
                                        <xsl:variable name="punishment_id" select="substring-after($punishment_ref, '#')"/>
                                        <xsl:variable name="punishment_event" select="$punishments_doc//tei:event[@xml:id = $punishment_id]"/>
                                        <xsl:choose>
                                            <xsl:when test="$punishment_event//tei:placeName">
                                                <xsl:value-of select="$punishment_event//tei:placeName"/>
                                            </xsl:when>
                                            <xsl:otherwise>k.A.</xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Offences -->
                        <tr>
                            <td class="info-label">VERGEHEN:</td>
                            <td class="info-value">
                                <xsl:variable name="offence_refs" select="$person/tei:listEvent[@type='offences']/tei:rs/@ref"/>
                                <xsl:choose>
                                    <xsl:when test="count($offence_refs) > 0">
                                        <xsl:for-each select="$offence_refs">
                                            <xsl:variable name="offence_id" select="substring-after(., '#')"/>
                                            <xsl:variable name="offence_event" select="$offences_doc//tei:event[@xml:id = $offence_id]"/>
                                            <xsl:if test="$offence_event//tei:trait[@type='typeOfOffence']//tei:item">
                                                <xsl:for-each select="$offence_event//tei:trait[@type='typeOfOffence']//tei:item">
                                                    <xsl:value-of select="."/>
                                                    <xsl:if test="position() != last()"><xsl:text>, </xsl:text></xsl:if>
                                                </xsl:for-each>
                                                <xsl:if test="position() != last()"><xsl:text>; </xsl:text></xsl:if>
                                            </xsl:if>
                                        </xsl:for-each>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Punishment -->
                        <tr>
                            <td class="info-label">BESTRAFUNG:</td>
                            <td class="info-value">
                                <xsl:variable name="execution_ref" select="($person/tei:rs[@type='execution']/@ref)[1]"/>
                                <xsl:variable name="punishment_ref" select="($person/tei:rs[@type='punishment']/@ref)[1]"/>
                                <xsl:choose>
                                    <xsl:when test="$execution_ref">
                                        <xsl:variable name="execution_id" select="substring-after($execution_ref, '#')"/>
                                        <xsl:variable name="execution_event" select="$punishments_doc//tei:event[@xml:id = $execution_id]"/>
                                        <xsl:choose>
                                            <xsl:when test="$execution_event//tei:trait[@type='methodOfExecution']/tei:desc">
                                                <xsl:text>Hinrichtung (</xsl:text>
                                                <xsl:value-of select="$execution_event//tei:trait[@type='methodOfExecution']/tei:desc"/>
                                                <xsl:text>)</xsl:text>
                                            </xsl:when>
                                            <xsl:otherwise>Hinrichtung</xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:when>
                                    <xsl:when test="$punishment_ref">
                                        <xsl:text>Bestrafung</xsl:text>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                        
                        <!-- Mentioned in -->
                        <tr>
                            <td class="info-label">ERWÄHNT IN:</td>
                            <td class="info-value">
                                <xsl:choose>
                                    <xsl:when test="$person/tei:noteGrp/tei:note[@type='mentions']">
                                        <xsl:value-of select="$person/tei:noteGrp/tei:note[@type='mentions']"/>
                                    </xsl:when>
                                    <xsl:otherwise>k.A.</xsl:otherwise>
                                </xsl:choose>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <!-- Links -->
                <div class="person-links">
                    <span class="link-label">LINKS:</span>
                    <a href="{replace($current_filename, '.xml', '.xml')}" class="xml-link" title="XML-Version">
                        <i class="bi bi-filetype-xml"></i> XML-Version
                    </a>
                    <xsl:if test="$person/@xml:id">
                        <a href="{concat($person/@xml:id, '.html')}" class="person-detail-link" title="Personendetails">
                            <i class="bi bi-person"></i> Personendetails
                        </a>
                    </xsl:if>
                </div>
            </div>
        </div>
        
        <xsl:if test="position() != last()">
            <hr class="person-divider"/>
        </xsl:if>
    </xsl:template>
    
    <!-- Fallback template for person data from document's back element -->
    <xsl:template name="render_person_card_from_back">
        <xsl:param name="person"/>
        <xsl:param name="index"/>
        
        <div class="person-card">
            <div class="person-card-header">
                <h3 class="person-name">
                    <xsl:value-of select="upper-case(concat($person//tei:persName/tei:forename, ' ', $person//tei:persName/tei:surname))"/>
                </h3>
                <span class="person-badge">
                    <xsl:choose>
                        <xsl:when test="$person/@role = 'delinquent'">DELINQUENT <xsl:value-of select="$index"/></xsl:when>
                        <xsl:otherwise>PERSON <xsl:value-of select="$index"/></xsl:otherwise>
                    </xsl:choose>
                </span>
            </div>
            
            <div class="person-card-body">
                <div class="person-links">
                    <a href="{concat($person/@xml:id, '.html')}" class="person-detail-link" title="Personendetails">
                        <i class="bi bi-person"></i> Zur Personenseite
                    </a>
                </div>
            </div>
        </div>
        
        <xsl:if test="position() != last()">
            <hr class="person-divider"/>
        </xsl:if>
    </xsl:template>
    
</xsl:stylesheet>
