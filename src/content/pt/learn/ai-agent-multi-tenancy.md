---
title: "Multi-Tenancy de Agentes de IA: Isolamento de Credenciais e Controles SOC 2"
description: "Previna vazamentos de dados entre inquilinos em sistemas de agentes de IA multi-inquilino. Cobre OWASP LLM06, escopo de credenciais por inquilino, namespaces do Kubernetes e controles SOC 2 CC6.1/CC6.6."
slug: /learn/ai-agent-multi-tenancy
primary_keyword: multi-tenancy agentes ia
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-governance
  - /learn/ai-agent-sandboxing
  - /learn/ai-agent-audit-log
  - /learn/ai-agent-platform
---

# Multi-Tenancy de Agentes de IA: Isolamento de Credenciais, Separação de Namespaces e SOC 2

A multi-tenancy de agentes de IA é a propriedade arquitetural de uma plataforma de agentes que isola as credenciais, a memória, o contexto de execução e os registros de auditoria de cada inquilino de todos os outros inquilinos, aplicada na camada de infraestrutura, não por convenção do desenvolvedor ou pelo seguimento de instruções do agente. Ao contrário da multi-tenancy de aplicações web, os agentes mantêm chaves de API ativas, acumulam memória persistente entre solicitações e executam chamadas de ferramentas autenticadas: três dimensões além do isolamento de linhas de dados que devem ser particionadas por inquilino para satisfazer OWASP LLM06 e SOC 2 CC6.1.

<!-- SCHEMA: DefinitionBlock -->

> **A multi-tenancy de agentes de IA** é a propriedade arquitetural de uma plataforma de agentes que garante que os agentes que servem diferentes inquilinos não possam acessar as credenciais, a memória, o contexto de execução ou os registros de auditoria uns dos outros, aplicada na camada de infraestrutura por meio de escopos de vault de credenciais por inquilino, ACLs de namespace de quadro negro, isolamento de execução em contêineres e logs de auditoria particionados, de modo que um produto SaaS B2B construído sobre a plataforma herda o isolamento de inquilinos como garantia estrutural em vez de responsabilidade do desenvolvedor.

## Por que a Multi-Tenancy de Agentes é Mais Difícil que a de Aplicações Web

A multi-tenancy tradicional de aplicações web isola uma coisa: as linhas de dados. A multi-tenancy de agentes deve isolar três dimensões adicionais que as aplicações web nunca precisaram abordar. Falhar em qualquer uma delas constitui um evento de vazamento de dados entre inquilinos sob OWASP LLM06 Sensitive Information Disclosure.

### As Três Dimensões de Isolamento que as Aplicações Web Não Tinham

**Isolamento de credenciais**: aplicações web identificam o usuário via token de sessão; a sessão não tem acesso persistente a serviços externos. Agentes precisam de chaves de API reais com escopo para o inquilino. Se o agente do InquilinoA e o agente do InquilinoB compartilham uma chave OpenAI, o uso intensivo do InquilinoA degrada a margem de limite de taxa do InquilinoB; a faturamento do InquilinoA com o provedor inclui o consumo de tokens do InquilinoB; revogar a chave após um comprometimento do InquilinoA também interrompe o InquilinoB.

**Isolamento de memória**: os agentes acumulam memória de trabalho (janela de contexto em curso), memória semântica (embeddings de armazenamento vetorial) e estado de coordenação (entradas de quadro negro) entre interações. Se algum desses armazenamentos de memória não estiver particionado por inquilino, os documentos do InquilinoA recuperados no contexto do agente durante uma tarefa podem aparecer no contexto do agente do InquilinoB durante uma tarefa semanticamente similar, sem requerer nenhuma entrada adversarial. Este é o cenário canônico de vazamento entre inquilinos do OWASP LLM06 v1.1.

**Isolamento do log de auditoria**: um log de auditoria compartilhado onde as chamadas de ferramentas do InquilinoA e do InquilinoB estão misturadas não pode ser exportado para a equipe de conformidade do InquilinoA sem expor os registros do InquilinoB. SOC 2 CC6.1 requer que o auditor de cada inquilino possa ver apenas seus próprios registros, o que requer particionamento na camada de armazenamento, não apenas filtragem em tempo de consulta.

### Shared-Nothing vs Pool vs Bridge: Três Modelos de Multi-Tenancy

**Modelo Silo (shared-nothing)**: cada inquilino obtém infraestrutura completamente dedicada. Isolamento máximo ao maior custo por inquilino. Correto para inquilinos empresariais com requisitos estritos de residência de dados e indústrias reguladas.

**Modelo Pool**: todos os inquilinos compartilham a infraestrutura com isolamento aplicado apenas na camada de aplicação por meio de filtragem de parâmetros `tenant_id`. Custo mais baixo, isolamento mais fraco. Apropriado apenas para cargas de trabalho de baixa sensibilidade sem clientes empresariais.

**Modelo Bridge**: infraestrutura de computação compartilhada com isolamento aplicado no plano de controle. Cada inquilino obtém um escopo de vault de credenciais dedicado e namespace de memória aplicados por ACLs de infraestrutura; a computação é compartilhada mas governada pelo Kubernetes namespace ResourceQuota. Este é o padrão recomendado para SaaS B2B. A arquitetura baseada em projetos do OpenLegion é uma implementação do modelo Bridge.

## OWASP LLM06: Divulgação de Informações Sensíveis Entre Inquilinos

OWASP LLM Top 10 v1.1 classifica o vazamento de dados entre inquilinos sob LLM06: Sensitive Information Disclosure como de alta severidade.

### O Vetor de Ataque de Vazamento Entre Inquilinos

1. O agente do InquilinoA processa uma solicitação de suporte ao cliente. Ele recupera a documentação interna do produto e os registros de clientes do InquilinoA em sua janela de contexto, depois incorpora e armazena passagens relevantes no armazenamento vetorial compartilhado.
2. O agente do InquilinoB processa uma solicitação semanticamente similar. Ele consulta o armazenamento vetorial compartilhado; a consulta retorna as passagens incorporadas do InquilinoA como os K vizinhos mais próximos porque são tematicamente similares e não há índice particionado por inquilino.
3. Os registros internos de clientes do InquilinoA aparecem no contexto do agente do InquilinoB.

Nenhuma entrada adversarial é necessária. O vazamento é uma falha arquitetural.

Para o framework completo incluindo injeção de prompt (LLM01) ver [segurança de agentes de IA e o modelo de ameaças OWASP LLM Top 10](/learn/ai-agent-security).

### Vazamento de Memória: Memória de Trabalho, Armazenamentos Vetoriais e Estado do Quadro Negro

Três tipos de memória de agente requerem cada um tratamento de isolamento de inquilino separado:

**Memória de trabalho (janela de contexto em curso)**: a janela de contexto atual do agente nunca deve ser compartilhada entre solicitações de inquilinos.

**Memória semântica (armazenamento vetorial)**: se usar um armazenamento vetorial compartilhado, cada escrita deve incluir `tenant_id` como campo de metadados obrigatório, e cada consulta deve incluir um filtro de metadados `{tenant_id: current_tenant_id}` injetado na camada do cliente de armazenamento.

**Estado de coordenação (quadro negro)**: o estado chave-valor compartilhado entre agentes deve usar prefixos de chave com escopo de inquilino, por exemplo `projects/{tenant_id}/*`, com aplicação de ACL na camada mesh.

## Isolamento de Credenciais: Escopo do Vault por Inquilino

### Escopo de Credenciais por Inquilino: Por que Chaves de API Compartilhadas Falham

O erro de credenciais de multi-tenancy mais comum é usar uma chave de API LLM para todos os inquilinos. Isso falha de quatro formas distintas: compartilhamento de limite de taxa, custo não atribuível, raio de revogação e isolamento de auditoria quebrado.

Padrão correto: cada inquilino obtém sua própria chave de API. Para a arquitetura completa do vault ver [gerenciamento de credenciais e padrões de escopo de vault por inquilino](/learn/credential-management-ai-agents).

### Anti-Padrão JWT: Escopo do Token Sem Revogação

Três mitigações, todas necessárias juntas:

1. **Tokens de curta duração**: TTL de 300 segundos (5 minutos) para tokens de chamadas de ferramentas de agentes.
2. **Registro de revogação ativo**: uma tabela por inquilino de IDs de tokens válidos.
3. **Rotação de tokens por tarefa**: emitir um novo token para cada tarefa do agente.

## Isolamento de Execução: Namespaces do Kubernetes e Cotas de Recursos

### Namespace por Inquilino: RBAC, NetworkPolicy e ResourceQuota

Quatro componentes são necessários:

**Namespace por inquilino**: os pods do agente de cada inquilino são executados em um namespace do Kubernetes dedicado.

**RBAC com ServiceAccounts com escopo de namespace**: cada inquilino obtém um ServiceAccount dedicado com RoleBindings com escopo para seu próprio namespace.

**NetworkPolicy com negação padrão**: aplicar uma política de negação de todo o ingress e egress a cada namespace de inquilino por padrão.

**ResourceQuota com LimitRange**: aplicar limites de CPU, memória e contagem de pods por namespace.

Para controles de sandboxing a nível de processo ver [sandboxing de agentes de IA e isolamento de execução a nível de processo](/learn/ai-agent-sandboxing).

## Conformidade SOC 2 para Plataformas de Agentes Multi-Inquilino

### CC6.1: Controles de Acesso Lógico por Classificação de Dados

A conformidade com CC6.1 requer três controles específicos: escopo de vault de credenciais por inquilino, namespace de memória por inquilino e partição de log de auditoria por inquilino.

Os auditores SOC 2 marcam chaves de API compartilhadas usadas entre inquilinos como deficiências de CC6.1. Para o mapeamento completo de controles ver [governança de agentes de IA e frameworks de conformidade SOC 2](/learn/ai-agent-governance).

### CC6.6: Restrição de Acesso Privilegiado para Agentes com Permissões Elevadas

A conformidade com CC6.6 requer: prevenção estrutural de chamadas de agentes privilegiados entre inquilinos, definições de permissões de agentes privilegiados auditáveis e registros de auditoria por invocação para ações privilegiadas.

## Particionamento do Log de Auditoria por Inquilino

**Padrão de chave de armazenamento**: `audit/{tenant_id}/{year}/{month}/{day}/{agent_id}/{tool_call_id}.json`

**Política de bucket S3 por inquilino**: um prefixo de bucket separado com uma política de recursos separada por inquilino.

**Atributos de recursos OTLP**: incluir `tenant_id` como atributo de recurso em cada registro de log do OpenTelemetry.

**Workspace SIEM por inquilino**: em implantações SIEM compartilhadas, configurar índices ou workspaces por inquilino.

Para o design completo do log de auditoria ver [log de auditoria de agentes de IA e registros de conformidade por inquilino](/learn/ai-agent-audit-log).

## Anti-Padrões: O que Não Fazer

### Anti-Padrão 1: ID do Inquilino no Prompt do Agente, não na Infraestrutura

Injetar o `tenant_id` no prompt do sistema do agente e depender do agente para aplicar seu próprio limite de inquilino é o anti-padrão de multi-tenancy mais comum e perigoso. Falha por bypass de injeção de prompt, deriva de alucinação e ausência de aplicação na infraestrutura.

### Anti-Padrão 2: Armazenamento Vetorial Compartilhado sem Filtros de Inquilino

Este é o vetor principal de vazamento OWASP LLM06. A correção requer um campo de metadados `tenant_id` obrigatório em cada escrita e um filtro de metadados injetado na camada do cliente de armazenamento em cada consulta.

### Anti-Padrão 3: Chave de API LLM Compartilhada com Reivindicação de Inquilino no Prompt

Este anti-padrão falha no CC6.1: compartilhamento de limite de taxa, falha de atribuição de custos, raio de revogação e registros de auditoria do provedor que não podem ser particionados por inquilino.

## A Perspectiva do OpenLegion: Isolamento por Arquitetura, não por Convenção

O OpenLegion aplica o isolamento de inquilinos por meio de três mecanismos a nível de infraestrutura que o código do agente não pode contornar: escopo de vault de credenciais por projeto, ACLs de namespace de quadro negro e mensagens entre agentes de projetos cruzados bloqueadas por padrão.

| **Controle de isolamento** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Escopo de vault de credenciais por inquilino** | Aplicado por infraestrutura | Convenção desenvolvedor | Convenção desenvolvedor | Convenção desenvolvedor | Convenção desenvolvedor |
| **ACLs de namespace de quadro negro** | Aplicado por infraestrutura | Não disponível | Não disponível | Não disponível | Não disponível |
| **Mensagens entre agentes de projetos bloqueadas** | Bloqueadas por padrão | Não disponível | Não disponível | Não disponível | Não disponível |
| **Cap de orçamento por inquilino (Zona 2)** | Aplicado por infraestrutura | Convenção desenvolvedor | Convenção desenvolvedor | Convenção desenvolvedor | Convenção desenvolvedor |
| **Partição de auditoria por inquilino (WORM)** | Aplicado por infraestrutura | Convenção desenvolvedor | Convenção desenvolvedor | Convenção desenvolvedor | Convenção desenvolvedor |
| **Kubernetes namespace + ResourceQuota** | Gerenciado pela plataforma | Auto-gerenciado | Auto-gerenciado | Auto-gerenciado | Auto-gerenciado |

Para a camada de infraestrutura hospedada ver [plataforma gerenciada de agentes de IA com garantias de isolamento de inquilinos](/learn/ai-agent-platform).

<!-- SCHEMA: FAQPage -->

## Perguntas Frequentes

### O que é a multi-tenancy de agentes de IA?

A multi-tenancy de agentes de IA é a propriedade arquitetural de uma plataforma de agentes que garante que os agentes que servem diferentes inquilinos não possam acessar as credenciais, a memória, o contexto de execução ou os registros de auditoria uns dos outros, aplicada na camada de infraestrutura em vez de por convenção do desenvolvedor. Ela difere da multi-tenancy tradicional de aplicações web ao exigir três dimensões de isolamento adicionais: escopo de vault de credenciais por inquilino, particionamento de memória por inquilino e particionamento de log de auditoria por inquilino.

### O que é OWASP LLM06 e como afeta os sistemas de agentes multi-inquilino?

OWASP LLM Top 10 v1.1 LLM06 Sensitive Information Disclosure classifica o vazamento de dados entre inquilinos como de alta severidade: o cenário em que um agente processa os dados do InquilinoA, armazena documentos recuperados em uma camada de memória compartilhada sem particionamento por inquilino e depois os exibe em uma resposta do InquilinoB. O ataque não requer nenhuma entrada adversarial. A mitigação requer particionamento de memória por inquilino na camada do cliente de armazenamento, escopo de credenciais por inquilino e partições de logs de auditoria por inquilino.

### Como SOC 2 CC6.1 e CC6.6 se aplicam a plataformas de agentes multi-inquilino?

SOC 2 Tipo II CC6.1 requer que o acesso lógico seja restrito com base na classificação de dados; em um sistema de agentes multi-inquilino, o limite do inquilino é o limite de classificação primário. CC6.6 se aplica a agentes com permissões de ferramentas elevadas; esses agentes são funcionalmente usuários privilegiados e devem ser estruturalmente impedidos de processar solicitações fora do escopo de inquilino atribuído. Uma chave de API compartilhada usada entre inquilinos geralmente será marcada como deficiência de CC6.1.

### Qual é a vulnerabilidade do TTL do token JWT nos sistemas de agentes multi-inquilino?

Os tokens de acesso JWT usados para o contexto de inquilino em chamadas de ferramentas de agentes comumente expiram após 3.600 segundos (1 hora); se um token emitido para o InquilinoA for armazenado incorretamente em cache, compartilhado por um bug de infraestrutura ou capturado em um log de depuração, ele pode ser usado para fazer chamadas autenticadas atribuídas ao InquilinoA durante toda a duração do TTL sem detecção. A mitigação requer três controles aplicados juntos: tokens de curta duração com TTL de 300 segundos, registro de revogação ativo por inquilino e rotação de tokens por tarefa.

### Como funciona o isolamento de namespace do Kubernetes para agentes multi-inquilino?

O isolamento de namespace do Kubernetes fornece isolamento de execução por meio de quatro componentes: um namespace dedicado por inquilino, RBAC com ServiceAccounts por inquilino e RoleBindings com escopo de namespace, NetworkPolicy com negação padrão e lista de permissões explícita para endpoints externos necessários, e ResourceQuota com limites de computação por namespace. O isolamento de namespace aborda a dimensão de computação da multi-tenancy e deve ser combinado com escopo de credenciais por inquilino e particionamento de memória.

### Qual é o anti-padrão do armazenamento vetorial compartilhado nos sistemas de agentes multi-inquilino?

Usar um armazenamento vetorial compartilhado sem filtros de inquilino obrigatórios por consulta injetados na camada do cliente de armazenamento é o vetor principal de vazamento OWASP LLM06. A implementação correta requer um campo de metadados `tenant_id` em cada escrita e um filtro de metadados injetado na camada do cliente do armazenamento vetorial em cada consulta. Para requisitos de conformidade estritos, namespaces por inquilino ou índices separados aplicam o isolamento na camada de endereço de armazenamento.

### Como o OpenLegion aplica o isolamento de inquilinos?

O OpenLegion aplica o isolamento de inquilinos por meio de três mecanismos a nível de infraestrutura: escopo de vault de credenciais por projeto (Zone 2 resolve handles `$CRED{}` usando o contexto de projeto autenticado da sessão mesh, não de parâmetros fornecidos pelo agente; a resolução de credenciais entre projetos é arquiteturalmente impossível), ACLs de namespace de quadro negro (os agentes têm permissões de leitura e escrita apenas para o prefixo de chave de seu projeto, aplicadas pelo supervisor mesh) e mensagens entre agentes de projetos bloqueadas por padrão.

### Quais são os três modelos de arquitetura de multi-tenancy para plataformas de agentes?

Os três modelos de multi-tenancy têm diferentes garantias de isolamento e perfis de custo: o modelo Silo (shared-nothing) dá a cada inquilino infraestrutura completamente dedicada; o modelo Pool compartilha toda a infraestrutura com isolamento aplicado apenas na camada de aplicação; o modelo Bridge compartilha a infraestrutura de computação enquanto aplica o isolamento no plano de controle por meio de escopos de vault de credenciais por inquilino e ACLs de namespace de memória. O modelo Bridge é o padrão recomendado para SaaS B2B.
