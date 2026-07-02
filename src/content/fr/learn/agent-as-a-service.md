---
title: "Agent as a Service : tarification, isolation des locataires et AaaS vs auto-hébergé"
description: "Agent as a Service (AaaS) : agents IA sur infrastructure gérée avec tarification à la consommation. Couvre AWS Bedrock Agents, OpenAI Operator, CVE-2024-5184 et le TCO comparé."
slug: /learn/agent-as-a-service
primary_keyword: agent as a service
last_updated: "2026-07-02"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-deployment
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-multi-tenancy
  - /learn/credential-management-ai-agents
  - /learn/llm-cost-optimization
---

# Agent as a Service : modèles de tarification, isolation des locataires et cadre de décision AaaS

Agent as a Service (AaaS) est un modèle de livraison commercial dans lequel des agents IA fonctionnent sur l'infrastructure gérée d'un fournisseur, prenant en charge l'orchestration, l'exécution des outils, la mémoire et la gestion des identifiants, facturé par jeton, par action ou par heure d'agent plutôt que d'exiger des clients qu'ils déploient leur propre environnement d'exécution. L'AaaS s'est consolidé comme catégorie d'achat d'entreprise en 2026 : OpenAI Operator a été lancé en janvier 2025, Google Agent Space est passé en disponibilité générale, et AWS Bedrock Agents a atteint l'échelle enterprise, faisant passer le volume de recherche de 90/mois en juin 2025 à 260--390/mois au T1 2026, CPC 32,88 USD.

<!-- SCHEMA: DefinitionBlock -->

> **Agent as a Service (AaaS)** est un modèle de livraison commercial dans lequel des agents IA fonctionnent sur l'infrastructure gérée d'un fournisseur, prenant en charge l'orchestration, l'exécution des outils, la mémoire et la gestion des identifiants, et sont facturés au client sur une base de consommation (par jeton d'entrée, par action exécutée ou par heure d'agent) sans que le client n'ait à déployer et exploiter son propre environnement d'exécution.

## Ce que signifie Agent as a Service : les trois promesses des plateformes

Chaque plateforme AaaS fait trois affirmations. Comprendre lesquelles sont bien tenues et lesquelles relèvent du marketing aide les acheteurs à évaluer les fournisseurs avant d'engager leur budget.

### Promesse 1 : infrastructure gérée (pas d'environnement d'exécution à exploiter)

L'AaaS délègue l'ensemble de la pile d'exécution de l'agent au fournisseur : moteur d'orchestration, environnement d'exécution des outils, backends de mémoire, pipeline d'observabilité, mise à l'échelle horizontale et SLA de disponibilité. Le client définit l'agent -- prompt système, outils et configuration mémoire -- et l'invoque. Le fournisseur l'exécute.

C'est le même compromis que pour tout service géré : RDS contre Postgres auto-géré, Lambda contre conteneurs auto-gérés. On renonce à la configurabilité et on paie potentiellement une prime, en échange de ne pas supporter la charge opérationnelle. La promesse d'infrastructure gérée est bien tenue par AWS Bedrock Agents, Google Agent Space et la plupart des plateformes AaaS matures.

La promesse s'effondre lorsque le client a besoin d'une configuration d'exécution que la plateforme n'expose pas : environnements d'exécution d'outils personnalisés, backends de mémoire non standards, versions de modèles spécifiques ou logique de boucle d'agent différente du modèle d'orchestration fixe de la plateforme.

Pour les détails de la couche infrastructure, voir [infrastructure de déploiement et options d'hébergement des agents IA](/learn/ai-agent-deployment).

### Promesse 2 : tarification à la consommation (payer par jeton, action ou heure)

La tarification AaaS en 2026 a convergé vers trois structures :

**Frais d'orchestration par jeton en plus du coût du modèle.** La plateforme facture sa couche d'orchestration séparément du LLM sous-jacent. AWS Bedrock Agents : 0,000025 USD par jeton d'entrée traité par la couche d'orchestration, en plus du tarif LLM standard. Pour Claude 3.5 Sonnet sur Bedrock (3,00 USD/M tokens d'entrée), les frais d'orchestration ajoutent 0,025 USD/M tokens d'entrée, soit moins de 1 % de surcoût. Pour des modèles moins chers, comme Amazon Titan Text à 0,30 USD/M tokens, les frais d'orchestration représentent un surcoût de 8,33 %.

**Frais par action pour les intégrations d'outils.** Requêtes AWS Bedrock Knowledge Base : 0,0004 USD/requête. Un agent effectuant 50 recherches KB par session paie 0,02 USD/session en frais KB. À 100 000 requêtes KB/jour : 40 USD/jour en frais d'action uniquement.

**Paliers d'abonnement par heure d'agent.** Certaines plateformes proposent des paliers où chaque agent actif est décompté des heures incluses. Ce modèle offre une prévisibilité des coûts pour les flottes d'agents stables mais peut être inefficace pour les charges de travail irrégulières.

La tarification à la consommation aligne les incitations du fournisseur sur l'utilisation du client, mais crée une imprévisibilité des coûts pour les agents à longue durée d'exécution. Une boucle d'agent incontrôlée génère des frais à la fois sur la couche d'orchestration et sur la couche modèle.

Pour les stratégies de réduction des coûts, voir [optimisation des coûts LLM et stratégies de budget de tokens pour les flottes d'agents](/learn/llm-cost-optimization).

### Promesse 3 : isolation des identifiants (les identifiants ne sont jamais dans le contexte de l'agent)

L'isolation des identifiants est le primitive de sécurité AaaS qui distingue une plateforme gérée du code d'agent s'exécutant sur une VM cloud avec des clés API dans des variables d'environnement. Les identifiants sont injectés côté serveur au moment de l'exécution et n'apparaissent jamais dans la fenêtre de contexte de l'agent, dans les fichiers journaux ou dans les paramètres d'appel d'outil.

CVE-2024-5184 (Palo Alto Unit 42, juin 2024, CVSS 9,1 CRITIQUE) a démontré que l'injection de prompt via la réponse d'un outil peut amener un agent à exfiltrer sa propre fenêtre de contexte. Si des clés API se trouvent dans la fenêtre de contexte, elles sont exfiltrables via ce vecteur.

La question diagnostique à poser à tout fournisseur AaaS : **"Si la fenêtre de contexte complète de mon agent est extraite par un attaquant via injection de prompt, quels identifiants sont exposés ?"** La bonne réponse est : aucun.

- **AWS Bedrock Agents** : prise de rôle IAM par invocation ; l'agent s'exécute sous un token de rôle IAM temporaire et ne détient jamais de clé API brute
- **OpenLegion** : résolution de handle `$CRED{}` dans la Zone 2 ; le code de l'agent référence un identifiant par nom ; Zone 2 résout la valeur réelle au moment de l'exécution sans la renvoyer à l'agent

Pour le pattern de proxy vault et l'architecture de handle `$CRED{}`, voir [gestion des identifiants et portée des clés API par locataire pour les agents IA](/learn/credential-management-ai-agents).

## Le paysage des fournisseurs AaaS en 2026

### AWS Bedrock Agents : AaaS enterprise avec isolation IAM

AWS Bedrock Agents est la plateforme AaaS enterprise dominante par portée de marché. Les agents sont définis via la console Bedrock ou l'API, avec des groupes d'actions et des bases de connaissances.

**Tarification (2026) :**
- Couche d'orchestration : 0,000025 USD/token d'entrée
- Coût du modèle : tarifs Bedrock standard (Claude 3.5 Sonnet : 3,00 USD/M entrée, 15,00 USD/M sortie)
- Requêtes Knowledge Base : 0,0004 USD/requête
- Code Interpreter : 0,000025 USD/token d'entrée

**Isolation des identifiants :** Prise de rôle IAM par invocation. Chaque Bedrock Agent dispose d'un rôle d'exécution IAM. L'agent ne détient jamais d'identifiants bruts.

**Limitations :** Couplage étroit avec les services AWS. Logique de boucle d'agent personnalisée non prise en charge. Les frais d'orchestration par token s'accumulent rapidement pour les agents à contexte étendu.

### OpenAI Operator : AaaS grand public pour les tâches de navigation

OpenAI Operator, lancé en janvier 2025, est le premier produit AaaS grand public. Il exécute des tâches web dans une session de navigateur en sandbox au nom de l'utilisateur.

**Isolation des identifiants :** Session de navigateur en sandbox par tâche. Les identifiants ne sont pas conservés entre les tâches.

**Limitations :** Portée limitée au navigateur, pas d'intégrations d'outils personnalisés. Pas d'API développeur pour des définitions d'agents personnalisées.

### Google Agent Space : AaaS pour les entreprises centrées sur Workspace

Google Agent Space (lancé en 2025, disponibilité générale en 2026) est la plateforme AaaS enterprise de Google, positionnée pour les organisations standardisées sur Google Workspace.

**Tarification :** Via la facturation à la consommation Google Cloud, liée aux coûts des modèles Vertex AI plus les frais d'invocation Cloud Run.

**Limitations :** Verrouillage dans l'écosystème Google Cloud. Moins flexible pour les intégrations multi-cloud. Opacité des prix sur plusieurs dimensions de facturation.

Pour une comparaison des plateformes AaaS, voir [fonctionnalités des plateformes d'agents IA et comparaison des frameworks](/learn/ai-agent-platform).

## Tarification AaaS : comprendre votre coût total

### Les frais de couche d'orchestration : le coût caché derrière la tarification des modèles

| **Modèle** | **Prix d'entrée** | **Frais d'orchestration** | **Orchestration % du coût modèle** |
|---|---|---|---|
| Claude 3.5 Sonnet | 3,00 USD/M | 0,025 USD/M | 0,83 % |
| Claude 3 Haiku | 0,25 USD/M | 0,025 USD/M | 10 % |
| Amazon Titan Text | 0,30 USD/M | 0,025 USD/M | 8,33 % |

### Frais par action et la taxe sur les agents à longue durée d'exécution

- **AWS Bedrock KB à 100 000 requêtes/jour** : 40 USD/jour = 1 200 USD/mois
- **OpenSearch auto-hébergé sur t3.medium** à 100 000 requêtes/jour : env. 0,16 USD/jour = 5 USD/mois

Le point de croisement : les frais d'action AaaS dépassent le coût d'infrastructure auto-hébergée à environ **12 500 requêtes/jour**.

### Coût des boucles incontrôlées dans AaaS : double facturation

Les boucles d'agent incontrôlées coûtent plus cher en AaaS qu'en auto-hébergement car AaaS facture à la fois le coût du modèle et les frais de couche d'orchestration à chaque itération.

## Sécurité AaaS : isolation des identifiants et le test CVE-2024-5184

### Le test CVE-2024-5184 pour les plateformes AaaS

CVE-2024-5184 (Palo Alto Unit 42, juin 2024, CVSS 9,1 CRITIQUE) : injection de prompt via réponse d'API d'outil.

**Le test CVE-2024-5184** : "Si la fenêtre de contexte de mon agent est extraite par un attaquant via injection de prompt, quels identifiants sont accessibles ?"

**Réussi** (identifiants non dans la fenêtre de contexte) :
- AWS Bedrock Agents
- OpenLegion

**Échoué** (identifiants accessibles) :
- Toute plateforme où le développeur a placé des clés API dans le prompt système

### Isolation des prompts multi-locataires

**Isolation au niveau de l'infrastructure (la plus forte) :**
- AWS Bedrock Agents : rôles IAM séparés par locataire
- Google Agent Space : isolation via les limites de projet Google Cloud
- OpenLegion : ACL de namespace de tableau de bord par projet

**Isolation au niveau du prompt système (la plus faible) :** Échoue lorsque l'injection de prompt écrase l'instruction du locataire (OWASP LLM06:2023).

Pour l'architecture de la portée des identifiants par locataire et des ACL de namespace, voir [architecture multi-locataires des agents IA et isolation inter-locataires](/learn/ai-agent-multi-tenancy).

### Le modèle de responsabilité partagée dans AaaS

Erreurs clients courantes créant des lacunes de sécurité :

1. Identifiants dans les prompts système
2. Permissions d'outils trop larges
3. Pas de portée d'outil par agent
4. Pas d'interruption HITL pour les actions irréversibles

## AaaS vs auto-hébergé : le cadre de décision

### Quand AaaS l'emporte

AaaS est le meilleur choix quand :
- **Volume faible à moyen** : frais d'action inférieurs aux coûts d'infrastructure auto-hébergée (point de croisement env. 12 500 requêtes/jour)
- **Rapidité de mise en production** : AaaS élimine des semaines de configuration d'infrastructure
- **Héritage de conformité** : plateformes AaaS certifiées SOC 2 Type II

### Quand l'auto-hébergement l'emporte

L'auto-hébergement est le bon choix quand :
- **Le volume dépasse le point de croisement** : au-delà de 50 000 actions d'agent/jour
- **Exigences d'exécution personnalisées** : environnements d'exécution d'outils non standards
- **Exigences de résidence des données** : secteurs réglementés
- **Le risque de verrouillage fournisseur est inacceptable**

### Coût total de possession

Comparaison TCO pour 100 000 actions/jour :

**AaaS (style AWS Bedrock) :**
- Requêtes KB : 1 200 USD/mois
- Frais d'orchestration : env. 300 USD/mois
- Total : env. 1 500 USD/mois + coûts modèles

**Auto-hébergé :**
- Cluster Kubernetes : 800 USD/mois
- Store vectoriel : 200 USD/mois
- Stack d'observabilité : 150 USD/mois
- Engineering : 2 400 USD/mois
- Total : env. 3 550 USD/mois + coûts modèles

## L'avis d'OpenLegion : la sécurité AaaS est une question d'architecture des identifiants

Agent as a Service est la catégorie d'achat d'IA enterprise à la croissance la plus rapide en 2026, et aussi celle avec la base de sécurité la moins standardisée.

**Application architecturale** : les identifiants n'entrent jamais dans le code de l'agent ou la fenêtre de contexte. Cette propriété ne peut être contournée par une erreur de développeur.

**Isolation basée sur les conventions** : les développeurs reçoivent l'instruction de ne pas mettre les identifiants dans les prompts système. Se brise sous la pression du temps, les lacunes de révision du code et les échecs d'intégration des développeurs.

Trois chiffres concrets :
- **CVE-2024-5184 (CVSS 9,1 CRITIQUE, juin 2024)**
- **32,88 USD CPC** pour "agent as a service" au T1-T2 2026
- **Croissance 4x en glissement annuel** du volume de recherche de juin 2025 au début 2026

| **Contrôle de sécurité** | **OpenLegion** | **AWS Bedrock Agents** | **Google Agent Space** | **OpenAI Operator** | **LangGraph (auto-hébergé)** |
|---|---|---|---|---|---|
| **Vault d'identifiants avec résolution de handle $CRED{}** | Zone 2, architectural | Prise de rôle IAM | Portée compte de service | Isolation de session | Responsabilité développeur |
| **Plafond de dépenses journalières par agent (couche infrastructure)** | Zone 2, 0--50 USD/jour | Non disponible | Non disponible | Non disponible | Responsabilité développeur |
| **ACL de tableau de bord par projet locataire** | Architectural | Basé sur IAM | Basé sur projet | S.O. | Responsabilité développeur |
| **Portée des permissions d'outils par agent** | Imposée par le runtime | IAM groupe d'actions | Basé sur IAM | S.O. | Responsabilité développeur |
| **Journal d'audit WORM par locataire (SOC 2 CC6.1)** | Natif | CloudTrail | Cloud Audit Logs | S.O. | Responsabilité développeur |
| **Définition d'agent dans git** | INSTRUCTIONS.md | Console/API | Console/API | S.O. | Responsabilité développeur |

[Commencer à construire sur OpenLegion](https://app.openlegion.ai) -- déployez des agents avec une isolation architecturale des identifiants, des plafonds de dépenses journalières par agent appliqués en Zone 2 et des ACL de tableau de bord rendant l'accès cross-locataire architecturalement impossible.

<!-- SCHEMA: FAQPage -->

## Foire aux questions

### Qu'est-ce que l'Agent as a Service (AaaS) ?

Agent as a Service (AaaS) est un modèle de livraison commercial dans lequel des agents IA fonctionnent sur l'infrastructure gérée d'un fournisseur, prenant en charge l'orchestration, l'exécution des outils, la mémoire et la gestion des identifiants, facturé au client sur une base de consommation. La catégorie AaaS s'est cristallisée en 2026 avec le lancement d'OpenAI Operator (janvier 2025), la disponibilité générale de Google Agent Space et AWS Bedrock Agents atteignant l'échelle enterprise. Chaque plateforme AaaS fait trois promesses : infrastructure gérée, tarification à la consommation et isolation des identifiants.

### Combien coûte l'Agent as a Service ?

La tarification AaaS comporte trois couches de coût : le coût du modèle LLM sous-jacent, des frais de couche d'orchestration (AWS Bedrock Agents : 0,000025 USD/token d'entrée) et des frais par action pour les intégrations d'outils (AWS Bedrock Knowledge Base : 0,0004 USD/requête). À 100 000 actions d'agent/jour, les frais de plateforme AaaS atteignent typiquement 1 500 à 3 600 USD/mois avant les coûts de modèle.

### Qu'est-ce qu'AWS Bedrock Agents et comment est-il tarifé ?

AWS Bedrock Agents est la plateforme AaaS gérée d'Amazon avec orchestration d'agents, groupes d'actions et bases de connaissances sur infrastructure AWS gérée avec isolation des identifiants basée sur les rôles IAM. Tarification (2026) : 0,000025 USD par token d'entrée pour la couche d'orchestration ; les requêtes Knowledge Base coûtent 0,0004 USD par requête.

### Qu'était OpenAI Operator et pourquoi est-il important pour AaaS ?

OpenAI Operator, lancé en janvier 2025, est le premier produit AaaS grand public -- un agent IA exécutant des tâches web dans une session de navigateur en sandbox au nom de l'utilisateur, tarifé par complétion de tâche. Operator a démontré que les consommateurs paieront pour l'exécution de tâches d'agent en tant que service, corrélant directement avec la multiplication par 4 du volume de recherche "agent as a service" début 2026.

### Comment fonctionne l'isolation des identifiants dans les plateformes AaaS ?

L'isolation des identifiants signifie que la plateforme n'expose jamais les clés API LLM, les identifiants de base de données ou les secrets d'outils du client au code de l'agent. AWS Bedrock Agents y parvient via la prise de rôle IAM. OpenLegion utilise la résolution de handle `$CRED{}` en Zone 2 : le code de l'agent référence un identifiant par nom ; Zone 2 résout la valeur réelle au moment de l'exécution sans la renvoyer à l'agent.

### Quels risques de sécurité sont spécifiques aux plateformes AaaS ?

Le risque AaaS-spécifique principal est la surface d'attaque élargie pour l'injection de prompt (CVE-2024-5184, CVSS 9,1 CRITIQUE) : les agents AaaS appellent des APIs externes et traitent du contenu web externe, et n'importe laquelle de ces réponses peut contenir des instructions malveillantes. Le deuxième risque est la fuite de prompt inter-locataires avec une architecture d'isolation faible. Le troisième risque est la lacune de responsabilité partagée.

### Quand utiliser AaaS vs infrastructure auto-hébergée ?

AaaS est le meilleur choix pour un volume faible à moyen, une rapidité de mise en production ou un héritage de conformité. L'auto-hébergement l'emporte à grande échelle (au-delà de 50 000 actions/jour), pour des exigences d'exécution personnalisées, des réglementations de résidence des données ou quand le risque de verrouillage fournisseur est inacceptable. Le calcul TCO doit toujours inclure le temps d'ingénierie pour exploiter l'infrastructure auto-hébergée.

### Qu'est-ce que l'isolation de prompt multi-locataires dans AaaS ?

L'isolation de prompt multi-locataires signifie que le prompt système, l'historique de conversation, les résultats d'outils et l'état mémoire du locataire A n'apparaissent jamais dans le contexte de l'agent du locataire B. Les mécanismes d'isolation les plus solides sont au niveau de l'infrastructure. Le pattern le plus faible est l'isolation au niveau du prompt système, qui échoue lorsque l'injection de prompt écrase l'instruction du locataire (OWASP LLM06:2023).
