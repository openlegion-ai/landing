---
title: Alternativa ao LiteLLM — Isolamento Vault vs Store de Credenciais
description: "OpenLegion vs LiteLLM: proxy vault vs store centralizado de credenciais. CVE-2026-42208 (CVSS 9.3) injeção SQL expôs o BD de credenciais do LiteLLM. Isolamento distribuído vs agregação gateway."
slug: /comparison/litellm
primary_keyword: litellm alternative
secondary_keywords:
  - openlegion vs litellm
  - segurança litellm
  - litellm cve
  - alternativa proxy llm
  - gateway litellm
date_published: 2026-05
last_updated: "2026-06-09"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
---

# Alternativa ao LiteLLM: Vault Distribuído OpenLegion vs Gateway Centralizado

OpenLegion vs LiteLLM representa o compromisso fundamental de segurança entre arquitetura de proxy vault distribuído e agregação de credenciais via gateway LLM centralizado. O LiteLLM se destaca como gateway unificado de provedores com 47.997 estrelas no GitHub, rastreamento de custos e suporte a mais de 100 provedores LLM, mas sofreu o CVE-2026-42208 (CVSS 9.3 CRÍTICO) onde injeção SQL expôs todo o banco de dados de credenciais a atacantes não autenticados. O proxy vault distribuído do OpenLegion injeta credenciais no momento da chamada sem armazenamento central, eliminando o alvo de ataque de alto valor que gateways centralizados criam estruturalmente.

<!-- SCHEMA: DefinitionBlock -->

> **O que é o LiteLLM e como se compara ao OpenLegion?**
> LiteLLM é um gateway LLM centralizado com mais de 47.997 estrelas no GitHub que agrega credenciais de provedores em um banco de dados para acesso unificado, rastreamento de custos e roteamento de provedores. OpenLegion é uma plataforma multi-agente focada em segurança com proxy vault distribuído que injeta credenciais sem armazenamento central, eliminando bancos de dados de credenciais como alvos de ataque. LiteLLM oferece unificação do gateway; OpenLegion oferece isolamento arquitetural de segurança.

## TL;DR

| **Dimensão** | **LiteLLM** | **OpenLegion** |
|---|---|---|
| **Propósito principal** | Gateway LLM centralizado e proxy de provedores | Plataforma multi-agente focada em segurança com proxy vault |
| **Arquitetura** | BD de credenciais centralizado com roteamento API | Injeção vault distribuída sem armazenamento central |
| **Armazenamento de credenciais** | Todas as chaves de provedores em BD centralizado | Proxy vault injeta credenciais no momento da chamada |
| **CVEs recentes** | 5 CVEs em 2026, incluindo injeção SQL CRÍTICA | 0 CVEs reportados |
| **Isolamento de segurança** | Gateway compartilhado com controles de acesso | Contêineres por agente com isolamento proxy vault |
| **Suporte a provedores** | Mais de 100 LLMs com interface API unificada | Mais de 100 LLMs via integração LiteLLM |
| **Rastreamento de custos** | Rastreamento de gastos integrado e orçamentação | Controles de orçamento no nível do agente |
| **Modelo de implantação** | Serviço gateway único | Contêineres de agentes distribuídos |
| **Segurança de contêineres** | Execução root padrão, sem sandboxing | Não-root obrigatório, isolamento no-new-privileges |
| **Superfície de ataque** | Alvo de credenciais centralizado de alto valor | Vault distribuído sem store central |

## Gateway Centralizado vs Vault Distribuído

### Agregação de Credenciais vs Injeção Vault

**LiteLLM** centraliza todas as credenciais de provedores LLM em um único banco de dados acessível via endpoints de API. Isso cria uma interface unificada onde aplicações podem acessar OpenAI, Anthropic, Google, Cohere e mais de 100 outros provedores por meio de uma API consistente.

**OpenLegion** distribui o acesso a credenciais via injeção de proxy vault que nunca armazena credenciais em qualquer local acessível por agentes. Quando agentes fazem chamadas LLM, o host mesh intercepta requisições e injeta as credenciais apropriadas no nível de rede.

### Alvo de Alto Valor vs Risco Distribuído

O CVE-2026-42208 demonstrou esse risco quando injeção SQL expôs todo o banco de dados de credenciais do LiteLLM a atacantes não autenticados.

## O Cluster CVE 2026: Quando Centralização Se Torna Responsabilidade

### CVE-2026-42208: Injeção SQL CRÍTICA

**Severidade CVSS 9.3 CRÍTICA** descoberta pela Tencent YunDing Security Lab onde injeção SQL na verificação de chaves de API do LiteLLM expôs todo o banco de dados de credenciais a atacantes não autenticados.

### O Padrão CVE 2026: Cinco Vulnerabilidades em Quatro Meses

**O intervalo de versões 1.80-1.83** entregou cinco CVEs distintos em quatro meses:

1. **CVE-2026-42208** - Injeção SQL expondo o banco de credenciais
2. **CVE-2026-43115** - Injeção de comandos OS via configuração de provedores
3. **CVE-2026-43892** - Escape de sandbox em contêiner Docker
4. **CVE-2026-44201** - Server-Side Template Injection (SSTI) RCE
5. **CVE-2026-44673** - Bypass de autenticação pass-the-hash

## Segurança de Contêineres: Execução Root vs Isolada

### Execução Root Padrão do LiteLLM

**Implantação com usuário root** por padrão na imagem Docker oficial do LiteLLM sem separação de privilégios ou mecanismos de sandboxing.

### Isolamento Obrigatório do OpenLegion

**Execução não-root** com flag no-new-privileges impedindo tentativas de escalada de privilégios.

**Restrições de recursos** aplicam por contêiner de agente, prevenindo ataques de esgotamento de recursos.

## Perspectiva do OpenLegion

LiteLLM vs OpenLegion representa o clássico compromisso segurança/conveniência em infraestrutura de IA. O cluster CVE 2026 expõe os riscos sistemáticos da agregação de credenciais. O CVE-2026-42208 (CVSS 9.3 CRÍTICO) provou que injeção SQL pode expor todos os stores de credenciais organizacionais.

O proxy vault distribuído do OpenLegion elimina completamente o risco de agregação de credenciais. Nenhum banco de dados armazena chaves de API onde possam ser expostas via injeção SQL, bypass de autenticação ou escape de contêiner.

## Escolher LiteLLM vs Escolher OpenLegion

### Escolher LiteLLM quando a unificação do gateway é a prioridade

Sua equipe precisa de integração simplificada de provedores com acesso API unificado a mais de 100 provedores LLM.

### Escolher OpenLegion quando a segurança de credenciais é essencial

A agregação de credenciais cria risco inaceitável onde o comprometimento de um componente poderia expor todas as chaves de API organizacionais.

## Migração de Gateway Centralizado para Proxy Vault

**As configurações de provedores** transferem diretamente pois o OpenLegion suporta mais de 100 LLMs via integração LiteLLM sem perda de funcionalidade.

Para uma visão mais ampla da [arquitetura de segurança de agentes IA](/learn/ai-agent-security), o padrão de isolamento de credenciais é o diferenciador de segurança mais significativo do OpenLegion.

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é LiteLLM vs OpenLegion?

LiteLLM é um gateway LLM centralizado com mais de 47.997 estrelas no GitHub que agrega credenciais em um banco de dados para acesso unificado a mais de 100 provedores LLM. OpenLegion é uma plataforma multi-agente focada em segurança com proxy vault distribuído que injeta credenciais sem armazenamento central.

### Quais são as vulnerabilidades de segurança recentes do LiteLLM?

CVE-2026-42208 (CVSS 9.3 CRÍTICO) permitia injeção SQL para ler e modificar todo o banco de dados de credenciais via cabeçalhos Authorization manipulados, descoberto pela Tencent YunDing Security Lab. Quatro CVEs adicionais em 2026 incluíram injeção de comandos OS, escape de sandbox, SSTI RCE e pass-the-hash.

### Como eles lidam com credenciais de provedores LLM?

LiteLLM armazena todas as credenciais em um banco de dados centralizado acessível via endpoints de API. O proxy vault do OpenLegion injeta credenciais no momento da chamada sem armazená-las em qualquer local acessível por agentes.

### Qual é mais seguro para produção?

LiteLLM agrega todas as credenciais criando um alvo de ataque de alto valor comprovadamente vulnerável a injeção SQL CRÍTICA. OpenLegion distribui injeção vault sem store central de credenciais e impõe isolamento de contêiner por agente com execução não-root.

### Quais são as diferenças de implantação?

LiteLLM executa como root na imagem Docker padrão sem sandboxing. OpenLegion impõe contêineres por agente com execução não-root, flag no-new-privileges, restrições de recursos e isolamento de sistema de arquivos.

### Posso migrar do LiteLLM para o OpenLegion?

Sim, as configurações de provedores transferem diretamente pois o OpenLegion suporta mais de 100 LLMs via integração LiteLLM sem perda de funcionalidades.

**Experimente o OpenLegion hoje.**
[Começar](https://app.openlegion.ai) | [Ler a documentação](https://docs.openlegion.ai) | [Comparar arquitetura de segurança de agentes IA](/learn/ai-agent-security)
