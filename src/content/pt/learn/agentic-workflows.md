---
title: Fluxo de trabalho agêntico - Padrões, segurança e design em produção
description: Um fluxo de trabalho agêntico é um processo de IA de múltiplas etapas onde agentes escolhem ferramentas autonomamente, delegam subtarefas e se adaptam com base em resultados intermediários. Padrões centrais, modos de falha e design seguro.
slug: /learn/agentic-workflows
primary_keyword: fluxo de trabalho agêntico
secondary_keywords:
  - padrões fluxo trabalho agêntico
  - segurança fluxo trabalho agêntico
  - react loop agente ia
  - plan and execute ia
  - design fluxo trabalho agente ia
date_published: "2026-05"
last_updated: "2026-05-27"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /comparison/langgraph
  - /comparison/crewai
---

# Fluxo de trabalho agêntico: Padrões, segurança e design em produção

Um fluxo de trabalho agêntico é um processo de IA de múltiplas etapas no qual um ou mais agentes decidem de forma autônoma quais ferramentas chamar, quando delegar subtarefas a outros agentes e como adaptar sua abordagem com base nos resultados intermediários. Ao contrário de um pipeline fixo onde cada etapa é codificada e executada exatamente uma vez, um fluxo de trabalho agêntico é dinâmico: o agente lê seu ambiente, raciocina sobre o estado e escolhe a próxima ação. Essa autonomia é a funcionalidade. Também é a superfície de ataque.

OpenLegion é uma plataforma de agentes de IA com foco em segurança que trata o design de fluxos de trabalho agênticos como uma disciplina de engenharia: cada etapa é executada em um container isolado, as credenciais nunca estão presentes no processo do agente, e cada loop de iteração tem uma condição de parada rígida aplicada no nível da infraestrutura.

<!-- SCHEMA: DefinitionBlock -->

> **O que é um fluxo de trabalho agêntico?**
> Um fluxo de trabalho agêntico é um processo de IA de múltiplas etapas no qual agentes autônomos selecionam ferramentas, delegam subtarefas e atualizam seu plano de execução com base em resultados intermediários, em contraste com pipelines estáticos onde cada etapa é fixada no momento do design.

## TL;DR

- **Quatro padrões centrais**: loop ReAct, planejar-e-executar, loop de reflexão, fan-out paralelo. Cada um tem modos de falha distintos.
- **ReAct** (Reason + Act, Yao et al. 2023) é o padrão mais amplamente implementado, usado no LangGraph, OpenAI Agents SDK, AutoGen e OpenLegion.
- **Vetor de ataque principal**: injeção de prompt via resultados de ferramentas (OWASP LLM Top 10 2025, LLM02). Uma página web ou documento malicioso pode sequestrar a próxima ação do agente.
- **Loops descontrolados não são casos extremos**: um loop de reflexão ou ReAct sem condição de parada rígida funcionará até que seu orçamento se esgote.
- **Medidas OpenLegion**: orçamento de etapas por agente (limite rígido de iteração), isolamento por container (uma etapa comprometida não pode acessar credenciais de outros agentes), zero telemetria.
- **Orçamento de etapas vs. orçamento de tokens**: ambos importam. Orçamentos de tokens limitam gastos; orçamentos de etapas limitam loops de raciocínio ilimitados.

## O que torna um fluxo de trabalho agêntico diferente de um pipeline

Um pipeline tradicional executa uma sequência fixa: etapa 1, etapa 2, etapa 3. O desenvolvedor define cada transição no momento do design. O sistema é determinístico: a mesma entrada produz o mesmo caminho de execução.

Um fluxo de trabalho agêntico introduz um ponto de decisão em cada etapa. O agente lê o estado atual, escolhe uma ação (chamar uma ferramenta, delegar a outro agente, produzir uma resposta final ou iterar novamente) e atualiza o estado. O caminho de execução é determinado em tempo de execução pelo modelo, não pelo desenvolvedor.

Essa distinção tem implicações diretas de segurança. Em um pipeline fixo, o raio de impacto de uma etapa comprometida se limita às saídas dessa etapa. Em um fluxo de trabalho agêntico, uma etapa comprometida pode instruir o agente a realizar ações adicionais: chamar APIs externas, exfiltrar dados, gerar saídas maliciosas que afetam etapas posteriores. O [guia de segurança de agentes de IA](/learn/ai-agent-security) cobre o modelo de ameaças completo; esta página foca em como a escolha do padrão de fluxo de trabalho afeta a superfície de ataque.

## Os quatro padrões centrais dos fluxos de trabalho agênticos

### Padrão 1: Loop ReAct (Reason + Act)

**O que é.** Introduzido por Yao et al. (2023), o ReAct entrelaça rastros de raciocínio com chamadas de ação em um único loop. Em cada etapa, o modelo produz um Pensamento (raciocínio sobre o estado atual), uma Ação (chamada de ferramenta ou delegação) e uma Observação (o resultado da ferramenta). O loop continua até que o modelo produza uma resposta final.

**Onde é usado.** O ReAct é o loop padrão no LangGraph, OpenAI Agents SDK, chat de grupo do AutoGen e OpenLegion. É o padrão de fluxo de trabalho agêntico mais amplamente implantado.

**Modos de falha:**
- **Loop ilimitado**: sem um limite rígido de iteração, um agente ReAct pode iterar indefinidamente.
- **Injeção de prompt via observação**: a etapa de Observação é a principal superfície de ataque. OWASP LLM02 (Injeção de prompt) é o principal risco para fluxos de trabalho baseados em ReAct.
- **Inflação da janela de contexto**: longas cadeias ReAct acumulam triplos pensamento/ação/observação no contexto.

**Medida OpenLegion**: orçamento de etapas por agente (contagem máxima de iterações aplicada pelo orquestrador) mais isolamento por container.

### Padrão 2: Planejar-e-executar

**O que é.** Um agente Planejador produz uma decomposição completa de tarefas antecipadamente. Um ou mais agentes Executores então realizam cada etapa do plano, sem replanejamento entre as etapas.

**Vantagens sobre o ReAct.** Separar o planejamento da execução reduz significativamente o custo de tokens: o raciocínio intensivo ocorre uma vez no Planejador. O caminho de execução também é inspecionável antes de ser executado.

**Modos de falha:**
- **Deriva do plano**: se um Executor encontra um resultado inesperado no meio do plano, pode prosseguir com o plano obsoleto.
- **Ponto único de falha no Planejador**: uma injeção de prompt que corrompe a saída do Planejador afeta cada etapa de Execução subsequente.
- **Sem replanejamento adaptativo**: o planejar-e-executar puro não pode lidar com tarefas onde resultados intermediários mudam materialmente o que as etapas subsequentes devem fazer.

**Medida OpenLegion**: o Planejador e os Executores rodam em containers separados. Raio de impacto limitado à saída do container do Planejador.

### Padrão 3: Loop de reflexão

**O que é.** Um agente (ou um agente Crítico separado) avalia sua própria saída e itera até que um limiar de qualidade seja atingido. Comum na geração de conteúdo, escrita de código e tarefas de análise.

**Modos de falha:**
- **Iteração descontrolada sem condição de parada**: se o Crítico sempre pode encontrar algo para melhorar, o loop funciona indefinidamente.
- **Erros auto-reforçantes**: um modelo que entende mal a tarefa gerará críticas que reforçam o mal-entendido.
- **Amplificação de custos**: um loop de reflexão de 10 rodadas custa 10 vezes a geração base.

**Medida OpenLegion**: o orçamento de etapas por agente impõe uma contagem máxima de reflexões no nível da infraestrutura.

### Padrão 4: Fan-out paralelo

**O que é.** Múltiplos agentes executam subtarefas independentes simultaneamente. Um agente de Síntese aguarda que todas as ramificações paralelas sejam concluídas e então mescla os resultados.

**Modos de falha:**
- **Amplificação de custos**: N agentes paralelos custam N vezes o equivalente em série.
- **Envenenamento da síntese**: uma saída de ramificação maliciosa pode corromper o resultado mesclado.
- **Conflitos de concorrência e estado compartilhado**: CVE-2025-64168 (Agno, CVSS 7.1) demonstrou isso: uma condição de corrida no estado de sessão compartilhado sob concorrência assíncrona expôs dados de um usuário a outro.

**Medida OpenLegion**: cada agente paralelo roda em seu próprio container Docker isolado. Nenhum estado mutável compartilhado entre ramificações.

## Design de segurança para fluxos de trabalho agênticos

### Ameaça 1: Injeção de prompt via resultados de ferramentas

Os resultados de ferramentas são o principal vetor de injeção em fluxos de trabalho agênticos. OWASP LLM02 (Injeção de prompt) é o principal risco para aplicações LLM no Top 10 de 2025. Para fluxos de trabalho agênticos, o risco é amplificado porque os agentes têm acesso a ferramentas, portanto uma instrução injetada pode causar ações no mundo real.

O OpenLegion aplica sanitização Unicode na ingestão de resultados de ferramentas (56 pontos de controle para overrides bidi, caracteres de tag e caracteres de largura zero) mais isolamento por container para limitar o raio de impacto de qualquer injeção bem-sucedida.

### Ameaça 2: Amplificação de chamadas de ferramentas

Um agente chamando uma ferramenta cara em um loop ReAct sem orçamento de etapas pode fazer centenas de chamadas de ferramentas antes que o desenvolvedor perceba. Incidentes do mundo real incluem agentes rodando durante a noite gerando milhares de chamadas de API para serviços de terceiros, acionando cobranças inesperadas e suspensões por limite de taxa.

O OpenLegion impõe ambos: orçamento de tokens por agente (teto de gasto) e orçamento de etapas por agente (teto de iterações). Qualquer limite para o agente quando atingido.

### Ameaça 3: Exposição de credenciais durante a delegação

Em frameworks onde agentes compartilham um processo Python, o Agente B tem acesso por padrão às variáveis de ambiente do Agente A. Uma etapa de delegação comprometida pode expor todas as credenciais disponíveis para o fluxo de trabalho.

O OpenLegion usa injeção de credenciais por proxy vault via Mesh Host. O container do Agente B recebe apenas as credenciais explicitamente atribuídas na matriz ACL do fleet, não as credenciais do Agente A.

### Ameaça 4: Recursão ilimitada e auto-spawning

Um fluxo de trabalho agêntico que permite que agentes criem sub-agentes sem limite pode ser manipulado para recursão exponencial. O OpenLegion limita isso: a permissão `can_spawn` requer autorização explícita do administrador, a profundidade de sub-agentes é limitada pela configuração do mesh, e os templates de fleet definem uma contagem máxima de agentes.

## Orçamento de etapas vs. orçamento de tokens: por que você precisa de ambos

Os orçamentos de tokens limitam o gasto total por agente por dia. Eles são necessários mas não suficientes. Um orçamento de tokens não impede que um loop ReAct execute 500 iterações usando ferramentas baratas. Um orçamento de etapas limita o número de iterações de raciocínio ou chamadas de ferramentas, independentemente do custo de tokens.

O OpenLegion implementa ambos: orçamento de tokens aplicado pelo Cost Tracker na Zona 2, e orçamento de etapas aplicado pelo orquestrador no nível da infraestrutura.

## Projetando fluxos de trabalho agênticos para produção

### Escolher o padrão certo para a tarefa

| Tipo de tarefa | Padrão recomendado | Por quê |
|---|---|---|
| **Pesquisa aberta** | Loop ReAct com orçamento de etapas | Precisa de seleção adaptativa de ferramentas; limitar o loop |
| **Tarefa estruturada de múltiplas etapas** | Planejar-e-executar | Plano inspecionável; reduz custo de tokens |
| **Geração sensível à qualidade** | Loop de reflexão com limite de etapas | Auto-correção; parada rígida previne loops descontrolados |
| **Coleta de dados em paralelo** | Fan-out + síntese | Subtarefas independentes; isolamento por agente |
| **Processamento de documentos longos** | Fan-out + mesclagem sequencial | Paraleliza o processamento por fragmentos |

### Definir condições de parada antes do deploy

Cada loop em um fluxo de trabalho agêntico precisa de uma condição de parada explícita aplicada no nível da infraestrutura. Se o modelo decide quando parar, uma injeção de prompt pode impedi-lo de parar.

### Validar saídas nas fronteiras de etapas

Cada fronteira de etapa é uma oportunidade de validar que a saída corresponde ao esquema esperado antes de passá-la para a próxima etapa. A coordenação fleet-modelo do OpenLegion aplica validadores de saída em cada ponto de transferência. Ver o [guia de orquestração de agentes de IA](/learn/ai-agent-orchestration) para detalhes de implementação.

### Limitar permissões ao mínimo necessário

Cada agente deve ter apenas as ferramentas e permissões necessárias para sua etapa específica. Agentes com excesso de permissões ampliam o raio de impacto de qualquer comprometimento. A matriz ACL por agente na configuração fleet do OpenLegion impõe permissões mínimas no nível do orquestrador.

## Frameworks de fluxos de trabalho agênticos: comparação de suporte a padrões

| Framework | ReAct | Planejar-e-executar | Reflexão | Fan-Out | Orçamento etapas | Isolamento container |
|---|---|---|---|---|---|---|
| **OpenLegion** | Sim | Sim | Sim | Sim | Sim (rígido) | Sim (obrigatório) |
| **LangGraph** | Sim | Sim | Sim | Sim | Não embutido | Não |
| **CrewAI** | Sim (Flows) | Sim (Crews) | Limitado | Sim (parallel) | Não | Não (apenas CodeInterpreter) |
| **OpenAI Agents SDK** | Sim | Limitado | Limitado | Sim (handoffs) | Não | Não |
| **AutoGen** | Sim | Sim | Sim | Sim (group chat) | Não | Docker apenas para código |

Para uma comparação detalhada de segurança e arquitetura desses frameworks, ver a [comparação de frameworks de agentes de IA](/learn/ai-agent-frameworks).

## A perspectiva da OpenLegion

Os fluxos de trabalho agênticos são onde a dívida de segurança da maioria dos frameworks se torna visível em produção. Loops ReAct sem orçamentos de etapas geraram cobranças de API surpresa de cinco e seis dígitos. CVE-2025-64168 (Agno, CVSS 7.1, outubro de 2025) demonstrou que fluxos de trabalho agênticos concorrentes compartilhando um processo Python podem expor o estado de sessão de um usuário a outro sob alta carga assíncrona. OWASP LLM02 (Injeção de prompt, Top 10 2025) identifica a injeção via resultados de ferramentas como o principal vetor de ataque contra fluxos de trabalho agênticos baseados em ReAct.

O OpenLegion aborda três propriedades arquiteturalmente: orçamentos de etapas rígidos (contagem máxima de iterações aplicada pelo orquestrador), isolamento por container por agente (nenhum estado mutável compartilhado entre ramificações paralelas) e injeção de credenciais por proxy vault (transferências de delegação são roteadas pela Zona 2). Estas não são opções de configuração: são a arquitetura padrão.

A troca: OpenLegion tem aproximadamente 59 estrelas no GitHub contra LangGraph com aproximadamente 25.200 e CrewAI com aproximadamente 44.600. Para uma comparação de como esses padrões são implementados nos frameworks, ver a [comparação de frameworks de agentes de IA](/learn/ai-agent-frameworks).

## CTA

**Construa fluxos de trabalho agênticos com condições de parada rígidas, não esperadas.**
[Começar](https://app.openlegion.ai) | [Documentação](https://docs.openlegion.ai) | [Aprender: Orquestração de agentes de IA](/learn/ai-agent-orchestration)

---

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que é um fluxo de trabalho agêntico?

Um fluxo de trabalho agêntico é um processo de IA de múltiplas etapas onde um ou mais agentes selecionam ferramentas de forma autônoma, delegam subtarefas a outros agentes e adaptam seu plano de execução com base em resultados intermediários. Ao contrário de pipelines estáticos com etapas fixas, o caminho de execução de um fluxo de trabalho agêntico é determinado em tempo de execução pelo raciocínio do modelo. Os quatro padrões centrais são o loop ReAct, o planejar-e-executar, o loop de reflexão e o fan-out paralelo, cada um com modos de falha e implicações de segurança distintos.

### O que é o padrão ReAct nos fluxos de trabalho agênticos?

O ReAct (Reason + Act) foi introduzido por Yao et al. em 2023 e entrelaça rastros de raciocínio com chamadas de ferramentas em um único loop. Em cada etapa, o modelo produz um Pensamento (raciocínio), uma Ação (chamada de ferramenta) e uma Observação (resultado da ferramenta). O ReAct é o padrão de fluxo de trabalho agêntico padrão no LangGraph, OpenAI Agents SDK, AutoGen e OpenLegion. Seus principais modos de falha são a iteração ilimitada e a injeção de prompt via resultados de ferramentas.

### Como prevenir loops descontrolados em fluxos de trabalho agênticos?

A única forma confiável de prevenir loops descontrolados é aplicar uma condição de parada no nível da infraestrutura, sem depender que o modelo pare por si só. Dois controles são necessários: um orçamento de etapas (contagem máxima de iterações ou chamadas de ferramentas, aplicado pelo orquestrador) e um orçamento de tokens (gasto máximo, aplicado pelo cost tracker). Orçamentos de tokens sozinhos não param loops de alta frequência com ferramentas baratas. Orçamentos de etapas sozinhos não limitam custos altos de LLM por iteração. O OpenLegion impõe ambos por agente como limites rígidos.

### O que é planejar-e-executar nos fluxos de trabalho agênticos?

O planejar-e-executar divide um fluxo de trabalho agêntico em duas fases: um agente Planejador produz uma decomposição completa de tarefas antecipadamente, e um ou mais agentes Executores realizam cada etapa sem replanejamento. Isso reduz o custo de tokens em comparação com o ReAct (raciocínio intensivo uma vez vs. a cada etapa) e torna o caminho de execução inspecionável antes de ser executado. O principal modo de falha é a deriva do plano: se um Executor encontra um resultado inesperado, pode continuar com um plano obsoleto em vez de sinalizar a discrepância.

### Qual é o principal risco de segurança nos fluxos de trabalho agênticos?

O principal vetor de ataque é a injeção de prompt via resultados de ferramentas (OWASP LLM02, Top 10 2025). Quando um agente lê uma página web, arquivo, registro de banco de dados ou resposta de API externa, esse conteúdo chega como entrada confiável. Um documento malicioso pode conter instruções que redirecionam o agente para ações não pretendidas. As medidas incluem sanitização Unicode na ingestão de resultados de ferramentas, validação de esquema de saída nas fronteiras de etapas e isolamento por container para limitar o raio de impacto de qualquer injeção bem-sucedida.

### Como funciona o fan-out paralelo nos fluxos de trabalho agênticos?

O fan-out paralelo faz múltiplos agentes trabalharem simultaneamente em subtarefas independentes e então mescla os resultados em uma etapa de Síntese. Reduz o tempo de relógio para tarefas que se decompõem em fluxos de trabalho independentes. Os modos de falha são amplificação de custos (N agentes custam N vezes mais), envenenamento da síntese (uma saída de ramificação maliciosa corrompendo o resultado mesclado) e conflitos de estado compartilhado em frameworks onde agentes concorrentes compartilham estado de processo mutável. O OpenLegion faz cada agente paralelo rodar em um container Docker isolado com seu próprio estado, prevenindo conflitos de estado compartilhado e limitando cada ramificação independentemente.

### O que é deriva do plano nos fluxos de trabalho agênticos?

A deriva do plano ocorre em fluxos de trabalho planejar-e-executar quando agentes Executores encontram resultados intermediários inesperados mas continuam executando o plano original em vez de sinalizar a discrepância. As medidas incluem pontos de controle explícitos de validação do plano, portões de aprovação humana em etapas críticas do plano e protocolos de transferência estruturados que surfaciam discrepâncias antes de prosseguir. A coordenação fleet-modelo do OpenLegion suporta pontos de controle com humano no loop via integrações de canais em qualquer ponto de transferência.

### Como o design de fluxo de trabalho agêntico difere da orquestração de agentes de IA?

O design de fluxo de trabalho agêntico se concentra na anatomia no nível de etapa: qual padrão (ReAct, planejar-e-executar, reflexão, fan-out), quais condições de parada, como os resultados de ferramentas são validados e como as credenciais são delimitadas em cada etapa. A orquestração de agentes de IA se concentra na coordenação no nível do fleet: como múltiplos fluxos de trabalho são sequenciados, como os agentes transferem trabalho entre si, como o estado compartilhado é gerenciado em um sistema multi-agente. O [guia de orquestração de agentes de IA](/learn/ai-agent-orchestration) cobre as primitivas de coordenação no nível do fleet que operam sobre os padrões de fluxo de trabalho descritos aqui.
