---
title: Mastra Alternative — Sicherheitsorientierte KI-Agenten-Plattform
description: Mastra ist ein TypeScript-Framework mit Dual-Lizenz, RBAC hinter proprietärem ee/-Verzeichnis und CVE-2025-61685 zur Credential-Exposition. Vergleiche Mastra-Alternativen.
slug: /comparison/mastra
primary_keyword: mastra alternative
secondary_keywords:
  - openlegion vs mastra
  - mastra sicherheit
  - mastra typescript agent framework
  - mastra enterprise edition
last_updated: "2026-05-26"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
---

# Mastra Alternative: Sicherheitsorientierte Plattform vs. TypeScript-Framework

Mastra ist ein TypeScript-Agenten-Framework mit 24.329 GitHub-Stars vom Gatsby-Team — aber CVE-2025-61685 (CVSS 6.5) legt `~/.aws`-Credential-Dateien über Cursor-IDE-Prompt-Injection offen, RBAC und Auth sind hinter einem proprietären `ee/`-Verzeichnis gesperrt, und zwei nicht zusammengeführte PRs lassen Open-Redirect- und OAuth-CSRF-Schwachstellen im Enterprise-Auth-Stack ungepatcht (Stand Mai 2026). Eine Mastra-Alternative für sicherheitsorientierte Teams braucht Vault-Proxy-Isolation — keine Umgebungsvariablen für Credentials.

