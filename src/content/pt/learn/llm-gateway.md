---
title: "LLM Gateway: roteamento, autenticação e controle de custos para agentes IA"
description: "Um LLM gateway roteia requisições de agentes IA entre provedores de modelos, aplica limites de taxa, injeta credenciais sem expô-las ao código do agente e atribui custos de tokens por agente."
slug: /learn/llm-gateway
primary_keyword: llm gateway
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /comparison/litellm
  - /learn/ai-agent-mcp-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-monitoring
  - /learn/llm-cost-optimization
  - /learn/ai-agent-security
---

# LLM Gateway: roteamento, autenticação e controle de custos para agentes IA

Um LLM gateway é um reverse-proxy HTTP posicionado entre processos de agentes IA e endpoints de provedores de modelos upstream, operando como o plano de dados para todo o tráfego de inferência de saída. Ele resolve handles de chaves opacos na camada de rede antes do encaminhamento, aplica cotas de limitação por tenant através de contadores de janela deslizante, emite telemetria de gastos OpenTelemetry por requisição e abre circuit breakers quando a latência P99 upstream excede os limites configurados — sem exigir nenhuma alteração no código da aplicação do agente. Qualquer frota com três ou mais consumidores de inferência simultâneos deve implantar um.

<!-- SCHEMA: DefinitionBlock -->

> Um **LLM gateway** é um reverse-proxy HTTP situado no plano de dados entre processos de agentes IA e endpoints de provedores de modelos, fornecendo resolução de chaves opacos na camada de rede, aplicação de cotas por tenant via contadores de janela deslizante, telemetria de gastos OpenTelemetry por requisição e failover com circuit breaker — todos como primitivas de infraestrutura invisíveis para o código de aplicação.

## O problema do plano de dados na inferência multi-agente

Sem um plano de dados de inferência dedicado, cada processo agente gerencia suas próprias conexões upstream: resolução de chaves a partir do estado do ambiente, sem cota por processo, sem telemetria por requisição e sem visibilidade sobre se o endpoint upstream está degradado. Com dois agentes é gerenciável. Com vinte, produz quatro modos de falha distintos.

### Exfiltração de chaves por introspecção do ambiente

Cada processo agente que mantém uma chave de provedor em texto simples em seu ambiente está a uma instrução adversarial de vazá-la. A superfície de ataque é o próprio ambiente do processo: `os.environ`, `/proc/self/environ` em hosts Linux, rastreamentos de erro detalhados que serializam o estado do processo, e configurações de log de depuração que capturam cabeçalhos HTTP de saída incluindo campos Authorization.

Ataques de injeção de prompt que fazem agentes ecoar o estado do ambiente são uma classe de ataque documentada contra agentes que mantêm chaves em texto simples (OWASP LLM01:2025). A correção estrutural não é melhor validação de entrada: é remover completamente a chave em texto simples do processo agente. Um LLM gateway que resolve handles opacos (`$CRED{openai}`) na camada de rede antes que o cabeçalho Authorization seja escrito significa que o processo agente nunca mantém material que possa ser exfiltrado.

O mesh do OpenLegion implementa isso no nível de infraestrutura: handles `$CRED{}` se resolvem na fronteira do host mesh. Contêineres de agentes são estruturalmente incapazes de alcançar o valor resolvido — não porque são instruídos a não fazê-lo, mas porque a resolução acontece fora do seu espaço de endereçamento.

### Esgotamento de cotas por limitação de chaves compartilhadas

Provedores de modelos upstream limitam no nível da chave API. Em uma frota onde vinte processos agentes compartilham uma chave, um único processo emitindo requisições a 10 vezes sua taxa esperada — seja por uma tempestade de retentativas, um loop descontrolado ou uma carga útil de injeção de prompt causando chamadas de inferência ilimitadas — pode levar a chave ao território de limitação para os outros dezenove.

Um gateway aplica cotas por tenant usando um contador de janela deslizante indexado no identificador do agente. Quando o contador de um agente atinge o teto configurado, o gateway responde com HTTP 429: nenhuma requisição upstream é enviada, nenhuma cota do provedor é consumida, e agentes irmãos não são afetados.

A cota por agente é também a medida de mitigação estrutural para OWASP LLM10:2025 (Consumo Ilimitado) — o padrão onde instruções adversariais fazem um agente emitir chamadas de inferência ilimitadas.

### Observabilidade upstream ausente

Sem um plano de dados de inferência, a telemetria por requisição requer instrumentação dentro de cada processo agente. Isso é tanto redundante quanto inconsistente. Um gateway emite registros de log OTLP OpenTelemetry por requisição na camada de rede, capturando: identificador do agente, endpoint upstream, nome do modelo, contagem de tokens de entrada, contagem de tokens de saída, tokens de cache-hit, status de resposta HTTP e duração da requisição.

O registro de gastos por requisição — `tokens_entrada × preço_por_1k_entrada + tokens_saída × preço_por_1k_saída` — acumula em um livro-razão de gastos por agente. Este livro-razão suporta tetos de gastos diários e mensais, além de alertas de anomalias de gastos.

### Degradação upstream invisível

Endpoints de provedores se degradam. A latência tail P99 no GPT-4o durante eventos de capacidade pode atingir 12 segundos (benchmark de infraestrutura OpenLegion, junho de 2026). Sem um circuit breaker no plano de dados, cada agente da frota absorve essa degradação em cada requisição.

Um gateway com circuit breaker rastreia taxas de erro e latência P99 por endpoint. Quando um limite de falha configurável é ultrapassado — por exemplo, cinco respostas 5xx consecutivas ou P99 excedendo 8 segundos em uma janela de 30 segundos — o circuito abre: requisições subsequentes são imediatamente redirecionadas para o endpoint de fallback configurado.

O benchmark de junho de 2026 do OpenLegion mediu a topologia GPT-4o primário → Claude 3.5 Sonnet de fallback: P99 caiu de 12 segundos para 3,1 segundos (3,9×) sem nenhuma modificação no código do agente.

## Arquitetura do gateway: plano de dados vs. plano de controle

### O plano de dados: aplicação por requisição

Cada requisição de inferência atravessa o plano de dados em sequência:

1. **Terminação TLS**: o processo agente conecta-se ao gateway via TLS. Para implantações mTLS, o agente também apresenta um certificado. mTLS elimina a necessidade de tokens de autenticação por requisição entre agente e gateway.

2. **Resolução de identidade de carga de trabalho**: o gateway mapeia a carga de trabalho conectada para uma identidade de tenant. Em implantações mTLS, o SPIFFE SVID incorporado no certificado cliente carrega a identidade.

3. **Resolução de handle opaco**: o gateway inspeciona o cabeçalho Authorization de saída em busca de padrões de handles `$CRED{}`. Handles correspondentes são resolvidos contra o store de segredos do gateway.

4. **Verificação de cota**: o gateway incrementa o contador de janela deslizante do tenant. Se o contador excede o teto, o gateway retorna 429 com cabeçalhos `Retry-After`. Nenhuma conexão upstream é aberta.

5. **Verificação do circuit breaker**: o gateway avalia o estado do circuito do endpoint alvo. Se o circuito está aberto, a requisição é imediatamente redirecionada para o fallback.

6. **Dispatch upstream**: o gateway abre uma conexão do seu próprio pool para o endpoint upstream e transmite a resposta de volta.

7. **Emissão de telemetria**: ao completar a resposta, o gateway escreve um registro de log OTLP.

Overhead total no caminho quente: 0,7–2,1 ms. No caminho frio (cache miss): 2,6–6,6 ms. Com latência de inferência do provedor de 500 ms–30 s, o overhead do caminho quente é inferior a 0,5% do tempo total de ida e volta.

### O plano de controle: configuração e política

O plano de controle governa o comportamento do plano de dados. Responsabilidades principais:

**Configuração de identidade de tenant e cota**, **Topologia de endpoints**, **Escopo de permissão de handles**: quais identidades de tenant têm permissão para resolver quais handles. Um tenant com escopo `openai:read` pode resolver `$CRED{openai}` mas não `$CRED{anthropic}`. Isso previne movimento lateral entre tenants.

**Política de auditoria**: quais campos aparecem nos registros de log OTLP.

A API do plano de controle não deve ser acessível a partir de redes do lado do agente. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, corrigido em v1.83.0) demonstrou o que acontece quando o caminho de escrita de configuração do plano de controle é acessível pela rede sem autorização suficiente.

## Topologias de implantação

### Ingress centralizado

Um único cluster gateway lida com todo o tráfego de inferência de saída da frota de agentes. Adequado para frotas de até aproximadamente 50 agentes onde a simplicidade operacional tem prioridade.

### Padrão sidecar

Cada contêiner agente executa um processo gateway em sua interface loopback. O domínio de falha é um contêiner agente. Adequado para grandes frotas (50+ agentes) onde o isolamento de falhas por agente é a prioridade.

### Proxy nativo ao mesh

No OpenLegion, o proxy de inferência é um serviço mesh. O modelo nativo ao mesh lida com identidade de carga de trabalho nativamente: cada contêiner agente recebe uma identidade emitida pelo mesh no momento do spawn.

## A posição do OpenLegion

O conjunto de recursos do LLM gateway — mTLS, aplicação de cota de janela deslizante, telemetria de gastos OTLP, failover com circuit breaker — não é infraestrutura opcional para frotas multi-agente. É o plano de dados mínimo viável.

Três medições dos testes de infraestrutura do OpenLegion de junho de 2026 quantificam o que está em jogo:

**Latência tail P99 sem failover**: 12 segundos em implantações apenas com GPT-4o durante eventos de capacidade do provedor. Com Claude 3.5 Sonnet como fallback de circuit breaker: 3,1 segundos. A melhoria de 3,9× não exigiu nenhuma alteração no código da aplicação do agente.

**Superfície de exfiltração de chaves**: em uma frota de 20 agentes onde todos mantêm chaves em texto simples, um único agente comprometido por injeção de prompt (OWASP LLM01:2025) pode exfiltrar chaves. Em uma frota mediada por gateway com resolução de handle opaco, o mesmo agente comprometido não mantém material que possa ser exfiltrado.

**Cobertura OWASP LLM**: a aplicação de cota por tenant no gateway aborda LLM10:2025 (Consumo Ilimitado). A aplicação de escopo de handle aborda LLM06:2025 (Agência Excessiva).

Para equipes avaliando [padrões de gerenciamento de credenciais para agentes IA](/learn/credential-management-ai-agents), a resolução de handle opaco do gateway é a implementação no nível de implantação do padrão vault-proxy descrito lá.

## Comparação de LLM gateways

| **Capacidade** | **Auto-hospedado (LiteLLM)** | **OpenAI nativo** | **OpenLegion mesh proxy** |
|---|---|---|---|
| **Modelo de resolução de chaves** | Store de chaves Postgres | Serviço gerenciado | Handle opaco → vault na camada de rede |
| **Identidade de carga de trabalho mTLS** | Não suportado | Não suportado | SPIFFE SVID por contêiner agente |
| **Aplicação de cota** | Baseado em configuração, por chave | Limites por org | Contador de janela deslizante, por tenant |
| **Failover com circuit breaker** | Baseado em plugin | Não disponível | Nativo, com sonda half-open |
| **Telemetria de gastos OTLP** | Parcial | Não exportada | Por requisição, todos os campos |
| **Isolamento do plano de controle** | Manual; exposto por padrão | Gerenciado | Apenas sub-rede mesh privada |
| **Histórico de CVE (2024–2026)** | GHSA-53mr-6c8q-9789 + outros | Nenhum público | Nenhum |

## Selecionando um gateway para sua frota

### mTLS vs. autenticação por bearer token

mTLS (mutual TLS) autentica tanto o cliente (agente) quanto o servidor (gateway) na camada de handshake TLS, antes de qualquer payload HTTP ser trocado. O certificado cliente carrega um SPIFFE SVID — uma identidade de carga de trabalho verificável criptograficamente. Nenhum bearer token é transmitido em cabeçalhos.

Para frotas multi-agente em produção, mTLS com SVIDs emitidos por SPIFFE é o modelo de autenticação correto. Elimina completamente a superfície de gerenciamento de tokens.

### Contadores de cota de janela deslizante vs. janela fixa

Contadores de janela fixa são reiniciados em limites de clock. Um agente pode fazer burst ao dobro de sua taxa nominal. Contadores de janela deslizante mantêm uma contagem contínua sobre um intervalo de tempo contínuo sem limites de clock para explorar. Para cargas de trabalho de inferência, a aplicação de janela deslizante é o modelo correto.

### Requisitos de granularidade de telemetria

Registros OTLP por requisição são o mínimo para observabilidade útil da frota. Avalie se o gateway fornece estes campos em cada registro: `agent_id`, `model_id`, `input_tokens`, `output_tokens`, `cache_tokens`, `upstream_latency_ms`, `upstream_status`. Gateways que agregam telemetria não conseguem suportar detecção de anomalias de gastos por agente.

## Começar

**Implante frotas de inferência multi-agente com identidade de carga de trabalho mTLS, aplicação de cota de janela deslizante e telemetria de gastos OTLP por requisição.**
[Começar no OpenLegion](https://app.openlegion.ai) | [Ler a documentação](https://docs.openlegion.ai) | [Comparar LiteLLM vs OpenLegion](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## Perguntas frequentes

### O que é um LLM gateway?

Um LLM gateway é um reverse-proxy HTTP posicionado no plano de dados entre processos de agentes IA e endpoints de provedores de modelos upstream. Ele resolve handles de chaves opacos na camada de rede (processos agentes nunca mantêm chaves em texto simples), aplica limites de cota de janela deslizante por tenant antes do dispatch upstream, emite telemetria de gastos OpenTelemetry por requisição e abre circuit breakers quando endpoints upstream excedem limites configurados. Essas funções operam como primitivas de infraestrutura que não exigem alterações no código da aplicação do agente.

### Preciso de um LLM gateway se uso apenas um provedor de modelos?

Frotas de provedor único se beneficiam de três funções do gateway: resolução de handle opaco, aplicação de cota por tenant e telemetria de gastos OTLP por requisição. O overhead do caminho quente é 0,7–2,1 ms — negligível comparado à latência de inferência do provedor de 500 ms a 30 segundos.

### Como funciona o failover com circuit breaker em um LLM gateway?

O gateway rastreia taxas de erro e latência P99 por endpoint dentro de janelas de observação deslizantes. Quando um limite de falha configurável é ultrapassado — por exemplo, cinco respostas 5xx consecutivas, ou P99 excedendo 8 segundos em uma janela de 30 segundos — o circuito abre: todas as requisições subsequentes são imediatamente encaminhadas ao endpoint de fallback configurado. Após um período de resfriamento, o gateway despacha uma sonda half-open ao primário. Uma sonda bem-sucedida fecha o circuito; uma sonda com falha reinicia o resfriamento. O benchmark de junho de 2026 do OpenLegion mediu uma redução de P99 de 12 segundos para 3,1 segundos em uma topologia GPT-4o → Claude 3.5 Sonnet.

### O que é mTLS e por que importa para LLM gateways?

mTLS (mutual TLS) autentica tanto o processo agente conectando quanto o gateway na camada de handshake TLS, antes de qualquer payload HTTP ser trocado. O agente apresenta um certificado cliente com um SPIFFE SVID — uma identidade de carga de trabalho verificável criptograficamente. Nenhum bearer token é transmitido em cabeçalhos HTTP; nenhum token precisa ser emitido, distribuído ou rotacionado. A identidade de carga de trabalho derivada do SVID impulsiona a aplicação do escopo de handle.

### Qual é a diferença entre aplicação de cota de janela deslizante e janela fixa?

Contadores de janela fixa são reiniciados em limites de clock. Um agente pode fazer burst ao dobro de sua taxa nominal fazendo requisições em velocidade máxima nos últimos segundos de uma janela e nos primeiros segundos da próxima. Contadores de janela deslizante mantêm uma contagem contínua sem limites de clock para explorar. Para cargas de trabalho de inferência, a aplicação de janela deslizante é o modelo correto.

### Como a telemetria OTLP por requisição difere dos relatórios de gastos agregados?

Registros OTLP OpenTelemetry por requisição capturam campos individuais em cada chamada de inferência: identificador do agente, variante do modelo, tokens de entrada, tokens de saída, tokens de cache-hit, latência upstream e status HTTP. Esses registros se acumulam em livros-razão de gastos por agente que suportam tetos de orçamento diários e mensais, além de detecção de anomalias de gastos. Relatórios de gastos agregados não conseguem suportar detecção de anomalias.

### O que o plano de controle do gateway não deve expor às redes do lado do agente?

O plano de controle gerencia configuração de cotas, topologia de endpoints, escopos de permissão de handles e política de auditoria. Deve ser implantado em uma sub-rede privada sem caminho de acesso externo. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, corrigido em v1.83.0) documentou autorização insuficiente na API de gerenciamento. Redes do lado do agente devem atingir apenas a porta do plano de dados do gateway.

### Como calibrar os limites do circuit breaker para minha frota?

Colete histogramas de latência P50, P95 e P99 por endpoint de provedor durante duas a quatro semanas de tráfego de produção. O limite de abertura do circuit breaker deve ser definido em um valor P99 claramente degradado em relação ao SLA normal do provedor — tipicamente 2–3× o P99 mediano. O período de resfriamento antes da sonda half-open deve exceder o tempo de recuperação típico do provedor — 30–60 segundos é uma linha de base razoável.
