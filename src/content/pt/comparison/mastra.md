---
title: Alternativa ao Mastra — Plataforma de Agentes IA Segura
description: Mastra e um framework TypeScript com licenca dupla, RBAC atras de diretorio ee/ proprietario e CVE-2025-61685 expondo credenciais. Compare alternativas ao Mastra.
slug: /comparison/mastra
primary_keyword: alternativa ao mastra
secondary_keywords:
  - openlegion vs mastra
  - mastra seguranca
  - mastra framework agente typescript
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

# Alternativa ao Mastra: Plataforma com Segurança em Primeiro Lugar vs Framework TypeScript

Mastra é um framework de agentes TypeScript com 24.329 estrelas GitHub da equipa Gatsby — mas CVE-2025-61685 (CVSS 6.5) expõe ficheiros de credenciais `~/.aws` via injeção de prompt no Cursor IDE, o RBAC e a auth estão bloqueados atrás de um directório `ee/` proprietário não disponível sob Apache 2.0, e dois PRs não fundidos deixam vulnerabilidades de redireccionamento aberto e CSRF OAuth sem patch na pilha de auth enterprise (maio 2026). Uma alternativa ao Mastra para equipas orientadas para a segurança precisa de isolamento por vault proxy, não credenciais em variáveis de ambiente.

<!-- SCHEMA: DefinitionBlock -->

> **O que é o Mastra?**
> Mastra é um framework de agentes TypeScript open source da Kepler Software (a equipa por trás do Gatsby) com 24.329 estrelas GitHub, lançado em agosto de 2024. Fornece orquestração de workflows, chamadas a ferramentas e primitivas RAG para programadores JavaScript e TypeScript sob licença dupla — Apache 2.0 para o núcleo e licença proprietária para o directório `ee/` enterprise contendo auth, RBAC e aplicação de permissões de adaptadores.

## Por que os programadores procuram uma alternativa ao Mastra

### CVE-2025-61685: Exposição de ficheiros de credenciais via servidor MCP Docs

CVE-2025-61685 (CVSS 6.5, CWE-548, 24 de setembro de 2025) é uma vulnerabilidade de traversal de directório em `@mastra/mcp-docs-server` versões ≤0.13.8. Descoberta por Liran Tal, a vulnerabilidade permite injeção de prompt via Cursor IDE para contornar proteções em `readMdxContent` via `findNearestDirectory`, alcançando caminhos do sistema de ficheiros fora do directório de docs previsto.

O raio de explosão prático é estreito mas severo para as máquinas dos programadores: o traversal expõe `~/.aws/credentials`, `~/.config/` (tokens de conta de serviço) e `~/.cursor/` (configuração IDE). Qualquer programador a executar uma versão afetada de `@mastra/mcp-docs-server` com Cursor IDE está exposto à leitura de ficheiros de credenciais por prompts maliciosos.

Mastra corrigiu a vulnerabilidade na versão 0.17.0. Equipas ainda a executar ≤0.13.8 com o servidor MCP docs ativo continuam expostas.

### Licença dupla: funcionalidades de segurança atrás do paywall `ee/`

A licença Apache 2.0 do Mastra cobre o framework principal. O directório `ee/` — contendo integrações de auth, RBAC e aplicação de permissões de adaptadores — é proprietário e não disponível sob a licença open source. Isto cria três lacunas concretas:

**O RBAC é um add-on enterprise.** O controlo de acesso baseado em papéis para permissões de agentes não está disponível sem a edição enterprise. As equipas que precisam de restringir o que agentes específicos podem fazer devem pagar pela atualização `ee/`.

**As permissões de adaptadores estão bloqueadas.** O controlo granular sobre adaptadores requer o tier proprietário.

**As integrações de auth são proprietárias.** O directório `ee/` inclui a integração WorkOS AuthKit (`@workos/authkit-session`) e fluxos OAuth `better-auth`. O núcleo open source não tem primitivas de auth.

### PRs de segurança não fundidos na pilha de auth enterprise

Duas vulnerabilidades de segurança nas dependências de auth enterprise do Mastra permanecem abertas a 26 de maio de 2026:

**CVE-2026-42565 (CVSS 4.3)**: Redireccionamento aberto em `@workos/authkit-session`. Um atacante pode criar um URL de redireccionamento que contorna a validação de origem.

**GHSA-wxw3-q3m9-c3jr (CVSS 5.3)**: CSRF OAuth em `better-auth`. Uma vulnerabilidade CSRF sem patch no manuseio do callback OAuth pode permitir a um atacante associar a sua sessão à conta de uma vítima.
## Perspetiva da OpenLegion: Três lacunas de segurança estruturais

**Exposição de credenciais por design.** Os agentes Mastra recebem credenciais como variáveis de ambiente. CVE-2025-61685 demonstrou que a toolchain circundante pode alcançar essas credenciais via traversal de caminhos. O vault proxy da OpenLegion injeta credenciais na camada de rede: nenhum processo de agente recebe alguma vez uma chave API em texto simples.

**Segurança como atualização enterprise.** RBAC, permissões de adaptadores e integrações de auth requerem o tier proprietário `ee/`. As permissões de blackboard da OpenLegion e o vault proxy são características core disponíveis para todos os utilizadores.

**Vulnerabilidades de auth sem patch no tier pago.** CVE-2026-42565 e GHSA-wxw3-q3m9-c3jr estão nas dependências de auth do directório enterprise `ee/`. O histórico CVE zero da OpenLegion (maio 2026) reflete uma arquitetura onde as credenciais nunca são mantidas por agentes.

## Mastra vs OpenLegion: Comparação lado a lado

| **Dimensão** | **Mastra** | **OpenLegion** |
|---|---|---|
| **Suporte de linguagens** | Apenas TypeScript | Python (agentes); interfaces de ferramentas para qualquer linguagem |
| **Licença** | Apache 2.0 (núcleo) + `ee/` proprietário | BSL 1.1 → Apache 2.0 após 4 anos |
| **Estrelas GitHub** | 24.329 (maio 2026) | Pré-lançamento |
| **Modelo de credenciais** | Variáveis de ambiente — agentes mantêm chaves | Vault proxy — agentes nunca mantêm chaves |
| **Isolamento de agentes** | Nível de processo, sem fronteira de contentor | Contentores Docker obrigatórios por agente |
| **RBAC** | Apenas tier proprietário `ee/` | Permissões de blackboard por agente (todos os utilizadores) |
| **Histórico CVE** | CVE-2025-61685 (CVSS 6.5) + 2 PRs abertas | 0 CVEs reportados |
| **Auth** | WorkOS AuthKit / better-auth (apenas `ee/`) | Vault proxy (sem camada de auth necessária) |
| **Controlos de orçamento** | Nenhum integrado | Limites diários/mensais por agente |
| **Multi-agente** | Orquestração de workflows, chamadas a ferramentas | Blackboard + pub/sub + handoff mesh |
| **Issues abertas** | 433 (26 maio 2026) | Pré-lançamento |

## Apenas TypeScript: O que significa na prática

Mastra é TypeScript-first por design e atualmente apenas TypeScript. Para equipas com bases de código políglotas ou infraestrutura Python ML/dados existente, adotar Mastra significa reescrever a lógica de agentes em TypeScript ou aceitar que a coordenação de agentes não pode abranger linguagens.

Para equipas Python-first, Mastra não é uma opção viável independentemente da postura de segurança. OpenLegion, LangGraph, CrewAI e AutoGen suportam Python nativamente.

## Arquitetura de segurança: Vault Proxy vs Variáveis de ambiente

Os agentes Mastra recebem chaves API LLM e credenciais de serviço através de variáveis de ambiente. CVE-2025-61685 demonstrou o risco concreto: um traversal de directório em `@mastra/mcp-docs-server` podia alcançar `~/.aws/credentials` porque o ambiente do processo era acessível a partir do mesmo contexto de execução que o servidor vulneravel.

O vault proxy da OpenLegion situa-se na camada de rede entre os agentes e os fornecedores LLM. O processo do agente nunca recebe uma string de credencial. Para análise mais aprofundada, ver [Segurança de agentes IA: isolamento de credenciais e endurecimento de contentores](/learn/ai-agent-security).

## OpenLegion como alternativa ao Mastra

Coordenação multi-agente via estado blackboard, eventos pub/sub e handoff mesh. Injeção de credenciais via vault proxy onde nenhum processo de agente mantém chaves API. Isolamento Docker por agente com execução não-root. Limites de orçamento diários e mensais por agente. 100+ fornecedores LLM via LiteLLM. Modelos de frota para implantações repetíveis.

Para equipas que avaliam [o que uma plataforma de agentes IA fornece para além de um framework](/learn/ai-agent-platform), a comparação de plataformas cobre o panorama completo.

**Compromissos honestos**: Sem SDK TypeScript — apenas Python. Comunidade menor que as 24.329 estrelas do Mastra. Sem visualização de workflow integrada.

Ver também: [OpenLegion vs LangGraph](/comparison/langgraph), [OpenLegion vs CrewAI](/comparison/crewai) e [OpenLegion vs AutoGen](/comparison/autogen). Para um panorama completo, ver [Comparação de frameworks de agentes IA 2026](/learn/ai-agent-frameworks).

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que é o Mastra e quem o construiu?

Mastra é um framework de agentes TypeScript com 24.329 estrelas GitHub desenvolvido pela Kepler Software — a equipa por trás do Gatsby — desde agosto de 2024. Fornece orquestração de workflows, chamadas a ferramentas, primitivas RAG e coordenação multi-agente para programadores TypeScript sob licença dupla: Apache 2.0 para o núcleo e licença proprietária para o directório `ee/` enterprise.

### O que é CVE-2025-61685 no Mastra?

CVE-2025-61685 (CVSS 6.5, 24 de setembro de 2025) é um traversal de directório em `@mastra/mcp-docs-server` ≤0.13.8, descoberto por Liran Tal. A injeção de prompt via Cursor IDE contorna proteções em `readMdxContent` via `findNearestDirectory`, expondo `~/.aws/credentials`, `~/.config/` e `~/.cursor/`. Mastra corrigiu na versão 0.17.0.

### O Mastra tem RBAC no tier gratuito?

Não. O RBAC, as permissões de adaptadores e as integrações de auth encontram-se no directório `ee/` proprietário do Mastra. OpenLegion fornece permissões de blackboard por agente e isolamento vault proxy a todos os utilizadores como características core.

### Quais são os problemas de segurança sem patch do Mastra em maio de 2026?

Dois PRs de segurança permanecem abertos: CVE-2026-42565 (CVSS 4.3, redireccionamento aberto em `@workos/authkit-session`) e GHSA-wxw3-q3m9-c3jr (CVSS 5.3, CSRF OAuth em `better-auth`). Nenhum foi fundido a 26 de maio de 2026.

### Os programadores TypeScript podem usar a OpenLegion?

Os agentes OpenLegion são apenas Python. As equipas TypeScript precisariam de executar agentes Python ou construir ferramentas TypeScript que chamem as APIs da OpenLegion — não há SDK TypeScript nativo. OpenLegion é a escolha certa quando os requisitos de isolamento de segurança superam as preferências de linguagem.

### O Mastra é suficientemente estável para produção?

Mastra tem 24.329 estrelas GitHub e desenvolvimento ativo desde agosto de 2024, com 433 issues abertas a 26 de maio de 2026. As equipas que adotam Mastra para produção devem fixar lançamentos estáveis, atualizar `@mastra/mcp-docs-server` para 0.17.0+ e planear correções upstream para CVE-2026-42565 e GHSA-wxw3-q3m9-c3jr antes de depender das características de auth enterprise.

## Começar

OpenLegion é gratuito para experimentar. [Começar em app.openlegion.ai](https://app.openlegion.ai) ou [ler a documentação da plataforma](https://docs.openlegion.ai).
