---
title: OpenLegion vs nanobot — Comparaison détaillée (2026)
description: >-
 OpenLegion vs nanobot : framework axé sécurité vs alternative ultra-légère
 à OpenClaw. Gestion des identifiants, isolation et maturité en production
 comparées.
slug: /comparison/nanobot
primary_keyword: openlegion vs nanobot
secondary_keywords:
 - nanobot alternative
 - nanobot security
 - nanobot vulnerability
 - lightweight ai agent framework
 - openclaw alternative python
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /comparison/nanoclaw
 - /comparison/picoclaw
 - /comparison/zeroclaw
 - /comparison/openclaw
---

# OpenLegion vs nanobot : ce qu'une vulnérabilité CVSS 10.0 nous enseigne sur la sécurité des agents

nanobot est probablement le cas d'étude le plus instructif dans l'espace de la sécurité des agents IA. Créé par un laboratoire de recherche universitaire début 2026, il distille les 430 000+ lignes d'OpenClaw en environ 4 000 lignes de Python — une réduction de code de 99 % qui lui a valu 218 points sur Hacker News (la plus forte réception de toute alternative Claw) et environ 20 000-26 000 étoiles GitHub.

Puis, quelques semaines après le lancement, des chercheurs en sécurité ont divulgué une **vulnérabilité critique (CVSS 10.0)** : le pont WhatsApp de nanobot liait son serveur WebSocket à 0.0.0.0:3001 sans aucune authentification. N'importe qui sur le réseau pouvait détourner des sessions WhatsApp. Des vulnérabilités critiques supplémentaires ont suivi — injection de commande shell, contournement de path traversal et une faille d'exécution de code à distance héritée d'une dépendance LiteLLM.

nanobot est un outil pédagogique bien intentionné qui est accidentellement devenu un cas d'étude sur pourquoi le code léger seul n'équivaut pas à du code sécurisé. OpenLegion existe pour rendre cette leçon structurelle.

OpenLegion est un [framework d'agents IA](/learn/ai-agent-platform) axé sécurité avec isolation obligatoire par conteneur Docker, gestion des identifiants par proxy de coffre-fort, application des budgets par agent et coordination en modèle de flotte (tableau noir + pub/sub + handoff).

<!-- SCHEMA: DefinitionBlock -->

> **Quelle est la différence entre OpenLegion et nanobot ?**
> nanobot est une réimplémentation Python d'OpenClaw de ~4 000 lignes axée sur la simplicité éducative et la lisibilité. Il prend en charge 11+ fournisseurs LLM et 8+ canaux de messagerie mais a subi une vulnérabilité critique du pont WhatsApp (CVSS 10.0, détournement de session WhatsApp non authentifié), une injection shell, un path traversal et des vulnérabilités RCE LiteLLM. OpenLegion est un framework Python axé sécurité avec isolation obligatoire par conteneur Docker par agent, gestion des identifiants par proxy de coffre-fort où les agents ne voient jamais les clés API, application des budgets par agent et coordination en modèle de flotte (tableau noir + pub/sub + handoff). nanobot optimise pour l'apprentissage et la simplicité ; OpenLegion optimise pour la sécurité de production.

## En bref

| Dimension | OpenLegion | nanobot |
|---|---|---|
| **Focus principal** | Infrastructure de sécurité de production | Simplicité éducative |
| **Langage** | Python | Python (~4 000 lignes) |
| **Isolation d'agent** | Conteneur Docker par agent, non-root | Flag `restrict_to_workspace` (niveau application) |
| **Sécurité des identifiants** | Proxy de coffre-fort — les agents ne voient jamais les clés | Fichier de configuration (`~/.nanobot/config.json`) |
| **Contrôles de budget** | Coupure stricte quotidienne/mensuelle par agent | Aucun intégré |
| **Orchestration** | Coordination en modèle de flotte (tableau noir + pub/sub + handoff) | Agent unique avec sous-agents en arrière-plan |
| **Fournisseurs LLM** | 100+ via LiteLLM | 11+ (OpenRouter, Anthropic, OpenAI, DeepSeek, etc.) |
| **Canaux de messagerie** | 5 | 8+ (Telegram, Discord, WhatsApp, Feishu, DingTalk, etc.) |
| **Multi-agent** | Templates de flotte avec ACL par agent | Génération de sous-agents (pas d'orchestration de flotte) |
| **Mémoire** | Persistante par agent avec recherche vectorielle | Récupération basée sur grep (évite délibérément RAG) |
| **Étoiles GitHub** | ~59 | ~20 000-26 000 |
| **Licence** | PolyForm Perimeter License 1.0.1 | MIT |
| **CVE connues** | 0 | **vulnérabilité critique du pont WhatsApp (CVSS 10.0)** + 3 patches critiques supplémentaires |
| **Origine** | Indépendant | Laboratoire de recherche universitaire |

## Choisissez nanobot si...

**Vous voulez apprendre comment fonctionnent les agents IA.** nanobot est un squelette pédagogique. À 4 000 lignes avec une structure claire, c'est la meilleure base de code pour comprendre la boucle d'agent principale : abstraction du fournisseur, dispatch d'outils, récupération mémoire et passerelles de chat. DataCamp a publié un tutoriel complet. Les créateurs l'ont explicitement conçu pour la lisibilité éducative.

**Vous avez besoin du support des plateformes de messagerie asiatiques.** nanobot a un support de première classe pour Feishu (Lark), DingTalk, QQ et les plateformes proches de WeChat — canaux qu'aucun framework axé Occident ne couvre bien. Si votre déploiement cible la messagerie d'entreprise chinoise, l'écosystème de nanobot est positionné de manière unique.

**Vous voulez exécuter des agents sur un Raspberry Pi.** nanobot est suffisamment léger pour les ordinateurs monocartes. Combiné à Ollama pour l'inférence locale, vous obtenez une opération d'agent entièrement hors ligne.

**Vous valorisez la simplicité plutôt que l'infrastructure.** Config JSON, mémoire basée sur grep (pas de base de données vectorielle requise) et pip install. Pas de Docker, pas de coordination en modèle de flotte, pas de configuration de coffre-fort. De l'installation à l'agent en marche en moins de cinq minutes.

**L'élan communautaire compte pour vous.** Le lancement à 218 points sur HN de nanobot, son Discord actif, l'intégration DataCamp et ses ~20 000+ étoiles représentent un investissement communautaire significatif et un large vivier de contributeurs corrigeant les problèmes rapidement (le CVSS 10.0 a été patché en quelques jours).

## Choisissez OpenLegion si...

**La sécurité doit être architecturale, pas optionnelle.** Le flag `restrict_to_workspace` de nanobot est le principal mécanisme d'isolation — un booléen qui peut être désactivé. Ses clés API vivent dans un fichier de configuration JSON en clair. Son serveur WebSocket a été livré sans authentification. Ce ne sont pas des cas limites obscurs ; ce sont des décisions architecturales fondamentales qui ont produit un CVSS 10.0 en quelques semaines. OpenLegion rend les configurations non sécurisées structurellement impossibles : l'isolation par conteneur est obligatoire, le proxy de coffre-fort est le seul chemin pour les identifiants et la coordination en modèle de flotte est bornée par la détection de boucles d'outils par agent.

**Vous ne pouvez pas vous permettre un CVSS 10.0 en production.** La vulnérabilité critique du pont WhatsApp permettait à des attaquants adjacents au réseau non authentifiés de détourner les sessions WhatsApp en se connectant au serveur WebSocket non protégé de nanobot sur le port 3001. Les vulnérabilités supplémentaires d'injection shell et de path traversal ont été trouvées par un seul chercheur en sécurité dans un seul audit. L'architecture de proxy de coffre-fort d'OpenLegion signifie qu'il n'y a pas d'identifiants à détourner — les agents appellent via un proxy qui injecte les clés au niveau réseau.

**Vous avez besoin de contrôle des coûts par agent.** nanobot n'a pas d'application des budgets. Avec le support de 11+ fournisseurs et la capacité de générer des sous-agents en arrière-plan, les dépenses API incontrôlées s'accumulent silencieusement. OpenLegion applique des limites quotidiennes et mensuelles par agent avec coupure stricte automatique.

**Vous avez besoin d'une coordination de flotte multi-agent auditable.** nanobot prend en charge la génération de sous-agents, mais l'orchestration est pilotée par LLM et non déterministe. La coordination en modèle de flotte d'OpenLegion définit des enregistrements de handoff explicites, l'accès aux outils et les dépendances par agent — auditable avant déploiement.

**Vous avez besoin de prouver votre posture de sécurité aux parties prenantes.** L'historique CVE de nanobot en fait une vente difficile aux équipes de sécurité, aux évaluateurs de conformité ou aux achats d'entreprise. L'architecture de proxy de coffre-fort, l'isolation obligatoire par conteneur et les ACL par agent d'OpenLegion fournissent des contrôles de sécurité démontrables.

## Comparaison du modèle de sécurité

### Où vivent les secrets

**nanobot** stocke les clés API dans `~/.nanobot/config.json` — un fichier JSON en clair sur disque. Le fichier de configuration était initialement écrit avec les permissions 0644 (lisible par tous) ; cela a été corrigé plus tard à 0600. Au runtime, les clés sont chargées dans la mémoire du processus Python. Tout code s'exécutant dans le processus de l'agent peut les lire.

**OpenLegion** stocke les identifiants dans un coffre-fort que les agents ne peuvent pas atteindre. Les appels API sont routés via un proxy de coffre-fort qui injecte les identifiants au niveau réseau. Aucun fichier de configuration avec clés en clair, aucune variable d'environnement avec secrets, aucun fichier d'identifiants monté. Le processus de l'agent ne détient jamais de clés API.

### Modèle d'isolation

**nanobot** utilise un flag `restrict_to_workspace` qui limite les opérations de fichiers au répertoire de l'espace de travail. C'est un contrôle au niveau application dans le code Python — si un agent atteint une exécution de code arbitraire (ce que la vulnérabilité d'injection shell a démontré possible), la restriction de l'espace de travail peut être contournée. Aucune isolation au niveau OS n'est appliquée.

**OpenLegion** utilise l'isolation par conteneur Docker par agent. Chaque agent s'exécute dans un conteneur séparé avec exécution non-root, sans accès au socket Docker, no-new-privileges et plafonds de ressources par conteneur. Même si un agent atteint une exécution de code arbitraire à l'intérieur de son conteneur, il ne peut pas accéder à d'autres agents, au système hôte ou aux magasins d'identifiants.

### Le registre CVE

**nanobot** a accumulé des problèmes de sécurité significatifs dans sa brève existence :

- **Vulnérabilité critique du pont WhatsApp (CVSS 10.0) :** pont WebSocket WhatsApp lié à 0.0.0.0:3001 sans authentification. Les attaquants adjacents au réseau pouvaient détourner des sessions. Découvert par des chercheurs en sécurité.
- **Injection de commande shell (moyenne) :** entrée utilisateur non désinfectée passée à l'exécution shell.
- **Contournement de path traversal (moyenne) :** `restrict_to_workspace` pouvait être contourné.
- **RCE LiteLLM via `eval()` (Critique) :** héritée de la dépendance. Exécution de code à distance via entrée malformée.
- **Empoisonnement de session (patché le 26 février 2026) :** manipulation de l'historique des messages.

**OpenLegion** n'a aucune CVE signalée à v0.1.0. Son architecture rend plusieurs des classes de vulnérabilités de nanobot structurellement impossibles : le proxy de coffre-fort élimine l'exposition des identifiants, l'isolation Docker empêche les évasions de path traversal et la coordination en modèle de flotte empêche l'exécution shell arbitraire sans octrois d'outils explicites.

### Contrôles de budget

**nanobot** n'a pas de limites de dépenses intégrées. Les sous-agents en arrière-plan peuvent faire des appels API sans plafonds.

**OpenLegion** applique des limites quotidiennes et mensuelles par agent avec coupure stricte automatique.

## L'écosystème de nanobot : ce qu'il fait de mieux

### Le squelette pédagogique

La plus grande contribution de nanobot est éducative. La boucle d'agent principale — recevoir un message, récupérer le contexte, appeler le LLM, dispatcher les outils, retourner la réponse — est exposée en Python propre et lisible. Le choix délibéré d'utiliser la récupération mémoire basée sur grep au lieu de RAG rend le mécanisme de récupération transparent. La config JSON est lisible par l'humain. Chaque décision architecturale privilégie la compréhension à la sophistication.

Pour les étudiants, chercheurs et développeurs apprenant comment les agents IA fonctionnent en interne, nanobot est sans doute le meilleur point de départ.

### Intégration de plateformes asiatiques

Le support de canaux de nanobot inclut Feishu (Lark), DingTalk, QQ et Matrix — plateformes qui dominent la communication d'entreprise chinoise. Aucun autre framework dans l'écosystème OpenClaw ne fournit une couverture comparable. L'origine universitaire du projet explique probablement ce focus, et il représente une valeur réelle pour les équipes opérant sur les marchés asiatiques.

### Compatibilité avec les compétences ClawHub

nanobot s'intègre à l'écosystème de compétences ClawHub, lui donnant accès aux compétences d'agents contribuées par la communauté. Le format de documentation SKILL.md est partagé entre nanobot, PicoClaw et d'autres projets de la famille Claw.

### La culture de réponse rapide

Lorsque la vulnérabilité critique du pont WhatsApp a été divulguée, l'équipe nanobot l'a patchée en quelques jours. Le correctif d'empoisonnement de session a atterri le 26 février. L'injection shell et le path traversal ont été adressés rapidement. La réactivité de la communauté est véritablement impressionnante — mais cela met également en évidence que les problèmes n'auraient pas dû être livrés en premier lieu.

### Pièges courants en production

**Le problème fondamental est architectural.** nanobot a été conçu comme un outil pédagogique qui est devenu populaire en production. Son modèle de sécurité — restriction d'espace de travail au niveau application, config en clair, pas d'isolation réseau — est approprié pour l'expérimentation locale mais dangereux en production. Le CVSS 10.0 n'était pas un bug dans du code complexe ; c'était un serveur WebSocket sans authentification. C'est le genre d'oubli que les contraintes de sécurité architecturales empêchent.

**Risque de chaîne de dépendances.** Le RCE LiteLLM (via `eval()`) démontre que même des bases de code minimales héritent des vulnérabilités de leurs dépendances. Les ~4 000 lignes de nanobot sont auditables, mais l'arbre complet de dépendances ne l'est pas.

**Pas de modèle de sécurité réseau.** nanobot n'a pas de concept de politiques réseau, de contrôles d'entrée ou d'isolation de service mesh. Les agents peuvent faire des connexions sortantes arbitraires. Combiné à l'accès shell, cela crée une large surface d'attaque.

### Ce qu'OpenLegion couvre différemment

L'architecture d'OpenLegion empêche les classes de vulnérabilités de nanobot par conception :

- **Vulnérabilité critique du pont WhatsApp (service réseau non authentifié) :** les agents OpenLegion s'exécutent dans des conteneurs Docker sans ports exposés par défaut. L'accès réseau est explicitement accordé par agent.
- **Injection shell :** la coordination en modèle de flotte d'OpenLegion exige des octrois d'outils explicites. L'accès shell n'est pas disponible sauf si spécifiquement activé dans l'ACL de l'agent.
- **Path traversal :** l'isolation par conteneur Docker avec montages en lecture seule et sans socket Docker élimine le path traversal comme vecteur d'attaque significatif.
- **Exposition d'identifiants :** le proxy de coffre-fort signifie qu'aucun identifiant n'existe dans l'environnement de l'agent à voler.
- **RCE de dépendance :** l'isolation par conteneur limite le rayon d'impact — même si une dépendance a un RCE, l'attaquant est contenu dans un conteneur bac à sable sans identifiants.

## Compromis hébergement vs auto-hébergement

**nanobot** est conçu pour l'auto-hébergement local. pip install, config JSON et un agent en marche en minutes. Aucun service hébergé n'existe. La nature légère signifie que tout système Linux, macOS ou même un Raspberry Pi peut l'héberger.

**OpenLegion** nécessite Python, SQLite et Docker. La plateforme hébergée (à venir) offrira des instances VPS par utilisateur à 19 $/mois. L'exigence Docker ajoute de la surcharge d'infrastructure mais fournit la couche d'isolation qui rend le déploiement en production sûr.

## Pour qui c'est

**nanobot** est pour les étudiants, chercheurs et développeurs individuels qui veulent comprendre l'architecture des agents IA via une base de code propre et lisible. Il est également précieux pour les équipes ciblant les plateformes de messagerie asiatiques (Feishu, DingTalk, QQ). L'utilisateur idéal exécute nanobot localement pour des tâches personnelles et ne l'expose pas à des réseaux non fiables.

**OpenLegion** est pour les équipes d'ingénierie déployant des agents dans des environnements où les incidents de sécurité ont des conséquences commerciales. L'utilisateur idéal a besoin de démontrer l'isolation des identifiants, le contrôle des coûts et les pistes d'audit aux parties prenantes — et ne peut pas risquer un CVSS 10.0 en production.

## Le compromis honnête

nanobot prouve que vous pouvez reconstruire un runtime d'agent IA en 4 000 lignes. Cet accomplissement est réel et précieux pour l'écosystème. Mais la vulnérabilité critique du pont WhatsApp prouve que simplicité et sécurité ne sont pas la même chose. Une base de code de 4 000 lignes avec un CVSS 10.0 est moins sécurisée qu'une base de code de ~77 000 lignes avec des contraintes architecturales qui rendent cette classe de vulnérabilités impossible.

Si vous voulez apprendre comment fonctionnent les agents, lisez le code source de nanobot. Si vous voulez déployer des agents en toute sécurité, utilisez un framework où les configurations non sécurisées ne peuvent pas se produire.

Pour le paysage complet, consultez notre [comparaison des frameworks d'agents IA](/learn/ai-agent-frameworks).

## CTA

**Déployez des agents avec une sécurité architecturale, pas aspirationnelle.**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai) | [Voir toutes les comparaisons](/comparison)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Qu'est-ce que nanobot ?

nanobot est une réimplémentation Python d'OpenClaw de ~4 000 lignes créée par un laboratoire de recherche universitaire. Il prend en charge 11+ fournisseurs LLM et 8+ canaux de messagerie (dont des plateformes asiatiques comme Feishu, DingTalk et QQ). Il a été lancé le 2 février 2026 et a environ 20 000-26 000 étoiles GitHub. Il a reçu la plus forte réception Hacker News de toute alternative à OpenClaw (218 points, 111 commentaires).

### OpenLegion vs nanobot : quelle est la différence ?

nanobot est un squelette pédagogique — minimal, lisible et conçu pour l'apprentissage. OpenLegion est un framework de sécurité de production. nanobot utilise une restriction d'espace de travail au niveau application et une config JSON en clair ; OpenLegion utilise l'isolation par conteneur Docker et les identifiants protégés par proxy de coffre-fort. nanobot a subi une vulnérabilité critique du pont WhatsApp (CVSS 10.0) plus trois vulnérabilités critiques supplémentaires ; OpenLegion n'a aucune CVE signalée à v0.1.0 et une architecture qui rend ces classes de vulnérabilités structurellement impossibles.

### OpenLegion est-il une alternative à nanobot ?

Oui. Les deux sont des frameworks d'agents IA basés sur Python, mais ils servent des objectifs différents. nanobot est idéal pour l'apprentissage et l'expérimentation locale. OpenLegion est une alternative pour les équipes ayant besoin d'une sécurité de niveau production — isolation des identifiants par proxy de coffre-fort, application des budgets par agent, isolation par conteneur Docker et coordination en modèle de flotte (tableau noir + pub/sub + handoff).

### Comment la gestion des identifiants se compare-t-elle entre OpenLegion et nanobot ?

nanobot stocke les clés API dans `~/.nanobot/config.json` (initialement lisible par tous jusqu'au patch). Les clés sont chargées dans la mémoire du processus Python au runtime. OpenLegion utilise un proxy de coffre-fort — les agents font des appels API via un proxy qui injecte les identifiants au niveau réseau. Les agents ne détiennent, ne lisent ou n'ont jamais accès aux clés API sous quelque forme que ce soit.

### Lequel est le meilleur pour les agents IA en production ?

OpenLegion est significativement mieux adapté à la production. nanobot a été conçu comme un outil pédagogique et a accumulé une vulnérabilité critique du pont WhatsApp (CVSS 10.0), injection shell, path traversal et vulnérabilités RCE de dépendance en quelques semaines après le lancement. L'isolation par conteneur obligatoire, les identifiants protégés par proxy de coffre-fort, les budgets par agent et la coordination en modèle de flotte auditable d'OpenLegion adressent les classes exactes de vulnérabilités qui ont affecté nanobot.

### nanobot est-il identique à nanobot (Obot AI) ?

Non. Il y a deux projets complètement différents partageant le nom. Le nanobot discuté sur cette page est une alternative Python à OpenClaw de ~4 000 lignes d'un laboratoire de recherche universitaire. Le nanobot d'Obot AI est une plateforme d'agents MCP basée sur Go soutenue par 35 M$ de financement d'amorçage de l'équipe Rancher Labs. Cette page compare OpenLegion avec la version alternative Python à OpenClaw.

### Quelle était la vulnérabilité critique du pont WhatsApp de nanobot ?

Le pont WhatsApp de nanobot contenait une vulnérabilité critique (CVSS 10.0) où le serveur WebSocket se liait à 0.0.0.0:3001 sans aucune authentification. Tout attaquant adjacent au réseau pouvait se connecter et détourner les sessions WhatsApp actives. Elle a été patchée rapidement mais démontre le risque de déployer des frameworks d'agents sans isolation réseau architecturale.

### Puis-je migrer de nanobot vers OpenLegion ?

La config JSON et la configuration d'agent de nanobot seraient restructurées en coordination en modèle de flotte avec des octrois d'outils explicites, des limites de budget et des ACL par agent. Les paramètres de fournisseur LLM se transfèrent directement puisque les deux utilisent des configurations de fournisseur compatibles LiteLLM. Consultez notre page [Orchestration d'agents IA](/learn/ai-agent-orchestration).

---

## Comparaisons connexes

| Texte d'ancre | Destination |
|---|---|
| OpenLegion vs NanoClaw | /comparison/nanoclaw |
| OpenLegion vs PicoClaw | /comparison/picoclaw |
| OpenLegion vs ZeroClaw | /comparison/zeroclaw |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Comparaison des frameworks d'agents IA 2026 | /learn/ai-agent-frameworks |
| Analyse de sécurité des agents IA | /learn/ai-agent-security |
