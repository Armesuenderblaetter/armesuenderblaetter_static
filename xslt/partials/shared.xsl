<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:local="http://dse-static.foo.bar" exclude-result-prefixes="xs local" version="2.0">
    <xsl:function name="local:makeId" as="xs:string">
        <xsl:param name="currentNode" as="node()"/>
        <xsl:variable name="nodeCurrNr">
            <xsl:value-of select="count($currentNode//preceding-sibling::*) + 1"/>
        </xsl:variable>
        <xsl:value-of select="concat(name($currentNode), '__', $nodeCurrNr)"/>
    </xsl:function>
    <!--<xsl:strip-space elements="fw"/>-->
    <xsl:strip-space elements="*"/>
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
        <xsl:value-of select="concat(' ', $stripped_string, substring-after(., $stripped_string))"/>
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
        <xsl:value-of select="concat(substring-before(., $stripped_string), $stripped_string, ' ')" />
    </xsl:template>
    <xsl:template match="tei:app[tei:lem]">
        <xsl:variable name="num">
            <xsl:number level="any"/>
        </xsl:variable>
        <xsl:choose>
            <xsl:when test="./tei:lem[normalize-space()=.//*[local-name()='fw' and @type='catch']/normalize-space()]">
                <a class="variant_anchor_link block_lemma catch" href="#app_{$num}">
                    <xsl:attribute name="id">
                        <xsl:value-of select="concat('var_', $num)"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="./tei:lem/node()"/>
                </a>
            </xsl:when>
            <xsl:when test="(not(.//tei:w or .//tei:pc) and not(ancestor::tei:w))">
                <a class="variant_anchor_link block_lemma" href="#app_{$num}">
                    <xsl:attribute name="id">
                        <xsl:value-of select="concat('var_', $num)"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="./tei:lem/node()"/>
                </a>
            </xsl:when>
            <xsl:otherwise>
                <a class="variant_anchor_link" href="#app_{$num}">
                    <xsl:attribute name="id">
                        <xsl:value-of select="concat('var_', $num)"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="./tei:lem/node()"/>
                </a>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:app[not(tei:lem)]">
        <xsl:variable name="num">
            <xsl:number level="any"/>
        </xsl:variable>
        <span class="empty_lemma">
            <a class="variant_anchor_link" href="#app_{$num}">
                <xsl:attribute name="id">
                    <xsl:value-of select="concat('var_', $num)"/>
                </xsl:attribute>
                <xsl:value-of select="' '"/>
            </a>
        </span>
    </xsl:template>
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
                <xsl:value-of select=".//preceding::tei:pb[@edRef = concat('#', $witness_name)][1]/@facs"/>
            </xsl:variable>
            <a href="#witness_overview" class="editor_comment">
                <xsl:value-of select="$witness_name"/>
                <xsl:text>: </xsl:text>
            </a>
            <a href="https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/{$image_name}/full/max/0/default.jpg">
                <xsl:apply-templates mode="app"/>
            </a>
        </span>
    </xsl:template>
    <!--watch me suffer from these whitespaces-->
    <!-- add whitespace after tei:w -->
    <xsl:template match="tei:w" mode="#all">
        <span class="token">
            <xsl:variable name="target_f_id">
                <xsl:value-of select="substring-after(./@ana, '#')"/>
            </xsl:variable>
            <xsl:variable name="vocab">
                <xsl:value-of select="//tei:fs[@xml:id = $target_f_id]/tei:f[@name='dictref']/text()"/>
            </xsl:variable>
            <xsl:attribute name="lemma" select="@lemma"/>
            <xsl:attribute name="pos" select="@pos"/>
            <xsl:attribute name="vocab" select="$vocab"/>
            <xsl:apply-templates/>
        </span>
        <xsl:variable name="relevant_interpunctuation_after">
            <xsl:if test="not(following-sibling::*[1][tei:app[not(tei:lem)]])">
                <xsl:value-of select="count((./following::*[text()[normalize-space() != '']])[1][local-name() = 'pc' and (@pos = ('$,', '$.') or normalize-space() = (')', ':'))])" />
            </xsl:if>
        </xsl:variable>
        <xsl:if test="$relevant_interpunctuation_after != '1'">
            <xsl:value-of select="' '"/>
        </xsl:if>
    </xsl:template>
    <!-- add whitespace after tei:pc -->
    <xsl:template match="tei:pc" mode="#all">
        <xsl:apply-templates/>
        <xsl:if test="normalize-space() != ('(', '/')">
            <xsl:value-of select="' '"/>
        </xsl:if>
    </xsl:template>
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
            <xsl:for-each-group select="//tei:text//text() | //tei:text//tei:pb[@type = 'primary']" group-starting-with=".[local-name() = 'pb' and @type = 'primary']">
                <xsl:if test="current-group()[1][local-name() = 'pb' and @facs = $facs]">
                    <xsl:if test="not(current-group()//tei:titlePage)">
                        <xsl:value-of select="string-length(string-join(current-group())) lt 100"/>
                    </xsl:if>
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
        </span>
    </xsl:template>
    <xsl:template match="tei:pb[@type = 'secondary']">
        <xsl:if test="@type = 'secondary' and not(preceding-sibling::*[1][self::tei:pb and @type = 'primary']) and not(following-sibling::*[1][self::tei:pb and @type = 'primary']) and not(ancestor::tei:app)">
            <xsl:variable name="num">
                <xsl:number level="any"/>
            </xsl:variable>
            <span class="empty_lemma">
                <a class="variant_anchor_link" href="#app_pb_{$num}">
                    <xsl:attribute name="id">
                        <xsl:value-of select="concat('var_pb_', $num)"/>
                    </xsl:attribute>
                    <xsl:value-of select="' '"/>
                </a>
            </span>
        </xsl:if>
    </xsl:template>
    <xsl:template match="tei:pb" mode="app">
        <xsl:text> | </xsl:text>
    </xsl:template>
    <xsl:template match="tei:choice" mode="app">
        <xsl:apply-templates mode="app" select="./tei:corr"/>
        <xsl:apply-templates mode="app" select="./tei:sic"/>
    </xsl:template>
    <xsl:template match="tei:choice">
        <xsl:apply-templates select="./tei:corr"/>
        <xsl:apply-templates select="./tei:sic"/>
    </xsl:template>
    <xsl:template match="tei:corr">
        <span class="corr">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:corr" mode="app">
        <span class="corr">
            <xsl:apply-templates mode="app"/>
        </span>
    </xsl:template>
    <xsl:template match="tei:sic">
        <span class="sic">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:sic" mode="app">
        <span class="sic">
            <xsl:apply-templates mode="app"/>
        </span>
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
    <xsl:template match="tei:q">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <span class="{$rendering} quote">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:imprimatur">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <span class="{$rendering} imprimatur">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:docImprint">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <span class="{$rendering} imprint">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:closer">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <div class="{$rendering} closer">
            <xsl:apply-templates/>
        </div>
    </xsl:template>
    <xsl:template match="tei:date">
        <span class="date">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:lb">
        <span class="lb"/>
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
                <xsl:variable name="rendering">
                    <xsl:call-template name="rendition_2_class"/>
                </xsl:variable>
                <li class="{$rendering}">
                    <xsl:apply-templates/>
                </li>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:fw">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <xsl:choose>
            <xsl:when test="@type = 'catch'">
                <span class="catch {$rendering}">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'footer'">
                <span class="layer_counter {$rendering}">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'pageNum'">
                <span class="page_number {$rendering}">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'sig'">
                <span class="sig {$rendering}">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'footnote'">
                <span class="footnote {$rendering}">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:fw" mode="app">
        <xsl:choose>
            <xsl:when test="@type = 'catch'">
                <span class="app-catch">
                    <xsl:apply-templates mode="app"/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'footnote'">
                <span class="app-layer_counter">
                    <xsl:apply-templates mode="app"/>
                </span>
            </xsl:when>
            <xsl:when test="@type = 'pageNum'">
                <span class="app-page_number">
                    <xsl:apply-templates mode="app"/>
                </span>
            </xsl:when>
        </xsl:choose>
    </xsl:template>
    <xsl:template match="tei:hi" mode="#all">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <span class="{$rendering}">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:head" mode="#all">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <h4 class="{$rendering}">
            <xsl:apply-templates/>
        </h4>
    </xsl:template>
    <xsl:template name="rendition_2_class">
        <xsl:if test="@rendition">
            <xsl:for-each select="tokenize(@rendition, '\s*#')">
                <xsl:choose>
                    <xsl:when test=". = 'c'">
                        <!--zentriert-->
                        <xsl:text>text_align_center </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'aq'">
                        <!--Antiqua-Schrift-->
                        <xsl:text>antiqua </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'in'">
                        <!--Erste Buchstabe ist eine inititale-->
                        <xsl:text>majuscule </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'i'">
                        <!--Kursivdruck-->
                        <xsl:text>italic </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'g'">
                        <!--Gesperrt-->
                        <xsl:text>spaced </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'et'">
                        <!--Einzug-->
                        <xsl:text>indent </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'ot'">
                        <!--hängender Einzug-->
                        <xsl:text>hanging_indent </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'sup'">
                        <!--hochgestellt-->
                        <xsl:text>superscript </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'il'">
                        <!--Element innerhalb einer Zeile-->
                        <xsl:text>display_inline </xsl:text>
                    </xsl:when>
                    <xsl:when test=". = 'hr'">
                        <xsl:text>section_divider </xsl:text>
                        <!--Horizontale Linie-->
                    </xsl:when>
                </xsl:choose>
            </xsl:for-each>
        </xsl:if>
    </xsl:template>
    <xsl:template match="tei:milestone[@rendition = '#hr']">
        <hr class="section_divider"/>
    </xsl:template>
    <xsl:template match="tei:milestone[@rendition = '#hr']" mode="app">
        <span class="app-section_divider"/>
    </xsl:template>
    <xsl:template match="tei:ref">
        <a class="ref {@type}" href="{@target}">
            <xsl:apply-templates/>
        </a>
    </xsl:template>
    <xsl:template match="tei:lg">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <p class="{$rendering} versegroup">
            <xsl:apply-templates/>
        </p>
    </xsl:template>
    <xsl:template match="tei:l">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <span class="{$rendering} verse">
            <xsl:apply-templates/>
        </span>
        <span class="lb"/>
    </xsl:template>
    <xsl:template match="tei:p">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <p class="{$rendering}">
            <xsl:apply-templates/>
        </p>
    </xsl:template>
    <xsl:template match="tei:titlePage">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:titlePart">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <span class="{$rendering} title_part">
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:pubPlace">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <span class="{$rendering}">
            <xsl:apply-templates/>
        </span>
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
                        <span class="persons entity {substring-after(@rendition, '#')}" id="{@xml:id}" data-bs-toggle="modal" data-bs-target="{@ref}">
                            <xsl:apply-templates/>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'place'">
                        <span class="places entity {substring-after(@rendition, '#')}" id="{@xml:id}" data-bs-toggle="modal" data-bs-target="{@ref}">
                            <xsl:apply-templates/>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'bibl'">
                        <span class="works entity {substring-after(@rendition, '#')}" id="{@xml:id}" data-bs-toggle="modal" data-bs-target="{@ref}">
                            <xsl:apply-templates/>
                        </span>
                    </xsl:when>
                    <xsl:when test="@type = 'org'">
                        <span class="orgs entity {substring-after(@rendition, '#')}" id="{@xml:id}" data-bs-toggle="modal" data-bs-target="{@ref}">
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
        <div class="modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1" aria-labelledby="{concat(./tei:persName[1]/tei:surname[1], ', ', ./tei:persName[1]/tei:forename[1])}" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">
                            <xsl:value-of select="concat(./tei:persName[1]/tei:surname[1], ', ', ./tei:persName[1]/tei:forename[1])" />
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <tbody>
                                <xsl:if test="./tei:idno[@type = 'GEONAMES']">
                                    <tr>
                                        <th> Geonames ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GEONAMES']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']">
                                    <tr>
                                        <th> Wikidata ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GND']">
                                    <tr>
                                        <th> GND ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GND']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]" />
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
                                                        <xsl:value-of select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')" />
                                                    </xsl:variable>
                                                    <xsl:choose>
                                                        <xsl:when test="position() lt $showNumberOfMentions + 1">
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
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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
        <div class="modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1" aria-labelledby="{if(./tei:settlement) then(./tei:settlement/tei:placeName) else (./tei:placeName)}" aria-hidden="true">
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
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
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
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']/text()">
                                    <tr>
                                        <th> Wikidata </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GEONAMES']/text()">
                                    <tr>
                                        <th> Geonames </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GEONAMES']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]" />
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
                                                        <xsl:value-of select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')" />
                                                    </xsl:variable>
                                                    <xsl:choose>
                                                        <xsl:when test="position() lt $showNumberOfMentions + 1">
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
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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
        <div class="modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1" aria-labelledby="{if(./tei:settlement) then(./tei:settlement/tei:placeName) else (./tei:placeName)}" aria-hidden="true">
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
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <tbody>
                                <xsl:if test="./tei:idno[@type = 'GEONAMES']">
                                    <tr>
                                        <th> Geonames ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GEONAMES']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']">
                                    <tr>
                                        <th> Wikidata ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GND']">
                                    <tr>
                                        <th> GND ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GND']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]" />
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
                                                        <xsl:value-of select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')" />
                                                    </xsl:variable>
                                                    <xsl:choose>
                                                        <xsl:when test="position() lt $showNumberOfMentions + 1">
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
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <div class="{$rendering} modal fade" id="{@xml:id}" data-bs-keyboard="false" tabindex="-1" aria-labelledby="{./tei:title[@type='main']}" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">
                            <xsl:value-of select="./tei:title"/>
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
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
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GEONAMES'], '/')[4]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'WIKIDATA']">
                                    <tr>
                                        <th> Wikidata ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='WIKIDATA']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'WIKIDATA'], '/')[last()]" />
                                            </a>
                                        </td>
                                    </tr>
                                </xsl:if>
                                <xsl:if test="./tei:idno[@type = 'GND']">
                                    <tr>
                                        <th> GND ID </th>
                                        <td>
                                            <a href="{./tei:idno[@type='GND']}" target="_blank">
                                                <xsl:value-of select="tokenize(./tei:idno[@type = 'GND'], '/')[last()]" />
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
                                                        <xsl:value-of select="replace(tokenize(data(.//@target), '/')[last()], '.xml', '.html')" />
                                                    </xsl:variable>
                                                    <xsl:choose>
                                                        <xsl:when test="position() lt $showNumberOfMentions + 1">
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
                                    <td> Anzahl der Erwähnungen limitiert, klicke <a href="{$selfLink}">hier</a> für eine vollständige
                                        Auflistung </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
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
