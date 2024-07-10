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

                </div>
            </xsl:for-each>
        </div>
    </xsl:template>

</xsl:stylesheet>