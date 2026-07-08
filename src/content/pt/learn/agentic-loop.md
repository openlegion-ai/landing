---
title: "Loop Agêntico: Como Agentes de IA Percebem, Pensam e Agem"
description: "O loop agêntico é o ciclo perceber-pensar-agir de cada agente de IA. Aprenda a mecânica do loop, estratégias de terminação e como prevenir loops infinitos e gastos descontrolados."
slug: /learn/agentic-loop
primary_keyword: agentic loop
last_updated: "2026-07-08"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/agentic-ai-design-patterns
  - /learn/ai-agent-planning
  - /learn/ai-agent-tool-use
  - /learn/ai-agent-prompt-injection
  - /learn/ai-agent-cost
---

# Loop Agêntico: Como Agentes de IA Percebem, Pensam e Agem

Um loop agêntico é o ciclo repetitivo perceber-pensar-agir que impulsiona um agente de IA do início da tarefa até a resposta final. Em cada iteração, o agente lê o contexto — observações, resultados de ferramentas, memória — chama um LLM para raciocinar sobre os próximos passos, executa uma ferramenta ou retorna uma resposta, e depois repete. Limites de iteração, condições de terminação e tratamento de erros determinam se um agente de produção é confiável ou um risco — OpenLegion impõe limites rígidos na camada mesh, transformando loops descontrolados em falhas determinísticas.

## O Que é um Loop Agêntico?

<!-- SCHEMA: DefinitionBlock -->

> **Um loop agêntico** é um modelo de execução iterativo no qual um agente de IA observa alternadamente seu ambiente, raciocina sobre a próxima ação usando um modelo de linguagem, e executa essa ação, repetindo até que uma condição de terminação seja atendida: conclusão da tarefa, iterações máximas ou esgotamento do orçamento.

Todo agente de IA, independentemente do framework, executa alguma variante deste loop. O loop é a unidade de execução do agente: uma única passagem por perceber → pensar → agir. Uma tarefa simples (responder uma pergunta de uma única pesquisa web) é concluída em 2–3 iterações. Uma tarefa complexa (pesquisar um concorrente, sintetizar descobertas, redigir um relatório) pode executar 15–30 iterações. O número de iterações não é definido pela tarefa — emerge do raciocínio do agente e dos resultados de suas chamadas de ferramentas.

O loop tem três entradas e uma saída por iteração:

| **Entrada/Saída** | **Conteúdo** | **Acumulado entre iterações?** |
|---|---|---|
| **Prompt do sistema** | Papel do agente, instruções, definições de ferramentas | Não — fixo por execução |
| **Histórico de conversa** | Todos os turnos anteriores: mensagens do usuário, pensamentos do assistente, chamadas de ferramentas, resultados de ferramentas | Sim — cresce a cada iteração |
| **Observação atual** | Resultado de ferramenta da ação anterior (primeira iteração: mensagem inicial do usuário) | Sim — adicionado a cada iteração |
| **Saída** | Próxima ação: uma chamada de ferramenta, uma solicitação de esclarecimento ou uma resposta final | Não — uma saída por iteração |

A acumulação de contexto é o principal motor de custos do loop. A 2.000 tokens por par de iterações em uma tarefa de 20 iterações, a última iteração envia 40.000 tokens como contexto de entrada. O preço do modelo é por token, não por tarefa — ver [como controlar os custos do loop agêntico com limites de gastos por agente](/learn/ai-agent-cost).

## As Três Fases em Detalhe

### Perceber — Ler o Contexto

A fase de percepção monta a visão atual do agente do mundo: tudo o que o LLM lerá antes de decidir o que fazer a seguir. Isso inclui o prompt do sistema, o histórico de conversa e a nova observação (resultado da ferramenta da iteração anterior).

A fase de percepção é a principal **superfície de ataque de injeção de prompt** do loop agêntico. CVE-2024-5184 (Synopsys CyRC, junho 2024) demonstra exatamente isso: um ataque de injeção de prompt entregue via conteúdo de resposta de ferramenta que sequestra a próxima iteração de loop do agente. Para um tratamento completo de vetores de injeção e defesas, ver [ataques de injeção de prompt que visam respostas de ferramentas no loop agêntico](/learn/ai-agent-prompt-injection).

### Pensar — A Etapa de Raciocínio LLM

A fase de pensar é a chamada LLM. A saída é uma de:
- Uma **chamada de ferramenta** (estruturada: nome da ferramenta + parâmetros)
- Uma **resposta final** (texto livre)
- Uma **solicitação de esclarecimento** (texto livre endereçado ao usuário)

O modelo canônico para a fase de pensar é o **padrão ReAct** (Yao et al., 2022, arXiv:2210.03629): **Re**asoning + **Act**ing intercalados dentro da mesma saída LLM. O paper ReAct demonstrou que intercalar raciocínio explícito com ações melhora significativamente a precisão das tarefas do agente em benchmarks incluindo HotpotQA, FEVER e ALFWorld.

**Custo da etapa de pensar:** para GPT-4o a $2,50/M tokens de entrada, uma execução de 20 iterações com 2.000 tokens adicionados por iteração custa aproximadamente $1,05 em tokens de entrada apenas para a janela de contexto da última iteração. Ver [planejamento de agentes de IA — como agentes decompõem objetivos antes do início do loop](/learn/ai-agent-planning) para estratégias que reduzem o número de iterações.

### Agir — Execução de Ferramenta ou Resposta Final

A fase de agir executa a ação selecionada na fase de pensar. O executor de ferramentas deve validar o nome da ferramenta, os parâmetros, executar em contexto isolado e retornar o resultado sem modificação. Para padrões de implementação de ferramentas e o modelo de segurança de execução, ver [como agentes executam ferramentas dentro de cada iteração de loop](/learn/ai-agent-tool-use).

## Terminação do Loop — Quando os Agentes Param

### Terminação Natural

A terminação natural ocorre quando a etapa de pensar do LLM produz uma resposta final em vez de uma chamada de ferramenta.

### Aplicação de max_turns

**Valores padrão:**
- **OpenAI Agents SDK:** `max_turns = 10` (abril 2026)
- **LangGraph:** `recursion_limit = 25`
- **LangChain AgentExecutor:** `max_iterations = 15`, sem limite de tempo por padrão
- **AutoGen:** `max_consecutive_auto_reply = 10` por agente

**Configuração para produção:** defina max_turns com base na medição empírica do percentil 95 do número de iterações em 100 tarefas representativas; defina max_turns como P95 + 20% de margem.

### Terminação Baseada em Orçamento

**Modelo de aplicação do OpenLegion:**
- `daily_budget` ($50/dia padrão) e `monthly_budget` ($200/mês padrão) configurados por agente em `INSTRUCTIONS.md`
- O roteador mesh rastreia gastos acumulados por ID de agente em tempo real
- Quando uma iteração de loop excederia o orçamento diário restante, a solicitação é rejeitada na camada mesh antes de atingir o provedor LLM

### Terminação Baseada em Erros

Três estratégias: abortar no erro, repetir com backoff, ou usar alternativa e continuar.

## Anti-Padrões de Loop Infinito

O relatório de estado dos agentes LangChain 2025 descobriu que **23% das falhas de agentes foram causadas por loops infinitos de chamadas de ferramentas** — a maior categoria de falhas.

### Tempestade de Chamadas de Ferramentas

Ocorre quando a etapa de pensar do agente chama repetidamente a mesma ferramenta sem progredir. Gatilhos comuns: especificação de tarefa ambígua, validação ausente de resultados de ferramentas, raciocínio circular.

### Envenenamento de Contexto

Ocorre quando um resultado de ferramenta introduz conteúdo no histórico de conversa que distorce o raciocínio do LLM. Prevenção: pré-processamento de resultados de ferramentas — remover HTML, truncar documentos grandes a seções relevantes, retornar resumos estruturados.

### Injeção de Prompt via Resposta de Ferramenta

O gatilho de loop infinito mais crítico para a segurança: CVE-2024-5184 (Synopsys CyRC, junho 2024). Defesa: tratar cada resultado de ferramenta como entrada não confiável. Para um tratamento completo das defesas contra injeção, ver [ataques de injeção de prompt que visam respostas de ferramentas no loop agêntico](/learn/ai-agent-prompt-injection).

## A Perspectiva do OpenLegion: Defesa em Profundidade para Controle de Loops

O controle de loops é uma propriedade de segurança, não apenas operacional. Os três números concretos que definem o problema:

**23% das falhas de agentes rastreadas a loops infinitos de chamadas de ferramentas** (LangChain 2025). A solução não é um limite max_turns mais alto. São condições de terminação mensuráveis, verificações de progresso explícitas e lógica de circuit-breaker.

**OpenAI Agents SDK max_turns padrão = 10; LangGraph recursion_limit = 25.** Estes são valores padrão de ponto de partida, não valores de produção. Configure limites de terminação para a distribuição de tarefas.

**CVE-2024-5184 é uma vulnerabilidade de controle de loop, não apenas uma vulnerabilidade de segurança.** A superfície de ataque é cada chamada de ferramenta externa.

| **Mecanismo de controle de loop** | **OpenLegion** | **LangChain AgentExecutor** | **LangGraph** | **OpenAI Agents SDK** |
|---|---|---|---|---|
| **Limite de iteração** | max_turns em INSTRUCTIONS.md, aplicado no mesh | max_iterations=15 (padrão) | recursion_limit=25 | max_turns=10 (padrão) |
| **Terminação baseada em orçamento** | daily_budget + monthly_budget por agente, aplicado na camada mesh | Não integrado | Não integrado | Não integrado |
| **Terminação de erro** | Erro estruturado retornado ao orquestrador | Lança AgentExecutorError | Lança GraphRecursionError | Lança MaxTurnsExceeded |
| **Defesa contra injeção** | Chamadas de ferramentas proxificadas por vault; autoridade do prompt do sistema | handle_parsing_errors configurável | Não integrado | Não integrado |
| **Trilha de auditoria de loop** | Cada iteração registrada com agent_id, modelo, chamada de ferramenta, custo | LangSmith (opcional) | LangSmith (opcional) | Painel OpenAI |

Para os padrões que compõem múltiplos loops de agentes em sistemas de produção, ver [como os fluxos de trabalho agênticos compõem múltiplos loops em pipelines de produção](/learn/agentic-workflows) e [padrões de design de IA agêntica para orquestração de loops e coordenação de agentes](/learn/agentic-ai-design-patterns).

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é um loop agêntico?

Um loop agêntico é o ciclo repetitivo perceber-pensar-agir que cada agente de IA executa para realizar uma tarefa. Em cada iteração, o agente lê seu contexto atual, chama um modelo de linguagem para decidir a próxima ação, executa essa ação e depois repete até que uma condição de terminação seja atendida: conclusão natural, um limite rígido de iterações (max_turns), esgotamento do orçamento ou um erro irrecuperável.

### Quantas iterações um loop agêntico executa?

Tarefas simples geralmente se completam em 2–5 iterações. Tarefas complexas executam 10–30 iterações ou mais. Defina max_turns com base no percentil 95 empírico para seu agente específico em sua distribuição de tarefas específica, com uma margem de 20%.

### O que causa um loop agêntico infinito?

As três principais causas de loop infinito são: tempestades de chamadas de ferramentas, envenenamento de contexto e injeção de prompt via conteúdo de resposta de ferramenta (CVE-2024-5184). O relatório LangChain 2025 descobriu que 23% das falhas de agentes foram causadas por loops infinitos de chamadas de ferramentas.

### O que é o padrão ReAct em loops agênticos?

ReAct (Reasoning + Acting) é o modelo canônico de loop agêntico introduzido por Yao et al. em 2022 (arXiv:2210.03629). O padrão estrutura cada iteração de loop como uma saída LLM de três partes: um Pensamento, uma Ação e uma Observação. O paper ReAct demonstrou que intercalar raciocínio explícito com ações melhora a precisão das tarefas do agente, avaliado em HotpotQA, FEVER e ALFWorld.

### Como a injeção de prompt afeta o loop agêntico?

A injeção de prompt via conteúdo de resposta de ferramenta — demonstrada por CVE-2024-5184 (Synopsys CyRC, junho 2024) — explora a fase de percepção do loop agêntico. Quando uma ferramenta recupera conteúdo externo, esse conteúdo entra no histórico de conversa como resultado de ferramenta. Se o conteúdo contiver instruções injetadas, o LLM pode processar essas instruções na próxima etapa de pensar. A defesa requer uma hierarquia de instruções explícita que aplique a autoridade do prompt do sistema sobre o conteúdo dos resultados de ferramentas.

### Como o OpenLegion previne loops agênticos descontrolados?

O OpenLegion aplica defesa em profundidade com duas camadas de aplicação. Os limites de iteração por agente configurados em INSTRUCTIONS.md são aplicados na camada de aplicação. Os daily_budget e monthly_budget por agente são aplicados na camada do roteador mesh antes de cada chamada LLM. Quando uma iteração de loop excederia o orçamento restante, a solicitação é rejeitada na camada de rede. Uma injeção de prompt que instrui o agente a ignorar limites de orçamento não pode substituir a verificação de orçamento do roteador mesh.

### Qual é a diferença entre um loop agêntico e um fluxo de trabalho?

Um loop agêntico é o ciclo de iteração por agente. Um fluxo de trabalho (ou fluxo de trabalho agêntico) é um pipeline multi-agente onde múltiplos agentes, cada um executando seus próprios loops, são compostos em um sistema maior com lógica de transferência explícita, orquestração e fluxo de dados entre agentes.

## Comece com OpenLegion

O loop agêntico é onde a confiabilidade do agente é ganha ou perdida. Padrões do framework — max_turns=10, recursion_limit=25 — são pontos de partida, não configurações de produção.

OpenLegion impõe limites de orçamento e limites de iteração na camada mesh — fora de banda do raciocínio LLM do agente, não substituível por injeção de prompt.

[Comece a construir no OpenLegion](https://app.openlegion.ai) — limites rígidos de loop e aplicação de orçamento por agente integrados.

Para os padrões que compõem múltiplos loops de agentes em sistemas de produção, ver [como os fluxos de trabalho agênticos compõem múltiplos loops em pipelines de produção](/learn/agentic-workflows).
