---
title: "LLM Gateway : routage, auth et contrôle des coûts pour les agents IA"
description: "Un LLM gateway achemine les requêtes des agents IA entre les fournisseurs de modèles, applique les limites de débit, injecte les identifiants sans les exposer au code agent et attribue les coûts de tokens par agent."
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

# LLM Gateway : routage, auth et contrôle des coûts pour les agents IA

Un LLM gateway est un reverse-proxy HTTP positionné entre les processus d'agents IA et les endpoints de fournisseurs de modèles en amont, opérant comme le plan de données pour tout le trafic d'inférence sortant. Il résout les handles de clés opaques au niveau du fil avant le transfert, applique des quotas de limitation par tenant via des compteurs à fenêtre glissante, émet de la télémétrie de dépenses OpenTelemetry par requête, et ouvre des disjoncteurs quand la latence P99 en amont dépasse les seuils configurés — sans nécessiter de modification du code applicatif des agents. Toute flotte exécutant trois consommateurs d'inférence concurrents ou plus devrait en déployer un.

<!-- SCHEMA: DefinitionBlock -->

> Un **LLM gateway** est un reverse-proxy HTTP situé dans le plan de données entre les processus d'agents IA et les endpoints de fournisseurs de modèles, fournissant la résolution de clés opaques au niveau du fil, l'application de quotas par tenant via des compteurs à fenêtre glissante, la télémétrie de dépenses OpenTelemetry par requête et le basculement par disjoncteur — tous comme des primitives d'infrastructure invisibles pour le code applicatif.

## Le problème du plan de données dans l'inférence multi-agents

Sans un plan de données d'inférence dédié, chaque processus agent gère ses propres connexions en amont : résolution des clés depuis l'état de l'environnement, aucun quota par processus, aucune télémétrie par requête, et aucune visibilité sur la dégradation de l'endpoint en amont. À deux agents, c'est gérable. À vingt, cela produit quatre modes de défaillance distincts.

### Exfiltration de clés par introspection de l'environnement

Tout processus agent qui détient une clé de fournisseur en clair dans son environnement est à une instruction adverse de la faire fuiter. La surface d'attaque est l'environnement du processus lui-même : `os.environ`, `/proc/self/environ` sur les hôtes Linux, les traces d'erreurs verbeuses qui sérialisent l'état du processus, et les configurations de journaux de débogage qui capturent les en-têtes HTTP sortants incluant les champs Authorization.

Les attaques par injection de prompt qui causent aux agents d'écho l'état de l'environnement sont une classe d'attaque documentée contre les agents détenant des clés en clair (OWASP LLM01:2025). La correction structurelle n'est pas une meilleure validation des entrées : c'est la suppression complète de la clé en clair du processus agent. Un LLM gateway qui résout les handles opaques (`$CRED{openai}`) au niveau du fil avant que l'en-tête Authorization soit écrit signifie que le processus agent ne détient jamais de matériel pouvant être exfiltré.

OpenLegion implémente cela au niveau de l'infrastructure : les handles `$CRED{}` se résolvent à la frontière de l'hôte mesh. Les conteneurs agents sont structurellement incapables d'atteindre la valeur résolue — non pas parce qu'ils sont instruits de ne pas le faire, mais parce que la résolution se produit en dehors de leur espace d'adressage.

### Épuisement des quotas par limitation des clés partagées

Les fournisseurs de modèles en amont limitent au niveau de la clé API. Dans une flotte où vingt processus agents partagent une clé, un seul processus émettant des requêtes à 10 fois son taux attendu — que ce soit via une tempête de nouvelles tentatives, une boucle incontrôlée ou une charge utile d'injection de prompt causant des appels d'inférence non bornés — peut pousser la clé en territoire de limitation pour les dix-neuf autres.

Un gateway applique des quotas par tenant en utilisant un compteur à fenêtre glissante indexé sur l'identifiant de l'agent. Lorsque le compteur d'un agent atteint le plafond configuré, le gateway répond avec HTTP 429 : aucune requête en amont n'est envoyée, aucun quota fournisseur n'est consommé, et les agents frères ne sont pas affectés.

Le quota par agent est également la mesure d'atténuation structurelle pour OWASP LLM10:2025 (Consommation non bornée) — le modèle où des instructions adverses causent à un agent d'émettre des appels d'inférence non bornés.

### Observabilité en amont manquante

Sans un plan de données d'inférence, la télémétrie par requête nécessite une instrumentation dans chaque processus agent. C'est à la fois redondant et inconsistant. Un gateway émet des enregistrements de journaux OTLP OpenTelemetry par requête au niveau du fil, capturant : identifiant agent, endpoint en amont, nom du modèle, nombre de tokens d'entrée, nombre de tokens de sortie, tokens de cache-hit, statut de réponse HTTP et durée de requête.

L'enregistrement de dépenses par requête — `tokens_entrée × prix_par_1k_entrée + tokens_sortie × prix_par_1k_sortie` — s'accumule dans un grand livre de dépenses par agent. Ce grand livre supporte des plafonds de dépenses quotidiens et mensuels ainsi que des alertes d'anomalies de dépenses.

### Dégradation en amont invisible

Les endpoints de fournisseurs se dégradent. La latence tail P99 sur GPT-4o pendant les événements de capacité peut atteindre 12 secondes (benchmark d'infrastructure OpenLegion, juin 2026). Sans disjoncteur dans le plan de données, chaque agent absorbe cette dégradation à chaque requête.

Un gateway avec un disjoncteur suit les taux d'erreur et la latence P99 par endpoint. Quand un seuil de défaillance configurable est franchi — par exemple, cinq réponses 5xx consécutives ou P99 dépassant 8 secondes sur une fenêtre de 30 secondes — le circuit s'ouvre : les requêtes suivantes sont immédiatement redirigées vers l'endpoint de basculement configuré.

Le benchmark de juin 2026 d'OpenLegion a mesuré la topologie GPT-4o primaire → Claude 3.5 Sonnet de basculement : P99 est passé de 12 secondes à 3,1 secondes (3,9×) sans aucune modification du code agent.

## Architecture du gateway : plan de données vs plan de contrôle

### Le plan de données : application par requête

Chaque requête d'inférence traverse le plan de données en séquence :

1. **Terminaison TLS** : le processus agent se connecte au gateway via TLS. Pour les déploiements mTLS, l'agent présente également un certificat. mTLS élimine le besoin de tokens d'authentification par requête entre agent et gateway.

2. **Résolution d'identité de charge de travail** : le gateway mappe la charge de travail connectée à une identité tenant. Dans les déploiements mTLS, le SPIFFE SVID intégré dans le certificat client porte l'identité.

3. **Résolution de handle opaque** : le gateway inspecte l'en-tête Authorization sortant pour les patterns de handles `$CRED{}`. Les handles correspondants sont résolus contre le store de secrets de sauvegarde du gateway.

4. **Vérification de quota** : le gateway incrémente le compteur à fenêtre glissante du tenant. Si le compteur dépasse le plafond, le gateway retourne 429 avec des en-têtes `Retry-After`. Aucune connexion en amont n'est ouverte.

5. **Vérification du disjoncteur** : le gateway évalue l'état du circuit de l'endpoint cible. Si le circuit est ouvert, la requête est immédiatement redirigée vers le basculement.

6. **Dispatch en amont** : le gateway ouvre une connexion depuis son propre pool vers l'endpoint en amont et transfère la réponse.

7. **Émission de télémétrie** : à la complétion de la réponse, le gateway écrit un enregistrement de journal OTLP.

Surcoût total sur le chemin chaud : 0,7–2,1 ms. Sur le chemin froid (cache miss) : 2,6–6,6 ms. À une latence d'inférence fournisseur de 500 ms–30 s, le surcoût du chemin chaud est inférieur à 0,5 % du temps aller-retour total.

### Le plan de contrôle : configuration et politique

Le plan de contrôle régit le comportement du plan de données. Responsabilités clés :

**Configuration de l'identité tenant et du quota**, **Topologie des endpoints**, **Portée de permission des handles** : quelles identités tenant sont autorisées à résoudre quels handles. Un tenant avec la portée `openai:read` peut résoudre `$CRED{openai}` mais pas `$CRED{anthropic}`. Cela empêche le mouvement latéral entre tenants.

**Politique d'audit** : quels champs apparaissent dans les enregistrements de journaux OTLP.

L'API du plan de contrôle ne devrait pas être accessible depuis les réseaux côté agent. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, corrigé dans v1.83.0) a démontré ce qui se passe quand le chemin d'écriture de configuration du plan de contrôle est accessible réseau sans autorisation suffisante.

## Topologies de déploiement

### Entrée centralisée

Un seul cluster gateway gère tout le trafic d'inférence sortant de la flotte d'agents. Adapté aux flottes jusqu'à environ 50 agents où la simplicité opérationnelle l'emporte.

### Modèle sidecar

Chaque conteneur agent exécute un processus gateway sur son interface loopback. Le domaine de défaillance est un conteneur agent. Adapté aux grandes flottes (50+ agents) où l'isolation des défaillances par agent est la priorité.

### Proxy natif au mesh

Dans OpenLegion, le proxy d'inférence est un service mesh. Le modèle natif au mesh gère l'identité de charge de travail nativement : chaque conteneur agent reçoit une identité émise par le mesh au moment du démarrage.

## La position d'OpenLegion

L'ensemble de fonctionnalités du LLM gateway — mTLS, application de quota à fenêtre glissante, télémétrie de dépenses OTLP, basculement par disjoncteur — n'est pas une infrastructure optionnelle pour les flottes multi-agents. C'est le plan de données minimal viable.

Trois mesures des tests d'infrastructure d'OpenLegion de juin 2026 quantifient les enjeux :

**Latence tail P99 sans basculement** : 12 secondes sur les déploiements uniquement GPT-4o pendant les événements de capacité fournisseur. Avec Claude 3.5 Sonnet comme basculement par disjoncteur : 3,1 secondes. L'amélioration de 3,9× n'a nécessité aucune modification du code applicatif agent.

**Surface d'exfiltration de clés** : dans une flotte de 20 agents où tous détiennent des clés en clair, un seul agent compromis par injection de prompt (OWASP LLM01:2025) peut exfiltrer les clés. Dans une flotte médiatisée par gateway avec résolution de handle opaque, le même agent compromis ne détient aucun matériel pouvant être exfiltré.

**Couverture OWASP LLM** : l'application de quota par tenant au gateway adresse LLM10:2025 (Consommation non bornée). L'application de portée de handle adresse LLM06:2025 (Agence excessive).

Pour les équipes évaluant [les patterns de gestion des identifiants pour les agents IA](/learn/credential-management-ai-agents), la résolution de handle opaque du gateway est l'implémentation au niveau déploiement du pattern vault-proxy décrit là.

## Comparaison des LLM gateways

| **Capacité** | **Self-hosted (LiteLLM)** | **OpenAI natif** | **OpenLegion mesh proxy** |
|---|---|---|---|
| **Modèle de résolution de clés** | Store de clés Postgres | Service managé | Handle opaque → vault au niveau du fil |
| **Identité de charge de travail mTLS** | Non supporté | Non supporté | SPIFFE SVID par conteneur agent |
| **Application de quota** | Basé sur la configuration, par clé | Limites par org | Compteur à fenêtre glissante, par tenant |
| **Basculement par disjoncteur** | Basé sur plugin | Non disponible | Natif, avec sonde half-open |
| **Télémétrie de dépenses OTLP** | Partielle | Non exportée | Par requête, tous les champs |
| **Isolation du plan de contrôle** | Manuel ; exposé par défaut | Managé | Sous-réseau mesh privé uniquement |
| **Historique CVE (2024–2026)** | GHSA-53mr-6c8q-9789 + autres | Aucun public | Aucun |

## Sélectionner un gateway pour votre flotte

### mTLS vs authentification par bearer token

mTLS (mutual TLS) authentifie à la fois le client (agent) et le serveur (gateway) au niveau du handshake TLS, avant qu'aucun payload HTTP ne soit échangé. Le certificat client porte un SPIFFE SVID — une identité de charge de travail vérifiable cryptographiquement. Aucun bearer token n'est transmis dans les en-têtes.

Pour les flottes multi-agents en production, mTLS avec des SVIDs émis par SPIFFE est le modèle d'authentification correct. Il élimine entièrement la surface de gestion des tokens.

### Compteurs de quota à fenêtre glissante vs fenêtre fixe

Les compteurs à fenêtre fixe se réinitialisent aux limites d'horloge. Un agent peut burster le double de son taux nominal. Les compteurs à fenêtre glissante maintiennent un comptage continu sur un intervalle de temps continu sans limites d'horloge à exploiter. Pour les charges de travail d'inférence, l'application à fenêtre glissante est le modèle correct.

### Exigences de granularité de télémétrie

Les enregistrements OTLP par requête sont le minimum pour une observabilité de flotte utile. Évaluez si le gateway fournit ces champs sur chaque enregistrement : `agent_id`, `model_id`, `input_tokens`, `output_tokens`, `cache_tokens`, `upstream_latency_ms`, `upstream_status`. Les gateways qui agrègent la télémétrie ne peuvent pas supporter la détection d'anomalies de dépenses par agent.

## Démarrer

**Déployez des flottes d'inférence multi-agents avec identité de charge de travail mTLS, application de quota à fenêtre glissante et télémétrie de dépenses OTLP par requête.**
[Commencer sur OpenLegion](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai) | [Comparer LiteLLM vs OpenLegion](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## Foire aux questions

### Qu'est-ce qu'un LLM gateway ?

Un LLM gateway est un reverse-proxy HTTP positionné dans le plan de données entre les processus d'agents IA et les endpoints de fournisseurs de modèles en amont. Il résout les handles de clés opaques au niveau du fil (les processus agents ne détiennent jamais de clés en clair), applique des limites de quota par tenant à fenêtre glissante avant le dispatch en amont, émet de la télémétrie de dépenses OpenTelemetry par requête, et ouvre des disjoncteurs quand les endpoints en amont dépassent les seuils configurés. Ces fonctions opèrent comme des primitives d'infrastructure ne nécessitant aucune modification du code applicatif agent.

### Ai-je besoin d'un LLM gateway si je n'utilise qu'un seul fournisseur de modèles ?

Les flottes mono-fournisseur bénéficient de trois fonctions du gateway : résolution de handle opaque, application de quota par tenant et télémétrie de dépenses OTLP par requête. Le surcoût du chemin chaud est de 0,7–2,1 ms — négligeable par rapport à la latence d'inférence fournisseur de 500 ms à 30 secondes.

### Comment fonctionne le basculement par disjoncteur dans un LLM gateway ?

Le gateway suit les taux d'erreur et la latence P99 par endpoint dans des fenêtres d'observation glissantes. Quand un seuil de défaillance configurable est franchi — par exemple, cinq réponses 5xx consécutives, ou P99 dépassant 8 secondes sur une fenêtre de 30 secondes — le circuit s'ouvre : toutes les requêtes suivantes sont immédiatement transférées vers l'endpoint de basculement configuré. Après une période de refroidissement, le gateway dispatche une sonde half-open vers le primaire. Une sonde réussie ferme le circuit ; une sonde échouée redémarre le refroidissement. Le benchmark de juin 2026 d'OpenLegion a mesuré une réduction de P99 de 12 secondes à 3,1 secondes sur une topologie GPT-4o → Claude 3.5 Sonnet.

### Qu'est-ce que mTLS et pourquoi est-ce important pour les LLM gateways ?

mTLS (mutual TLS) authentifie à la fois le processus agent connectant et le gateway au niveau du handshake TLS, avant qu'aucun payload HTTP ne soit échangé. L'agent présente un certificat client portant un SPIFFE SVID — une identité de charge de travail vérifiable cryptographiquement. Aucun bearer token n'est transmis dans les en-têtes HTTP ; aucun token n'a besoin d'être émis, distribué ou renouvelé. L'identité de charge de travail dérivée du SVID pilote l'application de portée de handle.

### Quelle est la différence entre l'application de quota à fenêtre glissante et à fenêtre fixe ?

Les compteurs à fenêtre fixe se réinitialisent aux limites d'horloge. Un agent peut burster le double de son taux nominal en requêtant à pleine vitesse dans les dernières secondes d'une fenêtre et les premières secondes de la suivante. Les compteurs à fenêtre glissante maintiennent un comptage continu sans limites d'horloge à exploiter. Pour les charges de travail d'inférence, l'application à fenêtre glissante est le modèle correct.

### En quoi la télémétrie OTLP par requête diffère-t-elle du reporting de dépenses agrégé ?

Les enregistrements OTLP OpenTelemetry par requête capturent des champs individuels sur chaque appel d'inférence : identifiant agent, variante de modèle, tokens d'entrée, tokens de sortie, tokens de cache-hit, latence en amont et statut HTTP. Ces enregistrements s'accumulent dans des grands livres de dépenses par agent qui supportent des plafonds de budget quotidiens et mensuels ainsi que la détection d'anomalies de dépenses. Les rapports de dépenses agrégés ne peuvent pas supporter la détection d'anomalies.

### Que ne devrait pas exposer le plan de contrôle du gateway aux réseaux côté agent ?

Le plan de contrôle gère la configuration des quotas, la topologie des endpoints, les portées de permission des handles et la politique d'audit. Il devrait être déployé sur un sous-réseau privé sans chemin d'accès externe. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, corrigé dans v1.83.0) a documenté une autorisation insuffisante sur l'API de gestion. Les réseaux côté agent ne devraient atteindre que le port du plan de données du gateway.

### Comment calibrer les seuils du disjoncteur pour ma flotte ?

Collectez des histogrammes de latence P50, P95 et P99 par endpoint fournisseur sur deux à quatre semaines de trafic de production. Le seuil d'ouverture du disjoncteur devrait être fixé à une valeur P99 clairement dégradée par rapport au SLA normal du fournisseur — typiquement 2–3× le P99 médian. La période de refroidissement avant la sonde half-open devrait dépasser le temps de récupération typique du fournisseur — 30–60 secondes est une base raisonnable.
