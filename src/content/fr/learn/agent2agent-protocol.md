---
title: "Protocole Agent2Agent : Sécurité A2A, architecture et comparaison MCP"
description: "Le protocole Agent2Agent (A2A) permet aux agents IA de déléguer des tâches entre frameworks. Découvrez l'architecture, le modèle de sécurité, le cycle de vie des tâches et la comparaison avec MCP."
slug: /learn/agent2agent-protocol
primary_keyword: protocole agent2agent
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/model-context-protocol
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/ai-agent-frameworks
---

# Protocole Agent2Agent : Architecture, sécurité et comparaison MCP

Agent2Agent (A2A) est un protocole ouvert, lancé par Google Cloud en avril 2025 et cédé à la Linux Foundation, qui permet aux agents IA construits sur différents frameworks et fournisseurs de communiquer, déléguer des tâches et échanger des résultats via une interface HTTP/JSON standardisée. Là où MCP résout le problème d'accès aux outils (un LLM appelant des API externes), A2A résout le problème de coordination : un agent déléguant une sous-tâche complète à un agent pair spécialisé disposant de sa propre boucle de raisonnement, mémoire et outils. Le dépôt GitHub a2aproject/A2A compte des contributions de plus de 50 organisations, dont Salesforce, Atlassian et SAP.

<!-- SCHEMA: DefinitionBlock -->
Agent2Agent (A2A) est un protocole HTTP/JSON ouvert pour l'interopérabilité des agents IA, maintenu par la Linux Foundation, qui standardise comment les agents autonomes annoncent leurs capacités, délèguent des tâches et échangent des résultats entre différents frameworks et fournisseurs.

## Qu'est-ce que le protocole Agent2Agent (A2A) ?

A2A est né d'un vide concret dans l'écosystème des agents IA : la communication de modèle à outil avait un standard (MCP, lancé en novembre 2024), mais la communication d'agent à agent n'en avait pas. Lorsqu'un agent orchestrateur doit confier une sous-tâche à un pair spécialisé, il n'existait pas de format filaire standardisé pour cette délégation.

Google Cloud a annoncé A2A le 9 avril 2025, accompagné d'un groupe initial de plus de 50 partenaires technologiques contribuant à la spécification. Contrairement à de nombreux standards portés par des fournisseurs, A2A a été cédé à la Linux Foundation pour une gouvernance neutre.

Le protocole repose sur HTTP/JSON. Un agent conforme A2A expose un petit ensemble de points de terminaison : une carte d'agent (manifeste de capacités), un point de soumission de tâches, un point d'interrogation de statut et un point de streaming SSE pour les tâches longue durée.

Pour le contexte sur le problème de coordination multi-agents, voir [architecture des systèmes multi-agents](/learn/multi-agent-systems) et [patterns d'orchestration d'agents IA](/learn/ai-agent-orchestration).

## L'architecture du protocole A2A

A2A définit trois concepts fondamentaux : les cartes d'agents (découverte des capacités), le cycle de vie des tâches (suivi de délégation avec état) et les modes de livraison (streaming SSE et push webhook).

### Cartes d'agents : publicité des capacités et risque d'énumération

Une carte d'agent est un document JSON servi à une URL bien connue (`/.well-known/agent.json`) qui décrit ce qu'un agent peut faire. Une carte d'agent minimale comprend :

```json
{
  "name": "web-research-agent",
  "description": "Recherche des sujets via la recherche web et retourne des résumés structurés",
  "version": "1.0.0",
  "url": "https://agents.example.com/web-research",
  "skills": [
    {
      "id": "research_topic",
      "name": "Rechercher un sujet",
      "description": "Rechercher un sujet sur le web et retourner un résumé structuré",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

Les cartes d'agents permettent la découverte dynamique des capacités, mais comportent un risque de sécurité : dans le profil de base A2A, elles ne sont pas authentifiées par défaut, exposant la surface complète des compétences à l'énumération sans authentification.

Les déploiements en production doivent ne servir les cartes d'agents qu'après authentification ou les restreindre aux segments réseau internes. Le [modèle de menace pour la sécurité des agents IA](/learn/ai-agent-security) couvre l'énumération des capacités comme vecteur d'attaque de reconnaissance.

### Cycle de vie des tâches : cinq états de soumis à terminé

A2A définit un cycle de vie en cinq états :

1. **submitted** - Tâche reçue par l'agent distant ; pas encore prise en charge
2. **working** - L'agent distant traite activement la tâche (peut diffuser la progression via SSE)
3. **input-required** - L'agent distant a besoin de clarification avant de continuer (point de contrôle humain)
4. **completed** - Tâche terminée ; artefact de résultat disponible
5. **failed** - Tâche échouée ; détails de l'erreur dans l'objet de statut

L'état `input-required` est le mécanisme d'A2A pour les points de contrôle humains dans les pipelines autonomes longs.

### Livraison push vs pull : SSE et webhooks

A2A prend en charge deux modes de livraison :

**SSE (Server-Sent Events) :** L'agent délégant ouvre une connexion persistante. SSE est le mécanisme principal pour les tâches longue durée nécessitant une progression incrémentale.

**Push webhook :** L'agent délégant fournit une URL de rappel à la soumission. Préférable dans les environnements sans serveur où une connexion SSE persistante ne peut être maintenue.

## A2A vs MCP : différentes couches, différents problèmes

A2A et MCP sont complémentaires, pas concurrents. Ils opèrent à différentes couches de la pile d'agents et résolvent différents problèmes de coordination.

| **Dimension** | **MCP** | **A2A** |
|---|---|---|
| **Objectif** | Accès aux outils - un LLM appelle des API externes | Coordination d'agents - un agent délègue à un autre |
| **Communication** | Appel d'outil synchrone dans un tour de raisonnement | Délégation de tâche asynchrone ; l'agent récepteur a sa propre boucle |
| **Auth (défaut)** | Requis - les serveurs MCP authentifient les clients | Optionnel dans le profil de base - anonyme permis |
| **Découverte** | Manifeste du serveur MCP (liste d'outils) | Carte d'agent (JSON : compétences + exigences d'auth) |
| **État** | Sans état par appel d'outil | Avec état, cycle de vie en 5 états |
| **Streaming** | Absent de la spécification principale | SSE en temps réel ; push webhook pour l'asynchrone |
| **Menace principale** | Empoisonnement d'outil (OWASP LLM07:2025) | Injection de payload de tâche, énumération de carte d'agent |

### Quand un agent a besoin d'un outil (MCP)

MCP est le bon choix lorsqu'un agent unique doit appeler une capacité externe dans un tour de raisonnement. L'outil n'a pas sa propre boucle de raisonnement ; il exécute une fonction et retourne une valeur.

### Quand un agent a besoin d'un autre agent (A2A)

A2A est le bon choix lorsqu'une tâche nécessite la pleine capacité de raisonnement d'un agent pair. L'agent récepteur a son propre modèle, sa propre mémoire, son propre accès aux outils et sa propre boucle de raisonnement multi-étapes.

### Utiliser MCP et A2A ensemble dans le même système

Un système multi-agents en production utilise généralement les deux. L'agent orchestrateur utilise A2A pour déléguer aux agents spécialistes. Chaque spécialiste utilise MCP pour ses appels d'outils.

## Authentification et modèle de sécurité A2A

Le modèle de sécurité d'A2A présente une lacune critique : le profil de base rend l'authentification optionnelle. L'injection de prompt via le payload de tâche A2A est une classe d'attaque documentée.

La surface d'attaque dans les systèmes A2A :

**1. Injection de payload de tâche :** La description et les données d'entrée dans une soumission de tâche A2A sont contrôlées par l'utilisateur.

**2. Énumération de carte d'agent :** Les cartes d'agents non authentifiées exposent la surface complète des compétences.

**3. Hypothèses de confiance inter-agents :** Un agent délégant qui fait confiance aux résultats d'un pair sans validation est vulnérable à l'injection relais.

**4. Délégation anonyme :** Sans authentification obligatoire, n'importe quel appelant peut soumettre des tâches à un agent A2A.

## L'avis d'OpenLegion : A2A est un format filaire, pas un modèle de sécurité

A2A est bien conçu en tant que format filaire. Le modèle de sécurité est insuffisant pour les exigences de production.

L'approche d'OpenLegion applique ce que le profil de base d'A2A laisse optionnel :

1. **Chaque appel inter-agents passe par le coffre de credentials.** Il n'y a pas de mode de délégation anonyme.

2. **Assainissement du payload à 56 points d'étranglement réseau.** Le contenu contrôlé par l'utilisateur est assaini pour les attaques unicode avant d'atteindre le contexte LLM.

3. **Contrats de handoff typés validés par l'orchestrateur.** Les payloads d'injection relais sont bloqués à la frontière.

4. **Les manifestes de capacités des agents nécessitent une authentification.** La surface des compétences n'est pas exposée aux appelants anonymes.

## Implémenter A2A : guide technique

### Schéma de carte d'agent

Une carte d'agent de production doit inclure explicitement les exigences d'authentification :

```json
{
  "name": "data-analysis-agent",
  "description": "Analyse des ensembles de données structurés et retourne des résumés statistiques",
  "version": "1.2.0",
  "url": "https://agents.internal.example.com/data-analysis",
  "skills": [
    {
      "id": "analyze_dataset",
      "name": "Analyser un ensemble de données",
      "description": "Exécuter une analyse statistique sur un ensemble de données fourni",
      "inputModes": ["data"],
      "outputModes": ["text", "data", "file"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"],
    "required": true
  }
}
```

### Soumission de tâche et interrogation de statut

La soumission de tâche est un POST vers `/tasks/send`. L'interrogation de statut utilise `GET /tasks/{task_id}`. Interroger avec un backoff exponentiel (1s, 2s, 4s, 8s, max 30s). Les tâches longue durée (>60s) doivent passer à SSE.

### Streaming de tâches longue durée avec SSE

Pour les tâches dépassant 30 secondes, utiliser SSE via `POST /tasks/sendSubscribe`. Le flag `"final": true` signale la fin de la tâche. Implémenter la reconnexion SSE avec l'en-tête `Last-Event-ID`.

<!-- SCHEMA: FAQPage -->
## Questions fréquentes

### Qu'est-ce que le protocole Agent2Agent (A2A) ?

Agent2Agent (A2A) est un protocole HTTP/JSON ouvert pour l'interopérabilité des agents IA, lancé par Google Cloud en avril 2025 et cédé à la Linux Foundation. Il standardise comment les agents autonomes annoncent leurs capacités, délèguent des tâches et échangent des résultats. Plus de 50 organisations dont Salesforce, Atlassian et SAP ont contribué au protocole depuis son lancement.

### Quelle est la différence entre A2A et MCP ?

MCP résout l'accès aux outils : un agent appelant une API externe dans un tour de raisonnement unique. A2A résout la coordination d'agents : un agent déléguant une sous-tâche complète à un agent pair avec sa propre boucle de raisonnement. MCP exige l'authentification par défaut ; le profil de base d'A2A la rend optionnelle. Les deux protocoles sont complémentaires.

### Que sont les cartes d'agents A2A ?

Les cartes d'agents sont des documents JSON servis à `/.well-known/agent.json` décrivant les capacités d'un agent, les modes d'entrée/sortie acceptés et les exigences d'authentification. Par défaut dans le profil de base A2A, elles sont servies sans authentification. Les déploiements en production doivent exiger l'authentification pour accéder aux cartes d'agents.

### Le protocole A2A est-il sécurisé ?

Le profil de base d'A2A présente des lacunes de sécurité importantes. L'authentification est optionnelle par défaut. L'injection de prompt via le payload de tâche A2A est un risque de production réel. Les déploiements A2A en production doivent implémenter le profil d'authentification étendu et assainir tout le contenu des payloads avant le LLM.

### Qu'est-ce que le cycle de vie des tâches A2A ?

A2A définit cinq états : submitted (reçu, pas encore traité), working (traitement actif, peut diffuser la progression SSE), input-required (l'agent distant a besoin de clarification), completed (résultat disponible) et failed (tâche échouée avec détails). L'état `input-required` est le mécanisme de points de contrôle humains d'A2A.

### Quelles entreprises soutiennent A2A ?

A2A a été lancé en avril 2025 avec plus de 50 organisations contributrices, dont Salesforce, Atlassian et SAP. Google Cloud a dirigé la spécification initiale et cédé la gouvernance à la Linux Foundation. Le protocole cible les plateformes IA d'entreprise.

### Comment OpenLegion implémente-t-il la communication agent à agent ?

L'architecture mesh d'OpenLegion applique une authentification obligatoire à chaque appel. Chaque handoff agent à agent passe par le coffre de credentials. Le contenu des payloads est assaini à 56 points d'étranglement réseau. Les contrats de handoff typés sont validés par l'orchestrateur. Ces contrôles s'exécutent au niveau de l'infrastructure, hors du code de l'agent.

## Construire des systèmes multi-agents avec authentification à chaque appel

A2A fournit le format filaire pour l'interopérabilité des agents. Le modèle de sécurité doit être construit par-dessus ou appliqué par la couche d'infrastructure.

Voir [sécurité des agents IA et modèle de menace](/learn/ai-agent-security) ou [architecture des systèmes multi-agents](/learn/multi-agent-systems).

[Exécutez des systèmes multi-agents où chaque appel agent à agent est authentifié, journalisé et isolé par credentials par défaut - démarrez sur OpenLegion](https://app.openlegion.ai)
