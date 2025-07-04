<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    <xsl:variable name="fraktur_title" select="'Armesünderblätter Online'"/>
    <xsl:template match="/" name="nav_bar">
        <header>
            <nav class="navbar navbar-expand-lg bg-body-tertiary">
                <div class="container-fluid">
                    <a class="navbar-brand" href="index.html">
                        <xsl:value-of select="$fraktur_title"/>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">

                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Edition</a>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" href="about.html">Armesünderblätter</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="goals.html">Ziele</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="toc.html">Übersicht</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="punishments.html">Strafen</a>
                                    </li>

                                </ul>
                            </li>

                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"> Dokumentation</a>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" href="edition.html">Erschließung</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="usage.html">Nutzung</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="data.html">Daten</a>
                                    </li>
                                </ul>
                            </li>

                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Suche</a>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" href="person_search.html">Personensuche</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="search.html">Volltextsuche</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="./nosketch.html?corpname=flugblaetter&amp;q=q%3Cdoc%3E%22.*%22+&amp;viewmode=kwic&amp;attrs=word%2Clemma%2Cpos%2Cvocab%2Cid&amp;format=json&amp;structs=doc%2Chead%2Cp%2Clg%2Cl%2CplaceName%2Cquote%2Cbibl%2CpersName%2Cdate%2Ccit%2Cg&amp;kwicrightctx=45%23&amp;kwicleftctx=45%23&amp;refs=doc.id%2Cl.id%2Cp.id%2CplaceName.id%2CpersName.id%2Cdate.id%2Cdoc.title%2Cdoc.delinquent_sexes%2Cdoc.attrs%2Clg.type&amp;pagesize=10&amp;fromp=1&amp;selectQueryValue=url">
                                            Linguistische Suche
                                        </a>
                                    </li>
                                </ul>
                            </li>

                            <li class="nav-item dropdown disabled">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Über das Projekt</a>
                                <ul class="dropdown-menu">
                                    <li class="nav-item">
                                        <a class="dropdown-item" href="team.html">Team</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="dropdown-item" href="contact.html">Kontakt</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="dropdown-item" href="publications.html">Publikationen</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="dropdown-item" href="imprint.html">Impressum</a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
        <!-- <script src="https://use.edgefonts.net/unifrakturmaguntia.js" /> -->
    </xsl:template>
</xsl:stylesheet>
