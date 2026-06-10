---
title: "KI-Agenten Tool-Nutzung — Funktionsaufrufe, Schemas und sichere Ausführung"
description: "Wie KI-Agenten Tools nutzen: Tool-Schemas definieren, Funktionsaufrufe über Anbieter hinweg, parallele und verkettete Aufrufe, Ausgabe-Parsing, Fehlerwiederherstellung und Berechtigungsscoping für sichere Produktion."
slug: /learn/ai-agent-tool-use
primary_keyword: ki agenten tool nutzung
last_updated: "2026-06-08"
schema_types:
  - FAQPage
related:
  - /learn/agentic-workflows
  - /learn/model-context-protocol
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-evaluation
  - /learn/ai-agent-frameworks
---

# KI-Agenten Tool-Nutzung: Funktionsaufrufe, Schemas und sichere Ausführung

KI-Agenten Tool-Nutzung ist der Mechanismus, durch den ein LLM die Ausführung externer Funktionen anfordert — Websuche, Datenbankabfragen, API-Aufrufe, Dateioperationen — indem es strukturiertes Tool-Call-JSON ausgibt, das eine Laufzeit abfängt, gegen ein JSON-Schema validiert und ausführt, bevor ein Tool-Ergebnis zurückgegeben wird. Das LLM führt niemals selbst aus; es fordert nur an. Die Laufzeit erzwingt Schema-Validierung, ACL-Prüfungen und Schritt-Budgets vor jeder Ausführung. tau-bench (2025) zeigt, dass Argument-Konstruktionsfehler der häufigste Tool-Nutzungs-Fehlermodus sind.

<!-- SCHEMA: DefinitionBlock -->
KI-Agenten Tool-Nutzung ist der Mechanismus, durch den ein großes Sprachmodell die Ausführung externer Funktionen anfordert — Websuche, Datenbankabfragen, API-Aufrufe, Dateioperationen oder benutzerdefinierte Geschäftslogik — indem es einen strukturierten Tool-Aufruf in seiner Ausgabe emittiert, den eine Laufzeit abfängt, gegen eine JSON-Schema-Definition validiert, ausführt und als Tool-Ergebnis im nächsten Kontext-Turn zurückgibt.

## Wie Tool-Aufrufe funktionieren: Der Request-Execute-Return-Kreislauf

### Der Tool-Call-Lebenszyklus

Jeder Tool-Aufruf folgt demselben Fünf-Schritt-Kreislauf, unabhängig von Framework oder Anbieter:

1. **Kontext-Setup** — der Agent erhält die Aufgabe und eine Liste verfügbarer Tools, jedes beschrieben durch Name, natürlichsprachige Beschreibung und JSON-Schema-Definition seiner Parameter.
2. **LLM-Entscheidung** — das Modell gibt einen Tool-Call-Block in seiner Ausgabe aus: einen Funktionsnamen und ein JSON-Objekt mit Argumenten, die dem deklarierten Schema entsprechen.
3. **Laufzeit-Abfang** — das Framework fängt den Tool-Aufruf vor jeder Ausführung ab. Argumente werden gegen das Schema validiert. Die ACL des Agenten wird geprüft: Ist dieser Agent berechtigt, dieses Tool aufzurufen?
4. **Ausführung** — wenn Validierung und Berechtigungsprüfungen bestanden sind, führt die Laufzeit die Funktion aus und sammelt ihre Ausgabe.
5. **Kontext-Injektion** — das Tool-Ergebnis wird als Tool-Ergebnis-Turn zurück in den Konversationskontext injiziert. Das LLM setzt das Reasoning aus diesem angereicherten Kontext fort — ruft ein weiteres Tool auf oder produziert eine endgültige Antwort.

Die kritische architektonische Tatsache: Das LLM führt niemals selbst aus. Es fordert nur an. Jede unsichere Aktion — eine Datei schreiben, eine API aufrufen, eine E-Mail senden — wird von der Laufzeit gesteuert. Diese Trennung zwischen Anforderung und Ausführung ist die Grundlage sicherer Agenten-Tool-Nutzung.

### Anbieter-Format-Unterschiede: OpenAI vs Anthropic vs Google

Alle drei großen LLM-Anbieter unterstützen Tool-Nutzung nativ, aber das JSON-Format unterscheidet sich:

**OpenAI** (openai/openai-python, 30.941 Sterne, Apache-2.0): Tool-Definitionen gehen in den `tools`-Parameter als Array von JSON-Schema-Objekten. Das Modell gibt Tool-Aufrufe im `tool_calls`-Feld der Assistenten-Nachricht zurück. Der Client sendet Tool-Ergebnisse als Nachrichten mit `role: "tool"` zurück. Die Responses API (März 2025) fügte eingebaute Tools (`web_search`, `file_search`, `computer_use`) hinzu, die serverseitig ausgeführt werden ohne clientseitige Dispatch.

**Anthropic** (anthropic-sdk-python, 3.595 Sterne, MIT): Tool-Definitionen gehen in den Top-Level-`tools`-Parameter. Das Modell gibt `tool_use`-Content-Blöcke innerhalb des Assistenten-Turns zurück. Der Client muss diese Blöcke parsen und `tool_result`-Content-Blöcke im nächsten Human-Turn zurückgeben. Der Round-Trip ist explizit — der Client besitzt den Ausführungsschritt zwischen den zwei Turns.

**Google Gemini**: Tool-Definitionen verwenden `functionDeclarations` innerhalb des `tools`-Parameters, folgen JSON-Schema-Semantik. Das Modell gibt `functionCall`-Teile zurück; der Client sendet `functionResponse`-Teile. Gemini unterstützt ein `tool_config` mit `ANY`-Modus (Modell immer dazu zwingen, ein Tool aufzurufen) und `AUTO`-Modus (Modell selbst entscheiden lassen).

Die Formate sind semantisch äquivalent: Name, Beschreibung, Parameter, Pflichtfelder. Syntaktisch unterscheiden sie sich genug, dass die Hardcodierung der Konvention eines Anbieters beim Modellwechsel versagt. Agent-Frameworks, die Anbieter-Unterschiede abstrahieren, sind deutlich einfacher über Modellwechsel hinweg zu warten.

### Wer das Tool tatsächlich ausführt (und warum das für Sicherheit wichtig ist)

Das LLM kann keine Tools ausführen. Es kann sie nur anfordern. Das ist keine Einschränkung — es ist die Sicherheitsgrenze. Wenn eine Laufzeit vor jeder Tool-Ausführung ein ACL-Gate erzwingt, kann keine LLM-Ausgabe, egal wie gestaltet, die Berechtigungsprüfung umgehen. Das Modell kann `delete_all_records()` mit beliebigen Argumenten anfordern; wenn die Berechtigungsmatrix des Agenten dieses Tool nicht enthält, lehnt die Laufzeit die Anforderung vor jeder Ausführung ab.

## Tool-Schemas definieren, die LLMs korrekt verwenden

tau-bench (ServiceNow Research, 2025) maß GPT-4o bei 44% pass@1 bei Retail-Tool-Nutzungs-Aufgaben. Die größte Fehlerkategorie war nicht die Tool-Auswahl — das Modell wählte das richtige Tool — sondern die Argument-Konstruktion: das Modell rief die richtige Funktion mit falschen oder fehlerhaften Argumenten auf. Schema-Qualität ist der primäre Zuverlässigkeitshebel.

### JSON-Schema-Anatomie für Tool-Definitionen

Ein minimales gültiges Tool-Schema erfordert vier Felder:

```json
{
  "name": "search_web",
  "description": "Durchsucht das öffentliche Web nach aktuellen Informationen. Verwenden, wenn die Aufgabe Fakten nach dem Training-Cutoff, Echtzeit-Daten oder Quellen aus den Trainingsdaten erfordert.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Die Suchanfrage. Spezifische, gezielte Begriffe verwenden — kein vollständiger Satz."
      },
      "max_results": {
        "type": "integer",
        "description": "Maximale Anzahl zurückzugebender Ergebnisse. Standard 5, max 20.",
        "default": 5
      }
    },
    "required": ["query"]
  }
}
```

Das `required`-Array ist wichtig: Parameter nicht in `required` sind optional. Das Modell kann sie bereitstellen oder nicht. Pflichtparameter, die häufig weggelassen werden, weisen auf ein Schema-Beschreibungsproblem hin.

### Beschreibungen schreiben, die Argument-Fehler reduzieren

Drei Regeln für Tool-Beschreibungen, die die Argument-Konstruktionsgenauigkeit verbessern:

1. **Name mit einem Verb-Nomen-Paar**: `search_web`, `create_ticket`, `read_file`. Vermeidet Mehrdeutigkeit zwischen ähnlichen Tools.
2. **In der Beschreibung disambiguieren**: Wenn zwei Tools ähnlich aussehen, explizit angeben, wann welches zu verwenden ist.
3. **Parameter mit Beispielen beschreiben**: `"Die Suchanfrage. Beispiel: 'LangGraph v0.2 parallele Tool-Aufrufe'"` übertrifft `"Der Query-String"` in Argument-Genauigkeit.

### Häufige Schema-Fehler und wie man sie behebt

| **Fehler** | **Auswirkung** | **Lösung** |
|---|---|---|
| Unkonstrained `"type": "string"` für kategorische Werte | Modell erfindet ungültige Werte | `"enum": ["option_a", "option_b"]` verwenden |
| Fehlende `description` bei Parametern | Modell rät Argument-Semantik | Explizite Beschreibungen mit Beispielen schreiben |
| Alle Parameter in `required` | Modell lehnt Aufruf ab, wenn optionale Felder unbekannt | Nur wirklich notwendige Parameter listen |
| Vager Tool-Name (`process`, `handle`) | Modell kann nicht zwischen ähnlichen Tools unterscheiden | Verb-Nomen verwenden: `submit_form`, `parse_date` |
| Kein `required`-Array | JSON-Schema ungültig; einige Laufzeiten überspringen Validierung | Immer `required` einfügen, auch wenn leer (`[]`) |

### Strict-Modus: Exakte Schema-Einhaltung erzwingen

OpenAIs Structured-Outputs-Strict-Modus (`"strict": true` auf einer Tool-Definition) garantiert, dass das Ausgabe-JSON des Modells exakt dem deklarierten Schema entspricht. Das eliminiert die gesamte Kategorie von Argument-Konstruktionsfehlern auf Kosten der Einschränkung des Schemas auf eine Teilmenge von JSON-Schema.

## Parallele und sequenzielle Tool-Aufrufe

### Wann parallele Tool-Aufrufe zu verwenden sind

OpenAIs Responses API (März 2025) machte parallele Tool-Aufrufe zum Standard. In einem einzigen LLM-Turn kann das Modell mehrere Tool-Ausführungen gleichzeitig anfordern. Für unabhängige Tools reduziert parallele Dispatch Round-Trips von N sequenziellen Turns auf einen gleichzeitigen Batch.

Beispiel: Ein Recherche-Agent braucht aktuellen Aktienkurs, aktuelle Nachrichten und eine SEC-Einreichung eines Unternehmens. Alle drei sind unabhängig. Sequenziell: 3 LLM-Turns x 10s = 30s. Parallel: 1 LLM-Turn + max(Tool-Latenzen) ca. 10s.

Die Voraussetzung: Die Tools müssen wirklich unabhängig sein. Wenn Tool B die Ausgabe von Tool A als Argument benötigt, müssen sie sequenziell sein.

### Sequenzielle Tool-Aufrufe für abhängige Operationen

Tool-Verkettung erfordert sequenzielle Ausführung. Das Muster: `search_web(query)` → `fetch_page(URL aus Suchergebnis)` → `extract_data(Seiteninhalt)` → `summarize(extrahierte Daten)`. Jeder Schritt hängt von der Ausgabe des vorherigen ab.

### Gleichzeitigkeitsrisiken mit zustandsbehafteten Ressourcen

Parallele Tool-Aufrufe gegen zustandsbehaftete Ressourcen benötigen Ordnungsgarantien. Zwei gleichzeitige Schreibvorgänge auf denselben Datenbankdatensatz ohne Sperren erzeugen undefinierte Ergebnisse. Die Regel: Parallele Dispatch ist sicher, wenn Tools schreibgeschützt sind oder auf unabhängige Ressourcen schreiben.

## Tool-Ausgabe-Parsing und Fehlerwiederherstellung

Tool-Aufrufe scheitern. Die externe API gibt 503 zurück. Die Datenbankabfrage läuft ab. Ein gut gestaltetes Tool-Nutzungs-System behandelt Fehler ohne menschliche Intervention für behebbare Fehler.

### Tool-Ausgaben validieren

Ein Tool, das HTTP 200 zurückgibt, ist nicht dasselbe wie ein Tool, das ein korrektes, nützliches Ergebnis zurückgibt. Ausgabe gegen ein erwartetes Schema validieren, bevor sie in den Agenten-Kontext injiziert wird.

### Wiederholungsstrategien: Wann und wie man erneut aufruft

Drei Wiederholungsmuster für verschiedene Fehlermodi:

- **Transiente Fehler-Wiederholung** (Netzwerk-Timeout, Rate-Limit): Tool mit denselben Argumenten nach kurzem Backoff erneut aufrufen.
- **Argument-Klärungs-Wiederholung**: Dem LLM einen strukturierten Fehler zurückgeben, der erklärt, warum das Argument abgelehnt wurde.
- **Fallback-Tool**: Wenn Tool A nach N Wiederholungen scheitert, zu Tool B mit gleichwertiger Fähigkeit weiterleiten.

### Tool-Fehler an den Orchestrator melden

Nicht behebbare Fehler müssen an den Orchestrator gemeldet werden. Für Multi-Agenten-Pipelines benötigt der Orchestrator ein strukturiertes Fehlersignal mit dem fehlgeschlagenen Tool-Namen, der Fehlerkategorie und ob die Aufgabe wiederholbar ist. Für [KI-Agenten-Orchestrierungsmuster](/learn/ai-agent-orchestration) ist dies der Eskalationspfad.

## Tool-Berechtigungs-Scoping und Sicherheit

### Least-Privilege-Tool-Zuweisung

Jeder Agent sollte nur die Tools halten, die seine spezifische Aufgabe erfordert. Der Explosionsradius eines erfolgreich prompt-injizierten Agenten ist durch seinen erlaubten Tool-Satz begrenzt. OWASP LLM Top 10 v1.1 (2025) listet Prompt-Injection (LLM01) als das größte Risiko für LLM-Anwendungen.

### Eingabe-Validierung vor Ausführung

Tool-Call-Argumente auf zwei Ebenen validieren: Schema-Validierung und semantische Validierung. Ein `fetch_page`-Tool sollte Argumente mit `file://`- oder `localhost`-URLs ablehnen, um SSRF zu verhindern.

Siehe das [KI-Agenten-Sicherheits-Bedrohungsmodell](/learn/ai-agent-security) für die vollständige Taxonomie der Tool-Level-Angriffsvektoren.

### Irreversible Aktionen: Human-in-the-Loop-Gates

Tool-Aufrufe mit irreversiblen Seiteneffekten — E-Mails senden, Datensätze löschen, Geld überweisen, Inhalte veröffentlichen — erfordern explizite menschliche Bestätigungs-Gates oder Idempotenz-Prüfungen vor der Ausführung.

## OpenLegions Einschätzung: Die Tool-Registrierung und das ACL-Gate

Jeder große LLM-Anbieter hat eine andere Tool-Calling-API. Die richtige Abstraktion: Ein Tool einmal definieren und das Framework es zur korrekten Anbieterkonvention zur Aufrufzeit übersetzen lassen.

OpenLegions Tool-Registrierung implementiert diese Abstraktion. `search_web` einmal definieren. Das Mesh übersetzt die Definition zu OpenAI `tools`, Anthropic `tools` oder Gemini `functionDeclarations` je nach konfiguriertem Modell. Das ACL-Gate ist nicht optional. Jeder Tool-Aufruf — eingebaut, MCP oder benutzerdefiniert — läuft durch die per-Agenten-Berechtigungsmatrix vor der Ausführung.

| **Dimension** | **OpenLegion** | **LangChain / LangGraph** | **OpenAI Agents SDK** | **CrewAI** | **Anthropic direkt** |
|---|---|---|---|---|---|
| **Tool-Definitions-Format** | Einzelnes Schema, anbieterübersetzt | Anbieterspezifische Wrapper erforderlich | Nur OpenAI-Format | CrewAI-Tool-Decorator | Nur Anthropic-tool_use-Format |
| **Anbieter-Abstraktion** | Ja — GPT-4o, Claude, Gemini vereint | Partiell — über LangChain-Integrationen | Nein — nur OpenAI-Modelle | Partiell | Nein — nur Anthropic |
| **ACL-Durchsetzung** | Per-Agenten-Berechtigungsmatrix, strukturell | Nicht eingebaut | Nicht eingebaut | Nicht eingebaut | Nicht eingebaut |
| **Parallele Tool-Aufrufe** | Unterstützt | Unterstützt (anbieterabhängig) | Ja — Standard in Responses API | Unterstützt | Ja — Claude unterstützt |
| **Eingebaute Tools** | Browser, Datei, HTTP, Shell, Bildgen | Über LangChain-Community-Tools | web_search, file_search, computer_use | Nicht eingebaut | Nicht eingebaut |
| **MCP-Integration** | Nativ — gleiche ACL/Budget-Pipeline | Über LangChain-MCP-Adapter | Experimentell | Nicht nativ | Nicht nativ |

Für die MCP-Spezifikation, Server-Architektur und per-Server-Berechtigungsanforderungen, siehe den [Model Context Protocol-Leitfaden](/learn/model-context-protocol).

## Eingebaute Tools vs MCP-Tools vs Benutzerdefinierte Tools

### Eingebaute Laufzeit-Tools

Eingebaute Tools werden vom Agenten-Runtime bereitgestellt — Browser-Automatisierung, Dateioperationen, HTTP-Anfragen, Shell-Befehle, Bildgenerierung — mit bereits angewandter ACL-Durchsetzung und Budget-Tracking. Eingebaute Tools zuerst verwenden.

### MCP-Tool-Server

MCP-Tools werden von Model Context Protocol-Servern bereitgestellt, die Tools über JSON-RPC über stdio oder HTTP bereitstellen. MCP-Tools erfordern explizites Sandboxing und per-Server-Berechtigungs-Scoping.

### Benutzerdefinierte Tool-Registrierung

Benutzerdefinierte Tools sind Python- oder TypeScript-Funktionen, die man schreibt und in der Tool-Registrierung des Agenten registriert. Sie geben volle Flexibilität; der Kompromiss ist, dass man Validierung, Fehlerbehandlung, Idempotenz und Sicherheitskontrollen selbst besitzt.

<!-- SCHEMA: FAQPage -->
## Häufig gestellte Fragen

### Was ist KI-Agenten Tool-Nutzung?

KI-Agenten Tool-Nutzung ist der Mechanismus, durch den ein großes Sprachmodell die Ausführung externer Funktionen anfordert — Websuche, API-Aufrufe, Datenbankabfragen, Dateioperationen — indem es strukturiertes Tool-Call-JSON ausgibt, das eine Laufzeit abfängt, gegen ein Schema validiert und ausführt, bevor ein Tool-Ergebnis zurückgegeben wird. Das LLM führt niemals selbst aus; es beschreibt nur, was aufgerufen werden soll und mit welchen Argumenten.

### Wie funktionieren Funktionsaufrufe in KI-Agenten?

Funktionsaufrufe funktionieren in einem Request-Execute-Return-Kreislauf: der Agent erhält eine Aufgabe und eine Liste verfügbarer Tools; das LLM gibt einen Tool-Aufruf aus, der die Funktion benennt und Argumente bereitstellt; die Laufzeit validiert diese Argumente, führt die Funktion aus und injiziert das Ergebnis als Tool-Ergebnis zurück in den Kontext.

### Was macht ein gutes Tool-Schema für KI-Agenten aus?

Ein gutes Tool-Schema verwendet einen Verb-Nomen-Namen (`search_web`, `create_ticket`), eine Beschreibung, die eindeutig angibt, wann es verwendet werden soll, stark typisierte Parameter mit Enums statt unkonstrained Strings und ein `required`-Array. tau-bench (2025) zeigt, dass falsche Argument-Konstruktion der häufigste Fehlermodus ist.

### Was sind parallele Tool-Aufrufe und wann sollte ich sie verwenden?

Parallele Tool-Aufrufe lassen einen Agenten in einem einzigen LLM-Turn mehrere Tool-Ausführungen anfordern, die gleichzeitig von der Laufzeit dispatcht werden. Parallele Aufrufe verwenden, wenn Tools unabhängig sind. Parallele Aufrufe vermeiden, wenn Tool B die Ausgabe von Tool A als Argument benötigt.

### Wie verhindere ich Tool-Call-Schleifen in KI-Agenten?

Tool-Call-Schleifen entstehen, wenn ein Agent weiterhin Tools aufruft ohne zu einer Antwort zu konvergieren. Die einzige zuverlässige Prävention ist ein Schritt-Budget, das auf Infrastrukturebene erzwungen wird: ein hartes Maximum an Tool-Aufrufen pro Agenten-Run, das vom Orchestrator durchgesetzt wird.

### Was ist das Sicherheitsrisiko der KI-Agenten Tool-Nutzung?

Das primäre Risiko ist Tool-Ergebnis-Injektion: wenn ein Agent ein Tool aufruft, das angreiferkontrollierte Inhalte zurückgibt, die das Verhalten des Agenten umlenken können. OWASP LLM Top 10 v1.1 (2025) listet Prompt-Injection als das größte Risiko. Maßnahmen umfassen Ausgabe-Sanitisierung, Least-Privilege-Tool-Zuweisung und Human-in-the-Loop-Gates für irreversible Aktionen.

### Was ist der Unterschied zwischen eingebauten Tools, MCP-Tools und benutzerdefinierten Tools?

Eingebaute Tools werden vom Agenten-Runtime bereitgestellt mit bereits angewandter ACL-Durchsetzung. MCP-Tools werden von Model Context Protocol-Servern bereitgestellt, die externe Fähigkeiten über JSON-RPC bereitstellen; sie erfordern Sandboxing und per-Server-Berechtigungs-Scoping. Benutzerdefinierte Tools sind Funktionen, die man schreibt und registriert, mit voller Flexibilität aber eigener Verantwortung für Validierung und Sicherheit.

### Wie implementieren verschiedene LLM-Anbieter Tool-Nutzung?

OpenAI implementiert Tool-Nutzung über den `tools`-Parameter, `tool_calls` in der Assistenten-Antwort, `role: "tool"`-Ergebnisnachrichten. Anthropic verwendet `tool_use`-Content-Blöcke mit `tool_result`-Blöcken. Google Gemini verwendet `functionDeclarations` mit `functionCall`-Teilen und `functionResponse`-Teilen. Die drei Formate sind semantisch äquivalent aber syntaktisch verschieden.

## Tools einmal definieren, überall sicher ausführen

tau-bench (2025) setzt GPT-4o bei 44% pass@1 bei Tool-Nutzungs-Aufgaben, mit Argument-Konstruktion als dominanter Fehlerkategorie. Präzise Schemas mit Verb-Nomen-Namen, typisierten Enums und Parameter-Beispielen schließen den größten Teil dieser Lücke. Parallele Dispatch reduziert Latenz für unabhängige Tools. ACL-Gating begrenzt den Explosionsradius jedes Injection-Versuchs.

Für [agentic Workflow-Muster](/learn/agentic-workflows) und [KI-Agenten-Evaluierungs-Benchmarks](/learn/ai-agent-evaluation) erweitern diese Leitfäden die hier behandelten Grundlagen.

[KI-Agenten mit per-Agenten-ACL-Durchsetzung auf OpenLegion bauen →](https://openlegion.ai)
