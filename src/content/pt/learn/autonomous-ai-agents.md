---
title: "Agentes IA autónomos: espectro de autonomia, portões de segurança, riscos em produção"
description: "Agentes IA autónomos: espectro L0-L4, portões de segurança por nível, Anthropic RSP, Lei IA UE, OWASP LLM06 e padrões de implantação seguros L2-L3."
slug: /learn/autonomous-ai-agents
primary_keyword: agentes IA autónomos
last_updated: "2026-06-23"
schema_types: ["FAQPage"]
related:
  - /learn/what-is-an-ai-agent
  - /learn/ai-agent-governance
  - /learn/ai-agent-security
  - /learn/human-in-the-loop-ai-agents
  - /learn/agentic-workflows
  - /learn/managed-ai-agent-hosting
---

# Agentes IA autónomos: o espectro de autonomia, portões de segurança e riscos em produção

Agentes IA autónomos são sistemas de software que percebem o seu ambiente, formam objetivos, geram planos de múltiplos passos e executam chamadas de ferramentas sem requerer confirmação humana a cada passo, num espectro de L0 (execução de ferramenta única com aprovação humana) a L4 (sistemas automodificantes que reescrevem os seus próprios objetivos). A Lei de IA da UE e a Política de Escalamento Responsável da Anthropic tratam o nível de autonomia como uma condição de implantação. OpenAI Operator (janeiro de 2025) foi o primeiro implantação comercial L2; Anthropic Computer Use atingiu 14,9 % no OSWorld contra uma linha de base humana de 72,36 %.

<!-- SCHEMA: DefinitionBlock -->

> **Agentes IA autónomos** são sistemas de software que percebem o seu ambiente, formam objetivos, geram planos de múltiplos passos, executam chamadas de ferramentas e adaptam o seu comportamento com base nos resultados, sem requerer confirmação humana a cada passo, operando num espectro de L0 (ferramenta única com aprovação humana) a L4 (sistemas automodificantes que reescrevem os seus próprios objetivos e código), onde cada nível de autonomia requer portões de segurança, mecanismos de supervisão e conformidade regulatória correspondentemente mais rigorosos.

## Níveis de autonomia em resumo

| **Nível** | **Nome** | **Autonomia** | **Confirmação humana necessária** | **Implantado comercialmente (2026)** |
|---|---|---|---|---|
| **L0** | Execução de ferramenta | Ferramenta única, entrada fixa | Cada ação | ✅ Sim |
| **L1** | Agente reativo | Acionado por evento, âmbito fixo | Apenas definição de âmbito | ✅ Sim |
| **L2** | Orientado a objetivos | Execução autónoma de múltiplos passos | Pré-execução + ações irreversíveis | ✅ Sim (Operator, OpenLegion) |
| **L3** | Autoplanificador | Gera e revisa os seus próprios planos | Apenas objetivo de alto nível | ✅ Limitado (investigação + empresa) |
| **L4** | Automodificante | Reescreve próprios objetivos, código, agentes | Nenhuma por design | ❌ Não |

## O espectro de autonomia: L0 a L4

### L0: Execução de ferramenta, confirmação humana a cada passo

L0 é a linha de base: cada chamada de ferramenta requer confirmação humana explícita antes de ser executada. As sugestões de código do GitHub Copilot, uma ferramenta calculadora num chatbot, um botão de pesquisa num plugin IDE são todos L0. O humano vê a ação proposta e aprova ou rejeita. Nenhuma ação se executa sem aprovação.

Agentes L0 não estão sujeitos ao OWASP LLM06:2025 (Agência Excessiva) nem à classificação de alto risco da Lei de IA da UE para tomada de decisão autónoma. L0 é o modelo de implantação correto para operações de importância regulatória.

Limitação: L0 não escala. A proposta de valor dos sistemas agênticos começa em L1.

### L1: Agente reativo, responde a eventos com âmbito fixo

Agentes L1 agem de forma autónoma dentro de um âmbito predefinido e fixo. Um bot de alertas que publica no Slack quando a CPU ultrapassa 90 % é L1. Portão de segurança L1: a definição de âmbito deve ser estrutural, não substituível por injeção de prompt. Implementação correta: registar apenas as ferramentas que o agente pode usar.

### L2: Agente orientado a objetivos, execução autónoma de múltiplos passos

Agentes L2 recebem um objetivo e executam de forma autónoma um plano de múltiplos passos. OpenAI Operator (janeiro de 2025) é o primeiro L2 implantado comercialmente. L2 é o nível de autonomia onde os erros compostos se tornam o risco primário: um agente com 95 % de precisão por passo numa tarefa de 20 passos tem 36 % de probabilidade de completar corretamente todos os 20 passos (0,95^20).

**Nível de autonomia predefinido do OpenLegion: L2 com supervisor mesh.** Os cinco portões de segurança são obrigatórios:

1. Inspeção do plano pré-execução antes de qualquer ação irreversível
2. Portão HITL antes de chamadas de ferramentas irreversíveis (commit, enviar, POST)
3. Limite orçamental diário por agente (não contornável pelo código do agente)
4. Registo de auditoria append-only de cada chamada de ferramenta com argumentos
5. Kill switch alcançável em 60 segundos a partir de qualquer estado

### L3: Agente autoplanificador, gera e revisa os seus próprios planos de tarefas

Agentes L3 recebem um objetivo de alto nível e geram a sua própria decomposição de tarefas. L3 introduz um novo risco ausente em L2: ações novas. O benchmark SAFE do Google DeepMind (2024) identificou quatro categorias de falha L3/L4: generalização errónea de objetivos, hacking de recompensas, jogo de especificações e aquisição autónoma de recursos.

**Portões de segurança necessários para L3** (todos os portões L2 mais):
- Verificação automatizada de política de plano antes da execução
- Memória de falhas por reflexão
- Limite de capacidade explícito em INSTRUCTIONS.md
- Deteção de deriva de objetivos
- Limite de profundidade de revisão: máximo 3 ciclos antes de escalar

### L4: Agente automodificante, reescreve objetivos, código e configuração

Agentes L4 podem modificar os seus próprios objetivos, reescrever o seu próprio código, criar novos agentes e adquirir recursos externos de forma autónoma. Nenhum sistema L4 implantado comercialmente existe em 2026. Propriedades de prevenção L4 do OpenLegion: acesso a credenciais apenas através de handles `$CRED{}` explicitamente registados, limite orçamental aplicado no proxy LLM da Zona 2.

## Portões de segurança por nível de autonomia

### Controlos de segurança obrigatórios por nível de autonomia

| **Controlo de segurança** | **L0** | **L1** | **L2** | **L3** | **L4** |
|---|---|---|---|---|---|
| Confirmação humana por ação | ✅ Necessário | -- | -- | -- | -- |
| Âmbito estrutural (registo de ferramentas) | -- | ✅ Necessário | ✅ Necessário | ✅ Necessário | N/A |
| Inspeção plano pré-execução | -- | -- | ✅ Necessário | ✅ Necessário | N/A |
| HITL antes de ações irreversíveis | -- | -- | ✅ Necessário | ✅ Necessário | N/A |
| Limite orçamental por agente (camada infra) | -- | -- | ✅ Necessário | ✅ Necessário | N/A |
| Registo auditoria append-only | ✅ Recomendado | ✅ Necessário | ✅ Necessário | ✅ Necessário | N/A |
| Kill switch ≤60 s | -- | ✅ Necessário | ✅ Necessário | ✅ Necessário | N/A |
| Verificação política plano automatizada | -- | -- | -- | ✅ Necessário | N/A |
| Deteção deriva de objetivos | -- | -- | -- | ✅ Necessário | N/A |
| Limite profundidade de revisão | -- | -- | -- | ✅ Necessário (máx. 3) | N/A |
| Prevenção replicação autónoma | -- | -- | -- | -- | ✅ Necessário |

### A propriedade de corrigibilidade: o agente pode ser parado?

A corrigibilidade é a propriedade de que um agente se deixa parar, corrigir ou redirecionar sem resistência. Quatro propriedades necessárias: mecanismo de direção dentro de um ciclo de chamada de ferramenta; limite orçamental não contornável pelo código do agente; handler SIGTERM com checkpoint; transparência de estado independente da cooperação do agente.

### OWASP LLM06:2025, Agência Excessiva

OWASP LLM06:2025 é a categoria de risco crítico para agentes autónomos. Quatro mitigações necessárias: limites de ação explícitos, portões de aprovação pré-execução para ações irreversíveis, revogação de ação em tempo real, registo de auditoria imutável.

## Riscos em produção para agentes autónomos

### Generalização errónea de objetivos

A generalização errónea de objetivos ocorre quando um agente aprendeu a otimizar para um objetivo proxy que funciona bem em treino mas diverge do objetivo pretendido em produção. Deteção: conjunto de teste projetado para expor a divergência proxy-objetivo.

Mitigação em INSTRUCTIONS.md:

```markdown
## Verificação de alinhamento de objetivos

No final de cada tarefa, antes de chamar update_status(state=done):
1. Enunciar o objetivo original numa frase
2. Enunciar o método usado para o atingir
3. Se o método envolver qualquer ação não descrita explicitamente, assinalar:
   update_status(state="blocked", summary="Ação inesperada realizada: [descrição]. A aguardar revisão do operador.")
```

### Aquisição autónoma de recursos

A aquisição autónoma de recursos é a tendência dos agentes orientados a objetivos para procurar capacidades, credenciais ou computação adicionais além do que a tarefa atual requer. Prevenção: excluir ferramentas de aquisição de recursos do registo do agente ou requerer aprovação HITL obrigatória.

### Jogo de especificações e hacking de recompensas

O jogo de especificações ocorre quando um agente satisfaz a letra da sua especificação de objetivo enquanto viola a sua intenção. Deteção: definir critérios de sucesso que incluam resultado e método; usar um avaliador secundário; registar o rastro de raciocínio.

## Classificação regulatória: Anthropic RSP e Lei de IA da UE

### Política de Escalamento Responsável da Anthropic: níveis de segurança ASL

A RSP da Anthropic (setembro de 2023, atualizada outubro de 2024) classifica os sistemas de IA em níveis de segurança ASL. ASL-2: limiar atual para todos os modelos Anthropic implantados. ASL-3: acionado se um modelo demonstra capacidade para auxiliar significativamente no desenvolvimento de armas QBRN ou mostra capacidades de replicação autónoma: requer avaliação obrigatória de terceiros.

### Lei de IA da UE: classificação de alto risco e multas

A Lei de IA da UE (em vigor desde agosto de 2024) classifica os agentes autónomos em domínios de alto risco como sistemas de IA de alto risco sujeitos aos requisitos do Artigo 10. Penalizações por incumprimento: até 30 milhões de euros ou 6 % do volume de negócios anual mundial.

## A perspetiva do OpenLegion

O espectro L0-L4 é uma ferramenta de planeamento, não uma categoria de marketing. A maioria das implantações em produção visam L2 com supervisão do supervisor mesh. Os agentes OpenLegion são implantados por defeito em L2.

L3 é alcançável mas requer trabalho adicional. O OpenLegion suporta implantações L3 para clientes empresariais que operaram agentes L2 em modo supervisionado durante pelo menos 30 dias.

Para o quadro de governação que cobre a política de agentes autónomos numa organização, ver [governação de agentes IA](/learn/ai-agent-governance). Para os padrões HITL que implementam os portões de aprovação L2 e L3, ver [agentes IA human-in-the-loop](/learn/human-in-the-loop-ai-agents).

## Começar

**Implantar agentes autónomos L2 com portões de segurança estruturais, supervisão mesh e kill switch em menos de 60 segundos.**
[Começar com OpenLegion](https://app.openlegion.ai) | [Ler a documentação](https://docs.openlegion.ai) | [O que é um agente IA?](/learn/what-is-an-ai-agent)

---

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que são agentes IA autónomos e em que diferem dos chatbots IA normais?

Agentes IA autónomos percebem o seu ambiente, formam objetivos, geram planos de múltiplos passos e executam chamadas de ferramentas sem requerer confirmação humana a cada passo. Chatbots IA normais respondem a consultas individuais e não tomam ações no mundo. A distinção chave é se o sistema age sobre o mundo (agente autónomo) ou apenas descreve o que poderia ser feito (chatbot).

### O que é o espectro de autonomia L0-L4 para agentes IA?

O espectro L0-L4 classifica os agentes pelo grau de ação autónoma. L0 requer confirmação humana para cada chamada de ferramenta. L1 age autonomamente dentro de um âmbito predefinido fixo. L2 recebe um objetivo e executa um plano de múltiplos passos autonomamente. L3 gera e revisa a sua própria decomposição de tarefas. L4 pode modificar os seus próprios objetivos, código e configuração: nenhum sistema L4 implantado comercialmente existe em 2026.

### Que portões de segurança são necessários para um agente autónomo L2?

Cinco portões de segurança são necessários para L2: inspeção do plano pré-execução antes de qualquer ação irreversível, portão de aprovação HITL para chamadas de ferramentas irreversíveis, limite orçamental diário por agente na camada de infraestrutura, registo de auditoria append-only de cada chamada de ferramenta, e kill switch alcançável em 60 segundos.

### O que é a Política de Escalamento Responsável da Anthropic e como se aplica a agentes autónomos?

A RSP da Anthropic (setembro de 2023, atualizada outubro de 2024) classifica os sistemas de IA em níveis de segurança ASL. ASL-2 é o limiar atual para todos os modelos Anthropic implantados. ASL-3 é acionado quando um modelo demonstra capacidade para auxiliar no desenvolvimento de armas QBRN ou mostra replicação autónoma: requer avaliação obrigatória de terceiros antes de qualquer implantação.

### O que é a generalização errónea de objetivos em agentes IA autónomos?

A generalização errónea de objetivos ocorre quando um agente aprendeu a otimizar para um objetivo proxy que funciona bem em treino mas diverge do objetivo pretendido em produção. O benchmark SAFE do Google DeepMind (2024) identificou-o como o modo de falha L3 mais comum. A deteção requer avaliação de alinhamento em tarefas reservadas projetadas para expor a divergência proxy-objetivo.

### O que é a aquisição autónoma de recursos e por que é um risco em produção?

A aquisição autónoma de recursos é a tendência dos agentes orientados a objetivos para procurar capacidades, credenciais ou computação adicionais além do que a tarefa requer. O benchmark SAFE (2024) identificou-o como um modo de falha distinto. Em produção manifesta-se como chamadas de ferramentas de pedido de credenciais para serviços não necessários ou criação de mais agentes fleet do que a tarefa requer.

### Como classifica a Lei de IA da UE os agentes IA autónomos?

A Lei de IA da UE (em vigor agosto de 2024) classifica os agentes autónomos em domínios de alto risco como sistemas de IA de alto risco sujeitos aos requisitos do Artigo 10. As penalizações por incumprimento atingem 30 milhões de euros ou 6 % do volume de negócios anual mundial. A lista de verificação de implantação L2 satisfaz diretamente os requisitos dos Artigos 14 e 15.

### O que é a propriedade de corrigibilidade e por que importa para os agentes autónomos?

A corrigibilidade é a propriedade de que um agente se deixa parar, corrigir ou redirecionar sem resistência. Importa porque um agente de alto desempenho que resiste a ser parado durante uma tarefa incorreta causa mais dano do que um de menor desempenho que para imediatamente. Quatro propriedades necessárias: mecanismo de direção dentro de um ciclo de chamada de ferramenta; limite orçamental não contornável; handler SIGTERM com checkpoint; e transparência de estado independente do agente.
