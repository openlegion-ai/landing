---
title: "Utilisation des outils par les agents IA — Appels de fonctions, schémas et exécution sécurisée"
description: "Comment les agents IA utilisent les outils : définition des schémas d'outils, appels de fonctions entre fournisseurs, appels parallèles et en chaîne, analyse des sorties, récupération des erreurs et portée des permissions."
slug: /learn/ai-agent-tool-use
primary_keyword: utilisation outils agents ia
last_updated: "2026-06-08"
schema_types:
  - FAQPage
related:
  - /learn/agentic-workflows
  - /learn/model-context-protocol
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-evaluation
  - /learn/ai-agent-frameworks
---

# Utilisation des outils par les agents IA : appels de fonctions, schémas et exécution sécurisée

L'utilisation des outils par les agents IA est le mécanisme par lequel un LLM demande l'exécution de fonctions externes — recherche web, requêtes de base de données, appels API, opérations sur les fichiers — en émettant du JSON d'appel d'outil structuré qu'un runtime intercepte, valide contre un schéma JSON et exécute avant de retourner un résultat d'outil. Le LLM n'exécute jamais rien ; il ne fait que demander. Le runtime applique la validation du schéma, les vérifications ACL et les budgets d'étapes avant toute exécution. tau-bench (2025) montre que les erreurs de construction d'arguments sont le principal mode d'échec de l'utilisation des outils.

<!-- SCHEMA: DefinitionBlock -->
L'utilisation des outils par les agents IA est le mécanisme par lequel un grand modèle de langage demande l'exécution de fonctions externes — recherche web, requêtes de base de données, appels API, opérations sur les fichiers ou logique métier personnalisée — en émettant un appel d'outil structuré dans sa sortie qu'un runtime intercepte, valide contre une définition de schéma JSON, exécute et retourne comme résultat d'outil dans le prochain tour de contexte.

## Fonctionnement des appels d'outils : la boucle demande-exécution-retour

### Le cycle de vie d'un appel d'outil

Chaque appel d'outil suit le même cycle en cinq étapes quel que soit le framework ou le fournisseur :

1. **Configuration du contexte** — l'agent reçoit la tâche ainsi qu'une liste d'outils disponibles, chacun décrit par un nom, une description en langage naturel et une définition de schéma JSON de ses paramètres.
2. **Décision du LLM** — le modèle émet un bloc d'appel d'outil dans sa sortie : un nom de fonction et un objet JSON d'arguments correspondant au schéma déclaré.
3. **Interception du runtime** — le framework intercepte l'appel d'outil avant toute exécution. Les arguments sont validés contre le schéma. L'ACL de l'agent est vérifiée : cet agent est-il autorisé à appeler cet outil ?
4. **Exécution** — si les validations et vérifications des permissions réussissent, le runtime exécute la fonction et collecte sa sortie.
5. **Injection dans le contexte** — le résultat de l'outil est injecté dans le contexte de conversation comme tour de résultat d'outil. Le LLM continue son raisonnement depuis ce contexte enrichi.

Le fait architectural critique : le LLM n'exécute jamais rien. Il ne fait que demander. Toute action non sûre — écrire un fichier, appeler une API, envoyer un e-mail — est contrôlée par le runtime. Cette séparation entre demande et exécution est le fondement d'une utilisation sûre des outils par les agents.

### Différences de format selon les fournisseurs : OpenAI vs Anthropic vs Google

Les trois principaux fournisseurs de LLM supportent nativement l'utilisation des outils, mais le format JSON diffère :

**OpenAI** (openai/openai-python, 30 941 étoiles, Apache-2.0) : les définitions d'outils vont dans le paramètre `tools` comme tableau d'objets JSON Schema. Le modèle retourne les appels d'outils dans le champ `tool_calls`. Le client renvoie les résultats d'outils comme messages avec `role: "tool"`. L'API Responses (mars 2025) a ajouté des outils intégrés (`web_search`, `file_search`, `computer_use`) qui s'exécutent côté serveur.

**Anthropic** (anthropic-sdk-python, 3 595 étoiles, MIT) : les définitions d'outils vont dans le paramètre `tools` de premier niveau. Le modèle retourne des blocs de contenu `tool_use` dans le tour de l'assistant. Le client doit analyser ces blocs et retourner des blocs `tool_result` dans le prochain tour humain.

**Google Gemini** : les définitions d'outils utilisent `functionDeclarations` dans le paramètre `tools`. Le modèle retourne des parties `functionCall` ; le client envoie des parties `functionResponse`. Gemini supporte un `tool_config` avec mode `ANY` et mode `AUTO`.

Les formats sont sémantiquement équivalents mais syntaxiquement différents. Les frameworks qui abstraient les différences de fournisseurs sont beaucoup plus faciles à maintenir lors des changements de modèles.

### Qui exécute réellement l'outil (et pourquoi c'est important pour la sécurité)

Le LLM ne peut pas exécuter d'outils. Il peut seulement les demander. Quand un runtime applique une porte ACL avant chaque exécution d'outil, aucune sortie LLM ne peut contourner la vérification des permissions. Le modèle peut demander `delete_all_records()` avec n'importe quels arguments ; si la matrice de permissions de l'agent n'inclut pas cet outil, le runtime rejette la demande avant toute exécution.

## Définir des schémas d'outils que les LLMs utilisent correctement

tau-bench (ServiceNow Research, 2025) a mesuré GPT-4o à 44% pass@1 sur les tâches d'utilisation d'outils retail. La principale catégorie d'échec était la construction des arguments : le modèle appelait la bonne fonction avec de mauvais arguments. La qualité du schéma est le principal levier de fiabilité.

### Anatomie d'un schéma JSON pour les définitions d'outils

Un schéma d'outil minimal valide requiert quatre champs :

```json
{
  "name": "search_web",
  "description": "Recherche le web public pour des informations actuelles. Utiliser quand la tâche requiert des faits postérieurs à la date limite d'entraînement, des données en temps réel, ou des sources non présentes dans les données d'entraînement.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "La requête de recherche. Utiliser des termes spécifiques et ciblés — pas une phrase complète."
      },
      "max_results": {
        "type": "integer",
        "description": "Nombre maximum de résultats à retourner. Défaut 5, max 20.",
        "default": 5
      }
    },
    "required": ["query"]
  }
}
```

Le tableau `required` est important : les paramètres absents de `required` sont optionnels. Les paramètres requis souvent omis indiquent un problème de description du schéma.

### Écrire des descriptions qui réduisent les erreurs d'arguments

Trois règles pour les descriptions d'outils qui améliorent la précision de la construction des arguments :

1. **Nommer avec une paire verbe-nom** : `search_web`, `create_ticket`, `read_file`. Évite l'ambiguïté entre outils similaires.
2. **Désambiguïser dans la description** : si deux outils semblent similaires, indiquer explicitement quand utiliser chacun.
3. **Décrire les paramètres avec des exemples** : `"La requête de recherche. Exemple : 'LangGraph v0.2 appels d'outils parallèles'"` surpasse `"La chaîne de requête"` en précision.

### Erreurs courantes de schéma et comment les corriger

| **Erreur** | **Effet** | **Correction** |
|---|---|---|
| `"type": "string"` non contraint pour des valeurs catégorielles | Le modèle invente des valeurs invalides | Utiliser `"enum": ["option_a", "option_b"]` |
| Description manquante sur les paramètres | Le modèle devine la sémantique des arguments | Écrire des descriptions explicites avec exemples |
| Tous les paramètres dans `required` | Le modèle refuse d'appeler quand des champs optionnels sont inconnus | Lister seulement les paramètres vraiment requis |
| Nom d'outil vague (`process`, `handle`) | Le modèle ne peut pas distinguer les outils similaires | Utiliser verbe-nom : `submit_form`, `parse_date` |
| Pas de tableau `required` | JSON Schema invalide | Toujours inclure `required`, même vide (`[]`) |

### Mode strict : appliquer l'adhésion exacte au schéma

Le mode strict des sorties structurées d'OpenAI (`"strict": true`) garantit que le JSON de sortie du modèle correspond exactement au schéma déclaré, éliminant toute la catégorie des erreurs de construction d'arguments.

## Appels d'outils parallèles et séquentiels

### Quand utiliser les appels d'outils parallèles

L'API Responses d'OpenAI (mars 2025) a rendu les appels d'outils parallèles le défaut. Dans un seul tour LLM, le modèle peut demander plusieurs exécutions d'outils simultanément. Pour les outils indépendants, le dispatch parallèle réduit les allers-retours de N tours séquentiels à un batch concurrent.

Exemple : un agent de recherche a besoin du cours boursier actuel, des actualités récentes et du dépôt SEC d'une entreprise. Séquentiel : 3 tours LLM x 10s = 30s. Parallèle : 1 tour LLM + max(latences des outils) environ 10s.

La précondition : les outils doivent être genuinement indépendants. Si l'outil B nécessite la sortie de l'outil A comme argument, ils doivent être séquentiels.

### Appels d'outils séquentiels pour les opérations dépendantes

L'enchaînement d'outils — utiliser la sortie d'un outil comme entrée du suivant — requiert une exécution séquentielle. Le motif : `search_web(requête)` → `fetch_page(URL du résultat de recherche)` → `extract_data(contenu de la page)` → `summarize(données extraites)`.

### Risques de concurrence avec les ressources avec état

Les appels d'outils parallèles contre des ressources avec état nécessitent des garanties d'ordonnancement. La règle : le dispatch parallèle est sûr quand les outils sont en lecture seule ou écrivent sur des ressources indépendantes.

## Analyse des sorties d'outils et récupération des erreurs

Les appels d'outils échouent. L'API externe retourne 503. La requête de base de données expire. Une implémentation bien conçue gère les échecs sans intervention humaine pour les erreurs récupérables.

### Valider les sorties d'outils

Un outil retournant HTTP 200 n'est pas la même chose qu'un outil retournant un résultat correct et utile. Valider la sortie contre un schéma attendu avant de l'injecter dans le contexte de l'agent.

### Stratégies de réessai : quand et comment réinvoquer

Trois motifs de réessai pour différents modes d'échec :

- **Réessai pour échec transitoire** (timeout réseau, limite de débit) : réinvoquer le même outil avec les mêmes arguments après un court backoff.
- **Réessai avec clarification d'argument** : retourner une erreur structurée au LLM expliquant pourquoi l'argument a été rejeté.
- **Outil de repli** : si l'outil A échoue après N réessais, router vers l'outil B avec une capacité équivalente.

### Remonter les échecs d'outils à l'orchestrateur

Les erreurs irrécupérables doivent remonter à l'orchestrateur. Pour les pipelines multi-agents, l'orchestrateur a besoin d'un signal d'échec structuré. Pour les [motifs d'orchestration des agents IA](/learn/ai-agent-orchestration), c'est le chemin d'escalade.

## Portée des permissions d'outils et sécurité

### Attribution des outils selon le principe du moindre privilège

Chaque agent ne devrait détenir que les outils requis par sa tâche spécifique. Le rayon d'explosion d'un agent réussissant l'injection de prompt est borné par son ensemble d'outils autorisés. OWASP LLM Top 10 v1.1 (2025) liste l'injection de prompt (LLM01) comme le risque principal pour les applications LLM.

### Validation des entrées avant exécution

Valider les arguments des appels d'outils à deux niveaux : validation du schéma et validation sémantique. Un outil `fetch_page` devrait rejeter les arguments avec des URLs `file://` ou `localhost` pour prévenir les SSRF.

Voir le [modèle de menace de sécurité des agents IA](/learn/ai-agent-security) pour la taxonomie complète des vecteurs d'attaque au niveau des outils.

### Actions irréversibles : portes human-in-the-loop

Les appels d'outils avec des effets secondaires irréversibles — envoyer des e-mails, supprimer des enregistrements, transférer des fonds, publier du contenu — requièrent des portes de confirmation humaine explicites ou des vérifications d'idempotence avant exécution.

## L'avis d'OpenLegion : le registre d'outils et la porte ACL

Chaque fournisseur majeur de LLM a une API d'appel d'outils différente. La bonne abstraction : définir un outil une fois et laisser le framework le traduire vers la convention correcte du fournisseur au moment de l'appel.

Le registre d'outils d'OpenLegion implémente cette abstraction. Définir `search_web` une fois. Le mesh traduit la définition vers OpenAI `tools`, Anthropic `tools` ou Gemini `functionDeclarations` selon le modèle configuré. La porte ACL est non optionnelle. Chaque appel d'outil — intégré, MCP ou personnalisé — passe par la matrice de permissions par agent avant exécution.

| **Dimension** | **OpenLegion** | **LangChain / LangGraph** | **OpenAI Agents SDK** | **CrewAI** | **Anthropic direct** |
|---|---|---|---|---|---|
| **Format de définition d'outil** | Schéma unique traduit par fournisseur | Wrappers spécifiques au fournisseur requis | Format OpenAI uniquement | Décorateur d'outil CrewAI | Format Anthropic tool_use uniquement |
| **Abstraction du fournisseur** | Oui — GPT-4o, Claude, Gemini unifiés | Partielle — via intégrations LangChain | Non — modèles OpenAI uniquement | Partielle | Non — Anthropic uniquement |
| **Application ACL** | Matrice de permissions par agent, structurelle | Non intégrée | Non intégrée | Non intégrée | Non intégrée |
| **Appels d'outils parallèles** | Supporté | Supporté (dépendant du fournisseur) | Oui — défaut dans Responses API | Supporté | Oui — Claude supporte |
| **Outils intégrés** | Navigateur, fichier, HTTP, shell, génération d'images | Via outils communautaires LangChain | web_search, file_search, computer_use | Non intégré | Non intégré |
| **Intégration MCP** | Native — même pipeline ACL/budget | Via adaptateurs LangChain MCP | Expérimental | Non natif | Non natif |

Pour la spécification MCP, l'architecture des serveurs et les exigences de permissions par serveur, voir le [guide du protocole Model Context](/learn/model-context-protocol).

## Outils intégrés vs outils MCP vs outils personnalisés

### Outils intégrés du runtime

Les outils intégrés viennent pré-renforcés par le runtime : automatisation du navigateur, opérations sur les fichiers, requêtes HTTP, commandes shell, génération d'images. Utiliser d'abord les outils intégrés.

### Serveurs d'outils MCP

Les outils MCP sont servis par des serveurs Model Context Protocol qui exposent des outils via JSON-RPC sur stdio ou HTTP. Les outils MCP requièrent un sandboxing explicite et une portée de permissions par serveur.

### Enregistrement d'outils personnalisés

Les outils personnalisés sont des fonctions Python ou TypeScript que vous écrivez et enregistrez dans le registre d'outils de l'agent. Ils offrent une flexibilité totale ; la contrepartie est que vous êtes propriétaire de la validation, de la gestion des erreurs, de l'idempotence et des contrôles de sécurité.

<!-- SCHEMA: FAQPage -->
## Questions fréquemment posées

### Qu'est-ce que l'utilisation des outils par les agents IA ?

L'utilisation des outils par les agents IA est le mécanisme par lequel un grand modèle de langage demande l'exécution de fonctions externes — recherche web, appels API, requêtes de base de données, opérations sur les fichiers — en émettant du JSON d'appel d'outil structuré qu'un runtime intercepte, valide contre un schéma et exécute. Le LLM n'exécute jamais directement ; il décrit seulement ce qu'il veut appeler et avec quels arguments.

### Comment fonctionnent les appels de fonctions dans les agents IA ?

Les appels de fonctions fonctionnent dans une boucle demande-exécution-retour : l'agent reçoit une tâche et une liste d'outils disponibles ; le LLM émet un appel d'outil nommant la fonction et fournissant des arguments ; le runtime valide ces arguments, exécute la fonction et injecte le résultat comme résultat d'outil dans le contexte.

### Qu'est-ce qui fait un bon schéma d'outil pour les agents IA ?

Un bon schéma d'outil utilise un nom verbe-nom (`search_web`, `create_ticket`), une description qui indique sans ambiguïté quand l'utiliser, des paramètres fortement typés avec des énumérations, et un tableau `required`. tau-bench (2025) montre que la construction incorrecte des arguments est le mode d'échec le plus courant.

### Que sont les appels d'outils parallèles et quand les utiliser ?

Les appels d'outils parallèles permettent à un agent de demander plusieurs exécutions d'outils dans un seul tour LLM, dispatchées de manière concurrente. Les utiliser quand les outils sont indépendants — leurs sorties ne dépendent pas les unes des autres et ils n'écrivent pas sur des ressources avec état partagées.

### Comment prévenir les boucles d'appels d'outils dans les agents IA ?

Les boucles d'appels d'outils surviennent quand un agent continue d'invoquer des outils sans converger vers une réponse finale. La seule prévention fiable est un budget d'étapes appliqué au niveau de l'infrastructure : un maximum absolu d'appels d'outils par exécution d'agent, appliqué par l'orchestrateur.

### Quel est le risque de sécurité de l'utilisation des outils par les agents IA ?

Le risque principal est l'injection de résultat d'outil : quand un agent appelle un outil retournant du contenu contrôlé par un attaquant qui peut rediriger le comportement de l'agent. OWASP LLM Top 10 v1.1 (2025) liste l'injection de prompt comme le risque principal. Les mitigations incluent la sanitisation des sorties, l'attribution des outils selon le moindre privilège et les portes human-in-the-loop pour les actions irréversibles.

### Quelle est la différence entre les outils intégrés, les outils MCP et les outils personnalisés ?

Les outils intégrés sont fournis par le runtime de l'agent avec l'application ACL déjà en place. Les outils MCP sont servis par des serveurs Model Context Protocol exposant des capacités externes via JSON-RPC ; ils requièrent un sandboxing et une portée de permissions par serveur. Les outils personnalisés sont des fonctions que vous écrivez et enregistrez, offrant une flexibilité totale mais avec la responsabilité de la validation et de la sécurité.

### Comment les différents fournisseurs de LLM implémentent-ils l'utilisation des outils ?

OpenAI utilise le paramètre `tools`, `tool_calls` dans la réponse de l'assistant, messages de résultat `role: "tool"`. Anthropic utilise des blocs de contenu `tool_use` avec des blocs `tool_result` dans le tour humain suivant. Google Gemini utilise `functionDeclarations` avec des parties `functionCall` dans les réponses et des parties `functionResponse` dans les tours suivants. Les trois formats sont sémantiquement équivalents mais syntaxiquement différents.

## Définir vos outils une fois, les exécuter en sécurité partout

tau-bench (2025) place GPT-4o à 44% pass@1 sur les tâches d'utilisation d'outils, avec la construction des arguments comme catégorie d'échec dominante. Des schémas précis avec des noms verbe-nom, des énumérations typées et des exemples de paramètres comblent la majeure partie de cet écart.

Pour les [motifs de flux de travail agentiques](/learn/agentic-workflows) couvrant les budgets d'étapes et la prévention des boucles, et pour les [benchmarks d'évaluation des agents IA](/learn/ai-agent-evaluation) mesurant la fiabilité de l'utilisation des outils, ces guides étendent les fondations couvertes ici.

[Construire des agents utilisant des outils avec application ACL par agent sur OpenLegion →](https://openlegion.ai)
