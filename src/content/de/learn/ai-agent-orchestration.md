---
title: KI-Agenten-Orchestrierung — Agenten koordinieren
description: >-
 Container-isolierte Multi-Agenten-Runtime mit Fleet-Modell-Koordination
 (Blackboard + Pub/Sub + Handoff), Credential-Vaulting und Pro-Agent-Budgets.
slug: /learn/ai-agent-orchestration
primary_keyword: ki-agenten-orchestrierung
secondary_keywords:
 - multi-agent coordination
 - fleet model coordination
 - ai agent task routing
 - blackboard pub/sub handoff
 - agentic ai orchestration
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-platform
 - /learn/ai-agent-security
 - /learn/ai-agent-frameworks
 - /comparison
---

# KI-Agenten-Orchestrierung: Agenten-Flotten koordinieren, governen und kontrollieren

Wenn ein einzelner KI-Agent eine Aufgabe ausführt, ist Orchestrierung einfach — es gibt nichts zu koordinieren. Sobald Sie zwei oder mehr Agenten einsetzen, die Kontext teilen, Tasks übergeben oder auf denselben Daten arbeiten müssen, wird Orchestrierung zum zentralen Engineering-Problem. Und es geht nicht nur um Nachrichten-Routing.

**KI-Agenten-Orchestrierung** ist das System, das entscheidet, welcher Agent läuft, wann, mit welchen Daten, unter welchen Beschränkungen und zu welchen Kosten. OpenLegion behandelt Orchestrierung als untrennbar von Sicherheit: Jede Routing-Entscheidung passiert Container-Isolation, Credential-Vaulting und Budgetdurchsetzung. Bringen Sie eigene LLM-API-Keys mit. Kein Aufschlag auf Modellnutzung.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist KI-Agenten-Orchestrierung?**
> KI-Agenten-Orchestrierung ist die Koordinationsschicht, die Task-Zuweisung, Datenfluss, Sequenzierung und Governance über mehrere autonome KI-Agenten verwaltet. Sie bestimmt, welcher Agent welche Aufgabe übernimmt, erzwingt Zugriffskontrollen, verfolgt Kosten und pflegt gemeinsamen Zustand — sie macht aus unabhängigen Agenten eine governte Flotte.

## Auf einen Blick

- **Orchestrierung = Koordination + Governance.** Agenten zu routen, ohne Credentials, Budgets und Isolation zu kontrollieren, ist keine Orchestrierung — es ist eine Haftung.
- **Fleet-Modell-Koordination** — OpenLegion nutzt Blackboard-, Pub/Sub- und Handoff-Primitive für Task-Routing. Kein LLM-"CEO-Agent", der intransparente Routing-Entscheidungen trifft.
- **Fleet-Modell-Orchestrierung** — Sequenzielle und parallele Ausführung via Fleet-Modell-Koordination mit Blackboard-Koordination und Pub/Sub-Messaging. Fleet-Modell, keine Hierarchie.
- **Credential-Isolation ist eine Orchestrierungs-Sache** — Wenn Agent A an Agent B übergibt, sollte keiner die API-Keys des anderen sehen oder Berechtigungen eskalieren können.
- **Kostenkontrollen pro Agent** — Jeder Agent in der Flotte hat sein eigenes tägliches/monatliches Budget mit Hartabschaltung. Ein außer Kontrolle geratener Agent leert nicht Ihr ganzes Konto.
- **Gemeinsamer Zustand via Blackboard** — Agenten kommunizieren über ein zentrales SQLite-Blackboard mit PubSub-Messaging. Keine direkten Agent-zu-Agent-Verbindungen.

## Was KI-Agenten-Orchestrierung von Workflow-Automatisierung unterscheidet

Traditionelle Workflow-Automatisierung (Zapier, n8n, Make) bewegt Daten zwischen vordefinierten Schritten. Jeder Schritt tut jedes Mal genau eine Sache. Das System ist designbedingt deterministisch.

Agentische KI-Orchestrierung fügt eine Autonomie-Schicht hinzu. Jeder Agent im Workflow kann Entscheidungen treffen, Tools aufrufen, Inhalte generieren und Aktionen ausführen, die nicht explizit programmiert wurden. Diese Autonomie ist der Sinn der Sache — und sie macht Orchestrierung ohne richtige Kontrollen gefährlich.

Wenn ein Agent entscheiden kann, eine externe API aufzurufen, in eine Datenbank zu schreiben oder das Web zu durchsuchen, muss die Orchestrierungsschicht Fragen beantworten, denen traditionelle Workflow-Tools nie begegnen:

- Hat dieser Agent die Berechtigung, dieses Tool zu nutzen?
- Sollte dieser Agent die Credentials für jene API sehen?
- Wie viel hat dieser Agent heute ausgegeben, und soll er weitermachen?
- Wenn dieser Agent über Prompt Injection kompromittiert wird, wie groß ist der Blast Radius?

Deshalb behandelt OpenLegion [KI-Agenten-Sicherheit](/learn/ai-agent-security) und Orchestrierung als dasselbe System, nicht als separate, nachträglich verschraubte Module.

## Patterns der KI-Agenten-Orchestrierung

### Sequenzielle Orchestrierung

Agenten führen einer nach dem anderen in definierter Reihenfolge aus. Die Ausgabe jedes Agenten wird zur Eingabe des nächsten. Geeignet für Pipelines mit klaren Übergabepunkten.

**Beispiel: Content-Produktions-Pipeline.**
Researcher-Agent → Writer-Agent → Editor-Agent. Der Researcher sammelt Quellen und erstellt ein Briefing. Der Writer produziert einen Entwurf aus dem Briefing. Der Editor prüft und gibt die finale Fassung aus. Jeder Agent läuft in seinem eigenen Container, sieht nur die eigenen Credentials und hat ein eigenes Token-Budget.

### Parallele Orchestrierung

Mehrere Agenten laufen simultan an unabhängigen Teilaufgaben. Ergebnisse werden an einem Synchronisationspunkt zusammengeführt. Geeignet für Aufgaben, die in unabhängige Arbeitsströme zerfallen.

**Beispiel: Wettbewerbsanalyse.**
Drei Research-Agenten laufen parallel — einer pro Wettbewerber — und scrapen jeweils öffentliche Doku, GitHub-Repos und Preisseiten. Ein Synthesis-Agent wartet auf alle drei und produziert einen einheitlichen Vergleich. Jeder parallele Agent operiert in seinem eigenen isolierten Container mit eigener Budget-Obergrenze.

### Blackboard-Koordination und Pub/Sub-Messaging

OpenLegion nutzt ein Fleet-Modell, keine Hierarchie. Alle Agenten kommunizieren über ein zentrales Blackboard (SQLite-basierter gemeinsamer Zustand) mit Pub/Sub-Messaging, das vom Mesh Host gehandhabt wird. Es gibt keinen "CEO-Agenten" oder Supervisor-Agenten, der Routing-Entscheidungen trifft — die Fleet-Modell-Koordination definiert die Ausführungsreihenfolge, und das Blackboard liefert den gemeinsamen Kontext, den Agenten während der Ausführung lesen und beschreiben. Das macht Koordination auditierbar.

## Warum Isolation, Vault und Budget-Kontrollen Orchestrierungs-Sachen sind

Die meisten [KI-Agenten-Frameworks](/learn/ai-agent-frameworks) behandeln Sicherheit als etwas, das man hinzufügt, nachdem Orchestrierung funktioniert. Agent-Routing ist ein Modul. Credential-Verwaltung ist ein separates Anliegen. Kosten-Tracking ist ein Observability-Add-on.

Diese Trennung ist architektonisch falsch. Hier ist warum:

### Credential-Isolation während Handoffs

Wenn Agent A eine Aufgabe abschließt und an Agent B übergibt, verwaltet die Orchestrierungsschicht den Übergang. Teilen beide Agenten denselben Prozessraum (wie in CrewAI-Crews oder LangGraph-Graphen, die in einem einzelnen Python-Prozess laufen), gibt es keinen Mechanismus, der Agent B daran hindert, auf Agent As Credentials über gemeinsamen Speicher zuzugreifen.

OpenLegion erzwingt Credential-Isolation auf Orchestrierungsebene. Jeder Agent läuft in seinem eigenen Docker-Container. Der Vault-Proxy injiziert Credentials pro Agent — Agent As API-Keys sind nie in Agent Bs Container präsent. Die Orchestrierungsschicht routet den Handoff über den Mesh Host (Zone 2), nicht über direkte Agent-zu-Agent-Kommunikation.

### Budgetdurchsetzung als Orchestrierungslogik

In einem Multi-Agenten-Workflow verteilen sich Token-Kosten ungleich. Ein Research-Agent kann das 10-fache eines Formatting-Agenten verbrauchen. Ohne Pro-Agent-Budgets können Sie nur ein globales Limit setzen — was bedeutet, dass ein "geschwätziger" Agent andere aushungern kann.

OpenLegions Orchestrator verfolgt Token-Verbrauch pro Agent in Echtzeit. Wenn ein Agent sein tägliches oder monatliches Cap erreicht, hält der Orchestrator diesen spezifischen Agenten an und routet die Pipeline um oder pausiert sie — ohne die gesamte Pipeline zu killen. Das ist Orchestrierungslogik, nicht nur Monitoring.

### Berechtigungsdurchsetzung über die Flotte

In einer Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff) hat jeder Agent ein spezifisches Berechtigungs-Set. Die Pro-Agent-ACL-Matrix definiert, welche Tools jeder Agent aufrufen darf, welche Dateien er ansprechen kann und welche Mesh-Operationen er ausführen darf. Der Orchestrator setzt diese Beschränkungen an jedem Übergangspunkt durch.

Das bedeutet, Sie können den gesamten Workflow statisch auditieren — bevor irgendein Agent läuft — und verifizieren, dass kein Agent Berechtigungen hat, die er nicht haben sollte.

## Konkreter Multi-Agenten-Workflow: Dev-Team

So sieht ein Dev-Team-Workflow in OpenLegion aus, von der Projekterstellung bis zum Deployment:

**Schritt 1: Team in YAML definieren.**
Drei Agenten: PM (Projektmanager), Engineer, Reviewer. Der PM zerlegt Tasks. Der Engineer schreibt Code. Der Reviewer prüft die Ausgabe.

**Schritt 2: Berechtigungen pro Agent setzen.**
Der PM kann Projektdateien lesen und auf das Blackboard schreiben. Der Engineer kann Code ausführen, den Browser ansprechen und Dateien schreiben. Der Reviewer kann alle Ausgaben lesen, aber keinen Code ausführen und keine externen API-Aufrufe machen.

**Schritt 3: Budgets pro Agent setzen.**
PM: 2 $/Tag (meist Planung, niedriger Token-Verbrauch). Engineer: 15 $/Tag (intensive Code-Generierung). Reviewer: 5 $/Tag (Analyse und Feedback). Monatliche Caps verhindern kumulative Überschreitungen.

**Schritt 4: Deployen.**
`openlegion start` stellt drei isolierte Container bereit, injiziert die passenden Credentials per Vault-Proxy in jeden und startet die Flotte. Das Dashboard zeigt Token-Verbrauch in Echtzeit, Kosten-Tracking und Streaming-Output pro Agent.

**Schritt 5: Monitoren und auditieren.**
Auditierbare Fleet-Modell-Koordination bedeutet, dass jeder Workflow-Schritt explizit und nachvollziehbar ist. Das integrierte Request-Tracing-System zeichnet Task-Übergänge, Tool-Calls und Token-Ausgaben für Echtzeit-Observability auf — ohne intransparente LLM-Entscheidungslogs parsen zu müssen.

## KI-Agenten-Orchestrierungs-Tools im Vergleich

| Funktion | OpenLegion | LangGraph | CrewAI | AutoGen |
|---|---|---|---|---|
| **Orchestrierungsmodell** | Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff) | Programmatischer StateGraph | Rollenbasierte Crews + event-driven Flows | Konversationsbasierter Group Chat |
| **Agenten-Isolation** | Docker-Container pro Agent (verpflichtend) | Nicht integriert | Gemeinsamer Python-Prozess | Docker nur für Code-Ausführung |
| **Credential-Verwaltung** | Vault-Proxy — Blind-Injection | Umgebungsvariablen | Umgebungsvariablen | Umgebungsvariablen |
| **Budget-Kontrollen** | Pro Agent täglich/monatlich mit Hartabschaltung | Keine | Keine | Keine |
| **Task-Routing** | Fleet-Modell — Blackboard + Pub/Sub + Handoff (kein CEO-Agent) | Konditionale Kanten (code-definiert) | Hierarchischer Manager-Agent oder sequenziell | RoundRobin, Selector, Swarm, GraphFlow |
| **Gemeinsamer Zustand** | Blackboard (SQLite) mit PubSub | StateGraph mit Checkpointing | Geteilte Crew-Memory | Message-Passing zwischen Agenten |
| **Human-in-the-Loop** | Über Channel-Integrationen unterstützt | Natives `interrupt()`-API mit Time-Travel | Unterstützt | UserProxy-Agent |
| **Multi-Channel** | CLI, Telegram, Discord, Slack, WhatsApp + Webhooks | Eigene Integration nötig | Eigene Integration nötig | Eigene Integration nötig |

Für Teams, die agentische KI-Orchestrierungs-Frameworks bewerten, ist der entscheidende Unterscheider, ob die Orchestrierungsschicht die Agenten governiert oder nur Nachrichten zwischen ihnen routet. LangGraph bietet die flexibelste programmatische Kontrolle. CrewAI das intuitivste rollenbasierte Design. AutoGen liefert Konversationsmuster. OpenLegion fügt Governance — Isolation, Credentials und Kosten — als native Orchestrierungs-Primitive hinzu.

Für einen tieferen Vergleich siehe unseren vollständigen [KI-Agenten-Frameworks-Vergleich](/learn/ai-agent-frameworks).

## CTA

**Bereit, sichere Agenten-Flotten zu orchestrieren?**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist KI-Agenten-Orchestrierung?

KI-Agenten-Orchestrierung ist die Koordinationsschicht, die verwaltet, wie mehrere autonome KI-Agenten zusammenarbeiten. Sie übernimmt Task-Zuweisung, Sequenzierung, Datenfluss zwischen Agenten, Zugriffskontrolle, Kosten-Tracking und Verwaltung gemeinsamen Zustands. Ohne Orchestrierung sind Multi-Agenten-Systeme nur isolierte Agenten, die unabhängig laufen.

### Was ist agentische KI-Orchestrierung?

Agentische KI-Orchestrierung bezeichnet speziell die Koordination von KI-Agenten mit Autonomie — Agenten, die Entscheidungen treffen, Tools aufrufen und über vordefinierte Schritte hinaus handeln können. Anders als traditionelle Workflow-Automatisierung muss agentische Orchestrierung unvorhersehbares Agentenverhalten berücksichtigen, was Credential-Isolation, Berechtigungsdurchsetzung und Budget-Kontrollen auf Orchestrierungsebene erfordert.

### Was ist eine KI-Agenten-Orchestrierungs-Plattform?

Eine KI-Agenten-Orchestrierungs-Plattform bietet verwaltete Infrastruktur für die Koordination von Multi-Agenten-Workflows. Über einfaches Routing hinaus übernimmt eine Plattform Container-Provisionierung, Credential-Vaulting, Kosten-Tracking und Observability. OpenLegion ist eine [KI-Agenten-Plattform](/learn/ai-agent-platform), die Orchestrierung und Governance als dasselbe System behandelt — jede Routing-Entscheidung passiert Isolation und Kostenkontrollen.

### Wie orchestriert man mehrere KI-Agenten in Produktion?

In Produktion erfordert Multi-Agenten-Orchestrierung vier Dinge über einen funktionierenden Prototyp hinaus: Laufzeit-Isolation (jeder Agent in seinem eigenen Container), Credential-Trennung (keine geteilten API-Keys zwischen Agenten), Budgetdurchsetzung (Pro-Agent-Kostenlimits mit Hartabschaltungen) und auditierbares Task-Routing. OpenLegion erledigt alle vier über Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff), die über isolierte Docker-Container mit Vault-Proxy für Credential-Verwaltung ausgespielt wird.

### Wie funktionieren Kostenkontrollen in KI-Agenten-Orchestrierung?

OpenLegion erzwingt tägliche und monatliche Token-Budgets pro Agent mit automatischer Hartabschaltung. Wenn ein Agent sein Limit erreicht, hält der Orchestrator diesen spezifischen Agenten an, ohne den Rest der Pipeline zu killen. Das verhindert, dass ein einzelner geschwätziger Agent das gesamte Projektbudget verbraucht. Kosten werden in Echtzeit erfasst und sind im Flotten-Dashboard sichtbar.

### Was ist der Unterschied zwischen LLM-basierter und Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff)?

LLM-basierte Orchestrierung nutzt ein KI-Modell (einen "CEO-Agenten"), um zur Laufzeit zu entscheiden, welcher Agent welche Aufgabe übernimmt. Das ist flexibel, aber intransparent — Sie können Routing-Entscheidungen nicht vorab vorhersagen oder auditieren. Auditierbare Fleet-Modell-Koordination nutzt vordefinierte Regeln (im Fall von OpenLegion Fleet-Modell-Koordination), die vor jedem Agentenlauf auditierbar sind. Sie wissen genau, welcher Agent was übernimmt, unter welchen Bedingungen, mit welchen Berechtigungen.

### Kann ich OpenLegion für Multi-Agenten-Orchestrierung mit jedem LLM nutzen?

Ja. OpenLegion unterstützt 100+ LLM-Anbieter über LiteLLM, darunter OpenAI, Anthropic, Google, Mistral, Cohere und lokale Modelle. Sie können unterschiedlichen Agenten im selben Workflow unterschiedliche Modelle zuweisen — z. B. GPT-4o für komplexes Reasoning und ein leichteres Modell für hochvolumige Klassifizierung. Bringen Sie eigene LLM-API-Keys mit. Kein Aufschlag auf Modellnutzung.

### Wie vergleicht sich OpenLegions Orchestrierung mit LangGraph?

LangGraph nutzt einen programmatischen StateGraph, in dem Knoten Python-Funktionen sind und Kanten Übergänge definieren. Es bietet mächtige Kontrolle über Zustand und Fluss, aber keine integrierte Isolation, Credential-Verwaltung oder Kostenkontrollen. OpenLegion nutzt Fleet-Modell-Koordination — Blackboard + Pub/Sub + Handoff — mit Container-Isolation, Vault-Proxy-Credential-Injection und Pro-Agent-Budgets als native Orchestrierungs-Funktionen. LangGraph bietet mehr programmatische Flexibilität; OpenLegion ergänzt Governance als erstklassiges Orchestrierungs-Anliegen.

---

## Interne Links

| Anchor-Text | Ziel |
|---|---|
| KI-Agenten-Plattform | /learn/ai-agent-platform |
| KI-Agenten-Orchestrierung | /learn/ai-agent-orchestration |
| KI-Agenten-Frameworks-Vergleich | /learn/ai-agent-frameworks |
| KI-Agenten-Sicherheit | /learn/ai-agent-security |
| OpenClaw-Alternative | /openclaw-alternative |
| OpenLegion vs. OpenClaw | /comparison/openclaw |
| Dokumentation | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
