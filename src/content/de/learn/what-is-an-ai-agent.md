---
title: "Was ist ein KI-Agent? Definition und Funktionsweise"
description: >-
  Was ist ein KI-Agent? Eine klare Definition: ein autonomes System, das mit
  Tools wahrnimmt, plant und auf ein Ziel hin handelt, plus wie sich Agenten von
  Chatbots unterscheiden.
slug: /learn/what-is-an-ai-agent
primary_keyword: was ist ein ki-agent
secondary_keywords:
  - ai agent definition
  - what are ai agents
  - how do ai agents work
  - autonomous ai agent
  - ai agent vs chatbot
  - types of ai agents
  - ai agent examples
date_published: 2026-05
last_updated: 2026-05
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /comparison
---

# Was ist ein KI-Agent? Definition und Funktionsweise

Bitten Sie die meisten Menschen, einen KI-Agenten zu definieren, und sie beschreiben einen Chatbot. Genau diese Unterscheidung ist der Kern der Sache. Ein KI-Agent ist ein autonomes System, das seine Umgebung wahrnimmt, entscheidet, was zu tun ist, und auf ein Ziel hin handelt, ohne dass ein Mensch jeden Schritt lenkt. Ein Chatbot wartet auf Ihre nächste Nachricht. Ein Agent erfasst die Situation, macht einen Plan, nutzt Tools und arbeitet weiter, bis die Aufgabe erledigt ist.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist ein KI-Agent?**
> Ein KI-Agent ist ein autonomes System, das ein großes Sprachmodell nutzt, um Eingaben wahrzunehmen, über ein Ziel zu schließen, Tools auszuwählen und aufzurufen und in einer sich wiederholenden Schleife auf seine Umgebung einzuwirken: Es agiert mit einem gewissen Grad an Eigenständigkeit, statt auf einen einzelnen Prompt zu antworten.

## Auf einen Blick

- Ein KI-Agent nimmt wahr, plant, handelt und beobachtet in einer Schleife, bis ein Ziel erreicht ist. Er leistet Arbeit, nicht nur Konversation.
- Das Reasoning kommt von einem großen Sprachmodell. Die Fähigkeit kommt von den Tools, die der Agent aufrufen kann: Browser, Code, Dateien, APIs.
- Ein Chatbot antwortet und hört auf. Ein Agent verfolgt ein Ziel über viele Schritte und Entscheidungen hinweg.
- Agenten reichen von einfachen Reflex-Agenten bis zu zielbasierten und lernenden Agenten. Produktionssysteme sind meist zielbasiert und mit Gedächtnis.
- Das Modell liefert Intelligenz, nicht Sicherheit. Isolation, Credential-Schutz und Budgetgrenzen sind das, was Autonomie überlebensfähig macht.

## Der Unterschied zwischen Reden und Handeln

Hier verläuft die Grenze, die einen Agenten von allem anderen trennt, das dieses Etikett trägt.

Ein großes Sprachmodell sagt Text voraus. Stellen Sie eine Frage, bekommen Sie eine Antwort. Mächtig, aber träge: Es tut nichts, bis Sie es erneut anstoßen, und es kann nichts außerhalb der Konversation berühren.

Ein KI-Agent nimmt genau dasselbe Modell und verbindet es mit zwei Dingen, die es vorher nicht hatte: Tools und einem Ziel. Jetzt kann es einen Browser öffnen, Code ausführen, eine E-Mail senden oder eine Datenbank abfragen. Und statt einmal zu antworten, macht es weiter und gleicht die eigene Arbeit mit dem Ziel ab, bis das Ziel erreicht ist.

Diese Verschiebung, vom Antworten zum Verfolgen, ist leicht zu beschreiben und gewaltig in der Praxis. Es ist der Unterschied zwischen einem Assistenten, der Vorschläge macht, und einem Arbeiter, der liefert.

## Wie KI-Agenten funktionieren: Die Schleife

Jeder funktionierende Agent durchläuft denselben Vier-Takt-Zyklus, immer wieder:

1. **Wahrnehmen.** Den aktuellen Zustand erfassen: die Anfrage, vorheriges Gedächtnis, die Ausgabe des letzten Tools, jedes neue Ereignis.
2. **Planen.** Das Sprachmodell überlegt den besten nächsten Zug angesichts des Ziels und der verfügbaren Tools.
3. **Handeln.** Der Agent ruft ein Tool auf. Er öffnet eine URL, führt ein Skript aus, schreibt eine Datei, signiert eine Transaktion.
4. **Beobachten.** Er liest, was passiert ist, und führt das in die nächste Wahrnehmung zurück.

Drehen Sie diese Schleife ein paar hundert Mal, und aus einer vagen Anweisung („finde unsere drei größten Wettbewerber und fasse ihre Preise zusammen") wird ein fertiges Ergebnis. Das Gedächtnis hält die Schleife über Schritte und Sessions hinweg kohärent; ohne es vergisst der Agent, was er gerade getan hat. Die Schleife endet, wenn das Ziel erfüllt ist, eine Schrittobergrenze erreicht wird oder eine Budgetabschaltung greift.

## Arten von KI-Agenten

Die Lehrbuch-Taxonomie passt noch immer sauber auf die heutigen Systeme, vom einfachsten bis zum leistungsfähigsten:

- **Einfache Reflex-Agenten** reagieren auf die aktuelle Eingabe mit festen Regeln. Schnell und blind für die Vorgeschichte.
- **Modellbasierte Agenten** halten ein internes Bild der Welt, um mit unvollständiger Information umzugehen.
- **Zielbasierte Agenten** wählen Aktionen, die auf ein explizites Ziel hinführen. Das ist die Form der meisten Produktionsagenten.
- **Nutzenbasierte Agenten** wägen Kompromisse ab, um den besten von mehreren gültigen Wegen zu wählen.
- **Lernende Agenten** schärfen ihr Verhalten über die Zeit anhand von Feedback.

Die meisten ausgespielten LLM-Agenten sind zielbasiert, tragen Gedächtnis, halten ein Tool-Set und arbeiten zunehmend in koordinierten Gruppen, in denen jeder Agent eine Rolle besitzt.

## KI-Agent vs. Chatbot vs. LLM

Drei Begriffe, die austauschbar verwendet werden, es aber nicht sein sollten.

| | Großes Sprachmodell | Chatbot | KI-Agent |
|---|---|---|---|
| Kernaufgabe | Text vorhersagen | Eine Konversation führen | Ein Ziel verfolgen |
| Wirkt auf die Welt | Nein | Selten | Ja, über Tools |
| Läuft über mehrere Schritte | Nein | Ein Zug nach dem anderen | Viele, in einer Schleife |
| Hält Zustand auf ein Ziel hin | Nein | Session-Kontext | Ja, mit Gedächtnis |
| Beispiel | GPT, Claude, Gemini | Ein Support-Widget | Ein Recherche- oder Coding-Agent |

Das Modell ist das Gehirn. Der Chatbot ist eine konversationelle Schnittstelle zu diesem Gehirn. Der Agent ist das Gehirn, dem Hände und ein Grund gegeben wurden, sie zu benutzen.

## Der Teil, den niemand vorführt: Einen sicher betreiben

Das fünfzeilige „Baue einen Agenten"-Tutorial hört immer beim spaßigen Teil auf. Es zeigt Ihnen nie den nächsten Morgen, wenn der Agent, der über Nacht im Web surfte, auch Ihre API-Keys hielt, Shell-Befehle ausführte und bei jeder Schleife Geld ausgeben konnte.

Genau dort lebt das eigentliche Engineering. Ein autonomes System mit Tools und Credentials ist eine Sicherheitsgrenze, und das Reasoning-Modell gibt Ihnen keine der nötigen Kontrollen: Isolation, damit ein fehlverhaltender Agent die anderen nicht erreicht, einen Vault, damit er nie rohe Keys hält, Pro-Agent-Budgets, damit eine Schleife keine unbegrenzte Rechnung auflaufen lässt, und Berechtigungen, damit jeder Agent nur das berührt, was Sie erlauben.

Eine produktionsreife [KI-Agenten-Plattform](/learn/ai-agent-platform) liefert diese operative Schicht. Für das Bedrohungsmodell dahinter siehe [KI-Agenten-Sicherheit](/learn/ai-agent-security); dafür, wie mehrere Agenten als Team arbeiten, siehe [KI-Agenten-Orchestrierung](/learn/ai-agent-orchestration).

## OpenLegions Sicht

Bis 2026 ist die abstrakte Frage „was ist ein KI-Agent" weitgehend geklärt. Die Frage, die tatsächlich über Ergebnisse entscheidet, ist schärfer: Was braucht es, um einen unbeaufsichtigt laufen zu lassen? In dem Moment, in dem ein Agent surfen, Code schreiben und Geld bewegen kann, hören Ihre schwierigen Probleme auf, Prompt Engineering zu sein, und werden zu Systems Engineering: Blast Radius, geleakte Credentials, außer Kontrolle geratene Kosten, Auditierbarkeit. Die Teams, die Agenten ausliefern, die den Kontakt mit der Produktion überleben, sind diejenigen, die den Agenten als zu governende Workload behandeln, nicht als cleveres Skript zum Bewundern. Diese Lücke, zwischen einer Demo und einem Deployment, ist das ganze Spiel.

## CTA

**Bereit, echte Agenten zu betreiben, nicht nur Demos?**
[Loslegen](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai) | [Frameworks vergleichen](/comparison)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist ein KI-Agent einfach erklärt?

Ein KI-Agent ist Software, die ein Ziel eigenständig verfolgt. Sie geben ihm ein Ziel, und er erarbeitet die Schritte, nutzt Tools wie einen Webbrowser oder Code-Ausführung, um sie umzusetzen, prüft die Ergebnisse und macht weiter, bis die Aufgabe erledigt ist. Ein großes Sprachmodell liefert die Entscheidungsfindung, und genau das erlaubt dem Agenten, ergebnisoffene Arbeit zu bewältigen, statt einem festen Skript zu folgen.

### Wie unterscheidet sich ein KI-Agent von einem Chatbot?

Ein Chatbot beantwortet eine Nachricht nach der anderen und wartet dann auf Sie. Ein KI-Agent durchläuft eine kontinuierliche Schleife auf ein Ziel hin: Er plant, wirkt über Tools auf die Welt, beobachtet, was passiert ist, und entscheidet den nächsten Schritt, ohne für jeden einzelnen angestoßen zu werden. Einfach gesagt: Ein Chatbot redet, ein Agent leistet Arbeit.

### Wie funktionieren KI-Agenten tatsächlich?

Sie durchlaufen eine Wahrnehmen-Planen-Handeln-Beobachten-Schleife. Der Agent erfasst den aktuellen Zustand, das Sprachmodell überlegt die nächste Aktion, der Agent ruft ein Tool auf, um sie auszuführen, und liest das Ergebnis, bevor er erneut die Schleife durchläuft. Das Gedächtnis trägt Kontext über Schritte hinweg, und die Schleife läuft weiter, bis das Ziel erreicht ist oder ein Schritt- oder Budgetlimit sie stoppt.

### Was sind die wichtigsten Arten von KI-Agenten?

Die klassischen Kategorien sind einfache Reflex-Agenten, modellbasierte Agenten, zielbasierte Agenten, nutzenbasierte Agenten und lernende Agenten. Die meisten produktiven LLM-Systeme sind zielbasierte Agenten mit Gedächtnis und einem Tool-Set, oft ausgespielt als koordinierte Gruppe, in der jeder Agent eine bestimmte Rolle besitzt.

### Was sind Beispiele für KI-Agenten?

Ein Recherche-Agent, der Quellen durchsucht und ein Briefing schreibt. Ein Coding-Agent, der eine Änderung plant und einen Pull Request öffnet. Ein Sales-Agent, der Leads qualifiziert und kontaktiert. Ein Treasury-Agent, der On-Chain-Transaktionen unter Ausgabenlimits ausführt. Jeder läuft eigenständig auf sein Ziel zu, statt auf Schritt-für-Schritt-Anweisungen zu warten.

### Sind KI-Agenten sicher autonom zu betreiben?

Das können sie, aber nur mit den richtigen Kontrollen. Ein autonomer Agent, der im Web surft, Code ausführt und Credentials hält, bringt echtes Risiko mit: geleakte Keys, Prompt Injection, außer Kontrolle geratene Kosten, Datenexfiltration. Agenten in isolierten Containern zu betreiben, Credentials in einem Vault zu halten, auf den der Agent nie zugreift, Pro-Agent-Budgets durchzusetzen und Berechtigungen zu begrenzen, ist das, was unbeaufsichtigten Betrieb in Produktion sicher macht.
