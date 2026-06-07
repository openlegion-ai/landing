---
title: "Avaliação de agentes IA: benchmarks, métricas e testes"
description: "A avaliação de agentes IA mede se os agentes concluem tarefas de forma confiável, usam ferramentas com segurança e respeitam orçamentos de custo — via benchmarks, LLM-as-judge e análise de traces."
slug: /learn/ai-agent-evaluation
primary_keyword: "ai agent evaluation"
last_updated: "2026-06-04"
date_published: "2026-06"
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-orchestration
---

# Avaliação de agentes IA: benchmarks, métricas e testes

A avaliação de agentes IA é a prática de medir sistematicamente se os agentes concluem tarefas corretamente, invocam ferramentas com segurança e respeitam orçamentos de custo e latência em traces de execução de múltiplas etapas — não apenas em uma única chamada LLM. Benchmarks de turno único projetados para modelos de linguagem ignoram os modos de falha acumulativos que emergem em sistemas agênticos: uma taxa de sucesso por etapa de 90% degrada para aproximadamente 59% em cinco chamadas de ferramentas sequenciais.

<!-- SCHEMA: DefinitionBlock -->
A avaliação de agentes IA é uma disciplina de teste de software que avalia sistemas de IA autônomos em dimensões incluindo taxa de conclusão de tarefas, correção de chamadas de ferramentas, eficiência de comprimento de trajetória, adesão a barreiras de segurança e custo por tarefa concluída, usando suites de benchmarks, replay de traces gravados e avaliadores LLM-as-judge.

## Por que benchmarks LLM de turno único falham para agentes

### Erro acumulativo em cadeias de ferramentas de múltiplas etapas

Benchmarks de turno único como MMLU medem precisão one-shot em questões isoladas. Agentes funcionam de forma diferente: cada chamada de ferramenta depende do resultado anterior, e erros se propagam. Com 90% de confiabilidade por etapa, uma cadeia de cinco ferramentas é concluída sem erros apenas 59% do tempo (0,9⁵ ≈ 0,59). Com 80%, isso cai para 33%.

Essa dinâmica acumulativa significa que um agente que parece aceitável nas métricas de nível de etapa pode ser pouco confiável em produção de ponta a ponta. A única medição significativa é a conclusão de tarefas no nível da trajetória.

### A adaptação Task-Pass@k

Pass@k foi introduzido no HumanEval (2021) para medir geração de código: a probabilidade de que pelo menos uma das k tentativas independentes passe em todos os testes. Para agentes, o mesmo princípio se aplica no nível da trajetória. Pass@1 baixo com pass@3 alto é um sinal de falha específico: o agente pode resolver a tarefa, mas não de forma confiável.

### O que MMLU e HumanEval ignoram

MMLU testa recall factual. HumanEval testa geração de código em nível de função em isolamento. Nenhum testa o que os agentes de produção realmente fazem: raciocínio de múltiplas etapas com saídas reais de ferramentas, recuperação de erros e gerenciamento de custos em trajetórias longas.

## A perspectiva da OpenLegion: as quatro dimensões de avaliação que importam

**OWASP LLM08:2025 (Agência excessiva)** identifica testes insuficientes do comportamento dos agentes como causa raiz de efeitos colaterais não intencionais em sistemas agênticos.

**openai/evals (18.604 estrelas GitHub, quase-MIT)** é o maior registro de benchmarks LLM de código aberto. Cobre avaliação em nível de modelo, não pontuação de trajetória em nível de agente.

**LLM-as-judge** (popularizado pelo MT-Bench 2023) introduz até 20% de viés de positividade quando o modelo juiz e o modelo sujeito compartilham os mesmos pesos base. Use uma família de modelos diferente como juiz para resultados de avaliação credíveis.

### Correção de chamadas de ferramentas e auditoria de efeitos colaterais

Registre cada chamada de ferramenta que o agente faz durante as execuções de avaliação: nome da ferramenta, argumentos, valor de retorno e ações subsequentes. Compare com uma trajetória dourada.

### Custo por tarefa e orçamentos de latência

Um agente que conclui tarefas corretamente mas leva 47 chamadas LLM para fazer o que um agente bem projetado faz em 8 não está pronto para produção. Meça tokens consumidos e tempo de relógio de parede por tarefa concluída.

### Avaliação de segurança: tratamento de credenciais e resistência a injeções

A avaliação de segurança merece sua própria suite de testes. Verifique que o agente não registra credenciais em argumentos de chamadas de ferramentas, não segue instruções incorporadas em saídas de ferramentas adversariais, e não toma ações irreversíveis fora de seu escopo designado.

## Suites de benchmarks para agentes IA

### openai/evals: baseline em nível de modelo (18.604 estrelas)

openai/evals (18.604 estrelas GitHub, quase-MIT) é o maior registro de benchmarks abertos para avaliação LLM. Útil como baseline de qualidade do modelo; não testa uso de ferramentas de múltiplas etapas ou conclusão agêntica de tarefas.

### trycua/cua: benchmarks de agentes de uso de computador (17.633 estrelas)

trycua/cua (17.633 estrelas GitHub, MIT) fornece ambientes sandbox para avaliar agentes de uso de computador que controlam desktops macOS, Linux e Windows. Os benchmarks CUA estão entre os mais desafiadores no cenário de avaliação de código aberto.

### microsoft/promptflow: nós de avaliação de qualidade de app LLM (11.142 estrelas)

microsoft/promptflow (11.142 estrelas GitHub, MIT) inclui nós de avaliação integrados para pontuar saídas de aplicações LLM: fundamentação, relevância e fluência.

### IBM/AssetOpsBench: 460+ avaliações MCP de cenários industriais (1.704 estrelas)

IBM/AssetOpsBench (1.704 estrelas GitHub, Apache-2.0) fornece mais de 460 casos de avaliação de cenários industriais para agentes operando sobre o Model Context Protocol.

## Métodos de avaliação

### Correspondência exata e avaliadores programáticos

Avaliadores de correspondência exata comparam a saída do agente com um valor esperado predefinido. Determinísticos, rápidos e livres de viés do modelo juiz.

### LLM-as-judge: riscos de viés e mitigação

LLM-as-judge usa um modelo de linguagem para pontuar as saídas dos agentes contra uma rubrica. O risco de viés está quantificado: até 20% de viés de positividade quando juiz e sujeito compartilham os mesmos pesos base.

Mitigações: usar um modelo juiz de um provedor ou linhagem de treinamento diferente; fornecer rubricas de pontuação explícitas; calibrar pontuações do juiz contra um pequeno conjunto de exemplos rotulados por humanos.

### Pontuação de trajetória e correção em nível de etapa

A pontuação de trajetória avalia a sequência completa de ações que um agente tomou para concluir uma tarefa. Métricas em nível de etapa: precisão de seleção de ferramentas, correção de argumentos, eficiência de trajetória, recuperação de erros, precisão de terminação.

### Arneses de entrada adversariais

Avaliações adversariais testam o comportamento do agente sob entradas projetadas para desencadear comportamentos inseguros ou incorretos: injeção de prompt via saídas de ferramentas, respostas de ferramentas malformadas, teste de limites de escopo, sondas de exposição de credenciais.

## Construindo um pipeline de avaliação de agentes

### Design do dataset de avaliação para tarefas agênticas

Um bom dataset de avaliação de agentes contém: entradas de tarefas, sequência esperada de chamadas de ferramentas, critérios de sucesso e metadados. Comece com 50-100 tarefas cobrindo os principais casos de uso.

### Replay de traces e testes de regressão

O replay de traces executa o dataset de avaliação contra o agente, captura traces de execução completos e compara com traces dourados. Os testes de regressão sinalizam quando uma tarefa que passou em uma versão anterior falha na atual.

### Integração CI: bloquear deploys em regressões de avaliação

Integre a avaliação de agentes no pipeline CI para bloquear deploys quando a qualidade regride. Bloqueie o deploy se a taxa de conclusão de tarefas cair mais de 5% em absoluto ou se algum caso de teste de segurança regredir para falha.

## Comparação de ferramentas de avaliação

| **Dimensão** | **openai/evals** | **trycua/cua** | **promptflow eval** | **IBM/AssetOpsBench** |
|---|---|---|---|---|
| **Escopo de avaliação** | LLM de turno único | Desktop de uso de computador | Qualidade de app LLM | Agentes MCP multi-função |
| **Método de pontuação** | Correspondência exata, LLM-juiz | Execução de ambiente | Nós LLM-juiz | Programático + LLM-juiz |
| **Suporte a trajetória de agente** | Não | Sim (sessões de desktop completas) | Parcial (nível de fluxo) | Sim (workflows de 4 funções) |
| **Testes de segurança** | Não | Não | Não | Parcial |
| **Integração CI** | Via CLI | Via SDK | Nativo no PromptFlow | Manual |
| **Licença** | Quase-MIT | MIT | MIT | Apache-2.0 |
| **Estrelas GitHub** | 18.604 | 17.633 | 11.142 | 1.704 |

<!-- SCHEMA: FAQPage -->
## Perguntas frequentes

### O que é avaliação de agentes IA?

A avaliação de agentes IA mede se os agentes concluem corretamente tarefas de múltiplas etapas, invocam ferramentas com os argumentos corretos, respeitam orçamentos de custo e latência, e evitam comportamentos inseguros como exfiltração de credenciais ou injeção de prompts.

### Quais benchmarks são usados para avaliar agentes IA?

Os frameworks comuns incluem openai/evals (18.604 estrelas GitHub, nível de modelo), trycua/cua (17.633 estrelas GitHub, MIT, tarefas de desktop de uso de computador), microsoft/promptflow eval nodes (11.142 estrelas GitHub, MIT, qualidade de app LLM) e IBM/AssetOpsBench (1.704 estrelas GitHub, Apache-2.0, 460+ cenários MCP industriais).

### O que é avaliação LLM-as-judge e quais são seus riscos?

LLM-as-judge usa um modelo de linguagem separado para pontuar saídas de agentes contra uma rubrica. O risco chave: até 20% de viés de positividade quando juiz e sujeito compartilham os mesmos pesos base. Use uma família de modelos diferente como juiz para resultados credíveis.

### Como funciona pass@k para avaliação de agentes?

Pass@k mede a probabilidade de que pelo menos uma das k execuções independentes de um agente conclua corretamente uma tarefa. Pass@1 baixo com pass@3 alto sinaliza execução não determinística que vale a pena investigar antes do deploy em produção.

### Como avaliar segurança de agentes e tratamento de credenciais?

Avaliações de segurança testam se agentes vazam credenciais em argumentos de chamadas de ferramentas, respondem a injeção de prompt adversarial em saídas de ferramentas, ou causam efeitos colaterais irreversíveis fora de seu escopo. OWASP LLM08:2025 (Agência excessiva) documenta esse padrão de falha como vulnerabilidade LLM top-10.

### Como integrar avaliação de agentes em CI/CD?

Registre um dataset de avaliação dourado com entradas de tarefas, sequências esperadas de chamadas de ferramentas e saídas finais. A cada commit, reproduza o dataset contra o agente atualizado e compare as pontuações de trajetória com a baseline anterior. Bloqueie deploys se a taxa de conclusão de tarefas cair mais de 5% em absoluto ou se algum teste de segurança regredir.

### Como a OpenLegion suporta avaliação de agentes?

O mesh de agentes da OpenLegion emite traces estruturados de chamadas de ferramentas que podem ser reproduzidos contra um arnês de avaliação. O vault de credenciais garante que as execuções de avaliação usem credenciais isoladas. Agentes de avaliação controlados por heartbeat podem executar suites de regressão de forma programada.

## Avalie seus agentes em um mesh seguro

Agentes confiáveis requerem infraestrutura de avaliação que teste a trajetória de execução completa. O problema de erro acumulativo é real: uma taxa de confiabilidade por etapa de 90% significa que um agente de cinco etapas falha em 41% das execuções.

[Comece a construir agentes avaliados na OpenLegion](https://openlegion.ai)
