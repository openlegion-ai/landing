---
title: Plateforme d'agents IA — Déployer des agents sécurisés
description: >-
 OpenLegion est une plateforme d'agents IA managée avec isolation par
 conteneur, coffre-fort d'identifiants et contrôles de budget. Apportez vos
 propres clés API LLM.
slug: /learn/ai-agent-platform
primary_keyword: plateforme d'agents IA
secondary_keywords:
 - managed ai agent platform
 - self-hosted agent deployment
 - ai agent cost control
 - ai agent credential security
 - production ai agent infrastructure
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-security
 - /learn/ai-agent-frameworks
 - /comparison
---

# La plateforme d'agents IA conçue pour la production

La plupart des équipes commencent par un framework. Elles enchaînent des nœuds LangGraph ou des crews CrewAI, font fonctionner une démo, puis se heurtent à un mur : qui gère les conteneurs ? Où vont les clés API ? Qu'est-ce qui empêche un agent voyou de brûler 500 $ en jetons du jour au lendemain ?

Une **plateforme d'agents IA** répond à ces questions avant que vous n'écriviez votre premier agent. OpenLegion est une plateforme d'agents IA managée qui livre l'isolation par conteneur, les identifiants protégés par proxy de coffre-fort, les contrôles de budget par agent et la coordination en modèle de flotte (tableau noir + pub/sub + handoff) — tous activés par défaut. Apportez vos propres clés API LLM. Aucune majoration sur l'usage des modèles.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce qu'une plateforme d'agents IA ?**
> Une plateforme d'agents IA est une infrastructure managée pour déployer, orchestrer et gouverner des agents IA autonomes en production. Contrairement aux frameworks bruts, une plateforme gère l'isolation, la gestion des identifiants, les contrôles de coûts et l'observabilité afin que les équipes livrent des agents sans construire le DevOps de zéro.

## En bref

- **Plateforme, pas framework** — OpenLegion gère les conteneurs, les identifiants, les budgets et le réseau. Vous gérez la logique d'agent.
- **Identifiants protégés par proxy de coffre-fort** — Les agents exécutent les appels API via un proxy de coffre-fort. Ils ne voient jamais les clés brutes.
- **Isolation par conteneur par agent** — Chaque agent s'exécute dans son propre conteneur Docker avec plafonds de ressources configurables (384 Mo RAM / 0,15 CPU par défaut), exécution non-root et aucun système de fichiers partagé.
- **Application des budgets par agent** — Définissez des limites de jetons quotidiennes et mensuelles avec coupure stricte automatique. Pas de factures-surprises.
- **BYO clés API** — Connectez tout fournisseur LLM via LiteLLM (100+ supportés). Vous payez les fournisseurs directement à leurs tarifs publiés.
- **Coordination en modèle de flotte auditable** — coordination en modèle de flotte (tableau noir + pub/sub + handoff) pour le routage des tâches. Pas d'« agent CEO » prenant des décisions opaques.
- **Extensibilité compatible MCP** — Connectez tout serveur d'outils MCP (bases de données, systèmes de fichiers, API) à côté de 50+ compétences intégrées. Auto-découvertes par les agents.
- **Mémoire d'agent persistante** — Les agents se souviennent entre les sessions avec recherche vectorielle, fichiers d'espace de travail et apprentissages d'erreurs. Contexte géré automatiquement.

## Managé vs auto-hébergé : quand chacun a du sens

La distinction entre frameworks d'agents IA et plateformes d'agents IA importe surtout au moment du déploiement. Un framework vous donne les briques — définitions d'agents, intégrations d'outils, patrons de conversation. Une plateforme vous donne la couche de production : où s'exécutent les agents, comment ils accèdent aux identifiants, ce qui les empêche de partir en vrille.

**Les frameworks auto-hébergés** (LangGraph, CrewAI, AutoGen) vous donnent un contrôle maximal. Vous possédez l'infrastructure. Vous configurez les conteneurs. Vous construisez le pipeline d'identifiants. Cela fonctionne lorsque votre équipe a une capacité DevOps dédiée et une infrastructure existante avec laquelle les agents doivent s'intégrer profondément.

**Les plateformes d'agents IA managées** gèrent la couche opérationnelle pour que votre équipe se concentre sur la logique d'agent. OpenLegion se place ici — mais avec une différence cruciale : elle est source-disponible sous PolyForm Perimeter License 1.0.1. Vous obtenez des opérations de niveau plateforme (isolation, coffre-fort, contrôles de budget) sans verrouillage fournisseur côté infrastructure.

La question n'est pas de savoir lequel est « meilleur ». C'est de savoir si votre équipe doit dépenser des heures d'ingénierie sur l'infrastructure de sécurité d'agents ou sur les agents eux-mêmes.

### Quand l'auto-hébergé a du sens

- Vous avez des exigences strictes de résidence des données qui excluent tout service managé
- Vos agents ont besoin d'une intégration profonde avec une infrastructure on-prem existante
- Votre équipe opère déjà des clusters Kubernetes et a des pratiques DevOps matures
- Vous devez personnaliser l'environnement runtime à un niveau que les plateformes managées n'exposent pas

### Quand une plateforme d'agents IA managée a du sens

- Vous avez besoin d'agents en production en quelques jours, pas en quelques mois
- Votre équipe compte 1 à 5 ingénieurs et ne peut pas dédier d'effectif à l'infrastructure
- Vous avez besoin de garanties de [sécurité des agents IA](/learn/ai-agent-security) sans les construire vous-même
- Vous voulez des contrôles de coûts et du traçage de requêtes sans tout instrumenter manuellement

## Le modèle BYO clés API — pourquoi cela importe

La plupart des plateformes IA managées facturent par jeton ou prennent une marge sur l'usage du modèle. Cela crée deux problèmes : opacité des coûts et verrouillage fournisseur.

OpenLegion adopte une approche différente. Vous apportez vos propres clés API LLM de tout fournisseur — OpenAI, Anthropic, Google, Mistral ou l'un des 100+ fournisseurs supportés via LiteLLM. Vos jetons coulent directement vers le fournisseur à ses tarifs publiés. OpenLegion facture la plateforme et l'orchestration, pas l'accès au modèle.

Cela compte pour trois raisons :

**Transparence des coûts.** Vous voyez exactement ce que chaque agent dépense pour chaque fournisseur. Aucune majoration cachée. Aucun « jeton plateforme » qui obscurcit les coûts réels.

**Flexibilité du fournisseur.** Échangez les modèles par agent. Exécutez GPT-4o pour le raisonnement complexe, Claude pour les tâches à long contexte et un modèle Llama local pour la classification à fort volume — tout dans le même projet, géré depuis le même tableau de bord.

**Pas de verrouillage.** Si vous quittez OpenLegion, vos clés API et configurations de modèles partent avec vous. Aucune couche de modèle propriétaire à migrer.

## Pour qui c'est conçu

### Développeurs solo construisant des produits d'agents

Vous livrez un produit propulsé par des agents et avez besoin qu'il soit sécurisé dès le premier jour. OpenLegion vous donne une infrastructure de production — isolation par conteneur, coffre-fort d'identifiants, contrôles de coûts — sans embaucher une équipe DevOps. Commencez avec un template d'équipe intégré (Dev Team, Sales Pipeline, Content Studio) et personnalisez à partir de là.

### Équipes startup en livraison rapide

Votre équipe compte 2 à 10 ingénieurs. Vous avez besoin d'agents en production ce sprint, pas le trimestre prochain. L'installation se fait en trois commandes : `git clone`, `./install.sh`, `openlegion start`. L'assistant de configuration guidé configure vos clés API, choisit un template d'équipe et déploie votre première flotte d'agents en moins de trois minutes.

### Équipes de sécurité d'entreprise

Vous avez besoin de traçage des requêtes et d'observabilité des workflows, d'isolation des identifiants qui survit à un agent compromis et de contrôles de budget qui empêchent les coûts incontrôlés. L'architecture d'OpenLegion est conçue pour les environnements qui nécessitent une défense en profondeur. La coordination en modèle de flotte auditable signifie que chaque étape du workflow est explicite et traçable — pas de prise de décision LLM opaque dans le plan de contrôle. Consultez notre page [Sécurité des agents IA](/learn/ai-agent-security) pour le modèle de menace complet.

## Prêt pour la production : ce qu'OpenLegion gère vs DIY

| Capacité | DIY (framework uniquement) | OpenLegion |
|---|---|---|
| **Runtime d'agent** | Vous configurez Docker, gérez les images, gérez le réseau | Chaque agent auto-provisionné dans un conteneur isolé (384 Mo RAM, 0,15 CPU par défaut, non-root, no-new-privileges) |
| **Gestion des identifiants** | Variables d'environnement ou intégration de coffre-fort personnalisée | Proxy de coffre-fort avec injection aveugle — les agents ne voient jamais les clés brutes |
| **Contrôles de coûts** | Suivi manuel, pas de limites strictes | Budgets quotidiens/mensuels par agent avec coupure automatique |
| **Orchestration** | Coder votre propre logique de routage ou utiliser un routage basé LLM | Coordination en modèle de flotte (tableau noir + pub/sub + handoff) — auditable |
| **Observabilité** | Intégrer LangSmith, Datadog ou un journal personnalisé | Tableau de bord intégré avec streaming en direct, graphiques de coûts, traces de requêtes |
| **Déploiement multi-canal** | Construire des intégrations par canal | CLI, Telegram, Discord, Slack, WhatsApp — plus des points de terminaison webhook pour intégrations externes |
| **Automatisation de navigateur** | Configurer Playwright/Puppeteer, gérer les instances Chrome | Camoufox par agent (Firefox furtif) dans un conteneur de service de navigateur partagé, avec KasmVNC (ports 6100..6163), contrôle CDP et récupération automatique |
| **Extensibilité d'outils** | Construire des intégrations personnalisées ou utiliser les outils LangChain | Compatible MCP — connectez tout serveur MCP + 50+ compétences intégrées, auto-découvertes |
| **Mémoire d'agent** | Construire RAG personnalisé ou gestion d'état | Mémoire vectorielle persistante par agent avec gestion automatique du contexte |
| **Failover de modèle** | Logique de réessai personnalisée par fournisseur | Chaînes de failover configurables entre fournisseurs via LiteLLM |

Le résumé : si vous évaluez des [frameworks d'agents IA](/learn/ai-agent-frameworks) et vous retrouvez à construire plus d'infrastructure que de logique d'agent, vous résolvez un problème de plateforme avec des outils de framework. OpenLegion gère la couche plateforme afin que vous puissiez vous concentrer sur ce que vos agents font réellement.

## Extensibilité d'outils compatible MCP

OpenLegion prend en charge le Model Context Protocol (MCP) pour connecter des outils externes. Tout serveur MCP — bases de données, systèmes de fichiers, API, services internes — peut être ajouté via la configuration et auto-découvert par les agents. Cela se place à côté de 50+ compétences intégrées couvrant l'automatisation de navigateur, les opérations de fichiers, les requêtes HTTP, la recherche web, la gestion de mémoire, l'exécution de code et la communication mesh.

L'intégration MCP signifie que les agents ne sont pas limités aux capacités intégrées. Connectez un serveur Postgres, une intégration GitHub ou une API interne personnalisée — les agents découvrent automatiquement les outils disponibles et les utilisent dans les limites de leurs autorisations.

## Mémoire d'agent persistante

Les agents dans OpenLegion maintiennent une mémoire entre les sessions en utilisant la recherche vectorielle, les fichiers d'espace de travail et les apprentissages d'erreurs. Lorsqu'un agent rencontre un problème et le résout, la solution est stockée et rappelée dans les sessions futures — réduisant les échecs répétés et améliorant la qualité d'exécution au fil du temps.

La mémoire est délimitée par agent et stockée dans la base de données SQLite + vectorielle isolée de chaque agent à l'intérieur de son conteneur. La gestion automatique du contexte garde l'usage des jetons efficace en remontant uniquement les souvenirs pertinents pour la tâche actuelle, plutôt que de charger des historiques de conversation entiers.

## Architecture : le modèle de confiance à quatre zones

OpenLegion sépare chaque déploiement en quatre zones de confiance plus un niveau opérateur ou interne :

**Zone 0 — Entrée externe non fiable.** Tout ce qui arrive des utilisateurs ou de tiers : CLI, Telegram, Discord, Slack, WhatsApp et points de terminaison webhook. Toutes les entrées sont validées et désinfectées via des gardes anti-injection de prompt avant d'atteindre le mesh.

**Zone 1 — Conteneurs d'agents bac à sable (non fiables).** Chaque agent s'exécute comme sa propre instance FastAPI dans un conteneur Docker dédié avec son propre volume `/data`, sa base de données mémoire et des plafonds de ressources stricts. Même un agent totalement compromis ne peut pas accéder à vos clés API, aux données des autres agents ou au système hôte.

**Zone 2 — Hôte de mesh (fiable).** Le serveur FastAPI qui exécute le tableau noir (état partagé via SQLite + WAL), le routeur de messages PubSub, le coffre-fort d'identifiants (le proxy qui gère l'injection aveugle), la matrice ACL, le gestionnaire de conteneurs, le suivi des coûts et le service de navigateur (Camoufox par agent sur :8500). C'est le cerveau — et c'est le seul composant qui touche vos clés API.

**Zone 2.5 — Opérateur ou interne.** Opérations de plan de contrôle réservées disponibles pour l'agent opérateur ou l'outillage interne du mesh — gestion de flotte, modifications d'agents, octrois d'autorisations (l'opérateur ne peut pas accorder `can_spawn` ou `can_use_wallet`).

**Zone 3 — Loopback uniquement, interne.** Le niveau le plus restreint : points de terminaison qui requièrent à la fois un en-tête `x-mesh-internal: 1` et une IP source loopback. Utilisé uniquement pour les appels de coordination interne au mesh.

Cette architecture signifie que l'[orchestration d'agents IA](/learn/ai-agent-orchestration) et la sécurité ne sont pas des préoccupations séparées — elles sont le même système.

## Démarrer

```bash
git clone https://github.com/openlegion-ai/openlegion.git
cd openlegion && ./install.sh
openlegion start # configuration en ligne au premier lancement, puis les agents se déploient dans des conteneurs isolés
```

La première installation prend 2 à 3 minutes. Nécessite Python 3.10+ et Docker.

## CTA

**Prêt à déployer des agents sécurisés ?**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Qu'est-ce qu'une plateforme d'agents IA ?

Une plateforme d'agents IA est une infrastructure managée qui gère les préoccupations opérationnelles de l'exécution d'agents IA autonomes : isolation par conteneur, gestion des identifiants, contrôles de coûts, orchestration et observabilité. Elle se place au-dessus des frameworks comme LangGraph ou CrewAI et fournit la couche de production que les frameworks vous laissent.

### Quelle est la meilleure plateforme d'agents IA pour la production ?

La meilleure plateforme d'agents IA pour la production dépend de vos exigences de sécurité et opérationnelles. Si vous avez besoin d'une isolation par conteneur intégrée, d'identifiants protégés par proxy de coffre-fort et de contrôles de budget par agent sans construire d'infrastructure personnalisée, OpenLegion les fournit prêts à l'emploi. Pour les équipes profondément investies dans l'écosystème Microsoft, Azure AI Agent Service vaut la peine d'être évalué. Pour une flexibilité maximale avec plus d'effort DIY, auto-héberger LangGraph avec LangSmith donne une solide observabilité.

### Qu'est-ce qu'une plateforme d'agents IA d'entreprise ?

Une plateforme d'agents IA d'entreprise ajoute des contrôles de gouvernance, de conformité et de sécurité par-dessus l'orchestration de base des agents. Les exigences clés incluent : isolation des identifiants (les agents ne devraient jamais voir les clés API brutes), traçabilité des workflows, application des budgets pour prévenir les coûts incontrôlés, contrôle d'accès basé sur les rôles et options de déploiement qui supportent les exigences de résidence des données. L'architecture d'OpenLegion est conçue pour les environnements qui nécessitent ces contrôles.

### Puis-je héberger des agents IA avec mes propres clés API ?

Oui. OpenLegion utilise un modèle de clé API BYO (Bring Your Own). Vous connectez vos propres clés de tout fournisseur LLM — OpenAI, Anthropic, Google, Mistral et 100+ autres via LiteLLM. Vos jetons coulent directement vers le fournisseur à ses tarifs publiés. Apportez vos propres clés API LLM. Aucune majoration sur l'usage des modèles.

### Agents IA managés vs auto-hébergés : quelle est la différence ?

Les plateformes d'agents IA managées gèrent le provisionnement des conteneurs, le coffre-fort d'identifiants, les contrôles de coûts et l'observabilité pour vous. Auto-hébergé signifie que vous déployez un framework (LangGraph, CrewAI, AutoGen) sur votre propre infrastructure et construisez ces couches opérationnelles vous-même. Managé est plus rapide à mettre en production et nécessite moins d'investissement DevOps. Auto-hébergé donne un contrôle maximal de l'infrastructure. OpenLegion offre un hybride : code source-disponible (PolyForm Perimeter License 1.0.1) que vous pouvez auto-héberger, avec des capacités de plateforme managée intégrées.

### Comment OpenLegion se compare-t-il aux autres plateformes d'agents IA ?

OpenLegion se différencie par son architecture axée sécurité. Selon la documentation publique au moment de la rédaction, aucun autre [framework d'agents IA](/learn/ai-agent-frameworks) majeur ne fournit d'identifiants protégés par proxy de coffre-fort intégrés, d'isolation par conteneur par agent obligatoire ou d'application native des budgets par agent. Consultez notre [comparaison de frameworks](/learn/ai-agent-frameworks) pour une analyse détaillée à travers OpenClaw, LangGraph, CrewAI, AutoGen et Semantic Kernel.

### Quelle licence utilise OpenLegion ?

OpenLegion est source-disponible sous la licence PolyForm Perimeter License 1.0.1 et disponible sur [GitHub](https://github.com/openlegion-ai/openlegion). Le projet propose également une plateforme hébergée pour les équipes qui souhaitent une infrastructure managée sans auto-hébergement.

### À quelle vitesse puis-je déployer mon premier agent ?

Trois commandes et moins de trois minutes. `git clone`, `./install.sh`, `openlegion start`. L'assistant de configuration guidé configure vos clés API, sélectionne un template d'équipe et provisionne votre première flotte d'agents isolés automatiquement.

---

## Liens internes à inclure

| Texte d'ancre | Destination |
|---|---|
| Plateforme d'agents IA | /learn/ai-agent-platform |
| Orchestration d'agents IA | /learn/ai-agent-orchestration |
| Comparaison des frameworks d'agents IA | /learn/ai-agent-frameworks |
| Sécurité des agents IA | /learn/ai-agent-security |
| Alternative à OpenClaw | /openclaw-alternative |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Documentation | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
