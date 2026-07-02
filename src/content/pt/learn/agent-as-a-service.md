---
title: "Agent as a Service: preços, isolamento de inquilinos e AaaS vs auto-hospedado"
description: "Agent as a Service (AaaS): agentes de IA em infraestrutura gerenciada com preços por consumo. Cobre AWS Bedrock Agents, OpenAI Operator, CVE-2024-5184 e TCO comparado."
slug: /learn/agent-as-a-service
primary_keyword: agent as a service
last_updated: "2026-07-02"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-deployment
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-multi-tenancy
  - /learn/credential-management-ai-agents
  - /learn/llm-cost-optimization
---

# Agent as a Service: modelos de preços, isolamento de inquilinos e framework de decisão AaaS

Agent as a Service (AaaS) é um modelo de entrega comercial no qual agentes de IA executam na infraestrutura gerenciada de um fornecedor, lidando com orquestração, execução de ferramentas, memória e gerenciamento de credenciais, cobrado por token, por ação ou por hora de agente em vez de exigir que os clientes implantem seu próprio ambiente de execução. O AaaS se consolidou como categoria de compra empresarial em 2026: o OpenAI Operator foi lançado em janeiro de 2025, o Google Agent Space atingiu disponibilidade geral e o AWS Bedrock Agents escalou para uso empresarial, elevando o volume de pesquisa de 90/mês em junho de 2025 para 260-390/mês no T1 2026, CPC $32,88.

<!-- SCHEMA: DefinitionBlock -->

> **Agent as a Service (AaaS)** é um modelo de entrega comercial no qual agentes de IA executam na infraestrutura gerenciada de um fornecedor, lidando com orquestração, execução de ferramentas, memória e gerenciamento de credenciais, e são cobrados do cliente com base no consumo (por token de entrada, por ação executada ou por hora de agente) sem exigir que o cliente implante e opere seu próprio ambiente de execução de agentes.

## O que significa Agent as a Service: as três promessas da plataforma

Cada plataforma AaaS faz três afirmações. Entender quais são bem cumpridas e quais são marketing ajuda os compradores a avaliar fornecedores antes de comprometer o orçamento de infraestrutura.

### Promessa 1: Infraestrutura gerenciada (sem ambiente de execução para operar)

O AaaS transfere toda a pilha de execução do agente para o fornecedor: motor de orquestação, ambiente de execução de ferramentas, backends de memória, pipeline de observabilidade, escalamento horizontal e SLA de tempo de atividade. O cliente define o agente -- prompt do sistema, ferramentas e configuração de memória -- e o invoca. O fornecedor o executa.

Este é o mesmo trade-off de qualquer serviço gerenciado: RDS vs. Postgres auto-gerenciado, Lambda vs. contêineres auto-gerenciados. Você abre mão da configurabilidade e potencialmente paga um prêmio, em troca de não assumir a carga operacional. A promessa de infraestrutura gerenciada é bem cumprida pelo AWS Bedrock Agents, Google Agent Space e pela maioria das plataformas AaaS maduras.

A promessa se desfaz quando o cliente precisa de uma configuração de ambiente de execução que a plataforma não expõe: ambientes de execução de ferramentas personalizados, backends de memória não padrão, versões de modelos específicas ou lógica de loop de agente que difere do modelo de orquestação fixo da plataforma.

Para detalhes da camada de infraestrutura, consulte [infraestrutura de implantação e opções de hospedagem para agentes de IA](/learn/ai-agent-deployment).

### Promessa 2: Preços por consumo (pagar por token, ação ou hora)

Os preços de AaaS em 2026 convergiram para três estruturas:

**Taxa de orquestração por token além do custo do modelo.** A plataforma cobra pela camada de orquestação separadamente do LLM subjacente. AWS Bedrock Agents: $0,000025 por token de entrada processado pela camada de orquestação, cobrado além da taxa LLM padrão. Para Claude 3.5 Sonnet no Bedrock ($3,00/M tokens de entrada), a taxa de orquestação adiciona $0,025/M tokens de entrada, menos de 1% de overhead. Para modelos mais baratos como Amazon Titan Text a $0,30/M, a taxa de orquestação representa um overhead de 8,33%.

**Taxa por ação para integrações de ferramentas.** Consultas do AWS Bedrock Knowledge Base: $0,0004/consulta. Um agente fazendo 50 pesquisas KB por sessão paga $0,02/sessão em taxas KB. A 100.000 consultas KB/dia: $40/dia apenas em taxas de ação.

**Níveis de assinatura por hora de agente.** Algumas plataformas oferecem níveis onde cada agente ativo conta contra as horas incluídas. Este modelo oferece previsibilidade de custo para frotas de agentes estáveis, mas pode ser ineficiente para cargas de trabalho irregulares.

Os preços por consumo alinham os incentivos do fornecedor com o uso do cliente, mas criam imprevisibilidade de custo para agentes de longa duração. Um loop de agente descontrolado gera cobranças tanto na camada de orquestação quanto na camada do modelo.

Para estratégias de redução de custos, consulte [otimização de custos de LLM e estratégias de orçamento de tokens para frotas de agentes](/learn/llm-cost-optimization).

### Promessa 3: Isolamento de credenciais (credenciais nunca no contexto do agente)

O isolamento de credenciais é o primitivo de segurança do AaaS que distingue uma plataforma gerenciada do código de agente sendo executado em uma VM de cloud com chaves API em variáveis de ambiente. As credenciais são injetadas do lado do servidor no momento da execução e nunca aparecem na janela de contexto do agente, em arquivos de log ou nos parâmetros de chamada de ferramenta.

CVE-2024-5184 (Palo Alto Unit 42, junho de 2024, CVSS 9,1 CRÍTICO) demonstrou que a injeção de prompt via resposta de ferramenta pode fazer com que um agente exfiltre sua própria janela de contexto. Se as chaves API estiverem na janela de contexto, elas são exfiltráveis por meio desse vetor.

A pergunta diagnóstica a fazer a cada fornecedor AaaS: **"Se a janela de contexto completa do meu agente for extraída por um invasor por meio de injeção de prompt, quais credenciais estão em risco?"** A resposta correta é: nenhuma.

- **AWS Bedrock Agents**: assunção de papel IAM por invocação; o agente executa sob um token de papel IAM temporário e nunca detém chaves de API brutas
- **OpenLegion**: resolução de handle `$CRED{}` na Zona 2; o código do agente referencia uma credencial por nome; a Zona 2 resolve o valor real no momento da execução sem devolvê-lo ao agente

Para o padrão de proxy de vault e a arquitetura de handle `$CRED{}`, consulte [gerenciamento de credenciais e escopo de chave API por inquilino para agentes de IA](/learn/credential-management-ai-agents).

## O cenário de fornecedores AaaS em 2026

### AWS Bedrock Agents: AaaS empresarial com isolamento IAM

O AWS Bedrock Agents é a plataforma AaaS empresarial dominante por alcance de mercado. Os agentes são definidos via console ou API do Bedrock, com grupos de ações e bases de conhecimento.

**Preços (2026):**
- Camada de orquestação: $0,000025/token de entrada
- Custo do modelo: tarifas Bedrock padrão (Claude 3.5 Sonnet: $3,00/M entrada, $15,00/M saída)
- Consultas Knowledge Base: $0,0004/consulta
- Code Interpreter: $0,000025/token de entrada

**Isolamento de credenciais:** Assunção de papel IAM por invocação. Cada Bedrock Agent tem um papel de execução IAM atribuído. O agente nunca detém credenciais brutas.

**Limitações:** Acoplamento forte com serviços AWS. Lógica de loop de agente personalizada não suportada. A taxa de orquestação por token se acumula rapidamente para agentes com contextos extensos.

### OpenAI Operator: AaaS de consumidor para tarefas de navegador

O OpenAI Operator, lançado em janeiro de 2025, é o primeiro produto AaaS de consumidor convencional. Ele executa tarefas web em uma sessão de navegador isolada em nome do usuário.

**Isolamento de credenciais:** Sessão de navegador isolada por tarefa. As credenciais não são mantidas entre tarefas.

**Limitações:** Apenas navegador, sem integrações de ferramentas personalizadas. Sem API de desenvolvedor para definições de agentes personalizadas.

### Google Agent Space: AaaS para empresas centradas no Workspace

O Google Agent Space (lançado em 2025, disponibilidade geral em 2026) é a plataforma AaaS empresarial do Google para organizações padronizadas no Google Workspace.

**Preços:** Via faturamento por consumo do Google Cloud, vinculado aos custos dos modelos do Vertex AI mais taxas de invocação do Cloud Run.

**Limitações:** Bloqueio no ecossistema do Google Cloud. Menos flexível para integrações multi-cloud. Opacidade de preços em múltiplas dimensões de faturamento.

Para uma comparação em nível de recursos de plataformas AaaS, consulte [recursos de plataformas de agentes de IA e comparação de frameworks](/learn/ai-agent-platform).

## Preços AaaS: entendendo o custo total

### A taxa da camada de orquestação

| **Modelo** | **Preço de entrada** | **Taxa de orquestação** | **Orquestação % do custo do modelo** |
|---|---|---|---|
| Claude 3.5 Sonnet | $3,00/M | $0,025/M | 0,83% |
| Claude 3 Haiku | $0,25/M | $0,025/M | 10% |
| Amazon Titan Text | $0,30/M | $0,025/M | 8,33% |

### Taxas por ação e o imposto sobre agentes de longa duração

- **AWS Bedrock KB a 100.000 consultas/dia**: $40/dia = $1.200/mês
- **OpenSearch auto-hospedado em t3.medium** a 100.000 consultas/dia: ~$0,16/dia = $5/mês

O ponto de cruzamento: as taxas de ação AaaS excedem o custo de infraestrutura auto-hospedada a aproximadamente **12.500 consultas/dia**.

### Custo de loop descontrolado no AaaS: cobrança dupla

Loops de agente descontrolados custam mais no AaaS do que em implantações auto-hospedadas porque o AaaS cobra tanto o custo do modelo quanto a taxa da camada de orquestação em cada iteração.

## Segurança AaaS: isolamento de credenciais e o teste CVE-2024-5184

### O teste CVE-2024-5184 para plataformas AaaS

CVE-2024-5184 (Palo Alto Unit 42, junho de 2024, CVSS 9,1 CRÍTICO): injeção de prompt via resposta de API de ferramenta.

**O teste CVE-2024-5184**: "Se a janela de contexto do meu agente for extraída por um invasor por meio de injeção de prompt, quais credenciais são acessíveis?"

**Aprovado** (credenciais não na janela de contexto):
- AWS Bedrock Agents
- OpenLegion

**Reprovado** (credenciais acessíveis):
- Qualquer plataforma onde o desenvolvedor colocou chaves API no prompt do sistema

### Isolamento de prompt multi-inquilino

**Isolamento em nível de infraestrutura (mais forte):**
- AWS Bedrock Agents: papéis IAM separados por inquilino
- Google Agent Space: isolamento via limites de projeto do Google Cloud
- OpenLegion: ACL de namespace de quadro-negro por projeto

**Isolamento em nível de prompt do sistema (mais fraco):** Falha quando a injeção de prompt sobrescreve a instrução do inquilino (OWASP LLM06:2023).

Para a arquitetura completa de escopo de credenciais por inquilino e ACLs de namespace, consulte [arquitetura multi-inquilino de agentes de IA e isolamento entre inquilinos](/learn/ai-agent-multi-tenancy).

### O modelo de responsabilidade compartilhada no AaaS

Erros comuns de clientes que criam lacunas de segurança:

1. Credenciais em prompts do sistema
2. Permissões de ferramentas muito amplas
3. Sem escopo de ferramenta por agente
4. Sem interrupção HITL para ações irreversíveis

## AaaS vs auto-hospedado: o framework de decisão

### Quando o AaaS vence

O AaaS é a melhor escolha quando:
- **Volume baixo a médio**: taxas de ação menores que os custos de infraestrutura auto-hospedada (ponto de cruzamento ~12.500 consultas/dia)
- **Rapidez para ir à produção**: o AaaS elimina semanas de configuração de infraestrutura
- **Herança de conformidade**: plataformas AaaS certificadas SOC 2 Tipo II

### Quando a auto-hospedagem vence

A infraestrutura auto-hospedada é a escolha certa quando:
- **O volume excede o ponto de cruzamento**: acima de 50.000 ações de agente/dia
- **Requisitos de ambiente de execução personalizados**: ambientes de execução de ferramentas não padrão
- **Requisitos de residência de dados**: setores regulamentados
- **O risco de bloqueio de fornecedor é inaceitável**

### Custo total de propriedade

Comparação de TCO para 100.000 ações/dia:

**AaaS (estilo AWS Bedrock):**
- Consultas KB: $1.200/mês
- Taxas de orquestação: ~$300/mês
- Total: ~$1.500/mês + custos de modelos

**Auto-hospedado:**
- Cluster Kubernetes: $800/mês
- Armazenamento vetorial: $200/mês
- Stack de observabilidade: $150/mês
- Engenharia: $2.400/mês
- Total: ~$3.550/mês + custos de modelos

## A perspectiva da OpenLegion: a segurança AaaS é uma questão de arquitetura de credenciais

Agent as a Service é a categoria de compra de IA empresarial de crescimento mais rápido em 2026, e também a categoria com a linha de base de segurança menos padronizada.

**Aplicação arquitetural**: as credenciais nunca entram no código do agente ou na janela de contexto. Esta propriedade não pode ser contornada por um erro do desenvolvedor.

**Isolamento baseado em convenções**: os desenvolvedores recebem instrução de não colocar credenciais em prompts do sistema. Quebra sob pressão de tempo, lacunas de revisão de código e falhas de integração de desenvolvedores.

Três números concretos:
- **CVE-2024-5184 (CVSS 9,1 CRÍTICO, junho de 2024)**
- **CPC $32,88** para "agent as a service" no T1-T2 2026
- **Crescimento 4x ano a ano** no volume de pesquisa de junho de 2025 ao início de 2026

| **Controle de segurança** | **OpenLegion** | **AWS Bedrock Agents** | **Google Agent Space** | **OpenAI Operator** | **LangGraph (auto-hospedado)** |
|---|---|---|---|---|---|
| **Vault de credenciais com resolução de handle $CRED{}** | Zona 2, arquitetural | Assunção de papel IAM | Escopo de conta de serviço | Isolamento de sessão | Responsabilidade do desenvolvedor |
| **Limite de gasto diário por agente (camada de infraestrutura)** | Zona 2, $0-$50/dia | Não disponível | Não disponível | Não disponível | Responsabilidade do desenvolvedor |
| **ACL de quadro-negro por projeto de inquilino** | Arquitetural | Baseado em IAM | Baseado em projeto | N/A | Responsabilidade do desenvolvedor |
| **Escopo de permissões de ferramentas por agente** | Aplicado pelo ambiente de execução | IAM do grupo de ações | Baseado em IAM | N/A | Responsabilidade do desenvolvedor |
| **Registro de auditoria WORM por inquilino (SOC 2 CC6.1)** | Nativo | CloudTrail | Cloud Audit Logs | N/A | Responsabilidade do desenvolvedor |
| **Definição de agente no git** | INSTRUCTIONS.md | Console/API | Console/API | N/A | Responsabilidade do desenvolvedor |

[Comece a construir no OpenLegion](https://app.openlegion.ai) -- implante agentes com isolamento arquitetural de credenciais, limites de gasto diário por agente aplicados na Zona 2 e ACLs de quadro-negro que tornam o acesso entre inquilinos arquiteturalmente impossível.

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que é Agent as a Service (AaaS)?

Agent as a Service (AaaS) é um modelo de entrega comercial no qual agentes de IA executam na infraestrutura gerenciada de um fornecedor, lidando com orquestração, execução de ferramentas, memória e gerenciamento de credenciais, cobrado do cliente com base no consumo. A categoria AaaS se consolidou em 2026 com o lançamento do OpenAI Operator (janeiro de 2025), a disponibilidade geral do Google Agent Space e o AWS Bedrock Agents atingindo escala empresarial. Cada plataforma AaaS faz três promessas: infraestrutura gerenciada, preços por consumo e isolamento de credenciais.

### Quanto custa o Agent as a Service?

Os preços de AaaS têm três camadas de custo: o custo do modelo LLM subjacente, uma taxa de camada de orquestação (AWS Bedrock Agents: $0,000025/token de entrada) e taxas por ação para integrações de ferramentas (AWS Bedrock Knowledge Base: $0,0004/consulta). A 100.000 ações de agente/dia, as taxas de plataforma AaaS tipicamente atingem $1.500-$3.600/mês antes dos custos do modelo.

### O que é o AWS Bedrock Agents e como é cobrado?

O AWS Bedrock Agents é a plataforma AaaS gerenciada da Amazon com orquestração de agentes, grupos de ações e bases de conhecimento em infraestrutura gerenciada da AWS com isolamento de credenciais baseado em papéis IAM. Preços (2026): $0,000025 por token de entrada para a camada de orquestação; as consultas de Knowledge Base custam $0,0004 por consulta.

### O que foi o OpenAI Operator e por que importa para o AaaS?

O OpenAI Operator, lançado em janeiro de 2025, é o primeiro produto AaaS de consumidor convencional: um agente de IA executando tarefas web em uma sessão de navegador isolada em nome do usuário, cobrado por conclusão de tarefa. A importância do Operator foi demonstrar que consumidores pagarão pela execução de tarefas de agente como serviço, correlacionando diretamente com o aumento de 4x ano a ano no volume de pesquisa de "agent as a service" no início de 2026.

### Como funciona o isolamento de credenciais em plataformas AaaS?

O isolamento de credenciais significa que a plataforma nunca expõe as chaves API de LLM, credenciais de banco de dados ou segredos de ferramentas do cliente ao código do agente. O AWS Bedrock Agents consegue isso por meio da assunção de papéis IAM. O OpenLegion usa a resolução de handle `$CRED{}` na Zona 2: o código do agente referencia uma credencial por nome; a Zona 2 resolve o valor real no momento da execução sem devolvê-lo ao agente.

### Quais riscos de segurança são específicos das plataformas AaaS?

O principal risco específico do AaaS é a superfície de ataque ampliada para injeção de prompt (CVE-2024-5184, CVSS 9,1 CRÍTICO): os agentes AaaS chamam APIs externas e processam conteúdo web externo em nome de inquilinos, e qualquer uma dessas respostas pode conter instruções elaboradas de forma adversarial. O segundo risco é o vazamento de prompt entre inquilinos com arquitetura de isolamento fraca. O terceiro risco é a lacuna de responsabilidade compartilhada.

### Quando devo usar AaaS vs infraestrutura auto-hospedada?

O AaaS é a melhor escolha para volume baixo a médio, rapidez para ir à produção ou herança de conformidade. A auto-hospedagem vence em escala (acima de 50.000 ações/dia), para requisitos de ambiente de execução personalizados, regulações de residência de dados ou quando o risco de bloqueio de fornecedor é inaceitável. O cálculo de TCO deve sempre incluir o tempo de engenharia para operar a infraestrutura auto-hospedada.

### O que é isolamento de prompt multi-inquilino no AaaS?

O isolamento de prompt multi-inquilino significa que o prompt do sistema, o histórico de conversação, os resultados de ferramentas e o estado de memória do inquilino A nunca aparecem no contexto do agente do inquilino B. Os mecanismos de isolamento mais fortes são em nível de infraestrutura. O padrão mais fraco é o isolamento em nível de prompt do sistema, que falha quando a injeção de prompt sobrescreve a instrução do inquilino (OWASP LLM06:2023).
