---
title: "Otimização de Custos LLM — Seis Alavancas para Frotas de Agentes em Produção"
description: "Seis alavancas para otimização de custos LLM: roteamento de modelo, cache de prompts, inferência em lote, compressão de contexto, limites de orçamento por agente e controle de tokens de saída — com números de custos reais."
slug: /learn/llm-cost-optimization
primary_keyword: otimização de custos llm
secondary_keywords:
  - reduzir custos api openai
  - redução de custos tokens llm
  - controle de custos agente ia
  - economias cache de prompts
  - roteamento de modelos agentes ia
last_updated: "2026-06-05"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-frameworks
  - /learn/what-is-an-ai-agent
---

# Otimização de Custos LLM: Seis Alavancas para Frotas de Agentes em Produção

A otimização de custos LLM é a prática de reduzir os gastos com tokens em sistemas de IA em produção sem sacrificar a qualidade das tarefas. O relatório State of FinOps 2026 da FinOps Foundation descobriu que o gasto em IA/ML é a principal nova categoria de custos citada por 67% dos entrevistados, com os gastos medianos em LLM dobrando ano a ano. Seis alavancas concretas, roteamento de modelo, cache de prompts, inferência em lote, compressão de contexto, limites de orçamento por agente e controle de tokens de saída, podem reduzir o custo por tarefa em 50 a 80% em pipelines de agentes de produção de complexidade mista sem alterar os resultados.

<!-- SCHEMA: DefinitionBlock -->
A otimização de custos LLM é a prática estruturada de reduzir os gastos em tokens e computação das chamadas de API de grandes modelos de linguagem em sistemas de produção, aplicada à seleção de modelos, estrutura de prompts, timing de inferência, gerenciamento de contexto e aplicação de orçamentos, para minimizar o custo por tarefa bem-sucedida sem degradar a qualidade de saída.

## Por que os gastos com LLM se tornaram uma preocupação no nível da diretoria

Uma única chamada ao GPT-4o preenchendo um contexto de 128k custa $0,32 apenas em tokens de entrada. Um pipeline multi-agente executando 20 chamadas LLM por tarefa chega a $6,40 por tarefa em tokens de entrada antes de qualquer saída. A 10.000 tarefas por dia, isso representa $64.000 diários em gastos com API LLM, $23M por ano.

## Perspectiva da OpenLegion: limites de orçamento são um primitivo de segurança, não apenas FinOps

A OpenLegion trata os limites de orçamento por agente como um primitivo de segurança aplicado na camada de infraestrutura. Cada agente tem um limite `daily_usd` e `monthly_usd`. Quando um agente atinge seu limite, as chamadas LLM para esse agente são bloqueadas, não o pipeline inteiro. Isso é um corte rígido, não um aviso suave.

Para o contexto de segurança completo, ver [segurança de agentes IA e defesa contra negação de carteira](/learn/ai-agent-security).

## As Seis Alavancas

### Alavanca 1: Roteamento de Modelo — usar o modelo mais barato que seja suficiente

Claude Haiku 4.5 custa $0,80/$4 por milhão de tokens de entrada/saída. Claude Opus 4.8 custa $5/$25. Rotear uma tarefa para Haiku em vez de Opus economiza 84% na entrada e 84% na saída.

| **Tipo de tarefa** | **Modelo** | **Custo (entrada/M)** |
|---|---|---|
| Classificação, formatação, extração | Claude Haiku 4.5 | $0,80 |
| Raciocínio moderado, resumo | Claude Sonnet 4 | $3,00 |
| Síntese complexa, raciocínio multi-etapas | Claude Opus 4.8 | $5,00 |

Databricks Genie implementou esse padrão e reportou redução de custos de 61% em comparação com o roteamento de todas as tarefas para Opus 4.7.

### Alavanca 2: Cache de Prompts — 90% de economia em contexto repetido

A Anthropic lançou o cache de prompts em 2024-08-14. As chamadas subsequentes que incluem o mesmo prefixo pagam 10% do preço padrão de tokens de entrada para a parte em cache, uma redução de 90%.

Aos preços do Opus 4.8 ($5,00/M tokens de entrada), um prompt de sistema de 10.000 tokens custa $0,05 por chamada sem cache. Com cache, cai para $0,005.

### Alavanca 3: Inferência em Lote — 50% de desconto para tarefas não em tempo real

A API Message Batches da Anthropic e a Batch API da OpenAI cobram cargas de trabalho assíncronas a 50% das tarifas padrão.

### Alavanca 4: Compressão de Contexto — remover o que o modelo não precisa

**Resumo de conversa.** Um histórico de 40.000 tokens comprimido para um resumo estruturado de 8.000 tokens reduz o custo de entrada em 80% para chamadas subsequentes.

**Poda de resultados de ferramentas.** Um scraping web pode retornar 50.000 tokens de conteúdo bruto quando o agente precisa de 200 tokens de fatos extraídos.

### Alavanca 5: Limites de Orçamento por Agente — aplicação na camada de infraestrutura

A OpenLegion implementa `daily_usd` e `monthly_usd` por agente na camada mesh. Quando o limite é atingido: as chamadas LLM para esse agente são bloqueadas, o pipeline continua, o status do agente bloqueado é atualizado no blackboard.

### Alavanca 6: Controle de Tokens de Saída — saídas estruturadas e geração restrita

**Modo JSON / saídas estruturadas.** Para tarefas que produzem dados estruturados, exigir saída JSON em vez de prosa reduz a contagem de tokens de saída em 40 a 60%.

**Limites explícitos de `max_tokens`.** Definir `max_tokens` no limite superior realista para a tarefa.

## Comparação: Controle de Custos Entre Frameworks de Agentes

| **Dimensão** | **OpenLegion** | **LangGraph** | **CrewAI** | **AutoGen** |
|---|---|---|---|---|
| **Roteamento de modelo integrado** | Sim, campo modelo por agente | Não, manual no código | Não, manual no código | Não, manual no código |
| **Limites de orçamento por agente** | Sim, daily_usd + monthly_usd | Não | Não | Não |
| **Corte rígido de gastos** | Sim, chamadas LLM bloqueadas em excesso | Não | Não | Não |
| **Rastreamento de custos em tempo real** | Sim, Cost Tracker na Zona 2 | Não integrado | Não integrado | Não integrado |

<!-- SCHEMA: FAQPage -->
## Perguntas Frequentes

### O que é otimização de custos LLM?

A otimização de custos LLM é a prática de reduzir os gastos em tokens e computação em sistemas de IA em produção sem degradar a qualidade. Seis alavancas principais cobrem o espaço: roteamento de modelos, cache de prompts (90% de economia), inferência em lote (50% de desconto), compressão de contexto, limites de orçamento por agente e controle de tokens de saída. Aplicadas juntas, essas alavancas alcançam regularmente reduções de custo de 50 a 80%.

### Quanto o cache de prompts pode reduzir os custos LLM?

O cache de prompts da Anthropic, lançado em 2024-08-14, reduz os custos de tokens de entrada em até 90% em contexto repetido. Um prompt de sistema de 10.000 tokens custa $0,05 por chamada sem cache e $0,005 com cache aos preços do Claude Opus 4.8. A OpenAI oferece aproximadamente 50% de economia em tokens de entrada em cache via cache automático no GPT-4o.

### O que é roteamento de modelos em agentes de IA?

O roteamento de modelos despacha cada etapa em um pipeline de agente para o modelo mais barato que possa lidar com ela de forma confiável. Databricks Genie alcançou redução de custos de 61% aplicando esse padrão.

### O que é a API de inferência em lote da Anthropic?

A API Message Batches da Anthropic processa solicitações de forma assíncrona a 50% das tarifas padrão. A OpenAI oferece uma API Batch similar com o mesmo desconto de 50%.

### Como funcionam os limites de orçamento por agente na OpenLegion?

Cada agente na OpenLegion tem limites `daily_usd` e `monthly_usd` aplicados na camada mesh pelo Cost Tracker na Zona 2. Quando um agente atinge seu limite, as chamadas LLM para esse agente são bloqueadas imediatamente. O restante do pipeline continua funcionando.

### Como a compressão de contexto reduz os custos de tokens LLM?

A compressão de contexto remove tokens de chamadas de API que não contribuem para a qualidade de saída: resumo do histórico de conversação (um contexto de 40.000 tokens comprimido para 8.000 tokens reduz o custo de entrada em 80%), poda de resultados de ferramentas para campos essenciais.

### O que é negação de carteira e como os limites de orçamento a previnem?

Negação de carteira é OWASP LLM10:2025, um ataque onde um agente é manipulado para consumir tokens ilimitados. Os limites de orçamento por agente com cortes rígidos em nível de infraestrutura previnem isso: quando o limite é atingido, as chamadas LLM são bloqueadas pela camada mesh, não pelo próprio agente.

## Execute Agentes com Custos Integrados na Arquitetura

Para a plataforma que aplica limites de orçamento na camada de infraestrutura, ver a [visão geral da plataforma de agentes IA](/learn/ai-agent-platform).

[Executar agentes de produção com limites de orçamento aplicados na camada de infraestrutura](https://openlegion.ai)
