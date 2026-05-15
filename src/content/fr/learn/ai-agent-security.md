---
title: 'Sécurité des agents IA — Menaces, isolation, coffres-forts'
description: >-
 Guide de sécurité des agents IA : fuite d'identifiants, injection de prompt,
 évasion de bac à sable, et comment l'isolation par conteneur, les identifiants
 protégés par proxy de coffre-fort et les contrôles de budget atténuent chaque
 menace.
slug: /learn/ai-agent-security
primary_keyword: sécurité des agents IA
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-platform
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-frameworks
 - /comparison
---

# Sécurité des agents IA : le modèle de menace pour les flottes d'agents en production

Chaque framework d'agents IA vous donne des outils pour construire des agents. Presque aucun ne vous donne des outils pour les contenir. Lorsqu'un agent peut appeler des API, naviguer sur le web, exécuter du code et accéder à des bases de données, la question de sécurité n'est pas de savoir si quelque chose peut mal tourner — c'est à quoi ressemble le rayon d'impact quand cela arrive.

La **sécurité des agents IA** est la pratique consistant à contraindre les agents autonomes afin qu'un agent compromis, mal configuré ou malveillant ne puisse pas faire fuiter des identifiants, exfiltrer des données, vider des budgets ou escalader des privilèges. OpenLegion traite cela comme une préoccupation architecturale fondamentale, pas un module additionnel. Chaque agent s'exécute dans un conteneur isolé avec identifiants protégés par proxy de coffre-fort, contrôles de budget par agent et une matrice d'autorisations — tous activés par défaut.

Apportez vos propres clés API LLM. Aucune majoration sur l'usage des modèles.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce que la sécurité des agents IA ?**
> La sécurité des agents IA englobe les contrôles qui empêchent les agents IA autonomes de causer du tort — que ce soit via fuite d'identifiants, injection de prompt, abus de ressources, exfiltration de données ou agence excessive. Elle inclut l'isolation runtime, la gestion des identifiants, l'application des coûts, les contrôles d'autorisation et la validation des entrées appliqués au niveau de l'infrastructure.

## En bref

- **La menace est réelle.** Les recherches montrent que 77 % des organisations avec des déploiements IA ont connu des incidents de sécurité en 2024. Seulement 5 % expriment de la confiance dans leurs mesures de sécurité IA.
- **Quatre menaces principales** : fuite d'identifiants, injection de prompt, abus de ressources (déni de portefeuille) et exfiltration de données. Chacune nécessite une atténuation différente.
- **Aucun framework majeur ne fournit de sécurité intégrée.** Selon la documentation publique, LangGraph, CrewAI, AutoGen et OpenClaw reposent tous sur les variables d'environnement pour les identifiants sans isolation native ni application des budgets.
- **Défense à six couches d'OpenLegion** : isolation par conteneur, durcissement de conteneur, séparation des identifiants (proxy de coffre-fort), application des autorisations, validation des entrées et désinfection unicode — toutes activées par défaut.
- **Les agents IA sécurisés sont possibles avec des clés BYO** — le modèle de proxy de coffre-fort signifie que vos clés restent dans la zone de confiance et que les agents interagissent via un proxy qui n'expose jamais les secrets bruts.

## Le modèle de menace pour les agents IA

### Menace 1 : Fuite d'identifiants

**Ce qui se passe.** Un agent avec accès aux clés API — via variables d'environnement, fichiers de configuration ou passage en contexte — fait fuiter ces clés via injection de prompt, journalisation, messages d'erreur ou appels d'outils malveillants.

**Quelle fréquence.** Une recherche publiée début 2026 a constaté que 283 des 3 984 compétences d'agents scannées (7,1 %) contenaient des failles critiques de gestion des identifiants, faisant passer les clés API et mots de passe via le contexte LLM en clair. Séparément, 76 compétences contenaient des charges utiles délibérément malveillantes conçues pour le vol d'identifiants. Les incidents très médiatisés incluent un employé xAI faisant fuiter une clé API sur GitHub qui a fourni l'accès à 60+ LLM privés pendant deux mois, et une vulnérabilité dans une plateforme LLM populaire qui a exposé les clés API via un point de terminaison non authentifié.

**Comment OpenLegion l'atténue.** OpenLegion utilise des identifiants protégés par proxy de coffre-fort via un proxy de coffre-fort. Les clés API sont stockées dans l'hôte de mesh (Zone 2). Lorsqu'un agent doit appeler une API externe, la requête est routée via le proxy de coffre-fort, qui injecte l'identifiant au niveau réseau. L'agent ne voit, n'enregistre ni n'a accès en mémoire à la clé brute. Même un agent totalement compromis ne peut pas extraire les identifiants car ils ne sont jamais présents dans le conteneur de l'agent.

### Menace 2 : Injection de prompt

**Ce qui se passe.** Un attaquant intègre des instructions malveillantes dans le contenu que l'agent traite — pages web, documents, e-mails, enregistrements de base de données, entrées utilisateur. L'agent suit les instructions injectées au lieu de (ou en plus de) sa tâche prévue.

**Quelle fréquence.** L'injection de prompt apparaît dans plus de 73 % des déploiements IA de production évalués lors d'audits de sécurité. OpenAI a déclaré en décembre 2025 que l'injection de prompt « ne sera probablement jamais entièrement résolue ». OWASP la classe comme la vulnérabilité n°1 pour les applications LLM. Les incidents du monde réel incluent un agent navigateur qui a été trompé pour voler des identifiants en 150 secondes via des instructions cachées sur une page web, et des systèmes RAG d'entreprise où du contenu malveillant dans des documents publics a fait fuiter des données propriétaires par les agents.

**Comment OpenLegion l'atténue.** OpenLegion applique une défense en profondeur sur plusieurs couches. La désinfection unicode supprime les caractères invisibles (overrides bidi, caractères de tag, caractères de largeur zéro) à 56 points d'étranglement avant que le contenu n'atteigne le contexte LLM — ces caractères sont couramment utilisés pour cacher des instructions injectées. La validation des entrées empêche le path traversal et applique une évaluation sûre des conditions. L'isolation par conteneur limite le rayon d'impact : même si un agent est injecté avec succès, il ne peut accéder qu'à son propre conteneur bac à sable avec ses propres autorisations délimitées. Il ne peut pas accéder aux données d'autres agents, au coffre-fort d'identifiants ou au système hôte.

Aucun système ne peut garantir une immunité complète à l'injection de prompt. L'approche d'OpenLegion est de minimiser la surface d'attaque et de contenir les dégâts.

### Menace 3 : Abus de ressources (déni de portefeuille)

**Ce qui se passe.** Un agent entre dans une boucle récursive, fait des appels API excessifs ou est manipulé pour consommer des ressources bien au-delà de ce qui est nécessaire. Dans les systèmes multi-agents, cela se compose — un workflow à 5 agents coûte 5 fois ce que coûte un seul agent, et une boucle incontrôlée peut brûler des centaines de dollars en minutes avant que quiconque ne le remarque.

**Quelle fréquence.** Ceci est listé comme OWASP LLM10:2025 (consommation non bornée). La plupart des systèmes de facturation cloud n'arrêtent pas automatiquement les frais lorsque les budgets sont dépassés — les alertes se déclenchent, mais le compteur continue. Les rapports communautaires de CrewAI et LangGraph décrivent des boucles de combustion de jetons qui ont consommé 10 fois les budgets attendus.

**Comment OpenLegion l'atténue.** Contrôles de budget par agent quotidiens et mensuels avec coupure stricte. Chaque agent de la flotte a son propre budget en jetons suivi en temps réel. Lorsque la limite est atteinte, la [couche d'orchestration](/learn/ai-agent-orchestration) arrête cet agent spécifique. Le reste du workflow continue ou se met en pause gracieusement. Il n'y a pas d'« avertissement doux » qui se fait ignorer — la coupure est appliquée au niveau de l'infrastructure.

### Menace 4 : Exfiltration de données

**Ce qui se passe.** Un agent est manipulé pour envoyer des données sensibles vers un point de terminaison contrôlé par l'attaquant. Les techniques incluent : instruire l'agent à encoder les données dans des paramètres URL (qui sont journalisées ou envoyées via des aperçus de lien), utiliser le navigateur de l'agent pour visiter des pages contrôlées par l'attaquant ou exploiter les appels d'outils pour transmettre des données à des API externes.

**Quelle fréquence.** Des techniques d'exfiltration zero-click ont été démontrées contre des agents opérant sur des plateformes de messagerie (où les aperçus de lien récupèrent automatiquement les URL), des outils de collaboration d'entreprise et des dépôts de code. La recherche sur les agents bancaires a montré environ 20 % de taux de succès pour les attaques d'exfiltration de données.

**Comment OpenLegion l'atténue.** L'isolation réseau au niveau conteneur restreint quels points de terminaison externes chaque agent peut atteindre. La matrice d'autorisations définit les outils, fichiers et opérations mesh autorisés par agent. Les requêtes sortantes sont routées via des canaux contrôlés. Combiné à l'isolation des identifiants (l'agent n'a aucun identifiant à exfiltrer) et à la coordination en modèle de flotte (qui journalise chaque action), la surface d'attaque pour l'exfiltration est significativement réduite par rapport aux agents s'exécutant dans des espaces de processus partagés avec un accès réseau non restreint.

### Menace 5 : Évasion de bac à sable

**Ce qui se passe.** Un agent ou son code exécuté s'évade de son conteneur et obtient l'accès au système hôte, à d'autres conteneurs ou à la couche d'orchestration. Des vulnérabilités d'évasion de conteneur sont découvertes régulièrement — plusieurs CVE runC de haute gravité ont été divulguées en novembre 2025 affectant Docker et Kubernetes chez les principaux fournisseurs cloud.

**Comment OpenLegion l'atténue.** Durcissement de conteneur : exécution non-root (UID 1000), flag `no-new-privileges`, limites de mémoire configurables (384 Mo par défaut), limites de CPU configurables (0,15 par défaut) et aucun système de fichiers partagé entre conteneurs. Chaque agent a son propre volume `/data`. Le modèle de confiance à quatre zones (plus un niveau opérateur ou interne) signifie que même si un agent s'évade de son conteneur, il atterrit dans une zone sans accès direct au coffre-fort d'identifiants ou aux conteneurs d'autres agents. Pour les environnements nécessitant une isolation plus forte, l'architecture supporte les microVM Docker Sandbox.

### Menace 6 : Attaques de chaîne d'approvisionnement

**Ce qui se passe.** Du code malveillant est introduit via des compétences d'agents, des serveurs d'outils MCP, des configurations partagées ou des dépendances de framework. Des serveurs MCP malveillants ont été trouvés sur npm imitant des services légitimes. Des fichiers de configuration crowdsourcés ont été weaponisés avec des prompts cachés déclenchés par LLM.

**Comment OpenLegion l'atténue.** OpenLegion utilise zéro dépendance de framework externe — pas de LangChain, pas de Redis, pas de Kubernetes. Le cœur est Python pur + SQLite. Les serveurs d'outils MCP sont supportés mais mis en bac à sable via la matrice d'autorisations. La coordination en modèle de flotte signifie que les appels d'outils sont explicitement déclarés dans la définition du workflow, pas découverts dynamiquement au runtime — réduisant la surface pour l'injection d'outils inattendus.

## Comment fonctionne l'isolation des agents IA dans OpenLegion

Le modèle de confiance à quatre zones d'OpenLegion plus un niveau opérateur ou interne sépare chaque déploiement en frontières de sécurité distinctes :

**Zone 0 — Entrée externe non fiable.** Tout ce qui arrive des utilisateurs ou de tiers : CLI, Telegram, Discord, Slack, WhatsApp et points de terminaison webhook. Les entrées sont validées et désinfectées via des gardes anti-injection de prompt avant d'entrer en Zone 2.

**Zone 1 — Conteneurs d'agents bac à sable (non fiables).** Chaque agent s'exécute comme une instance FastAPI isolée dans son propre conteneur Docker. Chaque conteneur a son propre volume `/data`, sa propre base de données mémoire (SQLite + recherche vectorielle), des plafonds de ressources configurables (384 Mo RAM / 0,15 CPU par défaut), exécution non-root (UID 1000), `cap_drop=ALL`, `no-new-privileges`, un système de fichiers racine en lecture seule, et aucun accès au socket Docker, au coffre-fort d'identifiants ou aux conteneurs d'autres agents.

**Zone 2 — Hôte de mesh (fiable).** Le seul composant ayant accès aux identifiants. Exécute le tableau noir (état partagé + WAL), le routeur PubSub, le coffre-fort d'identifiants (proxy d'injection aveugle), la matrice ACL, le gestionnaire de conteneurs, le suivi des coûts et le service de navigateur (Camoufox par agent sur :8500). Cette zone est durcie et non exposée au code d'agent.

**Zone 2.5 — Opérateur ou interne.** Opérations de plan de contrôle réservées disponibles pour l'agent opérateur ou l'outillage interne du mesh — gestion de flotte, modifications d'agents, octrois d'autorisations (l'opérateur ne peut pas accorder `can_spawn` ou `can_use_wallet`).

**Zone 3 — Loopback uniquement, interne.** Le niveau le plus restreint : points de terminaison qui requièrent à la fois un en-tête `x-mesh-internal: 1` et une IP source loopback. Utilisé uniquement pour les appels de coordination interne au mesh.

Cette architecture signifie qu'un agent compromis en Zone 1 ne peut pas atteindre la Zone 2 (identifiants) ou d'autres conteneurs Zone 1 (données d'autres agents). Le rayon d'impact de tout compromis d'un seul agent est contenu dans le bac à sable de cet agent.

## Gestion des identifiants d'agents IA : proxy de coffre-fort vs variables d'environnement

Le patron de gestion des identifiants le plus courant dans les [frameworks d'agents IA](/learn/ai-agent-frameworks) est les variables d'environnement. Votre clé API se trouve dans un fichier `.env` ou est passée via `OAI_CONFIG_LIST`. Le processus de l'agent la lit directement. Cela signifie :

- La clé existe dans l'espace mémoire de l'agent
- Une attaque par injection de prompt peut instruire l'agent à imprimer ou exfiltrer la clé
- Les journaux, messages d'erreur et sorties de débogage peuvent contenir la clé
- Si l'agent est compromis, l'attaquant a un accès direct à tous les identifiants injectés

Le proxy de coffre-fort d'OpenLegion change cette architecture fondamentalement. Les clés API sont stockées dans le coffre-fort d'identifiants de l'hôte de mesh (Zone 2). Lorsqu'un agent doit faire un appel API authentifié, il envoie la requête au proxy de coffre-fort. Le proxy injecte l'identifiant au niveau réseau, effectue l'appel authentifié et renvoie le résultat à l'agent. L'agent ne voit, ne stocke ni n'a accès en mémoire à la clé brute.

C'est ce qu'on appelle les **identifiants protégés par proxy de coffre-fort** — le même principe utilisé par les systèmes de gestion des secrets d'entreprise comme HashiCorp Vault, mais intégré dans la couche d'[orchestration d'agents IA](/learn/ai-agent-orchestration) plutôt que de nécessiter une infrastructure séparée.

## Agents IA conteneurisés : pourquoi l'isolation au niveau processus ne suffit pas

Plusieurs frameworks offrent une forme d'isolation, mais les détails de mise en œuvre comptent :

| Framework | Approche d'isolation | Ce qui est réellement isolé | Ce qui est partagé |
|---|---|---|---|
| **OpenLegion** | Conteneur Docker par agent (obligatoire) | Processus, système de fichiers, réseau, mémoire, identifiants | Rien — les agents sont totalement isolés |
| **OpenClaw** | Conteneur Docker (optionnel) | Processus, système de fichiers | Socket Docker monté par défaut ; réseau hôte accessible |
| **LangGraph** | Aucune intégrée | N/A | Tout — les agents partagent le processus Python |
| **CrewAI** | Docker pour CodeInterpreter | Sortie d'exécution de code | Les processus d'agents partagent le runtime Python |
| **AutoGen** | Docker pour exécution de code | Sortie d'exécution de code | Les processus d'agents partagent le runtime Python |

La distinction critique : OpenLegion isole **l'agent lui-même** dans un conteneur. D'autres frameworks qui offrent l'isolation Docker n'isolent typiquement que **la sortie d'exécution de code** — le processus de l'agent, sa mémoire et son accès aux identifiants restent partagés. Cela signifie qu'une injection de prompt qui compromet un agent dans LangGraph ou CrewAI a accès à tous les identifiants et états dans le processus partagé. Dans OpenLegion, le même compromis est contenu à un seul conteneur bac à sable sans accès aux identifiants.

## Contrôles de coûts d'agents IA : l'application des budgets comme sécurité

Les contrôles de coûts ne sont pas juste de la gouvernance financière — ce sont un mécanisme de sécurité. Un agent incontrôlé consommant des jetons illimités est une attaque d'abus de ressources, qu'elle soit déclenchée par une injection de prompt malveillante ou un simple bug dans la boucle de raisonnement de l'agent.

L'application des budgets d'OpenLegion fonctionne au niveau de l'orchestrateur :

- Chaque agent a un budget de jetons quotidien et mensuel configurable
- L'usage des jetons est suivi en temps réel par le suivi des coûts en Zone 2
- Lorsqu'un agent atteint sa limite, l'orchestrateur émet une coupure stricte — l'agent est arrêté
- Le reste du pipeline de workflow continue ou se met en pause gracieusement
- Les données de coût sont visibles dans le tableau de bord de la flotte avec des décompositions par agent

Aucun autre framework majeur d'agents IA ne fournit cette capacité intégrée, selon la documentation publique au moment de la rédaction.

## Considérations de conformité et d'audit

OpenLegion est **conçu pour les environnements qui nécessitent** des contrôles de conformité, notamment :

- **Traçage des requêtes** : la coordination en modèle de flotte auditable signifie que chaque étape du workflow est explicite et traçable. Le système de traçage des requêtes intégré enregistre les transitions de tâches, les appels d'outils et la dépense en jetons pour une observabilité en temps réel. Le tableau noir (état partagé) fournit un contexte de coordination entre agents.
- **Coordination en modèle de flotte auditable** : la coordination en modèle de flotte (tableau noir + pub/sub + handoff) peut être auditée avant exécution — vous pouvez vérifier le flux complet de données, autorisations et interactions d'agents sans exécuter le système.
- **Isolation des données** : les conteneurs par agent avec volumes `/data` dédiés garantissent que les données sensibles traitées par un agent ne sont pas accessibles aux autres agents.
- **Support air-gap** : aucun service externe (pas de Redis, pas de Kubernetes, pas de services cloud requis) signifie qu'OpenLegion peut s'exécuter dans des environnements on-prem.

**Important** : OpenLegion ne détient actuellement pas SOC 2, ISO 27001, HIPAA ou autres certifications de conformité. L'architecture est conçue pour supporter les environnements avec ces exigences, mais la certification est une fonction de votre déploiement, configuration et contrôles organisationnels — pas seulement du framework.

## CTA

**Déployez des agents sécurisés par défaut.**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Que signifie la sécurité des agents IA ?

La sécurité des agents IA est l'ensemble des contrôles qui empêchent les agents IA autonomes de causer du tort via fuite d'identifiants, injection de prompt, abus de ressources, exfiltration de données, évasion de bac à sable ou agence excessive. Elle s'étend sur l'isolation runtime (mise en bac à sable des agents), la gestion des identifiants (prévention de l'exposition des clés), l'application des coûts (arrêter les dépenses incontrôlées), les contrôles d'autorisation (limiter ce que les agents peuvent faire) et la validation des entrées (filtrer les entrées malveillantes).

### Comment sécuriser les agents IA avec des clés API ?

L'approche la plus sécurisée est les identifiants protégés par proxy de coffre-fort : stockez les clés API dans un coffre-fort que les agents ne peuvent pas atteindre directement. Lorsqu'un agent doit faire un appel authentifié, la requête est routée via un proxy qui injecte l'identifiant au niveau réseau. L'agent ne voit jamais la clé brute. OpenLegion implémente cela via son proxy de coffre-fort en Zone 2 du modèle de confiance à quatre zones (plus un niveau opérateur ou interne). L'approche la moins sécurisée (et la plus courante) est les variables d'environnement, où les clés existent dans la mémoire de l'agent et peuvent être divulguées via injection de prompt, journalisation ou sortie d'erreur.

### Comment fonctionne l'isolation des agents IA ?

L'isolation des agents signifie exécuter chaque agent dans son propre environnement bac à sable — processus, système de fichiers, espace de noms réseau et espace mémoire séparés. Dans OpenLegion, chaque agent s'exécute dans un conteneur Docker dédié avec des limites de ressources configurables (384 Mo RAM, 0,15 CPU par défaut), exécution non-root et aucun système de fichiers partagé. Cela signifie qu'un agent compromis ne peut pas accéder aux données d'autres agents, au coffre-fort d'identifiants ou au système hôte. Cela diffère des frameworks où les agents partagent un processus Python et peuvent accéder à la mémoire des autres.

### Pourquoi les agents IA ont-ils besoin de contrôles de budget / coûts ?

Les agents autonomes peuvent entrer dans des boucles récursives, faire des appels API excessifs ou être manipulés pour consommer des ressources bien au-delà de ce qui est nécessaire. Sans contrôles de budget, un seul agent incontrôlé peut drainer des centaines de dollars en jetons en minutes. Dans les systèmes multi-agents, cela se compose — chaque agent multiplie le risque. OpenLegion applique des budgets quotidiens et mensuels par agent avec coupures strictes au niveau de l'orchestrateur, empêchant tout agent unique de causer un coût non borné.

### Les agents IA sécurisés sont-ils possibles avec des clés BYO ?

Oui. Le modèle de clé BYO (Bring Your Own) est en fait plus sécurisé avec une architecture appropriée. Dans OpenLegion, vos clés sont stockées dans le coffre-fort d'identifiants de l'hôte de mesh et injectées via un proxy de coffre-fort au niveau réseau. Les agents ne voient jamais les clés brutes. Cela vous donne une transparence totale des coûts (vous voyez exactement ce que chaque agent dépense avec chaque fournisseur), une flexibilité de fournisseur (échangez les modèles par agent) et les mêmes garanties d'isolation des identifiants quel que soit le fournisseur que vous utilisez. Apportez vos propres clés API LLM. Aucune majoration sur l'usage des modèles.

### Qu'est-ce que le Top 10 OWASP pour les agents IA ?

OWASP a publié le Top 10 pour les applications agentiques en décembre 2025. Le risque n°1 est le détournement d'objectif d'agent — où un attaquant manipule un agent pour poursuivre des objectifs différents de ce que l'utilisateur a prévu. Les autres risques majeurs incluent la fuite d'identifiants, l'agence excessive (les agents prenant des actions au-delà de leur portée) et les vulnérabilités de la chaîne d'approvisionnement (outils ou plugins malveillants). OpenLegion répond à ces enjeux via les identifiants protégés par proxy de coffre-fort, l'isolation par conteneur, les matrices d'autorisations et la coordination en modèle de flotte (tableau noir + pub/sub + handoff).

### Comment OpenLegion se compare-t-il à OpenClaw en matière de sécurité ?

Selon la documentation publique, OpenLegion fournit des défauts de sécurité plus stricts. Le déploiement local par défaut d'OpenClaw nécessite le montage du socket Docker (accordant un large accès hôte), son analyseur de sécurité a eu des problèmes signalés d'activation cohérente, et il stocke les identifiants dans une configuration accessible au processus de l'agent. OpenLegion exécute les agents dans des conteneurs isolés obligatoires, utilise un proxy de coffre-fort pour les identifiants protégés par proxy de coffre-fort, applique des budgets par agent et applique une désinfection unicode à plusieurs points d'étranglement. Pour une comparaison détaillée, consultez [OpenLegion vs OpenClaw](/comparison/openclaw).

### Quels frameworks de conformité s'appliquent aux agents IA ?

Les frameworks clés incluent OWASP Top 10 pour les applications LLM (2025) et les applications agentiques (2026), NIST AI Risk Management Framework (avec les standards à venir pour les agents IA), ISO/IEC 42001 (systèmes de management de l'IA), l'AI Act de l'UE (application commençant en août 2026) et les réglementations sectorielles comme HIPAA, SOC 2 et SOX selon votre domaine. L'architecture d'OpenLegion est conçue pour les environnements qui nécessitent ces contrôles mais ne détient pas elle-même de certifications.

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
