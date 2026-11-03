---
title: "Hospedagem Gerenciada de Agentes de IA: Implante Frotas Seguras"
description: >-
  Hospedagem gerenciada de agentes de IA da OpenLegion: rode times de agentes
  seguros numa aplicação web hospedada, com credenciais em cofre, orçamentos por
  agente e nenhum VPS dedicado.
slug: /learn/managed-ai-agent-hosting
primary_keyword: hospedagem gerenciada de agentes de IA
secondary_keywords:
  - host ai agents
  - managed ai agent platform
  - hosted ai agents
  - ai agent hosting service
  - dedicated vps for ai agents
  - ai agent infrastructure
  - cloud ai agent hosting
  - secure ai agent hosting
date_published: 2026-05
last_updated: 2026-05
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /comparison
---

# Hospedagem Gerenciada de Agentes de IA para Frotas de Agentes Seguras

Você queria uma força de trabalho de IA. O que ganhou foi um segundo emprego em DevOps. A hospedagem gerenciada de agentes de IA devolve esse emprego. Ela roda os servidores, o isolamento, o cofre de credenciais e os orçamentos de que seus agentes precisam, para que você não provisione nada disso. A OpenLegion é uma aplicação web hospedada: basta entrar com o Google e começar, sem nada para instalar e sem VPS dedicado para alugar, com suas chaves num cofre que os agentes nunca tocam e um orçamento em cada agente por padrão. Você traz um objetivo; nós rodamos o chão por baixo.

<!-- SCHEMA: DefinitionBlock -->

> **O que é hospedagem gerenciada de agentes de IA?**
> Hospedagem gerenciada de agentes de IA é um serviço que provisiona, isola, protege e opera a infraestrutura na qual os agentes de IA autônomos rodam (contêineres, armazenamento de credenciais, orçamentos, rede e um dashboard de controle), para que um time possa implantar frotas de agentes sem construir ou manter essa infraestrutura por conta própria.

## TL;DR

- A hospedagem gerenciada de agentes de IA remove o trabalho entre você e um time rodando: sem configuração de servidor, sem ajuste de Docker, sem cofre para operar.
- Os agentes são registros duráveis, não servidores: criar um é instantâneo, um agente ocioso não custa nada e um workspace pode rodar centenas.
- As credenciais ficam num cofre e são injetadas fora do modelo, que só guarda um handle, então um agente comprometido não consegue lê-las.
- Cada agente carrega seu próprio orçamento, e cada unidade de trabalho é um despertar registrado e medido em créditos de US$ 0,001 cada.
- O motor é publicado com código-fonte disponível sob a PolyForm Perimeter License 1.0.1; a plataforma hospedada é proprietária.
- O Free é $0 com 1,000 créditos únicos e sem cartão; o Pro custa $29/mês com 10.000 créditos; o Team custa $99/mês com 35.000.

## O Custo Oculto de "Apenas Rode um Agente"

Colocar um agente de pé é um fim de semana. Rodar uma frota em que você confia é um trimestre.

Em algum ponto entre o protótipo e a produção, o trabalho muda de forma silenciosamente. Você para de ajustar prompts e começa a ajustar contêineres. Para de pensar no que o agente deveria dizer e começa a pensar em onde ficam suas chaves de API, no que acontece quando um entra em loop às 3 da manhã e em como impedir que um agente comprometido alcance os outros nove. Nada disso é o trabalho que você se propôs a fazer. Tudo isso é o trabalho que determina se é seguro deixar os agentes rodando.

A hospedagem gerenciada existe para absorver exatamente essa camada. Com a oferta hospedada da OpenLegion você ganha:

- **Uma aplicação web hospedada** sem nada para instalar e sem VPS dedicado para alugar — basta entrar com o Google e começar.
- **Uma execução em sandbox para cada tarefa** — cada tarefa roda sob demanda e depois para, e o código que o agente escreve não tem acesso à rede por padrão.
- **Um cofre de credenciais** que mantém chaves de API e tokens OAuth inteiramente fora do modelo, que só guarda um handle.
- **Imposição de orçamento por agente** com cortes rígidos, para que um agente em loop não gere uma fatura surpresa.
- **Um dashboard de controle** para implantar templates, conversar com agentes, acompanhar custo e saúde ao vivo e pausar qualquer coisa que se comporte mal.
- **Créditos incluídos** em todo plano, renovados todo mês, com os modelos escolhidos por preset — Smartest, Smart ou Normal.

## Hospedagem Gerenciada vs Auto-Hospedagem: Como Escolher

A plataforma da OpenLegion é apenas hospedada, e o motor por baixo é publicado com código-fonte disponível. A comparação abaixo é o trade-off geral entre rodar a infraestrutura de agentes você mesmo e tê-la rodando para você.

| Consideração | Auto-hospedado (PolyForm Perimeter License 1.0.1) | Hospedagem gerenciada |
|---|---|---|
| Quem roda os servidores | Você | OpenLegion |
| Tempo de setup | Três comandos na sua máquina | Entrar com o Google, nada para instalar |
| Cofre de credenciais | Você o opera | Operado para você, fora do modelo |
| Atualizações e correções | Você puxa e reimplanta | Aplicadas para você |
| Residência de dados | Totalmente na sua infraestrutura | Na plataforma hospedada que operamos |
| Melhor para | Regulado, air-gapped, controle total | Times que querem um time rodando hoje |
| Modelo de custo | Seus próprios custos de servidor | Free $0, Pro $29/mês, Team $99/mês |

Escolha auto-hospedagem quando conformidade, residência de dados ou controle total sobre o host pesarem mais que o custo de operá-lo. Escolha hospedagem gerenciada quando você quer agentes trabalhando nesta tarde e prefere não ser dono de um cofre, de um runtime e de uma cadência de atualizações. A OpenLegion oferece apenas a plataforma hospedada no lançamento, então não existe plataforma auto-hospedada para a qual migrar.

## O Que Acontece Quando Você Clica em Deploy

Entre com o Google e seu workspace está pronto — não há nada para provisionar. Um assistente é criado junto, e ele cria os colegas de equipe necessários. A partir daí você descreve o time que quer (uma mesa de pesquisa, um pipeline de vendas, um estúdio de conteúdo) e a plataforma cria cada papel como um registro durável com sua própria memória, orçamento e permissões de ferramenta.

Os agentes coordenam pela [camada de orquestração](/learn/ai-agent-orchestration): o trabalho é organizado em metas, tarefas e agentes, com despertares por evento e delegação entre colegas de equipe. Cada ação é uma intenção verificada por um único motor de políticas antes de acontecer, o que mantém o comportamento auditável e os custos previsíveis. Você fala com os agentes no chat web em todos os planos, por Telegram e webhooks a partir do Pro, ou por Slack e e-mail de entrada no Team e acima.

## Segurança Que Você Não Precisa Construir

A parte mais difícil de hospedar agentes com segurança é a parte que os times mais costumam pular, porque ela é invisível até falhar. A camada gerenciada da OpenLegion impõe a mesma defesa em profundidade descrita no modelo de [segurança de agentes de IA](/learn/ai-agent-security), habilitada por padrão:

- Uma execução em sandbox para cada tarefa, sem processo de agente de longa duração para comprometer.
- Um cofre de credenciais que as injeta fora do modelo, então os agentes nunca seguram chaves cruas.
- Uma matriz de permissões por agente que governa quais ferramentas, arquivos e operações cada agente pode usar.
- Sanitização de entrada, proteção contra SSRF e endurecimento contra injeção de prompt em cada fronteira.
- Tetos de orçamento por agente que falham de forma fechada.

Você herda tudo isso ao se cadastrar, não ao ler um guia de endurecimento e implementá-lo por conta própria. Para o runtime por baixo, veja a visão geral da [plataforma de agentes de IA](/learn/ai-agent-platform).

## Preços e Pelo Que Você Paga

O Free é $0 com 1,000 créditos únicos e sem cartão; o Pro custa $29/mês com 10.000 créditos; o Team custa $99/mês com 35.000; o Enterprise começa em $1.500. O trabalho é medido em créditos de US$ 0,001 cada, e o custo exato de cada tarefa fica visível. Os créditos incluídos renovam todo mês; os pacotes de créditos comprados nunca expiram. A cobrança roda no Stripe, e uma página de garantia de reembolso define os termos. Compare os limites dos planos na [página de preços](/pricing).

## A Visão do OpenLegion

A maioria da "hospedagem de agentes de IA" no mercado é um processo compartilhado rodando os agentes de todo mundo, chaves jogadas na configuração, sem imposição de orçamento de verdade. Isso serve para uma demo e é perigoso em produção, porque os modos de falha que de fato te custam (uma credencial vazada, um loop de custo descontrolado, um agente comprometido alcançando outro inquilino) são exatamente os que a infraestrutura compartilhada piora. A hospedagem gerenciada só vale o pagamento se ela te comprar o isolamento e a segurança de credenciais que você teria, de outra forma, que construir à mão. Nossa posição é que essas garantias deveriam ser o padrão em vez de um nível para o qual você faz upgrade, de modo que todo plano ganha o mesmo isolamento, o mesmo cofre e o mesmo motor de políticas na frente de cada ação.

## CTA

**Implante um time de agentes seguro sem rodar a infraestrutura.**
[Começar Agora](https://app.openlegion.ai) | [Ver Preços](/pricing) | [Ler a Documentação](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é hospedagem gerenciada de agentes de IA?

Hospedagem gerenciada de agentes de IA é um serviço que provisiona e opera a infraestrutura de que os agentes de IA autônomos precisam (contêineres isolados, um cofre de credenciais, imposição de orçamento, rede e um dashboard de controle), para que um time possa implantar e rodar times de agentes sem construir ou manter essa infraestrutura. Com a OpenLegion você entra com o Google e começa — não há nada para instalar nem VPS dedicado para alugar.

### Como a hospedagem gerenciada é diferente de auto-hospedar o OpenLegion?

A OpenLegion é uma aplicação web hospedada, e não existe plataforma auto-hospedada no lançamento. Auto-hospedar, em geral, significa que você roda os servidores, opera o cofre e aplica as atualizações por conta própria, o que serve para ambientes regulados ou air-gapped. Hospedagem gerenciada significa que a OpenLegion roda a plataforma, opera o cofre e a corrige para você. O motor por baixo é publicado com código-fonte disponível sob a PolyForm Perimeter License 1.0.1; a plataforma hospedada é proprietária.

### É seguro hospedar agentes de IA que seguram minhas chaves de API e de carteira?

Sim, quando as chaves nunca ficam dentro do agente. Na OpenLegion, chaves de API e tokens OAuth ficam num cofre e são injetados fora do modelo, que só guarda um handle, então mesmo um agente totalmente comprometido não consegue ler ou exfiltrar o segredo. A OpenLegion não guarda chaves de carteira nem fundos de agentes.

### Quanto custa a hospedagem gerenciada de agentes de IA?

O Free é $0 com 1,000 créditos únicos e sem cartão; o Pro custa $29/mês com 10.000 créditos; o Team custa $99/mês com 35.000; o Enterprise começa em $1.500. A taxa cobre a plataforma hospedada, o cofre de credenciais, o dashboard e os créditos incluídos do plano — não há VPS dedicado para pagar. O trabalho é medido em créditos de US$ 0,001 cada, os créditos incluídos renovam todo mês e os pacotes comprados nunca expiram.

### Preciso saber Docker ou DevOps para usar hospedagem gerenciada?

Não. A OpenLegion é uma aplicação web hospedada: basta entrar com o Google e começar — não há nada para instalar. Você trabalha por um dashboard: descreva o time que quer e o assistente cria os colegas de equipe necessários. Docker, Python e administração de servidor não fazem parte disso.

### Posso migrar de hospedagem gerenciada para auto-hospedado depois?

Não no lançamento. A plataforma hospedada é a única forma de rodar a OpenLegion hoje, e ela é proprietária; o motor por baixo é publicado com código-fonte disponível sob a PolyForm Perimeter License 1.0.1. Ainda não há distribuição auto-hospedada para a qual migrar, então conte com a plataforma hospedada por enquanto.

### Quantos agentes posso hospedar em um plano gerenciado?

Os limites de agentes escalam com o nível do plano, de um time pequeno no plano de entrada até times grandes nos níveis mais altos, com limites customizados para empresas. Os agentes são registros duráveis em vez de servidores, então criar um é instantâneo e um agente ocioso não custa nada — cada agente conta como um no limite, então um time de três papéis como um Dev Team conta como três agentes.
