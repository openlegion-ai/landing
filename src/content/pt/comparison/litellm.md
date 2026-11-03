---
title: Alternativa ao LiteLLM — Isolamento Vault vs Store de Credenciais
description: "OpenLegion vs LiteLLM: isolamento em cofre vs store centralizado de credenciais. CVE-2026-42208 (CVSS 9.3) injeção SQL expôs o BD de credenciais do LiteLLM. Isolamento distribuído vs agregação gateway."
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

OpenLegion vs LiteLLM representa o compromisso fundamental de segurança entre credenciais guardadas em cofre e injetadas fora do modelo e agregação de credenciais via gateway LLM centralizado. O LiteLLM se destaca como gateway unificado de provedores com 47.997 estrelas no GitHub, rastreamento de custos e suporte a mais de 100 provedores LLM, mas sofreu o CVE-2026-42208 (CVSS 9.3 CRÍTICO) onde injeção SQL expôs todo o banco de dados de credenciais a atacantes não autenticados. No OpenLegion as credenciais ficam num cofre e são injetadas no momento da chamada, e o modelo só guarda um handle — não existe banco de credenciais para ler.

<!-- SCHEMA: DefinitionBlock -->

> **O que é o LiteLLM e como se compara ao OpenLegion?**
> LiteLLM é um gateway LLM centralizado com mais de 47.997 estrelas no GitHub que agrega credenciais de provedores em um banco de dados para acesso unificado, rastreamento de custos e roteamento de provedores. OpenLegion é uma plataforma multi-agente focada em segurança onde as credenciais ficam num cofre e são injetadas fora do modelo, eliminando bancos de dados de credenciais como alvos de ataque. LiteLLM oferece unificação do gateway; OpenLegion oferece isolamento arquitetural de segurança.

## TL;DR

| **Dimensão** | **LiteLLM** | **OpenLegion** |
|---|---|---|
| **Propósito principal** | Gateway LLM centralizado e proxy de provedores | Plataforma multi-agente focada em segurança com credenciais em cofre |
| **Arquitetura** | BD de credenciais centralizado com roteamento API | Credenciais num cofre, injetadas fora do modelo |
| **Armazenamento de credenciais** | Todas as chaves de provedores em BD centralizado | O cofre injeta a credencial na chamada; o modelo guarda um handle |
| **CVEs recentes** | 5 CVEs em 2026, incluindo injeção SQL CRÍTICA | n/d — plataforma hospedada |
| **Isolamento de segurança** | Gateway compartilhado com controles de acesso | Execução em sandbox por tarefa, credenciais em cofre |
| **Suporte a provedores** | Mais de 100 LLMs com interface API unificada | Presets de modelo Smartest, Smart e Normal |
| **Rastreamento de custos** | Rastreamento de gastos integrado e orçamentação | Orçamentos de créditos por agente, custo visível por tarefa |
| **Modelo de implantação** | Serviço gateway único | Aplicação web hospedada; agentes são registros duráveis |
| **Segurança de contêineres** | Execução root padrão, sem sandboxing | Execuções em sandbox, sem acesso à rede por padrão |
| **Superfície de ataque** | Alvo de credenciais centralizado de alto valor | Nenhum store de credenciais que um agente alcance |

## Gateway Centralizado vs Vault Distribuído

### Agregação de Credenciais vs Injeção Vault

**LiteLLM** centraliza todas as credenciais de provedores LLM em um único banco de dados acessível via endpoints de API. Isso cria uma interface unificada onde aplicações podem acessar OpenAI, Anthropic, Google, Cohere e mais de 100 outros provedores por meio de uma API consistente.

**OpenLegion** mantém o acesso a credenciais num cofre que nunca é espelhado em qualquer local acessível por agentes. Quando agentes fazem chamadas, a credencial é injetada fora do modelo, e o modelo só guarda um handle.

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

**Execução efêmera** substitui o worker de longa duração: cada tarefa roda sob demanda e depois para, impedindo tentativas de escalada de privilégios.

**Restrições de orçamento** aplicam um orçamento de créditos por agente, prevenindo gastos descontrolados que sufocariam o trabalho de outros agentes.

## Perspectiva do OpenLegion

LiteLLM vs OpenLegion representa o clássico compromisso segurança/conveniência em infraestrutura de IA. O cluster CVE 2026 expõe os riscos sistemáticos da agregação de credenciais. O CVE-2026-42208 (CVSS 9.3 CRÍTICO) provou que injeção SQL pode expor todos os stores de credenciais organizacionais.

O cofre de credenciais do OpenLegion elimina completamente o risco de agregação de credenciais. Nenhum banco de dados armazena chaves de API onde possam ser expostas via injeção SQL, bypass de autenticação ou escape de sandbox.

## Escolher LiteLLM vs Escolher OpenLegion

### Escolher LiteLLM quando a unificação do gateway é a prioridade

Sua equipe precisa de integração simplificada de provedores com acesso API unificado a mais de 100 provedores LLM.

### Escolher OpenLegion quando a segurança de credenciais é essencial

A agregação de credenciais cria risco inaceitável onde o comprometimento de um componente poderia expor todas as chaves de API organizacionais.

## Migração de Gateway Centralizado para Proxy Vault

**As configurações de provedores** deixam de ser algo que você mantém: o OpenLegion escolhe modelos por preset — Smartest, Smart ou Normal — por agente ou por workspace.

Para uma visão mais ampla da [arquitetura de segurança de agentes IA](/learn/ai-agent-security), o padrão de isolamento de credenciais é o diferenciador de segurança mais significativo do OpenLegion.

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é LiteLLM vs OpenLegion?

LiteLLM é um gateway LLM centralizado com mais de 47.997 estrelas no GitHub que agrega credenciais em um banco de dados para acesso unificado a mais de 100 provedores LLM. OpenLegion é uma plataforma multi-agente focada em segurança onde as credenciais ficam num cofre e são injetadas fora do modelo.

### Quais são as vulnerabilidades de segurança recentes do LiteLLM?

CVE-2026-42208 (CVSS 9.3 CRÍTICO) permitia injeção SQL para ler e modificar todo o banco de dados de credenciais via cabeçalhos Authorization manipulados, descoberto pela Tencent YunDing Security Lab. Quatro CVEs adicionais em 2026 incluíram injeção de comandos OS, escape de sandbox, SSTI RCE e pass-the-hash.

### Como eles lidam com credenciais de provedores LLM?

LiteLLM armazena todas as credenciais em um banco de dados centralizado acessível via endpoints de API. O cofre do OpenLegion injeta credenciais no momento da chamada, fora do modelo, que só guarda um handle — nenhum componente as guarda em forma consultável por agentes.

### Qual é mais seguro para produção?

LiteLLM agrega todas as credenciais criando um alvo de ataque de alto valor comprovadamente vulnerável a injeção SQL CRÍTICA. OpenLegion guarda as credenciais num cofre que o modelo nunca lê, dá a cada tarefa sua própria execução em sandbox e não deixa nenhum processo de agente de longa duração para comprometer.

### Quais são as diferenças de implantação?

LiteLLM executa como root na imagem Docker padrão sem sandboxing. OpenLegion é uma aplicação web hospedada sem nada para implantar: cada tarefa roda sob demanda em um sandbox sem acesso à rede por padrão, e cada agente é um registro durável com seu próprio orçamento, seu próprio escopo de credenciais e um recibo para cada ação.

### Posso migrar do LiteLLM para o OpenLegion?

Sim. Não há configurações de provedor para transferir, porque os modelos são escolhidos por preset — Smartest, Smart ou Normal — por agente ou por workspace, e as credenciais que seus agentes ainda precisam migram para o cofre.

**Experimente o OpenLegion hoje.**
[Começar](https://app.openlegion.ai) | [Ler a documentação](https://docs.openlegion.ai) | [Comparar arquitetura de segurança de agentes IA](/learn/ai-agent-security)
