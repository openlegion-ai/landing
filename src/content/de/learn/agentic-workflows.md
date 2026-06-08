---
title: Agentischer Workflow - Muster, Sicherheit und Produktionsdesign
description: Ein agentischer Workflow ist ein mehrstufiger KI-Prozess, bei dem Agenten autonom Tools auswählen, Teilaufgaben delegieren und sich anhand von Zwischenergebnissen anpassen. Kernmuster, Fehlerquellen und Sicherheitsdesign.
slug: /learn/agentic-workflows
primary_keyword: agentischer Workflow
secondary_keywords:
  - agentische Workflow-Muster
  - agentische Workflow-Sicherheit
  - react loop ki agent
  - plan and execute ki
  - ki agent workflow design
date_published: "2026-05"
last_updated: "2026-05-27"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /comparison/langgraph
  - /comparison/crewai
---

# Agentischer Workflow: Muster, Sicherheit und Produktionsdesign

Ein agentischer Workflow ist ein mehrstufiger KI-Prozess, bei dem ein oder mehrere Agenten autonom entscheiden, welche Tools sie aufrufen, wann sie Teilaufgaben an andere Agenten delegieren und wie sie ihren Ansatz anhand von Zwischenergebnissen anpassen. Im Unterschied zu einer festen Pipeline, in der jeder Schritt hardcodiert ist und genau einmal ausgeführt wird, ist ein agentischer Workflow dynamisch: Der Agent liest seine Umgebung, denkt über den Zustand nach und wählt die nächste Aktion. Diese Autonomie ist das Merkmal. Sie ist auch die Angriffsfläche.

OpenLegion ist eine sicherheitsorientierte KI-Agenten-Plattform, die das Design agentischer Workflows als Ingenieurdisziplin betrachtet: Jeder Schritt läuft in einem isolierten Container, Anmeldedaten sind im Agentenprozess nie vorhanden, und jede Iterationsschleife hat eine harte Abbruchbedingung, die auf Infrastrukturebene erzwungen wird.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist ein agentischer Workflow?**
> Ein agentischer Workflow ist ein mehrstufiger KI-Prozess, bei dem autonome Agenten Tools auswählen, Teilaufgaben delegieren und ihren Ausführungsplan auf Basis von Zwischenergebnissen aktualisieren - im Gegensatz zu statischen Pipelines, bei denen jeder Schritt zur Entwurfszeit festgelegt ist.

## TL;DR

- **Vier Kernmuster**: ReAct-Schleife, Plan-und-Ausführung, Reflexionsschleife, paralleles Fan-Out. Jedes hat eigene Fehlerquellen.
- **ReAct** (Reason + Act, Yao et al. 2023) ist das am weitesten verbreitete Muster - eingesetzt in LangGraph, OpenAI Agents SDK, AutoGen und OpenLegion.
- **Primärer Angriffsvektor**: Prompt-Injection über Tool-Ergebnisse (OWASP LLM Top 10 2025, LLM02). Eine bösartige Webseite oder ein Dokument kann die nächste Aktion des Agenten kapern.
- **Unkontrollierte Schleifen sind keine Randfälle**: Eine Reflexions- oder ReAct-Schleife ohne harte Abbruchbedingung läuft, bis Ihr Budget erschöpft ist.
- **OpenLegion-Maßnahmen**: Schrittbudget pro Agent (harte Iterationsbegrenzung), Container-Isolation (ein kompromittierter Schritt kann nicht auf Anmeldedaten anderer Agenten zugreifen), kein Telemetrie.
- **Schrittbudget vs. Token-Budget**: Beide sind wichtig. Token-Budgets begrenzen Ausgaben; Schrittbudgets begrenzen unbegrenzte Reasoning-Schleifen.

## Was macht einen agentischen Workflow anders als eine Pipeline

Eine traditionelle Pipeline führt eine feste Sequenz aus: Schritt 1, Schritt 2, Schritt 3. Der Entwickler definiert jeden Übergang zur Entwurfszeit. Das System ist deterministisch: Gleiche Eingabe erzeugt denselben Ausführungspfad.

Ein agentischer Workflow führt an jedem Schritt einen Entscheidungspunkt ein. Der Agent liest den aktuellen Zustand, wählt eine Aktion (Tool aufrufen, an einen anderen Agenten delegieren, eine Abschlussnachricht produzieren oder erneut schleifen) und aktualisiert den Zustand. Der Ausführungspfad wird zur Laufzeit vom Modell bestimmt, nicht vom Entwickler.

Diese Unterscheidung hat direkte Sicherheitsauswirkungen. In einer festen Pipeline ist der Schadensradius eines kompromittierten Schritts auf die Ausgaben dieses Schritts begrenzt. In einem agentischen Workflow kann ein kompromittierter Schritt den Agenten anweisen, zusätzliche Aktionen vorzunehmen - externe APIs aufrufen, Daten exfiltrieren, bösartige Ausgaben erzeugen, die nachgelagerte Schritte betreffen. Der [KI-Agenten-Sicherheitsleitfaden](/learn/ai-agent-security) behandelt das vollständige Bedrohungsmodell; diese Seite konzentriert sich darauf, wie die Wahl des Workflow-Musters die Angriffsfläche beeinflusst.

## Die vier Kernmuster agentischer Workflows

### Muster 1: ReAct-Schleife (Reason + Act)

**Was es ist.** Eingeführt von Yao et al. (2023), verschränkt ReAct Reasoning-Traces mit Aktionsaufrufen in einer einzigen Schleife. Bei jedem Schritt produziert das Modell einen Thought (Überlegung zum aktuellen Zustand), eine Action (Tool-Aufruf oder Delegation) und eine Observation (das Tool-Ergebnis). Die Schleife läuft, bis das Modell eine Abschlussantwort produziert.

**Wo es eingesetzt wird.** ReAct ist die Standardschleife in LangGraph, OpenAI Agents SDK, AutoGen-Gruppenchat und OpenLegion. Es ist das am häufigsten eingesetzte agentische Workflow-Muster.

**Fehlerquellen:**
- **Unbegrenzte Schleife**: Ohne harte Iterationsbegrenzung kann ein ReAct-Agent endlos schleifen.
- **Prompt-Injection über Observation**: Der Observation-Schritt ist die primäre Angriffsfläche. OWASP LLM02 (Prompt Injection) ist das größte Risiko für ReAct-basierte Workflows.
- **Kontextfenster-Inflation**: Lange ReAct-Ketten häufen Thought/Action/Observation-Tripel im Kontext an.

**OpenLegion-Maßnahme**: Schrittbudget pro Agent (maximale Iterationsanzahl vom Orchestrator erzwungen) plus Container-Isolation.

### Muster 2: Plan-und-Ausführung

**Was es ist.** Ein Planer-Agent erzeugt vorab eine vollständige Aufgabenzerlegung. Ein oder mehrere Ausführungs-Agenten führen dann jeden Schritt des Plans aus, ohne zwischen den Schritten neu zu planen.

**Vorteile gegenüber ReAct.** Die Trennung von Planung und Ausführung reduziert die Token-Kosten erheblich - das schwere Reasoning findet einmal im Planer statt. Außerdem ist der Ausführungspfad vor dem Start inspizierbar.

**Fehlerquellen:**
- **Plandrift**: Wenn ein Ausführungs-Agent auf ein unerwartetes Ergebnis stößt, kann er mit dem veralteten Plan fortfahren.
- **Einzelner Fehlerpunkt beim Planer**: Eine Prompt-Injection, die die Planer-Ausgabe korrumpiert, wirkt sich auf jeden nachfolgenden Ausführungsschritt aus.
- **Kein adaptives Neuplanung**: Reine Plan-und-Ausführung kann keine Aufgaben bewältigen, bei denen Zwischenergebnisse wesentlich ändern, was nachfolgende Schritte tun sollen.

**OpenLegion-Maßnahme**: Planer und Ausführer laufen in separaten Containern. Schadensradius auf die Planer-Container-Ausgabe begrenzt.

### Muster 3: Reflexionsschleife

**Was es ist.** Ein Agent (oder ein separater Kritiker-Agent) bewertet seine eigene Ausgabe und iteriert, bis ein Qualitätsschwellenwert erreicht ist. Häufig bei der Inhaltserstellung, beim Codeschreiben und bei Analyseaufgaben.

**Fehlerquellen:**
- **Unkontrollierte Iteration ohne Abbruchbedingung**: Wenn der Kritiker immer etwas zum Verbessern findet, läuft die Schleife endlos.
- **Sich selbst verstärkende Fehler**: Ein Modell, das die Aufgabe missversteht, erzeugt Kritiken, die das Missverständnis verstärken.
- **Kostenverstärkung**: Eine 10-Runden-Reflexionsschleife kostet das 10-fache der Basisgenerierung.

**OpenLegion-Maßnahme**: Schrittbudget pro Agent erzwingt eine maximale Reflexionsanzahl auf Infrastrukturebene.

### Muster 4: Paralleles Fan-Out

**Was es ist.** Mehrere Agenten führen unabhängige Teilaufgaben gleichzeitig aus. Ein Synthese-Agent wartet, bis alle parallelen Zweige abgeschlossen sind, und führt dann die Ergebnisse zusammen.

**Fehlerquellen:**
- **Kostenverstärkung**: N parallele Agenten kosten das N-fache des seriellen Äquivalents.
- **Synthese-Vergiftung**: Eine bösartige Zweig-Ausgabe kann das zusammengeführte Ergebnis korrumpieren.
- **Nebenläufigkeits- und Shared-State-Konflikte**: CVE-2025-64168 (Agno, CVSS 7.1) demonstrierte dies: eine Race Condition im gemeinsamen Sitzungszustand unter asynchroner Nebenläufigkeit setzte Daten eines Benutzers einem anderen aus.

**OpenLegion-Maßnahme**: Jeder parallele Agent läuft in seinem eigenen isolierten Docker-Container. Kein gemeinsamer veränderlicher Zustand zwischen Zweigen.

## Sicherheitsdesign für agentische Workflows

### Bedrohung 1: Prompt-Injection über Tool-Ergebnisse

Tool-Ergebnisse sind der primäre Injektionsvektor in agentischen Workflows. OWASP LLM02 (Prompt Injection) ist das größte Risiko für LLM-Anwendungen in der Top 10 von 2025. Für agentische Workflows wird das Risiko verstärkt, weil Agenten Tool-Zugang haben - eine injizierte Anweisung kann reale Aktionen verursachen.

OpenLegion wendet Unicode-Bereinigung bei der Tool-Ergebnis-Aufnahme an (56 Kontrollpunkte für bidi-Overrides, Tag-Zeichen und Zeichen mit Nullbreite) plus Container-Isolation, um den Schadensradius einer erfolgreichen Injection zu begrenzen.

### Bedrohung 2: Tool-Aufruf-Verstärkung

Ein Agent, der ein teures Tool in einer ReAct-Schleife ohne Schrittbudget aufruft, kann Hunderte von Tool-Aufrufen machen, bevor der Entwickler es bemerkt. Reale Vorfälle beinhalten nachtliche Agentenläufe, die Tausende von API-Aufrufen an Drittanbieter-Dienste generierten und unerwartete Rechnungen sowie Ratenbeschränkungssperrungen auslösten.

OpenLegion erzwingt beides: Token-Budget pro Agent (Ausgabenobergrenze) und Schrittbudget pro Agent (Iterationsobergrenze). Jede Begrenzung stoppt den Agenten, wenn sie erreicht wird.

### Bedrohung 3: Anmeldedaten-Exposition bei der Delegation

In Frameworks, bei denen Agenten einen Python-Prozess teilen, hat Agent B standardmäßig Zugang zu den Umgebungsvariablen von Agent A. Ein kompromittierter Delegationsschritt kann alle dem Workflow verfügbaren Anmeldedaten preisgeben.

OpenLegion verwendet Vault-Proxy-Anmeldedaten-Injektion über den Mesh Host. Der Container von Agent B erhält nur die Anmeldedaten, die ihm explizit in der Fleet-ACL-Matrix zugewiesen wurden - nicht die Anmeldedaten von Agent A.

### Bedrohung 4: Unbegrenzte Rekursion und Selbst-Spawning

Ein agentischer Workflow, der Agenten erlaubt, ohne Begrenzung Sub-Agenten zu erzeugen, kann zu exponentieller Rekursion manipuliert werden. OpenLegion begrenzt dies: Die Berechtigung `can_spawn` erfordert eine explizite Administratorgenehmigung, die Sub-Agent-Tiefe ist durch die Mesh-Konfiguration begrenzt, und Fleet-Vorlagen definieren eine maximale Agentenanzahl.

## Schrittbudget vs. Token-Budget: Warum Sie beides brauchen

Token-Budgets begrenzen die Gesamtausgaben pro Agent pro Tag. Sie sind notwendig, aber nicht ausreichend. Ein Token-Budget verhindert nicht, dass eine ReAct-Schleife 500 Iterationen mit günstigen Tools ausführt. Ein Schrittbudget begrenzt die Anzahl der Reasoning-Iterationen oder Tool-Aufrufe, unabhängig von den Token-Kosten.

OpenLegion implementiert beides: Token-Budget, erzwungen durch den Cost Tracker in Zone 2, und Schrittbudget, erzwungen durch den Orchestrator auf Infrastrukturebene.

## Design von agentischen Workflows für die Produktion

### Das richtige Muster für die Aufgabe wählen

| Aufgabentyp | Empfohlenes Muster | Warum |
|---|---|---|
| **Offene Recherche** | ReAct-Schleife mit Schrittbudget | Benötigt adaptive Tool-Auswahl; Schleife begrenzen |
| **Strukturierte mehrstufige Aufgabe** | Plan-und-Ausführung | Inspektierbarer Plan; reduziert Token-Kosten |
| **Qualitätssensible Generierung** | Reflexionsschleife mit Schrittbegrenzung | Selbstkorrektur; harter Stopp verhindert Endlosschleifen |
| **Parallele Datenerfassung** | Fan-Out + Synthese | Unabhängige Teilaufgaben; Isolation pro Agent |
| **Verarbeitung langer Dokumente** | Fan-Out + sequentielle Zusammenführung | Parallelisiert die chunk-weise Verarbeitung |

### Abbruchbedingungen vor dem Einsatz definieren

Jede Schleife in einem agentischen Workflow benötigt eine explizite Abbruchbedingung, die auf Infrastrukturebene erzwungen wird. Wenn das Modell entscheidet, wann es stoppt, kann eine Prompt-Injection es am Stoppen hindern.

### Ausgaben an Schrittgrenzen validieren

Jede Schrittgrenze ist eine Möglichkeit, zu validieren, dass die Ausgabe dem erwarteten Schema entspricht, bevor sie an den nächsten Schritt weitergegeben wird. Die Fleet-Modell-Koordination von OpenLegion wendet Ausgabe-Validatoren an jedem Übergabepunkt an. Implementierungsdetails finden Sie im [KI-Agenten-Orchestrierungsleitfaden](/learn/ai-agent-orchestration).

### Berechtigungen auf das erforderliche Minimum beschränken

Jeder Agent sollte nur die Tools und Berechtigungen haben, die er für seinen spezifischen Schritt benötigt. Zu weit berechtigte Agenten verstärken den Schadensradius jeder Kompromittierung. Die ACL-Matrix pro Agent in der OpenLegion-Fleet-Konfiguration erzwingt Mindestberechtigungen auf Orchestratorebene.

## Agentische Workflow-Frameworks: Muster-Unterstützungsvergleich

| Framework | ReAct | Plan-und-Ausführung | Reflexion | Fan-Out | Schrittbudget | Container-Isolation |
|---|---|---|---|---|---|---|
| **OpenLegion** | Ja | Ja | Ja | Ja | Ja (hart) | Ja (obligatorisch) |
| **LangGraph** | Ja | Ja | Ja | Ja | Kein integriertes | Nein |
| **CrewAI** | Ja (Flows) | Ja (Crews) | Begrenzt | Ja (parallel) | Nein | Nein (nur CodeInterpreter) |
| **OpenAI Agents SDK** | Ja | Begrenzt | Begrenzt | Ja (handoffs) | Nein | Nein |
| **AutoGen** | Ja | Ja | Ja | Ja (group chat) | Nein | Nur Docker für Code |

Für einen detaillierten Sicherheits- und Architekturvergleich dieser Frameworks, siehe den [KI-Agenten-Frameworks-Vergleich](/learn/ai-agent-frameworks).

## OpenLegions Einschätzung

Agentische Workflows sind der Punkt, an dem die Sicherheitsschulden der meisten Frameworks in der Produktion sichtbar werden. ReAct-Schleifen ohne Schrittbudgets haben fünf- und sechsstellige unerwartete API-Rechnungen erzeugt. CVE-2025-64168 (Agno, CVSS 7.1, Oktober 2025) zeigte, dass gleichzeitige agentische Workflows, die einen Python-Prozess teilen, den Sitzungszustand eines Benutzers unter hoher asynchroner Last einem anderen preisgeben können. OWASP LLM02 (Prompt Injection, Top 10 2025) identifiziert Tool-Ergebnis-Injection als den primären Angriffsvektor gegen ReAct-basierte agentische Workflows.

OpenLegion adressiert drei Eigenschaften architektonisch: harte Schrittbudgets (maximale Iterationsanzahl vom Orchestrator erzwungen), Container-Isolation pro Agent (kein gemeinsamer veränderlicher Zustand zwischen parallelen Zweigen) und Vault-Proxy-Anmeldedaten-Injektion (Delegations-Übergaben werden durch Zone 2 geleitet). Diese sind keine Konfigurationsoptionen - sie sind die Standardarchitektur.

Der Kompromiss: OpenLegion hat ca. 59 GitHub-Sterne gegenüber LangGraph ca. 25.200 und CrewAI ca. 44.600. Für einen Vergleich, wie diese Muster in verschiedenen Frameworks implementiert werden, siehe den [KI-Agenten-Frameworks-Vergleich](/learn/ai-agent-frameworks).

## CTA

**Bauen Sie agentische Workflows mit harten Abbruchbedingungen, nicht mit erhofften.**
[Loslegen](https://app.openlegion.ai) | [Dokumentation](https://docs.openlegion.ai) | [Lernen: KI-Agenten-Orchestrierung](/learn/ai-agent-orchestration)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist ein agentischer Workflow?

Ein agentischer Workflow ist ein mehrstufiger KI-Prozess, bei dem ein oder mehrere Agenten autonom Tools auswählen, Teilaufgaben an andere Agenten delegieren und ihren Ausführungsplan anhand von Zwischenergebnissen anpassen. Im Gegensatz zu statischen Pipelines mit festen Schritten wird der Ausführungspfad eines agentischen Workflows zur Laufzeit durch das Modell-Reasoning bestimmt. Die vier Kernmuster sind ReAct-Schleife, Plan-und-Ausführung, Reflexionsschleife und paralleles Fan-Out - jedes mit eigenen Fehlerquellen und Sicherheitsauswirkungen.

### Was ist das ReAct-Muster in agentischen Workflows?

ReAct (Reason + Act) wurde 2023 von Yao et al. eingeführt und verschränkt Reasoning-Traces mit Tool-Aufrufen in einer einzigen Schleife. Bei jedem Schritt produziert das Modell einen Thought (Reasoning), eine Action (Tool-Aufruf) und eine Observation (Tool-Ergebnis). ReAct ist das Standard-Workflow-Muster in LangGraph, OpenAI Agents SDK, AutoGen und OpenLegion. Seine primären Fehlerquellen sind unbegrenzte Iteration und Prompt-Injection über Tool-Ergebnisse.

### Wie verhindert man unkontrollierte agentische Workflow-Schleifen?

Der einzige zuverlässige Weg, unkontrollierte Schleifen zu verhindern, ist das Erzwingen einer Abbruchbedingung auf Infrastrukturebene - nicht darauf zu vertrauen, dass das Modell selbst stoppt. Zwei Kontrollen sind erforderlich: ein Schrittbudget (maximale Iterations- oder Tool-Aufruf-Anzahl, vom Orchestrator erzwungen) und ein Token-Budget (maximale Ausgaben, vom Cost Tracker erzwungen). Token-Budgets allein stoppen keine hochfrequenten Günstig-Tool-Schleifen. Schrittbudgets allein begrenzen keine teuren LLM-Kosten pro Iteration. OpenLegion erzwingt beides pro Agent als harte Obergrenzen.

### Was ist Plan-und-Ausführung in agentischen Workflows?

Plan-und-Ausführung unterteilt einen agentischen Workflow in zwei Phasen: Ein Planer-Agent erstellt vorab eine vollständige Aufgabenzerlegung, und ein oder mehrere Ausführungs-Agenten führen jeden Schritt ohne Neuplanung aus. Dies reduziert die Token-Kosten im Vergleich zu ReAct (schweres Reasoning einmal statt bei jedem Schritt) und macht den Ausführungspfad vor dem Start inspizierbar. Die Hauptfehlerquelle ist Plandrift: Wenn ein Ausführungs-Agent auf ein unerwartetes Ergebnis stößt, kann er mit einem veralteten Plan fortfahren, anstatt die Abweichung zu melden.

### Was ist das Hauptsicherheitsrisiko in agentischen Workflows?

Der primäre Angriffsvektor ist Prompt-Injection über Tool-Ergebnisse (OWASP LLM02, Top 10 2025). Wenn ein Agent eine Webseite, Datei, Datenbankeinträge oder externe API-Antworten liest, kommt dieser Inhalt als vertrauenswürdige Eingabe an. Ein bösartiges Dokument kann Anweisungen enthalten, die den Agenten zu unbeabsichtigten Aktionen umlenken. Gegenmaßnahmen umfassen Unicode-Bereinigung bei der Tool-Ergebnis-Aufnahme, Ausgabe-Schema-Validierung an Schrittgrenzen und Container-Isolation zur Begrenzung des Schadensradius einer erfolgreichen Injection.

### Wie funktioniert paralleles Fan-Out in agentischen Workflows?

Paralleles Fan-Out lässt mehrere Agenten gleichzeitig an unabhängigen Teilaufgaben arbeiten und führt die Ergebnisse dann in einem Synthese-Schritt zusammen. Es reduziert die Wanduhrzeit für Aufgaben, die sich in unabhängige Arbeitsströme aufteilen lassen. Die Fehlerquellen sind Kostenverstärkung (N Agenten kosten N-mal mehr), Synthese-Vergiftung (eine bösartige Zweig-Ausgabe korrumpiert das zusammengeführte Ergebnis) und Shared-State-Konflikte in Frameworks, bei denen gleichzeitige Agenten veränderlichen Prozesszustand teilen. OpenLegion lässt jeden parallelen Agenten in einem isolierten Docker-Container mit eigenem Zustand laufen, verhindert Shared-State-Konflikte und begrenzt jeden Zweig unabhängig.

### Was ist Plandrift in agentischen Workflows?

Plandrift tritt in Plan-und-Ausführungs-Workflows auf, wenn Ausführungs-Agenten auf unerwartete Zwischenergebnisse stoßen, aber den ursprünglichen Plan weiter ausführen, anstatt die Abweichung zu melden. Gegenmaßnahmen umfassen explizite Plan-Validierungsprüfpunkte, menschliche Genehmigungsstufen bei kritischen Planschritten und strukturierte Übergabeprotokolle, die Diskrepanzen vor dem Fortfahren aufzeigen. OpenLegion-Fleet-Modell-Koordination unterstützt menschliche Prüfpunkte über Kanal-Integrationen an jedem Übergabepunkt.

### Wie unterscheidet sich das agentische Workflow-Design von der KI-Agenten-Orchestrierung?

Das agentische Workflow-Design konzentriert sich auf die Anatomie auf Schrittebene: welches Muster (ReAct, Plan-und-Ausführung, Reflexion, Fan-Out), welche Abbruchbedingungen, wie Tool-Ergebnisse validiert werden und wie Anmeldedaten bei jedem Schritt abgegrenzt werden. Die KI-Agenten-Orchestrierung konzentriert sich auf die Fleet-Ebene-Koordination: wie mehrere Workflows sequenziert werden, wie Agenten Arbeit aneinander übergeben, wie gemeinsamer Zustand über ein Multi-Agenten-System verwaltet wird. Der [KI-Agenten-Orchestrierungsleitfaden](/learn/ai-agent-orchestration) behandelt Fleet-Ebene-Koordinationsprimitiven, die auf den hier beschriebenen Workflow-Mustern aufbauen.
