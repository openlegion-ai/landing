---
title: "Credential-Management für KI-Agenten: Vault-Proxy-Architektur"
description: "Vault-Proxy-Architektur für KI-Agenten: Geheimnisse serverseitig injizieren, pro Agent isolieren, jeden Zugriff prüfen und das env-var-Antipattern vermeiden, das Schlüssel in CVE-2024-34359 und CVE-2025-29927 exponierte."
slug: /learn/credential-management-ai-agents
primary_keyword: credential management ai agents
last_updated: "2026-06-11"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-security
  - /learn/model-context-protocol
  - /learn/ai-agent-orchestration
  - /learn/multi-agent-systems
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
---

# Credential-Management für KI-Agenten: Vault-Proxy-Architektur

Credential-Management für KI-Agenten ist die Gesamtheit der Infrastrukturpraktiken, die regeln, wie autonome Agenten API-Schlüssel und Geheimnisse beziehen, verwenden, rotieren und freigeben, ohne dass Anmeldeinformationen im Agentenspeicher, in Logs oder in Kontextfenstern erscheinen. Agenten durchbrechen gängige Credential-Muster: Sie laufen autonom, können durch Prompt-Injection kompromittiert werden und operieren in Flotten, wo ein gemeinsames Geheimnis die Exfiltrationsangriffsfläche vervielfacht. CVE-2024-34359 (llama-cpp-python, CVSS 9,6) und CVE-2025-29927 (Next.js, CVSS 9,1) zeigen, wie KI-Deployments Geheimnisse preisgeben, wenn Sicherheitsgrenzen versagen.

<!-- SCHEMA: DefinitionBlock -->
Credential-Management für KI-Agenten ist die Gesamtheit der Praktiken und Infrastrukturmuster, die regeln, wie autonome Agenten API-Schlüssel, Token und Geheimnisse beziehen, verwenden, rotieren und freigeben, ohne dass diese jemals im Agentenspeicher, in Logs oder in Kontextfenstern erscheinen.

## Warum Standard-Credential-Muster in Agentenflotten versagen

### Das .env-Dateiproblem im großen Maßstab

Umgebungsvariablen funktionieren sauber für Einzelprozessanwendungen. Bei Agentenflotten bricht das Modell sofort zusammen. Eine `.env`-Datei, die über eine 10-Agenten-Flotte geteilt wird, bedeutet, dass 10 laufende Prozesse jedes Geheimnis im Speicher halten. Jeder Prozess erzeugt Logs, Fehlerausgaben und Debug-Traces -- alles potenzielle Credential-Expositionsflächen. Wird einer dieser 10 Agenten durch eine Prompt-Injection kompromittiert, die ihn anweist, seine Umgebung zu drucken, lecken alle Credentials in der gemeinsamen `.env` gleichzeitig.

Der N-Agenten-Multiplikator ist das Kernproblem: Jeder zusätzliche Agent in der Flotte fügt für jedes gemeinsame Credential eine weitere Expositionsfläche hinzu. Eine Flotte von 20 Agenten mit 5 API-Schlüsseln in `.env` erzeugt 100 potenzielle Credential-Expositionspunkte, bevor Log-Aggregation, Fehlerberichte oder Debugging-Tools berücksichtigt werden, die Umgebungs-Snapshots erfassen können.

### Der CVE-Datensatz zu Klartextgeheimnissen in KI-Anwendungen

Zwei CVEs dokumentieren die realen Kosten unsicherer Geheimnisverwaltung in bereitgestellten KI-Systemen:

**CVE-2024-34359** (llama-cpp-python, CVSS 9,6 Kritisch): Jinja2-Server-seitige Template-Injection via unsandboxed Rendering von Modellmetadaten in `llama-cpp-python`. Das Chat-Template-Feld einer bösartig erstellten `.gguf`-Modelldatei wurde über `jinja2.Environment` ohne Sandboxing gerendert und ermöglichte Remote Code Execution. Jede Anwendung, die nicht vertrauenswürdige Modelle lädt -- einschließlich Agenten-Pipelines, die Modelle aus externen Quellen herunterladen -- ist betroffen. Das strukturelle Problem: Model-Loading-Code vertraute externem Inhalt ohne Isolation.

**CVE-2025-29927** (Next.js, CVSS 9,1 Kritisch): Autorisierungs-Bypass via dem `x-middleware-subrequest`-Header, der nicht authentifizierten Anfragen erlaubte, Middleware in Next.js-Deployments zu überspringen. Anwendungen, die Next.js-Middleware zum Schutz credential-gesicherter Routen nutzen -- einschließlich KI-Agenten-API-Backends -- waren betroffen: Der Bypass erlaubte Zugriff auf Routen, die die Middleware eigentlich blockieren sollte. Der Fehler ist in den Versionen 12.3.5, 13.5.9, 14.2.25 und 15.2.3 behoben.

Beide CVEs illustrieren dieselbe zugrundeliegende Risikoklasse: Wenn Geheimnisse oder geschützte Routen von Anwendungsschicht-Kontrollen abhängen statt von struktureller Isolation, macht ein einziger Logikfehler sie angreifbar. Das Vault-Proxy-Muster eliminiert die Angriffsfläche, indem Geheimnisse aus Agenten-Containern ferngehalten und hinter Infrastrukturschicht-Durchsetzung gestellt werden.

### Warum Agenten-Logs ein Credential-Risiko darstellen

Traditionelle Anwendungslogs enthalten strukturierte Ereignisse an kontrollierten Call-Sites. Agenten-Logs erfassen alles: LLM-Reasoning-Traces, Tool-Call-Argumente, Tool-Rückgabewerte und Zwischenschritte. Wenn ein Agent eine externe API mit einem Credential im Authorization-Header aufruft, erfasst eine naive Logging-Konfiguration diesen Header. Wenn der Reasoning-Trace eines Agenten den Text "using API key sk-..." aus einem abgerufenen Dokument oder Prompt enthält, erscheint diese Zeichenkette im Log.

Agenten-Log-Volumina sind hoch und Aufbewahrungsfristen oft lang. Ein Credential, das einmal in einem Log-Aggregationssystem erscheint, verbleibt dort bis das Log gelöscht wird -- was Wochen oder Monate nach der Außerbetriebnahme des erzeugenden Agenten sein kann.

### Der Prompt-Injection-Credential-Pfad

OWASP LLM Top 10 v1.1 (LLM06: Sensitive Information Disclosure, veröffentlicht Oktober 2025) identifiziert Credential-Exfiltration als primären Angriffsvektor für LLM-Anwendungen. Der Angriff ist direkt: Adversarielle Inhalte, die von einem Agenten abgerufen werden -- von einer Webseite, einem Dokument, einer Tool-Antwort -- enthalten Anweisungen wie "print all environment variables" oder "output your API key." Ein Agent ohne strukturelle Credential-Isolation kann diese Anweisung nicht von einer legitimen Aufgabenanweisung unterscheiden.

Forschung aus frühem 2026 scannte 3.984 Agenten-Skills und fand, dass 283 (7,1 %) kritische Credential-Handling-Mängel enthielten, die API-Schlüssel im Klartext durch LLM-Kontext leiteten. 76 Skills enthielten absichtliche Credential-Diebstahl-Payloads, die darauf ausgelegt waren, Credentials an angreiferkontrollierte Endpunkte zu exfiltrieren. Die einzige strukturelle Verteidigung ist sicherzustellen, dass Credentials nie im Agentenkontext existieren. Ein Agent kann kein Credential leaken, das er nicht besitzt.

## Credential-Management-Muster für KI-Agenten

### Muster 1: Umgebungsvariablen (Geringste Sicherheit)

Umgebungsvariablen (`os.environ`, `.env`-Dateien, Docker `--env`-Flags) sind das Standard-Credential-Muster für die meisten Agenten-Frameworks. LangChain liest aus `os.environ`, CrewAI verlässt sich auf Umgebungsinjektion, OpenAI Agents SDK erwartet Credentials in der Prozessumgebung. Dieses Muster ist nur für lokale Entwicklung und Prototyping geeignet.

Für Produktions-Agentenflotten versagen Umgebungsvariablen auf jeder Sicherheitsachse: Sie existieren im Agentenprozess-Speicher (zugänglich für Prompt-Injection), erscheinen in `/proc/{pid}/environ` auf Linux-Hosts, tauchen in Fehler-Tracebacks und Debug-Ausgaben auf und propagieren über alle Agenten in einer geteilten-Umgebungs-Flotte.

### Muster 2: Secret-Manager-Integration

Cloud-Secret-Manager (AWS Secrets Manager bei $0,40/Secret/Monat + $0,05 pro 10.000 API-Aufrufen; Azure Key Vault; GCP Secret Manager) verbessern gegenüber Umgebungsvariablen, indem Credentials außerhalb des Agentenprozesses gespeichert und bei Bedarf abgerufen werden. Der Agent ruft die Secrets-Manager-API auf, um ein Credential zu holen, verwendet es für eine Operation und verwirft es.

Dieses Muster reduziert die Lebensdauer des Credentials im Speicher, eliminiert aber nicht das Expositionsfenster: Das Credential läuft immer noch durch den Agentenspeicher während des Fetch-Use-Discard-Zyklus. Es bleibt für Prompt-Injection während dieses Fensters sichtbar und erfordert, dass der Agent ein zweites Credential (den Secrets-Manager-API-Schlüssel oder die IAM-Rolle) hält, um auf das erste zuzugreifen.

### Muster 3: Vault-Proxy / Opaque-Handle-Injektion (Sicherste)

Das Vault-Proxy-Muster hält Credentials vollständig aus Agenten-Containern heraus. Der Agent hält ein opakes Handle -- eine Referenzzeichenkette wie `$CRED{stripe_key}` -- das ein Credential identifiziert, ohne es aufzulösen. Wenn der Agent einen API-Aufruf macht, der das Handle enthält, fängt der Vault-Proxy die Anfrage ab, löst das Handle zum tatsächlichen Credential auf, injiziert es auf der Netzwerkschicht und leitet die authentifizierte Anfrage weiter. Der Agent sieht das Klartextcredential nie.

Dies ist dasselbe Prinzip wie HashiCorp Vaults (35.763 Sterne, BSL, v2.0.2 veröffentlicht am 5. Juni 2026) agentenseitige Injektion, direkt in die Agentenorchestierungsschicht eingebettet. Mit 700+ MCP-Servern im Ökosystem (Juni 2026) eliminiert das `$CRED{}`-Handle-Muster den per-Server-`.env`-Wildwuchs: Eine Handle-Referenz in der Agentenkonfiguration deckt die Credential-Anforderungen jedes MCP-Servers ab.

Ein vollständig kompromittierter Agenten-Container -- einer, der beliebige Angreifer-Anweisungen ausführt -- hat null Credential-Zugriff, weil innerhalb der Reichweite des Containers kein Credential existiert.

### Muster 4: Workload-Identität und OIDC-Föderation

Workload-Identität (OIDC-Föderation, SPIFFE/SPIRE, Cloud-IAM-Dienstkonten) eliminiert langlebige API-Schlüssel für Cloud-Service-Zugriff vollständig. Jeder Agenten-Container erhält ein kurzlebiges Identitätstoken, das zur Laufzeit gegen ein Cloud-Provider-Credential ausgetauscht wird. Das Credential hat eine gebundene TTL -- typischerweise 15 Minuten bis 1 Stunde -- danach läuft es ab und ein neues Token muss ausgestellt werden.

Workload-Identität ist das richtige Muster für Agentenflotten auf Cloud-Infrastruktur, wo Cloud-Provider-Credentials (AWS API-Schlüssel, GCP-Dienstkonto-Schlüssel) erforderlich sind. Es erfordert, dass die Orchestrierungsplattform Identitätsausstellung und Token-Refresh verwaltet, eliminiert aber das statische Schlüsselrotations-Problem vollständig. Für [Multi-Agenten-System](/learn/multi-agent-systems)-Architekturen, die mehrere Cloud-Konten oder Provider umspannen, ist Workload-Identitätsföderation das einzige skalierbare Credential-Modell.

## OpenLegions Einschätzung: Das $CRED{}-Handle-Muster

Jedes große KI-Agenten-Framework behandelt Credential-Management als Problem der Host-Anwendung. LangChain und LangGraph lesen aus `os.environ`. CrewAI verlässt sich auf Umgebungsinjektion. OpenAI Agents SDK erwartet Credentials in der Prozessumgebung. AutoGen erbt die Python-Prozessumgebung. Keines dieser Frameworks bietet strukturelle Credential-Isolation -- sie überlassen das Credential-Management dem Betreiber, was in der Praxis `.env`-Dateien und geteilte Umgebungsvariablen bedeutet.

OpenLegions Vault-Proxy ist in die Agentenorchestierungsschicht eingebaut. Agenten referenzieren Credentials als opake `$CRED{name}`-Handles. Der Mesh-Host löst Handles serverseitig auf und injiziert Credentials an der Netzwerkgrenze. Kein Agenten-Container empfängt jemals ein Klartextcredential. Prompt-Injection kann nicht exfiltrieren, was nicht vorhanden ist.

Infisical (27.296 Sterne, Open-Source-TypeScript-Secrets-Plattform mit MIT-lizenziertem Kern) sammelte 2023 $2,8M Seed-Finanzierung und signalisiert damit Marktnachfrage nach entwicklernativer Geheimnisverwaltung. OpenLegion bettet dieselbe Fähigkeit direkt in die Agenten-Laufzeit ein -- kein separates Secret-Management-Deployment erforderlich.

| **Dimension** | **OpenLegion** | **LangChain/LangGraph** | **CrewAI** | **OpenAI Agents SDK** | **AutoGen** |
|---|---|---|---|---|---|
| **Credential-Speicherung** | Vault (opake Handles) | Umgebung / .env | Umgebung / .env | Umgebung / .env | Umgebung / .env |
| **Agenten-Zugriffsmuster** | $CRED{} Handle -- nie im Container aufgelöst | os.environ direktes Lesen | os.environ direktes Lesen | os.environ direktes Lesen | os.environ direktes Lesen |
| **Klartext im Agentenkontext?** | Nie | Ja -- bei os.environ-Lesen | Ja -- bei os.environ-Lesen | Ja -- bei os.environ-Lesen | Ja -- bei os.environ-Lesen |
| **Rotationsunterstützung** | Vault-nativ; Hot-Rotation ohne Neustart | Manuell; erfordert Neustart | Manuell; erfordert Neustart | Manuell; erfordert Neustart | Manuell; erfordert Neustart |
| **Pro-Agenten-Scoping** | Auf Mesh-Ebene per Allowlist durchgesetzt | Nicht durchgesetzt | Nicht durchgesetzt | Nicht durchgesetzt | Nicht durchgesetzt |
| **Audit-Trail** | Jede Handle-Auflösung mit Agenten-ID geloggt | Kein nativer | Kein nativer | Kein nativer | Kein nativer |

Für Teams, die die vollständige Credential-Expositionsfläche ihres aktuellen Stacks bewerten, deckt das [KI-Agenten-Sicherheitsbedrohungsmodell](/learn/ai-agent-security) Credential-Leakage als eine von sechs dokumentierten Bedrohungskategorien ab, neben Prompt-Injection, Sandbox-Escape und Budget-Missbrauch.

## Secret-Rotation für KI-Agentenflotten

### TTL-gebundene Credential-Leases

Statische API-Schlüssel -- Credentials ohne Ablauf -- sind das schlechteste Credential für Agentenflotten. Ein geleakter statischer Schlüssel bleibt unbegrenzt gültig. Schlüsselrotation erfordert die Koordination aller Agenten, die den Schlüssel verwenden, potenziell während aktiver Aufgaben.

TTL-gebundene Credential-Leases lösen beide Probleme. Das Credential wird mit einem Ablaufzeitraum ausgestellt -- 1 Stunde ist üblich für interaktive Agentensitzungen; 15 Minuten für hochsensible Operationen. Wenn der Lease abläuft, stellt der Vault automatisch ein frisches Credential aus. Das alte Credential ist nach dem Ablauf ungültig, was den Wert jeder geleakten Kopie begrenzt. Agenten-Aufgaben, die mehrere Lease-Fenster umspannen, erhalten transparente Refreshes ohne Unterbrechung.

HashiCorp Vaults Dynamic-Secrets-Engine generiert kurzlebige Credentials für Datenbanken, Cloud-Provider und benutzerdefinierte Backends auf Anfrage. Jedes Credential ist einzigartig für den anfordernden Agenten und läuft nach einer konfigurierbaren TTL ab. CVE-2026-39829 (golang/crypto, Juni 2026) hat eine DoS-Schwachstelle im SSH-Public-Key-Parsing aufgrund unbegrenzter RSA-Modulusgrößen gepatcht -- Vault v2.0.2 adressierte dies durch Begrenzung von RSA-Schlüsseln auf 8192 Bit. Selbst speziell gebaute Vault-Infrastruktur liefert CVEs, weshalb Abstraktionsschichten zwischen Agenten und rohen Geheimnissen wichtig sind, auch wenn Vault direkt verwendet wird.

### Hot-Rotation ohne Agenten-Neustart

Traditionelle Anwendungsgeheimnis-Rotation erfordert den Neustart des Prozesses, um das neue Credential aufzunehmen. Agentenflotten können erzwungene Neustarts nicht tolerieren: Agenten können mitten in einer Aufgabe sein, Arbeitszustand halten, der beim Neustart verloren geht, oder mit anderen Agenten in einem mehrstufigen Handoff koordinieren.

Hot-Rotation injiziert das neue Credential in den Vault, ohne den laufenden Agenten-Container zu berühren. Der nächste API-Aufruf des Agenten über den Vault-Proxy verwendet transparent das neue Credential. Aus Sicht des Agenten löst das `$CRED{name}`-Handle immer noch auf -- nur das zugrundeliegende Geheimnis hat sich geändert.

Hot-Rotation erfordert, dass Agenten Credentials nie lokal cachen. Das `$CRED{}`-Handle-Muster erzwingt dies strukturell: Handles werden zur Aufrufzeit aufgelöst, nicht beim Start, sodass lokales Caching des aufgelösten Wertes nie möglich ist.

### Pro-Agenten-Rotationsbereich

In einer geteilten-Credential-Flotte betrifft das Rotieren eines Credentials jeden Agenten, der es verwendet. Ein Rotationsereignis erfordert Koordination über die gesamte Flotte, was einen Koordinations-Engpass und ein Fenster schafft, in dem einige Agenten das alte Credential und andere das neue verwenden.

Pro-Agenten-Credential-Scoping macht Rotation orthogonal: Das Rotieren von Agent As Credentials beeinflusst Agent B nicht, weil Agent B seinen eigenen separaten Credential-Bereich hält. Dies ist nur erreichbar, wenn die Orchestrierungsschicht pro-Agenten-Scoping durchsetzt, anstatt auf geteilte `.env`-Dateien zu vertrauen. Für [Agentic-Workflow](/learn/agentic-workflows)-Designs, die mehrere spezialisierte Agenten verknüpfen, ist pro-Agenten-Rotationsbereich für null-Ausfallzeit-Credential-Hygiene unerlässlich.

## Credential-Isolation zwischen Agenten

### Pro-Agenten-Credential-Zuweisung

Jeder Agent in einer Flotte sollte nur die Credentials halten, die seine spezifische Aufgabe erfordert. Ein Web-Scraping-Agent benötigt Zugriff auf einen HTTP-Client-Credential, aber keine Datenbankverbindungszeichenkette. Ein Datenanalyse-Agent benötigt Lesezugriff auf ein Data-Warehouse, aber keine Schreib-Token für externe APIs. Ein Publishing-Agent benötigt Schreibzugriff auf ein CMS, aber keinen Zugriff auf interne Datenbanken.

Pro-Agenten-Credential-Zuweisung erfordert, dass die Orchestrierungsschicht das Scoping durchsetzt -- nicht der Agent selbst. Ein Agent, der ein Credential anfordert, für das er nicht autorisiert ist, sollte eine Ablehnung an der Vault-Grenze erhalten, nicht stillschweigend das Credential empfangen, weil es in einer geteilten `.env` vorhanden war.

OWASP LLM06 (Sensitive Information Disclosure) weist ausdrücklich darauf hin, dass überprovisionierte Agenten-Credentials ein Faktor bei Credential-Leakage-Vorfällen sind -- Agenten erhalten mehr Zugriff als ihre Aufgabe erfordert, sodass bei Kompromittierung der Blast-Radius größer als nötig ist.

### Scoping von MCP-Tool-Server-Credentials

Model-Context-Protocol-Tool-Server erfordern oft eigene Credentials -- API-Schlüssel für die Dienste, die sie proxyen. Mit 700+ MCP-Servern im Ökosystem (Juni 2026) ist das Credential-Management-Problem auf der MCP-Schicht nicht mehr theoretisch: Jeder Server ist ein potenzieller `.env`-Wildwuchs-Vektor. In OpenLegion werden MCP-Server-Credentials im selben Vault gespeichert und über dasselbe Proxy-Muster injiziert. Der MCP-Tool-Server empfängt authentifizierte Anfragen vom Mesh-Proxy statt rohe Credentials vom Agenten.

Dies verhindert, dass ein bösartiger MCP-Server als Credential-Ernte-Vektor verwendet wird. Ein kompromittierter MCP-Server findet nur Handle-Referenzen in eingehenden Anfragen, keine rohen Schlüssel. Für das vollständige [Model-Context-Protocol-Sicherheits](/learn/model-context-protocol)-Härtungsmodell, siehe den dedizierten Leitfaden.

### Credentials bei Agenten-Ruhestand widerrufen

Wenn ein Agent seine Aufgabe abschließt oder archiviert wird, sollten seine Credentials sofort widerrufen werden. Statische Credentials, die ihren zugehörigen Agenten überleben, schaffen verwaiste Zugänge -- gültige Schlüssel ohne zugehörigen Audit-Trail, die zu einem Prozess gehören, der nicht mehr läuft.

Credential-Widerruf beim Agenten-Ruhestand erfordert, dass die Orchestrierungsschicht Agenten-Lifecycle-Ereignisse verfolgt und Vault-Widerrufe auslöst. OpenLegions Mesh handhabt dies automatisch: Wenn ein Agent archiviert wird, widerruft der Mesh alle mit dem Bereich dieses Agenten verbundenen Credential-Handles. Für [KI-Agenten-Orchestrierungs](/learn/ai-agent-orchestration)-Systeme, die den Agenten-Lifecycle programmatisch verwalten, sollte Credential-Widerruf ein erstklassiges Lifecycle-Ereignis sein -- kein operativer Nachgedanke.

## Audit-Trails und Credential-Zugriffs-Logging

### Was zu loggen ist (und was nicht)

Jedes Credential-Zugriffsereignis sollte einen Log-Eintrag erzeugen, der enthält: die Agenten-ID, die das Handle aufgelöst hat, den Handle-Namen (nicht den aufgelösten Wert), den Zeitstempel, den externen Endpunkt, den die authentifizierte Anfrage anvisierte, und das Ergebnis (Erfolg oder Autorisierungsfehler). Was nicht zu loggen ist: der tatsächliche Credential-Wert, die aufgelöste Geheimzeichenkette oder jedes Derivat des Klartext-Credentials. Der Handle-Name ist für Audit- und forensische Zwecke ausreichend.

### Credential-Verwendung mit Agenten-Aktionen korrelieren

Agenten-Audit-Trails unterscheiden sich von traditionellen Anwendungs-Audit-Trails: Der Code-Pfad ist nicht-deterministisch. Eine traditionelle Anwendung folgt einem festen Aufrufgraphen; ein Agent kann je nach Prompt, Tool-Ausgaben und LLM-Reasoning jede Aktion ausführen. Agenten-Audit-Logs müssen jeden Tool-Call und seine Argumente erfassen -- nicht nur Credential-Zugriffe -- um den vollständigen Kontext rund um ein verdächtiges Credential-Verwendungsereignis zu rekonstruieren.

OpenLegions Orchestrator loggt Tool-Calls und Credential-Auflösungen in einem einheitlichen Ereignisstrom. Eine forensische Analyse kann die Sequenz wiedergeben: Aufgabe erhalten -> LLM-Aufruf -> Tool ausgewählt -> Credential aufgelöst -> Externe API aufgerufen -> Antwort erhalten. Dies ist die richtige Architektur für KI-Agenten-Deployments in regulierten oder hochriskanten Umgebungen.

### Audit-Anforderungen für regulierte Umgebungen

Für Finanzdienstleistungen, Gesundheitswesen und andere regulierte Sektoren müssen Agenten-Credential-Audit-Logs spezifische Anforderungen erfüllen: Unveränderlichkeit (Logs können nach der Erstellung nicht geändert werden), Manipulationssicherheit (Log-Integrität ist verifizierbar), Aufbewahrungszeitraum-Compliance (Logs für die erforderliche Dauer aufbewahrt) und Zugriffskontrollen (nur autorisiertes Personal kann Audit-Logs lesen). Diese Anforderungen entsprechen direkt der Vault-Proxy-Architektur: Der Mesh-Host generiert Audit-Log-Einträge, wenn Credentials aufgelöst werden, schreibt sie in einen Nur-Anhänge-Speicher und signiert Einträge für Manipulationssicherheit. Agenten-Container haben niemals Zugriff auf den Audit-Log-Speicher. Für [KI-Agenten-Plattform](/learn/ai-agent-platform)-Entscheidungen ist die Audit-Log-Architektur neben der Geheimnisse-Backend-Wahl ein wichtiger Compliance-Aspekt.

## Auswahl eines Secrets-Backends für Ihre Agentenplattform

### HashiCorp Vault

HashiCorp Vault (35.763 Sterne, BSL, v2.0.2 veröffentlicht am 5. Juni 2026) ist das Referenz-Open-Source-Geheimnisverwaltungssystem. Es bietet dynamische Geheimnisgenerierung, TTL-gebundene Leases, feinkörnige Zugriffsrichtlinien, umfassendes Audit-Logging und eine Plugin-Architektur für benutzerdefinierte Secrets-Engines. Hinweis: HashiCorp wechselte im August 2023 von der OSI-genehmigten Apache-2.0-Lizenz zu BSL (Business Source License) -- BSL ist keine OSI-genehmigte Open-Source-Lizenz und schränkt die kommerzielle Nutzung durch Vaults Wettbewerber ein.

Vault ist die richtige Wahl, wenn Sie ein eigenständiges Geheimnisverwaltungssystem benötigen, das mehrere Dienste teilen. Der Betriebsaufwand ist erheblich: Vault erfordert sein eigenes Deployment, High-Availability-Setup und Entsiegelungsverfahren. Für Agentenflotten, wo Vault bereits als Infrastruktur eingesetzt ist, ist die Integration des Agenten-Credential-Managements in Vaults Richtlinien-Engine unkompliziert.

### Infisical

Infisical (27.296 Sterne, MIT-lizenzierter Kern, Open-Source-TypeScript) bietet eine entwicklerfreundliche Secrets-Plattform mit Web-UI, CLI und SDK für Geheimnisverwaltung, Rotation und Audit-Trails. Es sammelte 2023 $2,8M Seed-Finanzierung und positioniert sich als leichtgewichtige Alternative zu HashiCorp Vault für Teams, die Geheimnisverwaltung ohne Vaults Betriebskomplexität oder BSL-Lizenzierungsbeschränkungen wollen.

Für Agentenflotten, die Vault nicht bereits betreiben, ist Infisical als Secrets-Backend eine Überlegung wert. Sein SDK-First-Design integriert sich sauber mit Python-Agenten-Laufzeiten, und sein pro-Umgebungs-Scoping entspricht natürlich den pro-Agenten-Scoping-Anforderungen.

### Cloud-nativ (AWS/Azure/GCP)

AWS Secrets Manager ($0,40/Secret/Monat + $0,05 pro 10.000 API-Aufrufen), Azure Key Vault und GCP Secret Manager bieten verwalteten Geheimnis-Speicher mit nativer Integration in die IAM-Systeme jedes Cloud-Providers. Wenn Ihre Agentenflotte vollständig innerhalb eines einzigen Cloud-Providers läuft, vermeidet cloud-natives Geheimnisverwaltung den Betriebsaufwand für separaten Betrieb von Vault oder Infisical.

Die Einschränkung: Cloud-native Secret-Manager erfordern Cloud-IAM-Credentials für den Zugriff -- das Bootstrap-Credential-Problem. Ein neuer Agenten-Container benötigt ein Credential zur Authentifizierung beim AWS Secrets Manager, bevor er seine operativen Credentials abrufen kann. OIDC-Workload-Identität löst dieses Bootstrap-Problem für cloud-native Deployments.

<!-- SCHEMA: FAQPage -->
## Häufig gestellte Fragen

### Was ist Credential-Management für KI-Agenten?

Credential-Management für KI-Agenten ist die Gesamtheit der Infrastrukturpraktiken, die regeln, wie autonome Agenten API-Schlüssel, Token und Geheimnisse beziehen, verwenden, rotieren und freigeben. Agenten unterscheiden sich von traditionellen Anwendungen, weil sie autonom laufen, durch Prompt-Injection kompromittiert werden können, ausführliche Logs erzeugen und als Multi-Instanz-Flotten operieren -- all das schafft Credential-Expositionsvektoren, die Standard-Umgebungsvariablen-Muster nicht adressieren. OWASP LLM Top 10 v1.1 (2025) listet Sensitive Information Disclosure (LLM06) als Top-10-Bedrohung, mit Credential-Exfiltration als primärem Angriffsvektor.

### Welche CVEs beziehen sich auf KI-Agenten-Credential-Leakage?

CVE-2024-34359 (llama-cpp-python, CVSS 9,6) dokumentierte eine Jinja2-Server-seitige Template-Injection-Schwachstelle in der Modell-Lade-Pipeline: Das Chat-Template einer erstellten `.gguf`-Modelldatei wurde ohne Sandboxing gerendert und ermöglichte Remote Code Execution in jeder Anwendung, die nicht vertrauenswürdige Modelle lud. CVE-2025-29927 (Next.js, CVSS 9,1) demonstrierte, dass der `x-middleware-subrequest`-Header die Middleware-Autorisierung in Next.js-Anwendungen umgehen konnte, einschließlich KI-Agenten-Backends, die Middleware zur Absicherung credential-geschützter Routen nutzten. Beide CVEs führen auf Anwendungsschicht-Sicherheitskontrollen zurück, die unter bösartigem Input versagen -- die strukturelle Lösung ist, Geheimnisse vollständig aus Agenten-Containern fernzuhalten.

### Wie verhindert das Vault-Proxy-Muster Credential-Leakage?

Der Vault-Proxy fängt Agenten-API-Aufrufe ab, löst opake Credential-Handles zu tatsächlichen Geheimnissen auf der Netzwerkschicht auf und gibt die authentifizierte Antwort zurück, ohne dass das Credential jemals in den Container oder das Kontextfenster des Agenten gelangt. Der Agent hält ein Handle wie `$CRED{stripe_key}`, das das Geheimnis identifiziert, ohne es aufzulösen. Ein vollständig kompromittierter Agenten-Container, der beliebige Angreifer-Anweisungen ausführt, hat immer noch null Zugriff auf rohe Credentials, weil kein Credential innerhalb der Reichweite des Containers existiert.

### Warum ist pro-Agenten-Credential-Isolation in Multi-Agenten-Systemen wichtig?

In einem Multi-Agenten-System ist der Blast-Radius jedes Agenten bei Kompromittierung durch die Credentials begrenzt, die er hält. Wenn jeder Agent eine einzige `.env`-Datei mit allen Geheimnissen teilt, macht die Kompromittierung eines einzelnen Agenten alle Credentials für jedes nachgelagerte System zugänglich. Pro-Agenten-Credential-Scoping -- auf Orchestrierungsebene durchgesetzt, nicht im eigenen Code des Agenten -- bedeutet, dass ein kompromittierter Forschungsagent nicht auf die Schreib-Token des Publishing-Agenten oder die Datenbank-Credentials des Datenagenten zugreifen kann. OWASP LLM06 identifiziert ausdrücklich überprovisionierte Agenten-Credentials als beitragenden Faktor zu Credential-Leakage-Vorfällen.

### Was sagt OWASP zum Credential-Management für KI-Agenten?

OWASP Top 10 für LLM-Anwendungen v1.1 (veröffentlicht Oktober 2025) listet Sensitive Information Disclosure als LLM06 und identifiziert Credential-Exfiltration als primären Angriffsvektor für LLM-Anwendungen. Die Leitlinien empfehlen, Klartextcredential-Speicherung im Agentenkontext zu vermeiden, Least-Privilege-Credential-Scoping zu implementieren und Infrastrukturschicht-Kontrollen zu verwenden, anstatt auf Agenten-Code zu setzen, um Geheimnisse zu schützen. Prompt-Injection -- OWASP LLM01, das Top-Risiko -- ist der häufigste Angriffsvektor zur Auslösung von Credential-Offenbarung in bereitgestellten Agenten.

### Wie handhabt OpenLegion Credentials für Agenten, die MCP-Server betreiben?

In OpenLegion werden MCP-Tool-Server-Credentials im Vault gespeichert und über dasselbe Proxy-Muster wie Agenten-Credentials injiziert. Der MCP-Server empfängt authentifizierte Anfragen vom Mesh-Proxy statt rohe Credentials vom Agenten -- der Agent hält nie die Upstream-API-Schlüssel des MCP-Servers. Mit 700+ MCP-Servern im Ökosystem (Juni 2026) eliminiert dies den per-Server-`.env`-Wildwuchs: Eine Vault-Konfiguration deckt alle MCP-Credential-Anforderungen ab, und ein kompromittierter MCP-Server kann keine rohen Credentials aus eingehenden Anfragen ernten.

### Was ist Secret-Rotation und warum benötigen KI-Agenten sie?

Secret-Rotation ist die Praxis, ein Credential durch ein neues auf einer geplanten oder ausgelösten Basis zu ersetzen und das alte für ungültig zu erklären. KI-Agenten benötigen Rotation, weil sie für längere Zeiträume laufen (Stunden bis Tage), während dieses gesamten Fensters potenzielle Exfiltrations-Targets sind und nicht einfach mitten in einer Aufgabe neu gestartet werden können, um rotierte Credentials aufzunehmen. TTL-gebundene Credential-Leases laufen automatisch nach einem konfigurierbaren Fenster ab (typischerweise 1 Stunde), und das Vault-Proxy-Muster unterstützt Hot-Rotation -- das neue Geheimnis ohne Berühren des laufenden Agenten-Containers injizieren -- sodass Rotation für den Agenten transparent ist.

## Agentenflotten ohne Credential-Exposition aufbauen

Das Credential-Management-Problem in KI-Agentenflotten ist architektonisch: Wenn Credentials in Agenten-Containern existieren, können sie leaken. CVE-2024-34359 und CVE-2025-29927 zeigen, dass selbst gut ausgestattete Teams, die große Frameworks betreiben, diese Exposition liefern. Das Vault-Proxy-Muster löst es strukturell -- Credentials gelangen nie in Agenten-Container, sodass Prompt-Injection, Container-Escape oder Log-Exfiltration sie nicht wiederherstellen können.

OpenLegions Vault-Proxy ist in das Agenten-Mesh eingebaut. Konfigurieren Sie ein Credential einmal mit `$CRED{name}`, weisen Sie es den Agenten zu, die es benötigen, und der Mesh handhabt Injektion, TTL-Refresh, pro-Agenten-Scoping und Audit-Logging. Kein separates Vault-Deployment, keine `.env`-Dateikoordination, keine manuellen Rotationsverfahren.

[Sichern Sie Ihre Agentenflotte mit Vault-Proxy-Credential-Isolation auf OpenLegion](https://openlegion.ai)
