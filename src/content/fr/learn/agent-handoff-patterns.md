---
title: "Patterns de transfert d'agents : routage de tâches entre agents IA"
description: "Les patterns de transfert d'agents définissent comment les agents IA transfèrent tâches, contexte et identifiants : transfert push, dispatch pull, routage par pointeur blackboard et transfert en streaming pour les systèmes multi-agents."
slug: /learn/agent-handoff-patterns
primary_keyword: "agent handoff patterns"
last_updated: "2026-06-14"
schema_types:
  - FAQPage
related:
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/agentic-workflows
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-observability
---

# Patterns de transfert d'agents : routage de tâches entre agents IA

Les patterns de transfert d'agents sont les protocoles par lesquels un agent IA transfère une tâche, le contexte accumulé et l'autorité d'exécution à un autre agent. Ils déterminent quelles données franchissent la frontière, ce qui est écarté et si les identifiants voyagent avec la tâche. La plupart des échecs de transfert ne sont pas des échecs de routage ; ce sont des pertes de contexte ou des fuites d'identifiants qui ne se révèlent que quand un agent en aval échoue silencieusement ou qu'un agent compromis exfiltre des données sensibles.

<!-- SCHEMA: DefinitionBlock -->
Un pattern de transfert d'agents est un patron de conception logiciel qui régit la façon dont un agent IA autonome délègue une tâche à un agent pair ou spécialiste, en spécifiant le contrat de données pour le transfert de contexte, le mécanisme de routage pour la livraison de tâches et les garanties d'isolation qui empêchent les fuites d'identifiants ou de contexte entre agents.

## Les quatre patterns de transfert canoniques

### Transfert push : l'appelant réveille directement l'appelé

Dans le transfert push, l'agent appelant construit une charge utile contenant le contexte de tâche et notifie directement l'agent récepteur, typiquement en appelant une fonction, en envoyant un message ou en invoquant une API qui réveille l'appelé. L'appelant contrôle exactement quelles données l'appelé reçoit, quand il les reçoit et quel agent traite la tâche.

Le transfert push est le pattern utilisé par la primitive `handoff()` du SDK OpenAI Agents (27 133 étoiles GitHub, MIT). L'appelant peut optionnellement passer une fonction `input_filter` qui supprime ou transforme les champs de contexte avant le transfert. Sans `input_filter`, la totalité de la fenêtre de contexte passe à l'appelé, y compris tout contenu sensible accumulé.

**Points forts** : faible latence, contrôle direct du routage, simple à tracer dans les outils d'observabilité.  
**Risques** : l'appelant doit explicitement supprimer les identifiants et le contexte sensible ; le couplage étroit entre appelant et appelé exige des modifications quand des agents spécialisés sont ajoutés ou supprimés.

### Dispatch pull : l'appelé réclame depuis une file partagée

Dans le dispatch pull, l'agent appelant écrit une tâche dans une file partagée ou une boîte de réception sans notifier directement un agent spécifique. Les agents appelés surveillent la file et réclament les tâches correspondant à leurs capacités. Cela permet l'équilibrage de charge sur un pool de workers et découple l'appelant de la connaissance de l'agent qui traitera le travail.

Le dispatch pull réduit l'exposition des identifiants : le message de file ne contient qu'une description de tâche et un pointeur de clé de sortie, pas le contexte complet de l'appelant.

**Points forts** : mise à l'échelle horizontale, couplage lâche, équilibrage de charge naturel.  
**Risques** : la profondeur de file peut croître sans limite sous charge ; les garanties d'ordre dépendent de la sémantique de la file ; l'observabilité nécessite de corréler les ID de tâches.

### Routage blackboard : isolation de contexte par pointeur

Dans le transfert par pointeur blackboard, l'appelant écrit sa sortie dans une clé nommée sur un store persistant partagé, par exemple `output/researcher/task_abc123`, et envoie à l'appelé uniquement le nom de la clé. L'appelé lit la clé et récupère exactement les champs dont il a besoin. Les identifiants bruts, les scratchpads intermédiaires et le contexte complet de l'appelant n'apparaissent jamais dans le message de transfert.

La fonction `hand_off()` d'OpenLegion implémente ce pattern nativement : elle écrit les données de sortie dans `output/{agent_id}/{handoff_id}` sur le blackboard, crée une entrée de tâche dans la boîte de réception du destinataire avec un pointeur vers cette clé, et réveille le destinataire. Les identifiants stockés dans le vault sont injectés par le mesh au moment de l'exécution.

**Points forts** : isolation maximale des identifiants, l'appelé lit uniquement ce dont il a besoin, piste d'audit complète via l'historique des versions de clés.  
**Risques** : ajoute une opération de lecture ; nécessite un store partagé fiable avec des contrôles d'accès appropriés.

### Transfert en streaming : transfert de contexte incrémental

Dans le transfert en streaming, le contexte est transféré jeton par jeton ou bloc par bloc à mesure que l'agent appelant le génère, plutôt que d'attendre la sortie complète. Cela minimise la latence de bout en bout dans les pipelines temps réel.

Le transfert en streaming comporte le risque le plus élevé d'exposition des identifiants : le flux peut inclure du contenu sensible généré en milieu de raisonnement avant que l'appelant ait pu le filtrer.

**Points forts** : latence de bout en bout la plus faible, collaboration multi-agents en temps réel.  
**Risques** : le plus difficile à sécuriser, le plus complexe à observer, nécessite que l'appelé gère le contexte partiel.

## L'avis d'OpenLegion : pourquoi la perte de contexte et les fuites d'identifiants sont les vrais bugs de transfert

La plupart des échecs de transfert multi-agents tombent dans deux catégories : les bugs de perte de contexte et les bugs de fuite d'identifiants. Les deux sont évitables par conception.

**Chiffres sur la perte de contexte** : les évaluations de compression de contexte LLM montrent que la troncation naïve à la frontière de transfert dégrade les taux de complétion de tâches par rapport à la résumisation structurée. La solution n'est pas une fenêtre de contexte plus grande, mais une charge utile de transfert structurée avec des champs explicites pour le travail accompli, le travail restant et les conclusions clés.

**Fuite d'identifiants** : OWASP LLM06:2025 (Divulgation d'informations sensibles) couvre explicitement l'exfiltration d'identifiants via la transmission de messages entre agents comme l'une des 10 principales vulnérabilités LLM.

### Le problème de perte de contexte : ce qui est abandonné à la frontière

La cause racine de la perte de contexte est le décalage entre ce que l'agent appelant sait et ce que la charge utile de transfert communique. Les charges utiles structurées l'évitent : l'appelant remplit explicitement des champs : objectif de tâche, travail accompli jusqu'ici, sous-tâches en suspens, conclusions clés et pointeur de clé de sortie.

### Exfiltration d'identifiants via les charges utiles de transfert (OWASP LLM06:2025)

`transfer_to_agent()` de Google ADK passe le `Session` complet, y compris l'historique de conversation, à l'agent récepteur, créant un transfert de contexte pouvant atteindre 32 000 jetons par défaut. Les équipes doivent auditer leurs implémentations de transfert contre la [sécurité des agents IA : isolation des identifiants et défense contre l'injection de prompt](/learn/ai-agent-security).

### Le pattern pointeur blackboard comme valeur par défaut sécurisée

Le pattern pointeur blackboard élimine l'exposition des identifiants au niveau du protocole plutôt que de s'appuyer sur le filtrage applicatif. Les identifiants stockés dans le vault d'OpenLegion ne sont jamais injectés dans le contexte de l'agent.

## Comment les principaux frameworks implémentent le transfert

### OpenAI Agents SDK : handoff() avec input_filter (27 133 étoiles)

openai/openai-agents-python (27 133 étoiles GitHub, licence MIT) implémente handoff() comme un pattern push. Le paramètre `input_filter` a été ajouté en v0.0.5 (mars 2025) et nécessite un opt-in explicite.

```python
from agents import Agent, handoff, RunContextWrapper

def strip_credentials(ctx: RunContextWrapper, input_data: ResearchInput) -> ResearchInput:
    return ResearchInput(task=input_data.task, context=input_data.context)

researcher = Agent(
    name="researcher",
    handoffs=[handoff(writer_agent, input_filter=strip_credentials)]
)
```

### Google ADK : transfer_to_agent() et transfert d'objet Session (20 100 étoiles)

google/adk-python (20 100 étoiles GitHub, Apache-2.0) implémente le transfert via `transfer_to_agent()`, qui passe le `Session` complet incluant l'historique de conversation. L'agent récepteur reçoit tout et doit explicitement écarter l'historique non pertinent.

### LangGraph : Command(goto=) avec état typé partagé

LangGraph (langchain-ai/langgraph, Apache-2.0) implémente le routage d'agents via `Command(goto='nom_noeud')` avec des mises à jour d'état optionnelles. L'état est un dict typé partagé entre tous les noeuds du graphe. Le modèle d'état partagé de LangGraph ne fournit pas d'isolation des identifiants entre noeuds.

```python
from langgraph.types import Command

def researcher_node(state: AgentState) -> Command:
    result = researcher.invoke(state)
    return Command(
        goto="writer",
        update={"research_output": result, "completed_steps": state["completed_steps"] + ["research"]}
    )
```

### OpenLegion : hand_off() avec pointeur blackboard et livraison en boîte de réception

La fonction `hand_off()` d'OpenLegion implémente le transfert par pointeur blackboard nativement.

```python
hand_off(
    to="writer",
    summary="Recherche terminée : langchain-alternative, 2847 mots de matériau source",
    data='{"topic": "langchain-alternative", "sources_key": "research/langchain-alt-sources", "word_count_target": 3000}'
)
```

## Contrats de données de transfert

### Ce qu'il faut inclure : résumé de tâche, clé de sortie, historique pertinent

Une charge utile de transfert bien conçue est une spécification structurée, pas un vidage de transcription. Inclure :

- **Résumé de tâche** (200 mots maximum) : ce que l'appelé doit accomplir
- **Pointeur de clé de sortie** : la clé blackboard où la sortie de l'appelant est stockée
- **Résumé du travail accompli** : ce qui a déjà été fait, formulé comme des faits
- **Sous-tâches en suspens** : les éléments spécifiques dont l'appelé est responsable
- **Paramètres structurés** : toutes les entrées typées requises par la tâche de l'appelé

### Ce qu'il faut exclure : identifiants bruts, fenêtres de contexte complètes, scratchpads intermédiaires

Exclure des charges utiles de transfert :
- **Clés API, jetons et identifiants** : ils doivent être injectés par le mesh au moment de l'exécution
- **Transcriptions complètes de conversation** : tronquer aux résumés pertinents
- **Scratchpads de raisonnement intermédiaire** : le chaîne de pensée de l'appelant n'est pas utile à l'appelé
- **Données que le rôle de l'appelé ne requiert pas** : appliquer le moindre privilège au contexte

## Mécanismes de routage de transfert

### Routage statique : ID d'agents codés en dur

Le routage statique envoie chaque transfert d'un type donné à un agent nommé spécifique. Simple à implémenter, facile à tracer. Se casse quand l'agent cible est indisponible, surchargé ou remplacé.

### Routage dynamique : spécialiste sélectionné par LLM

Le routage dynamique utilise un appel LLM pour sélectionner l'agent spécialiste approprié en fonction des caractéristiques de la tâche. Offre de la flexibilité mais ajoute de la latence et introduit la possibilité d'erreurs de routage.

### Routage conditionnel : escalade basée sur des règles

Le routage conditionnel applique des règles déterministes pour sélectionner l'agent cible. Plus prévisible que le routage LLM, mais nécessite une définition explicite des règles pour chaque condition de routage.

### Gestion des fallbacks et des timeouts

Chaque transfert doit définir ce qui se passe quand l'appelé ne répond pas dans une fenêtre de timeout. Options :
- **Réessayer avec le même appelé** : approprié quand l'échec est probablement transitoire
- **Réacheminer vers un agent alternatif** : approprié quand l'appelé principal est durablement indisponible
- **Escalader à l'opérateur** : approprié quand la tâche nécessite un jugement humain
- **Écrire l'échec dans le blackboard et continuer** : approprié quand la tâche en aval est optionnelle

## Comparaison sécurité et fiabilité des patterns de transfert

| **Dimension** | **Transfert push** | **Dispatch pull** | **Routage blackboard** | **Transfert streaming** |
|---|---|---|---|---|
| **Mécanisme de routage** | Appel direct de réveil à l'appelé | File partagée / réclamation en boîte de réception | Écriture de clé + surveillance appelé | Flux de jetons incrémental |
| **Isolation de contexte** | L'appelant contrôle la charge utile ; input_filter requis | Message de file uniquement | La plus haute : l'appelé lit uniquement la clé nommée | La plus basse : le contexte complet franchit la frontière |
| **Risque d'exposition des identifiants** | Moyen : dépend de l'opt-in input_filter | Faible : la file ne contient qu'un pointeur de tâche | Très faible : identifiants jamais dans la charge utile | Élevé : le flux peut inclure un contexte sensible |
| **Observabilité** | Événement de trace unique par transfert | Profondeur de file + événements de réclamation | Historique des versions de clés + événements de boîte de réception | Traçage au niveau des jetons requis |
| **Latence** | La plus faible | Faible (overhead de lecture de file) | Faible (overhead de lecture blackboard) | La plus faible de bout en bout (streaming) |
| **Optimal pour** | Délégation spécialisée étroitement couplée | Pools de workers à charge équilibrée | Pipelines asynchrones découplés | Collaboration en temps réel |

<!-- SCHEMA: FAQPage -->
## Foire aux questions

### Qu'est-ce qu'un pattern de transfert d'agents ?

Un pattern de transfert d'agents est un protocole de transfert d'une tâche d'un agent IA à un autre, spécifiant quelles données de contexte franchissent la frontière, comment l'agent récepteur est notifié et quelles garanties d'isolation empêchent les fuites d'identifiants ou de mémoire. Les quatre patterns canoniques sont le transfert push, le dispatch pull, le routage par pointeur blackboard et le transfert en streaming, chacun avec des compromis différents en matière de sécurité, latence et observabilité.

### Comment le SDK OpenAI Agents implémente-t-il le transfert ?

Le SDK OpenAI Agents (27 133 étoiles GitHub, MIT) implémente handoff() comme un pattern push. L'agent appelant invoque handoff() avec un agent cible et une fonction optionnelle input_filter qui supprime des champs du contexte avant le transfert. Le paramètre input_filter a été ajouté en v0.0.5 (mars 2025) et nécessite un opt-in explicite ; sans lui, la fenêtre de contexte complète passe à l'appelé.

### Comment Google ADK implémente-t-il le transfert d'agents ?

Google ADK (20 100 étoiles GitHub, Apache-2.0) utilise transfer_to_agent(), qui passe le `Session` complet incluant l'historique de conversation à l'agent récepteur. Cela crée un transfert de contexte pouvant atteindre 32 000 jetons par défaut. L'agent récepteur reçoit l'historique complet et doit explicitement écarter le contexte précédent non pertinent.

### Qu'est-ce que le pattern de transfert par pointeur blackboard et pourquoi est-il plus sécurisé ?

Dans le transfert par pointeur blackboard, l'appelant écrit sa sortie dans une clé nommée sur un store partagé (comme output/agent-id/task-id), puis envoie à l'appelé uniquement le pointeur de clé, pas les données elles-mêmes. L'appelé lit uniquement les champs dont il a besoin. Les identifiants n'apparaissent jamais dans le message de transfert, éliminant le vecteur d'exfiltration OWASP LLM06:2025. La fonction hand_off() d'OpenLegion implémente ce pattern nativement.

### Quels risques de sécurité existent dans le transfert d'agents ?

Le risque principal est l'exfiltration d'identifiants : les frameworks qui incluent des variables d'environnement, des jetons bearer ou des clés API dans l'objet de contexte passé lors du transfert les exposent à l'agent récepteur, qui peut être compromis. OWASP LLM06:2025 identifie cela comme une vulnérabilité LLM top 10. Le risque secondaire est l'empoisonnement de contexte.

### Comment gérer les échecs de transfert et les timeouts ?

Les pipelines de transfert robustes définissent un timeout et un chemin de fallback : réessayer avec le même appelé, réacheminer vers un spécialiste alternatif, escalader à un opérateur humain ou écrire un enregistrement d'échec dans le blackboard. L'agent appelant doit suivre les ID de transfert et surveiller les événements de complétion de tâche.

### Quelles données inclure dans une charge utile de transfert ?

Inclure : un résumé de tâche concis (moins de 200 mots), un pointeur vers la clé de données de sortie sur le store partagé, les faits du travail accompli, les sous-tâches en suspens et tous les paramètres structurés requis par le rôle de l'appelé. Exclure : les identifiants API bruts, les transcriptions complètes de conversation, les scratchpads de raisonnement intermédiaire et toutes les données que le rôle de l'appelé ne nécessite pas.

## Transfert sécurisé d'agents dans OpenLegion

La frontière de transfert est l'origine de la plupart des problèmes de fiabilité multi-agents. La perte de contexte dégrade la qualité des tâches en aval, et les fuites d'identifiants dans la charge utile créent un risque d'exfiltration qui croît avec la longueur du pipeline.

Le transfert par pointeur blackboard d'OpenLegion résout les deux problèmes au niveau du protocole. `hand_off()` écrit les sorties dans une clé nommée, ne livre qu'un pointeur à la boîte de réception du destinataire et s'appuie sur l'injection d'identifiants proxifiée par vault. Le destinataire lit exactement ce dont il a besoin, rien de plus.

Pour la couche de surveillance qui détecte les échecs que le protocole de transfert manque, voir [observabilité des agents : tracer les transferts à travers les étapes de pipeline](/learn/ai-agent-observability). Pour la couche de framework qui détermine quel pattern de transfert choisir, voir [comparaison des frameworks d'agents IA pour les déploiements en production](/learn/ai-agent-frameworks).

[Construire des pipelines multi-agents sécurisés sur OpenLegion →](https://openlegion.ai)
