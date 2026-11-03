---
title: "Browser-Use-Agenten — wie KI-Agenten das Web steuern"
description: "Browser-Use-Agenten ermöglichen KI die autonome Navigation von Websites, das Ausfüllen von Formularen und die Extraktion von Daten. Funktionsweise, Sicherheitsrisiken und sicherer Betrieb in isolierten Containern."
slug: /learn/browser-use-agents
primary_keyword: browser use agents
secondary_keywords:
  - ai browser automation
  - browser agent python
  - web agent llm
  - headless browser ai agent
  - browser use security
date_published: 2026-05
last_updated: 2026-05-30
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/model-context-protocol
---

# Browser-Use-Agenten: Wie KI-Agenten das Web navigieren und steuern

Browser-Use-Agenten sind KI-Systeme, die einen Webbrowser ohne menschlichen Eingriff autonom steuern: URLs aufrufen, Schaltflächen klicken, Formulare ausfüllen, Inhalte extrahieren und Authentifizierung verarbeiten. Sie sind 2026 die am schnellsten wachsende Kategorie von KI-Agenten-Tools, getrieben von Frameworks wie browser-use (96.282 GitHub-Sterne, Stand Mai 2026).

<!-- SCHEMA: DefinitionBlock -->

> **Was ist ein Browser-Use-Agent?**
> Ein Browser-Use-Agent ist ein KI-Agent, der durch DOM-Traversal, Accessibility-Tree-Parsing, Screenshot-Grounding und LLM-gesteuerter Aktionswahl programmgesteuert einen Headless- oder Headed-Webbrowser steuert, um webbasierte Aufgaben autonom zu erledigen.

## Wie Browser-Use-Agenten funktionieren

### Wahrnehmung: DOM, Accessibility-Tree und Screenshot-Grounding

Ein Browseragent muss den aktuellen Seitenstatus verstehen, bevor er handelt. Drei Wahrnehmungsstrategien sind verbreitet.

**DOM-Extraktion** parst die rohe HTML-Struktur der Seite. Schnell und token-effizient, schlägt aber bei canvas-gerenderten Inhalten und komplexen SPAs fehl.

**Accessibility-Tree** liest die integrierte Accessibility-Schicht des Browsers und liefert eine strukturierte semantische Sicht der Seite. Dies ist die primäre Wahrnehmungsmethode von browser-use.

**Screenshot-Grounding** erfasst einen visuellen Screenshot der Seite und übergibt ihn an ein visionsfähiges LLM. Verarbeitet Seiten, bei denen DOM und Accessibility-Tree unzuverlässig sind, kostet aber pro Schritt deutlich mehr Token.

### Aktionen: Klicken, Tippen, Navigieren, Formulare absenden

Der Aktionsraum eines Browseragenten ist breit: URLs aufrufen, Elemente anklicken, Text eingeben, Tasten drücken, scrollen, Dropdowns auswählen, Dateien hochladen oder Browser-Tabs wechseln. Jede Aktion verändert den Seitenstatus.

## Die browser-use-Bibliothek

### 96.282 Sterne in weniger als 7 Monaten

browser-use (GitHub: browser-use/browser-use) startete am 31. Oktober 2024 und erreichte bis Mai 2026 96.282 Sterne und 10.802 Forks. Die Bibliothek abstrahiert Playwright-Sitzungsverwaltung, Accessibility-Tree-Extraktion und Aktionsserialisierung.

### Playwright-Backend: Wie browser-use Chromium steuert

browser-use umhüllt Microsofts Playwright-Automatisierungsbibliothek und fügt eine Agentenschicht hinzu: extrahiert den Accessibility-Tree, wandelt ihn in ein token-effizientes Format um, übersetzt LLM-Aktionsentscheidungen in Playwright-Befehle.

### LLM-Integration: GPT-4o, Claude, Gemini als Reasoning-Schicht

browser-use ist auf der Reasoning-Schicht LLM-agnostisch, unterstützt OpenAI, Anthropic, Google und beliebige OpenAI-kompatible API-Endpunkte.

## OpenLegions Sicht: Browser-Agenten sind das riskanteste Werkzeug

Browser-Agenten sind die riskanteste Werkzeugkategorie im agentischen KI. Ein Browseragent, der klicken, Formulare ausfüllen und Weiterleitungen folgen kann, hat dieselbe Angriffsfläche wie ein Mensch mit vollem Internetzugang.

### Demo: Credential-Diebstahl in 150 Sekunden

Öffentlich dokumentierte Forschung aus 2025 zeigte, dass ein Browseragent durch versteckte Anweisungen in Webseiten in unter 150 Sekunden zur Diebstahl von Credentials manipuliert werden kann. Die Verteidigung ist architektonisch: Wenn Credentials nicht im Kontext des Agenten oder im Prozessspeicher existieren, kann die Injektion sie nicht extrahieren. Bei OpenLegion liegen Credentials in einem Vault und werden außerhalb des Modells injiziert, das immer nur ein Handle hält, sodass sie nie im Kontextfenster des Agenten erscheinen.

### OWASP LLM08 Übermäßige Handlungsfreiheit und Browser-Berechtigungen

Das OWASP LLM Top 10 2025 stuft übermäßige Handlungsfreiheit (LLM08) als Top-Risikokategorie ein. Browser-Agenten sind das Paradebeispiel: Ein Agent mit Berechtigungen zum Navigieren, Lesen, Formulare ausfüllen und Knöpfe klicken kann Käufe tätigen, Nachrichten senden, Konten löschen und Daten exfiltrieren.

### Wie OpenLegion Agenten-Aktionen sandboxt (Sandbox + Freigaben)

OpenLegion liefert zum Start keine Browser-Automatisierung, und Code, den ein Agent schreibt, läuft in einer Sandbox ohne standardmäßigen Netzwerkzugriff. Vier Eigenschaften: kein gemeinsamer Session-Zustand, Fingerprint-Resistenz als Browser-Eigenschaft, Credentials im Vault, Freigaben vor dem Handeln auf ungeprüften Inhalten.

## Architekturmuster für Browser-Agenten

### Headless vs. mit Benutzeroberfläche

**Headless-Modus** ist schneller und läuft in Server-Umgebungen, kann aber von Bot-Schutz-Systemen erkannt werden. Camoufox läuft im Headless-Modus, patcht aber die JavaScript-APIs, auf die Headless-Erkennungsskripte abzielen.

### CAPTCHA-Handling

Drei Ansätze: Verhaltensbasierter Browser (Fingerprint-Resistenz), Solver-Services (1-3$ pro 1000 Lösungen), Human-in-the-Loop-Fallback. OpenLegions Entsprechung ist die Freigabe-Schwelle: Die Arbeit stoppt in der App, wenn ein Eigentümer oder Admin entscheiden muss.

### Credential-Injektion: Credential-Vault vs. hartcodierte Cookies

**Schlechteste Option**: Credentials direkt in Agentenanweisungen. **Schlecht**: Umgebungsvariablen (über `os.environ` zugänglich). **Richtig**: Vault-Proxy-Injektion auf Netzwerkebene.

## Browser-Use-Agenten: Architekturvergleich

| **Dimension** | **OpenLegion** | **browser-use** | **Raw Playwright** | **Stagehand** |
|---|---|---|---|---|
| **Ausführungs-Backend** | Keins zum Start — keine Browser-Automatisierung | Playwright (Chromium) | Playwright | Cloud-Chromium |
| **Session-Isolierung** | Gesandboxter Lauf pro Aufgabe | Geteilter Prozess | Implementierungsabhängig | Cloud-verwaltet |
| **Credential-Handling** | Im Vault, außerhalb des Modells injiziert | Durch Kontextfenster | Manuelle Implementierung | Verwaltet |
| **CAPTCHA-Unterstützung** | Entfällt — keine Browser-Automatisierung | Keine eingebaut | Keine eingebaut | Solver-Service |
| **Container-Sandboxing** | Gesandboxter Aufgabenlauf, kein Netzwerk | Keines | Keines | Cloud-Sandbox |
| **GitHub-Sterne** | — | 96.282 (Mai 2026) | N/A | ~9.000 |
| **Lizenz** | PolyForm Perimeter 1.0.1 (Engine) | MIT | Apache 2.0 | MIT |

## Wann Browser-Agenten einsetzen (und wann nicht)

**Legitime Anwendungsfälle**: Web-Recherche und Datenextraktion, Formularautomatisierung für eigene Services, Monitoring und Tests. **Anwendungsfälle mit zusätzlicher Kontrolle**: Authentifizierte Sitzungen, Finanzwebsites. **Ohne striktes Sandboxing vermeiden**: Nicht vertrauenswürdige nutzerbereitgestellte URLs.

## Sicher mit Agenten-Aktionen in OpenLegion starten

**Agenten mit Credentials im Vault, einem Sandbox-Lauf pro Aufgabe und Freigaben vor dem Handeln betreiben.**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai) | [Plattform ansehen](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was sind Browser-Use-Agenten?

Browser-Use-Agenten sind KI-Systeme, die Webbrowser durch DOM-Traversal, Accessibility-Tree-Parsing und LLM-gesteuerte Aktionswahl autonom steuern. Die browser-use-Bibliothek (96.282 GitHub-Sterne, MIT-Lizenz, gestartet Oktober 2024) ist die am weitesten verbreitete Open-Source-Implementierung.

### Wie funktioniert die browser-use-Bibliothek?

browser-use umhüllt Microsofts Playwright, gibt dem LLM eine strukturierte Ansicht des Browser-Accessibility-Trees und übersetzt dann LLM-Aktionsentscheidungen in Playwright-Befehle. Unterstützt GPT-4o, Claude, Gemini und kompatible LLMs, MIT-lizenziert, erfordert etwa 20 Zeilen Python für einen funktionierenden Agenten.

### Welche Sicherheitsrisiken haben Browser-Use-Agenten?

Drei Hauptrisiken: Prompt-Injektion über Webinhalte (Demo 2025 zeigte Credential-Diebstahl in 150 Sekunden), Credential-Leakage (wenn Session-Cookies im Prozessspeicher des Agenten liegen), übermäßige Handlungsfreiheit (OWASP LLM08:2025). Zero-Click-Link-Preview-Exfiltration wurde ebenfalls demonstriert.

### Wie führt man Browser-Agenten sicher aus?

Vier Kontrollen sind erforderlich: Container-Isolierung, Credentials im Vault, Netzwerk-Egress-Kontrolle, agentenspezifische Budgetlimits. OpenLegion liefert zum Start keine Browser-Automatisierung, wendet aber dieselben vier Kontrollen auf jede Agenten-Aktion an.

### Was ist Camoufox und nutzt OpenLegion es?

Camoufox ist ein Firefox-basierter Headless-Browser, der JavaScript-APIs patcht, um realistische Hardware-Profile statt Headless-Signaturen zu melden. OpenLegion nutzt zum Start weder Camoufox noch eine andere Browser-Automatisierung; seine Isolation kommt aus einem gesandboxten Lauf pro Aufgabe.

### Was ist der Unterschied zwischen browser-use und Playwright für KI-Agenten?

Playwright ist eine Low-Level-Browser-Automatisierungsbibliothek ohne KI-Agenten-Konzept. browser-use fügt die Agentenschicht hinzu: wandelt den Browserzustand in ein LLM-lesbares Format um, übersetzt LLM-Aktionen in Playwright-Befehle, behandelt mehrstufige Aufgabenzerlegung über Seiten hinweg.

### Können Browser-Use-Agenten Anmeldungen und authentifizierte Sitzungen verarbeiten?

Ja, aber die Verarbeitung authentifizierter Sitzungen ist eine der riskantesten Operationen. OpenLegion hält Credentials in einem Vault und injiziert sie außerhalb des Modells, das immer nur ein Handle hält.

### Wie verarbeiten Browser-Agenten CAPTCHAs?

Drei Ansätze: Verhaltensbasierter Browser (Fingerprint-Resistenz), Solver-Services (1-3$ pro 1000 Stück, 10-60 Sekunden Latenz), Human-in-the-Loop-Fallback. OpenLegion hat zum Start keine Browser-Automatisierung; seine Human-in-the-Loop-Entsprechung ist eine Freigabe-Schwelle in der App.
