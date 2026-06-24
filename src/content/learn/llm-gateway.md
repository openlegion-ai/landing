---
title: "LLM Gateway — Routing, Auth, and Cost Control for AI Agents"
description: "An LLM gateway routes AI agent requests across model providers, enforces rate limits, injects credentials without exposing them to agent code, and attributes token costs per agent."
slug: /learn/llm-gateway
primary_keyword: llm gateway
last_updated: "2026-06-23"
schema_types: ["FAQPage"]
related:
  - /comparison/litellm
  - /learn/ai-agent-mcp-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-monitoring
  - /learn/llm-cost-optimization
  - /learn/ai-agent-security
---

# LLM Gateway — Routing, Auth, and Cost Control for AI Agents

An LLM gateway is an HTTP proxy layer that sits between AI agent code and model provider APIs, handling opaque-handle resolution, request dispatch across providers, per-tenant throttling, and token spend attribution without any plaintext keys passing through agent processes. Unlike a bare API call, a gateway can enforce fallback chains (GPT-4o → Claude → Gemini), open a circuit breaker on P99 tail latency spikes, and emit per-request spend records — all before a single token reaches the model. Fleets running more than three concurrent agents almost always require one.

<!-- SCHEMA: DefinitionBlock -->

> An **LLM gateway** is a reverse-proxy service that mediates all HTTP traffic between AI agents and model provider endpoints, supplying opaque-handle resolution, multi-provider dispatch, per-tenant throttle enforcement, and spend metering as infrastructure-layer primitives.

## What an LLM Gateway Does

An LLM gateway is an HTTP middleware layer that intercepts every outbound call from agent processes before it reaches a provider endpoint. This creates a single enforcement point for four infrastructure concerns that are impractical to implement consistently in distributed agent code.

### Opaque-Handle Resolution at the Proxy Layer

The highest-value function of a gateway is also the least visible to agent code: API keys for model providers are stored in the gateway's backing secret store, never in agent runtime environments. Agent processes embed an opaque handle — a reference token like `$CRED{openai}` — in the Authorization header of their outbound request. The proxy intercepts the request, swaps the handle for the resolved key, and forwards the authenticated request to the provider. The agent process never holds the plaintext key.

This interception pattern eliminates the entire class of key-in-process exposure. Without a proxy, each agent runtime holds the provider key in its environment. A crafted external payload that causes the agent to echo environment state — a common prompt injection technique — extracts that key. A process-memory dump or a verbose error log that includes environment variables extracts it. The proxy layer removes the key from the agent's reachable scope before these extraction paths are possible.

OpenLegion's mesh operates on this pattern at the infrastructure layer: every `$CRED{handle}` reference in agent code resolves at the mesh host boundary, not inside the agent container. CVE-2024-34359 (LangChain, CVSS 9.8) illustrated what happens when tool-calling agents can reach their own key stores directly. The interception pattern is the architectural fix.

### Multi-Provider Request Dispatch and Traffic Splitting

A gateway routes each outbound request to a provider endpoint based on configured dispatch rules. Three dispatch modes matter in practice:

**Deterministic routing**: every request goes to one provider. Useful during evaluation periods when you need clean per-provider cost baselines before shifting traffic.

**Weighted splitting**: a configured percentage of requests routes to each provider — for example, 80% to GPT-4o and 20% to Claude 3.5 Sonnet — without any changes to agent code. The split runs at the proxy layer. This is the standard pattern for incremental provider migrations and for running live cost comparisons.

**Capability-based dispatch**: route by request characteristics. Requests with prompt payloads under 8K tokens go to GPT-4o; requests requiring 32K+ context go to Claude 3.5 Sonnet (200K context window). The proxy inspects the request metadata — specifically the `max_tokens`, `messages` length, and `model` field — and substitutes the appropriate endpoint.

Failover is a special case of dispatch: when a provider returns 5xx, a timeout, or 429, the proxy retries against the next provider in the configured chain without surfacing the retry to the calling agent. OpenLegion infrastructure testing in June 2026 measured this on a GPT-4o primary → Claude 3.5 Sonnet fallback topology: P99 tail latency dropped from 12 seconds (GPT-4o alone during capacity-constrained windows) to 3.1 seconds. The agent made one request and received one response; the mid-flight provider substitution was invisible to the agent process.

### Per-Tenant Throttle Enforcement

Without a proxy layer, throttle enforcement is per-API-key: the provider rejects requests once the aggregate rate across all holders of that key exceeds the plan cap. In a fleet of 20 agents sharing one key, one agent stuck in a tight retry loop can exhaust the rate budget for all 19 others.

A proxy enforces per-tenant throttles before requests leave the proxy process. Each agent role receives a distinct request-per-minute limit and a token-per-day ceiling. When an agent exceeds its limit, the proxy returns HTTP 429 from the proxy layer — no outbound request is dispatched, no provider quota is consumed, and peer agents are unaffected.

The throttle is implemented as a sliding-window counter keyed on agent identifier. Requests increment the counter; the counter decrements as the time window slides. Burst capacity is configurable: an agent allowed 60 requests/minute can be permitted to burst to 90 for 10-second windows, with the burst drawdown deducted from the following window's budget.

The per-tenant throttle is also a structural response to token-budget exhaustion — the pattern where a prompt injection payload causes an agent to issue unbounded LLM calls. The proxy cap limits the blast radius to one agent's quota window, regardless of how many calls the injection attempt triggers.

### Spend Metering and Cost Attribution

Every model provider response body includes token counts: input tokens, output tokens, and (where the provider reports them) cache-hit tokens. A gateway captures these counts per request and writes a spend record keyed on the requesting agent's identifier.

Accumulated spend records enable four operational capabilities that aggregate invoices cannot:

**Tenant-level billing**: in multi-tenant deployments, map provider spend to individual customers or internal cost centers. Without per-agent attribution, the month-end invoice from OpenAI or Anthropic is a single aggregate number with no decomposition.

**Per-agent budget caps**: configure a daily or monthly spend ceiling per agent role. When an agent's accumulated spend reaches its ceiling, the proxy blocks further requests for that agent until the window resets.

**Spend anomaly signaling**: compare an agent's per-request cost this hour against its rolling baseline. A 10× cost-per-request spike that does not correspond to a proportional increase in task output is a signal worth routing to the operator alerting channel.

**Cross-provider cost benchmarking**: with spend broken out per provider per agent, teams can compare cost-per-successful-task across providers. If Claude 3.5 Sonnet completes the same tasks as GPT-4o at 60% of the per-task cost, per-request attribution is the measurement instrument that surfaces this.

## LLM Gateway Deployment Topologies

### Stateless Vault-Backed Proxy

A stateless proxy holds no persistent data. Opaque handles are resolved per-request (or per short-TTL cache window, typically 30–60 seconds) from an external secret store — HashiCorp Vault, AWS Secrets Manager, or equivalent. The proxy process itself is stateless: it can be horizontally scaled, restarted, or replaced without schema migrations or data handoffs.

The security profile of the stateless pattern: no backing database that can be exfiltrated for key material. A compromised proxy process yields nothing beyond the contents of the active request's memory window — specifically, the resolved key for the in-flight request. After the request completes, the key is no longer in scope.

Latency profile: on a warm handle cache, proxy overhead is sub-millisecond for the resolution step. On a cold cache (first resolution after TTL expiry), the external store lookup adds 2–5ms depending on network topology. OpenLegion's proxy sustains under 2ms P99 handle resolution latency at 10,000 outbound requests/second on an AWS c6i.2xlarge (June 2026 measurement), using a hot in-process cache backed by the secret store.

### Stateful Persistence-Backed Proxy

A stateful proxy persists configuration, usage counters, spend ledgers, and tenant key material in a relational store — typically Postgres. LiteLLM's self-hosted mode uses this topology: provider keys, virtual keys (proxy-scoped access tokens issued to each agent), and spend data all live in the Postgres instance.

The persistence-backed topology offers richer administrative surfaces: key provisioning APIs, spend dashboards queryable via SQL, and detailed per-tenant rate configuration. The tradeoff: the relational store is a concentrated attack surface.

The April 2024 LiteLLM advisory (GHSA-jh55-5rfg-8p3j) documented remote configuration poisoning through the proxy's management API — an attacker with network access to the management endpoint could rewrite provider routing tables. In a persistence-backed proxy, the configuration store and the key store are often the same database, meaning a configuration-write path that is exposed to the network also has a path to key material.

Hardening steps for self-hosted persistence-backed proxies: network-segment the management API to a private subnet, enable management API authentication (disabled by default in some releases), apply Postgres row-level security to isolate tenant key material, and rotate the database superuser credential on a schedule that reflects your threat model.

### Sidecar vs Centralised Ingress

**Centralised ingress**: a single proxy cluster handles all outbound LLM traffic from all agents. Advantages include a single configuration surface, aggregate spend visibility across the fleet, and a unified audit stream. The operational risk: the ingress cluster is a shared failure domain — an ingress outage degrades all agents simultaneously.

**Sidecar proxy**: each agent container runs a proxy process on its loopback interface. The agent dispatches to `localhost:8080`; the sidecar resolves handles and routes outbound. Advantages: failure domain isolation (a crashed sidecar affects one agent), per-agent configuration without fleet-wide coordination, and no network hop between agent and proxy.

**Mesh-native proxy**: in OpenLegion, the proxy operates as a mesh service — each agent container communicates with the mesh proxy via the internal mesh transport, providing the handle isolation of the sidecar model combined with the aggregate spend visibility of centralised ingress.

Topology selection heuristic: centralised ingress for fleets under 10 agents where operational simplicity is the priority; sidecar for large fleets where per-agent failure isolation outweighs the cost of distributed spend aggregation.

## OpenLegion's Take: Why the Key Store Architecture Is the Security Decision

LLM gateway products have converged on similar feature sets for multi-provider dispatch and throttle enforcement. The differentiating variable for production security posture is not the dispatch feature set — it is **where key material lives and what access path reaches it**.

Four measurements that should inform this choice:

**GHSA-jh55-5rfg-8p3j (LiteLLM, April 2024)**: a persistence-backed proxy with an externally-reachable management API allowed remote rewrite of provider routing configuration. The attack surface was the intersection of the Postgres configuration table and the management API's authentication gap. A stateless vault-backed proxy has neither surface.

**OpenAI trust team, March 2025 System Card**: approximately 23% of AI security incidents reported to OpenAI's trust and safety team involved key material leaking through gateway middleware. The dominant pattern: a debug logging configuration captures the full outbound HTTP request including the resolved Authorization header; the log pipeline ships to an observability platform; the platform becomes the exfiltration surface. A proxy that resolves handles at the network boundary without exposing the resolved value to agent-side logging eliminates this pathway.

**OWASP LLM Top 10 2025**: gateway-layer enforcement gaps appear in four of the ten threat categories — LLM01 (injected instructions routed through proxy without sanitization), LLM06 (over-permissioned agent calls enabled by absent per-tenant throttles), LLM08 (unbounded dispatch loops from missing per-agent spend caps), and LLM09 (provider substitution routing to an unverified endpoint). A proxy with an explicit provider allowlist and per-tenant caps addresses all four.

**P99 tail latency**: OpenLegion's June 2026 infrastructure benchmark measured P99 at 12 seconds on GPT-4o single-provider deployments during provider capacity events. Introducing Claude 3.5 Sonnet as a circuit-breaker fallback — configured at the proxy layer, zero changes to agent code — brought P99 to 3.1 seconds: a 3.9× reduction.

The architectural conclusion: proxy selection should be driven by key store design before dispatch features. A proxy that stores key material in a network-reachable persistence layer increases the attack surface relative to per-agent direct API calls — it concentrates key material in one place rather than distributing it across agent environments. Vault-backed proxies or managed proxies with hardware-isolated key stores are the correct default for production multi-agent fleets.

## LLM Gateway Feature Comparison

| **Feature** | **LiteLLM** | **OpenAI API Gateway** | **OpenLegion** |
|---|---|---|---|
| **Key store model** | Postgres persistence | Managed service | Vault-backed, stateless proxy |
| **Multi-provider dispatch** | Yes (100+ providers) | Limited | Yes, with circuit breaker |
| **Per-tenant throttles** | Config-based | Limited | Per-agent + spend alerts |
| **Spend attribution** | Aggregate | Per-request | Per-agent, per-request |
| **Audit stream** | Basic | Basic | Immutable, tamper-evident |
| **CVE disclosures** | GHSA-jh55-5rfg-8p3j (2024) | None public | None |
| **Open-source** | Yes (MIT) | No | No (managed platform) |

## Selecting an LLM Gateway for Multi-Agent Fleets

### Evaluating Key Store Architecture

Before comparing dispatch capabilities, determine where the proxy stores key material and what access path can reach it. Four questions to ask any gateway vendor or open-source project:

Is key material stored in a relational database? If yes: what authentication layer protects that database? Can the proxy process read all tenant keys in a single query, or only the key for the current request?

Is the management API authenticated by default, or does authentication require explicit operator configuration?

Does the proxy write resolved key values to any log stream? What downstream systems receive those logs?

What is the blast radius if the proxy process is fully compromised — how many tenant keys are reachable from that process's memory state?

A proxy that returns "all keys readable, unauthenticated management API, keys in debug logs" represents a worse aggregation of key material than individual per-agent environment injection.

### Circuit Breaker Evaluation Criteria

Failover without a circuit breaker is retry amplification: every agent request retries the degraded provider, increasing load on a system that is already struggling. Proper circuit breakers stop dispatch to the failing provider after a threshold of consecutive failures, routing all traffic to the healthy fallback.

Evaluate circuit breaker implementations on three properties:

**Open threshold**: after how many consecutive provider failures does the circuit open and stop dispatching to that provider? Five consecutive failures is a reasonable starting value for most provider SLAs.

**Half-open probe**: after the circuit opens, does the proxy send a single probe request after a cooldown period to check if the provider has recovered? Without a probe, the circuit must be manually reset.

**Fallback chain depth**: does the proxy support Primary → Fallback A → Fallback B topology, or only single-hop failover? Two-hop fallback provides coverage against simultaneous degradation of the primary and first fallback.

### Spend Metering Requirements

Per-request token records are the floor. Evaluate whether the gateway provides:

- Per-agent spend aggregation independent of provider (so you can compare GPT-4o spend against Claude spend for the same agent role)
- Alert thresholds configured per agent: trigger a notification when a specific agent's hourly spend exceeds a threshold that reflects its expected workload
- Anomaly detection: flag when an agent's cost-per-request exceeds N× its rolling baseline
- Per-model cost decomposition: cost per 1,000 tokens broken out by provider and model variant

Without per-agent spend attribution, budget enforcement is impossible — you cannot cap what you cannot measure.

### Proxy Latency Budget

Gateway overhead on the warm path (handle cache hit, in-memory throttle counters): 0.7–2.1ms. On the cold path (cache miss requiring an outbound secret store lookup): 2.6–6.6ms.

| **Proxy component** | **Warm path** | **Cold path** |
|---|---|---|
| **TLS termination + re-encryption** | 0.3–0.8ms | 0.3–0.8ms |
| **Handle resolution** | 0.1–0.5ms | 2–5ms |
| **Throttle counter check** | 0.1–0.3ms | 0.1–0.3ms |
| **Request logging** | 0.2–0.5ms | 0.2–0.5ms |
| **Total** | **0.7–2.1ms** | **2.6–6.6ms** |

For agents making LLM requests where provider inference latency spans 500ms–30s, a 2–7ms proxy overhead is under 0.5% of total round-trip time and operationally negligible. For high-frequency non-LLM tool calls routed through the same proxy, benchmark first — the overhead-to-call-duration ratio inverts when the underlying call is fast.

## Get Started

**Run AI agent fleets behind a vault-backed proxy with per-tenant throttles, circuit-breaker failover, and an immutable spend audit stream.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Compare LiteLLM vs OpenLegion](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an LLM gateway?

An LLM gateway is a reverse-proxy service positioned between agent processes and model provider endpoints. It resolves opaque handles to provider keys at the network boundary, dispatches requests across multiple providers based on routing configuration, enforces per-tenant throttle limits before requests leave the proxy, and writes spend records keyed on agent identifier for billing and budget enforcement. The proxy operates at the HTTP transport layer, making it provider-agnostic and independent of which model the agent selects.

### Do I need an LLM gateway if I only use one model provider?

Single-provider deployments still benefit from three proxy functions: handle resolution so provider keys stay out of agent runtime environments; per-tenant throttle enforcement to prevent one runaway agent from exhausting the rate budget shared by the rest of the fleet; and per-agent spend metering for budget caps and anomaly detection. Most production-grade proxies add under 5ms latency on the warm path, making the operational overhead negligible relative to model inference latency, which typically spans hundreds of milliseconds to tens of seconds.

### How does an LLM gateway implement circuit-breaker failover?

When a provider returns consecutive 5xx responses or connection timeouts beyond a configured threshold, the circuit breaker opens and all subsequent dispatch goes to the configured fallback provider — without the calling agent process being aware a failover occurred. After a cooldown window, the proxy sends one probe request to the primary provider; a successful probe closes the circuit. OpenLegion's June 2026 benchmark measured this pattern reducing P99 tail latency from 12 seconds on a GPT-4o-only deployment to 3.1 seconds with Claude 3.5 Sonnet as the failover target.

### What is the risk of a persistence-backed LLM gateway?

A persistence-backed gateway stores provider key material in a relational database alongside routing configuration and spend data. This creates a concentrated key store that is a high-value target: a single SQL injection, misconfigured database ACL, or management API authentication bypass can expose all tenant key material simultaneously. The April 2024 LiteLLM advisory (GHSA-jh55-5rfg-8p3j) demonstrated config-table poisoning through an exposed management API. Stateless vault-backed proxies hold no key material in a persistence layer; a compromise of the proxy process yields nothing beyond the in-flight request's memory state.

### How does per-tenant throttling differ from provider rate limiting?

Provider rate limiting applies to the API key as a whole: the provider rejects requests once aggregate throughput across all callers sharing that key exceeds the plan cap. One agent in a fleet that issues requests at 10× its expected rate can push the key into throttle territory, degrading every other agent that shares it. Per-tenant proxy throttling enforces limits per agent identifier before requests leave the proxy. When one agent exceeds its window, the proxy returns 429 from the proxy layer — no outbound dispatch occurs, no provider quota is consumed, and peer agents continue at their own rates.

### How does an LLM gateway attribute token spend to individual agents?

Every provider response body includes token counts for the request. The proxy captures input tokens, output tokens, and (where reported) cache-hit tokens, then writes a spend record keyed on the requesting agent's identifier. Accumulated records build a per-agent spend ledger that supports daily and monthly budget caps (the proxy blocks an agent whose spend ceiling is reached), spend anomaly alerting (flag when an agent's cost-per-request is multiple times its baseline), and cross-provider cost benchmarking (compare cost-per-task across GPT-4o and Claude 3.5 Sonnet for the same agent role).

### What latency overhead does a proxy add to LLM calls?

On the warm path — handle cache hit, in-memory throttle counter — a well-implemented proxy adds 0.7–2.1ms. On the cold path — cache miss requiring an outbound secret store lookup — 2.6–6.6ms. Provider inference latency spans 500ms to 30 seconds depending on model, prompt length, and provider load. In that context, proxy overhead is under 0.5% of total round-trip time on the warm path and under 1.5% on the cold path.

### Sidecar proxy vs centralised ingress: which should I use?

Centralised ingress routes all agent fleet traffic through a shared proxy cluster. Advantages: one configuration surface, aggregate spend ledger, unified audit stream. Failure domain: ingress cluster degradation affects all agents. Sidecar proxy runs a proxy process alongside each agent container on its loopback interface. Advantages: failure isolation (one crashed sidecar affects one agent), per-agent configuration without fleet-wide deploys. Tradeoff: spend aggregation requires log collection rather than a single ledger. Heuristic: centralised for fleets under 10 agents; sidecar for larger fleets where per-agent failure isolation is worth the aggregation overhead.
