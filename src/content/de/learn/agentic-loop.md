---
title: "Agentic Loop: Wie KI-Agenten wahrnehmen, denken und handeln"
description: "Der Agentic Loop ist der Wahrnehmen-Denken-Handeln-Zyklus jedes KI-Agenten. Lernen Sie Loop-Mechaniken, Terminierungsstrategien und wie Endlosschleifen verhindert werden."
slug: /learn/agentic-loop
primary_keyword: agentic loop
last_updated: "2026-07-08"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/agentic-ai-design-patterns
  - /learn/ai-agent-planning
  - /learn/ai-agent-tool-use
  - /learn/ai-agent-prompt-injection
  - /learn/ai-agent-cost
---

# Agentic Loop: Wie KI-Agenten wahrnehmen, denken und handeln

Ein Agentic Loop ist der wiederholende Wahrnehmen-Denken-Handeln-Zyklus, der einen KI-Agenten vom Aufgabenstart bis zur endgültigen Antwort antreibt. In jeder Iteration liest der Agent den Kontext — Beobachtungen, Tool-Ergebnisse, Speicher — ruft ein LLM auf, um über die nächsten Schritte zu urteilen, führt ein Tool aus oder gibt eine Antwort zurück und wiederholt dann den Vorgang. Iterationslimits, Terminierungsbedingungen und Fehlerbehandlung entscheiden, ob ein Produktionsagent zuverlässig oder ein Risiko ist — OpenLegion erzwingt harte Obergrenzen auf der Mesh-Ebene und macht unkontrollierte Schleifen zu deterministischen Fehlern.

## Was ist ein Agentic Loop?

<!-- SCHEMA: DefinitionBlock -->

> **Ein Agentic Loop** ist ein iteratives Ausführungsmodell, bei dem ein KI-Agent abwechselnd seine Umgebung beobachtet, mithilfe eines Sprachmodells über die nächste Aktion nachdenkt und diese Aktion ausführt — und dies wiederholt, bis eine Terminierungsbedingung erfüllt ist: Aufgabenabschluss, maximale Iterationen oder Budgeterschöpfung.

Jeder KI-Agent, unabhängig vom Framework, führt eine Variante dieser Schleife aus. Die Schleife ist die Einheit der Agentenausführung: ein einziger Durchlauf durch Wahrnehmen → Denken → Handeln. Eine einfache Aufgabe (eine Frage aus einer einzelnen Websuche beantworten) wird in 2–3 Iterationen abgeschlossen. Eine komplexe Aufgabe (einen Wettbewerber recherchieren, Ergebnisse zusammenfassen, einen Bericht verfassen) kann 15–30 Iterationen erfordern. Die Anzahl der Schleifendurchläufe ist nicht durch die Aufgabe festgelegt — sie ergibt sich aus dem Denken des Agenten und den Ergebnissen seiner Tool-Aufrufe.

Die Schleife hat pro Iteration drei Eingaben und eine Ausgabe:

| **Eingabe/Ausgabe** | **Inhalt** | **Über Iterationen angesammelt?** |
|---|---|---|
| **System-Prompt** | Agentenrolle, Anweisungen, Tool-Definitionen | Nein — fest pro Ausführung |
| **Konversationsverlauf** | Alle vorherigen Runden: Benutzernachrichten, Agentendanken, Tool-Aufrufe, Tool-Ergebnisse | Ja — wächst jede Iteration |
| **Aktuelle Beobachtung** | Tool-Ergebnis der vorherigen Aktion (erste Iteration: erste Benutzernachricht) | Ja — wird jede Iteration angehängt |
| **Ausgabe** | Nächste Aktion: ein Tool-Aufruf, eine Klärungsanfrage oder eine endgültige Antwort | Nein — eine Ausgabe pro Iteration |

Kontextakkumulation ist der primäre Kostentreiber der Schleife: Der Konversationsverlauf wächst mit jedem Tool-Aufruf und jedem Tool-Ergebnis. Bei 2.000 Token pro Iterationspaar in einer 20-Iterations-Aufgabe sendet die letzte Iteration 40.000 Token als Eingabekontext. Die Modellpreise werden pro Token berechnet, nicht pro Aufgabe — siehe [wie man Agentic-Loop-Kosten mit agentenbezogenen Ausgabenlimits kontrolliert](/learn/ai-agent-cost).

## Die drei Phasen im Detail

### Wahrnehmen — Kontext lesen

Die Wahrnehmungsphase stellt die aktuelle Weltansicht des Agenten zusammen: alles, was das LLM lesen wird, bevor es entscheidet, was als nächstes zu tun ist. Dies umfasst:

- **System-Prompt:** feste Anweisungen, Tool-Definitionen, die Rolle und Einschränkungen des Agenten
- **Konversationsverlauf:** alle vorherigen Agentendanken, Tool-Aufrufe und Tool-Ergebnisse im aktuellen Ausführungslauf
- **Neue Beobachtung:** das Ergebnis der in der vorherigen Iteration durchgeführten Aktion — eine Tool-Antwort, ein API-Ergebnis, ein Dateileseergebnis, ein Webseiteninhalt

Die Wahrnehmungsphase ist die primäre **Prompt-Injection-Angriffsfläche** des Agentic Loops. Jede Beobachtung aus externen Quellen — eine Webseite, die von einem Such-Tool gecrawlt wurde, eine Datei aus dem Speicher, eine API-Antwort eines Drittanbieterdienstes — gelangt als Text in den Kontext, den das LLM im nächsten Denkschritt verarbeiten wird.

CVE-2024-5184 (Synopsys CyRC, Juni 2024) zeigt genau dies: ein Prompt-Injection-Angriff über den Inhalt der Tool-Antwort, der die nächste Loop-Iteration des Agenten entführt und die Aktion zu einem vom Angreifer kontrollierten Endpunkt umleitet. Für eine vollständige Behandlung von Injection-Vektoren und Abwehrmaßnahmen, siehe [Prompt-Injection-Angriffe auf Tool-Antworten im Agentic Loop](/learn/ai-agent-prompt-injection).

### Denken — Der LLM-Reasoning-Schritt

Die Denkphase ist der LLM-Aufruf: Der aus der Wahrnehmungsphase zusammengesetzte Kontext wird an das Modell gesendet, das die nächste Aktion generiert. Die Ausgabe ist eine von:
- Ein **Tool-Aufruf** (strukturiert: Tool-Name + Parameter)
- Eine **endgültige Antwort** (Freitext) — der Agent glaubt, die Aufgabe ist abgeschlossen
- Eine **Klärungsanfrage** (Freitext an den Benutzer gerichtet)

Das kanonische Modell für die Denkphase ist das **ReAct-Muster** (Yao et al., 2022, arXiv:2210.03629): **Re**asoning + **Act**ing, innerhalb derselben LLM-Ausgabe verzahnt. Das ReAct-Papier zeigte, dass die Verzahnung von explizitem Denken mit Aktionen die Aufgabengenauigkeit des Agenten auf Benchmarks wie HotpotQA, FEVER und ALFWorld erheblich verbessert. Jedes große Agenten-Framework implementiert eine Variante von ReAct als Standard-Denkschrittmodell.

**Kosten des Denkschritts:** Jeder LLM-Aufruf in der Denkphase wird zum Token-Preis des Anbieters für den gesamten angesammelten Kontext berechnet. Für GPT-4o bei $2,50/M Eingabe-Token kostet ein 20-Iterations-Lauf mit 2.000 Token je Iteration circa $1,05 an Eingabe-Tokens allein für die letzte Iteration. Siehe [KI-Agenten-Planung — wie Agenten Ziele vor dem Schleifenbeginn zerlegen](/learn/ai-agent-planning) für Strategien zur Reduzierung der Iterationsanzahl.

### Handeln — Tool-Ausführung oder endgültige Antwort

Die Handlungsphase führt die in der Denkphase ausgewählte Aktion aus. Zwei Fälle:

**Tool-Aufruf:** Der Tool-Executor des Agenten empfängt den strukturierten Tool-Aufruf, leitet ihn an die entsprechende Tool-Implementierung weiter und sammelt das Ergebnis. Das Tool-Ergebnis wird als Beobachtung der nächsten Iteration an die Wahrnehmungsphase zurückgegeben.

**Endgültige Antwort:** Der Agent gibt eine Textantwort an den Aufrufer aus. Die Schleife wird beendet.

Der Tool-Executor muss:
1. Überprüfen, ob der angeforderte Tool-Name im erlaubten Tool-Set des Agenten vorhanden ist
2. Überprüfen, ob die Parameter dem Schema des Tools entsprechen
3. Das Tool in einem isolierten Kontext ausführen
4. Das Ergebnis unverändert zurückgeben

Für Tool-Implementierungsmuster, Sandboxing-Anforderungen und das Tool-Ausführungssicherheitsmodell, siehe [wie Agenten Tools in jeder Loop-Iteration ausführen](/learn/ai-agent-tool-use).

## Loop-Terminierung — Wann Agenten aufhören

### Natürliche Terminierung

Natürliche Terminierung tritt auf, wenn der Denkschritt des LLM eine endgültige Antwort statt eines Tool-Aufrufs ausgibt. Der Agent hat entschieden, dass die Aufgabe abgeschlossen ist, und gibt seine Antwort zurück.

### max_turns-Durchsetzung

`max_turns` (OpenAI Agents SDK-Terminologie) oder `recursion_limit` (LangGraph-Terminologie) ist eine harte Obergrenze für die Anzahl der Iterationen, die die Schleife ausführen wird.

**Standardwerte:**
- **OpenAI Agents SDK:** `max_turns = 10` (April 2026)
- **LangGraph:** `recursion_limit = 25`
- **LangChain AgentExecutor:** `max_iterations = 15`, kein Zeitlimit standardmäßig
- **AutoGen:** `max_consecutive_auto_reply = 10` pro Agent

**Konfiguration für die Produktion:** Legen Sie max_turns basierend auf der empirischen Messung der Iterationsverteilung Ihres spezifischen Agenten fest. Messen Sie das 95. Perzentil der Iterationsanzahl bei 100 repräsentativen Aufgaben; setzen Sie max_turns auf P95 + 20 % Puffer. Protokollieren Sie jede Abschneidung.

### Budgetbasierte Terminierung

Budgetbasierte Terminierung stoppt die Schleife, wenn der Agent einen konfigurierten Dollarbetrag verbraucht hat.

**OpenLegions Durchsetzungsmodell:**
- `daily_budget` (Standard $50/Tag) und `monthly_budget` (Standard $200/Monat) werden pro Agent in `INSTRUCTIONS.md` konfiguriert
- Der Mesh-Router verfolgt die kumulierten Ausgaben pro Agent-ID in Echtzeit
- Wenn eine Loop-Iteration das verbleibende Tagesbudget überschreiten würde, wird die Anfrage auf der Mesh-Ebene vor dem LLM-Anbieter abgelehnt
- Der Agent erhält einen strukturierten Budget-Erschöpfungsfehler

### Fehlerbasierte Terminierung

Fehlerbasierte Terminierung stoppt die Schleife, wenn ein Tool-Aufruf fehlschlägt. Drei Strategien:

**Abbruch bei Fehler:** sofortiger Abbruch, wenn ein Tool-Aufruf einen Fehler zurückgibt.

**Wiederholung mit Backoff:** Die Schleife wiederholt den fehlgeschlagenen Tool-Aufruf bis zu N Mal mit exponentiellem Backoff.

**Fallback und Fortfahren:** Bei Tool-Fehler ersetzt der Agent eine Fallback-Aktion und setzt die Schleife fort.

## Anti-Muster für Endlosschleifen

LangChains Bericht zum Stand der Agenten 2025 ergab, dass **23 % der Agentenfehler durch Endlos-Tool-Aufruf-Schleifen** verursacht wurden — die größte einzelne Fehlerkategorie.

### Tool-Call-Storm

Ein Tool-Call-Storm tritt auf, wenn der Denkschritt des Agenten wiederholt dasselbe Tool aufruft, ohne Fortschritte in Richtung Aufgabenabschluss zu machen. Häufige Auslöser:

- **Mehrdeutige Aufgabenspezifikation:** Die Aufgabe ist zu wenig spezifiziert, und der Agent kann keine Terminierungsbedingung bestimmen.
- **Fehlende Tool-Ergebnis-Validierung:** Das Tool gibt ein Ergebnis zurück, aber der Agent kann es nicht als "Erfolg" oder "Fehler" interpretieren.
- **Kreisförmiges Denken:** Der Agent erreicht eine Schlussfolgerung, zweifelt dann im nächsten Durchgang daran.

Erkennung: Protokollieren Sie die Tool-Aufruf-Sequenz pro Lauf. Ein Lauf, bei dem dasselbe Tool mehr als 3 Mal mit ähnlichen Parametern aufgerufen wird, ist ein potenzieller Tool-Call-Storm.

### Kontext-Vergiftung

Kontext-Vergiftung tritt auf, wenn ein Tool-Ergebnis Inhalte in den Konversationsverlauf einführt, die das Denken des LLM in nachfolgenden Iterationen verzerren. Prävention: Tool-Ergebnis-Vorverarbeitung — HTML entfernen, große Dokumente auf relevante Abschnitte kürzen, strukturierte Zusammenfassungen anstelle von Rohinhalten zurückgeben.

### Prompt-Injection über Tool-Antwort

Der sicherheitskritischste Endlosschleifenauslöser: CVE-2024-5184 (Synopsys CyRC, Juni 2024). Eine Tool-Antwort enthält injizierte Anweisungen, die die nächste Iteration des Agenten zu einer neuen Unteraufgabe umleiten.

Abwehr: Behandeln Sie jedes Tool-Ergebnis als nicht vertrauenswürdige Eingabe. Für eine vollständige Behandlung der Injection-Abwehr, siehe [Prompt-Injection-Angriffe auf Tool-Antworten im Agentic Loop](/learn/ai-agent-prompt-injection).

## OpenLegions Einschätzung: Defense in Depth für Loop-Kontrolle

Loop-Kontrolle ist eine Sicherheitseigenschaft, nicht nur eine betriebliche. Die drei konkreten Zahlen, die das Problem definieren:

**23 % der Agentenfehler werden auf Endlos-Tool-Aufruf-Schleifen zurückgeführt** (LangChain 2025). Die Lösung ist nicht ein höheres max_turns-Limit. Es sind messbare Terminierungsbedingungen, explizite Fortschrittsüberprüfungen und Circuit-Breaker-Logik.

**OpenAI Agents SDK Standard max_turns = 10; LangGraph recursion_limit = 25.** Dies sind Ausgangspunkt-Standardwerte, keine Produktionswerte. Konfigurieren Sie Terminierungslimits basierend auf der Aufgabenverteilung.

**CVE-2024-5184 ist eine Loop-Kontroll-Sicherheitslücke, keine reine Sicherheitslücke.** Die Angriffsfläche ist jeder externe Tool-Aufruf.

| **Loop-Kontrollmechanismus** | **OpenLegion** | **LangChain AgentExecutor** | **LangGraph** | **OpenAI Agents SDK** |
|---|---|---|---|---|
| **Iterationslimit** | max_turns in INSTRUCTIONS.md, auf Mesh durchgesetzt | max_iterations=15 (Standard) | recursion_limit=25 | max_turns=10 (Standard) |
| **Budgetbasierte Terminierung** | daily_budget + monthly_budget pro Agent, auf Mesh-Ebene | Nicht eingebaut | Nicht eingebaut | Nicht eingebaut |
| **Fehlerterminierung** | Strukturierter Fehler an Orchestrator | Löst AgentExecutorError aus | Löst GraphRecursionError aus | Löst MaxTurnsExceeded aus |
| **Injection-Abwehr** | Vault-proxied Tool-Aufrufe; System-Prompt-Autorität | handle_parsing_errors konfigurierbar | Nicht eingebaut | Nicht eingebaut |
| **Loop-Prüfpfad** | Jede Iteration protokolliert mit agent_id, Modell, Tool-Aufruf, Kosten | LangSmith (optional) | LangSmith (optional) | OpenAI-Dashboard |

Für die Muster, die mehrere Agenten-Loops zu Produktionssystemen zusammensetzen, siehe [wie Agentic Workflows mehrere Loops zu Produktionspipelines zusammensetzen](/learn/agentic-workflows) und [Agentic-AI-Designmuster für Loop-Orchestrierung und Agentenkoordination](/learn/agentic-ai-design-patterns).

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist ein Agentic Loop?

Ein Agentic Loop ist der wiederholende Wahrnehmen-Denken-Handeln-Zyklus, den jeder KI-Agent zur Ausführung einer Aufgabe durchführt. In jeder Iteration liest der Agent seinen aktuellen Kontext, ruft ein Sprachmodell auf, um die nächste Aktion zu entscheiden, führt diese Aktion aus und wiederholt den Vorgang, bis eine Terminierungsbedingung erfüllt ist. Die Schleife setzt sich fort, bis natürlicher Abschluss, ein hartes Iterationslimit (max_turns), Budgeterschöpfung oder ein nicht behebbarer Fehler eintritt.

### Wie viele Iterationen führt ein Agentic Loop durch?

Einfache Aufgaben werden in 2–5 Iterationen abgeschlossen. Komplexe Aufgaben benötigen 10–30 oder mehr Iterationen. Framework-Standards spiegeln typische Aufgabenbereiche wider: OpenAI Agents SDK setzt max_turns standardmäßig auf 10, LangGraph setzt recursion_limit standardmäßig auf 25, LangChain AgentExecutor auf max_iterations=15. Setzen Sie max_turns basierend auf dem empirischen P95-Iterationswert für Ihren spezifischen Agenten auf Ihrer spezifischen Aufgabenverteilung, zuzüglich 20 % Puffer.

### Was verursacht einen Endlosen Agentic Loop?

Die drei primären Ursachen für Endlosschleifen sind: Tool-Call-Storms (der Agent wiederholt denselben Tool-Aufruf ohne Konvergenz); Kontext-Vergiftung (Tool-Ergebnisse führen verrauschte Inhalte ein, die die Denkqualität beeinträchtigen); und Prompt-Injection über Tool-Antwortinhalte (CVE-2024-5184 — injizierte Anweisungen leiten den Agenten zu einer neuen Unteraufgabe um). LangChains Bericht 2025 ergab, dass 23 % der Agentenfehler durch Endlos-Tool-Aufruf-Schleifen verursacht wurden.

### Was ist das ReAct-Muster in Agentic Loops?

ReAct (Reasoning + Acting) ist das kanonische Agentic-Loop-Modell, eingeführt von Yao et al. im Jahr 2022 (arXiv:2210.03629). Das Muster strukturiert jede Loop-Iteration als dreiteilige LLM-Ausgabe: einen Gedanken (explizites Chain-of-Thought-Reasoning), eine Aktion (ein spezifischer Tool-Aufruf oder eine Antwort) und eine Beobachtung (das Ergebnis der Aktion). Das ReAct-Papier zeigte, dass die Verzahnung von explizitem Denken mit Aktionen die Agentenaufgabengenauigkeit verbessert — ausgewertet auf HotpotQA, FEVER und ALFWorld.

### Wie beeinflusst Prompt-Injection den Agentic Loop?

Prompt-Injection über Tool-Antwortinhalte — demonstriert durch CVE-2024-5184 (Synopsys CyRC, Juni 2024) — nutzt die Wahrnehmungsphase des Agentic Loops aus. Wenn ein Tool externen Inhalt abruft, gelangt dieser Inhalt als Tool-Ergebnis in den Konversationsverlauf. Wenn der Inhalt injizierte Anweisungen enthält, kann das LLM diese im nächsten Denkschritt verarbeiten und vom Angreifer gesteuerte Aktionen ausführen. Die Abwehr erfordert eine explizite Anweisungshierarchie: System-Prompt-Autorität über Tool-Ergebnisinhalte.

### Wie verhindert OpenLegion unkontrollierte Agentic Loops?

OpenLegion wendet Defense-in-Depth mit zwei Durchsetzungsebenen an. Erstens werden agentenbezogene Iterationslimits, die in INSTRUCTIONS.md konfiguriert sind, auf Anwendungsebene durchgesetzt. Zweitens werden agentenbezogene daily_budget ($50/Tag Standard) und monthly_budget ($200/Monat Standard) auf der Mesh-Router-Ebene vor jedem LLM-Aufruf durchgesetzt. Wenn eine Loop-Iteration das verbleibende Budget überschreiten würde, wird die Anfrage auf Netzwerkebene abgelehnt. Eine Prompt-Injection, die den Agenten anweist, "Budget-Limits zu ignorieren", ändert nur das Kontextfenster des LLM — nicht die Budget-Prüfung des Mesh-Routers.

### Was ist der Unterschied zwischen einem Agentic Loop und einem Workflow?

Ein Agentic Loop ist der pro-Agent-Iterationszyklus — der wiederholende Wahrnehmen-Denken-Handeln-Ausführungszyklus eines einzelnen Agenten. Ein Workflow (oder Agentic Workflow) ist eine Multi-Agenten-Pipeline, bei der mehrere Agenten, die jeweils ihre eigenen Schleifen ausführen, zu einem größeren System mit expliziter Übergabelogik, Orchestrierung und Datenfluss zwischen Agenten zusammengesetzt werden. Die Schleife ist die atomare Ausführungseinheit; der Workflow ist die Komposition mehrerer Agenten, die ihre Schleifen in sequenzieller, paralleler oder hierarchischer Anordnung ausführen.

## Mit OpenLegion beginnen

Der Agentic Loop ist der Ort, an dem die Zuverlässigkeit des Agenten gewonnen oder verloren wird. Framework-Standards — max_turns=10, recursion_limit=25 — sind Ausgangspunkte, keine Produktionskonfigurationen. Effektive Loop-Kontrolle erfordert agentenbezogene Iterationslimits, die auf Ihre Aufgabenverteilung kalibriert sind, budgetbasierte Terminierung und injection-bewusste Vertrauensgrenzen.

OpenLegion erzwingt Budget-Obergrenzen und Iterationslimits auf der Mesh-Ebene — außerhalb des LLM-Denkens des Agenten, nicht durch Prompt-Injection überschreibbar.

[Beginnen Sie mit OpenLegion](https://app.openlegion.ai) — harte Loop-Limits und agentenbezogene Budget-Durchsetzung integriert.

Für die Muster, die mehrere Agenten-Loops zu Produktionssystemen zusammensetzen, siehe [wie Agentic Workflows mehrere Loops zu Produktionspipelines zusammensetzen](/learn/agentic-workflows).
