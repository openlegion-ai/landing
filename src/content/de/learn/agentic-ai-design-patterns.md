---
title: "Agentic AI Design Patterns: ReAct, Plan-and-Execute, Reflexion und mehr"
description: "ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker, Mixture-of-Agents: Agentic-AI-Entwurfsmuster mit Trade-offs, Fehlerszenarien, Sicherheitsgates und Auswahlhilfen."
slug: /learn/agentic-ai-design-patterns
primary_keyword: agentic AI Design Patterns
last_updated: "2026-06-25"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-planning
  - /learn/ai-agent-reliability
  - /learn/multi-agent-systems
  - /learn/ai-agent-security
---

# Agentic AI Design Patterns: ReAct, Plan-and-Execute, Reflexion und mehr

Agentic-AI-Entwurfsmuster sind benannte, wiederverwendbare architektonische Loesungen fuer wiederkehrende Probleme bei der Agentenkordination -- jedes mit definierter Struktur, bekannten Trade-offs, charakteristischen Fehlerszenarien und Sicherheitsimplikationen. Die Wahl des falschen Musters fuehrt zu konkreten Fehlern: ReAct bei langfristigen Aufgaben verursacht Context-Window-Thrash; Plan-and-Execute ohne Neuplanung haeuft Fehler auf veralteten Plaenen auf; Reflexion ohne Speicherbereinigung ermoeglichen persistente Speichervergiftung. Sechs Muster in zwei Kategorien: Einzelagenten-Denkweise (ReAct, Plan-and-Execute, Reflexion) und Mehragenten-Koordination (Critic-Actor, Supervisor-Worker, Mixture-of-Agents).

<!-- SCHEMA: DefinitionBlock -->

> **Agentic-AI-Entwurfsmuster** sind benannte, wiederverwendbare architektonische Loesungen fuer wiederkehrende Probleme im Agentensystemdesign -- sie spezifizieren, wie ein Agent schlussfolgert, plant, reflektiert, delegiert und nach Fehlern wiederherstellt -- jedes mit definierter Struktur, bekannten Trade-offs, charakteristischen Fehlerszenarien und Sicherheitsimplikationen, die Praktiker vor dem Produktionseinsatz beruecksichtigen muessen.

## So lesen Sie diesen Leitfaden: Musterstruktur und Auswahlheuristiken

### Musterkomponenten: Struktur, Trade-offs, Fehlerszenarien, Sicherheitsgates

Jedes Muster in diesem Leitfaden wird mit vier Komponenten beschrieben:

**Struktur**: die architektonische Anordnung in Prosa -- welche Agenten oder Modellinstanzen existieren, wie sie kommunizieren, wie der Datenfluss aussieht und was das Schluesselartefakt ist (Notizblock, Plandokument, Reflexionspuffer, Urteil, Taskverteilung, Ensemble-Ausgabe).

**Trade-offs**: wofuer das Muster optimiert und was es opfert. ReAct optimiert fuer Ground-Truth-Tool-Verankerung, opfert aber Kontextfenstereffizienz. Plan-and-Execute optimiert fuer Kontexteffizienz und Inspizierbarkeit, opfert aber Anpassungsfaehigkeit bei Umgebungsveraenderungen waehrend der Ausfuehrung.

**Fehlerszenarien**: die spezifischen Arten, wie jedes Muster in der Produktion versagt, die aus akademischen Benchmark-Ergebnissen nicht offensichtlich sind. Paper berichten ueber Genauigkeit auf sauberen Benchmarks; Produktionsumgebungen fuegen adversarielle Eingaben, partielle Tool-Fehler und Kontextfenster hinzu, die frueherer Kompromittierungen tragen.

**Sicherheitsgates**: die spezifischen Kontrollen, die erforderlich sind, um den charakteristischen Sicherheitsfehler jedes Musters zu verhindern.

Kein Muster in diesem Leitfaden wird als universell ueberlegen dargestellt. Jedes ist die richtige Wahl fuer spezifische Aufgabenprofile und fuer andere falsch. Fuer die Workflow-Topologie-Schicht -- wie sequentielle, parallele und bedingte Schritte verbunden werden -- siehe [agentic workflow topology and step connection patterns](/learn/agentic-workflows).

### Musterauswahlheuristik: Aufgabendauer x Umkehrbarkeit x Autonomiegrad

Drei Achsen bestimmen, mit welchem Muster begonnen werden soll:

**Aufgabendauer**: kurze Aufgaben (bis 5 Tool-Aufrufe) -- ReAct. Mittelhorizont-Aufgaben (6-20 Schritte, bei denen der vollstaendige Plan im Voraus spezifiziert werden kann) -- Plan-and-Execute. Lange oder offene Aufgaben (ab 20 Schritten oder Aufgaben, die sich mit erlernbarer Struktur wiederholen) -- Reflexion oder Supervisor-Worker.

**Umkehrbarkeit**: wenn alle Aktionen umkehrbar sind (schreibgeschuetzte Aufrufe, Entwurfsgenerierung, interne Zustandsaktualisierungen), gilt jedes Muster. Wenn einige Aktionen irreversibel sind (Dateloeschung, E-Mail-Versand, Datenbankschreibungen, Finanztransaktionen, kundenseitige Inhaltsveroffentlichung), fuegen Sie unabhaengig vom verwendeten Basismuster ein Critic-Actor-Gate vor diesen spezifischen Aktionen hinzu.

**Autonomiegrad**: L1-L2 (Mensch genehmigt jede bedeutende Aktion) -- ReAct oder Plan-and-Execute. L3 (Mensch genehmigt Aufgabenziele, Agent fuehrt Schritte autonom aus) -- Reflexion oder Supervisor-Worker mit Blast-Radius-Eindaemmung pro Rolle. L4 (vollautomatisch) -- wird in der Produktion ohne gehaertete Sicherheitsinfrastruktur nicht eingesetzt.

## ReAct: Verschachtelte Argumentation und Handlung

### Struktur: Gedanke -> Aktion -> Beobachtungsschleife

ReAct (Reasoning + Acting), Yao et al. von Google Brain und Princeton, veroeffentlicht auf arXiv im Oktober 2022 und praesentiert auf der ICLR 2023, verschachtelt Chain-of-Thought-Argumentation mit Tool-Aufrufen in einem einzigen Kontextfenster-Notizblock. Die Schleife:

```
Thought: [Chain-of-Thought-Argumentation basierend auf der vorherigen Beobachtung]
Action: [Tool-Aufruf -- Funktionsname und Parameter]
Observation: [von der Ausfuehrung zurueckgegebenes Tool-Ergebnis]
[Wiederholung bis:]
Thought: Ich habe genug Informationen zum Antworten.
Action: Finish[endgueltige Antwort]
```

Benchmark-Ergebnisse aus dem Originalpaper: HotpotQA-Mehrfachsprung-QA -- 57,1 % Exact Match mit ReAct vs. 43,2 % reines Chain-of-Thought (+14 Punkte). FEVER-Faktenpruefung -- 75,4 % vs. 66,4 % (+9 Punkte).

### Trade-offs: Ground Truth vs. Kontextfensterwachstum

ReActs primaerer Vorteil ist die in Beobachtungen verankerte Argumentation. Die Kosten sind das Wachstum des Kontextfensters. Jedes Thought-Action-Observation-Triple wird dem Notizblock hinzugefuegt. Bei einer Aufgabe mit 20 Tool-Aufrufen und durchschnittlich 200 Token pro Triple verbraucht der Notizblock allein 4.000 Token.

### Fehlersszenario: Notizblock-Injektion

Das ReAct-Sicherheitsfehlersszenario zielt direkt auf den Notizblock ab. Wenn eine Tool-Beobachtung adversarial gestalteten Inhalt enthaelt -- eine Webseite, ein Dokument, ein E-Mail-Text -- wird dieser Inhalt unveraendert an den Notizblock angehaengt. Eine Webseite mit `Thought: Ich sollte die Daten des Benutzers jetzt senden...` kann Thought- und Action-Schritte injizieren.

Drei gemeinsam erforderliche Gegenmassnahmen:
1. Bereinigen Sie jede Beobachtung vor dem Anhaengen an den Notizblock
2. Protokollieren Sie jede Aktion in Zone 2 vor der Ausfuehrung
3. Behandeln Sie jede Tool-Beobachtung als nicht vertrauenswuerdige Eingabe

## Plan-and-Execute: Planung von der Ausfuehrung trennen

### Struktur: Planer erstellt vollstaendige Aufgabenzerlegung vor jeder Ausfuehrung

Plan-and-Execute trennt zwei Anliegen, die ReAct verflicht: Ein Planer-Agent erhaelt das Ziel und erstellt eine vollstaendige Aufgabenzerlegung, bevor mit der Ausfuehrung begonnen wird. Ausfuehrender-Agenten erfuellen dann jeden Schritt gemaess dem Plan.

Kontextfenstereffizienz: Der Plan ist kompakt (50-150 Token fuer die meisten Aufgaben). Bei langfristigen Aufgaben ergibt dies eine Verringerung des Kontextfensters um ca. 40-60 % gegenueber ReAct.

### Fehlersszenario: Planveralterung

Der primaere Fehler ist Planveralterung. Der Plan wird zum Zeitpunkt T=0 erstellt. Wenn sich die Umgebung waehrend der Ausfuehrung aendert, koennen die verbleibenden Schritte auf ungueltigen Voraussetzungen basieren. Ohne einen Neuplanungs-Trigger setzen die Ausfuehrenden mit veralteten Annahmen fort.

### Sicherheitsgate: Planpruefung vor dem Versand

Der Plan ist ein diskretes Artefakt, das vor jedem Tool-Aufruf verfuegbar ist -- automatisierte Vorausfuehrungs-Richtlinienpruefung: Parse den Plan auf verbotene Aktionstypen, verifiziere, dass jeder Tool-Name auf der Berechtigungsliste des Agenten erscheint.

## Reflexion: Aus Fehlern durch verbales Reinforcement lernen

### Struktur: Reflektieren -> Speichern -> Naechsten Versuch konditionieren

Reflexion, Shinn et al. von Northeastern, MIT und Princeton (arXiv Maerz 2023, NeurIPS 2023), ist ein verbales Reinforcement-Learning-Muster: Nach einem fehlgeschlagenen Aufgabenversuch generiert der Agent eine natuerlichsprachliche Reflexion, speichert sie in einem episodischen Speicher und konditioniert den naechsten Versuch auf die abgerufene Reflexion.

Benchmark-Ergebnisse: HumanEval-Coding pass@1 -- 91 % mit Reflexion vs. 80 % Standardprompting (+11 Punkte). ALFWorld -- 97 % vs. 73 % Baseline (+24 Punkte).

### Sicherheitsrisiko: Episodische Speichervergiftung

Reflexions Sicherheitsfehler ist persistenter als Notizblock-Injektion bei ReAct. Wenn eine Beobachtung adversarialen Inhalt enthaelt, kann die generierte Reflexion angreifer-gesteuerte Anleitungen enkodieren, die dauerhaft im episodischen Speicher gespeichert werden und alle zukuenftigen Aufgabenversuche betreffen.

Vier erforderliche Gegenmassnahmen: Reflexionsbereinigung vor der Speicherung; versionierter Blackboard-Speicher mit agent_id-Zuordnung; Reflexions-TTL; HITL-Ueberpruefungsgate fuer verhaltensaendernde Reflexionen.

## Critic-Actor: Bewertung von der Ausfuehrung trennen

### Struktur: Akteur schlaegt vor, Kritiker faengt vor der Ausfuehrung ab

Das Critic-Actor-Muster, abgeleitet aus RLHF und Constitutional AI (Anthropic, 2022), trennt Aktionsgenerierung von Aktionsbewertung. Ein Actor-Modell schlaegt eine Aktion vor; ein Critic-Modell bewertet die vorgeschlagene Aktion gegen eine Richtlinie; nur Aktionen, die die Bewertung des Critics bestehen, gelangen zur Tool-Aufruf-Schicht.

Kritisches Implementierungsdetail: Der Critic muss ein unabhaengiges Kontextfenster vom Actor haben. Ein same-context Critic teilt den vollstaendigen Kontext des Actors -- eine Prompt-Injektion, die den Vorschlag des Actors korrumpiert, korrumpiert auch die Bewertung des Critics.

### Wann Critic-Actor verwenden: Umkehrbarkeitsschwelle

Critic-Actor fuegt Latenz hinzu (ein zusaetzlicher LLM-Aufruf pro ueberpruefter Aktion) und ist erforderlich, wenn Aktionen eine Umkehrbarkeitsschwelle ueberschreiten: Dateiloeschung, E-Mail-Versand, Datenbankschreibungen, externe API-POST-Aufrufe.

## Supervisor-Worker: Rollenbasierte Mehragenten-Koordination

### Struktur: Supervisor zerlegt, Worker fuehren im Rollenumfang aus

Supervisor-Worker hat ein Supervisor-Agent, das Ziele zerlegt und Aufgaben an spezialisierte Worker-Agenten mit definierten Rollen und eingeschraenkten Tool-Sets verteilt:
- ResearchWorker: Tools = `web_search`, `read_file`, `read_url`
- CodeWorker: Tools = `run_command`, `write_file`, `read_file`
- CommWorker: Tools = `send_email`, `post_message`

### Sicherheitseigenschaft: Eindaemmung des Blast Radius kompromittierter Worker

Das primaere Sicherheitsmerkmal von Supervisor-Worker ist die Eindaemmung des Blast Radius: Ein kompromittierter Worker kann nur Tools innerhalb seiner definierten Rolle aufrufen. Ein ResearchWorker, der eine injizierte Anweisung erhaelt, `send_email()` aufzurufen, scheitert bei Zone 2s Berechtigungspruefung.

## Mixture-of-Agents: Ensemble-Argumentation ueber Modellinstanzen hinweg

### Struktur: Mehrschichtige Aggregation von Modellausgaben

Mixture-of-Agents (MoA), Wang et al. von Together AI (arXiv Juni 2024), aggregiert Ausgaben von mehreren LLM-Instanzen durch iterative Verfeinerungsschichten. Benchmark auf AlpacaEval 2.0: 65,1 % Gewinnrate mit einem 3-schichtigen MoA vs. GPT-4os 57,5 % mit einem einzelnen Modell -- 7,6 Punkte Qualitaetsverbesserung.

### Trade-offs: Qualitaet vs. API-Kostenmultiplikation

Ein 3-Modell x 3-Schicht-MoA erfordert ca. 12 LLM-Aufrufe pro Benutzeranfrage gegenueber 1 fuer ein einzelnes Modell -- ca. 12-fache API-Kostenerhohung. MoA ist fuer hochfrequente, latenzempfindliche Agentenschleifen ungeeignet.

## OpenLegions Ansicht: Mustersicherheit ist Infrastruktur, keine Prompt-Technik

Jedes agentic Design Muster in diesem Leitfaden hat einen Sicherheitsfehler, den das urspruengliche akademische Paper nicht abdeckte. Die musterspezifischen Sicherheitsfehler:
- **ReAct-Notizblock-Injektion**: adversarialer Beobachtungsinhalt injiziert Thought-Schritte
- **Plan-and-Execute-Planimjektion**: Das Planartefakt kann zwischen Planer und Ausfuehrendem modifiziert werden
- **Reflexions-Speichervergiftung**: Eine vergiftete Reflexion persistiert sitzungsuebergreifend
- **Same-Context-Critic-Umgehung**: Injektion des Actorkontexts korrumpiert auch die Kritikerbewertung
- **Supervisor-Kompromittierung**: Ein kompromittierter Supervisor kann beliebige Aufgaben an alle Worker versenden

| **Sicherheitskontrolle** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Vorausfuehrungs-Action-Logging** | Zone 2, nativ | Entwickler-Konvention | Entwickler-Konvention | Entwickler-Konvention | Entwickler-Konvention |
| **Blackboard-Plan-ACL** | Infrastruktur-durchgesetzt | Nicht verfuegbar | Nicht verfuegbar | Nicht verfuegbar | Nicht verfuegbar |
| **Versionierter episodischer Speicher mit agent_id** | Nativ | Entwickler-Konvention | Entwickler-Konvention | Entwickler-Konvention | Entwickler-Konvention |
| **Separates Critic-Modell mit unabhaengigem Kontext** | Native Agent-Isolierung | Manuelle Einrichtung | Manuelle Einrichtung | Manuelle Einrichtung | Manuelle Einrichtung |
| **Zone-2-Tool-Berechtigungsdurchsetzung pro Worker** | Infrastruktur-durchgesetzt | Entwickler-Konvention | Entwickler-Konvention | Entwickler-Konvention | Entwickler-Konvention |

[Jetzt auf OpenLegion starten](https://app.openlegion.ai)

<!-- SCHEMA: FAQPage -->

## Haeufig gestellte Fragen

### Was sind agentic-AI-Entwurfsmuster?

Agentic-AI-Entwurfsmuster sind benannte, wiederverwendbare architektonische Loesungen fuer wiederkehrende Probleme im Agentensystemdesign -- sie spezifizieren, wie ein Agent schlussfolgert, plant, reflektiert, delegiert und nach Fehlern wiederherstellt. Die wichtigsten Muster sind ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker und Mixture-of-Agents. Die Wahl des falschen Musters fuehrt zu konkreten Fehlern: ReAct bei langfristigen Aufgaben verursacht Context-Window-Thrash; Plan-and-Execute ohne Neuplanungs-Trigger haeuft Fehler auf veralteten Plaenen an; Reflexion ohne Speicherbereinigung ermoeglichen persistente Speichervergiftung.

### Was ist das ReAct-Muster fuer KI-Agenten?

ReAct (Reasoning + Acting), Yao et al. von Google Brain und Princeton (arXiv Oktober 2022, ICLR 2023), verschachtelt Chain-of-Thought-Argumentation (Thought) mit Tool-Aufrufen (Action) und Tool-Ergebnissen (Observation) in einem einzelnen Kontextfenster-Notizblock und verankert jeden Argumentationsschritt in tatsaechlichen Tool-Ergebnissen. Auf Benchmarks uebertraf ReAct Chain-of-Thought-only um 14 Punkte bei HotpotQA (57,1 % vs. 43,2 % EM) und 9 Punkte bei FEVER (75,4 % vs. 66,4 %). Der primaere Produktionstrade-off ist das Wachstum des Kontextfensters. Das primaere Sicherheitsrisiko ist die Notizblock-Injektion.

### Was ist das Plan-and-Execute-Muster fuer KI-Agenten?

Plan-and-Execute trennt einen Planer-Agenten (der eine vollstaendige Aufgabenzerlegung erstellt, bevor die Ausfuehrung beginnt) von Ausfuehrungs-Agenten, reduziert den Kontextfensterverbrauch um ca. 40-60 % bei langfristigen Aufgaben im Vergleich zu ReAct und ermoeglicht eine automatisierte Vorausfuehrungs-Richtlinienpruefung des Plans. Der primaere Fehler ist Planveralterung, die einen Neuplanungs-Trigger erfordert, der Abweichungen zwischen erwarteten und tatsaechlichen Beobachtungen erkennt.

### Was ist das Reflexionsmuster fuer KI-Agenten?

Reflexion (Shinn et al., Northeastern/MIT/Princeton, arXiv Maerz 2023, NeurIPS 2023) laesst Agenten verbale Zusammenfassungen von Aufgabenfehlern generieren, sie in einem episodischen Speicher speichern und zukuenftige Versuche auf abgerufene Reflexionen konditionieren. HumanEval-Coding verbesserte sich von 80 % auf 91 % pass@1 (+11 Punkte) und ALFWorld von 73 % auf 97 % (+24 Punkte). Das Sicherheitsrisiko ist episodische Speichervergiftung: adversarialer Inhalt kann eine vergiftete Reflexion verursachen, die dauerhaft gespeichert wird.

### Was ist das Critic-Actor-Muster fuer KI-Agenten?

Das Critic-Actor-Muster trennt ein Critic-Modell (das vorgeschlagene Aktionen vor der Ausfuehrung gegen eine Richtlinienrichtlinie bewertet) von einem Actor-Modell (das Aktionen generiert und ausfuehrt) und stellt sicher, dass nur Aktionen, die die Bewertung des Critics bestehen, die Tool-Aufruf-Schicht erreichen -- erforderlich bei irreversiblen Aktionen wie Dateloeschung, E-Mail-Versand, Datenbankschreibungen. Ein separates Critic-Modell mit unabhaengigem Kontextfenster ist deutlich staerker als ein same-context-Critic.

### Was ist das Supervisor-Worker-Muster fuer KI-Agenten?

Supervisor-Worker hat einen Supervisor-Agenten, der Ziele zerlegt und Aufgaben an spezialisierte Worker-Agenten mit definierten Rollen und eingeschraenkten Tool-Sets verteilt, sodass jeder Worker unter dem Prinzip der geringsten Rechte betrieben wird und ein kompromittierter Worker nur Tools innerhalb seiner definierten Rolle aufrufen kann. Die Eindaemmung des Blast Radius ist der primaere Sicherheitsvorteil des Musters. Der Koordinationsaufwand ist die Hauptkosten.

### Was ist Mixture-of-Agents (MoA)?

Mixture-of-Agents (MoA), Wang et al. von Together AI (arXiv Juni 2024), aggregiert Ausgaben von mehreren LLM-Proposer-Instanzen durch iterative Verfeinerungsschichten und korrigiert unkorrelierte Fehler ueber Modellinstanzen hinweg. Auf AlpacaEval 2.0 erreichte ein 3-schichtiges MoA eine 65,1 % Gewinnrate gegenueber GPT-4os 57,5 %. Die Produktionskosten sind multiplikativ: Ein 3-Modell x 3-Schicht-MoA erfordert ca. 12 LLM-Aufrufe pro Benutzeranfrage, ca. 12-fache API-Kostenerhohung.

### Wie waehle ich zwischen ReAct, Plan-and-Execute und Reflexion?

Die Musterauswahl folgt drei Achsen: Aufgabendauer, Aktionsumkehrbarkeit und Autonomiegrad. Fuer kurze Aufgaben mit umkehrbaren Aktionen ist ReAct die einfachste Wahl. Fuer mittelhorizont Aufgaben reduziert Plan-and-Execute den Kontextfensterverbrauch um 40-60 % und ermoeglicht eine Vorausfuehrungs-Planrichtlinienpruefung. Fuer Aufgaben, die sich wiederholen und bei denen der Agent aus seiner eigenen Fehlergeschichte lernen kann, fuegt Reflexion kumulative Leistungsverbesserungen hinzu. Fuegen Sie Critic-Actor hinzu, wenn Aktionen irreversibel sind; fuegen Sie Supervisor-Worker hinzu, wenn verschiedene Aufgabenschritte genuinlich unterschiedliche Tool-Sets erfordern.
