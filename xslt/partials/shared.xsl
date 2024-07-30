<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" exclude-result-prefixes="xs" version="2.0">
    <xsl:function name="local:makeId" as="xs:string">
        <xsl:param name="currentNode" as="node()"/>
        <xsl:variable name="nodeCurrNr">
            <xsl:value-of select="count($currentNode//preceding-sibling::*) + 1"/>
        </xsl:variable>
        <xsl:value-of select="concat(name($currentNode), '__', $nodeCurrNr)"/>
    </xsl:function>
    <xsl:template name="lstrip">
        <xsl:variable name="stripped_string">
            <xsl:value-of select="normalize-space()"/>
        </xsl:variable>
        <xsl:value-of select="concat($stripped_string, substring-after(., $stripped_string))"/>
    </xsl:template>
    <xsl:template name="one_withespace_left">
        <xsl:variable name="stripped_string">
            <xsl:value-of select="normalize-space()"/>
        </xsl:variable>
        <xsl:value-of select="concat( ' ', $stripped_string, substring-after(., $stripped_string))"/>
    </xsl:template>
    <xsl:template name="rstrip">
        <xsl:variable name="stripped_string">
            <xsl:value-of select="normalize-space()"/>
        </xsl:variable>
        <xsl:value-of select="concat(substring-before(., $stripped_string), $stripped_string)"/>
    </xsl:template>
    <xsl:template name="one_withespace_right">
        <xsl:variable name="stripped_string">
            <xsl:value-of select="normalize-space()"/>
        </xsl:variable>
        <xsl:value-of select="concat(substring-before(., $stripped_string), $stripped_string, ' ')"/>
    </xsl:template>
    <xsl:template match="tei:app[tei:lem]">
        <xsl:variable name="num">
            <xsl:number level="any"/>
        </xsl:variable>
        <a class="variant_anchor_link" href="#app_{$num}">
            <xsl:attribute name="id">
                <xsl:value-of select="concat('var_', $num)"/>
            </xsl:attribute>
            <xsl:apply-templates select="./tei:lem/node()"/>
        </a>
    </xsl:template>
    <xsl:template match="tei:app[not(tei:lem)]">
        <xsl:variable name="num">
            <xsl:number level="any"/>
        </xsl:variable>
        <a class="variant_anchor_link" href="#app_{$num}">
            <xsl:attribute name="id">
                <xsl:value-of select="concat('var_', $num)"/>
            </xsl:attribute>
            <xsl:text> </xsl:text>
        </a>
    </xsl:template>
    <xsl:template match="tei:lem"/>
    <xsl:template match="tei:lem" mode="app">
        <xsl:apply-templates mode="app"/>
        <xsl:text>] </xsl:text>
    </xsl:template>
    <xsl:template match="tei:rdg"/>
    <xsl:template match="tei:rdg" mode="app">
        <span class="variant">
            <xsl:variable name="witness_name">
                <xsl:value-of select="substring-after(@wit, '#')"/>
            </xsl:variable>
            <xsl:variable name="image_name">
                <xsl:value-of
                    select=".//preceding::tei:pb[@edRef = concat('#', $witness_name)][1]/@facs"/>
            </xsl:variable>
            <a href="#witness_overview">
                <xsl:value-of select="$witness_name"/>
                <xsl:text>: </xsl:text>
            </a>
            <a
                href="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$image_name}/full/max/0/default.jpg">
                <xsl:apply-templates mode="rdg"/>
            </a>
        </span>
    </xsl:template>
    <!-- <xsl:template match="*[following-sibling::*[1][local-name()='app']]">
        <xsl:apply-templates/>
        <xsl:text>#here1#</xsl:text>
    </xsl:template>
    <xsl:template match="*/descendant::*[1][local-name()='app']">
        <xsl:apply-templates/>
        <xsl:text>#here1#</xsl:text>
    </xsl:template>

    <xsl:template match="tei:app"/> -->
    <!-- <xsl:template match="tei:w/tei:app/tei:rdg"/>
    <xsl:template match="tei:app/tei:rdg[ancestor::tei:app//tei:lem/tei:w and not(ancestor::tei:w)]"/>
    <xsl:template match="tei:app/tei:rdg[not(ancestor::tei:app//tei:lem/tei:w) and not(ancestor::tei:w)]"/> -->
    <!-- <xsl:template match="tei:w/tei:app[not(tei:lem)]">
        <xsl:variable name="w_id">
            <xsl:value-of select="ancestor::tei:w[1]/@xml:id"/>
        </xsl:variable>
        <a class="variant_anchor_link" href="#app_{$w_id}">
                <xsl:attribute name="id">
                    <xsl:value-of select="$w_id"/>
                </xsl:attribute>
                <xsl:text> </xsl:text>
                <xsl:apply-templates/>
        </a>
    </xsl:template>

    <xsl:template match="tei:w/tei:app/tei:lem">
        <xsl:variable name="w_id">
            <xsl:value-of select="ancestor::tei:w[1]/@xml:id"/>
        </xsl:variable>
        <a class="variant_anchor_link" href="#app_{$w_id}">
                <xsl:attribute name="id">
                    <xsl:value-of select="$w_id"/>
                </xsl:attribute>
                <xsl:apply-templates/>
        </a>
    </xsl:template> -->
    <xsl:template match="tei:pb[@type = 'primary']">
        <!-- 
            this is necessary cause empty pages have to little height to 
            trigger scrolling, so i need to create a hight via css, ergo 
            I need a class, but at the same moment there are sometimes 
            more then one image sources linked, so determining if the amount
            of text inbetween two pb elements is more difficult, I need to
            excluded images from all sources but one to determine the amount of
            text between them
        -->
        <xsl:variable name="facs">
            <xsl:value-of select="@facs"/>
        </xsl:variable>
        <xsl:variable name="emptypage">
            <xsl:for-each-group select="//tei:text//text() | //tei:text//tei:pb[@type = 'primary']"
                group-starting-with=".[local-name() = 'pb' and @type = 'primary']">
                <xsl:if test="current-group()[1][local-name() = 'pb' and @facs = $facs]">
                    <xsl:value-of select="string-length(string-join(current-group())) lt 160"/>
                </xsl:if>
            </xsl:for-each-group>
        </xsl:variable>
        <span class="pb primary" source="{@facs}">
            <xsl:if test="string($emptypage) = 'true'">
                <xsl:attribute name="class">
                    <xsl:value-of select="'pb nearly_no_content primary'"/>
                </xsl:attribute>
            </xsl:if>
            <xsl:value-of select="./@n"/>
            <hr/>
        </span>
    </xsl:template>
    
    <xsl:template match="text()[preceding-sibling::node()[1][local-name()='app' and count(./tei:lem)=0]] | text()[preceding-sibling::*[1][local-name()='app' and not( ./tei:lem/node()[self::text() and normalize-space()!='']) and count(tei:lem/*[local-name()!='pc'])=0]]">
<!--        <xsl:text>###l###</xsl:text>-->
        <xsl:call-template name="one_withespace_left"></xsl:call-template>
    </xsl:template>
    <xsl:template match="text()[following-sibling::node()[1][local-name()='app' and count(./tei:lem)=0]] | text()[following-sibling::*[1][local-name()='app' and not( ./tei:lem/node()[self::text() and normalize-space()!='']) and count(tei:lem/*[local-name()!='pc'])=0]]">
        <xsl:call-template name="one_withespace_right"></xsl:call-template>
        <!--<xsl:text>###r###</xsl:text>-->
    </xsl:template>
    <xsl:template match="tei:choice" mode="app">
        <xsl:apply-templates mode="app"/>
    </xsl:template>
    <xsl:template match="tei:choice">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:sic"/>
    <xsl:template match="tei:sic" mode="app"/>
    <xsl:template match="tei:corr">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:corr" mode="app">
        <xsl:apply-templates mode="app"/>
    </xsl:template>
    <xsl:template match="tei:pb[@type = 'secondary']">
        <xsl:variable name="facs">
            <xsl:value-of select="@facs"/>
        </xsl:variable>
        <span class="pb secondary" source="{@facs}">
            <xsl:attribute name="edRef">
                <xsl:value-of select="@edRef"/>
            </xsl:attribute>
            <xsl:value-of select="./@n"/>
        </span>
    </xsl:template>
    <xsl:template match="tei:pb" mode="app">
        <xsl:text> | </xsl:text>
    </xsl:template>
    <xsl:template match="tei:unclear">
        <abbr title="unclear">
            <xsl:apply-templates/>
        </abbr>
    </xsl:template>
    <xsl:template match="tei:del">
        <del>
            <xsl:apply-templates/>
        </del>
    </xsl:template>
    <xsl:template match="tei:cit">
        <cite>
            <xsl:apply-templates/>
        </cite>
    </xsl:template>
    <xsl:template match="tei:quote">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:date">
        <span class="date">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:lb">
        <br/>
    </xsl:template>
    <xsl:template match="tei:note">
        <xsl:element name="a">
            <xsl:attribute name="name">
                <xsl:text>fna_</xsl:text>
                <xsl:number level="any" format="1" count="tei:note"/>
            </xsl:attribute>
            <xsl:attribute name="href">
                <xsl:text>#fn</xsl:text>
                <xsl:number level="any" format="1" count="tei:note"/>
            </xsl:attribute>
            <xsl:attribute name="title">
                <xsl:value-of select="normalize-space(.)"/>
            </xsl:attribute>
            <sup>
                <xsl:number level="any" format="1" count="tei:note"/>
            </sup>
        </xsl:element>
    </xsl:template>
    <xsl:template match="tei:list[@type = 'unordered']">
        <xsl:choose>
            <xsl:when test="ancestor::tei:body">
                <ul class="yes-index">
                    <xsl:apply-templates/>
                </ul>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:item">
        <xsl:choose>
            <xsl:when test="parent::tei:list[@type = 'unordered'] | ancestor::tei:body">
                <li>
                    <xsl:apply-templates/>
                </li>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:fw">
        <xsl:choose>
            <xsl:when test="@type = 'catch'">
                <span class="catch">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'footnote'">
                <span class="layer_counter">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'pageNum'">
                <span class="page_number">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:hi">
        <span>
            <xsl:choose>
                <xsl:when test="@rendition = '#em'">
                    <xsl:attribute name="class">
                        <xsl:text>italic</xsl:text>
                    </xsl:attribute>
                </xsl:when>
                <xsl:when test="@rendition = '#italic'">
                    <xsl:attribute name="class">
                        <xsl:text>italic</xsl:text>
                    </xsl:attribute>
                </xsl:when>
                <xsl:when test="@rendition = '#smallcaps'">
                    <xsl:attribute name="class">
                        <xsl:text>smallcaps</xsl:text>
                    </xsl:attribute>
                </xsl:when>
                <xsl:when test="@rendition = '#bold'">
                    <xsl:attribute name="class">
                        <xsl:text>bold</xsl:text>
                    </xsl:attribute>
                </xsl:when>
                <xsl:when test="@rendition = '#aq'">
                    <xsl:attribute name="class">
                        <xsl:text>antiqua</xsl:text>
                    </xsl:attribute>
                </xsl:when>
            </xsl:choose>
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:milestone[@rendition='#hr']">
        <hr class="section_divider"/>
    </xsl:template>
    <xsl:template match="tei:ref">
        <a class="ref {@type}" href="{@target}">
            <xsl:apply-templates/>
        </a>
    </xsl:template>
    <xsl:template match="tei:lg">
        <p>
            <xsl:apply-templates/>
        </p>
    </xsl:template>
    <xsl:template match="tei:l">
        <xsl:apply-templates/>
        <br/>
    </xsl:template>
    <xsl:template match="tei:p">
        <p>
            <xsl:apply-templates/>
        </p>
    </xsl:template>
    <xsl:template match="tei:table">
        <xsl:element name="table">
            <xsl:attribute name="class">
                <xsl:text>table table-bordered table-striped table-condensed table-hover</xsl:text>
            </xsl:attribute>
            <xsl:element name="tbody">
                <xsl:apply-templates/>
            </xsl:element>
        </xsl:element>
    </xsl:template>
    <xsl:template match="tei:row">
        <xsl:element name="tr">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>
    <xsl:template match="tei:cell">
        <xsl:element name="td">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>
    <xsl:template match="tei:rs">
        <xsl:choose>
            <xsl:when test="count(tokenize(@ref, ' ')) > 1">
                <xsl:choose>
                    <xsl:when test="@type = 'person'">
                        <span class="persons {substring-after(@rendition, '#')}" id="{@xml:id}">
                            <xsl:apply-templates/>
                            <xsl:for-each select="tokenize(@ref, ' ')">
                                <sup class="entity" data-bs-toggle="modal" data-bs-target="{.}">
                                    <xsl:value-of select="position()"/>
                                </sup>
                                <xsl:if test="position() != last()">
                                    <sup class="entity">/</sup>
                                </xsl:if>
                            </xsl:for-each>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'place'">
                        <span class="places {substring-after(@rendition, '#')}" id="{@xml:id}">
                            <xsl:apply-templates/>
                            <xsl:for-each select="tokenize(@ref, ' ')">
                                <sup class="entity" data-bs-toggle="modal" data-bs-target="{.}">
                                    <xsl:value-of select="position()"/>
                                </sup>
                                <xsl:if test="position() != last()">
                                    <sup class="entity">/</sup>
                                </xsl:if>
                            </xsl:for-each>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'bibl'">
                        <span class="works {substring-after(@rendition, '#')}" id="{@xml:id}">
                            <xsl:apply-templates/>
                            <xsl:for-each select="tokenize(@ref, ' ')">
                                <sup class="entity" data-bs-toggle="modal" data-bs-target="{.}">
                                    <xsl:value-of select="position()"/>
                                </sup>
                                <xsl:if test="position() != last()">
                                    <sup class="entity">/</sup>
                                </xsl:if>
                            </xsl:for-each>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'org'">
                        <span class="orgs {substring-after(@rendition, '#')}" id="{@xml:id}">
                            <xsl:apply-templates/>
                            <xsl:for-each select="tokenize(@ref, ' ')">
                                <sup class="entity" data-bs-toggle="modal" data-bs-target="{.}">
                                    <xsl:value-of select="position()"/>
                                </sup>
                                <xsl:if test="position() != last()">
                                    <sup class="entity">/</sup>
                                </xsl:if>
                            </xsl:for-each>
                        </span>
                    </xsl:when>
                </xsl:choose>
            </xsl:when>
            <xsl:otherwise>
                <xsl:choose>
                    <xsl:when test="@type = 'person'">
                        <span class="persons entity {substring-after(@rendition, '#')}"
                            id="{@xml:id}" data-bs-toggle="modal" data-bs-target="{@ref}">
                            <xsl:apply-templates/>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'place'">
                        <span class="places entity {substring-after(@rendition, '#')}"
                            id="{@xml:id}" data-bs-toggle="modal" data-bs-target="{@ref}">
                            <xsl:apply-templates/>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'bibl'">
                        <span class="works entity {substring-after(@rendition, '#')}" id="{@xml:id}"
                            data-bs-toggle="modal" data-bs-target="{@ref}">
                            <xsl:apply-templates/>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'org'">
                        <span class="orgs entity {substring-after(@rendition, '#')}" id="{@xml:id}"
                            data-bs-toggle="modal" data-bs-target="{@ref}">
                            <xsl:apply-templates/>
                        </span>
                    </xsl:when>
                </xsl:choose>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:listPerson">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:person">
        <xsl:param name="showNumberOfMentions" as="xs:integer" select="5"/>
        <xsl:variable name="selfLink">
            <xsl:value-of select="concat(data(@xml:id), '.html')"/>
        </xsl:variable>
        <div class="modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="{concat(./tei:persName[1]/tei:surname[1], ', ', ./tei:persName[1]/tei:forename[1])}"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">
                            <xsl:value-of
                                select="concat(./tei:persName[1]/tei:surname[1], ', ', ./tei:persName[1]/tei:forename[1])"
                            />
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"/>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <tbody>
                                <xsl:if test="./tei:idno[@type = 'GEONAMES']">
                                    <tr>
                                        <th> Geonames ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GEONAMES']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']">
                                    <tr>
                                        <th> Wikidata ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GND']">
                                    <tr>
                                        <th> GND ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GND']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:listEvent">
                                    <tr>
                                        <th> Erwähnungen </th>
                                        <td>
                                            <ul>
                                                <xsl:for-each select=".//tei:event">
                                                  <xsl:variable name="linkToDocument">
                                                  <xsl:value-of
                                                  select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')"
                                                  />
                                                  </xsl:variable>
                                                  <xsl:choose>
                                                  <xsl:when
                                                  test="position() lt $showNumberOfMentions + 1">
                                                  <li>
                                                  <xsl:value-of select=".//tei:title"/>
                                                  <xsl:text/>
                                                  <a href="{$linkToDocument}">
                                                  <i class="fas fa-external-link-alt"/>
                                                  </a>
                                                  </li>
                                                  </xsl:when>
                                                  </xsl:choose>
                                                </xsl:for-each>
                                            </ul>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <tr>
                                    <th/>
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a
                                            href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
                            >Close</button>
                    </div>
                </div>
            </div>
        </div>
    </xsl:template>
    <xsl:template match="tei:listPlace">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:place">
        <xsl:param name="showNumberOfMentions" as="xs:integer" select="5"/>
        <xsl:variable name="selfLink">
            <xsl:value-of select="concat(data(@xml:id), '.html')"/>
        </xsl:variable>
        <div class="modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="{if(./tei:settlement) then(./tei:settlement/tei:placeName) else (./tei:placeName)}"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">
                            <xsl:value-of select="
                                    if (./tei:settlement) then
                                        (./tei:settlement/tei:placeName)
                                    else
                                        (./tei:placeName)"/>
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"/>
                    </div>
                    <div class="modal-body">
                        <table>
                            <tbody>
                                <xsl:if test="./tei:country">
                                    <tr>
                                        <th> Country </th>
                                        <td>
                                            <xsl:value-of select="./tei:country"/>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GND']/text()">
                                    <tr>
                                        <th> GND </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GND']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']/text()">
                                    <tr>
                                        <th> Wikidata </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GEONAMES']/text()">
                                    <tr>
                                        <th> Geonames </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GEONAMES']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:listEvent">
                                    <tr>
                                        <th> Erwähnungen </th>
                                        <td>
                                            <ul>
                                                <xsl:for-each select=".//tei:event">
                                                  <xsl:variable name="linkToDocument">
                                                  <xsl:value-of
                                                  select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')"
                                                  />
                                                  </xsl:variable>
                                                  <xsl:choose>
                                                  <xsl:when
                                                  test="position() lt $showNumberOfMentions + 1">
                                                  <li>
                                                  <xsl:value-of select=".//tei:title"/>
                                                  <xsl:text/>
                                                  <a href="{$linkToDocument}">
                                                  <i class="fas fa-external-link-alt"/>
                                                  </a>
                                                  </li>
                                                  </xsl:when>
                                                  </xsl:choose>
                                                </xsl:for-each>
                                            </ul>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <tr>
                                    <th/>
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a
                                            href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
                            >Close</button>
                    </div>
                </div>
            </div>
        </div>
    </xsl:template>
    <xsl:template match="tei:listOrg">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:org">
        <xsl:param name="showNumberOfMentions" as="xs:integer" select="5"/>
        <xsl:variable name="selfLink">
            <xsl:value-of select="concat(data(@xml:id), '.html')"/>
        </xsl:variable>
        <div class="modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="{if(./tei:settlement) then(./tei:settlement/tei:placeName) else (./tei:placeName)}"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">
                            <xsl:value-of select="
                                    if (./tei:settlement) then
                                        (./tei:settlement/tei:placeName)
                                    else
                                        (./tei:placeName)"/>
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"/>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <tbody>
                                <xsl:if test="./tei:idno[@type = 'GEONAMES']">
                                    <tr>
                                        <th> Geonames ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GEONAMES']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']">
                                    <tr>
                                        <th> Wikidata ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GND']">
                                    <tr>
                                        <th> GND ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GND']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:listEvent">
                                    <tr>
                                        <th> Erwähnungen </th>
                                        <td>
                                            <ul>
                                                <xsl:for-each select=".//tei:event">
                                                  <xsl:variable name="linkToDocument">
                                                  <xsl:value-of
                                                  select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')"
                                                  />
                                                  </xsl:variable>
                                                  <xsl:choose>
                                                  <xsl:when
                                                  test="position() lt $showNumberOfMentions + 1">
                                                  <li>
                                                  <xsl:value-of select=".//tei:title"/>
                                                  <xsl:text/>
                                                  <a href="{$linkToDocument}">
                                                  <i class="fas fa-external-link-alt"/>
                                                  </a>
                                                  </li>
                                                  </xsl:when>
                                                  </xsl:choose>
                                                </xsl:for-each>
                                            </ul>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <tr>
                                    <th/>
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a
                                            href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
                            >Close</button>
                    </div>
                </div>
            </div>
        </div>
    </xsl:template>
    <xsl:template match="tei:listBibl">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:bibl">
        <xsl:param name="showNumberOfMentions" as="xs:integer" select="5"/>
        <xsl:variable name="selfLink">
            <xsl:value-of select="concat(data(@xml:id), '.html')"/>
        </xsl:variable>
        <div class="modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1"
            aria-labelledby="{./tei:title[@type='main']}" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">
                            <xsl:value-of select="./tei:title"/>
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"
                            aria-label="Close"/>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <tbody>
                                <tr>
                                    <th> Autor(en) </th>
                                    <td>
                                        <ul>
                                            <xsl:for-each select="./tei:author">
                                                <li>
                                                  <a href="{@xml:id}.html">
                                                  <xsl:value-of select="./tei:persName"/>
                                                  </a>
                                                </li>
                                            </xsl:for-each>
                                        </ul>
                                    </td>
                                </tr>
                                <xsl:if test="./tei:idno[@type = 'GEONAMES']">
                                    <tr>
                                        <th> Geonames ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GEONAMES']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']">
                                    <tr>
                                        <th> Wikidata ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GND']">
                                    <tr>
                                        <th> GND ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GND']}" target="_blank">
                                                <xsl:value-of
                                                  select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]"
                                                />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:listEvent">
                                    <tr>
                                        <th> Erwähnungen </th>
                                        <td>
                                            <ul>
                                                <xsl:for-each select=".//tei:event">
                                                  <xsl:variable name="linkToDocument">
                                                  <xsl:value-of
                                                  select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')"
                                                  />
                                                  </xsl:variable>
                                                  <xsl:choose>
                                                  <xsl:when
                                                  test="position() lt $showNumberOfMentions + 1">
                                                  <li>
                                                  <xsl:value-of select=".//tei:title"/>
                                                  <xsl:text/>
                                                  <a href="{$linkToDocument}">
                                                  <i class="fas fa-external-link-alt"/>
                                                  </a>
                                                  </li>
                                                  </xsl:when>
                                                  </xsl:choose>
                                                </xsl:for-each>
                                            </ul>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <tr>
                                    <th/>
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a
                                            href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
                            >Close</button>
                    </div>
                </div>
            </div>
        </div>
    </xsl:template>
    <!-- <xsl:template match="tei:rs[@ref or @key]">
        <strong>
            <xsl:element name="a">
                <xsl:attribute name="data-toggle">modal</xsl:attribute>
                <xsl:attribute name="data-target">
                    <xsl:value-of select="data(@ref)"/>
                </xsl:attribute>
                <xsl:value-of select="."/>
            </xsl:element>
        </strong>
    </xsl:template> -->
</xsl:stylesheet>
