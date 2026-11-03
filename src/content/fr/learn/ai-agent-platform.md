---
title: Plateforme d'agents IA — Déployer des agents sécurisés
description: >-
 OpenLegion est une plateforme d'agents IA managée avec exécutions de tâches en
 bac à sable, coffre-fort d'identifiants et budgets par agent. Rien à
 installer.
slug: /learn/ai-agent-platform
primary_keyword: plateforme d'agents IA
secondary_keywords:
 - managed ai agent platform
 - self-hosted agent deployment
 - ai agent cost control
 - ai agent credential security
 - production ai agent infrastructure
date_published: 2026-03
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

Une **plateforme d'agents IA** répond à ces questions avant que vous n'écriviez votre premier agent. OpenLegion est une plateforme d'agents IA managée qui livre des exécutions de tâches en bac à sable, des identifiants conservés dans un coffre-fort, des budgets en crédits par agent et une coordination par objectifs et tâches (objectifs → tâches → agents) — tous activés par défaut. C'est une application web hébergée : connectez-vous avec Google et démarrez. Il n'y a rien à installer.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce qu'une plateforme d'agents IA ?**
> Une plateforme d'agents IA est une infrastructure managée pour déployer, orchestrer et gouverner des agents IA autonomes en production. Contrairement aux frameworks bruts, une plateforme gère l'isolation, la gestion des identifiants, les contrôles de coûts et l'observabilité afin que les équipes livrent des agents sans construire le DevOps de zéro.

## En bref

- **Plateforme, pas framework** — OpenLegion gère les exécutions, les identifiants, les budgets et les approbations. Vous gérez la logique d'agent.
- **Identifiants conservés en coffre-fort** — Les identifiants sont injectés hors du modèle, qui ne détient jamais qu'une référence. Les agents ne voient jamais les clés brutes.
- **Une exécution en bac à sable par tâche** — Chaque tâche s'exécute à la demande puis s'arrête : il n'y a aucun processus d'agent durable à compromettre, et le code que l'agent écrit tourne sans accès réseau par défaut.
- **Application des budgets par agent** — Chaque agent porte son propre budget en crédits, mesuré à $0,001 le crédit, avec coupure stricte automatique. Pas de factures-surprises.
- **Préréglages de modèles** — Choisissez Smartest, Smart ou Normal par agent ou par espace de travail. Vous ne câblez jamais de fournisseur et ne faites jamais tourner de clé.
- **Coordination auditable par objectifs et tâches** — Le travail s'organise objectifs → tâches → agents, avec un assistant qui crée les coéquipiers nécessaires. Pas d'« agent CEO » prenant des décisions opaques.
- **Boîte à outils intégrée** — Recherche et récupération web, fichiers, mémoire longue durée, plannings, exécution de code en bac à sable et livrables partageables. Disponibles pour chaque agent.
- **Mémoire d'agent persistante** — Les agents se souviennent entre les sessions avec recherche vectorielle, fichiers d'espace de travail et apprentissages d'erreurs. Contexte géré automatiquement.

## Managé vs auto-hébergé : quand chacun a du sens

La distinction entre frameworks d'agents IA et plateformes d'agents IA importe surtout au moment du déploiement. Un framework vous donne les briques — définitions d'agents, intégrations d'outils, patrons de conversation. Une plateforme vous donne la couche de production : où s'exécutent les agents, comment ils accèdent aux identifiants, ce qui les empêche de partir en vrille.

**Les frameworks auto-hébergés** (LangGraph, CrewAI, AutoGen) vous donnent un contrôle maximal. Vous possédez l'infrastructure. Vous configurez les conteneurs. Vous construisez le pipeline d'identifiants. Cela fonctionne lorsque votre équipe a une capacité DevOps dédiée et une infrastructure existante avec laquelle les agents doivent s'intégrer profondément.

**Les plateformes d'agents IA managées** gèrent la couche opérationnelle pour que votre équipe se concentre sur la logique d'agent. OpenLegion se place ici — mais avec une différence cruciale : le moteur qui la fait tourner est publié en source-disponible sous PolyForm Perimeter License 1.0.1. Vous obtenez des opérations de niveau plateforme (isolation des exécutions, coffre-fort, contrôles de budget) sans boîte noire en dessous.

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

## Le système de préréglages de modèles — pourquoi cela importe

La plupart des plateformes IA managées font du choix du modèle votre problème : choisir un fournisseur, câbler une clé, la faire tourner, réajuster quand elle change. Cela crée deux problèmes : opacité des coûts et verrouillage fournisseur.

OpenLegion adopte une approche différente. Les modèles sont choisis par préréglage — Smartest, Smart ou Normal — par agent ou par espace de travail : il n'y a aucun fournisseur à câbler ni clé à faire tourner. Le travail est mesuré en crédits à $0,001 l'unité, et le coût exact de chaque tâche est visible dans l'application.

Cela compte pour trois raisons :

**Transparence des coûts.** Vous voyez exactement ce que chaque agent dépense et ce qu'a coûté chaque tâche. Chaque unité de travail est un réveil enregistré avec un prix, pas une ligne dans une facture mensuelle.

**Flexibilité du modèle.** Échangez les préréglages par agent. Exécutez Smartest pour le raisonnement complexe, Smart pour le travail courant et Normal pour la classification à fort volume — tout dans le même espace de travail, géré depuis le même tableau de bord.

**Pas de verrouillage.** Si vous quittez OpenLegion, vous pouvez exporter l'espace de travail — agents, tâches, reçus et livrables — et effacer ce qui reste. Aucune couche de modèle propriétaire à migrer.

## Pour qui c'est conçu

### Développeurs solo construisant des produits d'agents

Vous livrez un produit propulsé par des agents et avez besoin qu'il soit sécurisé dès le premier jour. OpenLegion vous donne une infrastructure de production — exécutions en bac à sable, coffre-fort d'identifiants, contrôles de coûts — sans embaucher une équipe DevOps. Décrivez le résultat que vous voulez et l'assistant crée les coéquipiers nécessaires pour y arriver.

### Équipes startup en livraison rapide

Votre équipe compte 2 à 10 ingénieurs. Vous avez besoin d'agents en production ce sprint, pas le trimestre prochain. Il n'y a aucune installation : OpenLegion est une application web hébergée et vous vous connectez avec Google. Le forfait gratuit est à $0 avec 1,000 crédits uniques et sans carte, si bien que votre premier agent travaille quelques minutes après votre inscription.

### Équipes de sécurité d'entreprise

Vous avez besoin de traçage des requêtes et d'observabilité des workflows, d'isolation des identifiants qui survit à un agent compromis et de contrôles de budget qui empêchent les coûts incontrôlés. L'architecture d'OpenLegion est conçue pour les environnements qui nécessitent une défense en profondeur. La coordination auditable par objectifs et tâches signifie que chaque étape du workflow est explicite et traçable — pas de prise de décision LLM opaque dans le plan de contrôle. Consultez notre page [Sécurité des agents IA](/learn/ai-agent-security) pour le modèle de menace complet.

## Prêt pour la production : ce qu'OpenLegion gère vs DIY

| Capacité | DIY (framework uniquement) | OpenLegion |
|---|---|---|
| **Runtime d'agent** | Vous configurez Docker, gérez les images, gérez le réseau | Les agents sont des enregistrements durables, pas des serveurs ; chaque tâche s'exécute à la demande dans un bac à sable puis s'arrête |
| **Gestion des identifiants** | Variables d'environnement ou intégration de coffre-fort personnalisée | Identifiants en coffre-fort injectés hors du modèle — les agents ne voient jamais les clés brutes |
| **Contrôles de coûts** | Suivi manuel, pas de limites strictes | Budgets en crédits par agent à $0,001 le crédit, avec coupure automatique |
| **Orchestration** | Coder votre propre logique de routage ou utiliser un routage basé LLM | Coordination par objectifs et tâches (objectifs → tâches → agents) — auditable |
| **Observabilité** | Intégrer LangSmith, Datadog ou un journal personnalisé | Tableau de bord intégré avec streaming en direct, graphiques de coûts, traces de requêtes |
| **Déploiement multi-canal** | Construire des intégrations par canal | Chat web sur tous les forfaits, Telegram et webhooks dès Pro, Slack et e-mail entrant sur Team et au-delà |
| **Automatisation de navigateur** | Configurer Playwright/Puppeteer, gérer les instances Chrome | Non proposée au lancement — les agents lisent le web en direct avec la recherche et la récupération intégrées |
| **Extensibilité d'outils** | Construire des intégrations personnalisées ou utiliser les outils LangChain | Intégrée — recherche et récupération web, fichiers, mémoire, plannings, exécution de code en bac à sable, livrables partageables |
| **Mémoire d'agent** | Construire RAG personnalisé ou gestion d'état | Mémoire vectorielle persistante par agent avec gestion automatique du contexte |
| **Failover de modèle** | Logique de réessai personnalisée par fournisseur | Géré par la plateforme — choisissez un préréglage et elle route pour vous |

Le résumé : si vous évaluez des [frameworks d'agents IA](/learn/ai-agent-frameworks) et vous retrouvez à construire plus d'infrastructure que de logique d'agent, vous résolvez un problème de plateforme avec des outils de framework. OpenLegion gère la couche plateforme afin que vous puissiez vous concentrer sur ce que vos agents font réellement.

## Extensibilité d'outils intégrée

OpenLegion livre ses outils avec la plateforme au lieu de vous demander de câbler des serveurs. Chaque agent dispose de la recherche et de la récupération web, de la gestion de fichiers, d'une mémoire longue durée, de plannings, d'une exécution de code en bac à sable et de livrables partageables dès sa création. Les connecteurs au lancement sont Google Agenda et les fichiers Google Drive que vous choisissez ; le Model Context Protocol (MCP) n'est pas pris en charge au lancement.

L'intégration MCP signifie que les agents ne sont pas limités aux capacités intégrées. Connectez un serveur Postgres, une intégration GitHub ou une API interne personnalisée — les agents découvrent automatiquement les outils disponibles et les utilisent dans les limites de leurs autorisations.

## Mémoire d'agent persistante

Les agents dans OpenLegion maintiennent une mémoire entre les sessions en utilisant la recherche vectorielle, les fichiers d'espace de travail et les apprentissages d'erreurs. Lorsqu'un agent rencontre un problème et le résout, la solution est stockée et rappelée dans les sessions futures — réduisant les échecs répétés et améliorant la qualité d'exécution au fil du temps.

La mémoire est délimitée par agent et isolée de tout autre agent et de tout autre espace de travail. La gestion automatique du contexte garde l'usage des jetons efficace en remontant uniquement les souvenirs pertinents pour la tâche actuelle, plutôt que de charger des historiques de conversation entiers.

## Architecture : un moteur de politiques devant chaque action

OpenLegion sépare chaque espace de travail en quatre frontières de confiance plus un niveau de décision du propriétaire :

**Entrée externe non fiable.** Tout ce qui arrive des utilisateurs ou de tiers : chat web, Telegram, Slack, e-mail entrant et points de terminaison webhook. Toutes les entrées sont validées et désinfectées via des gardes anti-injection de prompt avant d'atteindre le moteur de politiques.

**L'exécution de l'agent (non fiable).** Chaque tâche s'exécute à la demande puis s'arrête, et le code que l'agent écrit tourne dans un bac à sable sans accès réseau par défaut. Même une exécution totalement compromise ne peut pas accéder à vos identifiants, aux données des autres agents ou à un autre espace de travail.

**Le moteur de politiques (fiable).** Une couche unique vérifie chaque action comme une intention avant qu'elle n'ait lieu et l'enregistre comme un reçu que le propriétaire peut lire : appel d'outil, délégation, approbation, coût. Elle détient le registre partagé d'objectifs et de tâches, le coffre-fort d'identifiants, la matrice d'autorisations et le budget en crédits de chaque agent. C'est le cerveau — et c'est le seul composant qui touche vos identifiants.

**Décisions du propriétaire ou de l'administrateur.** Le travail s'arrête pour une approbation à trois barrières seulement : joindre un tiers en votre nom, supprimer des données et agir sur du contenu non fiable. La décision est prise dans l'application par un propriétaire ou un administrateur, jamais par un agent.

**Plan de contrôle interne uniquement.** Le niveau le plus restreint : les opérations administratives comme créer des agents, accorder des autorisations d'outils et changer de forfait, atteintes via une seule API d'administration délimitée à un espace de travail.

Cette architecture signifie que l'[orchestration d'agents IA](/learn/ai-agent-orchestration) et la sécurité ne sont pas des préoccupations séparées — elles sont le même système.

## Démarrer

```text
1. Connectez-vous avec Google sur app.openlegion.ai — il n'y a rien à installer.
2. Dites à l'assistant ce que vous voulez faire faire ; il crée les agents nécessaires.
3. Approuvez la première action qui atteint un tiers, puis lisez les reçus.
```

Le forfait gratuit est à $0 avec 1,000 crédits uniques et sans carte. Pro est à $29/mois avec 10,000.

## CTA

**Prêt à déployer des agents sécurisés ?**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Qu'est-ce qu'une plateforme d'agents IA ?

Une plateforme d'agents IA est une infrastructure managée qui gère les préoccupations opérationnelles de l'exécution d'agents IA autonomes : isolation par conteneur, gestion des identifiants, contrôles de coûts, orchestration et observabilité. Elle se place au-dessus des frameworks comme LangGraph ou CrewAI et fournit la couche de production que les frameworks vous laissent.

### Quelle est la meilleure plateforme d'agents IA pour la production ?

La meilleure plateforme d'agents IA pour la production dépend de vos exigences de sécurité et opérationnelles. Si vous avez besoin d'une isolation des exécutions intégrée, d'identifiants conservés en coffre-fort et de contrôles de budget par agent sans construire d'infrastructure personnalisée, OpenLegion les fournit prêts à l'emploi. Pour les équipes profondément investies dans l'écosystème Microsoft, Azure AI Agent Service vaut la peine d'être évalué. Pour une flexibilité maximale avec plus d'effort DIY, auto-héberger LangGraph avec LangSmith donne une solide observabilité.

### Qu'est-ce qu'une plateforme d'agents IA d'entreprise ?

Une plateforme d'agents IA d'entreprise ajoute des contrôles de gouvernance, de conformité et de sécurité par-dessus l'orchestration de base des agents. Les exigences clés incluent : isolation des identifiants (les agents ne devraient jamais voir les clés API brutes), traçabilité des workflows, application des budgets pour prévenir les coûts incontrôlés, contrôle d'accès basé sur les rôles et options de déploiement qui supportent les exigences de résidence des données. L'architecture d'OpenLegion est conçue pour les environnements qui nécessitent ces contrôles.

### Puis-je héberger des agents IA avec mes propres clés API ?

Non, et vous n'en avez pas besoin. L'accès aux modèles est inclus : choisissez un préréglage — Smartest, Smart ou Normal — par agent ou par espace de travail, et OpenLegion s'occupe du fournisseur. Le travail est mesuré en crédits à $0,001 l'unité : vous voyez donc le coût exact de chaque tâche. Le forfait gratuit est à $0 avec 1,000 crédits uniques et sans carte.

### Agents IA managés vs auto-hébergés : quelle est la différence ?

Les plateformes d'agents IA managées gèrent le provisionnement, le coffre-fort d'identifiants, les contrôles de coûts et l'observabilité pour vous. Auto-hébergé signifie que vous déployez un framework (LangGraph, CrewAI, AutoGen) sur votre propre infrastructure et construisez ces couches opérationnelles vous-même. Managé est plus rapide à mettre en production et nécessite moins d'investissement DevOps. Auto-hébergé donne un contrôle maximal de l'infrastructure. OpenLegion est managée : vous vous connectez avec Google et démarrez, et le moteur en dessous est publié en source-disponible sous PolyForm Perimeter License 1.0.1.

### Comment OpenLegion se compare-t-il aux autres plateformes d'agents IA ?

OpenLegion se différencie par son architecture axée sécurité. Selon la documentation publique au moment de la rédaction, aucun autre [framework d'agents IA](/learn/ai-agent-frameworks) majeur ne fournit d'identifiants conservés en coffre-fort, d'exécution en bac à sable pour chaque tâche ou d'application native des budgets par agent. Consultez notre [comparaison de frameworks](/learn/ai-agent-frameworks) pour une analyse détaillée à travers OpenClaw, LangGraph, CrewAI, AutoGen et Semantic Kernel.

### Quelle licence utilise OpenLegion ?

Le moteur OpenLegion est publié en source-disponible sous la licence PolyForm Perimeter License 1.0.1 sur [GitHub](https://github.com/openlegion-ai/openlegion). La plateforme hébergée est propriétaire, et c'est là que les équipes exécutent des agents sans gérer la moindre infrastructure.

### À quelle vitesse puis-je déployer mon premier agent ?

Quelques minutes, sans rien installer. Connectez-vous avec Google, dites à l'assistant ce que vous voulez faire faire, et il crée les agents nécessaires. Le forfait gratuit est à $0 avec 1,000 crédits uniques et sans carte : rien ne se dresse entre la connexion et votre première tâche.

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
