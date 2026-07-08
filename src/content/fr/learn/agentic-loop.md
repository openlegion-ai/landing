---
title: "Boucle Agentique : Comment les Agents IA Perçoivent, Pensent et Agissent"
description: "La boucle agentique est le cycle percevoir-penser-agir de chaque agent IA. Apprenez la mécanique des boucles, les stratégies de terminaison et la prévention des boucles infinies."
slug: /learn/agentic-loop
primary_keyword: agentic loop
last_updated: "2026-07-08"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/agentic-ai-design-patterns
  - /learn/ai-agent-planning
  - /learn/ai-agent-tool-use
  - /learn/ai-agent-prompt-injection
  - /learn/ai-agent-cost
---

# Boucle Agentique : Comment les Agents IA Perçoivent, Pensent et Agissent

Une boucle agentique est le cycle répétitif percevoir-penser-agir qui propulse un agent IA du début de la tâche jusqu'à la réponse finale. À chaque itération, l'agent lit le contexte — observations, résultats d'outils, mémoire — appelle un LLM pour raisonner sur les prochaines étapes, exécute un outil ou retourne une réponse, puis recommence. Les limites d'itération, les conditions de terminaison et la gestion des erreurs déterminent si un agent de production est fiable ou un risque — OpenLegion impose des plafonds stricts au niveau du mesh, transformant les boucles incontrôlées en échecs déterministes.

## Qu'est-ce qu'une Boucle Agentique ?

<!-- SCHEMA: DefinitionBlock -->

> **Une boucle agentique** est un modèle d'exécution itératif dans lequel un agent IA observe alternativement son environnement, raisonne sur la prochaine action à l'aide d'un modèle de langage, et exécute cette action, en répétant jusqu'à ce qu'une condition de terminaison soit remplie : achèvement de la tâche, itérations maximales ou épuisement du budget.

Chaque agent IA, quel que soit le framework, exécute une variante de cette boucle. La boucle est l'unité d'exécution de l'agent : un seul passage par percevoir → penser → agir. Une tâche simple (répondre à une question à partir d'une seule recherche web) se termine en 2–3 itérations. Une tâche complexe (rechercher un concurrent, synthétiser les résultats, rédiger un rapport) peut nécessiter 15–30 itérations. Le nombre d'itérations n'est pas fixé par la tâche — il émerge du raisonnement de l'agent et des résultats de ses appels d'outils.

La boucle comporte trois entrées et une sortie par itération :

| **Entrée/Sortie** | **Contenu** | **Accumulé sur les itérations ?** |
|---|---|---|
| **Invite système** | Rôle de l'agent, instructions, définitions d'outils | Non — fixe par exécution |
| **Historique de conversation** | Tous les tours précédents : messages utilisateur, pensées de l'assistant, appels d'outils, résultats d'outils | Oui — croît à chaque itération |
| **Observation actuelle** | Résultat d'outil de l'action précédente (première itération : message utilisateur initial) | Oui — ajouté à chaque itération |
| **Sortie** | Prochaine action : un appel d'outil, une demande de clarification ou une réponse finale | Non — une sortie par itération |

L'accumulation de contexte est le principal facteur de coût de la boucle : l'historique de conversation s'agrandit d'un appel d'outil et d'un résultat d'outil par itération. À 2 000 jetons par paire d'itérations sur une tâche de 20 itérations, la dernière itération envoie 40 000 jetons comme contexte d'entrée. La tarification des modèles est par jeton, pas par tâche — voir [comment contrôler les coûts des boucles agentiques avec des plafonds de dépenses par agent](/learn/ai-agent-cost).

## Les Trois Phases en Détail

### Percevoir — Lire le Contexte

La phase de perception assemble la vue actuelle de l'agent sur le monde : tout ce que le LLM lira avant de décider quoi faire ensuite. Cela comprend :

- **Invite système :** instructions fixes, définitions d'outils, rôle et contraintes de l'agent
- **Historique de conversation :** toutes les pensées précédentes de l'assistant, appels d'outils et résultats d'outils dans l'exécution actuelle
- **Nouvelle observation :** le résultat de l'action effectuée dans l'itération précédente

La phase de perception est la principale **surface d'attaque par injection de prompt** de la boucle agentique. Chaque observation provenant de sources externes entre dans le contexte sous forme de texte que le LLM traitera à la prochaine étape de réflexion.

CVE-2024-5184 (Synopsys CyRC, juin 2024) illustre exactement cela : une attaque par injection de prompt livrée via le contenu d'une réponse d'outil qui détourne la prochaine itération de boucle de l'agent, redirigeant l'action vers un point de terminaison contrôlé par l'attaquant. Pour un traitement complet des vecteurs d'injection et des défenses, voir [les attaques par injection de prompt ciblant les réponses d'outils dans la boucle agentique](/learn/ai-agent-prompt-injection).

### Penser — L'Étape de Raisonnement LLM

La phase de réflexion est l'appel LLM : le contexte assemblé depuis la phase de perception est envoyé au modèle, qui génère la prochaine action. La sortie est l'une des suivantes :
- Un **appel d'outil** (structuré : nom d'outil + paramètres)
- Une **réponse finale** (texte libre) — l'agent estime que la tâche est terminée
- Une **demande de clarification** (texte libre adressé à l'utilisateur)

Le modèle canonique pour la phase de réflexion est le **modèle ReAct** (Yao et al., 2022, arXiv:2210.03629) : **Re**asoning + **Act**ing entrelacés dans la même sortie LLM. Le document ReAct a démontré que l'entrelacement du raisonnement explicite avec les actions améliore significativement la précision des tâches de l'agent sur des benchmarks incluant HotpotQA, FEVER et ALFWorld.

**Coût de l'étape de réflexion :** chaque appel LLM dans la phase de réflexion est facturé au tarif par jeton du fournisseur sur le contexte accumulé complet. Pour GPT-4o à 2,50 $/M jetons d'entrée, une exécution de 20 itérations avec 2 000 jetons ajoutés par itération coûte environ 1,05 $ en jetons d'entrée seuls pour la fenêtre de contexte de la dernière itération. Voir [planification d'agents IA — comment les agents décomposent les objectifs avant le début de la boucle](/learn/ai-agent-planning) pour des stratégies réduisant le nombre d'itérations.

### Agir — Exécution d'Outils ou Réponse Finale

La phase d'action exécute l'action sélectionnée dans la phase de réflexion. Deux cas :

**Appel d'outil :** l'exécuteur d'outils de l'agent reçoit l'appel d'outil structuré, le route vers l'implémentation d'outil appropriée, et collecte le résultat. Le résultat d'outil est retourné à la phase de perception comme observation de l'itération suivante.

**Réponse finale :** l'agent produit une réponse textuelle à l'appelant. La boucle se termine.

L'exécuteur d'outils doit :
1. Valider que le nom d'outil demandé existe dans le jeu d'outils autorisés de l'agent
2. Valider que les paramètres sont conformes au schéma de l'outil
3. Exécuter l'outil dans un contexte isolé
4. Retourner le résultat sans modification

Pour les modèles d'implémentation d'outils, les exigences de sandboxing et le modèle de sécurité d'exécution d'outils, voir [comment les agents exécutent des outils à l'intérieur de chaque itération de boucle](/learn/ai-agent-tool-use).

## Terminaison de Boucle — Quand les Agents S'arrêtent

### Terminaison Naturelle

La terminaison naturelle se produit lorsque l'étape de réflexion du LLM produit une réponse finale plutôt qu'un appel d'outil. L'agent a décidé que la tâche est terminée et retourne sa réponse.

### Application de max_turns

`max_turns` (terminologie OpenAI Agents SDK) ou `recursion_limit` (terminologie LangGraph) est une limite supérieure stricte sur le nombre d'itérations que la boucle exécutera.

**Valeurs par défaut :**
- **OpenAI Agents SDK :** `max_turns = 10` (avril 2026)
- **LangGraph :** `recursion_limit = 25`
- **LangChain AgentExecutor :** `max_iterations = 15`, sans limite de temps par défaut
- **AutoGen :** `max_consecutive_auto_reply = 10` par agent

**Configuration de max_turns pour la production :** définissez max_turns en fonction de la mesure empirique de votre agent spécifique. Mesurez le 95e percentile du nombre d'itérations sur 100 tâches représentatives ; définissez max_turns à P95 + 20 % de marge. Consignez chaque troncature.

### Terminaison Basée sur le Budget

La terminaison basée sur le budget arrête la boucle lorsque l'agent a consommé un montant en dollars configuré.

**Modèle d'application d'OpenLegion :**
- `daily_budget` (50 $/jour par défaut) et `monthly_budget` (200 $/mois par défaut) sont configurés par agent dans `INSTRUCTIONS.md`
- Le routeur mesh suit les dépenses cumulées par ID d'agent en temps réel
- Lorsqu'une itération de boucle dépasserait le budget journalier restant, la demande est rejetée au niveau du mesh avant d'atteindre le fournisseur LLM
- L'agent reçoit une erreur structurée d'épuisement du budget

### Terminaison Basée sur les Erreurs

Trois stratégies :

**Abandonner en cas d'erreur :** la boucle se termine immédiatement lorsqu'un appel d'outil retourne une erreur.

**Réessayer avec backoff :** la boucle réessaie l'appel d'outil échoué jusqu'à N fois avec un backoff exponentiel.

**Repli et continuation :** en cas d'échec d'outil, l'agent substitue une action de repli et continue la boucle.

## Anti-Patterns de Boucle Infinie

Le rapport 2025 de LangChain sur l'état des agents a constaté que **23 % des échecs d'agents étaient causés par des boucles infinies d'appels d'outils** — la plus grande catégorie d'échecs.

### Tempête d'Appels d'Outils

Une tempête d'appels d'outils se produit lorsque l'étape de réflexion de l'agent appelle répétitivement le même outil sans progresser vers l'achèvement de la tâche. Déclencheurs courants : spécification de tâche ambiguë, validation manquante des résultats d'outils, raisonnement circulaire.

Détection : journaliser la séquence d'appels d'outils par exécution. Une exécution où le même outil est appelé plus de 3 fois avec des paramètres similaires est un candidat à une tempête d'appels d'outils.

### Empoisonnement du Contexte

L'empoisonnement du contexte se produit lorsqu'un résultat d'outil introduit du contenu dans l'historique de conversation qui déforme le raisonnement du LLM lors des itérations suivantes. Prévention : prétraitement des résultats d'outils — supprimer le HTML, tronquer les grands documents aux sections pertinentes, retourner des résumés structurés plutôt que du contenu brut.

### Injection de Prompt via Réponse d'Outil

Le déclencheur de boucle infinie le plus critique pour la sécurité : CVE-2024-5184 (Synopsys CyRC, juin 2024). Une réponse d'outil contient des instructions injectées qui redirigent la prochaine itération de l'agent vers une nouvelle sous-tâche.

Défense : traiter chaque résultat d'outil comme une entrée non fiable. Pour un traitement complet des défenses contre l'injection, voir [les attaques par injection de prompt ciblant les réponses d'outils dans la boucle agentique](/learn/ai-agent-prompt-injection).

## L'Avis d'OpenLegion : Défense en Profondeur pour le Contrôle des Boucles

Le contrôle des boucles est une propriété de sécurité, pas seulement opérationnelle. Les trois chiffres concrets qui définissent le problème :

**23 % des échecs d'agents attribués aux boucles infinies d'appels d'outils** (LangChain 2025). La solution n'est pas une limite max_turns plus élevée. Ce sont des conditions de terminaison mesurables, des vérifications de progression explicites et une logique de disjoncteur.

**OpenAI Agents SDK max_turns par défaut = 10 ; LangGraph recursion_limit = 25.** Ce sont des valeurs par défaut de départ, pas des valeurs de production. Configurez les limites de terminaison pour la distribution de tâches.

**CVE-2024-5184 est une vulnérabilité de contrôle de boucle, pas seulement une vulnérabilité de sécurité.** La surface d'attaque est chaque appel d'outil externe.

| **Mécanisme de contrôle de boucle** | **OpenLegion** | **LangChain AgentExecutor** | **LangGraph** | **OpenAI Agents SDK** |
|---|---|---|---|---|
| **Limite d'itération** | max_turns dans INSTRUCTIONS.md, appliqué au mesh | max_iterations=15 (par défaut) | recursion_limit=25 | max_turns=10 (par défaut) |
| **Terminaison basée sur le budget** | daily_budget + monthly_budget par agent, appliqué au niveau du mesh | Non intégré | Non intégré | Non intégré |
| **Terminaison d'erreur** | Erreur structurée retournée à l'orchestrateur | Lève AgentExecutorError | Lève GraphRecursionError | Lève MaxTurnsExceeded |
| **Défense contre l'injection** | Appels d'outils proxifiés par vault ; autorité du prompt système | handle_parsing_errors configurable | Non intégré | Non intégré |
| **Piste d'audit de boucle** | Chaque itération journalisée avec agent_id, modèle, appel d'outil, coût | LangSmith (optionnel) | LangSmith (optionnel) | Tableau de bord OpenAI |

Pour les patterns qui composent plusieurs boucles d'agents en systèmes de production, voir [comment les workflows agentiques composent plusieurs boucles en pipelines de production](/learn/agentic-workflows) et [les patterns de conception IA agentique pour l'orchestration de boucles et la coordination d'agents](/learn/agentic-ai-design-patterns).

<!-- SCHEMA: FAQPage -->

## Foire Aux Questions

### Qu'est-ce qu'une boucle agentique ?

Une boucle agentique est le cycle répétitif percevoir-penser-agir que chaque agent IA exécute pour accomplir une tâche. À chaque itération, l'agent lit son contexte actuel, appelle un modèle de langage pour décider de la prochaine action, exécute cette action, puis recommence jusqu'à ce qu'une condition de terminaison soit remplie : achèvement naturel, une limite d'itération stricte (max_turns), épuisement du budget ou une erreur irrécupérable.

### Combien d'itérations une boucle agentique exécute-t-elle ?

Les tâches simples se terminent généralement en 2–5 itérations. Les tâches complexes nécessitent 10–30 itérations ou plus. Définissez max_turns en fonction du 95e percentile empirique pour votre agent spécifique sur votre distribution de tâches spécifique, avec une marge de 20 % au-dessus.

### Qu'est-ce qui cause une boucle agentique infinie ?

Les trois principales causes de boucle infinie sont : les tempêtes d'appels d'outils, l'empoisonnement du contexte et l'injection de prompt via le contenu de la réponse d'outil (CVE-2024-5184). Le rapport 2025 de LangChain a constaté que 23 % des échecs d'agents étaient causés par des boucles infinies d'appels d'outils.

### Qu'est-ce que le modèle ReAct dans les boucles agentiques ?

ReAct (Reasoning + Acting) est le modèle canonique de boucle agentique introduit par Yao et al. en 2022 (arXiv:2210.03629). Le modèle structure chaque itération de boucle comme une sortie LLM en trois parties : une Pensée, une Action et une Observation. Le document ReAct a démontré que l'entrelacement du raisonnement explicite avec les actions améliore la précision des tâches des agents, évalué sur HotpotQA, FEVER et ALFWorld.

### Comment l'injection de prompt affecte-t-elle la boucle agentique ?

L'injection de prompt via le contenu de réponse d'outil — démontrée par CVE-2024-5184 (Synopsys CyRC, juin 2024) — exploite la phase de perception de la boucle agentique. Lorsqu'un outil récupère du contenu externe, ce contenu entre dans l'historique de conversation comme résultat d'outil. Si le contenu contient des instructions injectées, le LLM peut traiter ces instructions à la prochaine étape de réflexion. La défense nécessite une hiérarchie d'instructions explicite : l'autorité du prompt système sur le contenu des résultats d'outils.

### Comment OpenLegion prévient-il les boucles agentiques incontrôlées ?

OpenLegion applique la défense en profondeur avec deux couches d'application. Les limites d'itération par agent sont appliquées au niveau de l'application. Les daily_budget et monthly_budget par agent sont appliqués au niveau du routeur mesh avant chaque appel LLM. Lorsqu'une itération de boucle dépasserait le budget restant, la demande est rejetée au niveau réseau. Une injection de prompt qui demande à l'agent d'ignorer les limites de budget ne peut pas remplacer la vérification de budget du routeur mesh.

### Quelle est la différence entre une boucle agentique et un workflow ?

Une boucle agentique est le cycle d'itération par agent — le cycle d'exécution percevoir-penser-agir répétitif d'un seul agent. Un workflow (ou workflow agentique) est un pipeline multi-agents où plusieurs agents, chacun exécutant ses propres boucles, sont composés en un système plus grand avec une logique de transfert explicite, une orchestration et un flux de données entre agents.

## Commencer avec OpenLegion

La boucle agentique est là où la fiabilité de l'agent se gagne ou se perd. Les valeurs par défaut du framework — max_turns=10, recursion_limit=25 — sont des points de départ, pas des configurations de production.

OpenLegion applique les plafonds de budget et les limites d'itération au niveau du mesh — hors bande du raisonnement LLM de l'agent, non remplaçable par injection de prompt.

[Commencer avec OpenLegion](https://app.openlegion.ai) — limites de boucle strictes et application du budget par agent intégrées.

Pour les patterns qui composent plusieurs boucles d'agents en systèmes de production, voir [comment les workflows agentiques composent plusieurs boucles en pipelines de production](/learn/agentic-workflows).
