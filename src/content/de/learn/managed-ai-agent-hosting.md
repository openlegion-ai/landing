---
title: "Verwaltetes KI-Agenten-Hosting: Sichere Agenten-Flotten bereitstellen"
description: >-
  Verwaltetes KI-Agenten-Hosting von OpenLegion: sichere Agenten-Teams in einer
  gehosteten Web-App mit Vault-Credentials und Pro-Agent-Budgets, ganz ohne
  dedizierten VPS oder eigene Infrastruktur.
slug: /learn/managed-ai-agent-hosting
primary_keyword: verwaltetes ki-agenten-hosting
secondary_keywords:
  - host ai agents
  - managed ai agent platform
  - hosted ai agents
  - ai agent hosting service
  - dedicated vps for ai agents
  - ai agent infrastructure
  - cloud ai agent hosting
  - secure ai agent hosting
date_published: 2026-05
last_updated: 2026-05
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /comparison
---

# Verwaltetes KI-Agenten-Hosting für sichere Agenten-Flotten

Sie wollten eine KI-Belegschaft. Was Sie bekamen, war ein zweiter Job in DevOps. Verwaltetes KI-Agenten-Hosting gibt diesen Job zurück. Es betreibt die Server, die Isolation, den Credential-Vault und die Budgets, die Ihre Agenten brauchen, sodass Sie nichts davon selbst provisionieren. OpenLegion ist eine gehostete Web-App: mit Google anmelden und loslegen, ohne Installation und ohne dedizierten VPS, mit Ihren Keys in einem Vault, den die Agenten nie berühren, und einem Budget für jeden Agenten standardmäßig. Sie bringen ein Ziel; wir betreiben den Unterbau.

<!-- SCHEMA: DefinitionBlock -->

> **Was ist verwaltetes KI-Agenten-Hosting?**
> Verwaltetes KI-Agenten-Hosting ist ein Dienst, der die Infrastruktur, auf der autonome KI-Agenten laufen, provisioniert, isoliert, absichert und betreibt: Container, Credential-Speicherung, Budgets, Networking und ein Control-Dashboard, sodass ein Team Agenten-Flotten ausspielen kann, ohne diese Infrastruktur selbst zu bauen oder zu warten.

## Auf einen Blick

- Verwaltetes KI-Agenten-Hosting entfernt die Arbeit zwischen Ihnen und einer laufenden Flotte: kein Server-Setup, kein Docker-Tuning, kein Vault zu betreiben.
- Agenten sind dauerhafte Datensätze, keine Server: Einen anzulegen geht sofort, ein untätiger Agent kostet nichts, und ein Workspace kann Hunderte betreiben.
- Credentials liegen in einem Vault und werden außerhalb des Modells injiziert, das immer nur ein Handle hält, sodass ein kompromittierter Agent sie nicht lesen kann.
- Jeder Agent trägt sein eigenes Budget, und jede Arbeitseinheit ist ein festgehaltener Lauf, abgerechnet in Credits zu je $0,001.
- Die Engine ist source-available unter der PolyForm Perimeter License 1.0.1 veröffentlicht; die gehostete Plattform ist proprietär.
- Kostenlos sind 0 $ mit 1.000 einmaligen Credits ohne Kreditkarte; Pro kostet 29 $/Monat mit 10.000 Credits; Team 99 $/Monat mit 35.000.

## Die versteckten Kosten von „Betreib einfach einen Agenten"

Einen Agenten aufzusetzen ist ein Wochenende. Eine Flotte zu betreiben, der Sie vertrauen können, ist ein Quartal.

Irgendwo zwischen Prototyp und Produktion ändert die Arbeit still ihre Gestalt. Sie hören auf, Prompts zu tunen, und fangen an, Container zu tunen. Sie hören auf, darüber nachzudenken, was der Agent sagen soll, und fangen an, darüber nachzudenken, wo seine API-Keys liegen, was passiert, wenn einer um 3 Uhr morgens in einer Schleife hängt, und wie Sie einen kompromittierten Agenten davon abhalten, die anderen neun zu erreichen. Nichts davon ist die Arbeit, die Sie sich vorgenommen hatten. All das ist die Arbeit, die darüber entscheidet, ob die Agenten sicher laufen gelassen werden können.

Verwaltetes Hosting existiert, um genau diese Schicht zu absorbieren. Mit OpenLegions gehostetem Angebot bekommen Sie:

- **Eine gehostete Web-App** ohne Installation und ohne dedizierten VPS — mit Google anmelden und loslegen.
- **Einen Sandbox-Lauf für jede Aufgabe** — jede Aufgabe läuft bei Bedarf und endet dann, und Code, den der Agent schreibt, hat standardmäßig keinen Netzwerkzugriff.
- **Einen Credential-Vault**, der API-Keys und OAuth-Tokens vollständig außerhalb des Modells hält, das immer nur ein Handle hält.
- **Budgetdurchsetzung pro Agent** mit Hartabschaltungen, sodass ein in einer Schleife hängender Agent keine Überraschungsrechnung erzeugen kann.
- **Ein Control-Dashboard**, um Templates auszuspielen, mit Agenten zu chatten, Kosten und Zustand live zu beobachten und alles zu pausieren, was sich fehlverhält.
- **Enthaltene Credits** in jedem Plan, monatlich erneuert, mit Modellen per Preset — Smartest, Smart oder Normal.

## Verwaltetes Hosting vs. Self-Hosting: Wie man wählt

OpenLegions Plattform gibt es nur gehostet, und die Engine darunter ist source-available veröffentlicht. Der Vergleich unten zeigt den allgemeinen Kompromiss zwischen selbst betriebener Agenten-Infrastruktur und betreiben lassen.

| Erwägung | Selbst gehostet (PolyForm Perimeter License 1.0.1) | Verwaltetes Hosting |
|---|---|---|
| Wer betreibt die Server | Sie | OpenLegion |
| Setup-Zeit | Drei Befehle auf Ihrer Maschine | Mit Google anmelden, nichts zu installieren |
| Credential-Vault | Sie betreiben ihn | Für Sie betrieben, außerhalb des Modells |
| Updates und Patching | Sie pullen und deployen neu | Für Sie eingespielt |
| Datenresidenz | Vollständig auf Ihrer Infrastruktur | Auf der gehosteten Plattform, die wir betreiben |
| Am besten für | Reguliert, air-gapped, volle Kontrolle | Teams, die heute ein laufendes Team wollen |
| Kostenmodell | Ihre eigenen Serverkosten | Kostenlos 0 $, Pro 29 $/Monat, Team 99 $/Monat |

Wählen Sie Self-Hosting, wenn Compliance, Datenresidenz oder die vollständige Kontrolle über den Host die Kosten des Betriebs überwiegen. Wählen Sie verwaltetes Hosting, wenn Sie Agenten noch heute Nachmittag bei der Arbeit haben wollen und lieber keinen Vault, keine Runtime und keine Update-Kadenz besitzen möchten. OpenLegion bietet zum Start nur die gehostete Plattform, es gibt also keine selbst gehostete Plattform, zu der man wechseln könnte.

## Was passiert, wenn Sie auf Deploy klicken

Melden Sie sich mit Google an, und Ihr Workspace ist bereit — es gibt nichts zu provisionieren. Ein Assistent wird mit ihm erstellt, und er erstellt die Teammitglieder, die es braucht. Von dort beschreiben Sie das Team, das Sie wollen (ein Recherche-Desk, eine Sales-Pipeline, ein Content-Studio), und die Plattform legt jede Rolle als dauerhaften Datensatz mit eigenem Gedächtnis, eigenem Budget und eigenen Tool-Berechtigungen an.

Die Agenten koordinieren sich über die [Orchestrierungsebene](/learn/ai-agent-orchestration): Arbeit wird als Ziele zu Aufgaben zu Agenten organisiert, mit Event-Wakes und Delegation zwischen Teammitgliedern. Jede Aktion ist eine Absicht, die eine einzige Policy-Engine prüft, bevor sie geschieht, was das Verhalten auditierbar und die Kosten vorhersehbar hält. Sie sprechen mit Agenten in jedem Plan im Web-Chat, ab Pro über Telegram und Webhooks, ab Team über Slack und eingehende E-Mail.

## Sicherheit, die Sie nicht selbst bauen müssen

Der schwierigste Teil, Agenten sicher zu hosten, ist der Teil, den Teams am häufigsten überspringen, weil er unsichtbar ist, bis er versagt. OpenLegions verwaltete Ebene erzwingt dieselbe Defense-in-Depth, die im Modell der [KI-Agenten-Sicherheit](/learn/ai-agent-security) beschrieben ist, standardmäßig aktiviert:

- Ein Sandbox-Lauf für jede Aufgabe, ohne langlebigen Agentenprozess, der kompromittiert werden könnte.
- Ein Credential-Vault, der Credentials außerhalb des Modells injiziert, sodass Agenten nie rohe Keys halten.
- Eine Berechtigungsmatrix pro Agent, die regelt, welche Tools, Dateien und Operationen jeder Agent nutzen darf.
- Input-Sanitisierung, SSRF-Schutz und Prompt-Injection-Härtung an jeder Grenze.
- Budget-Obergrenzen pro Agent, die fail-closed sind.

Sie erben diese durch die Anmeldung, nicht durch das Lesen eines Härtungsleitfadens und dessen eigene Umsetzung. Für die Laufzeit darunter siehe die Übersicht zur [KI-Agenten-Plattform](/learn/ai-agent-platform).

## Preise und wofür Sie zahlen

Kostenlos sind 0 $ mit 1.000 einmaligen Credits ohne Kreditkarte; Pro kostet 29 $/Monat mit 10.000 Credits; Team 99 $/Monat mit 35.000; Enterprise startet bei 1.500 $. Arbeit wird in Credits zu je $0,001 abgerechnet, und die exakten Kosten jeder Aufgabe sind sichtbar. Enthaltene Credits erneuern sich monatlich; gekaufte Credit-Pakete verfallen nie. Die Abrechnung läuft über Stripe. Vergleichen Sie die Plan-Limits auf der [Preisseite](/pricing).

## OpenLegions Sicht

Das meiste „KI-Agenten-Hosting" auf dem Markt ist ein geteilter Prozess, der die Agenten aller betreibt, mit Keys in der Konfiguration und ohne echte Budgetdurchsetzung. Das ist für eine Demo in Ordnung und in Produktion gefährlich, denn die Fehlerszenarien, die Sie wirklich etwas kosten (ein geleaktes Credential, eine außer Kontrolle geratene Kostenschleife, ein kompromittierter Agent, der einen anderen Mandanten erreicht), sind genau jene, die geteilte Infrastruktur verschlimmert. Verwaltetes Hosting ist nur dann das Geld wert, wenn es Ihnen Isolation und Credential-Sicherheit erkauft, die Sie sonst von Hand bauen müssten. Unser Standpunkt ist, dass diese Garantien der Standard sein sollten statt eine Stufe, in die man upgraden muss, sodass jeder Plan dieselbe Isolation, denselben Vault und dieselbe Policy-Engine vor jeder Aktion erhält.

## CTA

**Stellen Sie ein sicheres Agenten-Team bereit, ohne die Infrastruktur zu betreiben.**
[Loslegen](https://app.openlegion.ai) | [Preise ansehen](/pricing) | [Dokumentation lesen](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist verwaltetes KI-Agenten-Hosting?

Verwaltetes KI-Agenten-Hosting ist ein Dienst, der die Infrastruktur provisioniert und betreibt, die autonome KI-Agenten brauchen: isolierte Container, einen Credential-Vault, Budgetdurchsetzung, Networking und ein Control-Dashboard, sodass ein Team Agenten-Flotten ausspielen und betreiben kann, ohne diese Infrastruktur zu bauen oder zu warten. Bei OpenLegion melden Sie sich mit Google an und legen los — es gibt nichts zu installieren und keinen dedizierten VPS zu mieten.

### Wie unterscheidet sich verwaltetes Hosting vom Self-Hosting von OpenLegion?

OpenLegion ist eine gehostete Web-App, und es gibt zum Start keine selbst gehostete Plattform. Self-Hosting bedeutet allgemein, dass Sie die Server betreiben, den Vault betreiben und Updates selbst einspielen, was zu regulierten oder air-gapped Umgebungen passt. Verwaltetes Hosting bedeutet, dass OpenLegion die Plattform betreibt, den Vault betreibt und sie für Sie patcht. Die Engine darunter ist source-available unter der PolyForm Perimeter License 1.0.1 veröffentlicht; die gehostete Plattform ist proprietär.

### Ist es sicher, KI-Agenten zu hosten, die meine API- und Wallet-Keys halten?

Ja, wenn die Keys nie im Agenten selbst liegen. Bei OpenLegion werden API-Keys und OAuth-Tokens in einem Vault gehalten und außerhalb des Modells injiziert, das immer nur ein Handle hält, sodass selbst ein vollständig kompromittierter Agent das Secret nicht lesen oder exfiltrieren kann. OpenLegion hält weder Wallet-Keys noch Agenten-Gelder.

### Was kostet verwaltetes KI-Agenten-Hosting?

Kostenlos sind 0 $ mit 1.000 einmaligen Credits ohne Kreditkarte; Pro kostet 29 $/Monat mit 10.000 Credits; Team 99 $/Monat mit 35.000; Enterprise startet bei 1.500 $. Die Gebühr deckt die gehostete Plattform, den Credential-Vault, das Dashboard und die enthaltenen Credits des Plans ab — es gibt keinen dedizierten VPS zu bezahlen. Arbeit wird in Credits zu je $0,001 abgerechnet, enthaltene Credits erneuern sich monatlich, gekaufte Credit-Pakete verfallen nie.

### Muss ich Docker oder DevOps kennen, um verwaltetes Hosting zu nutzen?

Nein. OpenLegion ist eine gehostete Web-App: mit Google anmelden und loslegen — es gibt nichts zu installieren. Sie arbeiten über ein Dashboard: Sie beschreiben das gewünschte Team, und der Assistent erstellt die nötigen Teammitglieder. Docker, Python und Server-Administration gehören überhaupt nicht dazu.

### Kann ich später von verwaltetem Hosting zu Self-Hosting wechseln?

Zum Start nicht. Die gehostete Plattform ist heute der einzige Weg, OpenLegion zu betreiben, und sie ist proprietär; die Engine darunter ist source-available unter der PolyForm Perimeter License 1.0.1 veröffentlicht. Es gibt noch keine selbst gehostete Distribution, zu der man migrieren könnte, planen Sie also vorerst mit der gehosteten Plattform.

### Wie viele Agenten kann ich in einem verwalteten Plan hosten?

Agenten-Limits skalieren mit der Plan-Stufe, von einem kleinen Team im Einstiegsplan bis zu großen Teams in höheren Stufen, mit individuellen Limits für Enterprise. Agenten sind dauerhafte Datensätze statt Server, einen anzulegen geht also sofort und ein untätiger Agent kostet nichts — jeder Agent zählt als einer zum Limit, sodass ein Drei-Rollen-Team wie ein Dev-Team als drei Agenten zählt.
