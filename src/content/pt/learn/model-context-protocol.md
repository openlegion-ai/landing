---
title: Model Context Protocol (MCP) — Como Agentes de IA Usam Ferramentas
description: >-
  Model Context Protocol (MCP) é o padrão aberto da Anthropic que permite que
  agentes de IA descubram e chamem ferramentas externas. Como funciona, ressalvas
  de segurança e o suporte a MCP no OpenLegion.
slug: /learn/model-context-protocol
primary_keyword: model context protocol
secondary_keywords:
  - MCP
  - MCP server
  - MCP client
  - MCP integration
  - anthropic mcp
  - mcp tools
  - mcp security
  - mcp agents
date_published: 2026-05
last_updated: 2026-05
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison
---

# Model Context Protocol: O Padrão Aberto Para Ferramentas de Agentes de IA

**Model Context Protocol** (MCP) é o padrão aberto que a Anthropic publicou em novembro de 2024 que permite que agentes de IA descubram e chamem ferramentas externas — bancos de dados, sistemas de arquivos, APIs, serviços internos — sem escrever código de cola sob medida. Servidores MCP expõem capacidades; clientes MCP (runtimes de agente, IDEs, assistentes) as consomem. O protocolo é deliberadamente mínimo, o que também é seu calcanhar em produção: deploys precisam empilhar autenticação, sandbox e orçamentos por ferramenta em cima antes de serem seguros para rodar.

<!-- SCHEMA: DefinitionBlock -->

> **O que é o Model Context Protocol?**
> O Model Context Protocol é um padrão aberto baseado em JSON-RPC, originalmente publicado pela Anthropic, que define como agentes de IA (clientes) descobrem e chamam capacidades expostas por ferramentas (servidores). É o equivalente do ecossistema de agentes de IA ao LSP para editores ou ao USB para hardware: um protocolo, várias implementações.

## TL;DR

- **MCP é a porta USB do ecossistema de agentes** — um protocolo que deixa qualquer runtime de agente em conformidade usar qualquer servidor de ferramenta em conformidade sem escrever cola customizada.
- **A Anthropic publicou o MCP em novembro de 2024**; grandes adotantes durante 2025 incluem OpenAI, Microsoft Copilot, Cursor, Zed, Continue e a maioria dos frameworks de agente.
- **MCP define quatro tipos de primitiva**: tools (chamadas estilo função), resources (dados somente leitura), prompts (templates reutilizáveis) e sampling (chamadas de LLM iniciadas pelo servidor de volta ao cliente).
- **O transporte é JSON-RPC sobre stdio ou HTTP/SSE**. Stdio é a forma local dominante; HTTP/SSE ganha tração para servidores MCP remotos.
- **MCP em produção exige três camadas que a maioria dos tutoriais pula**: autenticação, sandbox e imposição de orçamento em chamadas de ferramenta.

## Como o MCP Funciona

Um cliente MCP (um runtime de agente ou assistente de IA) conecta a um ou mais servidores MCP. Na conexão, o cliente requisita uma lista de capacidades — quais tools, resources e prompts esse servidor oferece? Cada tool anuncia um JSON schema para seus argumentos. O LLM do agente vê a lista de tools como parte do seu contexto e escolhe as chamadas de ferramenta de acordo. O cliente roteia as chamadas para o servidor certo, encapsula JSON e devolve resultados.

O transporte é JSON-RPC 2.0. Dois transportes são comuns: stdio (o cliente sobe o servidor como subprocesso e se comunica via stdin/stdout — o padrão no Claude Desktop) e HTTP com Server-Sent Events para servidores remotos que vivem do outro lado de uma fronteira de rede.

O protocolo em si é intencionalmente mínimo. A complexidade está no que os servidores MCP expõem: um servidor de filesystem dá a um agente acesso de leitura e escrita a um diretório; um servidor Postgres dá acesso a consultas; um servidor de Slack dá capacidades de envio de mensagem e leitura de canal. O mesmo agente pode conectar a múltiplos servidores simultaneamente.

## Servidores MCP vs Clientes MCP

**Servidores MCP** são o lado das ferramentas. Qualquer um pode escrever um — a Anthropic publica SDKs de referência em Python e TypeScript. Em meados de 2026 há milhares de servidores comunitários cobrindo GitHub, Notion, Linear, Postgres, AWS, automação de navegador e além. Os servidores tendem a ser pequenos (algumas centenas de linhas) porque o protocolo faz a maior parte do trabalho.

**Clientes MCP** são runtimes de agente, IDEs e assistentes. Claude Desktop foi o cliente de referência. Cursor, Zed, Continue, Windsurf e a maioria dos frameworks de agente adicionaram suporte a cliente MCP durante 2025. Um único cliente MCP tipicamente suporta múltiplas conexões simultâneas a servidores — um agente falando com um servidor de filesystem, um servidor de banco e um servidor de Slack ao mesmo tempo.

O insight-chave: o LLM não fala MCP diretamente. O cliente renderiza a lista de tools MCP como definições de função dentro do prompt do LLM; o LLM emite uma chamada de função; o cliente mapeia a chamada para o servidor MCP certo e encaminha a requisição JSON-RPC.

## Considerações de Segurança Para MCP em Produção

MCP é um protocolo de *exposição de capacidade* — não um protocolo de autorização ou auditoria. Deploys em produção precisam adicionar as partes que o MCP deixa de fora intencionalmente:

- **Autenticação**: a maioria dos servidores MCP roda sem autenticação localmente. Um deploy multitenant precisa de credenciais por agente e fronteiras de autenticação por servidor.
- **Sandbox**: um servidor MCP de filesystem com acesso amplo a paths é, na prática, root no host. Rode servidores MCP em contêineres; não monte volumes sensíveis às cegas.
- **Imposição de orçamento**: chamadas de ferramenta não são de graça. Um agente chamando um servidor MCP de web scraping em loop pode acumular um custo sério. Orçamentos por agente precisam cobrir invocações de ferramenta, não só tokens de LLM.
- **Logs de auditoria**: o MCP em si não padroniza logging de chamada. Runtimes em produção precisam registrar cada chamada de servidor com argumentos, formato de resposta e tempo para revisão de [segurança de agentes de IA](/learn/ai-agent-security) e resposta a incidentes.

A integração MCP de referência do Claude Desktop monta servidores como subprocessos do host com as permissões de filesystem do usuário. Isso funciona para setups de desenvolvedor single-user; não é seguro para produção.

## Como o OpenLegion Integra o MCP

OpenLegion é cliente MCP por padrão. Agentes no runtime auto-descobrem servidores MCP configurados para sua frota, veem a lista de tools na sua janela de contexto e chamam ferramentas MCP pelo mesmo caminho com proxy de cofre e gate de ACL das skills embutidas. A mesh impõe as camadas grau de produção que o MCP deixa de fora:

- Cada servidor MCP roda no seu próprio namespace em sandbox; o agente nunca ganha acesso direto via stdio ao processo do servidor.
- ACLs por agente controlam quais servidores MCP um dado agente está autorizado a chamar.
- Cada chamada de ferramenta conta contra o orçamento por agente; um agente excedendo seu teto é cortado, venha o gasto de LLMs ou de tools MCP.
- A mesh registra cada chamada MCP no log de trace — a mesma telemetria coberta em [observabilidade de agentes de IA](/learn/ai-agent-observability).

O resultado: você ganha a amplitude do ecossistema MCP sem herdar suas premissas padrão de confiança.

## A Visão da OpenLegion

MCP é o padrão de ecossistema de agente mais importante desde o OpenAPI — ele colapsa o que seria trabalho de integração N × M (todo framework de agente vezes toda ferramenta) em N + M servidores e clientes. Mas o minimalismo intencional do protocolo significa que times em produção precisam reconstruir a infraestrutura chata — autenticação, sandbox, orçamentos, auditoria — que sistemas proprietários já tinham embutida. Frameworks que tratam MCP como just-add-water sem empilhar essas preocupações entregam agentes inseguros por padrão. Escolha uma [plataforma de agentes de IA](/learn/ai-agent-platform) que leve MCP a sério o bastante para restringi-lo.

## CTA

**Implante agentes compatíveis com MCP com controles grau de produção embutidos.**
[Começar Agora](https://app.openlegion.ai) | [Ler a Documentação](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é o Model Context Protocol?

O Model Context Protocol (MCP) é um padrão aberto JSON-RPC introduzido pela Anthropic em novembro de 2024 que permite que agentes de IA descubram e chamem ferramentas externas por uma interface uniforme. Servidores MCP expõem capacidades (tools, resources, prompts); clientes MCP (runtimes de agente, IDEs, assistentes) as consomem. Grandes adotantes durante 2025 incluem OpenAI, Microsoft Copilot, Cursor, Zed e a maioria dos frameworks de agente.

### Quem criou o MCP e ele é aberto?

A Anthropic criou o MCP e o lançou sob uma especificação aberta com SDKs de referência em Python e TypeScript. A spec é governada pela comunidade via GitHub, e não há licenciamento ou lock-in proprietário. Qualquer um pode escrever um servidor ou cliente MCP, e os principais provedores de LLM entregam tooling compatível com MCP.

### Qual a diferença entre um servidor MCP e um cliente MCP?

Um servidor MCP expõe capacidades — um servidor Postgres expõe tools de consulta, um servidor de filesystem expõe leitura e escrita de arquivo, um servidor de Slack expõe envio de mensagem. Um cliente MCP é o lado consumidor — tipicamente um runtime de agente, uma IDE ou um assistente de IA. Um cliente pode conectar a muitos servidores simultaneamente; um servidor pode ser reutilizado por muitos clientes.

### O MCP é seguro por padrão?

Não — e isso é intencional. MCP é um protocolo de exposição de capacidade, não um protocolo de autorização. As implementações de referência (Claude Desktop, os exemplos do SDK) rodam servidores sem autenticação como subprocessos do host com as permissões de filesystem do usuário. Deploys em produção precisam adicionar autenticação, sandbox, orçamentos por ferramenta e logging de auditoria em cima do MCP em si.

### Como o MCP se compara ao function calling da OpenAI?

Function calling da OpenAI é um padrão single-vendor para deixar um LLM chamar funções definidas na requisição da API — não padroniza como ferramentas são descobertas, empacotadas ou compartilhadas entre sistemas. MCP é um padrão aberto cross-vendor para o mesmo problema no nível do ecossistema. Os dois são complementares: servidores MCP expõem capacidades; um cliente MCP pode renderizá-las como definições de função no formato OpenAI ao chamar modelos GPT, ou no formato de tool use da Anthropic ao chamar Claude.

### Posso usar MCP com qualquer provedor de LLM?

Sim. MCP é agnóstico a LLM — o cliente renderiza definições de tool MCP em qualquer formato que o LLM subjacente espera (tool use da Anthropic, function calling da OpenAI, function declarations do Gemini). Runtimes como OpenLegion que suportam mais de 100 provedores via LiteLLM automaticamente adaptam tools MCP à convenção de chamada de cada provedor.
