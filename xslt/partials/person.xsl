<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:tei="http://www.tei-c.org/ns/1.0"
    version="2.0" exclude-result-prefixes="xsl tei xs">
    <xsl:template name="get_punishment_label">
        <xsl:param name="current_id"/>
        <xsl:value-of select=".//tei:event[@xml:id = '${current_id}']"/>
    </xsl:template>
    <xsl:template match="tei:person" name="person_detail">
        <dl>
            <xsl:choose>
                <xsl:when test="boolean(./tei:sex/@value = 'm')">
                    <dt> Gechlecht </dt>
                    <dd> männlich </dd>
                </xsl:when>
                <xsl:when test="boolean(./tei:sex/@value = 'f')">
                    <dt> Gechlecht </dt>
                    <dd> weiblich </dd>
                </xsl:when>
                <xsl:otherwise>
                    <dt> Gechlecht </dt>
                    <dd> k. A. </dd>
                </xsl:otherwise>
            </xsl:choose>
            <xsl:if test="./tei:age">
                <dt> Alter </dt>
                <dd>
                    <xsl:value-of select="./tei:age"/>
                </dd>
            </xsl:if>
            <xsl:if test="./tei:birth">
                <dt> Geburtsort </dt>
                <dd>
                    <xsl:variable name="place_string">
                        <xsl:value-of
                            select="normalize-space(string-join(./tei:birth/tei:placeName/*))"/>
                    </xsl:variable>
                    <xsl:choose>
                        <xsl:when
                            test="contains($place_string, 'k.A.') or contains($place_string, 'k. A.')">
                            <xsl:text>k. A.</xsl:text>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="$place_string"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </dd>
            </xsl:if>
            <xsl:if test="./tei:faith">
                <dt> Konfession </dt>
                <dd>
                    <xsl:value-of select="./tei:faith"/>
                </dd>
            </xsl:if>
            <xsl:if test="./tei:occupation">
                <dt> Beruf </dt>
                <dd>
                    <xsl:value-of select="./tei:occupation"/>
                </dd>
            </xsl:if>
            <xsl:if test="./tei:listEvent[@type = 'offences']/*">
                <dt> Vergehen </dt>
                <xsl:for-each select="./tei:listEvent[@type = 'offences']/tei:rs">
                    <dd>
                        <a href="./offences.html{@ref}"> Vergehen x </a>
                    </dd>
                </xsl:for-each>
            </xsl:if>
            <xsl:if test=".//tei:rs[@type = 'punishment' or @type = 'execution']">
                <dt> Bestrafung </dt>
                
                        <xsl:for-each
                            select=".//tei:rs[@type = 'punishment' or @type = 'execution']">
                            <dd>
                                <a href="./punishments.html{@ref}">
                                    <xsl:choose>
                                        <xsl:when test="@type = 'execution'"> Hinrichtung </xsl:when>
                                        <xsl:otherwise> Bestrafung </xsl:otherwise>
                                    </xsl:choose>
                                </a>
                            </dd>
                        </xsl:for-each>
            </xsl:if>
            <xsl:if test="./tei:listEvent">
                <dt> Erwähnt in </dt>
                <xsl:for-each select="./tei:noteGrp/tei:note[@type = 'mentions']">
                    <dd>
                        <a href="{replace(@target, '.xml', '.html')}">
                            <xsl:value-of select="text()"/>
                        </a>
                    </dd>
                </xsl:for-each>
            </xsl:if>
        </dl>
    </xsl:template>
</xsl:stylesheet>
