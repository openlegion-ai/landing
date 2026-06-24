---
title: "Multi-Tenancy des Agents IA : Isolation des Credentials et Contrôles SOC 2"
description: "Prévenez les fuites de données entre locataires dans les systèmes d'agents IA multi-locataires. Couvre OWASP LLM06, le scoping des credentials par locataire, les espaces de noms Kubernetes et les contrôles SOC 2 CC6.1/CC6.6."
slug: /learn/ai-agent-multi-tenancy
primary_keyword: multi-tenancy agent ia
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-governance
  - /learn/ai-agent-sandboxing
  - /learn/ai-agent-audit-log
  - /learn/ai-agent-platform
---

# Multi-Tenancy des Agents IA : Isolation des Credentials, Séparation des Espaces de Noms et SOC 2

La multi-tenancy des agents IA est la propriété architecturale d'une plateforme d'agents qui isole les credentials, la mémoire, le contexte d'exécution et les enregistrements d'audit de chaque locataire de tous les autres locataires, appliquée au niveau de l'infrastructure et non par convention de développeur ou par le suivi d'instructions de l'agent. Contrairement à la multi-tenancy des applications web, les agents détiennent des clés API actives, accumulent une mémoire persistante entre les requêtes et exécutent des appels d'outils authentifiés : trois dimensions au-delà de l'isolation des lignes de données qui doivent chacune être partitionnées par locataire pour satisfaire OWASP LLM06 et SOC 2 CC6.1.

<!-- SCHEMA: DefinitionBlock -->

> **La multi-tenancy des agents IA** est la propriété architecturale d'une plateforme d'agents qui garantit que les agents servant différents locataires ne peuvent pas accéder aux credentials, à la mémoire, au contexte d'exécution ou aux enregistrements d'audit les uns des autres, appliquée au niveau de l'infrastructure par des scopes de vault de credentials par locataire, des ACL d'espace de noms de tableau noir, une isolation d'exécution conteneurisée et des journaux d'audit partitionnés, de sorte qu'un produit SaaS B2B construit sur la plateforme hérite de l'isolation des locataires comme garantie structurelle plutôt que comme responsabilité du développeur.

## Pourquoi la Multi-Tenancy des Agents est Plus Difficile que Celle des Applications Web

La multi-tenancy traditionnelle des applications web isole une chose : les lignes de données. Ajoutez une colonne `tenant_id`, filtrez chaque requête, c'est fait. La multi-tenancy des agents doit isoler trois dimensions supplémentaires que les applications web n'ont jamais eu à aborder. L'échec de l'une d'entre elles constitue un événement de fuite de données entre locataires selon OWASP LLM06 Sensitive Information Disclosure.

### Les Trois Dimensions d'Isolation Absentes des Applications Web

**Isolation des credentials** : les applications web identifient l'utilisateur via un jeton de session ; la session n'a pas d'accès persistant aux services externes. Les agents ont besoin de vraies clés API scopées pour le locataire : une clé OpenAI, une clé Stripe, une clé Salesforce. Si l'agent du LocataireA et l'agent du LocataireB partagent une clé OpenAI, l'utilisation intensive du LocataireA dégrade la marge de limite de débit du LocataireB ; la facturation du LocataireA chez le fournisseur inclut la consommation de jetons du LocataireB ; la révocation de la clé après une compromission du LocataireA perturbe également le LocataireB ; et les journaux d'utilisation de la clé dans le tableau de bord du fournisseur ne peuvent pas être partitionnés par locataire, violant les exigences d'accès logique CC6.1 de SOC 2.

**Isolation de la mémoire** : les applications web traitent une requête sans état et rejettent tout contexte. Les agents accumulent de la mémoire de travail (fenêtre de contexte en cours), de la mémoire sémantique (embeddings de magasin vectoriel) et un état de coordination (entrées de tableau noir) entre les interactions. Si l'un de ces magasins de mémoire n'est pas partitionné par locataire, les documents du LocataireA récupérés dans le contexte de l'agent lors d'une tâche peuvent apparaître dans le contexte de l'agent du LocataireB lors d'une tâche sémantiquement similaire, sans aucune entrée adversariale requise. C'est le scénario canonique de fuite de données entre locataires d'OWASP LLM06 v1.1.

**Isolation du journal d'audit** : un journal d'audit partagé où les appels d'outils du LocataireA et du LocataireB sont mélangés ne peut pas être exporté vers l'équipe de conformité du LocataireA sans exposer les enregistrements du LocataireB. SOC 2 CC6.1 exige que l'auditeur de chaque locataire ne puisse voir que ses propres enregistrements, ce qui nécessite un partitionnement au niveau de la couche de stockage, pas seulement un filtrage au moment de la requête.

### Shared-Nothing vs Pool vs Bridge : Trois Modèles de Multi-Tenancy

**Modèle Silo (shared-nothing)** : chaque locataire dispose d'une infrastructure entièrement dédiée : conteneurs d'agents séparés, vault de credentials séparé, espace de noms de tableau noir séparé sans dépendances ACL vis-à-vis d'autres locataires, index de magasin vectoriel séparé, clé API LLM séparée. Isolation maximale au coût le plus élevé par locataire. Correct pour les locataires d'entreprise avec des exigences strictes de résidence des données, les industries réglementées et tout locataire dont la posture de conformité exige une infrastructure dédiée.

**Modèle Pool** : tous les locataires partagent l'infrastructure : même pool de conteneurs d'agents, même clé API LLM, même cluster de magasin vectoriel, même tableau noir, avec une isolation appliquée uniquement au niveau de la couche applicative par filtrage de paramètre `tenant_id`. Coût le plus bas, isolation la plus faible. Approprié uniquement pour les charges de travail à faible sensibilité sans clients d'entreprise.

**Modèle Bridge** : infrastructure de calcul partagée avec isolation appliquée au niveau du plan de contrôle. Chaque locataire obtient un scope de vault de credentials dédié et un espace de noms de mémoire appliqués par des ACL d'infrastructure ; le calcul est partagé mais gouverné par Kubernetes namespace ResourceQuota. C'est la valeur par défaut recommandée pour le SaaS B2B. L'architecture basée sur les projets d'OpenLegion est une implémentation du modèle Bridge.

## OWASP LLM06 : Divulgation d'Informations Sensibles Entre Locataires

OWASP LLM Top 10 v1.1 classe les fuites de données entre locataires sous LLM06 : Sensitive Information Disclosure comme de haute sévérité.

### La Séquence d'Attaque par Fuite de Données Entre Locataires

1. L'agent du LocataireA traite une demande de support client. Il récupère la documentation produit interne et les enregistrements clients du LocataireA dans sa fenêtre de contexte, puis intègre et stocke les passages pertinents dans le magasin vectoriel partagé.
2. L'agent du LocataireB traite une demande sémantiquement similaire. Il interroge le magasin vectoriel partagé ; la requête renvoie les passages intégrés du LocataireA comme voisins les plus proches Top-K car ils sont thématiquement similaires et il n'y a pas d'index partitionné par locataire.
3. Les enregistrements clients internes du LocataireA apparaissent dans le contexte de l'agent du LocataireB.

Aucune entrée adversariale n'est requise. La fuite est une défaillance architecturale.

Pour le cadre complet incluant l'injection de prompt (LLM01), voir [sécurité des agents IA et le modèle de menaces OWASP LLM Top 10](/learn/ai-agent-security).

### Fuite de Mémoire : Mémoire de Travail, Magasins Vectoriels et État du Tableau Noir

Trois types de mémoire d'agent nécessitent chacun un traitement d'isolation de locataire séparé :

**Mémoire de travail (fenêtre de contexte en cours)** : la fenêtre de contexte actuelle de l'agent ne doit jamais être partagée entre les requêtes de locataires.

**Mémoire sémantique (magasin vectoriel)** : si on utilise un magasin vectoriel partagé, chaque écriture doit inclure `tenant_id` comme champ de métadonnées obligatoire, et chaque requête doit inclure un filtre de métadonnées `{tenant_id: current_tenant_id}` injecté au niveau de la couche client de stockage.

**État de coordination (tableau noir)** : l'état clé-valeur partagé entre agents doit utiliser des préfixes de clé scopés par locataire, par exemple `projects/{tenant_id}/*`, avec une application ACL au niveau de la couche mesh.

## Isolation des Credentials : Scoping du Vault par Locataire

### Scoping des Credentials par Locataire : Pourquoi les Clés API Partagées Échouent

L'erreur de credentials de multi-tenancy la plus courante est d'utiliser une clé API LLM pour tous les locataires. Cela échoue de quatre façons distinctes : partage de la limite de débit, coût non attribuable, rayon de révocation et isolation d'audit brisée.

Modèle correct : chaque locataire obtient sa propre clé API, ou une sous-clé/espace de travail là où le fournisseur les prend en charge. Pour l'architecture complète du vault, voir [gestion des credentials et modèles de scoping du vault par locataire](/learn/credential-management-ai-agents).

### Anti-Pattern JWT : Scope du Jeton Sans Révocation

Trois atténuations, toutes requises ensemble :

1. **Jetons de courte durée** : TTL de 300 secondes (5 minutes) pour les jetons d'appel d'outils d'agent.
2. **Registre de révocation actif** : une table par locataire des identifiants de jetons valides.
3. **Rotation des jetons par tâche** : émettre un nouveau jeton pour chaque tâche d'agent.

## Isolation d'Exécution : Espaces de Noms Kubernetes et Quotas de Ressources

### Espace de Noms par Locataire : RBAC, NetworkPolicy et ResourceQuota

Quatre composants sont requis :

**Espace de noms par locataire** : les pods d'agent de chaque locataire s'exécutent dans un espace de noms Kubernetes dédié.

**RBAC avec ServiceAccounts scopés par espace de noms** : chaque locataire obtient un ServiceAccount dédié avec des RoleBindings scopés à son propre espace de noms.

**NetworkPolicy avec refus par défaut** : appliquer une politique de refus de tout l'ingress et l'egress à chaque espace de noms de locataire par défaut.

**ResourceQuota avec LimitRange** : appliquer des limites de CPU, de mémoire et de nombre de pods par espace de noms via ResourceQuota.

Pour les contrôles de sandboxing au niveau des processus, voir [sandboxing des agents IA et isolation d'exécution au niveau des processus](/learn/ai-agent-sandboxing).

## Conformité SOC 2 pour les Plateformes d'Agents Multi-Locataires

### CC6.1 : Contrôles d'Accès Logique par Classification des Données

La conformité CC6.1 pour les plateformes d'agents multi-locataires nécessite trois contrôles spécifiques : scope de vault de credentials par locataire, espace de noms de mémoire par locataire et partition de journal d'audit par locataire.

Les auditeurs SOC 2 signalent les clés API partagées utilisées entre locataires comme des déficiences CC6.1. Pour la cartographie complète des contrôles, voir [gouvernance des agents IA et cadres de conformité SOC 2](/learn/ai-agent-governance).

### CC6.6 : Restriction d'Accès Privilégié pour les Agents à Permissions Élevées

La conformité CC6.6 nécessite : la prévention structurelle des appels d'agents privilégiés entre locataires, des définitions de permissions d'agents privilégiés auditables et des enregistrements d'audit par invocation pour les actions privilégiées.

## Partitionnement du Journal d'Audit par Locataire

### Conception de Partition Recommandée

**Modèle de clé de stockage** : `audit/{tenant_id}/{year}/{month}/{day}/{agent_id}/{tool_call_id}.json`

**Politique de bucket S3 par locataire** : un préfixe de bucket séparé avec une politique de ressources séparée par locataire.

**Attributs de ressources OTLP** : inclure `tenant_id` comme attribut de ressource sur chaque enregistrement de journal OpenTelemetry.

**Espace de travail SIEM par locataire** : dans les déploiements SIEM partagés, configurer des index ou espaces de travail par locataire.

Pour la conception complète du journal d'audit, voir [journal d'audit des agents IA et enregistrements de conformité par locataire](/learn/ai-agent-audit-log).

## Anti-Patterns : Ce Qu'Il Ne Faut Pas Faire

### Anti-Pattern 1 : Identifiant Locataire dans le Prompt de l'Agent, pas dans l'Infrastructure

Injecter le `tenant_id` dans le prompt système de l'agent et se fier à l'agent pour appliquer sa propre frontière de locataire est l'anti-pattern de multi-tenancy le plus courant et le plus dangereux. Il échoue par bypass d'injection de prompt, dérive d'hallucination et absence d'application au niveau de l'infrastructure.

### Anti-Pattern 2 : Magasin Vectoriel Partagé Sans Filtres de Locataire

C'est le vecteur principal de fuite de données OWASP LLM06. La correction nécessite un champ de métadonnées `tenant_id` obligatoire à chaque écriture et un filtre de métadonnées injecté au niveau de la couche client de stockage à chaque requête.

### Anti-Pattern 3 : Clé API LLM Partagée avec Revendication de Locataire dans le Prompt

Cet anti-pattern échoue à CC6.1 : partage de limite de débit, échec d'attribution des coûts, rayon de révocation et enregistrements d'audit du fournisseur ne pouvant pas être partitionnés par locataire.

## L'Avis d'OpenLegion : Isolation par Architecture, pas par Convention

OpenLegion applique l'isolation des locataires via trois mécanismes au niveau de l'infrastructure que le code de l'agent ne peut pas contourner : scoping du vault de credentials par projet, ACL d'espace de noms de tableau noir et messagerie entre agents de projets différents bloquée par défaut.

| **Contrôle d'isolation** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Scope de vault de credentials par locataire** | Appliqué par l'infrastructure | Convention développeur | Convention développeur | Convention développeur | Convention développeur |
| **ACL d'espace de noms de tableau noir** | Appliqué par l'infrastructure | Non disponible | Non disponible | Non disponible | Non disponible |
| **Messagerie entre agents de projets bloquée** | Bloquée par défaut | Non disponible | Non disponible | Non disponible | Non disponible |
| **Cap budgétaire par locataire (Zone 2)** | Appliqué par l'infrastructure | Convention développeur | Convention développeur | Convention développeur | Convention développeur |
| **Partition d'audit par locataire (WORM)** | Appliqué par l'infrastructure | Convention développeur | Convention développeur | Convention développeur | Convention développeur |
| **Kubernetes namespace + ResourceQuota** | Géré par la plateforme | Auto-géré | Auto-géré | Auto-géré | Auto-géré |

Pour la couche d'infrastructure hébergée, voir [plateforme d'agents IA gérée avec garanties d'isolation des locataires](/learn/ai-agent-platform).

<!-- SCHEMA: FAQPage -->

## Foire Aux Questions

### Qu'est-ce que la multi-tenancy des agents IA ?

La multi-tenancy des agents IA est la propriété architecturale d'une plateforme d'agents qui garantit que les agents servant différents locataires ne peuvent pas accéder aux credentials, à la mémoire, au contexte d'exécution ou aux enregistrements d'audit les uns des autres, appliquée au niveau de l'infrastructure plutôt que par convention de développeur. Elle diffère de la multi-tenancy traditionnelle des applications web en nécessitant trois dimensions d'isolation supplémentaires : le scoping du vault de credentials par locataire, le partitionnement de la mémoire par locataire et le partitionnement du journal d'audit par locataire.

### Qu'est-ce qu'OWASP LLM06 et comment affecte-t-il les systèmes d'agents multi-locataires ?

OWASP LLM Top 10 v1.1 LLM06 Sensitive Information Disclosure classe les fuites de données entre locataires comme de haute sévérité : le scénario où un agent traite les données du LocataireA, stocke les documents récupérés dans une couche de mémoire partagée sans partitionnement par locataire, puis les affiche dans une réponse du LocataireB. L'attaque ne nécessite aucune entrée adversariale. L'atténuation nécessite un partitionnement de la mémoire par locataire au niveau de la couche client de stockage, un scoping des credentials par locataire et des partitions de journaux d'audit par locataire.

### Comment SOC 2 CC6.1 et CC6.6 s'appliquent-ils aux plateformes d'agents multi-locataires ?

SOC 2 Type II CC6.1 exige que l'accès logique soit restreint en fonction de la classification des données ; dans un système d'agents multi-locataires, la frontière de locataire est la limite de classification primaire. CC6.6 s'applique aux agents avec des permissions d'outils élevées ; ces agents sont fonctionnellement des utilisateurs privilégiés et doivent être structurellement empêchés de traiter des demandes en dehors de leur scope de locataire assigné. Une clé API partagée utilisée entre locataires sera généralement signalée comme une déficience CC6.1.

### Quelle est la vulnérabilité du TTL des jetons JWT dans les systèmes d'agents multi-locataires ?

Les jetons d'accès JWT utilisés pour le contexte de locataire dans les appels d'outils d'agent expirent généralement après 3 600 secondes (1 heure) ; si un jeton émis pour le LocataireA est mis en cache incorrectement, partagé par un bug d'infrastructure ou capturé dans un journal de débogage, il peut être utilisé pour effectuer des appels authentifiés attribués au LocataireA pendant toute la durée de TTL sans détection. L'atténuation nécessite trois contrôles appliqués ensemble : jetons de courte durée avec TTL de 300 secondes, registre de révocation actif par locataire et rotation des jetons par tâche.

### Comment fonctionne l'isolation des espaces de noms Kubernetes pour les agents multi-locataires ?

L'isolation des espaces de noms Kubernetes fournit une isolation d'exécution par quatre composants : un espace de noms dédié par locataire, RBAC avec ServiceAccounts par locataire et RoleBindings scopés par espace de noms, NetworkPolicy avec refus par défaut et liste blanche explicite pour les points de terminaison externes requis, et ResourceQuota avec limites de calcul par espace de noms. L'isolation des espaces de noms adresse la dimension de calcul de la multi-tenancy et doit être combinée avec le scoping des credentials par locataire et le partitionnement de la mémoire.

### Quel est l'anti-pattern du magasin vectoriel partagé dans les systèmes d'agents multi-locataires ?

Utiliser un magasin vectoriel partagé sans filtres de locataire obligatoires par requête injectés au niveau de la couche client de stockage est le vecteur principal de fuite OWASP LLM06. La mise en oeuvre correcte nécessite un champ de métadonnées `tenant_id` sur chaque écriture et un filtre de métadonnées injecté au niveau de la couche client du magasin vectoriel sur chaque requête. Pour les exigences de conformité strictes, des espaces de noms par locataire ou des index séparés appliquent l'isolation au niveau de l'adresse de stockage.

### Comment OpenLegion applique-t-il l'isolation des locataires ?

OpenLegion applique l'isolation des locataires via trois mécanismes au niveau de l'infrastructure : le scoping du vault de credentials par projet (Zone 2 résout les handles `$CRED{}` en utilisant le contexte de projet authentifié de la session mesh, pas des paramètres fournis par l'agent ; la résolution de credentials entre projets est architecturalement impossible), les ACL d'espace de noms de tableau noir (les agents ont des permissions de lecture et d'écriture uniquement pour le préfixe de clé de leur projet, appliquées par le superviseur mesh) et la messagerie entre agents de projets bloquée par défaut.

### Quels sont les trois modèles d'architecture de multi-tenancy pour les plateformes d'agents ?

Les trois modèles de multi-tenancy ont des garanties d'isolation et des profils de coûts différents : le modèle Silo (shared-nothing) donne à chaque locataire une infrastructure entièrement dédiée ; le modèle Pool partage toute l'infrastructure avec une isolation appliquée uniquement au niveau de la couche applicative ; le modèle Bridge partage l'infrastructure de calcul tout en appliquant l'isolation au niveau du plan de contrôle via des scopes de vault de credentials par locataire et des ACL d'espace de noms de mémoire. Le modèle Bridge est la valeur par défaut recommandée pour le SaaS B2B.
