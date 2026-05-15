---
title: 'KI-Agenten-Sicherheit — Bedrohungen, Isolation, Tresore'
description: >-
 KI-Agenten-Sicherheits-Leitfaden: Credential-Leaks, Prompt Injection,
 Sandbox-Ausbruch und wie Container-Isolation, Vault-vermittelte Credentials und
 Budget-Kontrollen jede Bedrohung entschärfen.
slug: /learn/ai-agent-security
primary_keyword: ki-agenten-sicherheit
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-platform
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-frameworks
 - /comparison
---

# KI-Agenten-Sicherheit: Das Bedrohungsmodell für produktive Agenten-Flotten

Jedes KI-Agenten-Framework gibt Ihnen Werkzeuge, um Agenten zu bauen. Fast keines gibt Ihnen Werkzeuge, um sie einzudämmen. Wenn ein Agent APIs aufrufen, das Web durchsuchen, Code ausführen und auf Datenbanken zugreifen kann, lautet die Sicherheitsfrage nicht, ob etwas schiefgehen kann — sondern wie groß der Blast Radius dann aussieht.

**KI-Agenten-Sicherheit** ist die Praxis, autonome Agenten so zu beschränken, dass ein kompromittierter, fehlkonfigurierter oder fehlverhaltender Agent keine Credentials leakt, keine Daten exfiltriert, keine Budgets leert und keine Berechtigungen eskaliert. OpenLegion behandelt dies als zentrales architektonisches Anliegen, nicht als Add-on. Jeder Agent läuft in einem isolierten Container mit Vault-vermittelten Credentials, Pro-Agent-Budget-Kontrollen und einer Berechtigungsmatrix — alles standardmäßig aktiviert.

Bringen Sie eigene LLM-API-Keys mit. Kein Aufschlag auf Modellnutzung.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist KI-Agenten-Sicherheit?**
> KI-Agenten-Sicherheit umfasst die Kontrollen, die autonome KI-Agenten daran hindern, Schaden anzurichten — sei es durch Credential-Leaks, Prompt Injection, Ressourcenmissbrauch, Datenexfiltration oder übermäßige Handlungsbefugnis. Sie umfasst Laufzeit-Isolation, Credential-Verwaltung, Kostendurchsetzung, Berechtigungssteuerung und Input-Validierung auf Infrastrukturebene.

## Auf einen Blick

- **Die Bedrohung ist real.** Forschung zeigt, dass 77 % der Organisationen mit KI-Deployments 2024 Sicherheitsvorfälle erlebten. Nur 5 % äußern Vertrauen in ihre KI-Sicherheitsmaßnahmen.
- **Vier primäre Bedrohungen**: Credential-Leaks, Prompt Injection, Ressourcenmissbrauch (Denial of Wallet) und Datenexfiltration. Jede erfordert eine andere Gegenmaßnahme.
- **Kein großes Framework bietet integrierte Sicherheit.** Laut öffentlicher Dokumentation setzen LangGraph, CrewAI, AutoGen und OpenClaw alle auf Umgebungsvariablen für Credentials ohne native Isolation oder Budgetdurchsetzung.
- **OpenLegions sechs Verteidigungsschichten**: Container-Isolation, Container-Härtung, Credential-Trennung (Vault-Proxy), Berechtigungsdurchsetzung, Input-Validierung und Unicode-Sanitisierung — alle standardmäßig aktiviert.
- **Sichere KI-Agenten sind mit BYO-Keys möglich** — das Vault-Proxy-Modell hält Ihre Keys in der vertrauenswürdigen Zone, und Agenten interagieren über einen Proxy, der nie rohe Secrets offenlegt.

## Das Bedrohungsmodell für KI-Agenten

### Bedrohung 1: Credential-Leaks

**Was passiert.** Ein Agent mit Zugriff auf API-Keys — über Umgebungsvariablen, Konfigurationsdateien oder Inkontext-Weitergabe — leakt diese Keys über Prompt Injection, Logging, Fehlermeldungen oder bösartige Tool-Calls.

**Wie häufig.** Anfang 2026 veröffentlichte Forschung fand, dass 283 von 3.984 gescannten Agent-Skills (7,1 %) kritische Credential-Handling-Fehler enthielten und API-Keys sowie Passwörter im Klartext durch den LLM-Kontext führten. Zusätzlich enthielten 76 Skills bewusst bösartige Payloads für Credential-Diebstahl. Bekannte Vorfälle umfassen einen xAI-Mitarbeiter, der einen API-Key auf GitHub leakte und damit zwei Monate lang Zugriff auf 60+ private LLMs ermöglichte, sowie eine Schwachstelle in einer populären LLM-Plattform, die API-Keys über einen unauthentifizierten Endpoint offenlegte.

**Wie OpenLegion das entschärft.** OpenLegion nutzt Vault-vermittelte Credentials über einen Vault-Proxy. API-Keys werden auf dem Mesh Host (Zone 2) gespeichert. Wenn ein Agent eine externe API aufrufen muss, läuft die Anfrage über den Vault-Proxy, der das Credential auf Netzwerkebene injiziert. Der Agent sieht, loggt oder hat keinen Speicherzugriff auf den rohen Key. Selbst ein vollständig kompromittierter Agent kann keine Credentials extrahieren, weil sie nie im Container des Agenten präsent sind.

### Bedrohung 2: Prompt Injection

**Was passiert.** Ein Angreifer bettet bösartige Anweisungen in Inhalte ein, die der Agent verarbeitet — Webseiten, Dokumente, E-Mails, Datenbankeinträge, Nutzereingaben. Der Agent folgt den injizierten Anweisungen statt (oder zusätzlich zu) seiner eigentlichen Aufgabe.

**Wie häufig.** Prompt Injection tritt in über 73 % der bei Sicherheits-Audits geprüften Produktions-KI-Deployments auf. OpenAI erklärte im Dezember 2025, dass Prompt Injection "wahrscheinlich nie vollständig gelöst wird". OWASP führt es als Schwachstelle Nr. 1 für LLM-Anwendungen. Reale Vorfälle umfassen einen Browser-Agenten, der innerhalb von 150 Sekunden über versteckte Anweisungen auf einer Webseite zum Credential-Diebstahl verleitet wurde, sowie Enterprise-RAG-Systeme, in denen bösartige Inhalte in öffentlichen Dokumenten dazu führten, dass Agenten proprietäre Daten leakten.

**Wie OpenLegion das entschärft.** OpenLegion setzt Defense-in-Depth über mehrere Schichten ein. Unicode-Sanitisierung entfernt unsichtbare Zeichen (Bidi-Overrides, Tag-Zeichen, Zero-Width-Zeichen) an 56 Engpässen, bevor Inhalte den LLM-Kontext erreichen — diese Zeichen werden häufig genutzt, um injizierte Anweisungen zu verstecken. Input-Validierung verhindert Path-Traversal und erzwingt sichere Bedingungsauswertung. Container-Isolation begrenzt den Blast Radius: Selbst wenn ein Agent erfolgreich injiziert wird, kann er nur auf seinen eigenen sandboxed Container mit eigenen gescopten Berechtigungen zugreifen. Er kann nicht auf Daten anderer Agenten, den Credential-Vault oder das Host-System zugreifen.

Kein System kann vollständige Immunität gegen Prompt Injection garantieren. OpenLegions Ansatz besteht darin, die Angriffsfläche zu minimieren und den Schaden einzudämmen.

### Bedrohung 3: Ressourcenmissbrauch (Denial of Wallet)

**Was passiert.** Ein Agent gerät in eine rekursive Schleife, macht exzessive API-Aufrufe oder wird dazu manipuliert, Ressourcen weit über das Notwendige hinaus zu verbrauchen. In Multi-Agenten-Systemen verstärkt sich das — ein 5-Agenten-Workflow kostet das 5-fache eines einzelnen Agenten, und eine außer Kontrolle geratene Schleife kann in Minuten hunderte Dollar verbrennen, bevor jemand etwas bemerkt.

**Wie häufig.** Dies ist als OWASP LLM10:2025 (Unbounded Consumption) gelistet. Die meisten Cloud-Billing-Systeme stoppen Belastungen nicht automatisch bei Budgetüberschreitung — Alerts feuern, aber der Zähler läuft weiter. Community-Berichte von CrewAI- und LangGraph-Nutzern beschreiben Token-verbrennende Schleifen, die das 10-fache der erwarteten Budgets verbrauchten.

**Wie OpenLegion das entschärft.** Pro-Agent tägliche und monatliche Budget-Kontrollen mit Hartabschaltung. Jeder Agent in der Flotte hat ein eigenes Token-Budget, das in Echtzeit erfasst wird. Wird das Limit erreicht, hält die [Orchestrierungsebene](/learn/ai-agent-orchestration) diesen spezifischen Agenten an. Der Rest des Workflows läuft weiter oder pausiert kontrolliert. Es gibt keine "weiche Warnung", die ignoriert wird — die Abschaltung erfolgt auf Infrastrukturebene.

### Bedrohung 4: Datenexfiltration

**Was passiert.** Ein Agent wird dazu manipuliert, sensible Daten an einen vom Angreifer kontrollierten Endpoint zu senden. Techniken umfassen: dem Agenten anweisen, Daten in URL-Parametern zu kodieren (die geloggt oder per Link-Preview gesendet werden), den Browser des Agenten nutzen, um angreifergesteuerte Seiten zu besuchen, oder Tool-Calls ausnutzen, um Daten an externe APIs weiterzuleiten.

**Wie häufig.** Zero-Click-Exfiltrationstechniken wurden gegen Agenten in Messaging-Plattformen demonstriert (wo Link-Previews URLs automatisch fetchen), gegen Enterprise-Kollaborationstools und Code-Repositories. Forschung zu Banking-Agenten zeigte ca. 20 % Erfolgsraten für Datenexfiltrationsangriffe.

**Wie OpenLegion das entschärft.** Container-level-Netzwerk-Isolation beschränkt, welche externen Endpoints jeder Agent erreichen kann. Die Berechtigungsmatrix definiert erlaubte Tools, Dateien und Mesh-Operationen pro Agent. Ausgehende Anfragen laufen über kontrollierte Kanäle. Kombiniert mit Credential-Isolation (der Agent hat keine Credentials zum Exfiltrieren) und Fleet-Modell-Koordination (die jede Aktion loggt) ist die Angriffsfläche für Exfiltration deutlich kleiner als bei Agenten, die in geteilten Prozessräumen mit uneingeschränktem Netzwerkzugriff laufen.

### Bedrohung 5: Sandbox-Ausbruch

**Was passiert.** Ein Agent oder von ihm ausgeführter Code bricht aus seinem Container aus und erhält Zugriff auf das Host-System, andere Container oder die Orchestrierungsschicht. Container-Escape-Schwachstellen werden regelmäßig entdeckt — mehrere hochkritische runC-CVEs wurden im November 2025 offengelegt und betrafen Docker und Kubernetes bei großen Cloud-Anbietern.

**Wie OpenLegion das entschärft.** Container-Härtung: Non-Root-Ausführung (UID 1000), `no-new-privileges`-Flag, konfigurierbare Memory-Limits (384 MB Standard), konfigurierbare CPU-Limits (0,15 Standard) und kein geteiltes Dateisystem zwischen Containern. Jeder Agent erhält sein eigenes `/data`-Volume. Das Vier-Zonen-Trust-Modell (plus eine Operator-oder-Internal-Ebene) bedeutet, dass selbst ein Agent, der aus seinem Container ausbricht, in einer Zone landet, die keinen direkten Zugriff auf den Credential-Vault oder andere Agenten-Container hat. Für Umgebungen, die stärkere Isolation verlangen, unterstützt die Architektur Docker-Sandbox-microVMs.

### Bedrohung 6: Supply-Chain-Angriffe

**Was passiert.** Bösartiger Code wird über Agent-Skills, MCP-Tool-Server, geteilte Konfigurationen oder Framework-Abhängigkeiten eingeschleust. Bösartige MCP-Server wurden auf npm gefunden, die legitime Dienste imitieren. Crowdgesourcte Konfigurationsdateien wurden mit versteckten LLM-getriggerten Prompts bewaffnet.

**Wie OpenLegion das entschärft.** OpenLegion nutzt null externe Framework-Abhängigkeiten — kein LangChain, kein Redis, kein Kubernetes. Der Core ist reines Python + SQLite. MCP-Tool-Server werden unterstützt, aber über die Berechtigungsmatrix gesandboxed. Die Fleet-Modell-Koordination bedeutet, dass Tool-Calls explizit in der Workflow-Definition deklariert sind, nicht dynamisch zur Laufzeit entdeckt — das reduziert die Fläche für unerwartete Tool-Injection.

## Wie KI-Agenten-Isolation in OpenLegion funktioniert

OpenLegions Vier-Zonen-Trust-Modell plus eine Operator-oder-Internal-Ebene trennt jedes Deployment in unterscheidbare Sicherheitsgrenzen:

**Zone 0 — Untrusted External Input.** Alles, was von Nutzern oder Drittparteien kommt: CLI, Telegram, Discord, Slack, WhatsApp und Webhook-Endpoints. Eingaben werden validiert und über Prompt-Injection-Guards sanitisiert, bevor sie Zone 2 erreichen.

**Zone 1 — Sandboxed Agent Containers (Untrusted).** Jeder Agent läuft als isolierte FastAPI-Instanz in seinem eigenen Docker-Container. Jeder Container hat sein eigenes `/data`-Volume, seine eigene Memory-Datenbank (SQLite + Vektor-Suche), konfigurierbare Ressourcen-Caps (384 MB RAM / 0,15 CPU Standard), Non-Root-Ausführung (UID 1000), `cap_drop=ALL`, `no-new-privileges`, ein read-only Root-Dateisystem und keinen Zugriff auf den Docker-Socket, den Credential-Vault oder andere Agenten-Container.

**Zone 2 — Mesh Host (Trusted).** Die einzige Komponente mit Zugriff auf Credentials. Betreibt das Blackboard (gemeinsamer Zustand + WAL), den PubSub-Router, den Credential-Vault (Blind-Injection-Proxy), die ACL-Matrix, den Container-Manager, den Cost-Tracker und den Browser-Service (Pro-Agent-Camoufox auf :8500). Diese Zone ist gehärtet und nicht für Agentencode exponiert.

**Zone 2.5 — Operator-oder-Internal.** Reservierte Control-Plane-Operationen, die dem Operator-Agenten oder internem Mesh-Tooling zur Verfügung stehen — Flottenverwaltung, Agentenbearbeitung, Berechtigungs-Grants (der Operator kann `can_spawn` oder `can_use_wallet` nicht gewähren).

**Zone 3 — Loopback-Only Internal.** Die am stärksten beschränkte Ebene: Endpoints, die sowohl einen `x-mesh-internal: 1`-Header als auch eine Loopback-Quell-IP verlangen. Wird nur für mesh-interne Koordinationsaufrufe genutzt.

Diese Architektur bedeutet, dass ein kompromittierter Agent in Zone 1 weder Zone 2 (Credentials) noch andere Zone-1-Container (Daten anderer Agenten) erreichen kann. Der Blast Radius einer einzelnen Agentenkompromittierung ist auf die Sandbox dieses Agenten beschränkt.

## KI-Agenten-Credential-Verwaltung: Vault-Proxy vs. Umgebungsvariablen

Das häufigste Credential-Management-Muster über [KI-Agenten-Frameworks](/learn/ai-agent-frameworks) hinweg sind Umgebungsvariablen. Ihr API-Key liegt in einer `.env`-Datei oder wird via `OAI_CONFIG_LIST` weitergegeben. Der Agentenprozess liest ihn direkt. Das bedeutet:

- Der Key existiert im Speicher des Agenten
- Ein Prompt-Injection-Angriff kann den Agenten anweisen, den Key zu drucken oder zu exfiltrieren
- Logs, Fehlermeldungen und Debug-Ausgaben können den Key enthalten
- Wird der Agent kompromittiert, hat der Angreifer direkten Zugriff auf alle injizierten Credentials

OpenLegions Vault-Proxy ändert diese Architektur grundlegend. API-Keys werden im Credential-Vault des Mesh Host (Zone 2) gespeichert. Wenn ein Agent einen authentifizierten API-Aufruf machen muss, sendet er die Anfrage an den Vault-Proxy. Der Proxy injiziert das Credential auf Netzwerkebene, führt den authentifizierten Aufruf aus und gibt das Ergebnis an den Agenten zurück. Der Agent sieht, speichert oder hat keinen Speicherzugriff auf den rohen Key.

Das sind **Vault-vermittelte Credentials** — dasselbe Prinzip, das Enterprise-Secret-Management-Systeme wie HashiCorp Vault nutzen, aber in die [KI-Agenten-Orchestrierungs](/learn/ai-agent-orchestration)-Schicht eingebaut, statt separate Infrastruktur zu verlangen.

## Containerisierte KI-Agenten: Warum Prozess-Ebenen-Isolation nicht ausreicht

Mehrere Frameworks bieten irgendeine Form von Isolation, aber die Implementierungsdetails zählen:

| Framework | Isolations-Ansatz | Was tatsächlich isoliert ist | Was geteilt wird |
|---|---|---|---|
| **OpenLegion** | Docker-Container pro Agent (verpflichtend) | Prozess, Dateisystem, Netzwerk, Speicher, Credentials | Nichts — Agenten sind vollständig isoliert |
| **OpenClaw** | Docker-Container (optional) | Prozess, Dateisystem | Docker-Socket standardmäßig gemounted; Host-Netzwerk erreichbar |
| **LangGraph** | Nicht integriert | Nicht zutreffend | Alles — Agenten teilen Python-Prozess |
| **CrewAI** | Docker für CodeInterpreter | Code-Ausführungsausgabe | Agentenprozesse teilen Python-Runtime |
| **AutoGen** | Docker für Code-Ausführung | Code-Ausführungsausgabe | Agentenprozesse teilen Python-Runtime |

Der entscheidende Unterschied: OpenLegion isoliert den **Agenten selbst** in einem Container. Andere Frameworks, die Docker-Isolation bieten, isolieren typischerweise nur die **Code-Ausführungsausgabe** — der Agentenprozess, sein Speicher und sein Credential-Zugriff bleiben geteilt. Das bedeutet, eine Prompt Injection, die einen Agenten in LangGraph oder CrewAI kompromittiert, hat Zugriff auf alle Credentials und den Zustand im geteilten Prozess. In OpenLegion ist dieselbe Kompromittierung auf einen einzelnen sandboxed Container ohne Credential-Zugriff begrenzt.

## KI-Agenten-Kostenkontrollen: Budgetdurchsetzung als Sicherheit

Kostenkontrollen sind nicht nur finanzielle Governance — sie sind ein Sicherheitsmechanismus. Ein außer Kontrolle geratener Agent, der unbegrenzt Tokens verbraucht, ist ein Ressourcenmissbrauchsangriff, ob durch bösartige Prompt Injection ausgelöst oder durch einen einfachen Bug in der Reasoning-Schleife des Agenten.

OpenLegions Budgetdurchsetzung funktioniert auf Orchestrator-Ebene:

- Jeder Agent hat ein konfigurierbares tägliches und monatliches Token-Budget
- Token-Verbrauch wird in Echtzeit vom Cost-Tracker in Zone 2 erfasst
- Erreicht ein Agent sein Limit, gibt der Orchestrator eine Hartabschaltung aus — der Agent wird angehalten
- Der Rest der Workflow-Pipeline läuft weiter oder pausiert kontrolliert
- Kostendaten sind im Flotten-Dashboard mit Aufschlüsselung pro Agent sichtbar

Kein anderes großes KI-Agenten-Framework bietet diese Fähigkeit integriert, laut öffentlicher Dokumentation zum Zeitpunkt des Schreibens.

## Compliance und Audit-Erwägungen

OpenLegion ist **für Umgebungen ausgelegt**, die Compliance-Kontrollen verlangen, einschließlich:

- **Request-Tracing**: Auditierbare Fleet-Modell-Koordination bedeutet, dass jeder Workflow-Schritt explizit und nachvollziehbar ist. Das integrierte Request-Tracing-System zeichnet Task-Übergänge, Tool-Calls und Token-Ausgaben für Echtzeit-Observability auf. Das Blackboard (gemeinsamer Zustand) liefert Koordinationskontext über Agenten hinweg.
- **Auditierbare Fleet-Modell-Koordination**: Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff) kann vor der Ausführung auditiert werden — Sie können den vollständigen Fluss von Daten, Berechtigungen und Agenten-Interaktionen verifizieren, ohne das System laufen zu lassen.
- **Datenisolation**: Pro-Agent-Container mit dedizierten `/data`-Volumes stellen sicher, dass sensible Daten, die von einem Agenten verarbeitet werden, für andere Agenten nicht erreichbar sind.
- **Air-Gap-Unterstützung**: Keine externen Dienste (kein Redis, kein Kubernetes, keine Cloud-Dienste erforderlich) bedeutet, dass OpenLegion in On-Premises-Umgebungen laufen kann.

**Wichtig**: OpenLegion hält derzeit keine SOC-2-, ISO-27001-, HIPAA- oder andere Compliance-Zertifizierungen. Die Architektur ist gebaut, um Umgebungen mit diesen Anforderungen zu unterstützen, aber Zertifizierung ist eine Funktion Ihres Deployments, Ihrer Konfiguration und Ihrer organisatorischen Kontrollen — nicht nur des Frameworks.

## CTA

**Spielen Sie Agenten aus, die standardmäßig sicher sind.**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was bedeutet KI-Agenten-Sicherheit?

KI-Agenten-Sicherheit ist die Menge an Kontrollen, die autonome KI-Agenten daran hindern, Schaden durch Credential-Leaks, Prompt Injection, Ressourcenmissbrauch, Datenexfiltration, Sandbox-Ausbruch oder übermäßige Handlungsbefugnis anzurichten. Sie umfasst Laufzeit-Isolation (Agenten sandboxen), Credential-Verwaltung (Key-Exposition verhindern), Kostendurchsetzung (Runaway-Ausgaben stoppen), Berechtigungssteuerung (begrenzen, was Agenten tun können) und Input-Validierung (bösartige Eingaben filtern).

### Wie sichert man KI-Agenten mit API-Keys?

Der sicherste Ansatz sind Vault-vermittelte Credentials: API-Keys in einem Vault speichern, auf den Agenten nicht direkt zugreifen können. Wenn ein Agent einen authentifizierten Aufruf machen muss, läuft die Anfrage über einen Proxy, der das Credential auf Netzwerkebene injiziert. Der Agent sieht nie den rohen Key. OpenLegion implementiert das über seinen Vault-Proxy in Zone 2 des Vier-Zonen-Trust-Modells (plus einer Operator-oder-Internal-Ebene). Der unsicherste (und häufigste) Ansatz sind Umgebungsvariablen, bei denen Keys im Speicher des Agenten existieren und über Prompt Injection, Logging oder Fehlerausgabe geleakt werden können.

### Wie funktioniert KI-Agenten-Isolation?

Agenten-Isolation bedeutet, jeden Agenten in seiner eigenen sandboxed Umgebung laufen zu lassen — separater Prozess, separates Dateisystem, separater Netzwerk-Namespace und separater Speicherraum. In OpenLegion läuft jeder Agent in einem dedizierten Docker-Container mit konfigurierbaren Ressourcenlimits (384 MB RAM, 0,15 CPU Standard), Non-Root-Ausführung und ohne geteiltes Dateisystem. Das bedeutet, ein kompromittierter Agent kann nicht auf Daten anderer Agenten, den Credential-Vault oder das Host-System zugreifen. Das unterscheidet sich von Frameworks, in denen Agenten einen Python-Prozess teilen und auf den Speicher des jeweils anderen zugreifen können.

### Warum brauchen KI-Agenten Budget-/Kostenkontrollen?

Autonome Agenten können in rekursive Schleifen geraten, exzessive API-Aufrufe machen oder dazu manipuliert werden, Ressourcen weit über das Notwendige hinaus zu verbrauchen. Ohne Budget-Kontrollen kann ein einzelner außer Kontrolle geratener Agent in Minuten hunderte Dollar in Tokens leeren. In Multi-Agenten-Systemen verstärkt sich das — jeder Agent multipliziert das Risiko. OpenLegion erzwingt tägliche und monatliche Pro-Agent-Budgets mit Hartabschaltungen auf Orchestrator-Ebene und verhindert so, dass ein einzelner Agent unbegrenzte Kosten verursacht.

### Sind sichere KI-Agenten mit BYO-Keys möglich?

Ja. Das BYO-Key-Modell ist mit richtiger Architektur sogar sicherer. In OpenLegion liegen Ihre Keys im Credential-Vault des Mesh Host und werden über einen Vault-Proxy auf Netzwerkebene injiziert. Agenten sehen nie rohe Keys. Das gibt Ihnen volle Kostentransparenz (Sie sehen genau, was jeder Agent bei jedem Provider ausgibt), Provider-Flexibilität (Modelle pro Agent tauschen) und dieselben Credential-Isolations-Garantien, unabhängig vom Provider. Bringen Sie eigene LLM-API-Keys mit. Kein Aufschlag auf Modellnutzung.

### Was ist die OWASP Top 10 für KI-Agenten?

OWASP veröffentlichte die Top 10 für agentische Anwendungen im Dezember 2025. Das Risiko Nr. 1 ist Agent Goal Hijacking — bei dem ein Angreifer einen Agenten dazu manipuliert, andere Ziele zu verfolgen, als vom Nutzer beabsichtigt. Weitere Top-Risiken sind Credential-Leaks, übermäßige Handlungsbefugnis (Agenten, die über ihren Scope hinaus handeln) und Supply-Chain-Schwachstellen (bösartige Tools oder Plugins). OpenLegion adressiert diese über Vault-vermittelte Credentials, Container-Isolation, Berechtigungsmatrizen und Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff).

### Wie vergleicht sich OpenLegion mit OpenClaw in puncto Sicherheit?

Laut öffentlicher Dokumentation bietet OpenLegion strengere Sicherheits-Defaults. OpenClaws Standard-Local-Deployment erfordert Docker-Socket-Mounting (was weitreichenden Host-Zugriff gewährt), beim Sicherheits-Analyzer wurden Probleme mit konsistenter Aktivierung gemeldet, und Credentials werden in Konfigurationen abgelegt, die für den Agentenprozess zugänglich sind. OpenLegion betreibt Agenten in verpflichtenden isolierten Containern, nutzt einen Vault-Proxy für Vault-vermittelte Credentials, erzwingt Pro-Agent-Budgets und wendet Unicode-Sanitisierung an mehreren Engpässen an. Für einen detaillierten Vergleich siehe [OpenLegion vs. OpenClaw](/comparison/openclaw).

### Welche Compliance-Frameworks gelten für KI-Agenten?

Wichtige Frameworks sind OWASP Top 10 für LLM-Anwendungen (2025) und für agentische Anwendungen (2026), das NIST AI Risk Management Framework (mit kommenden AI-Agent-Standards), ISO/IEC 42001 (KI-Managementsysteme), der EU AI Act (Durchsetzung ab August 2026) sowie branchenspezifische Regularien wie HIPAA, SOC 2 und SOX je nach Domäne. OpenLegions Architektur ist für Umgebungen ausgelegt, die diese Kontrollen verlangen, hält selbst aber keine Zertifizierungen.

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
