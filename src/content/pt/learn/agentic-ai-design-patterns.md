---
title: "Padroes de design de IA agentica: ReAct, Plan-and-Execute, Reflexion e mais"
description: "ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker, Mixture-of-Agents: padroes de design de IA agentica com trade-offs, modos de falha, portoes de seguranca e orientacao de selecao."
slug: /learn/agentic-ai-design-patterns
primary_keyword: padroes de design de IA agentica
last_updated: "2026-06-25"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-planning
  - /learn/ai-agent-reliability
  - /learn/multi-agent-systems
  - /learn/ai-agent-security
---

# Padroes de design de IA agentica: ReAct, Plan-and-Execute, Reflexion e mais

Os padroes de design de IA agentica sao solucoes arquitetonicas nomeadas e reutilizaveis para problemas recorrentes de coordenacao de agentes -- cada um com estrutura definida, trade-offs conhecidos, modos de falha caracteristicos e implicacoes de seguranca. Escolher o padrao errado produz falhas concretas: ReAct em tarefas de longo horizonte causa thrash da janela de contexto; Plan-and-Execute sem replanejamento acumula erros em planos desatualizados; Reflexion sem saneamento de memoria permite envenenamento persistente de memoria. Seis padroes em duas categorias: padroes de raciocinio de agente unico (ReAct, Plan-and-Execute, Reflexion) e padroes de coordenacao multiagente (Critic-Actor, Supervisor-Worker, Mixture-of-Agents).

<!-- SCHEMA: DefinitionBlock -->

> **Os padroes de design de IA agentica** sao solucoes arquitetonicas nomeadas e reutilizaveis para problemas recorrentes em design de sistemas de agentes -- especificando como um agente raciocina, planeja, reflete, delega e se recupera de falhas -- cada um com estrutura definida, trade-offs conhecidos, modos de falha caracteristicos e implicacoes de seguranca que os profissionais devem considerar antes da implantacao em producao.

## Como ler este guia: Estrutura de padroes e heuristicas de selecao

### Componentes de padroes: Estrutura, trade-offs, modos de falha, portoes de seguranca

Cada padrao neste guia e descrito com quatro componentes:

**Estrutura**: o arranjo arquitetonico em prosa -- quais agentes ou instancias de modelo existem, como se comunicam, como e o fluxo de dados e qual e o artefato chave.

**Trade-offs**: para que o padrao otimiza versus o que sacrifica. ReAct otimiza para ancoragem em ferramentas de verdade fundamental mas sacrifica eficiencia da janela de contexto. Plan-and-Execute otimiza para eficiencia de contexto e inspecionabilidade mas sacrifica adaptabilidade.

**Modos de falha**: as formas especificas pelas quais cada padrao falha em producao que nao sao obvias a partir de resultados de benchmarks academicos.

**Portoes de seguranca**: os controles especificos necessarios para prevenir o modo de falha de seguranca caracteristico de cada padrao.

### Heuristica de selecao de padroes: Duracao da tarefa x Reversibilidade x Nivel de autonomia

Tres eixos determinam com qual padrao comecar:

**Duracao da tarefa**: tarefas curtas (ate 5 chamadas de ferramentas) -- ReAct. Tarefas de horizonte medio (6-20 passos) -- Plan-and-Execute. Tarefas longas ou abertas (20+ passos) -- Reflexion ou Supervisor-Worker.

**Reversibilidade**: se todas as acoes sao reversiveis, qualquer padrao se aplica. Se algumas acoes sao irreversiveis (exclusao de arquivos, envio de e-mails, escritas em banco de dados), adicione um portao Critic-Actor antes dessas acoes especificas.

**Nivel de autonomia**: L1-L2 -- ReAct ou Plan-and-Execute. L3 -- Reflexion ou Supervisor-Worker com contencao do raio de impacto por funcao. L4 -- nao implantado em producao sem infraestrutura de seguranca reforcada.

## ReAct: Raciocinio e acao entrelaados

### Estrutura: Loop Pensamento -> Acao -> Observacao

ReAct (Reasoning + Acting), Yao et al. do Google Brain e Princeton (arXiv outubro 2022, ICLR 2023), entrelaca raciocinio em cadeia de pensamento com chamadas de ferramentas em um unico bloco de notas de janela de contexto. O loop:

```
Thought: [raciocinio em cadeia de pensamento ancorado na Observacao anterior]
Action: [chamada de ferramenta -- nome da funcao e parametros]
Observation: [resultado da ferramenta retornado pela execucao]
[repetir ate:]
Thought: Tenho informacoes suficientes para responder.
Action: Finish[resposta final]
```

Resultados de benchmark do artigo original: HotpotQA -- 57,1% de correspondencia exata com ReAct vs 43,2% apenas cadeia de pensamento (+14 pontos). FEVER -- 75,4% vs 66,4% (+9 pontos).

### Trade-offs: Verdade fundamental vs crescimento da janela de contexto

A vantagem principal do ReAct e o raciocinio ancorado em Observacoes. O custo e o crescimento da janela de contexto. Em uma tarefa com 20 chamadas de ferramentas com uma media de 200 tokens por triple, o bloco de notas sozinho consome 4.000 tokens.

### Modo de falha: Injecao no bloco de notas

O modo de falha de seguranca do ReAct visa diretamente o bloco de notas. Se qualquer Observacao de ferramenta contiver conteudo adversarial, esse conteudo e adicionado verbatim ao bloco de notas.

Tres mitigacoes necessarias em conjunto:
1. Sanear cada Observacao antes de adicionar ao bloco de notas
2. Pre-registrar cada Acao na Zona 2 antes do despacho
3. Tratar cada Observacao de ferramenta como entrada nao confiavel

## Plan-and-Execute: Separar planejamento de execucao

### Estrutura: O Planejador gera decomposicao completa de tarefas antes de qualquer execucao

Plan-and-Execute separa duas preocupacoes que ReAct entrelaca: um agente Planejador recebe o objetivo e gera uma decomposicao completa de tarefas antes de qualquer execucao comecar.

Eficiencia da janela de contexto: o plano e compacto (50-150 tokens para a maioria das tarefas). Em tarefas de longo horizonte, produz aproximadamente 40-60% de reducao da janela de contexto vs ReAct.

### Trade-offs: Eficiencia vs desatualizacao do plano

O modo de falha principal e a desatualizacao do plano. O plano e gerado em T=0. Se o ambiente mudar durante a execucao, os passos restantes podem ser baseados em pre-condicoes invalidas.

### Portao de seguranca: Inspecao do plano antes do despacho

O plano e um artefato discreto disponivel antes de qualquer chamada de ferramenta -- verificacao automatizada de politica de pre-execucao: analisar o plano para tipos de acoes proibidos, verificar que cada nome de ferramenta aparece na lista de acoes permitidas do agente.

## Reflexion: Aprender com falhas por reforcamento verbal

### Estrutura: Refletir -> Armazenar -> Condicionar a proxima tentativa

Reflexion (Shinn et al., Northeastern/MIT/Princeton, arXiv marco 2023, NeurIPS 2023) e um padrao de aprendizado por reforcamento verbal: apos o fracasso de uma tentativa de tarefa, o agente gera uma reflexao em linguagem natural, armazena em um buffer de memoria episodica e condiciona a proxima tentativa na reflexao recuperada.

Resultados de benchmark: HumanEval coding pass@1 -- 91% com Reflexion vs 80% (+11 pontos). ALFWorld -- 97% vs 73% (+24 pontos).

### Risco de seguranca: Envenenamento de memoria episodica

O modo de falha de seguranca do Reflexion e distinto e mais persistente do que o risco de injecao no bloco de notas do ReAct. Se uma Observacao contiver conteudo adversarial, a reflexao gerada pode codificar orientacao controlada pelo atacante indefinidamente.

Quatro mitigacoes necessarias em sequencia: saneamento de reflexao antes do armazenamento; armazenamento versionado no blackboard com atribuicao agent_id; TTL de reflexao; portao de revisao HITL para reflexoes que propoem mudancas categoricas de comportamento.

## Critic-Actor: Separar avaliacao de execucao

### Estrutura: O Ator propoe, o Critico intercepta antes da execucao

O padrao Critic-Actor, derivado de RLHF e Constitutional AI (Anthropic, 2022), separa a geracao de acoes da avaliacao de acoes. Um modelo Ator propoe uma acao; um modelo Critico avalia a acao proposta contra uma politica; apenas acoes que passam na avaliacao do Critico procedem para a camada de chamada de ferramentas.

Detalhe de implementacao critico: o Critico deve ter uma janela de contexto independente do Ator. Um Critico same-context compartilha o contexto completo do Ator -- uma injecao de prompt que corrompe a proposta do Ator tambem corrompe a avaliacao do Critico.

### Quando usar Critic-Actor: Limite de irreversibilidade

Critic-Actor adiciona latencia e e necessario quando as acoes cruzam um limite de irreversibilidade: exclusao de arquivos, envio de e-mails, escritas em banco de dados, chamadas POST de API externas.

## Supervisor-Worker: Coordenacao multiagente baseada em funcoes

### Estrutura: O Supervisor decompooe, os Workers executam no escopo da funcao

Supervisor-Worker tem um agente Supervisor que decompoe objetivos e despacha tarefas para agentes Worker especializados com funcoes definidas e conjuntos de ferramentas restritos:
- ResearchWorker: ferramentas = `web_search`, `read_file`, `read_url`
- CodeWorker: ferramentas = `run_command`, `write_file`, `read_file`
- CommWorker: ferramentas = `send_email`, `post_message`

### Propriedade de seguranca: Contencao do raio de impacto de Workers comprometidos

A propriedade de seguranca principal do Supervisor-Worker e a contencao do raio de impacto: um Worker comprometido so pode chamar ferramentas dentro de sua funcao definida. Um ResearchWorker que recebe uma instrucao injetada para chamar `send_email()` falhara na verificacao de permissoes da Zona 2.

## Mixture-of-Agents: Raciocinio de conjunto em instancias de modelos

### Estrutura: Agregacao multicamada de saidas de modelos

Mixture-of-Agents (MoA), Wang et al. da Together AI (arXiv junho 2024), agrega saidas de multiplas instancias LLM por camadas de refinamento iterativo. Benchmark no AlpacaEval 2.0: 65,1% de taxa de vitorias com MoA de 3 camadas vs 57,5% do GPT-4o -- melhoria de qualidade de 7,6 pontos.

### Trade-offs: Qualidade vs multiplicacao de custos de API

Um MoA de 3 modelos x 3 camadas requer aproximadamente 12 chamadas LLM por solicitacao de usuario vs 1 para um unico modelo -- aproximadamente 12x de aumento de custos de API. MoA nao e apropriado para loops de agentes de alta frequencia e sensiveis a latencia.

## A perspectiva da OpenLegion: Seguranca de padroes e infraestrutura, nao engenharia de prompts

Cada padrao de design agentico neste guia tem um modo de falha de seguranca que o artigo academico original nao cobriu. Os modos de falha de seguranca especificos dos padroes:
- **Injecao no bloco de notas do ReAct**: conteudo adversarial de Observacao injeta passos Thought
- **Injecao no plano do Plan-and-Execute**: o artefato do plano pode ser modificado entre o Planejador e o Executor
- **Envenenamento de memoria do Reflexion**: uma reflexao envenenada persiste no buffer episodico entre sessoes
- **Desvio do Critico same-context**: injetar o contexto do Ator tambem corrompe a avaliacao do Critico
- **Comprometimento do Supervisor**: um Supervisor comprometido pode despachar tarefas arbitrarias para todos os Workers

| **Controle de seguranca** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Registro de Acoes pre-execucao** | Zona 2, nativo | Convencao de desenvolvedor | Convencao de desenvolvedor | Convencao de desenvolvedor | Convencao de desenvolvedor |
| **ACL de plano no Blackboard** | Imposto por infraestrutura | Nao disponivel | Nao disponivel | Nao disponivel | Nao disponivel |
| **Memoria episodica versionada com atribuicao agent_id** | Nativo | Convencao de desenvolvedor | Convencao de desenvolvedor | Convencao de desenvolvedor | Convencao de desenvolvedor |
| **Modelo Critico separado com contexto independente** | Isolamento de agente nativo | Configuracao manual | Configuracao manual | Configuracao manual | Configuracao manual |
| **Aplicacao de permissoes de ferramentas Zona 2 por Worker** | Imposto por infraestrutura | Convencao de desenvolvedor | Convencao de desenvolvedor | Convencao de desenvolvedor | Convencao de desenvolvedor |

[Comece a construir na OpenLegion](https://app.openlegion.ai)

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que sao padroes de design de IA agentica?

Os padroes de design de IA agentica sao solucoes arquitetonicas nomeadas e reutilizaveis para problemas recorrentes em design de sistemas de agentes -- especificando como um agente raciocina, planeja, reflete, delega e se recupera de falhas. Os principais padroes incluem ReAct, Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker e Mixture-of-Agents. Escolher o padrao errado produz falhas concretas: ReAct em tarefas longas causa thrash da janela de contexto; Plan-and-Execute sem gatilho de replanejamento acumula erros; Reflexion sem saneamento de memoria permite envenenamento persistente.

### O que e o padrao ReAct para agentes de IA?

ReAct (Reasoning + Acting), Yao et al. do Google Brain e Princeton (arXiv outubro 2022, ICLR 2023), entrelaca raciocinio em cadeia de pensamento com chamadas de ferramentas e resultados de ferramentas em um unico bloco de notas de janela de contexto, ancorando cada passo de raciocinio em resultados reais de ferramentas. Em benchmarks, ReAct superou apenas cadeia de pensamento em 14 pontos no HotpotQA e 9 pontos no FEVER. O principal trade-off de producao e o crescimento da janela de contexto. O principal risco de seguranca e a injecao no bloco de notas.

### O que e o padrao Plan-and-Execute para agentes de IA?

Plan-and-Execute separa um agente Planejador de agentes Executores, reduzindo o consumo da janela de contexto em aproximadamente 40-60% em tarefas de longo horizonte comparado ao ReAct e permitindo verificacao automatizada de politica de pre-execucao do plano. O modo de falha principal e a desatualizacao do plano, que requer um gatilho de replanejamento.

### O que e o padrao Reflexion para agentes de IA?

Reflexion (Shinn et al., NeurIPS 2023) faz agentes gerarem resumos verbais de falhas de tarefas, armazena em memoria episodica e condiciona tentativas futuras em reflexoes recuperadas. HumanEval coding melhorou de 80% para 91% pass@1 e ALFWorld de 73% para 97%. O risco de seguranca e o envenenamento de memoria episodica: conteudo adversarial pode causar o armazenamento de uma reflexao envenenada que afeta todas as futuras tentativas de tarefas.

### O que e o padrao Critic-Actor para agentes de IA?

O padrao Critic-Actor separa um modelo Critico (avaliando acoes propostas antes da execucao contra uma politica) de um modelo Ator (gerando e executando acoes), garantindo que apenas acoes que passam na avaliacao do Critico alcancem a camada de chamada de ferramentas -- necessario quando as acoes sao irreversiveis. Um modelo Critico separado com janela de contexto independente e significativamente mais forte do que um Critico same-context.

### O que e o padrao Supervisor-Worker para agentes de IA?

Supervisor-Worker tem um agente Supervisor que decompoe objetivos e despacha tarefas para agentes Worker especializados com funcoes definidas e conjuntos de ferramentas restritos, de modo que cada Worker opera sob o principio do minimo privilegio. A contencao do raio de impacto e a principal vantagem de seguranca: um Worker injetado tentando usar uma ferramenta fora de sua funcao falha na verificacao de permissoes da Zona 2.

### O que e Mixture-of-Agents (MoA)?

Mixture-of-Agents (MoA), Wang et al. da Together AI (arXiv junho 2024), agrega saidas de multiplas instancias LLM proposer por camadas de refinamento iterativo, corrigindo erros nao correlacionados entre instancias de modelos. No AlpacaEval 2.0, um MoA de 3 camadas alcancon 65,1% de taxa de vitorias vs 57,5% do GPT-4o. O custo de producao e multiplicativo: aproximadamente 12x de aumento de custos de API.

### Como escolho entre ReAct, Plan-and-Execute e Reflexion?

A selecao de padroes segue tres eixos: duracao da tarefa, reversibilidade das acoes e nivel de autonomia. Para tarefas curtas com acoes reversiveis, ReAct e a escolha mais simples. Para tarefas de horizonte medio, Plan-and-Execute reduz o consumo da janela de contexto em 40-60%. Para tarefas que se repetem onde o agente pode aprender com seu historico de falhas, Reflexion adiciona melhorias de desempenho cumulativas. Adicione Critic-Actor quando as acoes sao irreversiveis; adicione Supervisor-Worker quando diferentes passos de tarefa genuinamente requerem conjuntos de ferramentas diferentes.
