---
title: Альтернатива Mastra — Платформа АИ-агентов с приоритетом безопасности
description: Mastra — это TypeScript-фреймворк с двойной лицензией, RBAC за платным ee/ директорием и CVE-2025-61685 с утечкой учётных данных. Сравните альтернативы.
slug: /comparison/mastra
primary_keyword: альтернатива mastra
secondary_keywords:
  - openlegion vs mastra
  - безопасность mastra
  - mastra typescript агент
  - mastra энтерпрайз
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

# Альтернатива Mastra: платформа с приоритетом безопасности vs TypeScript-фреймворк

Mastra — TypeScript-фреймворк для АИ-агентов от команды Gatsby с 24 329 звёздами на GitHub. CVE-2025-61685 (CVSS 6.5) раскрывает файлы  через Cursor IDE, RBAC и Auth закрыты в платном  каталоге, недоступном по Apache 2.0.

<!-- SCHEMA: DefinitionBlock -->

> **Что такое Mastra?**
> Mastra — открытый TypeScript-фреймворк для АИ-агентов от Kepler Software (команда Gatsby) с 24 329 звёздами на GitHub, выпущенный в августе 2024 г. Предоставляет оркестрацию, вызов инструментов и RAG-примитивы под двойной лицензией.

## Почему разработчики ищут альтернативу Mastra

### CVE-2025-61685: утечка учётных данных через MCP Docs Server

CVE-2025-61685 (CVSS 6.5, CWE-548, 24 сентября 2025) — уязвимость подбора директорий в  версий ≤0.13.8. Обнаружена Liran Tal: внедрение промпта через Cursor IDE обходит проверку  и даёт доступ к , , . Патч в версии 0.17.0.

### Двойная лицензия: функции безопасности за платой 

Apache 2.0 распространяется только на ядро фреймворка.  — проприетарный каталог, включающий Auth, RBAC и управление правами.

**RBAC — энтерпрайз-функция.** Управление правами конкретных агентов требует .

**Auth-интеграции проприетарны.**  содержит WorkOS AuthKit () и  OAuth.

### Незакрытые PR в Auth-стеке энтерпрайз

**CVE-2026-42565 (CVSS 4.3)**: открытый редирект в . Фишинг через цепочку доменов.

**GHSA-wxw3-q3m9-c3jr (CVSS 5.3)**: OAuth CSRF в . Незакрытая CSRF-уязвимость в обработке обратного вызова OAuth.
## Мнение OpenLegion: три пробела в безопасности

**Утечка учётных данных по дизайну.** Агенты Mastra получают учётные данные через переменные среды. CVE-2025-61685 показал: даже чистый код агента не защищает учётные данные от инструментальной цепочки. Ванный прокси OpenLegion внедряет учётные данные на сетевом уровне, агент никогда не получает API-ключ в открытом виде.

**Безопасность — платный апгрейд.** RBAC, контроль адаптеров и Auth — только в ee/. OpenLegion предоставляет ванный прокси и права доски на доске всем пользователям.

**Незакрытые уязвимости в платном тире.** CVE-2026-42565 и GHSA-wxw3-q3m9-c3jr — в Auth-зависимостях ee/. Нулевая репутация CVE OpenLegion (май 2026) отражает архитектуру без хранения учётных данных.

## Mastra vs OpenLegion: сравнение

| **Параметр** | **Mastra** | **OpenLegion** |
|---|---|---|
| **Языки** | Только TypeScript | Python (агенты), интерф. для любых языков |
| **Лицензия** | Apache 2.0 + пропр. ee/ | PolyForm Perimeter License 1.0.1 |
| **GitHub звёзды** | 24 329 (май 2026) | Предрелиз |
| **Модель учётных данных** | Перем. среда — агент хранит ключи | Ванный прокси — не хранит |
| **Изоляция** | Уровень процесса | Docker-контейнер |
| **RBAC** | Только ee/ | Права доски на агент (всем) |
| **CVE** | CVE-2025-61685 (CVSS 6.5) + 2 PR | 0 CVE |
| **Auth** | WorkOS AuthKit / better-auth (ee/) | Ванный прокси |
| **Бюджет** | Нет | Лимиты на агент |
| **Много-агентность** | Оркестрация | Blackboard + pub/sub + mesh handoff |
| **Открытые Issue** | 433 (26 мая 2026) | Предрелиз |

## Только TypeScript: что это значит на практике

Mastra — TypeScript-first, только TypeScript. Командам с Python ML/данными не подходит. OpenLegion, LangGraph, CrewAI, AutoGen нативно поддерживают Python.

Для TypeScript-команд опыт разработки в Mastra отличный. Вывод типов для схем инструментов, тесная интеграция с экосистемой Node.js, знакомые паттерны async/await.

## Архитектура безопасности: ванный прокси vs переменные среды

Агенты Mastra получают API-ключи через process.env. CVE-2025-61685 показал: подбор директорий в @mastra/mcp-docs-server достигает ~/.aws/credentials.

Ванный прокси OpenLegion находится на сетевом уровне между агентом и LLM-провайдером. Агент никогда не получает строку учётных данных. Подробнее в [изоляция учётных данных AI-агентов](/learn/ai-agent-security).

## OpenLegion как альтернатива Mastra

Много-агентная координация через Blackboard, pub/sub и mesh handoff. Ванный прокси для учётных данных. Docker-изоляция. Лимиты бюджета на агент. 100+ LLM через LiteLLM.

**Честный компромисс**: нет TypeScript SDK — только Python. Сообщество меньше, чем 24 329 звёзд Mastra.

[Что платформа ДИ-агентов даёт сверх фреймворка](/learn/ai-agent-platform). [OpenLegion vs LangGraph](/comparison/langgraph), [OpenLegion vs CrewAI](/comparison/crewai), [OpenLegion vs AutoGen](/comparison/autogen). [Сравнение фреймворков 2026](/learn/ai-agent-frameworks).

<!-- SCHEMA: FAQPage -->

## Часто задаваемые вопросы

### Mastra — open-source?
Ядро (packages/) под Apache 2.0. Компоненты enterprise/ — проприетарные. RBAC, аутентификация, большинство инструментов хранения — за дополнительную плату. OpenLegion распространяется под PolyForm Perimeter License 1.0.1 (source-available).

### Можно ли использовать Mastra с Python?
Mastra написана исключительно на TypeScript. Официального Python SDK нет. Командам, работающим с PyTorch, scikit-learn или другими Python ML-библиотеками, потребуется стороннее решение, например OpenLegion.

### Что такое CVE-2025-61685?
Уязвимость в @mastra/mcp-docs-server, обнаруженная в июне 2025, CVSS 6.5. Сервер читал произвольные пути к файлам, что давало доступ к ~/.aws/credentials и ~/.ssh/. Запрос требовал ответа в виде данных файла через HTTP-запрос инициатора.

### Mastra подходит для больших production-проектов?
Для TypeScript-ориентированных проектов это жизнеспособное решение. Однако для сред с жёсткими требованиями к безопасности, пользователями бюджета, аудита или Python ML-стека OpenLegion обеспечивает больше возможностей из коробки.

### Как Mastra хранит секреты?
Mastra читает API-ключи через process.env. Без ванного прокси агент получает строку API-ключа напрямую. CVE-2025-61685 подтверждает, что сервер может передать локальные файлы внешнему клиенту. OpenLegion хранит учётные данные в ванном прокси и никогда не передаёт их агентам.

### Можно ли мигрировать с Mastra на OpenLegion?
OpenLegion поддерживает Anthropic, OpenAI, Gemini, Ollama через LiteLLM. Существующую логику агентов можно перенести на Python. Инструменты и оркестрация задач остаются в стандартных паттернах; только runtime меняется.

---

Изучите [платформу агентов OpenLegion](/learn/ai-agent-platform) или сравните [OpenLegion с LangGraph](/comparison/langgraph), [OpenLegion с CrewAI](/comparison/crewai), [OpenLegion с AutoGen](/comparison/autogen). Подробнее о [фреймворках агентов в 2026 году](/learn/ai-agent-frameworks).
