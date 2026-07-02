---
title: "Agent as a Service: Preise, Mandantenisolierung und AaaS vs. Self-Hosted"
description: "Agent as a Service (AaaS): KI-Agenten auf verwalteter Infrastruktur mit verbrauchsbasierter Abrechnung. Behandelt AWS Bedrock Agents, OpenAI Operator, CVE-2024-5184 und TCO-Vergleich."
slug: /learn/agent-as-a-service
primary_keyword: agent as a service
last_updated: "2026-07-02"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-deployment
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-multi-tenancy
  - /learn/credential-management-ai-agents
  - /learn/llm-cost-optimization
---

# Agent as a Service: Preismodelle, Mandantenisolierung und das AaaS-Entscheidungsframework

Agent as a Service (AaaS) ist ein kommerzielles Liefermodell, bei dem KI-Agenten auf der verwalteten Infrastruktur eines Anbieters laufen und Orchestrierung, Tool-Ausführung, Speicher und Credential-Management übernehmen -- abgerechnet pro Token, pro Aktion oder pro Agent-Stunde, ohne dass Kunden eine eigene Laufzeitumgebung betreiben müssen. AaaS etablierte sich 2026 als Einkaufskategorie für Unternehmen: OpenAI Operator startete im Januar 2025, Google Agent Space erreichte GA und AWS Bedrock Agents skalierte auf Enterprise-Niveau, was das Suchvolumen von 90/Monat im Juni 2025 auf 260--390/Monat bis Q1 2026 steigerte, CPC 32,88 USD.

<!-- SCHEMA: DefinitionBlock -->

> **Agent as a Service (AaaS)** ist ein kommerzielles Liefermodell, bei dem KI-Agenten auf der verwalteten Infrastruktur eines Anbieters laufen, Orchestrierung, Tool-Ausführung, Speicher und Credential-Management übernehmen und dem Kunden auf Verbrauchsbasis (pro Eingabe-Token, pro ausgeführter Aktion oder pro Agent-Stunde) in Rechnung gestellt werden, ohne dass der Kunde eine eigene Agenten-Laufzeitumgebung einsetzen und betreiben muss.

## Was Agent as a Service bedeutet: Die drei Plattformversprechen

Jede AaaS-Plattform macht drei Versprechen. Zu verstehen, welche davon gut eingelöst werden und welche Marketing sind, hilft Käufern bei der Anbieterbeurteilung vor der Budgetbindung.

### Versprechen 1: Verwaltete Infrastruktur (kein Betrieb einer Laufzeitumgebung)

AaaS überträgt den gesamten Agenten-Laufzeit-Stack an den Anbieter: Orchestrierungsmodul, Tool-Ausführungsumgebung, Speicher-Backends, Observability-Pipeline, horizontale Skalierung und Uptime-SLA. Der Kunde definiert den Agenten -- System-Prompt, Tools und Speicherkonfiguration -- und ruft ihn auf. Der Anbieter führt ihn aus.

Dies ist derselbe Kompromiss wie bei jedem verwalteten Dienst: RDS vs. selbst verwaltetes Postgres, Lambda vs. selbst verwaltete Container. Man gibt Konfigurierbarkeit auf und zahlt möglicherweise einen Aufpreis, im Gegenzug entfällt die operative Last. Das Versprechen der verwalteten Infrastruktur wird von AWS Bedrock Agents, Google Agent Space und den meisten ausgereiften AaaS-Plattformen gut eingelöst.

Das Versprechen bricht, wenn der Kunde eine Laufzeitkonfiguration benötigt, die die Plattform nicht freischaltet: benutzerdefinierte Tool-Ausführungsumgebungen, nicht standardisierte Speicher-Backends, bestimmte Modellversionen oder eine Agenten-Loop-Logik, die vom festen Orchestrierungsmodell der Plattform abweicht.

Informationen zur Infrastrukturschicht, einschließlich Container-Orchestrierung, Kaltstart-Latenz und Uptime-SLAs, finden Sie unter [Infrastruktur und Hosting-Optionen für die KI-Agenten-Bereitstellung](/learn/ai-agent-deployment).

### Versprechen 2: Verbrauchsbasierte Abrechnung (Zahlung pro Token, Aktion oder Stunde)

AaaS-Preismodelle haben sich 2026 auf drei Strukturen konsolidiert:

**Orchestrierungsgebühr pro Token zusätzlich zu den Modellkosten.** Die Plattform berechnet die Orchestrierungsschicht separat vom zugrunde liegenden LLM. AWS Bedrock Agents: 0,000025 USD pro verarbeitetem Eingabe-Token durch die Orchestrierungsschicht, zusätzlich zur Standard-LLM-Modellrate. Bei Claude 3.5 Sonnet auf Bedrock (3,00 USD/M Eingabe-Token) beträgt die Orchestrierungsgebühr 0,025 USD/M Eingabe-Token -- weniger als 1 % Aufschlag. Bei günstigeren Modellen wie Amazon Titan Text (0,30 USD/M) entspricht die Orchestrierungsgebühr einem Aufschlag von 8,33 %.

**Gebühr pro Aktion für Tool-Integrationen.** AWS Bedrock Knowledge Base-Abfragen: 0,0004 USD/Abfrage. Bei 50 KB-Lookups pro Sitzung fallen 0,02 USD/Sitzung an. Bei 100.000 KB-Abfragen/Tag: 40 USD/Tag allein an Aktionsgebühren.

**Abonnement-Tiers pro Agent-Stunde.** Einige Plattformen bieten Tiers an, bei denen jeder aktive Agent auf enthaltene Stunden angerechnet wird. Dieses Modell bietet Kostenvorhersehbarkeit für stabile Agent-Flotten, kann aber bei unregelmäßigen Arbeitslasten ineffizient sein.

Verbrauchspreise richten die Anreize des Anbieters an der Nutzung des Kunden aus, erzeugen aber Kostenunvorhersehbarkeit bei lang laufenden Agenten. Eine unkontrollierte Agenten-Schleife erzeugt gleichzeitig Kosten auf der Orchestrierungs- und der Modellebene.

Strategien zur Kostensenkung finden Sie unter [LLM-Kostenoptimierung und Token-Budget-Strategien für Agenten-Flotten](/learn/llm-cost-optimization).

### Versprechen 3: Credential-Isolierung (Credentials nie im Agenten-Kontext)

Credential-Isolierung ist das AaaS-Sicherheitsprimitive, das eine verwaltete Plattform von "Agent-Code auf einer Cloud-VM mit API-Schlüsseln in Umgebungsvariablen" unterscheidet. Credentials werden serverseitig zum Ausführungszeitpunkt injiziert und erscheinen weder im Kontext-Fenster des Agenten noch in Protokolldateien.

CVE-2024-5184 (Palo Alto Unit 42, Juni 2024, CVSS 9,1 KRITISCH) zeigte, dass Prompt-Injection über Tool-Antworten dazu führen kann, dass ein Agent sein eigenes Kontext-Fenster exfiltriert. Wenn sich API-Schlüssel im Kontext-Fenster befinden, sind sie über diesen Vektor exfiltrierbar.

Die diagnostische Frage an jeden AaaS-Anbieter: **"Wenn das vollständige Kontext-Fenster meines Agenten durch Prompt-Injection extrahiert wird, welche Credentials sind gefährdet?"** Die korrekte Antwort lautet: keine.

- **AWS Bedrock Agents**: IAM-Rollenübernahme pro Aufruf; der Agent führt unter einem temporären IAM-Rollen-Token aus und hält nie einen rohen API-Schlüssel
- **OpenLegion**: `$CRED{}`-Handle-Auflösung in Zone 2; Agent-Code referenziert einen Credential nach Name; Zone 2 löst den Handle zum Ausführungszeitpunkt auf, ohne ihn an den Agenten zurückzugeben

Für das Vault-Proxy-Pattern und die `$CRED{}`-Handle-Architektur siehe [Credential-Management und mandantenspezifische API-Key-Bereiche für KI-Agenten](/learn/credential-management-ai-agents).

## Die AaaS-Anbieter-Landschaft 2026

### AWS Bedrock Agents: Enterprise-AaaS mit IAM-Isolierung

AWS Bedrock Agents ist die dominierende Enterprise-AaaS-Plattform nach Marktreichweite. Agenten werden über die Bedrock-Konsole oder API definiert, mit Aktionsgruppen (Lambda-Funktionen oder OpenAPI-Schemas) und Wissensdatenbanken.

**Preise (2026):**
- Orchestrierungsschicht: 0,000025 USD/Eingabe-Token
- Modellkosten: Standard-Bedrock-Tarife (Claude 3.5 Sonnet: 3,00 USD/M Eingabe, 15,00 USD/M Ausgabe)
- Knowledge Base-Abfragen: 0,0004 USD/Abfrage
- Code Interpreter: 0,000025 USD/Eingabe-Token

**Credential-Isolierung:** IAM-Rollenübernahme pro Aufruf. Jeder Bedrock Agent hat eine zugewiesene IAM-Ausführungsrolle. Der Agent hält nie rohe Credentials.

**Einschränkungen:** Enge Kopplung an AWS-Dienste. Benutzerdefinierte Agenten-Loop-Logik wird nicht unterstützt. Die Pro-Token-Orchestrierungsgebühr akkumuliert schnell bei kontextintensiven Agenten.

### OpenAI Operator: Consumer-AaaS für Browser-Aufgaben

OpenAI Operator startete im Januar 2025 als erstes Mainstream-Consumer-AaaS-Produkt. Es führt Web-Aufgaben in einer sandboxed Browser-Sitzung im Auftrag des Nutzers aus.

**Credential-Isolierung:** Sandboxed Browser-Sitzung pro Aufgabe. Credentials werden nicht über Aufgaben hinweg gespeichert.

**Einschränkungen:** Nur Browser-Bereich, keine benutzerdefinierten Tool-Integrationen über Web-Browsing hinaus. Kein Entwickler-API für benutzerdefinierte Agenten-Definitionen.

### Google Agent Space: AaaS für Workspace-zentrierte Unternehmen

Google Agent Space (2025 gestartet, 2026 allgemein verfügbar) ist Googles Enterprise-AaaS-Plattform für Organisationen, die auf Google Workspace standardisiert sind.

**Preise:** Über die Verbrauchsabrechnung von Google Cloud, verknüpft mit Vertex AI-Modellkosten plus Cloud Run-Aufrufgebühren.

**Einschränkungen:** Google Cloud-Ökosystem-Bindung. Weniger flexibel für Multi-Cloud-Integrationen. Preisundurchsichtigkeit über mehrere Abrechnungsdimensionen.

Für einen Feature-Level-Vergleich von AaaS-Plattformen siehe [KI-Agenten-Plattform-Features und Framework-Vergleich](/learn/ai-agent-platform).

## AaaS-Preise: Gesamtkosten verstehen

### Die Orchestrierungsschicht-Gebühr

Die meisten AaaS-Käufer konzentrieren sich auf die LLM-Modellkosten und behandeln die Orchestrierungsschicht-Gebühr als vernachlässigbar. Bei hochpreisigen Modellen stimmt das ungefähr. Bei günstigeren Modellen nicht.

| **Modell** | **Eingabepreis** | **Orchestrierungsgebühr** | **Orchestrierung % der Modellkosten** |
|---|---|---|---|
| Claude 3.5 Sonnet | 3,00 USD/M | 0,025 USD/M | 0,83 % |
| Claude 3 Haiku | 0,25 USD/M | 0,025 USD/M | 10 % |
| Amazon Titan Text | 0,30 USD/M | 0,025 USD/M | 8,33 % |

### Aktionsgebühren und die Steuer auf lang laufende Agenten

Aktionsgebühren kumulieren bei Agenten mit vielen Tool-Aufrufen pro Sitzung.

- **AWS Bedrock KB bei 100.000 Abfragen/Tag**: 40 USD/Tag = 1.200 USD/Monat
- **Self-hosted OpenSearch auf t3.medium** bei 100.000 Abfragen/Tag: ca. 0,16 USD/Tag = 5 USD/Monat

Die Kreuzungspunkt-Berechnung: AaaS-Aktionsgebühren übersteigen die Self-hosted-Infrastrukturkosten bei ca. **12.500 Abfragen/Tag**.

### Unkontrollierte Schleifenkosten: Doppelte Abrechnung

Unkontrollierte Agenten-Schleifen kosten in AaaS mehr als bei Self-hosted-Bereitstellungen, da AaaS sowohl die Modellkosten als auch die Orchestrierungsschicht-Gebühr bei jeder Iteration abrechnet.

## AaaS-Sicherheit: Credential-Isolierung und der CVE-2024-5184-Test

### Der CVE-2024-5184-Test für AaaS-Plattformen

CVE-2024-5184 (Palo Alto Unit 42, Juni 2024, CVSS 9,1 KRITISCH): Prompt-Injection über Tool-API-Antwort.

**Der CVE-2024-5184-Test**: "Wenn das Kontext-Fenster meines Agenten durch Prompt-Injection extrahiert wird, welche Credentials sind zugänglich?"

**Bestanden** (Credentials nicht im Kontext-Fenster):
- AWS Bedrock Agents
- OpenLegion

**Nicht bestanden** (Credentials zugänglich):
- Plattformen, bei denen Entwickler API-Schlüssel im System-Prompt platziert haben

### Multi-Tenant-Prompt-Isolierung

AaaS-Plattformen müssen Prompt-Isolierung durchsetzen: der System-Prompt, der Konversationsverlauf und die Tool-Ergebnisse von Mandant A dürfen nie im Agenten-Kontext von Mandant B erscheinen.

**Infrastruktur-Ebenen-Isolierung (stärkste):**
- AWS Bedrock Agents: separate IAM-Rollen pro Mandant
- Google Agent Space: Isolierung über Google Cloud-Projektgrenzen
- OpenLegion: Blackboard-Namespace-ACL pro Projekt

**System-Prompt-Ebenen-Isolierung (schwächste):** Scheitert, wenn Prompt-Injection die Mandantenanweisung überschreibt (OWASP LLM06:2023).

Für die vollständige Architektur der mandantenspezifischen Credential-Bereiche und Namespace-ACLs siehe [KI-Agenten-Multi-Tenancy und Cross-Tenant-Isolierungsarchitektur](/learn/ai-agent-multi-tenancy).

### Das Shared-Responsibility-Modell in AaaS

Häufige Kundenfehler, die Sicherheitslücken erzeugen:

1. Credentials in System-Prompts
2. Zu weit gefasste Tool-Berechtigungen
3. Keine mandantenspezifische Tool-Bereiche
4. Kein HITL-Interrupt für irreversible Aktionen

## AaaS vs. Self-Hosted: Das Entscheidungsframework

### Wann AaaS gewinnt

AaaS ist die bessere Wahl, wenn:
- **Niedriges bis mittleres Volumen**: Aktionsgebühren sind geringer als Self-hosted-Infrastrukturkosten (Kreuzungspunkt ca. 12.500 Abfragen/Tag)
- **Schnelle Produktionsreife**: AaaS eliminiert wochenlange Infrastruktur-Einrichtung
- **Compliance-Vererbung**: SOC 2 Type II-zertifizierte AaaS-Plattformen

### Wann Self-Hosted gewinnt

Self-hosted ist die richtige Wahl, wenn:
- **Volumen übersteigt den Kreuzungspunkt**: über 50.000 Agenten-Aktionen/Tag
- **Benutzerdefinierte Laufzeitanforderungen**: Nicht-standardmäßige Tool-Ausführungsumgebungen
- **Daten-Residenz-Anforderungen**: Regulierte Branchen
- **Vendor-Lock-in-Risiko ist inakzeptabel**

### Gesamtbetriebskosten

TCO-Vergleich für 100.000 Aktionen/Tag:

**AaaS (AWS Bedrock-Stil):**
- KB-Abfragen: 1.200 USD/Monat
- Orchestrierungsgebühren: ca. 300 USD/Monat
- Gesamt: ca. 1.500 USD/Monat + Modellkosten

**Self-hosted:**
- Kubernetes-Cluster: 800 USD/Monat
- Vektordatenbank: 200 USD/Monat
- Observability-Stack: 150 USD/Monat
- Engineering: 2.400 USD/Monat
- Gesamt: ca. 3.550 USD/Monat + Modellkosten

## OpenLegions Einschätzung: AaaS-Sicherheit ist eine Frage der Credential-Architektur

Agent as a Service ist die am schnellsten wachsende Einkaufskategorie für Enterprise-KI 2026 -- und gleichzeitig die Kategorie mit dem am wenigsten standardisierten Sicherheits-Baseline. Jede AaaS-Plattform behauptet Credential-Isolierung. Der Unterschied liegt darin, ob die Isolierung architektonisch oder durch Konvention durchgesetzt wird.

**Architektonische Durchsetzung**: Credentials gelangen nie in den Agent-Code oder das Kontext-Fenster. Wenn das Kontext-Fenster durch Prompt-Injection extrahiert wird, sind keine Credentials vorhanden.

**Konventionsbasierte Isolierung**: Entwickler werden angewiesen, Credentials nicht in System-Prompts zu setzen. Bricht unter Zeitdruck, Code-Review-Lücken und Entwickler-Onboarding-Fehlern.

Drei konkrete Zahlen:
- **CVE-2024-5184 (CVSS 9,1 KRITISCH, Juni 2024)**
- **32,88 USD CPC** für "agent as a service" in Q1-Q2 2026
- **4-faches YoY-Wachstum** des Suchvolumens von Juni 2025 bis Anfang 2026

| **Sicherheitskontrolle** | **OpenLegion** | **AWS Bedrock Agents** | **Google Agent Space** | **OpenAI Operator** | **LangGraph (self-hosted)** |
|---|---|---|---|---|---|
| **Credential-Vault mit $CRED{}-Handle-Auflösung** | Zone 2, architektonisch | IAM-Rollenübernahme | Service-Account-Bereiche | Sitzungsisolierung | Entwickler-Verantwortung |
| **Tagesbudget-Obergrenze pro Agent (Infrastruktur-Ebene)** | Zone 2, 0--50 USD/Tag | Nicht verfügbar | Nicht verfügbar | Nicht verfügbar | Entwickler-Verantwortung |
| **Blackboard-ACL pro Mandanten-Projekt** | Architektonisch | IAM-basiert | Projektbasiert | Nicht zutreffend | Entwickler-Verantwortung |
| **Tool-Berechtigungsbereiche pro Agent** | Laufzeit-durchgesetzt | Aktionsgruppen-IAM | IAM-basiert | Nicht zutreffend | Entwickler-Verantwortung |
| **WORM-Auditprotokoll pro Mandant (SOC 2 CC6.1)** | Nativ | CloudTrail | Cloud Audit Logs | Nicht zutreffend | Entwickler-Verantwortung |
| **Agenten-Definition in Git** | INSTRUCTIONS.md | Konsole/API | Konsole/API | Nicht zutreffend | Entwickler-Verantwortung |

[Jetzt mit OpenLegion starten](https://app.openlegion.ai) -- Agenten mit architektonischer Credential-Isolierung, Pro-Agent-Tagesausgaben-Obergrenzen in Zone 2 und Blackboard-ACLs bereitstellen.

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist Agent as a Service (AaaS)?

Agent as a Service (AaaS) ist ein kommerzielles Liefermodell, bei dem KI-Agenten auf der verwalteten Infrastruktur eines Anbieters laufen, Orchestrierung, Tool-Ausführung, Speicher und Credential-Management übernehmen und dem Kunden auf Verbrauchsbasis berechnet werden. Die AaaS-Kategorie kristallisierte sich 2026 mit dem Start von OpenAI Operator (Januar 2025), der allgemeinen Verfügbarkeit von Google Agent Space und AWS Bedrock Agents auf Enterprise-Niveau heraus. Jede AaaS-Plattform macht drei Versprechen: verwaltete Infrastruktur, verbrauchsbasierte Abrechnung und Credential-Isolierung.

### Wie viel kostet Agent as a Service?

AaaS-Preise haben drei Kostenebenen: die zugrunde liegenden LLM-Modellkosten, eine Orchestrierungsschicht-Gebühr (AWS Bedrock Agents: 0,000025 USD/Eingabe-Token) und Aktionsgebühren für Tool-Integrationen (AWS Bedrock Knowledge Base: 0,0004 USD/Abfrage). Bei 100.000 Agenten-Aktionen/Tag erreichen AaaS-Plattformgebühren typischerweise 1.500--3.600 USD/Monat vor Modellkosten.

### Was ist AWS Bedrock Agents und wie wird es bepreist?

AWS Bedrock Agents ist Amazons verwaltete AaaS-Plattform mit Agenten-Orchestrierung, Aktionsgruppen (Lambda-Funktionsintegrationen) und Wissensdatenbanken. Preise (2026): 0,000025 USD pro Eingabe-Token für die Orchestrierungsschicht, zusätzlich zu den LLM-Modellkosten; Knowledge Base-Abfragen kosten 0,0004 USD pro Abfrage.

### Was war OpenAI Operator und warum ist es für AaaS wichtig?

OpenAI Operator, gestartet im Januar 2025, ist das erste Mainstream-Consumer-AaaS-Produkt -- ein KI-Agent, der Web-Aufgaben in einer sandboxed Browser-Sitzung im Auftrag des Nutzers ausführt. Die Marktbedeutung: Operator zeigte, dass auch Verbraucher für Agent-Task-Ausführung als Service zahlen, was direkt mit dem 4-fachen YoY-Anstieg des Suchvolumens für "agent as a service" Anfang 2026 korreliert.

### Wie funktioniert Credential-Isolierung in AaaS-Plattformen?

Credential-Isolierung bedeutet, dass die Plattform die LLM-API-Schlüssel, Datenbank-Credentials oder Tool-Secrets des Kunden nie an Agent-Code oder andere Mandanten weitergibt. AWS Bedrock Agents erreicht dies durch IAM-Rollenübernahme. OpenLegion verwendet `$CRED{}`-Handle-Auflösung in Zone 2: Agent-Code referenziert einen Credential nach Name; Zone 2 löst den tatsächlichen Wert zur Ausführungszeit auf, ohne ihn an den Agenten zurückzugeben.

### Welche Sicherheitsrisiken sind spezifisch für AaaS-Plattformen?

Das primäre AaaS-spezifische Sicherheitsrisiko ist die erweiterte Angriffsfläche für Prompt-Injection (CVE-2024-5184, CVSS 9,1 KRITISCH): AaaS-Agenten rufen externe APIs auf und verarbeiten externe Web-Inhalte, und jede dieser externen Antworten kann bösartig gestaltete Anweisungen enthalten. Das zweite Risiko ist Cross-Tenant-Prompt-Übertragung bei schwacher Isolierungsarchitektur. Das dritte Risiko ist die Shared-Responsibility-Lücke.

### Wann sollte ich AaaS vs. Self-hosted verwenden?

AaaS ist die bessere Wahl bei niedrigem bis mittlerem Volumen, schneller Produktionsreife oder Compliance-Vererbung. Self-hosted gewinnt bei hohem Volumen (über 50.000 Aktionen/Tag), benutzerdefinierten Laufzeitanforderungen, Daten-Residenz-Vorschriften oder wenn Vendor-Lock-in inakzeptabel ist. Die TCO-Berechnung muss stets Engineering-Zeit einschließen.

### Was ist Multi-Tenant-Prompt-Isolierung in AaaS?

Multi-Tenant-Prompt-Isolierung bedeutet, dass der System-Prompt, der Konversationsverlauf, die Tool-Ergebnisse und der Speicherzustand von Mandant A nie im Agenten-Kontext von Mandant B erscheinen. Die stärksten Isolierungsmechanismen sind auf Infrastruktur-Ebene. Die schwächste Variante ist die System-Prompt-Ebenen-Isolierung, die scheitert, wenn Prompt-Injection die Mandantenanweisung überschreibt (OWASP LLM06:2023).
