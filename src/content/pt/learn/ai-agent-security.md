---
title: 'Segurança de Agentes de IA — Ameaças, Isolamento, Cofres'
description: >-
 Guia de segurança de agentes de IA: vazamento de credenciais, injeção de
 prompt, escape de sandbox e como isolamento de execução, credenciais
 guardadas em cofre e controles de orçamento mitigam cada ameaça.
slug: /learn/ai-agent-security
primary_keyword: segurança de agentes de IA
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2026-03
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

**Segurança de agentes de IA** é a prática de restringir agentes autônomos para que um agente comprometido, mal configurado ou se comportando mal não consiga vazar credenciais, exfiltrar dados, drenar orçamentos ou escalar privilégios. OpenLegion trata isso como uma preocupação central de arquitetura, não como um add-on. Cada ação é uma intenção verificada por um único motor de políticas antes de acontecer, as credenciais ficam num cofre fora do modelo e cada agente carrega seu próprio orçamento — tudo habilitado por padrão.

Os modelos são escolhidos por preset — Smartest, Smart ou Normal — por agente ou por workspace.

<!-- SCHEMA: DefinitionBlock -->

> **O que é segurança de agentes de IA?**
> Segurança de agentes de IA abrange os controles que evitam que agentes de IA autônomos causem dano — seja por vazamento de credenciais, injeção de prompt, abuso de recursos, exfiltração de dados ou agência excessiva. Inclui isolamento de runtime, gestão de credenciais, imposição de custo, controles de permissão e validação de entrada aplicados no nível da infraestrutura.

## TL;DR

- **A ameaça é real.** Pesquisas mostram que 77% das organizações com deploys de IA tiveram incidentes de segurança em 2024. Só 5% expressam confiança nas suas medidas de segurança de IA.
- **Quatro ameaças primárias**: Vazamento de credenciais, injeção de prompt, abuso de recursos (denial of wallet) e exfiltração de dados. Cada uma exige uma mitigação diferente.
- **Nenhum framework grande oferece segurança embutida.** Com base na documentação pública, LangGraph, CrewAI, AutoGen e OpenClaw todos dependem de variáveis de ambiente para credenciais, sem isolamento nativo ou imposição de orçamento.
- **A defesa em camadas do OpenLegion**: um único motor de políticas na frente de cada ação, execuções de tarefa em sandbox, separação de credenciais (um cofre fora do modelo), imposição de permissão, validação de entrada e sanitização Unicode — tudo habilitado por padrão.
- **As credenciais dos seus serviços ficam seguras** — elas vivem num cofre e são injetadas fora do modelo, que só guarda um handle e nunca vê um segredo cru.

## O Modelo de Ameaças Para Agentes de IA

### Ameaça 1: Vazamento de credenciais

**O que acontece.** Um agente com acesso a chaves de API — por variáveis de ambiente, arquivos de configuração ou passagem em contexto — vaza essas chaves por injeção de prompt, logging, mensagens de erro ou chamadas maliciosas de ferramenta.

**Quão comum.** Pesquisa publicada no início de 2026 encontrou que 283 de 3.984 skills de agente escaneadas (7,1%) continham falhas críticas de tratamento de credenciais, passando chaves de API e senhas pelo contexto do LLM em texto puro. Separadamente, 76 skills continham payloads deliberadamente maliciosos desenhados para roubo de credenciais. Incidentes de alto perfil incluem um funcionário da xAI vazando uma chave de API no GitHub que deu acesso a mais de 60 LLMs privados por dois meses, e uma vulnerabilidade em uma plataforma de LLM popular que expôs chaves de API por um endpoint não autenticado.

**Como o OpenLegion mitiga.** As credenciais ficam num cofre e são injetadas fora do modelo, que só guarda um handle. Quando um agente precisa chamar uma API externa, a plataforma injeta a credencial na fronteira da chamada. O agente nunca vê, loga ou tem acesso de memória à chave crua. Mesmo um agente totalmente comprometido não pode extrair credenciais porque elas nunca estão presentes na sua execução.

### Ameaça 2: Injeção de prompt

**O que acontece.** Um atacante embute instruções maliciosas em conteúdo que o agente processa — páginas web, documentos, e-mails, registros de banco, entradas de usuário. O agente segue as instruções injetadas em vez de (ou junto com) sua tarefa pretendida.

**Quão comum.** Injeção de prompt aparece em mais de 73% dos deploys de IA em produção avaliados durante auditorias de segurança. A OpenAI declarou em dezembro de 2025 que injeção de prompt "provavelmente nunca será totalmente resolvida". A OWASP a classifica como a vulnerabilidade #1 para aplicações LLM. Incidentes reais incluem um agente de navegador que foi enganado para roubar credenciais em 150 segundos via instruções escondidas em uma página web, e sistemas RAG corporativos onde conteúdo malicioso em documentos públicos fez agentes vazarem dados proprietários.

**Como o OpenLegion mitiga.** OpenLegion aplica defesa em profundidade em várias camadas. A sanitização Unicode remove caracteres invisíveis (bidi overrides, tag characters, caracteres de largura zero) antes do conteúdo chegar ao contexto do LLM — esses caracteres são comumente usados para esconder instruções injetadas. Validação de entrada evita path traversal e impõe avaliação segura de condições. Agir sobre conteúdo não confiável é uma das três barreiras em que o trabalho para para a aprovação do dono, o que limita o raio de impacto: um agente injetado só pode agir dentro das suas próprias permissões escopadas. Não pode acessar dados de outros agentes, o cofre de credenciais ou o sistema host.

Nenhum sistema pode garantir imunidade completa a injeção de prompt. A abordagem do OpenLegion é minimizar a superfície de ataque e conter o dano.

### Ameaça 3: Abuso de recursos (Denial of Wallet)

**O que acontece.** Um agente entra em loop recursivo, faz chamadas excessivas a APIs ou é manipulado a consumir recursos muito além do necessário. Em sistemas multiagente, isso compõe — um workflow de 5 agentes custa 5x o que um único agente custa, e um loop descontrolado pode queimar centenas de dólares em minutos antes que alguém perceba.

**Quão comum.** Está listado como OWASP LLM10:2025 (Unbounded Consumption). A maioria dos sistemas de billing em nuvem não para cobranças automaticamente quando orçamentos são excedidos — alertas disparam, mas o medidor continua rodando. Relatos da comunidade de usuários do CrewAI e LangGraph descrevem loops queimadores de tokens que consumiram 10x os orçamentos esperados.

**Como o OpenLegion mitiga.** Orçamentos por agente com corte rígido. Cada agente do time tem seu próprio orçamento, e cada unidade de trabalho é um despertar registrado e medido em créditos de US$ 0,001 cada. Quando o limite é atingido, a [camada de orquestração](/learn/ai-agent-orchestration) encerra aquele agente específico. O resto do workflow continua ou pausa graciosamente. Não há "aviso soft" que é ignorado — o corte é imposto no nível da plataforma.

### Ameaça 4: Exfiltração de dados

**O que acontece.** Um agente é manipulado a enviar dados sensíveis para um endpoint controlado pelo atacante. Técnicas incluem: instruir o agente a codificar dados em parâmetros de URL (que são logados ou enviados via previews de link), usar o navegador do agente para visitar páginas controladas pelo atacante ou explorar chamadas de ferramenta para encaminhar dados a APIs externas.

**Quão comum.** Técnicas de exfiltração zero-click foram demonstradas contra agentes operando em plataformas de mensagens (onde previews de link buscam URLs automaticamente), ferramentas corporativas de colaboração e repositórios de código. Pesquisa em agentes bancários mostrou taxas de sucesso de aproximadamente 20% para ataques de exfiltração de dados.

**Como o OpenLegion mitiga.** O código que o agente escreve roda em um sandbox sem acesso à rede por padrão, e alcançar um terceiro em seu nome para para a aprovação do dono. A matriz de permissões define ferramentas, arquivos e operações permitidas por agente. Requisições de saída passam por canais controlados. Combinado com o isolamento de credenciais (o agente não tem credenciais para exfiltrar) e os recibos que registram cada ação, a superfície de ataque para exfiltração é significativamente reduzida em comparação a agentes rodando em espaços de processo compartilhados com acesso de rede irrestrito.

### Ameaça 5: Escape de sandbox

**O que acontece.** Um agente ou seu código executado escapa do seu contêiner e ganha acesso ao sistema host, outros contêineres ou à camada de orquestração. Vulnerabilidades de escape de contêiner são descobertas com frequência — múltiplos CVEs runC de alta severidade foram divulgados em novembro de 2025 afetando Docker e Kubernetes nos principais provedores de nuvem.

**Como o OpenLegion mitiga.** O código que o agente escreve roda em um sandbox sem acesso à rede por padrão, e cada tarefa roda sob demanda e depois para — não existe processo de agente de longa duração para comprometer. Cada agente ganha seu próprio armazenamento, nunca um compartilhado. Um único motor de políticas na frente de cada ação significa que, mesmo se uma execução fosse subvertida, ela não teria caminho direto ao cofre de credenciais nem aos dados de outro agente. As credenciais são injetadas fora do modelo, então uma execução subvertida não tem nada para roubar.

### Ameaça 6: Ataques à cadeia de suprimentos

**O que acontece.** Código malicioso é introduzido via skills de agente, servidores de ferramenta MCP, configurações compartilhadas ou dependências de framework. Servidores MCP maliciosos foram encontrados no npm se passando por serviços legítimos. Arquivos de configuração crowdsourced foram armados com prompts ocultos disparados pelo LLM.

**Como o OpenLegion mitiga.** Toda ferramenta que um agente alcança é concedida explicitamente pelo dono, não descoberta em tempo de execução, e não há superfície de plugin de terceiros no lançamento. As concessões de ferramenta são verificadas pelo motor de políticas em cada chamada e registradas como recibos. A coordenação por metas e tarefas significa que as chamadas de ferramenta são explícitas na definição da tarefa, não resolvidas dinamicamente — reduzindo a superfície para injeção inesperada de ferramenta.

## Como Funciona o Isolamento de Agentes de IA no OpenLegion

O OpenLegion coloca um único motor de políticas na frente de cada ação e separa um workspace em fronteiras de segurança distintas:

**Entrada não confiável.** Qualquer coisa vinda de usuários ou terceiros: chat web, Telegram, Slack, e-mail de entrada e endpoints de webhook. As entradas são validadas e sanitizadas via guards de injeção de prompt, e agir sobre conteúdo não confiável para para a aprovação do dono.

**A execução do agente.** Cada tarefa roda sob demanda e depois para. O código que o agente escreve roda em um sandbox sem acesso à rede por padrão, e a execução não guarda credenciais — apenas um handle. Os agentes são registros duráveis, não servidores, então não existe processo de longa duração para comprometer, criar um é instantâneo, um agente ocioso não custa nada e um workspace pode rodar centenas.

**O motor de políticas.** Cada ação é uma intenção verificada antes de acontecer: chamada de ferramenta, delegação, aprovação, custo. É o único componente com acesso ao cofre, injeta credenciais fora do modelo e registra cada ação como um recibo que o dono pode ler.

**Decisões do dono e do administrador.** O trabalho para para uma aprovação em três barreiras apenas: alcançar um terceiro em seu nome, apagar dados e agir sobre conteúdo não confiável. As aprovações são decididas no app por um dono ou administrador, nunca pelo próprio agente.

**Isolamento de workspace.** Os agentes, tarefas, memória e recibos de um workspace têm escopo naquele workspace, e as concessões de permissão por agente o estreitam ainda mais. Nada que um agente faça alcança fora das concessões que o dono deu.

Essa arquitetura significa que um agente comprometido não pode alcançar o cofre nem os dados de outro agente. O raio de impacto de qualquer comprometimento de agente isolado é contido à execução daquele agente e às suas próprias concessões.

## Gestão de Credenciais de Agentes de IA: Cofre de Credenciais vs Variáveis de Ambiente

O padrão mais comum de gestão de credenciais entre [frameworks de agentes de IA](/learn/ai-agent-frameworks) é variáveis de ambiente. Sua chave de API fica num arquivo `.env` ou é passada via `OAI_CONFIG_LIST`. O processo do agente lê diretamente. Isso significa que:

- A chave existe no espaço de memória do agente
- Um ataque de injeção de prompt pode instruir o agente a imprimir ou exfiltrar a chave
- Logs, mensagens de erro e saída de debug podem conter a chave
- Se o agente é comprometido, o atacante tem acesso direto a todas as credenciais injetadas

O cofre de credenciais do OpenLegion muda essa arquitetura de forma fundamental. As chaves de API ficam no cofre, fora do modelo. Quando um agente precisa fazer uma chamada de API autenticada, a plataforma injeta a credencial na fronteira da chamada, faz a chamada autenticada e devolve o resultado ao agente. O modelo só guarda um handle e nunca vê, armazena ou tem acesso de memória à chave crua.

Isso é **credenciais guardadas em cofre** — o mesmo princípio usado por sistemas corporativos de gestão de segredos como HashiCorp Vault, mas construído dentro da camada de [orquestração de agentes de IA](/learn/ai-agent-orchestration) em vez de exigir infraestrutura separada.

## Agentes de IA em Contêiner: Por Que Isolamento em Nível de Processo Não Basta

Vários frameworks oferecem alguma forma de isolamento, mas os detalhes de implementação importam:

| Framework | Abordagem de isolamento | O que é de fato isolado | O que é compartilhado |
|---|---|---|---|
| **OpenLegion** | Execução em sandbox por tarefa (sempre ativa) | Processo, filesystem, rede, memória, credenciais | Nada — agentes são totalmente isolados |
| **OpenClaw** | Contêiner Docker (opcional) | Processo, filesystem | Docker socket montado por padrão; rede do host acessível |
| **LangGraph** | Nenhum embutido | N/A | Tudo — agentes compartilham processo Python |
| **CrewAI** | Docker para CodeInterpreter | Saída de execução de código | Processos de agente compartilham runtime Python |
| **AutoGen** | Docker para execução de código | Saída de execução de código | Processos de agente compartilham runtime Python |

A distinção crítica: OpenLegion isola a **própria execução da tarefa**. Outros frameworks que oferecem isolamento Docker tipicamente isolam só a **saída da execução de código** — o processo do agente, sua memória e seu acesso a credenciais permanecem compartilhados. Isso significa que uma injeção de prompt que compromete um agente em LangGraph ou CrewAI tem acesso a todas as credenciais e estado no processo compartilhado. No OpenLegion, o mesmo comprometimento fica contido em uma única execução em sandbox sem acesso a credenciais.

## Controles de Custo de Agentes de IA: Imposição de Orçamento Como Segurança

Controles de custo não são só governança financeira — são um mecanismo de segurança. Um agente descontrolado consumindo tokens ilimitados é um ataque de abuso de recursos, seja disparado por injeção maliciosa de prompt ou por um bug simples no loop de raciocínio do agente.

A imposição de orçamento do OpenLegion funciona no nível do orquestrador:

- Cada agente tem seu próprio orçamento configurável, medido em créditos de US$ 0,001 cada
- O uso é rastreado em tempo real, e o custo exato de cada tarefa fica visível
- Quando um agente atinge seu limite, o orquestrador emite um corte rígido — o agente é encerrado
- O resto do pipeline de workflow continua ou pausa graciosamente
- Dados de custo são visíveis no dashboard com decomposições por agente

Nenhum outro framework grande de agentes de IA oferece essa capacidade embutida, com base na documentação pública no momento da escrita.

## Considerações de Conformidade e Auditoria

OpenLegion é **desenhado para ambientes que exigem** controles de conformidade, incluindo:

- **Tracing de requisição**: A coordenação auditável por metas e tarefas significa que cada passo do workflow é explícito e rastreável. Cada chamada de ferramenta, delegação e aprovação é registrada com a identidade do agente, um timestamp e o custo exato da tarefa. O registro compartilhado de metas e tarefas fornece contexto de coordenação entre agentes.
- **Coordenação auditável por metas e tarefas**: a coordenação por metas e tarefas (metas → tarefas → agentes) pode ser auditada antes da execução — você pode verificar o fluxo completo de dados, permissões e interações de agente sem rodar o sistema.
- **Isolamento de dados**: armazenamento por agente e concessões de permissão por agente garantem que dados sensíveis processados por um agente não são acessíveis a outros agentes.
- **Privilégio mínimo**: as ferramentas, arquivos e operações de cada agente são concedidos explicitamente pelo dono, e cada concessão é registrada como um recibo.

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

A abordagem mais segura são credenciais guardadas em cofre: armazene chaves de API num cofre que os agentes não podem acessar diretamente. Quando um agente precisa fazer uma chamada autenticada, a plataforma injeta a credencial fora do modelo. O agente nunca vê a chave crua. OpenLegion implementa isso com um cofre de credenciais que o modelo só consegue referenciar por handle. A abordagem menos segura (e mais comum) é variáveis de ambiente, onde as chaves existem na memória do agente e podem vazar por injeção de prompt, logging ou saída de erro.

### Como funciona o isolamento de agentes de IA?

Isolamento de agente significa rodar cada agente em seu próprio ambiente em sandbox — processo, filesystem, namespace de rede e espaço de memória separados. No OpenLegion, cada tarefa roda sob demanda e depois para, o código que o agente escreve roda em um sandbox sem acesso à rede por padrão e os agentes não compartilham armazenamento. Isso significa que um agente comprometido não pode acessar dados de outros agentes, o cofre de credenciais ou o sistema host. Isso difere de frameworks onde os agentes compartilham um processo Python e podem acessar a memória uns dos outros.

### Por que agentes de IA precisam de controles de orçamento / custo?

Agentes autônomos podem entrar em loops recursivos, fazer chamadas excessivas a APIs ou ser manipulados a consumir recursos muito além do necessário. Sem controles de orçamento, um único agente descontrolado pode drenar centenas de dólares em tokens em minutos. Em sistemas multiagente isso compõe — cada agente multiplica o risco. OpenLegion dá a cada agente seu próprio orçamento com corte rígido, medido em créditos de US$ 0,001 cada, impedindo que qualquer agente isolado cause custo ilimitado.

### Agentes de IA seguros são possíveis com chaves BYO?

O OpenLegion não usa um modelo BYO (Bring Your Own) de chaves para LLMs — os modelos são escolhidos por preset, Smartest, Smart ou Normal, por agente ou por workspace. As credenciais de serviço que você traz, como tokens OAuth e chaves de API de terceiros, ficam num cofre e são injetadas fora do modelo, que só guarda um handle. Você ainda tem transparência total de custo: cada unidade de trabalho é um despertar registrado e medido em créditos de US$ 0,001 cada, e o custo exato de cada tarefa fica visível.

### O que é o OWASP Top 10 para agentes de IA?

A OWASP publicou o Top 10 para Aplicações Agênticas em dezembro de 2025. O risco #1 é Sequestro de Objetivo do Agente — onde um atacante manipula um agente para perseguir objetivos diferentes do que o usuário pretendia. Outros riscos do topo incluem vazamento de credenciais, agência excessiva (agentes tomando ações além do seu escopo) e vulnerabilidades de cadeia de suprimentos (ferramentas ou plugins maliciosos). OpenLegion endereça isso por credenciais guardadas em cofre, execuções de tarefa em sandbox, matrizes de permissão e coordenação por metas e tarefas (metas → tarefas → agentes).

### Como o OpenLegion se compara ao OpenClaw em segurança?

Com base na documentação pública, OpenLegion oferece padrões de segurança mais rígidos. O deploy local padrão do OpenClaw exige montar o Docker socket (concedendo amplo acesso ao host), seu analisador de segurança teve problemas reportados de ativação consistente e armazena credenciais em configuração acessível ao processo do agente. OpenLegion roda cada tarefa em uma execução em sandbox, mantém as credenciais num cofre injetado fora do modelo, impõe orçamentos por agente e aplica sanitização Unicode em múltiplos pontos de estrangulamento. Para uma comparação detalhada, veja [OpenLegion vs OpenClaw](/comparison/openclaw).

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
