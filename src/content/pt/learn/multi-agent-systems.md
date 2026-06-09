---
title: Arquitetura de Sistemas Multi-Agente - Design, Topologia e Segurança
description: A arquitetura de sistemas multi-agente define como agentes autônomos se comunicam, coordenam e mantêm limites de confiança. Cobre topologias, protocolos inter-agente e design de segurança em produção.
slug: /learn/multi-agent-systems
primary_keyword: arquitetura de sistemas multi-agente
secondary_keywords:
  - design de sistema multi-agente
  - protocolos de comunicação de agentes
  - padrões de topologia de agentes
  - protocolo a2a
  - segurança multi-agente
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /comparison/langgraph
  - /comparison/autogen
---

# Arquitetura de Sistemas Multi-Agente: Topologias de Design, Protocolos de Comunicação e Limites de Confiança

Um sistema multi-agente é uma rede de agentes de IA autônomos que coordenam para realizar tarefas que nenhum agente individual consegue lidar. As decisões arquiteturais tomadas no tempo de design, nomeadamente topologia, protocolo de comunicação, modelo de compartilhamento de estado e posicionamento de limites de confiança, determinam se o sistema escala graciosamente ou falha catastroficamente em produção. Uma topologia em estrela com estado compartilhado cria um único ponto de falha; o acoplamento estreito entre agentes significa que um componente comprometido pode pivotar para outros; a memória de processo compartilhada cria condições de corrida que aparecem como CVEs.

<!-- SCHEMA: DefinitionBlock -->

> **O que é um sistema multi-agente?**
> Um sistema multi-agente é uma rede de dois ou mais agentes de IA autônomos que se comunicam, coordenam e agem coletivamente para realizar tarefas além da capacidade de qualquer agente individual, definido pela sua topologia (como os agentes estão conectados), protocolo de comunicação (como os agentes trocam informações), modelo de compartilhamento de estado e posicionamento de limites de confiança.

## Propriedades Arquiteturais Fundamentais

### Autonomia de agentes vs coordenação: a tensão fundamental

Cada agente em um sistema multi-agente tem sua própria janela de contexto, conjunto de ferramentas e processo de decisão. A arquitetura resolve essa tensão: o acoplamento frouxo (agentes interagem apenas através de um barramento de mensagens controlado) preserva a autonomia; o acoplamento estreito cria condições de corrida. CVE-2025-64168 (Agno, CVSS 7.1, outubro de 2025) é um exemplo de produção: sob alta concorrência assíncrona, o session_state compartilhado entre agentes foi atribuído à sessão de usuário errada.

## Padrões de Topologia Multi-Agente

### Topologia em estrela: hub-and-spoke com um agente supervisor

A topologia em estrela cria um único ponto de falha: se o supervisor é comprometido por uma injeção de prompt de um resultado de ferramenta, ele pode emitir instruções maliciosas para todos os agentes trabalhadores.

### Topologia em malha: comunicação de agente par a par

Na topologia em malha, os agentes se comunicam diretamente sem um coordenador central. Em uma malha completa de N agentes, existem N*(N-1)/2 canais de comunicação potenciais, cada um uma superfície de ataque potencial.

### Topologia hierárquica: equipes aninhadas e delegação de sub-agentes

O risco: um coordenador de nível médio comprometido pode emitir instruções maliciosas para todos os agentes que ele gerencia.

### Topologia plana/frota: agentes de mesmo nível coordenando através de um barramento compartilhado

A topologia de frota plana usa agentes de mesmo nível que se comunicam exclusivamente através de um barramento de mensagens compartilhado (blackboard) sem chamadas diretas de agente para agente. Este é o modelo de frota da OpenLegion: um agente comprometido só pode afetar o que escreve no blackboard.

## Protocolos de Comunicação Inter-Agente

### A2A: o padrão aberto do Google para comunicação de agentes entre frameworks

A2A (Agent-to-Agent), lançado pelo Google em abril de 2025, padroniza a comunicação inter-agente entre diferentes frameworks. A2A define três primitivos: descoberta de capacidades, delegação de tarefas e resultados em streaming. Em meados de 2026, A2A é suportado por mais de 50 parceiros tecnológicos. A OpenLegion suporta A2A para coordenação de agentes entre frameworks.

### MCP: padronização do acesso a ferramentas entre agentes

Model Context Protocol (MCP), lançado pela Anthropic em novembro de 2024, padroniza como os agentes acessam ferramentas externas. Em meados de 2026, o MCP tem mais de 1.000 servidores comunitários. MCP também introduz riscos de segurança: descrições de ferramentas podem ser envenenadas para injetar instruções maliciosas no contexto do agente.

### Padrão blackboard: estado persistente compartilhado como meio de comunicação

O padrão blackboard roteia toda a comunicação inter-agente através de um armazenamento de dados persistente compartilhado. A OpenLegion implementa o padrão blackboard usando SQLite com modo WAL para acesso concorrente, combinado com mensagens pub/sub.

## Perspectiva da OpenLegion: por que a Arquitetura é uma Decisão de Segurança

A maioria das falhas de sistemas multi-agente são falhas arquiteturais. Estado compartilhado entre agentes cria condições de corrida: CVE-2025-64168 (Agno, CVSS 7.1, outubro de 2025). O acoplamento estreito amplifica o raio de explosão da injeção de prompts: a pesquisa COLM 2025 mostrou uma taxa de sucesso de ataque de 97% contra AutoGen Magentic-One.

O modelo de confiança de quatro zonas da OpenLegion: os agentes da Zona 1 (contêineres sandbox) não podem se comunicar diretamente. Todas as mensagens inter-agente são roteadas através do Mesh Host da Zona 2.

## Limites de Confiança em Sistemas Multi-Agente

### Por que processo compartilhado = raio de explosão compartilhado

Quando múltiplos agentes são executados no mesmo processo Python, eles compartilham o heap, o ambiente e o interpretador. Uma injeção de prompt bem-sucedida no Agente A pode ler as variáveis do Agente B. O isolamento por contêiner por agente elimina este problema.

## Modos de Falha Comuns na Arquitetura Multi-Agente

### Condições de corrida em estado compartilhado: CVE-2025-64168 como estudo de caso

CVE-2025-64168 (Agno, CVSS 7.1, CWE-362 + CWE-668, outubro de 2025, corrigido no Agno v2.2.2) revelou uma condição de corrida na camada de gerenciamento de session_state do Agno. Sob alta concorrência assíncrona, o session_state foi atribuído à sessão errada.

### Amplificação de injeção de prompt em sistemas fortemente acoplados

A pesquisa publicada na COLM 2025 demonstrou uma taxa de sucesso de ataque de 97% contra Magentic-One (o sistema multi-agente do AutoGen) via arquivos locais maliciosos.

## Sistemas Multi-Agente na OpenLegion

A OpenLegion implementa topologia de frota plana com separação de confiança de quatro zonas. Os agentes são executados em contêineres Docker isolados (Zona 1), se comunicam exclusivamente através do blackboard do Mesh Host (Zona 2), acessam credenciais via Vault Proxy (Zona 4) e nunca se comunicam diretamente entre si.

## CTA

**Coordenação multi-agente com garantias de segurança arquiteturais.**
[Começar](https://app.openlegion.ai) | [Ler a documentação](https://docs.openlegion.ai) | [Ver a plataforma](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é uma arquitetura de sistema multi-agente?

Uma arquitetura de sistema multi-agente define como múltiplos agentes de IA autônomos estão estruturados para se comunicar, coordenar e manter limites de confiança. Especifica a topologia, o protocolo de comunicação, o modelo de compartilhamento de estado e o posicionamento dos limites de confiança.

### Qual é a diferença entre topologia em estrela e topologia de frota plana?

Na topologia em estrela, um agente supervisor central coordena todos os outros, criando um único ponto de falha. Na topologia de frota plana (usada pela OpenLegion), agentes de mesmo nível coordenam através de um barramento de mensagens compartilhado sem comunicação direta agente a agente.

### O que é o protocolo A2A para sistemas multi-agente?

A2A (Agent-to-Agent) é um protocolo aberto de comunicação inter-agente lançado pelo Google em abril de 2025. Padroniza como os agentes descobrem as capacidades uns dos outros, delegam tarefas e trocam resultados em streaming. A OpenLegion suporta A2A para coordenação de agentes entre frameworks.

### O que causa condições de corrida em sistemas multi-agente?

Condições de corrida ocorrem quando múltiplos agentes leem e escrevem estado compartilhado concorrentemente sem sincronização adequada. CVE-2025-64168 no framework Agno (CVSS 7.1, outubro de 2025) é um exemplo de produção documentado.

### Como a injeção de prompt se propaga em um sistema multi-agente?

Em sistemas multi-agente fortemente acoplados, uma injeção de prompt bem-sucedida em um agente pode se propagar para outros. A pesquisa na COLM 2025 demonstrou uma taxa de sucesso de 97% contra AutoGen Magentic-One. Mitigações arquiteturais incluem isolamento por contêiner por agente e comunicação mediada por barramento.

### O que é o padrão blackboard em sistemas multi-agente?

O padrão blackboard é uma arquitetura de coordenação multi-agente onde os agentes se comunicam lendo e escrevendo em um armazenamento de dados persistente compartilhado em vez de se chamarem diretamente. A OpenLegion implementa o padrão blackboard usando SQLite com modo WAL para acesso concorrente, combinado com mensagens pub/sub.
