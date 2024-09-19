<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    <xsl:template match="/" name="nav_bar">
        <header>
            <nav class="navbar navbar-expand-lg bg-body-tertiary">
                <div class="container-fluid">
                    <a class="navbar-brand" href="index.html">
                        <xsl:value-of select="$project_short_title"/>
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
                                        <a class="dropdown-item" href="imprint.html">Armesünderblätter</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="imprint.html">Ziele</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="toc.html">Übersicht</a>
                                    </li>
                                </ul>
                            </li>

                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"> Dokumentation</a>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" href="imprint.html">Erschließung</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="imprint.html">Nutzung</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="imprint.html">Daten</a>
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
                                        <!-- <a class="dropdown-item" href="nosketch.html">Linguistische Suche</a> -->
                                        <a class="dropdown-item" 
                                            href="./nosketch.html?corpname=flugblaetter&amp;q=q%3Cdoc%3E+%5Blemma%3D%22.*%22%5D&amp;viewmode=kwic&amp;attrs=word%2Clemma%2Cpos%2Cvocab%2Cid&amp;format=json&amp;structs=doc%2Chead%2Cp%2Clg%2Cl%2CplaceName%2Cquote%2Cbibl%2CpersName%2Cdate%2Ccit%2Cg&amp;kwicrightctx=100%23&amp;kwicleftctx=100%23&amp;refs=doc.id%2Cdoc.date%2C+doc.name&amp;pagesize=20&amp;fromp=1&amp;selectQueryValue=url"
                                        >
                                            Linguistische Suche
                                        </a>
                                    </li>
                                </ul>
                            </li>

                            <li class="nav-item dropdown disabled">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Über das Projekt</a>
                                <ul class="dropdown-menu">
                                    <li class="nav-item">
                                        <a class="dropdown-item" href="imprint.html">Team</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="dropdown-item" href="imprint.html">Kontakt</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="dropdown-item" href="imprint.html">Literatur</a>
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
    </xsl:template>
</xsl:stylesheet>