---
title: "Hébergement managé d'agents IA : flottes d'agents sécurisées"
description: >-
  Hébergement managé d'agents IA par OpenLegion : des équipes d'agents
  sécurisées dans une application web hébergée, identifiants en coffre-fort,
  budgets par agent, aucun VPS dédié ni infrastructure à gérer.
slug: /learn/managed-ai-agent-hosting
primary_keyword: hébergement managé d'agents IA
secondary_keywords:
  - host ai agents
  - managed ai agent platform
  - hosted ai agents
  - ai agent hosting service
  - dedicated vps for ai agents
  - ai agent infrastructure
  - cloud ai agent hosting
  - secure ai agent hosting
date_published: 2026-05
last_updated: 2026-05
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /comparison
---

# Hébergement managé d'agents IA pour des flottes d'agents sécurisées

Vous vouliez une main-d'œuvre IA. Ce que vous avez obtenu, c'est un second emploi en DevOps. L'hébergement managé d'agents IA vous rend ce travail. Il fait tourner les serveurs, l'isolation, le coffre-fort d'identifiants et les budgets dont vos agents ont besoin, de sorte que vous n'en provisionnez rien vous-même. OpenLegion est une application web hébergée : connectez-vous avec Google et démarrez, sans rien à installer ni VPS dédié à louer, vos clés gardées dans un coffre-fort que les agents ne touchent jamais et un budget sur chaque agent par défaut. Vous apportez un objectif ; nous faisons tourner le socle en dessous.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce que l'hébergement managé d'agents IA ?**
> L'hébergement managé d'agents IA est un service qui provisionne, isole, sécurise et exploite l'infrastructure sur laquelle tournent les agents IA autonomes : conteneurs, stockage des identifiants, budgets, réseau et un tableau de bord de contrôle, afin qu'une équipe puisse déployer des flottes d'agents sans construire ni maintenir cette infrastructure elle-même.

## En bref

- L'hébergement managé d'agents IA supprime le travail entre vous et une flotte en marche : pas de configuration de serveur, pas de réglage Docker, pas de coffre-fort à exploiter.
- Les agents sont des enregistrements durables, pas des serveurs : en créer un est instantané, un agent inactif ne coûte rien, et un espace de travail peut en faire tourner des centaines.
- Les identifiants vivent dans un coffre-fort et sont injectés hors du modèle, qui ne détient jamais qu'une référence, de sorte qu'un agent compromis ne peut pas les lire.
- Chaque agent porte son propre budget, et chaque unité de travail est un réveil enregistré mesuré en crédits à $0,001 l'unité.
- Le moteur est publié en source-disponible sous PolyForm Perimeter License 1.0.1 ; la plateforme hébergée est propriétaire.
- Le forfait gratuit est à $0 avec 1,000 crédits uniques et sans carte ; Pro est à $29/mois avec 10,000 crédits ; Team à $99/mois avec 35,000.

## Le coût caché de « faire simplement tourner un agent »

Mettre sur pied un seul agent est l'affaire d'un week-end. Faire tourner une flotte à laquelle vous pouvez vous fier est l'affaire d'un trimestre.

Quelque part entre le prototype et la production, le travail change discrètement de forme. Vous cessez de régler des prompts et commencez à régler des conteneurs. Vous cessez de penser à ce que l'agent devrait dire et commencez à penser à l'endroit où vivent ses clés API, à ce qui se passe quand l'un d'eux boucle à 3 h du matin, et à comment empêcher un agent compromis d'atteindre les neuf autres. Rien de tout cela n'est le travail que vous vous étiez fixé. Tout cela est le travail qui détermine si les agents sont sûrs à laisser tourner.

L'hébergement managé existe pour absorber exactement cette couche. Avec l'offre hébergée d'OpenLegion, vous obtenez :

- **Une application web hébergée** sans rien à installer ni VPS dédié à louer : connectez-vous avec Google et démarrez.
- **Une exécution en bac à sable pour chaque tâche** : chaque tâche s'exécute à la demande puis s'arrête, et le code que l'agent écrit n'a aucun accès réseau par défaut.
- **Un coffre-fort d'identifiants** qui détient les clés API et les jetons OAuth entièrement hors du modèle, lequel ne détient jamais qu'une référence.
- **L'application des budgets par agent** avec coupures strictes, de sorte qu'un agent qui boucle ne peut pas générer une facture-surprise.
- **Un tableau de bord de contrôle** pour déployer des templates, discuter avec les agents, surveiller le coût et la santé en direct, et mettre en pause tout ce qui dérape.
- **Des crédits inclus** sur chaque plan, renouvelés chaque mois, avec des modèles choisis par préréglage : Smartest, Smart ou Normal.

## Hébergement managé vs auto-hébergement : comment choisir

La plateforme d'OpenLegion est hébergée uniquement, et le moteur en dessous est publié en source-disponible. La comparaison ci-dessous porte sur le compromis général entre exploiter soi-même l'infrastructure d'agents et la faire exploiter pour soi.

| Critère | Auto-hébergé (PolyForm Perimeter License 1.0.1) | Hébergement managé |
|---|---|---|
| Qui exploite les serveurs | Vous | OpenLegion |
| Temps de mise en place | Trois commandes sur votre machine | Connectez-vous avec Google, rien à installer |
| Coffre-fort d'identifiants | Vous l'exploitez | Exploité pour vous, hors du modèle |
| Mises à jour et correctifs | Vous tirez et redéployez | Appliqués pour vous |
| Résidence des données | Entièrement sur votre infrastructure | Sur la plateforme hébergée que nous exploitons |
| Idéal pour | Réglementé, air-gapped, contrôle total | Équipes qui veulent une équipe en marche aujourd'hui |
| Modèle de coût | Vos propres coûts de serveur | Gratuit $0, Pro $29/mois, Team $99/mois |

Choisissez l'auto-hébergement quand la conformité, la résidence des données ou le contrôle total de l'hôte l'emportent sur le coût de son exploitation. Choisissez l'hébergement managé quand vous voulez des agents au travail cet après-midi et préférez ne pas posséder un coffre-fort, un runtime et une cadence de mises à jour. OpenLegion ne propose que la plateforme hébergée au lancement : il n'y a donc aucune plateforme auto-hébergée vers laquelle migrer.

## Ce qui se passe quand vous cliquez sur Déployer

Connectez-vous avec Google et votre espace de travail est prêt — il n'y a rien à provisionner. Un assistant est créé avec lui, et il crée les coéquipiers dont il a besoin. À partir de là, vous décrivez l'équipe que vous voulez (un pôle de recherche, un pipeline commercial, un studio de contenu) et la plateforme crée chaque rôle comme un enregistrement durable avec sa propre mémoire, son budget et ses autorisations d'outils.

Les agents se coordonnent via la [couche d'orchestration](/learn/ai-agent-orchestration) : le travail s'organise des objectifs aux tâches aux agents, avec des réveils sur événement et une délégation entre coéquipiers. Chaque action est une intention vérifiée par un moteur de politiques unique avant qu'elle n'ait lieu, ce qui garde le comportement auditable et les coûts prévisibles. Vous parlez aux agents dans le chat web sur tous les forfaits, via Telegram et les webhooks dès Pro, ou Slack et l'e-mail entrant sur Team et au-delà.

## Une sécurité que vous n'avez pas à construire

La partie la plus difficile de l'hébergement sûr d'agents est celle que les équipes sautent le plus souvent, car elle est invisible jusqu'à ce qu'elle échoue. Le plan managé d'OpenLegion applique la même défense en profondeur décrite dans le modèle [sécurité des agents IA](/learn/ai-agent-security), activée par défaut :

- Une exécution en bac à sable pour chaque tâche, sans processus d'agent durable à compromettre.
- Un coffre-fort d'identifiants qui les injecte hors du modèle, de sorte que les agents ne détiennent jamais de clés brutes.
- Une matrice d'autorisations par agent régissant quels outils, fichiers et opérations chaque agent peut utiliser.
- Désinfection des entrées, protection SSRF et durcissement contre l'injection de prompt à chaque frontière.
- Des plafonds de budget par agent qui échouent en mode fermé.

Vous héritez de tout cela en vous inscrivant, pas en lisant un guide de durcissement et en le mettant en œuvre vous-même. Pour le runtime sous-jacent, voir l'aperçu de la [plateforme d'agents IA](/learn/ai-agent-platform).

## Tarification et ce que vous payez

Le forfait gratuit est à $0 avec 1,000 crédits uniques et sans carte ; Pro est à $29/mois avec 10,000 crédits ; Team à $99/mois avec 35,000 ; Enterprise démarre à $1,500. Le travail est mesuré en crédits à $0,001 l'unité, et le coût exact de chaque tâche est visible. Les crédits inclus se renouvellent chaque mois ; les packs de crédits achetés n'expirent jamais. La facturation passe par Stripe, et une page de garantie de remboursement en fixe les conditions. Comparez les limites des plans sur la [page tarifs](/pricing).

## Le point de vue d'OpenLegion

La plupart de l'« hébergement d'agents IA » sur le marché est un processus partagé faisant tourner les agents de tout le monde, des clés posées dans la configuration, aucune véritable application des budgets. C'est acceptable pour une démo et dangereux en production, car les modes de défaillance qui vous coûtent réellement (un identifiant divulgué, une boucle de coût incontrôlée, un agent compromis atteignant un autre locataire) sont précisément ceux que l'infrastructure partagée aggrave. L'hébergement managé ne vaut le coup que s'il vous achète une isolation et une sécurité des identifiants que vous devriez sinon construire à la main. Notre position est que ces garanties devraient être le défaut et identiques dans les versions hébergée et auto-hébergée, de sorte que le seul vrai choix restant soit qui exploite la machine.

## CTA

**Déployez une équipe d'agents sécurisée sans exploiter l'infrastructure.**
[Commencer](https://app.openlegion.ai) | [Voir les tarifs](/pricing) | [Lire la documentation](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Qu'est-ce que l'hébergement managé d'agents IA ?

L'hébergement managé d'agents IA est un service qui provisionne et exploite l'infrastructure dont les agents IA autonomes ont besoin (conteneurs isolés, coffre-fort d'identifiants, application des budgets, réseau et un tableau de bord de contrôle) afin qu'une équipe puisse déployer et faire tourner des flottes d'agents sans construire ni maintenir cette infrastructure. Avec OpenLegion, vous vous connectez avec Google et démarrez : il n'y a rien à installer ni de VPS dédié à louer.

### En quoi l'hébergement managé diffère-t-il de l'auto-hébergement d'OpenLegion ?

OpenLegion est une application web hébergée, et il n'existe aucune plateforme auto-hébergée au lancement. L'auto-hébergement en général signifie que vous exploitez les serveurs, opérez le coffre-fort et appliquez les mises à jour vous-même, ce qui convient aux environnements réglementés ou air-gapped. L'hébergement managé signifie qu'OpenLegion exploite la plateforme, opère le coffre-fort et applique les correctifs pour vous. Le moteur en dessous est publié en source-disponible sous PolyForm Perimeter License 1.0.1 ; la plateforme hébergée est propriétaire.

### Est-il sûr d'héberger des agents IA qui détiennent mes clés API et de portefeuille ?

Oui, lorsque les clés ne vivent jamais à l'intérieur de l'agent. Sur OpenLegion, les clés API et les jetons OAuth sont conservés dans un coffre-fort et injectés hors du modèle, qui ne détient jamais qu'une référence, de sorte que même un agent totalement compromis ne peut pas lire ni exfiltrer le secret. OpenLegion ne détient ni clés de portefeuille ni fonds d'agents.

### Combien coûte l'hébergement managé d'agents IA ?

Le forfait gratuit est à $0 avec 1,000 crédits uniques et sans carte ; Pro est à $29/mois avec 10,000 crédits ; Team à $99/mois avec 35,000 ; Enterprise démarre à $1,500. Les frais couvrent la plateforme hébergée, le coffre-fort d'identifiants, le tableau de bord et les crédits inclus du forfait — il n'y a aucun VPS dédié à payer. Le travail est mesuré en crédits à $0,001 l'unité, les crédits inclus se renouvellent chaque mois, et les packs de crédits achetés n'expirent jamais.

### Dois-je connaître Docker ou le DevOps pour utiliser l'hébergement managé ?

Non. OpenLegion est une application web hébergée : connectez-vous avec Google et démarrez, il n'y a rien à installer. Vous travaillez via un tableau de bord : décrivez l'équipe que vous voulez, et l'assistant crée les coéquipiers nécessaires. Docker, Python et l'administration de serveur n'en font pas partie du tout.

### Puis-je passer de l'hébergement managé à l'auto-hébergement plus tard ?

Oui. Le plan managé et la distribution auto-hébergée font tourner le même moteur, source-disponible sous PolyForm Perimeter License 1.0.1. Il n'existe aucune couche de verrouillage propriétaire qui bloquerait la migration, de sorte que les équipes commencent couramment en hébergement managé pour aller vite et basculent vers une infrastructure auto-hébergée une fois que la conformité ou le coût le justifie.

### Combien d'agents puis-je héberger sur un plan managé ?

Les limites d'agents évoluent avec le niveau de plan, d'une petite équipe sur le plan d'entrée jusqu'à de grandes équipes sur les niveaux supérieurs, avec des limites personnalisées pour l'entreprise. Les agents sont des enregistrements durables plutôt que des serveurs : en créer un est instantané et un agent inactif ne coûte rien — chaque agent compte pour un dans la limite, de sorte qu'une équipe à trois rôles comme une Dev Team compte pour trois agents.
