---
title: Mastra Alternative — Sicherheitsorientierte KI-Agenten-Plattform
description: Mastra ist ein TypeScript-Framework mit Dual-Lizenz, RBAC hinter proprietärem ee/-Verzeichnis und CVE-2025-61685 zur Credential-Exposition. Vergleiche Mastra-Alternativen.
slug: /comparison/mastra
primary_keyword: mastra alternative
secondary_keywords:
  - openlegion vs mastra
  - mastra sicherheit
  - mastra typescript agent framework
  - mastra enterprise edition
last_updated: "2026-05-26"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
---

# Mastra Alternative: Sicherheitsorientierte Plattform vs. TypeScript-Framework

Mastra ist ein TypeScript-Agenten-Framework mit 24.329 GitHub-Stars vom Gatsby-Team — aber CVE-2025-61685 (CVSS 6.5) legt `~/.aws`-Credential-Dateien über Cursor-IDE-Prompt-Injection offen, RBAC und Auth sind hinter einem proprietären `ee/`-Verzeichnis gesperrt, und zwei nicht zusammengeführte PRs lassen Open-Redirect- und OAuth-CSRF-Schwachstellen im Enterprise-Auth-Stack ungepatcht (Stand Mai 2026). Eine Mastra-Alternative für sicherheitsorientierte Teams braucht Vault-Proxy-Isolation — keine Umgebungsvariablen für Credentials.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist Mastra?**
> Mastra ist ein Open-Source-TypeScript-Agenten-Framework von Kepler Software (dem Team hinter Gatsby) mit 24.329 GitHub-Stars, veröffentlicht im August 2024. Es bietet Workflow-Orchestrierung, Tool-Calling und RAG-Primitive für JavaScript- und TypeScript-Entwickler unter einer Dual-Lizenz — Apache 2.0 für den Kern und eine proprietäre Lizenz für das `ee/`-Enterprise-Verzeichnis mit Auth, RBAC und Adapter-Berechtigungsdurchsetzung.

## Warum Entwickler eine Mastra-Alternative suchen

### CVE-2025-61685: Credential-Datei-Exposition über MCP-Docs-Server

CVE-2025-61685 (CVSS 6.5, CWE-548, 24. September 2025) ist eine Verzeichnisdurchlauf-Schwachstelle in `@mastra/mcp-docs-server` Versionen ≤0.13.8. Entdeckt von Liran Tal ermöglicht die Schwachstelle Prompt-Injection über Cursor IDE, um Pfad-Traversal-Schutz in `readMdxContent` via `findNearestDirectory` zu umgehen und Dateisystempfade außerhalb des vorgesehenen Docs-Verzeichnisses zu erreichen.

Der praktische Explosionsradius ist eng, aber schwerwiegend für Entwicklerrechner: Das Traversal legt `~/.aws/credentials`, `~/.config/` (mit Dienstkontotoken) und `~/.cursor/` (mit IDE-Konfiguration) offen. Jeder Entwickler mit einer betroffenen Version und Cursor IDE ist dem Lesen von Credential-Dateien durch böswillige Prompts ausgesetzt.

Mastra hat die Schwachstelle in Version 0.17.0 behoben. Teams mit ≤0.13.8 und aktivem MCP-Docs-Server sind weiterhin exponiert.
### Dual-Lizenz: Sicherheitsfunktionen hinter der `ee/`-Paywall

Mastras Apache-2.0-Lizenz deckt das Kern-Framework ab. Das `ee/`-Verzeichnis — mit Auth-Integrationen, RBAC und Adapter-Berechtigungen — ist proprietär und nicht unter der Open-Source-Lizenz verfügbar. Dies schafft drei konkrete Lücken:

**RBAC ist ein Enterprise-Add-on.** Rollenbasierte Zugriffskontrolle für Agentenberechtigungen ist ohne die Enterprise Edition nicht verfügbar. Teams, die einschränken müssen, was bestimmte Agenten tun können, müssen das `ee/`-Upgrade bezahlen.

**Adapter-Berechtigungen sind gesperrt.** Granulare Kontrolle über Adapter-Zugriff (Datenbankverbindungen, API-Integrationen) erfordert den proprietären Tier. In einem mandantenfähigen Agenten-Deployment ist das der Unterschied zwischen Isolation und gemeinsamem Zugriff.

**Auth-Integrationen sind proprietär.** Das `ee/`-Verzeichnis enthält WorkOS AuthKit (`@workos/authkit-session`) und `better-auth` OAuth-Flows. Der Open-Source-Kern hat keine Auth-Primitive.

### Offene Sicherheits-PRs im Enterprise-Auth-Stack

Zwei Sicherheitsschwachstellen in Mastras Enterprise-Auth-Abhängigkeiten sind ab dem 26. Mai 2026 offen und nicht zusammengeführt:

**CVE-2026-42565 (CVSS 4.3)**: Open Redirect in `@workos/authkit-session`. Ein Angreifer kann eine Redirect-URL erstellen, die die Ursprungsvalidierung umgeht und Phishing über vertrauenswürdige Domain-Redirect-Ketten ermöglicht.

**GHSA-wxw3-q3m9-c3jr (CVSS 5.3)**: OAuth-CSRF in `better-auth`. Eine ungepatchte CSRF-Schwachstelle in der OAuth-Callback-Verarbeitung kann einem Angreifer ermöglichen, seine Session mit dem Konto eines Opfers zu verknüpfen.

Beide Schwachstellen existieren im `ee/`-Enterprise-Verzeichnis — dem Tier, das als produktionsreife Sicherheit vermarktet wird.
## OpenLegions Einschätzung: Drei strukturelle Sicherheitslücken

Mastra ist ein gut entwickeltes TypeScript-Framework mit echten Stärken für JS/TS-Teams. Die Entwicklererfahrung ist ausgereift, die Release-Kadenz schnell (24.329 Stars in unter zwei Jahren) und die Workflow-Primitive ausdrucksstark. Aber drei strukturelle Sicherheitslücken kumulieren für Teams in der Produktion:

**Credential-Exposition durch Design.** Mastra-Agenten erhalten Credentials als Umgebungsvariablen — jeder Agentenprozess hält jeden benötigten API-Key. CVE-2025-61685 zeigte, dass die umgebende Toolchain diese Credentials durch Pfad-Traversal erreichen kann, selbst wenn der Agenten-Code sauber ist. OpenLegions Vault-Proxy injiziert Credentials auf der Netzwerkschicht: Kein Agentenprozess erhält je einen Klartext-API-Key, was `~/.aws`-ähnliche Exfiltration strukturell unmöglich macht.

**Sicherheit als Enterprise-Upgrade.** RBAC, Adapter-Berechtigungen und Auth-Integrationen erfordern den proprietären `ee/`-Tier. OpenLegions Vault-Proxy, Container-Isolation pro Agent und Blackboard-Berechtigungen sind Kernfunktionen für alle Nutzer, nicht hinter einem Tier gesperrt.

**Ungepatchte Auth-Schwachstellen im bezahlten Tier.** CVE-2026-42565 und GHSA-wxw3-q3m9-c3jr liegen in `@workos/authkit-session` und `better-auth` — den Auth-Abhängigkeiten im Enterprise-`ee/`-Verzeichnis. OpenLegions CVE-freier Track Record (Stand Mai 2026) spiegelt eine Architektur wider, in der Credentials nie von Agenten gehalten werden.

## Mastra vs. OpenLegion: Direktvergleich

| **Dimension** | **Mastra** | **OpenLegion** |
|---|---|---|
| **Sprachunterstützung** | Nur TypeScript | Python (Agenten); Tool-Interfaces für jede Sprache |
| **Lizenz** | Apache 2.0 (Kern) + proprietäres `ee/` | PolyForm Perimeter License 1.0.1 |
| **GitHub-Stars** | 24.329 (Mai 2026) | Pre-Release |
| **Credential-Modell** | Umgebungsvariablen — Agenten halten Keys | Vault-Proxy — Agenten halten nie Keys |
| **Agenten-Isolation** | Prozessebene, keine Container-Grenze | Obligatorische Docker-Container pro Agent |
| **RBAC** | Nur proprietärer `ee/`-Tier | Pro-Agenten-Blackboard-Berechtigungen (alle Nutzer) |
| **CVE-Track-Record** | CVE-2025-61685 (CVSS 6.5) + 2 offene PRs | 0 gemeldete CVEs |
| **Auth** | WorkOS AuthKit / better-auth (nur `ee/`) | Vault-Proxy (keine Auth-Schicht nötig) |
| **Budget-Kontrollen** | Keine eingebaut | Pro-Agenten tägliche/monatliche Limits |
| **Multi-Agenten** | Workflow-Orchestrierung, Tool-Calling | Blackboard + Pub/Sub + Mesh-Handoff |
| **Offene Issues** | 433 (26. Mai 2026) | Pre-Release |
## TypeScript-Only: Was das in der Praxis bedeutet

### Keine Python-, Go- oder Java-Unterstützung

Mastra ist TypeScript-first per Design und aktuell TypeScript-only. Es gibt kein Python-SDK, keinen Go-Client, keine JVM-Integration. Für Teams mit polyglotten Codebasen oder bestehender Python-ML/Data-Infrastruktur bedeutet die Einführung von Mastra entweder das Umschreiben der Agenten-Logik in TypeScript oder die Akzeptanz, dass Agenten-Koordination keine Sprachgrenzen überschreiten kann.

Das ist keine temporäre Lücke — es ist eine architektonische Entscheidung. Mastra optimiert tief für die TypeScript-Entwicklererfahrung: erstklassige Typ-Inferenz, native async/await-Muster, enge VS-Code-Integration. Das bedeutet keinen Python-Support-Fahrplan. Für Python-first-Teams ist Mastra keine praktikable Option, unabhängig von der Sicherheitslage. OpenLegion, LangGraph, CrewAI und AutoGen unterstützen Python nativ.

Für JS/TS-Shops, die interne Tools bauen, wo der gesamte Stack bereits TypeScript ist, ist Mastras Entwicklererfahrung wirklich ausgezeichnet. Native Typ-Inferenz für Tool-Schemas, enge Node.js-Integration und vertraute `async/await`-Muster lassen Agenten-Entwicklung sich natürlich anfühlen.

Der Trade-off ist für diese Teams richtig: Umgebungsvariablen-Credentials und `ee/`-gesperrtes RBAC im Austausch für TypeScript-first-Entwicklererfahrung akzeptieren — vorausgesetzt, CVE-2025-61685 ist durch Upgrade auf 0.17.0 gemindert und die nicht zusammengeführten Auth-PRs sind bis zu vorgelagerten Fixes akzeptabel.

## Sicherheitsarchitektur: Vault-Proxy vs. Umgebungsvariablen

### Wie Mastra Credentials handhabt

Mastra-Agenten erhalten LLM-API-Keys und Service-Credentials über Umgebungsvariablen — das Standard-Node.js-Muster. Credentials existieren in `process.env` und sind für jeden Code zugänglich, der im Agentenprozess läuft, einschließlich Tool-Callbacks, MCP-Server-Handler und jede Abhängigkeit im `node_modules`-Baum.

CVE-2025-61685 demonstrierte das konkrete Risiko: Ein Verzeichnisdurchlauf in `@mastra/mcp-docs-server` konnte `~/.aws/credentials` erreichen, weil die Prozessumgebung und das Dateisystem vom selben Ausführungskontext wie der verwundbare Server zugänglich waren. Der Agenten-Code selbst wurde nicht ausgenutzt — aber die Credentials waren erreichbar.

### Wie OpenLegion Credentials handhabt

OpenLegions Vault-Proxy sitzt auf der Netzwerkschicht zwischen Agenten und LLM-Anbietern. Agentenprozesse stellen API-Aufrufe über einen Mesh-Client aus. Der Mesh-Host fängt diese Aufrufe ab, ruft Credentials aus dem Vault ab, injiziert sie in den Request-Header und leitet sie weiter. Der Agentenprozess empfängt nie einen Credential-String.

Das macht Credential-Exfiltration im CVE-2025-61685-Angriffsmuster strukturell unmöglich: Es gibt kein `process.env.OPENAI_API_KEY` zu stehlen, keine `~/.aws/credentials` für die Agenten-Ausführung relevant. Für eine tiefere Analyse der Credential-Isolation siehe [KI-Agenten-Sicherheit: Credential-Isolation und Container-Härtung](/learn/ai-agent-security).
## OpenLegion als Mastra-Alternative

### Was OpenLegion bietet

Multi-Agenten-Koordination über Blackboard-State, Pub/Sub-Events und Mesh-Handoff — analog zu Mastras Workflow-Orchestrierung, aber mit expliziten Sicherheitsgrenzen pro Agent. Vault-Proxy-Credential-Injektion, bei der kein Agentenprozess API-Keys hält. Per-Agent Docker-Isolation mit nicht-root-Ausführung und no-new-privileges. Per-Agent tägliche und monatliche Budget-Limits. 100+ LLM-Anbieter über LiteLLM (OpenAI, Anthropic, Google, Cohere, Azure OpenAI, Bedrock). Fleet-Templates für wiederholbare Agenten-Topologie-Deployments.

Für Teams, die bewerten, [was eine KI-Agenten-Plattform über ein Framework hinaus bietet](/learn/ai-agent-platform), deckt der Plattformvergleich die vollständige Trade-off-Landschaft ab.

### Ehrliche Trade-offs

Kein TypeScript-SDK — nur Python. TypeScript-Teams können OpenLegion nicht ohne Python-Agenten oder eine Sprachbrücke nutzen. Keine native Node.js-Ökosystem-Integration oder TypeScript-first-Entwicklererfahrung. Kleinere Community als Mastras 24.329 Stars. Keine eingebaute Workflow-Visualisierung.

OpenLegion ist nicht die richtige Antwort für Teams, deren primäre Einschränkung TypeScript-only-Entwicklung ist.

### Wer OpenLegion statt Mastra in Betracht ziehen sollte

**Python-first oder polyglotte Teams**, für die TypeScript-only-Unterstützung ein Blocker ist, keine Feature.

**Teams, bei denen Credential-Isolation eine harte Anforderung ist** — Sicherheitsreviews, die verlangen, dass Agenten keine Klartext-API-Keys halten können, oder regulierte Umgebungen, in denen Credential-Exposition eine Compliance-Verletzung ist.

**Teams, die RBAC ohne Enterprise-Upgrade benötigen** — Multi-Agenten-Deployments, bei denen die Einschränkung des Zugriffs bestimmter Agenten eine Grundanforderung ist, kein bezahltes Add-on.

**Teams, die durch Mastras offene CVE-Lage blockiert sind** — wenn CVE-2025-61685 und die zwei nicht zusammengeführten Auth-PRs ein inakzeptables Risiko darstellen, ändert eine Zero-CVE-Architektur ohne credential-haltende Agenten diese Bewertung.

Für Teams, die aktuell Mastra nutzen und migrieren müssen: Jedes `@mastra/tool` wird zu einer OpenLegion-`@skill`-Funktion, LLM-Provider-Konfigurationen wechseln von `.env`-Dateien in den Vault, und Agenten-Topologie wechselt von Mastra-Workflow-Definitionen in Fleet-Templates.

Siehe auch: [OpenLegion vs. LangGraph — zustandsbehaftete Orchestrierung und CVE-Historie im Vergleich](/comparison/langgraph), [OpenLegion vs. CrewAI — rollenbasierte Agenten-Koordination](/comparison/crewai) und [OpenLegion vs. AutoGen — Multi-Agenten-Muster](/comparison/autogen). Für einen vollständigen Überblick siehe [KI-Agenten-Frameworks Vergleich 2026](/learn/ai-agent-frameworks).

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist Mastra und wer hat es entwickelt?

Mastra ist ein TypeScript-Agenten-Framework mit 24.329 GitHub-Stars, entwickelt von Kepler Software — dem Team hinter Gatsby — seit August 2024. Es bietet Workflow-Orchestrierung, Tool-Calling, RAG-Primitive und Multi-Agenten-Koordination für TypeScript-Entwickler unter einer Dual-Lizenz: Apache 2.0 für den Kern und eine proprietäre Lizenz für das `ee/`-Enterprise-Verzeichnis mit Auth, RBAC und Adapter-Berechtigungsdurchsetzung.

### Was ist CVE-2025-61685 in Mastra?

CVE-2025-61685 (CVSS 6.5, 24. September 2025) ist ein Verzeichnisdurchlauf in `@mastra/mcp-docs-server` ≤0.13.8, entdeckt von Liran Tal. Prompt-Injection über Cursor IDE umgeht Pfad-Traversal-Schutz in `readMdxContent` via `findNearestDirectory` und legt `~/.aws/credentials`, `~/.config/` und `~/.cursor/` offen. Mastra hat in Version 0.17.0 behoben; Teams mit ≤0.13.8 und aktivem MCP-Docs-Server sind weiterhin exponiert.

### Hat Mastra RBAC im kostenlosen Tier?

Nein. RBAC, Adapter-Berechtigungen und Auth-Integrationen befinden sich in Mastras proprietärem `ee/`-Verzeichnis, nicht unter der Apache-2.0-Open-Source-Lizenz verfügbar. Multi-Agenten-Deployments, die Per-Agent-Berechtigungsdurchsetzung benötigen, erfordern das Enterprise-Edition-Upgrade. OpenLegion bietet Per-Agent-Blackboard-Berechtigungen und Vault-Proxy-Isolation allen Nutzern als Core-Plattform-Features.

### Was sind die ungepatchten Mastra-Sicherheitsprobleme (Stand Mai 2026)?

Zwei Sicherheits-PRs sind in Mastras Enterprise-Auth-Stack offen: CVE-2026-42565 (CVSS 4.3, Open Redirect in `@workos/authkit-session`) und GHSA-wxw3-q3m9-c3jr (CVSS 5.3, OAuth-CSRF in `better-auth`). Beide betreffen das `ee/`-Enterprise-Verzeichnis — den Tier, der als produktionsreife Auth und Sicherheit vermarktet wird. Keiner wurde bis zum 26. Mai 2026 zusammengeführt.

### Können TypeScript-Entwickler OpenLegion nutzen?

OpenLegion-Agenten sind nur Python. TypeScript-Teams müssten Python-Agenten betreiben oder TypeScript-Tooling erstellen, das OpenLegion-APIs aufruft — es gibt kein natives TypeScript-SDK. Für TypeScript-first-Teams sind Mastra (gepatcht auf 0.17.0+), LangGraph oder AutoGen natürlichere Optionen. OpenLegion ist die richtige Wahl, wenn Sicherheitsisolationsanforderungen Sprachpräferenzen überwiegen.

### Ist Mastra stabil genug für die Produktion?

Mastra hat 24.329 GitHub-Stars und aktive Entwicklung seit August 2024 mit 433 offenen Issues (Stand 26. Mai 2026). Die schnelle Release-Kadenz zeigt aktive Entwicklung und Community-Engagement. Teams, die Mastra für die Produktion einsetzen, sollten auf stabile Releases pinnen, das Issue-Tracker beobachten, `@mastra/mcp-docs-server` auf 0.17.0+ aktualisieren und vorgelagerte Fixes für CVE-2026-42565 und GHSA-wxw3-q3m9-c3jr planen, bevor sie sich auf Enterprise-Auth-Features verlassen.

## Loslegen

OpenLegion ist kostenlos auszuprobieren. [Loslegen bei app.openlegion.ai](https://app.openlegion.ai) oder [Plattform-Dokumentation lesen](https://docs.openlegion.ai). Bereits TypeScript-Frameworks evaluieren? Siehe [OpenLegion vs. LangGraph — Sicherheitsarchitektur und CVE-Historie im Vergleich](/comparison/langgraph) für eine Python-native Alternative.
