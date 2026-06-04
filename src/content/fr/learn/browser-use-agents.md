---
title: "Agents Browser Use — Comment les agents IA contrôlent le web"
description: "Les agents browser use permettent à l'IA de naviguer de façon autonome sur les sites web, remplir des formulaires et extraire des données. Fonctionnement, risques de sécurité et exécution sécurisée en containers isolés."
slug: /learn/browser-use-agents
primary_keyword: browser use agents
secondary_keywords:
  - ai browser automation
  - browser agent python
  - web agent llm
  - headless browser ai agent
  - browser use security
date_published: 2026-05
last_updated: 2026-05-30
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/model-context-protocol
---

# Agents Browser Use : Comment les agents IA naviguent et contrôlent le web

Les agents browser use sont des systèmes IA qui contrôlent de façon autonome un navigateur web — naviguer vers des URLs, cliquer sur des boutons, remplir des formulaires, extraire du contenu et gérer l'authentification — sans intervention humaine à chaque étape. Ils constituent en 2026 la catégorie d'outils d'agents IA connaissant la croissance la plus rapide, portée par des frameworks comme browser-use (96 282 étoiles GitHub en mai 2026).

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce qu'un agent browser use ?**
> Un agent browser use est un agent IA qui pilote programmatiquement un navigateur web headless ou avec interface, en utilisant la traversée DOM, l'analyse de l'arbre d'accessibilité, le grounding par captures d'écran et la sélection d'actions guidée par LLM pour accomplir des tâches web de façon autonome.

## Comment fonctionnent les agents browser use

### Perception : DOM, arbre d'accessibilité et grounding par capture d'écran

Un agent navigateur doit comprendre l'état actuel de la page avant d'agir. Trois stratégies de perception sont couramment utilisées.

**L'extraction DOM** analyse la structure HTML brute de la page. Elle est rapide et efficace en tokens mais échoue sur les contenus rendus sur canvas et les SPAs complexes.

**L'arbre d'accessibilité** lit la couche d'accessibilité intégrée du navigateur, fournissant une vue structurée et sémantique de la page. C'est la méthode de perception principale utilisée par browser-use.

**Le grounding par capture d'écran** capture une image de la page et la transmet à un LLM capable de vision. Il gère les pages où le DOM et l'arbre d'accessibilité sont peu fiables, mais coûte beaucoup plus de tokens par étape.

### Action : clics, saisie, navigation et soumission de formulaires

L'espace d'action d'un agent navigateur est vaste : naviguer vers une URL, cliquer sur un élément, saisir du texte, appuyer sur une touche, faire défiler, sélectionner dans un menu déroulant, télécharger un fichier ou changer d'onglet. Chaque action modifie l'état de la page.

### Mémoire : état de session, cookies et historique de navigation

Les navigateurs maintiennent un état à travers la session de l'agent : cookies d'authentification, localStorage, sessionStorage et onglets ouverts. L'état de session est à la fois une capacité et une surface d'attaque.

## La bibliothèque browser-use

### 96 282 étoiles en moins de 7 mois

browser-use (GitHub : browser-use/browser-use) a atteint 96 282 étoiles et 10 802 forks en mai 2026, lancé le 31 octobre 2024. La bibliothèque abstrait la gestion de session Playwright, l'extraction de l'arbre d'accessibilité et la sérialisation des actions.

### Backend Playwright : comment browser-use contrôle Chromium

browser-use encapsule la bibliothèque d'automatisation Playwright de Microsoft. Il ajoute une couche agent : extraction de l'arbre d'accessibilité, conversion en format efficace en tokens et traduction des décisions d'action LLM en commandes Playwright.

### Intégration LLM : GPT-4o, Claude, Gemini comme couche de raisonnement

browser-use est agnostique en termes de LLM sur la couche de raisonnement. Il supporte OpenAI, Anthropic, Google et tout point de terminaison d'API compatible OpenAI.

## L'avis d'OpenLegion : les agents navigateur sont votre outil le plus risqué

Les agents navigateur sont la catégorie d'outils la plus risquée dans l'IA agentique. Un agent navigateur pouvant cliquer, remplir des formulaires et suivre des redirections a la même surface d'attaque qu'un humain avec un accès complet à internet.

### La démo de vol de credentials en 150 secondes

Des recherches publiquement documentées en 2025 ont démontré qu'un agent navigateur pouvait être manipulé pour voler des credentials en 150 secondes via des instructions cachées sur une page web. La défense est architecturale : si le credential n'existe pas dans le contexte ou la mémoire de processus de l'agent, l'injection ne peut pas l'extraire. Le vault proxy d'OpenLegion garantit que les credentials de session sont injectés au niveau réseau et n'apparaissent jamais dans la fenêtre de contexte de l'agent.

### OWASP LLM08 Excessive Agency et permissions du navigateur

Le top 10 LLM OWASP 2025 classe Excessive Agency (LLM08) comme catégorie de risque majeure. Les agents navigateur sont le risque canonique : un agent avec la permission de naviguer, lire, remplir des formulaires et cliquer sur des boutons peut effectuer des achats, envoyer des messages, supprimer des comptes et exfiltrer des données.

### Comment OpenLegion sandboxe les agents navigateur (Camoufox + Zone 1)

OpenLegion exécute une instance de navigateur Camoufox par agent sur le port :8500, isolée dans le container Docker Zone 1 de chaque agent. Quatre propriétés en résultent : pas d'état de session partagé, résistance aux empreintes, credentials via vault proxy et routage réseau via Mesh Host.

## Patterns d'architecture des agents navigateur

### Headless vs. headed

Le **mode headless** est plus rapide et fonctionne dans des environnements serveur, mais est détectable par les systèmes de protection anti-bots. Camoufox s'exécute en mode headless mais patche les APIs JavaScript ciblées par les scripts de détection headless.

### Gestion des CAPTCHA

Trois approches : navigateurs comportementaux (résistance aux empreintes), services de résolution ($1–3 pour 1 000 résolutions) et fallback human-in-the-loop. OpenLegion supporte la délégation CAPTCHA human-in-the-loop via le tableau de bord.

### Injection de credentials : vault proxy vs. cookies codés en dur

**Pire** : credentials directement dans les instructions. **Mauvais** : variables d'environnement (accessibles via `os.environ`). **Correct** : injection via vault proxy au niveau réseau.

## Agents Browser Use : comparaison d'architectures

| **Dimension** | **OpenLegion** | **browser-use** | **Raw Playwright** | **Stagehand** |
|---|---|---|---|---|
| **Backend d'exécution** | Camoufox (Firefox, résistant aux empreintes) | Playwright (Chromium) | Playwright | Cloud Chromium |
| **Isolation de session** | Container par agent | Processus partagé | Dépend de l'implémentation | Cloud managed |
| **Gestion des credentials** | Injection vault proxy | Passe par la fenêtre de contexte | Implémentation manuelle | Managed |
| **Support CAPTCHA** | Résistance Camoufox + human-in-loop | Aucun intégré | Aucun intégré | Service de résolution |
| **Sandboxing container** | Zone 1 Docker, non-root | Aucun | Aucun | Cloud sandbox |
| **Étoiles GitHub** | — | 96 282 (mai 2026) | N/A | ~9 000 |
| **Licence** | BSL 1.1 | MIT | Apache 2.0 | MIT |

## Quand utiliser les agents navigateur (et quand éviter)

**Cas d'usage légitimes** : recherche web et extraction de données, automatisation de formulaires pour vos propres services, monitoring et tests. **Cas d'usage nécessitant des contrôles supplémentaires** : sessions authentifiées, sites financiers. **Cas d'usage à éviter sans sandboxing strict** : URLs non fiables fournies par les utilisateurs.

## Démarrer avec des agents navigateur sécurisés sur OpenLegion

**Exécuter des agents navigateur dans des containers isolés avec des credentials via vault proxy et des contrôles réseau par agent.**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai) | [Voir la plateforme](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Que sont les agents browser use ?

Les agents browser use sont des systèmes IA qui contrôlent de façon autonome un navigateur web via traversée DOM, analyse de l'arbre d'accessibilité et sélection d'actions guidée par LLM. La bibliothèque browser-use (96 282 étoiles GitHub, licence MIT, lancée en octobre 2024) est l'implémentation open source la plus adoptée.

### Comment fonctionne la bibliothèque browser-use ?

browser-use encapsule Playwright de Microsoft pour donner à un LLM une vue structurée de l'arbre d'accessibilité du navigateur, puis convertit les décisions d'action LLM en commandes Playwright. Elle supporte GPT-4o, Claude, Gemini et les LLMs compatibles, est sous licence MIT et nécessite environ 20 lignes de Python pour un agent fonctionnel.

### Quels sont les risques de sécurité des agents browser use ?

Trois risques principaux : injection de prompt via le contenu web (une démo 2025 a montré un vol de credentials en 150 secondes), fuite de credentials (si les cookies de session sont en mémoire de processus de l'agent) et excessive agency (OWASP LLM08:2025). L'exfiltration par prévisualisation de lien en zéro clic a également été démontrée.

### Comment exécuter des agents navigateur de façon sécurisée ?

Quatre contrôles sont nécessaires : isolation des containers, credentials via vault proxy, contrôles d'egress réseau et limites de budget par agent. Le service navigateur Camoufox d'OpenLegion implémente les quatre par défaut dans des containers Docker Zone 1.

### Qu'est-ce que Camoufox et pourquoi OpenLegion l'utilise ?

Camoufox est un navigateur headless basé sur Firefox qui patche les APIs JavaScript pour présenter des profils matériels réalistes plutôt que des signatures headless. OpenLegion exécute une instance Camoufox par agent sur le port :8500 dans chaque container Docker Zone 1.

### Quelle est la différence entre browser-use et Playwright pour les agents IA ?

Playwright est une bibliothèque d'automatisation bas niveau sans concept d'agent IA. browser-use ajoute une couche agent : conversion de l'état du navigateur en format lisible par LLM, traduction des actions LLM en commandes Playwright et décomposition de tâches multi-étapes entre pages.

### Les agents browser use peuvent-ils gérer les connexions et sessions authentifiées ?

Oui, mais la gestion de sessions authentifiées est l'une des opérations les plus risquées. OpenLegion injecte les credentials de session via vault proxy au niveau réseau — l'agent navigue dans des sessions authentifiées sans que les credentials sous-jacents n'apparaissent jamais dans son contexte accessible.

### Comment les agents navigateur gèrent-ils les CAPTCHA ?

Trois approches : navigateurs comportementaux (résistance aux empreintes), services de résolution ($1–3 pour 1 000, 10–60 secondes de latence) et fallback human-in-the-loop. OpenLegion supporte la délégation CAPTCHA human-in-the-loop via le tableau de bord.
