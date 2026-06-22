---
title: "Padrões de transferência de agentes: roteamento de tarefas entre agentes IA"
description: "Os padrões de transferência de agentes definem como os agentes IA transferem tarefas, contexto e credenciais: transferência push, despacho pull, roteamento por ponteiro blackboard e transferência em streaming para sistemas multi-agente."
slug: /learn/agent-handoff-patterns
primary_keyword: "agent handoff patterns"
last_updated: "2026-06-14"
schema_types:
  - FAQPage
related:
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/agentic-workflows
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-observability
---

# Padrões de transferência de agentes: roteamento de tarefas entre agentes IA

Os padrões de transferência de agentes são os protocolos pelos quais um agente IA transfere uma tarefa, o contexto acumulado e a autoridade de execução para outro agente. Eles determinam quais dados cruzam o limite, o que é descartado e se as credenciais viajam com a tarefa. A maioria das falhas de transferência não são falhas de roteamento; são perdas de contexto ou vazamentos de credenciais que só se manifestam quando um agente posterior falha silenciosamente ou um agente comprometido exfiltra dados sensíveis da carga útil.

<!-- SCHEMA: DefinitionBlock -->
Um padrão de transferência de agentes é um padrão de design de software que rege como um agente IA autônomo delega uma tarefa a um agente par ou especialista, especificando o contrato de dados para a transferência de contexto, o mecanismo de roteamento para a entrega de tarefas e as garantias de isolamento que impedem vazamentos de credenciais ou contexto entre agentes.

## Os quatro padrões de transferência canônicos

### Transferência push: o chamador acorda diretamente o chamado

Na transferência push, o agente chamador constrói uma carga útil contendo o contexto de tarefa e notifica diretamente o agente receptor, tipicamente chamando uma função, enviando uma mensagem ou invocando uma API que acorda o chamado. O chamador controla exatamente quais dados o chamado recebe, quando os recebe e qual agente trata a tarefa.

A transferência push é o padrão usado pela primitiva `handoff()` do SDK OpenAI Agents (27.133 estrelas GitHub, MIT). O chamador pode opcionalmente passar uma função `input_filter` que remove ou transforma campos de contexto antes da transferência. Sem `input_filter`, toda a janela de contexto passa ao chamado, incluindo qualquer conteúdo sensível acumulado.

**Pontos fortes**: baixa latência, controle direto sobre o roteamento, fácil de rastrear em ferramentas de observabilidade.  
**Riscos**: o chamador deve remover explicitamente credenciais e contexto sensível; o acoplamento estreito entre chamador e chamado exige alterações ao adicionar ou remover agentes especialistas.

### Despacho pull: o chamado reivindica de uma fila compartilhada

No despacho pull, o agente chamador escreve uma tarefa em uma fila compartilhada ou caixa de entrada sem notificar diretamente nenhum agente específico. Os agentes chamados monitoram a fila e reivindicam tarefas que correspondem às suas capacidades. Isso permite balanceamento de carga em um pool de workers e desacopla o chamador do conhecimento de qual agente específico irá tratar o trabalho.

O despacho pull reduz a exposição de credenciais: a mensagem de fila contém apenas uma descrição de tarefa e um ponteiro de chave de saída, não o contexto completo do chamador.

**Pontos fortes**: escalonamento horizontal, acoplamento laxo, balanceamento de carga natural.  
**Riscos**: a profundidade da fila pode crescer sem limite sob carga; as garantias de ordem dependem da semântica da fila; a observabilidade requer correlacionar IDs de tarefas.

### Roteamento blackboard: isolamento de contexto baseado em ponteiros

Na transferência por ponteiro blackboard, o chamador escreve sua saída em uma chave nomeada em um armazenamento persistente compartilhado, por exemplo `output/researcher/task_abc123`, e envia ao chamado apenas o nome da chave. O chamado lê a chave e recupera exatamente os campos de que precisa. Credenciais brutas, scratchpads intermediários e o contexto completo do chamador nunca aparecem na mensagem de transferência.

A função `hand_off()` da OpenLegion implementa esse padrão nativamente: ela escreve dados de saída em `output/{agent_id}/{handoff_id}` no blackboard, cria uma entrada de tarefa na caixa de entrada do destinatário com um ponteiro para essa chave, e acorda o destinatário. Credenciais armazenadas no vault são injetadas pelo mesh no momento da execução.

**Pontos fortes**: isolamento máximo de credenciais, o chamado lê apenas o que precisa, trilha de auditoria completa via histórico de versões de chave.  
**Riscos**: adiciona uma operação de leitura; requer um armazenamento compartilhado confiável com controles de acesso apropriados.

### Transferência em streaming: transferência de contexto incremental

Na transferência em streaming, o contexto é transferido token por token ou fragmento por fragmento à medida que o agente chamador o gera, em vez de aguardar a saída completa. Isso minimiza a latência de ponta a ponta em pipelines em tempo real.

A transferência em streaming carrega o maior risco de exposição de credenciais: o fluxo pode incluir conteúdo sensível gerado no meio do raciocínio antes que o chamador pudesse filtrá-lo.

**Pontos fortes**: menor latência de ponta a ponta, colaboração multi-agente em tempo real.  
**Riscos**: o mais difícil de proteger, o mais complexo de observar, requer que o chamado trate o contexto parcial com elegância.

## A visão da OpenLegion: por que perda de contexto e vazamentos de credenciais são os verdadeiros bugs de transferência

A maioria das falhas de transferência multi-agente cai em duas categorias: bugs de perda de contexto e bugs de vazamento de credenciais. Ambos são evitáveis por design.

**Números sobre perda de contexto**: avaliações de compressão de contexto LLM mostram que o truncamento ingênuo no limite de transferência degrada as taxas de conclusão de tarefas em comparação com a sumarização estruturada. A solução não é uma janela de contexto maior, mas uma carga útil de transferência estruturada com campos explícitos para trabalho concluído, trabalho restante e descobertas-chave.

**Vazamento de credenciais**: OWASP LLM06:2025 (Divulgação de Informações Sensíveis) cobre explicitamente a exfiltração de credenciais via passagem de mensagens entre agentes como uma das 10 principais vulnerabilidades LLM.

### O problema de perda de contexto: o que é descartado no limite

A causa raiz da perda de contexto é a discrepância entre o que o agente chamador sabe e o que a carga útil de transferência comunica. Cargas úteis estruturadas evitam isso: o chamador preenche explicitamente campos: objetivo de tarefa, trabalho concluído até agora, subtarefas pendentes, descobertas-chave e ponteiro de chave de saída.

### Exfiltração de credenciais via cargas úteis de transferência (OWASP LLM06:2025)

`transfer_to_agent()` do Google ADK passa o objeto `Session` completo, incluindo histórico de conversa, ao agente receptor, criando uma transferência de contexto de até 32.000 tokens por padrão. As equipes devem auditar suas implementações de transferência contra a [segurança de agentes IA: isolamento de credenciais e defesa contra injeção de prompt](/learn/ai-agent-security).

### O padrão ponteiro blackboard como padrão seguro

O padrão ponteiro blackboard elimina a exposição de credenciais no nível do protocolo em vez de depender da filtragem na camada de aplicação. Credenciais armazenadas no vault da OpenLegion nunca são injetadas no contexto do agente.

## Como os principais frameworks implementam a transferência

### SDK OpenAI Agents: handoff() com input_filter (27.133 estrelas)

openai/openai-agents-python (27.133 estrelas GitHub, licença MIT) implementa handoff() como um padrão push. O parâmetro `input_filter` foi adicionado na v0.0.5 (março de 2025) e requer opt-in explícito.

```python
from agents import Agent, handoff, RunContextWrapper

def strip_credentials(ctx: RunContextWrapper, input_data: ResearchInput) -> ResearchInput:
    return ResearchInput(task=input_data.task, context=input_data.context)

researcher = Agent(
    name="researcher",
    handoffs=[handoff(writer_agent, input_filter=strip_credentials)]
)
```

### Google ADK: transfer_to_agent() e transferência do objeto Session (20.100 estrelas)

google/adk-python (20.100 estrelas GitHub, Apache-2.0) implementa transferência via `transfer_to_agent()`, que passa o objeto `Session` completo incluindo histórico de conversa. O agente receptor recebe tudo e deve descartar explicitamente o histórico irrelevante.

### LangGraph: Command(goto=) com estado tipado compartilhado

LangGraph (langchain-ai/langgraph, Apache-2.0) implementa roteamento de agentes via `Command(goto='nome_nodo')` com atualizações de estado opcionais. O estado é um dict tipado compartilhado entre todos os nós do grafo. O modelo de estado compartilhado do LangGraph não fornece isolamento de credenciais entre nós.

```python
from langgraph.types import Command

def researcher_node(state: AgentState) -> Command:
    result = researcher.invoke(state)
    return Command(
        goto="writer",
        update={"research_output": result, "completed_steps": state["completed_steps"] + ["research"]}
    )
```

### OpenLegion: hand_off() com ponteiro blackboard e entrega na caixa de entrada

A função `hand_off()` da OpenLegion implementa a transferência por ponteiro blackboard nativamente.

```python
hand_off(
    to="writer",
    summary="Pesquisa concluída: langchain-alternative, 2847 palavras de material fonte",
    data='{"topic": "langchain-alternative", "sources_key": "research/langchain-alt-sources", "word_count_target": 3000}'
)
```

## Contratos de dados de transferência

### O que incluir: resumo de tarefa, chave de saída, histórico relevante

Uma carga útil de transferência bem projetada é uma especificação estruturada, não um despejo de transcrição. Incluir:

- **Resumo de tarefa** (máximo 200 palavras): o que o chamado deve realizar
- **Ponteiro de chave de saída**: a chave blackboard onde a saída do chamador está armazenada
- **Resumo do trabalho concluído**: o que já foi feito, formulado como fatos
- **Subtarefas pendentes**: os itens específicos pelos quais o chamado é responsável
- **Parâmetros estruturados**: quaisquer entradas tipadas que a tarefa do chamado requer

### O que excluir: credenciais brutas, janelas de contexto completas, scratchpads intermediários

Excluir das cargas úteis de transferência:
- **Chaves API, tokens e credenciais**: devem ser injetados pelo mesh no momento da execução
- **Transcrições completas de conversa**: truncar a resumos relevantes
- **Scratchpads de raciocínio intermediário**: a cadeia de pensamento do chamador não é útil para o chamado
- **Dados que o papel do chamado não requer**: aplicar mínimo privilégio ao contexto

## Mecanismos de roteamento de transferência

### Roteamento estático: IDs de agentes codificados em duro

O roteamento estático envia cada transferência de um tipo dado a um agente nomeado específico. Simples de implementar, fácil de rastrear. Falha quando o agente alvo está indisponível, sobrecarregado ou substituído.

### Roteamento dinâmico: especialista selecionado por LLM

O roteamento dinâmico usa uma chamada LLM para selecionar o agente especialista apropriado com base nas características da tarefa. Oferece flexibilidade mas adiciona latência e introduz a possibilidade de erros de roteamento.

### Roteamento condicional: escalonamento baseado em regras

O roteamento condicional aplica regras determinísticas para selecionar o agente alvo. Mais previsível que o roteamento LLM, mas requer definição explícita de regras para cada condição de roteamento.

### Tratamento de fallbacks e timeouts

Cada transferência deve definir o que acontece quando o chamado não responde dentro de uma janela de timeout. Opções:
- **Tentar novamente com o mesmo chamado**: apropriado quando a falha provavelmente é transitória
- **Redirecionar para um agente alternativo**: apropriado quando o chamado principal está persistentemente indisponível
- **Escalar ao operador**: apropriado quando a tarefa requer julgamento humano
- **Escrever falha no blackboard e continuar**: apropriado quando a tarefa posterior é opcional

## Comparação de segurança e confiabilidade dos padrões de transferência

| **Dimensão** | **Transferência push** | **Despacho pull** | **Roteamento blackboard** | **Transferência streaming** |
|---|---|---|---|---|
| **Mecanismo de roteamento** | Chamada direta de acordar ao chamado | Fila compartilhada / reivindicação na caixa de entrada | Escrita de chave + vigilância do chamado | Fluxo de tokens incremental |
| **Isolamento de contexto** | O chamador controla a carga útil; input_filter necessário | Apenas mensagem de fila | Mais alto: o chamado lê apenas a chave nomeada | Mais baixo: o contexto completo cruza o limite |
| **Risco de exposição de credenciais** | Médio: depende do opt-in input_filter | Baixo: a fila contém apenas ponteiro de tarefa | Muito baixo: credenciais nunca na carga útil | Alto: o fluxo pode incluir contexto sensível |
| **Observabilidade** | Evento de rastreamento único por transferência | Profundidade de fila + eventos de reivindicação | Histórico de versões de chave + eventos de caixa de entrada | Rastreamento no nível de tokens necessário |
| **Latência** | Mais baixa | Baixa (overhead de leitura de fila) | Baixa (overhead de leitura blackboard) | Mais baixa de ponta a ponta (streaming) |
| **Melhor para** | Delegação especializada estreitamente acoplada | Pools de workers com carga equilibrada | Pipelines assíncronos desacoplados | Colaboração em tempo real |

<!-- SCHEMA: FAQPage -->
## Perguntas frequentes

### O que é um padrão de transferência de agentes?

Um padrão de transferência de agentes é um protocolo para transferir uma tarefa de um agente IA para outro, especificando quais dados de contexto cruzam o limite, como o agente receptor é notificado e quais garantias de isolamento impedem vazamentos de credenciais ou memória. Os quatro padrões canônicos são a transferência push, o despacho pull, o roteamento por ponteiro blackboard e a transferência em streaming, cada um com diferentes compromissos de segurança, latência e observabilidade.

### Como o SDK OpenAI Agents implementa a transferência?

O SDK OpenAI Agents (27.133 estrelas GitHub, MIT) implementa handoff() como um padrão push. O agente chamador invoca handoff() com um agente alvo e uma função opcional input_filter que remove campos do contexto antes da transferência. O parâmetro input_filter foi adicionado na v0.0.5 (março de 2025) e requer opt-in explícito; sem ele, a janela de contexto completa passa ao chamado.

### Como o Google ADK implementa a transferência de agentes?

O Google ADK (20.100 estrelas GitHub, Apache-2.0) usa transfer_to_agent(), que passa o objeto Session completo incluindo histórico de conversa ao agente receptor. Isso cria uma transferência de contexto de até 32.000 tokens por padrão. O agente receptor recebe o histórico completo e deve descartar explicitamente o contexto anterior irrelevante.

### O que é o padrão de transferência por ponteiro blackboard e por que é mais seguro?

Na transferência por ponteiro blackboard, o chamador escreve sua saída em uma chave nomeada em um armazenamento compartilhado (como output/agent-id/task-id), depois envia ao chamado apenas o ponteiro de chave, não os dados em si. O chamado lê apenas os campos de que precisa. Credenciais nunca aparecem na mensagem de transferência, eliminando o vetor de exfiltração OWASP LLM06:2025. A função hand_off() da OpenLegion implementa esse padrão nativamente.

### Quais riscos de segurança existem na transferência de agentes?

O risco principal é a exfiltração de credenciais: frameworks que incluem variáveis de ambiente, tokens bearer ou chaves API no objeto de contexto passado durante a transferência os expõem ao agente receptor, que pode estar comprometido. OWASP LLM06:2025 identifica isso como uma vulnerabilidade LLM top 10. O risco secundário é o envenenamento de contexto.

### Como lidar com falhas de transferência e timeouts?

Pipelines de transferência robustos definem um timeout e um caminho de fallback: tentar novamente com o mesmo chamado, redirecionar para um especialista alternativo, escalar para um operador humano ou escrever um registro de falha no blackboard. O agente chamador deve rastrear IDs de transferência e monitorar eventos de conclusão de tarefa.

### Quais dados incluir em uma carga útil de transferência?

Incluir: um resumo conciso de tarefa (menos de 200 palavras), um ponteiro para a chave de dados de saída no armazenamento compartilhado, fatos do trabalho concluído, subtarefas pendentes e quaisquer parâmetros estruturados exigidos pelo papel do chamado. Excluir: credenciais API brutas, transcrições completas de conversa, scratchpads de raciocínio intermediário e quaisquer dados que o papel do chamado não necessite.

## Transferência segura de agentes na OpenLegion

O limite de transferência é a origem da maioria dos problemas de confiabilidade multi-agente. A perda de contexto degrada a qualidade das tarefas posteriores, e os vazamentos de credenciais na carga útil criam riscos de exfiltração que crescem com o comprimento do pipeline.

A transferência por ponteiro blackboard da OpenLegion resolve ambos os problemas no nível do protocolo. `hand_off()` escreve saídas em uma chave nomeada, entrega apenas um ponteiro à caixa de entrada do destinatário e se baseia na injeção de credenciais com proxy de vault. O destinatário lê exatamente o que precisa, nada mais.

Para a camada de monitoramento que detecta falhas que o protocolo de transferência perde, consulte [observabilidade de agentes: rastrear transferências nas etapas do pipeline](/learn/ai-agent-observability). Para a camada de framework que determina qual padrão de transferência escolher, consulte [comparação de frameworks de agentes IA para implantações em produção](/learn/ai-agent-frameworks).

[Construir pipelines multi-agente seguros na OpenLegion →](https://openlegion.ai)
