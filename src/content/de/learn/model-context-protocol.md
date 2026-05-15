---
title: Model Context Protocol (MCP) — Wie KI-Agenten Tools nutzen
description: >-
  Das Model Context Protocol (MCP) ist Anthropics offener Standard, der
  KI-Agenten ermöglicht, externe Tools zu entdecken und aufzurufen. Funktionsweise,
  Sicherheitshinweise und OpenLegions MCP-Unterstützung.
slug: /learn/model-context-protocol
primary_keyword: model context protocol
secondary_keywords:
  - MCP
  - MCP server
  - MCP client
  - MCP integration
  - anthropic mcp
  - mcp tools
  - mcp security
  - mcp agents
date_published: 2026-05
last_updated: 2026-05
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison
---

# Model Context Protocol: Der offene Standard für KI-Agenten-Tools

**Model Context Protocol** (MCP) ist der offene Standard, den Anthropic im November 2024 veröffentlichte und der KI-Agenten ermöglicht, externe Tools zu entdecken und aufzurufen — Datenbanken, Dateisysteme, APIs, interne Dienste — ohne maßgeschneiderten Glue-Code zu schreiben. MCP-Server stellen Fähigkeiten bereit; MCP-Clients (Agenten-Runtimes, IDEs, Assistenten) konsumieren sie. Das Protokoll ist bewusst minimal — das ist auch sein Produktions-Haken: Deployments müssen Authentifizierung, Sandboxing und Pro-Tool-Budgets darüber legen, bevor sie produktionssicher sind.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist das Model Context Protocol?**
> Das Model Context Protocol ist ein offener JSON-RPC-basierter Standard, ursprünglich von Anthropic veröffentlicht, der definiert, wie KI-Agenten (Clients) Fähigkeiten entdecken und aufrufen, die von Tools (Servern) bereitgestellt werden. Es ist das Pendant des KI-Agenten-Ökosystems zu LSP für Editoren oder USB für Hardware: ein Protokoll, viele Implementierungen.

## Auf einen Blick

- **MCP ist der USB-Port des Agenten-Ökosystems** — ein Protokoll, mit dem jede konforme Agenten-Runtime jeden konformen Tool-Server nutzen kann, ohne eigenen Glue-Code zu schreiben.
- **Anthropic veröffentlichte MCP im November 2024**; namhafte Adoptierer 2025 sind OpenAI, Microsoft Copilot, Cursor, Zed, Continue und die meisten Agenten-Frameworks.
- **MCP definiert vier Primitiv-Typen**: Tools (funktionsähnliche Calls), Resources (Read-only-Daten), Prompts (wiederverwendbare Templates) und Sampling (server-initiierte LLM-Calls zurück an den Client).
- **Transport ist JSON-RPC über stdio oder HTTP/SSE**. Stdio ist die dominante lokale Form; HTTP/SSE gewinnt für remote MCP-Server.
- **Produktions-MCP erfordert drei Schichten, die die meisten Tutorials überspringen**: Authentifizierung, Sandboxing und Budgetdurchsetzung auf Tool-Calls.

## Wie MCP funktioniert

Ein MCP-Client (eine Agenten-Runtime oder ein KI-Assistent) verbindet sich mit einem oder mehreren MCP-Servern. Beim Verbindungsaufbau fragt der Client eine Capability-Liste an — welche Tools, Resources und Prompts bietet dieser Server? Jedes Tool annonciert ein JSON-Schema für seine Argumente. Das LLM des Agenten sieht die Tool-Liste als Teil seines Kontexts und wählt entsprechende Tool-Calls. Der Client routet die Calls an den richtigen Server, marshallt JSON und liefert Ergebnisse zurück.

Der Transport ist JSON-RPC 2.0. Zwei Transporte sind verbreitet: stdio (der Client spawnt den Server als Subprozess und kommuniziert über stdin/stdout — Standard in Claude Desktop) und HTTP mit Server-Sent Events für remote Server, die über eine Netzwerkgrenze hinweg leben.

Das Protokoll selbst ist bewusst minimal. Die Komplexität liegt darin, was MCP-Server bereitstellen: Ein Filesystem-Server gibt einem Agenten Lese- und Schreibzugriff auf ein Verzeichnis; ein Postgres-Server gibt Abfragezugriff; ein Slack-Server bietet Nachrichten-Send- und Channel-Read-Fähigkeiten. Derselbe Agent kann gleichzeitig mit mehreren Servern verbunden sein.

## MCP-Server vs. MCP-Clients

**MCP-Server** sind die Tool-Seite. Jeder kann einen schreiben — Anthropic veröffentlicht Referenz-SDKs in Python und TypeScript. Stand Mitte 2026 existieren Tausende Community-Server für GitHub, Notion, Linear, Postgres, AWS, Browser-Automatisierung und mehr. Server sind tendenziell klein (ein paar hundert Zeilen), weil das Protokoll die meiste Arbeit erledigt.

**MCP-Clients** sind Agenten-Runtimes, IDEs und Assistenten. Claude Desktop war der Referenz-Client. Cursor, Zed, Continue, Windsurf und die meisten Agenten-Frameworks fügten 2025 MCP-Client-Unterstützung hinzu. Ein einzelner MCP-Client unterstützt typischerweise mehrere gleichzeitige Server-Verbindungen — ein Agent spricht parallel mit einem Filesystem-Server, einem Datenbankserver und einem Slack-Server.

Die Schlüsseleinsicht: Das LLM spricht nicht direkt MCP. Der Client rendert die MCP-Tool-Liste als Funktionsdefinitionen innerhalb des LLM-Prompts; das LLM emittiert einen Funktionsaufruf; der Client mappt den Aufruf auf den richtigen MCP-Server und leitet die JSON-RPC-Anfrage weiter.

## Sicherheitserwägungen für Produktions-MCP

MCP ist ein *Capability-Exposure*-Protokoll — kein Autorisierungs- oder Audit-Protokoll. Produktions-Deployments müssen die Teile ergänzen, die MCP bewusst auslässt:

- **Authentifizierung**: Die meisten MCP-Server laufen lokal unauthentifiziert. Ein mehrmandantenfähiges Deployment braucht Pro-Agent-Credentials und Pro-Server-Auth-Grenzen.
- **Sandboxing**: Ein MCP-Filesystem-Server mit breitem Pfadzugriff ist funktionell Root auf dem Host. Betreiben Sie MCP-Server in Containern; mounten Sie sensible Volumes nicht blind.
- **Budgetdurchsetzung**: Tool-Calls sind nicht kostenlos. Ein Agent, der einen MCP-Web-Scraping-Server in einer Schleife aufruft, kann erhebliche Kosten anhäufen. Pro-Agent-Budgets müssen Tool-Invokationen abdecken, nicht nur LLM-Tokens.
- **Audit-Logs**: MCP selbst standardisiert kein Call-Logging. Produktions-Runtimes müssen jeden Server-Call mit Argumenten, Response-Form und Timing für [KI-Agenten-Sicherheits](/learn/ai-agent-security)-Review und Incident-Response aufzeichnen.

Die Referenz-MCP-Integration von Claude Desktop mountet Server als Host-Subprozesse mit den Filesystem-Berechtigungen des Host-Nutzers. Das funktioniert für Single-User-Developer-Setups; es ist nicht produktionssicher.

## Wie OpenLegion MCP integriert

OpenLegion ist standardmäßig ein MCP-Client. Agenten in der Runtime entdecken automatisch für ihre Flotte konfigurierte MCP-Server, sehen die Tool-Liste in ihrem Kontextfenster und rufen MCP-Tools über denselben Vault-vermittelten, ACL-gegateten Pfad wie integrierte Skills auf. Das Mesh erzwingt die Produktions-grade-Schichten, die MCP auslässt:

- Jeder MCP-Server läuft in seinem eigenen sandboxed Namespace; der Agent erhält nie direkten stdio-Zugriff auf den Server-Prozess.
- Pro-Agent-ACLs steuern, welche MCP-Server ein bestimmter Agent aufrufen darf.
- Jeder Tool-Call zählt auf das Pro-Agent-Budget; ein Agent, der sein Cap überschreitet, wird abgeschnitten, egal ob die Ausgaben aus LLMs oder MCP-Tools kamen.
- Das Mesh zeichnet jeden MCP-Call ins Trace-Log auf — dieselbe Telemetrie, die in [KI-Agenten-Observability](/learn/ai-agent-observability) behandelt wird.

Das Ergebnis: Sie erhalten die Breite des MCP-Ökosystems, ohne dessen Standard-Vertrauensannahmen zu erben.

## OpenLegions Standpunkt

MCP ist der wichtigste Agenten-Ökosystem-Standard seit OpenAPI — er kollabiert, was sonst N × M Integrationsarbeit wäre (jedes Agenten-Framework mal jedes Tool) in N + M Server und Clients. Aber der bewusste Minimalismus des Protokolls bedeutet, dass Produktions-Teams die langweilige Infrastruktur — Auth, Sandboxing, Budgets, Audit — wieder aufbauen müssen, die proprietäre Systeme gebündelt hatten. Frameworks, die MCP als Just-Add-Water behandeln, ohne diese Anliegen zu schichten, liefern Agenten, die standardmäßig unsicher sind. Wählen Sie eine [KI-Agenten-Plattform](/learn/ai-agent-platform), die MCP ernst genug nimmt, um es einzuhegen.

## CTA

**Spielen Sie MCP-kompatible Agenten mit integrierten Produktions-grade-Kontrollen aus.**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist das Model Context Protocol?

Das Model Context Protocol (MCP) ist ein offener JSON-RPC-Standard, der von Anthropic im November 2024 eingeführt wurde und KI-Agenten ermöglicht, externe Tools über eine einheitliche Schnittstelle zu entdecken und aufzurufen. MCP-Server stellen Fähigkeiten bereit (Tools, Resources, Prompts); MCP-Clients (Agenten-Runtimes, IDEs, Assistenten) konsumieren sie. Namhafte Adoptierer 2025 sind OpenAI, Microsoft Copilot, Cursor, Zed und die meisten Agenten-Frameworks.

### Wer hat MCP geschaffen und ist es offen?

Anthropic schuf MCP und veröffentlichte es unter einer offenen Spezifikation mit Referenz-SDKs in Python und TypeScript. Die Spezifikation wird community-getrieben via GitHub gepflegt, es gibt kein Lizenz- oder Proprietary-Lock-in. Jeder kann einen MCP-Server oder -Client schreiben, und die großen LLM-Anbieter liefern MCP-kompatibles Tooling.

### Was ist der Unterschied zwischen einem MCP-Server und einem MCP-Client?

Ein MCP-Server stellt Fähigkeiten bereit — ein Postgres-Server stellt Query-Tools bereit, ein Filesystem-Server stellt Lesen und Schreiben von Dateien bereit, ein Slack-Server stellt Nachrichten-Send bereit. Ein MCP-Client ist die Konsumentenseite — typischerweise eine Agenten-Runtime, eine IDE oder ein KI-Assistent. Ein Client kann sich mit vielen Servern gleichzeitig verbinden; ein Server kann von vielen Clients wiederverwendet werden.

### Ist MCP standardmäßig sicher?

Nein — und das ist beabsichtigt. MCP ist ein Capability-Exposure-Protokoll, kein Autorisierungs-Protokoll. Die Referenz-Implementierungen (Claude Desktop, die SDK-Beispiele) betreiben Server unauthentifiziert als Host-Subprozesse mit den Filesystem-Berechtigungen des Nutzers. Produktions-Deployments müssen Authentifizierung, Sandboxing, Pro-Tool-Budgets und Audit-Logging über MCP selbst hinaus ergänzen.

### Wie vergleicht sich MCP mit OpenAI Function Calling?

OpenAI Function Calling ist ein Einzelanbieter-Muster, das einem LLM ermöglicht, Funktionen aufzurufen, die in der API-Anfrage definiert sind — es standardisiert nicht, wie Tools entdeckt, paketiert oder systemübergreifend geteilt werden. MCP ist ein anbieterübergreifender offener Standard für dasselbe Problem auf Ökosystem-Ebene. Die beiden sind komplementär: MCP-Server stellen Fähigkeiten bereit; ein MCP-Client kann sie als OpenAI-Format-Funktionsdefinitionen rendern, wenn er GPT-Modelle aufruft, oder als Anthropic-Tool-Use-Format, wenn er Claude aufruft.

### Kann ich MCP mit jedem LLM-Anbieter nutzen?

Ja. MCP ist LLM-agnostisch — der Client rendert MCP-Tool-Definitionen in das Format, das das zugrundeliegende LLM erwartet (Anthropic Tool Use, OpenAI Function Calling, Gemini Function Declarations). Runtimes wie OpenLegion, die 100+ Anbieter via LiteLLM unterstützen, passen MCP-Tools automatisch an die Calling-Convention jedes Anbieters an.
