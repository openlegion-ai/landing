---
title: Workflow agentique - Modèles, sécurité et conception en production
description: Un workflow agentique est un processus IA multi-étapes où des agents choisissent autonomement des outils, délèguent des sous-tâches et s'adaptent selon les résultats intermédiaires. Modèles clés, modes d'échec et conception sécurisée.
slug: /learn/agentic-workflows
primary_keyword: workflow agentique
secondary_keywords:
  - modèles workflow agentique
  - sécurité workflow agentique
  - react loop agent ia
  - plan and execute ia
  - conception workflow agent ia
date_published: "2026-05"
last_updated: "2026-05-27"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /comparison/langgraph
  - /comparison/crewai
---

# Workflow agentique : Modèles, sécurité et conception en production

Un workflow agentique est un processus IA multi-étapes dans lequel un ou plusieurs agents décident de manière autonome quels outils appeler, quand déléguer des sous-tâches à d'autres agents, et comment adapter leur approche en fonction des résultats intermédiaires. Contrairement à un pipeline fixe où chaque étape est codée en dur et s'exécute exactement une fois, un workflow agentique est dynamique : l'agent lit son environnement, raisonne sur l'état actuel et choisit l'action suivante. Cette autonomie est la fonctionnalité. C'est aussi la surface d'attaque.

OpenLegion est une plateforme d'agents IA orientée sécurité qui traite la conception de workflows agentiques comme une discipline d'ingénierie : chaque étape s'exécute dans un conteneur isolé, les credentials ne sont jamais présents dans le processus agent, et chaque boucle d'itération dispose d'une condition d'arrêt stricte appliquée au niveau de l'infrastructure.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce qu'un workflow agentique ?**
> Un workflow agentique est un processus IA multi-étapes dans lequel des agents autonomes sélectionnent des outils, délèguent des sous-tâches et mettent à jour leur plan d'exécution en fonction des résultats intermédiaires, par opposition aux pipelines statiques où chaque étape est fixée à la conception.

## TL;DR

- **Quatre modèles fondamentaux** : boucle ReAct, plan-et-exécution, boucle de réflexion, fan-out parallèle. Chacun a des modes d'échec distincts.
- **ReAct** (Reason + Act, Yao et al. 2023) est le modèle le plus largement implémenté, utilisé dans LangGraph, OpenAI Agents SDK, AutoGen et OpenLegion.
- **Vecteur d'attaque principal** : injection de prompt via les résultats d'outils (OWASP LLM Top 10 2025, LLM02). Une page web ou un document malveillant peut détourner la prochaine action de l'agent.
- **Les boucles incontrôlées ne sont pas des cas limites** : une boucle de réflexion ou ReAct sans condition d'arrêt stricte tournera jusqu'à épuisement de votre budget.
- **Mesures OpenLegion** : budget d'étapes par agent (limite d'itération stricte), isolation par conteneur (une étape compromise ne peut pas atteindre les credentials d'autres agents), zéro télémétrie.
- **Budget d'étapes vs. budget de tokens** : les deux comptent. Les budgets de tokens plafonnent les dépenses ; les budgets d'étapes plafonnent les boucles de raisonnement non bornées.

## Ce qui distingue un workflow agentique d'un pipeline

Un pipeline traditionnel exécute une séquence fixe : étape 1, étape 2, étape 3. Le développeur définit chaque transition à la conception. Le système est déterministe : la même entrée produit le même chemin d'exécution.

Un workflow agentique introduit un point de décision à chaque étape. L'agent lit l'état actuel, choisit une action (appeler un outil, déléguer à un autre agent, produire une réponse finale ou reboucler) et met à jour l'état. Le chemin d'exécution est déterminé à l'exécution par le modèle, pas par le développeur.

Cette distinction a des implications directes en matière de sécurité. Dans un pipeline fixe, le rayon d'impact d'une étape compromise est limité aux sorties de cette étape. Dans un workflow agentique, une étape compromise peut instruire l'agent d'entreprendre des actions supplémentaires : appeler des API externes, exfiltrer des données, générer des sorties malveillantes affectant les étapes en aval. Le [guide de sécurité des agents IA](/learn/ai-agent-security) couvre le modèle de menace complet ; cette page se concentre sur la façon dont le choix du modèle de workflow affecte la surface d'attaque.

## Les quatre modèles fondamentaux des workflows agentiques

### Modèle 1 : Boucle ReAct (Reason + Act)

**Ce que c'est.** Introduit par Yao et al. (2023), ReAct entrelace des traces de raisonnement avec des appels d'action dans une seule boucle. À chaque étape, le modèle produit une Pensée (raisonnement sur l'état actuel), une Action (appel d'outil ou délégation) et une Observation (le résultat de l'outil). La boucle continue jusqu'à ce que le modèle produise une réponse finale.

**Où il est utilisé.** ReAct est la boucle par défaut dans LangGraph, OpenAI Agents SDK, le chat de groupe AutoGen et OpenLegion. C'est le modèle de workflow agentique le plus largement déployé.

**Modes d'échec :**
- **Boucle non bornée** : sans limite d'itération stricte, un agent ReAct peut boucler indéfiniment.
- **Injection de prompt via l'observation** : l'étape d'observation est la surface d'attaque principale. OWASP LLM02 (Injection de prompt) est le risque principal pour les workflows basés sur ReAct.
- **Inflation de la fenêtre de contexte** : les longues chaînes ReAct accumulent des triplets pensée/action/observation dans le contexte.

**Mesure OpenLegion** : budget d'étapes par agent (nombre maximum d'itérations appliqué par l'orchestrateur) plus isolation par conteneur.

### Modèle 2 : Plan-et-exécution

**Ce que c'est.** Un agent Planificateur produit une décomposition complète des tâches en amont. Un ou plusieurs agents Exécuteurs réalisent ensuite chaque étape du plan, sans replanification entre les étapes.

**Avantages par rapport à ReAct.** Séparer la planification de l'exécution réduit considérablement le coût en tokens - le raisonnement intensif se produit une seule fois dans le Planificateur. Le chemin d'exécution est également inspectable avant de démarrer.

**Modes d'échec :**
- **Dérive du plan** : si un Exécuteur rencontre un résultat inattendu en cours de plan, il peut continuer avec le plan périmé.
- **Point de défaillance unique du Planificateur** : une injection de prompt corrompant la sortie du Planificateur affecte chaque étape d'Exécution suivante.
- **Absence de replanification adaptative** : le plan-et-exécution pur ne peut pas gérer des tâches où les résultats intermédiaires changent matériellement ce que les étapes suivantes doivent faire.

**Mesure OpenLegion** : le Planificateur et les Exécuteurs s'exécutent dans des conteneurs séparés. Rayon d'impact limité à la sortie du conteneur du Planificateur.

### Modèle 3 : Boucle de réflexion

**Ce que c'est.** Un agent (ou un agent Critique séparé) évalue sa propre sortie et itère jusqu'à ce qu'un seuil de qualité soit atteint. Courant dans la génération de contenu, l'écriture de code et les tâches d'analyse.

**Modes d'échec :**
- **Itération incontrôlée sans condition d'arrêt** : si le Critique peut toujours trouver quelque chose à améliorer, la boucle tourne indéfiniment.
- **Erreurs auto-renforçantes** : un modèle qui comprend mal la tâche génèrera des critiques qui renforcent l'incompréhension.
- **Amplification des coûts** : une boucle de réflexion en 10 tours coûte 10 fois la génération de base.

**Mesure OpenLegion** : le budget d'étapes par agent impose un nombre maximum de réflexions au niveau de l'infrastructure.

### Modèle 4 : Fan-out parallèle

**Ce que c'est.** Plusieurs agents exécutent des sous-tâches indépendantes simultanément. Un agent de Synthèse attend que toutes les branches parallèles soient terminées, puis fusionne les résultats.

**Modes d'échec :**
- **Amplification des coûts** : N agents parallèles coûtent N fois l'équivalent en série.
- **Empoisonnement de la synthèse** : une sortie de branche malveillante peut corrompre le résultat fusionné.
- **Conflits de concurrence et d'état partagé** : CVE-2025-64168 (Agno, CVSS 7.1) l'a démontré : une condition de course dans l'état de session partagé sous concurrence asynchrone exposait les données d'un utilisateur à un autre.

**Mesure OpenLegion** : chaque agent parallèle s'exécute dans son propre conteneur Docker isolé. Aucun état mutable partagé entre les branches.

## Conception de la sécurité pour les workflows agentiques

### Menace 1 : Injection de prompt via les résultats d'outils

Les résultats d'outils constituent le vecteur d'injection principal dans les workflows agentiques. OWASP LLM02 (Injection de prompt) est le risque principal pour les applications LLM dans le Top 10 2025. Pour les workflows agentiques, le risque est amplifié car les agents disposent d'un accès aux outils, une instruction injectée peut donc causer des actions réelles.

OpenLegion applique une assainissement Unicode à l'ingestion des résultats d'outils (56 points de contrôle pour les overrides bidi, les caractères de balise et les caractères de largeur nulle) plus une isolation par conteneur pour limiter le rayon d'impact de toute injection réussie.

### Menace 2 : Amplification des appels d'outils

Un agent appelant un outil coûteux dans une boucle ReAct sans budget d'étapes peut effectuer des centaines d'appels d'outils avant que le développeur s'en aperçoive. Des incidents réels incluent des agents tournant toute la nuit et générant des milliers d'appels API vers des services tiers, déclenchant des factures inattendues et des suspensions pour limitation de débit.

OpenLegion applique les deux : budget de tokens par agent (plafond de dépenses) et budget d'étapes par agent (plafond d'itérations). L'une ou l'autre limite arrête l'agent lorsqu'elle est atteinte.

### Menace 3 : Exposition des credentials lors de la délégation

Dans les frameworks où les agents partagent un processus Python, l'Agent B a accès par défaut aux variables d'environnement de l'Agent A. Une étape de délégation compromise peut exposer tous les credentials disponibles pour le workflow.

OpenLegion utilise l'injection de credentials par proxy vault via le Mesh Host. Le conteneur de l'Agent B reçoit uniquement les credentials qui lui sont explicitement assignés dans la matrice ACL du fleet, pas les credentials de l'Agent A.

### Menace 4 : Récursion non bornée et auto-spawning

Un workflow agentique autorisant les agents à créer des sous-agents sans limite peut être manipulé vers une récursion exponentielle. OpenLegion limite cela : la permission `can_spawn` nécessite une autorisation explicite de l'administrateur, la profondeur des sous-agents est bornée par la configuration du mesh, et les modèles de fleet définissent un nombre maximum d'agents.

## Budget d'étapes vs. budget de tokens : pourquoi vous avez besoin des deux

Les budgets de tokens plafonnent les dépenses totales par agent et par jour. Ils sont nécessaires mais insuffisants. Un budget de tokens n'empêche pas une boucle ReAct de tourner 500 itérations en utilisant des outils peu coûteux. Un budget d'étapes plafonne le nombre d'itérations de raisonnement ou d'appels d'outils, indépendamment du coût en tokens.

OpenLegion implémente les deux : budget de tokens appliqué par le Cost Tracker en Zone 2, et budget d'étapes appliqué par l'orchestrateur au niveau de l'infrastructure.

## Concevoir des workflows agentiques pour la production

### Choisir le bon modèle pour la tâche

| Type de tâche | Modèle recommandé | Pourquoi |
|---|---|---|
| **Recherche ouverte** | Boucle ReAct avec budget d'étapes | Nécessite une sélection d'outils adaptative ; borner la boucle |
| **Tâche multi-étapes structurée** | Plan-et-exécution | Plan inspectable ; réduit le coût en tokens |
| **Génération sensible à la qualité** | Boucle de réflexion avec limite d'étapes | Auto-correction ; arrêt strict prévient les boucles incontrôlées |
| **Collecte de données parallèle** | Fan-out + synthèse | Sous-tâches indépendantes ; isolation par agent |
| **Traitement de longs documents** | Fan-out + fusion séquentielle | Parallélise le traitement par fragments |

### Définir les conditions d'arrêt avant le déploiement

Chaque boucle dans un workflow agentique nécessite une condition d'arrêt explicite appliquée au niveau de l'infrastructure. Si le modèle décide quand s'arrêter, une injection de prompt peut l'empêcher de s'arrêter.

### Valider les sorties aux frontières d'étapes

Chaque frontière d'étape est une opportunité de valider que la sortie correspond au schéma attendu avant de passer à l'étape suivante. La coordination fleet-modèle d'OpenLegion applique des validateurs de sortie à chaque point de transfert. Voir le [guide d'orchestration d'agents IA](/learn/ai-agent-orchestration) pour les détails d'implémentation.

### Limiter les permissions au minimum requis

Chaque agent ne doit disposer que des outils et permissions nécessaires à son étape spécifique. Les agents surprivilégiés amplifient le rayon d'impact de toute compromission. La matrice ACL par agent dans la configuration fleet d'OpenLegion impose des permissions minimales au niveau de l'orchestrateur.

## Frameworks de workflows agentiques : comparaison du support des modèles

| Framework | ReAct | Plan-et-exécution | Réflexion | Fan-Out | Budget d'étapes | Isolation conteneur |
|---|---|---|---|---|---|---|
| **OpenLegion** | Oui | Oui | Oui | Oui | Oui (strict) | Oui (obligatoire) |
| **LangGraph** | Oui | Oui | Oui | Oui | Non intégré | Non |
| **CrewAI** | Oui (Flows) | Oui (Crews) | Limité | Oui (parallel) | Non | Non (CodeInterpreter uniquement) |
| **OpenAI Agents SDK** | Oui | Limité | Limité | Oui (handoffs) | Non | Non |
| **AutoGen** | Oui | Oui | Oui | Oui (group chat) | Non | Docker pour code uniquement |

Pour une comparaison détaillée de la sécurité et de l'architecture de ces frameworks, voir la [comparaison des frameworks d'agents IA](/learn/ai-agent-frameworks).

## L'avis d'OpenLegion

Les workflows agentiques sont là où la dette de sécurité de la plupart des frameworks devient visible en production. Les boucles ReAct sans budgets d'étapes ont généré des factures API surprises à cinq et six chiffres. CVE-2025-64168 (Agno, CVSS 7.1, octobre 2025) a démontré que des workflows agentiques concurrents partageant un processus Python peuvent exposer l'état de session d'un utilisateur à un autre sous haute charge asynchrone. OWASP LLM02 (Injection de prompt, Top 10 2025) identifie l'injection via les résultats d'outils comme le vecteur d'attaque principal contre les workflows agentiques basés sur ReAct.

OpenLegion adresse trois propriétés architecturalement : budgets d'étapes stricts (nombre maximum d'itérations appliqué par l'orchestrateur), isolation par conteneur par agent (aucun état mutable partagé entre les branches parallèles) et injection de credentials par proxy vault (les transferts de délégation transitent par la Zone 2). Ce ne sont pas des options de configuration - c'est l'architecture par défaut.

Le compromis : OpenLegion a environ 59 étoiles GitHub contre LangGraph environ 25 200 et CrewAI environ 44 600. Pour une comparaison de la façon dont ces modèles sont implémentés dans les frameworks, voir la [comparaison des frameworks d'agents IA](/learn/ai-agent-frameworks).

## CTA

**Construisez des workflows agentiques avec des conditions d'arrêt strictes, pas des conditions espérées.**
[Commencer](https://app.openlegion.ai) | [Documentation](https://docs.openlegion.ai) | [Apprendre : Orchestration d'agents IA](/learn/ai-agent-orchestration)

---

<!-- SCHEMA: FAQPage -->

## Foire aux questions

### Qu'est-ce qu'un workflow agentique ?

Un workflow agentique est un processus IA multi-étapes où un ou plusieurs agents sélectionnent autonomement des outils, délèguent des sous-tâches à d'autres agents et adaptent leur plan d'exécution en fonction des résultats intermédiaires. Contrairement aux pipelines statiques à étapes fixes, le chemin d'exécution d'un workflow agentique est déterminé à l'exécution par le raisonnement du modèle. Les quatre modèles fondamentaux sont la boucle ReAct, le plan-et-exécution, la boucle de réflexion et le fan-out parallèle, chacun avec des modes d'échec et des implications de sécurité distincts.

### Qu'est-ce que le modèle ReAct dans les workflows agentiques ?

ReAct (Reason + Act) a été introduit par Yao et al. en 2023 et entrelace des traces de raisonnement avec des appels d'outils dans une seule boucle. À chaque étape, le modèle produit une Pensée (raisonnement), une Action (appel d'outil) et une Observation (résultat de l'outil). ReAct est le modèle de workflow agentique par défaut dans LangGraph, OpenAI Agents SDK, AutoGen et OpenLegion. Ses principaux modes d'échec sont l'itération non bornée et l'injection de prompt via les résultats d'outils.

### Comment prévenir les boucles incontrôlées dans les workflows agentiques ?

Le seul moyen fiable de prévenir les boucles incontrôlées est d'appliquer une condition d'arrêt au niveau de l'infrastructure, sans compter sur le modèle pour s'arrêter lui-même. Deux contrôles sont nécessaires : un budget d'étapes (nombre maximum d'itérations ou d'appels d'outils, appliqué par l'orchestrateur) et un budget de tokens (dépenses maximales, appliqué par le cost tracker). Les budgets de tokens seuls n'arrêtent pas les boucles à haute fréquence avec des outils peu coûteux. Les budgets d'étapes seuls ne plafonnent pas les coûts LLM élevés par itération. OpenLegion applique les deux par agent comme limites strictes.

### Qu'est-ce que le plan-et-exécution dans les workflows agentiques ?

Le plan-et-exécution divise un workflow agentique en deux phases : un agent Planificateur produit une décomposition complète des tâches en amont, et un ou plusieurs agents Exécuteurs réalisent chaque étape sans replanification. Cela réduit le coût en tokens par rapport à ReAct (raisonnement intensif une fois vs. à chaque étape) et rend le chemin d'exécution inspectable avant démarrage. Le principal mode d'échec est la dérive du plan : si un Exécuteur rencontre un résultat inattendu, il peut continuer avec un plan périmé plutôt que de signaler l'écart.

### Quel est le principal risque de sécurité dans les workflows agentiques ?

Le vecteur d'attaque principal est l'injection de prompt via les résultats d'outils (OWASP LLM02, Top 10 2025). Quand un agent lit une page web, un fichier, un enregistrement de base de données ou une réponse d'API externe, ce contenu arrive comme une entrée de confiance. Un document malveillant peut contenir des instructions qui redirigent l'agent vers des actions non prévues. Les mesures comprennent l'assainissement Unicode à l'ingestion des résultats d'outils, la validation du schéma de sortie aux frontières d'étapes et l'isolation par conteneur pour limiter le rayon d'impact de toute injection réussie.

### Comment fonctionne le fan-out parallèle dans les workflows agentiques ?

Le fan-out parallèle fait tourner simultanément plusieurs agents sur des sous-tâches indépendantes, puis fusionne les résultats à une étape de Synthèse. Cela réduit le temps d'horloge pour les tâches qui se décomposent en flux de travail indépendants. Les modes d'échec sont l'amplification des coûts (N agents coûtent N fois plus), l'empoisonnement de la synthèse (une sortie de branche malveillante corrompant le résultat fusionné) et les conflits d'état partagé dans les frameworks où les agents concurrents partagent un état de processus mutable. OpenLegion fait tourner chaque agent parallèle dans un conteneur Docker isolé avec son propre état, prévenant les conflits d'état partagé et bornant chaque branche indépendamment.

### Qu'est-ce que la dérive du plan dans les workflows agentiques ?

La dérive du plan se produit dans les workflows plan-et-exécution quand les agents Exécuteurs rencontrent des résultats intermédiaires inattendus mais continuent à exécuter le plan original plutôt que de signaler l'écart. Les mesures comprennent des points de contrôle explicites de validation du plan, des points d'approbation humaine aux étapes critiques du plan et des protocoles de transfert structurés qui font remonter les divergences avant de continuer. La coordination fleet-modèle d'OpenLegion prend en charge les points de contrôle humains via les intégrations de canaux à tout point de transfert.

### En quoi la conception de workflow agentique diffère-t-elle de l'orchestration d'agents IA ?

La conception de workflow agentique se concentre sur l'anatomie au niveau des étapes : quel modèle (ReAct, plan-et-exécution, réflexion, fan-out), quelles conditions d'arrêt, comment les résultats d'outils sont validés et comment les credentials sont délimités à chaque étape. L'orchestration d'agents IA se concentre sur la coordination au niveau du fleet : comment plusieurs workflows sont séquencés, comment les agents se transfèrent le travail, comment l'état partagé est géré dans un système multi-agents. Le [guide d'orchestration d'agents IA](/learn/ai-agent-orchestration) couvre les primitives de coordination au niveau fleet qui opèrent sur les modèles de workflow décrits ici.
