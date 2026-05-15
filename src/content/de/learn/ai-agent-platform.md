---
title: KI-Agenten-Plattform — Sichere Agenten bereitstellen
description: >-
 OpenLegion ist eine verwaltete KI-Agenten-Plattform mit Container-Isolation,
 Credential-Vaulting und Budget-Kontrollen. Bringen Sie Ihre eigenen LLM-API-Keys mit.
slug: /learn/ai-agent-platform
primary_keyword: ki-agenten-plattform
secondary_keywords:
 - managed ai agent platform
 - self-hosted agent deployment
 - ai agent cost control
 - ai agent credential security
 - production ai agent infrastructure
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-security
 - /learn/ai-agent-frameworks
 - /comparison
---

# Die KI-Agenten-Plattform für die Produktion

Die meisten Teams starten mit einem Framework. Sie verketten LangGraph-Knoten oder CrewAI-Crews, bekommen eine Demo zum Laufen und stoßen dann an eine Wand: Wer verwaltet die Container? Wo liegen die API-Keys? Was hält einen außer Kontrolle geratenen Agenten davon ab, über Nacht 500 $ in Tokens zu verbrennen?

Eine **KI-Agenten-Plattform** beantwortet diese Fragen, bevor Sie Ihren ersten Agenten schreiben. OpenLegion ist eine verwaltete KI-Agenten-Plattform, die Container-Isolation, Vault-vermittelte Credentials, Budget-Kontrollen pro Agent und Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff) mitbringt — alle standardmäßig aktiviert. Bringen Sie eigene LLM-API-Keys mit. Kein Aufschlag auf Modellnutzung.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist eine KI-Agenten-Plattform?**
> Eine KI-Agenten-Plattform ist verwaltete Infrastruktur zum Bereitstellen, Orchestrieren und Governen autonomer KI-Agenten in Produktion. Anders als reine Frameworks übernimmt eine Plattform Isolation, Credential-Verwaltung, Kostenkontrollen und Observability, sodass Teams Agenten ausspielen, ohne DevOps von Grund auf zu bauen.

## Auf einen Blick

- **Plattform, nicht Framework** — OpenLegion verwaltet Container, Credentials, Budgets und Networking. Sie verwalten Agentenlogik.
- **Vault-vermittelte Credentials** — Agenten führen API-Aufrufe über einen Vault-Proxy aus. Sie sehen nie rohe Keys.
- **Container-Isolation pro Agent** — Jeder Agent läuft in seinem eigenen Docker-Container mit konfigurierbaren Ressourcenobergrenzen (Standard: 384 MB RAM / 0,15 CPU), Non-Root-Ausführung und ohne geteiltes Dateisystem.
- **Budgetdurchsetzung pro Agent** — Tägliche und monatliche Token-Limits mit automatischer Hartabschaltung. Keine Überraschungsrechnungen.
- **BYO-API-Keys** — Verbinden Sie jeden LLM-Provider über LiteLLM (100+ unterstützt). Sie zahlen Anbieter direkt zu deren veröffentlichten Preisen.
- **Auditierbare Fleet-Modell-Koordination** — Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff) für Task-Routing. Kein "CEO-Agent" trifft intransparente Entscheidungen.
- **MCP-kompatible Erweiterbarkeit** — Verbinden Sie jeden MCP-Tool-Server (Datenbanken, Dateisysteme, APIs) neben 50+ integrierten Skills. Automatisch von Agenten entdeckt.
- **Persistentes Agenten-Gedächtnis** — Agenten erinnern sich session-übergreifend per Vektor-Suche, Workspace-Dateien und Fehlerlernen. Kontext wird automatisch verwaltet.

## Verwaltet vs. selbst gehostet: Wann was Sinn ergibt

Die Unterscheidung zwischen KI-Agenten-Frameworks und KI-Agenten-Plattformen zählt am stärksten beim Deployment. Ein Framework gibt Ihnen Bausteine — Agentendefinitionen, Tool-Integrationen, Konversationsmuster. Eine Plattform liefert die Produktionsschicht: Wo Agenten laufen, wie sie auf Credentials zugreifen, was sie davon abhält, aus dem Ruder zu laufen.

**Selbst gehostete Frameworks** (LangGraph, CrewAI, AutoGen) geben Ihnen maximale Kontrolle. Sie besitzen die Infrastruktur. Sie konfigurieren die Container. Sie bauen die Credential-Pipeline. Das funktioniert, wenn Ihr Team dedizierte DevOps-Kapazität hat und bestehende Infrastruktur, mit der Agenten tief integriert werden müssen.

**Verwaltete KI-Agenten-Plattformen** übernehmen die operative Schicht, sodass Ihr Team sich auf Agentenlogik konzentriert. OpenLegion sitzt hier — mit einem entscheidenden Unterschied: Es ist source-available unter BSL 1.1. Sie bekommen Plattform-grade Operations (Isolation, Vaulting, Budget-Kontrollen) ohne Vendor Lock-in auf der Infrastrukturseite.

Die Frage ist nicht, welches "besser" ist. Es ist die Frage, ob Ihr Team Engineering-Stunden für Agenten-Sicherheitsinfrastruktur oder für die Agenten selbst aufwenden sollte.

### Wann Self-Hosting Sinn ergibt

- Sie haben strikte Datenresidenz-Anforderungen, die jeden Managed Service ausschließen
- Ihre Agenten brauchen tiefe Integration mit bestehender On-Premises-Infrastruktur
- Ihr Team betreibt bereits Kubernetes-Cluster und hat reife DevOps-Praktiken
- Sie müssen die Laufzeitumgebung auf einer Ebene anpassen, die verwaltete Plattformen nicht freilegen

### Wann eine verwaltete KI-Agenten-Plattform Sinn ergibt

- Sie brauchen Agenten in Produktion in Tagen, nicht Monaten
- Ihr Team hat 1–5 Engineers und kann keine Headcount für Infrastruktur abstellen
- Sie brauchen [KI-Agenten-Sicherheits](/learn/ai-agent-security)-Garantien, ohne sie selbst zu bauen
- Sie wollen Kostenkontrollen und Request-Tracing, ohne alles manuell zu instrumentieren

## Das BYO-API-Key-Modell — warum es zählt

Die meisten verwalteten KI-Plattformen rechnen pro Token ab oder nehmen eine Marge auf Modellnutzung. Das schafft zwei Probleme: Kostenintransparenz und Provider-Lock-in.

OpenLegion geht einen anderen Weg. Sie bringen eigene LLM-API-Keys von jedem Provider mit — OpenAI, Anthropic, Google, Mistral oder einen von 100+ via LiteLLM unterstützten Anbietern. Ihre Tokens fließen direkt an den Provider zu dessen veröffentlichten Preisen. OpenLegion berechnet für Plattform und Orchestrierung, nicht für Modellzugriff.

Das zählt aus drei Gründen:

**Kostentransparenz.** Sie sehen genau, was jeder Agent bei jedem Provider ausgibt. Kein versteckter Aufschlag. Keine "Plattform-Tokens", die echte Kosten verschleiern.

**Provider-Flexibilität.** Tauschen Sie Modelle pro Agent. Betreiben Sie GPT-4o für komplexes Reasoning, Claude für Long-Context-Aufgaben und ein lokales Llama-Modell für hochvolumige Klassifizierung — alles im selben Projekt, verwaltet aus demselben Dashboard.

**Kein Lock-in.** Wenn Sie OpenLegion verlassen, gehen Ihre API-Keys und Modellkonfigurationen mit. Es gibt keine proprietäre Modellschicht, von der Sie wegmigrieren müssen.

## Für wen

### Solo-Entwickler, die Agenten-Produkte bauen

Sie spielen ein agentengetriebenes Produkt aus und brauchen es ab Tag eins sicher. OpenLegion liefert Produktionsinfrastruktur — Container-Isolation, Credential-Vaulting, Kostenkontrollen — ohne ein DevOps-Team einstellen zu müssen. Starten Sie mit einem integrierten Team-Template (Dev-Team, Sales-Pipeline, Content-Studio) und passen Sie es an.

### Startup-Teams, die schnell ausliefern

Ihr Team hat 2–10 Engineers. Sie brauchen Agenten in Produktion in diesem Sprint, nicht im nächsten Quartal. Die Installation umfasst drei Befehle: `git clone`, `./install.sh`, `openlegion start`. Der geführte Setup-Assistent konfiguriert Ihre API-Keys, wählt ein Team-Template und stellt Ihre erste Agenten-Flotte in unter drei Minuten bereit.

### Enterprise-Sicherheits-Teams

Sie brauchen Request-Tracing und Workflow-Observability, Credential-Isolation, die einen kompromittierten Agenten übersteht, und Budget-Kontrollen, die explodierende Kosten verhindern. OpenLegions Architektur ist für Umgebungen ausgelegt, die Defense-in-Depth erfordern. Auditierbare Fleet-Modell-Koordination bedeutet, dass jeder Workflow-Schritt explizit und nachvollziehbar ist — kein intransparentes LLM-Entscheiden in der Control Plane. Siehe unsere Seite zur [KI-Agenten-Sicherheit](/learn/ai-agent-security) für das vollständige Threat Model.

## Produktionsreife: Was OpenLegion übernimmt vs. DIY

| Funktion | DIY (nur Framework) | OpenLegion |
|---|---|---|
| **Agenten-Runtime** | Sie konfigurieren Docker, verwalten Images, übernehmen Networking | Jeder Agent automatisch in isoliertem Container bereitgestellt (384 MB RAM, 0,15 CPU Standard, Non-Root, no-new-privileges) |
| **Credential-Verwaltung** | Umgebungsvariablen oder eigene Vault-Integration | Vault-Proxy mit Blind-Injection — Agenten sehen nie rohe Keys |
| **Kostenkontrollen** | Manuelles Tracking, keine harten Limits | Pro Agent tägliche/monatliche Budgets mit automatischer Abschaltung |
| **Orchestrierung** | Eigene Routing-Logik oder LLM-basiertes Routing | Fleet-Modell-Koordination (Blackboard + Pub/Sub + Handoff) — auditierbar |
| **Observability** | LangSmith, Datadog oder eigenes Logging integrieren | Integriertes Dashboard mit Live-Streaming, Kostencharts, Request-Traces |
| **Multi-Channel-Deployment** | Integrationen pro Kanal bauen | CLI, Telegram, Discord, Slack, WhatsApp — plus Webhook-Endpoints für externe Integrationen |
| **Browser-Automatisierung** | Playwright/Puppeteer konfigurieren, Chrome-Instanzen verwalten | Pro-Agent-Camoufox (Stealth-Firefox) in einem geteilten Browser-Service-Container, mit KasmVNC (Ports 6100..6163), CDP-Kontrolle und Auto-Recovery |
| **Tool-Erweiterbarkeit** | Eigene Integrationen bauen oder LangChain-Tools nutzen | MCP-kompatibel — beliebigen MCP-Server verbinden + 50+ integrierte Skills, automatisch entdeckt |
| **Agenten-Gedächtnis** | Eigenes RAG oder State-Management bauen | Persistentes Vektor-Gedächtnis pro Agent mit automatischer Kontextverwaltung |
| **Modell-Failover** | Eigene Retry-Logik pro Provider | Konfigurierbare Failover-Ketten über Provider via LiteLLM |

Die Zusammenfassung: Wenn Sie [KI-Agenten-Frameworks](/learn/ai-agent-frameworks) evaluieren und sich dabei ertappen, mehr Infrastruktur als Agentenlogik zu bauen, lösen Sie ein Plattformproblem mit Framework-Werkzeugen. OpenLegion übernimmt die Plattformschicht, damit Sie sich darauf konzentrieren können, was Ihre Agenten tatsächlich tun.

## MCP-kompatible Tool-Erweiterbarkeit

OpenLegion unterstützt das Model Context Protocol (MCP) zur Anbindung externer Tools. Jeder MCP-Server — Datenbanken, Dateisysteme, APIs, interne Dienste — kann per Konfiguration hinzugefügt und automatisch von Agenten entdeckt werden. Dies steht neben 50+ integrierten Skills für Browser-Automatisierung, Dateioperationen, HTTP-Requests, Web-Suche, Memory-Management, Code-Ausführung und Mesh-Kommunikation.

MCP-Integration bedeutet, dass Agenten nicht auf integrierte Fähigkeiten beschränkt sind. Verbinden Sie einen Postgres-Server, eine GitHub-Integration oder eine eigene interne API — Agenten entdecken verfügbare Tools automatisch und nutzen sie innerhalb ihrer Berechtigungsgrenzen.

## Persistentes Agenten-Gedächtnis

Agenten in OpenLegion pflegen Gedächtnis über Sessions hinweg per Vektor-Suche, Workspace-Dateien und Fehlerlernen. Wenn ein Agent ein Problem antrifft und löst, wird die Lösung gespeichert und in künftigen Sessions wieder aufgerufen — das reduziert wiederholte Fehlschläge und verbessert die Ausführungsqualität über die Zeit.

Das Gedächtnis ist pro Agent gescopt und in jedem Agenten-isolierten SQLite + Vektor-Datenbank im Container abgelegt. Automatische Kontextverwaltung hält den Token-Verbrauch effizient, indem nur relevante Erinnerungen für die aktuelle Aufgabe hochgeholt werden, statt ganze Konversationshistorien zu laden.

## Architektur: Das Vier-Zonen-Trust-Modell

OpenLegion trennt jedes Deployment in vier Trust-Zonen plus eine Operator-oder-Internal-Ebene:

**Zone 0 — Untrusted External Input.** Alles, was von Nutzern oder Drittparteien kommt: CLI, Telegram, Discord, Slack, WhatsApp und Webhook-Endpoints. Alle Eingaben werden validiert und über Prompt-Injection-Guards sanitisiert, bevor sie das Mesh erreichen.

**Zone 1 — Sandboxed Agent Containers (Untrusted).** Jeder Agent läuft als eigene FastAPI-Instanz in einem dedizierten Docker-Container mit eigenem `/data`-Volume, eigener Memory-Datenbank und strikten Ressourcen-Caps. Selbst ein vollständig kompromittierter Agent kann nicht auf Ihre API-Keys, die Daten anderer Agenten oder das Host-System zugreifen.

**Zone 2 — Mesh Host (Trusted).** Der FastAPI-Server, der das Blackboard (gemeinsamer Zustand via SQLite + WAL), den PubSub-Message-Router, den Credential-Vault (der Proxy für Blind-Injection), die ACL-Matrix, den Container-Manager, den Cost-Tracker und den Browser-Service (Pro-Agent-Camoufox auf :8500) betreibt. Das ist das Gehirn — und die einzige Komponente, die Ihre API-Keys berührt.

**Zone 2.5 — Operator-oder-Internal.** Reservierte Control-Plane-Operationen, die dem Operator-Agenten oder internem Mesh-Tooling zur Verfügung stehen — Flottenverwaltung, Agentenbearbeitung, Berechtigungs-Grants (der Operator kann `can_spawn` oder `can_use_wallet` nicht gewähren).

**Zone 3 — Loopback-Only Internal.** Die am stärksten beschränkte Ebene: Endpoints, die sowohl einen `x-mesh-internal: 1`-Header als auch eine Loopback-Quell-IP verlangen. Wird nur für mesh-interne Koordinationsaufrufe genutzt.

Diese Architektur bedeutet, dass [KI-Agenten-Orchestrierung](/learn/ai-agent-orchestration) und Sicherheit keine getrennten Anliegen sind — sie sind dasselbe System.

## Loslegen

```bash
git clone https://github.com/openlegion-ai/openlegion.git
cd openlegion && ./install.sh
openlegion start # Inline-Setup beim ersten Start, dann werden Agenten in isolierten Containern bereitgestellt
```

Die erste Installation dauert 2–3 Minuten. Erfordert Python 3.10+ und Docker.

## CTA

**Bereit, sichere Agenten bereitzustellen?**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist eine KI-Agenten-Plattform?

Eine KI-Agenten-Plattform ist verwaltete Infrastruktur, die die operativen Anliegen beim Betrieb autonomer KI-Agenten übernimmt: Container-Isolation, Credential-Verwaltung, Kostenkontrollen, Orchestrierung und Observability. Sie sitzt über Frameworks wie LangGraph oder CrewAI und liefert die Produktionsschicht, die Frameworks Ihnen überlassen.

### Was ist die beste KI-Agenten-Plattform für die Produktion?

Die beste KI-Agenten-Plattform für die Produktion hängt von Ihren Sicherheits- und Betriebsanforderungen ab. Wenn Sie integrierte Container-Isolation, Vault-vermittelte Credentials und Pro-Agent-Budgets ohne eigene Infrastruktur brauchen, bietet OpenLegion das von Haus aus. Für Teams, die tief im Microsoft-Ökosystem stecken, ist Azure AI Agent Service einen Blick wert. Für maximale Flexibilität mit mehr DIY-Aufwand bietet Self-Hosting von LangGraph mit LangSmith starke Observability.

### Was ist eine Enterprise-KI-Agenten-Plattform?

Eine Enterprise-KI-Agenten-Plattform ergänzt Governance-, Compliance- und Sicherheitskontrollen über grundlegender Agenten-Orchestrierung. Schlüsselanforderungen: Credential-Isolation (Agenten sollten nie rohe API-Keys sehen), Workflow-Nachvollziehbarkeit, Budgetdurchsetzung gegen explodierende Kosten, rollenbasierte Zugriffskontrolle und Deployment-Optionen, die Datenresidenz-Anforderungen unterstützen. OpenLegions Architektur ist für Umgebungen ausgelegt, die diese Kontrollen verlangen.

### Kann ich KI-Agenten mit meinen eigenen API-Keys hosten?

Ja. OpenLegion nutzt ein BYO-API-Key-Modell. Sie verbinden eigene Keys von jedem LLM-Provider — OpenAI, Anthropic, Google, Mistral und 100+ weitere via LiteLLM. Ihre Tokens fließen direkt an den Provider zu dessen veröffentlichten Preisen. Bringen Sie eigene LLM-API-Keys mit. Kein Aufschlag auf Modellnutzung.

### Verwaltete vs. selbst gehostete KI-Agenten: Was ist der Unterschied?

Verwaltete KI-Agenten-Plattformen übernehmen für Sie Container-Provisionierung, Credential-Vaulting, Kostenkontrollen und Observability. Selbst gehostet bedeutet, dass Sie ein Framework (LangGraph, CrewAI, AutoGen) auf eigener Infrastruktur ausspielen und diese operativen Schichten selbst bauen. Verwaltet ist schneller in der Produktion und erfordert weniger DevOps-Investition. Selbst gehostet bietet maximale Infrastrukturkontrolle. OpenLegion bietet ein Hybrid: source-available Code (BSL 1.1), den Sie selbst hosten können, mit integrierten verwalteten Plattformfähigkeiten.

### Wie vergleicht sich OpenLegion mit anderen KI-Agenten-Plattformen?

OpenLegion differenziert sich über die Security-First-Architektur. Laut öffentlicher Dokumentation zum Zeitpunkt des Schreibens bietet kein anderes großes [KI-Agenten-Framework](/learn/ai-agent-frameworks) integrierte Vault-vermittelte Credentials, verpflichtende Pro-Agent-Container-Isolation oder native Pro-Agent-Budgetdurchsetzung. Siehe unseren [Frameworks-Vergleich](/learn/ai-agent-frameworks) für eine detaillierte Aufschlüsselung quer durch OpenClaw, LangGraph, CrewAI, AutoGen und Semantic Kernel.

### Welche Lizenz nutzt OpenLegion?

OpenLegion ist source-available unter der BSL-1.1-Lizenz und auf [GitHub](https://github.com/openlegion-ai/openlegion) verfügbar. Das Projekt bietet zudem eine gehostete Plattform für Teams, die verwaltete Infrastruktur ohne Self-Hosting wünschen.

### Wie schnell kann ich meinen ersten Agenten ausspielen?

Drei Befehle und unter drei Minuten. `git clone`, `./install.sh`, `openlegion start`. Der geführte Setup-Assistent konfiguriert Ihre API-Keys, wählt ein Team-Template und stellt Ihre erste isolierte Agenten-Flotte automatisch bereit.

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
