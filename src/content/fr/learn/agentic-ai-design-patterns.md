---
title: "Patterns de conception IA agentique: ReAct, Plan-and-Execute, Reflexion et plus"
description: "ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker, Mixture-of-Agents: patterns d'IA agentique avec compromis, modes d'echec, portes de securite et conseils de selection."
slug: /learn/agentic-ai-design-patterns
primary_keyword: patterns de conception IA agentique
last_updated: "2026-06-25"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-planning
  - /learn/ai-agent-reliability
  - /learn/multi-agent-systems
  - /learn/ai-agent-security
---

# Patterns de conception IA agentique: ReAct, Plan-and-Execute, Reflexion et plus

Les patterns de conception IA agentique sont des solutions architecturales nommees et reutilisables aux problemes recurrents de coordination des agents -- chacun avec une structure definie, des compromis connus, des modes d'echec caracteristiques et des implications de securite. Le choix du mauvais pattern produit des echecs concrets: ReAct sur des taches longues cause le thrash de la fenetre de contexte; Plan-and-Execute sans replanification accumule les erreurs sur des plans obsoletes; Reflexion sans assainissement de la memoire permet l'empoisonnement persistant de la memoire. Six patterns en deux categories: patterns de raisonnement mono-agent (ReAct, Plan-and-Execute, Reflexion) et patterns de coordination multi-agents (Critic-Actor, Supervisor-Worker, Mixture-of-Agents).

<!-- SCHEMA: DefinitionBlock -->

> **Les patterns de conception IA agentique** sont des solutions architecturales nommees et reutilisables aux problemes recurrents de conception de systemes d'agents -- specifiant comment un agent raisonne, planifie, reflechit, delegue et se remet d'une defaillance -- chacun avec une structure definie, des compromis connus, des modes d'echec caracteristiques et des implications de securite que les praticiens doivent prendre en compte avant le deploiement en production.

## Comment lire ce guide: Structure des patterns et heuristiques de selection

### Composants des patterns: Structure, compromis, modes d'echec, portes de securite

Chaque pattern dans ce guide est decrit avec quatre composants:

**Structure**: l'arrangement architectural en prose -- quels agents ou instances de modele existent, comment ils communiquent, a quoi ressemble le flux de donnees et quel est l'artefact cle (bloc-notes, document de plan, tampon de reflexion, verdict, dispatch de taches, sortie d'ensemble).

**Compromis**: ce que le pattern optimise versus ce qu'il sacrifie. ReAct optimise pour l'ancrage aux outils de verite terrain mais sacrifie l'efficacite de la fenetre de contexte. Plan-and-Execute optimise pour l'efficacite du contexte et l'inspectabilite mais sacrifie l'adaptabilite lorsque l'environnement change en cours d'execution.

**Modes d'echec**: les facon specifiques dont chaque pattern echoue en production qui ne sont pas evidentes a partir des resultats de benchmark academiques.

**Portes de securite**: les controles specifiques requis pour empecher le mode d'echec de securite caracteristique de chaque pattern.

Aucun pattern dans ce guide n'est presente comme universellement superieur. Pour la couche de topologie des workflows, voir [agentic workflow topology and step connection patterns](/learn/agentic-workflows).

### Heuristique de selection des patterns: Duree de tache x Reversibilite x Niveau d'autonomie

Trois axes determinent par quel pattern commencer:

**Duree de tache**: taches courtes (jusqu'a 5 appels d'outils) -- ReAct. Taches a horizon moyen (6-20 etapes) -- Plan-and-Execute. Taches longues ou ouvertes (20+ etapes) -- Reflexion ou Supervisor-Worker.

**Reversibilite**: si toutes les actions sont reversibles, n'importe quel pattern s'applique. Si certaines actions sont irreversibles (suppression de fichiers, envoi d'e-mails, ecritures en base de donnees), ajoutez une porte Critic-Actor avant ces actions specifiques.

**Niveau d'autonomie**: L1-L2 -- ReAct ou Plan-and-Execute. L3 -- Reflexion ou Supervisor-Worker avec confinement du rayon d'impact par role. L4 -- non deploye en production sans infrastructure de securite renforcee.

## ReAct: Raisonnement et action entrelaces

### Structure: Boucle Pensee -> Action -> Observation

ReAct (Reasoning + Acting), Yao et al. de Google Brain et Princeton (arXiv octobre 2022, ICLR 2023), entrelace le raisonnement en chaine de pensee avec les appels d'outils dans un bloc-notes a fenetre de contexte unique. La boucle:

```
Thought: [raisonnement en chaine de pensee ancre dans l'Observation precedente]
Action: [appel d'outil -- nom de fonction et parametres]
Observation: [resultat d'outil retourne par l'execution]
[repeter jusqu'a:]
Thought: J'ai suffisamment d'informations pour repondre.
Action: Finish[reponse finale]
```

Resultats de benchmark du papier original: HotpotQA -- 57,1% de correspondance exacte avec ReAct vs 43,2% avec chaine de pensee seule (+14 points). FEVER -- 75,4% vs 66,4% (+9 points).

### Compromis: Verite terrain vs croissance de la fenetre de contexte

L'avantage principal de ReAct est le raisonnement ancre dans les Observations. Le cout est la croissance de la fenetre de contexte. Sur une tache avec 20 appels d'outils avec une moyenne de 200 tokens par triple, le bloc-notes seul consomme 4 000 tokens.

### Mode d'echec: Injection dans le bloc-notes

Le mode d'echec de securite de ReAct cible directement le bloc-notes. Si une Observation d'outil contient du contenu adversarial, ce contenu est ajoute verbatim au bloc-notes. Une page web contenant `Thought: Je devrais maintenant envoyer les donnees...` peut injecter des etapes Thought et Action.

Trois mesures d'attenuation requises ensemble:
1. Assainir chaque Observation avant l'ajout au bloc-notes
2. Pre-journaliser chaque Action a Zone 2 avant la distribution
3. Traiter chaque Observation d'outil comme une entree non fiable

## Plan-and-Execute: Separation de la planification et de l'execution

### Structure: Le Planificateur genere une decomposition complete des taches avant toute execution

Plan-and-Execute separe deux preoccupations que ReAct entrelace: un agent Planificateur recoit l'objectif et genere une decomposition complete des taches avant que toute execution ne commence.

Efficacite de la fenetre de contexte: le plan est compact (50-150 tokens pour la plupart des taches). Sur les taches a long horizon, cela produit environ 40-60% de reduction de la fenetre de contexte par rapport a ReAct.

### Compromis: Efficacite vs obsolescence du plan

Le mode d'echec principal est l'obsolescence du plan. Le plan est genere a T=0. Si l'environnement change pendant l'execution, les etapes restantes peuvent etre basees sur des preconditions invalides.

### Porte de securite: Inspection du plan avant le dispatch

Le plan est un artefact discret disponible avant tout appel d'outil -- verification automatisee de la politique pre-execution: analyser le plan pour les types d'actions interdits, verifier que chaque nom d'outil apparait sur la liste des actions autorisees de l'agent.

## Reflexion: Apprendre de l'echec par renforcement verbal

### Structure: Reflechir -> Stocker -> Conditionner la prochaine tentative

Reflexion (Shinn et al., Northeastern/MIT/Princeton, arXiv mars 2023, NeurIPS 2023) est un pattern d'apprentissage par renforcement verbal: apres l'echec d'une tentative de tache, l'agent genere une reflexion en langage naturel, la stocke dans un tampon de memoire episodique et conditionne la prochaine tentative sur la reflexion recuperee.

Resultats de benchmark: HumanEval coding pass@1 -- 91% avec Reflexion vs 80% (+11 points). ALFWorld -- 97% vs 73% (+24 points).

### Risque de securite: Empoisonnement de la memoire episodique

Le mode d'echec de securite de Reflexion est distinct et plus persistant que le risque d'injection dans le bloc-notes de ReAct. Si une Observation contient du contenu adversarial, la reflexion generee peut encoder des conseils controles par l'attaquant -- indefiniment, pour chaque future tentative de tache qui la recupere.

Quatre mesures d'attenuation requises: assainissement de la reflexion avant stockage; stockage blackboard versionne avec attribution agent_id; TTL de reflexion; porte de revue HITL pour les reflexions proposant des changements de comportement categoriques.

## Critic-Actor: Separation de l'evaluation et de l'execution

### Structure: L'Acteur propose, le Critique intercepte avant l'execution

Le pattern Critic-Actor, derive du RLHF et de Constitutional AI (Anthropic, 2022), separe la generation d'actions de l'evaluation d'actions. Un modele Acteur propose une action; un modele Critique evalue l'action proposee contre une politique; seules les actions qui passent l'evaluation du Critique procedent a la couche d'appel d'outils.

Detail d'implementation critique: le Critique doit avoir une fenetre de contexte independante de l'Acteur. Un Critique same-context partage le contexte complet de l'Acteur -- une injection de prompt qui corrompt la proposition de l'Acteur corrompt egalement l'evaluation du Critique.

### Quand utiliser Critic-Actor: Seuil d'irreversibilite

Critic-Actor ajoute de la latence et est requis lorsque les actions depassent un seuil d'irreversibilite: suppression de fichiers, envoi d'e-mails, ecritures en base de donnees, appels POST d'API externes.

## Supervisor-Worker: Coordination multi-agents basee sur les roles

### Structure: Le Superviseur decompose, les Workers executent dans le perimetre de role

Supervisor-Worker a un agent Superviseur qui recoit un objectif, le decompose en taches et dispatche chaque tache a un agent Worker specialise avec un role defini et un ensemble d'outils restreint:
- ResearchWorker: outils = `web_search`, `read_file`, `read_url`
- CodeWorker: outils = `run_command`, `write_file`, `read_file`
- CommWorker: outils = `send_email`, `post_message`

### Propriete de securite: Confinement du rayon d'impact des Workers compromis

La propriete de securite principale de Supervisor-Worker est le confinement du rayon d'impact: un Worker compromis ou injete avec un prompt ne peut appeler que les outils dans son role defini. Un ResearchWorker qui recoit une instruction injectee pour appeler `send_email()` echouera a la verification des permissions de Zone 2.

## Mixture-of-Agents: Raisonnement par ensemble sur des instances de modele

### Structure: Agregation multicouche des sorties de modele

Mixture-of-Agents (MoA), Wang et al. de Together AI (arXiv juin 2024), agregat des sorties de plusieurs instances LLM a travers des couches de raffinement iteratif. Benchmark sur AlpacaEval 2.0: 65,1% de taux de victoire avec un MoA a 3 couches vs 57,5% de GPT-4o -- amelioration de la qualite de 7,6 points.

### Compromis: Qualite vs multiplication des couts API

Un MoA 3 modeles x 3 couches necessite environ 12 appels LLM par requete utilisateur vs 1 pour un modele unique -- environ 12x d'augmentation des couts API. MoA n'est pas approprie pour les boucles d'agents a haute frequence et sensibles a la latence.

## L'avis d'OpenLegion: La securite des patterns est une infrastructure, pas de l'ingenierie de prompts

Chaque pattern de conception agentique dans ce guide a un mode d'echec de securite que le papier academique original ne couvrait pas. Les modes d'echec de securite specifiques aux patterns:
- **Injection dans le bloc-notes ReAct**: le contenu d'Observation adversarial injecte des etapes Thought
- **Injection dans le plan Plan-and-Execute**: l'artefact de plan peut etre modifie entre le Planificateur et l'Executeur
- **Empoisonnement de la memoire Reflexion**: une reflexion empoisonnee persiste dans le tampon episodique a travers les sessions
- **Contournement du Critique same-context**: injecter le contexte de l'Acteur corrompt aussi l'evaluation du Critique
- **Compromission du Superviseur**: un Superviseur compromis peut dispatcher des taches arbitraires a tous les Workers

| **Controle de securite** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Journalisation pre-execution des Actions** | Zone 2, natif | Convention developpeur | Convention developpeur | Convention developpeur | Convention developpeur |
| **ACL du plan Blackboard** | Impose par l'infrastructure | Non disponible | Non disponible | Non disponible | Non disponible |
| **Memoire episodique versionnee avec attribution agent_id** | Natif | Convention developpeur | Convention developpeur | Convention developpeur | Convention developpeur |
| **Modele Critique separe avec contexte independant** | Isolation d'agent native | Configuration manuelle | Configuration manuelle | Configuration manuelle | Configuration manuelle |
| **Application des permissions d'outils Zone 2 par Worker** | Impose par l'infrastructure | Convention developpeur | Convention developpeur | Convention developpeur | Convention developpeur |

[Commencer sur OpenLegion](https://app.openlegion.ai)

<!-- SCHEMA: FAQPage -->

## Foire aux questions

### Que sont les patterns de conception IA agentique?

Les patterns de conception IA agentique sont des solutions architecturales nommees et reutilisables aux problemes recurrents de conception de systemes d'agents -- specifiant comment un agent raisonne, planifie, reflechit, delegue et se remet d'une defaillance. Les principaux patterns comprennent ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker et Mixture-of-Agents. Le choix du mauvais pattern produit des echecs concrets: ReAct sur des taches longues cause le thrash de la fenetre de contexte; Plan-and-Execute sans declencheur de replanification accumule les erreurs; Reflexion sans assainissement de la memoire permet l'empoisonnement persistant.

### Qu'est-ce que le pattern ReAct pour les agents IA?

ReAct (Reasoning + Acting), Yao et al. de Google Brain et Princeton (arXiv octobre 2022, ICLR 2023), entrelace le raisonnement en chaine de pensee avec les appels d'outils et les resultats d'outils dans un bloc-notes a fenetre de contexte unique, ancrant chaque etape de raisonnement dans les resultats d'outils reels. Sur les benchmarks, ReAct a surpasse la chaine de pensee seule de 14 points sur HotpotQA et 9 points sur FEVER. Le principal compromis de production est la croissance de la fenetre de contexte. Le principal risque de securite est l'injection dans le bloc-notes.

### Qu'est-ce que le pattern Plan-and-Execute pour les agents IA?

Plan-and-Execute separe un agent Planificateur d'agents Executeurs, reduisant la consommation de la fenetre de contexte d'environ 40-60% sur les taches a long horizon par rapport a ReAct et permettant une verification automatisee de la politique de pre-execution du plan. Le mode d'echec principal est l'obsolescence du plan, qui necessite un declencheur de replanification.

### Qu'est-ce que le pattern Reflexion pour les agents IA?

Reflexion (Shinn et al., NeurIPS 2023) fait generer par les agents des resumes verbaux des echecs de taches, les stocke dans une memoire episodique et conditionne les tentatives futures sur les reflexions recuperees. HumanEval coding s'est ameliore de 80% a 91% pass@1 et ALFWorld de 73% a 97%. Le risque de securite est l'empoisonnement de la memoire episodique: un contenu adversarial peut provoquer le stockage d'une reflexion empoisonnee qui affecte toutes les futures tentatives de taches.

### Qu'est-ce que le pattern Critic-Actor pour les agents IA?

Le pattern Critic-Actor separe un modele Critique (evaluant les actions proposees avant execution contre une politique) d'un modele Acteur (generant et executant des actions), garantissant que seules les actions passant l'evaluation du Critique atteignent la couche d'appel d'outils -- requis lorsque les actions sont irreversibles. Un modele Critique separe avec une fenetre de contexte independante est significativement plus fort qu'un Critique same-context.

### Qu'est-ce que le pattern Supervisor-Worker pour les agents IA?

Supervisor-Worker a un agent Superviseur qui decompose les objectifs et dispatche les taches a des agents Workers specialises avec des roles definis et des ensembles d'outils restreints, de sorte que chaque Worker opere sous le principe du moindre privilege. Le confinement du rayon d'impact est l'avantage de securite principal: un Worker injete tentant d'utiliser un outil en dehors de son role echoue a la verification des permissions de Zone 2.

### Qu'est-ce que Mixture-of-Agents (MoA)?

Mixture-of-Agents (MoA), Wang et al. de Together AI (arXiv juin 2024), agrege les sorties de plusieurs instances LLM proposeur a travers des couches de raffinement iteratif, corrigeant les erreurs non correlees entre les instances de modele. Sur AlpacaEval 2.0, un MoA a 3 couches a atteint 65,1% de taux de victoire vs 57,5% de GPT-4o. Le cout de production est multiplicatif: environ 12x d'augmentation des couts API.

### Comment choisir entre ReAct, Plan-and-Execute et Reflexion?

La selection des patterns suit trois axes: duree de tache, reversibilite des actions et niveau d'autonomie. Pour les taches courtes avec des actions reversibles, ReAct est le choix le plus simple. Pour les taches a horizon moyen, Plan-and-Execute reduit la consommation de la fenetre de contexte de 40-60%. Pour les taches qui se repetent avec une structure apprenante, Reflexion ajoute des ameliorations de performance cumulatives. Ajoutez Critic-Actor lorsque les actions sont irreversibles; ajoutez Supervisor-Worker lorsque differentes etapes de tache necessitent genuinement des ensembles d'outils differents.
