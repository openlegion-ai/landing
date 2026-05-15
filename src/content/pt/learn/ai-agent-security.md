---
title: 'Segurança de Agentes de IA — Ameaças, Isolamento, Cofres'
description: >-
 Guia de segurança de agentes de IA: vazamento de credenciais, injeção de
 prompt, escape de sandbox e como isolamento por contêiner, credenciais em
 proxy de cofre e controles de orçamento mitigam cada ameaça.
slug: /learn/ai-agent-security
primary_keyword: segurança de agentes de IA
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-platform
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-frameworks
 - /comparison
---

# Segurança de Agentes de IA: O Modelo de Ameaças Para Frotas de Agente em Produção

Todo framework de agentes de IA te dá ferramentas para construir agentes. Quase nenhum te dá ferramentas para contê-los. Quando um agente pode chamar APIs, navegar na web, executar código e acessar bancos de dados, a pergunta de segurança não é se algo pode dar errado — é qual o raio de impacto quando der.

**Segurança de agentes de IA** é a prática de restringir agentes autônomos para que um agente comprometido, mal configurado ou se comportando mal não consiga vazar credenciais, exfiltrar dados, drenar orçamentos ou escalar privilégios. OpenLegion trata isso como uma preocupação central de arquitetura, não como um add-on. Cada agente roda em um contêiner isolado com credenciais em proxy de cofre, controles de orçamento por agente e uma matriz de permissões — tudo habilitado por padrão.

Traga suas próprias chaves de API de LLM. Sem markup sobre uso de modelo.

<!-- SCHEMA: DefinitionBlock -->

> **O que é segurança de agentes de IA?**
> Segurança de agentes de IA abrange os controles que evitam que agentes de IA autônomos causem dano — seja por vazamento de credenciais, injeção de prompt, abuso de recursos, exfiltração de dados ou agência excessiva. Inclui isolamento de runtime, gestão de credenciais, imposição de custo, controles de permissão e validação de entrada aplicados no nível da infraestrutura.

## TL;DR

- **A ameaça é real.** Pesquisas mostram que 77% das organizações com deploys de IA tiveram incidentes de segurança em 2024. Só 5% expressam confiança nas suas medidas de segurança de IA.
- **Quatro ameaças primárias**: Vazamento de credenciais, injeção de prompt, abuso de recursos (denial of wallet) e exfiltração de dados. Cada uma exige uma mitigação diferente.
- **Nenhum framework grande oferece segurança embutida.** Com base na documentação pública, LangGraph, CrewAI, AutoGen e OpenClaw todos dependem de variáveis de ambiente para credenciais, sem isolamento nativo ou imposição de orçamento.
- **A defesa em seis camadas do OpenLegion**: Isolamento por contêiner, endurecimento do contêiner, separação de credenciais (proxy de cofre), imposição de permissão, validação de entrada e sanitização Unicode — tudo habilitado por padrão.
- **Agentes de IA seguros são possíveis com chaves BYO** — o modelo de proxy de cofre significa que suas chaves ficam na zona confiável e os agentes interagem por um proxy que nunca expõe segredos crus.

## O Modelo de Ameaças Para Agentes de IA

### Ameaça 1: Vazamento de credenciais

**O que acontece.** Um agente com acesso a chaves de API — por variáveis de ambiente, arquivos de configuração ou passagem em contexto — vaza essas chaves por injeção de prompt, logging, mensagens de erro ou chamadas maliciosas de ferramenta.

**Quão comum.** Pesquisa publicada no início de 2026 encontrou que 283 de 3.984 skills de agente escaneadas (7,1%) continham falhas críticas de tratamento de credenciais, passando chaves de API e senhas pelo contexto do LLM em texto puro. Separadamente, 76 skills continham payloads deliberadamente maliciosos desenhados para roubo de credenciais. Incidentes de alto perfil incluem um funcionário da xAI vazando uma chave de API no GitHub que deu acesso a mais de 60 LLMs privados por dois meses, e uma vulnerabilidade em uma plataforma de LLM popular que expôs chaves de API por um endpoint não autenticado.

**Como o OpenLegion mitiga.** OpenLegion usa credenciais em proxy de cofre através de um proxy de cofre. Chaves de API são armazenadas no Mesh Host (Zona 2). Quando um agente precisa chamar uma API externa, a requisição é roteada pelo proxy de cofre, que injeta a credencial na camada de rede. O agente nunca vê, loga ou tem acesso de memória à chave crua. Mesmo um agente totalmente comprometido não pode extrair credenciais porque elas nunca estão presentes no contêiner do agente.

### Ameaça 2: Injeção de prompt

**O que acontece.** Um atacante embute instruções maliciosas em conteúdo que o agente processa — páginas web, documentos, e-mails, registros de banco, entradas de usuário. O agente segue as instruções injetadas em vez de (ou junto com) sua tarefa pretendida.

**Quão comum.** Injeção de prompt aparece em mais de 73% dos deploys de IA em produção avaliados durante auditorias de segurança. A OpenAI declarou em dezembro de 2025 que injeção de prompt "provavelmente nunca será totalmente resolvida". A OWASP a classifica como a vulnerabilidade #1 para aplicações LLM. Incidentes reais incluem um agente de navegador que foi enganado para roubar credenciais em 150 segundos via instruções escondidas em uma página web, e sistemas RAG corporativos onde conteúdo malicioso em documentos públicos fez agentes vazarem dados proprietários.

**Como o OpenLegion mitiga.** OpenLegion aplica defesa em profundidade em várias camadas. A sanitização Unicode remove caracteres invisíveis (bidi overrides, tag characters, caracteres de largura zero) em 56 pontos de estrangulamento antes do conteúdo chegar ao contexto do LLM — esses caracteres são comumente usados para esconder instruções injetadas. Validação de entrada evita path traversal e impõe avaliação segura de condições. Isolamento por contêiner limita o raio de impacto: mesmo se um agente é injetado com sucesso, ele só pode acessar seu próprio contêiner em sandbox com suas próprias permissões escopadas. Não pode acessar dados de outros agentes, o cofre de credenciais ou o sistema host.

Nenhum sistema pode garantir imunidade completa a injeção de prompt. A abordagem do OpenLegion é minimizar a superfície de ataque e conter o dano.

### Ameaça 3: Abuso de recursos (Denial of Wallet)

**O que acontece.** Um agente entra em loop recursivo, faz chamadas excessivas a APIs ou é manipulado a consumir recursos muito além do necessário. Em sistemas multiagente, isso compõe — um workflow de 5 agentes custa 5x o que um único agente custa, e um loop descontrolado pode queimar centenas de dólares em minutos antes que alguém perceba.

**Quão comum.** Está listado como OWASP LLM10:2025 (Unbounded Consumption). A maioria dos sistemas de billing em nuvem não para cobranças automaticamente quando orçamentos são excedidos — alertas disparam, mas o medidor continua rodando. Relatos da comunidade de usuários do CrewAI e LangGraph descrevem loops queimadores de tokens que consumiram 10x os orçamentos esperados.

**Como o OpenLegion mitiga.** Controles de orçamento diário e mensal por agente com corte rígido. Cada agente da frota tem seu próprio orçamento de tokens rastreado em tempo real. Quando o limite é atingido, a [camada de orquestração](/learn/ai-agent-orchestration) encerra aquele agente específico. O resto do workflow continua ou pausa graciosamente. Não há "aviso soft" que é ignorado — o corte é imposto no nível da infraestrutura.

### Ameaça 4: Exfiltração de dados

**O que acontece.** Um agente é manipulado a enviar dados sensíveis para um endpoint controlado pelo atacante. Técnicas incluem: instruir o agente a codificar dados em parâmetros de URL (que são logados ou enviados via previews de link), usar o navegador do agente para visitar páginas controladas pelo atacante ou explorar chamadas de ferramenta para encaminhar dados a APIs externas.

**Quão comum.** Técnicas de exfiltração zero-click foram demonstradas contra agentes operando em plataformas de mensagens (onde previews de link buscam URLs automaticamente), ferramentas corporativas de colaboração e repositórios de código. Pesquisa em agentes bancários mostrou taxas de sucesso de aproximadamente 20% para ataques de exfiltração de dados.

**Como o OpenLegion mitiga.** Isolamento de rede no nível do contêiner restringe quais endpoints externos cada agente pode alcançar. A matriz de permissões define ferramentas, arquivos e operações da mesh permitidas por agente. Requisições de saída passam por canais controlados. Combinado com o isolamento de credenciais (o agente não tem credenciais para exfiltrar) e a coordenação modelo de frota (que loga cada ação), a superfície de ataque para exfiltração é significativamente reduzida em comparação a agentes rodando em espaços de processo compartilhados com acesso de rede irrestrito.

### Ameaça 5: Escape de sandbox

**O que acontece.** Um agente ou seu código executado escapa do seu contêiner e ganha acesso ao sistema host, outros contêineres ou à camada de orquestração. Vulnerabilidades de escape de contêiner são descobertas com frequência — múltiplos CVEs runC de alta severidade foram divulgados em novembro de 2025 afetando Docker e Kubernetes nos principais provedores de nuvem.

**Como o OpenLegion mitiga.** Endurecimento do contêiner: execução non-root (UID 1000), flag `no-new-privileges`, limites de memória configuráveis (padrão 384MB), limites de CPU configuráveis (padrão 0.15) e sem filesystem compartilhado entre contêineres. Cada agente ganha seu próprio volume `/data`. O modelo de quatro zonas de confiança (mais uma camada operador-ou-interna) significa que mesmo se um agente escapa do seu contêiner, ele pousa em uma zona sem acesso direto ao cofre de credenciais ou aos contêineres de outros agentes. Para ambientes que exigem isolamento mais forte, a arquitetura suporta microVMs Docker Sandbox.

### Ameaça 6: Ataques à cadeia de suprimentos

**O que acontece.** Código malicioso é introduzido via skills de agente, servidores de ferramenta MCP, configurações compartilhadas ou dependências de framework. Servidores MCP maliciosos foram encontrados no npm se passando por serviços legítimos. Arquivos de configuração crowdsourced foram armados com prompts ocultos disparados pelo LLM.

**Como o OpenLegion mitiga.** OpenLegion usa zero dependências externas de framework — sem LangChain, sem Redis, sem Kubernetes. O núcleo é Python puro + SQLite. Servidores de ferramenta MCP são suportados, mas isolados pela matriz de permissões. A coordenação modelo de frota significa que as chamadas de ferramenta são declaradas explicitamente na definição do workflow, não descobertas dinamicamente em tempo de execução — reduzindo a superfície para injeção inesperada de ferramenta.

## Como Funciona o Isolamento de Agentes de IA no OpenLegion

O modelo de quatro zonas de confiança do OpenLegion, mais uma camada operador-ou-interna, separa cada deploy em fronteiras de segurança distintas:

**Zona 0 — Entrada Externa Não Confiável.** Qualquer coisa vinda de usuários ou terceiros: CLI, Telegram, Discord, Slack, WhatsApp e endpoints de webhook. As entradas são validadas e sanitizadas via guards de injeção de prompt antes de entrar na Zona 2.

**Zona 1 — Contêineres de Agente em Sandbox (Não Confiáveis).** Cada agente roda como uma instância FastAPI isolada em seu próprio contêiner Docker. Cada contêiner tem seu próprio volume `/data`, seu próprio banco de memória (SQLite + busca vetorial), limites de recurso configuráveis (padrão 384MB RAM / 0.15 CPU), execução non-root (UID 1000), `cap_drop=ALL`, `no-new-privileges`, um filesystem raiz somente leitura e sem acesso ao Docker socket, cofre de credenciais ou contêineres de outros agentes.

**Zona 2 — Mesh Host (Confiável).** O único componente com acesso a credenciais. Roda o Blackboard (estado compartilhado + WAL), o roteador PubSub, o Credential Vault (proxy de injeção cega), a matriz de ACL, o Container Manager, o Cost Tracker e o Browser Service (Camoufox por agente na :8500). Essa zona é endurecida e não é exposta ao código do agente.

**Zona 2.5 — Operador-ou-Interna.** Operações reservadas do control-plane disponíveis ao agente Operador ou à tooling interna da mesh — gestão de frota, edições de agente, concessões de permissão (o Operador não pode conceder `can_spawn` nem `can_use_wallet`).

**Zona 3 — Interna Apenas Loopback.** O nível mais restrito: endpoints que exigem tanto um header `x-mesh-internal: 1` quanto um IP de origem loopback. Usados apenas para chamadas de coordenação mesh-internas.

Essa arquitetura significa que um agente comprometido na Zona 1 não pode alcançar a Zona 2 (credenciais) nem outros contêineres da Zona 1 (dados de outros agentes). O raio de impacto de qualquer comprometimento de agente isolado é contido ao sandbox daquele agente.

## Gestão de Credenciais de Agentes de IA: Proxy de Cofre vs Variáveis de Ambiente

O padrão mais comum de gestão de credenciais entre [frameworks de agentes de IA](/learn/ai-agent-frameworks) é variáveis de ambiente. Sua chave de API fica num arquivo `.env` ou é passada via `OAI_CONFIG_LIST`. O processo do agente lê diretamente. Isso significa que:

- A chave existe no espaço de memória do agente
- Um ataque de injeção de prompt pode instruir o agente a imprimir ou exfiltrar a chave
- Logs, mensagens de erro e saída de debug podem conter a chave
- Se o agente é comprometido, o atacante tem acesso direto a todas as credenciais injetadas

O proxy de cofre do OpenLegion muda essa arquitetura de forma fundamental. Chaves de API são armazenadas no Credential Vault do Mesh Host (Zona 2). Quando um agente precisa fazer uma chamada de API autenticada, ele envia a requisição ao proxy de cofre. O proxy injeta a credencial na camada de rede, faz a chamada autenticada e devolve o resultado ao agente. O agente nunca vê, armazena ou tem acesso de memória à chave crua.

Isso é **credenciais em proxy de cofre** — o mesmo princípio usado por sistemas corporativos de gestão de segredos como HashiCorp Vault, mas construído dentro da camada de [orquestração de agentes de IA](/learn/ai-agent-orchestration) em vez de exigir infraestrutura separada.

## Agentes de IA em Contêiner: Por Que Isolamento em Nível de Processo Não Basta

Vários frameworks oferecem alguma forma de isolamento, mas os detalhes de implementação importam:

| Framework | Abordagem de isolamento | O que é de fato isolado | O que é compartilhado |
|---|---|---|---|
| **OpenLegion** | Contêiner Docker por agente (obrigatório) | Processo, filesystem, rede, memória, credenciais | Nada — agentes são totalmente isolados |
| **OpenClaw** | Contêiner Docker (opcional) | Processo, filesystem | Docker socket montado por padrão; rede do host acessível |
| **LangGraph** | Nenhum embutido | N/A | Tudo — agentes compartilham processo Python |
| **CrewAI** | Docker para CodeInterpreter | Saída de execução de código | Processos de agente compartilham runtime Python |
| **AutoGen** | Docker para execução de código | Saída de execução de código | Processos de agente compartilham runtime Python |

A distinção crítica: OpenLegion isola o **próprio agente** em um contêiner. Outros frameworks que oferecem isolamento Docker tipicamente isolam só a **saída da execução de código** — o processo do agente, sua memória e seu acesso a credenciais permanecem compartilhados. Isso significa que uma injeção de prompt que compromete um agente em LangGraph ou CrewAI tem acesso a todas as credenciais e estado no processo compartilhado. No OpenLegion, o mesmo comprometimento fica contido em um único contêiner em sandbox sem acesso a credenciais.

## Controles de Custo de Agentes de IA: Imposição de Orçamento Como Segurança

Controles de custo não são só governança financeira — são um mecanismo de segurança. Um agente descontrolado consumindo tokens ilimitados é um ataque de abuso de recursos, seja disparado por injeção maliciosa de prompt ou por um bug simples no loop de raciocínio do agente.

A imposição de orçamento do OpenLegion funciona no nível do orquestrador:

- Cada agente tem um orçamento de tokens diário e mensal configurável
- O uso de tokens é rastreado em tempo real pelo Cost Tracker na Zona 2
- Quando um agente atinge seu limite, o orquestrador emite um corte rígido — o agente é encerrado
- O resto do pipeline de workflow continua ou pausa graciosamente
- Dados de custo são visíveis no dashboard da frota com decomposições por agente

Nenhum outro framework grande de agentes de IA oferece essa capacidade embutida, com base na documentação pública no momento da escrita.

## Considerações de Conformidade e Auditoria

OpenLegion é **desenhado para ambientes que exigem** controles de conformidade, incluindo:

- **Tracing de requisição**: A coordenação modelo de frota auditável significa que cada passo do workflow é explícito e rastreável. O sistema de tracing de requisição embutido registra transições de tarefa, chamadas de ferramenta e gasto de tokens para observabilidade em tempo real. O Blackboard (estado compartilhado) fornece contexto de coordenação entre agentes.
- **Coordenação modelo de frota auditável**: Coordenação modelo de frota (blackboard + pub/sub + handoff) pode ser auditada antes da execução — você pode verificar o fluxo completo de dados, permissões e interações de agente sem rodar o sistema.
- **Isolamento de dados**: Contêineres por agente com volumes `/data` dedicados garantem que dados sensíveis processados por um agente não são acessíveis a outros agentes.
- **Suporte a air-gap**: Sem serviços externos (sem Redis, sem Kubernetes, sem serviços de nuvem exigidos) significa que OpenLegion pode rodar em ambientes on-premises.

**Importante**: OpenLegion atualmente não detém certificações SOC 2, ISO 27001, HIPAA ou outras. A arquitetura foi construída para suportar ambientes com esses requisitos, mas a certificação é função do seu deploy, configuração e controles organizacionais — não só do framework.

## CTA

**Implante agentes que são seguros por padrão.**
[Começar Agora](https://app.openlegion.ai) | [Ler a Documentação](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que significa segurança de agentes de IA?

Segurança de agentes de IA é o conjunto de controles que evita que agentes de IA autônomos causem dano por vazamento de credenciais, injeção de prompt, abuso de recursos, exfiltração de dados, escape de sandbox ou agência excessiva. Abrange isolamento de runtime (sandboxing de agentes), gestão de credenciais (evitando exposição de chave), imposição de custo (parando gastos descontrolados), controles de permissão (limitando o que os agentes podem fazer) e validação de entrada (filtrando entradas maliciosas).

### Como você protege agentes de IA com chaves de API?

A abordagem mais segura são credenciais em proxy de cofre: armazene chaves de API num cofre que os agentes não podem acessar diretamente. Quando um agente precisa fazer uma chamada autenticada, a requisição é roteada por um proxy que injeta a credencial na camada de rede. O agente nunca vê a chave crua. OpenLegion implementa isso pelo seu proxy de cofre na Zona 2 do modelo de quatro zonas de confiança (mais uma camada operador-ou-interna). A abordagem menos segura (e mais comum) é variáveis de ambiente, onde as chaves existem na memória do agente e podem vazar por injeção de prompt, logging ou saída de erro.

### Como funciona o isolamento de agentes de IA?

Isolamento de agente significa rodar cada agente em seu próprio ambiente em sandbox — processo, filesystem, namespace de rede e espaço de memória separados. No OpenLegion, cada agente roda em um contêiner Docker dedicado com limites de recurso configuráveis (padrão 384MB RAM, 0.15 CPU), execução non-root e sem filesystem compartilhado. Isso significa que um agente comprometido não pode acessar dados de outros agentes, o cofre de credenciais ou o sistema host. Isso difere de frameworks onde os agentes compartilham um processo Python e podem acessar a memória uns dos outros.

### Por que agentes de IA precisam de controles de orçamento / custo?

Agentes autônomos podem entrar em loops recursivos, fazer chamadas excessivas a APIs ou ser manipulados a consumir recursos muito além do necessário. Sem controles de orçamento, um único agente descontrolado pode drenar centenas de dólares em tokens em minutos. Em sistemas multiagente isso compõe — cada agente multiplica o risco. OpenLegion impõe orçamentos diários e mensais por agente com cortes rígidos no nível do orquestrador, impedindo que qualquer agente isolado cause custo ilimitado.

### Agentes de IA seguros são possíveis com chaves BYO?

Sim. O modelo de chaves BYO (Bring Your Own) é, na verdade, mais seguro com a arquitetura adequada. No OpenLegion, suas chaves são armazenadas no Credential Vault do Mesh Host e injetadas por um proxy de cofre na camada de rede. Os agentes nunca veem chaves cruas. Isso te dá transparência total de custo (você vê exatamente o que cada agente gasta com cada provedor), flexibilidade de provedor (troque modelos por agente) e as mesmas garantias de isolamento de credenciais, independente do provedor que você usa. Traga suas próprias chaves de API de LLM. Sem markup sobre uso de modelo.

### O que é o OWASP Top 10 para agentes de IA?

A OWASP publicou o Top 10 para Aplicações Agênticas em dezembro de 2025. O risco #1 é Sequestro de Objetivo do Agente — onde um atacante manipula um agente para perseguir objetivos diferentes do que o usuário pretendia. Outros riscos do topo incluem vazamento de credenciais, agência excessiva (agentes tomando ações além do seu escopo) e vulnerabilidades de cadeia de suprimentos (ferramentas ou plugins maliciosos). OpenLegion endereça isso por credenciais em proxy de cofre, isolamento por contêiner, matrizes de permissão e coordenação modelo de frota (blackboard + pub/sub + handoff).

### Como o OpenLegion se compara ao OpenClaw em segurança?

Com base na documentação pública, OpenLegion oferece padrões de segurança mais rígidos. O deploy local padrão do OpenClaw exige montar o Docker socket (concedendo amplo acesso ao host), seu analisador de segurança teve problemas reportados de ativação consistente e armazena credenciais em configuração acessível ao processo do agente. OpenLegion roda agentes em contêineres isolados obrigatórios, usa um proxy de cofre para credenciais via proxy de cofre, impõe orçamentos por agente e aplica sanitização Unicode em múltiplos pontos de estrangulamento. Para uma comparação detalhada, veja [OpenLegion vs OpenClaw](/comparison/openclaw).

### Quais frameworks de conformidade se aplicam a agentes de IA?

Frameworks-chave incluem OWASP Top 10 para Aplicações LLM (2025) e Aplicações Agênticas (2026), NIST AI Risk Management Framework (com próximos AI Agent Standards), ISO/IEC 42001 (sistemas de gestão de IA), o EU AI Act (cumprimento começa em agosto de 2026) e regulamentações específicas de setor como HIPAA, SOC 2 e SOX, dependendo do seu domínio. A arquitetura do OpenLegion é desenhada para ambientes que exigem esses controles, mas o framework em si não detém certificações.

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
