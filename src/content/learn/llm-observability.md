---
title: "LLM Observability: Token Traces, TTFT SLOs, and Prompt Logging Security"
description: "LLM observability: OTel Gen AI spans, Langfuse prompt registry, TTFT SLO design, Anthropic token counting API, OpenLLMetry zero-code tracing, and OWASP LLM02 prompt logging security risks."
slug: /learn/llm-observability
primary_keyword: llm observability
last_updated: "2026-07-10"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-security
  - /learn/llm-cost-optimization
  - /learn/llm-prompt-caching
  - /learn/llm-routing
  - /learn/llm-structured-output
---

# LLM Observability: Token Traces, TTFT SLOs, Cost Attribution, and Prompt Logging Security

LLM observability is the practice of measuring the LLM inference layer — capturing token counts, time to first token, cost per call, and optionally prompt content — so that cost spikes, latency regressions, and quality degradations can be traced to a specific model call or prompt version. The challenge: prompts contain PII and confidential context, making the data needed for debugging also the data most legally sensitive. OTel Gen AI conventions, Langfuse, and OpenLLMetry are the primary tools.

<!-- SCHEMA: DefinitionBlock -->

> **LLM observability** is the practice of measuring, logging, and analyzing the LLM inference layer in production — capturing token usage (input and output tokens per call), latency (time to first token, end-to-end response time), cost per call (token counts × provider pricing), model and prompt version, and optionally prompt and response content — using standardized OpenTelemetry Gen AI semantic conventions so that LLM traces can be correlated with application traces in any OTel-compatible backend.

## LLM Observability vs Agent Observability: The Two Layers

### The Inference Layer vs the Agent Task Layer

Production AI systems have two distinct observability layers:

**LLM inference layer — this page:** per-call token counts (`input_tokens`, `output_tokens`), TTFT (time from request to first streaming token), end-to-end latency, model version, cost per call (token counts × provider pricing), prompt version, finish reason (`stop`, `length`, `tool_calls`, `content_filter`). Instrumented with OTel Gen AI spans. Tools: Langfuse, OpenLLMetry, Helicone, Datadog LLM Observability.

**Agent task layer — [AI agent observability and task-level success metrics](/learn/ai-agent-observability):** task completion rate, tool call counts and success rates, inter-agent message volume, agent loop iteration count, agent-level cost attribution across all LLM calls in a task. Tools: AgentOps, LangSmith, Phoenix (Arize).

**Why the distinction matters:** a single agent task may involve 10–50 LLM calls. The inference layer tells you which specific call was slow or expensive. The agent task layer tells you which task types have poor completion rates. A P99 TTFT spike in inference-layer traces may explain why a specific agent task type is failing at the task layer — but you need both layers to make the connection.

### What LLM Observability Measures

Four measurement domains:

**1. Latency:**
- **TTFT (time to first token):** from request submission to the first token received in a streaming response. Primary user experience metric for interactive agents — not end-to-end response time. P99 target: <2,000ms for interactive, <10,000ms for batch.
- **TPOT (time per output token):** streaming throughput after the first token. Calculated as `(e2e_latency_ms - ttft_ms) / output_tokens`. GPT-4o typically 8–15ms/token; Claude 3.5 Haiku typically 5–10ms/token.
- **E2E latency:** total time from request to complete response. Includes TTFT + (TPOT × output_token_count).

**2. Token usage:**
- `input_tokens` per call: system prompt + conversation history + user message + tool schemas
- `output_tokens` per call: model response length
- Trends by prompt version, model, and agent type

**3. Cost per call:**
```
cost = (input_tokens × input_$/MTok / 1,000,000) + (output_tokens × output_$/MTok / 1,000,000)
```
With Anthropic prompt caching: substitute `cache_write_input_tokens × write_price` and `cache_read_input_tokens × read_price` for the cached token portion. All four token counts are returned in the `usage` field of the API response.

**4. Quality signals:**
- **finish_reason `stop`:** model completed normally
- **finish_reason `length`:** hit `max_tokens` before completing — likely response truncation, may indicate output schema violations
- **finish_reason `content_filter`:** content policy rejection
- **finish_reason `tool_calls`:** model chose to dispatch a tool rather than respond in text
- **Error rate:** API errors, rate limit errors (HTTP 429), timeout errors

For the caching layer that determines `cache_read_input_tokens` vs `cache_write_input_tokens`, see [LLM prompt caching and cache hit rate monitoring](/learn/llm-prompt-caching).

## OpenTelemetry Gen AI Semantic Conventions

### Gen AI Span Attributes: The Standardized Schema

OpenTelemetry Gen AI semantic conventions (v1.29+, merged November 2024) define standardized span attributes for LLM inference calls. Before v1.29, draft conventions varied across instrumentation libraries, making traces from different tools incompatible. v1.29 is the first stable release.

**Required span attributes:**

| **Attribute** | **Type** | **Example** | **Description** |
|---|---|---|---|
| **`gen_ai.system`** | string | `"openai"` | LLM provider — `openai`, `anthropic`, `google_vertex_ai`, `aws_bedrock` |
| **`gen_ai.request.model`** | string | `"gpt-4o"` | Model requested |
| **`gen_ai.usage.input_tokens`** | int | `1842` | Input token count for this call |
| **`gen_ai.usage.output_tokens`** | int | `347` | Output token count for this call |
| **`gen_ai.response.model`** | string | `"gpt-4o-2024-08-06"` | Actual model used (may differ from requested) |
| **`gen_ai.response.finish_reasons`** | string[] | `["stop"]` | Array of finish reasons |
| **`gen_ai.operation.name`** | string | `"chat"` | Operation type: `chat`, `text_completion`, `embeddings`, `tool` |

**Optional request attributes:**

| **Attribute** | **Type** | **Example** |
|---|---|---|
| **`gen_ai.request.max_tokens`** | int | `4096` |
| **`gen_ai.request.temperature`** | float | `0.7` |
| **`gen_ai.request.top_p`** | float | `0.95` |

**Optional content attributes (PII risk — see security section before enabling):**
- `gen_ai.prompt`: full prompt text — scrub PII before logging
- `gen_ai.completion`: full response text — scrub PII before logging

These enable semantic conventions as **span events** (`gen_ai.content.prompt`, `gen_ai.content.completion`) that can be sampled at a lower rate than the parent span.

**Custom attribute for TTFT (not yet in OTel v1.29):** teams add `gen_ai.response.ttft_ms` as a custom attribute. An open RFC proposes standardizing TTFT as a first-class attribute in a future OTel Gen AI release.

### Implementing OTel Gen AI Instrumentation

**Approach 1 — Manual instrumentation (full control):**

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("gen_ai.chat") as span:
    span.set_attributes({
        "gen_ai.system": "openai",
        "gen_ai.request.model": "gpt-4o",
        "gen_ai.request.max_tokens": 2048,
    })
    request_start = time.monotonic()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        stream=True,
    )
    ttft_ms = None
    for chunk in response:
        if chunk.choices[0].delta.content and ttft_ms is None:
            ttft_ms = (time.monotonic() - request_start) * 1000
            span.set_attribute("gen_ai.response.ttft_ms", ttft_ms)
    span.set_attributes({
        "gen_ai.usage.input_tokens": response.usage.prompt_tokens,
        "gen_ai.usage.output_tokens": response.usage.completion_tokens,
        "gen_ai.response.finish_reasons": [response.choices[0].finish_reason],
    })
```

**Approach 2 — Auto-instrumentation via OpenLLMetry (zero code changes):**

```python
from opentelemetry.instrumentation.openai import OpenAIInstrumentor

OpenAIInstrumentor().instrument()
# All subsequent openai SDK calls are now automatically traced
# No changes to call sites required
```

**OTel collector configuration:** export spans to a self-hosted OTel collector that fans out to multiple backends — Jaeger for trace visualization, Prometheus for metrics aggregation, Grafana for dashboards. Self-hosting the collector avoids vendor lock-in and keeps trace data in your infrastructure.

For the routing layer that uses these latency signals to redirect calls to lower-latency providers when TTFT SLOs breach, see [LLM routing and latency-based model selection](/learn/llm-routing).

## LLM Observability Tools: Langfuse, OpenLLMetry, and Helicone

### Langfuse: Open-Source Prompt Tracking and Cost Attribution

**Langfuse** (langfuse.com, github.com/langfuse/langfuse, **30,000+ GitHub stars, 2026**): open-source LLM observability platform with prompt version tracking and cost attribution.

**Key capabilities:**

**Prompt registry:** version-controlled prompt templates stored in Langfuse. Agents fetch the current prompt version at startup: `langfuse.get_prompt("agent-system-prompt")`. Each LLM call is traced with the prompt version that produced it. If a cost spike correlates with a prompt version change, the rollback is one API call — no code deployment.

**Cost attribution per prompt version:** the Langfuse dashboard shows cost breakdown by prompt version, model, and user. If prompt v4 costs 30% more per call than prompt v3, the specific cause (longer system prompt, more tool schemas, longer output) is visible in the input/output token distribution per version.

**Evaluation datasets:** create golden evaluation sets from production traces. Run evaluations against new prompt versions before deployment — catching quality regressions before they affect users.

**Trace visualization:** full trace tree including LLM calls, tool calls, retrieval steps, and agent handoffs.

**Self-hosted deployment:** Docker Compose or Kubernetes. The self-hosted deployment keeps prompt/response data in the operator's database, eliminating the third-party data processing relationship that makes Langfuse Cloud an OWASP LLM02 risk for deployments with sensitive prompt content.

**Integrations:** Python/JS SDK, `LangfuseCallbackHandler` for LangChain, LlamaIndex callback, `LangfuseOpenAI` wrapper for drop-in OpenAI client replacement.

**Langfuse Cloud vs self-hosted:** Cloud stores trace data on Langfuse's servers. Self-hosted runs entirely within the operator's VPC. For any deployment where system prompts contain proprietary business logic, user prompts contain PII, or regulatory requirements (HIPAA, GDPR) apply — self-hosted is the only compliant option.

### OpenLLMetry: Zero-Code OTel Auto-Instrumentation

**OpenLLMetry** (Traceloop, github.com/traceloop/openllmetry): OTel-compatible LLM observability library with zero-code auto-instrumentation for 15+ providers.

**Installation and setup:**

```bash
pip install opentelemetry-instrumentation-openai
pip install opentelemetry-instrumentation-anthropic
```

```python
from opentelemetry.instrumentation.openai import OpenAIInstrumentor
from opentelemetry.instrumentation.anthropic import AnthropicInstrumentor

OpenAIInstrumentor().instrument()
AnthropicInstrumentor().instrument()
# All existing OpenAI and Anthropic calls are now traced
```

**Supported providers:** OpenAI, Anthropic, Cohere, AWS Bedrock, VertexAI, Hugging Face Transformers, LangChain, LlamaIndex, Haystack, and others.

**Export targets:** any OTel-compatible backend via standard OTLP — Jaeger, Grafana Tempo, Honeycomb, Datadog, New Relic, Dynatrace. No proprietary format. No vendor lock-in.

**License:** Apache 2.0.

**When to choose OpenLLMetry:** teams that already have an OTel observability stack and want LLM traces integrated uniformly with HTTP, database, and message queue traces — not in a separate LLM observability silo. OpenLLMetry is instrumentation infrastructure; it emits spans to your existing backend.

**When to choose Langfuse:** teams that need a full-featured LLM observability application with a prompt registry, cost attribution dashboards, and evaluation workflows — and are willing to self-host the platform or accept Langfuse Cloud's data handling.

### Helicone: LLM Proxy with Built-In Observability

**Helicone** (helicone.ai): LLM observability via proxy. Change the base URL in the OpenAI client from `api.openai.com` to `oai.helicone.ai` and add a `Helicone-Auth` header — all LLM calls are automatically logged with token counts, latency, cost, and optionally prompt/response content. No SDK changes required.

**Capabilities:** cost dashboard (per model, per user, per prompt tag), P50/P95/P99 TTFT and e2e latency percentiles, request replay for debugging, prompt templating and version tracking, rate limiting and caching at the proxy layer.

**Data sovereignty:** by default, all request/response data flows through Helicone's servers — OWASP LLM02 risk for sensitive prompt content. Helicone offers an on-prem (BYOC) deployment for enterprises with data residency requirements.

**Proxy latency overhead:** routing through Helicone adds approximately **20–50ms** round-trip overhead vs direct API calls. This overhead counts against TTFT.

**Helicone's proxy caching** caches responses at the Helicone layer — this bypasses provider-native caching (Anthropic prompt caching, OpenAI automatic caching) and does not benefit from provider-side KV cache infrastructure. For cost optimization via caching, prefer provider-native mechanisms.

For the structured output validation layer downstream of LLM calls, see [LLM structured output validation and schema enforcement](/learn/llm-structured-output).

## Latency Measurement: TTFT, TPOT, and SLO Design

### Measuring TTFT and End-to-End Latency

**Why TTFT matters more than end-to-end latency for interactive agents:**

In a streaming response, the user sees text start appearing after TTFT milliseconds. A 5,000-token response that streams at 10ms/token (Claude 3.5 Haiku TPOT) takes 50 seconds total — but if TTFT is 800ms, the user sees the first word in under a second and experiences the response as fast. If TTFT is 3,000ms on the same response, the user stares at a blank screen for 3 seconds before anything appears and experiences the response as slow — even though the total generation time is identical.

**Measuring TTFT in Python (OpenAI streaming):**

```python
import time
from openai import OpenAI

client = OpenAI()
request_start = time.monotonic()
ttft_ms = None

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content and ttft_ms is None:
        ttft_ms = (time.monotonic() - request_start) * 1000
        # Record as custom OTel span attribute: gen_ai.response.ttft_ms
```

**OTel Gen AI conventions v1.29** do not yet include a standardized TTFT attribute. Teams add it as a custom attribute (`gen_ai.response.ttft_ms`). An open RFC proposes standardizing TTFT in a future OTel Gen AI release.

**TPOT calculation:**
```python
tpot_ms = (e2e_latency_ms - ttft_ms) / output_tokens
```

Reference throughput: GPT-4o typically 8–15ms/token, Claude 3.5 Haiku typically 5–10ms/token in normal load conditions.

### SLO Design: Interactive vs Batch Latency Targets

**P99 TTFT SLO targets:**

| **Workload** | **P99 TTFT SLO** | **Rationale** |
|---|---|---|
| **Interactive agents** (user waits for real-time streaming) | < 2,000ms | Above 2s TTFT is perceived as broken by most users; Stripe and Vercel engineering teams have published 2s as their interactive LLM SLO target |
| **Batch processing agents** (background, no human waiting) | < 10,000ms | Higher TTFT acceptable; can route to slower but cheaper or more capable models |
| **Embedding calls** | < 200ms | High volume, typically fast; latency matters for RAG pipeline throughput |

**SLO alert configuration:**
- Alert on P99 TTFT exceeding the SLO threshold for **5 consecutive minutes**
- Circuit breaker response: route to a lower-latency provider when SLO breaches accumulate
- SLO budget burn rate: if the 30-day error budget for interactive TTFT < 2s allows 1% of calls to exceed 2s, burning more than 5% of the monthly budget in 1 hour triggers immediate escalation

**Prometheus query for P99 TTFT by provider and model:**
```promql
histogram_quantile(
  0.99,
  sum(rate(gen_ai_response_ttft_ms_bucket[5m])) by (le, gen_ai_system, gen_ai_request_model)
)
```

This query assumes `gen_ai_response_ttft_ms` is instrumented as a Prometheus histogram (not a gauge). Record it as a histogram at the OTel collector using a histogram data point, not a gauge.

## Security: Prompt Logging, OWASP LLM02, and PII in Traces

### OWASP LLM02: Sensitive Information Disclosure via Prompt Logging

**OWASP LLM Top 10 2025 — LLM02 (Sensitive Information Disclosure)** explicitly identifies raw prompt logging to third-party observability platforms as a risk vector.

**What production prompts contain:**
- **PII:** user names, email addresses, medical data, financial data — embedded in user messages or in retrieved context (RAG systems retrieve documents containing PII and include them in the prompt)
- **Proprietary business logic:** internal pricing rules, unreleased roadmap details, competitive analysis — often embedded in system prompts
- **Confidential system instructions:** security policies, access control rules, tool permissions — encoded in system prompts
- **Credentials:** API keys, tokens, connection strings that users accidentally include in messages — common in developer-facing agents

**Sending raw prompt-response pairs to any third-party SaaS creates:**
1. A third-party data processing relationship requiring a **GDPR Article 28 Data Processing Agreement (DPA)**
2. A **HIPAA Business Associate Agreement (BAA)** requirement if health data appears in prompts
3. A **SOC 2 audit dependency** on the observability vendor's controls — your compliance depends on their security posture
4. A new breach surface: if the observability vendor is compromised, all logged prompts are exposed

**The correct mitigation:** never log raw prompts to third-party SaaS without explicit data classification review. Self-host observability infrastructure or use observability platforms that process data in your VPC. Metadata-only logging (token counts, latency, cost, finish reason — no content) satisfies 90% of operational observability requirements.

For the complete OWASP LLM Top 10 threat model beyond prompt logging — prompt injection, insecure tool use, and model denial of service — see [AI agent security and OWASP LLM threat model](/learn/ai-agent-security).

### PII Scrubbing and Safe Prompt Logging Patterns

When content logging is operationally required (debugging hallucinations, measuring prompt regression), these patterns reduce risk:

**Pattern 1 — PII scrubbing before logging:**

Apply a PII detection library to identify and redact entities from prompt/response text before sending to the observability backend:

- **Microsoft Presidio** (github.com/data-privacy-stack/presidio, MIT): open-source PII detection and anonymization; real-time scrubbing at <10ms per call for typical prompt lengths; supports English and 20+ other languages; entity types: `PERSON`, `EMAIL_ADDRESS`, `PHONE_NUMBER`, `CREDIT_CARD_NUMBER`, `SSN`, `MEDICAL_RECORD_NUMBER`, `IP_ADDRESS`
- **AWS Comprehend PII:** managed service; no infrastructure to run
- **Google Cloud DLP:** managed service with custom info type definitions

After scrubbing, the logged text contains `[REDACTED_PERSON]` tokens in place of names — sufficient for prompt debugging without PII exposure.

**Pattern 2 — Metadata-only logging:**

Log only token counts, latency, cost, model, finish reason, and prompt version hash (not prompt content). This satisfies latency SLO monitoring, cost attribution, and anomaly detection requirements without any content risk. The trade-off: debugging hallucinations requires the actual prompt; metadata-only logging cannot support root-cause analysis of content-level quality issues.

**Pattern 3 — Sampled content logging:**

Log full prompt/response content for 1–5% of calls. The sample provides debugging context without logging all production data. Apply stratified sampling to ensure coverage across agent types and prompt versions, not just random sampling (which would over-represent the most common path).

**Pattern 4 — Self-hosted observability:**

Deploy Langfuse self-hosted (Docker Compose or Kubernetes) within your VPC. Prompt/response data stays in your database. The third-party data processing relationship is eliminated entirely — no DPA required, no vendor breach surface.

### Anthropic Token Counting: Pre-Flight Budget Enforcement

**Anthropic token counting beta** (HTTP header: `anthropic-beta: token-counting-2024-11-01`, approximately November 2024): a pre-flight API endpoint that estimates token count without running inference.

**API:** `POST /v1/messages/count_tokens` with the same request body as a `/v1/messages` call, but **without `max_tokens`**.

**Response:** `{"input_tokens": N}` — the estimated token count for the given messages array.

**No billing for this call.** Token counting is free.

**Use cases:**

**Pre-flight budget enforcement:** before sending a request to the model, check if `input_tokens` exceeds the per-agent token budget for this call. If yes, truncate the oldest conversation history or summarize context before paying for inference.

```python
import anthropic
client = anthropic.Anthropic()

count_response = client.beta.messages.count_tokens(
    model="claude-3-5-sonnet-20241022",
    system=system_prompt,
    messages=conversation_history,
    betas=["token-counting-2024-11-01"],
)
input_tokens = count_response.input_tokens

if input_tokens > PER_AGENT_TOKEN_BUDGET:
    # Truncate oldest messages and retry count
    conversation_history = truncate_history(conversation_history)
```

**Context window management:** verify the full context (system prompt + history + user message + tool schemas) fits within the model's context window (200k for Claude 3.5 Sonnet) before sending. Prevents `400 context window exceeded` errors at inference time.

**Cost estimation:** `input_tokens × $3.00/MTok / 1,000,000` = estimated input cost for Claude 3.5 Sonnet. Use for pre-flight cost approval gating in high-value workflows.

**Note:** the token count API does not account for `cache_creation_input_tokens` or `cache_read_input_tokens` — those are determined by the actual inference call based on current cache state. Use it for planning and budget gating, not for predicting the exact billed token count when caching is active.

## Cost Attribution at the Inference Layer

### Per-Call Cost Calculation and Tracking

**Per-call cost formula:**

```
cost = (input_tokens × input_$/MTok / 1e6)
     + (output_tokens × output_$/MTok / 1e6)
```

With **Anthropic prompt caching** (all four token counts in `usage` field):
```
cost = (cache_write_input_tokens × write_$/MTok / 1e6)  # $3.75/MTok for Claude 3.5 Sonnet
     + (cache_read_input_tokens × read_$/MTok / 1e6)   # $0.30/MTok — 90% discount
     + (uncached_input_tokens × input_$/MTok / 1e6)    # $3.00/MTok
     + (output_tokens × output_$/MTok / 1e6)           # $15.00/MTok
```

**Cost attribution dimensions to track:**

| **Dimension** | **Debug question** | **OTel label** |
|---|---|---|
| **Model** | Which models drive cost? Are GPT-4o calls justified by task complexity? | `gen_ai.request.model` |
| **Prompt version** | Did the latest prompt change increase cost per call? | `prompt_version` (custom) |
| **Agent type** | Which agent roles are most expensive? | `agent_id` (custom) |
| **User/tenant** | Which tenants generate the most cost? (for billing) | `tenant_id` (custom) |

**OTel metric implementation:** define a `gen_ai.cost` gauge that records cost per call as a float with label dimensions `gen_ai.system`, `gen_ai.request.model`, `prompt_version`, and `agent_id`. Aggregate in Prometheus:

```promql
sum by (agent_id, gen_ai_request_model) (
  increase(gen_ai_cost_total[1d])
)
```

This gives daily cost per agent type per model — the primary cost attribution report for LLM inference.

For the broader LLM cost reduction stack — model selection, quantization, and batch inference beyond per-call attribution — see [LLM cost optimization and model selection FinOps](/learn/llm-cost-optimization).

## OpenLegion's Take: Observe at the Mesh Layer, Never Log Raw Prompts to Third Parties

Three concrete problems define the LLM observability failure mode in production:

**OWASP LLM02 makes third-party prompt logging a compliance liability that compounds with scale.** A single SaaS observability integration that logs raw prompts creates a GDPR DPA requirement, a potential HIPAA BAA requirement, and a SOC 2 dependency on the vendor. These obligations are easy to miss when signing up for a free Langfuse Cloud account in development — and expensive to untangle when the compliance team discovers them in production. The OpenLegion mesh router captures TTFT, input/output token counts, and per-call cost at the network layer without content inspection. Raw prompt-response content never exits Zone 2. Metadata observability satisfies the vast majority of operational requirements without the compliance burden.

**OTel Gen AI v1.29 (November 2024) is the first stable cross-vendor standard — but most instrumentation libraries were on draft conventions before that date.** Teams running Langfuse, OpenLLMetry, or Helicone integrations built before November 2024 may be emitting `gen_ai.usage.prompt_tokens` (draft attribute name) instead of `gen_ai.usage.input_tokens` (stable v1.29 name). Mixing draft and stable attribute names breaks dashboard queries and cross-tool trace correlation. Upgrade instrumentation libraries to versions that emit v1.29-stable attributes before building Prometheus dashboards on these attribute names.

**Anthropic token counting API (beta, ~November 2024) changes the budget enforcement model.** Pre-flight token counting makes per-agent token budget enforcement practical: check if the context exceeds the budget, truncate if necessary, and only pay for inference when the context is within budget. Without pre-flight counting, the only enforcement mechanism is checking the error response after the API returns a `400 context window exceeded` — the inference cost was already incurred. OpenLegion's per-agent token budget enforcement runs the count API before every inference call from a budget-constrained agent, rejecting oversized contexts before they generate a cost event.

| **Observability property** | **OpenLegion** | **Langfuse Cloud** | **Helicone** | **Datadog LLM Observability** | **LangSmith** |
|---|---|---|---|---|---|
| **Mesh router captures TTFT and token counts without content inspection** | Yes — metadata-only at network layer | No — content captured via SDK | Yes (proxy captures all content) | No — content captured via SDK | No — content captured via SDK |
| **Raw prompts never leave Zone 2** | Yes | No — sent to Langfuse servers | No — sent to Helicone servers | No — sent to Datadog | No — sent to LangSmith servers |
| **Per-agent token budget enforcement via pre-flight counting** | Yes — Anthropic token counting API | No | No | No | No |
| **OTel Gen AI spans to operator-controlled collector** | Yes — standard OTLP | Langfuse proprietary + OTel export | Helicone proprietary | Datadog proprietary | LangSmith proprietary |
| **Cost attribution by agent_id and model in every span** | Yes — automatic | Yes — with SDK tagging | Yes — with prompt tag | Yes — with DD tags | Yes — with metadata |
| **Prompt version tracked in git** | INSTRUCTIONS.md git history | Langfuse prompt registry | Manual | Manual | LangSmith prompt hub |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is LLM observability?

LLM observability is the practice of measuring and logging the LLM inference layer in production — capturing token usage (input and output tokens per call), latency (time to first token, end-to-end response time), cost per call (token counts × provider pricing), model version, and prompt version — using standardized OpenTelemetry Gen AI semantic conventions so that LLM traces can be correlated with application traces in any OTel-compatible backend. LLM observability is distinct from agent observability: agent observability measures task-level outcomes (task success rate, tool call counts, inter-agent message volume), while LLM observability measures individual inference calls (which specific model call was slow, expensive, or returned an unexpected finish reason). Both layers are required for full production visibility — agent observability shows which task types fail; LLM observability shows which specific model calls caused the failure.

### What are the OpenTelemetry Gen AI semantic conventions?

OpenTelemetry Gen AI semantic conventions (v1.29+, merged November 2024) are standardized OTel span attributes for LLM inference calls: `gen_ai.system` (LLM provider, e.g., `"openai"`), `gen_ai.request.model` (requested model name), `gen_ai.usage.input_tokens` (integer, input token count), `gen_ai.usage.output_tokens` (integer, output token count), `gen_ai.response.finish_reasons` (array of finish reasons), and `gen_ai.operation.name` (e.g., `"chat"`, `"embeddings"`). These conventions enable any OTel-compatible backend (Jaeger, Grafana Tempo, Honeycomb, Datadog) to receive and display LLM traces in a vendor-neutral format without custom parsers per provider — before v1.29, draft conventions varied across instrumentation libraries, making traces from different tools incompatible. Optional content attributes (`gen_ai.prompt`, `gen_ai.completion`) capture full prompt and response text but carry OWASP LLM02 Sensitive Information Disclosure risk and should only be included after PII scrubbing.

### What is Langfuse and how does it work?

Langfuse (30,000+ GitHub stars, 2026) is an open-source LLM observability platform with a prompt registry (version-controlled prompt templates with one-call rollback), cost attribution per prompt version and model, trace visualization, and evaluation datasets for regression testing prompt changes before deployment. It integrates via Python and JavaScript SDKs, a `LangfuseCallbackHandler` for LangChain, and a `LangfuseOpenAI` wrapper for drop-in client replacement, and self-hosts on Docker Compose or Kubernetes — the self-hosted deployment keeps prompt and response data in the operator's own database, eliminating the third-party data processing relationship that makes Langfuse Cloud an OWASP LLM02 risk for sensitive deployments. The cost attribution by prompt version feature is the most operationally valuable capability: it identifies exactly which prompt version is driving a cost or quality change without requiring manual log parsing.

### What is TTFT and what are good TTFT SLO targets?

TTFT (time to first token) is the duration from sending an LLM API request to receiving the first token of the streaming response — it determines how quickly the user sees text start appearing, making it the primary latency metric for interactive agent experiences rather than end-to-end response time (which includes streaming duration). P99 TTFT targets: less than 2,000ms for interactive agents where users are waiting for a real-time response (above 2 seconds is perceived as a broken experience by most users, a target published by Stripe and Vercel engineering teams), and less than 10,000ms for batch processing agents where no human is waiting. Measuring TTFT requires capturing the timestamp of the first received streaming chunk, not the completion timestamp — end-to-end latency is a poor proxy for interactive responsiveness when response lengths vary significantly.

### Is logging LLM prompts to third-party tools a security risk?

Yes — OWASP LLM Top 10 2025 LLM02 (Sensitive Information Disclosure) explicitly identifies raw prompt logging to third-party observability platforms as a risk vector because production prompts typically contain PII (names, emails, medical data), proprietary business logic in system prompts, and occasionally credentials that users accidentally include in messages. Logging raw prompts to a SaaS platform (Langfuse Cloud, Helicone, Datadog LLM Observability) creates a third-party data processing relationship requiring a GDPR Article 28 DPA, a HIPAA BAA if health data is present, and introduces a new breach surface if the observability vendor is compromised. Safe patterns: use PII scrubbing (Microsoft Presidio, AWS Comprehend PII) to redact identifiers before logging, log only metadata (token counts, latency, cost, finish reason) for operational observability without content risk, or self-host the observability platform within your VPC so prompt data never leaves your infrastructure.

### What is OpenLLMetry and how does it differ from Langfuse?

OpenLLMetry (Traceloop) is an OTel-compatible LLM observability library that auto-instruments LLM provider SDK calls (OpenAI, Anthropic, Cohere, and others) with zero code changes — importing the library and calling `instrument()` wraps all existing LLM calls with OTel Gen AI spans that export to any OTel-compatible backend via standard OTLP. Langfuse is a full observability platform with its own storage, UI, prompt registry, cost attribution dashboards, and evaluation workflows — it provides more features but requires either trusting Langfuse's cloud infrastructure with prompt data or self-hosting a full platform stack. The key distinction: OpenLLMetry is instrumentation infrastructure (it emits OTel spans to your existing observability backend), while Langfuse is an observability application (it stores, visualizes, and analyzes LLM traces); teams that already have an OTel stack typically choose OpenLLMetry to avoid a separate LLM observability silo, while teams without OTel infrastructure typically start with Langfuse self-hosted.

### How does the Anthropic token counting API work?

The Anthropic token counting beta (HTTP header: `anthropic-beta: token-counting-2024-11-01`, approximately November 2024) is a pre-flight API endpoint (`POST /v1/messages/count_tokens`) that accepts the same request body as a messages call but without `max_tokens` and returns `{"input_tokens": N}` — the estimated token count — without running inference and without billing for the call. The primary use cases are pre-flight budget enforcement (reject or truncate context if the token count would exceed the per-agent token budget before paying for inference) and context window management (verify the full context fits within the model's 200k context window before sending). The API does not account for `cache_creation_input_tokens` or `cache_read_input_tokens` because cache state is determined by the actual inference call; use it for planning and budget gating, not for predicting the exact billed token count when prompt caching is active.

### How do I calculate and track LLM cost per call?

Per-call LLM cost = `(input_tokens × input_price_per_million / 1,000,000) + (output_tokens × output_price_per_million / 1,000,000)`; for Anthropic prompt caching, all four token type counts (`cache_write_input_tokens`, `cache_read_input_tokens`, uncached `input_tokens`, `output_tokens`) are returned in the `usage` field of the API response and each billed at a different rate. The key attribution dimensions to track are model (which models drive cost), prompt version (did the latest change increase or decrease average cost per call), agent type (which agent roles are most expensive), and user or tenant (for per-tenant billing or spend limit enforcement). Record cost as an OTel gauge metric (`gen_ai.cost`) with `gen_ai.system`, `gen_ai.request.model`, `prompt_version`, and `agent_id` as label dimensions, then aggregate with Prometheus `sum by (agent_id, gen_ai_request_model)` to get per-agent-type daily spend.

## Start Measuring LLM Inference in Production

LLM observability requires two layers: the inference layer (this page — OTel Gen AI spans, TTFT measurement, cost per call) and the agent task layer ([AI agent observability and task-level success metrics](/learn/ai-agent-observability)). Neither layer alone gives full visibility.

The security constraint is non-negotiable: raw prompt logging to third-party SaaS is OWASP LLM02. Self-host Langfuse or use metadata-only logging for any deployment where prompts contain PII, proprietary system instructions, or confidential context.

OTel Gen AI v1.29 (November 2024) is the first stable standard. Build your instrumentation and dashboards on v1.29-stable attribute names, not draft conventions from pre-November 2024 libraries.

[Start building on OpenLegion](https://app.openlegion.ai) — mesh router captures TTFT and token counts at the network layer without content inspection; raw prompts never leave Zone 2; per-agent token budget enforcement via pre-flight Anthropic token counting.
