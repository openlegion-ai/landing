---
title: Multi-Agent-Systemarchitektur - Design, Topologie und Sicherheit
description: Multi-Agent-Systemarchitektur definiert, wie autonome Agenten kommunizieren, koordinieren und Vertrauensgrenzen aufrechterhalten. Deckt Topologien, agentenübergreifende Protokolle und Produktionssicherheitsdesign ab.
slug: /learn/multi-agent-systems
primary_keyword: multi-agent systemarchitektur
secondary_keywords:
  - multi-agent system design
  - agent kommunikationsprotokolle
  - agent topologiemuster
  - a2a protokoll
  - multi-agent sicherheit
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /comparison/langgraph
  - /comparison/autogen
---

# Multi-Agent-Systemarchitektur: Design-Topologien, Kommunikationsprotokolle und Vertrauensgrenzen

Ein Multi-Agent-System ist ein Netzwerk autonomer KI-Agenten, die koordinieren, um Aufgaben zu erfüllen, die kein einzelner Agent alleine bewältigen kann. Die zur Designzeit getroffenen Architekturentscheidungen, nämlich Topologie, Kommunikationsprotokoll, State-Sharing-Modell und Vertrauensgrenzplatzierung, bestimmen, ob das System elegant skaliert oder im Produktionsbetrieb katastrophal scheitert. Eine Stern-Topologie mit gemeinsamem Zustand erzeugt einen Single Point of Failure; enge Kopplung zwischen Agenten bedeutet, dass eine kompromittierte Komponente zu anderen pivotieren kann; gemeinsam genutzter Prozessspeicher erzeugt Race Conditions, die sich als CVEs manifestieren.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist ein Multi-Agent-System?**
> Ein Multi-Agent-System ist ein Netzwerk von zwei oder mehr autonomen KI-Agenten, die kommunizieren, koordinieren und kollektiv handeln, um Aufgaben zu erfüllen, die über die Kapazität eines einzelnen Agenten hinausgehen, definiert durch seine Topologie (wie Agenten verbunden sind), sein Kommunikationsprotokoll (wie Agenten Informationen austauschen), sein State-Sharing-Modell und seine Vertrauensgrenzplatzierung.

## Grundlegende Architektureigenschaften

### Agentenautonomie vs. Koordination: die grundlegende Spannung

Jeder Agent in einem Multi-Agent-System hat sein eigenes Kontextfenster, seinen eigenen Werkzeugsatz und seinen eigenen Entscheidungsprozess. Autonomie bedeutet, dass Agenten ohne ständige Aufsicht handeln können. Koordination bedeutet, dass Agenten gemeinsame Ziele abstimmen, Arbeit übergeben und Ergebnisse integrieren müssen. Die Architektur löst diese Spannung: lose Kopplung (Agenten interagieren nur über einen kontrollierten Message-Bus) bewahrt die Autonomie; enge Kopplung (Agenten teilen Zustand direkt) ermöglicht schnellere Iteration, reduziert aber die Eindämmung von Blast-Radien.

### Message-Passing vs. gemeinsamer Speicher: zwei Kommunikationsmodelle

**Message-Passing**: Agenten kommunizieren durch das Senden diskreter Nachrichten über eine Koordinationsebene (Blackboard, Message-Queue oder Event-Bus). Agent A kennt den internen Zustand von Agent B nicht; er kennt nur das, was B in den gemeinsamen Kanal schreibt. Dieses Modell ist schwieriger zu debuggen, aber leichter zu sichern.

**Gemeinsamer Speicher**: Agenten greifen direkt auf einen gemeinsamen Datenspeicher zu. Dies ist für kleine Systeme einfacher zu implementieren. Bei gleichzeitigem Zugriff erzeugt gemeinsam veränderlicher Zustand Race Conditions. CVE-2025-64168 (Agno, CVSS 7.1, Oktober 2025) ist ein Produktionsbeispiel: Unter hoher asynchroner Gleichzeitigkeit wurde session_state, das zwischen Agenten geteilt wurde, der falschen Benutzersitzung zugewiesen, was die Daten eines Benutzers dem Anforderungskontext eines anderen Benutzers aussetzte.

### Enge Kopplung vs. lose Kopplung

Enge Kopplung: Agent A ruft direkt die API von Agent B auf. Der Ausfall eines Dienstes überträgt sich auf den nächsten. Lose Kopplung: Agent A schreibt seine Ausgabe in einen Blackboard-Schlüssel. Agent B abonniert diesen Schlüssel und verarbeitet die Ausgabe, wenn bereit. Der Ausfall von Agent B blockiert Agent A nicht.

## Multi-Agent-Topologiemuster

### Stern-Topologie: Hub-and-Spoke mit einem Supervisor-Agenten

In der Stern-Topologie koordiniert ein zentraler Supervisor-Agent alle Worker-Agenten. AutoGens GroupChat mit einem Koordinator, CrewAIs Manager und LangGraphs Supervisor-Muster implementieren alle die Stern-Topologie. Die Stern-Topologie erzeugt einen Single Point of Failure: Wenn der Supervisor über eine Prompt-Injektion aus einem Tool-Ergebnis kompromittiert wird, kann er bösartige Anweisungen an alle Worker-Agenten erteilen.

### Mesh-Topologie: Peer-to-Peer-Agentenkommunikation

In der Mesh-Topologie kommunizieren Agenten direkt miteinander ohne einen zentralen Koordinator. Reine Mesh-Topologie ist in der Produktion selten. In einem vollständigen Mesh von N Agenten gibt es N*(N-1)/2 potenzielle Kommunikationskanäle, jeder ein potenzieller Angriffsvektor.

### Hierarchische Topologie: verschachtelte Teams und Subagenten-Delegation

Hierarchische Topologie organisiert Agenten in verschachtelte Teams. Ein Koordinator der obersten Ebene verwaltet Sub-Team-Leads; jeder Sub-Team-Lead verwaltet Spezialisten-Worker. Das Risiko: Ein kompromittierter Koordinator auf mittlerer Ebene kann bösartige Anweisungen an alle von ihm verwalteten Agenten erteilen.

### Flache/Flotten-Topologie: gleichrangige Agenten koordinieren über einen gemeinsamen Bus

Flache Flotten-Topologie verwendet gleichrangige Agenten, die ausschließlich über einen gemeinsamen Message-Bus (Blackboard) ohne direkte Agent-zu-Agent-Aufrufe kommunizieren. Dies ist OpenLegions Flottenmodell: Jeder Agent arbeitet autonom, veröffentlicht auf der Blackboard und empfängt Arbeit über den Task-Eingang. Ein kompromittierter Agent kann nur beeinflussen, was er auf die Blackboard schreibt; er kann andere Agenten nicht direkt aufrufen oder auf deren Kontext zugreifen.

## Agentenübergreifende Kommunikationsprotokolle

### A2A: Googles offener Standard für framework-übergreifende Agentenkommunikation

A2A (Agent-to-Agent) Protokoll, von Google im April 2025 veröffentlicht, standardisiert die agentenübergreifende Kommunikation über verschiedene Frameworks und Laufzeiten hinweg. A2A definiert drei Primitive: Capability Discovery, Aufgabendelegation und Streaming-Ergebnisse. Bis Mitte 2026 wird A2A von 50+ Technologiepartnern unterstützt. OpenLegion unterstützt A2A für framework-übergreifende Agentenkoordination.

### MCP: Standardisierung des Tool-Zugriffs über Agenten hinweg

Model Context Protocol (MCP), von Anthropic im November 2024 veröffentlicht, standardisiert, wie Agenten auf externe Tools zugreifen. MCP definiert ein Server/Client-Protokoll, bei dem Tools als MCP-Server exponiert werden und Agenten als MCP-Clients agieren. Bis Mitte 2026 hat MCP 1.000+ Community-Server, die die meisten gängigen Tool-Kategorien abdecken.

MCP führt auch Sicherheitsrisiken ein: Tool-Beschreibungen können vergiftet werden, um bösartige Anweisungen in den Agentenkontext zu injizieren, kompromittierte Server können in Tool-Parametern übergebene Credentials exfiltrieren und Rug-Pull-Angriffe können das Tool-Verhalten nach der Genehmigung ändern. Für das vollständige MCP-Bedrohungsmodell, siehe [KI-Agent-Sicherheit: Topologie- und Kopplungsentscheidungen](/learn/ai-agent-security).

### Blackboard-Muster: geteilter persistenter Zustand als Kommunikationsmedium

Das Blackboard-Muster leitet die gesamte agentenübergreifende Kommunikation über einen gemeinsamen persistenten Datenspeicher. Agenten schreiben Aufgabenausgaben, Status-Updates und Koordinationssignale in benannte Schlüssel; andere Agenten lesen aus relevanten Schlüsseln. OpenLegion implementiert das Blackboard-Muster mit SQLite im WAL-Modus für gleichzeitigen Zugriff, kombiniert mit Pub/Sub-Messaging für ereignisgesteuerte Koordination.

## OpenLegion-Bewertung: Warum Architektur eine Sicherheitsentscheidung ist

Die meisten Multi-Agent-System-Fehler sind Architekturfehler, keine Anwendungsfehler. Gemeinsamer Zustand zwischen Agenten erzeugt Race Conditions: CVE-2025-64168 (Agno, CVSS 7.1, Oktober 2025), Sitzungsdaten eines Benutzers wurden einem anderen unter asynchroner Gleichzeitigkeit ausgesetzt, gepatcht in v2.2.2. Enge Kopplung zwischen Agenten verstärkt den Blast-Radius von Prompt-Injektionen: COLM 2025-Forschung zeigte eine 97-%ige Angriffserfolgsrate gegen AutoGen Magentic-One über bösartige Dateiinjektion.

OpenLegions Vier-Zonen-Vertrauensmodell ist die Produktionsinstanziierung dieser Prinzipien: Zone-1-Agenten (Container in Sandboxen) können nicht direkt kommunizieren. Alle agentenübergreifenden Nachrichten werden über den Zone-2-Mesh-Host geleitet. Der Mesh-Host setzt agentenspezifische Schreibberechtigungen durch und pflegt das Audit-Log. Der Zone-4-Vault-Proxy stellt sicher, dass Credentials niemals Zone-1-Container betreten.

## Vertrauensgrenzen in Multi-Agent-Systemen

### Warum gemeinsamer Prozess = gemeinsamer Blast-Radius

Wenn mehrere Agenten im selben Python-Prozess laufen, teilen sie den Heap, die Umgebung und den Interpreter. Eine erfolgreiche Prompt-Injektion in Agent A kann Variablen von Agent B lesen, Funktionen von Agent B aufrufen und auf jeden API-Schlüssel in der gemeinsamen Umgebung zugreifen. Container-Isolation pro Agent eliminiert das Problem des gemeinsamen Blast-Radius.

### Strukturelle Vertrauenstrennung: Container, Zonen und Credential-Scoping pro Agent

Strukturelle Vertrauenstrennung bedeutet, dass die Grenzen dessen, was ein Agent beeinflussen kann, durch die Infrastruktur durchgesetzt werden, nicht durch Anwendungscode. Agentenspezifisches Credential-Scoping erweitert dieses Prinzip: Jeder Agent hat nur Zugriff auf die Credentials, die er legitim benötigt. OpenLegions Vault-Proxy setzt agentenspezifische Credential-Zugriffslisten durch.

### Das Supervisor-Agenten-Problem: wenn der Koordinator das schwächste Glied ist

In der Stern-Topologie ist der Supervisor-Agent gleichzeitig die mächtigste und am meisten angegriffene Komponente. Abhilfemaßnahmen: den Tool-Zugriff des Supervisors auf nur koordinationsbezogene Operationen beschränken; Supervisor-Ausgaben für folgenreiche Aktionen durch einen Human-in-the-Loop-Checkpoint leiten; flache Flotten-Topologie in Betracht ziehen, bei der kein einzelner Agent Supervisor-Autorität hat.

## Häufige Fehlermodi in der Multi-Agent-Architektur

### Race Conditions bei gemeinsamem Zustand: CVE-2025-64168 als Fallstudie

CVE-2025-64168 (Agno, CVSS 7.1, CWE-362 + CWE-668, Oktober 2025, gepatcht in Agno v2.2.2) offenbarte eine Race Condition in Agnos session_state-Verwaltungsebene. Unter hoher asynchroner Gleichzeitigkeit wurde session_state der falschen Sitzung zugewiesen, was die Daten eines Benutzers dem Anforderungskontext eines anderen Benutzers aussetzte. Der architektonische Fix trennt Benutzersitzungen in isolierte Container.

### Prompt-Injektionsverstärkung in eng gekoppelten Systemen

Auf der COLM 2025 veröffentlichte Forschung zeigte eine 97-%ige Angriffserfolgsrate gegen Magentic-One (AutoGens Multi-Agent-System) über bösartige lokale Dateien für Control-Flow-Hijacking. Die enge Kopplung zwischen Agenten bedeutete, dass, sobald der bösartige Inhalt im Kontext eines Agenten war, er den Ausführungspfad des gesamten Teams beeinflussen konnte.

### Engpass bei Stern-Topologie und Single Point of Failure

Ein Stern-Topologie-Supervisor erzeugt zwei Fehlermodi: Engpass (jede Agenteninteraktion erfordert die Teilnahme des Supervisors) und Single Point of Failure (Supervisor-Nichtverfügbarkeit hält das gesamte System an). Flache Flotten-Topologie mit einem gemeinsamen Koordinationsbus eliminiert beide.

### Agent Role Drift: wenn Agenten ihren definierten Bereich überschreiten

In Systemen ohne strenge agentenspezifische Tool-Berechtigungen können Agenten mit breitem Tool-Zugriff Aktionen außerhalb ihrer zugewiesenen Rolle durchführen. OpenLegions Berechtigungsmodell definiert den erlaubten Tool-Satz jedes Agenten in seiner Konfiguration; Tool-Aufrufe außerhalb des erlaubten Satzes werden vor der Ausführung abgelehnt.

## Multi-Agent-Systemarchitektur in OpenLegion

OpenLegion implementiert flache Flotten-Topologie mit Vier-Zonen-Vertrauenstrennung. Agenten laufen in isolierten Docker-Containern (Zone 1), kommunizieren ausschließlich über die Mesh-Host-Blackboard und den Pub/Sub-Bus (Zone 2), greifen auf Credentials über den Vault-Proxy zu (Zone 4) und kommunizieren nie direkt miteinander.

OpenLegion unterstützt sowohl A2A (für framework-übergreifende Agentendelegation) als auch MCP (für standardisierten Tool-Zugriff). Sicherheitskontrollen gelten gleichermaßen für beide Protokolle: Vault-Proxy-Credential-Injektion für authentifizierte Aufrufe, Container-Isolation für Tool-Ausführung und Audit-Logging für die gesamte agentenübergreifende Kommunikation.

Für eine detaillierte Analyse von OpenLegions Sicherheitsmodell, siehe [was eine KI-Agent-Plattform für die Bereitstellung von Multi-Agent-Systemen bietet](/learn/ai-agent-platform). Für Laufzeit-Koordinationsprimitive, siehe [KI-Agent-Orchestrierung: Blackboard, Pub/Sub und Handoff-Primitive](/learn/ai-agent-orchestration).

## Handlungsaufforderung

**Multi-Agent-Koordination mit architektonischen Sicherheitsgarantien.**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai) | [Plattform ansehen](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist eine Multi-Agent-Systemarchitektur?

Eine Multi-Agent-Systemarchitektur definiert, wie mehrere autonome KI-Agenten strukturiert werden, um zu kommunizieren, zu koordinieren und Vertrauensgrenzen aufrechtzuerhalten. Sie spezifiziert die Topologie (Stern, Mesh, hierarchisch oder flache Flotte), das Kommunikationsprotokoll (Message-Passing oder gemeinsamer Speicher), das State-Sharing-Modell und die Vertrauensgrenzplatzierung. Die zur Designzeit getroffenen Architekturentscheidungen bestimmen, ob das System in der Produktion resilient, auditierbar und sicher ist.

### Was ist der Unterschied zwischen Stern-Topologie und flacher Flotten-Topologie in Multi-Agent-Systemen?

In einer Stern-Topologie koordiniert ein zentraler Supervisor-Agent alle anderen Agenten, was einen Single Point of Failure erzeugt: Wenn der Supervisor kompromittiert wird oder ausfällt, ist das gesamte System betroffen. In einer flachen Flotten-Topologie (von OpenLegion verwendet) koordinieren gleichrangige Agenten über einen gemeinsamen Message-Bus (Blackboard) ohne direkte Agent-zu-Agent-Kommunikation. Dies kombiniert Resilienz mit Auditierbarkeit, da die gesamte agentenübergreifende Kommunikation über den Bus geleitet wird.

### Was ist das A2A-Protokoll für Multi-Agent-Systeme?

A2A (Agent-to-Agent) ist ein offenes agentenübergreifendes Kommunikationsprotokoll, das von Google im April 2025 veröffentlicht wurde. Es standardisiert, wie Agenten die Fähigkeiten der anderen entdecken, Aufgaben delegieren und Streaming-Ergebnisse austauschen. Bis Mitte 2026 wird A2A von 50+ Technologiepartnern unterstützt. OpenLegion unterstützt A2A für framework-übergreifende Agentenkoordination.

### Was verursacht Race Conditions in Multi-Agent-Systemen?

Race Conditions in Multi-Agent-Systemen entstehen, wenn mehrere Agenten gleichzeitig ohne ordnungsgemäße Synchronisierung auf gemeinsamen Zustand lesen und schreiben. CVE-2025-64168 im Agno-Framework (CVSS 7.1, Oktober 2025) ist ein dokumentiertes Produktionsbeispiel: Unter hoher Gleichzeitigkeit wurde session_state, das zwischen Agenten geteilt wurde, der falschen Benutzersitzung zugewiesen. Message-Passing-Architekturen mit einem kontrollierten Bus eliminieren diese Schwachstelle.

### Wie verbreitet sich Prompt-Injektion in einem Multi-Agent-System?

In eng gekoppelten Multi-Agent-Systemen, in denen Agenten einen Prozess teilen oder sich direkt aufrufen, kann eine erfolgreiche Prompt-Injektion in einem Agenten auf andere übergreifen. Forschung auf der COLM 2025 zeigte eine 97-%ige Angriffserfolgsrate gegen AutoGen Magentic-One. Architektonische Abhilfemaßnahmen umfassen Container-Isolation pro Agent und Bus-vermittelte Kommunikation.

### Was ist das Blackboard-Muster in Multi-Agent-Systemen?

Das Blackboard-Muster ist eine Multi-Agent-Koordinationsarchitektur, bei der Agenten kommunizieren, indem sie einen gemeinsamen persistenten Datenspeicher lesen und beschreiben, anstatt sich direkt aufzurufen. Agenten posten Ergebnisse, Status-Updates und Aufgabenausgaben auf die Blackboard; andere Agenten abonnieren relevante Schlüssel. OpenLegion implementiert das Blackboard-Muster mit SQLite im WAL-Modus für gleichzeitigen Zugriff, kombiniert mit Pub/Sub-Messaging.
