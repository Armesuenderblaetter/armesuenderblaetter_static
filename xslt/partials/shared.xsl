<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" exclude-result-prefixes="xs local" version="2.0">
    <xsl:function name="local:makeId" as="xs:string">
        <xsl:param name="currentNode" as="node()"/>
        <xsl:variable name="nodeCurrNr">
            <xsl:value-of select="count($currentNode//preceding-sibling::*) + 1"/>
        </xsl:variable>
        <xsl:value-of select="concat(name($currentNode), '__', $nodeCurrNr)"/>
    </xsl:function>
    <xsl:function name="local:resp-classes" as="xs:string">
        <xsl:param name="node" as="node()?"/>
        <xsl:sequence
            select="if ($node and normalize-space($node/@resp) != '')
                    then string-join(for $r in tokenize(normalize-space($node/@resp), '\s+')
                                     return replace($r, '^#', ''), ' ')
                    else ''"/>
    </xsl:function>
    <xsl:function name="local:has-multiple-witnesses" as="xs:boolean">
        <xsl:param name="context" as="node()?"/>
        <xsl:sequence select="if ($context) then count(root($context)//tei:witness) &gt; 1 else false()"/>
    </xsl:function>
    <xsl:function name="local:witness-label" as="xs:string?">
        <xsl:param name="context" as="node()?"/>
        <xsl:param name="witId" as="xs:string?"/>
        <xsl:variable name="clean" select="replace(normalize-space(string($witId)), '^#', '')"/>
        <xsl:variable name="target" select="(root($context)//tei:witness[@xml:id = $clean])[1]"/>
        <xsl:variable name="pos" select="if ($target) then count($target/preceding-sibling::tei:witness) + 1 else 0"/>
        <xsl:variable name="label_raw" select="if (local:has-multiple-witnesses($context) and $target)
            then (if (normalize-space($target/@type) != '')
                then lower-case($target/@type)
                else (if ($pos = 1) then 'primary'
                      else if ($pos = 2) then 'secondary'
                      else if ($pos = 3) then 'tertiary'
                      else concat('witness-', $pos)))
            else ''"/>
        <xsl:sequence select="replace($label_raw, '^wit-', '')"/>
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
        <xsl:variable name="num">
            <xsl:number level="any"/>
        </xsl:variable>
        <xsl:variable name="app_id" select="concat('app_', $num)"/>
        <span class="variant-container" data-app-id="{$app_id}">
            <!-- Process lem elements -->
            <xsl:for-each select="tei:lem">
                <xsl:variable name="witness_name" select="substring-after(@wit, '#')"/>
                <xsl:variable name="witness_label" select="local:witness-label(., $witness_name)"/>
                <span class="variant-reading lem" data-variant-type="lem">
                    <xsl:if test="$witness_label != ''">
                        <xsl:attribute name="data-witness" select="$witness_label"/>
                    </xsl:if>
                    <xsl:apply-templates select="node()"/>
                </span>
            </xsl:for-each>
            <!-- Process rdg elements -->
            <xsl:for-each select="tei:rdg">
                <xsl:variable name="witness_name" select="substring-after(@wit, '#')"/>
                <xsl:variable name="witness_label" select="local:witness-label(., $witness_name)"/>
                <span class="variant-reading rdg" data-variant-type="rdg">
                    <xsl:if test="$witness_label != ''">
                        <xsl:attribute name="data-witness" select="$witness_label"/>
                    </xsl:if>
                    <xsl:apply-templates select="node()"/>
                </span>
            </xsl:for-each>
        </span>
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
    <!-- add whitespace after tei:w, but preserve tei:app handling -->
    <xsl:template match="tei:w" mode="#all">
        <span class="token">
            <xsl:attribute name="id">
                <xsl:value-of select="@xml:id"/>
            </xsl:attribute>
            <xsl:variable name="target_f_id">
                <xsl:value-of select="substring-after(./@ana, '#')"/>
            </xsl:variable>
            <xsl:variable name="vocab">
                <xsl:value-of select="//tei:fs[@xml:id = $target_f_id]/tei:f[@name='dictref']/text()"/>
            </xsl:variable>
            <xsl:attribute name="lemma" select="@lemma"/>
            <xsl:attribute name="pos" select="@pos"/>
            <xsl:attribute name="vocab" select="$vocab"/>
            <xsl:apply-templates mode="replace-equals"/>
        </span>
        <!-- whitespace logic after tei:w, but not if next sibling is tei:app -->
        <xsl:choose>
            <xsl:when test="following-sibling::*[1][self::tei:app]">
                <!-- do not output space if next is tei:app -->
            </xsl:when>
            <xsl:otherwise>
                <xsl:variable name="relevant_interpunctuation_after">
                    <xsl:if test="not(following-sibling::*[1][tei:app[not(tei:lem)]])">
                        <xsl:value-of select="count((./following::*[text()[normalize-space() != '']])[1][local-name() = 'pc' and (@pos = ('$,', '$.') or normalize-space() = (')', ':'))])" />
                    </xsl:if>
                </xsl:variable>
                <xsl:if test="$relevant_interpunctuation_after != '1'">
                    <xsl:text> </xsl:text>
                </xsl:if>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    <!-- add whitespace after tei:pc -->
    <xsl:template match="tei:pc" mode="#all">
        <span class="pc">
            <xsl:apply-templates />
            <!-- <xsl:apply-templates mode="replace-equals"/> -->
        </span>
        <xsl:if test="normalize-space() != ('(', '/')">
            <xsl:text> </xsl:text>
        </xsl:if>
    </xsl:template>

    <xsl:template match="tei:pb" mode="#all">
        <xsl:variable name="witness_id" select="if (@edRef) then replace(@edRef, '^#', '') else ''"/>
        <xsl:variable name="witness_label" select="if (local:has-multiple-witnesses(.))
            then (if ($witness_id != '') then local:witness-label(., $witness_id) else 'primary')
            else ''"/>
        <xsl:variable name="pb_type" select="if(@type) then @type else 'primary'"/>
        <span class="pb {$pb_type}" source="{@facs}" data-pb-type="{$pb_type}">
            <xsl:if test="$witness_label != ''">
                <xsl:attribute name="wit" select="$witness_label"/>
                <xsl:attribute name="data-witness" select="$witness_label"/>
            </xsl:if>
        </span>
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
    <xsl:template match="tei:lb" mode="#all">
        <xsl:variable name="witness_id" select="if (@edRef) then replace(@edRef, '^#', '') else ''"/>
        <xsl:variable name="witness_label" select="if (local:has-multiple-witnesses(.))
            then (if ($witness_id != '') then local:witness-label(., $witness_id) else 'primary')
            else ''"/>
        <xsl:element name="br">
            <xsl:attribute name="class" select="normalize-space(concat('lb ', local:resp-classes(.)))"/>
            <xsl:if test="$witness_label != ''">
                <xsl:attribute name="wit" select="$witness_label"/>
                <xsl:attribute name="data-witness" select="$witness_label"/>
            </xsl:if>
        </xsl:element>
    </xsl:template>
    <xsl:template match="tei:note">
        <xsl:choose>
            <xsl:when test="@anchored = 'true'">
                <!-- Anchored notes are displayed as inline text with a special class -->
                <span class="{normalize-space(concat('anchored-note ', local:resp-classes(.)))}">
                    <xsl:apply-templates/>
                </span>
            </xsl:when>
            <xsl:otherwise>
                <!-- Regular notes are displayed as footnote links -->
                <xsl:element name="a">
                    <xsl:if test="normalize-space(@resp) != ''">
                        <xsl:attribute name="class" select="local:resp-classes(.)"/>
                    </xsl:if>
                    <xsl:attribute name="name">
                        <xsl:text>fna_</xsl:text>
                        <xsl:number level="any" format="1" count="tei:note[not(@anchored = 'true')]"/>
                    </xsl:attribute>
                    <xsl:attribute name="href">
                        <xsl:text>#fn</xsl:text>
                        <xsl:number level="any" format="1" count="tei:note[not(@anchored = 'true')]"/>
                    </xsl:attribute>
                    <xsl:attribute name="title">
                        <xsl:value-of select="normalize-space(.)"/>
                    </xsl:attribute>
                    <sup>
                        <xsl:number level="any" format="1" count="tei:note[not(@anchored = 'true')]"/>
                    </sup>
                </xsl:element>
            </xsl:otherwise>
        </xsl:choose>
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
    <xsl:template match="tei:fw" mode="#all">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <xsl:choose>
            <xsl:when test="@type = 'catch'">
                <xsl:variable name="is_inline_context" as="xs:boolean"
                    select="exists(ancestor::tei:l | ancestor::tei:p | ancestor::tei:head)"/>
                <xsl:element name="{if ($is_inline_context) then 'span' else 'div'}">
                    <xsl:attribute name="class" select="normalize-space(concat('col catch ', $rendering, ' fw'))"/>
                    <xsl:apply-templates/>
                </xsl:element>
            </xsl:when>
            <xsl:when test="@type = 'footer'">
                <div class="row layer_counter {$rendering} fw">
                    <div class="col fw" />
                    <xsl:apply-templates/>
                </div>
            </xsl:when>
            <xsl:when test="@type = 'pageNum'">
                <div class="col page_number {$rendering} fw">
                    <xsl:apply-templates/>
                </div>
            </xsl:when>
            <xsl:when test="@type = 'sig'">
                <div class="col sig {$rendering} fw">
                    <xsl:apply-templates/>
                </div>
            </xsl:when>
            <xsl:when test="@type = 'footnote'">
                <span class="footnote {$rendering} fw">
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
                    <xsl:when test=". = 'sc'">
                        <xsl:text>smallcaps </xsl:text>
                        <!--Horizontale Linie-->
                    </xsl:when>

                </xsl:choose>
            </xsl:for-each>
        </xsl:if>
        <xsl:if test="normalize-space(@resp) != ''">
            <xsl:for-each select="tokenize(normalize-space(@resp), '\s+')">
                <xsl:value-of select="concat(replace(., '^#', ''), ' ')"/>
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
            <xsl:attribute name="id">
                <xsl:value-of select="@xml:id"/>
            </xsl:attribute>
            <xsl:apply-templates/>
        </span>
    </xsl:template>
    <xsl:template match="tei:p">
        <xsl:variable name="rendering">
            <xsl:call-template name="rendition_2_class"/>
        </xsl:variable>
        <p class="{$rendering}">
            <xsl:attribute name="id">
                <xsl:value-of select="@xml:id"/>
            </xsl:attribute>
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
    <xsl:template match="tei:link">
        <xsl:element name="a">
            <xsl:attribute name="href">
                <xsl:value-of select="@target"/>
            </xsl:attribute>
            <xsl:choose>
                <xsl:when test="normalize-space(text())">
                    <xsl:value-of select="."/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="@target"/>
                </xsl:otherwise>
            </xsl:choose>
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
    <!-- Improved tei:app template: wrap both lem and rdg in spans with wit, and add a space after each -->
    <xsl:template match="tei:app" mode="#all">
        <span class="app" id="{@xml:id}">
            <xsl:for-each select="tei:lem">
                <xsl:variable name="witness_label" select="local:witness-label(., substring-after(@wit, '#'))"/>
                <span class="rdg">
                    <xsl:if test="$witness_label != ''">
                        <xsl:attribute name="wit" select="$witness_label"/>
                    </xsl:if>
                    <xsl:apply-templates select="." mode="#current"/>
                </span>
                <xsl:text> </xsl:text>
            </xsl:for-each>
            <xsl:for-each select="tei:rdg">
                <xsl:variable name="witness_label" select="local:witness-label(., substring-after(@wit, '#'))"/>
                <span class="rdg">
                    <xsl:if test="$witness_label != ''">
                        <xsl:attribute name="wit" select="$witness_label"/>
                    </xsl:if>
                    <xsl:apply-templates select="." mode="#current"/>
                </span>
                <xsl:text> </xsl:text>
            </xsl:for-each>
        </span>
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
    
    <!-- Templates for replace-equals mode -->
    <xsl:template match="text()" mode="replace-equals">
        <xsl:value-of select="replace(., '=', '⹀')"/>
    </xsl:template>
    
    <xsl:template match="*" mode="replace-equals">
        <xsl:copy>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates mode="replace-equals"/>
        </xsl:copy>
    </xsl:template>

    <xsl:template match="tei:app" mode="replace-equals">
        <span class="app" id="{@xml:id}">
            <xsl:for-each select="tei:lem">
                <xsl:variable name="witness_label" select="local:witness-label(., substring-after(@wit, '#'))"/>
                <span class="rdg">
                    <xsl:if test="$witness_label != ''">
                        <xsl:attribute name="wit" select="$witness_label"/>
                    </xsl:if>
                    <xsl:apply-templates mode="replace-equals"/>
                </span>
                <xsl:text> </xsl:text>
            </xsl:for-each>
            <xsl:for-each select="tei:rdg">
                <xsl:variable name="witness_label" select="local:witness-label(., substring-after(@wit, '#'))"/>
                <span class="rdg">
                    <xsl:if test="$witness_label != ''">
                        <xsl:attribute name="wit" select="$witness_label"/>
                    </xsl:if>
                    <xsl:apply-templates mode="replace-equals"/>
                </span>
                <xsl:text> </xsl:text>
            </xsl:for-each>
        </span>
    </xsl:template>
    
</xsl:stylesheet>