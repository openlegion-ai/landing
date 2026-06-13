---
title: "Protocolo Agent2Agent: Segurança A2A, arquitetura e comparação com MCP"
description: "O protocolo Agent2Agent (A2A) permite que agentes de IA deleguem tarefas entre frameworks. Saiba sobre arquitetura, modelo de segurança, ciclo de vida de tarefas e comparação com MCP."
slug: /learn/agent2agent-protocol
primary_keyword: protocolo agent2agent
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/model-context-protocol
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/ai-agent-frameworks
---

# Protocolo Agent2Agent: Arquitetura, segurança e comparação com MCP

Agent2Agent (A2A) é um protocolo aberto, lançado pelo Google Cloud em abril de 2025 e doado à Linux Foundation, que permite que agentes de IA construídos em diferentes frameworks e fornecedores se comuniquem, deleguem tarefas e troquem resultados através de uma interface HTTP/JSON padronizada. Enquanto o MCP resolve o problema de acesso a ferramentas (um LLM chamando APIs externas), o A2A resolve o problema de coordenação: um agente delegando uma subtarefa completa a um agente par especializado com seu próprio loop de raciocínio, memória e ferramentas. O repositório GitHub a2aproject/A2A conta com contribuições de mais de 50 organizações, incluindo Salesforce, Atlassian e SAP.

<!-- SCHEMA: DefinitionBlock -->
Agent2Agent (A2A) é um protocolo HTTP/JSON aberto para interoperabilidade de agentes de IA, mantido pela Linux Foundation, que padroniza como agentes autônomos anunciam capacidades, delegam tarefas e trocam resultados entre diferentes frameworks e fornecedores.

## O que é o protocolo Agent2Agent (A2A)?

O A2A surgiu de uma lacuna concreta no ecossistema de agentes de IA: a comunicação de modelo para ferramenta tinha um padrão (MCP, lançado em novembro de 2024), mas a comunicação de agente para agente não tinha. Quando um agente orquestrador precisa entregar uma subtarefa a um par especializado, não havia um formato de fio padronizado para essa delegação.

O Google Cloud anunciou o A2A em 9 de abril de 2025, junto com um grupo inicial de mais de 50 parceiros tecnológicos contribuindo para a especificação. Diferente de muitos padrões impulsionados por fornecedores, o A2A foi doado à Linux Foundation para governança neutra.

O protocolo é HTTP/JSON em seu núcleo. Um agente compatível com A2A expõe um pequeno conjunto de endpoints: um cartão de agente (manifesto de capacidades), um endpoint de envio de tarefas, um endpoint de consulta de status e um endpoint de streaming SSE para tarefas de longa duração.

Para contexto sobre o problema de coordenação multi-agente que o A2A aborda, veja [arquitetura de sistemas multi-agente](/learn/multi-agent-systems) e [padrões de orquestração de agentes de IA](/learn/ai-agent-orchestration).

## A arquitetura do protocolo A2A

O A2A define três conceitos fundamentais: cartões de agente (descoberta de capacidades), o ciclo de vida das tarefas (rastreamento de delegação com estado) e modos de entrega (streaming SSE e push por webhook).

### Cartões de agente: publicidade de capacidades e risco de enumeração

Um cartão de agente é um documento JSON servido em uma URL bem conhecida (`/.well-known/agent.json`) que descreve o que um agente pode fazer. Um cartão de agente mínimo inclui:

```json
{
  "name": "web-research-agent",
  "description": "Pesquisa tópicos usando busca na web e retorna resumos estruturados",
  "version": "1.0.0",
  "url": "https://agents.example.com/web-research",
  "skills": [
    {
      "id": "research_topic",
      "name": "Pesquisar tópico",
      "description": "Pesquisar um tópico na web e retornar um resumo estruturado",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

Os cartões de agente permitem a descoberta dinâmica de capacidades, mas carregam um risco de segurança: no perfil base do A2A, os cartões de agente não são autenticados por padrão, expondo toda a superfície de habilidades à enumeração sem autenticação.

Implantações em produção devem servir cartões de agente somente após autenticação ou restringi-los a segmentos de rede internos. O [modelo de ameaça de segurança para agentes de IA](/learn/ai-agent-security) cobre a enumeração de capacidades como vetor de ataque de reconhecimento.

### Ciclo de vida das tarefas: cinco estados de enviado a concluído

O A2A define um ciclo de vida de cinco estados:

1. **submitted** - Tarefa recebida pelo agente remoto; ainda não processada
2. **working** - O agente remoto está processando ativamente a tarefa (pode transmitir progresso via SSE)
3. **input-required** - O agente remoto precisa de esclarecimento antes de continuar (ponto de controle humano)
4. **completed** - Tarefa concluída; artefato de resultado disponível para recuperação
5. **failed** - Tarefa falhou; detalhes do erro no objeto de status da tarefa

O estado `input-required` é o mecanismo do A2A para pontos de controle humanos em pipelines autônomos longos.

### Entrega de tarefas push vs pull: SSE e webhooks

O A2A suporta dois modos de entrega:

**SSE (Server-Sent Events):** O agente delegante abre uma conexão persistente. SSE é o mecanismo principal para tarefas de longa duração que precisam de progresso incremental.

**Push por webhook:** O agente delegante fornece uma URL de retorno no momento do envio. Preferível em ambientes serverless onde não é possível manter uma conexão SSE persistente.

## A2A vs MCP: camadas diferentes, problemas diferentes

A2A e MCP são complementares, não concorrentes. Eles operam em diferentes camadas da pilha de agentes e resolvem diferentes problemas de coordenação.

| **Dimensão** | **MCP** | **A2A** |
|---|---|---|
| **Propósito** | Acesso a ferramentas - um LLM chama APIs externas | Coordenação de agentes - um agente delega a outro |
| **Comunicação** | Chamada de ferramenta síncrona dentro de um turno de raciocínio | Delegação de tarefa assíncrona; agente receptor tem seu próprio loop |
| **Auth (padrão)** | Obrigatória - servidores MCP autenticam clientes | Opcional no perfil base - anônimo permitido |
| **Descoberta** | Manifesto do servidor MCP (lista de ferramentas) | Cartão de agente (JSON: habilidades + requisitos de auth) |
| **Estado** | Sem estado por chamada de ferramenta | Com estado, ciclo de vida de 5 estados |
| **Streaming** | Ausente na especificação principal | SSE em tempo real; webhook push para assíncrono |
| **Ameaça principal** | Envenenamento de ferramenta (OWASP LLM07:2025) | Injeção de payload de tarefa, enumeração de cartão de agente |

### Quando um agente precisa de uma ferramenta (MCP)

O MCP é a escolha certa quando um único agente precisa chamar uma capacidade externa dentro de um turno de raciocínio. A ferramenta não tem seu próprio loop de raciocínio; ela executa uma função e retorna um valor.

### Quando um agente precisa de outro agente (A2A)

O A2A é a escolha certa quando uma tarefa requer a capacidade de raciocínio completa de um agente par. O agente receptor tem seu próprio modelo, memória, acesso a ferramentas e loop de raciocínio multi-etapas.

### Usando MCP e A2A juntos no mesmo sistema

Um sistema multi-agente em produção geralmente usa ambos. O agente orquestrador usa A2A para delegar a agentes especialistas. Cada especialista usa MCP para suas chamadas de ferramentas.

## Autenticação e modelo de segurança do A2A

O modelo de segurança do A2A tem uma lacuna crítica: o perfil base torna a autenticação opcional. A injeção de prompt via payload de tarefa A2A é uma classe de ataque documentada.

A superfície de ataque em sistemas A2A:

**1. Injeção de payload de tarefa:** A descrição da tarefa e os dados de entrada em uma submissão de tarefa A2A são controlados pelo usuário.

**2. Enumeração de cartão de agente:** Cartões de agente não autenticados expõem toda a superfície de habilidades.

**3. Suposições de confiança inter-agente:** Um agente delegante que confia em resultados de um par sem validação é vulnerável a injeção de relé.

**4. Delegação anônima:** Sem autenticação obrigatória, qualquer chamador na rede pode enviar tarefas a um agente A2A.

## A opinião da OpenLegion: A2A é um formato de fio, não um modelo de segurança

O A2A é bem projetado como formato de fio. O modelo de segurança fica aquém dos requisitos de produção.

A abordagem da OpenLegion para comunicação entre agentes aplica o que o perfil base do A2A deixa opcional:

1. **Cada chamada entre agentes passa pelo vault de credenciais.** Não há modo de delegação anônima.

2. **Sanitização do payload de tarefa em 56 pontos de estrangulamento de rede.** Conteúdo controlado pelo usuário é sanitizado para ataques unicode antes de atingir o contexto LLM.

3. **Contratos de handoff tipados validados pelo orquestrador.** Payloads de injeção de relé são bloqueados no limite.

4. **Manifestos de capacidades de agentes requerem autenticação.** A superfície de habilidades não está exposta a chamadores anônimos.

## Implementando A2A: um guia técnico

### Esquema de cartão de agente

Um cartão de agente em produção deve incluir explicitamente os requisitos de autenticação:

```json
{
  "name": "data-analysis-agent",
  "description": "Analisa conjuntos de dados estruturados e retorna resumos estatísticos",
  "version": "1.2.0",
  "url": "https://agents.internal.example.com/data-analysis",
  "skills": [
    {
      "id": "analyze_dataset",
      "name": "Analisar conjunto de dados",
      "description": "Executar análise estatística em um conjunto de dados fornecido",
      "inputModes": ["data"],
      "outputModes": ["text", "data", "file"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"],
    "required": true
  }
}
```

### Envio de tarefas e consulta de status

O envio de tarefas é um POST para `/tasks/send`. A consulta de status usa `GET /tasks/{task_id}`. Consultar com backoff exponencial (1s, 2s, 4s, 8s, máx 30s). Tarefas de longa duração (>60s) devem mudar para SSE.

### Streaming de tarefas de longa duração com SSE

Para tarefas com duração superior a 30 segundos, usar SSE via `POST /tasks/sendSubscribe`. O flag `"final": true` sinaliza a conclusão da tarefa. Implementar reconexão SSE com o cabeçalho `Last-Event-ID`.

<!-- SCHEMA: FAQPage -->
## Perguntas frequentes

### O que é o protocolo Agent2Agent (A2A)?

Agent2Agent (A2A) é um protocolo HTTP/JSON aberto para interoperabilidade de agentes de IA, lançado pelo Google Cloud em abril de 2025 e doado à Linux Foundation. Ele padroniza como agentes autônomos anunciam capacidades, delegam tarefas e trocam resultados. Mais de 50 organizações, incluindo Salesforce, Atlassian e SAP, contribuíram para o protocolo desde seu lançamento.

### Qual é a diferença entre A2A e MCP?

O MCP resolve o acesso a ferramentas: um agente chamando uma API externa dentro de um único turno de raciocínio. O A2A resolve a coordenação de agentes: um agente delegando uma subtarefa completa a um agente par com seu próprio loop de raciocínio. O MCP requer autenticação por padrão; o perfil base do A2A a torna opcional. Ambos os protocolos são complementares.

### O que são cartões de agente A2A?

Cartões de agente são documentos JSON servidos em `/.well-known/agent.json` que descrevem as capacidades de um agente, os modos de entrada/saída aceitos e os requisitos de autenticação. Por padrão no perfil base do A2A, são servidos sem autenticação. Implantações em produção devem exigir autenticação para acessar cartões de agente.

### O protocolo A2A é seguro?

O perfil base do A2A tem lacunas de segurança significativas. A autenticação é opcional por padrão. A injeção de prompt via payload de tarefa A2A é um risco de produção real. Implantações de A2A em produção devem implementar explicitamente o perfil de autenticação estendido e sanitizar todo o conteúdo do payload antes do LLM.

### O que é o ciclo de vida das tarefas A2A?

O A2A define cinco estados: submitted (recebido, ainda não processado), working (processamento ativo, pode transmitir progresso SSE), input-required (agente remoto precisa de esclarecimento), completed (resultado disponível) e failed (tarefa falhou com detalhes). O estado `input-required` é o mecanismo de pontos de controle humanos do A2A.

### Quais empresas suportam o A2A?

O A2A foi lançado em abril de 2025 com mais de 50 organizações contribuintes, incluindo Salesforce, Atlassian e SAP. O Google Cloud liderou a especificação inicial e cedeu a governança à Linux Foundation. O protocolo visa plataformas de IA empresarial.

### Como a OpenLegion implementa a comunicação entre agentes?

A arquitetura mesh da OpenLegion implementa coordenação entre agentes com autenticação obrigatória em cada chamada. Cada handoff entre agentes passa pelo vault de credenciais. O conteúdo do payload é sanitizado em 56 pontos de estrangulamento de rede. Contratos de handoff tipados são validados pelo orquestrador. Esses controles rodam na camada de infraestrutura, fora do código do agente.

## Construir sistemas multi-agente com autenticação em cada chamada

O A2A fornece o formato de fio para interoperabilidade de agentes. O modelo de segurança deve ser construído por cima ou aplicado pela camada de infraestrutura.

Veja [segurança de agentes de IA e modelo de ameaça](/learn/ai-agent-security) ou [arquitetura de sistemas multi-agente](/learn/multi-agent-systems).

[Execute sistemas multi-agente onde cada chamada agente a agente seja autenticada, registrada e com credenciais isoladas por padrão - comece na OpenLegion](https://app.openlegion.ai)
