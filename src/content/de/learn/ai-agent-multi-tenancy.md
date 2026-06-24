---
title: "KI-Agent Multi-Tenancy: Credential-Isolation und SOC 2-Kontrollen"
description: "Verhindern Sie tenant-übergreifende Datenlecks in Multi-Tenant-KI-Agentensystemen. Behandelt OWASP LLM06, tenant-spezifisches Credential-Scoping, Kubernetes-Namespaces und SOC 2-Kontrollen CC6.1/CC6.6."
slug: /learn/ai-agent-multi-tenancy
primary_keyword: ki agent multi-tenancy
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-governance
  - /learn/ai-agent-sandboxing
  - /learn/ai-agent-audit-log
  - /learn/ai-agent-platform
---

# KI-Agent Multi-Tenancy: Credential-Isolation, Namespace-Trennung und SOC 2

KI-Agent Multi-Tenancy ist die Architektur-Eigenschaft einer Agentenplattform, die die Credentials, den Speicher, den Ausführungskontext und die Audit-Aufzeichnungen jedes Tenants von jedem anderen Tenant isoliert, durchgesetzt auf der Infrastrukturebene, nicht durch Entwicklerkonventionen oder Agenten-Instruktionsbefolgung. Im Gegensatz zur Web-App-Multi-Tenancy halten Agenten live API-Keys, akkumulieren persistenten Speicher über Anfragen hinweg und führen authentifizierte Tool-Aufrufe aus: drei Dimensionen jenseits der Datenzeilenisierung, die jeweils pro Tenant partitioniert werden müssen, um OWASP LLM06 und SOC 2 CC6.1 zu erfüllen.

<!-- SCHEMA: DefinitionBlock -->

> **KI-Agent Multi-Tenancy** ist die Architektur-Eigenschaft einer Agentenplattform, die sicherstellt, dass Agenten, die verschiedene Tenants bedienen, nicht auf die Credentials, den Speicher, den Ausführungskontext oder die Audit-Aufzeichnungen des jeweils anderen zugreifen können, durchgesetzt auf Infrastrukturebene durch tenant-spezifische Credential-Vault-Scopes, Blackboard-Namespace-ACLs, containerisierte Ausführungsisolation und partitionierte Audit-Logs, sodass ein B2B-SaaS-Produkt, das auf der Plattform aufgebaut ist, Tenant-Isolation als strukturelle Garantie und nicht als Entwicklerverantwortung erhält.

## Warum Agent-Multi-Tenancy schwieriger ist als Web-App-Multi-Tenancy

Traditionelle Web-App-Multi-Tenancy isoliert eine Sache: Datenzeilen. Füge eine `tenant_id`-Spalte hinzu, filtere jede Abfrage, fertig. Agent-Multi-Tenancy muss drei zusätzliche Dimensionen isolieren, die Web-Apps nie adressieren mussten. Das Versagen einer dieser Dimensionen stellt ein tenant-übergreifendes Datenleck-Ereignis gemäß OWASP LLM06 Sensitive Information Disclosure dar.

### Die drei Isolationsdimensionen, die Web-Apps nicht hatten

**Credential-Isolation**: Web-Apps identifizieren den Benutzer über ein Sitzungs-Token; die Sitzung hat keinen persistenten Zugriff auf externe Dienste. Agenten benötigen echte API-Keys, die auf den Tenant bezogen sind: einen OpenAI-Key, einen Stripe-Key, einen Salesforce-Key. Wenn der Agent von TenantA und der Agent von TenantB einen OpenAI-Key teilen, beeinträchtigt die hohe Nutzung von TenantA den Rate-Limit-Spielraum von TenantB; die Abrechnung von TenantA beim Anbieter enthält den Token-Verbrauch von TenantB; die Widerrufung des Keys nach einem TenantA-Kompromittierung stört auch TenantB; und die Nutzungsprotokolle des Keys im Dashboard des Anbieters können nicht pro Tenant partitioniert werden, was die logischen Zugriffsanforderungen gemäß SOC 2 CC6.1 verletzt.

**Speicher-Isolation**: Web-Apps verarbeiten eine zustandslose Anfrage und verwerfen den gesamten Kontext. Agenten akkumulieren Arbeitsspeicher (Im-Kontext-Fenster), semantischen Speicher (Vektorspeicher-Embeddings) und Koordinationsstatus (Blackboard-Einträge) über Interaktionen hinweg. Wenn einer dieser Speicher nicht pro Tenant partitioniert ist, können die während einer Aufgabe in den Agenten-Kontext abgerufenen Dokumente von TenantA in einem semantisch ähnlichen Aufgaben-Kontext von TenantB auftauchen, ohne dass feindliche Eingaben erforderlich sind. Dies ist das kanonische OWASP LLM06 v1.1 tenant-übergreifende Datenleck-Szenario.

**Audit-Log-Isolation**: Web-Apps schreiben alle Benutzeraktionen in ein gemeinsames Anwendungsprotokoll; wenn TenantA seine Aufzeichnungen exportieren muss, reicht ein SQL-Filter auf `tenant_id` aus. Bei KI-Agenten kann ein gemeinsames Audit-Log, in dem die Tool-Aufrufe von TenantA und TenantB vermischt sind, nicht an das Compliance-Team von TenantA exportiert werden, ohne die Aufzeichnungen von TenantB preiszugeben. SOC 2 CC6.1 erfordert, dass der Prüfer jedes Tenants nur seine eigenen Aufzeichnungen sehen kann, was eine Speicherebenen-Partitionierung und nicht nur eine abfragezeit-basierte Filterung erfordert.

### Shared-Nothing vs. Pool vs. Bridge: Drei Multi-Tenancy-Modelle

**Silo-Modell (Shared-Nothing)**: Jeder Tenant erhält vollständig dedizierte Infrastruktur: separate Agenten-Container, separater Credential-Vault, separater Blackboard-Namespace ohne ACL-Abhängigkeiten von anderen Tenants, separater Vektorspeicher-Index, separater LLM-API-Key. Maximale Isolation bei den höchsten Kosten pro Tenant. Korrekt für Unternehmens-Tenants mit strengen Datensidenz-Anforderungen, regulierten Branchen (Finanzdienstleistungen, Gesundheitswesen) und jeden Tenant, dessen Compliance-Haltung dedizierte Infrastruktur erfordert.

**Pool-Modell**: Alle Tenants teilen die Infrastruktur: denselben Agenten-Container-Pool, denselben LLM-API-Key, denselben Vektorspeicher-Cluster, dasselbe Blackboard, mit Isolation, die nur auf der Anwendungsebene durch `tenant_id`-Parameter-Filterung durchgesetzt wird. Niedrigste Kosten, schwächste Isolation. Nur geeignet für Workloads mit geringer Sensitivität und ohne Compliance-Anforderungen.

**Bridge-Modell**: Gemeinsame Compute-Infrastruktur mit auf der Control-Plane durchgesetzter Isolation. Jeder Tenant erhält einen dedizierten Credential-Vault-Scope und Speicher-Namespace, der durch Infrastruktur-ACLs durchgesetzt wird; Compute wird geteilt, aber durch Kubernetes-Namespace-ResourceQuota gesteuert. Dies ist der empfohlene Standard für B2B-SaaS: Er bietet Isolation bei den zwei risikoreichsten Dimensionen (Credentials und Speicher) auf Infrastruktur-Durchsetzungsebene, während Compute-Ressourcen zur Kostenkontrolle geteilt werden. Die projektbasierte Architektur von OpenLegion ist eine Bridge-Modell-Implementierung.

## OWASP LLM06: Tenant-übergreifende Offenlegung sensibler Informationen

OWASP LLM Top 10 v1.1 klassifiziert tenant-übergreifende Datenlecks unter LLM06: Sensitive Information Disclosure als hohes Risiko. Multi-Tenant-Agent-Deployments sind der primäre Kontext, in dem dieses Risiko in großem Maßstab auftritt.

### Der tenant-übergreifende Datenleck-Angriffsvektor

Die LLM06-Sequenz für tenant-übergreifende Datenlecks in Multi-Tenant-Agent-Deployments:

1. Der Agent von TenantA verarbeitet eine Kundensupport-Anfrage. Er ruft die internen Produktdokumentationen und Kundendaten von TenantA in sein Kontextfenster ab und speichert dann relevante Abschnitte im gemeinsamen Vektorspeicher.
2. Der Agent von TenantB verarbeitet eine semantisch ähnliche Anfrage. Er fragt den gemeinsamen Vektorspeicher ab; die Abfrage gibt die eingebetteten Abschnitte von TenantA als Top-K-Nächste-Nachbarn zurück, weil sie thematisch ähnlich sind und kein tenant-partitionierter Index vorhanden ist.
3. Die internen Kundendaten von TenantA erscheinen im Agenten-Kontext von TenantB. Der Agent von TenantB verwendet sie, um eine Antwort für den Benutzer von TenantB zu generieren.

Es sind keine feindlichen Eingaben erforderlich. Es ist kein Prompt-Injection-Angriff beteiligt. Das Datenleck ist ein Architekturversagen.

Für das vollständige Framework einschließlich Prompt-Injection (LLM01) und übermäßiger Handlungsfähigkeit siehe [KI-Agentensicherheit und das OWASP LLM Top 10-Bedrohungsmodell](/learn/ai-agent-security).

### Speicher-Datenleck: Arbeitsspeicher, Vektorspeicher und Blackboard-Status

Drei Agenten-Speichertypen erfordern jeweils separate Tenant-Isolationsbehandlung:

**Arbeitsspeicher (Im-Kontext-Fenster)**: Das aktuelle Kontextfenster des Agenten darf niemals über Tenant-Anfragen hinweg geteilt werden. Erzwinge dies durch Instanziierung eines neuen Agenten-Prozesses pro Tenant-Anfrage oder Bereinigung und Neuinitialisierung des gesamten Arbeitsstatus zwischen Tenant-Kontexten.

**Semantischer Speicher (Vektorspeicher)**: Wenn ein gemeinsamer Vektorspeicher verwendet wird, muss jeder Schreibvorgang `tenant_id` als obligatorisches Metadaten-Feld enthalten, und jede Abfrage muss einen Metadaten-Filter `{tenant_id: current_tenant_id}` enthalten. Der Filter muss auf der **Speicher-Client-Ebene** eingefügt werden, nicht als Parameter aus dem Agenten-Code übergeben werden.

**Koordinationsstatus (Blackboard)**: Key-Value-Status, der über Agenten in derselben Flotte hinweg geteilt wird, muss tenant-bezogene Key-Präfixe verwenden, zum Beispiel `projects/{tenant_id}/*`, mit ACL-Durchsetzung auf der Mesh-Ebene.

## Credential-Isolation: Tenant-spezifisches Vault-Scoping

Credentials sind die risikoreichste tenant-übergreifende Datenleck-Dimension, weil die Konsequenzen von Datenlecks sofort und konkret sind: Ein Agent, der API-Aufrufe mit dem Key eines anderen Tenants ausführt, führt Aufrufe durch, die das Kontingent dieses Tenants verbrauchen, diesem Tenant in Rechnung gestellt werden und in den Anbieter-Audit-Logs dieses Tenants als eigene Aktionen des Tenants erscheinen.

### Tenant-spezifisches Credential-Scoping: Warum gemeinsame API-Keys versagen

Die häufigste Multi-Tenancy-Credential-Fehlerkonfiguration ist die Verwendung eines LLM-API-Keys für alle Tenants, die durch Prompt-Anspruch oder JWT-Tenant-Bezeichner unterschieden werden. Dies schlägt auf vier verschiedene Arten fehl:

**Rate-Limit-Teilen**: Die Burst-Nutzung von TenantA treibt den gemeinsamen Key in Richtung seiner Rate-Begrenzung. Anfragen von TenantB beginnen, 429-Antworten vom Anbieter zu erhalten.

**Kosten nicht zuordenbar**: Die Anbieterrechnung zeigt den aggregierten Token-Verbrauch gegen den gemeinsamen Key.

**Widerruf-Radius**: Wenn der gemeinsame Key kompromittiert und widerrufen werden muss, verlieren gleichzeitig alle Agenten aller Tenants den LLM-Zugriff.

**Audit-Isolation unterbrochen**: Die Nutzungsprotokolle des Anbieters zeigen den gemeinsamen Key als Akteur. SOC 2 CC6.1 erfordert, dass der Prüfer von TenantA Zugriffsdatensätze sieht, die auf TenantA bezogen sind.

Korrektes Muster: Jeder Tenant erhält seinen eigenen API-Key. Keys werden in einem tenant-spezifischen Vault-Scope gespeichert. Für die vollständige Vault-Architektur siehe [Credential-Management und tenant-spezifische Vault-Scoping-Muster](/learn/credential-management-ai-agents).

### Das JWT-Anti-Pattern: Token-Scope ohne Widerruf

Drei Maßnahmen sind zusammen erforderlich:

1. **Kurzlebige Token**: Maximal 300 Sekunden (5 Minuten) TTL für Token bei Agenten-Tool-Aufrufen.
2. **Aktives Widerrufs-Register**: Eine pro-Tenant-Tabelle mit gültigen Token-IDs.
3. **Pro-Task-Token-Rotation**: Ausgabe eines neuen Tokens für jede Agenten-Aufgabe, gebunden an die Aufgaben-ID.

## Ausführungs-Isolation: Kubernetes-Namespaces und Resource-Quotas

### Namespace pro Tenant: RBAC, NetworkPolicy und ResourceQuota

Vier Komponenten sind erforderlich:

**Namespace pro Tenant**: Die Agent-Pods jedes Tenants laufen in einem dedizierten Kubernetes-Namespace.

**RBAC mit Namespace-bezogenen ServiceAccounts**: Jeder Tenant erhält einen dedizierten ServiceAccount mit RoleBindings, die auf seinen eigenen Namespace beschränkt sind.

**NetworkPolicy mit Deny-All-Standard**: Wende eine Deny-All-Ingress- und Egress-Policy auf jeden Tenant-Namespace standardmäßig an.

**ResourceQuota mit LimitRange**: Wende pro-Namespace-CPU-, Speicher- und Pod-Count-Limits über ResourceQuota an.

Für Prozess-Level-Sandboxing-Kontrollen siehe [KI-Agent-Sandboxing und Prozess-Level-Ausführungsisolation](/learn/ai-agent-sandboxing).

### Noisy-Neighbor und pro-Tenant-Budget-Caps

Der Noisy-Neighbor-Problem in Multi-Tenant-Agentensystemen hat zwei Dimensionen: Compute-Noisy-Neighbor (durch ResourceQuota gemindert) und LLM-API-Quota-Noisy-Neighbor (erfordert pro-Tenant-API-Key-Isolation oder pro-Tenant-Rate-Tracking auf der LLM-Gateway-Ebene).

## SOC 2-Compliance für Multi-Tenant-Agentenplattformen

### CC6.1: Logische Zugriffskontrollen pro Datenklassifizierung

SOC 2 Typ II CC6.1 erfordert drei spezifische Kontrollen:

**Tenant-spezifischer Credential-Vault-Scope**: Agenten, die mit TenantA-Daten arbeiten, haben logischen Zugriff nur auf den Credential-Vault-Scope von TenantA.

**Tenant-spezifischer Speicher-Namespace**: Agenten, die TenantA-Daten verarbeiten, können nur TenantAs Blackboard-Namespace und Vektorspeicher-Partition lesen und schreiben.

**Tenant-spezifische Audit-Log-Partition**: Die Audit-Aufzeichnungen von TenantA müssen in einer Partition gespeichert werden, die Agenten und Operatoren von TenantB nicht lesen können.

SOC 2-Prüfer kennzeichnen gemeinsame API-Keys, die über Tenants hinweg verwendet werden, als CC6.1-Mängel. Für die vollständige Kontrollzuordnung siehe [KI-Agent-Governance und SOC 2-Compliance-Frameworks](/learn/ai-agent-governance).

### CC6.6: Beschränkung des privilegierten Zugriffs für erhöhte Berechtigungen

CC6.6-Compliance für Agentenplattformen erfordert: strukturelle Verhinderung tenant-übergreifender erhöhter Berechtigungsaufrufe, überprüfbare privilegierte Agenten-Berechtigungsdefinitionen und pro-Aufruf-Audit-Aufzeichnungen für privilegierte Aktionen.

## Tenant-spezifische Audit-Log-Partitionierung

### Empfohlenes Partitionsdesign für Multi-Tenant-Agent-Audit-Logs

**Speicher-Key-Muster**: `audit/{tenant_id}/{year}/{month}/{day}/{agent_id}/{tool_call_id}.json`

**S3-Bucket-Policy pro Tenant**: Ein separates Bucket-Präfix mit einer separaten Ressourcen-Policy pro Tenant.

**OTLP-Ressourcen-Attribute**: `tenant_id` als Ressourcen-Attribut auf jeden OpenTelemetry-Log-Datensatz einbeziehen.

**Tenant-spezifischer SIEM-Workspace**: In gemeinsamen SIEM-Deployments (Splunk, Elastic) pro-Tenant-Indizes oder Workspaces konfigurieren.

Für das vollständige Audit-Log-Design siehe [KI-Agent-Audit-Log und tenant-spezifische Compliance-Aufzeichnungen](/learn/ai-agent-audit-log).

## Anti-Patterns: Was man nicht tun sollte

### Anti-Pattern 1: Tenant-ID im Agenten-Prompt, nicht in der Infrastruktur

Das Einfügen der `tenant_id` in den System-Prompt des Agenten und das Vertrauen auf den Agenten, seine eigene Tenant-Grenze durchzusetzen, ist das häufigste und gefährlichste Multi-Tenancy-Anti-Pattern. Es scheitert durch Prompt-Injection-Bypass, Halluzinations-Drift und fehlende Infrastruktur-Durchsetzung.

### Anti-Pattern 2: Gemeinsamer Vektorspeicher ohne Tenant-Filter

Dies ist der primäre OWASP LLM06-Datenleck-Vektor. Die Korrektur erfordert: `tenant_id` als obligatorisches Metadaten-Feld bei jedem Schreibvorgang und einen Metadaten-Filter, der auf der Speicher-Client-Ebene bei jeder Abfrage eingefügt wird, nicht als Parameter aus dem Agenten-Code.

### Anti-Pattern 3: Gemeinsamer LLM-API-Key mit Tenant-Anspruch im Prompt

Dieses Anti-Pattern schlägt bei CC6.1 fehl: Rate-Limit-Teilen, Kostenzuordnungsfehler, Widerruf-Radius und Anbieter-Audit-Aufzeichnungen, die nicht pro Tenant partitioniert werden können.

## OpenLegions Einschätzung: Isolation durch Architektur, nicht durch Konvention

OpenLegion erzwingt Tenant-Isolation durch drei Infrastruktur-Ebenen-Mechanismen, die Agenten-Code nicht umgehen kann: pro-Projekt-Credential-Vault-Scoping, Blackboard-Namespace-ACLs und cross-Projekt-Agent-Messaging, das standardmäßig blockiert ist.

| **Isolationskontrolle** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Tenant-spezifischer Credential-Vault-Scope** | Infrastruktur-erzwungen | Entwicklerkonvention | Entwicklerkonvention | Entwicklerkonvention | Entwicklerkonvention |
| **Blackboard-Namespace-ACLs** | Infrastruktur-erzwungen | Nicht verfügbar | Nicht verfügbar | Nicht verfügbar | Nicht verfügbar |
| **Cross-Projekt-Agent-Messaging blockiert** | Standardmäßig blockiert | Nicht verfügbar | Nicht verfügbar | Nicht verfügbar | Nicht verfügbar |
| **Tenant-spezifischer Budget-Cap (Zone 2)** | Infrastruktur-erzwungen | Entwicklerkonvention | Entwicklerkonvention | Entwicklerkonvention | Entwicklerkonvention |
| **Tenant-spezifische Audit-Partition (WORM)** | Infrastruktur-erzwungen | Entwicklerkonvention | Entwicklerkonvention | Entwicklerkonvention | Entwicklerkonvention |
| **Kubernetes-Namespace + ResourceQuota** | Plattformseitig verwaltet | Selbst verwaltet | Selbst verwaltet | Selbst verwaltet | Selbst verwaltet |

Für die gehostete Infrastrukturschicht ohne selbst verwaltetes Kubernetes siehe [verwaltete KI-Agentenplattform mit Tenant-Isolationsgarantien](/learn/ai-agent-platform).

<!-- SCHEMA: FAQPage -->

## Häufig gestellte Fragen

### Was ist KI-Agent-Multi-Tenancy?

KI-Agent-Multi-Tenancy ist die Architektur-Eigenschaft einer Agentenplattform, die sicherstellt, dass Agenten, die verschiedene Tenants bedienen, nicht auf die Credentials, den Speicher, den Ausführungskontext oder die Audit-Aufzeichnungen des jeweils anderen zugreifen können, durchgesetzt auf der Infrastrukturebene und nicht durch Entwicklerkonventionen oder Agenten-Instruktionsbefolgung. Sie unterscheidet sich von der traditionellen Web-App-Multi-Tenancy, indem drei zusätzliche Isolationsdimensionen erforderlich sind: tenant-spezifisches Credential-Vault-Scoping, tenant-spezifische Speicherpartitionierung (Vektorspeicher und Blackboard) und tenant-spezifische Audit-Log-Partitionierung.

### Was ist OWASP LLM06 und wie beeinflusst es Multi-Tenant-Agentensysteme?

OWASP LLM Top 10 v1.1 LLM06 Sensitive Information Disclosure klassifiziert tenant-übergreifende Datenlecks als hohes Risiko: das Szenario, in dem ein Agent die Daten von TenantA verarbeitet, abgerufene Dokumente in einer gemeinsamen Speicherschicht ohne Tenant-Partitionierung speichert und diese dann in einer TenantB-Antwort anzeigt. Der Angriff erfordert keine feindlichen Eingaben. Minderungsmaßnahmen erfordern tenant-spezifische Speicherpartitionierung auf der Speicher-Client-Ebene, tenant-spezifisches Credential-Scoping und tenant-spezifische Audit-Log-Partitionen.

### Wie gelten SOC 2 CC6.1 und CC6.6 für Multi-Tenant-Agentenplattformen?

SOC 2 Typ II CC6.1 erfordert, dass logischer Zugriff basierend auf der Datenklassifizierung eingeschränkt wird; in einem Multi-Tenant-Agentensystem ist die Tenant-Grenze die primäre Klassifizierungsgrenze. CC6.6 gilt für Agenten mit erhöhten Tool-Berechtigungen; diese Agenten sind funktionell privilegierte Benutzer und müssen strukturell daran gehindert werden, Anfragen außerhalb ihres zugewiesenen Tenant-Umfangs zu verarbeiten. SOC 2-Prüfer bewerten beide Kontrollen, indem sie prüfen, ob die Isolation auf der Infrastrukturebene implementiert ist. Ein gemeinsamer API-Key, der über Tenants hinweg verwendet wird, wird in der Regel als CC6.1-Mangel eingestuft.

### Was ist die JWT-Token-TTL-Schwachstelle in Multi-Tenant-Agentensystemen?

JWT-Zugriffstoken, die für den Tenant-Kontext in Agenten-Tool-Aufrufen verwendet werden, laufen üblicherweise nach 3.600 Sekunden (1 Stunde) ab; wenn ein Token für TenantA falsch zwischengespeichert, durch einen Infrastruktur-Bug geteilt oder in einem Debug-Log erfasst wird, kann es verwendet werden, um authentifizierte Aufrufe, die TenantA zugeschrieben werden, für die gesamte TTL-Dauer ohne Erkennung zu machen. Minderungsmaßnahmen erfordern drei zusammen angewendete Kontrollen: kurzlebige Token mit maximal 300 Sekunden TTL, ein aktives pro-Tenant-Token-Widerruf-Register und pro-Task-Token-Rotation.

### Wie funktioniert Kubernetes-Namespace-Isolation für Multi-Tenant-Agenten?

Kubernetes-Namespace-Isolation bietet Ausführungsisolation durch vier Komponenten: einen dedizierten Namespace pro Tenant, RBAC mit pro-Tenant-ServiceAccounts und Namespace-bezogenen RoleBindings, NetworkPolicy mit Deny-All-Standard und expliziten Whitelists für erforderliche externe Endpunkte sowie ResourceQuota mit pro-Namespace-Compute-Limits. LimitRange fügt eine pro-Pod-Ressourcengrenze hinzu. Namespace-Isolation adressiert die Compute-Dimension der Multi-Tenancy und muss mit tenant-spezifischem Credential-Scoping und Speicherpartitionierung kombiniert werden.

### Was ist das Shared-Vektorspeicher-Anti-Pattern in Multi-Tenant-Agentensystemen?

Die Verwendung eines gemeinsamen Vektorspeichers ohne obligatorische pro-Abfrage-Tenant-Filter, die auf der Speicher-Client-Ebene eingefügt werden, ist der primäre OWASP LLM06-Datenleck-Vektor. Die korrekte Implementierung erfordert ein `tenant_id`-Metadaten-Feld bei jedem Schreibvorgang und einen Metadaten-Filter, der auf der Vektorspeicher-Client-Ebene bei jeder Abfrage eingefügt wird, nicht als Parameter aus dem Agenten-Code übergeben wird. Für strenge Compliance-Anforderungen setzen per-Tenant-Namespaces oder separate Indizes Grenzen auf der Speicher-Adress-Ebene durch.

### Wie erzwingt OpenLegion Tenant-Isolation?

OpenLegion erzwingt Tenant-Isolation durch drei Infrastruktur-Ebenen-Mechanismen: pro-Projekt-Credential-Vault-Scoping (Zone 2 löst `$CRED{}`-Handles unter Verwendung des authentifizierten Projektkontexts aus der Mesh-Sitzung auf, nicht aus agenten-gelieferten Parametern; cross-Projekt-Credential-Auflösung ist architektonisch unmöglich), Blackboard-Namespace-ACLs (Agenten haben Lese- und Schreibberechtigungen nur für den Key-Präfix ihres Projekts, durchgesetzt vom Mesh-Supervisor) und cross-Projekt-Agent-Messaging, das standardmäßig blockiert ist.

### Was sind die drei Multi-Tenancy-Architekturmodelle für Agentenplattformen?

Die drei Multi-Tenancy-Modelle haben unterschiedliche Isolationsgarantien und Kostenprofile: Das Silo-Modell (Shared-Nothing) gibt jedem Tenant vollständig dedizierte Infrastruktur; das Pool-Modell teilt alle Infrastrukturen mit nur auf der Anwendungsebene durchgesetzter Isolation; das Bridge-Modell teilt Compute-Infrastruktur, während Isolation auf der Control-Plane durch tenant-spezifische Credential-Vault-Scopes und Speicher-Namespace-ACLs durchgesetzt wird. Das Bridge-Modell ist der empfohlene Standard für B2B-SaaS.
