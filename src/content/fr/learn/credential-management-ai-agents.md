---
title: "Gestion des identifiants pour agents IA : Architecture vault-proxy"
description: "Architecture vault-proxy pour agents IA : injection des secrets côté serveur, isolation par agent, audit de chaque accès, et évitement de l'antipattern env-var qui a exposé des clés dans CVE-2024-34359 et CVE-2025-29927."
slug: /learn/credential-management-ai-agents
primary_keyword: credential management ai agents
last_updated: "2026-06-11"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-security
  - /learn/model-context-protocol
  - /learn/ai-agent-orchestration
  - /learn/multi-agent-systems
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
---

# Gestion des identifiants pour agents IA : Architecture vault-proxy

La gestion des identifiants pour agents IA est l'ensemble des pratiques d'infrastructure qui régissent la façon dont les agents autonomes obtiennent, utilisent, font tourner et libèrent les clés API et secrets sans que les identifiants n'apparaissent dans la mémoire de l'agent, les journaux ou les fenêtres de contexte. Les agents rompent les schémas classiques de gestion des identifiants : ils fonctionnent de manière autonome, peuvent être compromis par injection de prompt, et opèrent en flottes où un secret partagé multiplie la surface d'exfiltration. CVE-2024-34359 (llama-cpp-python, CVSS 9,6) et CVE-2025-29927 (Next.js, CVSS 9,1) ont démontré comment les déploiements IA exposent des secrets quand les frontières de sécurité échouent.

<!-- SCHEMA: DefinitionBlock -->
La gestion des identifiants pour agents IA est l'ensemble des pratiques et des schémas d'infrastructure qui régissent la façon dont les agents autonomes obtiennent, utilisent, font tourner et libèrent les clés API, jetons et secrets sans que ces identifiants n'apparaissent jamais dans la mémoire de l'agent, les journaux ou les fenêtres de contexte.

## Pourquoi les schémas classiques d'identifiants échouent dans les flottes d'agents

### Le problème du fichier .env à grande échelle

Les variables d'environnement fonctionnent bien pour les applications mono-processus. Pour les flottes d'agents, le modèle s'effondre immédiatement. Un fichier `.env` partagé sur une flotte de 10 agents signifie que 10 processus en cours d'exécution détiennent chacun tous les secrets en mémoire. Chaque processus génère des journaux, des sorties d'erreur et des traces de débogage -- autant de surfaces potentielles d'exposition des identifiants. Si l'un de ces 10 agents est compromis par une attaque par injection de prompt lui ordonnant d'imprimer son environnement, chaque identifiant dans le `.env` partagé fuit simultanément.

Le multiplicateur N-agents est le problème central : chaque agent supplémentaire dans la flotte ajoute une nouvelle surface d'exposition pour chaque identifiant partagé. Une flotte de 20 agents avec 5 clés API dans `.env` crée 100 points d'exposition potentiels avant de prendre en compte l'agrégation des journaux, les rapports d'erreurs ou les outils de débogage qui peuvent capturer des instantanés d'environnement.

### Le bilan CVE sur les secrets en clair dans les applications IA

Deux CVE documentent le coût réel d'une gestion non sécurisée des secrets dans les systèmes IA déployés :

**CVE-2024-34359** (llama-cpp-python, CVSS 9,6 Critique) : injection de template côté serveur Jinja2 via le rendu non sandboxé des métadonnées de modèle dans `llama-cpp-python`. Le champ de template de chat d'un fichier `.gguf` malicieusement conçu était rendu via `jinja2.Environment` sans sandboxing, permettant l'exécution de code à distance. Toute application chargeant des modèles non fiables -- y compris les pipelines d'agents téléchargeant des modèles depuis des sources externes -- est concernée. Le problème structurel : le code de chargement de modèle faisait confiance au contenu externe sans isolation.

**CVE-2025-29927** (Next.js, CVSS 9,1 Critique) : contournement d'autorisation via l'en-tête `x-middleware-subrequest` qui permettait aux requêtes non authentifiées de passer outre le middleware dans les déploiements Next.js. Les applications utilisant le middleware Next.js pour protéger les routes sécurisées par identifiants -- y compris les backends d'API d'agents IA -- étaient affectées : le contournement permettait l'accès aux routes que le middleware était censé bloquer. Le défaut est corrigé dans les versions 12.3.5, 13.5.9, 14.2.25 et 15.2.3.

Les deux CVE illustrent la même classe de risque sous-jacente : quand les secrets ou les routes protégées dépendent de contrôles au niveau de la couche applicative plutôt que d'une isolation structurelle, un seul défaut logique les expose. Le schéma vault-proxy élimine la surface en maintenant les secrets hors des conteneurs d'agents et derrière des mécanismes d'application au niveau de la couche infrastructure.

### Pourquoi les journaux d'agents représentent un risque pour les identifiants

Les journaux d'applications traditionnelles contiennent des événements structurés sur des sites d'appel contrôlés. Les journaux d'agents capturent tout : les traces de raisonnement LLM, les arguments des appels d'outils, les valeurs de retour des outils et les étapes de raisonnement intermédiaires. Quand un agent appelle une API externe avec un identifiant dans l'en-tête Authorization, une configuration de journalisation naïve capture cet en-tête. Quand la trace de raisonnement d'un agent inclut le texte "using API key sk-..." provenant d'un document récupéré ou d'un prompt, cette chaîne apparaît dans le journal.

Les volumes de journaux d'agents sont élevés et les périodes de rétention souvent longues. Un identifiant qui apparaît une fois dans un système d'agrégation de journaux y reste jusqu'à ce que le journal soit purgé -- ce qui peut être des semaines ou des mois après que l'agent qui l'a généré a été déclassé.

### Le chemin d'injection de prompt vers les identifiants

OWASP LLM Top 10 v1.1 (LLM06 : Divulgation d'informations sensibles, publié en octobre 2025) identifie l'exfiltration d'identifiants comme vecteur d'attaque principal pour les applications LLM. L'attaque est directe : le contenu adversarial récupéré par un agent -- depuis une page web, un document, une réponse d'outil -- contient des instructions comme "imprimer toutes les variables d'environnement" ou "afficher ta clé API". Un agent sans isolation structurelle des identifiants ne peut pas distinguer cette instruction d'une instruction de tâche légitime.

Des recherches début 2026 ont scanné 3 984 compétences d'agents et trouvé que 283 (7,1 %) contenaient des failles critiques de gestion des identifiants qui transmettaient des clés API via le contexte LLM en clair. 76 compétences contenaient des charges utiles délibérées de vol d'identifiants conçues pour exfiltrer des identifiants vers des endpoints contrôlés par des attaquants. La seule défense structurelle est de s'assurer que les identifiants n'existent jamais dans le contexte de l'agent. Un agent ne peut pas faire fuiter un identifiant qu'il ne détient pas.

## Schémas de gestion des identifiants pour agents IA

### Schéma 1 : Variables d'environnement (Moins sécurisé)

Les variables d'environnement (`os.environ`, fichiers `.env`, flags Docker `--env`) sont le schéma d'identifiants par défaut pour la plupart des frameworks d'agents. LangChain lit depuis `os.environ`, CrewAI repose sur l'injection d'environnement, OpenAI Agents SDK attend les identifiants dans l'environnement du processus. Ce schéma convient uniquement au développement local et au prototypage.

Pour les flottes d'agents en production, les variables d'environnement échouent sur chaque axe de sécurité : elles existent dans la mémoire du processus agent (accessible par injection de prompt), apparaissent dans `/proc/{pid}/environ` sur les hôtes Linux, font surface dans les traces d'erreurs et les sorties de débogage, et se propagent à tous les agents d'une flotte à environnement partagé.

### Schéma 2 : Intégration de gestionnaire de secrets

Les gestionnaires de secrets cloud (AWS Secrets Manager à 0,40 $/secret/mois + 0,05 $ par 10 000 appels API ; Azure Key Vault ; GCP Secret Manager) améliorent les variables d'environnement en stockant les identifiants hors du processus agent et en les récupérant à la demande. L'agent appelle l'API du gestionnaire de secrets pour récupérer un identifiant, l'utilise pour une opération et le supprime.

Ce schéma réduit la durée de vie de l'identifiant en mémoire mais n'élimine pas la fenêtre d'exposition : l'identifiant passe toujours par la mémoire de l'agent pendant le cycle récupération-utilisation-suppression. Il reste visible pour l'injection de prompt pendant cette fenêtre et exige que l'agent détienne un second identifiant (la clé API du gestionnaire de secrets ou le rôle IAM) pour accéder au premier.

### Schéma 3 : Vault proxy / Injection de handle opaque (Plus sécurisé)

Le schéma vault-proxy maintient les identifiants entièrement hors des conteneurs d'agents. L'agent détient un handle opaque -- une chaîne de référence comme `$CRED{stripe_key}` -- qui identifie un identifiant sans le résoudre. Quand l'agent effectue un appel API incluant le handle, le vault proxy intercepte la requête, résout le handle vers l'identifiant réel, l'injecte au niveau réseau et transmet la requête authentifiée. L'agent ne voit jamais l'identifiant en clair.

C'est le même principe que l'injection côté agent de HashiCorp Vault (35 763 étoiles, BSL, v2.0.2 publié le 5 juin 2026), directement intégré dans la couche d'orchestration des agents. Avec 700+ serveurs MCP dans l'écosystème (juin 2026), le schéma de handle `$CRED{}` élimine l'étalement par-serveur des `.env` : une référence de handle dans la configuration de l'agent couvre les besoins en identifiants de n'importe quel serveur MCP.

Un conteneur d'agent entièrement compromis -- exécutant des instructions arbitraires d'un attaquant -- n'a aucun accès aux identifiants car aucun identifiant n'existe dans la portée du conteneur.

### Schéma 4 : Identité de charge de travail et fédération OIDC

L'identité de charge de travail (fédération OIDC, SPIFFE/SPIRE, comptes de service IAM cloud) élimine complètement les clés API à longue durée de vie pour l'accès aux services cloud. Chaque conteneur d'agent reçoit un jeton d'identité à courte durée de vie échangé contre un identifiant de fournisseur cloud au moment de l'exécution. L'identifiant a une TTL bornée -- généralement 15 minutes à 1 heure -- après quoi il expire et un nouveau jeton doit être émis.

L'identité de charge de travail est le schéma correct pour les flottes d'agents fonctionnant sur infrastructure cloud où des identifiants de fournisseur cloud (clés API AWS, clés de compte de service GCP) sont requis. Elle nécessite que la plateforme d'orchestration gère l'émission d'identité et le rafraîchissement des jetons, mais élimine entièrement le problème de rotation des clés statiques. Pour les architectures de [systèmes multi-agents](/learn/multi-agent-systems) qui s'étendent sur plusieurs comptes ou fournisseurs cloud, la fédération d'identité de charge de travail est le seul modèle d'identifiant évolutif.

## L'avis d'OpenLegion : le schéma de handle $CRED{}

Chaque framework majeur d'agents IA traite la gestion des identifiants comme le problème de l'application hôte. LangChain et LangGraph lisent depuis `os.environ`. CrewAI repose sur l'injection d'environnement. OpenAI Agents SDK attend les identifiants dans l'environnement du processus. AutoGen hérite de l'environnement du processus Python. Aucun de ces frameworks ne fournit d'isolation structurelle des identifiants -- ils laissent la gestion des identifiants à l'opérateur, ce qui en pratique signifie des fichiers `.env` et des variables d'environnement partagées.

Le vault-proxy d'OpenLegion est intégré dans la couche d'orchestration des agents. Les agents référencent les identifiants comme des handles opaques `$CRED{nom}`. L'hôte mesh résout les handles côté serveur et injecte les identifiants à la frontière réseau. Aucun conteneur d'agent ne reçoit jamais un identifiant en clair. L'injection de prompt ne peut pas exfiltrer ce qui n'est pas présent.

Infisical (27 296 étoiles, plateforme de secrets TypeScript open source avec noyau sous licence MIT) a levé 2,8 M$ en amorçage en 2023, signalant une demande du marché pour la gestion de secrets native aux développeurs. OpenLegion intègre la même capacité directement dans l'agent runtime -- aucun déploiement séparé de gestion de secrets requis.

| **Dimension** | **OpenLegion** | **LangChain/LangGraph** | **CrewAI** | **OpenAI Agents SDK** | **AutoGen** |
|---|---|---|---|---|---|
| **Stockage des identifiants** | Vault (handles opaques) | Environnement / .env | Environnement / .env | Environnement / .env | Environnement / .env |
| **Schéma d'accès agent** | Handle $CRED{} -- jamais résolu dans le conteneur | os.environ lecture directe | os.environ lecture directe | os.environ lecture directe | os.environ lecture directe |
| **En clair dans le contexte agent ?** | Jamais | Oui -- à la lecture os.environ | Oui -- à la lecture os.environ | Oui -- à la lecture os.environ | Oui -- à la lecture os.environ |
| **Support de rotation** | Natif vault ; rotation à chaud sans redémarrage | Manuel ; nécessite redémarrage | Manuel ; nécessite redémarrage | Manuel ; nécessite redémarrage | Manuel ; nécessite redémarrage |
| **Scoping par agent** | Appliqué au niveau mesh par liste d'autorisation | Non appliqué | Non appliqué | Non appliqué | Non appliqué |
| **Piste d'audit** | Chaque résolution de handle journalisée avec ID d'agent | Aucune native | Aucune native | Aucune native | Aucune native |

Pour les équipes évaluant la surface totale d'exposition aux identifiants de leur stack actuel, le [modèle de menaces de sécurité des agents IA](/learn/ai-agent-security) couvre les fuites d'identifiants comme l'une des six catégories de menaces documentées, aux côtés de l'injection de prompt, l'évasion de sandbox et l'abus de budget.

## Rotation des secrets pour les flottes d'agents IA

### Baux d'identifiants à TTL borné

Les clés API statiques -- des identifiants sans expiration -- sont le pire identifiant pour les flottes d'agents. Une clé statique fuiteuse reste valide indéfiniment. La rotation des clés nécessite de coordonner tous les agents qui utilisent la clé, potentiellement pendant des tâches actives.

Les baux d'identifiants à TTL borné résolvent les deux problèmes. L'identifiant est émis avec une fenêtre d'expiration -- 1 heure est courant pour les sessions d'agents interactifs ; 15 minutes pour les opérations haute sensibilité. Quand le bail expire, le vault émet automatiquement un identifiant frais. L'ancien identifiant est invalide après expiration, limitant la valeur de toute copie fuiteuse. Les tâches d'agents couvrant plusieurs fenêtres de bail reçoivent des rafraîchissements transparents sans interruption.

Le moteur de secrets dynamiques de HashiCorp Vault génère des identifiants à courte durée de vie pour les bases de données, les fournisseurs cloud et les backends personnalisés à la demande. Chaque identifiant est unique à l'agent demandeur et expire après une TTL configurable. CVE-2026-39829 (golang/crypto, juin 2026) a corrigé une vulnérabilité DoS dans l'analyse de clé publique SSH causée par des tailles de module RSA non bornées -- Vault v2.0.2 l'a adressée en limitant les clés RSA à 8 192 bits. Même l'infrastructure vault construite à cet effet livre des CVE, ce qui explique pourquoi les couches d'abstraction entre les agents et les secrets bruts importent même lors de l'utilisation directe de Vault.

### Rotation à chaud sans redémarrage d'agent

La rotation traditionnelle des secrets d'application exige le redémarrage du processus pour adopter le nouvel identifiant. Les flottes d'agents ne peuvent pas tolérer des redémarrages forcés : les agents peuvent être en cours de tâche, détenir un état de travail perdu au redémarrage, ou coordonner avec d'autres agents dans un transfert multi-étapes.

La rotation à chaud injecte le nouvel identifiant dans le vault sans toucher le conteneur d'agent en cours d'exécution. Le prochain appel API de l'agent via le vault proxy utilise le nouvel identifiant de manière transparente. Du point de vue de l'agent, le handle `$CRED{nom}` résout toujours -- seul le secret sous-jacent a changé.

La rotation à chaud exige que les agents ne mettent jamais en cache les identifiants localement. Le schéma de handle `$CRED{}` l'applique structurellement : les handles sont résolus au moment de l'appel, pas au démarrage, donc la mise en cache locale de la valeur résolue n'est jamais possible.

### Portée de rotation par agent

Dans une flotte à identifiants partagés, la rotation d'un identifiant affecte chaque agent qui l'utilise. Un événement de rotation nécessite une coordination sur toute la flotte, créant un goulot d'étranglement de coordination et une fenêtre où certains agents utilisent l'ancien identifiant et d'autres le nouveau.

Le scoping des identifiants par agent rend la rotation orthogonale : faire tourner les identifiants de l'Agent A n'affecte pas l'Agent B, car l'Agent B détient sa propre portée d'identifiant séparée. Cela n'est réalisable que quand la couche d'orchestration applique le scoping par agent plutôt que de s'appuyer sur des fichiers `.env` partagés. Pour les conceptions de [workflows agentiques](/learn/agentic-workflows) qui chaînent plusieurs agents spécialisés, la portée de rotation par agent est essentielle pour l'hygiène des identifiants sans temps d'arrêt.

## Isolation des identifiants entre agents

### Attribution des identifiants par agent

Chaque agent dans une flotte ne devrait détenir que les identifiants que sa tâche spécifique nécessite. Un agent de scraping web a besoin d'accès à un identifiant client HTTP mais pas d'une chaîne de connexion à une base de données. Un agent d'analyse de données a besoin d'un accès en lecture à un entrepôt de données mais pas de jetons d'écriture vers des API externes. Un agent de publication a besoin d'un accès en écriture à un CMS mais pas d'accès aux bases de données internes.

L'attribution des identifiants par agent exige que la couche d'orchestration applique le scoping -- pas l'agent lui-même. Un agent demandant un identifiant pour lequel il n'est pas autorisé devrait recevoir un refus à la frontière du vault, pas silencieusement recevoir l'identifiant parce qu'il était présent dans un `.env` partagé.

OWASP LLM06 (Divulgation d'informations sensibles) note explicitement que les identifiants d'agents sur-provisionnés sont un facteur contributif aux incidents de fuite d'identifiants -- les agents reçoivent plus d'accès que leur tâche ne nécessite, donc quand ils sont compromis, le rayon de souffle est plus grand que nécessaire.

### Scoping des identifiants de serveur outil MCP

Les serveurs d'outils Model Context Protocol nécessitent souvent leurs propres identifiants -- des clés API pour les services qu'ils proxifient. Avec 700+ serveurs MCP dans l'écosystème (juin 2026), le problème de gestion des identifiants au niveau MCP n'est plus théorique : chaque serveur est un vecteur potentiel d'étalement des `.env`. Dans OpenLegion, les identifiants de serveurs MCP sont stockés dans le même vault et injectés via le même schéma proxy. Le serveur outil MCP reçoit des requêtes authentifiées du proxy mesh plutôt que des identifiants bruts de l'agent.

Cela empêche qu'un serveur MCP malveillant soit utilisé comme vecteur de collecte d'identifiants. Un serveur MCP compromis ne trouve que des références de handles dans les requêtes entrantes, pas des clés brutes. Pour le modèle complet de durcissement de la [sécurité du Model Context Protocol](/learn/model-context-protocol), voir le guide dédié.

### Révoquer les identifiants lors de la retraite de l'agent

Quand un agent complète sa tâche ou est archivé, ses identifiants devraient être révoqués immédiatement. Les identifiants statiques qui survivent à leur agent associé créent des accès orphelins -- des clés valides sans piste d'audit associée, appartenant à un processus qui ne fonctionne plus.

La révocation des identifiants lors de la retraite de l'agent nécessite que la couche d'orchestration suive les événements du cycle de vie des agents et déclenche des révocations dans le vault. Le mesh d'OpenLegion gère cela automatiquement : quand un agent est archivé, le mesh révoque tous les handles d'identifiants associés à la portée de cet agent. Pour les systèmes d'[orchestration des agents IA](/learn/ai-agent-orchestration) qui gèrent le cycle de vie des agents de manière programmatique, la révocation des identifiants devrait être un événement de cycle de vie de premier ordre -- pas une réflexion opérationnelle après coup.

## Pistes d'audit et journalisation des accès aux identifiants

### Quoi journaliser (et quoi ne pas journaliser)

Chaque événement d'accès aux identifiants devrait produire une entrée de journal contenant : l'ID d'agent qui a résolu le handle, le nom du handle (pas la valeur résolue), l'horodatage, l'endpoint externe ciblé par la requête authentifiée, et le résultat (succès ou échec d'autorisation). Ce qu'il ne faut pas journaliser : la valeur réelle de l'identifiant, la chaîne secrète résolue, ou tout dérivé de l'identifiant en clair. Le nom du handle est suffisant à des fins d'audit et forensiques.

### Corréler l'utilisation des identifiants avec les actions des agents

Les pistes d'audit des agents diffèrent des pistes d'audit des applications traditionnelles : le chemin de code est non-déterministe. Une application traditionnelle suit un graphe d'appels fixe ; un agent peut effectuer n'importe quelle action selon son prompt, les sorties des outils et le raisonnement LLM. Les journaux d'audit des agents doivent capturer chaque appel d'outil et ses arguments -- pas seulement les accès aux identifiants -- pour reconstruire le contexte complet autour d'un événement d'utilisation d'identifiant suspect.

L'orchestrateur d'OpenLegion journalise les appels d'outils et les résolutions d'identifiants dans un flux d'événements unifié. Une analyse forensique peut rejouer la séquence : tâche reçue -> appel LLM -> outil sélectionné -> identifiant résolu -> API externe appelée -> réponse reçue. C'est l'architecture correcte pour les déploiements d'agents IA dans des environnements réglementés ou à enjeux élevés.

### Exigences d'audit pour les environnements réglementés

Pour les services financiers, la santé et d'autres secteurs réglementés, les journaux d'audit des identifiants d'agents doivent répondre à des exigences spécifiques : immuabilité (les journaux ne peuvent pas être modifiés après création), résistance à la falsification (l'intégrité des journaux est vérifiable), conformité de la période de rétention (journaux conservés pendant la durée requise) et contrôles d'accès (seul le personnel autorisé peut lire les journaux d'audit). Ces exigences correspondent directement à l'architecture vault-proxy : l'hôte mesh génère des entrées de journal d'audit au fur et à mesure que les identifiants sont résolus, les écrit dans un stockage en ajout uniquement et signe les entrées pour la résistance à la falsification. Les conteneurs d'agents n'ont jamais accès au stockage des journaux d'audit. Pour les décisions de [plateforme d'agents IA](/learn/ai-agent-platform), l'architecture des journaux d'audit est une considération de conformité clé aux côtés du choix du backend de secrets.

## Choisir un backend de secrets pour votre plateforme d'agents

### HashiCorp Vault

HashiCorp Vault (35 763 étoiles, BSL, v2.0.2 publié le 5 juin 2026) est le système de gestion de secrets open source de référence. Il fournit la génération de secrets dynamiques, les baux à TTL borné, les politiques d'accès à granularité fine, la journalisation d'audit complète et une architecture de plugins pour des moteurs de secrets personnalisés. Note : HashiCorp est passé de la licence Apache 2.0 approuvée par l'OSI à BSL (Business Source License) en août 2023 -- BSL n'est pas une licence open source approuvée par l'OSI et restreint l'utilisation commerciale par les concurrents de Vault.

Vault est le bon choix quand vous avez besoin d'un système autonome de gestion de secrets partagé par plusieurs services. La charge opérationnelle est non-triviale : Vault nécessite son propre déploiement, une configuration haute disponibilité et des procédures de descellement. Pour les flottes d'agents où Vault est déjà déployé en tant qu'infrastructure, l'intégration de la gestion des identifiants d'agents dans le moteur de politiques de Vault est simple.

### Infisical

Infisical (27 296 étoiles, noyau sous licence MIT, TypeScript open source) fournit une plateforme de secrets native aux développeurs avec une interface web, une CLI et un SDK pour la gestion de secrets, la rotation et les pistes d'audit. Il a levé 2,8 M$ en amorçage en 2023 et se positionne comme une alternative plus légère à HashiCorp Vault pour les équipes souhaitant la gestion de secrets sans la complexité opérationnelle de Vault ni les contraintes de licence BSL.

Pour les flottes d'agents qui ne font pas déjà tourner Vault, Infisical vaut la peine d'être évalué comme backend de secrets. Sa conception SDK-first s'intègre proprement avec les runtimes Python des agents, et son scoping par environnement correspond naturellement aux exigences de scoping par agent.

### Cloud-natif (AWS/Azure/GCP)

AWS Secrets Manager (0,40 $/secret/mois + 0,05 $ par 10 000 appels API), Azure Key Vault et GCP Secret Manager fournissent un stockage de secrets géré avec une intégration native aux systèmes IAM de chaque fournisseur cloud. Si votre flotte d'agents fonctionne entièrement dans un seul fournisseur cloud, la gestion de secrets cloud-native évite la charge opérationnelle de faire tourner Vault ou Infisical séparément.

La limitation : les gestionnaires de secrets cloud-native nécessitent des identifiants IAM cloud pour y accéder -- le problème d'amorçage de l'identifiant. Un nouveau conteneur d'agent a besoin d'un identifiant pour s'authentifier auprès d'AWS Secrets Manager avant de pouvoir récupérer ses identifiants opérationnels. L'identité de charge de travail OIDC résout ce problème d'amorçage pour les déploiements cloud-natifs.

<!-- SCHEMA: FAQPage -->
## Foire aux questions

### Qu'est-ce que la gestion des identifiants pour agents IA ?

La gestion des identifiants pour agents IA est l'ensemble des pratiques d'infrastructure qui régissent la façon dont les agents autonomes obtiennent, utilisent, font tourner et libèrent les clés API, jetons et secrets. Les agents diffèrent des applications traditionnelles parce qu'ils fonctionnent de manière autonome, peuvent être compromis par injection de prompt, produisent des journaux verbeux et opèrent en flottes multi-instances -- tout cela crée des vecteurs d'exposition aux identifiants que les schémas standard de variables d'environnement n'adressent pas. OWASP LLM Top 10 v1.1 (2025) liste la Divulgation d'informations sensibles (LLM06) comme menace top-10, avec l'exfiltration d'identifiants comme vecteur d'attaque principal.

### Quels CVE concernent les fuites d'identifiants d'agents IA ?

CVE-2024-34359 (llama-cpp-python, CVSS 9,6) a documenté une vulnérabilité d'injection de template côté serveur Jinja2 dans le pipeline de chargement de modèle : le template de chat d'un fichier `.gguf` conçu était rendu sans sandboxing, permettant l'exécution de code à distance dans toute application chargeant des modèles non fiables. CVE-2025-29927 (Next.js, CVSS 9,1) a démontré que l'en-tête `x-middleware-subrequest` pouvait contourner l'autorisation middleware dans les applications Next.js, y compris les backends d'agents IA utilisant le middleware pour protéger les routes sécurisées par identifiants. Les deux CVE remontent aux contrôles de sécurité de la couche applicative échouant sous des entrées malveillantes -- la solution structurelle est de maintenir les secrets entièrement hors des conteneurs d'agents.

### Comment le schéma vault-proxy prévient-il les fuites d'identifiants ?

Le vault proxy intercepte les appels API des agents, résout les handles d'identifiants opaques vers les secrets réels au niveau réseau et retourne la réponse authentifiée sans que l'identifiant n'entre jamais dans le conteneur ou la fenêtre de contexte de l'agent. L'agent détient un handle comme `$CRED{stripe_key}` qui identifie le secret sans le résoudre. Un conteneur d'agent entièrement compromis exécutant des instructions arbitraires d'un attaquant n'a toujours aucun accès aux identifiants bruts, car aucun identifiant n'existe dans la portée du conteneur.

### Pourquoi l'isolation des identifiants par agent est-elle importante dans les systèmes multi-agents ?

Dans un système multi-agents, le rayon de souffle de chaque agent s'il est compromis est borné par les identifiants qu'il détient. Si chaque agent partage un seul fichier `.env` avec tous les secrets, compromettre n'importe quel agent expose tous les identifiants à chaque système en aval. Le scoping des identifiants par agent -- appliqué au niveau de la couche d'orchestration, pas dans le propre code de l'agent -- signifie qu'un agent de recherche compromis ne peut pas accéder aux jetons d'écriture de l'agent de publication ni aux identifiants de base de données de l'agent de données. OWASP LLM06 identifie explicitement les identifiants d'agents sur-provisionnés comme facteur contributif aux incidents de fuite d'identifiants.

### Que dit OWASP sur la gestion des identifiants pour agents IA ?

OWASP Top 10 pour applications LLM v1.1 (publié en octobre 2025) liste la Divulgation d'informations sensibles comme LLM06, identifiant l'exfiltration d'identifiants comme vecteur d'attaque principal pour les applications LLM. Les recommandations sont d'éviter le stockage d'identifiants en clair dans le contexte agent, d'implémenter le scoping des identifiants au moindre privilège et d'utiliser des contrôles au niveau de la couche infrastructure plutôt que de s'appuyer sur le code agent pour protéger les secrets. L'injection de prompt -- OWASP LLM01, le risque principal -- est le vecteur d'attaque le plus courant pour déclencher la divulgation d'identifiants dans les agents déployés.

### Comment OpenLegion gère-t-il les identifiants pour les agents exécutant des serveurs MCP ?

Dans OpenLegion, les identifiants de serveurs outils MCP sont stockés dans le vault et injectés via le même schéma proxy que les identifiants d'agents. Le serveur MCP reçoit des requêtes authentifiées du proxy mesh plutôt que des identifiants bruts de l'agent -- l'agent ne détient jamais les clés API upstream du serveur MCP. Avec 700+ serveurs MCP dans l'écosystème (juin 2026), cela élimine l'étalement des `.env` par serveur : une configuration vault couvre toutes les exigences d'identifiants MCP, et un serveur MCP compromis ne peut pas collecter des identifiants bruts depuis les requêtes entrantes.

### Qu'est-ce que la rotation des secrets et pourquoi les agents IA en ont-ils besoin ?

La rotation des secrets est la pratique de remplacer un identifiant par un nouveau selon un calendrier ou un déclencheur planifié, en invalidant l'ancien. Les agents IA ont besoin de rotation parce qu'ils fonctionnent pendant des périodes prolongées (heures à jours), sont des cibles d'exfiltration potentielles pendant toute cette fenêtre, et ne peuvent pas facilement être redémarrés en cours de tâche pour adopter des identifiants tournés. Les baux d'identifiants à TTL borné expirent automatiquement après une fenêtre configurable (typiquement 1 heure), et le schéma vault-proxy prend en charge la rotation à chaud -- injectant le nouveau secret sans toucher le conteneur d'agent en cours d'exécution -- donc la rotation est transparente pour l'agent.

## Construire des flottes d'agents sans exposition aux identifiants

Le problème de gestion des identifiants dans les flottes d'agents IA est architectural : si les identifiants existent dans les conteneurs d'agents, ils peuvent fuiter. CVE-2024-34359 et CVE-2025-29927 démontrent que même des équipes bien dotées en ressources exploitant des frameworks majeurs livrent cette exposition. Le schéma vault-proxy le résout structurellement -- les identifiants n'entrent jamais dans les conteneurs d'agents, donc l'injection de prompt, l'évasion de conteneur ou l'exfiltration de journaux ne peut pas les récupérer.

Le vault-proxy d'OpenLegion est intégré dans le mesh d'agents. Configurez un identifiant une fois avec `$CRED{nom}`, assignez-le aux agents qui en ont besoin, et le mesh gère l'injection, le rafraîchissement TTL, le scoping par agent et la journalisation d'audit. Pas de déploiement vault séparé, pas de coordination de fichiers `.env`, pas de procédures de rotation manuelles.

[Sécurisez votre flotte d'agents avec l'isolation des identifiants vault-proxy sur OpenLegion](https://openlegion.ai)
