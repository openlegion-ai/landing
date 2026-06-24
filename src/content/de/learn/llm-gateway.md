---
title: "LLM-Gateway: Routing, Auth und Kostenkontrolle für KI-Agenten"
description: "Ein LLM-Gateway leitet KI-Agenten-Anfragen über Modellanbieter weiter, setzt Ratenlimits durch, injiziert Anmeldedaten ohne Offenlegung an Agentencode und ordnet Tokenkosten pro Agent zu."
slug: /learn/llm-gateway
primary_keyword: llm gateway
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /comparison/litellm
  - /learn/ai-agent-mcp-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-monitoring
  - /learn/llm-cost-optimization
  - /learn/ai-agent-security
---

# LLM-Gateway: Routing, Auth und Kostenkontrolle für KI-Agenten

Ein LLM-Gateway ist ein HTTP-Reverse-Proxy, der zwischen KI-Agenten-Prozessen und vorgelagerten Modellanbieter-Endpunkten positioniert ist und als Datenebene für den gesamten ausgehenden Inferenz-Traffic fungiert. Es löst opake Schlüssel-Handles auf der Leitungsebene vor der Weiterleitung auf, setzt per-Tenant-Drosselkontingente mit Sliding-Window-Countern durch, emittiert OpenTelemetry-Ausgabentelemetrie pro Anfrage und öffnet Circuit Breaker, wenn die vorgelagerte P99-Latenz konfigurierte Schwellenwerte überschreitet — ohne dass Änderungen am Agenten-Anwendungscode erforderlich sind. Jede Flotte mit drei oder mehr gleichzeitigen Inferenz-Konsumenten sollte einen einsetzen.

<!-- SCHEMA: DefinitionBlock -->

> Ein **LLM-Gateway** ist ein HTTP-Reverse-Proxy, der in der Datenebene zwischen KI-Agenten-Prozessen und Modellanbieter-Endpunkten sitzt und opake Schlüsselauflösung auf der Leitungsebene, per-Tenant-Kontingentdurchsetzung über Sliding-Window-Counter, OpenTelemetry-Ausgabentelemetrie pro Anfrage und Circuit-Breaker-Failover als Infrastrukturprimitive bietet, die für den Anwendungscode unsichtbar sind.

## Das Datenebenen-Problem bei Multi-Agenten-Inferenz

Ohne eine dedizierte Inferenz-Datenebene verwaltet jeder Agenten-Prozess seine eigenen vorgelagerten Verbindungen: Schlüsselauflösung aus dem Umgebungszustand, keine per-Prozess-Kontingente, keine per-Anfrage-Telemetrie und keine Sichtbarkeit, ob der vorgelagerte Endpunkt beeinträchtigt ist. Bei zwei Agenten ist das handhabbar. Bei zwanzig erzeugt es vier unterschiedliche Fehlermodi.

### Schlüssel-Exfiltration durch Umgebungsintrospekt

Jeder Agenten-Prozess, der einen Klartext-Anbieterschlüssel in seiner Umgebung hält, ist eine feindliche Instruktion davon entfernt, ihn zu leaken. Die Angriffsfläche ist die Prozessumgebung selbst: `os.environ`, `/proc/self/environ` auf Linux-Hosts, ausführliche Fehler-Tracebacks, die den Prozesszustand serialisieren, und Debug-Log-Konfigurationen, die ausgehende HTTP-Header inklusive Authorization-Felder erfassen.

Prompt-Injection-Angriffe, die Agenten dazu bringen, den Umgebungszustand zu echoen, sind eine dokumentierte Angriffsklasse gegen Agenten mit Klartext-Schlüsseln (OWASP LLM01:2025). Die strukturelle Lösung ist nicht bessere Eingabevalidierung: Es ist das vollständige Entfernen des Klartext-Schlüssels aus dem Agenten-Prozess. Ein LLM-Gateway, das opake Handles (`$CRED{openai}`) auf der Leitungsebene auflöst, bevor der Authorization-Header geschrieben wird, bedeutet, dass der Agenten-Prozess nie Material hält, das exfiltriert werden kann.

OpenLegions Mesh implementiert dies auf Infrastrukturebene: `$CRED{}`-Handles lösen an der Mesh-Host-Grenze auf. Agenten-Container können den aufgelösten Wert strukturell nicht erreichen — nicht weil sie angewiesen werden, es nicht zu tun, sondern weil die Auflösung außerhalb ihres Adressraums stattfindet.

### Kontingenterschöpfung durch gemeinsame Schlüssel-Drosselung

Vorgelagerte Modellanbieter drosseln auf API-Schlüssel-Ebene. In einer Flotte, in der zwanzig Agenten-Prozesse einen Schlüssel teilen, kann ein einzelner Prozess, der Anfragen mit 10-fachem erwarteten Tempo emittiert — durch einen Retry-Sturm, eine laufende Schleife oder eine Prompt-Injection-Payload, die unbegrenzte Inferenzaufrufe verursacht — den Schlüssel in Rate-Limit-Territorium für die anderen neunzehn drücken.

Ein Gateway setzt per-Tenant-Kontingente mit einem Sliding-Window-Counter durch, der auf der Agenten-ID eingegrenzt ist. Wenn der Zähler eines Agenten die konfigurierte Obergrenze erreicht, antwortet das Gateway mit HTTP 429 auf der Gateway-Ebene: Es wird keine vorgelagerte Anfrage gesendet, kein Anbieter-Kontingent verbraucht, und Geschwister-Agenten sind nicht betroffen.

Die Token-Bucket-Variante ermöglicht konfigurierbare Burst-Kapazität: Ein Agent mit 60 Anfragen/Minute kann einen Burst von 90 über ein 10-Sekunden-Fenster absorbieren, wobei der Burst-Abzug gegen das Budget des folgenden Fensters angerechnet wird. Dies ist das richtige Modell für von Natur aus burstartige Agenten.

Das per-Agent-Kontingent ist auch die strukturelle Abwehrmaßnahme für OWASP LLM10:2025 (Unbounded Consumption) — das Muster, bei dem feindliche Instruktionen einen Agenten dazu bringen, unbegrenzte Inferenzaufrufe zu emittieren.

### Fehlende vorgelagerte Observierbarkeit

Ohne eine Inferenz-Datenebene erfordert per-Anfrage-Telemetrie Instrumentierung innerhalb jedes Agenten-Prozesses. Dies ist sowohl redundant als auch inkonsistent: Verschiedene Agenten-Rollen instrumentieren unterschiedlich, manche gar nicht, und keiner hat Sichtbarkeit in die vorgelagerte Latenzverteilung der Flotte.

Ein Gateway emittiert per-Anfrage OpenTelemetry OTLP-Log-Datensätze auf der Leitungsebene: Agenten-ID, vorgelagerter Endpunkt, Modellname, Eingabe-Token-Anzahl, Ausgabe-Token-Anzahl, Cache-Hit-Token, HTTP-Antwortstatus und Anfragedauer.

Der Ausgabendatensatz pro Anfrage — `input_tokens × Preis_pro_1k_Eingabe + output_tokens × Preis_pro_1k_Ausgabe` — akkumuliert in einem per-Agent-Ausgabenbuch. Dieses unterstützt tägliche und monatliche Ausgabenobergrenzen sowie Ausgaben-Anomaliealarmierung.

### Unsichtbare vorgelagerte Beeinträchtigung

Anbieter-Endpunkte verschlechtern sich. P99-Tail-Latenz auf GPT-4o kann während Kapazitätsereignissen 12 Sekunden erreichen (OpenLegion-Infrastruktur-Benchmark, Juni 2026). Ohne einen Circuit Breaker in der Datenebene absorbiert jeder Agent in der Flotte diese Verschlechterung bei jeder Anfrage.

Ein Gateway mit einem Circuit Breaker verfolgt per-Endpunkt-Fehlerrate und P99-Latenz. Wenn ein konfigurierbarer Fehlerschwellenwert überschritten wird — zum Beispiel fünf aufeinanderfolgende 5xx-Antworten oder P99 über 8 Sekunden in einem 30-Sekunden-Fenster — öffnet sich der Circuit: Nachfolgende Anfragen werden sofort an den konfigurierten Fallback-Endpunkt weitergeleitet.

OpenLegions Juni-2026-Benchmark maß GPT-4o primär → Claude 3.5 Sonnet Fallback-Topologie: P99 sank von 12 Sekunden auf 3,1 Sekunden (3,9-fach) ohne jede Änderung am Agenten-Code.

## Gateway-Architektur: Datenebene vs. Steuerungsebene

### Die Datenebene: Per-Anfrage-Durchsetzung

Jede Inferenzanfrage durchläuft die Datenebene in Folge:

1. **TLS-Terminierung**: Der Agenten-Prozess verbindet sich mit dem Gateway über TLS. Für mTLS-Deployments präsentiert der Agent ebenfalls ein Zertifikat. mTLS eliminiert die Notwendigkeit für per-Anfrage-Authentifizierungstoken zwischen Agent und Gateway.

2. **Workload-Identitätsauflösung**: Das Gateway ordnet die verbindende Workload einer Tenant-Identität zu. In mTLS-Deployments trägt der SPIFFE SVID im Client-Zertifikat die Workload-Identität.

3. **Opake Handle-Auflösung**: Das Gateway inspiziert den ausgehenden Authorization-Header auf `$CRED{}`-Handle-Muster. Übereinstimmende Handles werden gegen den Backing Secret Store des Gateways aufgelöst.

4. **Kontingentprüfung**: Das Gateway inkrementiert den Sliding-Window-Counter des Tenants. Wenn der Counter die Obergrenze überschreitet, gibt das Gateway 429 mit `Retry-After` zurück. Keine vorgelagerte Verbindung wird geöffnet.

5. **Circuit-Breaker-Prüfung**: Das Gateway bewertet den Circuit-Zustand des Ziel-Endpunkts. Wenn der Circuit offen ist, wird die Anfrage sofort zum Fallback umgeleitet.

6. **Vorgelagertes Dispatch**: Das Gateway öffnet eine Verbindung aus seinem eigenen Connection-Pool zum vorgelagerten Endpunkt und leitet die Antwort zurück.

7. **Telemetrie-Emission**: Beim Abschluss der Antwort schreibt das Gateway einen OTLP-Log-Datensatz.

Gesamtaufwand auf dem warmen Pfad: 0,7–2,1 ms. Auf dem kalten Pfad (Cache-Miss): 2,6–6,6 ms. Bei Anbieter-Inferenzlatenz von 500 ms–30 s ist der Warm-Pfad-Aufwand unter 0,5 % der Gesamtround-Trip-Zeit.

### Die Steuerungsebene: Konfiguration und Richtlinien

Die Steuerungsebene regelt das Verhalten der Datenebene. Wichtige Verantwortlichkeiten:

**Tenant-Identität und Kontingent-Konfiguration**, **Endpunkt-Topologie**, **Handle-Berechtigungsbereich**: Welche Tenant-Identitäten welche Handles auflösen dürfen. Ein Tenant mit `openai:read`-Bereich kann `$CRED{openai}` auflösen, aber nicht `$CRED{anthropic}`. Dies verhindert laterale Bewegung zwischen Tenants.

**Audit-Richtlinie**: Welche Felder in OTLP-Log-Datensätzen erscheinen.

Die Steuerungsebenen-API sollte nicht aus agentenseitigen Netzwerken erreichbar sein. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, behoben in v1.83.0) zeigte, was passiert, wenn der Konfigurationsschreibpfad der Steuerungsebene netzwerkerreichbar ist ohne ausreichende Autorisierung. Korrektes Deployment: privates Subnetz, authentifiziert, keine externe Exposition.

## Deployment-Topologien

### Zentralisierter Eingang

Ein einzelner Gateway-Cluster verarbeitet den gesamten ausgehenden Inferenz-Traffic der Agenten-Flotte. Geeignet für Flotten bis etwa 50 Agenten, wo betriebliche Einfachheit Priorität hat.

### Sidecar-Pattern

Jeder Agenten-Container betreibt einen Gateway-Prozess auf seiner Loopback-Schnittstelle. Die Fehlerdomäne ist ein Agenten-Container. Geeignet für große Flotten (50+ Agenten), wo per-Agent-Fehlerisolierung Priorität hat.

### Mesh-Native Proxy

In OpenLegion ist der Inferenz-Proxy ein Mesh-Dienst. Das Mesh-native Modell behandelt Workload-Identität nativ: Jeder Agenten-Container erhält beim Start eine Mesh-ausgestellte Identität.

## OpenLegions Einschätzung

Der LLM-Gateway-Funktionsumfang — mTLS, Sliding-Window-Kontingentdurchsetzung, OTLP-Ausgabentelemetrie, Circuit-Breaker-Failover — ist keine optionale Infrastruktur für Multi-Agenten-Flotten. Es ist die minimal lebensfähige Datenebene.

Drei Messungen aus OpenLegions Juni-2026-Infrastrukturtests quantifizieren den Einsatz:

**P99-Tail-Latenz ohne Failover**: 12 Sekunden auf reinen GPT-4o-Deployments während Anbieter-Kapazitätsereignissen. Mit Claude 3.5 Sonnet als Circuit-Breaker-Fallback: 3,1 Sekunden. Die 3,9-fache Verbesserung erforderte null Änderungen am Agenten-Anwendungscode.

**Schlüssel-Exfiltrations-Angriffsfläche**: In einer 20-Agenten-Flotte, in der alle Agenten Klartext-Schlüssel in ihrer Umgebung halten, kann ein einziger durch Prompt-Injection kompromittierter Agent (OWASP LLM01:2025) Schlüssel exfiltrieren. In einer gateway-vermittelten Flotte mit opaker Handle-Auflösung hält der gleiche kompromittierte Agent kein Material, das exfiltriert werden kann.

**OWASP LLM-Abdeckung**: Per-Tenant-Kontingentdurchsetzung am Gateway adressiert LLM10:2025 (Unbounded Consumption). Handle-Scope-Durchsetzung adressiert LLM06:2025 (Excessive Agency).

Für Teams, die [Credential-Management-Muster für KI-Agenten](/learn/credential-management-ai-agents) evaluieren, ist die opake Handle-Auflösung des Gateways die Deployment-Implementierung des dort beschriebenen Vault-Proxy-Patterns.

## LLM-Gateway-Vergleich

| **Fähigkeit** | **Self-hosted (LiteLLM)** | **OpenAI nativ** | **OpenLegion Mesh-Proxy** |
|---|---|---|---|
| **Schlüsselauflösungsmodell** | Postgres-gestützter Schlüsselspeicher | Managed Service | Opaques Handle → Vault auf Leitungsebene |
| **mTLS Workload-Identität** | Nicht unterstützt | Nicht unterstützt | SPIFFE SVID pro Agenten-Container |
| **Kontingentdurchsetzung** | Konfigurationsbasiert, per-Schlüssel | Per-Org-Limits | Sliding-Window-Counter, per-Tenant |
| **Circuit-Breaker-Failover** | Plugin-basiert | Nicht verfügbar | Nativ, mit Half-Open-Probe |
| **OTLP-Ausgabentelemetrie** | Teilweise | Nicht exportiert | Per-Anfrage, alle Felder |
| **Steuerungsebenen-Isolierung** | Manuell; standardmäßig exponiert | Managed | Nur privates Mesh-Subnetz |
| **CVE-Historie (2024–2026)** | GHSA-53mr-6c8q-9789 + weitere | Keine öffentlichen | Keine |

## Gateway für Ihre Flotte auswählen

### mTLS vs. Bearer-Token-Authentifizierung

mTLS (mutual TLS) authentifiziert sowohl den Client (Agent) als auch den Server (Gateway) auf der TLS-Handshake-Ebene, bevor HTTP-Payload ausgetauscht wird. Der Client präsentiert ein Zertifikat mit einem SPIFFE SVID. Kein Bearer-Token wird in Headern übertragen.

Für produktive Multi-Agenten-Flotten ist mTLS mit SPIFFE-ausgestellten SVIDs das richtige Authentifizierungsmodell. Es eliminiert die Token-Management-Oberfläche vollständig.

### Sliding-Window vs. Fixed-Window-Kontingent-Counter

Fixed-Window-Counter setzen an Uhrgrenzen zurück. Ein Agent kann die doppelte Nominalrate bursten. Sliding-Window-Counter halten eine rollende Zählung über ein kontinuierliches Zeitintervall ohne Uhrgrenzen. Für Inferenz-Workloads ist Sliding-Window-Durchsetzung das richtige Modell.

### Telemetrie-Granularitätsanforderungen

Per-Anfrage-OTLP-Datensätze sind das Minimum für nützliche Flotten-Observierbarkeit. Gateways, die Telemetrie aggregieren (stündliche Summen statt per-Anfrage-Datensätze), können keine per-Agent-Ausgaben-Anomalieerkennung oder genaue Circuit-Breaker-Kalibrierung unterstützen.

## Loslegen

**Deployen Sie Multi-Agenten-Inferenzflotten mit mTLS-Workload-Identität, Sliding-Window-Kontingentdurchsetzung und per-Anfrage-OTLP-Ausgabentelemetrie.**
[Auf OpenLegion starten](https://app.openlegion.ai) | [Dokumentation lesen](https://docs.openlegion.ai) | [LiteLLM vs. OpenLegion vergleichen](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist ein LLM-Gateway?

Ein LLM-Gateway ist ein HTTP-Reverse-Proxy, der in der Datenebene zwischen KI-Agenten-Prozessen und vorgelagerten Modellanbieter-Endpunkten positioniert ist. Es löst opake Schlüssel-Handles auf der Leitungsebene auf, setzt per-Tenant-Sliding-Window-Kontingentlimits durch, emittiert per-Anfrage OpenTelemetry-Ausgabentelemetrie und öffnet Circuit Breaker, wenn vorgelagerte Endpunkte konfigurierte Latenz- oder Fehlerratenschwellenwerte überschreiten — als Infrastrukturprimitive, die keine Änderungen am Agenten-Anwendungscode erfordern.

### Brauche ich ein LLM-Gateway, wenn ich nur einen Modellanbieter nutze?

Einzelanbieter-Flotten profitieren von drei Gateway-Funktionen: opaker Handle-Auflösung, per-Tenant-Kontingentdurchsetzung und per-Anfrage-OTLP-Ausgabentelemetrie. Warm-Pfad-Aufwand ist 0,7–2,1 ms — vernachlässigbar gegenüber Anbieter-Inferenzlatenz von 500 ms bis 30 Sekunden.

### Wie funktioniert Circuit-Breaker-Failover in einem LLM-Gateway?

Das Gateway verfolgt per-Endpunkt-Fehlerraten und P99-Latenz in rollenden Beobachtungsfenstern. Wenn ein konfigurierbarer Fehlerschwellenwert überschritten wird, öffnet sich der Circuit: Alle nachfolgenden Anfragen werden sofort an den konfigurierten Fallback-Endpunkt weitergeleitet. Nach einer Abkühlzeit dispatcht das Gateway eine Half-Open-Probe an das Primary. Eine erfolgreiche Probe schließt den Circuit; eine fehlgeschlagene Probe startet den Abkühltimer neu. OpenLegions Juni-2026-Benchmark maß eine Reduktion von P99 von 12 Sekunden auf 3,1 Sekunden auf einer GPT-4o → Claude 3.5 Sonnet Topologie.

### Was ist mTLS und warum ist es für LLM-Gateways wichtig?

mTLS (mutual TLS) authentifiziert sowohl den verbindenden Agenten-Prozess als auch das Gateway auf der TLS-Handshake-Ebene, bevor HTTP-Payload ausgetauscht wird. Der Agent präsentiert ein Client-Zertifikat mit einem SPIFFE SVID. Kein Bearer-Token wird in HTTP-Headern übertragen; kein Token muss ausgestellt, verteilt oder rotiert werden. Die Workload-Identität treibt Handle-Scope-Durchsetzung: Das Gateway erlaubt der verbindenden Workload nur die Auflösung der Handles, für die ihre SPIFFE-Identität bereichert ist.

### Was ist der Unterschied zwischen Sliding-Window- und Fixed-Window-Kontingentdurchsetzung?

Fixed-Window-Counter setzen an Uhrgrenzen zurück. Ein Agent kann die doppelte Nominalrate bursten, indem er in den letzten Sekunden eines Fensters und den ersten Sekunden des nächsten mit voller Geschwindigkeit anfragt. Sliding-Window-Counter halten eine rollende Zählung über ein kontinuierliches Zeitintervall ohne Uhrgrenzen. Für Inferenz-Workloads ist Sliding-Window-Durchsetzung das richtige Modell.

### Wie unterscheidet sich per-Anfrage-OTLP-Telemetrie von aggregierten Ausgabenberichten?

Per-Anfrage OpenTelemetry OTLP-Datensätze erfassen einzelne Felder bei jedem Inferenzaufruf: Agenten-ID, Modellvariante, Eingabe-Token, Ausgabe-Token, Cache-Hit-Token, vorgelagerte Latenz und HTTP-Status. Diese Datensätze akkumulieren in per-Agent-Ausgabenbüchern, die tägliche und monatliche Budgetobergrenzen sowie Ausgaben-Anomalieerkennung unterstützen. Aggregierte Ausgabenberichte können keine Anomalieerkennung unterstützen, weil das Signal in der per-Anfrage-Varianz liegt.

### Was sollte die Gateway-Steuerungsebene gegenüber agentenseitigen Netzwerken nicht exponieren?

Die Steuerungsebene verwaltet Kontingent-Konfiguration, Endpunkt-Topologie, Handle-Berechtigungsbereiche und Audit-Richtlinien. Sie sollte in einem privaten Subnetz ohne externen Zugriffspfad deployed werden. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, behoben in v1.83.0) dokumentierte unzureichende Autorisierung auf der Management-API. Agentenseitige Netzwerke sollten nur den Datenebenport des Gateways erreichen.

### Wie kalibriere ich Circuit-Breaker-Schwellenwerte für meine Flotte?

Sammeln Sie P50-, P95- und P99-Latenz-Histogramme pro Anbieter-Endpunkt über zwei bis vier Wochen Produktions-Traffic. Der Circuit-Breaker-Öffnungsschwellenwert sollte bei einem P99-Wert gesetzt werden, der im Vergleich zur normalen SLA des Anbieters eindeutig beeinträchtigt ist — typischerweise 2–3-fach der medianen P99. Der Abkühlzeitraum vor der Half-Open-Probe sollte die typische Erholungszeit des Anbieters überschreiten — 30–60 Sekunden ist ein vernünftiger Ausgangspunkt.
