---
title: "AI Agent Rate Limiting — Throttling, Backoff, and Abuse Prevention"
description: "AI agent rate limiting covers per-tenant throttling, exponential backoff for LLM API errors (429/503), and abuse-prevention guardrails that keep multi-agent systems stable under load."
slug: /learn/ai-agent-rate-limiting
primary_keyword: ai agent rate limiting
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /learn/llm-gateway
  - /learn/llm-cost-optimization
  - /learn/ai-agent-reliability
  - /learn/ai-agent-monitoring
  - /learn/ai-agent-security
  - /learn/ai-agent-observability
---

# AI Agent Rate Limiting — Throttling, Backoff, and Abuse Prevention

AI agent rate limiting is the set of controls that cap how fast agents call external APIs, enforce per-tenant throughput quotas, and recover gracefully when upstream LLM providers return 429 or 503 errors. Without throttling, a single runaway agent loop exhausts a shared API budget in minutes and cascades failures across a fleet. OpenAI's Tier 1 limit for GPT-4o is 500 RPM as of January 2025; Anthropic's Claude API defaults to 1,000 RPM at Tier 2 — either is trivially exhausted by a three-agent pipeline without throttling.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent rate limiting** is the enforcement of request-per-minute (RPM), token-per-minute (TPM), and concurrent-call caps on agent-to-LLM and agent-to-tool API calls, combined with recovery logic — backoff, jitter, and circuit breakers — for when upstream limits are hit.

## Why Rate Limiting Matters for AI Agents

Web applications have a 1:1 relationship between a user action and an API call. Agents invert this: one user task can spawn dozens of tool calls, each potentially hitting a rate-limited external service. A pipeline that looks trivially light in manual testing can saturate provider limits within seconds when parallelized across a fleet.

### Shared Credentials Amplify Blast Radius

The most common multi-agent rate-limit failure pattern: twenty agents share one API key. TenantA's pipeline runs a batch job at full speed. The shared key hits its provider rate limit. All other tenants — whose agents were operating normally — begin receiving 429 errors. There is no per-tenant isolation because the limit is enforced at the key level, not the agent level.

The fix is structural: each agent (or each tenant) must hold a distinct credential, or a proxy must enforce per-agent quotas before requests leave the infrastructure. Shared keys make rate-limit exhaustion a fleet-wide event; per-agent keys or proxy-enforced quotas make it a localized one.

OWASP LLM Top 10 v1.1 (2025) classifies this under LLM10: Unbounded Consumption — a high-severity risk where an agent system lacks controls to prevent resource exhaustion by one agent or tenant from degrading all others. The threat model extends to adversarial callers: an attacker who can trigger agent tool calls can cause denial-of-wallet by driving up token spend faster than any response is possible. For the full OWASP LLM threat framework, see [AI agent security and OWASP LLM Top 10 mitigations](/learn/ai-agent-security).

### Runaway Agent Loops as Denial-of-Wallet Attacks

A runaway agent loop — caused by a prompt injection payload, a task that recursively generates subtasks, or a bug in loop-termination logic — does not pause to respect API quotas. It calls the LLM as fast as the network allows. At GPT-4o's Tier 1 TPM limit of 30,000 tokens/minute, an unthrottled agent sending 300-token prompts exhausts the token budget in roughly 100 calls — about 12 seconds at a 500ms inference latency.

The financial consequence is a denial-of-wallet (DoW) attack: API bills accumulate for the duration of the loop. Unlike a classic denial-of-service, the cost persists after the attack ends in the form of the month's invoice.

Three distinct controls are required together to prevent DoW:

1. **Per-agent RPM cap** at the infrastructure layer — enforced before the request leaves the proxy, not checked inside agent code.
2. **Per-agent TPM cap** — token consumption is a separate counter from request count; both must be tracked.
3. **Per-task maximum call budget** — a ceiling on how many LLM calls a single agent task can make before it is halted and the supervisor is notified.

### Multi-Tenant Quota Isolation Requirements

In multi-tenant deployments, rate limits must be enforced per tenant, not per platform. A shared key across all tenants means TenantA's usage counts against TenantB's quota. There is no way to isolate the impact of one tenant's heavy use from all others.

Per-tenant isolation requires either: (a) each tenant holds their own API key stored in a per-tenant vault scope, so their usage is tracked independently by the provider; or (b) the platform's LLM proxy tracks per-tenant consumption independently and enforces synthetic 429s before dispatching to the shared provider key. Option (b) scales better but requires accurate per-tenant token accounting at the proxy layer.

For how the LLM proxy layer fits into the broader routing architecture, see [LLM gateway for provider routing and load balancing](/learn/llm-gateway).

## LLM Provider Rate Limit Reference

Different providers enforce different limit tiers. Understanding which dimension — RPM or TPM — you are closest to exhausting determines which throttling strategy to apply first.

### OpenAI GPT-4o Tier Limits (2025)

| **Tier** | **RPM** | **TPM** | **Notes** |
|---|---|---|---|
| **Tier 1** | 500 | 30,000 | Default for new accounts |
| **Tier 2** | 5,000 | 450,000 | $100 spend threshold |
| **Tier 3** | 5,000 | 800,000 | $1,000 spend threshold |
| **Tier 4** | 10,000 | 2,000,000 | $10,000 spend threshold |
| **Tier 5** | 10,000 | 30,000,000 | $250,000 spend threshold |

Source: OpenAI rate limits documentation, January 2025. TPM counts both input and output tokens. Tier 1 is the binding constraint for most new production deployments: a three-agent pipeline each sending 300-token prompts and receiving 700-token completions consumes 3,000 TPM per parallel batch — exhausting the 30,000 TPM budget in ten batches.

### Anthropic Claude API Tier Limits (2025)

| **Tier** | **RPM** | **Input TPM** | **Output TPM** |
|---|---|---|---|
| **Tier 1** | 50 | 50,000 | 10,000 |
| **Tier 2** | 1,000 | 80,000 | 16,000 |
| **Tier 3** | 2,000 | 160,000 | 32,000 |
| **Tier 4** | 4,000 | 400,000 | 80,000 |

Source: Anthropic API rate limits documentation, 2025. Anthropic tracks input and output TPM separately, which matters for agents with long system prompts (high input) or summarization tasks (high output). Tier 2 is the typical starting point for teams past the trial phase: 1,000 RPM and 80,000 input TPM is still exhaustible in under 90 seconds with 5 concurrent agents each sending 1,000-token inputs.

### Google Gemini and Mistral Limits

**Google Gemini 1.5 Pro**: 360 RPM / 4,000,000 TPM at the paid tier. The RPM limit (6 per second) is the binding constraint for agents making rapid sequential calls. Free tier is 2 RPM.

**Mistral Large**: 120 RPM / 2,000,000 TPM on the standard API. Mistral enforces limits at both the per-minute and per-day level — the daily cap matters for long-running pipelines that pace themselves within RPM but accumulate over hours.

### How HTTP 429 and Retry-After Headers Work

When a provider enforces a rate limit, it returns HTTP 429 Too Many Requests. Well-implemented provider APIs include a `Retry-After` header specifying the number of seconds to wait before retrying. OpenAI's 429 responses include `Retry-After`; Anthropic's include `anthropic-ratelimit-requests-reset` and `anthropic-ratelimit-tokens-reset` with ISO 8601 timestamps.

Agent retry logic must parse these headers. An agent that retries at full speed after receiving a 429 — ignoring the `Retry-After` — will receive another 429 immediately, then another, compounding the thundering-herd problem across a fleet.

The `x-ratelimit-remaining-requests` and `x-ratelimit-remaining-tokens` response headers (available in OpenAI's API) provide preemptive visibility: agents can track remaining quota client-side and proactively slow down before hitting the 429, rather than waiting for the error to occur. This is preferable to reactive backoff for latency-sensitive pipelines.

## Backoff and Retry Strategies

### Exponential Backoff with Full Jitter

Exponential backoff is the baseline retry strategy for 429 responses: after each failed attempt, the wait duration doubles up to a configured maximum.

```
wait = min(max_delay, base_delay * 2^attempt)
```

With `base_delay = 1s` and `max_delay = 60s`: attempts wait 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, ... This spacing prevents the agent from hammering the provider repeatedly but introduces a problem: if multiple agents all hit the limit at the same time (common in parallel pipelines), they all back off for the same duration and retry together — the thundering-herd collision.

Full jitter adds a random component to the delay:

```
wait = random_uniform(0, min(max_delay, base_delay * 2^attempt))
```

The AWS jitter paper (2015) measured full jitter reducing mean retry latency by approximately 63% compared to fixed-interval retries under contention. When a fleet of 20 agents all receive a 429 at the same time, jitter spreads their retries across the entire backoff window instead of concentrating them at the same moment.

For implementation details on reliability patterns including circuit breakers and broader retry logic, see [AI agent reliability patterns including circuit breakers and retry logic](/learn/ai-agent-reliability).

### Token Bucket vs Leaky Bucket Algorithms

Two algorithms dominate client-side rate limiting before requests even reach the provider:

**Token bucket**: a bucket with capacity `N` fills at a fixed rate of `R` tokens per second. Each API call consumes one token. If the bucket has tokens, the call proceeds immediately. If empty, the call waits until a token is available. This allows burst traffic up to capacity `N` (all queued tokens consumed immediately) while enforcing the average rate `R` over time.

Token buckets are appropriate for agents with bursty-but-infrequent patterns — a batch task that does nothing for 30 seconds then needs to make 20 rapid calls. The accumulated tokens absorb the burst.

**Leaky bucket**: requests enter a queue and drain at a fixed rate, regardless of arrival rate. The output is a constant stream of calls at rate `R`; bursts queue rather than proceed immediately. If the queue fills, excess requests are dropped or rejected.

Leaky buckets enforce consistent latency at the cost of burst capacity. They are appropriate for steady-throughput pipelines where predictable timing matters more than burst speed — streaming agents that process documents one at a time in a predictable sequence.

For multi-agent systems, the token bucket is the more common choice because agents are inherently bursty: they may do nothing while reasoning, then make multiple tool calls in rapid succession.

### Circuit Breaker Pattern for Persistent Rate Limits

A circuit breaker stops sending requests to a provider that is consistently rate-limiting, rather than continuing to retry and accumulate failures. Three states:

**Closed**: requests flow normally. Failures are counted.

**Open**: after a threshold of consecutive 429 or 503 responses (e.g., five in 30 seconds), the circuit opens. All requests are rejected immediately without being dispatched — returning a synthetic 429 to the calling agent. The circuit stays open for a configured cooldown period (e.g., 60 seconds).

**Half-open**: after the cooldown, one probe request is dispatched. Success closes the circuit; failure resets the cooldown.

The circuit breaker prevents a degraded provider from consuming all retry budget while other providers in the failover chain remain available. Without it, every agent in the fleet queues retries against a provider that is already saturated.

### Thundering-Herd Prevention

The thundering herd occurs when a large number of agents simultaneously receive rate-limit errors and retry at the same intervals, re-triggering the same rate limit in waves. Three mechanisms prevent it:

**Jitter on all retries** (described above) — the most impactful single change.

**Staggered agent startup**: when a fleet of agents initializes, stagger their first LLM calls by a random offset across a 10–30 second window. Cold-start thundering herds occur when all agents make their first LLM call at the same moment.

**Pre-emptive slowdown via remaining-quota headers**: agents that monitor their remaining RPM/TPM budget and voluntarily reduce their call rate before hitting zero avoid the synchronized spike that triggers a thundering herd in the first place.

## Per-Tenant and Per-Agent Throttling

### Why Per-Agent Caps Outperform Shared Quotas

A shared quota enforced at the API key level provides one counter for the entire fleet. When the counter is exhausted, the entire fleet is throttled simultaneously. The tenant responsible for the exhaustion and the tenants suffering the degradation are indistinguishable from the provider's perspective.

Per-agent caps enforced at the infrastructure layer (before the external API call) provide isolation:

- Agent A hits its RPM cap → receives a synthetic 429 from the proxy → waits
- Agents B through Z continue operating at their own individual rates, unaffected

The key requirement: per-agent caps must be enforced at the **proxy layer**, not inside agent application code. Agent code can be bypassed — by prompt injection, by bugs, by a developer who removes the check. A proxy the agent cannot bypass cannot be subverted.

For quota and throughput observability — tracking which agents are consuming what quota at what rate — see [AI agent monitoring for quota and throughput observability](/learn/ai-agent-monitoring).

### Implementing RPM and TPM Budgets Per Agent Identity

Per-agent quota tracking requires two counters per agent identity, reset on a rolling window:

**RPM counter**: incremented by 1 on each outbound LLM call. If the counter reaches the configured ceiling, the proxy blocks the call and returns synthetic 429.

**TPM counter**: incremented by the estimated token count on each call (calculated from prompt token count before dispatch; adjusted by actual usage in the response). TPM estimation is inexact before the response, so track actual usage from the response and apply the adjustment to the counter.

Rolling window vs fixed window matters: a fixed window (reset at the top of each minute) is vulnerable to burst-at-boundary exploitation — an agent can send its full RPM allowance in the last 5 seconds of minute N and again in the first 5 seconds of minute N+1, effectively doubling throughput. A sliding window (counts requests in the trailing 60 seconds, updated continuously) prevents this.

### Alerting on Quota Exhaustion Before Agents Fail

Reactive alerting — notifying the operator after a 429 error occurs — is the minimum. Proactive alerting on approaching quota is operationally more useful:

- **80% TPM consumed in the first 30 seconds of a minute**: agent is on track to exhaust before the window resets; signal to throttle proactively.
- **RPM utilization consistently above 70%**: sustained near-capacity operation with no headroom for bursts; signal to request a tier upgrade or redistribute load.
- **Retry rate above 5% of total calls**: agents are hitting the rate limit frequently enough to indicate the quota is under-provisioned for the current workload.

For the full observability stack — tracing rate-limit events through the pipeline and correlating them with task latency — see [AI agent observability for tracing rate-limit events](/learn/ai-agent-observability).

## OpenLegion's Take

Rate limiting in multi-agent systems is a security control before it is an infrastructure concern. A platform that allows agents to call LLM providers directly using a shared credential has no mechanism to prevent one compromised or runaway agent from consuming the entire account's budget. The security boundary is the proxy layer.

Three measurements frame this concretely:

**OpenAI GPT-4o Tier 1: 500 RPM / 30,000 TPM** (January 2025). A three-agent pipeline where each agent sends 300-token prompts and receives 700-token completions consumes 3,000 TPM per parallel batch. The 30,000 TPM budget is exhausted in ten batches — about 12 seconds at 500ms inference latency per call. Without a per-agent cap at the proxy layer, a single agent stuck in a recursive subtask loop can trigger this in under a minute.

**Anthropic Claude API Tier 2: 1,000 RPM / 80,000 input TPM**. Five concurrent agents each sending 1,000-token system prompts exhaust the input TPM ceiling in 16 batches — under 90 seconds. The output TPM limit (16,000 at Tier 2) is typically hit first in summarization or document-generation pipelines.

**OWASP LLM10: Unbounded Consumption** — high-severity. The OWASP threat model specifically identifies per-agent quota enforcement as the mitigation. Applications that rely solely on provider-level rate limits (rather than enforcing per-agent limits before requests leave the platform) are explicitly categorized as non-compliant with the LLM10 mitigation baseline.

OpenLegion's vault proxy enforces per-agent RPM and TPM caps at the mesh layer before any request is dispatched to the upstream provider. The enforcement path:

1. Agent submits an LLM call referencing `$CRED{openai}`.
2. Zone 2 checks the calling agent's sliding-window RPM and TPM counters against the configured per-agent ceiling.
3. If under ceiling: resolves the `$CRED{}` handle, injects the plaintext key into the outbound request, dispatches.
4. If at ceiling: returns a synthetic HTTP 429 with `Retry-After` header. No outbound request is made. No provider quota is consumed.

Because `$CRED{}` handles are never exposed to agent code, agents cannot bypass the proxy by resolving the key themselves. The shared API key is never reachable from agent address space — only Zone 2 can resolve it, and Zone 2 enforces the quota check before resolution.

| **Control** | **LangChain / LangGraph** | **CrewAI** | **OpenAI Agents SDK** | **OpenLegion** |
|---|---|---|---|---|
| **Per-agent RPM cap** | Manual / library | Manual / library | Not built-in | Proxy-enforced, mesh layer |
| **Per-agent TPM tracking** | Manual | Manual | Not built-in | Proxy-enforced, mesh layer |
| **Synthetic 429 before provider call** | Not available | Not available | Not available | Native |
| **$CRED{} handle isolation** | Not available | Not available | Not available | Native |
| **Sliding-window counter** | Not built-in | Not built-in | Not built-in | Native |
| **Per-tenant budget cap** | Developer convention | Developer convention | Developer convention | Zone 2 enforcement |

## Rate Limiting vs Cost Control vs Reliability

These three disciplines overlap but address different failure modes. Deploying all three together provides defense in depth.

### Rate Limiting vs Cost Optimization

**Rate limiting** (this page): prevents agents from exceeding API quota caps, isolates per-tenant throughput, prevents denial-of-wallet via per-agent spend ceilings. The question rate limiting answers: "Can this agent make this call right now without exceeding its quota?"

**Cost optimization**: reduces the token cost of each call through model selection (cheaper model for simple tasks), prompt compression, output caching, and batch inference. The question cost optimization answers: "What is the cheapest way to accomplish this task?" For strategies including model routing and semantic caching, see [LLM cost optimization techniques for multi-agent pipelines](/learn/llm-cost-optimization).

Both are required. A cost-optimized pipeline still needs rate limiting to prevent runaway loops from exhausting the reduced-cost budget. A rate-limited pipeline still benefits from cost optimization to stretch the quota further within the enforced ceiling.

### Rate Limiting vs Circuit Breakers

**Rate limiting** enforces quotas on the caller side: "this agent may not exceed N requests per minute."

**Circuit breakers** respond to failures on the provider side: "this provider has returned N consecutive errors; stop sending requests to it." A circuit breaker can open in response to rate-limit errors (429) as well as availability errors (503), but it operates at the provider level, not the per-agent level.

The two complement each other: per-agent rate limiting prevents any single agent from exhausting the shared quota; circuit breakers prevent a degraded provider from accumulating retry failures across all agents simultaneously.

### When to Use All Three Together

A production multi-agent pipeline under heavy load needs:

1. **Per-agent rate limiting** at the proxy layer — prevents individual agents from exceeding their quota and affecting others
2. **Exponential backoff with jitter** in retry logic — prevents thundering-herd collisions when multiple agents receive 429 simultaneously
3. **Circuit breakers per provider** in the LLM gateway — prevents retry storms against a degraded provider; routes traffic to healthy fallback endpoints

These three operate at different layers (per-agent, per-retry, per-provider) and are not substitutes for each other. Each addresses a failure mode the others do not.

## Get Started

Rate limits should not be a source of production failures. OpenLegion's vault proxy enforces per-agent RPM and TPM caps at the mesh layer — before any request leaves your infrastructure. Runaway agents receive a synthetic 429; your shared budget stays intact; your other tenants continue unaffected.

[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Compare rate limiting patterns across frameworks](/learn/ai-agent-reliability)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is the difference between RPM and TPM rate limits?

RPM (requests per minute) caps the number of API calls per minute regardless of payload size; TPM (tokens per minute) caps total token throughput — both input and output tokens counted together. Hitting either limit returns HTTP 429. Most LLM providers enforce both independently, so a pipeline sending short prompts with long completions may exhaust TPM while staying well under RPM, or vice versa. Effective rate-limit handling tracks both counters client-side and applies the same backoff logic regardless of which limit was hit.

### How should an AI agent handle a 429 Too Many Requests error?

On receiving a 429, the agent should first read the `Retry-After` header and wait the specified duration before retrying. If no `Retry-After` header is present, apply exponential backoff starting at 1 second, doubling to a maximum of 60 seconds, with random jitter (±25%) added to each delay to prevent thundering-herd collisions when multiple agents hit the limit simultaneously. After five failed retries, route through a fallback model or escalate to a supervisor agent rather than continuing to retry. Never retry immediately at full speed after receiving a 429.

### What is exponential backoff with jitter and why does it help?

Exponential backoff increases the retry delay by a multiplier (typically 2×) after each failure, spacing retries out over time. Jitter adds a random offset to each delay, preventing all agents in a fleet from retrying in unison — the thundering-herd problem where synchronized retries re-trigger the rate limit instantly after the window resets. The AWS full-jitter paper (2015) measured jitter reducing mean retry latency by approximately 63% compared to fixed-interval retries under contention. Without jitter, exponential backoff still produces synchronized retry waves that cause repeated rate-limit collisions.

### How do I set per-agent rate limits in a multi-agent system?

Each agent identity should have its own RPM and TPM budget tracked at the infrastructure layer rather than inside agent application code. A mesh-level proxy or LLM gateway intercepts every outbound LLM call, checks the calling agent's sliding-window quota counters, and either dispatches the request or returns a synthetic 429 before the external API is ever reached. Sliding-window counters (rather than fixed-window counters that reset at clock boundaries) prevent agents from double-bursting at window resets. This approach ensures a single compromised or runaway agent cannot exhaust the shared budget regardless of what instructions it receives.

### What is a denial-of-wallet attack in the context of AI agents?

A denial-of-wallet attack is when an adversary — or a runaway agent loop triggered by a prompt injection payload — causes excessive LLM API calls that exhaust the account's spend limit or API quota, blocking legitimate requests and accumulating a large invoice. OWASP LLM Top 10 v1.1 (2025) classifies this as LLM10: Unbounded Consumption, a high-severity risk. Unlike a classic denial-of-service, denial-of-wallet attacks target cost rather than availability, and the financial damage persists after the attack ends in the form of the billing period's invoice. Per-agent rate limiting with a proxy-enforced synthetic 429 is the primary structural mitigation.

### How does a token bucket differ from a leaky bucket for rate limiting?

A token bucket accumulates tokens at a fixed rate up to a maximum capacity and consumes one token per request — allowing burst traffic up to the bucket capacity when tokens have built up, then enforcing the average rate once the bucket is empty. A leaky bucket queues incoming requests and drains them at a constant output rate regardless of arrival speed, preventing any bursting but enforcing consistent latency. Token buckets suit agents with bursty-but-infrequent call patterns (batch tasks that pause then need rapid calls), while leaky buckets suit steady-throughput pipelines where consistent timing matters more than burst capacity. Most agent platforms use token bucket semantics because agent tool calls are inherently bursty by nature.
