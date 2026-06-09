---
title: Alternative Mastra — Plateforme d’Agents IA Axée Sécurité
description: Mastra est un framework TypeScript avec double licence, RBAC derrière un répertoire ee/ propriétaire et CVE-2025-61685 exposant des credentials. Comparez les alternatives Mastra.
slug: /comparison/mastra
primary_keyword: alternative mastra
secondary_keywords:
  - openlegion vs mastra
  - mastra sécurité
  - mastra framework agent typescript
  - mastra enterprise edition
last_updated: "2026-05-26"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
---

# Alternative Mastra : Plateforme Axée Sécurité vs Framework TypeScript

Mastra est un framework d’agents TypeScript avec 24 329 étoiles GitHub de l’équipe Gatsby — mais CVE-2025-61685 (CVSS 6.5) expose les fichiers `~/.aws` de credentials via une injection de prompt Cursor IDE, le RBAC et l’auth sont verrouillés derrière un répertoire `ee/` propriétaire non disponible sous Apache 2.0, et deux PRs non fusionnées laissent des vulnérabilités open-redirect et CSRF OAuth non corrigées dans la pile d’auth enterprise (mai 2026). Une alternative Mastra pour les équipes orientées sécurité nécessite l’isolation par vault proxy, pas des credentials en variables d’environnement.

<!-- SCHEMA: DefinitionBlock -->

> **Qu’est-ce que Mastra ?**
> Mastra est un framework d’agents TypeScript open source de Kepler Software (l’équipe derrière Gatsby) avec 24 329 étoiles GitHub, publié en août 2024. Il fournit orchestration de workflows, appels d’outils et primitives RAG pour les développeurs JavaScript et TypeScript sous double licence — Apache 2.0 pour le cœur et licence propriétaire pour le répertoire `ee/` enterprise contenant l’auth, le RBAC et l’application des permissions d’adaptateurs.

## Pourquoi les développeurs cherchent une alternative Mastra

### CVE-2025-61685 : Exposition de fichiers credentials via le serveur MCP Docs

CVE-2025-61685 (CVSS 6.5, CWE-548, 24 septembre 2025) est une traversée de répertoire dans `@mastra/mcp-docs-server` versions ≤0.13.8. Découverte par Liran Tal, la vulnérabilité permet l’injection de prompt via Cursor IDE pour contourner les protections dans `readMdxContent` via `findNearestDirectory`, atteignant des chemins filesystem hors du répertoire docs prévu.

Le rayon d’explosion pratique est étroit mais sévère pour les machines des développeurs : la traversée expose `~/.aws/credentials`, `~/.config/` (tokens de compte de service) et `~/.cursor/` (configuration IDE). Tout développeur exécutant une version affectée de `@mastra/mcp-docs-server` avec Cursor IDE est exposé à la lecture de fichiers credentials via des prompts malveillants.

Mastra a corrigé la vulnérabilité dans la version 0.17.0. Les équipes exécutant encore ≤0.13.8 avec le serveur MCP docs actif restent exposées.

### Double licence : fonctionnalités de sécurité derrière le paywall `ee/`

La licence Apache 2.0 de Mastra couvre le framework principal. Le répertoire `ee/` — contenant les intégrations d’auth, le RBAC et l’application des permissions d’adaptateurs — est propriétaire et non disponible sous la licence open source. Cela crée trois lacunes concrètes :

**Le RBAC est un add-on enterprise.** Le contrôle d’accès basé sur les rôles pour les permissions d’agents n’est pas disponible sans l’édition enterprise. Les équipes qui doivent restreindre ce que des agents spécifiques peuvent faire doivent payer pour la mise à niveau `ee/`.

**Les permissions d’adaptateurs sont verrouillées.** Le contrôle granulaire sur les adaptateurs (connexions de base de données, intégrations API, accès aux outils) requiert le tier propriétaire.

**Les intégrations d’auth sont propriétaires.** Le répertoire `ee/` inclut l’intégration WorkOS AuthKit (`@workos/authkit-session`) et les flux OAuth `better-auth`. Le cœur open source n’a pas de primitives d’auth.

### PRs de sécurité non fusionnées dans la pile d’auth enterprise

Deux vulnérabilités de sécurité dans les dépendances d’auth enterprise de Mastra restent ouvertes au 26 mai 2026 :

**CVE-2026-42565 (CVSS 4.3)** : Redirection ouverte dans `@workos/authkit-session`. Un attaquant peut créer une URL de redirection qui contourne la validation d’origine dans le gestionnaire de session WorkOS AuthKit, permettant du phishing via des chaînes de redirection de domaines de confiance.

**GHSA-wxw3-q3m9-c3jr (CVSS 5.3)** : CSRF OAuth dans `better-auth`. La bibliothèque `better-auth` utilisée dans la pile d’auth enterprise de Mastra a une vulnérabilité CSRF non corrigée dans la gestion du callback OAuth. Une requête cross-site falsifiée contre le callback OAuth peut permettre à un attaquant d’associer sa session au compte d’une victime.
## Analyse OpenLegion : Trois lacunes de sécurité structurelles

Mastra est un framework TypeScript bien conçu avec de vraies forces pour les équipes JS/TS. Mais trois lacunes de sécurité structurelles s’accumulent pour les équipes déployant des agents en production :

**Exposition des credentials par conception.** Les agents Mastra reçoivent les credentials en variables d’environnement. CVE-2025-61685 a démontré que la toolchain environnante peut atteindre ces credentials via la traversée de chemin. Le vault proxy d’OpenLegion injecte les credentials au niveau réseau : aucun processus d’agent ne reçoit jamais une clé API en clair, rendant l’exfiltration de type `~/.aws` structurellement impossible.

**La sécurité comme mise à niveau enterprise.** RBAC, permissions d’adaptateurs et intégrations d’auth requièrent le tier propriétaire `ee/`. Les permissions blackboard d’OpenLegion et le vault proxy sont des fonctionnalités core disponibles pour tous les utilisateurs.

**Vulnérabilités d’auth non corrigées dans le tier payant.** CVE-2026-42565 et GHSA-wxw3-q3m9-c3jr se trouvent dans les dépendances d’auth du répertoire `ee/` enterprise. Le bilan CVE zéro d’OpenLegion (mai 2026) reflète une architecture où les credentials ne sont jamais détenus par les agents.
## Mastra vs OpenLegion : Comparaison côte à côte

| **Dimension** | **Mastra** | **OpenLegion** |
|---|---|---|
| **Support linguistique** | TypeScript uniquement | Python (agents) ; interfaces d’outils pour tout langage |
| **Licence** | Apache 2.0 (cœur) + `ee/` propriétaire | PolyForm Perimeter License 1.0.1 |
| **Étoiles GitHub** | 24 329 (mai 2026) | Pré-lancement |
| **Modèle de credentials** | Variables d’environnement — agents détiennent les clés | Vault proxy — agents ne détiennent jamais les clés |
| **Isolation des agents** | Niveau processus, pas de frontière container | Containers Docker obligatoires par agent |
| **RBAC** | Tier propriétaire `ee/` uniquement | Permissions blackboard par agent (tous les utilisateurs) |
| **Bilan CVE** | CVE-2025-61685 (CVSS 6.5) + 2 PRs ouvertes | 0 CVE signalés |
| **Auth** | WorkOS AuthKit / better-auth (uniquement `ee/`) | Vault proxy (pas de couche d’auth nécessaire) |
| **Contrôles budgétaires** | Aucun intégré | Plafonds quotidiens/mensuels par agent |
| **Multi-agents** | Orchestration de workflows, appels d’outils | Blackboard + pub/sub + handoff mesh |
| **Issues ouvertes** | 433 (26 mai 2026) | Pré-lancement |
## TypeScript uniquement : Ce que cela signifie en pratique

### Pas de support Python, Go ou Java

Mastra est TypeScript-first par conception et actuellement TypeScript uniquement. Pour les équipes avec des bases de code polyglottes ou une infrastructure Python ML/data existante, adopter Mastra signifie soit réécrire la logique d’agents en TypeScript, soit accepter que la coordination d’agents ne peut pas traverser les langages.

Ce n’est pas une lacune temporaire — c’est un choix architectural. Pour les équipes Python-first, Mastra n’est pas une option viable quelle que soit la posture de sécurité. OpenLegion, LangGraph, CrewAI et AutoGen supportent tous Python nativement.

Pour les équipes JS/TS où toute la stack est déjà TypeScript, l’expérience développeur de Mastra est réellement excellente. L’inférence de types native pour les schémas d’outils et les patterns `async/await` familiers rendent le développement d’agents naturel pour le langage. Le compromis est correct : accepter les credentials en variables d’environnement et le RBAC verrouillé derrière `ee/` — à condition que CVE-2025-61685 soit mitigé par la mise à niveau vers 0.17.0.

## Architecture de sécurité : Vault Proxy vs Variables d’environnement

### Comment Mastra gère les credentials

Les agents Mastra reçoivent les clés API LLM et les credentials de service via des variables d’environnement. Les credentials existent dans `process.env` et sont accessibles à tout code s’exécutant dans le processus d’agent, y compris les callbacks d’outils et les gestionnaires de serveur MCP.

CVE-2025-61685 a démontré le risque concret : une traversée de répertoire dans `@mastra/mcp-docs-server` pouvait atteindre `~/.aws/credentials` car l’environnement du processus était accessible depuis le même contexte d’exécution que le serveur vulnérable.

### Comment OpenLegion gère les credentials

Le vault proxy d’OpenLegion se situe au niveau réseau entre les agents et les fournisseurs LLM. L’hôte mesh intercepte les appels API, récupère le credential approprié dans le vault, l’injecte dans l’en-tête de la requête et le transmet au fournisseur. Le processus d’agent ne reçoit jamais de chaîne de credential.

Cela rend l’exfiltration de credentials dans le modèle d’attaque CVE-2025-61685 structurellement impossible. Pour une analyse approfondie, voir [Sécurité des agents IA : isolation des credentials et durcissement des containers](/learn/ai-agent-security).
## OpenLegion comme alternative à Mastra

### Ce qu’OpenLegion fournit

Coordination multi-agents via état blackboard, événements pub/sub et handoff mesh. Injection de credentials via vault proxy où aucun processus d’agent ne détient de clés API. Isolation Docker par agent avec exécution non-root et no-new-privileges. Plafonds budgétaires quotidiens et mensuels par agent. 100+ fournisseurs LLM via LiteLLM. Templates de flotte pour les déploiements répétables.

Pour les équipes évaluant [ce qu’une plateforme d’agents IA apporte au-delà d’un framework](/learn/ai-agent-platform), la comparaison de plateformes couvre l’ensemble des compromis.

### Compromis honnêtes

Pas de SDK TypeScript — Python uniquement. Les équipes TypeScript ne peuvent pas utiliser OpenLegion sans agents Python ou une couche de pontage. Communauté plus petite que les 24 329 étoiles de Mastra. Pas de visualisation de workflow intégrée.

### Qui devrait considérer OpenLegion plutôt que Mastra

**Les équipes Python-first ou polyglottes** pour qui le support TypeScript uniquement est un bloqueur.

**Les équipes où l’isolation des credentials est une exigence absolue** — audits de sécurité mandatant que les agents ne peuvent pas détenir des clés API en clair.

**Les équipes nécessitant du RBAC sans mise à niveau enterprise** — déploiements multi-agents où restreindre les accès des agents spécifiques est une exigence de base.

**Les équipes bloquées par la posture CVE ouverte de Mastra** — si CVE-2025-61685 et les deux PRs d’auth non fusionnées créent un risque inacceptable, une architecture zéro CVE change cette évaluation.

Voir aussi : [OpenLegion vs LangGraph — orchestration avec état et historique CVE comparés](/comparison/langgraph), [OpenLegion vs CrewAI — coordination d’agents basée sur les rôles](/comparison/crewai) et [OpenLegion vs AutoGen — patterns multi-agents](/comparison/autogen). Pour un panorama complet, voir [Comparaison des frameworks d’agents IA 2026](/learn/ai-agent-frameworks).

<!-- SCHEMA: FAQPage -->

## Foire aux questions

### Qu’est-ce que Mastra et qui l’a créé ?

Mastra est un framework d’agents TypeScript avec 24 329 étoiles GitHub développé par Kepler Software — l’équipe derrière Gatsby — depuis août 2024. Il fournit orchestration de workflows, appels d’outils, primitives RAG et coordination multi-agents pour les développeurs TypeScript sous double licence : Apache 2.0 pour le cœur et licence propriétaire pour le répertoire `ee/` enterprise.

### Qu’est-ce que CVE-2025-61685 dans Mastra ?

CVE-2025-61685 (CVSS 6.5, 24 septembre 2025) est une traversée de répertoire dans `@mastra/mcp-docs-server` ≤0.13.8, découverte par Liran Tal. L’injection de prompt via Cursor IDE contourne les protections dans `readMdxContent` via `findNearestDirectory`, exposant `~/.aws/credentials`, `~/.config/` et `~/.cursor/`. Mastra a corrigé dans la version 0.17.0 ; les équipes exécutant ≤0.13.8 avec le serveur MCP docs actif restent exposées.

### Mastra a-t-il du RBAC dans le tier gratuit ?

Non. Le RBAC, les permissions d’adaptateurs et les intégrations d’auth se trouvent dans le répertoire `ee/` propriétaire de Mastra, non disponible sous la licence Apache 2.0 open source. OpenLegion fournit des permissions blackboard par agent et l’isolation vault proxy à tous les utilisateurs comme fonctionnalités core de la plateforme, pas un tier payant.

### Quels sont les problèmes de sécurité Mastra non corrigés en mai 2026 ?

Deux PRs de sécurité restent ouvertes dans la pile d’auth enterprise de Mastra : CVE-2026-42565 (CVSS 4.3, redirection ouverte dans `@workos/authkit-session`) et GHSA-wxw3-q3m9-c3jr (CVSS 5.3, CSRF OAuth dans `better-auth`). Les deux affectent le répertoire `ee/` enterprise. Aucun n’a été fusionné au 26 mai 2026.

### Les développeurs TypeScript peuvent-ils utiliser OpenLegion ?

Les agents OpenLegion sont Python uniquement. Les équipes TypeScript auraient besoin d’exécuter des agents Python ou de construire un outillage TypeScript appelant les APIs OpenLegion — il n’y a pas de SDK TypeScript natif. Pour les équipes TypeScript-first, Mastra (patché vers 0.17.0+), LangGraph ou AutoGen sont des choix plus naturels. OpenLegion convient quand les exigences d’isolation de sécurité l’emportent sur les préférences linguistiques.

### Mastra est-il suffisamment stable pour la production ?

Mastra a 24 329 étoiles GitHub et un développement actif depuis août 2024, avec 433 issues ouvertes au 26 mai 2026. Les équipes adoptant Mastra pour la production devraient ancrer les versions stables, mettre à niveau `@mastra/mcp-docs-server` vers 0.17.0+ et planifier les correctifs en amont pour CVE-2026-42565 et GHSA-wxw3-q3m9-c3jr avant de s’appuyer sur les fonctionnalités d’auth enterprise.

## Commencer

OpenLegion est gratuit à essayer. [Démarrer sur app.openlegion.ai](https://app.openlegion.ai) ou [lire la documentation de la plateforme](https://docs.openlegion.ai). Déjà en train d’évaluer des frameworks TypeScript ? Voir [OpenLegion vs LangGraph — architecture de sécurité et historique CVE comparés](/comparison/langgraph) pour une comparaison d’alternative native Python.
