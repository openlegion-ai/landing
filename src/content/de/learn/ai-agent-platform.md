---
title: KI-Agenten-Plattform — Sichere Agenten bereitstellen
description: >-
 OpenLegion ist eine verwaltete KI-Agenten-Plattform mit gesandboxten Aufgabenläufen,
 Credential-Vaulting und Budgets pro Agent. Nichts zu installieren.
slug: /learn/ai-agent-platform
primary_keyword: ki-agenten-plattform
secondary_keywords:
 - managed ai agent platform
 - self-hosted agent deployment
 - ai agent cost control
 - ai agent credential security
 - production ai agent infrastructure
date_published: 2026-03
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

Eine **KI-Agenten-Plattform** beantwortet diese Fragen, bevor Sie Ihren ersten Agenten schreiben. OpenLegion ist eine verwaltete KI-Agenten-Plattform, die gesandboxte Aufgabenläufe, Credentials im Vault, Credit-Budgets pro Agent und Ziel-und-Aufgaben-Koordination (Ziele → Aufgaben → Agenten) mitbringt — alle standardmäßig aktiviert. Es ist eine gehostete Web-App: mit Google anmelden und loslegen. Es gibt nichts zu installieren.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist eine KI-Agenten-Plattform?**
> Eine KI-Agenten-Plattform ist verwaltete Infrastruktur zum Bereitstellen, Orchestrieren und Governen autonomer KI-Agenten in Produktion. Anders als reine Frameworks übernimmt eine Plattform Isolation, Credential-Verwaltung, Kostenkontrollen und Observability, sodass Teams Agenten ausspielen, ohne DevOps von Grund auf zu bauen.

## Auf einen Blick

- **Plattform, nicht Framework** — OpenLegion verwaltet Läufe, Credentials, Budgets und Freigaben. Sie verwalten Agentenlogik.
- **Credentials im Vault** — Credentials werden außerhalb des Modells injiziert, das immer nur ein Handle hält. Agenten sehen nie rohe Keys.
- **Ein Sandbox-Lauf pro Aufgabe** — Jede Aufgabe läuft bei Bedarf und endet dann, es gibt also keinen langlebigen Agentenprozess zu kompromittieren, und Code, den der Agent schreibt, läuft standardmäßig ohne Netzwerkzugriff.
- **Budgetdurchsetzung pro Agent** — Jeder Agent trägt sein eigenes Credit-Budget, abgerechnet zu $0,001 je Credit, mit automatischer Hartabschaltung. Keine Überraschungsrechnungen.
- **Modell-Presets** — Wählen Sie Smartest, Smart oder Normal pro Agent oder pro Workspace. Sie verdrahten nie einen Provider und rotieren nie einen Key.
- **Auditierbare Ziel-und-Aufgaben-Koordination** — Arbeit wird als Ziele → Aufgaben → Agenten organisiert, mit einem Assistenten, der die nötigen Teammitglieder erstellt. Kein "CEO-Agent" trifft intransparente Entscheidungen.
- **Integriertes Tool-Set** — Web-Suche und -Abruf, Dateien, Langzeitgedächtnis, Zeitpläne, gesandboxte Code-Ausführung und teilbare Ergebnisse. Für jeden Agenten verfügbar.
- **Persistentes Agenten-Gedächtnis** — Agenten erinnern sich session-übergreifend per Vektor-Suche, Workspace-Dateien und Fehlerlernen. Kontext wird automatisch verwaltet.

## Verwaltet vs. selbst gehostet: Wann was Sinn ergibt

Die Unterscheidung zwischen KI-Agenten-Frameworks und KI-Agenten-Plattformen zählt am stärksten beim Deployment. Ein Framework gibt Ihnen Bausteine — Agentendefinitionen, Tool-Integrationen, Konversationsmuster. Eine Plattform liefert die Produktionsschicht: Wo Agenten laufen, wie sie auf Credentials zugreifen, was sie davon abhält, aus dem Ruder zu laufen.

**Selbst gehostete Frameworks** (LangGraph, CrewAI, AutoGen) geben Ihnen maximale Kontrolle. Sie besitzen die Infrastruktur. Sie konfigurieren die Container. Sie bauen die Credential-Pipeline. Das funktioniert, wenn Ihr Team dedizierte DevOps-Kapazität hat und bestehende Infrastruktur, mit der Agenten tief integriert werden müssen.

**Verwaltete KI-Agenten-Plattformen** übernehmen die operative Schicht, sodass Ihr Team sich auf Agentenlogik konzentriert. OpenLegion sitzt hier — mit einem entscheidenden Unterschied: Es ist source-available unter PolyForm Perimeter License 1.0.1. Sie bekommen Plattform-grade Operations (Isolation, Vaulting, Budget-Kontrollen) ohne Vendor Lock-in auf der Infrastrukturseite.

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

## Das Modell-Preset-System — warum es zählt

Die meisten verwalteten KI-Plattformen machen die Modellwahl zu Ihrem Problem: Provider wählen, Key verdrahten, rotieren, nachjustieren. Das schafft zwei Probleme: Kostenintransparenz und Provider-Lock-in.

OpenLegion geht einen anderen Weg. Modelle werden per Preset gewählt — Smartest, Smart oder Normal — pro Agent oder pro Workspace, es gibt also keinen Provider zu verdrahten und keinen Key zu rotieren. Arbeit wird in Credits zu je $0,001 abgerechnet, und die exakten Kosten jeder Aufgabe sind in der App sichtbar.

Das zählt aus drei Gründen:

**Kostentransparenz.** Sie sehen genau, was jeder Agent ausgibt und was jede Aufgabe gekostet hat. Jede Arbeitseinheit ist ein festgehaltener Lauf mit einem Preis daran, keine Zeile in einer Monatsrechnung.

**Modell-Flexibilität.** Tauschen Sie Presets pro Agent. Betreiben Sie Smartest für komplexes Reasoning, Smart für Alltagsarbeit und Normal für hochvolumige Klassifizierung — alles im selben Workspace, verwaltet aus demselben Dashboard.

**Kein Lock-in.** Wenn Sie OpenLegion verlassen, können Sie den Workspace exportieren — Agenten, Aufgaben, Belege und Ergebnisse — und löschen, was zurückbleibt. Es gibt keine proprietäre Modellschicht, von der Sie wegmigrieren müssen.

## Für wen

### Solo-Entwickler, die Agenten-Produkte bauen

Sie spielen ein agentengetriebenes Produkt aus und brauchen es ab Tag eins sicher. OpenLegion liefert Produktionsinfrastruktur — Sandbox-Läufe, Credential-Vaulting, Kostenkontrollen — ohne ein DevOps-Team einstellen zu müssen. Beschreiben Sie das gewünschte Ergebnis, und der Assistent erstellt die Teammitglieder, die es braucht.

### Startup-Teams, die schnell ausliefern

Ihr Team hat 2–10 Engineers. Sie brauchen Agenten in Produktion in diesem Sprint, nicht im nächsten Quartal. Es gibt keine Installation: OpenLegion ist eine gehostete Web-App, und Sie melden sich mit Google an. Kostenlos sind 0 $ mit 1.000 einmaligen Credits ohne Kreditkarte, sodass Ihr erster Agent Minuten nach der Anmeldung arbeitet.

### Enterprise-Sicherheits-Teams

Sie brauchen Request-Tracing und Workflow-Observability, Credential-Isolation, die einen kompromittierten Agenten übersteht, und Budget-Kontrollen, die explodierende Kosten verhindern. OpenLegions Architektur ist für Umgebungen ausgelegt, die Defense-in-Depth erfordern. Auditierbare Ziel-und-Aufgaben-Koordination bedeutet, dass jeder Workflow-Schritt explizit und nachvollziehbar ist — kein intransparentes LLM-Entscheiden in der Control Plane. Siehe unsere Seite zur [KI-Agenten-Sicherheit](/learn/ai-agent-security) für das vollständige Threat Model.

## Produktionsreife: Was OpenLegion übernimmt vs. DIY

| Funktion | DIY (nur Framework) | OpenLegion |
|---|---|---|
| **Agenten-Runtime** | Sie konfigurieren Docker, verwalten Images, übernehmen Networking | Agenten sind dauerhafte Datensätze, keine Server; jede Aufgabe läuft bei Bedarf in einer Sandbox und endet dann |
| **Credential-Verwaltung** | Umgebungsvariablen oder eigene Vault-Integration | Credentials im Vault, außerhalb des Modells injiziert — Agenten sehen nie rohe Keys |
| **Kostenkontrollen** | Manuelles Tracking, keine harten Limits | Credit-Budgets pro Agent zu $0,001 je Credit, mit automatischer Abschaltung |
| **Orchestrierung** | Eigene Routing-Logik oder LLM-basiertes Routing | Ziel-und-Aufgaben-Koordination (Ziele → Aufgaben → Agenten) — auditierbar |
| **Observability** | LangSmith, Datadog oder eigenes Logging integrieren | Integriertes Dashboard mit Live-Streaming, Kostencharts, Request-Traces |
| **Multi-Channel-Deployment** | Integrationen pro Kanal bauen | Web-Chat in jedem Plan, Telegram und Webhooks ab Pro, Slack und eingehende E-Mail ab Team |
| **Browser-Automatisierung** | Playwright/Puppeteer konfigurieren, Chrome-Instanzen verwalten | Zum Start nicht angeboten — Agenten lesen das Live-Web stattdessen mit integrierter Suche und Abruf |
| **Tool-Erweiterbarkeit** | Eigene Integrationen bauen oder LangChain-Tools nutzen | Integriert — Web-Suche und -Abruf, Dateien, Gedächtnis, Zeitpläne, gesandboxte Code-Ausführung, teilbare Ergebnisse |
| **Agenten-Gedächtnis** | Eigenes RAG oder State-Management bauen | Persistentes Vektor-Gedächtnis pro Agent mit automatischer Kontextverwaltung |
| **Modell-Failover** | Eigene Retry-Logik pro Provider | Von der Plattform übernommen — Preset wählen, das Routing erledigt sie |

Die Zusammenfassung: Wenn Sie [KI-Agenten-Frameworks](/learn/ai-agent-frameworks) evaluieren und sich dabei ertappen, mehr Infrastruktur als Agentenlogik zu bauen, lösen Sie ein Plattformproblem mit Framework-Werkzeugen. OpenLegion übernimmt die Plattformschicht, damit Sie sich darauf konzentrieren können, was Ihre Agenten tatsächlich tun.

## Integrierte Tool-Erweiterbarkeit

OpenLegion liefert seine Tools mit der Plattform, statt Sie Server verdrahten zu lassen. Jeder Agent hat ab dem Moment seiner Erstellung Web-Suche und -Abruf, Dateiverarbeitung, Langzeitgedächtnis, Zeitpläne, gesandboxte Code-Ausführung und teilbare Ergebnisse. Connectors zum Start sind Google Calendar und die von Ihnen ausgewählten Google-Drive-Dateien; das Model Context Protocol (MCP) wird zum Start nicht unterstützt.

Integrierte Tools bedeuten, dass ein Agent ab dem Moment seiner Erstellung nützlich ist, ohne Installation und ohne Konfiguration. Jeder Tool-Aufruf ist eine Absicht, die eine einzige Policy-Engine prüft, bevor er geschieht, sodass Agenten in ihren Berechtigungsgrenzen bleiben und jeder Aufruf als Beleg festgehalten wird.

## Persistentes Agenten-Gedächtnis

Agenten in OpenLegion pflegen Gedächtnis über Sessions hinweg per Vektor-Suche, Workspace-Dateien und Fehlerlernen. Wenn ein Agent ein Problem antrifft und löst, wird die Lösung gespeichert und in künftigen Sessions wieder aufgerufen — das reduziert wiederholte Fehlschläge und verbessert die Ausführungsqualität über die Zeit.

Das Gedächtnis ist pro Agent gescopt und von jedem anderen Agenten und jedem anderen Workspace isoliert. Automatische Kontextverwaltung hält den Token-Verbrauch effizient, indem nur relevante Erinnerungen für die aktuelle Aufgabe hochgeholt werden, statt ganze Konversationshistorien zu laden.

## Architektur: Eine Policy-Engine vor jeder Aktion

OpenLegion trennt jeden Workspace in vier Vertrauensgrenzen plus eine Ebene für Eigentümer-Entscheidungen:

**Ungeprüfte externe Eingaben.** Alles, was von Nutzern oder Drittparteien kommt: Web-Chat, Telegram, Slack, eingehende E-Mail und Webhook-Endpoints. Alle Eingaben werden validiert und über Prompt-Injection-Guards sanitisiert, bevor sie die Policy-Engine erreichen.

**Der Lauf des Agenten (untrusted).** Jede Aufgabe läuft bei Bedarf und endet dann, und Code, den der Agent schreibt, läuft in einer Sandbox ohne standardmäßigen Netzwerkzugriff. Selbst ein vollständig kompromittierter Lauf kann nicht auf Ihre Credentials, die Daten anderer Agenten oder einen anderen Workspace zugreifen.

**Die Policy-Engine (vertrauenswürdig).** Eine Schicht prüft jede Aktion als Absicht, bevor sie geschieht, und hält sie als Beleg fest, den der Eigentümer lesen kann: Tool-Aufruf, Delegation, Freigabe, Kosten. Sie hält das gemeinsame Verzeichnis aus Zielen und Aufgaben, den Credential-Vault, die Berechtigungsmatrix und das Credit-Budget jedes Agenten. Das ist das Gehirn — und die einzige Komponente, die Ihre Credentials berührt.

**Entscheidungen von Eigentümer oder Admin.** Die Arbeit stoppt nur an drei Stellen für eine Freigabe: beim Erreichen Dritter in Ihrem Namen, beim Löschen von Daten und beim Handeln auf ungeprüften Inhalten. Die Entscheidung fällt in der App ein Eigentümer oder Admin, nie ein Agent.

**Nur interne Control Plane.** Die am stärksten beschränkte Ebene: administrative Operationen wie Agenten anlegen, Tool-Berechtigungen gewähren und Pläne ändern, erreichbar über eine einzige Admin-API, die auf einen einzelnen Workspace begrenzt ist.

Diese Architektur bedeutet, dass [KI-Agenten-Orchestrierung](/learn/ai-agent-orchestration) und Sicherheit keine getrennten Anliegen sind — sie sind dasselbe System.

## Loslegen

```text
1. Mit Google bei app.openlegion.ai anmelden — es gibt nichts zu installieren.
2. Dem Assistenten sagen, was zu tun ist; er erstellt die nötigen Agenten.
3. Die erste Aktion freigeben, die Dritte erreicht, dann die Belege lesen.
```

Kostenlos sind 0 $ mit 1.000 einmaligen Credits ohne Kreditkarte. Pro kostet 29 $/Monat mit 10.000.

## CTA

**Bereit, sichere Agenten bereitzustellen?**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist eine KI-Agenten-Plattform?

Eine KI-Agenten-Plattform ist verwaltete Infrastruktur, die die operativen Anliegen beim Betrieb autonomer KI-Agenten übernimmt: Container-Isolation, Credential-Verwaltung, Kostenkontrollen, Orchestrierung und Observability. Sie sitzt über Frameworks wie LangGraph oder CrewAI und liefert die Produktionsschicht, die Frameworks Ihnen überlassen.

### Was ist die beste KI-Agenten-Plattform für die Produktion?

Die beste KI-Agenten-Plattform für die Produktion hängt von Ihren Sicherheits- und Betriebsanforderungen ab. Wenn Sie integrierte Lauf-Isolation, Credentials im Vault und Pro-Agent-Budgets ohne eigene Infrastruktur brauchen, bietet OpenLegion das von Haus aus. Für Teams, die tief im Microsoft-Ökosystem stecken, ist Azure AI Agent Service einen Blick wert. Für maximale Flexibilität mit mehr DIY-Aufwand bietet Self-Hosting von LangGraph mit LangSmith starke Observability.

### Was ist eine Enterprise-KI-Agenten-Plattform?

Eine Enterprise-KI-Agenten-Plattform ergänzt Governance-, Compliance- und Sicherheitskontrollen über grundlegender Agenten-Orchestrierung. Schlüsselanforderungen: Credential-Isolation (Agenten sollten nie rohe API-Keys sehen), Workflow-Nachvollziehbarkeit, Budgetdurchsetzung gegen explodierende Kosten, rollenbasierte Zugriffskontrolle und Deployment-Optionen, die Datenresidenz-Anforderungen unterstützen. OpenLegions Architektur ist für Umgebungen ausgelegt, die diese Kontrollen verlangen.

### Kann ich KI-Agenten mit meinen eigenen API-Keys hosten?

Nein, und Sie brauchen es auch nicht. Modellzugriff ist enthalten: Wählen Sie ein Preset — Smartest, Smart oder Normal — pro Agent oder pro Workspace, und OpenLegion kümmert sich um den Provider. Arbeit wird in Credits zu je $0,001 abgerechnet, sodass Sie die exakten Kosten jeder Aufgabe sehen. Kostenlos sind 0 $ mit 1.000 einmaligen Credits ohne Kreditkarte.

### Verwaltete vs. selbst gehostete KI-Agenten: Was ist der Unterschied?

Verwaltete KI-Agenten-Plattformen übernehmen für Sie Provisionierung, Credential-Vaulting, Kostenkontrollen und Observability. Selbst gehostet bedeutet, dass Sie ein Framework (LangGraph, CrewAI, AutoGen) auf eigener Infrastruktur ausspielen und diese operativen Schichten selbst bauen. Verwaltet ist schneller in der Produktion und erfordert weniger DevOps-Investition. Selbst gehostet bietet maximale Infrastrukturkontrolle. OpenLegion ist verwaltet: Sie melden sich mit Google an und legen los, und die Engine darunter ist source-available unter der PolyForm Perimeter License 1.0.1 veröffentlicht.

### Wie vergleicht sich OpenLegion mit anderen KI-Agenten-Plattformen?

OpenLegion differenziert sich über die Security-First-Architektur. Laut öffentlicher Dokumentation zum Zeitpunkt des Schreibens bietet kein anderes großes [KI-Agenten-Framework](/learn/ai-agent-frameworks) integrierte Credentials im Vault, einen Sandbox-Lauf für jede Aufgabe oder native Pro-Agent-Budgetdurchsetzung. Siehe unseren [Frameworks-Vergleich](/learn/ai-agent-frameworks) für eine detaillierte Aufschlüsselung quer durch OpenClaw, LangGraph, CrewAI, AutoGen und Semantic Kernel.

### Welche Lizenz nutzt OpenLegion?

Die OpenLegion-Engine ist source-available unter der PolyForm Perimeter License 1.0.1 auf [GitHub](https://github.com/openlegion-ai/openlegion) veröffentlicht. Die gehostete Plattform ist proprietär und der Ort, an dem Teams Agenten betreiben, ohne selbst Infrastruktur zu verwalten.

### Wie schnell kann ich meinen ersten Agenten ausspielen?

Minuten, und nichts zu installieren. Mit Google anmelden, dem Assistenten sagen, was zu tun ist, und er erstellt die nötigen Agenten. Kostenlos sind 0 $ mit 1.000 einmaligen Credits ohne Kreditkarte, sodass zwischen Anmeldung und erster Aufgabe nichts steht.

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
