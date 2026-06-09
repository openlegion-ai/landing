---
title: Architecture des systèmes multi-agents - Design, topologie et sécurité
description: L'architecture des systèmes multi-agents définit comment les agents autonomes communiquent, coordonnent et maintiennent les limites de confiance. Couvre les topologies, les protocoles inter-agents et la conception de sécurité en production.
slug: /learn/multi-agent-systems
primary_keyword: architecture des systèmes multi-agents
secondary_keywords:
  - conception de système multi-agent
  - protocoles de communication agent
  - modèles de topologie agent
  - protocole a2a
  - sécurité multi-agent
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /comparison/langgraph
  - /comparison/autogen
---

# Architecture des systèmes multi-agents: topologies de conception, protocoles de communication et limites de confiance

Un système multi-agent est un réseau d'agents IA autonomes qui coordonnent pour accomplir des tâches qu'aucun agent seul ne peut gérer. Les décisions architecturales prises lors de la conception, à savoir la topologie, le protocole de communication, le modèle de partage d'état et le placement des limites de confiance, déterminent si le système évolue gracieusement ou échoue de façon catastrophique en production. Une topologie en étoile avec un état partagé crée un point de défaillance unique; un couplage serré entre agents signifie qu'un composant compromis peut pivoter vers d'autres; la mémoire de processus partagée crée des conditions de course qui apparaissent sous forme de CVEs.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce qu'un système multi-agent?**
> Un système multi-agent est un réseau de deux agents IA autonomes ou plus qui communiquent, coordonnent et agissent collectivement pour accomplir des tâches au-delà de la capacité d'un seul agent, défini par sa topologie (comment les agents sont connectés), son protocole de communication (comment les agents échangent des informations), son modèle de partage d'état et son placement des limites de confiance.

## Propriétés architecturales fondamentales

### Autonomie des agents vs coordination: la tension fondamentale

Chaque agent dans un système multi-agent a sa propre fenêtre de contexte, son ensemble d'outils et son processus de décision. L'autonomie signifie que les agents peuvent agir sans supervision constante. La coordination signifie que les agents doivent s'aligner sur des objectifs partagés, transmettre du travail et intégrer des résultats. L'architecture résout cette tension: le couplage lâche (les agents n'interagissent que via un bus de messages contrôlé) préserve l'autonomie; le couplage serré réduit la contenabilité du rayon d'explosion.

### Passage de messages vs mémoire partagée: deux modèles de communication

**Passage de messages**: Les agents communiquent en envoyant des messages discrets via une couche de coordination. Ce modèle est plus difficile à déboguer mais plus facile à sécuriser.

**Mémoire partagée**: Les agents accèdent directement à un magasin de données commun. Sous accès concurrent, l'état mutable partagé crée des conditions de course. CVE-2025-64168 (Agno, CVSS 7.1, octobre 2025) en est un exemple: sous une haute concurrence asynchrone, le session_state partagé entre agents a été assigné à la mauvaise session utilisateur.

### Couplage serré vs couplage lâche

Couplage serré: L'agent A appelle directement l'API de l'agent B. La défaillance d'un service se propage au suivant. Couplage lâche: L'agent A écrit sa sortie dans une clé blackboard. L'agent B s'abonne à cette clé. La défaillance de l'agent B ne bloque pas l'agent A.

## Modèles de topologie multi-agent

### Topologie en étoile: hub-and-spoke avec un agent superviseur

Dans la topologie en étoile, un agent superviseur central coordonne tous les agents travailleurs. AutoGen GroupChat, le Manager de CrewAI et le modèle superviseur de LangGraph implémentent tous la topologie en étoile. La topologie en étoile crée un point de défaillance unique: si le superviseur est compromis par une injection de prompt, il peut émettre des instructions malveillantes à tous les agents travailleurs.

### Topologie en maillage: communication agent pair à pair

Dans la topologie en maillage, les agents communiquent directement sans coordinateur central. Dans un maillage complet de N agents, il y a N*(N-1)/2 canaux de communication potentiels, chacun une surface d'attaque potentielle.

### Topologie hiérarchique: équipes imbriquées et délégation de sous-agents

La topologie hiérarchique organise les agents en équipes imbriquées. Le risque: un coordinateur de niveau intermédiaire compromis peut émettre des instructions malveillantes à tous les agents qu'il gère.

### Topologie plate/flotte: agents de même rang coordonnant via un bus partagé

La topologie de flotte plate utilise des agents de même rang qui communiquent exclusivement via un bus de messages partagé (blackboard) sans appels directs agent à agent. C'est le modèle de flotte d'OpenLegion: un agent compromis ne peut affecter que ce qu'il écrit sur le blackboard.

## Protocoles de communication inter-agents

### A2A: le standard ouvert de Google pour la communication agent cross-framework

A2A (Agent-to-Agent), publié par Google en avril 2025, standardise la communication inter-agents entre différents frameworks. A2A définit trois primitives: découverte de capacités, délégation de tâches et résultats en streaming. Fin 2026, A2A est pris en charge par plus de 50 partenaires technologiques. OpenLegion prend en charge A2A pour la coordination d'agents cross-framework.

### MCP: standardisation de l'accès aux outils entre agents

Model Context Protocol (MCP), publié par Anthropic en novembre 2024, standardise la façon dont les agents accèdent aux outils externes. Fin 2026, MCP compte plus de 1 000 serveurs communautaires. MCP introduit également des risques de sécurité: les descriptions d'outils peuvent être empoisonnées pour injecter des instructions malveillantes dans le contexte de l'agent.

### Modèle blackboard: état persistant partagé comme support de communication

Le modèle blackboard achemine toute la communication inter-agents via un magasin de données persistant partagé. OpenLegion implémente le modèle blackboard avec SQLite en mode WAL pour un accès concurrent, combiné à une messagerie pub/sub.

## Avis d'OpenLegion: pourquoi l'architecture est une décision de sécurité

La plupart des défaillances des systèmes multi-agents sont des défaillances architecturales. L'état partagé entre agents crée des conditions de course: CVE-2025-64168 (Agno, CVSS 7.1, octobre 2025). Le couplage serré amplifie le rayon d'explosion des injections de prompt: la recherche COLM 2025 a montré un taux de réussite d'attaque de 97 % contre AutoGen Magentic-One.

Le modèle de confiance à quatre zones d'OpenLegion est l'instanciation de production de ces principes: les agents de Zone 1 (conteneurs sandbox) ne peuvent pas communiquer directement. Tous les messages inter-agents passent par le Mesh Host de Zone 2.

## Limites de confiance dans les systèmes multi-agents

### Pourquoi processus partagé = rayon d'explosion partagé

Quand plusieurs agents s'exécutent dans le même processus Python, ils partagent le tas, l'environnement et l'interpréteur. Une injection de prompt réussie dans l'agent A peut lire les variables de l'agent B. L'isolation par conteneur par agent élimine ce problème.

### Séparation structurelle de confiance: conteneurs, zones et portée des credentials par agent

La séparation structurelle de confiance signifie que les limites de ce qu'un agent peut affecter sont appliquées par l'infrastructure. Le proxy vault d'OpenLegion applique les listes d'accès aux credentials par agent.

### Le problème de l'agent superviseur: quand le coordinateur est le maillon le plus faible

Dans la topologie en étoile, l'agent superviseur est simultanément le composant le plus puissant et le plus ciblé. Atténuations: limiter l'accès aux outils du superviseur aux opérations de coordination uniquement; envisager une topologie de flotte plate.

## Modes de défaillance courants dans l'architecture multi-agent

### Conditions de course dans l'état partagé: CVE-2025-64168 comme étude de cas

CVE-2025-64168 (Agno, CVSS 7.1, CWE-362 + CWE-668, octobre 2025, corrigé dans Agno v2.2.2) a divulgué une condition de course dans la couche de gestion session_state d'Agno. Sous une haute concurrence asynchrone, session_state a été assigné à la mauvaise session.

### Amplification de l'injection de prompt dans les systèmes fortement couplés

La recherche publiée à COLM 2025 a démontré un taux de réussite d'attaque de 97 % contre Magentic-One via des fichiers locaux malveillants.

### Goulot d'étranglement de la topologie en étoile et point de défaillance unique

Un superviseur de topologie en étoile crée deux modes de défaillance: goulot d'étranglement et point de défaillance unique. La topologie de flotte plate élimine les deux.

## Systèmes multi-agents dans OpenLegion

OpenLegion implémente une topologie de flotte plate avec une séparation de confiance à quatre zones. Les agents s'exécutent dans des conteneurs Docker isolés (Zone 1), communiquent exclusivement via le blackboard Mesh Host (Zone 2), accèdent aux credentials via le Vault Proxy (Zone 4) et ne communiquent jamais directement entre eux.

## Appel à l'action

**Coordination multi-agent avec des garanties de sécurité architecturales.**
[Démarrer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai) | [Voir la plateforme](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Foire aux questions

### Qu'est-ce qu'une architecture de système multi-agent?

Une architecture de système multi-agent définit comment plusieurs agents IA autonomes sont structurés pour communiquer, coordonner et maintenir des limites de confiance. Elle spécifie la topologie, le protocole de communication, le modèle de partage d'état et le placement des limites de confiance. Les choix architecturaux faits lors de la conception déterminent si le système est résilient, auditable et sécurisé en production.

### Quelle est la différence entre topologie en étoile et topologie de flotte plate?

Dans une topologie en étoile, un agent superviseur central coordonne tous les autres agents, créant un point de défaillance unique. Dans une topologie de flotte plate (utilisée par OpenLegion), les agents de même rang coordonnent via un bus de messages partagé sans communication directe agent à agent.

### Qu'est-ce que le protocole A2A pour les systèmes multi-agents?

A2A (Agent-to-Agent) est un protocole ouvert de communication inter-agents publié par Google en avril 2025. Il standardise comment les agents découvrent les capacités des autres, délèguent des tâches et échangent des résultats en streaming. OpenLegion prend en charge A2A pour la coordination d'agents cross-framework.

### Qu'est-ce qui cause des conditions de course dans les systèmes multi-agents?

Les conditions de course se produisent lorsque plusieurs agents lisent et écrivent un état partagé simultanément sans synchronisation appropriée. CVE-2025-64168 dans le framework Agno (CVSS 7.1, octobre 2025) est un exemple de production documenté. Les architectures de passage de messages avec un bus contrôlé éliminent cette vulnérabilité.

### Comment l'injection de prompt se propage-t-elle dans un système multi-agent?

Dans les systèmes multi-agents fortement couplés, une injection de prompt réussie dans un agent peut se propager aux autres. La recherche à COLM 2025 a démontré un taux de réussite de 97 % contre AutoGen Magentic-One. Les atténuations architecturales comprennent l'isolation par conteneur par agent et la communication médiatisée par bus.

### Qu'est-ce que le modèle blackboard dans les systèmes multi-agents?

Le modèle blackboard est une architecture de coordination multi-agent où les agents communiquent en lisant et écrivant un magasin de données persistant partagé plutôt qu'en s'appelant directement. OpenLegion implémente le modèle blackboard avec SQLite en mode WAL pour un accès concurrent, combiné à une messagerie pub/sub.
