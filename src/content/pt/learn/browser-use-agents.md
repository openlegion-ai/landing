---
title: "Agentes Browser Use — Como agentes de IA controlam a web"
description: "Os agentes browser use permitem que a IA navegue autonomamente em sites, preencha formulários e extraia dados. Funcionamento, riscos de segurança e execução segura em containers isolados."
slug: /learn/browser-use-agents
primary_keyword: browser use agents
secondary_keywords:
  - ai browser automation
  - browser agent python
  - web agent llm
  - headless browser ai agent
  - browser use security
date_published: 2026-05
last_updated: 2026-05-30
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/model-context-protocol
---

# Agentes Browser Use: Como os agentes de IA navegam e controlam a web

Os agentes browser use são sistemas de IA que controlam autonomamente um navegador web — navegando por URLs, clicando em botões, preenchendo formulários, extraindo conteúdo e gerenciando autenticação — sem intervenção humana em cada etapa. São a categoria de ferramentas de agentes de IA com crescimento mais rápido em 2026, impulsionados por frameworks como browser-use (96.282 estrelas no GitHub em maio de 2026).

<!-- SCHEMA: DefinitionBlock -->

> **O que é um agente browser use?**
> Um agente browser use é um agente de IA que controla programaticamente um navegador web headless ou com interface, utilizando traversal de DOM, análise da árvore de acessibilidade, grounding por captura de tela e seleção de ações guiada por LLM para completar tarefas web de forma autônoma.

## Como funcionam os agentes browser use

### Percepção: DOM, árvore de acessibilidade e grounding por captura de tela

Um agente navegador precisa entender o estado atual da página antes de agir. Três estratégias de percepção são usadas.

**A extração do DOM** analisa a estrutura HTML bruta da página. É rápida e eficiente em tokens, mas falha em conteúdo renderizado em canvas e SPAs complexas.

**A árvore de acessibilidade** lê a camada de acessibilidade integrada do navegador, fornecendo uma visão estruturada e semântica da página. É o método de percepção principal usado pelo browser-use.

**O grounding por captura de tela** captura uma imagem da página e a passa para um LLM com capacidade de visão. Lida com páginas onde DOM e árvore de acessibilidade são pouco confiáveis, mas custa significativamente mais tokens por etapa.

### Ação: cliques, digitação, navegação e envio de formulários

O espaço de ação de um agente navegador é amplo: navegar para uma URL, clicar em elemento, digitar texto, pressionar uma tecla, rolar, selecionar em dropdown, fazer upload de arquivo ou trocar de aba. Cada ação muda o estado da página.

## A biblioteca browser-use

### 96.282 estrelas em menos de 7 meses

browser-use (GitHub: browser-use/browser-use) atingiu 96.282 estrelas e 10.802 forks em maio de 2026, lançado em 31 de outubro de 2024. A biblioteca abstrai gerenciamento de sessão Playwright, extração da árvore de acessibilidade e serialização de ações.

### Backend Playwright: como o browser-use controla o Chromium

browser-use encapsula a biblioteca de automação Playwright da Microsoft. Adiciona uma camada de agente: extrair a árvore de acessibilidade, converter para formato eficiente em tokens e traduzir decisões de ação do LLM em comandos Playwright.

### Integração LLM: GPT-4o, Claude, Gemini como camada de raciocínio

browser-use é agnóstico em relação ao LLM na camada de raciocínio. Suporta OpenAI, Anthropic, Google e qualquer endpoint de API compatível com OpenAI.

## A perspectiva da OpenLegion: agentes navegador são sua ferramenta de maior risco

Os agentes navegador são a categoria de ferramentas de maior risco na IA agêntica. Um agente navegador que pode clicar, preencher formulários e seguir redirecionamentos tem a mesma superfície de ataque que um humano com acesso completo à internet.

### A demo de roubo de credenciais em 150 segundos

Pesquisa documentada publicamente em 2025 demonstrou que um agente navegador pode ser manipulado para roubar credenciais em 150 segundos via instruções ocultas em uma página web. A defesa é arquitetural: se a credencial não existe no contexto ou memória do processo do agente, a injeção não pode extraí-la. Na OpenLegion as credenciais ficam num cofre e são injetadas fora do modelo, que só guarda um handle, então nunca aparecem na janela de contexto do agente.

### OWASP LLM08 Excessive Agency e permissões do navegador

O top 10 LLM OWASP 2025 classifica Excessive Agency (LLM08) como categoria de risco principal. Os agentes navegador são o risco canônico: um agente com permissão para navegar, ler, preencher formulários e clicar pode fazer compras, enviar mensagens, excluir contas e exfiltrar dados.

### Como a OpenLegion sandboxa as ações dos agentes (sandbox + aprovações)

A OpenLegion não entrega automação de navegador no lançamento, e o código que um agente escreve roda em um sandbox sem acesso à rede por padrão. Quatro propriedades enquadram como o trabalho do agente é contido: sem estado de sessão compartilhado, credenciais guardadas em cofre, aprovações antes de agir sobre conteúdo não confiável e uma execução em sandbox por tarefa.

## Padrões de arquitetura para agentes navegador

### Headless vs. headed

O **modo headless** é mais rápido e funciona em ambientes de servidor, mas é detectável por sistemas de proteção anti-bots. O Camoufox opera em modo headless mas corrige as APIs JavaScript visadas pelos scripts de detecção headless.

### Tratamento de CAPTCHA

Três abordagens: navegadores comportamentais (resistência a fingerprints), serviços de resolução ($1–3 por 1.000 resoluções) e fallback human-in-the-loop. O equivalente na OpenLegion é a sua barreira de aprovação: o trabalho para no app sempre que um dono ou administrador precisa decidir.

### Injeção de credenciais: cofre de credenciais vs. cookies hardcoded

**Pior**: credenciais diretamente nas instruções. **Ruim**: variáveis de ambiente (acessíveis via `os.environ`). **Correto**: injeção a partir de um cofre, fora do modelo, que só guarda um handle.

## Agentes Browser Use: comparação de arquiteturas

| **Dimensão** | **OpenLegion** | **browser-use** | **Raw Playwright** | **Stagehand** |
|---|---|---|---|---|
| **Backend de execução** | Nenhum no lançamento — sem automação de navegador | Playwright (Chromium) | Playwright | Cloud Chromium |
| **Isolamento de sessão** | Execução em sandbox por tarefa — estrutural | Processo compartilhado | Depende da implementação | Cloud managed |
| **Tratamento de credenciais** | Guardadas em cofre, injetadas fora do modelo | Passa pela janela de contexto | Implementação manual | Managed |
| **Suporte CAPTCHA** | Não se aplica — sem automação de navegador | Nenhum integrado | Nenhum integrado | Serviço de resolução |
| **Sandboxing container** | Execução de tarefa em sandbox, sem rede por padrão | Nenhum | Nenhum | Cloud sandbox |
| **Estrelas GitHub** | — | 96.282 (maio 2026) | N/A | ~9.000 |
| **Licença** | PolyForm Perimeter 1.0.1 (engine) | MIT | Apache 2.0 | MIT |

## Quando usar agentes navegador (e quando não usar)

**Casos de uso legítimos**: pesquisa web e extração de dados, automação de formulários para seus próprios serviços, monitoramento e testes. **Casos de uso que requerem controles extras**: sessões autenticadas, sites financeiros. **Casos de uso a evitar sem sandboxing rigoroso**: URLs não confiáveis fornecidas por usuários.

## Comece com ações de agente seguras na OpenLegion

**Execute agentes com credenciais guardadas em cofre, uma execução em sandbox por tarefa e aprovações antes de agirem.**
[Começar](https://app.openlegion.ai) | [Ler a documentação](https://docs.openlegion.ai) | [Ver a plataforma](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que são agentes browser use?

Os agentes browser use são sistemas de IA que controlam autonomamente um navegador web via traversal de DOM, análise de árvore de acessibilidade e seleção de ações guiada por LLM. A biblioteca browser-use (96.282 estrelas GitHub, licença MIT, lançada em outubro de 2024) é a implementação open source mais adotada.

### Como funciona a biblioteca browser-use?

browser-use encapsula o Playwright da Microsoft para dar a um LLM uma visão estruturada da árvore de acessibilidade do navegador, então converte as decisões de ação do LLM em comandos Playwright. Suporta GPT-4o, Claude, Gemini e LLMs compatíveis, é licenciada MIT e requer cerca de 20 linhas de Python para um agente funcional.

### Quais são os riscos de segurança dos agentes browser use?

Três riscos principais: injeção de prompt via conteúdo web (uma demo de 2025 mostrou roubo de credenciais em 150 segundos), vazamento de credenciais (se cookies de sessão estiverem na memória do processo do agente) e excessive agency (OWASP LLM08:2025). Exfiltração por preview de link em zero cliques também foi demonstrada.

### Como executar agentes navegador com segurança?

Quatro controles são necessários: isolamento de containers, credenciais guardadas em cofre, controles de egress de rede e limites de orçamento por agente. A OpenLegion não entrega automação de navegador no lançamento, mas aplica os mesmos quatro controles a cada ação de agente: uma execução em sandbox por tarefa, credenciais em cofre, nenhuma rede a partir de código em sandbox e um orçamento de créditos por agente.

### O que é Camoufox e a OpenLegion o usa?

Camoufox é um navegador headless baseado em Firefox que corrige APIs JavaScript para apresentar perfis de hardware realistas em vez de assinaturas headless. A OpenLegion não executa Camoufox, nem nenhuma outra automação de navegador, no lançamento; seu isolamento vem de uma execução em sandbox por tarefa, sem acesso à rede a partir de código em sandbox por padrão.

### Qual é a diferença entre browser-use e Playwright para agentes de IA?

Playwright é uma biblioteca de automação de baixo nível sem conceito de agente de IA. browser-use adiciona uma camada de agente: converte estado do navegador para formato legível por LLM, traduz ações LLM para comandos Playwright e gerencia decomposição de tarefas multi-etapa entre páginas.

### Os agentes browser use podem gerenciar login e sessões autenticadas?

Sim, mas o gerenciamento de sessão autenticada é uma das operações de maior risco. A OpenLegion mantém as credenciais num cofre e as injeta fora do modelo — o agente trabalha guardando apenas um handle.

### Como os agentes navegador tratam CAPTCHAs?

Três abordagens: navegadores comportamentais (resistência a fingerprints), serviços de resolução ($1–3 por 1.000, latência 10–60 segundos) e fallback human-in-the-loop. A OpenLegion não tem automação de navegador no lançamento; seu equivalente human-in-the-loop é uma barreira de aprovação decidida no app.
