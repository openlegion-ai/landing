---
title: OpenLegion vs nanobot — Comparação Detalhada (2026)
description: >-
 OpenLegion vs nanobot: framework security-first vs alternativa ultraleve ao
 OpenClaw. Tratamento de credenciais, isolamento e prontidão para produção
 comparados.
slug: /comparison/nanobot
primary_keyword: openlegion vs nanobot
secondary_keywords:
 - nanobot alternative
 - nanobot security
 - nanobot vulnerability
 - lightweight ai agent framework
 - openclaw alternative python
date_published: 2026-03
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /comparison/nanoclaw
 - /comparison/picoclaw
 - /comparison/zeroclaw
 - /comparison/openclaw
---

# OpenLegion vs nanobot: O Que uma Vulnerabilidade CVSS 10.0 Ensina Sobre Segurança de Agente

nanobot é provavelmente o estudo de caso mais instrutivo no espaço de segurança de agentes de IA. Criado por um laboratório de pesquisa acadêmico no início de 2026, ele destila as 430.000+ linhas do OpenClaw para aproximadamente 4.000 linhas de Python — uma redução de 99% de código que rendeu 218 pontos no Hacker News (a recepção mais forte de qualquer alternativa Claw) e cerca de 20.000-26.000 estrelas no GitHub.

Depois, em semanas após o lançamento, pesquisadores de segurança divulgaram uma **vulnerabilidade crítica (CVSS 10.0)**: o bridge WhatsApp do nanobot vinculou seu servidor WebSocket a 0.0.0.0:3001 sem nenhuma autenticação. Qualquer um na rede podia sequestrar sessões do WhatsApp. Vulnerabilidades críticas adicionais vieram em seguida — injeção de comando de shell, bypass de path traversal e uma falha de execução remota de código herdada de uma dependência LiteLLM.

nanobot é uma ferramenta de ensino bem-intencionada que acidentalmente virou um estudo de caso de por que código leve por si só não é igual a código seguro. OpenLegion existe para tornar essa lição estrutural.

OpenLegion é um [framework de agentes de IA](/learn/ai-agent-platform) security-first com uma execução em sandbox para cada tarefa, credenciais guardadas em cofre, imposição de orçamento por agente e coordenação por metas e tarefas (metas → tarefas → agentes).

<!-- SCHEMA: DefinitionBlock -->

> **Qual a diferença entre OpenLegion e nanobot?**
> nanobot é uma reimplementação em Python de ~4.000 linhas do OpenClaw focada em simplicidade educacional e legibilidade. Suporta 11+ provedores de LLM e 8+ canais de mensageria, mas sofreu uma vulnerabilidade crítica no bridge WhatsApp (CVSS 10.0, sequestro de sessão WhatsApp não autenticado), injeção de shell, path traversal e vulnerabilidades de RCE do LiteLLM. OpenLegion é uma plataforma hospedada security-first com uma execução em sandbox para cada tarefa, credenciais guardadas em cofre onde os agentes nunca veem chaves de API, imposição de orçamento por agente e coordenação por metas e tarefas (metas → tarefas → agentes). nanobot otimiza para aprendizado e simplicidade; OpenLegion otimiza para segurança em produção.

## TL;DR

| Dimensão | OpenLegion | nanobot |
|---|---|---|
| **Foco primário** | Infraestrutura de segurança em produção | Simplicidade educacional |
| **Linguagem** | Hospedado — nada para instalar | Python (~4.000 linhas) |
| **Isolamento de agente** | Execução em sandbox por tarefa, sem rede por padrão | Flag `restrict_to_workspace` (nível de aplicação) |
| **Segurança de credenciais** | Cofre de credenciais — agentes nunca veem chaves | Arquivo de config (`~/.nanobot/config.json`) |
| **Controles de orçamento** | Orçamento de créditos por agente, corte rígido | Nenhum embutido |
| **Orquestração** | Coordenação por metas e tarefas (metas → tarefas → agentes) | Agente único com sub-agentes em background |
| **Provedores de LLM** | Presets Smartest, Smart e Normal | 11+ (OpenRouter, Anthropic, OpenAI, DeepSeek, etc.) |
| **Canais de mensageria** | Web, Telegram, Slack, e-mail, webhooks | 8+ (Telegram, Discord, WhatsApp, Feishu, DingTalk, etc.) |
| **Multiagente** | Times de agentes com permissões por agente | Spawning de sub-agente (sem orquestração de frota) |
| **Memória** | Persistente por agente com busca vetorial | Recuperação baseada em grep (evita RAG deliberadamente) |
| **Estrelas no GitHub** | n/d (plataforma hospedada) | ~20.000-26.000 |
| **Licença** | PolyForm Perimeter License 1.0.1 | MIT |
| **CVEs conhecidos** | Hospedado, corrigido centralmente | **vulnerabilidade crítica no bridge WhatsApp (CVSS 10.0)** + 3 patches críticos adicionais |
| **Origem** | Independente | Laboratório de pesquisa acadêmico |

## Escolha nanobot se...

**Você quer aprender como agentes de IA funcionam.** nanobot é um esqueleto de ensino. Com 4.000 linhas e estrutura clara, é a melhor base de código para entender o loop central de agente: abstração de provedor, despacho de ferramenta, recuperação de memória e gateways de chat. A DataCamp publicou um tutorial completo. Os criadores o desenharam explicitamente para legibilidade educacional.

**Você precisa de suporte a plataformas asiáticas de mensageria.** nanobot tem suporte first-class para Feishu (Lark), DingTalk, QQ e plataformas adjacentes ao WeChat — canais que nenhum framework focado no Ocidente cobre bem. Se seu deploy mira mensageria corporativa chinesa, o ecossistema do nanobot é posicionado de forma única.

**Você quer rodar agentes em um Raspberry Pi.** nanobot é leve o suficiente para computadores single-board. Combinado com Ollama para inferência local, você ganha operação de agente totalmente offline.

**Você valoriza simplicidade sobre infraestrutura.** Config JSON, memória baseada em grep (sem banco vetorial exigido) e pip install. Sem Docker, sem coordenação por metas e tarefas, sem setup de cofre. Do install ao agente rodando em menos de cinco minutos.

**O momentum da comunidade te importa.** O lançamento do nanobot com 218 pontos no HN, Discord ativo, integração com DataCamp e ~20.000+ estrelas representam investimento significativo da comunidade e um grande pool de contribuidores corrigindo issues rapidamente (o CVSS 10.0 foi corrigido em dias).

## Escolha OpenLegion se...

**Segurança deve ser arquitetural, não opcional.** A flag `restrict_to_workspace` do nanobot é o principal mecanismo de isolamento — um boolean que pode ser desligado. As chaves de API ficam num arquivo JSON de config em texto puro. O servidor WebSocket saiu sem autenticação. Esses não são casos de borda obscuros; são decisões arquiteturais fundamentais que produziram um CVSS 10.0 em semanas. OpenLegion torna configurações inseguras estruturalmente impossíveis: cada tarefa roda em sandbox, o cofre é o único caminho de credencial e cada ação é uma intenção verificada por um único motor de políticas antes de acontecer.

**Você não pode bancar um CVSS 10.0 em produção.** A vulnerabilidade crítica do bridge WhatsApp permitiu que atacantes não autenticados em rede adjacente sequestrassem sessões WhatsApp se conectando ao servidor WebSocket desprotegido do nanobot na porta 3001. As vulnerabilidades adicionais de shell injection e path traversal foram encontradas por um único pesquisador de segurança em uma única auditoria. As credenciais guardadas em cofre do OpenLegion significam que não há credenciais para sequestrar — as chaves são injetadas fora do modelo, que só guarda um handle.

**Você precisa de controle de custo por agente.** nanobot não tem imposição de orçamento. Com suporte a 11+ provedores e a habilidade de spawnar sub-agentes em background, gasto descontrolado de API acumula silenciosamente. OpenLegion dá a cada agente seu próprio orçamento de créditos, com corte rígido automático.

**Você precisa de coordenação multiagente auditável.** nanobot suporta spawn de sub-agentes, mas a orquestração é LLM-driven e não determinística. A coordenação por metas e tarefas do OpenLegion define registros explícitos de delegação, acesso a ferramenta e dependências por agente — auditável antes do deploy.

**Você precisa de provar postura de segurança a stakeholders.** O histórico de CVE do nanobot torna difícil vendê-lo a times de segurança, revisores de conformidade ou procurement enterprise. O cofre de credenciais, as execuções de tarefa em sandbox e as permissões por agente do OpenLegion oferecem controles de segurança demonstráveis.

## Comparação do Modelo de Segurança

### Onde os segredos vivem

**nanobot** armazena chaves de API em `~/.nanobot/config.json` — um arquivo JSON em texto puro no disco. O arquivo de config foi inicialmente escrito com permissões 0644 (world-readable); isso foi depois corrigido para 0600. Em tempo de execução, as chaves são carregadas na memória do processo Python. Qualquer código executando dentro do processo do agente pode lê-las.

**OpenLegion** armazena credenciais em um cofre que os agentes não podem acessar. As credenciais são injetadas fora do modelo, que só guarda um handle. Sem arquivos de config com chaves em texto puro, sem variáveis de ambiente com segredos, sem arquivos de credencial montados. O processo do agente nunca segura chaves de API.

### Modelo de isolamento

**nanobot** usa uma flag `restrict_to_workspace` que limita operações de arquivo ao diretório do workspace. Essa é uma checagem em nível de aplicação no código Python — se um agente alcança execução de código arbitrário (que a vulnerabilidade de shell injection demonstrou ser possível), a restrição de workspace pode ser contornada. Nenhum isolamento em nível de SO é imposto.

**OpenLegion** isola cada tarefa em vez de cada processo. Cada tarefa roda sob demanda em um sandbox sem acesso à rede por padrão e depois para, então não existe processo de agente de longa duração para comprometer. Mesmo se um agente alcança execução de código arbitrário dentro de uma execução, ele não pode acessar outros agentes, o sistema host ou armazenamentos de credenciais.

### O histórico de CVE

**nanobot** acumulou problemas significativos de segurança na sua breve existência:

- **vulnerabilidade crítica no bridge WhatsApp (CVSS 10.0):** Bridge WebSocket WhatsApp vinculado a 0.0.0.0:3001 sem autenticação. Atacantes em rede adjacente podiam sequestrar sessões. Descoberto por pesquisadores de segurança.
- **Injeção de comando de shell (Médio):** Entrada de usuário sem sanitização passada para execução de shell.
- **Bypass de path traversal (Médio):** `restrict_to_workspace` podia ser contornado.
- **RCE no LiteLLM via `eval()` (Crítico):** Herdado de dependência. Execução remota de código por entrada manipulada.
- **Envenenamento de sessão (corrigido em 26 de fev de 2026):** Manipulação de histórico de mensagens.

**OpenLegion** é uma plataforma hospedada, corrigida centralmente e não por seus usuários. Sua arquitetura torna várias classes de vulnerabilidade do nanobot estruturalmente impossíveis: credenciais em cofre eliminam exposição de credencial, execuções em sandbox evitam escapes de path traversal e as concessões de ferramenta por agente evitam execução arbitrária de shell.

### Controles de orçamento

**nanobot** não tem limites de gasto embutidos. Sub-agentes em background podem fazer chamadas de API sem tetos.

**OpenLegion** dá a cada agente seu próprio orçamento de créditos, com corte rígido automático.

## O Ecossistema do nanobot: O Que Ele Faz Melhor

### O esqueleto de ensino

A maior contribuição do nanobot é educacional. O loop central do agente — receber mensagem, recuperar contexto, chamar LLM, despachar ferramentas, retornar resposta — é exposto em Python limpo e legível. A escolha deliberada de usar recuperação de memória baseada em grep em vez de RAG torna o mecanismo de recuperação transparente. O config JSON é legível por humano. Cada decisão arquitetural prioriza compreensão sobre sofisticação.

Para estudantes, pesquisadores e desenvolvedores aprendendo como agentes de IA funcionam internamente, nanobot é arguably o melhor ponto de partida.

### Integração com plataformas asiáticas

O suporte a canais do nanobot inclui Feishu (Lark), DingTalk, QQ e Matrix — plataformas que dominam a comunicação corporativa chinesa. Nenhum outro framework no ecossistema OpenClaw oferece cobertura comparável. A origem acadêmica do projeto provavelmente explica esse foco, e representa valor genuíno para times operando em mercados asiáticos.

### Compatibilidade com skills do ClawHub

nanobot integra com o ecossistema de skills do ClawHub, dando acesso a skills de agente contribuídas pela comunidade. O formato de documentação SKILL.md é compartilhado entre nanobot, PicoClaw e outros projetos da família Claw.

### A cultura de resposta rápida

Quando a vulnerabilidade crítica do bridge WhatsApp foi divulgada, o time nanobot a corrigiu em dias. A correção de envenenamento de sessão saiu em 26 de fevereiro. Shell injection e path traversal foram endereçados rapidamente. A responsividade da comunidade é genuinamente impressionante — mas também destaca que essas issues não deveriam ter saído em primeiro lugar.

### Armadilhas comuns em produção

**O problema fundamental é arquitetural.** nanobot foi desenhado como ferramenta de ensino que virou popular em produção. Seu modelo de segurança — restrição de workspace em nível de aplicação, config em texto puro, sem isolamento de rede — é apropriado para experimentação local, mas perigoso em produção. O CVSS 10.0 não foi um bug em código complexo; foi um servidor WebSocket sem autenticação. É o tipo de descuido que restrições arquiteturais de segurança evitam.

**Risco da cadeia de dependências.** O RCE do LiteLLM (via `eval()`) demonstra que mesmo bases de código mínimas herdam vulnerabilidades de suas dependências. As ~4.000 linhas do nanobot são auditáveis, mas a árvore completa de dependências não é.

**Sem modelo de segurança de rede.** nanobot não tem conceito de network policies, controles de ingress ou isolamento por service mesh. Os agentes podem fazer conexões de saída arbitrárias. Combinado com acesso a shell, isso cria uma superfície de ataque ampla.

### O que o OpenLegion cobre de forma diferente

A arquitetura do OpenLegion evita as classes de vulnerabilidade do nanobot por design:

- **vulnerabilidade crítica no bridge WhatsApp (serviço de rede não autenticado):** Agentes OpenLegion nunca escutam em uma porta; cada tarefa roda sob demanda e para. O alcance de saída é explicitamente concedido por agente.
- **Shell injection:** O OpenLegion exige concessões explícitas de ferramenta, e o código que o agente escreve roda em um sandbox sem acesso à rede por padrão.
- **Path traversal:** cada tarefa roda em um sandbox descartável sem acesso ao host, o que elimina path traversal como vetor de ataque significativo.
- **Exposição de credenciais:** credenciais guardadas em cofre significam que não existem credenciais no ambiente do agente para roubar.
- **RCE de dependência:** o isolamento da execução limita o raio de impacto — mesmo se uma dependência tem um RCE, o atacante fica contido dentro de uma execução em sandbox sem credenciais.

## Trade-offs de Hospedagem vs Auto-Hospedagem

**nanobot** é desenhado para auto-hospedagem local. pip install, config JSON e um agente rodando em minutos. Sem serviço hospedado. A natureza leve significa que qualquer sistema Linux, macOS ou até um Raspberry Pi pode hospedá-lo.

**OpenLegion** não é algo que você instala. A plataforma hospedada já está no ar e não exige nada disso: basta entrar com o Google, começar grátis com 1,000 créditos e sem cartão, ou assinar o Pro por $29/mês. As execuções em sandbox não acrescentam setup nenhum do seu lado, mas oferecem a camada de isolamento que torna o deploy em produção seguro.

## Para Quem É

**nanobot** é para estudantes, pesquisadores e desenvolvedores individuais que querem entender a arquitetura de agentes de IA por uma base de código limpa e legível. Também valioso para times mirando plataformas asiáticas de mensageria (Feishu, DingTalk, QQ). O usuário ideal roda nanobot localmente para tarefas pessoais e não o expõe a redes não confiáveis.

**OpenLegion** é para times de engenharia implantando agentes em ambientes onde incidentes de segurança têm consequências de negócio. O usuário ideal precisa demonstrar isolamento de credenciais, controle de custo e trilhas de auditoria a stakeholders — e não pode arriscar um CVSS 10.0 em produção.

## O Trade-off Honesto

nanobot prova que você pode reconstruir um runtime de agentes de IA em 4.000 linhas. Essa realização é real e valiosa para o ecossistema. Mas a vulnerabilidade crítica do bridge WhatsApp prova que simplicidade e segurança não são a mesma coisa. Uma base de código de 4.000 linhas com um CVSS 10.0 é menos segura que uma base de ~77.000 linhas com restrições arquiteturais que tornam essa classe de vulnerabilidade impossível.

Se você quer aprender como agentes funcionam, leia o código-fonte do nanobot. Se quer implantar agentes com segurança, use um framework onde configurações inseguras não podem ocorrer.

Para o cenário completo, veja nossa [comparação de frameworks de agentes de IA](/learn/ai-agent-frameworks).

## CTA

**Implante agentes com segurança que é arquitetural, não aspiracional.**
[Começar Agora](https://app.openlegion.ai) | [Ler a Documentação](https://docs.openlegion.ai) | [Ver Todas as Comparações](/comparison)

---

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é o nanobot?

nanobot é uma reimplementação em Python de ~4.000 linhas do OpenClaw criada por um laboratório de pesquisa acadêmico. Suporta 11+ provedores de LLM e 8+ canais de mensageria (incluindo plataformas asiáticas como Feishu, DingTalk e QQ). Lançou em 2 de fevereiro de 2026 e tem aproximadamente 20.000-26.000 estrelas no GitHub. Recebeu a recepção mais forte no Hacker News de qualquer alternativa OpenClaw (218 pontos, 111 comentários).

### OpenLegion vs nanobot: qual a diferença?

nanobot é um esqueleto de ensino educacional — mínimo, legível e desenhado para aprendizado. OpenLegion é um framework de segurança em produção. nanobot usa restrição de workspace em nível de aplicação e config JSON em texto puro; OpenLegion usa execuções de tarefa em sandbox e credenciais guardadas em cofre. nanobot sofreu uma vulnerabilidade crítica no bridge WhatsApp (CVSS 10.0) mais três vulnerabilidades críticas adicionais; OpenLegion é uma plataforma hospedada com uma arquitetura que torna essas classes de vulnerabilidade estruturalmente impossíveis.

### OpenLegion é uma alternativa ao nanobot?

Sim. Os dois rodam agentes de IA, mas atendem propósitos diferentes. nanobot é melhor para aprendizado e experimentação local. OpenLegion é uma alternativa para times que precisam de segurança grau de produção — credenciais isoladas em cofre, imposição de orçamento por agente, uma execução em sandbox para cada tarefa e coordenação por metas e tarefas (metas → tarefas → agentes).

### Como o tratamento de credenciais se compara entre OpenLegion e nanobot?

nanobot armazena chaves de API em `~/.nanobot/config.json` (inicialmente world-readable até ser corrigido). As chaves são carregadas na memória do processo Python em tempo de execução. OpenLegion usa um cofre de credenciais — as credenciais são injetadas fora do modelo, que só guarda um handle. Os agentes nunca seguram, leem nem têm acesso a chaves de API em forma alguma.

### Qual é melhor para agentes de IA em produção?

OpenLegion é significativamente mais adequado para produção. nanobot foi desenhado como ferramenta de ensino e acumulou uma vulnerabilidade crítica no bridge WhatsApp (CVSS 10.0), shell injection, path traversal e vulnerabilidades de RCE em dependência em semanas após o lançamento. As execuções de tarefa em sandbox, as credenciais guardadas em cofre, os orçamentos por agente e a coordenação auditável por metas e tarefas do OpenLegion endereçam as classes exatas de vulnerabilidade que afetaram o nanobot.

### nanobot é o mesmo que nanobot (Obot AI)?

Não. Existem dois projetos completamente diferentes compartilhando o nome. O nanobot discutido nesta página é uma alternativa Python OpenClaw de ~4.000 linhas de um laboratório de pesquisa acadêmico. O nanobot da Obot AI é uma plataforma de agente MCP baseada em Go, apoiada por US$ 35M em rodada seed do time Rancher Labs. Esta página compara OpenLegion com a versão alternativa Python OpenClaw.

### O que foi a vulnerabilidade crítica do bridge WhatsApp do nanobot?

O bridge WhatsApp do nanobot continha uma vulnerabilidade crítica (CVSS 10.0) onde o servidor WebSocket vinculou a 0.0.0.0:3001 sem nenhuma autenticação. Qualquer atacante em rede adjacente podia conectar e sequestrar sessões WhatsApp ativas. Foi corrigida rapidamente, mas demonstra o risco de implantar frameworks de agente sem isolamento arquitetural de rede.

### Posso migrar do nanobot para o OpenLegion?

A config JSON e o setup de agente do nanobot seriam reestruturados como metas, tarefas e agentes, com concessões explícitas de ferramenta, limites de orçamento e permissões por agente. Configurações de provedor não transferem: o OpenLegion escolhe modelos por preset — Smartest, Smart ou Normal. Veja nossa página de [orquestração de agentes de IA](/learn/ai-agent-orchestration).

---

## Comparações Relacionadas

| Texto Âncora | Destino |
|---|---|
| OpenLegion vs NanoClaw | /comparison/nanoclaw |
| OpenLegion vs PicoClaw | /comparison/picoclaw |
| OpenLegion vs ZeroClaw | /comparison/zeroclaw |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Comparação de frameworks de agentes de IA 2026 | /learn/ai-agent-frameworks |
| Análise de segurança de agentes de IA | /learn/ai-agent-security |
