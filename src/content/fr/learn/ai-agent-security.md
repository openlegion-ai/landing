---
title: 'Sécurité des agents IA — Menaces, isolation, coffres-forts'
description: >-
 Guide de sécurité des agents IA : fuite d'identifiants, injection de prompt,
 évasion de bac à sable, et comment l'isolation des exécutions, les identifiants
 conservés en coffre-fort et les contrôles de budget atténuent chaque
 menace.
slug: /learn/ai-agent-security
primary_keyword: sécurité des agents IA
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2026-03
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

La **sécurité des agents IA** est la pratique consistant à contraindre les agents autonomes afin qu'un agent compromis, mal configuré ou malveillant ne puisse pas faire fuiter des identifiants, exfiltrer des données, vider des budgets ou escalader des privilèges. OpenLegion traite cela comme une préoccupation architecturale fondamentale, pas un module additionnel. Chaque action est une intention vérifiée par un moteur de politiques unique avant qu'elle n'ait lieu, les identifiants vivent dans un coffre-fort hors du modèle, et chaque agent porte son propre budget — tous activés par défaut.

Les modèles sont choisis par préréglage — Smartest, Smart ou Normal — par agent ou par espace de travail.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce que la sécurité des agents IA ?**
> La sécurité des agents IA englobe les contrôles qui empêchent les agents IA autonomes de causer du tort — que ce soit via fuite d'identifiants, injection de prompt, abus de ressources, exfiltration de données ou agence excessive. Elle inclut l'isolation runtime, la gestion des identifiants, l'application des coûts, les contrôles d'autorisation et la validation des entrées appliqués au niveau de l'infrastructure.

## En bref

- **La menace est réelle.** Les recherches montrent que 77 % des organisations avec des déploiements IA ont connu des incidents de sécurité en 2024. Seulement 5 % expriment de la confiance dans leurs mesures de sécurité IA.
- **Quatre menaces principales** : fuite d'identifiants, injection de prompt, abus de ressources (déni de portefeuille) et exfiltration de données. Chacune nécessite une atténuation différente.
- **Aucun framework majeur ne fournit de sécurité intégrée.** Selon la documentation publique, LangGraph, CrewAI, AutoGen et OpenClaw reposent tous sur les variables d'environnement pour les identifiants sans isolation native ni application des budgets.
- **Défense en couches d'OpenLegion** : un moteur de politiques unique devant chaque action, des exécutions de tâches en bac à sable, la séparation des identifiants (un coffre-fort hors du modèle), l'application des autorisations, la validation des entrées et la désinfection unicode — toutes activées par défaut.
- **Vos propres identifiants de services restent en sécurité** — ils vivent dans un coffre-fort et sont injectés hors du modèle, qui ne détient jamais qu'une référence et ne voit jamais de secret brut.

## Le modèle de menace pour les agents IA

### Menace 1 : Fuite d'identifiants

**Ce qui se passe.** Un agent avec accès aux clés API — via variables d'environnement, fichiers de configuration ou passage en contexte — fait fuiter ces clés via injection de prompt, journalisation, messages d'erreur ou appels d'outils malveillants.

**Quelle fréquence.** Une recherche publiée début 2026 a constaté que 283 des 3 984 compétences d'agents scannées (7,1 %) contenaient des failles critiques de gestion des identifiants, faisant passer les clés API et mots de passe via le contexte LLM en clair. Séparément, 76 compétences contenaient des charges utiles délibérément malveillantes conçues pour le vol d'identifiants. Les incidents très médiatisés incluent un employé xAI faisant fuiter une clé API sur GitHub qui a fourni l'accès à 60+ LLM privés pendant deux mois, et une vulnérabilité dans une plateforme LLM populaire qui a exposé les clés API via un point de terminaison non authentifié.

**Comment OpenLegion l'atténue.** Les identifiants vivent dans un coffre-fort et sont injectés hors du modèle, qui ne détient jamais qu'une référence. Lorsqu'un agent doit appeler une API externe, la plateforme injecte l'identifiant à la frontière de l'appel. L'agent ne voit, n'enregistre ni n'a accès en mémoire à la clé brute. Même un agent totalement compromis ne peut pas extraire les identifiants car ils ne sont jamais présents dans son exécution.

### Menace 2 : Injection de prompt

**Ce qui se passe.** Un attaquant intègre des instructions malveillantes dans le contenu que l'agent traite — pages web, documents, e-mails, enregistrements de base de données, entrées utilisateur. L'agent suit les instructions injectées au lieu de (ou en plus de) sa tâche prévue.

**Quelle fréquence.** L'injection de prompt apparaît dans plus de 73 % des déploiements IA de production évalués lors d'audits de sécurité. OpenAI a déclaré en décembre 2025 que l'injection de prompt « ne sera probablement jamais entièrement résolue ». OWASP la classe comme la vulnérabilité n°1 pour les applications LLM. Les incidents du monde réel incluent un agent navigateur qui a été trompé pour voler des identifiants en 150 secondes via des instructions cachées sur une page web, et des systèmes RAG d'entreprise où du contenu malveillant dans des documents publics a fait fuiter des données propriétaires par les agents.

**Comment OpenLegion l'atténue.** OpenLegion applique une défense en profondeur sur plusieurs couches. La désinfection unicode supprime les caractères invisibles (overrides bidi, caractères de tag, caractères de largeur zéro) avant que le contenu n'atteigne le contexte LLM — ces caractères sont couramment utilisés pour cacher des instructions injectées. La validation des entrées empêche le path traversal et applique une évaluation sûre des conditions. Agir sur du contenu non fiable est l'une des trois barrières où le travail s'arrête pour l'approbation du propriétaire, ce qui limite le rayon d'impact : un agent injecté ne peut agir que dans ses propres autorisations délimitées. Il ne peut atteindre ni les données d'autres agents, ni le coffre-fort d'identifiants, ni le système hôte.

Aucun système ne peut garantir une immunité complète à l'injection de prompt. L'approche d'OpenLegion est de minimiser la surface d'attaque et de contenir les dégâts.

### Menace 3 : Abus de ressources (déni de portefeuille)

**Ce qui se passe.** Un agent entre dans une boucle récursive, fait des appels API excessifs ou est manipulé pour consommer des ressources bien au-delà de ce qui est nécessaire. Dans les systèmes multi-agents, cela se compose — un workflow à 5 agents coûte 5 fois ce que coûte un seul agent, et une boucle incontrôlée peut brûler des centaines de dollars en minutes avant que quiconque ne le remarque.

**Quelle fréquence.** Ceci est listé comme OWASP LLM10:2025 (consommation non bornée). La plupart des systèmes de facturation cloud n'arrêtent pas automatiquement les frais lorsque les budgets sont dépassés — les alertes se déclenchent, mais le compteur continue. Les rapports communautaires de CrewAI et LangGraph décrivent des boucles de combustion de jetons qui ont consommé 10 fois les budgets attendus.

**Comment OpenLegion l'atténue.** Budgets par agent avec coupure stricte. Chaque agent de l'équipe a son propre budget, et chaque unité de travail est un réveil enregistré mesuré en crédits à $0,001 l'unité. Lorsque la limite est atteinte, la [couche d'orchestration](/learn/ai-agent-orchestration) arrête cet agent spécifique. Le reste du workflow continue ou se met en pause gracieusement. Il n'y a pas d'« avertissement doux » qui se fait ignorer — la coupure est appliquée au niveau de la plateforme.

### Menace 4 : Exfiltration de données

**Ce qui se passe.** Un agent est manipulé pour envoyer des données sensibles vers un point de terminaison contrôlé par l'attaquant. Les techniques incluent : instruire l'agent à encoder les données dans des paramètres URL (qui sont journalisées ou envoyées via des aperçus de lien), utiliser le navigateur de l'agent pour visiter des pages contrôlées par l'attaquant ou exploiter les appels d'outils pour transmettre des données à des API externes.

**Quelle fréquence.** Des techniques d'exfiltration zero-click ont été démontrées contre des agents opérant sur des plateformes de messagerie (où les aperçus de lien récupèrent automatiquement les URL), des outils de collaboration d'entreprise et des dépôts de code. La recherche sur les agents bancaires a montré environ 20 % de taux de succès pour les attaques d'exfiltration de données.

**Comment OpenLegion l'atténue.** Le code que l'agent écrit tourne dans un bac à sable sans accès réseau par défaut, et joindre un tiers en votre nom s'arrête pour l'approbation du propriétaire. La matrice d'autorisations définit les outils, fichiers et opérations autorisés par agent. Les requêtes sortantes sont routées via des canaux contrôlés. Combiné à l'isolation des identifiants (l'agent n'a aucun identifiant à exfiltrer) et aux reçus qui enregistrent chaque action, la surface d'attaque pour l'exfiltration est significativement réduite par rapport aux agents s'exécutant dans des espaces de processus partagés avec un accès réseau non restreint.

### Menace 5 : Évasion de bac à sable

**Ce qui se passe.** Un agent ou son code exécuté s'évade de son conteneur et obtient l'accès au système hôte, à d'autres conteneurs ou à la couche d'orchestration. Des vulnérabilités d'évasion de conteneur sont découvertes régulièrement — plusieurs CVE runC de haute gravité ont été divulguées en novembre 2025 affectant Docker et Kubernetes chez les principaux fournisseurs cloud.

**Comment OpenLegion l'atténue.** Le code que l'agent écrit tourne dans un bac à sable sans accès réseau par défaut, et chaque tâche s'exécute à la demande puis s'arrête — il n'y a aucun processus d'agent durable à compromettre. Chaque agent a son propre stockage, jamais un stockage partagé. Un moteur de politiques unique devant chaque action signifie que même si une exécution était détournée, elle n'aurait aucun chemin direct vers le coffre-fort d'identifiants ou les données d'un autre agent. Les identifiants sont injectés hors du modèle : une exécution détournée n'a donc rien à voler.

### Menace 6 : Attaques de chaîne d'approvisionnement

**Ce qui se passe.** Du code malveillant est introduit via des compétences d'agents, des serveurs d'outils MCP, des configurations partagées ou des dépendances de framework. Des serveurs MCP malveillants ont été trouvés sur npm imitant des services légitimes. Des fichiers de configuration crowdsourcés ont été weaponisés avec des prompts cachés déclenchés par LLM.

**Comment OpenLegion l'atténue.** Chaque outil qu'un agent peut atteindre est accordé explicitement par un propriétaire, pas découvert au runtime, et il n'y a aucune surface de plugins tiers au lancement. Les octrois d'outils sont vérifiés par le moteur de politiques à chaque appel, et chaque octroi est enregistré comme un reçu que le propriétaire peut lire. La coordination par objectifs et tâches signifie que les appels d'outils sont explicites dans la définition de la tâche, pas résolus dynamiquement — réduisant la surface pour l'injection d'outils inattendus.

## Comment fonctionne l'isolation des agents IA dans OpenLegion

OpenLegion place un moteur de politiques unique devant chaque action et sépare un espace de travail en frontières de sécurité distinctes :

**Entrée non fiable.** Tout ce qui arrive des utilisateurs ou de tiers : chat web, Telegram, Slack, e-mail entrant et points de terminaison webhook. Les entrées sont validées et désinfectées via des gardes anti-injection de prompt, et agir sur du contenu non fiable s'arrête pour l'approbation du propriétaire.

**L'exécution de l'agent.** Chaque tâche s'exécute à la demande puis s'arrête. Le code que l'agent écrit tourne dans un bac à sable sans accès réseau par défaut, et l'exécution ne détient aucun identifiant — seulement une référence. Les agents sont des enregistrements durables, pas des serveurs : il n'y a aucun processus durable à compromettre, en créer un est instantané, un agent inactif ne coûte rien, et un espace de travail peut en faire tourner des centaines.

**Le moteur de politiques.** Chaque action est une intention vérifiée avant qu'elle n'ait lieu : appel d'outil, délégation, approbation, coût. C'est le seul composant ayant accès au coffre-fort, il injecte les identifiants hors du modèle et enregistre chaque action comme un reçu que le propriétaire peut lire.

**Décisions du propriétaire et de l'administrateur.** Le travail s'arrête pour une approbation à trois barrières seulement : joindre un tiers en votre nom, supprimer des données et agir sur du contenu non fiable. Les approbations sont décidées dans l'application par un propriétaire ou un administrateur, jamais par l'agent lui-même.

**Isolation de l'espace de travail.** Les agents, tâches, mémoires et reçus d'un espace de travail lui sont délimités, et les octrois d'autorisations par agent les restreignent encore. Rien de ce qu'un agent fait ne dépasse les octrois que son propriétaire lui a donnés.

Cette architecture signifie qu'un agent compromis ne peut atteindre ni le coffre-fort ni les données d'un autre agent. Le rayon d'impact de tout compromis d'un seul agent est contenu dans l'exécution de cet agent et dans ses propres octrois.

## Gestion des identifiants d'agents IA : coffre-fort d'identifiants vs variables d'environnement

Le patron de gestion des identifiants le plus courant dans les [frameworks d'agents IA](/learn/ai-agent-frameworks) est les variables d'environnement. Votre clé API se trouve dans un fichier `.env` ou est passée via `OAI_CONFIG_LIST`. Le processus de l'agent la lit directement. Cela signifie :

- La clé existe dans l'espace mémoire de l'agent
- Une attaque par injection de prompt peut instruire l'agent à imprimer ou exfiltrer la clé
- Les journaux, messages d'erreur et sorties de débogage peuvent contenir la clé
- Si l'agent est compromis, l'attaquant a un accès direct à tous les identifiants injectés

Le coffre-fort d'identifiants d'OpenLegion change cette architecture fondamentalement. Les clés API sont stockées dans le coffre-fort, hors du modèle. Lorsqu'un agent doit faire un appel API authentifié, la plateforme injecte l'identifiant à la frontière de l'appel, effectue l'appel authentifié et renvoie le résultat à l'agent. Le modèle ne détient jamais qu'une référence et ne voit, ne stocke ni n'a accès en mémoire à la clé brute.

C'est ce qu'on appelle les **identifiants conservés en coffre-fort** — le même principe utilisé par les systèmes de gestion des secrets d'entreprise comme HashiCorp Vault, mais intégré dans la couche d'[orchestration d'agents IA](/learn/ai-agent-orchestration) plutôt que de nécessiter une infrastructure séparée.

## Agents IA conteneurisés : pourquoi l'isolation au niveau processus ne suffit pas

Plusieurs frameworks offrent une forme d'isolation, mais les détails de mise en œuvre comptent :

| Framework | Approche d'isolation | Ce qui est réellement isolé | Ce qui est partagé |
|---|---|---|---|
| **OpenLegion** | Exécution en bac à sable par tâche (toujours active) | Processus, système de fichiers, réseau, mémoire, identifiants | Rien — les agents sont totalement isolés |
| **OpenClaw** | Conteneur Docker (optionnel) | Processus, système de fichiers | Socket Docker monté par défaut ; réseau hôte accessible |
| **LangGraph** | Aucune intégrée | N/A | Tout — les agents partagent le processus Python |
| **CrewAI** | Docker pour CodeInterpreter | Sortie d'exécution de code | Les processus d'agents partagent le runtime Python |
| **AutoGen** | Docker pour exécution de code | Sortie d'exécution de code | Les processus d'agents partagent le runtime Python |

La distinction critique : OpenLegion isole **l'exécution de la tâche elle-même**. D'autres frameworks qui offrent l'isolation Docker n'isolent typiquement que **la sortie d'exécution de code** — le processus de l'agent, sa mémoire et son accès aux identifiants restent partagés. Cela signifie qu'une injection de prompt qui compromet un agent dans LangGraph ou CrewAI a accès à tous les identifiants et états dans le processus partagé. Dans OpenLegion, le même compromis est contenu à une seule exécution en bac à sable sans accès aux identifiants.

## Contrôles de coûts d'agents IA : l'application des budgets comme sécurité

Les contrôles de coûts ne sont pas juste de la gouvernance financière — ce sont un mécanisme de sécurité. Un agent incontrôlé consommant des jetons illimités est une attaque d'abus de ressources, qu'elle soit déclenchée par une injection de prompt malveillante ou un simple bug dans la boucle de raisonnement de l'agent.

L'application des budgets d'OpenLegion fonctionne au niveau de l'orchestrateur :

- Chaque agent a son propre budget configurable, mesuré en crédits à $0,001 l'unité
- L'usage est suivi en temps réel, et le coût exact de chaque tâche est visible
- Lorsqu'un agent atteint sa limite, l'orchestrateur émet une coupure stricte — l'agent est arrêté
- Le reste du pipeline de workflow continue ou se met en pause gracieusement
- Les données de coût sont visibles dans le tableau de bord avec des décompositions par agent

Aucun autre framework majeur d'agents IA ne fournit cette capacité intégrée, selon la documentation publique au moment de la rédaction.

## Considérations de conformité et d'audit

OpenLegion est **conçu pour les environnements qui nécessitent** des contrôles de conformité, notamment :

- **Traçage des requêtes** : la coordination auditable par objectifs et tâches signifie que chaque étape du workflow est explicite et traçable. Chaque appel d'outil, délégation et approbation est enregistré avec l'identité de l'agent, un horodatage et le coût exact de la tâche. Le registre partagé d'objectifs et de tâches fournit un contexte de coordination entre agents.
- **Coordination auditable par objectifs et tâches** : la coordination par objectifs et tâches (objectifs → tâches → agents) peut être auditée avant exécution — vous pouvez vérifier le flux complet de données, autorisations et interactions d'agents sans exécuter le système.
- **Isolation des données** : le stockage par agent et les octrois d'autorisations par agent garantissent que les données sensibles traitées par un agent ne sont pas accessibles aux autres agents.
- **Moindre privilège** : les outils, fichiers et opérations de chaque agent sont accordés explicitement par un propriétaire, et chaque octroi est enregistré comme un reçu.

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

L'approche la plus sécurisée est les identifiants conservés en coffre-fort : stockez les clés API dans un coffre-fort que les agents ne peuvent pas atteindre directement. Lorsqu'un agent doit faire un appel authentifié, la plateforme injecte l'identifiant hors du modèle. L'agent ne voit jamais la clé brute. OpenLegion implémente cela avec un coffre-fort d'identifiants que le modèle ne peut référencer que par une référence. L'approche la moins sécurisée (et la plus courante) est les variables d'environnement, où les clés existent dans la mémoire de l'agent et peuvent être divulguées via injection de prompt, journalisation ou sortie d'erreur.

### Comment fonctionne l'isolation des agents IA ?

L'isolation des agents signifie exécuter chaque agent dans son propre environnement bac à sable — processus, système de fichiers, espace de noms réseau et espace mémoire séparés. Dans OpenLegion, chaque tâche s'exécute à la demande puis s'arrête, le code que l'agent écrit tourne dans un bac à sable sans accès réseau par défaut, et les agents ne partagent aucun stockage. Cela signifie qu'un agent compromis ne peut pas accéder aux données d'autres agents, au coffre-fort d'identifiants ou au système hôte. Cela diffère des frameworks où les agents partagent un processus Python et peuvent accéder à la mémoire des autres.

### Pourquoi les agents IA ont-ils besoin de contrôles de budget / coûts ?

Les agents autonomes peuvent entrer dans des boucles récursives, faire des appels API excessifs ou être manipulés pour consommer des ressources bien au-delà de ce qui est nécessaire. Sans contrôles de budget, un seul agent incontrôlé peut drainer des centaines de dollars en jetons en minutes. Dans les systèmes multi-agents, cela se compose — chaque agent multiplie le risque. OpenLegion donne à chaque agent son propre budget avec coupure stricte, mesuré en crédits à $0,001 l'unité, empêchant tout agent unique de causer un coût non borné.

### Les agents IA sécurisés sont-ils possibles avec des clés BYO ?

OpenLegion n'utilise pas de modèle de clé BYO (Bring Your Own) pour les LLM — les modèles sont choisis par préréglage, Smartest, Smart ou Normal, par agent ou par espace de travail. Les identifiants de services que vous apportez, comme les jetons OAuth et les clés API tierces, sont conservés dans un coffre-fort et injectés hors du modèle, qui ne détient jamais qu'une référence. Vous conservez une transparence totale des coûts : chaque unité de travail est un réveil enregistré mesuré en crédits à $0,001 l'unité, et le coût exact de chaque tâche est visible.

### Qu'est-ce que le Top 10 OWASP pour les agents IA ?

OWASP a publié le Top 10 pour les applications agentiques en décembre 2025. Le risque n°1 est le détournement d'objectif d'agent — où un attaquant manipule un agent pour poursuivre des objectifs différents de ce que l'utilisateur a prévu. Les autres risques majeurs incluent la fuite d'identifiants, l'agence excessive (les agents prenant des actions au-delà de leur portée) et les vulnérabilités de la chaîne d'approvisionnement (outils ou plugins malveillants). OpenLegion répond à ces enjeux via les identifiants conservés en coffre-fort, les exécutions de tâches en bac à sable, les matrices d'autorisations et la coordination par objectifs et tâches (objectifs → tâches → agents).

### Comment OpenLegion se compare-t-il à OpenClaw en matière de sécurité ?

Selon la documentation publique, OpenLegion fournit des défauts de sécurité plus stricts. Le déploiement local par défaut d'OpenClaw nécessite le montage du socket Docker (accordant un large accès hôte), son analyseur de sécurité a eu des problèmes signalés d'activation cohérente, et il stocke les identifiants dans une configuration accessible au processus de l'agent. OpenLegion exécute chaque tâche dans une exécution en bac à sable, conserve les identifiants dans un coffre-fort injecté hors du modèle, applique des budgets par agent et applique une désinfection unicode à plusieurs points d'étranglement. Pour une comparaison détaillée, consultez [OpenLegion vs OpenClaw](/comparison/openclaw).

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
