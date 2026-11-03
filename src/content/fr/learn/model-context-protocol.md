---
title: Model Context Protocol (MCP) — Comment les agents IA utilisent les outils
description: >-
  Le Model Context Protocol (MCP) est la norme ouverte d'Anthropic permettant
  aux agents IA de découvrir et d'appeler des outils externes. Comment cela
  fonctionne, mises en garde de sécurité et ce que fait OpenLegion à la place.
slug: /learn/model-context-protocol
primary_keyword: model context protocol
secondary_keywords:
  - MCP
  - MCP server
  - MCP client
  - MCP integration
  - anthropic mcp
  - mcp tools
  - mcp security
  - mcp agents
date_published: 2026-05
last_updated: 2026-05
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison
---

# Model Context Protocol : la norme ouverte pour les outils d'agents IA

Le **Model Context Protocol** (MCP) est la norme ouverte qu'Anthropic a publiée en novembre 2024 qui permet aux agents IA de découvrir et d'appeler des outils externes — bases de données, systèmes de fichiers, API, services internes — sans écrire de code de liaison sur mesure. Les serveurs MCP exposent des capacités ; les clients MCP (runtimes d'agents, IDE, assistants) les consomment. Le protocole est délibérément minimal, ce qui est aussi son piège en production : les déploiements doivent superposer authentification, mise en bac à sable et budgets par outil avant qu'ils ne soient sûrs à exécuter.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce que le Model Context Protocol ?**
> Le Model Context Protocol est une norme ouverte basée sur JSON-RPC, initialement publiée par Anthropic, qui définit comment les agents IA (clients) découvrent et appellent les capacités exposées par les outils (serveurs). C'est l'équivalent dans l'écosystème des agents IA de LSP pour les éditeurs ou de l'USB pour le matériel : un protocole, de multiples mises en œuvre.

## En bref

- **MCP est le port USB de l'écosystème des agents** — un protocole qui permet à tout runtime d'agent conforme d'utiliser tout serveur d'outils conforme sans écrire de code de liaison personnalisé.
- **Anthropic a publié MCP en novembre 2024** ; les adopteurs majeurs durant 2025 incluent OpenAI, Microsoft Copilot, Cursor, Zed, Continue et la plupart des frameworks d'agents.
- **MCP définit quatre types de primitives** : outils (appels de type fonction), ressources (données en lecture seule), prompts (templates réutilisables) et sampling (appels LLM initiés par le serveur vers le client).
- **Le transport est JSON-RPC sur stdio ou HTTP/SSE**. Stdio est la forme locale dominante ; HTTP/SSE gagne du terrain pour les serveurs MCP distants.
- **MCP en production requiert trois couches que la plupart des tutoriels sautent** : authentification, mise en bac à sable et application des budgets sur les appels d'outils.

## Comment fonctionne MCP

Un client MCP (un runtime d'agent ou assistant IA) se connecte à un ou plusieurs serveurs MCP. À la connexion, le client demande une liste de capacités — quels outils, ressources et prompts ce serveur offre-t-il ? Chaque outil annonce un schéma JSON pour ses arguments. Le LLM de l'agent voit la liste d'outils comme partie de son contexte et choisit les appels d'outils en conséquence. Le client route les appels vers le bon serveur, marshalle le JSON et renvoie les résultats.

Le transport est JSON-RPC 2.0. Deux transports sont courants : stdio (le client engendre le serveur comme sous-processus et communique via stdin/stdout — la valeur par défaut dans Claude Desktop) et HTTP avec Server-Sent Events pour les serveurs distants qui vivent à travers une frontière réseau.

Le protocole lui-même est intentionnellement minimal. La complexité réside dans ce que les serveurs MCP exposent : un serveur de système de fichiers donne à un agent un accès en lecture et écriture à un répertoire ; un serveur Postgres donne l'accès aux requêtes ; un serveur Slack donne des capacités d'envoi de messages et de lecture de canaux. Le même agent peut se connecter à plusieurs serveurs simultanément.

## Serveurs MCP vs clients MCP

**Les serveurs MCP** sont le côté outil. N'importe qui peut en écrire un — Anthropic publie des SDK de référence en Python et TypeScript. À la mi-2026, il existe des milliers de serveurs communautaires couvrant GitHub, Notion, Linear, Postgres, AWS, automatisation de navigateur et au-delà. Les serveurs tendent à être petits (quelques centaines de lignes) car le protocole fait la majeure partie du travail.

**Les clients MCP** sont des runtimes d'agents, IDE et assistants. Claude Desktop était le client de référence. Cursor, Zed, Continue, Windsurf et la plupart des frameworks d'agents ont ajouté le support client MCP durant 2025. Un seul client MCP supporte typiquement plusieurs connexions serveur concurrentes — un agent parlant à un serveur de système de fichiers, un serveur de base de données et un serveur Slack simultanément.

L'insight clé : le LLM ne parle pas MCP directement. Le client rend la liste d'outils MCP comme définitions de fonctions dans le prompt LLM ; le LLM émet un appel de fonction ; le client mappe l'appel au bon serveur MCP et transmet la requête JSON-RPC.

## Considérations de sécurité pour MCP en production

MCP est un protocole d'*exposition de capacités* — pas un protocole d'autorisation ou d'audit. Les déploiements en production doivent ajouter les parties que MCP laisse intentionnellement de côté :

- **Authentification** : la plupart des serveurs MCP s'exécutent sans authentification localement. Un déploiement multi-tenant nécessite des identifiants par agent et des frontières d'authentification par serveur.
- **Mise en bac à sable** : un serveur MCP de système de fichiers avec un large accès aux chemins est fonctionnellement root sur l'hôte. Exécutez les serveurs MCP dans des conteneurs ; ne montez pas aveuglément des volumes sensibles.
- **Application des budgets** : les appels d'outils ne sont pas gratuits. Un agent appelant un serveur MCP de scraping web en boucle peut accumuler un coût sérieux. Les budgets par agent doivent couvrir les invocations d'outils, pas seulement les jetons LLM.
- **Journaux d'audit** : MCP lui-même ne standardise pas la journalisation des appels. Les runtimes de production doivent enregistrer chaque appel serveur avec arguments, forme de réponse et timing pour la revue de [sécurité des agents IA](/learn/ai-agent-security) et la réponse aux incidents.

L'intégration MCP de référence de Claude Desktop monte les serveurs comme sous-processus hôte avec les autorisations de système de fichiers de l'utilisateur hôte. Cela fonctionne pour les configurations de développeurs mono-utilisateur ; ce n'est pas sûr pour la production.

## Comment OpenLegion intègre MCP

MCP n'est pas disponible sur OpenLegion au lancement. Les agents utilisent la boîte à outils intégrée d'OpenLegion, et chaque appel suit le même chemin : une intention vérifiée par un moteur de politiques unique avant qu'elle n'ait lieu, puis enregistrée comme un reçu que le propriétaire peut lire. Ce sont les couches de niveau production que MCP laisse délibérément de côté :

- Le code que l'agent écrit tourne dans un bac à sable sans accès réseau par défaut ; l'agent n'a jamais d'accès stdio direct à un processus hôte.
- Les autorisations par agent contrôlent quels outils un agent donné est autorisé à appeler.
- Chaque appel d'outil est compté contre le budget en crédits propre à l'agent ; un agent qui l'épuise est coupé, que la dépense vienne des modèles ou des outils.
- Chaque appel est enregistré avec l'identité de l'agent, un horodatage et le coût exact — la même télémétrie couverte dans [Observabilité des agents IA](/learn/ai-agent-observability).

Le résultat : une surface d'outils plus étroite que celle de l'écosystème MCP, et aucune de ses hypothèses de confiance par défaut.

## Le point de vue d'OpenLegion

MCP est la norme d'écosystème d'agents la plus importante depuis OpenAPI — elle réduit ce qui serait autrement un travail d'intégration N × M (chaque framework d'agents fois chaque outil) à N + M serveurs et clients. Mais le minimalisme intentionnel du protocole signifie que les équipes en production doivent reconstruire l'infrastructure ennuyeuse — authentification, mise en bac à sable, budgets, audit — que les systèmes propriétaires avaient regroupée. Les frameworks qui traitent MCP comme du prêt-à-l'emploi sans superposer ces préoccupations livrent des agents non sécurisés par défaut. Choisissez une [plateforme d'agents IA](/learn/ai-agent-platform) qui prend MCP suffisamment au sérieux pour le contraindre.

## CTA

**Déployez des agents avec des contrôles de niveau production intégrés.**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Qu'est-ce que le Model Context Protocol ?

Le Model Context Protocol (MCP) est une norme JSON-RPC ouverte introduite par Anthropic en novembre 2024 qui permet aux agents IA de découvrir et d'appeler des outils externes via une interface uniforme. Les serveurs MCP exposent des capacités (outils, ressources, prompts) ; les clients MCP (runtimes d'agents, IDE, assistants) les consomment. Les adopteurs majeurs durant 2025 incluent OpenAI, Microsoft Copilot, Cursor, Zed et la plupart des frameworks d'agents.

### Qui a créé MCP et est-il ouvert ?

Anthropic a créé MCP et l'a publié sous une spécification ouverte avec des SDK de référence en Python et TypeScript. La spécification est gouvernée par la communauté via GitHub, et il n'y a aucune licence ou verrouillage propriétaire. N'importe qui peut écrire un serveur ou un client MCP, et les principaux fournisseurs LLM livrent un outillage compatible MCP.

### Quelle est la différence entre un serveur MCP et un client MCP ?

Un serveur MCP expose des capacités — un serveur Postgres expose des outils de requête, un serveur de système de fichiers expose la lecture et l'écriture de fichiers, un serveur Slack expose l'envoi de messages. Un client MCP est le côté consommateur — typiquement un runtime d'agent, un IDE ou un assistant IA. Un client peut se connecter à plusieurs serveurs simultanément ; un serveur peut être réutilisé par plusieurs clients.

### MCP est-il sécurisé par défaut ?

Non — et c'est intentionnel. MCP est un protocole d'exposition de capacités, pas un protocole d'autorisation. Les implémentations de référence (Claude Desktop, les exemples SDK) exécutent les serveurs sans authentification comme sous-processus hôte avec les autorisations de système de fichiers de l'utilisateur. Les déploiements en production doivent ajouter l'authentification, la mise en bac à sable, les budgets par outil et la journalisation d'audit par-dessus MCP lui-même.

### Comment MCP se compare-t-il à l'appel de fonction OpenAI ?

L'appel de fonction OpenAI est un patron mono-fournisseur permettant à un LLM d'appeler des fonctions définies dans la requête API — il ne standardise pas comment les outils sont découverts, packagés ou partagés entre systèmes. MCP est une norme ouverte multi-fournisseurs pour le même problème au niveau de l'écosystème. Les deux sont complémentaires : les serveurs MCP exposent des capacités ; un client MCP peut les rendre comme définitions de fonctions au format OpenAI lors de l'appel à des modèles GPT, ou au format tool-use d'Anthropic lors de l'appel à Claude.

### Puis-je utiliser MCP avec n'importe quel fournisseur LLM ?

Oui. MCP est indépendant du LLM — le client rend les définitions d'outils MCP dans le format que le LLM sous-jacent attend (tool use Anthropic, appel de fonction OpenAI, déclarations de fonction Gemini). Un runtime qui masque le choix du fournisseur derrière des préréglages de modèles, comme OpenLegion le fait avec Smartest, Smart et Normal, adapte pour vous les définitions d'outils à la convention d'appel de chaque fournisseur.
