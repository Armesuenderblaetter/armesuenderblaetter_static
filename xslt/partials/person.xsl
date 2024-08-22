<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:tei="http://www.tei-c.org/ns/1.0" version="2.0" exclude-result-prefixes="xsl tei xs">

    <xsl:template match="tei:person" name="person_detail">
        <table class="table entity-table">
            <tbody>
                <xsl:choose>
                    <xsl:when test="boolean(./tei:sex/@value='m')">
                        <tr>
                            <th>
                    Gechlecht
                            </th>
                            <td>
                                männlich
                            </td>
                        </tr>
                    </xsl:when>
                    <xsl:when test="boolean(./tei:sex/@value='f')">
                        <tr>
                            <th>
                    Gechlecht
                            </th>
                            <td>
                                weiblich
                            </td>
                        </tr>
                    </xsl:when>
                    <xsl:otherwise>
                        <tr>
                            <th>
                    Gechlecht
                            </th>
                            <td>
                                k. A.
                            </td>
                        </tr>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="./tei:age">
                    <tr>
                        <th>
                            Alter
                        </th>
                        <td>
                            <xsl:value-of select="./tei:age"/>
                        </td>
                    </tr>
                </xsl:if>
                <xsl:if test="./tei:birth">
                    <tr>
                        <th>
                        Geburtsort
                        </th>
                        <td>
                            <xsl:value-of select="normalize-space(string-join(./tei:birth/tei:placeName/*))"/>
                        </td>
                    </tr>
                </xsl:if>
                <xsl:if test="./tei:faith">
                    <tr>
                        <th>
                        Konfession
                        </th>
                        <td>
                            <xsl:value-of select="./tei:faith"/>
                        </td>
                    </tr>
                </xsl:if>
                <xsl:if test="./tei:occupation">
                    <tr>
                        <th>
                            Beruf
                        </th>
                        <td>
                            <xsl:value-of select="./tei:occupation"/>
                        </td>
                    </tr>
                </xsl:if>
                <xsl:if test="./tei:listEvent[@type='offences']/*">
                    <tr>
                        <th>
                                Vergehen
                        </th>
                        <td>
                            <ul>
                                <xsl:for-each select="./tei:listEvent[@type='offences']/tei:rs">
                                    <li>
                                        <a href="./offences.html{@ref}">
                                            Vergehen x
                                        </a>
                                    </li>
                                </xsl:for-each>
                            </ul>
                        </td>
                    </tr>
                </xsl:if>
                <xsl:if test=".//tei:rs[@type='punishment' or @type='execution']">
                    <tr>
                        <th>
                            Bestrafung
                        </th>
                        <td>
                            <ul>
                                <xsl:for-each select=".//tei:rs[@type='punishment' or @type='execution']">
                                    <li>
                                        <a href="{@ref}">
                                            <xsl:choose>
                                                <xsl:when test="@type='execution'">
                                                    Hinrichtung
                                                </xsl:when>
                                                <xsl:otherwise>
                                                    Bestrafung
                                                </xsl:otherwise>
                                            </xsl:choose>
                                        </a>
                                    </li>
                                </xsl:for-each>
                            </ul>
                        </td>
                    </tr>
                </xsl:if>
                <xsl:if test="./tei:listEvent">
                    <tr>
                        <th>
                        Erwähnt in
                        </th>
                        <td>
                            <ul>
                                <xsl:for-each select="./tei:noteGrp/tei:note[@type='mentions']">
                                    <li>
                                        <a href="{replace(@target, '.xml', '.html')}">
                                            <xsl:value-of select="text()"/>
                                        </a>
                                    </li>
                                </xsl:for-each>
                            </ul>
                        </td>
                    </tr>
                </xsl:if>
            </tbody>
        </table>
    </xsl:template>
</xsl:stylesheet>