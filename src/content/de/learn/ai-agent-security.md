---
title: 'KI-Agenten-Sicherheit — Bedrohungen, Isolation, Tresore'
description: >-
 KI-Agenten-Sicherheits-Leitfaden: Credential-Leaks, Prompt Injection,
 Sandbox-Ausbruch und wie Lauf-Isolation, Credentials im Vault und
 Budget-Kontrollen jede Bedrohung entschärfen.
slug: /learn/ai-agent-security
primary_keyword: ki-agenten-sicherheit
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2026-03
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

**KI-Agenten-Sicherheit** ist die Praxis, autonome Agenten so zu beschränken, dass ein kompromittierter, fehlkonfigurierter oder fehlverhaltender Agent keine Credentials leakt, keine Daten exfiltriert, keine Budgets leert und keine Berechtigungen eskaliert. OpenLegion behandelt dies als zentrales architektonisches Anliegen, nicht als Add-on. Jede Aktion ist eine Absicht, die eine einzige Policy-Engine prüft, bevor sie geschieht, Credentials liegen in einem Vault außerhalb des Modells, und jeder Agent trägt sein eigenes Budget — alles standardmäßig aktiviert.

Modelle werden per Preset gewählt — Smartest, Smart oder Normal — pro Agent oder pro Workspace.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist KI-Agenten-Sicherheit?**
> KI-Agenten-Sicherheit umfasst die Kontrollen, die autonome KI-Agenten daran hindern, Schaden anzurichten — sei es durch Credential-Leaks, Prompt Injection, Ressourcenmissbrauch, Datenexfiltration oder übermäßige Handlungsbefugnis. Sie umfasst Laufzeit-Isolation, Credential-Verwaltung, Kostendurchsetzung, Berechtigungssteuerung und Input-Validierung auf Infrastrukturebene.

## Auf einen Blick

- **Die Bedrohung ist real.** Forschung zeigt, dass 77 % der Organisationen mit KI-Deployments 2024 Sicherheitsvorfälle erlebten. Nur 5 % äußern Vertrauen in ihre KI-Sicherheitsmaßnahmen.
- **Vier primäre Bedrohungen**: Credential-Leaks, Prompt Injection, Ressourcenmissbrauch (Denial of Wallet) und Datenexfiltration. Jede erfordert eine andere Gegenmaßnahme.
- **Kein großes Framework bietet integrierte Sicherheit.** Laut öffentlicher Dokumentation setzen LangGraph, CrewAI, AutoGen und OpenClaw alle auf Umgebungsvariablen für Credentials ohne native Isolation oder Budgetdurchsetzung.
- **OpenLegions geschichtete Verteidigung**: eine Policy-Engine vor jeder Aktion, gesandboxte Aufgabenläufe, Credential-Trennung (ein Vault außerhalb des Modells), Berechtigungsdurchsetzung, Input-Validierung und Unicode-Sanitisierung — alle standardmäßig aktiviert.
- **Ihre eigenen Dienst-Credentials bleiben sicher** — Credentials liegen in einem Vault und werden außerhalb des Modells injiziert, das immer nur ein Handle hält und nie ein rohes Secret sieht.

## Das Bedrohungsmodell für KI-Agenten

### Bedrohung 1: Credential-Leaks

**Was passiert.** Ein Agent mit Zugriff auf API-Keys — über Umgebungsvariablen, Konfigurationsdateien oder Inkontext-Weitergabe — leakt diese Keys über Prompt Injection, Logging, Fehlermeldungen oder bösartige Tool-Calls.

**Wie häufig.** Anfang 2026 veröffentlichte Forschung fand, dass 283 von 3.984 gescannten Agent-Skills (7,1 %) kritische Credential-Handling-Fehler enthielten und API-Keys sowie Passwörter im Klartext durch den LLM-Kontext führten. Zusätzlich enthielten 76 Skills bewusst bösartige Payloads für Credential-Diebstahl. Bekannte Vorfälle umfassen einen xAI-Mitarbeiter, der einen API-Key auf GitHub leakte und damit zwei Monate lang Zugriff auf 60+ private LLMs ermöglichte, sowie eine Schwachstelle in einer populären LLM-Plattform, die API-Keys über einen unauthentifizierten Endpoint offenlegte.

**Wie OpenLegion das entschärft.** Credentials liegen in einem Vault und werden außerhalb des Modells injiziert, das immer nur ein Handle hält. Wenn ein Agent eine externe API aufrufen muss, injiziert die Plattform das Credential an der Aufrufgrenze. Der Agent sieht, loggt oder hat keinen Speicherzugriff auf den rohen Key. Selbst ein vollständig kompromittierter Agent kann keine Credentials extrahieren, weil sie nie in seinem Lauf präsent sind.

### Bedrohung 2: Prompt Injection

**Was passiert.** Ein Angreifer bettet bösartige Anweisungen in Inhalte ein, die der Agent verarbeitet — Webseiten, Dokumente, E-Mails, Datenbankeinträge, Nutzereingaben. Der Agent folgt den injizierten Anweisungen statt (oder zusätzlich zu) seiner eigentlichen Aufgabe.

**Wie häufig.** Prompt Injection tritt in über 73 % der bei Sicherheits-Audits geprüften Produktions-KI-Deployments auf. OpenAI erklärte im Dezember 2025, dass Prompt Injection "wahrscheinlich nie vollständig gelöst wird". OWASP führt es als Schwachstelle Nr. 1 für LLM-Anwendungen. Reale Vorfälle umfassen einen Browser-Agenten, der innerhalb von 150 Sekunden über versteckte Anweisungen auf einer Webseite zum Credential-Diebstahl verleitet wurde, sowie Enterprise-RAG-Systeme, in denen bösartige Inhalte in öffentlichen Dokumenten dazu führten, dass Agenten proprietäre Daten leakten.

**Wie OpenLegion das entschärft.** OpenLegion setzt Defense-in-Depth über mehrere Schichten ein. Unicode-Sanitisierung entfernt unsichtbare Zeichen (Bidi-Overrides, Tag-Zeichen, Zero-Width-Zeichen), bevor Inhalte den LLM-Kontext erreichen — diese Zeichen werden häufig genutzt, um injizierte Anweisungen zu verstecken. Input-Validierung verhindert Path-Traversal und erzwingt sichere Bedingungsauswertung. Das Handeln auf ungeprüften Inhalten ist eine der drei Stellen, an denen die Arbeit für eine Freigabe des Eigentümers stoppt, was den Blast Radius begrenzt: Ein injizierter Agent kann nur innerhalb seiner eigenen gescopten Berechtigungen handeln. Er kann nicht auf Daten anderer Agenten, den Credential-Vault oder das Host-System zugreifen.

Kein System kann vollständige Immunität gegen Prompt Injection garantieren. OpenLegions Ansatz besteht darin, die Angriffsfläche zu minimieren und den Schaden einzudämmen.

### Bedrohung 3: Ressourcenmissbrauch (Denial of Wallet)

**Was passiert.** Ein Agent gerät in eine rekursive Schleife, macht exzessive API-Aufrufe oder wird dazu manipuliert, Ressourcen weit über das Notwendige hinaus zu verbrauchen. In Multi-Agenten-Systemen verstärkt sich das — ein 5-Agenten-Workflow kostet das 5-fache eines einzelnen Agenten, und eine außer Kontrolle geratene Schleife kann in Minuten hunderte Dollar verbrennen, bevor jemand etwas bemerkt.

**Wie häufig.** Dies ist als OWASP LLM10:2025 (Unbounded Consumption) gelistet. Die meisten Cloud-Billing-Systeme stoppen Belastungen nicht automatisch bei Budgetüberschreitung — Alerts feuern, aber der Zähler läuft weiter. Community-Berichte von CrewAI- und LangGraph-Nutzern beschreiben Token-verbrennende Schleifen, die das 10-fache der erwarteten Budgets verbrauchten.

**Wie OpenLegion das entschärft.** Pro-Agent-Budgets mit Hartabschaltung. Jeder Agent im Team hat ein eigenes Budget, und jede Arbeitseinheit ist ein festgehaltener Lauf, abgerechnet in Credits zu je $0,001. Wird das Limit erreicht, hält die [Orchestrierungsebene](/learn/ai-agent-orchestration) diesen spezifischen Agenten an. Der Rest des Workflows läuft weiter oder pausiert kontrolliert. Es gibt keine "weiche Warnung", die ignoriert wird — die Abschaltung erfolgt auf Plattform-Ebene.

### Bedrohung 4: Datenexfiltration

**Was passiert.** Ein Agent wird dazu manipuliert, sensible Daten an einen vom Angreifer kontrollierten Endpoint zu senden. Techniken umfassen: dem Agenten anweisen, Daten in URL-Parametern zu kodieren (die geloggt oder per Link-Preview gesendet werden), den Browser des Agenten nutzen, um angreifergesteuerte Seiten zu besuchen, oder Tool-Calls ausnutzen, um Daten an externe APIs weiterzuleiten.

**Wie häufig.** Zero-Click-Exfiltrationstechniken wurden gegen Agenten in Messaging-Plattformen demonstriert (wo Link-Previews URLs automatisch fetchen), gegen Enterprise-Kollaborationstools und Code-Repositories. Forschung zu Banking-Agenten zeigte ca. 20 % Erfolgsraten für Datenexfiltrationsangriffe.

**Wie OpenLegion das entschärft.** Code, den der Agent schreibt, läuft in einer Sandbox ohne standardmäßigen Netzwerkzugriff, und das Erreichen Dritter in Ihrem Namen stoppt für eine Freigabe des Eigentümers. Die Berechtigungsmatrix definiert erlaubte Tools, Dateien und Operationen pro Agent. Ausgehende Anfragen laufen über kontrollierte Kanäle. Kombiniert mit Credential-Isolation (der Agent hat keine Credentials zum Exfiltrieren) und Belegen, die jede Aktion festhalten, ist die Angriffsfläche für Exfiltration deutlich kleiner als bei Agenten, die in geteilten Prozessräumen mit uneingeschränktem Netzwerkzugriff laufen.

### Bedrohung 5: Sandbox-Ausbruch

**Was passiert.** Ein Agent oder von ihm ausgeführter Code bricht aus seinem Container aus und erhält Zugriff auf das Host-System, andere Container oder die Orchestrierungsschicht. Container-Escape-Schwachstellen werden regelmäßig entdeckt — mehrere hochkritische runC-CVEs wurden im November 2025 offengelegt und betrafen Docker und Kubernetes bei großen Cloud-Anbietern.

**Wie OpenLegion das entschärft.** Code, den der Agent schreibt, läuft in einer Sandbox ohne standardmäßigen Netzwerkzugriff, und jede Aufgabe läuft bei Bedarf und endet dann — es gibt keinen langlebigen Agentenprozess zu kompromittieren. Jeder Agent erhält eigenen Speicher, nie einen geteilten. Eine Policy-Engine vor jeder Aktion bedeutet, dass selbst ein unterwanderter Lauf keinen direkten Weg zum Credential-Vault oder zu den Daten eines anderen Agenten hat. Credentials werden außerhalb des Modells injiziert, ein unterwanderter Lauf hat also nichts zu stehlen.

### Bedrohung 6: Supply-Chain-Angriffe

**Was passiert.** Bösartiger Code wird über Agent-Skills, MCP-Tool-Server, geteilte Konfigurationen oder Framework-Abhängigkeiten eingeschleust. Bösartige MCP-Server wurden auf npm gefunden, die legitime Dienste imitieren. Crowdgesourcte Konfigurationsdateien wurden mit versteckten LLM-getriggerten Prompts bewaffnet.

**Wie OpenLegion das entschärft.** Jedes Tool, das ein Agent erreichen kann, gewährt ein Eigentümer explizit, es wird nicht zur Laufzeit entdeckt, und zum Start gibt es keine Drittanbieter-Plugin-Fläche. Tool-Grants prüft die Policy-Engine bei jedem Aufruf, und jeder Grant wird als Beleg festgehalten, den der Eigentümer lesen kann. Ziel-und-Aufgaben-Koordination bedeutet, dass Tool-Calls explizit in der Aufgabendefinition stehen, nicht dynamisch aufgelöst werden — das reduziert die Fläche für unerwartete Tool-Injection.

## Wie KI-Agenten-Isolation in OpenLegion funktioniert

OpenLegion stellt eine einzige Policy-Engine vor jede Aktion und trennt einen Workspace in unterscheidbare Sicherheitsgrenzen:

**Ungeprüfte Eingaben.** Alles, was von Nutzern oder Drittparteien kommt: Web-Chat, Telegram, Slack, eingehende E-Mail und Webhook-Endpoints. Eingaben werden validiert und über Prompt-Injection-Guards sanitisiert, und das Handeln auf ungeprüften Inhalten stoppt für eine Freigabe des Eigentümers.

**Der Lauf des Agenten.** Jede Aufgabe läuft bei Bedarf und endet dann. Code, den der Agent schreibt, läuft in einer Sandbox ohne standardmäßigen Netzwerkzugriff, und der Lauf hält keine Credentials — nur ein Handle. Agenten sind dauerhafte Datensätze, keine Server, es gibt also keinen langlebigen Prozess zu kompromittieren, einen anzulegen geht sofort, ein untätiger Agent kostet nichts, und ein Workspace kann Hunderte betreiben.

**Die Policy-Engine.** Jede Aktion ist eine Absicht, die geprüft wird, bevor sie geschieht: Tool-Aufruf, Delegation, Freigabe, Kosten. Sie ist die einzige Komponente mit Zugriff auf den Vault, injiziert Credentials außerhalb des Modells und hält jede Aktion als Beleg fest, den der Eigentümer lesen kann.

**Entscheidungen von Eigentümer und Admin.** Die Arbeit stoppt nur an drei Stellen für eine Freigabe: beim Erreichen Dritter in Ihrem Namen, beim Löschen von Daten und beim Handeln auf ungeprüften Inhalten. Freigaben entscheidet in der App ein Eigentümer oder Admin, nie der Agent selbst.

**Workspace-Isolation.** Agenten, Aufgaben, Gedächtnis und Belege eines Workspace sind auf diesen Workspace begrenzt, und Berechtigungen pro Agent verengen das weiter. Nichts, was ein Agent tut, reicht über die Grants hinaus, die sein Eigentümer erteilt hat.

Diese Architektur bedeutet, dass ein kompromittierter Agent weder den Vault noch die Daten eines anderen Agenten erreichen kann. Der Blast Radius einer einzelnen Agentenkompromittierung ist auf den Lauf dieses Agenten und seine eigenen Grants beschränkt.

## KI-Agenten-Credential-Verwaltung: Credential-Vault vs. Umgebungsvariablen

Das häufigste Credential-Management-Muster über [KI-Agenten-Frameworks](/learn/ai-agent-frameworks) hinweg sind Umgebungsvariablen. Ihr API-Key liegt in einer `.env`-Datei oder wird via `OAI_CONFIG_LIST` weitergegeben. Der Agentenprozess liest ihn direkt. Das bedeutet:

- Der Key existiert im Speicher des Agenten
- Ein Prompt-Injection-Angriff kann den Agenten anweisen, den Key zu drucken oder zu exfiltrieren
- Logs, Fehlermeldungen und Debug-Ausgaben können den Key enthalten
- Wird der Agent kompromittiert, hat der Angreifer direkten Zugriff auf alle injizierten Credentials

OpenLegions Credential-Vault ändert diese Architektur grundlegend. API-Keys liegen im Vault, außerhalb des Modells. Wenn ein Agent einen authentifizierten API-Aufruf machen muss, injiziert die Plattform das Credential an der Aufrufgrenze, führt den authentifizierten Aufruf aus und gibt das Ergebnis an den Agenten zurück. Das Modell hält immer nur ein Handle und sieht, speichert oder erreicht den rohen Key nie.

Das sind **Credentials im Vault** — dasselbe Prinzip, das Enterprise-Secret-Management-Systeme wie HashiCorp Vault nutzen, aber in die [KI-Agenten-Orchestrierungs](/learn/ai-agent-orchestration)-Schicht eingebaut, statt separate Infrastruktur zu verlangen.

## Containerisierte KI-Agenten: Warum Prozess-Ebenen-Isolation nicht ausreicht

Mehrere Frameworks bieten irgendeine Form von Isolation, aber die Implementierungsdetails zählen:

| Framework | Isolations-Ansatz | Was tatsächlich isoliert ist | Was geteilt wird |
|---|---|---|---|
| **OpenLegion** | Sandbox-Lauf pro Aufgabe (immer aktiv) | Prozess, Dateisystem, Netzwerk, Speicher, Credentials | Nichts — Agenten sind vollständig isoliert |
| **OpenClaw** | Docker-Container (optional) | Prozess, Dateisystem | Docker-Socket standardmäßig gemounted; Host-Netzwerk erreichbar |
| **LangGraph** | Nicht integriert | Nicht zutreffend | Alles — Agenten teilen Python-Prozess |
| **CrewAI** | Docker für CodeInterpreter | Code-Ausführungsausgabe | Agentenprozesse teilen Python-Runtime |
| **AutoGen** | Docker für Code-Ausführung | Code-Ausführungsausgabe | Agentenprozesse teilen Python-Runtime |

Der entscheidende Unterschied: OpenLegion isoliert den **Aufgabenlauf selbst**. Andere Frameworks, die Docker-Isolation bieten, isolieren typischerweise nur die **Code-Ausführungsausgabe** — der Agentenprozess, sein Speicher und sein Credential-Zugriff bleiben geteilt. Das bedeutet, eine Prompt Injection, die einen Agenten in LangGraph oder CrewAI kompromittiert, hat Zugriff auf alle Credentials und den Zustand im geteilten Prozess. In OpenLegion ist dieselbe Kompromittierung auf einen einzelnen gesandboxten Lauf ohne Credential-Zugriff begrenzt.

## KI-Agenten-Kostenkontrollen: Budgetdurchsetzung als Sicherheit

Kostenkontrollen sind nicht nur finanzielle Governance — sie sind ein Sicherheitsmechanismus. Ein außer Kontrolle geratener Agent, der unbegrenzt Tokens verbraucht, ist ein Ressourcenmissbrauchsangriff, ob durch bösartige Prompt Injection ausgelöst oder durch einen einfachen Bug in der Reasoning-Schleife des Agenten.

OpenLegions Budgetdurchsetzung funktioniert auf Orchestrator-Ebene:

- Jeder Agent hat ein eigenes konfigurierbares Budget, abgerechnet in Credits zu je $0,001
- Der Verbrauch wird in Echtzeit erfasst, und die exakten Kosten jeder Aufgabe sind sichtbar
- Erreicht ein Agent sein Limit, gibt der Orchestrator eine Hartabschaltung aus — der Agent wird angehalten
- Der Rest der Workflow-Pipeline läuft weiter oder pausiert kontrolliert
- Kostendaten sind im Dashboard mit Aufschlüsselung pro Agent sichtbar

Kein anderes großes KI-Agenten-Framework bietet diese Fähigkeit integriert, laut öffentlicher Dokumentation zum Zeitpunkt des Schreibens.

## Compliance und Audit-Erwägungen

OpenLegion ist **für Umgebungen ausgelegt**, die Compliance-Kontrollen verlangen, einschließlich:

- **Request-Tracing**: Auditierbare Ziel-und-Aufgaben-Koordination bedeutet, dass jeder Workflow-Schritt explizit und nachvollziehbar ist. Jeder Tool-Aufruf, jede Delegation und jede Freigabe wird mit der Identität des Agenten, einem Zeitstempel und den exakten Kosten der Aufgabe festgehalten. Das gemeinsame Verzeichnis aus Zielen und Aufgaben liefert Koordinationskontext über Agenten hinweg.
- **Auditierbare Ziel-und-Aufgaben-Koordination**: Ziel-und-Aufgaben-Koordination (Ziele → Aufgaben → Agenten) kann vor der Ausführung auditiert werden — Sie können den vollständigen Fluss von Daten, Berechtigungen und Agenten-Interaktionen verifizieren, ohne das System laufen zu lassen.
- **Datenisolation**: Speicher pro Agent und Berechtigungen pro Agent stellen sicher, dass sensible Daten, die von einem Agenten verarbeitet werden, für andere Agenten nicht erreichbar sind.
- **Geringste Rechte**: Tools, Dateien und Operationen jedes Agenten gewährt ein Eigentümer explizit, und jeder Grant wird als Beleg festgehalten.

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

Der sicherste Ansatz sind Credentials im Vault: API-Keys in einem Vault speichern, auf den Agenten nicht direkt zugreifen können. Wenn ein Agent einen authentifizierten Aufruf machen muss, injiziert die Plattform das Credential außerhalb des Modells. Der Agent sieht nie den rohen Key. OpenLegion implementiert das mit einem Credential-Vault, den das Modell nur per Handle referenzieren kann. Der unsicherste (und häufigste) Ansatz sind Umgebungsvariablen, bei denen Keys im Speicher des Agenten existieren und über Prompt Injection, Logging oder Fehlerausgabe geleakt werden können.

### Wie funktioniert KI-Agenten-Isolation?

Agenten-Isolation bedeutet, jeden Agenten in seiner eigenen sandboxed Umgebung laufen zu lassen — separater Prozess, separates Dateisystem, separater Netzwerk-Namespace und separater Speicherraum. In OpenLegion läuft jede Aufgabe bei Bedarf und endet dann, Code, den der Agent schreibt, läuft in einer Sandbox ohne standardmäßigen Netzwerkzugriff, und Agenten teilen keinen Speicher. Das bedeutet, ein kompromittierter Agent kann nicht auf Daten anderer Agenten, den Credential-Vault oder das Host-System zugreifen. Das unterscheidet sich von Frameworks, in denen Agenten einen Python-Prozess teilen und auf den Speicher des jeweils anderen zugreifen können.

### Warum brauchen KI-Agenten Budget-/Kostenkontrollen?

Autonome Agenten können in rekursive Schleifen geraten, exzessive API-Aufrufe machen oder dazu manipuliert werden, Ressourcen weit über das Notwendige hinaus zu verbrauchen. Ohne Budget-Kontrollen kann ein einzelner außer Kontrolle geratener Agent in Minuten hunderte Dollar in Tokens leeren. In Multi-Agenten-Systemen verstärkt sich das — jeder Agent multipliziert das Risiko. OpenLegion gibt jedem Agenten ein eigenes Budget mit harter Abschaltung, abgerechnet in Credits zu je $0,001, und verhindert so, dass ein einzelner Agent unbegrenzte Kosten verursacht.

### Sind sichere KI-Agenten mit BYO-Keys möglich?

OpenLegion nutzt für LLMs kein BYO-Key-Modell — Modelle werden per Preset gewählt, Smartest, Smart oder Normal, pro Agent oder pro Workspace. Die Dienst-Credentials, die Sie mitbringen, etwa OAuth-Tokens und Drittanbieter-API-Keys, liegen in einem Vault und werden außerhalb des Modells injiziert, das immer nur ein Handle hält. Volle Kostentransparenz bleibt: Jede Arbeitseinheit ist ein festgehaltener Lauf, abgerechnet in Credits zu je $0,001, und die exakten Kosten jeder Aufgabe sind sichtbar.

### Was ist die OWASP Top 10 für KI-Agenten?

OWASP veröffentlichte die Top 10 für agentische Anwendungen im Dezember 2025. Das Risiko Nr. 1 ist Agent Goal Hijacking — bei dem ein Angreifer einen Agenten dazu manipuliert, andere Ziele zu verfolgen, als vom Nutzer beabsichtigt. Weitere Top-Risiken sind Credential-Leaks, übermäßige Handlungsbefugnis (Agenten, die über ihren Scope hinaus handeln) und Supply-Chain-Schwachstellen (bösartige Tools oder Plugins). OpenLegion adressiert diese über Credentials im Vault, gesandboxte Aufgabenläufe, Berechtigungsmatrizen und Ziel-und-Aufgaben-Koordination (Ziele → Aufgaben → Agenten).

### Wie vergleicht sich OpenLegion mit OpenClaw in puncto Sicherheit?

Laut öffentlicher Dokumentation bietet OpenLegion strengere Sicherheits-Defaults. OpenClaws Standard-Local-Deployment erfordert Docker-Socket-Mounting (was weitreichenden Host-Zugriff gewährt), beim Sicherheits-Analyzer wurden Probleme mit konsistenter Aktivierung gemeldet, und Credentials werden in Konfigurationen abgelegt, die für den Agentenprozess zugänglich sind. OpenLegion führt jede Aufgabe in einem gesandboxten Lauf aus, hält Credentials in einem Vault außerhalb des Modells, erzwingt Pro-Agent-Budgets und wendet Unicode-Sanitisierung an mehreren Engpässen an. Für einen detaillierten Vergleich siehe [OpenLegion vs. OpenClaw](/comparison/openclaw).

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
