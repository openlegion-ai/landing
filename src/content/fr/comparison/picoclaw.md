---
title: OpenLegion vs PicoClaw — Comparaison détaillée (2026)
description: >-
 OpenLegion vs PicoClaw : framework de sécurité de production vs agent
 périphérique alimenté par Go pour matériel à 10 $. Lacunes de sécurité,
 déploiement RISC-V, gestion des identifiants et isolation comparés.
slug: /comparison/picoclaw
primary_keyword: openlegion vs picoclaw
secondary_keywords:
 - picoclaw alternative
 - picoclaw security
 - edge ai agent framework
 - go ai agent lightweight
 - risc-v ai agent
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /comparison/nanobot
 - /comparison/zeroclaw
 - /comparison/nanoclaw
 - /comparison/openclaw
---

# OpenLegion vs PicoClaw : sécurité de production vs agents IA sur matériel à 10 $

PicoClaw représente quelque chose de véritablement nouveau dans l'espace des agents : des agents IA s'exécutant sur des cartes RISC-V à 10 $. Construit par une entreprise de matériel embarqué, PicoClaw est un assistant IA monobinaire alimenté par Go qui cible moins de 10 Mo de RAM avec démarrage sous la seconde. Son affirmation la plus remarquable : 95 % du code principal a été généré par des agents IA en une journée. Il a été lancé le 9 février 2026 et a atteint environ 20 000-21 000 étoiles GitHub avec 900+ issues déposées en trois semaines.

OpenLegion est un [framework d'agents IA](/learn/ai-agent-platform) axé sécurité avec isolation obligatoire par conteneur Docker, gestion des identifiants par proxy de coffre-fort, application des budgets par agent et coordination en modèle de flotte (tableau noir + pub/sub + handoff).

PicoClaw et OpenLegion occupent des extrémités opposées du spectre de déploiement. PicoClaw pousse les agents vers le matériel le moins cher possible. OpenLegion garantit que les agents opèrent avec les garanties de sécurité les plus solides possibles. Ce sont des paris fondamentalement différents sur la provenance de la valeur des agents IA.

<!-- SCHEMA: DefinitionBlock -->

> **Quelle est la différence entre OpenLegion et PicoClaw ?**
> PicoClaw est un assistant d'agent IA ultra-léger basé sur Go compilé en binaire de ~8 Mo ciblant le matériel RISC-V et ARM64 à 10 $. Il utilise la mise en bac à sable d'espace de travail et les allowlists au niveau canal mais a des lacunes de sécurité documentées, dont contournement d'allowlist Slack, fichiers de configuration lisibles par tous exposant les clés API et aucun SECURITY.md ou processus CVE formel. OpenLegion est un framework axé sécurité basé sur Python avec isolation obligatoire par conteneur Docker, gestion des identifiants par proxy de coffre-fort où les agents ne voient jamais les clés API, application des budgets par agent et coordination en modèle de flotte (tableau noir + pub/sub + handoff). PicoClaw optimise pour l'efficacité matérielle ; OpenLegion optimise pour la sécurité de production.

## En bref

| Dimension | OpenLegion | PicoClaw |
|---|---|---|
| **Focus principal** | Infrastructure de sécurité de production | Efficacité matérielle périphérique |
| **Langage** | Python | Go |
| **Binaire/empreinte** | Python + Docker | Binaire unique de ~8 Mo |
| **Matériel cible** | Serveurs standard, VPS, cloud | RISC-V à 10 $, ARM64, x86_64 |
| **Usage RAM** | Par conteneur (plafonds configurables) | Moins de 10 Mo |
| **Démarrage à froid** | Conteneur Docker (~2-5 s) | Sous la seconde |
| **Isolation d'agent** | Conteneur Docker par agent, non-root | Mise en bac à sable d'espace de travail (`restrict_to_workspace`) |
| **Sécurité des identifiants** | Proxy de coffre-fort — les agents ne voient jamais les clés | Fichier de configuration (était 0644 lisible par tous) |
| **Contrôles de budget** | Coupure stricte quotidienne/mensuelle par agent | Aucun intégré |
| **Orchestration** | Coordination en modèle de flotte (tableau noir + pub/sub + handoff) | Sous-agents + planification cron |
| **Fournisseurs LLM** | 100+ via LiteLLM | 8+ (OpenRouter, Anthropic, OpenAI, DeepSeek, etc.) |
| **Capable hors ligne** | Non (LLM cloud requis) | Oui (modèle compagnon PicoLM 1B) |
| **Canaux de messagerie** | 5 | 8+ (Telegram, Discord, QQ, DingTalk, LINE, etc.) |
| **Étoiles GitHub** | ~59 | ~20 000-21 000 |
| **Licence** | BSL 1.1 | MIT |
| **CVE connues** | 0 | 0 CVE formelle ; plusieurs lacunes de sécurité documentées |
| **Fabricant** | Indépendant | Entreprise de matériel embarqué |
| **Code généré par IA** | Non | Affirmation de 95 % généré par IA |

## Choisissez PicoClaw si...

**Vous avez besoin d'agents sur du matériel à 10 $.** PicoClaw est le seul framework d'agents qui fonctionne de manière significative sur des ordinateurs monocartes RISC-V. Combiné à PicoLM (le modèle compagnon à 1 milliard de paramètres du fabricant), vous obtenez une opération d'agent entièrement hors ligne sur du matériel qui coûte moins qu'un mois de la plupart des abonnements SaaS. C'est véritablement novateur.

**Le déploiement multi-architecture compte.** PicoClaw se compile vers RISC-V, ARM64 et x86_64 depuis une seule base de code. Si votre déploiement s'étend sur des dispositifs embarqués, des clusters Raspberry Pi et des serveurs cloud, PicoClaw est le seul framework couvrant les trois.

**Vous voulez le support des plateformes de messagerie asiatiques.** QQ, DingTalk, LINE, WeCom et Feishu sont des canaux de première classe — reflétant la présence sur le marché chinois du fabricant. Aucun framework occidental ne couvre ces plateformes.

**L'opération entièrement hors ligne est requise.** PicoLM permet un déploiement d'agent sur site sans connectivité cloud. Pour l'IoT industriel, les réseaux restreints ou les déploiements périphériques sensibles à la vie privée, cela élimine entièrement la dépendance cloud.

**Vous valorisez la vélocité communautaire.** 900+ issues en trois semaines indique une adoption massive et un retour actif. Le rythme de développement de PicoClaw est rapide, avec les revenus matériels du fabricant fournissant une durabilité financière indépendante du financement en capital-risque.

## Choisissez OpenLegion si...

**Vous ne pouvez pas livrer de lacunes de sécurité connues.** PicoClaw a des problèmes de sécurité documentés et non corrigés que son propre README reconnaît. Le contournement d'allowlist Slack (Issue #179) signifie que `handleSlashCommand` et `handleAppMention` n'appellent pas la vérification d'autorisation utilisateur — tout utilisateur Slack de l'espace de travail peut invoquer les agents PicoClaw. Les fichiers de configuration étaient écrits avec les permissions 0644, rendant les clés API lisibles par tous sur les systèmes multi-utilisateurs. L'Issue #782 catalogue les protections manquantes : pas de défense SSRF, pas de journalisation d'audit, pas de limitation de débit, pas de chiffrement d'identifiants et pas de protection contre l'injection de prompt. Le README lui-même avertit de ne pas déployer en production avant v1.0.

**Vos identifiants ont besoin de plus qu'un fichier de configuration.** PicoClaw stocke les clés API dans des fichiers de configuration YAML. Le bug de permission de fichier (0644 au lieu de 0600) a exposé les clés à tout utilisateur du système. Même après la correction des permissions, le processus de l'agent détient les clés en clair en mémoire. Le proxy de coffre-fort d'OpenLegion signifie que les agents ne détiennent jamais d'identifiants — les appels API sont routés via un proxy qui injecte les clés au niveau réseau.

**Vous avez besoin d'isolation d'agent.** Le `restrict_to_workspace` de PicoClaw est un flag au niveau application appliqué à l'agent principal, sous-agents et tâches planifiées. Si un agent atteint une exécution de code au-delà du contrôle du runtime Go, la restriction de l'espace de travail ne fournit aucun confinement. OpenLegion utilise des conteneurs Docker — isolation au niveau OS avec namespaces séparés, cgroups et aucun accès au système de fichiers hôte.

**Vous avez besoin de contrôle des coûts.** PicoClaw n'a pas d'application des budgets par agent. Les agents planifiés par cron faisant des appels API sur du matériel à 10 $ peuvent accumuler silencieusement des coûts qui éclipsent l'investissement matériel. OpenLegion applique des limites quotidiennes et mensuelles par agent avec coupure stricte.

**Vous avez besoin de coordination en modèle de flotte auditable.** PicoClaw utilise une sélection d'outils pilotée par LLM. La coordination en modèle de flotte d'OpenLegion définit l'ordre d'exécution avant le runtime — auditable, acyclique, répétable.

## Comparaison du modèle de sécurité

### Où vivent les secrets

**PicoClaw** stocke les clés API dans des fichiers de configuration YAML. Un bug de permission de fichier (0644 au lieu de 0600) les rendait initialement lisibles par tous. Même après la correction, les clés se trouvent sur disque en YAML en clair et sont chargées dans la mémoire du processus Go au runtime. La demande de framework de sécurité complet (Issue #782) liste explicitement le « chiffrement des identifiants » comme fonctionnalité manquante.

**OpenLegion** stocke les identifiants dans un coffre-fort accessible uniquement via un proxy. Les agents font des appels API via le proxy ; les identifiants sont injectés au niveau réseau. Aucun fichier de configuration ne contient de clés. Aucune mémoire de processus ne détient de clés. Aucune mauvaise configuration de permission de fichier ne peut les exposer.

### Modèle d'isolation

**PicoClaw** utilise `restrict_to_workspace: true` appliqué à l'agent principal, sous-agents et tâches planifiées. La passerelle se lie à localhost par défaut. Les allowlists d'utilisateurs au niveau canal filtrent qui peut interagir avec les agents. C'est une isolation au niveau application appliquée par le runtime Go — efficace contre les agents bien comportés, contournable par les exploits d'exécution de code.

**OpenLegion** utilise l'isolation par conteneur Docker par agent avec exécution non-root, sans socket Docker, no-new-privileges et plafonds de ressources configurables. Isolation au niveau OS appliquée par le noyau Linux.

### Lacunes de sécurité connues (PicoClaw)

Le propre suivi d'issues de PicoClaw documente des lacunes significatives :

- **Contournement d'allowlist Slack (#179) :** `handleSlashCommand` et `handleAppMention` sautent la vérification d'autorisation `IsAllowed()` — tout utilisateur de l'espace de travail peut invoquer des agents.
- **Config lisible par tous (#initial) :** config écrite avec permissions 0644 exposant les clés API.
- **Défenses manquantes (#782) :** pas de protection SSRF, pas de journalisation d'audit, pas de limitation de débit, pas de chiffrement d'identifiants, pas de défense contre l'injection de prompt.
- **Pas de SECURITY.md :** pas de processus formel de divulgation de vulnérabilités.
- **Avertissement README :** « PicoClaw est en développement précoce et peut avoir des problèmes de sécurité réseau non résolus. Ne déployez pas dans des environnements de production avant v1.0. »

**OpenLegion** n'a aucune CVE et aucune lacune de sécurité documentée. Le proxy de coffre-fort élimine l'exposition des identifiants, les conteneurs Docker fournissent une isolation au niveau OS, la coordination en modèle de flotte empêche l'exécution arbitraire et les ACL par agent appliquent l'accès aux outils.

### Contrôles de budget

**PicoClaw** n'a pas d'application des budgets intégrée. Les tâches planifiées par cron peuvent s'exécuter indéfiniment.

**OpenLegion** applique des limites quotidiennes et mensuelles par agent avec coupure stricte automatique.

## L'écosystème de PicoClaw : ce qu'il fait de mieux

### La verticale matériel-logiciel

La position unique de PicoClaw est que son fabricant fabrique également le matériel qu'il cible, vendant des cartes de développement RISC-V à partir de 8 $. PicoClaw + PicoLM sur ce matériel crée une pile d'agents IA périphériques entièrement intégrée verticalement. Aucun autre framework n'a cet alignement matériel-logiciel.

### PicoLM : agents hors ligne sur une puce

PicoLM est un modèle de langage compagnon à 1 milliard de paramètres optimisé pour le matériel cible de PicoClaw. Il permet une opération d'agent entièrement sur site : pas de cloud, pas de clés API, pas de réseau requis. Pour l'automatisation industrielle, le déploiement sur le terrain et les environnements sensibles à la vie privée, c'est une capacité qu'aucun framework dépendant du cloud ne peut égaler.

### La base de code amorcée par l'IA

L'affirmation de PicoClaw que 95 % de son code a été généré par l'IA (avec raffinement humain dans la boucle) en une journée est à la fois une histoire marketing et une expérience d'ingénierie légitime. Elle démontre que les agents IA peuvent amorcer d'autres frameworks d'agents IA — une histoire de capacité récursive qui résonne avec la communauté des développeurs.

### Compatibilité avec les compétences ClawHub

PicoClaw utilise le format de documentation SKILL.md partagé dans l'écosystème Claw, lui donnant accès aux compétences contribuées par la communauté de nanobot, ZeroClaw et autres projets de la famille Claw.

### Pièges courants en production

**Le README le dit lui-même.** La propre documentation de PicoClaw avertit contre le déploiement en production avant v1.0. La demande de framework de sécurité complet (#782) se lit comme une checklist d'évaluation de vulnérabilités de protections manquantes. C'est une honnêteté louable, mais cela signifie que PicoClaw est explicitement un projet pré-production.

**Risque d'écosystème d'arnaques.** Des tokens d'arnaque cryptographique sont apparus sur pump.fun, prétendant faussement à une affiliation PicoClaw. Cela n'affecte pas le logiciel, mais signale que la marque est exploitée — une préoccupation de chaîne d'approvisionnement pour les équipes évaluant les dépendances open-source.

**Les lacunes de sécurité se composent sur du matériel exposé.** Le modèle de sécurité de PicoClaw suppose un déploiement réseau de confiance et mono-utilisateur. Sur du matériel périphérique connecté à des réseaux d'usine, des passerelles IoT ou une infrastructure partagée, le contournement d'allowlist Slack, la protection SSRF manquante et la limitation de débit absente deviennent des problèmes de haute gravité.

### Ce qu'OpenLegion couvre différemment

OpenLegion adresse chaque élément du framework de sécurité manquant de PicoClaw (#782) : isolation des identifiants (proxy de coffre-fort), journalisation d'audit (piste d'audit du tableau noir), limitation de débit (budgets par agent plus limites de débit mesh), protection SSRF (épinglage DNS + filtre d'égression de conteneur de navigateur) et défense contre l'injection de prompt (`sanitize_for_prompt` à chaque frontière d'entrée). Ce ne sont pas des modules additionnels optionnels — ils sont architecturaux.

## Compromis hébergement vs auto-hébergement

**PicoClaw** se compile en un binaire unique de ~8 Mo qui s'exécute sur tout système RISC-V, ARM64 ou x86_64. Aucune dépendance runtime. Le mode passerelle gère les webhooks. L'opération hors ligne est possible avec PicoLM. L'empreinte de déploiement est la plus petite de tout framework d'agents.

**OpenLegion** nécessite Python, SQLite et Docker. Ne peut pas fonctionner sur des cartes RISC-V à 10 $. La plateforme hébergée (à venir) cible l'infrastructure VPS standard à 19 $/mois. La dépendance Docker limite les cibles matérielles mais permet l'isolation de sécurité qui manque à PicoClaw.

## Pour qui c'est

**PicoClaw** est pour les développeurs embarqués, ingénieurs IoT et équipes de calcul périphérique qui ont besoin d'agents IA sur du matériel minimal. L'utilisateur idéal déploie des agents sur des cartes RISC-V, des Raspberry Pi ou des instances VPS bon marché — et opère dans des environnements réseau de confiance où les lacunes de sécurité documentées sont des risques acceptables. Également précieux pour les équipes ciblant les plateformes de messagerie chinoises.

**OpenLegion** est pour les équipes déployant des agents où les incidents de sécurité ont des conséquences commerciales. L'utilisateur idéal gère des flottes d'agents traitant des identifiants sensibles, a besoin de contrôles de coûts vérifiables et doit démontrer la posture de sécurité aux parties prenantes ou aux frameworks de conformité.

## Le compromis honnête

PicoClaw fait quelque chose qu'aucun autre framework ne peut faire : il exécute des agents IA sur du matériel à 10 $ avec capacité entièrement hors ligne. Ce n'est pas un gadget — le déploiement d'agents IA périphériques est un cas d'usage réel et croissant pour l'automatisation industrielle, l'IoT et les environnements sensibles à la vie privée.

Mais la propre documentation de PicoClaw dit qu'il n'est pas prêt pour la production, et sa liste de lacunes de sécurité est longue. OpenLegion ne peut pas fonctionner sur des cartes RISC-V, mais il peut protéger les identifiants, appliquer les budgets et fournir l'isolation d'agent au niveau OS.

Si vos agents doivent fonctionner sur une puce dans une usine, choisissez PicoClaw (après v1.0). Si vos agents traitent des clés API valant plus que le matériel sur lequel ils fonctionnent, choisissez OpenLegion.

Pour le paysage complet, consultez notre [comparaison des frameworks d'agents IA](/learn/ai-agent-frameworks).

## CTA

**Infrastructure de sécurité pour les flottes d'agents traitant de vrais identifiants.**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai) | [Voir toutes les comparaisons](/comparison)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Qu'est-ce que PicoClaw ?

PicoClaw est un assistant d'agent IA ultra-léger alimenté par Go construit par une entreprise chinoise de matériel embarqué. Il se compile en binaire de ~8 Mo ciblant moins de 10 Mo de RAM sur matériel RISC-V, ARM64 et x86_64. Il inclut PicoLM, un modèle compagnon de 1 milliard de paramètres pour l'opération hors ligne. Il a environ 20 000-21 000 étoiles GitHub depuis son lancement le 9 février 2026.

### OpenLegion vs PicoClaw : quelle est la différence ?

PicoClaw cible le matériel périphérique à 10 $ avec un usage minimal de ressources et une capacité hors ligne. OpenLegion cible les environnements de production avec isolation obligatoire par conteneur Docker, gestion des identifiants par proxy de coffre-fort, application des budgets par agent et coordination en modèle de flotte (tableau noir + pub/sub + handoff). PicoClaw a des lacunes de sécurité documentées contre lesquelles son README met en garde ; OpenLegion n'a aucune CVE signalée à v0.1.0 et des contraintes de sécurité architecturales.

### OpenLegion est-il une alternative à PicoClaw ?

Oui, pour les équipes passant de l'expérimentation périphérique au déploiement en production. PicoClaw excelle à exécuter des agents sur du matériel minimal dans des environnements de confiance. OpenLegion est une alternative lorsque vous avez besoin d'isolation des identifiants, de contrôles de coûts, d'isolation d'agent et d'auditabilité — la couche de sécurité de production que la propre Issue #782 de PicoClaw identifie comme manquante.

### Comment la gestion des identifiants se compare-t-elle entre OpenLegion et PicoClaw ?

PicoClaw stocke les clés API dans des fichiers de config YAML (initialement lisibles par tous en raison d'un bug de permission 0644). Les clés se chargent dans la mémoire du processus Go au runtime. Sa propre Issue #782 liste « chiffrement des identifiants » comme manquant. OpenLegion utilise un proxy de coffre-fort — les agents appellent via un proxy qui injecte les identifiants au niveau réseau. Pas de clés sur disque, en config ou en mémoire.

### Lequel est le meilleur pour les agents IA en production ?

Le propre README de PicoClaw avertit contre le déploiement en production avant v1.0. OpenLegion est conçu pour la production avec isolation par conteneur obligatoire, identifiants protégés par proxy de coffre-fort, budgets par agent et coordination en modèle de flotte auditable. Pour l'expérimentation périphérique, PicoClaw ; pour les flottes d'agents en production, OpenLegion.

### PicoClaw peut-il fonctionner hors ligne ?

Oui. PicoLM, un modèle compagnon à 1 milliard de paramètres, permet une opération entièrement sur site. OpenLegion nécessite une connectivité LLM cloud (OpenAI, Anthropic, etc.) et ne peut pas opérer hors ligne. Si un déploiement sur site est requis, PicoClaw est l'une des très rares options.

### Quels sont les problèmes de sécurité connus de PicoClaw ?

PicoClaw a des lacunes documentées, dont : contournement d'allowlist Slack (tout utilisateur de l'espace de travail peut invoquer des agents), fichiers de configuration écrits avec permissions lisibles par tous, et protection SSRF manquante, journalisation d'audit, limitation de débit, chiffrement d'identifiants et défense contre l'injection de prompt (catalogués dans l'Issue #782). Aucune CVE formelle n'a été attribuée, mais le README avertit explicitement contre l'usage en production.

---

## Comparaisons connexes

| Texte d'ancre | Destination |
|---|---|
| OpenLegion vs nanobot | /comparison/nanobot |
| OpenLegion vs ZeroClaw | /comparison/zeroclaw |
| OpenLegion vs NanoClaw | /comparison/nanoclaw |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Comparaison des frameworks d'agents IA 2026 | /learn/ai-agent-frameworks |
| Analyse de sécurité des agents IA | /learn/ai-agent-security |
