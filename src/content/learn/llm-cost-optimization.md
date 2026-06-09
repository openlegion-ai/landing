---
title: "LLM Cost Optimization — Six Levers for Production Agent Fleets"
description: "Six levers for LLM cost optimization: model routing, prompt caching, batch inference, context compression, per-agent budget caps, and output token control — with real cost numbers."
slug: /learn/llm-cost-optimization
primary_keyword: llm cost optimization
secondary_keywords:
  - reduce openai api costs
  - llm token cost reduction
  - ai agent cost control
  - prompt caching savings
  - model routing ai agents
last_updated: "2026-06-05"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-frameworks
  - /learn/what-is-an-ai-agent
---

# LLM Cost Optimization: Six Levers for Production Agent Fleets

LLM cost optimization is the practice of reducing token expenditure in production AI systems without sacrificing task quality. FinOps Foundation's State of FinOps 2026 report found AI/ML spend is the #1 new cost category cited by 67% of respondents, with median LLM spend doubling year-over-year. Six concrete levers — model routing, prompt caching, batch inference, context compression, per-agent budget caps, and output token control — can cut per-task cost by 50–80% in mixed-complexity production agent pipelines without changing task outcomes.

<!-- SCHEMA: DefinitionBlock -->
LLM cost optimization is the structured practice of reducing the token and compute expenditure of large language model API calls in production systems, applied across model selection, prompt structure, inference timing, context management, and budget enforcement, to minimize cost per successful task without degrading output quality.

## Why LLM Spend Is Now a Board-Level Concern

Enterprise AI budgets followed a predictable arc: build fast in 2024–2025, then confront the invoice. A single GPT-4o call filling a 128k context costs $0.32 in input tokens alone. A multi-agent pipeline running 20 LLM calls per task reaches $6.40 per task from input tokens before any output, tool calls, or infrastructure overhead. At 10,000 tasks per day, that is $64,000 daily in LLM API spend — $23M per year — from one cost-unoptimized pipeline.

FinOps Foundation's State of FinOps 2026 puts this in organizational context: AI/ML is the fastest-growing new budget line for 67% of enterprise FinOps teams, with median LLM spend doubling year-over-year. This is not a one-time cost spike during a prototype phase; it is a recurring operational expense that scales directly with usage, creating a unit economics problem that compounds as adoption grows.

The good news: LLM costs are highly compressible. Unlike infrastructure costs (where you need more hardware for more load), token costs respond to engineering choices made at design time. A pipeline redesigned with the six levers below routinely achieves 50–80% cost reduction with no change in output quality — not by using worse models, but by using the right model for each task, removing wasted tokens, and enforcing hard spend limits.

## OpenLegion's Take: Budget Caps Are a Security Primitive, Not Just FinOps

Most frameworks treat LLM cost as a monitoring problem: set up a dashboard, get an alert when spend exceeds a threshold, investigate after the fact. The meter kept running while you were sleeping.

OpenLegion treats per-agent budget caps as a security primitive enforced at the infrastructure layer. Each agent has a `daily_usd` and `monthly_usd` cap. When an agent hits its cap, LLM calls are blocked for that agent — not the whole pipeline, just the over-budget agent. Other agents in the fleet continue running. This is a hard cutoff, not a soft warning.

Three concrete implications:

**Runaway loop prevention.** An agent caught in a recursive reasoning loop — whether from a prompt injection, a malformed task, or a model failure — hits its daily cap and stops. Without a hard cap, a recursive loop in a long-context agent can spend hundreds of dollars in minutes. With a cap of $2/day per agent, the worst case is $2.

**Denial-of-wallet defense.** OWASP LLM10:2025 names denial-of-wallet as a top LLM application risk: an attacker manipulates an agent into generating unbounded token output, burning the operator's budget. A hard cap enforced at the mesh layer cannot be bypassed by the agent, regardless of what the LLM requests.

**Predictable cost modeling.** With per-agent caps, the maximum daily spend for a fleet of N agents is N × daily_cap. Cost becomes a bounded variable, not an open-ended exposure.

For the full security context including prompt injection and credential protection, see [AI agent security and denial-of-wallet defense](/learn/ai-agent-security).

## The Six Levers

### Lever 1: Model Routing — Use the Cheapest Model That's Sufficient

The largest single lever. Claude Haiku 4.5 costs $0.80/$4 per million input/output tokens. Claude Opus 4.8 costs $5/$25. Routing a task to Haiku instead of Opus saves 84% on input and 84% on output for that call. Most steps in a production agent pipeline do not require Opus-level reasoning.

A three-tier routing pattern covers most pipelines:

| **Task type** | **Model** | **Cost (input/M)** |
|---|---|---|
| Classification, formatting, extraction | Claude Haiku 4.5 | $0.80 |
| Moderate reasoning, summarization | Claude Sonnet 4 | $3.00 |
| Complex synthesis, multi-step reasoning | Claude Opus 4.8 | $5.00 |

Routing logic is a classifier that runs before dispatch: assess the complexity of the incoming task, assign it a tier, route to the corresponding model. Databricks Genie implemented this pattern and reported 61% cost reduction versus routing all tasks to Opus 4.7.

A conservative routing split — 80% of steps to Haiku, 15% to Sonnet, 5% to Opus — yields a blended cost of approximately $1.09/M input tokens versus $5.00/M if all calls went to Opus. On a 10,000-task-per-day pipeline, that difference is roughly $39,100 saved daily.

### Lever 2: Prompt Caching — 90% Savings on Repeated Context

Anthropic released prompt caching on 2024-08-14. When a large portion of a prompt (system instructions, document context, few-shot examples) is identical across multiple API calls, those tokens are cached at the server after the first call. Subsequent calls that include the same prefix pay 10% of the standard input token price for the cached portion — a 90% reduction.

At Opus 4.8 pricing ($5.00/M input tokens), a 10,000-token system prompt costs $0.05 per call uncached. With caching, it drops to $0.005. For an agent making 200 calls per day with the same system prompt, that is $10/day uncached versus $1/day cached — a $9/day saving from a single API parameter change.

Caching applies to stable content: system prompts, large document context loaded once per session, few-shot examples, and long tool definitions. It does not apply to dynamic content (the user's message, current tool results). Activation requires `cache_control: {"type": "ephemeral"}` on the content block in the Anthropic API.

OpenAI offers ~50% savings on cached input tokens via automatic prompt caching on GPT-4o for context that has been seen recently — no API parameter change required, applied automatically when the prefix matches.

### Lever 3: Batch Inference — 50% Off for Non-Realtime Tasks

Anthropic's Message Batches API and OpenAI's Batch API both price async workloads at 50% of standard rates. Requests are queued and processed within minutes to hours rather than in real time.

Use batch processing for workloads that tolerate async latency:
- Nightly report generation from accumulated data
- Document processing queues (classify, summarize, extract)
- Bulk evaluation runs (scoring agent outputs against ground truth)
- Pre-computation of embeddings or summaries for a knowledge base update

A nightly pipeline that processes 5,000 documents at GPT-4o standard pricing ($2.50/M input) versus batch pricing ($1.25/M) saves $1.25 per million tokens. For a pipeline with 100M tokens per night, that is $125 saved every night — $45,000/year from one scheduling change.

The constraint: batch is not suitable for interactive agent conversations where the user or an upstream agent is waiting for a response. The 50% discount is the explicit trade-off for accepting non-realtime delivery.

### Lever 4: Context Compression — Prune What the Model Doesn't Need

Every token sent in an API call is a token charged. Context compression removes tokens that do not contribute to output quality.

Three compression techniques in priority order:

**Conversation summarization.** A 40,000-token conversation history compressed to an 8,000-token structured summary cuts input cost by 80% for subsequent calls. Quality impact is minimal for tasks where the model needs the gist of prior work, not verbatim earlier turns. Apply when context length exceeds 20,000 tokens in a long-running agent session.

**Tool result pruning.** A web scrape or database query might return 50,000 tokens of raw content when the agent needs 200 tokens of extracted facts. Parse and filter tool results before injecting them into context. An agent processing 10 web pages per task at 5,000 tokens/page saves 49,800 tokens per task by extracting only the relevant fields — a 99.6% reduction in tool-result token cost for those calls.

**Verbose API response stripping.** Many APIs return deeply nested JSON with metadata, pagination objects, and housekeeping fields the LLM does not need. Write a post-processing step that extracts only the fields the agent's next reasoning step requires, before injecting the result into context.

The compounding effect matters: a pipeline that applies all three compression techniques to a 40K-token context can often operate in 6–10K tokens with equivalent task quality — a 4–6x reduction in input token cost for every subsequent call in the session.

### Lever 5: Per-Agent Budget Caps — Enforce at the Infrastructure Layer

Per-agent budget caps are not just FinOps governance — they are the backstop that makes all other cost optimizations trustworthy in production. Without a hard cap, any routing misconfiguration, caching miss, or runaway reasoning loop can erase the savings from levers 1–4.

OpenLegion implements `daily_usd` and `monthly_usd` per agent at the mesh layer. The Cost Tracker in Zone 2 of the four-zone trust model maintains a running spend total per agent in real time. When the cap is hit:

1. LLM calls for that agent are blocked — no new API calls until the cap resets
2. The pipeline continues — other agents in the fleet are unaffected
3. The blocked agent's status is updated to `blocked` on the blackboard
4. Orchestrator-level logic can trigger a reroute or a graceful shutdown for that agent's task

This is structurally different from soft alerts. A soft alert fires when spend exceeds a threshold; the meter keeps running while a human investigates. A hard cutoff stops spend immediately, regardless of what is running.

For a fleet of 20 agents each capped at $5/day, the maximum daily exposure is $100 — a bounded, predictable number that can go directly into a FinOps forecast.

### Lever 6: Output Token Control — Structured Outputs and Constrained Generation

Output tokens cost more than input tokens on most pricing tiers (Opus 4.8: $5 input, $25 output per million). Unconstrained text generation wastes output tokens on hedging phrases, disclaimers, preamble, and formatting that the downstream system ignores.

Three output control techniques:

**JSON mode / structured outputs.** For tasks that produce structured data (classification labels, extracted fields, scoring results), requiring JSON output instead of prose reduces output token count 40–60% and eliminates post-processing parsing errors. OpenAI strict mode and Anthropic tool_use both enforce exact schema adherence, making the output machine-parseable on the first call.

**Explicit `max_tokens` ceilings.** Set `max_tokens` to the realistic upper bound for the task. A classification task that outputs one of five labels should have `max_tokens: 20`, not the model default of 4,096. Unconstrained `max_tokens` doesn't mean the model always generates to the limit — but it prevents edge cases where a verbose model generates a 2,000-token explanation of a five-word answer.

**System prompt framing for brevity.** Instructions like "Respond in JSON only. No preamble, no explanation." reliably reduce output token counts for structured tasks. For chain-of-thought reasoning steps that will be discarded before the final output, route to a reasoning model with no user-visible output, then route only the conclusion to the final step.

## What a Cost-Optimized Agent Fleet Looks Like in Practice

A concrete five-agent content pipeline before and after optimization:

**Before (unconstrained defaults):**
- All agents use Claude Opus 4.8
- No prompt caching
- Full tool outputs injected into context
- No per-agent budget caps
- Prose output for structured extraction steps
- **Estimated cost per task: ~$0.082**

**After (all six levers applied):**
- Step 1 (topic classification): Haiku 4.5 — $0.0004
- Step 2 (research, 5 web searches): Sonnet 4 + tool result pruning — $0.008
- Step 3 (outline generation): Sonnet 4 + prompt caching on system prompt — $0.003
- Step 4 (draft writing): Opus 4.8 + JSON structured output — $0.014
- Step 5 (validation): Haiku 4.5 + structured output — $0.0005
- Per-agent caps: $2/day each (5 agents = $10/day max fleet spend)
- **Estimated cost per task: ~$0.026**

That is a **68% reduction** — from $0.082 to $0.026 per task. At 1,000 tasks/day, the difference is $56/day, $20,440/year, from engineering choices with no change in output quality.

## Comparison: Cost Control Across Agent Frameworks

| **Dimension** | **OpenLegion** | **LangGraph** | **CrewAI** | **AutoGen** |
|---|---|---|---|---|
| **Model routing built-in** | Yes — per-agent model field; each agent in a fleet can use a different model | No — manual in user code | No — manual in user code | No — manual in user code |
| **Prompt caching integration** | Supported via Anthropic/OpenAI API pass-through | Supported via API pass-through | Supported via API pass-through | Supported via API pass-through |
| **Per-agent budget caps** | Yes — daily_usd + monthly_usd at mesh layer | No | No | No |
| **Hard spend cutoff** | Yes — LLM calls blocked on overage, pipeline continues | No | No | No |
| **Batch inference support** | Via API pass-through (Anthropic/OpenAI Batch APIs) | Via API pass-through | Via API pass-through | Via API pass-through |
| **Real-time cost tracking** | Yes — Cost Tracker in Zone 2 per agent | No built-in | No built-in | No built-in |

For a full framework capability comparison including orchestration, security, and memory, see the [AI agent frameworks comparison](/learn/ai-agent-frameworks). For orchestration patterns that interact with budget enforcement, see the [AI agent orchestration guide](/learn/ai-agent-orchestration).

<!-- SCHEMA: FAQPage -->
## Frequently Asked Questions

### What is LLM cost optimization?

LLM cost optimization is the practice of reducing token and compute expenditure in production AI systems without degrading task output quality. Six main levers cover the space: model routing (use the cheapest model that's sufficient per task), prompt caching (90% savings on repeated context), batch inference (50% off for async workloads), context compression (prune what the model doesn't need), per-agent budget caps (hard infrastructure-level cutoffs), and output token control (structured outputs instead of verbose prose). Applied together, these levers routinely achieve 50–80% cost reduction on production agent pipelines.

### How much can prompt caching reduce LLM costs?

Anthropic prompt caching, released on 2024-08-14, reduces input token costs by up to 90% on repeated context. A 10,000-token system prompt costs $0.05 per call uncached and $0.005 cached at Claude Opus 4.8 pricing — a 90% reduction per call. OpenAI offers approximately 50% savings on cached input tokens through automatic prompt caching on GPT-4o. Caching applies to stable content: system prompts, document context loaded once per session, few-shot examples, and large tool definition blocks. Dynamic content such as the current user message is not cached.

### What is model routing in AI agents?

Model routing dispatches each step in an agent pipeline to the cheapest model that can handle it reliably. Simple classification and extraction tasks route to Claude Haiku 4.5 at $0.80 per million input tokens; moderate reasoning routes to Sonnet 4 at $3.00; complex synthesis routes to Opus 4.8 at $5.00. Databricks Genie achieved 61% cost reduction versus routing all tasks to Opus 4.7 by applying this pattern. Routing logic is a pre-dispatch classifier that scores task complexity — the classification must happen before the expensive call is made.

### What is the Anthropic batch inference API and how much does it save?

Anthropic's Message Batches API processes requests asynchronously at 50% of standard pricing — results are returned within minutes to hours rather than in real time. OpenAI offers a similar Batch API at the same 50% discount. Batch processing suits workloads that tolerate async latency: nightly report generation, document processing queues, bulk classification, and evaluation runs scoring agent outputs. It is not suitable for interactive agent conversations where an upstream agent or user is waiting for a real-time response.

### How do per-agent budget caps work in OpenLegion?

Each agent in OpenLegion has a `daily_usd` and `monthly_usd` cap enforced at the mesh layer by the Cost Tracker in Zone 2. When an agent hits its cap, LLM calls for that agent are blocked immediately — the rest of the pipeline continues running. This is a hard cutoff, not a soft alert that fires while the meter keeps running. A fleet of 20 agents each capped at $5/day has a maximum daily exposure of $100, regardless of how many tasks run or whether any agent enters a loop.

### How does context compression reduce LLM token costs?

Context compression removes tokens from API calls that do not contribute to output quality: summarizing conversation history (a 40,000-token context compressed to 8,000 tokens cuts input cost 80%), pruning tool results to essential fields (a 50,000-token web scrape reduced to 200 tokens of extracted facts), and stripping verbose API response metadata before context injection. Each technique applies independently; combined on a long-running agent they can reduce input token volume by 4–6x with negligible quality impact for most reasoning tasks.

### What is denial-of-wallet and how do budget caps prevent it?

Denial-of-wallet is OWASP LLM10:2025 — an attack where an agent is manipulated into consuming unlimited tokens, burning the operator's API budget. A compromised agent caught in a recursive reasoning loop can spend hundreds of dollars per hour before a human notices a dashboard alert. Per-agent budget caps with hard infrastructure-level cutoffs prevent this: when the cap is hit, LLM calls are blocked by the mesh layer, not by the agent itself, so a compromised agent cannot bypass the limit by ignoring application-level checks.

## Run Agents With Cost Baked Into the Architecture

LLM cost is an engineering variable, not a fixed overhead. Model routing, prompt caching, batch inference, context compression, structured outputs, and hard per-agent budget caps each address a distinct cost driver. Used together, they convert an unpredictable expense into a bounded, predictable line item — one that scales efficiently with usage rather than exploding with it.

For the platform that enforces budget caps at the infrastructure layer, see the [AI agent platform overview](/learn/ai-agent-platform). For the security dimension of budget enforcement including denial-of-wallet, see [AI agent security](/learn/ai-agent-security).

[Run production agents with budget caps enforced at the infrastructure layer →](https://openlegion.ai)
