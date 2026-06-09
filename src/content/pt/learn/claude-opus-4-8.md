---
title: Claude Opus 4.8 - Capacidades, custo e desempenho agêntico
description: "Claude Opus 4.8 lançado em 28 de maio de 2026: 84% no Online-Mind2Web, modo rápido 3x mais barato, fluxos de trabalho dinâmicos no Claude Code, primeiro Opus a completar cada caso do benchmark Super-Agent com paridade de custo com GPT-5.5."
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

# Claude Opus 4.8: Desempenho agêntico, preços do modo rápido e o que mudou desde o Opus 4.7

Claude Opus 4.8 é a atualização da classe Opus da Anthropic de 28 de maio de 2026. Obtém 84% na precisão do agente de navegador Online-Mind2Web, é o primeiro modelo a completar cada caso de um benchmark Super-Agent com paridade de custo com GPT-5.5, e corrige a regressão de verbosidade de chamadas de ferramentas do Opus 4.7. O modo rápido funciona a 2,5x de velocidade e tem preço 3x mais barato que o modo rápido para modelos Opus anteriores. Os preços padrão da API são inalterados em relação ao 4.7. O identificador do modelo de API é `claude-opus-4-8-20260528`.

<!-- SCHEMA: DefinitionBlock -->

> **O que é Claude Opus 4.8?**
> Claude Opus 4.8 é a atualização da Anthropic da classe de modelos Opus de maio de 2026, um modelo de linguagem de grande porte de nível frontier otimizado para tarefas agênticas de longa duração, raciocínio de múltiplas etapas e uso autônomo de ferramentas, com desempenho aprimorado em benchmarks sobre o Opus 4.7, correções de regressões de confiabilidade de chamadas de ferramentas e um modo rápido (raciocínio estendido a 2,5x a velocidade) com preço 3x mais barato que o modo rápido para modelos Opus anteriores.

## A visão da OpenLegion: O modelo que muda a economia agêntica

Opus 4.8 é o modelo que recomendamos para qualquer agente realizando trabalho agêntico substancial a partir de maio de 2026. Três coisas mudaram desde o Opus 4.7 que importam para frotas de agentes em produção.

Primeiro: a correção de confiabilidade de chamadas de ferramentas. Scott Wu (CEO da Cognition / Devin) confirmou publicamente que o Opus 4.7 introduziu inconsistências de verbosidade de comentários e chamadas de ferramentas que degradaram a confiabilidade de engenharia autônoma do Devin. Opus 4.8 corrige ambas. Para agentes em loops de uso de ferramentas ajustados, esta é a diferença entre um modelo que requer correções frequentes e um que completa tarefas de forma limpa.

Segundo: 84% no Online-Mind2Web (superando GPT-5.5) e a primeira varredura completa do benchmark Super-Agent com paridade de custo com GPT-5.5. Online-Mind2Web mede a conclusão real de tarefas baseadas em navegador. O benchmark Super-Agent cobriu tradução, pesquisa aprofundada, criação de slides e análise de ponta a ponta. Opus 4.8 completou cada caso; GPT-5.5 não.

Terceiro: modo rápido a 3x menor custo. A Databricks relatou custo de token 61% mais barato em relação ao Opus 4.7 no agente Genie deles. Para tarefas de longa duração onde antes se escolhia Sonnet por custo e aceitava menor qualidade, o modo rápido do Opus 4.8 muda o cálculo.

O anúncio da Anthropic veio no mesmo dia que sua rodada Série H de 65 bilhões USD com avaliação pós-dinheiro de 965 bilhões USD.

A OpenLegion suporta o catálogo completo de modelos da API Anthropic. Definir `claude-opus-4-8-20260528` como padrão de sua frota é uma única alteração de configuração. Chamadas API isoladas por cofre, limites de orçamento por agente e execução isolada em contêiner se aplicam automaticamente, [o que uma plataforma de agentes de IA fornece para executar Opus 4.8 com controles de orçamento e isolamento de cofre](/learn/ai-agent-platform).

## Desempenho em benchmarks: O que os números mostram

### Online-Mind2Web: 84% de precisão do agente de navegador

Online-Mind2Web é um benchmark para conclusão de tarefas agênticas baseadas em navegador: preencher formulários, navegar por fluxos de múltiplas páginas, extrair informações de interfaces web ao vivo. Claude Opus 4.8 obteve 84% no Online-Mind2Web em maio de 2026, superando Claude Opus 4.7 e GPT-5.5. Esta é a pontuação mais alta publicada nesse benchmark na data de lançamento do Opus 4.8. Para desenvolvedores implantando agentes de automação de navegador, este é o número operacional.

### Benchmark Super-Agent: Primeira varredura completa com paridade de custo com GPT-5.5

Kay Zhu, co-fundador e CTO, relatou que Claude Opus 4.8 é o primeiro modelo a completar cada caso de ponta a ponta no benchmark Super-Agent interno cobrindo: tradução em escala, síntese de pesquisa aprofundada, construção de apresentações a partir de dados brutos e análise de múltiplas fontes. GPT-5.5 não completou cada caso. Opus 4.8 alcançou isso com paridade de custo com GPT-5.5.

### CursorBench: Chamadas de ferramentas mais eficientes em cada nível de esforço

O benchmark de codificação interno do Cursor mede qualidade de geração de código e eficiência de uso de ferramentas. Claude Opus 4.8 supera modelos Opus anteriores em cada nível de esforço no CursorBench: menos tokens desperdiçados em comentários verbosos significa que mais do orçamento de tokens vai para trabalho real.

### Legal Agent Benchmark: Primeiro a superar o padrão all-pass de 10%

Leya (uma plataforma de IA jurídica), relatada por Niko Grupen (Chefe de Pesquisa Aplicada), confirmou que Claude Opus 4.8 é o primeiro modelo a superar 10% no padrão all-pass do Legal Agent Benchmark. O padrão all-pass exige que cada etapa em um fluxo de trabalho jurídico de múltiplas etapas seja correta: um único erro falha o caso inteiro.

### Databricks Genie: 61% mais barato que Opus 4.7

A Databricks relatou que Claude Opus 4.8 oferece custo de token 61% mais barato em comparação com Opus 4.7 para seu agente Genie, um agente de IA para análise de dados e trabalho de conhecimento usando raciocínio multimodal sobre PDFs e diagramas.

## O que mudou desde o Opus 4.7

### Correção de chamadas de ferramentas: A regressão de verbosidade que prejudicou o Devin e cargas de trabalho autônomas

Claude Opus 4.7 introduziu uma regressão no comportamento de chamadas de ferramentas que várias equipes de produção notaram de forma independente: agentes produziam comentários inline excessivos, envolviam saídas com prosa explicativa desnecessária e ocasionalmente faziam chamadas de ferramentas duplicadas ou redundantes.

Scott Wu (CEO da Cognition / Devin) confirmou publicamente que o Opus 4.7 tinha "problemas de verbosidade de comentários e chamadas de ferramentas" que o Opus 4.8 corrige. Equipes que fizeram downgrade do Opus 4.7 para Opus 4.6 por confiabilidade de uso de ferramentas devem reavaliar com Opus 4.8.

### Fluxos de trabalho dinâmicos no Claude Code

Claude Code ganha fluxos de trabalho dinâmicos com Opus 4.8: a capacidade de lidar com problemas de grande escala criando, sequenciando e gerenciando estruturas de fluxo de trabalho de múltiplas etapas. Claude Code pode planejar uma migração de base de código grande, criar subtarefas, executá-las em sequência enquanto rastreia o estado intermediário e adaptar seu plano com base nos resultados em cada etapa. Disponível no Claude Code usando Opus 4.8 a partir de 28 de maio de 2026.

### Modo rápido: 2,5x de velocidade a 3x menor custo

O modo rápido para Claude Opus 4.8 funciona a 2,5x a velocidade do Opus padrão usando raciocínio estendido, e tem preço 3x mais barato que o modo rápido para modelos Opus anteriores incluindo Opus 4.7. Os preços padrão (sem modo rápido) são inalterados em relação ao Opus 4.7.

O modo rápido é ativado via parâmetro `budget_tokens` na configuração de raciocínio estendido da API. Definir `budget_tokens` para um valor mais baixo ativa o comportamento do modo rápido.

## Referência de API e preços

### Identificador do modelo

O identificador do modelo de API para Claude Opus 4.8 é `claude-opus-4-8-20260528`. Use esta string no parâmetro `model` de qualquer chamada à API Anthropic, no campo de ID de modelo do Amazon Bedrock ou na referência de modelo do Google Cloud Vertex AI.

### Disponibilidade

Claude Opus 4.8 está disponível por três canais: a API Anthropic diretamente (api.anthropic.com), Amazon Bedrock e Google Cloud Vertex AI. Os três canais suportam o mesmo conjunto de funcionalidades incluindo raciocínio estendido e modo rápido.

### Janela de contexto

Claude Opus 4.8 usa a mesma janela de contexto que Opus 4.7 (200K tokens) e os mesmos preços padrão de tokens de entrada/saída. As melhorias de custo estão concentradas no modo rápido.

## Quando usar Opus 4.8 vs Sonnet 4 vs Opus 4.7

### Opus 4.8: Tarefas agênticas de longa duração, automação de navegador, codificação em grande escala

Escolha Opus 4.8 quando a qualidade da tarefa for a restrição. Agentes autônomos de longa duração em loops de uso de ferramentas ajustados se beneficiam da correção de confiabilidade de chamadas de ferramentas. Agentes de automação de navegador (Online-Mind2Web: 84%) superam qualquer outro modelo neste tipo de tarefa. Análise jurídica e financeira que requer encadeamento sem erros é o domínio do Opus 4.8.

Para [frameworks de agentes de IA que acessam Claude Opus 4.8 via API Anthropic](/learn/ai-agent-frameworks), o caminho de migração é uma troca de identificador de modelo para `claude-opus-4-8-20260528`.

### Sonnet 4: Pipelines de alto volume e sensíveis à latência

Escolha Sonnet 4 quando volume e latência forem a restrição. Chamadas de API de alta frequência onde o custo por token determina a economia unitária, pipelines de resposta em tempo real onde a latência é visível para usuários finais. Sonnet 4 e o modo rápido do Opus 4.8 agora ocupam níveis adjacentes de custo/qualidade: equipes devem comparar ambos para sua carga de trabalho específica.

### Quando Opus 4.7 ainda se aplica

O único caso para ficar no Opus 4.7: prompts especificamente ajustados para seus padrões de verbosidade. Se seu pipeline pós-processa a saída do Opus e depende da estrutura de comentários que o Opus 4.7 gerou, fique no 4.7 até ter tempo para se adaptar. Teste com Opus 4.8 antes de migrar prompts de produção.

Para [design de fluxo de trabalho agêntico e como as melhorias de julgamento do Opus 4.8 mudam a confiabilidade de execução](/learn/ai-agent-orchestration), a correção de chamadas de ferramentas é a mudança mais impactante para fluxos de trabalho com cinco ou mais chamadas de ferramentas por tarefa.

## OpenLegion e Claude Opus 4.8

A OpenLegion suporta `claude-opus-4-8-20260528` como opção de modelo de frota. Defini-lo como padrão para um agente é um único campo na configuração do agente:

```
model: anthropic/claude-opus-4-8-20260528
```

Todos os controles de segurança da OpenLegion se aplicam automaticamente às chamadas do Opus 4.8: injeção de credenciais via proxy de cofre (a chave API nunca entra no contêiner do agente), limites de orçamento diários e mensais por agente (um loop descontrolado do Opus 4.8 não pode esgotar sua cota de API sem atingir o limite), isolamento de contêiner Docker e registro de auditoria completo.

Para comparações de múltiplos agentes, veja [OpenLegion vs LangGraph ao implantar Opus 4.8 em arquitetura de frota baseada em grafo vs plana](/comparison/langgraph) e [OpenLegion vs AutoGen com Opus 4.8 em sistemas multi-agente de processo compartilhado vs contêiner isolado](/comparison/autogen).

## Comece com Claude Opus 4.8 na OpenLegion

**Defina `claude-opus-4-8-20260528` como padrão de sua frota. Isolado por cofre, com limite de orçamento, pronto para produção.**
[Começar a construir](https://app.openlegion.ai) | [Ler a documentação](https://docs.openlegion.ai) | [Ver a plataforma](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que é Claude Opus 4.8?

Claude Opus 4.8 é a atualização da Anthropic da classe de modelos Opus, anunciada em 28 de maio de 2026. Baseia-se no Claude Opus 4.7 com melhor julgamento agêntico, melhor desempenho em benchmarks de codificação, raciocínio e trabalho de conhecimento profissional, e correções a problemas de verbosidade de chamadas de ferramentas que afetavam cargas de trabalho autônomas do Opus 4.7. Introduz fluxos de trabalho dinâmicos no Claude Code para problemas de múltiplas etapas em grande escala e modo rápido a 2,5x de velocidade agora 3x mais barato que o modo rápido para modelos Opus anteriores.

### Como Claude Opus 4.8 se compara ao GPT-5.5?

Em benchmarks relevantes para tarefas agênticas, Claude Opus 4.8 supera ou iguala GPT-5.5 em múltiplas avaliações independentes. No Online-Mind2Web, Opus 4.8 obteve 84%, superando GPT-5.5. Em um benchmark Super-Agent interno, Opus 4.8 foi o primeiro modelo a completar cada caso de ponta a ponta, superando GPT-5.5 com paridade de custo. No Legal Agent Benchmark, Opus 4.8 é o primeiro a superar 10% no padrão all-pass.

### Quanto mais barato é o modo rápido de Claude Opus 4.8 comparado ao Opus 4.7?

O modo rápido para Claude Opus 4.8 funciona a 2,5x a velocidade normal usando raciocínio estendido e tem preço 3x mais barato que o modo rápido para modelos Opus anteriores incluindo Opus 4.7. Os preços padrão do Opus 4.8 (sem modo rápido) são inalterados em relação ao Opus 4.7. A Databricks relatou custo de token 61% mais barato em relação ao Opus 4.7 para seu agente Genie.

### Quais eram os problemas de chamadas de ferramentas do Opus 4.7 que o Opus 4.8 corrige?

Claude Opus 4.7 introduziu inconsistências de verbosidade de comentários e chamadas de ferramentas que reduziram a confiabilidade para cargas de trabalho de engenharia autônoma. A Cognition (fabricantes do agente de codificação autônoma Devin) relatou via CEO Scott Wu que Opus 4.7 era menos consistente que Opus 4.6, e que Opus 4.8 corrige tanto a regressão de verbosidade de comentários quanto as inconsistências de chamadas de ferramentas. Equipes usando Opus 4.7 em loops de uso de ferramentas ajustados que observaram saídas mais ruidosas ou mais etapas de correção do que o esperado devem testar Opus 4.8 como substituto direto.

### Qual é o identificador de modelo de API do Claude Opus 4.8?

O identificador do modelo de API para Claude Opus 4.8 é `claude-opus-4-8-20260528`. Está disponível via API Anthropic diretamente, Amazon Bedrock e Google Cloud Vertex AI. O modo rápido (raciocínio estendido a 2,5x a velocidade) é ativado via parâmetro `budget_tokens` na configuração de raciocínio estendido. Os preços padrão são idênticos ao Opus 4.7; os preços do modo rápido são 3x mais baixos que os do modo rápido para modelos Opus anteriores.

### O que são fluxos de trabalho dinâmicos no Claude Code com Opus 4.8?

Fluxos de trabalho dinâmicos é uma funcionalidade no Claude Code lançada junto com Opus 4.8 que permite lidar com problemas de grande escala criando, sequenciando e gerenciando dinamicamente estruturas de fluxo de trabalho de múltiplas etapas. Claude Code pode planejar uma grande refatoração ou migração, criar subtarefas, executá-las em sequência enquanto rastreia o estado e se adaptar com base nos resultados intermediários. Isso torna o Claude Code viável para grandes migrações de base de código, builds de funcionalidades completos que abrangem múltiplos arquivos e serviços, e mudanças de múltiplos repositórios.
