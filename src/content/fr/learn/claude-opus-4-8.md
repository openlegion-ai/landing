---
title: Claude Opus 4.8 - Capacités, coût et performance agentique
description: "Claude Opus 4.8 lancé le 28 mai 2026 : 84% sur Online-Mind2Web, mode rapide 3x moins cher, workflows dynamiques dans Claude Code, premier Opus à compléter chaque cas du benchmark Super-Agent à parité de coût GPT-5.5."
slug: /learn/claude-opus-4-8
primary_keyword: claude opus 4.8
secondary_keywords:
  - claude opus 4.8 api
  - claude opus 4.8 benchmarks
  - claude opus 4.8 vs gpt-5.5
  - claude opus 4.8 fast mode
  - claude opus 4.7 vs opus 4.8
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /learn/ai-agent-orchestration
  - /comparison/langgraph
  - /comparison/autogen
---

# Claude Opus 4.8 : Performance agentique, tarification du mode rapide et ce qui a changé depuis Opus 4.7

Claude Opus 4.8 est la mise à niveau de la classe Opus d'Anthropic du 28 mai 2026. Il obtient 84% sur la précision des agents browser Online-Mind2Web, est le premier modèle à compléter chaque cas d'un benchmark Super-Agent à parité de coût GPT-5.5, et corrige la régression de verbosité des appels d'outils d'Opus 4.7. Le mode rapide fonctionne à une vitesse 2,5x et est tarifé 3x moins cher que le mode rapide pour les modèles Opus précédents. La tarification API standard est inchangée par rapport à 4.7. L'identifiant du modèle API est `claude-opus-4-8-20260528`.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce que Claude Opus 4.8 ?**
> Claude Opus 4.8 est la mise à niveau d'Anthropic de la classe de modèles Opus de mai 2026 : un grand modèle de langage de niveau frontier optimisé pour les tâches agentiques de longue durée, le raisonnement multi-étapes et l'utilisation autonome d'outils. Il présente des performances de benchmark améliorées par rapport à Opus 4.7, des corrections de régressions de fiabilité des appels d'outils et un mode rapide (réflexion étendue à 2,5x la vitesse) tarifé 3x moins cher que le mode rapide pour les modèles Opus précédents.

## L'avis d'OpenLegion : Le modèle qui change l'économie agentique

Opus 4.8 est le modèle que nous recommandons pour tout agent effectuant un travail agentique substantiel à partir de mai 2026. Trois choses ont changé par rapport à Opus 4.7 qui importent pour les flottes d'agents en production.

Premièrement : la correction de la fiabilité des appels d'outils. Scott Wu (PDG de Cognition / Devin) a confirmé publiquement qu'Opus 4.7 avait introduit des incohérences de verbosité des commentaires et d'appels d'outils qui dégradaient la fiabilité d'ingénierie autonome de Devin. Opus 4.8 corrige les deux. Pour les agents dans des boucles d'utilisation d'outils serrées, c'est la différence entre un modèle qui nécessite des corrections fréquentes et un qui complète les tâches proprement.

Deuxièmement : 84% sur Online-Mind2Web (surpassant GPT-5.5) et le premier passage complet du benchmark Super-Agent à parité de coût GPT-5.5. Online-Mind2Web mesure l'accomplissement réel de tâches basées sur un navigateur. Le benchmark Super-Agent couvrait la traduction, la recherche approfondie, la création de diapositives et l'analyse de bout en bout. Opus 4.8 a complété chaque cas ; GPT-5.5 ne l'a pas fait.

Troisièmement : mode rapide 3x moins cher. Databricks a signalé un coût de token 61% moins cher par rapport à Opus 4.7 pour leur agent Genie. Pour les tâches de longue durée où vous choisissiez auparavant Sonnet pour le coût et acceptiez une qualité inférieure, le mode rapide Opus 4.8 change le calcul.

L'annonce d'Anthropic est venue le même jour que leur Série H à 65 milliards USD à une valorisation post-money de 965 milliards USD.

OpenLegion prend en charge l'intégralité du catalogue de modèles API Anthropic. Définir `claude-opus-4-8-20260528` comme valeur par défaut de votre flotte est un changement de configuration unique. Les appels API isolés par coffre-fort, les plafonds budgétaires par agent et l'exécution isolée par conteneur s'appliquent automatiquement, [ce que fournit une plateforme d'agents IA pour exécuter Opus 4.8 avec des contrôles budgétaires et une isolation par coffre-fort](/learn/ai-agent-platform).

## Performance des benchmarks : Ce que montrent les chiffres

### Online-Mind2Web : 84% de précision d'agent browser

Online-Mind2Web est un benchmark pour l'accomplissement de tâches agentiques basées sur un navigateur : remplir des formulaires, naviguer dans des flux multi-pages, extraire des informations depuis des interfaces web en direct. Claude Opus 4.8 a obtenu 84% sur Online-Mind2Web en mai 2026, surpassant Claude Opus 4.7 et GPT-5.5. C'est le score le plus élevé publié sur ce benchmark à la date de lancement d'Opus 4.8. Pour les développeurs déployant des agents d'automatisation de navigateur, c'est le chiffre opérationnel.

### Benchmark Super-Agent : Premier passage complet à parité de coût GPT-5.5

Kay Zhu, co-fondateur et CTO, a rapporté que Claude Opus 4.8 est le premier modèle à compléter chaque cas de bout en bout sur leur benchmark Super-Agent interne couvrant : la traduction à grande échelle, la synthèse de recherche approfondie, la construction de présentations à partir de données brutes et l'analyse multi-sources. GPT-5.5 n'a pas complété chaque cas. Opus 4.8 a atteint cela à parité de coût GPT-5.5.

### CursorBench : Appels d'outils plus efficaces à chaque niveau d'effort

Le benchmark de codage interne de Cursor mesure la qualité de génération de code et l'efficacité d'utilisation des outils. Claude Opus 4.8 surpasse les modèles Opus précédents à chaque niveau d'effort sur CursorBench : moins de tokens gaspillés sur des commentaires verbeux signifie que plus du budget de tokens est consacré au travail réel.

### Benchmark Legal Agent : Premier à dépasser le standard all-pass de 10%

Leya (une plateforme d'IA juridique), rapporté par Niko Grupen (responsable de la recherche appliquée), a confirmé que Claude Opus 4.8 est le premier modèle à dépasser 10% sur le standard all-pass du Legal Agent Benchmark. Le standard all-pass exige que chaque étape d'un workflow juridique multi-étapes soit correcte : une seule erreur fait échouer le cas entier.

### Databricks Genie : 61% moins cher qu'Opus 4.7

Databricks a rapporté que Claude Opus 4.8 offre un coût de token 61% moins cher par rapport à Opus 4.7 pour leur agent Genie, un agent IA pour l'analyse de données et le travail de connaissance utilisant le raisonnement multimodal sur les PDF et les diagrammes.

## Ce qui a changé par rapport à Opus 4.7

### Correction des appels d'outils : La régression de verbosité qui a nui à Devin et aux charges de travail autonomes

Claude Opus 4.7 a introduit une régression dans le comportement des appels d'outils que plusieurs équipes de production ont remarquée indépendamment : les agents produisaient des commentaires en ligne excessifs, enveloppaient les sorties avec de la prose explicative inutile et faisaient parfois des appels d'outils en double ou redondants.

Scott Wu (PDG de Cognition / Devin) a confirmé publiquement qu'Opus 4.7 avait des "problèmes de verbosité des commentaires et d'appels d'outils" qu'Opus 4.8 corrige. Les équipes qui avaient rétrogradé d'Opus 4.7 à Opus 4.6 pour la fiabilité de l'utilisation des outils devraient réévaluer avec Opus 4.8.

### Workflows dynamiques dans Claude Code

Claude Code bénéficie de workflows dynamiques avec Opus 4.8 : la capacité à s'attaquer à des problèmes à grande échelle en créant, séquençant et gérant des structures de workflow multi-étapes. Claude Code peut planifier une grande migration de base de code, créer des sous-tâches, les exécuter en séquence tout en suivant l'état intermédiaire et adapter son plan en fonction des résultats à chaque étape. Disponible dans Claude Code utilisant Opus 4.8 à partir du 28 mai 2026.

### Mode rapide : Vitesse 2,5x à 3x moins cher

Le mode rapide pour Claude Opus 4.8 fonctionne à 2,5x la vitesse de l'Opus standard en utilisant la réflexion étendue, et est tarifé 3x moins cher que le mode rapide pour les modèles Opus précédents incluant Opus 4.7. La tarification standard (hors mode rapide) est inchangée par rapport à Opus 4.7.

Le mode rapide est activé via le paramètre `budget_tokens` dans la configuration de réflexion étendue de l'API. Définir `budget_tokens` à une valeur inférieure active le comportement du mode rapide.

## Référence API et tarification

### Identifiant du modèle

L'identifiant du modèle API pour Claude Opus 4.8 est `claude-opus-4-8-20260528`. Utilisez cette chaîne dans le paramètre `model` de tout appel API Anthropic, dans le champ d'ID de modèle Amazon Bedrock ou dans la référence de modèle Google Cloud Vertex AI.

### Disponibilité

Claude Opus 4.8 est disponible via trois canaux : l'API Anthropic directement (api.anthropic.com), Amazon Bedrock et Google Cloud Vertex AI. Les trois canaux prennent en charge le même ensemble de fonctionnalités incluant la réflexion étendue et le mode rapide.

### Fenêtre de contexte

Claude Opus 4.8 utilise la même fenêtre de contexte qu'Opus 4.7 (200K tokens) et la même tarification standard des tokens d'entrée/sortie. Les améliorations de coût sont concentrées dans le mode rapide.

## Quand utiliser Opus 4.8 vs Sonnet 4 vs Opus 4.7

### Opus 4.8 : Tâches agentiques de longue durée, automatisation de navigateur, codage à grande échelle

Choisissez Opus 4.8 quand la qualité de la tâche est la contrainte. Les agents autonomes de longue durée dans des boucles d'utilisation d'outils serrées bénéficient de la correction de fiabilité des appels d'outils. Les agents d'automatisation de navigateur (Online-Mind2Web : 84%) surpassent tout autre modèle pour ce type de tâche. L'analyse juridique et financière nécessitant un chaînage sans erreur est le domaine d'Opus 4.8.

Pour les [frameworks d'agents IA qui accèdent à Claude Opus 4.8 via l'API Anthropic](/learn/ai-agent-frameworks), le chemin de migration est un échange d'identifiant de modèle vers `claude-opus-4-8-20260528`.

### Sonnet 4 : Pipelines à volume élevé et sensibles à la latence

Choisissez Sonnet 4 quand le volume et la latence sont la contrainte. Appels API à haute fréquence où le coût par token détermine l'économie unitaire, pipelines de réponse en temps réel où la latence est visible pour les utilisateurs finaux. Sonnet 4 et le mode rapide Opus 4.8 occupent maintenant des niveaux de coût/qualité adjacents : les équipes devraient comparer les deux pour leur charge de travail spécifique.

### Quand Opus 4.7 s'applique encore

Le seul cas pour rester sur Opus 4.7 : les prompts spécifiquement accordés à ses modèles de verbosité. Si votre pipeline post-traite la sortie d'Opus et s'appuie sur la structure de commentaires générée par Opus 4.7, restez sur 4.7 jusqu'à ce que vous ayez le temps de vous adapter. Testez sur Opus 4.8 avant de migrer les prompts de production.

Pour la [conception de workflows agentiques et comment les améliorations de jugement d'Opus 4.8 changent la fiabilité d'exécution](/learn/ai-agent-orchestration), la correction des appels d'outils est le changement le plus impactant pour les workflows avec cinq appels d'outils ou plus par tâche.

## OpenLegion et Claude Opus 4.8

OpenLegion prend en charge `claude-opus-4-8-20260528` comme option de modèle de flotte. Le définir comme valeur par défaut pour un agent est un seul champ dans la configuration de l'agent :

```
model: anthropic/claude-opus-4-8-20260528
```

Tous les contrôles de sécurité d'OpenLegion s'appliquent automatiquement aux appels Opus 4.8 : injection d'identifiants via le proxy coffre-fort (la clé API n'entre jamais dans le conteneur de l'agent), plafonds budgétaires quotidiens et mensuels par agent (une boucle incontrôlée Opus 4.8 ne peut pas épuiser votre quota API sans atteindre le plafond), isolation des conteneurs Docker et journalisation complète des audits.

Pour les comparaisons multi-agents, voir [OpenLegion vs LangGraph lors du déploiement d'Opus 4.8 dans une architecture de flotte graphique vs plate](/comparison/langgraph) et [OpenLegion vs AutoGen avec Opus 4.8 dans des systèmes multi-agents à processus partagé vs conteneur isolé](/comparison/autogen).

## Commencer avec Claude Opus 4.8 sur OpenLegion

**Définissez `claude-opus-4-8-20260528` comme valeur par défaut de votre flotte. Isolé par coffre-fort, limité en budget, prêt pour la production.**
[Commencer](https://app.openlegion.ai) | [Lire la documentation](https://docs.openlegion.ai) | [Voir la plateforme](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Questions fréquemment posées

### Qu'est-ce que Claude Opus 4.8 ?

Claude Opus 4.8 est la mise à niveau d'Anthropic de la classe de modèles Opus, annoncée le 28 mai 2026. Il s'appuie sur Claude Opus 4.7 avec un meilleur jugement agentique, de meilleures performances de benchmark sur le codage, le raisonnement et le travail de connaissance professionnel, et des corrections aux problèmes de verbosité des appels d'outils qui affectaient les charges de travail autonomes d'Opus 4.7. Il introduit des workflows dynamiques dans Claude Code pour les problèmes multi-étapes à grande échelle et un mode rapide à 2,5x la vitesse maintenant 3x moins cher que le mode rapide pour les modèles Opus précédents.

### Comment Claude Opus 4.8 se compare-t-il à GPT-5.5 ?

Sur les benchmarks pertinents pour les tâches agentiques, Claude Opus 4.8 surpasse ou égale GPT-5.5 dans plusieurs évaluations indépendantes. Sur Online-Mind2Web, Opus 4.8 a obtenu 84%, surpassant GPT-5.5. Sur un benchmark Super-Agent interne, Opus 4.8 a été le premier modèle à compléter chaque cas de bout en bout, battant GPT-5.5 à parité de coût. Sur le Legal Agent Benchmark, Opus 4.8 est le premier à dépasser 10% sur le standard all-pass.

### De combien le mode rapide de Claude Opus 4.8 est-il moins cher par rapport à Opus 4.7 ?

Le mode rapide pour Claude Opus 4.8 fonctionne à 2,5x la vitesse normale en utilisant la réflexion étendue et est tarifé 3x moins cher que le mode rapide pour les modèles Opus précédents incluant Opus 4.7. La tarification standard Opus 4.8 (hors mode rapide) est inchangée par rapport à Opus 4.7. Databricks a signalé un coût de token 61% moins cher par rapport à Opus 4.7 pour leur agent Genie.

### Quels étaient les problèmes d'appels d'outils d'Opus 4.7 qu'Opus 4.8 corrige ?

Claude Opus 4.7 a introduit des incohérences de verbosité des commentaires et d'appels d'outils qui réduisaient la fiabilité pour les charges de travail d'ingénierie autonome. Cognition (fabricants de l'agent de codage autonome Devin) a rapporté via le PDG Scott Wu qu'Opus 4.7 était moins cohérent qu'Opus 4.6, et qu'Opus 4.8 corrige à la fois la régression de verbosité des commentaires et les incohérences des appels d'outils. Les équipes utilisant Opus 4.7 dans des boucles d'utilisation d'outils serrées qui ont observé des sorties plus bruyantes ou plus d'étapes de correction que prévu devraient tester Opus 4.8 comme remplacement direct.

### Quel est l'identifiant du modèle API de Claude Opus 4.8 ?

L'identifiant du modèle API pour Claude Opus 4.8 est `claude-opus-4-8-20260528`. Il est disponible via l'API Anthropic directement, Amazon Bedrock et Google Cloud Vertex AI. Le mode rapide (réflexion étendue à 2,5x la vitesse) est activé via le paramètre `budget_tokens` dans la configuration de réflexion étendue. La tarification standard est identique à Opus 4.7 ; la tarification du mode rapide est 3x inférieure à celle du mode rapide pour les modèles Opus précédents.

### Que sont les workflows dynamiques dans Claude Code avec Opus 4.8 ?

Les workflows dynamiques est une fonctionnalité de Claude Code lancée avec Opus 4.8 qui permet de s'attaquer à des problèmes à grande échelle en créant, séquençant et gérant dynamiquement des structures de workflow multi-étapes. Claude Code peut planifier une grande migration de codebase, créer des sous-tâches, les exécuter en séquence tout en suivant l'état, et s'adapter en fonction des résultats intermédiaires. Cela rend Claude Code viable pour les grandes migrations de codebase, les builds de fonctionnalités complets couvrant plusieurs fichiers et services, et les changements multi-dépôts.
