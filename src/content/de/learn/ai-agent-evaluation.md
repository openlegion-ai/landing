---
title: "KI-Agenten-Evaluierung: Benchmarks, Metriken und Tests"
description: "KI-Agenten-Evaluierung misst, ob Agenten Aufgaben zuverlässig abschließen, Tools sicher nutzen und Kostenbudgets einhalten — mit Benchmarks, LLM-as-Judge und Trace-Analyse."
slug: /learn/ai-agent-evaluation
primary_keyword: "ai agent evaluation"
last_updated: "2026-06-04"
date_published: "2026-06"
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-orchestration
---

# KI-Agenten-Evaluierung: Benchmarks, Metriken und Tests

KI-Agenten-Evaluierung ist die Praxis, systematisch zu messen, ob Agenten Aufgaben korrekt abschließen, Tools sicher aufrufen und Kosten- sowie Latenzbudgets über mehrstufige Ausführungs-Traces hinweg einhalten — nicht nur bei einem einzelnen LLM-Aufruf. Einzelne-Turn-Benchmarks für Sprachmodelle verfehlen die kumulativen Fehlermodi agentischer Systeme: Eine Schritt-Erfolgsrate von 90 % degradiert bei fünf sequenziellen Tool-Aufrufen auf etwa 59 %.

<!-- SCHEMA: DefinitionBlock -->
KI-Agenten-Evaluierung ist eine Software-Testdisziplin, die autonome KI-Systeme über Dimensionen wie Aufgaben-Abschlussrate, Tool-Call-Korrektheit, Trajektorien-Längeneffizienz, Sicherheitsschranken-Einhaltung und Kosten pro abgeschlossener Aufgabe bewertet — mittels Benchmark-Suites, aufgezeichnetem Trace-Replay und LLM-as-Judge-Bewertern.

## Warum Einzelne-Turn-LLM-Benchmarks bei Agenten versagen

### Kumulative Fehler in mehrstufigen Tool-Ketten

Einzelne-Turn-Benchmarks wie MMLU messen One-Shot-Genauigkeit bei isolierten Fragen. Agenten funktionieren anders: Jeder Tool-Aufruf hängt vom vorherigen Ergebnis ab, und Fehler propagieren. Bei 90 % Zuverlässigkeit pro Schritt schließt eine fünfstufige Tool-Kette nur zu 59 % ohne Fehler ab (0,9⁵ ≈ 0,59). Bei 80 % Zuverlässigkeit pro Schritt sinkt das auf 33 %.

Diese kumulative Dynamik bedeutet, dass ein Agent, der bei Schritt-Level-Metriken akzeptabel aussieht, in der End-to-End-Produktion unzuverlässig sein kann. Die einzige aussagekräftige Messung ist die trajektorien-level Aufgabenerfüllung: Hat der Agent die vollständige Aufgabe korrekt abgeschlossen, oder ist er irgendwo in der Kette gescheitert?

### Die Task-Pass@k-Adaption

Pass@k wurde in HumanEval (2021) eingeführt, um Code-Generierung zu messen: die Wahrscheinlichkeit, dass mindestens einer von k unabhängigen Generierungsversuchen alle Tests besteht. Für Agenten gilt dasselbe Prinzip auf Trajektorien-Ebene — task-pass@k misst, wie oft der vollständige Agenten-Lauf über k unabhängige Versuche korrekt abschließt.

Niedriges pass@1 mit hohem pass@3 ist ein spezifisches Fehlersignal: Der Agent kann die Aufgabe lösen, aber nicht zuverlässig. Dieses Muster deutet oft auf nicht-deterministische Tool-Auswahl, Kontextsensitivität für Prompt-Formulierung oder Race Conditions bei der Multi-Agenten-Koordination hin.

### Was MMLU und HumanEval übersehen

MMLU testet Faktenwissen. HumanEval testet Code-Generierung auf Funktionsebene in Isolation. Keiner testet, was Produktionsagenten tatsächlich tun: mehrstufiges Reasoning mit echten Tool-Ausgaben, Fehlerwiederherstellung bei unerwarteten Tool-Ergebnissen, Kostenmanagement über lange Trajektorien und Verhalten unter adversariellen Eingaben.

## OpenLegions Einschätzung: Die vier Eval-Dimensionen, die zählen

Agenten-Evaluierung, die bei der Aufgaben-Abschlussrate aufhört, übersieht die Fehlermodi, die in der Produktion wichtig sind. Vier Dimensionen sind für ein vollständiges Bild notwendig.

**OWASP LLM08:2025 (Übermäßige Handlungsfreiheit)** identifiziert unzureichende Tests des Agentenverhaltens als Ursache für unbeabsichtigte Nebeneffekte in agentischen Systemen — Agenten, die irreversible Aktionen durchführen, Berechtigungen eskalieren oder Daten außerhalb ihres Scope exfiltrieren.

**openai/evals (18.604 GitHub-Sterne, MIT-nah)** ist das größte Open-Source-LLM-Eval-Register. Es deckt modell-level Evaluierung ab, nicht agenten-level Trajektorien-Scoring. Teams, die nur gegen openai/evals benchmarken, messen das zugrunde liegende Modell, nicht das darauf aufgebaute Agentensystem.

**LLM-as-Judge** (popularisiert durch MT-Bench 2023) führt eine Positivitätsverzerrung von bis zu 20 % ein, wenn Richter- und Subjektmodell dieselben Basisgewichte teilen. Verwende für glaubwürdige Evaluierungsergebnisse eine andere Modellfamilie als Richter.

### Tool-Call-Korrektheit und Nebeneffekt-Auditing

Zeichne jeden Tool-Call auf, den der Agent während Eval-Läufen macht: Tool-Name, Argumente, Rückgabewert und nachgelagerte Aktionen. Vergleiche mit einer goldenen Trajektorie. Abweichungen — zusätzliche Aufrufe, falsche Argumentwerte, Aufrufe in falscher Reihenfolge — deuten auf Reasoning-Fehler hin.

### Kosten-pro-Aufgabe und Latenzbudgets

Ein Agent, der Aufgaben korrekt abschließt, aber 47 LLM-Aufrufe benötigt, um das zu tun, was ein gut gestalteter Agent in 8 erledigt, ist nicht produktionsreif. Messe verbrauchte Tokens und Wanduhrzeit pro abgeschlossener Aufgabe. Verfolge Durchschnitts- und Tail-Werte (P95, P99).

### Sicherheits-Eval: Credential-Handling und Injection-Resistenz

Sicherheitsevaluierung verdient eine eigene Test-Suite. Enthält Testfälle, die verifizieren: Der Agent loggt, echobt oder übergibt keine Credentials in Tool-Call-Argumenten; der Agent folgt nicht Anweisungen, die in adversariellen Tool-Ausgaben eingebettet sind; der Agent nimmt keine irreversiblen Aktionen außerhalb seines designierten Aufgaben-Scope vor.

## Benchmark-Suites für KI-Agenten

### openai/evals: Modell-Level-Baseline (18.604 Sterne)

openai/evals (18.604 GitHub-Sterne, MIT-nah) ist das größte Open-Benchmark-Register für LLM-Evaluierung. Es bietet ein standardisiertes Format zum Definieren von Eval-Aufgaben, Ausführen von Modellen dagegen und Vergleichen von Ergebnissen. Für Agenten-Teams ist openai/evals als Modellqualitäts-Baseline nützlich — es sagt, wie leistungsfähig das zugrunde liegende LLM ist. Es testet nicht mehrstufige Tool-Nutzung oder agentische Aufgabenerfüllung.

### trycua/cua: Computer-Use-Agent-Benchmarks (17.633 Sterne)

trycua/cua (17.633 GitHub-Sterne, MIT) bietet Sandbox-Umgebungen zur Evaluierung von Computer-Use-Agenten, die macOS-, Linux- und Windows-Desktops steuern. CUA-Benchmarks gehören zu den anspruchsvollsten im Open-Source-Eval-Bereich, weil sie Agenten in Live-Ausführungsumgebungen testen.

### microsoft/promptflow: LLM-App-Qualitäts-Eval-Nodes (11.142 Sterne)

microsoft/promptflow (11.142 GitHub-Sterne, MIT) enthält eingebaute Eval-Nodes zum Bewerten von LLM-Anwendungsausgaben: Bodenständigkeit, Relevanz und Flüssigkeit. Diese Nodes integrieren sich in PromptFlow-Pipelines und können als CI-Checks auf jedem Commit laufen.

### IBM/AssetOpsBench: 460+ Industrie-Szenarien-MCP-Evals (1.704 Sterne)

IBM/AssetOpsBench (1.704 GitHub-Sterne, Apache-2.0) bietet über 460 Industrie-Szenario-Evaluierungsfälle für Agenten, die über das Model Context Protocol operieren. Der Benchmark deckt vier Spezialistenagenten-Rollen über realistische IT-Betriebs-, Asset-Management- und Service-Desk-Szenarien ab.

## Evaluierungsmethoden

### Exact Match und programmatische Bewerter

Exact-Match-Bewerter vergleichen Agenten-Ausgaben mit einem vordefinierten erwarteten Wert. Sie sind deterministisch, schnell und frei von Richtermodell-Verzerrung — aber nur anwendbar, wenn die korrekte Ausgabe eindeutig spezifiziert ist.

### LLM-as-Judge: Verzerrungsrisiken und Mitigation

LLM-as-Judge verwendet ein Sprachmodell, um Agenten-Ausgaben gegen eine Rubrik zu bewerten. Das Verzerrungsrisiko ist quantifiziert: Wenn Richter- und Subjektmodell dieselben Basisgewichte teilen, bläst eine Positivitätsverzerrung von bis zu 20 % die Evaluierungswerte auf.

Minderungsmaßnahmen: Verwende ein Richtermodell einer anderen Anbieter- oder Trainierungslinie; liefere explizite Scoring-Rubriken mit konkreten Bestehen/Fehlschlagen-Kriterien; kalibriere Richter-Scores gegen ein kleines Set menschlich-gekennzeichneter Beispiele.

### Trajektorien-Scoring und Schritt-Level-Korrektheit

Trajektorien-Scoring bewertet die vollständige Aktionssequenz, die ein Agent zur Aufgabenerfüllung unternommen hat. Schritt-level Metriken: Tool-Auswahlgenauigkeit, Argument-Korrektheit, Trajektorien-Effizienz, Fehlerwiederherstellung, Terminierungsgenauigkeit.

### Adversarielle Eingabe-Harnesses

Adversarielle Evals testen das Agentenverhalten unter Eingaben, die zur Auslösung unsicheren oder falschen Verhaltens entwickelt wurden: Prompt-Injection via Tool-Ausgaben, fehlerhafte Tool-Antworten, Scope-Grenztest, Credential-Expositions-Sonden.

## Aufbau einer Agenten-Eval-Pipeline

### Eval-Datensatz-Design für agentische Aufgaben

Ein guter Agenten-Eval-Datensatz enthält: Aufgaben-Eingaben, erwartete Tool-Call-Sequenz, Erfolgskriterien und Metadaten. Beginne mit 50-100 Aufgaben, die die Hauptanwendungsfälle abdecken. Erweitere den Datensatz durch Überprüfung von Produktions-Traces auf Fehlerfälle.

### Trace-Replay und Regressionstests

Trace-Replay führt den Eval-Datensatz gegen den Agenten aus, erfasst vollständige Ausführungs-Traces und vergleicht mit goldenen Traces. Regressionstests kennzeichnen, wenn eine Aufgabe, die in einer früheren Agentenversion bestand, in der aktuellen scheitert.

### CI-Integration: Deployments bei Eval-Regressionen blockieren

Integriere Agenten-Eval in die CI-Pipeline, um Deployments bei Qualitätsregressionen zu blockieren: Eval-Datensatz bei jedem PR ausführen, Aufgaben-Abschlussrate berechnen, gegen Baseline vergleichen, Deployment blockieren wenn Rate um mehr als 5 % absolut fällt oder ein Sicherheits-Eval-Testfall von Bestehen auf Fehlschlagen regressiert.

## Eval-Tools-Vergleich

| **Dimension** | **openai/evals** | **trycua/cua** | **promptflow eval** | **IBM/AssetOpsBench** |
|---|---|---|---|---|
| **Eval-Umfang** | Einzelner-Turn-LLM | Computer-Use-Desktop | LLM-App-Qualität | Multi-Rollen-MCP-Agenten |
| **Bewertungsmethode** | Exact Match, LLM-Richter | Umgebungsausführung | LLM-Richter-Nodes | Programmatisch + LLM-Richter |
| **Agenten-Trajektorien-Unterstützung** | Nein | Ja (vollständige Desktop-Sessions) | Teilweise (Flow-Level) | Ja (4-Rollen-Workflows) |
| **Sicherheits-/Safety-Tests** | Nein | Nein | Nein | Teilweise |
| **CI-Integration** | Via CLI | Via SDK | Nativ in PromptFlow | Manuell |
| **Lizenz** | MIT-nah | MIT | MIT | Apache-2.0 |
| **GitHub-Sterne** | 18.604 | 17.633 | 11.142 | 1.704 |

<!-- SCHEMA: FAQPage -->
## Häufig gestellte Fragen

### Was ist KI-Agenten-Evaluierung?

KI-Agenten-Evaluierung misst, ob Agenten mehrstufige Aufgaben korrekt abschließen, Tools mit den richtigen Argumenten aufrufen, Kosten- und Latenzbudgets einhalten und unsichere Verhaltensweisen wie Credential-Exfiltration oder Prompt-Injection vermeiden. Anders als Einzelne-Turn-LLM-Evals bewertet die Agenten-Eval vollständige Ausführungs-Trajektorien.

### Welche Benchmarks werden zur Evaluierung von KI-Agenten verwendet?

Gängige Frameworks sind openai/evals (18.604 GitHub-Sterne, Modell-Level), trycua/cua (17.633 GitHub-Sterne, MIT, Computer-Use-Desktop-Aufgaben), microsoft/promptflow eval nodes (11.142 GitHub-Sterne, MIT, LLM-App-Qualität) und IBM/AssetOpsBench (1.704 GitHub-Sterne, Apache-2.0, 460+ Industrie-MCP-Szenarien).

### Was ist LLM-as-Judge-Evaluierung und welche Risiken hat sie?

LLM-as-Judge verwendet ein separates Sprachmodell, um Agenten-Ausgaben gegen eine Rubrik zu bewerten. Das Schlüsselrisiko: Wenn Richter- und Subjektmodell dieselben Basisgewichte teilen, bläst eine Positivitätsverzerrung von bis zu 20 % die Werte auf. Verwende eine andere Modellfamilie als Richter für glaubwürdige Ergebnisse.

### Wie funktioniert pass@k bei der Agenten-Evaluierung?

Pass@k misst die Wahrscheinlichkeit, dass mindestens einer von k unabhängigen Agenten-Läufen eine Aufgabe korrekt abschließt. Niedriges pass@1 mit hohem pass@3 signalisiert nicht-deterministische Ausführung, die vor dem Produktions-Deployment untersucht werden sollte.

### Wie evaluiert man Agenten-Sicherheit und Credential-Handling?

Sicherheits-Evals testen, ob Agenten Credentials in Tool-Call-Argumenten preisgeben, auf adversarielle Prompt-Injection in Tool-Ausgaben reagieren oder irreversible Nebeneffekte außerhalb ihres Scope verursachen. OWASP LLM08:2025 (Übermäßige Handlungsfreiheit) dokumentiert dieses Fehlermuster als Top-10-LLM-Schwachstelle.

### Wie integriert man Agenten-Evaluierung in CI/CD?

Zeichne einen goldenen Eval-Datensatz mit Aufgaben-Eingaben, erwarteten Tool-Call-Sequenzen und Endausgaben auf. Spiele bei jedem Commit den Datensatz gegen den aktualisierten Agenten ab und vergleiche Trajektorien-Scores mit der vorherigen Baseline. Blockiere Deployments, wenn die Aufgaben-Abschlussrate um mehr als 5 % absolut fällt oder ein Sicherheitstest regressiert.

### Wie unterstützt OpenLegion die Agenten-Evaluierung?

OpenLegions Agenten-Mesh emittiert strukturierte Tool-Call-Traces, die gegen einen Eval-Harness wiederholt werden können. Der Credential-Vault stellt sicher, dass Eval-Läufe isolierte Credentials verwenden — ein fehlgeschlagener Sicherheitstest kann keine echten API-Tokens exfiltrieren. Herzschlag-gesteuerte Eval-Agenten können Regressions-Suites nach Zeitplan ausführen.

## Evaluiere deine Agenten in einem sicheren Mesh

Zuverlässige Agenten erfordern Eval-Infrastruktur, die die vollständige Ausführungs-Trajektorie testet. Das kumulative Fehlerproblem ist real: Eine Schritt-Zuverlässigkeitsrate von 90 % bedeutet, dass ein fünfstufiger Agent 41 % der Läufe fehlschlägt. Das Erkennen dieser Degradation vor der Produktion erfordert trajektorien-level Eval, adversarielle Eingabetests und CI-gesteuerte Regressionsprüfungen.

[Beginne mit der Erstellung evaluierter Agenten auf OpenLegion](https://openlegion.ai)
