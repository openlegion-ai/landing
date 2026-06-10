---
title: "Mémoire des Agents IA : Quatre Types, Risques Sécurité et Implémentation"
description: "Mémoire des agents IA : in-context, vector store, K-V structuré et types épisodiques. Risques de sécurité liés au memory poisoning et à l'exposition des credentials. Architecture vault d'OpenLegion."
slug: /learn/ai-agent-memory
primary_keyword: ai agent memory
secondary_keywords:
  - gestion mémoire agent
  - types mémoire ia
  - mémoire persistante agent
  - attaque memory poisoning
  - fenêtre contexte agent
date_published: "2026-05-01"
last_updated: "2026-05-22"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison/langgraph
  - /comparison/crewai
---

# Mémoire des Agents IA : Contexte Persistant pour les Systèmes Autonomes

La mémoire des agents IA permet un contexte persistant, l'apprentissage et la coordination entre sessions pour les systèmes IA autonomes opérant au-delà des conversations en un seul échange. La mémoire transforme les modèles de langage sans état en agents avec état capables d'accumuler des connaissances, de maintenir des relations et d'améliorer leurs performances par l'expérience. Quatre types de mémoire distincts servent des objectifs différents : les tokens in-context pour le rappel immédiat, les vector stores sémantiques pour la récupération par similarité, les systèmes clé-valeur structurés pour les données organisées, et les journaux épisodiques pour l'apprentissage procédural. Les architectures de mémoire partagée introduisent des risques de sécurité incluant les attaques de memory poisoning et les vulnérabilités d'exposition des credentials.

<!-- SCHEMA: DefinitionBlock -->

> **Qu'est-ce que la mémoire des agents IA et pourquoi est-ce important ?**
> La mémoire des agents IA est le système de stockage et de récupération persistant qui permet aux agents autonomes de maintenir le contexte, d'accumuler des connaissances et de se coordonner entre sessions au-delà de la fenêtre de tokens éphémère des modèles de langage. La mémoire est essentielle pour l'autonomie des agents, l'apprentissage et la coordination multi-agent dans les systèmes de production.

## Quatre Types de Mémoire des Agents IA

### Mémoire In-Context : La Fenêtre de Tokens

**La mémoire éphémère** existe dans la fenêtre de contexte du modèle de langage, typiquement 32K-200K tokens selon le modèle. Cette mémoire inclut les prompts système, l'historique des conversations, les sorties des outils et le contexte de travail immédiat. La mémoire in-context offre le rappel le plus rapide mais disparaît lorsque la fenêtre de contexte se remplit ou que la session se termine.

**La gestion du contexte** devient critique lorsque les conversations dépassent les limites de tokens. Les systèmes doivent décider quelles informations conserver en contexte versus déplacer vers un stockage persistant.

**Les implications de coût** évoluent linéairement avec la longueur du contexte car chaque appel LLM retraite l'intégralité de la fenêtre de contexte. Un contexte de 100K tokens coûte environ 10x plus qu'un contexte de 10K tokens.

**La compression de mémoire** inclut des techniques comme la summarisation des anciennes conversations, l'extraction de faits vers un stockage structuré et la rétention sélective du contexte à haute valeur. OpenLegion compacte automatiquement le contexte en approchant des limites de tokens.

### Mémoire Sémantique : Récupération par Vector Store

**Les embeddings vectoriels** permettent la récupération par similarité d'informations sémantiquement liées à partir de grandes bases de connaissances. Les agents peuvent demander "que sais-je sur la sécurité API ?" et récupérer des faits pertinents même stockés avec une terminologie différente.

**Les implémentations populaires** incluent mem0ai/mem0 (56 445 étoiles), Letta anciennement MemGPT (22 890 étoiles) et cognee graph-RAG (17 451 étoiles).

**Les considérations de sécurité** émergent lorsque plusieurs agents partagent des vector stores. La contamination croisée survient lorsque les mémoires d'un agent apparaissent dans les résultats de récupération d'un autre.

### Mémoire Structurée : Clé-Valeur et Tableau Noir

**Le stockage clé-valeur** organise les informations dans des hiérarchies structurées permettant une récupération et des mises à jour précises.

**Les systèmes de tableau noir** étendent le stockage clé-valeur pour la coordination multi-agent. Les agents écrivent des mises à jour de progression et coordonnent via des clés hiérarchiques comme `status/researcher` ou `output/analyst/report_draft`.

**Les modèles de permission** contrôlent quels agents peuvent lire et écrire dans des régions de mémoire spécifiques.

**Les garanties de persistance** assurent que la mémoire structurée survit aux redémarrages des agents et aux mises à jour du système. SQLite fournit des garanties ACID pour le tableau noir d'OpenLegion.

### Mémoire Épisodique : Journaux d'Événements et Procédures

**La journalisation d'événements** capture des enregistrements chronologiques des actions des agents, des appels d'outils, des interactions externes et des métriques de performance.

**L'apprentissage procédural** extrait des patterns d'interaction réussis des journaux épisodiques pour améliorer les performances futures.

**Les pistes d'audit** fournissent des capacités d'analyse forensique pour les systèmes de production où le comportement des agents doit être explicable et vérifiable.

## Risques de Sécurité dans les Systèmes de Mémoire des Agents

### Memory Poisoning : Injection de Faux Faits

**Les vecteurs d'attaque** ciblent les systèmes de mémoire persistante en injectant de fausses informations qui corrompent le comportement des agents entre sessions. La documentation de recherche dans les articles arXiv cs.AI 2025 démontre des attaques pratiques de memory poisoning contre des bibliothèques de mémoire d'agents populaires.

**L'amplification de la persistance** survient lorsque des faits empoisonnés sont renforcés par des récupérations et utilisations répétées.

**Les stratégies d'atténuation** incluent l'attribution de source pour toutes les entrées mémoire, le scoring de confiance basé sur la provenance des informations et des audits réguliers de mémoire.

### Exposition des Credentials via la Mémoire Partagée

**CVE-2025-67732** a démontré comment le stockage partagé de credentials dans les systèmes de mémoire des agents expose les clés API à tout utilisateur authentifié ayant accès à la mémoire.

**Les vulnérabilités de recherche vectorielle** surviennent lorsque les clés API ou d'autres données sensibles sont intégrées et indexées dans des vector stores partagés.

**La contamination inter-agents** se produit dans les systèmes de mémoire partagée où les credentials d'un agent deviennent accessibles à d'autres agents via des opérations de récupération de mémoire.

## Point de Vue d'OpenLegion

La mémoire des agents IA est fondamentale pour les systèmes autonomes, mais les implications de sécurité de la mémoire persistante créent des risques significatifs que de nombreuses implémentations ignorent. CVE-2025-67732 a exposé le risque systématique d'exposition des credentials. Les attaques de memory poisoning documentées dans arXiv cs.AI 2025 montrent comment de faux faits injectés dans un stockage persistant peuvent corrompre le comportement des agents entre sessions.

L'architecture d'OpenLegion adresse ces risques par l'isolation plutôt que par des contrôles d'accès. Le proxy vault assure que les credentials n'entrent jamais dans les systèmes de mémoire. L'isolation de l'espace de travail par agent empêche la contamination de la mémoire entre agents.

### Architecture à Quatre Zones : Mémoire Protégée par Vault

**L'architecture à quatre zones** sépare complètement la gestion des credentials des opérations de mémoire. Zone 1 (Internet Public), Zone 2 (Réseau Mesh), Zone 3 (Conteneurs d'Agents), Zone 4 (Proxy Vault) garantissent que les credentials ne persistent jamais dans les systèmes de mémoire des agents.

**Le tableau noir natif** fournit une coordination de mémoire structurée sans bases de données vectorielles externes. Il fonctionne sur SQLite avec des garanties ACID.

### Isolation de l'Espace de Travail par Agent

**L'espace de travail privé** fournit à chaque agent un stockage de fichiers isolé pour la mémoire personnelle, la configuration et les fichiers de travail.

**La recherche en mémoire** opère sur les faits structurés dans la base de données de mémoire personnelle de l'agent et les fichiers d'espace de travail en utilisant la correspondance de mots-clés BM25.

**[Explorez l'architecture de la plateforme d'agents IA](/learn/ai-agent-platform)** pour des approches complètes de sécurité et de gestion de la mémoire. Pour les [vulnérabilités de sécurité des agents IA](/learn/ai-agent-security), consultez les modèles de menace détaillés.

<!-- SCHEMA: FAQPage -->

## Foire Aux Questions

### Quels sont les quatre types de mémoire des agents IA ?

Mémoire in-context (fenêtre de tokens éphémère), mémoire sémantique (récupération par vector store), mémoire structurée (K-V et tableau noir) et mémoire épisodique (journaux d'événements et procédures). L'in-context offre un rappel immédiat mais disparaît quand les sessions se terminent. Le sémantique permet la récupération de connaissances par similarité. Le structuré supporte l'accès aux données organisées et la coordination des agents. L'épisodique capture les événements historiques pour l'apprentissage et les pistes d'audit.

### Qu'est-ce que le memory poisoning dans les agents IA ?

Le memory poisoning injecte de faux faits dans les systèmes de mémoire persistante des agents, corrompant le comportement des agents entre sessions. La recherche documentée dans arXiv cs.AI 2025 montre des attaques pratiques contre des bibliothèques de mémoire populaires où de faux faits persistent et se propagent via des architectures de mémoire partagée.

### Comment les systèmes de mémoire partagée exposent-ils les credentials ?

CVE-2025-67732 a démontré l'exposition des credentials lorsque des stores de mémoire partagée contiennent des clés API accessibles à tout utilisateur authentifié. Les recherches de similarité vectorielle peuvent récupérer accidentellement des informations sensibles lorsque les termes de requête correspondent sémantiquement aux métadonnées de credentials.

### Qu'est-ce que le tableau noir OpenLegion ?

Un store clé-valeur persistant partagé natif permettant la coordination agent-à-agent sans bases de données vectorielles externes ni services. Il fonctionne sur SQLite avec des garanties ACID et des contrôles de permission basés sur des patterns. Le proxy vault empêche l'exposition des credentials en assurant que les agents ne reçoivent jamais de credentials en clair.

### Quelles bibliothèques de mémoire sont les plus populaires ?

mem0ai/mem0 en tête avec 56 445 étoiles GitHub et 23,5 M$ de financement Série A. Letta anciennement MemGPT compte 22 890 étoiles avec 10 M$ de financement initial. cognee graph-RAG maintient 17 451 étoiles. deer-flow SuperAgent de ByteDance a atteint 69 136 étoiles depuis mai 2025.

### Comment sécuriser la mémoire des agents en production ?

Utilisez l'isolation architecturale des credentials via des systèmes de proxy vault plutôt que des contrôles au niveau applicatif. Implémentez l'isolation de l'espace de travail par agent pour prévenir la contamination de la mémoire. Appliquez des permissions basées sur des patterns suivant le principe du moindre privilège. Ne stockez jamais les credentials dans aucun système de mémoire d'agent.
