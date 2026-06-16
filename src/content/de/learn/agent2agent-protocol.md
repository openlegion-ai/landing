---
title: "Agent2Agent-Protokoll: A2A-Sicherheit, Architektur und MCP-Vergleich"
description: "Das Agent2Agent-Protokoll (A2A) ermöglicht KI-Agenten, Aufgaben über Frameworks hinweg zu delegieren. Architektur, Sicherheitsmodell, Task-Lebenszyklus und Vergleich mit MCP."
slug: /learn/agent2agent-protocol
primary_keyword: agent2agent protokoll
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/model-context-protocol
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/ai-agent-frameworks
---

# Agent2Agent-Protokoll: Architektur, Sicherheit und MCP-Vergleich

Agent2Agent (A2A) ist ein offenes Protokoll, das im April 2025 von Google Cloud gestartet und der Linux Foundation übergeben wurde. Es ermöglicht KI-Agenten aus verschiedenen Frameworks und von verschiedenen Anbietern, über eine standardisierte HTTP/JSON-Schnittstelle zu kommunizieren, Aufgaben zu delegieren und Ergebnisse auszutauschen. Während MCP das Tool-Zugriffsproblem löst (ein LLM ruft externe APIs auf), löst A2A das Koordinierungsproblem: Ein Agent delegiert eine komplette Teilaufgabe an einen spezialisierten Peer-Agenten mit eigenem Reasoning-Loop, Speicher und Tools. Das GitHub-Repository a2aproject/A2A zählt Beiträge von über 50 Organisationen, darunter Salesforce, Atlassian und SAP.

<!-- SCHEMA: DefinitionBlock -->
Agent2Agent (A2A) ist ein offenes HTTP/JSON-Protokoll für die Interoperabilität von KI-Agenten, das von der Linux Foundation gepflegt wird und standardisiert, wie autonome Agenten Fähigkeiten ankündigen, Aufgaben delegieren und Ergebnisse über verschiedene Frameworks und Anbieter hinweg austauschen.

## Was ist das Agent2Agent-Protokoll (A2A)?

A2A entstand aus einer konkreten Lücke im KI-Agenten-Ökosystem: Die Kommunikation von Modell zu Tool hatte einen Standard (MCP, gestartet im November 2024), die Kommunikation von Agent zu Agent jedoch nicht. Wenn ein orchestrierender Agent eine Teilaufgabe an einen spezialisierten Peer übergeben muss, fehlte ein standardisiertes Wire-Format für diese Delegation.

Google Cloud kündigte A2A am 9. April 2025 zusammen mit einer anfänglichen Gruppe von über 50 Technologiepartnern an, die zur Spezifikation beitragen. Anders als viele herstellergetriebene Standards wurde A2A der Linux Foundation für neutrale Governance übertragen.

Das Protokoll basiert auf HTTP/JSON. Ein A2A-konformer Agent stellt eine kleine Anzahl von Endpunkten bereit: eine Agentenkarte (Fähigkeitsmanifest), einen Aufgaben-Einreichungsendpunkt, einen Status-Polling-Endpunkt und einen SSE-Streaming-Endpunkt für lang laufende Aufgaben.

Für Hintergründe zum Koordinierungsproblem, das A2A adressiert, siehe [Multi-Agenten-Systemarchitektur](/learn/multi-agent-systems) und [KI-Agenten-Orchestrierungsmuster](/learn/ai-agent-orchestration).

## Die A2A-Protokollarchitektur

A2A definiert drei Kernkonzepte: Agentenkarten (Fähigkeitserkennung), den Task-Lebenszyklus (zustandsbehaftete Delegationsverfolgung) und Zustellmodi (SSE-Streaming und Webhook-Push).

### Agentenkarten: Fähigkeitsankündigung und Enumerationsrisiko

Eine Agentenkarte ist ein JSON-Dokument, das unter einer bekannten URL (`/.well-known/agent.json`) bereitgestellt wird und beschreibt, was ein Agent kann. Eine minimale Agentenkarte enthält:

```json
{
  "name": "web-research-agent",
  "description": "Recherchiert Themen per Websuche und gibt strukturierte Zusammenfassungen zurück",
  "version": "1.0.0",
  "url": "https://agents.example.com/web-research",
  "skills": [
    {
      "id": "research_topic",
      "name": "Thema recherchieren",
      "description": "Das Web nach einem Thema durchsuchen und eine strukturierte Zusammenfassung zurückgeben",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

Agentenkarten ermöglichen dynamische Fähigkeitserkennung, bergen aber ein Sicherheitsrisiko: Im A2A-Basisprofil sind Agentenkarten standardmäßig nicht authentifiziert und legen die gesamte Fähigkeitsoberfläche zur Enumeration ohne Authentifizierung offen.

Produktionsinstallationen sollten Agentenkarten nur nach Authentifizierung bereitstellen oder auf interne Netzwerksegmente beschränken. Das [Bedrohungsmodell für KI-Agentensicherheit](/learn/ai-agent-security) behandelt Fähigkeitsenumeration als Aufklärungsangriffsvektor.

### Task-Lebenszyklus: Fünf Zustände von eingereicht bis abgeschlossen

A2A definiert einen fünfstufigen Task-Lebenszyklus:

1. **submitted** - Aufgabe vom Remote-Agenten empfangen; noch nicht zur Verarbeitung aufgenommen
2. **working** - Remote-Agent verarbeitet die Aufgabe aktiv (kann Fortschritt per SSE streamen)
3. **input-required** - Remote-Agent benötigt Klärung vor der Fortsetzung (Human-in-the-Loop-Gate)
4. **completed** - Aufgabe abgeschlossen; Ergebnisartefakt zur Abholung verfügbar
5. **failed** - Aufgabe fehlgeschlagen; Fehlerdetails im Task-Statusobjekt

Der `input-required`-Zustand ist A2As Mechanismus für Human-in-the-Loop-Prüfpunkte in langen autonomen Pipelines.

### Push- vs. Pull-Aufgabenzustellung: SSE und Webhooks

A2A unterstützt zwei Zustellmodi für Task-Ergebnisse:

**SSE (Server-Sent Events):** Der delegierende Agent öffnet eine dauerhafte Verbindung zum Streaming-Endpunkt des empfangenden Agenten. SSE ist der primäre Mechanismus für lang laufende Aufgaben, bei denen inkrementeller Fortschritt benötigt wird.

**Webhook-Push:** Der delegierende Agent stellt bei der Einreichung eine Callback-URL bereit. Webhook-Push ist bei serverlosem Umgebungen vorzuziehen, in denen keine dauerhafte SSE-Verbindung aufrechterhalten werden kann.

## A2A vs. MCP: Verschiedene Schichten, verschiedene Probleme

A2A und MCP sind komplementär, nicht konkurrierend. Sie operieren auf verschiedenen Ebenen des Agenten-Stacks und lösen verschiedene Koordinierungsprobleme.

| **Dimension** | **MCP** | **A2A** |
|---|---|---|
| **Zweck** | Tool-Zugriff - ein LLM ruft externe APIs auf | Agentenkoordination - ein Agent delegiert an einen anderen |
| **Kommunikation** | Synchroner Tool-Aufruf innerhalb eines Reasoning-Turns | Asynchrone Task-Delegation; empfangender Agent hat eigenen Loop |
| **Auth (Standard)** | Erforderlich - MCP-Server authentifizieren Clients | Optional im Basisprofil - anonym erlaubt |
| **Erkennung** | MCP-Server-Manifest (Tool-Liste) | Agentenkarte (JSON: Fähigkeiten und Auth-Anforderungen) |
| **Zustand** | Zustandslos pro Tool-Aufruf | Zustandsbehaftet, 5-stufiger Lebenszyklus |
| **Streaming** | Nicht in der Kernspezifikation | SSE für Echtzeit; Webhook-Push für asynchron |
| **Primäre Bedrohung** | Tool-Vergiftung (OWASP LLM07:2025) | Task-Payload-Injection, Agentenkarten-Enumeration |

### Wenn ein Agent ein Tool braucht (MCP)

MCP ist die richtige Wahl, wenn ein einzelner Agent eine externe Fähigkeit innerhalb eines Reasoning-Turns aufrufen muss. Das Tool hat keinen eigenen Reasoning-Loop; es führt eine Funktion aus und gibt einen Wert zurück.

### Wenn ein Agent einen anderen Agenten braucht (A2A)

A2A ist die richtige Wahl, wenn eine Aufgabe die volle Reasoning-Fähigkeit eines Peer-Agenten erfordert. Der empfangende Agent hat sein eigenes Modell, seinen eigenen Speicher, seinen eigenen Tool-Zugriff und seinen eigenen mehrstufigen Reasoning-Loop.

### MCP und A2A gemeinsam in einem System nutzen

Ein Produktions-Multi-Agenten-System verwendet typischerweise beides. Der orchestrierende Agent nutzt A2A für die Delegation an Spezialagenten. Jeder Spezialist nutzt MCP für seine Tool-Aufrufe. Die Schichten ergänzen sich.

## A2A-Authentifizierung und Sicherheitsmodell

A2As Sicherheitsmodell hat eine kritische Lücke: Das Basisprofil macht Authentifizierung optional. Prompt-Injection über A2A-Task-Payloads ist ein dokumentierter Angriffstyp für jede A2A-Implementierung, die Aufgaben von nicht vertrauenswürdigen Aufrufern akzeptiert.

Die Angriffsfläche in A2A-Systemen:

**1. Task-Payload-Injection:** Die Aufgabenbeschreibung und Eingabedaten in einer A2A-Task-Einreichung sind benutzerkontrolliert.

**2. Agentenkarten-Enumeration:** Nicht authentifizierte Agentenkarten legen die gesamte Fähigkeitsoberfläche offen.

**3. Inter-Agenten-Vertrauensannahmen:** Ein delegierender Agent, der Task-Ergebnisse eines Peer-Agenten ohne Ausgabevalidierung vertraut, ist anfällig für Relay-Injection.

**4. Anonyme Delegation:** Ohne obligatorische Authentifizierung kann jeder Aufrufer im Netzwerk Aufgaben an einen A2A-Agenten einreichen.

## OpenLegions Einschätzung: A2A ist ein Wire-Format, kein Sicherheitsmodell

A2A ist als Wire-Format gut konzipiert. Das Sicherheitsmodell erfüllt die Produktionsanforderungen jedoch nicht.

OpenLegions Ansatz zur Inter-Agenten-Kommunikation setzt durch, was A2As Basisprofil optional lässt:

1. **Jeder Inter-Agenten-Aufruf wird über den Credential-Vault geleitet.** Es gibt keinen anonymen Delegationsmodus.

2. **Task-Payload-Sanitisierung an 56 Netzwerk-Engpässen.** Benutzerkontrollierte Inhalte werden auf Unicode-Angriffe geprüft, bevor sie den LLM-Kontext erreichen.

3. **Typisierte Handoff-Verträge, validiert durch den Orchestrator.** Relay-Injection-Payloads werden an der Handoff-Grenze blockiert.

4. **Agenten-Fähigkeitsmanifeste erfordern Authentifizierung.** Die Fähigkeitsoberfläche ist nicht für anonyme Aufrufer zugänglich.

## A2A implementieren: Eine technische Anleitung

### Agentenkarten-Schema

Eine Produktions-Agentenkarte sollte Authentifizierungsanforderungen explizit einschließen:

```json
{
  "name": "data-analysis-agent",
  "description": "Analysiert strukturierte Datensätze und gibt statistische Zusammenfassungen zurück",
  "version": "1.2.0",
  "url": "https://agents.internal.example.com/data-analysis",
  "provider": {
    "organization": "Beispiel GmbH",
    "url": "https://example.com"
  },
  "skills": [
    {
      "id": "analyze_dataset",
      "name": "Datensatz analysieren",
      "description": "Statistische Analyse auf einem bereitgestellten Datensatz durchführen",
      "inputModes": ["data"],
      "outputModes": ["text", "data", "file"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"],
    "required": true
  }
}
```

### Task-Einreichung und Status-Polling

Task-Einreichung erfolgt per POST an `/tasks/send`. Status-Polling erfolgt per `GET /tasks/{task_id}`. Polling mit exponentiellem Backoff (1s, 2s, 4s, 8s, max. 30s). Lang laufende Aufgaben (>60s) sollten auf SSE wechseln.

### Streaming lang laufender Aufgaben mit SSE

Für Aufgaben, die länger als 30 Sekunden laufen, SSE via `POST /tasks/sendSubscribe` verwenden. Das Flag `"final": true` signalisiert den Abschluss der Aufgabe. SSE-Wiederverbindung mit dem `Last-Event-ID`-Header implementieren.

<!-- SCHEMA: FAQPage -->
## Häufig gestellte Fragen

### Was ist das Agent2Agent-Protokoll (A2A)?

Agent2Agent (A2A) ist ein offenes HTTP/JSON-Protokoll für die Interoperabilität von KI-Agenten, das im April 2025 von Google Cloud gestartet und der Linux Foundation übergeben wurde. Es standardisiert, wie autonome Agenten aus verschiedenen Frameworks Fähigkeiten ankündigen, Aufgaben delegieren und Ergebnisse austauschen. A2A definiert Agentenkarten für die Fähigkeitserkennung, einen fünfstufigen Task-Lebenszyklus und SSE-Streaming für Echtzeit-Fortschritt bei lang laufenden Aufgaben. Über 50 Organisationen, darunter Salesforce, Atlassian und SAP, haben seit April 2025 zum Protokoll beigetragen.

### Was ist der Unterschied zwischen A2A und MCP?

MCP löst den Tool-Zugriff: ein Agent ruft eine externe API, Datenbank oder einen Dienst innerhalb eines einzelnen Reasoning-Turns auf. A2A löst die Agentenkoordination: ein Agent delegiert eine komplette Teilaufgabe an einen Peer-Agenten, der einen eigenen Reasoning-Loop, Speicher und Tools hat. MCP erfordert standardmäßig Authentifizierung; A2As Basisprofil macht Authentifizierung optional. Beide Protokolle sind komplementär.

### Was sind A2A-Agentenkarten?

Agentenkarten sind JSON-Dokumente, die unter `/.well-known/agent.json` bereitgestellt werden und die Fähigkeiten, akzeptierte Ein-/Ausgabemodi und Authentifizierungsanforderungen eines Agenten beschreiben. Standardmäßig im A2A-Basisprofil werden Agentenkarten ohne Authentifizierung bereitgestellt. Produktionsinstallationen sollten Authentifizierung für den Zugriff auf Agentenkarten vorschreiben.

### Ist das A2A-Protokoll sicher?

Das Basisprofil von A2A weist erhebliche Sicherheitslücken auf. Authentifizierung ist standardmäßig optional. Prompt-Injection über A2A-Task-Payload ist ein reales Produktionsrisiko. Produktions-A2A-Installationen müssen explizit das erweiterte Authentifizierungsprofil implementieren, alle Task-Payload-Inhalte vor dem LLM sanitisieren und Ausgaben an jeder Handoff-Grenze validieren.

### Was ist der A2A-Task-Lebenszyklus?

A2A definiert fünf Task-Zustände: submitted (empfangen, noch nicht verarbeitet), working (aktive Verarbeitung, kann SSE-Fortschritt streamen), input-required (Remote-Agent benötigt Klärung), completed (Ergebnis verfügbar) und failed (Aufgabe fehlgeschlagen mit Fehlerdetails). Der `input-required`-Zustand ist A2As Mechanismus für Human-in-the-Loop-Prüfpunkte.

### Welche Unternehmen unterstützen A2A?

A2A wurde im April 2025 mit über 50 beitragenden Organisationen gestartet, darunter Salesforce, Atlassian und SAP. Google Cloud leitete die anfängliche Spezifikation und übergab die Governance der Linux Foundation. Das Protokoll zielt auf Unternehmens-KI-Plattformen ab, bei denen Agenten aus verschiedenen Frameworks interoperieren müssen.

### Wie implementiert OpenLegion die Agenten-zu-Agenten-Kommunikation?

OpenLegions Mesh-Architektur implementiert Inter-Agenten-Koordination mit obligatorischer Authentifizierung bei jedem Aufruf. Jeder Agenten-zu-Agenten-Handoff wird über den Credential-Vault geleitet, der Aufrufer-Identität validiert und per-Agenten-ACL-Gates durchsetzt. Task-Payload-Inhalte werden an 56 Netzwerk-Engpässen auf Unicode-Angriffe sanitisiert. Diese Kontrollen laufen auf der Infrastrukturschicht außerhalb des Agenten-Codes.

## Multi-Agenten-Systeme mit Authentifizierung bei jedem Aufruf aufbauen

A2A stellt das Wire-Format für Agenten-Interoperabilität bereit. Das Sicherheitsmodell muss darüber hinaus aufgebaut oder durch die Infrastrukturschicht durchgesetzt werden.

Für Systeme, bei denen Agenten-zu-Agenten-Aufrufe echte Anmeldedaten tragen, auf sensible Daten zugreifen oder irreversible Aktionen auslösen, ist die Durchsetzung auf Infrastrukturebene die einzige zuverlässige Garantie. Siehe [KI-Agentensicherheit und Bedrohungsmodell](/learn/ai-agent-security) oder [Multi-Agenten-Systemarchitektur](/learn/multi-agent-systems).

[Führen Sie Multi-Agenten-Systeme aus, bei denen jeder Agenten-zu-Agenten-Aufruf standardmäßig authentifiziert, protokolliert und anmeldedaten-isoliert ist - starten Sie auf OpenLegion](https://app.openlegion.ai)
