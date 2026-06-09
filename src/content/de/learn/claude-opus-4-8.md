---
title: Claude Opus 4.8 - Fähigkeiten, Kosten und agentische Leistung
description: "Claude Opus 4.8 erschien am 28. Mai 2026: 84% auf Online-Mind2Web, Fast-Modus 3x günstiger, dynamische Workflows in Claude Code, erstes Opus, das jeden Super-Agent-Benchmark-Fall auf GPT-5.5-Kostenniveau abschließt."
slug: /learn/claude-opus-4-8
primary_keyword: claude opus 4.8
secondary_keywords:
  - claude opus 4.8 api
  - claude opus 4.8 benchmarks
  - claude opus 4.8 vs gpt-5.5
  - claude opus 4.8 fast mode
  - claude opus 4.7 vs opus 4.8
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /learn/ai-agent-orchestration
  - /comparison/langgraph
  - /comparison/autogen
---

# Claude Opus 4.8: Agentische Leistung, Fast-Modus-Preise und Was sich gegenüber Opus 4.7 geändert hat

Claude Opus 4.8 ist Anthropics Upgrade der Opus-Klasse vom 28. Mai 2026. Es erzielt 84% auf Online-Mind2Web-Browser-Agent-Genauigkeit, ist das erste Modell, das jeden Fall eines Super-Agent-Benchmarks auf GPT-5.5-Kostenniveau abschließt, und behebt die Tool-Aufruf-Verbosity-Regression von Opus 4.7. Der Fast-Modus läuft mit 2,5-facher Geschwindigkeit und ist 3x günstiger als der Fast-Modus für frühere Opus-Modelle. Die Standard-API-Preise sind gegenüber 4.7 unverändert. Die API-Modellkennung lautet `claude-opus-4-8-20260528`.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist Claude Opus 4.8?**
> Claude Opus 4.8 ist Anthropics Upgrade der Opus-Modellklasse vom Mai 2026, ein Frontier-Tier-Sprachmodell, das für langläufige agentische Aufgaben, mehrstufiges Schlussfolgern und autonome Werkzeugnutzung optimiert ist. Es bietet verbesserte Benchmark-Leistung gegenüber Opus 4.7, Korrekturen von Tool-Aufruf-Zuverlässigkeits-Regressionen und einen Fast-Modus (erweitertes Denken mit 2,5-facher Geschwindigkeit), der 3x günstiger ist als der Fast-Modus für frühere Opus-Modelle.

## OpenLegions Einschätzung: Das Modell, das die agentische Wirtschaftlichkeit verändert

Opus 4.8 ist das Modell, das wir ab Mai 2026 für jeden Agenten mit substanzieller agentischer Arbeit empfehlen. Drei Dinge haben sich gegenüber Opus 4.7 geändert, die für Produktion-Agent-Flotten relevant sind.

Erstens: die Korrektur der Tool-Aufruf-Zuverlässigkeit. Scott Wu (Cognition / Devin CEO) bestätigte öffentlich, dass Opus 4.7 Kommentar-Verbosity- und Tool-Aufruf-Inkonsistenzen einführte, die die autonome Engineering-Zuverlässigkeit von Devin verschlechterten. Opus 4.8 behebt beides. Für Agenten in engen Tool-Nutzungs-Schleifen ist das der Unterschied zwischen einem Modell, das häufige Korrekturen erfordert, und einem, das Aufgaben sauber abschließt.

Zweitens: 84% auf Online-Mind2Web (besser als GPT-5.5) und der erste vollständige Super-Agent-Benchmark-Durchlauf auf GPT-5.5-Kostenniveau. Online-Mind2Web misst die echte browserbasierte Aufgabenerfüllung. Der Super-Agent-Benchmark umfasste Übersetzung, tiefgehende Recherche, Folienerstellung und End-to-End-Analyse. Opus 4.8 schloss jeden Fall ab; GPT-5.5 nicht.

Drittens: Fast-Modus mit 3x niedrigeren Kosten. Databricks berichtete von 61% günstigeren Token-Kosten gegenüber Opus 4.7 bei ihrem Genie-Agenten. Bei langläufigen Aufgaben, bei denen man bisher Sonnet aus Kostengründen wählte und geringere Qualität akzeptierte, ändert der Fast-Modus von Opus 4.8 die Rechnung.

Die Anthropic-Ankündigung kam am selben Tag wie ihre Series-H-Runde über 65 Mrd. USD bei einer Post-Money-Bewertung von 965 Mrd. USD.

OpenLegion unterstützt das vollständige Anthropic-API-Modellregister. Das Setzen von `claude-opus-4-8-20260528` als Standard für eine Flotte ist eine einzelne Konfigurationsänderung. Tresor-isolierte API-Aufrufe, Pro-Agent-Budgetlimits und Container-isolierte Ausführung werden automatisch angewendet, [was eine KI-Agent-Plattform für den Betrieb von Opus 4.8 mit Budgetkontrollen und Tresor-Isolation bietet](/learn/ai-agent-platform).

## Benchmark-Leistung: Was die Zahlen zeigen

### Online-Mind2Web: 84% Browser-Agent-Genauigkeit

Online-Mind2Web ist ein Benchmark für browserbasierte agentische Aufgabenerfüllung: Formulare ausfüllen, mehrseitige Abläufe navigieren, Informationen aus Live-Web-Oberflächen extrahieren. Claude Opus 4.8 erzielte 84% auf Online-Mind2Web zum Stand Mai 2026 und übertraf sowohl Claude Opus 4.7 als auch GPT-5.5. Das ist der höchste veröffentlichte Score auf diesem Benchmark zum Startdatum von Opus 4.8. Für Entwickler, die Browser-Automatisierungs-Agenten einsetzen, ist das die maßgebliche Zahl.

### Super-Agent-Benchmark: Erster vollständiger Durchlauf auf GPT-5.5-Kostenniveau

Kay Zhu, Mitgründer und CTO, berichtete, dass Claude Opus 4.8 das erste Modell ist, das jeden Fall ihres internen Super-Agent-Benchmarks vollständig abschließt: Übersetzung im großen Maßstab, tiefgehende Recherche-Synthese, Folienerstellung aus Rohdaten und Mehrquellenanalyse. GPT-5.5 schloss nicht jeden Fall ab. Opus 4.8 erreichte dies auf GPT-5.5-Kostenniveau.

### CursorBench: Effizientere Tool-Aufrufe auf jedem Aufwandsniveau

Cursors interner Coding-Benchmark misst Code-Generierungsqualität und Tool-Nutzungseffizienz. Claude Opus 4.8 übertrifft frühere Opus-Modelle auf jedem Aufwandsniveau bei CursorBench: weniger verschwendete Tokens für ausführliche Kommentare bedeutet, dass mehr des Token-Budgets für tatsächliche Arbeit genutzt wird.

### Legal Agent Benchmark: Erstes Modell, das 10% All-Pass-Standard überwindet

Leya (eine Legal-KI-Plattform), berichtet von Niko Grupen (Head of Applied Research), bestätigte, dass Claude Opus 4.8 das erste Modell ist, das 10% beim All-Pass-Standard des Legal Agent Benchmarks überwindet. Der All-Pass-Standard verlangt, dass jeder Schritt in einem mehrstufigen Rechts-Workflow korrekt ist: ein einziger Fehler scheitert den gesamten Fall.

### Databricks Genie: 61% günstiger als Opus 4.7

Databricks berichtete, dass Claude Opus 4.8 im Vergleich zu Opus 4.7 61% günstigere Token-Kosten für ihren Genie-Agenten liefert, einem KI-Agenten für Datenanalyse und Wissensarbeit mit multimodaler Analyse über PDFs und Diagramme.

## Was sich gegenüber Opus 4.7 geändert hat

### Tool-Aufruf-Korrektur: Die Verbosity-Regression, die Devin und autonome Workloads beeinträchtigte

Claude Opus 4.7 führte eine Regression im Tool-Aufruf-Verhalten ein, die mehrere Produktionsteams unabhängig voneinander bemerkten: Agenten produzierten übermäßige Inline-Kommentare, wickelten Ausgaben in unnötige erklärende Prosa ein und machten gelegentlich doppelte oder redundante Tool-Aufrufe.

Scott Wu (Cognition / Devin CEO) bestätigte öffentlich, dass Opus 4.7 "Kommentar-Verbosity- und Tool-Aufruf-Probleme" hatte, die Opus 4.8 behebt. Teams, die von Opus 4.7 auf Opus 4.6 für Tool-Nutzungs-Zuverlässigkeit zurückgewechselt sind, sollten Opus 4.8 erneut evaluieren.

### Dynamische Workflows in Claude Code

Claude Code erhält mit Opus 4.8 dynamische Workflows: die Fähigkeit, großmaßstäbliche Probleme anzugehen, indem mehrstufige Workflow-Strukturen erstellt, sequenziert und verwaltet werden. Claude Code kann eine große Codebase-Migration planen, Unteraufgaben erstellen, diese nacheinander ausführen, den Zwischenstatus verfolgen und seinen Plan basierend auf Ergebnissen in jedem Schritt anpassen. In Claude Code mit Opus 4.8 ab dem 28. Mai 2026 verfügbar.

### Fast-Modus: 2,5-fache Geschwindigkeit bei 3x niedrigeren Kosten

Der Fast-Modus für Claude Opus 4.8 läuft mit 2,5-facher Geschwindigkeit gegenüber dem Standard-Opus mit erweitertem Denken und ist 3x günstiger als der Fast-Modus für frühere Opus-Modelle einschließlich Opus 4.7. Die Standard-Preise (ohne Fast-Modus) sind gegenüber Opus 4.7 unverändert.

Der Fast-Modus wird über den Parameter `budget_tokens` in der erweiterten Denk-Konfiguration der API aktiviert. Das Setzen von `budget_tokens` auf einen niedrigeren Wert aktiviert das Fast-Modus-Verhalten.

## API-Referenz und Preise

### Modellkennung

Die API-Modellkennung für Claude Opus 4.8 lautet `claude-opus-4-8-20260528`. Verwenden Sie diese Zeichenkette im Parameter `model` eines beliebigen Anthropic-API-Aufrufs, im Amazon-Bedrock-Modell-ID-Feld oder in der Google Cloud Vertex AI-Modellreferenz.

### Verfügbarkeit

Claude Opus 4.8 ist über drei Kanäle verfügbar: direkt über die Anthropic API (api.anthropic.com), Amazon Bedrock und Google Cloud Vertex AI. Alle drei Kanäle unterstützen denselben Funktionsumfang einschließlich erweitertem Denken und Fast-Modus.

### Kontextfenster

Claude Opus 4.8 verwendet dasselbe Kontextfenster wie Opus 4.7 (200K Tokens) und dieselben Standard-Eingangs-/Ausgangs-Token-Preise. Kosteneinsparungen konzentrieren sich auf den Fast-Modus.

## Wann Opus 4.8 vs. Sonnet 4 vs. Opus 4.7 verwenden

### Opus 4.8: Langläufige agentische Aufgaben, Browser-Automatisierung, umfangreiches Coding

Wählen Sie Opus 4.8, wenn die Aufgabenqualität der limitierende Faktor ist. Langläufige autonome Agenten in engen Tool-Nutzungs-Schleifen profitieren von der Tool-Aufruf-Zuverlässigkeitskorrektur. Browser-Automatisierungs-Agenten (Online-Mind2Web: 84%) übertreffen jedes andere Modell bei diesem Aufgabentyp. Rechtliche und finanzielle Analysen, die fehlerfreie Verkettung erfordern, sind der Anwendungsbereich von Opus 4.8.

Für [KI-Agent-Frameworks, die über die Anthropic API auf Claude Opus 4.8 zugreifen](/learn/ai-agent-frameworks), ist der Migrationspfad ein Modell-Kennungsaustausch zu `claude-opus-4-8-20260528`.

### Sonnet 4: Hochvolumen-, latenzempfindliche Pipelines

Wählen Sie Sonnet 4, wenn Volumen und Latenz die limitierenden Faktoren sind. Hochfrequente API-Aufrufe, bei denen die Pro-Token-Kosten die Stückwirtschaftlichkeit bestimmen, und Echtzeit-Antwort-Pipelines, bei denen Latenz für Endbenutzer sichtbar ist. Sonnet 4 und Opus 4.8 Fast-Modus belegen jetzt benachbarte Kosten-/Qualitätsniveaus: Teams sollten beide für ihre spezifischen Workloads benchmarken.

### Wann Opus 4.7 noch geeignet ist

Der einzige Fall für das Bleiben bei Opus 4.7: Prompts, die speziell auf seine Verbosity-Muster abgestimmt sind. Wenn Ihre Pipeline die Opus-Ausgabe nachverarbeitet und sich auf die Kommentarstruktur verlässt, die Opus 4.7 generierte, bleiben Sie bei 4.7, bis Sie Zeit haben, sich anzupassen. Testen Sie mit Opus 4.8, bevor Sie Produktionsprompts migrieren.

Für [agentisches Workflow-Design und wie die Urteilsverbesserungen von Opus 4.8 die Ausführungszuverlässigkeit verändern](/learn/ai-agent-orchestration) ist die Tool-Aufruf-Korrektur die wirkungsvollste Änderung für Workflows mit fünf oder mehr Tool-Aufrufen pro Aufgabe.

## OpenLegion und Claude Opus 4.8

OpenLegion unterstützt `claude-opus-4-8-20260528` als Fleet-Modelloption. Das Setzen als Standard für einen Agenten ist ein einzelnes Feld in der Agentenkonfiguration:

```
model: anthropic/claude-opus-4-8-20260528
```

Alle OpenLegion-Sicherheitskontrollen gelten automatisch für Opus 4.8-Aufrufe: Tresor-Proxy-Credential-Injektion (der API-Schlüssel betritt nie den Agent-Container), Pro-Agent-Tages- und Monatslimits (eine unkontrollierte Opus 4.8-Schleife kann Ihr API-Kontingent nicht ohne Erreichen des Limits erschöpfen), Docker-Container-Isolation und vollständiges Audit-Logging.

Für Mehrагenten-Vergleiche, siehe [OpenLegion vs. LangGraph bei der Bereitstellung von Opus 4.8 in graphbasierter vs. flacher Fleet-Architektur](/comparison/langgraph) und [OpenLegion vs. AutoGen bei Opus 4.8 in geteilten Prozess- vs. isolierten Container-Mehrагenten-Systemen](/comparison/autogen).

## Mit Claude Opus 4.8 auf OpenLegion beginnen

**Setzen Sie `claude-opus-4-8-20260528` als Ihren Fleet-Standard. Tresor-isoliert, budgetbegrenzt, produktionsbereit.**
[Jetzt starten](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai) | [Plattform ansehen](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist Claude Opus 4.8?

Claude Opus 4.8 ist Anthropics Upgrade der Opus-Modellklasse, angekündigt am 28. Mai 2026. Es baut auf Claude Opus 4.7 mit verbesserter agentischer Beurteilung, stärkerer Benchmark-Leistung bei Coding, Schlussfolgern und professioneller Wissensarbeit sowie Korrekturen von Tool-Aufruf-Verbosity-Problemen auf, die autonome Opus-4.7-Workloads beeinträchtigten. Es führt dynamische Workflows in Claude Code für großmaßstäbliche mehrstufige Probleme ein und bietet einen Fast-Modus mit 2,5-facher Geschwindigkeit, der jetzt 3x günstiger ist als der Fast-Modus für frühere Opus-Modelle.

### Wie schneidet Claude Opus 4.8 im Vergleich zu GPT-5.5 ab?

Bei Benchmarks, die für agentische Aufgaben relevant sind, übertrifft oder entspricht Claude Opus 4.8 GPT-5.5 in mehreren unabhängigen Bewertungen. Bei Online-Mind2Web erzielte Opus 4.8 84% und übertraf GPT-5.5. Bei einem internen Super-Agent-Benchmark war Opus 4.8 das erste Modell, das jeden Fall vollständig abschloss und GPT-5.5 auf Kostenniveau schlug. Beim Legal Agent Benchmark ist Opus 4.8 das erste Modell, das 10% beim All-Pass-Standard überwindet.

### Wie viel günstiger ist der Claude Opus 4.8 Fast-Modus im Vergleich zu Opus 4.7?

Der Fast-Modus für Claude Opus 4.8 läuft mit 2,5-facher Normalgeschwindigkeit mit erweitertem Denken und ist 3x günstiger als der Fast-Modus für frühere Opus-Modelle einschließlich Opus 4.7. Die Standard-Opus-4.8-Preise (ohne Fast-Modus) sind gegenüber Opus 4.7 unverändert. Databricks berichtete von 61% günstigeren Token-Kosten gegenüber Opus 4.7 für ihren Genie-Agenten.

### Was waren die Opus 4.7 Tool-Aufruf-Probleme, die Opus 4.8 behebt?

Claude Opus 4.7 führte Kommentar-Verbosity- und Tool-Aufruf-Inkonsistenzen ein, die die Zuverlässigkeit für autonome Engineering-Workloads reduzierten. Cognition (Hersteller des autonomen Coding-Agenten Devin) berichtete über CEO Scott Wu, dass Opus 4.7 weniger konsistent als Opus 4.6 war und dass Opus 4.8 sowohl die Kommentar-Verbosity-Regression als auch die Tool-Aufruf-Inkonsistenzen behebt. Teams, die Opus 4.7 in engen Tool-Nutzungs-Schleifen verwenden und lautere Ausgaben oder mehr Korrekturschritte als erwartet feststellten, sollten Opus 4.8 als Drop-in-Ersatz testen.

### Was ist die Claude Opus 4.8 API-Modellkennung?

Die API-Modellkennung für Claude Opus 4.8 ist `claude-opus-4-8-20260528`. Sie ist über die Anthropic API direkt, Amazon Bedrock und Google Cloud Vertex AI verfügbar. Der Fast-Modus (erweitertes Denken mit 2,5-facher Geschwindigkeit) wird über den Parameter `budget_tokens` in der Konfiguration für erweitertes Denken aktiviert. Die Standard-Preise sind identisch mit Opus 4.7; die Fast-Modus-Preise sind 3x niedriger als der Fast-Modus für frühere Opus-Modelle.

### Was sind dynamische Workflows in Claude Code mit Opus 4.8?

Dynamische Workflows ist eine Funktion in Claude Code, die zusammen mit Opus 4.8 eingeführt wurde und es ermöglicht, großmaßstäbliche Probleme anzugehen, indem mehrstufige Workflow-Strukturen dynamisch erstellt, sequenziert und verwaltet werden. Claude Code kann eine umfangreiche Refaktorierung oder Migration planen, Unteraufgaben erstellen, diese nacheinander ausführen, den Status verfolgen und sich basierend auf Zwischenergebnissen anpassen. Dies macht Claude Code für große Codebase-Migrationen, vollständige Feature-Builds über mehrere Dateien und Dienste hinweg und Änderungen über mehrere Repositories hinweg geeignet.
