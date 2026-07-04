---
title: "AI Agent Cost: Budget Caps, Token Attribution, and Runaway Loop Control"
description: "AI agent cost at runtime: token pricing, tool call overhead, loop amplification, and budget caps. GPT-4o pricing, Batch API 50% discount, Anthropic prompt caching, and runaway loop cost analysis."
slug: /learn/ai-agent-cost
primary_keyword: ai agent cost
last_updated: "2026-07-05"
schema_types: ["FAQPage"]
related:
  - /learn/llm-cost-optimization
  - /learn/ai-agent-observability
  - /learn/llm-gateway
  - /learn/agentic-workflows
  - /learn/ai-agent-reliability
  - /learn/agentic-rag
---

# AI Agent Cost: Budget Caps, Token Attribution, and Runaway Loop Control

AI agent cost is the runtime expense of running an agent across its task lifecycle — not just the model's price per token, but that price multiplied by every LLM call in the agentic loop, where each call is billed on the full accumulated context window. Tool call responses re-enter the context as input tokens on the next iteration; loops compound cost with each step. Production cost incidents trace to agent architecture choices — missing iteration limits, unbounded tool call storms, absent budget caps — not model pricing.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent cost** is the total runtime expense of operating an AI agent across its task lifecycle — the sum of model API costs (input tokens × price + output tokens × price for every LLM call in the agentic loop), tool execution costs (orchestration fees, per-action charges, and external API fees), and infrastructure costs (compute, memory, observability) — where the agentic loop's iteration multiplier makes agent cost structurally higher than single-call LLM cost at the same token count.

## AI Agent Cost Anatomy: The Three Cost Drivers

### Model Cost: The Per-Iteration LLM Call

Every iteration of the agentic loop is a full LLM API call billed on the full context window token count — not just the new tokens added this turn. The input token count grows with each iteration because the context accumulates: system prompt + tool schemas + all previous Thought-Action-Observation triples + the current Observation. This is the **loop amplification effect**: a 5-iteration task doesn't cost 5× the cost of 1 iteration — it costs more, because each iteration's input includes all previous iterations' content.

Reference pricing (2026, published rates):

| **Model** | **Input ($/M tokens)** | **Output ($/M tokens)** |
|---|---|---|
| **GPT-4o** | $2.50 | $10.00 |
| **GPT-4o-mini** | $0.15 | $0.60 |
| **GPT-4.1** | $2.00 | $8.00 |
| **GPT-4.1-mini** | $0.40 | $1.60 |
| **o4-mini** | $1.10 | $4.40 |
| **Claude 3.7 Sonnet** | $3.00 | $15.00 |
| **Claude 3.5 Haiku** | $0.80 | $4.00 |

GPT-4o-mini is 16.7× cheaper than GPT-4o on both input and output at the same token count. Model selection is the single largest lever on per-task cost: routing routine subtasks (classification, extraction, summarization) to GPT-4o-mini reduces those subtask costs by approximately 94% vs GPT-4o.

Claude 3.7 Sonnet extended thinking mode: the reasoning trace output (not returned to the user, but billed as output tokens) is typically 2–5× the length of the final response. Budget extended thinking tasks at 3–6× standard output cost per call.

### Tool Call Cost: Orchestration and Response Re-Entry

Tool calls add cost through two mechanisms:

**Orchestration fees**: managed agent platforms charge separately from model costs. AWS Bedrock Agents charges $0.000025 per input token for orchestration. Self-hosted frameworks (LangChain, CrewAI) have no per-tool orchestration fee but incur compute cost for tool execution.

**Tool response token cost**: every tool response is appended to the context window as an Observation and billed as input tokens on the next LLM call. A 1,000-token tool response costs $0.0025 at GPT-4o input rates. For 5 tool calls per iteration × 10 iterations = 50 tool responses × $0.0025 = **$0.125 in tool response tokens alone per task**, before context accumulation. Tools that return large payloads — web scrapers returning full HTML, database queries returning large result sets, file readers returning full documents — are silent cost drivers. Capping tool responses at 2,000 tokens before context append reduces this cost by 50–80% for over-sized responses.

### Infrastructure Cost: Compute, Memory, Observability

For self-hosted agent runtimes:
- **Compute**: a Python LangChain agent process uses approximately 150–300 MB RAM during active execution; at 100 concurrent agents, 15–30 GB RAM required
- **Embeddings**: OpenAI text-embedding-3-small at $0.02/M tokens; at 1,000 memory queries/day × 500 tokens each = 500k tokens/day = $0.01/day in embedding costs
- **Observability**: LangSmith at $39/month for 100k traces; self-hosted Jaeger at approximately $50/month S3 storage for the same volume

Infrastructure cost is typically **5–15% of total agent cost** at moderate scale — model API cost dominates. For AaaS deployments (AWS Bedrock Agents, OpenLegion), infrastructure cost is included in the platform fee; no separate compute billing. The ratio shifts at high scale (>1M agent actions/day) where compute becomes significant relative to model costs.

## Model Pricing Reference: GPT-4o, Claude, and Routing Economics

### Current Model Pricing (2026) and Cost-Per-Task Benchmarks

For a typical 5-iteration agent task with a 2,000-token system prompt, 500 tokens per Thought step, 200 tokens per Action, and 700 tokens per Observation:

**Cost-per-task breakdown** (5 iterations, accumulating context):

| **Model** | **Cost per task** | **At 1,000 tasks/day** |
|---|---|---|
| **GPT-4o** | ≈$0.052 | $52/day |
| **GPT-4o-mini** | ≈$0.003 | $3/day |
| **Claude 3.7 Sonnet** | ≈$0.071 | $71/day |
| **Claude 3.5 Haiku** | ≈$0.019 | $19/day |

The 17× cost difference between GPT-4o and GPT-4o-mini at the same task structure means the model selection decision — not prompt engineering — determines whether a 1,000-task/day fleet costs $3/day or $52/day.

For per-model token pricing details, cost reduction techniques, and model capability benchmarks, see [LLM cost optimization at the model and infrastructure layer](/learn/llm-cost-optimization).

### Model Routing: Matching Task Complexity to Model Cost

Model routing directs each agent subtask to the cheapest model capable of completing it. Routing tiers for agent systems:

1. **Routing/classification** (deciding which agent handles which task): GPT-4o-mini or Claude 3.5 Haiku — classification tasks are simple, cheapest model is sufficient
2. **Tool call generation** (selecting tools and parameters from structured schemas): GPT-4o-mini for well-defined tool schemas with clear selection criteria; GPT-4o or Claude 3.7 Sonnet for complex multi-step tool sequences or ambiguous input
3. **Complex reasoning** (multi-hop analysis, code generation, audit with many constraints): GPT-4o or Claude 3.7 Sonnet; o4-mini for tasks that benefit from extended thinking
4. **Summarization and formatting** (final output formatting, report generation): GPT-4o-mini for structured outputs; GPT-4o only for high-quality prose where quality degradation is unacceptable

Routing 70% of tasks to GPT-4o-mini and 30% to GPT-4o reduces overall model cost by approximately **60–70% vs all-GPT-4o**, at the cost of routing logic complexity and potential quality degradation on edge cases routed to the cheaper model that required GPT-4o's capability.

LLM gateways provide a centralized proxy layer for implementing routing rules across the agent fleet. For gateway architecture and routing logic, see [LLM gateway routing and cost control at the proxy layer](/learn/llm-gateway).

### Cost Reduction Techniques: Caching, Batching, and Compression

**Prompt caching** stores the computed attention state for a repeated token prefix (system prompt + tool schemas) on the provider's servers. Subsequent requests with the same prefix skip recomputation and receive a discount:

- **Anthropic**: 90% discount on cached tokens (billed at 10% of normal input price); 25% write surcharge on first cache write; minimum cacheable block 1,024 tokens; 5-minute TTL refreshed on hit; break-even after 2 cache hits
- **OpenAI prefix caching**: 50% discount, auto-applied to prompts ≥1,024 tokens; no explicit write surcharge

For a 2,000-token system prompt at 1,000 calls/day with Claude 3.7 Sonnet ($3/M input):
- Uncached system prompt cost: $6.00/day
- Cached cost: ≈$0.60/day
- Annual savings: ≈**$1,971/year per agent type** from system prompt tokens alone

Cache hit rate depends on prefix stability — the system prompt and tool schemas must appear in the same order on every call. Dynamic timestamps in the system prompt, or varying tool schema injection order, invalidate the cache on every call and eliminate the discount entirely.

For full caching mechanics including TTL management, prefix ordering requirements, and per-tenant cache isolation, see [LLM prompt caching strategies and token cost reduction](/learn/agentic-rag).

**OpenAI Batch API**: 50% cost reduction vs synchronous API for identical requests submitted as batch jobs. Batch jobs complete within 24 hours (no real-time latency guarantee). Appropriate for: nightly document processing, bulk data extraction, offline evaluation pipelines, report generation scheduled for the following morning. Not appropriate for: user-facing agent responses requiring under 5-second latency, real-time tool call sequences, or any workflow where an agent must act on results immediately. A nightly agent pipeline spending $100/night at synchronous rates saves $18,250/year by switching to Batch API.

**Response length control**: output tokens cost 4–5× more per token than input tokens on most models. Instructions that constrain output format and length ("Respond in ≤200 words," "Return only a JSON object with fields X, Y, Z") directly reduce output token cost. For GPT-4o ($10/M output), reducing average output from 500 to 200 tokens per call saves $3/M output tokens — a 30% reduction in output cost per call.

## Runaway Loop Cost: The Agent-Specific Risk

### Loop Amplification: Why Agent Cost Compounds

The loop amplification effect makes agent cost grow faster than linearly with iteration count. In a single LLM call, cost = input_tokens × price + output_tokens × price. In an agentic loop, each iteration's input_tokens includes ALL previous iterations' content. The marginal cost of each additional iteration is **higher** than the previous iteration — cost accelerates, not compounds linearly.

Compounding cost formula: `total_input_cost = Σ(i=1 to N) [system_prompt + tool_schemas + (i × avg_iteration_tokens)] × input_price`

For a 3,000-token system prompt + 1,200 tokens added per iteration at GPT-4o $2.50/M input:

| **Iteration** | **Input tokens** | **Cost at that iteration** |
|---|---|---|
| **1** | 4,200 | ≈$0.011 |
| **5** | 9,000 | ≈$0.023 |
| **10** | 15,000 | ≈$0.038 |
| **20** | 27,000 | ≈$0.068 |

Total for 20 iterations: approximately $0.60 in input tokens + output costs.

Adding 5 tool calls per iteration at 1,000-token average response: 5,000 additional input tokens per iteration, pushing iteration 20 to 52,000 input tokens ≈ $0.130/iteration. A 20-iteration total with tool calls: ≈**$1.30/agent**. At 100 concurrent agents in the same storm: **$130 in minutes**.

The loop mechanics that drive this cost compounding — context accumulation, Observation re-entry, iteration termination — are covered in [agentic workflows, iteration patterns, and runaway loop termination](/learn/agentic-workflows).

### Runaway Loop Cost: The $50-in-60-Seconds Scenario

An uncontrolled agentic loop running at GPT-4o rates with aggressive tool use can exhaust a $50/day budget in under 60 seconds. The scenario:

1. An agent is tasked with a research question requiring external API calls
2. A tool returns a malformed or error response
3. The agent interprets the error as "retry" — a tool call storm begins
4. Each retry appends the error response (500–1,000 tokens) to the context
5. No max_turns configured; no per-agent budget cap enforced; the loop runs at full speed

Rate analysis: GPT-4o processes approximately 20–30 iterations per minute for a context-heavy agent (model latency + tool call latency). At 30 iterations/minute with the compounding cost structure above:

- By iteration 10 (≈20 seconds): accumulated context ≈ 15,000 tokens; cost at this iteration ≈$0.038
- By iteration 30 (60 seconds): accumulated context ≈ 189,000 tokens (3,000 + 30 × 6,200); cost at iteration 30 alone ≈$0.473
- **Total cost for 30 iterations per agent ≈ $3.50 in 60 seconds**
- At 10 concurrent agents: $35 in 60 seconds
- At 20 agents: $70 — exceeding the fleet's $50/day cap in 60 seconds without infrastructure-level enforcement

LangChain's `max_iterations` and CrewAI's `max_rpm` provide application-layer limits, but these have three failure modes in production:

1. **Framework bypass**: any code path that calls the LLM API directly — debugging code, custom tool implementations, third-party library integrations — skips the application-layer limit
2. **Exception swallowing**: in production, agent frameworks often catch and log exceptions broadly; a `MaxIterationsExceeded` exception caught by a broad `except` clause results in the agent silently continuing without the limit
3. **Per-restart reset**: process-memory cost counters reset on crash-restart; a crash-restart loop resets the counter each time, allowing multi-lifetime cost accumulation while appearing within budget in each individual lifetime

Stopping a runaway loop at iteration 5 instead of iteration 20 saves approximately **85% of the total storm cost** — the per-iteration cost is lowest in the early iterations. Infrastructure-level caps that alert at 80% utilization (not at cap exhaustion) catch cost storms before the budget is depleted.

For retry logic, circuit breakers, and dead-letter queues that prevent tool call storms from within the loop, see [AI agent reliability and circuit breaker patterns](/learn/ai-agent-reliability).

## Per-Agent Budget Enforcement: The Production Cost Control

### Why Application-Layer Cost Controls Are Insufficient

Application-layer cost controls — max_iterations in LangChain, max_rpm in CrewAI, try/except with cost counters — have three failure modes that make them insufficient as production cost guardrails:

**Framework bypass**: any direct LLM API call skips the application-layer control. Debugging code added during an incident, a custom tool that calls the LLM for validation, a third-party library integration that makes its own LLM calls — all bypass application-level limits without error.

**Exception swallowing**: production systems use broad exception handlers (`except Exception as e: logger.error(e); continue`) to prevent crashes from surfacing to users. A `MaxIterationsExceeded` exception that is caught and logged does not stop the loop — it may restart it or be silently swallowed by the outer retry handler.

**Per-restart reset**: application-layer daily budget counters live in process memory. A crash-restart loop resets the counter on each restart. An agent that crashes every 50 iterations and is auto-restarted by a process manager can accumulate costs across unlimited process lifetimes, each appearing within budget individually.

Infrastructure-layer enforcement addresses all three failure modes: the control applies at the network layer before the LLM API call reaches the provider (all calls pass through the router regardless of code path), cannot be intercepted by exception handling in agent code, and persists across agent process restarts (tracked at session context level, not process level).

### Configuring Per-Agent Budget Caps

Per-agent budget cap configuration in OpenLegion: $0–$50/day per agent, set in INSTRUCTIONS.md committed to git; enforced by Zone 2 (the mesh router) before each LLM call. When the cap is exhausted, Zone 2 rejects the call with `budget_exceeded` and the agent loop hard-stops. No application code change required.

Cap calibration guidelines:

1. **Measure first**: run the agent in staging with cost tracking enabled; record typical daily cost over 5–7 representative days including high-traffic days
2. **Set at 3× typical**: set the production cap at `typical_daily_cost × 3`; provides headroom for legitimate traffic spikes while stopping runaway loops before the full fleet budget is impacted
3. **Alert at 80%**: configure a budget alert at 80% utilization — not at cap exhaustion; catching cost pressure before the cap is hit allows investigation without service interruption
4. **Scheduled agents**: for agents running on a known schedule (daily reports, nightly processing), set the cap at `expected_per_run_cost × number_of_runs × 2`; a daily report agent costing $0.50/run should have a $5/day cap (10× single-task cost, covering retry attempts and variance)
5. **Interactive agents**: for user-facing agents with unpredictable task complexity, combine a per-task iteration limit (`max_turns`) with the daily cap — the iteration limit stops individual runaway tasks; the daily cap stops cumulative drift across many tasks

The cap is committed to git in INSTRUCTIONS.md — every cap change has a full audit trail with author, timestamp, and diff. The cap cannot be raised by agent code at runtime; changes require a git commit and deployment.

### Cost Attribution: Knowing What Each Agent Spent

Per-agent cost attribution tracks LLM call cost to the individual agent, task, and iteration that incurred it. Without attribution, the billing dashboard shows total spend but cannot answer: "Which agent type is driving cost growth?" or "Which task variant costs 10× the average?"

Cost attribution requirements:

1. **Agent-level**: total input + output tokens per agent type per day; identifies which agent types are expensive relative to their value
2. **Task-level**: total cost per individual task run (task_id → sum of all LLM call costs across all iterations); identifies expensive task variants
3. **Iteration-level**: cost breakdown by loop iteration; if cost per iteration is growing, the loop is not converging — a precursor to a runaway event
4. **Model-level**: cost split by model; validates that routing logic is correctly directing tasks to the intended model tier

Implementation: every LLM call must carry metadata tags (`agent_id`, `task_id`, `iteration_number`, `model_name`) propagated to the billing event. The observability pipeline aggregates cost by tag. OpenLegion's Zone 2 tags every LLM call with agent_id and session context before dispatch; the audit log is exportable for cost analysis.

For the full telemetry stack — trace ingestion, span tagging, cost metric aggregation, and alert configuration — see [AI agent observability and cost monitoring pipelines](/learn/ai-agent-observability).

## Cost Architecture for Multi-Agent Meshes

### Inter-Agent Communication Cost

In a multi-agent mesh, handoff briefs add tokens to the receiving agent's context window. A 2,000-token handoff brief becomes part of the receiving agent's context for the duration of the task — paid as input tokens on every iteration of the receiving agent's loop.

Cost impact: a 5,000-token handoff brief sent to an agent that runs 10 iterations at Claude 3.7 Sonnet $3/M:
`5,000 tokens × 10 iterations = 50,000 tokens × $3/M = $0.15 in additional input cost per task`

This cost is avoidable. Handoff briefs should contain task specification (what to do, constraints, success criteria) — not data payloads (the actual data the agent will process). Data should be written to the blackboard and referenced by key. The receiving agent reads the data from the blackboard at the start of the task — one read operation, one context load — rather than carrying the full payload in context across all iterations.

Rule of thumb: every 1,000 tokens added to a handoff brief costs approximately `$0.003 × (model_input_price / $3) × iterations` across all iterations of the receiving agent's task. For a 10-iteration agent on GPT-4o: $0.025 per extra 1,000 brief tokens.

### Fleet Cost Budgeting: Daily and Monthly Fleet Caps

Per-agent caps prevent individual agent runaway. Fleet-level caps prevent collective cost incidents where many agents each stay within their individual cap but together exhaust the budget.

Fleet budgeting approach for a 20-agent fleet with $2/day average per-agent cost:

- **Per-agent daily cap**: $6/day (3× typical average)
- **Fleet daily budget alert**: $32/day (80% of fleet potential ceiling: 20 agents × $2 average)
- **Fleet hard cap**: $40/day (total allocated budget)
- **Monthly budget**: $880 ($40 × 22 working days; weekends and off-hours cost ≈$0 for task-triggered agents)
- **End-of-month buffer**: 10% reserve for batch tasks and report generation scheduled at month-end

The fleet-level alert fires before any individual agent hits its cap, providing early warning of fleet-wide cost pressure — a situation where many agents are legitimately busy but the aggregate is approaching the fleet budget limit.

## OpenLegion's Take: Cost Control Is an Infrastructure Problem

The common mental model is that AI agent cost is an application concern — add `max_turns`, wrap the loop in try/except, maintain a cost counter. This model breaks under production conditions.

Three numbers that define why:

**$25/day from one agent's system prompt alone.** A developer reads GPT-4o at $2.50/M input tokens and builds a mental model of "this will be cheap." Then the agent fleet deploys: a 2,000-token system prompt sent on every LLM call, across 1,000 daily tasks, across an average of 5 loop iterations = 10 million input tokens/day from the system prompt alone = $25/day before any task-specific content, output tokens, or tool calls. The model pricing table is the per-unit cost. The agent architecture is the multiplier.

**$130 in minutes from a 100-agent storm.** A 20-iteration runaway loop at GPT-4o with 5 tool calls per iteration costs ≈$1.30/agent. At 100 concurrent agents in the same storm: $130 in minutes. Application-layer `max_iterations` may fire on each agent individually, but if the exception is swallowed by a broad handler or the agents are auto-restarted by a process manager, the storm continues. Infrastructure-layer enforcement — Zone 2 rejecting the call with `budget_exceeded` before the LLM API is reached — is not subject to exception handling in agent code.

**$0 infrastructure-layer cost control in LangChain, CrewAI, or AutoGen.** None of these frameworks have native per-agent budget enforcement at the infrastructure layer. The only cost controls available are application conventions that break under load, edge cases, and framework updates.

OpenLegion's per-agent budget cap: $0–$50/day configurable, enforced at Zone 2 before each LLM call. When the cap is exhausted, Zone 2 rejects with `budget_exceeded`. The loop hard-stops. No application code change required. The cap is set in INSTRUCTIONS.md committed to git — a full audit trail of every cap change. The cap cannot be raised by agent code at runtime.

| **Cost control** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Per-agent daily budget cap (infrastructure layer — Zone 2)** | $0–$50/day, hard stop | Not available | Not available | Not available | Not available |
| **Hard stop on budget exhaustion (no application code required)** | Zone 2 reject | Not available | Not available | Not available | Not available |
| **Cost attribution metadata (agent_id, task_id, iteration on every call)** | Native, Zone 2 tagged | Manual (LangSmith) | Manual | Manual | Manual |
| **Budget alert at 80% utilization (before cap exhaustion)** | Native | Not available | Not available | Not available | Not available |
| **Per-agent cap in git (INSTRUCTIONS.md — audit trail of cap changes)** | Native | Not available | Not available | Not available | Not available |
| **Fleet-level daily cap (prevents collective cost incidents)** | Configurable | Not available | Not available | Not available | Not available |

[Start building on OpenLegion](https://app.openlegion.ai) — per-agent budget caps enforced at Zone 2, not in application code.

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### How much does it cost to run an AI agent?

AI agent cost depends on three variables: the model's price per token (GPT-4o: $2.50/M input, $10/M output; GPT-4o-mini: $0.15/M input, $0.60/M output; Claude 3.7 Sonnet: $3/M input, $15/M output), the number of loop iterations per task (each iteration is a full LLM call on the full accumulated context), and the number and size of tool call responses (each re-enters the context as input tokens). For a typical 5-iteration agent task with a 2,000-token system prompt: GPT-4o ≈$0.052/task; GPT-4o-mini ≈$0.003/task; Claude 3.7 Sonnet ≈$0.071/task. At 1,000 tasks/day: GPT-4o = $52/day; GPT-4o-mini = $3/day. The agentic loop multiplier — the fact that each iteration's input includes all previous iterations' content — means agent cost grows faster than linearly with iteration count and is the primary driver of unexpected production cost incidents.

### What causes AI agent costs to spike unexpectedly?

The most common cause of unexpected AI agent cost spikes is the tool call storm pattern: an agent calls a tool that returns an error, interprets the error as "retry," and calls the same tool repeatedly without escalation logic — each retry adds the error response (500–1,000 tokens) to the context window, and the per-iteration LLM call cost grows with each retry because the accumulated context grows. A secondary cause is missing iteration limits: an agent without `max_turns` or equivalent runs until the context window is exhausted or the process is manually killed, potentially running hundreds of iterations and accumulating hundreds of dollars in API costs. Both require infrastructure-layer mitigations — an iteration limit in application code and a per-agent daily budget cap enforced at the API gateway — because application-layer controls can be bypassed by exception handling, framework restarts, or direct API calls.

### How do I set a per-agent budget cap?

A per-agent budget cap sets a daily spending limit on an individual agent, after which LLM calls are rejected until the next billing day. Effective calibration: measure the agent's typical daily cost in staging, then set the production cap at 3× that amount — providing headroom for legitimate traffic spikes while stopping runaway loops before they exhaust the fleet budget. Set an alert at 80% utilization so cost pressure is visible before the cap is hit. For scheduled agents (daily reports, nightly processing), set the cap at expected per-run cost × number of runs × 2; for user-facing agents with unpredictable complexity, combine a per-task iteration limit with the daily cap. The cap must be enforced at the infrastructure layer — not in application code — because application-layer cost counters reset on process restart and can be bypassed by exception handling.

### How does prompt caching reduce AI agent cost?

Prompt caching stores the computed key-value attention state of a repeated token prefix (system prompt, tool schemas) on the provider's servers, so subsequent requests with the same prefix receive a discount: 90% with Anthropic (cached tokens billed at 10% of normal input price, minimum 1,024 tokens, 5-minute TTL refreshed on hit), and 50% with OpenAI prefix caching (auto-applied to prompts ≥1,024 tokens). For a 2,000-token system prompt at 1,000 daily tasks with Claude 3.7 Sonnet ($3/M input): uncached system prompt cost = $6.00/day; cached cost ≈$0.60/day; annual savings ≈$1,971/year per agent type from system prompt tokens alone. The cache hit rate depends on prefix stability — dynamic timestamps in the system prompt or variable tool schema injection order invalidate the cache on every call and eliminate the discount entirely.

### Is GPT-4o-mini worth using for AI agents?

GPT-4o-mini (May 2026: $0.15/M input, $0.60/M output) is 16.7× cheaper than GPT-4o ($2.50/M input, $10/M output) at the same token count, making it the correct model for any agent subtask that doesn't require GPT-4o's advanced reasoning — specifically: message routing and classification, structured data extraction from well-formatted sources, template-based output generation, simple tool selection from well-defined schemas, and summarization of clearly bounded content. Tasks where GPT-4o or Claude 3.7 Sonnet significantly outperform GPT-4o-mini: multi-hop reasoning across ambiguous sources, code generation requiring debugging loops, and complex instruction-following with many constraints. Routing 70% of tasks to GPT-4o-mini and 30% to GPT-4o reduces average model cost by approximately 60–70% with acceptable quality impact when task routing is calibrated in staging.

### What is the OpenAI Batch API and when should I use it for agents?

The OpenAI Batch API provides a 50% cost reduction vs the synchronous API for identical requests submitted as batch jobs, with completion within 24 hours and no real-time latency guarantee. It is appropriate for offline, non-interactive agent workloads: nightly document processing, bulk data extraction across a large corpus, offline evaluation pipelines, and report generation scheduled for the following morning. It is not appropriate for user-facing agent interactions requiring responses under 5 seconds, real-time tool call sequences where each step depends on the previous result, or any workflow where the agent must act on results immediately. A nightly agent pipeline spending $100/night at synchronous rates saves $18,250/year by switching to Batch API — a significant return on the workflow redesign effort when latency tolerance exists.

### How do I track AI agent cost per task?

Per-task cost tracking requires tagging every LLM API call with metadata — at minimum: `agent_id`, `task_id`, `iteration_number`, `model_name` — and aggregating cost by these tags in the observability pipeline. Every LLM API response includes `usage.input_tokens` and `usage.output_tokens`; multiplying by the model's published price per token gives the per-call cost; summing across all calls sharing the same `task_id` gives the per-task cost. Useful derived metrics: average cost per task by agent type (identifies expensive agent types), cost per iteration (a growing per-iteration cost means the loop is not converging — a precursor to runaway), and P95 task cost (the expensive tail disproportionate to the average). The observability pipeline must ingest LLM call traces at the iteration level, not just final task results, to provide cost attribution that diagnoses loop amplification vs high-token-count legitimate tasks.

### How much does a runaway agentic loop cost?

A runaway loop's cost compounds with each iteration because the context window grows: at GPT-4o rates ($2.50/M input), a loop with a 3,000-token system prompt and 1,200 tokens added per iteration costs ≈$0.011 at iteration 1, ≈$0.038 at iteration 10, and ≈$0.068 at iteration 20 — a 20-iteration storm costs ≈$0.60 per agent in input tokens before output and tool call costs. With 5 tool calls per iteration returning 1,000-token responses, add ≈$0.013/iteration in tool response cost, pushing a 20-iteration storm to ≈$0.86–$1.30 per agent. At 100 concurrent agents: $86–$130 in minutes. Stopping a runaway loop at iteration 5 instead of iteration 20 saves approximately 85% of total storm cost — the per-iteration cost is lowest in the early iterations, which is why infrastructure-level caps alerting at 80% utilization are more cost-effective than caps that only halt the loop after the budget is exhausted.
