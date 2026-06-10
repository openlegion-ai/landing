---
title: "Uso de ferramentas por agentes IA — Chamadas de funções, esquemas e execução segura"
description: "Como os agentes IA usam ferramentas: definição de esquemas, chamadas de funções entre provedores, chamadas paralelas e encadeadas, análise de saídas, recuperação de erros e escopo de permissões para produção segura."
slug: /learn/ai-agent-tool-use
primary_keyword: uso de ferramentas agentes ia
last_updated: "2026-06-08"
schema_types:
  - FAQPage
related:
  - /learn/agentic-workflows
  - /learn/model-context-protocol
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-evaluation
  - /learn/ai-agent-frameworks
---

# Uso de ferramentas por agentes IA: chamadas de funções, esquemas e execução segura

O uso de ferramentas por agentes IA é o mecanismo pelo qual um LLM solicita a execução de funções externas — busca na web, consultas a bancos de dados, chamadas de API, operações com arquivos — emitindo JSON estruturado de chamada de ferramenta que um runtime intercepta, valida contra um esquema JSON e executa antes de retornar um resultado. O LLM nunca executa nada; apenas solicita. O runtime aplica validação de esquema, verificações ACL e orçamentos de etapas antes de qualquer execução. tau-bench (2025) mostra que erros de construção de argumentos são o principal modo de falha no uso de ferramentas.

<!-- SCHEMA: DefinitionBlock -->
O uso de ferramentas por agentes IA é o mecanismo pelo qual um grande modelo de linguagem solicita a execução de funções externas — busca na web, consultas a bancos de dados, chamadas de API, operações com arquivos ou lógica de negócio personalizada — emitindo uma chamada de ferramenta estruturada em sua saída que um runtime intercepta, valida contra uma definição de esquema JSON, executa e retorna como resultado de ferramenta no próximo turno de contexto.

## Como funcionam as chamadas de ferramentas: o ciclo solicitação-execução-retorno

### O ciclo de vida de uma chamada de ferramenta

Cada chamada de ferramenta segue o mesmo ciclo de cinco etapas independentemente do framework ou provedor:

1. **Configuração do contexto** — o agente recebe a tarefa e uma lista de ferramentas disponíveis, cada uma descrita por um nome, uma descrição em linguagem natural e uma definição de esquema JSON de seus parâmetros.
2. **Decisão do LLM** — o modelo emite um bloco de chamada de ferramenta em sua saída: um nome de função e um objeto JSON de argumentos correspondendo ao esquema declarado.
3. **Interceptação do runtime** — o framework intercepta a chamada de ferramenta antes de qualquer execução. Os argumentos são validados contra o esquema. O ACL do agente é verificado: este agente tem permissão para chamar esta ferramenta?
4. **Execução** — se as validações e verificações de permissão passam, o runtime executa a função e coleta sua saída.
5. **Injeção de contexto** — o resultado da ferramenta é injetado de volta no contexto da conversa como turno de resultado de ferramenta. O LLM continua o raciocínio a partir desse contexto enriquecido.

O fato arquitetônico crítico: o LLM nunca executa nada. Apenas solicita. Toda ação insegura — escrever um arquivo, chamar uma API, enviar um e-mail — é controlada pelo runtime.

### Diferenças de formato entre provedores: OpenAI vs Anthropic vs Google

Os três principais provedores de LLM suportam uso de ferramentas nativamente, mas o formato JSON difere:

**OpenAI** (openai/openai-python, 30.941 estrelas, Apache-2.0): definições de ferramentas vão no parâmetro `tools` como array de objetos JSON Schema. O modelo retorna chamadas de ferramentas no campo `tool_calls`. O cliente envia resultados de ferramentas como mensagens com `role: "tool"`. A API Responses (março de 2025) adicionou ferramentas integradas (`web_search`, `file_search`, `computer_use`) que executam no lado do servidor.

**Anthropic** (anthropic-sdk-python, 3.595 estrelas, MIT): definições de ferramentas vão no parâmetro `tools` de nível superior. O modelo retorna blocos de conteúdo `tool_use` dentro do turno do assistente. O cliente deve analisar esses blocos e retornar blocos `tool_result` no próximo turno humano.

**Google Gemini**: definições de ferramentas usam `functionDeclarations` dentro do parâmetro `tools`. O modelo retorna partes `functionCall`; o cliente envia partes `functionResponse`. Gemini suporta `tool_config` com modo `ANY` e modo `AUTO`.

Os formatos são semanticamente equivalentes mas sintaticamente diferentes. Frameworks que abstraem as diferenças de provedores são mais fáceis de manter em mudanças de modelos.

### Quem realmente executa a ferramenta (e por que isso importa para a segurança)

O LLM não pode executar ferramentas. Pode apenas solicitá-las. Quando um runtime aplica uma porta ACL antes de cada execução, nenhuma saída do LLM pode contornar a verificação de permissão. O modelo pode solicitar `delete_all_records()` com quaisquer argumentos; se a matriz de permissões do agente não inclui essa ferramenta, o runtime rejeita a solicitação antes de qualquer execução.

## Definir esquemas de ferramentas que os LLMs usam corretamente

tau-bench (ServiceNow Research, 2025) mediu GPT-4o em 44% pass@1 em tarefas de uso de ferramentas retail. A maior categoria de falha foi a construção de argumentos: o modelo chamou a função correta com argumentos errados. A qualidade do esquema é a principal alavanca de confiabilidade.

### Anatomia do esquema JSON para definições de ferramentas

Um esquema de ferramenta mínimo válido requer quatro campos:

```json
{
  "name": "search_web",
  "description": "Pesquisa a web pública por informações atuais. Usar quando a tarefa requer fatos posteriores ao corte de treinamento, dados em tempo real ou fontes não presentes nos dados de treinamento.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "A consulta de pesquisa. Usar termos específicos e direcionados, não uma frase completa."
      },
      "max_results": {
        "type": "integer",
        "description": "Número máximo de resultados a retornar. Padrão 5, máximo 20.",
        "default": 5
      }
    },
    "required": ["query"]
  }
}
```

O array `required` importa: parâmetros não em `required` são opcionais. Parâmetros obrigatórios frequentemente omitidos indicam um problema de descrição do esquema.

### Escrever descrições que reduzam erros de argumentos

Três regras para descrições de ferramentas que melhoram a precisão de construção de argumentos:

1. **Nomear com um par verbo-substantivo**: `search_web`, `create_ticket`, `read_file`. Evita ambiguidade entre ferramentas similares.
2. **Desambiguar na descrição**: se duas ferramentas parecem similares, indicar explicitamente quando usar cada uma.
3. **Descrever parâmetros com exemplos**: `"A consulta de pesquisa. Exemplo: 'LangGraph v0.2 chamadas de ferramentas paralelas'"` supera `"A string de consulta"` em precisão.

### Erros comuns de esquema e como corrigi-los

| **Erro** | **Efeito** | **Correção** |
|---|---|---|
| `"type": "string"` sem restrições para valores categóricos | Modelo inventa valores inválidos | Usar `"enum": ["option_a", "option_b"]` |
| `description` ausente em parâmetros | Modelo adivinha a semântica dos argumentos | Escrever descrições explícitas com exemplos |
| Todos os parâmetros em `required` | Modelo recusa-se a chamar quando campos opcionais são desconhecidos | Listar apenas parâmetros realmente obrigatórios |
| Nome de ferramenta vago (`process`, `handle`) | Modelo não consegue distinguir ferramentas similares | Usar verbo-substantivo: `submit_form`, `parse_date` |
| Sem array `required` | JSON Schema inválido | Sempre incluir `required`, mesmo que vazio (`[]`) |

### Modo estrito: aplicar adesão exata ao esquema

O modo estrito de saídas estruturadas da OpenAI (`"strict": true`) garante que o JSON de saída do modelo corresponda exatamente ao esquema declarado, eliminando toda a categoria de erros de construção de argumentos.

## Chamadas de ferramentas paralelas e sequenciais

### Quando usar chamadas de ferramentas paralelas

A API Responses da OpenAI (março de 2025) tornou as chamadas de ferramentas paralelas o padrão. Em um único turno de LLM, o modelo pode solicitar múltiplas execuções de ferramentas simultaneamente. Para ferramentas independentes, o despacho paralelo reduz as idas e vindas de N turnos sequenciais para um lote concorrente.

Exemplo: um agente de pesquisa precisa do preço atual de ações, notícias recentes e um documento SEC de uma empresa. Os três são independentes. Sequencial: 3 turnos de LLM x 10s = 30s. Paralelo: 1 turno de LLM + max(latências das ferramentas) aprox. 10s.

A pré-condição: as ferramentas devem ser genuinamente independentes. Se a ferramenta B precisa da saída da ferramenta A como argumento, devem ser sequenciais.

### Chamadas de ferramentas sequenciais para operações dependentes

O encadeamento de ferramentas requer execução sequencial. O padrão: `search_web(consulta)` → `fetch_page(URL do resultado de pesquisa)` → `extract_data(conteúdo da página)` → `summarize(dados extraídos)`.

### Riscos de concorrência com recursos com estado

Chamadas de ferramentas paralelas contra recursos com estado precisam de garantias de ordenamento. A regra: o despacho paralelo é seguro quando ferramentas são somente leitura ou escrevem em recursos independentes.

## Análise de saídas de ferramentas e recuperação de erros

Chamadas de ferramentas falham. A API externa retorna 503. A consulta ao banco de dados expira. Uma implementação bem projetada trata falhas sem intervenção humana para erros recuperáveis.

### Validar saídas de ferramentas

Uma ferramenta retornando HTTP 200 não é o mesmo que uma ferramenta retornando um resultado correto e útil. Validar a saída contra um esquema esperado antes de injetá-la no contexto do agente.

### Estratégias de retentativa: quando e como reinvocar

Três padrões de retentativa para diferentes modos de falha:

- **Retentativa por falha transitória** (timeout de rede, limite de taxa): reinvocar a mesma ferramenta com os mesmos argumentos após um breve backoff.
- **Retentativa com esclarecimento de argumento**: retornar um erro estruturado ao LLM explicando por que o argumento foi rejeitado.
- **Ferramenta de fallback**: se a ferramenta A falhar após N retentativas, rotear para a ferramenta B com capacidade equivalente.

### Reportar falhas de ferramentas ao orquestrador

Erros irrecuperáveis devem ser reportados ao orquestrador. Para pipelines multi-agente, o orquestrador precisa de um sinal de falha estruturado. Para os [padrões de orquestração de agentes IA](/learn/ai-agent-orchestration), este é o caminho de escalação.

## Escopo de permissões de ferramentas e segurança

### Atribuição de ferramentas com menor privilégio

Cada agente deve ter apenas as ferramentas que sua tarefa específica requer. O raio de explosão de um agente com injeção de prompt bem-sucedida é limitado por seu conjunto de ferramentas permitidas. OWASP LLM Top 10 v1.1 (2025) lista a injeção de prompt (LLM01) como o principal risco para aplicações LLM.

### Validação de entradas antes da execução

Validar argumentos de chamadas de ferramentas em dois níveis: validação de esquema e validação semântica. Uma ferramenta `fetch_page` deve rejeitar argumentos com URLs `file://` ou `localhost` para prevenir SSRF.

Ver o [modelo de ameaça de segurança de agentes IA](/learn/ai-agent-security) para a taxonomia completa de vetores de ataque no nível de ferramentas.

### Ações irreversíveis: portas human-in-the-loop

Chamadas de ferramentas com efeitos colaterais irreversíveis — enviar e-mails, excluir registros, transferir fundos, publicar conteúdo — requerem portas de confirmação humana explícitas ou verificações de idempotência antes da execução.

## A perspectiva da OpenLegion: o registro de ferramentas e a porta ACL

Cada provedor principal de LLM tem uma API de chamada de ferramentas diferente. A abstração correta: definir uma ferramenta uma vez e deixar o framework traduzi-la para a convenção correta do provedor no momento da chamada.

O registro de ferramentas da OpenLegion implementa essa abstração. Definir `search_web` uma vez. O mesh traduz a definição para OpenAI `tools`, Anthropic `tools` ou Gemini `functionDeclarations` dependendo do modelo configurado. A porta ACL não é opcional. Cada chamada de ferramenta — integrada, MCP ou personalizada — passa pela matriz de permissões por agente antes da execução.

| **Dimensão** | **OpenLegion** | **LangChain / LangGraph** | **OpenAI Agents SDK** | **CrewAI** | **Anthropic direto** |
|---|---|---|---|---|---|
| **Formato de definição de ferramenta** | Esquema único traduzido por provedor | Wrappers específicos de provedor necessários | Apenas formato OpenAI | Decorator de ferramenta CrewAI | Apenas formato Anthropic tool_use |
| **Abstração de provedor** | Sim — GPT-4o, Claude, Gemini unificados | Parcial — via integrações LangChain | Não — apenas modelos OpenAI | Parcial | Não — apenas Anthropic |
| **Aplicação ACL** | Matriz de permissões por agente, estrutural | Não integrada | Não integrada | Não integrada | Não integrada |
| **Chamadas de ferramentas paralelas** | Suportado | Suportado (dependente do provedor) | Sim — padrão na Responses API | Suportado | Sim — Claude suporta |
| **Ferramentas integradas** | Navegador, arquivo, HTTP, shell, gen. de imagens | Via ferramentas da comunidade LangChain | web_search, file_search, computer_use | Não integrado | Não integrado |
| **Integração MCP** | Nativa — mesmo pipeline ACL/orçamento | Via adaptadores LangChain MCP | Experimental | Não nativa | Não nativa |

Para a especificação MCP, arquitetura de servidores e requisitos de permissões por servidor, ver o [guia do protocolo Model Context](/learn/model-context-protocol).

## Ferramentas integradas vs ferramentas MCP vs ferramentas personalizadas

### Ferramentas integradas do runtime

Ferramentas integradas vêm pré-reforçadas pelo runtime: automação de navegador, operações de arquivo, requisições HTTP, comandos de shell, geração de imagens. Usar ferramentas integradas primeiro.

### Servidores de ferramentas MCP

Ferramentas MCP são servidas por servidores Model Context Protocol que expõem ferramentas via JSON-RPC sobre stdio ou HTTP. Ferramentas MCP requerem sandboxing explícito e escopo de permissões por servidor.

### Registro de ferramentas personalizadas

Ferramentas personalizadas são funções Python ou TypeScript que você escreve e registra no registro de ferramentas do agente. Oferecem flexibilidade total; a contrapartida é que você é responsável por validação, tratamento de erros, idempotência e controles de segurança.

<!-- SCHEMA: FAQPage -->
## Perguntas frequentes

### O que é o uso de ferramentas por agentes IA?

O uso de ferramentas por agentes IA é o mecanismo pelo qual um grande modelo de linguagem solicita a execução de funções externas — busca na web, chamadas de API, consultas a bancos de dados, operações com arquivos — emitindo JSON estruturado de chamada de ferramenta que um runtime intercepta, valida e executa. O LLM nunca executa diretamente; apenas descreve o que quer chamar e com quais argumentos.

### Como funcionam as chamadas de funções em agentes IA?

Chamadas de funções funcionam em um ciclo solicitação-execução-retorno: o agente recebe uma tarefa e uma lista de ferramentas disponíveis; o LLM emite uma chamada de ferramenta nomeando a função e fornecendo argumentos; o runtime valida esses argumentos, executa a função e injeta o resultado como resultado de ferramenta no contexto.

### O que faz um bom esquema de ferramenta para agentes IA?

Um bom esquema de ferramenta usa um nome verbo-substantivo (`search_web`, `create_ticket`), uma descrição que indica sem ambiguidade quando usá-la, parâmetros fortemente tipados com enumerações e um array `required`. tau-bench (2025) mostra que a construção incorreta de argumentos é o modo de falha mais comum.

### O que são chamadas de ferramentas paralelas e quando usá-las?

Chamadas de ferramentas paralelas permitem que um agente solicite múltiplas execuções de ferramentas em um único turno de LLM, despachadas concorrentemente. Usar chamadas paralelas quando as ferramentas são independentes — suas saídas não dependem umas das outras e não escrevem em recursos compartilhados com estado.

### Como prevenho loops de chamadas de ferramentas em agentes IA?

Loops de chamadas de ferramentas ocorrem quando um agente continua invocando ferramentas sem convergir para uma resposta final. A única prevenção confiável é um orçamento de etapas aplicado no nível de infraestrutura: um máximo estrito de chamadas de ferramentas por execução de agente, aplicado pelo orquestrador.

### Qual é o risco de segurança do uso de ferramentas por agentes IA?

O risco principal é a injeção de resultado de ferramenta: quando um agente chama uma ferramenta que retorna conteúdo controlado por um atacante que pode redirecionar o comportamento do agente. OWASP LLM Top 10 v1.1 (2025) lista a injeção de prompt como o principal risco. Mitigações incluem sanitização de saídas, atribuição de ferramentas com menor privilégio e portas human-in-the-loop para ações irreversíveis.

### Qual é a diferença entre ferramentas integradas, ferramentas MCP e ferramentas personalizadas?

Ferramentas integradas são fornecidas pelo runtime do agente com aplicação ACL já implementada. Ferramentas MCP são servidas por servidores Model Context Protocol que expõem capacidades externas via JSON-RPC; requerem sandboxing e escopo de permissões por servidor. Ferramentas personalizadas são funções que você escreve e registra, com flexibilidade total mas responsabilidade própria de validação e segurança.

### Como os diferentes provedores de LLM implementam o uso de ferramentas?

OpenAI implementa uso de ferramentas via parâmetro `tools`, `tool_calls` na resposta do assistente, mensagens de resultado `role: "tool"`. Anthropic usa blocos de conteúdo `tool_use` com blocos `tool_result` no próximo turno humano. Google Gemini usa `functionDeclarations` com partes `functionCall` em respostas e partes `functionResponse` em turnos seguintes. Os três formatos são semanticamente equivalentes mas sintaticamente diferentes.

## Definir suas ferramentas uma vez, executá-las com segurança em todo lugar

tau-bench (2025) coloca GPT-4o em 44% pass@1 em tarefas de uso de ferramentas, com construção de argumentos como categoria de falha dominante. Esquemas precisos com nomes verbo-substantivo, enumerações tipadas e exemplos de parâmetros fecham a maior parte dessa lacuna.

Para os [padrões de fluxo de trabalho agêntico](/learn/agentic-workflows) cobrindo orçamentos de etapas e prevenção de loops, e para os [benchmarks de avaliação de agentes IA](/learn/ai-agent-evaluation) medindo a confiabilidade do uso de ferramentas, esses guias estendem os fundamentos cobertos nesta página.

[Construir agentes que usam ferramentas com aplicação ACL por agente na OpenLegion →](https://openlegion.ai)
