---
title: Alternative LiteLLM — Isolation Vault vs Store de Credentials
description: "OpenLegion vs LiteLLM : isolation en coffre-fort vs store centralisé de credentials. CVE-2026-42208 (CVSS 9.3) injection SQL a exposé la base de credentials LiteLLM. Isolation distribuée vs agrégation gateway."
slug: /comparison/litellm
primary_keyword: litellm alternative
secondary_keywords:
  - openlegion vs litellm
  - sécurité litellm
  - litellm cve
  - alternative proxy llm
  - gateway litellm
date_published: 2026-05
last_updated: "2026-11-03"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
---

# Alternative LiteLLM : Vault Distribué OpenLegion vs Gateway Centralisé

OpenLegion vs LiteLLM représente le compromis fondamental de sécurité entre des credentials conservés dans un coffre-fort et injectés hors du modèle, et l'agrégation de credentials via un gateway LLM centralisé. LiteLLM excelle en tant que gateway de fournisseurs unifié avec 62 615 étoiles GitHub, un suivi des coûts et la prise en charge de plus de 100 fournisseurs LLM, mais a subi CVE-2026-42208 (CVSS 9.8 CRITIQUE, inscrite au catalogue Known Exploited Vulnerabilities de la CISA) où une injection SQL a exposé l'intégralité de la base de credentials à des attaquants non authentifiés. Chez OpenLegion, les credentials vivent dans un coffre-fort et sont injectés au moment de l'appel, le modèle ne détenant qu'une référence — il n'y a aucune base de credentials à lire.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce que LiteLLM et comment se compare-t-il à OpenLegion ?**
> LiteLLM est un gateway LLM centralisé avec plus de 62 615 étoiles GitHub qui agrège les credentials de fournisseurs dans une base de données pour un accès unifié, un suivi des coûts et un routage des fournisseurs. OpenLegion est une plateforme multi-agent axée sur la sécurité où les credentials vivent dans un coffre-fort et sont injectés hors du modèle, éliminant les bases de credentials comme cibles d'attaque. LiteLLM offre une unification du gateway ; OpenLegion offre une isolation architecturale de sécurité.

## TL;DR

| **Dimension** | **LiteLLM** | **OpenLegion** |
|---|---|---|
| **Objectif principal** | Gateway LLM centralisé et proxy de fournisseurs | Plateforme multi-agent axée sécurité avec credentials en coffre-fort |
| **Architecture** | Base de credentials centralisée avec routage API | Credentials en coffre-fort, injectés hors du modèle |
| **Stockage des credentials** | Toutes les clés de fournisseurs dans une base centralisée | Le coffre-fort injecte au moment de l'appel ; le modèle ne détient qu'une référence |
| **CVEs récents** | Plus de 30 CVEs en 2026, dont injection SQL CRITIQUE | s/o — plateforme hébergée |
| **Isolation de sécurité** | Gateway partagé avec contrôles d'accès | Exécution en bac à sable par tâche, credentials en coffre-fort |
| **Support des fournisseurs** | Plus de 100 LLMs avec interface API unifiée | Préréglages de modèles Smartest, Smart et Normal |
| **Suivi des coûts** | Suivi des dépenses intégré et budgétisation | Budgets en crédits par agent, coût par tâche visible |
| **Modèle de déploiement** | Service gateway unique | Application web hébergée ; les agents sont des enregistrements durables |
| **Sécurité des conteneurs** | Exécution root par défaut, pas de sandboxing | Exécutions en bac à sable, aucun accès réseau par défaut |
| **Surface d'attaque** | Cible centrale de credentials à haute valeur | Aucun store de credentials qu'un agent puisse atteindre |

## Gateway Centralisé vs Vault Distribué

### Agrégation de Credentials vs Injection Vault

**LiteLLM** centralise tous les credentials de fournisseurs LLM dans une base de données unique accessible via des endpoints API. Cela crée une interface unifiée où les applications peuvent accéder à OpenAI, Anthropic, Google, Cohere et plus de 100 autres fournisseurs via une API cohérente. L'approche centralisée simplifie la gestion des credentials pour les équipes utilisant plusieurs fournisseurs LLM.

**OpenLegion** conserve l'accès aux credentials dans un coffre-fort qui n'est jamais recopié dans un emplacement accessible aux agents. Lorsque les agents effectuent des appels, le credential est injecté hors du modèle, qui ne détient jamais qu'une référence. Les agents ne reçoivent jamais de clés API en clair, rendant l'exposition des credentials via des agents compromis structurellement impossible.

### Cible à Haute Valeur vs Risque Distribué

**Les gateways centralisés** deviennent des cibles d'attaque à haute valeur car une compromission réussie expose simultanément tous les credentials organisationnels. CVE-2026-42208 a démontré ce risque lorsqu'une injection SQL a exposé l'intégralité de la base de credentials LiteLLM à des attaquants non authentifiés.

**Les architectures distribuées** répartissent le risque de credentials sur plusieurs instances vault et conteneurs d'agents.

## Le Cluster CVE 2026 : Quand la Centralisation Devient une Responsabilité

### CVE-2026-42208 : Injection SQL CRITIQUE

**Sévérité CVSS 9.8 CRITIQUE** (score CVSS 3.1 de la NVD ; le score CVSS 4.0 de GitHub est de 9.3) où une injection SQL dans la vérification des clés API de LiteLLM a exposé l'intégralité de la base de credentials à des attaquants non authentifiés. Elle touchait les versions 1.81.16 à 1.83.6 et a été corrigée dans la v1.83.7. La CISA l'a ajoutée au catalogue Known Exploited Vulnerabilities le 8 mai 2026, confirmant son exploitation active.

**Exposition complète des credentials** permettait aux attaquants de lire et modifier toutes les clés API stockées pour OpenAI, Anthropic, Google, Cohere et d'autres fournisseurs.

**Accès non authentifié** signifiait qu'aucun compte utilisateur ni clé API valide n'était nécessaire pour exploiter la vulnérabilité.

### Le Modèle CVE 2026 : Cinq Vulnérabilités en Quatre Mois

**Cinq CVEs graves** ont été publiés entre avril et mai 2026, et ne représentent qu'une partie du total de l'année : la NVD recense plus de 30 CVEs LiteLLM publiés en 2026 :

1. **CVE-2026-42208** (CVSS 9.8 CRITIQUE) - Injection SQL exposant la base de credentials à des attaquants non authentifiés. Corrigée dans la v1.83.7.
2. **CVE-2026-35029** (CVSS 8.8 ÉLEVÉE) - Absence d'autorisation administrateur sur `/config/update` : tout utilisateur authentifié pouvait modifier la configuration du proxy et enregistrer des handlers pass-through pointant vers du code Python contrôlé par l'attaquant, obtenant une RCE. Corrigée dans la v1.83.0.
3. **CVE-2026-35030** (CVSS 9.1 CRITIQUE) - Collision de clé dans le cache userinfo OIDC : lorsque l'authentification JWT est activée (ce n'est pas le cas par défaut), un token forgé dont les 20 premiers caractères correspondent au token en cache d'un utilisateur légitime hérite de l'identité de cet utilisateur. Corrigée dans la v1.83.0.
4. **CVE-2026-40217** (CVSS 8.8 ÉLEVÉE) - Exécution de code par réécriture de bytecode sur `/guardrails/test_custom_code`, une évasion de sandbox dans le guardrail de code personnalisé. Corrigée dans la v1.83.10.
5. **CVE-2026-42203** (CVSS 8.8 ÉLEVÉE) - Injection de templates côté serveur (SSTI) RCE sur `/prompts/test` : les templates de prompts étaient rendus sans sandbox, si bien que tout détenteur d'une clé API valide du proxy pouvait exécuter du code dans le processus du proxy. Versions 1.80.5 à 1.83.6 touchées ; corrigée dans la v1.83.7.

## Sécurité des Conteneurs : Exécution Root vs Isolée

### Exécution Root par Défaut de LiteLLM

**Déploiement en utilisateur root** par défaut dans l'image Docker officielle de LiteLLM sans séparation des privilèges ni mécanismes de sandboxing.

### Isolation Obligatoire d'OpenLegion

**Exécution éphémère** : chaque tâche s'exécute à la demande puis s'arrête, sans processus d'agent permanent d'où escalader.

**Contraintes budgétaires** : un budget en crédits par agent, mesuré à $0,001 le crédit, empêche les dépenses incontrôlées.

**Isolation en bac à sable** : le code que l'agent écrit tourne sans accès réseau par défaut.

**Coordination médiée** : le travail circule objectifs → tâches → agents, et chaque délégation est vérifiée et enregistrée.

## Point de Vue d'OpenLegion

LiteLLM vs OpenLegion représente le compromis classique sécurité/commodité dans l'infrastructure IA. Les 62 615 étoiles de LiteLLM et la prise en charge de plus de 100 fournisseurs montrent que les gateways LLM centralisés résolvent de vrais défis de productivité.

Mais le cluster CVE 2026 expose les risques systématiques de l'agrégation de credentials. CVE-2026-42208 (CVSS 9.8 CRITIQUE, activement exploitée selon la CISA) a prouvé que l'injection SQL peut exposer l'intégralité des stores de credentials organisationnels.

Le coffre-fort de credentials d'OpenLegion élimine entièrement le risque d'agrégation. Aucune base de données ne stocke les clés API où elles pourraient être exposées via injection SQL, contournement d'authentification ou évasion de bac à sable.

Choisissez LiteLLM pour la gestion centralisée des fournisseurs avec un suivi unifié des coûts. Choisissez OpenLegion pour les déploiements d'agents axés sécurité où l'isolation des credentials est essentielle.

## Choisir LiteLLM vs Choisir OpenLegion

### Choisir LiteLLM quand l'unification du gateway est la priorité

Votre équipe a besoin d'une intégration simplifiée des fournisseurs avec un accès API unifié à plus de 100 fournisseurs LLM.

### Choisir OpenLegion quand la sécurité des credentials est essentielle

L'agrégation de credentials crée un risque inacceptable où la compromission d'un composant pourrait exposer toutes les clés API organisationnelles.

## Migration d'un Gateway Centralisé vers un Proxy Vault

### Chemin de Migration LiteLLM vers OpenLegion

**Les configurations de fournisseurs** cessent d'être à votre charge : OpenLegion choisit les modèles par préréglage — Smartest, Smart ou Normal.

**La migration des credentials** améliore la sécurité en passant du stockage en base de données centralisée à des credentials en coffre-fort injectés hors du modèle.

Pour un aperçu plus large de [l'architecture de sécurité des agents IA](/learn/ai-agent-security), l'isolation des credentials est le différenciateur de sécurité le plus significatif d'OpenLegion.

<!-- SCHEMA: FAQPage -->

## Foire Aux Questions

### Qu'est-ce que LiteLLM vs OpenLegion ?

LiteLLM est un gateway LLM centralisé avec plus de 62 615 étoiles GitHub qui agrège les credentials dans une base de données pour un accès unifié à plus de 100 fournisseurs LLM. OpenLegion est une plateforme multi-agent axée sécurité où les credentials vivent dans un coffre-fort et sont injectés hors du modèle.

### Quelles sont les vulnérabilités de sécurité récentes de LiteLLM ?

CVE-2026-42208 (CVSS 9.8 CRITIQUE) permettait à une injection SQL non authentifiée de lire, et potentiellement modifier, l'intégralité de la base de credentials via des en-têtes Authorization manipulés. Elle touchait les versions 1.81.16 à 1.83.6, a été corrigée dans la v1.83.7 et figure au catalogue Known Exploited Vulnerabilities de la CISA. D'autres CVEs graves de 2026 incluent l'absence d'autorisation administrateur sur /config/update permettant une RCE (CVE-2026-35029), une collision de clé dans le cache OIDC permettant d'usurper l'identité d'un autre utilisateur lorsque l'authentification JWT est activée (CVE-2026-35030), une évasion de sandbox dans le guardrail de code personnalisé (CVE-2026-40217) et une SSTI RCE sur /prompts/test (CVE-2026-42203). La NVD recense plus de 30 CVEs LiteLLM publiés en 2026.

### Comment gèrent-ils les credentials des fournisseurs LLM ?

LiteLLM stocke tous les credentials dans une base de données centralisée accessible via des endpoints API. Le coffre-fort d'OpenLegion injecte les credentials au moment de l'appel, hors du modèle, qui ne détient jamais qu'une référence.

### Lequel est plus sûr pour la production ?

LiteLLM agrège tous les credentials créant une cible d'attaque à haute valeur prouvée vulnérable à l'injection SQL CRITIQUE. OpenLegion conserve les credentials dans un coffre-fort que le modèle ne lit jamais et donne à chaque tâche sa propre exécution en bac à sable.

### Quelles sont les différences de déploiement ?

LiteLLM s'exécute en root dans l'image Docker par défaut sans sandboxing. OpenLegion est une application web hébergée sans rien à déployer : chaque tâche s'exécute à la demande dans un bac à sable sans accès réseau par défaut.

### Puis-je migrer de LiteLLM vers OpenLegion ?

Oui. Il n'y a aucune configuration de fournisseur à reprendre, puisque les modèles sont choisis par préréglage — Smartest, Smart ou Normal.

**Essayez OpenLegion dès aujourd'hui.**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai) | [Comparer l'architecture de sécurité des agents IA](/learn/ai-agent-security)
