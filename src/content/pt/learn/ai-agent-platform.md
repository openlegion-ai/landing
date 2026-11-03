---
title: Plataforma de Agentes de IA — Implante Agentes Seguros
description: >-
 OpenLegion é uma plataforma gerenciada de agentes de IA com execuções de
 tarefa em sandbox, cofre de credenciais e orçamentos por agente. Nada para
 instalar.
slug: /learn/ai-agent-platform
primary_keyword: plataforma de agentes de IA
secondary_keywords:
 - managed ai agent platform
 - self-hosted agent deployment
 - ai agent cost control
 - ai agent credential security
 - production ai agent infrastructure
date_published: 2026-03
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-security
 - /learn/ai-agent-frameworks
 - /comparison
---

# A Plataforma de Agentes de IA Feita Para Produção

A maioria dos times começa com um framework. Encadeiam nós LangGraph ou crews CrewAI, conseguem uma demo funcionando e aí batem na parede: quem gerencia os contêineres? Onde ficam as chaves de API? O que impede um agente descontrolado de queimar US$ 500 em tokens durante a noite?

Uma **plataforma de agentes de IA** responde essas perguntas antes de você escrever seu primeiro agente. OpenLegion é uma plataforma gerenciada de agentes de IA que entrega execuções de tarefa em sandbox, credenciais guardadas em cofre, orçamentos de créditos por agente e coordenação por metas e tarefas (metas → tarefas → agentes) — tudo habilitado por padrão. É uma aplicação web hospedada: basta entrar com o Google e começar. Não há nada para instalar.

<!-- SCHEMA: DefinitionBlock -->

> **O que é uma plataforma de agentes de IA?**
> Uma plataforma de agentes de IA é infraestrutura gerenciada para implantar, orquestrar e governar agentes de IA autônomos em produção. Diferente de frameworks puros, uma plataforma cuida de isolamento, gestão de credenciais, controles de custo e observabilidade para que os times entreguem agentes sem construir DevOps do zero.

## TL;DR

- **Plataforma, não framework** — OpenLegion gerencia execuções, credenciais, orçamentos e aprovações. Você gerencia a lógica do agente.
- **Credenciais guardadas em cofre** — As credenciais são injetadas fora do modelo, que só guarda um handle. Os agentes nunca veem chaves cruas.
- **Uma execução em sandbox por tarefa** — Cada tarefa roda sob demanda e depois para, então não existe processo de agente de longa duração para comprometer, e o código que o agente escreve roda sem acesso à rede por padrão.
- **Imposição de orçamento por agente** — Cada agente carrega seu próprio orçamento de créditos, medido a US$ 0,001 por crédito, com corte rígido automático. Sem contas de surpresa.
- **Presets de modelo** — Escolha Smartest, Smart ou Normal por agente ou por workspace. Você nunca configura um provedor nem rotaciona uma chave.
- **Coordenação auditável por metas e tarefas** — O trabalho é organizado em metas → tarefas → agentes, com um assistente que cria os colegas de equipe necessários. Sem "agente CEO" tomando decisões opacas.
- **Conjunto de ferramentas embutido** — Busca e leitura na web, arquivos, memória de longo prazo, agendamentos, execução de código em sandbox e entregáveis compartilháveis. Disponíveis para todo agente.
- **Memória persistente de agente** — Os agentes lembram entre sessões com busca vetorial, arquivos de workspace e aprendizados de erro. Contexto gerenciado automaticamente.

## Gerenciado vs Auto-Hospedado: Quando Cada Um Faz Sentido

A distinção entre frameworks e plataformas de agentes de IA importa mais na hora do deploy. Um framework te dá blocos de construção — definições de agente, integrações de ferramenta, padrões de conversa. Uma plataforma te dá a camada de produção: onde os agentes rodam, como acessam credenciais, o que os impede de sair dos trilhos.

**Frameworks auto-hospedados** (LangGraph, CrewAI, AutoGen) te dão controle máximo. Você é dono da infraestrutura. Você configura os contêineres. Você constrói o pipeline de credenciais. Isso funciona quando seu time tem capacidade dedicada de DevOps e infraestrutura existente com a qual os agentes precisam se integrar profundamente.

**Plataformas gerenciadas de agentes de IA** cuidam da camada operacional para que seu time foque na lógica do agente. OpenLegion fica aqui — mas com uma diferença crítica: o engine por baixo é publicado com código-fonte disponível sob a PolyForm Perimeter License 1.0.1. Você ganha operações grau de plataforma (isolamento de execução, cofre, controles de orçamento) sem uma caixa-preta por baixo.

A pergunta não é qual é "melhor". É se seu time deve gastar horas de engenharia em infraestrutura de segurança de agente ou nos próprios agentes.

### Quando auto-hospedado faz sentido

- Você tem requisitos rígidos de residência de dados que excluem qualquer serviço gerenciado
- Seus agentes precisam de integração profunda com infraestrutura on-prem existente
- Seu time já opera clusters Kubernetes e tem práticas maduras de DevOps
- Você precisa customizar o ambiente de runtime em um nível que plataformas gerenciadas não expõem

### Quando uma plataforma gerenciada de agentes de IA faz sentido

- Você precisa de agentes em produção em dias, não em meses
- Seu time tem de 1 a 5 engenheiros e não pode dedicar headcount a infraestrutura
- Você precisa de garantias de [segurança de agentes de IA](/learn/ai-agent-security) sem construí-las sozinho
- Você quer controles de custo e tracing de requisição sem instrumentar tudo manualmente

## O Sistema de Presets de Modelo — Por Que Importa

A maioria das plataformas de IA gerenciadas faz da escolha de modelo o seu problema: escolher um provedor, configurar uma chave, rotacioná-la, reajustar quando ela muda. Isso cria dois problemas: opacidade de custo e lock-in de provedor.

OpenLegion adota uma abordagem diferente. Os modelos são escolhidos por preset — Smartest, Smart ou Normal — por agente ou por workspace, então não há provedor para configurar nem chave para rotacionar. O trabalho é medido em créditos de US$ 0,001 cada, e o custo exato de cada tarefa fica visível no app.

Isso importa por três motivos:

**Transparência de custo.** Você vê exatamente o que cada agente gasta e quanto custou cada tarefa. Cada unidade de trabalho é um despertar registrado com um preço nele, não uma linha numa fatura mensal.

**Flexibilidade de modelo.** Troque presets por agente. Rode Smartest para raciocínio complexo, Smart para o trabalho do dia a dia e Normal para classificação em alto volume — tudo no mesmo workspace, gerenciado a partir do mesmo dashboard.

**Sem lock-in.** Se você sair do OpenLegion, pode exportar o workspace — agentes, tarefas, recibos e entregáveis — e apagar o que ficar. Não há camada de modelo proprietária para migrar.

## Para Quem É

### Desenvolvedores solo construindo produtos com agentes

Você está entregando um produto movido por agente e precisa que seja seguro desde o dia um. OpenLegion te dá infraestrutura de produção — execuções em sandbox, cofre de credenciais, controles de custo — sem contratar um time de DevOps. Descreva o resultado que você quer e o assistente cria os colegas de equipe necessários para chegar lá.

### Times de startup entregando rápido

Seu time tem de 2 a 10 engenheiros. Você precisa de agentes em produção nesta sprint, não no próximo trimestre. Não há instalação: OpenLegion é uma aplicação web hospedada e você entra com o Google. O Free é $0 com 1,000 créditos únicos e sem cartão, então seu primeiro agente está trabalhando minutos depois do cadastro.

### Times de segurança corporativa

Você precisa de tracing de requisição e observabilidade de workflow, isolamento de credenciais que sobrevive a um agente comprometido e controles de orçamento que evitam custos descontrolados. A arquitetura do OpenLegion foi desenhada para ambientes que exigem defesa em profundidade. A coordenação auditável por metas e tarefas significa que cada passo do workflow é explícito e rastreável — sem tomada de decisão opaca por LLM no control plane. Veja nossa página de [segurança de agentes de IA](/learn/ai-agent-security) para o modelo completo de ameaças.

## Prontidão Para Produção: O Que o OpenLegion Cuida vs DIY

| Capacidade | DIY (Só Framework) | OpenLegion |
|---|---|---|
| **Runtime de agente** | Você configura Docker, gerencia imagens, lida com rede | Agentes são registros duráveis, não servidores; cada tarefa roda sob demanda em sandbox e depois para |
| **Gestão de credenciais** | Variáveis de ambiente ou integração de cofre customizada | Credenciais em cofre injetadas fora do modelo — agentes nunca veem chaves cruas |
| **Controles de custo** | Rastreio manual, sem limites rígidos | Orçamentos de créditos por agente a US$ 0,001 por crédito, com corte automático |
| **Orquestração** | Codifica sua própria lógica de roteamento ou usa roteamento via LLM | Coordenação por metas e tarefas (metas → tarefas → agentes) — auditável |
| **Observabilidade** | Integra LangSmith, Datadog ou logging customizado | Dashboard embutido com streaming ao vivo, gráficos de custo, traces de requisição |
| **Deploy multicanal** | Constrói integrações por canal | Chat web em todos os planos, Telegram e webhooks a partir do Pro, Slack e e-mail de entrada no Team e acima |
| **Automação de navegador** | Configura Playwright/Puppeteer, gerencia instâncias do Chrome | Não oferecida no lançamento — os agentes leem a web ao vivo com busca e leitura embutidas |
| **Extensibilidade de ferramenta** | Constrói integrações customizadas ou usa LangChain tools | Embutida — busca e leitura na web, arquivos, memória, agendamentos, execução de código em sandbox, entregáveis compartilháveis |
| **Memória do agente** | Constrói RAG customizado ou gestão de estado | Memória vetorial persistente por agente com gestão automática de contexto |
| **Failover de modelo** | Lógica de retry customizada por provedor | Tratado pela plataforma — escolha um preset e ela roteia por você |

O resumo: se você está avaliando [frameworks de agentes de IA](/learn/ai-agent-frameworks) e se pega construindo mais infraestrutura do que lógica de agente, está resolvendo um problema de plataforma com ferramentas de framework. OpenLegion cuida da camada de plataforma para você focar no que seus agentes de fato fazem.

## Extensibilidade de Ferramenta Embutida

OpenLegion entrega suas ferramentas com a plataforma em vez de pedir que você configure servidores. Todo agente tem busca e leitura na web, manipulação de arquivos, memória de longo prazo, agendamentos, execução de código em sandbox e entregáveis compartilháveis desde o momento em que é criado. Os conectores no lançamento são o Google Calendar e os arquivos do Google Drive que você escolher; o Model Context Protocol (MCP) não é suportado no lançamento.

Ferramentas embutidas significam que um agente é útil no momento em que você o cria, sem nada para instalar e nada para configurar. Cada chamada de ferramenta é uma intenção verificada por um único motor de políticas antes de acontecer, então os agentes ficam dentro dos seus limites de permissão e cada chamada é registrada como um recibo.

## Memória Persistente de Agente

Agentes no OpenLegion mantêm memória entre sessões usando busca vetorial, arquivos de workspace e aprendizados de erro. Quando um agente encontra um problema e o resolve, a solução é armazenada e recordada em sessões futuras — reduzindo falhas repetidas e melhorando a qualidade de execução ao longo do tempo.

A memória é escopada por agente e isolada de qualquer outro agente e de qualquer outro workspace. A gestão automática de contexto mantém o uso de tokens eficiente trazendo só as memórias relevantes para a tarefa atual, em vez de carregar históricos inteiros de conversa.

## Arquitetura: Um Único Motor de Políticas na Frente de Cada Ação

OpenLegion separa cada workspace em quatro fronteiras de confiança, mais uma camada de decisão do dono:

**Entrada externa não confiável.** Qualquer coisa vinda de usuários ou terceiros: chat web, Telegram, Slack, e-mail de entrada e endpoints de webhook. Todas as entradas são validadas e sanitizadas via guards de injeção de prompt antes de chegar ao motor de políticas.

**A execução do agente (não confiável).** Cada tarefa roda sob demanda e depois para, e o código que o agente escreve roda em um sandbox sem acesso à rede por padrão. Mesmo uma execução totalmente comprometida não pode acessar suas credenciais, dados de outros agentes ou outro workspace.

**O motor de políticas (confiável).** Uma única camada verifica cada ação como uma intenção antes de acontecer e a registra como um recibo que o dono pode ler: chamada de ferramenta, delegação, aprovação, custo. Ela guarda o registro compartilhado de metas e tarefas, o cofre de credenciais, a matriz de permissões e o orçamento de créditos de cada agente. Esse é o cérebro — e é o único componente que toca em suas credenciais.

**Decisões do dono ou do administrador.** O trabalho para para uma aprovação em três barreiras apenas: alcançar um terceiro em seu nome, apagar dados e agir sobre conteúdo não confiável. A decisão é tomada no app por um dono ou administrador, nunca por um agente.

**Control plane apenas interno.** O nível mais restrito: operações administrativas como criar agentes, conceder permissões de ferramenta e mudar planos, acessadas por uma única API de administração com escopo de um único workspace.

Essa arquitetura significa que [orquestração de agentes de IA](/learn/ai-agent-orchestration) e segurança não são preocupações separadas — são o mesmo sistema.

## Começando

```text
1. Entre com o Google em app.openlegion.ai — não há nada para instalar.
2. Diga ao assistente o que você quer que seja feito; ele cria os agentes necessários.
3. Aprove a primeira ação que alcança um terceiro e depois leia os recibos.
```

O Free é $0 com 1,000 créditos únicos e sem cartão. O Pro custa $29/mês com 10.000.

## CTA

**Pronto para implantar agentes seguros?**
[Começar Agora](https://app.openlegion.ai) | [Ler a Documentação](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é uma plataforma de agentes de IA?

Uma plataforma de agentes de IA é infraestrutura gerenciada que cuida das preocupações operacionais de rodar agentes de IA autônomos: isolamento por contêiner, gestão de credenciais, controles de custo, orquestração e observabilidade. Fica acima de frameworks como LangGraph ou CrewAI e oferece a camada de produção que os frameworks deixam por sua conta.

### Qual é a melhor plataforma de agentes de IA para produção?

A melhor plataforma de agentes de IA para produção depende dos seus requisitos de segurança e operacionais. Se você precisa de isolamento de execução embutido, credenciais guardadas em cofre e controles de orçamento por agente sem construir infraestrutura customizada, OpenLegion oferece isso de fábrica. Para times profundamente investidos no ecossistema Microsoft, vale a pena avaliar o Azure AI Agent Service. Para máxima flexibilidade com mais esforço DIY, auto-hospedar LangGraph com LangSmith dá observabilidade forte.

### O que é uma plataforma corporativa de agentes de IA?

Uma plataforma corporativa de agentes de IA adiciona controles de governança, conformidade e segurança em cima de orquestração básica de agentes. Requisitos-chave incluem: isolamento de credenciais (agentes nunca devem ver chaves de API cruas), rastreabilidade de workflow, imposição de orçamento para evitar custos descontrolados, controle de acesso baseado em papel e opções de deploy que suportam requisitos de residência de dados. A arquitetura do OpenLegion foi desenhada para ambientes que exigem esses controles.

### Posso hospedar agentes de IA com minhas próprias chaves de API?

Não, e você não precisa. O acesso ao modelo está incluído: escolha um preset — Smartest, Smart ou Normal — por agente ou por workspace, e o OpenLegion cuida do provedor. O trabalho é medido em créditos de US$ 0,001 cada, então você vê o custo exato de cada tarefa. O Free é $0 com 1,000 créditos únicos e sem cartão.

### Agentes de IA gerenciados vs auto-hospedados: qual a diferença?

Plataformas gerenciadas de agentes de IA cuidam de provisionamento, cofre de credenciais, controles de custo e observabilidade para você. Auto-hospedado significa que você implanta um framework (LangGraph, CrewAI, AutoGen) na sua própria infraestrutura e constrói essas camadas operacionais sozinho. Gerenciado é mais rápido para chegar à produção e exige menos investimento em DevOps. Auto-hospedado dá controle máximo de infraestrutura. OpenLegion é gerenciado: você entra com o Google e começa, e o engine por baixo é publicado com código-fonte disponível sob a PolyForm Perimeter License 1.0.1.

### Como o OpenLegion se compara a outras plataformas de agentes de IA?

OpenLegion se diferencia pela arquitetura security-first. Com base na documentação pública no momento da escrita, nenhum outro [framework de agentes de IA](/learn/ai-agent-frameworks) grande oferece credenciais guardadas em cofre embutidas, uma execução em sandbox para cada tarefa ou imposição nativa de orçamento por agente. Veja nossa [comparação de frameworks](/learn/ai-agent-frameworks) para uma decomposição detalhada entre OpenClaw, LangGraph, CrewAI, AutoGen e Semantic Kernel.

### Qual licença o OpenLegion usa?

O engine do OpenLegion é publicado com código-fonte disponível sob a PolyForm Perimeter License 1.0.1 no [GitHub](https://github.com/openlegion-ai/openlegion). A plataforma hospedada é proprietária e é onde os times rodam agentes sem gerenciar nenhuma infraestrutura.

### Quão rápido posso implantar meu primeiro agente?

Minutos, sem nada para instalar. Entre com o Google, diga ao assistente o que você quer que seja feito, e ele cria os agentes necessários. O Free é $0 com 1,000 créditos únicos e sem cartão, então nada fica entre entrar e a sua primeira tarefa.

---

## Links Internos Para Incluir

| Texto Âncora | Destino |
|---|---|
| Plataforma de agentes de IA | /learn/ai-agent-platform |
| Orquestração de agentes de IA | /learn/ai-agent-orchestration |
| Comparação de frameworks de agentes de IA | /learn/ai-agent-frameworks |
| Segurança de agentes de IA | /learn/ai-agent-security |
| Alternativa ao OpenClaw | /openclaw-alternative |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Documentação | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
