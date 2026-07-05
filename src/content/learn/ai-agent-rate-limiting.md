---
title: "AI Agent Rate Limiting — Quota Control, Circuit Breakers, and Budget Caps"
description: "AI agent rate limiting stops API quota exhaustion and runaway loops. Token bucket algorithms, circuit breakers, per-agent budget caps, and mesh-layer enforcement before calls reach the LLM provider."
slug: /learn/ai-agent-rate-limiting
primary_keyword: ai agent rate limiting
last_updated: "2026-07-05"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-cost
  - /learn/llm-cost-optimization
  - /learn/ai-agent-observability
  - /learn/llm-gateway
  - /learn/ai-agent-sandboxing
  - /learn/ai-agent-reliability
---

# AI Agent Rate Limiting — Quota Control, Circuit Breakers, and Budget Caps

AI agent rate limiting is the practice of constraining how frequently autonomous agents call external APIs, consume tokens, or spend budget — enforced at the runtime layer before requests reach the LLM provider. Without per-agent limits, a fleet of 10 parallel agents making 1 GPT-4o call per second exhausts OpenAI Tier 1's 500 RPM quota in 50 seconds, triggering 429 errors that cascade into retry storms and API bans. Rate limiting is the architectural boundary between controlled agent systems and runaway cost explosions.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent rate limiting** is the enforcement of maximum call frequency, token consumption, and budget spend per autonomous agent at the infrastructure layer, using algorithms such as token bucket and circuit breaker to prevent quota exhaustion, retry storms, and cost explosions in multi-agent systems.

## Why Multi-Agent Systems Break Rate Limits

### The Quota-Sharing Problem: Parallel Agents vs. Per-Account Limits

API providers issue rate limits per account, not per agent. OpenAI Tier 1 limits `gpt-4o` to 500 RPM and 30,000 TPM across all callers sharing the same API key. A single developer making 5 manual queries per minute barely registers. A fleet of 10 agents making 1 call per second each generates 600 RPM — 20% over the Tier 1 ceiling — before any of them finishes their first task.

This is the quota-sharing problem: the limit is shared but the consumption is distributed. No individual agent is misbehaving; each is making exactly the calls it was designed to make. The aggregate behavior exceeds the limit. Application-layer rate limiting (each agent self-polices) does not solve this, because each agent has no visibility into what the others are doing. Only infrastructure-layer enforcement — a shared rate limiter sitting above all agents — can enforce the aggregate.

The provider-side limit structure for major APIs as of mid-2026:

| **Provider** | **Model** | **Tier 1 RPM** | **Tier 1 TPM** | **Tier 1 RPD** |
|---|---|---|---|---|
| **OpenAI** | gpt-4o | 500 | 30,000 | 10,000 |
| **OpenAI** | gpt-4o-mini | 500 | 200,000 | 10,000 |
| **Anthropic** | Claude 3.5 Sonnet | 50 | 40,000 | 1,000 |
| **Google** | Gemini 1.5 Pro | 360 | 4,000,000 | — |

Anthropic's Tier 1 limits are tighter still: 50 RPM and 1,000 RPD. A fleet of 5 agents each making 1 call per minute exceeds the 50 RPM ceiling in hours by RPD alone. These limits apply before you have a production-scale system; they are precisely the regime where agent fleet development happens.

### How Retry Storms Amplify a Single 429 Into a Cascading Failure

A 429 Too Many Requests response triggers retry logic in most agent frameworks. When 10 agents hit the rate limit simultaneously, they all receive 429s simultaneously. If each retries after a fixed 1-second delay, they all retry simultaneously — generating another 10-RPM burst, producing another wave of 429s, and so on indefinitely. This is the thundering herd: a single rate limit breach propagating into a self-sustaining failure loop.

The amplification is multiplicative. In a 10-agent fleet, a single rate limit hit means 10 simultaneous retries. Each retry wave is indistinguishable from the original burst that triggered the 429. The fleet is locked in a retry storm: no progress, continuous API calls, accumulating error count, and — critically — continuing token consumption on agents that manage partial progress before hitting the ceiling.

Retry storms have a secondary cost effect: each failed call that consumed partial context is billed. An agent that makes 100 calls during a retry storm, where 70 are 429s and 30 are partial completions, pays for 30 partial completions at full token cost. No useful work is produced but real money is spent.

The fix is not better retry logic on each agent. Coordinated retry behavior requires a shared rate limiter that knows the aggregate state — when the account is in a 429 condition, all agents back off together, not independently.

### Real Failure Mode: 10 Agents × 1 Call/Sec = Quota Exhaustion in 50 Seconds

Concretely: 10 agents, each running a ReAct loop making 1 GPT-4o call per second, against an OpenAI Tier 1 account.

- **t=0s**: All 10 agents start, each fires their first call. 10 RPM consumed in 1 second.
- **t=50s**: 500 RPM exhausted. All 10 agents receive 429. None have finished.
- **t=51s**: All 10 agents retry simultaneously. 429 again.
- **t=60s**: Rate limit resets (OpenAI RPM is a 1-minute rolling window). All 10 agents retry. 500 RPM consumed in 50 more seconds.
- **Cycle repeats indefinitely.**

The RPD limit of 10,000 means the account also exhausts its daily request budget in `10,000 / (10 agents × RPM available)` ≈ 20 minutes at 10 concurrent agents. No single-agent safeguard prevents this; the problem requires fleet-level quota management.

For how these costs compound across agentic loops and the per-task cost anatomy, see [per-agent cost architecture and budget cap configuration](/learn/ai-agent-cost).

## Rate Limiting Algorithms for Agent Pipelines

### Token Bucket: The Standard Primitive (RFC 1633)

The token bucket algorithm (IETF RFC 1633, 1994) is the mathematical foundation for rate limiting in network systems and the correct primitive for LLM API quota management.

**How it works:**
- A bucket holds tokens, refilled at a constant rate R tokens per second, up to a capacity C.
- Each API call consumes one token (or N tokens for weighted calls based on input size).
- If the bucket has tokens, the call proceeds immediately.
- If the bucket is empty, the call blocks or is rejected.

**Key properties:**
- **Burst tolerance**: up to C calls can proceed instantly before the refill rate kicks in. This models real API behavior — OpenAI's RPM limit allows a burst of 500 calls at once, not 8.3 calls per second exactly.
- **Smooth average**: over time, the average call rate converges to R regardless of burstiness. An agent that pauses for 10 seconds accumulates 10 × R credits, enabling a burst within the bucket's capacity.
- **Per-agent implementation**: each agent gets its own bucket with capacity C_agent = C_total / N_agents. The buckets are managed by a shared service (not each agent independently) to prevent agents from over-counting available tokens.

**Implementation for a 10-agent fleet against OpenAI Tier 1 (500 RPM):**
- Shared bucket: capacity = 500, refill rate = 500 tokens/minute = 8.33 tokens/second
- Per-agent allocation: each agent gets a dedicated sub-bucket with capacity 50 (500/10), refill rate 0.833/second
- Alternatively: single shared bucket, agents compete for tokens via a queue

Token bucket is the right primitive because it handles bursty agent behavior naturally — agents that pause during tool execution accumulate credits they can spend when they return to LLM calls, without being penalized for normal async behavior.

### Leaky Bucket: Smoothing Bursty Agent Traffic

The leaky bucket algorithm processes requests at a constant output rate regardless of input burst. Requests enter a fixed-capacity queue; the queue drains at rate R. If the queue is full, new requests are dropped.

**Properties vs. token bucket:**
- Token bucket: output rate varies up to burst capacity, average is bounded
- Leaky bucket: output rate is constant, bursts are absorbed into the queue, overflow is dropped

For LLM agent pipelines, leaky bucket is appropriate when the downstream target (the API provider) has strict per-second rate limits rather than per-minute RPM limits with burst tolerance. Anthropic's API has tighter burst behavior than OpenAI's; leaky bucket better models Anthropic's rate envelope.

**Practical implication:** a 50-RPM Anthropic limit with leaky bucket enforcement means agents are queued at exactly 0.833 calls/second, regardless of how many agents are waiting. A 20-agent fleet calling Claude 3.5 Sonnet all get fair-queued service at the maximum sustainable rate rather than a thundering-herd burst followed by silence.

### Sliding Window Counter: Per-Minute Precision Without Clock Boundary Spikes

Fixed window counters reset at clock boundaries (e.g., every 60 seconds on the minute). This creates a spike vulnerability: 500 requests in the last 1 second of minute 1, then 500 requests in the first 1 second of minute 2 = 1,000 requests in 2 seconds — technically within the per-minute limit but exceeding the API's actual throughput tolerance.

Sliding window counters replace the fixed reset with a rolling window: the count for the past 60 seconds is computed continuously, not at discrete boundaries. Implementation: maintain a circular buffer of N slots (N = window_size / slot_duration), increment the current slot on each request, sum all slots for the current count.

**Why it matters for agent fleets:** agent call patterns are not uniformly distributed. An agent completing a multi-step task fires a burst of calls in the last few seconds, then goes silent for tool execution. Fixed windows that happen to align with these bursts cause unnecessary throttling. Sliding windows absorb the burst correctly, measuring only whether the rolling 60-second call rate exceeds the limit.

## Retry Strategies That Don't Make Things Worse

### Exponential Backoff: Base Formula and Recommended Constants

Exponential backoff increases the delay between retry attempts geometrically, giving the API provider time to recover and reducing the probability that all retrying agents collide at the same time.

**Base formula:**
```
wait = min(cap, base * 2^attempt)
```
**AWS Well-Architected Framework recommended constants** (Exponential Backoff and Jitter, 2015):
- `base` = 1 second
- `cap` = 64 seconds (maximum wait)
- `attempt` = retry attempt number (0-indexed)

At these constants:
- Attempt 0: wait = min(64, 1 × 2^0) = 1s
- Attempt 1: wait = min(64, 1 × 2^1) = 2s
- Attempt 2: wait = min(64, 1 × 2^2) = 4s
- Attempt 3: 8s, Attempt 4: 16s, Attempt 5: 32s, Attempt 6+: 64s (capped)

Without jitter, exponential backoff still produces a thundering herd: 10 agents that all hit a 429 simultaneously all back off for 1s, then 2s, then 4s — synchronized. The improvement is that the burst frequency decreases with each retry, eventually giving the API time to recover. But the synchronization problem persists.

### Adding Jitter: Why Randomness Prevents Thundering Herd

Jitter adds a random component to the backoff delay, desynchronizing agents that experienced the same 429 at the same time.

**Full jitter** (AWS recommendation):
```python
sleep = random.uniform(0, min(cap, base * 2**attempt))
```

With full jitter, 10 agents each draw a random delay from [0, 1s] on the first retry. Their retry calls are spread across a 1-second window rather than all firing at t+1s simultaneously. On the second retry, they draw from [0, 2s], spreading across 2 seconds. By attempt 3 (4s window), 10 agents spread across 4 seconds average 2.5 agents/second — well within the API's sustained rate.

**Equal jitter** (partial randomization):
```python
v = min(cap, base * 2**attempt) / 2
sleep = v + random.uniform(0, v)
```

Equal jitter guarantees a minimum wait of `cap/2` while adding randomization. It prevents extreme cases where full jitter draws a near-zero delay, which can produce early thundering herds.

For agent fleets, full jitter reduces thundering-herd probability by O(N) for N retrying agents — the AWS Well-Architected Framework's quantification. A 10-agent fleet with full jitter produces 10× fewer simultaneous retries than without jitter, reducing the probability of a second 429 wave from the retry itself.

### Circuit Breaker Pattern: Stop Retrying After N Consecutive 429s

The circuit breaker pattern (Michael Nygard, *Release It!*, 2007, Pragmatic Bookshelf) tracks the failure rate of a downstream service and opens a circuit after N consecutive failures, causing subsequent calls to fail immediately without making the network request.

**Three states:**
- **Closed** (normal operation): calls pass through. Failures are counted.
- **Open** (tripped): calls return immediately with a circuit-open error. No API calls are made. The circuit opens after N consecutive failures within a time window.
- **Half-open** (probe): after a configured timeout, one probe call is allowed through. If it succeeds, the circuit closes. If it fails, the circuit re-opens.

**For AI agent pipelines:**
- N = 5 consecutive 429s trips the circuit (configurable)
- Open timeout = 60 seconds (one rate limit window)
- Half-open probe: a single lightweight call (smallest available request) to test recovery

When the circuit is open, agents receive an immediate error instead of waiting for the exponential backoff chain to complete. This is the critical distinction: circuit breakers stop wasting time and money on calls that are guaranteed to fail. An open circuit means "the provider is currently rejecting our requests; wait and try later," preventing the cost accumulation of a full retry storm.

**Integration with agent orchestrators:** the circuit breaker state is global to the account, not per-agent. All agents share the same circuit. When it opens, all agents are simultaneously informed that the provider is unavailable, enabling them to park pending work rather than queue it.

For circuit breaker patterns in the broader context of fault tolerance and agent reliability, see [agent reliability patterns including fault tolerance and retry design](/learn/ai-agent-reliability).

### Dead-Letter Queues: Preserving Agent Work Across Rate Limit Windows

When an agent's task fails due to rate limiting after the retry budget is exhausted, the work must not be lost. A dead-letter queue (DLQ) stores failed tasks with their full context — the task parameters, the current state of any partial progress, the failure reason and timestamp.

**DLQ requirements for agent pipelines:**
1. **Ordered by failure time**: the DLQ drains in FIFO order; oldest failed tasks retry first when quota recovers
2. **State-preserving**: the full agent state at failure time is stored, not just the input. An agent that completed 3 of 7 sub-tasks before hitting the rate limit resumes from step 4, not step 1.
3. **Deduplication**: a retry of a non-idempotent task (e.g., an API POST that creates a record) must detect whether the original attempt succeeded before the 429 and not re-execute
4. **Expiration**: tasks older than a configured TTL are expired from the DLQ to prevent unbounded growth

DLQs decouple rate limit recovery from agent execution: the agent is freed from retry responsibility after its initial attempt, the DLQ handles recovery, and quota is consumed only when the provider is ready to accept calls.

## Per-Agent vs. Shared Pool Quota Architecture

### Shared Pool: Simpler but One Runaway Agent Tanks the Fleet

In a shared pool architecture, all agents draw from a single quota bucket. Implementation is straightforward: one token bucket, one rate limiter instance, all agents pass through it.

**The problem:** a single runaway agent — stuck in a loop, misconfigured, or processing an unexpectedly large batch — can consume the shared pool, causing 429s for every other agent in the fleet. OWASP LLM Top 10 v1.1 (2025), LLM04 (Model Denial of Service) explicitly classifies unrestricted agent loops as a security risk: an agent consuming excessive resources degrades availability for all agents sharing the same infrastructure, which is equivalent to a self-inflicted denial of service.

In a shared pool, one LLM04-class event tanks the entire fleet. The diagnosis is straightforward: check which agent ID generated the spike. The mitigation requires post-hoc remediation (kill the runaway agent, wait for quota to recover). The damage — failed tasks across the fleet — is already done.

### Per-Agent Quotas: Isolation Guarantees at the Cost of Headroom

Per-agent quotas assign each agent a fixed fraction of the total quota, enforced at the infrastructure layer. A 10-agent fleet with 500 RPM total gets 50 RPM per agent. A runaway agent can only exhaust its own 50-RPM allocation; the other 450 RPM remain available for the rest of the fleet.

**Trade-off:** unused quota is not shared. An agent that is idle for 10 minutes holds 500 credits in its token bucket that no other agent can use, even if all other agents are 429-limited. Per-agent isolation sacrifices utilization efficiency for fault isolation.

**Mitigations for the headroom problem:**
- **Burst borrowing**: agents can temporarily borrow tokens from a shared reserve pool (up to a configured limit) when their own allocation is exhausted, subject to the shared pool availability
- **Dynamic reallocation**: the quota manager monitors per-agent utilization and shifts allocation toward busy agents in real time
- **Minimum + burst model**: each agent is guaranteed a minimum quota (e.g., 20 RPM) and can burst to a higher cap (e.g., 100 RPM) subject to shared pool availability

### Hierarchical Limits: Per-Agent Caps Within Shared Organizational Budgets

Production rate limiting is hierarchical: organizational limits → team limits → per-agent limits. This maps directly onto API provider billing structures, which are per-API-key (organizational), and per-model (pool within the key).

**Four-level hierarchy:**
1. **Provider ceiling**: OpenAI Tier 1, 500 RPM total for the account — set by the provider, not configurable
2. **Organizational budget**: daily/monthly token budget enforced by the internal rate limiter — set to 80% of the provider ceiling to maintain headroom
3. **Team allocation**: each team or project gets a fraction of the organizational budget — e.g., 3 teams, each with 150 RPM allocation
4. **Per-agent cap**: each agent within a team gets a sub-allocation — e.g., 10 agents per team, 15 RPM each

Enforcement at each level is independent. Hitting the per-agent cap is a local event (the agent queues). Hitting the organizational budget is a fleet-wide event (all agents queue). Hitting the provider ceiling is an account-level event (all internal limits become moot until the window resets).

### Provider-Level vs. Application-Level Enforcement

**Application-level enforcement** (the agent itself self-polices): the agent tracks its own call count and waits when it approaches its configured limit. Problems:
- Agents have no visibility into other agents' consumption (shared pool problem)
- Application code can be bypassed by agent task instructions (OWASP LLM04 implication)
- No enforcement across restarts: a restarted agent has a clean counter and doesn't know what it consumed before the restart

**Infrastructure-level enforcement** (a shared rate limiter sitting between agents and the API): all API calls pass through the rate limiter. Problems:
- Adds latency on the hot path (network round-trip to the rate limiter)
- Single point of failure if the rate limiter is unavailable

Infrastructure-level enforcement is the correct approach for two reasons: (1) it provides the only mechanism for accurate aggregate accounting across a multi-agent fleet, and (2) it is the only mechanism that cannot be bypassed by agent behavior or prompt injection — the rate limiter is not in the agent's context window, and no LLM output can raise its own rate limit.

For rate limiting at the LLM gateway layer and how centralized proxy enforcement works, see [LLM gateway layer for centralized rate limit enforcement](/learn/llm-gateway).

## OpenLegion's Take: Mesh-Layer Enforcement Over Application Retries

The application-layer retry pattern is the industry default because it is the path of least resistance: add `retry(max=3, backoff=exponential)` to each LLM call, ship the code, move on. This works for single-agent applications with infrequent calls. It fails at scale because it solves the wrong problem.

Three concrete numbers that define the failure mode:

**OpenAI Tier 1 limits gpt-4o to 500 RPM and 30,000 TPM.** A fleet of 10 parallel agents each calling once per second hits the ceiling in 50 seconds. Every additional agent cuts that time proportionally: 20 agents → 25 seconds, 50 agents → 10 seconds. Application-layer retry loops on each agent make this worse, not better — each agent retrying independently generates more RPM, not less. The fix requires aggregate quota management at a layer above all agents.

**OWASP LLM Top 10 v1.1 (2025), LLM04 — Model Denial of Service** classifies unrestricted agent loops as a top-10 LLM security risk. The threat model: a compromised or misconfigured agent makes unbounded API calls, exhausting quota for the entire account and causing a self-inflicted denial of service. Application-layer self-policing cannot prevent this because the misconfigured agent is the enforcer. Only infrastructure-layer enforcement — a rate limiter the agent cannot influence — provides the isolation guarantee. OpenLegion's mesh router enforces this at the authenticated session layer: the agent's JWT identifies it, its `daily_budget` and `monthly_budget` are resolved from the session context, and requests are rejected at the mesh boundary before they reach the LLM provider.

**OpenLegion enforces per-agent `daily_budget` ($50/day default) and `monthly_budget` ($200/month default) server-side** — blocked at the network layer before the LLM provider sees the request. These limits are set in the agent's `INSTRUCTIONS.md`, committed to git, and cannot be modified by the agent's LLM output. A prompt injection that instructs an agent to "ignore budget limits and make unlimited calls" changes the agent's context window; it does not change the mesh router's session-context budget check. The enforcement is out-of-band from the LLM's reasoning loop by design.

The circuit breaker pattern (Michael Nygard, *Release It!*, 2007) and exponential backoff with full jitter (AWS Well-Architected Framework) are correct application-layer retry behaviors that reduce thundering-herd damage after a 429. They do not prevent quota exhaustion. They are the right response after the rate limiter has already done its job — not a substitute for it.

| **Rate limiting property** | **OpenLegion** | **LangGraph** | **CrewAI** | **LiteLLM proxy** |
|---|---|---|---|---|
| **Enforcement layer** | Mesh router, network layer (before LLM call) | Application code (each node) | Application code (each agent) | Reverse proxy (HTTP layer) |
| **Per-agent isolation** | Per-agent budget from session JWT | Not built-in (shared per-run) | Not built-in | Per-key or per-user limits (config) |
| **Budget caps** | daily_budget, monthly_budget in INSTRUCTIONS.md | Not available | Not available | Budget limits per key (USD config) |
| **Circuit breaker built-in** | Mesh router opens on N consecutive 429s | Not available | Not available | Available via callbacks |
| **Retry strategy** | Exponential backoff with full jitter, DLQ on exhaustion | User-configurable | User-configurable | Configurable with fallback models |
| **Observable metrics** | 429 rate, queue depth, budget consumed per agent in mesh telemetry | LangSmith (manual) | Manual | Prometheus scrape endpoint |

For OS-level isolation that complements rate limiting by containing agent processes, see [agent sandboxing and OS-level runtime isolation](/learn/ai-agent-sandboxing).

## Implementing Rate Limiting in Practice

### Rate Limiting at the LLM Gateway Layer

An LLM gateway is the correct location for aggregate rate limiting: it is the single ingress point for all LLM API calls, it has visibility into the full call volume from all agents, and it is positioned to enforce limits before requests reach the provider.

**LLM gateway rate limiter implementation components:**
1. **Token bucket per agent ID**: each authenticated agent gets its own bucket; capacity = per-agent RPM allocation; refill rate = allocation/60 per second
2. **Shared organizational bucket**: all calls additionally pass through the organizational bucket; capacity = provider ceiling × 0.8 (20% headroom); refill rate = cap/60 per second
3. **Priority queue**: high-priority tasks (user-facing, real-time) jump the queue over background batch tasks
4. **429 pass-through**: when the provider returns a 429, the gateway marks the account as throttled and stops forwarding queued requests until the window resets
5. **Backpressure signals**: blocked requests receive a structured response with the expected wait time, enabling upstream orchestrators to reschedule rather than busy-wait

**LiteLLM proxy** (open-source, Apache 2.0) provides this as a deployable component: per-key rate limits, budget caps in USD, fallback models when a provider is rate-limited, Redis-backed distributed state for multi-instance deployments. Configurable via YAML:

```yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      rpm_limit: 500
      tpm_limit: 30000

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  alerting: ["slack"]
  max_budget: 200  # USD monthly
```

### Backpressure Signals: Surfacing 429s to Orchestrators

A rate-limited agent should not spin-wait for quota to recover. Spinning wastes compute, generates log noise, and holds open connections that block other agents. The correct behavior is to surface a structured backpressure signal to the orchestrator, which then parks the agent until quota is available.

**Backpressure signal schema** (returned to the orchestrator on rate limit hit):
```json
{
  "status": "rate_limited",
  "retry_after_seconds": 47,
  "quota_scope": "account",
  "agent_id": "agent-research-7",
  "task_id": "task-a3b9",
  "parked_at": "2026-07-05T14:23:11Z"
}
```

The orchestrator receives this signal and adds `agent-research-7` to a parked queue with a wakeup at `now + retry_after_seconds`. The agent's task context is preserved in state storage. At wakeup, the orchestrator checks quota availability before unparking.

This pattern requires stateful orchestration — the orchestrator must track parked agents, their task contexts, and their scheduled wakeup times. For event-driven orchestrators (those that react to completion events rather than polling), this maps naturally: the rate limiter emits a "quota-available" event when the window resets, triggering the orchestrator to dequeue parked agents.

### Request Coalescing: Batching Agent Calls to Reduce RPM

Request coalescing combines multiple independent agent LLM calls into a single batched call, reducing RPM consumption by N× for N coalesced calls. OpenAI's Batch API (released 2024) accepts up to 50,000 requests per batch file and applies a 50% discount on all batch-processed tokens.

**When coalescing applies:** non-time-critical, parallelizable LLM calls where each call is independent (no dependency on previous outputs). Examples: evaluating 1,000 data records against a fixed prompt, generating summaries for 500 documents, classifying items in a large dataset.

**When coalescing does not apply:** ReAct loops (each step depends on the previous tool call result), streaming user interactions, time-critical tasks where latency matters.

**Coalescing implementation at the gateway level:**
- Incoming calls are buffered for a configurable window (e.g., 100ms)
- Calls sharing the same model, system prompt, and response format are grouped into a batch
- The batch is submitted as a single API call (or Batch API request for async)
- Responses are routed back to the originating agents

At 10 agents × 50 calls/agent = 500 calls, submitting as a single Batch API job reduces RPM from 500 to 1, eliminates the rate limit concern entirely for the batch, and cuts token cost by 50%.

### Monitoring: Key Metrics — 429 Rate, Queue Depth, Retry Latency

Rate limiting without monitoring is a black box. The metrics that matter:

**429 rate by agent ID**: `(429_count_per_agent / total_calls_per_agent)`. A 429 rate > 5% indicates the per-agent quota is too low or the agent is making calls at unsustainable frequency. A 429 rate of 0% for all agents may indicate the rate limiter is throttling before calls reach the provider — check queue depth instead.

**Queue depth by priority tier**: how many tasks are waiting for quota. Rising queue depth with stable 429 rate indicates organic demand growth — time to upgrade API tier. Rising queue depth with high 429 rate indicates a runaway agent or burst event — check per-agent call rates.

**Retry latency**: time from first 429 to successful call. Retry latency > 60 seconds indicates the circuit breaker is open or exponential backoff caps are misconfigured. Retry latency of 0 after a 429 indicates the circuit breaker is not implemented — retries are immediate.

**Budget consumed per agent per day**: cumulative cost per agent ID. An agent spending $48 of its $50 daily budget by noon needs investigation — is this legitimate task volume, a runaway loop, or a cost spike from large context windows?

For the full observability stack covering these metrics, dashboards, and alerting thresholds, see [observability tooling to track 429 rates and retry latency](/learn/ai-agent-observability).

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent rate limiting?

AI agent rate limiting is the enforcement of maximum call frequency, token consumption, and budget spend for autonomous agents at the infrastructure layer, using algorithms such as token bucket and circuit breaker to prevent API quota exhaustion, retry storms, and cost explosions. Rate limiting answers the question: "How do we ensure a fleet of agents never exceeds the API provider's limits?" — a question that cannot be answered by each agent individually because agents have no shared visibility into each other's call volume. Infrastructure-layer enforcement, sitting above all agents, is the only mechanism that can account for aggregate consumption and enforce limits that hold even when individual agents are misconfigured or running in a loop.

### Why do multi-agent systems hit rate limits faster than single-model apps?

Multi-agent systems share one API key and therefore one rate limit across all agents running simultaneously. OpenAI Tier 1 limits gpt-4o to 500 RPM for the entire account — not per agent. A fleet of 10 agents each making 1 call per second generates 600 RPM and exhausts the 500 RPM ceiling in 50 seconds, at which point every agent receives 429 errors simultaneously. Single-model applications typically have one call path and predictable call rates; agent fleets have N parallel call paths with bursty, asynchronous patterns that amplify peak RPM far above the average rate. The thundering herd failure mode — all agents retrying simultaneously after a 429, generating another 429 wave — is specific to multi-agent systems and requires coordinated backoff, not per-agent retry logic.

### What is the token bucket algorithm and why is it used for LLM rate limiting?

The token bucket algorithm (IETF RFC 1633, 1994) controls call rate by maintaining a virtual bucket of tokens that refills at a constant rate R up to a maximum capacity C. Each API call consumes one token; if the bucket is empty, the call blocks or is rejected. Token bucket is the standard primitive for LLM rate limiting because it models the actual behavior of API provider quotas accurately — providers enforce an average rate (R tokens per time window) with burst tolerance (up to C calls can proceed immediately if the bucket is full). Token bucket naturally handles bursty agent behavior: an agent that pauses for tool execution accumulates credits that it can spend in a burst on the next LLM call, without being penalized for normal async patterns. Shared-pool and per-agent quota architectures are both implemented with token bucket instances at different scopes.

### How does exponential backoff with jitter prevent thundering herd?

Exponential backoff increases the retry delay geometrically after each failure — 1s, 2s, 4s, 8s, 16s, 32s, 64s (capped) — using the formula `min(cap, base × 2^attempt)` recommended by the AWS Well-Architected Framework. Without jitter, this still produces synchronized retries: 10 agents that hit a 429 together back off for 1 second together, then retry together, often producing another 429. Full jitter adds randomness by drawing the actual wait time from `uniform(0, min(cap, base × 2^attempt))`, spreading retries across the full backoff window instead of synchronizing them at the window boundary. For N retrying agents, full jitter reduces the probability of a synchronized retry — and a thundering herd — by O(N): 10 agents spread across a 4-second window average 2.5 retries per second, well within most providers' sustained rate, rather than generating a synchronized 10-call burst.

### What is a circuit breaker in the context of AI agent pipelines?

A circuit breaker (Michael Nygard, *Release It!*, 2007, Pragmatic Bookshelf) tracks consecutive failures to a downstream service and opens a circuit after N failures, causing all subsequent calls to fail immediately without making the network request. In the context of AI agent pipelines: after N consecutive 429s (typically 5), the circuit opens and all agents receive an immediate "circuit open" error instead of a blocked LLM call. After a configured timeout (typically 60 seconds — one rate limit window), the circuit enters a half-open state and allows one probe call to test whether the provider has recovered. If the probe succeeds, the circuit closes and normal operation resumes; if it fails, the circuit re-opens. Circuit breakers prevent the cost and latency waste of a full retry storm: agents fail fast, park their tasks, and resume when the circuit closes, rather than queuing hundreds of retries against a provider that will reject all of them.

### Should rate limits be enforced at the application layer or infrastructure layer?

Infrastructure layer — for two reasons. First, application-layer enforcement (each agent self-policing) provides no aggregate visibility: each agent tracks only its own call count and has no awareness of what other agents are consuming. A 10-agent fleet where each agent enforces its own "maximum 50 RPM" generates 500 RPM total, which still exceeds the provider's account-level ceiling. Second, application-layer limits can be bypassed by agent behavior: a stuck loop, a misconfigured task, or a prompt injection that instructs the agent to make additional calls all bypass self-imposed application limits. Infrastructure-layer enforcement sits between agents and the API provider — it is not in the agent's context window and cannot be influenced by LLM output. OWASP LLM Top 10 v1.1 (2025), LLM04 explicitly categorizes unrestricted agent loops as a top-10 security risk, requiring enforcement outside the agent's control.

### How does OpenLegion enforce rate limiting for AI agents?

OpenLegion's mesh router enforces per-agent `daily_budget` ($50/day default) and `monthly_budget` ($200/month default) at the network layer — the budget is resolved from the agent's authenticated session context before the request is forwarded to the LLM provider. The agent's INSTRUCTIONS.md committed to git defines the budget; the mesh router reads it at session initialization. An LLM output that instructs the agent to make additional calls faces the mesh router's enforcement, which is out-of-band from the LLM's reasoning loop and cannot be overridden by context window content. When a per-agent budget is exhausted, the mesh router returns a structured error to the orchestrator; the agent's task is parked in the dead-letter queue rather than dropped. Rate limit hits from the LLM provider (429s) are handled at the mesh layer with exponential backoff and full jitter before the retry reaches the agent's application code. The circuit breaker opens after N consecutive provider 429s, protecting the fleet from thundering-herd retry storms.

## Start Building Rate-Limit-Resilient Agents

Rate limiting is a solved problem at the infrastructure layer — token bucket algorithms, circuit breakers, and exponential backoff with jitter are well-specified primitives that have been in production network systems since RFC 1633 (1994). The gap in most AI agent implementations is not algorithm choice but enforcement layer: self-policing application code cannot enforce account-level quotas, cannot isolate runaway agents from the fleet, and cannot prevent OWASP LLM04 (Model Denial of Service) class failures where a misconfigured loop exhausts API quota for every other agent.

The design pattern that works: enforce aggregate limits at the mesh layer before requests reach the LLM provider, with per-agent budget isolation so one runaway agent cannot tank the fleet, circuit breakers that stop retries when the provider is throttling, and a dead-letter queue that preserves agent work across rate limit windows.

[Start building on OpenLegion](https://app.openlegion.ai) — per-agent budget caps enforced at the mesh layer, circuit breakers and backoff built in.

For the cost architecture that complements rate limiting — loop amplification, per-agent cost attribution, and spend cap configuration — see [per-agent cost architecture and budget cap configuration](/learn/ai-agent-cost).
