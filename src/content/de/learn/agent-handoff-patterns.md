---
title: "Agent-Übergabemuster: Aufgabenweiterleitung zwischen KI-Agenten"
description: "Agent-Übergabemuster definieren, wie KI-Agenten Aufgaben, Kontext und Zugangsdaten übertragen: Push-Übergabe, Pull-Dispatch, Blackboard-Pointer-Routing und Streaming-Transfer für Multi-Agenten-Systeme."
slug: /learn/agent-handoff-patterns
primary_keyword: "agent handoff patterns"
last_updated: "2026-06-14"
schema_types:
  - FAQPage
related:
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/agentic-workflows
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-observability
---

# Agent-Übergabemuster: Aufgabenweiterleitung zwischen KI-Agenten

Agent-Übergabemuster sind die Protokolle, mit denen ein KI-Agent eine Aufgabe, den angesammelten Kontext und die Ausführungsberechtigung an einen anderen Agenten überträgt. Sie bestimmen, welche Daten die Grenze überschreiten, was verworfen wird und ob Zugangsdaten mit der Aufgabe mitgegeben werden. Die meisten Übergabefehler sind keine Routing-Fehler, sondern Kontextverlust- oder Zugangsdatenlecks, die erst dann sichtbar werden, wenn ein nachgelagerter Agent stillschweigend scheitert oder ein kompromittierter Agent sensible Payload-Daten exfiltriert.

<!-- SCHEMA: DefinitionBlock -->
Ein Agent-Übergabemuster ist ein Software-Entwurfsmuster, das regelt, wie ein autonomer KI-Agent eine Aufgabe an einen Peer- oder Spezialisten-Agenten delegiert. Es legt den Datenvertrag für die Kontextübertragung, den Routing-Mechanismus für die Aufgabenlieferung und die Isolationsgarantien fest, die verhindern, dass Zugangsdaten oder Kontext zwischen Agenten undicht werden.

## Die vier kanonischen Übergabemuster

### Push-Übergabe: Aufrufer weckt den Aufgerufenen direkt

Bei der Push-Übergabe erstellt der aufrufende Agent eine Payload mit Aufgabenkontext und benachrichtigt den empfangenden Agenten direkt, typischerweise durch einen Funktionsaufruf, eine Nachricht oder eine API-Invokation, die den Aufgerufenen weckt. Der Aufrufer kontrolliert genau, welche Daten der Aufgerufene erhält, wann er sie erhält und welcher Agent die Aufgabe bearbeitet.

Push-Übergabe ist das Muster, das von OpenAI Agents SDKs `handoff()`-Primitive verwendet wird (27.133 GitHub-Sterne, MIT). Der Aufrufer kann optional eine `input_filter`-Funktion übergeben, die Kontextfelder vor der Übertragung bereinigt oder transformiert. Ohne `input_filter` wird das vollständige Kontextfenster, einschließlich sensibler Inhalte, an den Aufgerufenen weitergegeben.

**Stärken**: Geringe Latenz, direkte Kontrolle über das Aufgaben-Routing, einfach in Observability-Tools nachzuverfolgen.  
**Risiken**: Der Aufrufer muss Zugangsdaten und sensiblen Kontext explizit entfernen; enge Kopplung zwischen Aufrufer und Aufgerufenem erfordert Änderungen beim Hinzufügen oder Entfernen von Spezialisten-Agenten.

### Pull-Dispatch: Aufgerufener übernimmt aus einer gemeinsamen Warteschlange

Beim Pull-Dispatch schreibt der aufrufende Agent eine Aufgabe in eine gemeinsame Warteschlange oder einen Posteingang, ohne direkt einen bestimmten Agenten zu benachrichtigen. Aufgerufene Agenten überwachen die Warteschlange und übernehmen Aufgaben, die ihren Fähigkeiten entsprechen. Dies ermöglicht Lastausgleich über einen Worker-Pool und entkoppelt den Aufrufer vom Wissen darüber, welcher spezifische Agent die Arbeit erledigen wird.

Pull-Dispatch reduziert die Exponierung von Zugangsdaten: Die Warteschlangennachricht enthält nur eine Aufgabenbeschreibung und einen Output-Key-Pointer, nicht den vollständigen Kontext des Aufrufers. Aufgerufene rufen zusätzlichen Kontext durch Lesen des Blackboard-Pointers ab.

**Stärken**: Horizontale Skalierung, lose Kopplung, natürlicher Lastausgleich über identische Worker.  
**Risiken**: Warteschlangentiefe kann unter Last unbegrenzt wachsen; Aufgabenreihenfolgengarantien hängen von der Warteschlangensemantik ab; Observability erfordert die Korrelation von Aufgaben-IDs über mehrere Warteschlangenlesen.

### Blackboard-Routing: Pointer-basierte Kontextisolation

Beim Blackboard-Pointer-Übergabe schreibt der Aufrufer seine Ausgabe in einen benannten Schlüssel auf einem gemeinsam genutzten persistenten Speicher, zum Beispiel `output/researcher/task_abc123`, und sendet dem Aufgerufenen nur den Schlüsselnamen. Der Aufgerufene liest den Schlüssel und ruft genau die benötigten Felder ab. Rohe Zugangsdaten, zwischengespeicherte Scratchpad-Inhalte und der vollständige Kontext des Aufrufers erscheinen nie in der Übergabenachricht.

OpenLegions `hand_off()`-Funktion implementiert dieses Muster nativ: Sie schreibt Ausgabedaten in `output/{agent_id}/{handoff_id}` auf dem Blackboard, erstellt einen Aufgabeneintrag im Posteingang des Empfängers mit einem Pointer auf diesen Schlüssel und weckt den Empfänger. Zugangsdaten, die im Vault gespeichert sind, werden vom Mesh zur Ausführungszeit injiziert.

**Stärken**: Höchste Zugangsdatenisolation, Aufgerufener liest nur was er braucht, vollständiger Prüfpfad über Schlüssel-Versionsverlauf, entkoppeltes Timing.  
**Risiken**: Fügt einen Lesevorgang hinzu; erfordert einen zuverlässigen gemeinsamen Speicher mit entsprechenden Zugangskontrollen.

### Streaming-Übergabe: Inkrementelle Kontextübertragung

Bei der Streaming-Übergabe wird Kontext Token für Token oder Chunk für Chunk übertragen, während der aufrufende Agent ihn generiert, anstatt auf die vollständige Ausgabe zu warten. Dies minimiert die End-to-End-Latenz in Echtzeit-Pipelines.

Streaming-Übergabe trägt das höchste Risiko der Zugangsdatenexponierung: Der Stream kann sensible Inhalte enthalten, die mitten im Reasoning generiert wurden, bevor der Aufrufer sie filtern konnte.

**Stärken**: Niedrigste End-to-End-Latenz, ermöglicht Echtzeit-Multi-Agenten-Zusammenarbeit.  
**Risiken**: Am schwersten zu sichern, am komplexesten zu beobachten, erfordert vom Aufgerufenen die Handhabung von partiellem Kontext.

## OpenLegions Einschätzung: Warum Kontextverlust und Zugangsdatenlecks die eigentlichen Übergabefehler sind

Die meisten Multi-Agenten-Übergabefehler fallen in zwei Kategorien: Kontextverlust-Fehler und Zugangsdatenleck-Fehler. Beide sind durch Design vermeidbar.

**Kontextverlust-Zahlen**: Evaluierungen der LLM-Kontextkomprimierung zeigen, dass naive Kürzung an der Übergabegrenze die Aufgabenabschlussraten bei Multi-Hop-Reasoning-Aufgaben verschlechtert im Vergleich zur strukturierten Zusammenfassung. Die Lösung ist kein größeres Kontextfenster, sondern eine strukturierte Übergabe-Payload mit expliziten Feldern für abgeschlossene Arbeit, verbleibende Arbeit und wichtige Erkenntnisse.

**Zugangsdatenleck**: OWASP LLM06:2025 (Sensitive Information Disclosure) deckt explizit die Zugangsdaten-Exfiltration via Agent-zu-Agent-Nachrichtenübermittlung als eine der Top-10-LLM-Schwachstellen ab.

### Das Kontextverlust-Problem: Was an der Grenze verloren geht

Die Grundursache des Kontextverlusts ist die Diskrepanz zwischen dem, was der aufrufende Agent weiß, und dem, was die Übergabe-Payload kommuniziert. Strukturierte Übergabe-Payloads verhindern dies: Der Aufrufer füllt explizit Felder aus: Aufgabenziel, bisher geleistete Arbeit, ausstehende Teilaufgaben, wichtige Erkenntnisse und Output-Key-Pointer.

### Zugangsdaten-Exfiltration via Übergabe-Payloads (OWASP LLM06:2025)

Google ADKs `transfer_to_agent()` übergibt das vollständige Session-Objekt einschließlich Konversationsverlauf an den empfangenden Agenten, was einen Kontexttransfer von bis zu 32.000 Token standardmäßig erzeugt. Teams, die eines dieser Frameworks verwenden, müssen ihre Übergabe-Implementierungen gegen [KI-Agenten-Sicherheit: Zugangsdatenisolation und Prompt-Injection-Verteidigung](/learn/ai-agent-security) prüfen.

### Das Blackboard-Pointer-Muster als sicherer Standard

Das Blackboard-Pointer-Muster eliminiert die Zugangsdatenexponierung auf Protokollebene, anstatt sich auf Filterung auf Anwendungsebene zu verlassen. Zugangsdaten, die im Vault von OpenLegion gespeichert sind, werden nie in den Agenten-Kontext injiziert.

## Wie große Frameworks Übergabe implementieren

### OpenAI Agents SDK: handoff() mit input_filter (27.133 Sterne)

openai/openai-agents-python (27.133 GitHub-Sterne, MIT-Lizenz) implementiert handoff() als Push-Muster. Die `input_filter`-Parameter wurde in v0.0.5 (März 2025) hinzugefügt und erfordert explizites Opt-in.

```python
from agents import Agent, handoff, RunContextWrapper

def strip_credentials(ctx: RunContextWrapper, input_data: ResearchInput) -> ResearchInput:
    return ResearchInput(task=input_data.task, context=input_data.context)

researcher = Agent(
    name="researcher",
    handoffs=[handoff(writer_agent, input_filter=strip_credentials)]
)
```

### Google ADK: transfer_to_agent() und Session-Objekt-Transfer (20.100 Sterne)

google/adk-python (20.100 GitHub-Sterne, Apache-2.0) implementiert Übergabe via `transfer_to_agent()`, das das vollständige `Session`-Objekt übergibt. Der Aufgerufene erhält alles, einschließlich Kontext, den er nicht benötigt, und muss irrelevante Historie explizit verwerfen.

### LangGraph: Command(goto=) mit gemeinsamem typisiertem Status

LangGraph (langchain-ai/langgraph, Apache-2.0) implementiert Agent-Routing via `Command(goto='node_name')` mit optionalen Status-Updates. Der Status ist ein typisiertes Dict, das über alle Knoten im Graphen geteilt wird. LangGraphs geteiltes Status-Modell bietet keine Zugangsdatenisolation zwischen Knoten.

```python
from langgraph.types import Command

def researcher_node(state: AgentState) -> Command:
    result = researcher.invoke(state)
    return Command(
        goto="writer",
        update={"research_output": result, "completed_steps": state["completed_steps"] + ["research"]}
    )
```

### OpenLegion: hand_off() mit Blackboard-Pointer und Posteingang-Lieferung

OpenLegions `hand_off()`-Funktion implementiert Blackboard-Pointer-Übergabe nativ.

```python
hand_off(
    to="writer",
    summary="Recherche abgeschlossen: langchain-alternative, 2847 Wörter Quellmaterial",
    data='{"topic": "langchain-alternative", "sources_key": "research/langchain-alt-sources", "word_count_target": 3000}'
)
```

## Übergabe-Datenverträge

### Was einzuschließen ist: Aufgabenzusammenfassung, Output-Key, relevante Historie

Eine gut gestaltete Übergabe-Payload ist eine strukturierte Spezifikation, kein Transkript-Dump. Einschließen:

- **Aufgabenzusammenfassung** (maximal 200 Wörter): Was der Aufgerufene erreichen muss
- **Output-Key-Pointer**: Der Blackboard-Schlüssel, wo die Ausgabe des Aufrufers gespeichert ist
- **Abgeschlossene Arbeit**: Was bereits erledigt wurde, als Fakten formuliert
- **Ausstehende Teilaufgaben**: Die spezifischen Elemente, für die der Aufgerufene verantwortlich ist
- **Strukturierte Parameter**: Alle typisierten Eingaben, die die Aufgabe des Aufgerufenen erfordert

### Was auszuschließen ist: Rohe Zugangsdaten, vollständige Kontextfenster, Zwischen-Scratchpads

Aus Übergabe-Payloads ausschließen:
- **API-Schlüssel, Token und Zugangsdaten**: Diese sollen zur Ausführungszeit vom Mesh injiziert werden
- **Vollständige Konversations-Transkripte**: Auf relevante Zusammenfassungen kürzen
- **Zwischen-Reasoning-Scratchpads**: Ketten-des-Denkens des Aufrufers sind für den Aufgerufenen nicht nützlich
- **Daten, die die Rolle des Aufgerufenen nicht erfordert**: Minimales Privileg für Kontext anwenden

## Übergabe-Routing-Mechanismen

### Statisches Routing: Fest kodierte Agenten-IDs

Statisches Routing sendet jede Übergabe eines bestimmten Typs an einen spezifischen benannten Agenten. Einfach zu implementieren, leicht nachzuverfolgen. Bricht, wenn der Zielagent nicht verfügbar, überlastet oder ersetzt ist.

### Dynamisches Routing: LLM-ausgewählter Spezialist

Dynamisches Routing verwendet einen LLM-Aufruf, um den geeigneten Spezialisten-Agenten basierend auf Aufgabeneigenschaften auszuwählen. Bietet Flexibilität, fügt aber Latenz hinzu und birgt die Möglichkeit von Routing-Fehlern.

### Bedingtes Routing: Regelbasierte Eskalation

Bedingtes Routing wendet deterministische Regeln an: Wenn die Aufgabenkomplexität einen Schwellenwert überschreitet, an einen Senior-Spezialisten weiterleiten; wenn die Aufgabe Sicherheit betrifft, an den Sicherheitsagenten weiterleiten.

### Fallback- und Timeout-Behandlung

Jede Übergabe sollte definieren, was passiert, wenn der Aufgerufene nicht innerhalb eines Timeout-Fensters antwortet. Optionen:
- **Wiederholen mit demselben Aufgerufenen**: Geeignet bei wahrscheinlich transientem Fehler
- **Zu einem alternativen Agenten umleiten**: Geeignet bei dauerhafter Nichtverfügbarkeit
- **An Operator eskalieren**: Geeignet bei blockierter Pipeline
- **Fehler ins Blackboard schreiben und fortfahren**: Geeignet bei optionaler nachgelagerter Aufgabe

## Sicherheits- und Zuverlässigkeitsvergleich von Übergabemustern

| **Dimension** | **Push-Übergabe** | **Pull-Dispatch** | **Blackboard-Routing** | **Streaming-Übergabe** |
|---|---|---|---|---|
| **Routing-Mechanismus** | Direkter Wake-Aufruf an Aufgerufenen | Gemeinsame Warteschlange / Posteingang-Übernahme | Schlüsselschreib + Aufgerufener-Watch | Inkrementeller Token-Stream |
| **Kontextisolation** | Aufrufer kontrolliert Payload; input_filter erforderlich | Nur Warteschlangennachricht | Höchste: Aufgerufener liest nur benannten Schlüssel | Niedrigste: Voller Kontext überschreitet Grenze |
| **Zugangsdaten-Expositionsrisiko** | Mittel: hängt von input_filter-Opt-in ab | Gering: Warteschlange hält nur Task-Pointer | Sehr gering: Zugangsdaten nie in Payload | Hoch: Stream kann sensiblen Kontext enthalten |
| **Observability** | Einzelnes Trace-Ereignis pro Übergabe | Warteschlangentiefe + Claim-Ereignisse | Schlüssel-Versionsverlauf + Posteingang-Ereignisse | Token-Level-Tracing erforderlich |
| **Latenz** | Niedrigste | Gering (Warteschlangen-Lese-Overhead) | Gering (Blackboard-Lese-Overhead) | Niedrigste End-to-End (Streaming) |
| **Optimal für** | Eng gekoppelte Spezialisten-Delegation | Lastausgeglichene Worker-Pools | Asynchrone entkoppelte Pipelines | Echtzeit-Zusammenarbeit |

<!-- SCHEMA: FAQPage -->
## Häufig gestellte Fragen

### Was ist ein Agent-Übergabemuster?

Ein Agent-Übergabemuster ist ein Protokoll für die Übertragung einer Aufgabe von einem KI-Agenten auf einen anderen. Es legt fest, welche Kontextdaten die Grenze überschreiten, wie der empfangende Agent benachrichtigt wird und welche Isolationsgarantien Zugangsdaten- oder Speicherlecks verhindern. Die vier kanonischen Muster sind Push-Übergabe, Pull-Dispatch, Blackboard-Pointer-Routing und Streaming-Übergabe, jeweils mit unterschiedlichen Sicherheits-, Latenz- und Observability-Abwägungen.

### Wie implementiert das OpenAI Agents SDK Übergabe?

Das OpenAI Agents SDK (27.133 GitHub-Sterne, MIT) implementiert handoff() als Push-Muster. Der aufrufende Agent ruft handoff() mit einem Zielagenten und einer optionalen input_filter-Funktion auf, die Felder aus dem Kontext vor der Übertragung entfernt. Der input_filter-Parameter wurde in v0.0.5 (März 2025) hinzugefügt und erfordert explizites Opt-in; ohne ihn wird das vollständige Kontextfenster an den Aufgerufenen weitergegeben.

### Wie implementiert Google ADK Agent-Übergabe?

Google ADK (20.100 GitHub-Sterne, Apache-2.0) verwendet transfer_to_agent(), das das vollständige Session-Objekt einschließlich Konversationsverlauf an den empfangenden Agenten übergibt. Dies erzeugt standardmäßig einen Kontexttransfer von bis zu 32.000 Token. Der empfangende Agent erhält die vollständige Historie und muss irrelevanten vorherigen Kontext explizit verwerfen.

### Was ist das Blackboard-Pointer-Übergabemuster und warum ist es sicherer?

Beim Blackboard-Pointer-Übergabe schreibt der Aufrufer seine Ausgabe in einen benannten Schlüssel auf einem gemeinsamen Speicher (wie output/agent-id/task-id) und sendet dem Aufgerufenen nur den Schlüssel-Pointer, nicht die Daten selbst. Der Aufgerufene liest nur die Felder, die er benötigt. Zugangsdaten erscheinen nie in der Übergabenachricht, was den OWASP LLM06:2025 (Sensitive Information Disclosure) Exfiltrationsvektor eliminiert. OpenLegions hand_off() implementiert dieses Muster nativ.

### Welche Sicherheitsrisiken bestehen bei der Agenten-Übergabe?

Das primäre Risiko ist die Zugangsdaten-Exfiltration: Frameworks, die Umgebungsvariablen, Bearer-Token oder API-Schlüssel in das beim Übergabe weitergereichte Kontextobjekt einschließen, exponieren diese dem empfangenden Agenten, der kompromittiert sein oder breiteren Netzwerkzugang haben könnte. OWASP LLM06:2025 identifiziert dies als Top-10-LLM-Schwachstelle. Das sekundäre Risiko ist Kontext-Poisoning.

### Wie behandelt man Übergabefehler und Timeouts?

Robuste Übergabe-Pipelines definieren einen Timeout und einen Fallback-Pfad: Wiederholen mit demselben Aufgerufenen, Umleitung zu einem alternativen Spezialisten, Eskalation an einen menschlichen Operator oder Schreiben eines Fehlerdatensatzes ins Blackboard. Der aufrufende Agent sollte Übergabe-IDs verfolgen und auf Aufgabenabschlussereignisse überwachen.

### Welche Daten sollten in eine Übergabe-Payload eingeschlossen werden?

Einschließen: eine präzise Aufgabenzusammenfassung (unter 200 Wörter), einen Pointer auf den Output-Datenschlüssel im gemeinsamen Speicher, abgeschlossene Arbeit als Fakten, ausstehende Teilaufgaben und alle strukturierten Parameter, die die Rolle des Aufgerufenen erfordert. Ausschließen: rohe API-Zugangsdaten, vollständige Konversations-Transkripte, Zwischen-Reasoning-Scratchpads und alle Daten, die die Rolle des Aufgerufenen nicht benötigt.

## Sichere Agenten-Übergabe in OpenLegion

Die Übergabegrenze ist der Ursprung der meisten Multi-Agenten-Zuverlässigkeitsprobleme. Kontextverlust beeinträchtigt die Qualität nachgelagerter Aufgaben, und Zugangsdatenlecks in der Payload erzeugen Exfiltrationrisiken, die mit der Pipeline-Länge wachsen.

OpenLegions Blackboard-Pointer-Übergabe löst beide Probleme auf Protokollebene. `hand_off()` schreibt Ausgaben in einen benannten Schlüssel, liefert nur einen Pointer an den Posteingang des Empfängers und verlässt sich auf vault-proxied Zugangsdaten-Injektion. Der Empfänger liest genau das, was er braucht, nicht mehr.

Für die Monitoring-Schicht, die Fehler erkennt, die das Übergabe-Protokoll verpasst, siehe [Agenten-Observability: Übergaben über Pipeline-Stufen verfolgen](/learn/ai-agent-observability). Für die Framework-Schicht, die bestimmt, welches Übergabemuster zu wählen ist, siehe [Vergleich von KI-Agenten-Frameworks für Produktionseinsätze](/learn/ai-agent-frameworks).

[Sichere Multi-Agenten-Pipelines auf OpenLegion aufbauen →](https://openlegion.ai)
