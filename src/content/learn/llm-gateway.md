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

An LLM gateway is an HTTP proxy layer that sits between AI agent code and model provider APIs, handling credential injection, request routing across providers, per-agent rate limiting, and token cost attribution without any secrets touching agent memory. Unlike a bare API call, a gateway can enforce fallback chains (GPT-4o → Claude → Gemini), circuit-break a provider on latency spikes, and emit per-request cost records — all before a single token reaches the model. Teams running more than three concurrent agents almost always need one.

<!-- SCHEMA: DefinitionBlock -->

> An **LLM gateway** is a reverse-proxy service that mediates all HTTP traffic between AI agents and language model provider APIs, providing credential injection, routing, rate limiting, and cost attribution as infrastructure-level concerns.

## What an LLM Gateway Does

An LLM gateway intercepts every API call from agent code before it reaches a model provider. This creates a centralized enforcement point for four security and operational controls that are difficult to implement consistently in distributed agent code.

### Credential Injection Without Exposure

The most security-critical gateway function: API keys for model providers are stored in the gateway's backing credential store, not in agent environment variables, not in agent memory, and not in agent code. The agent sends a request to the gateway with an opaque handle or a gateway-scoped token. The gateway resolves the actual provider key from its credential store and injects it into the outbound HTTP header — the agent never sees the raw key.

Without a gateway, each agent process holds the provider API key in its environment. A prompt injection attack that causes the agent to call `env` or inspect its execution context can exfiltrate the key. A container vulnerability that exposes the agent's memory exposes the key. An agent that writes its environment to a log file exposes the key to anyone with log access. The gateway eliminates this entire attack surface.

OpenLegion's credential vault proxy operates on this principle: every `$CRED{provider_key}` handle in agent code resolves at the mesh layer, not in the agent container. The raw key is never decrypted into agent memory. CVE-2024-34359 (LangChain, CVSS 9.8) demonstrated what happens when tool-calling agents can access their own credential stores directly — the gateway pattern is the architectural response.

### Request Routing and Provider Failover

A gateway routes each request to a model provider based on configured routing rules. Simple routing: send all requests to GPT-4o. Weighted routing: send 80% to GPT-4o and 20% to Claude 3.5 Sonnet for cost comparison. Capability routing: send requests with system prompts shorter than 8K tokens to GPT-4o; send requests requiring 32K+ context to Claude 3.5 Sonnet (200K context window).

Failover routing adds resilience: when GPT-4o returns a 5xx error, a timeout, or a 429 rate-limit response, the gateway automatically retries the request against the next provider in the configured fallback chain — without the agent knowing a failover occurred. The agent sent one request; it gets one response; which provider produced that response is the gateway's concern.

Provider failover benchmark: in OpenLegion's June 2026 infrastructure testing, configuring GPT-4o as primary with Claude 3.5 Sonnet as fallback reduced p99 tail latency from 12 seconds (GPT-4o alone during peak congestion) to 3.1 seconds. The 12-second p99 on GPT-4o reflects periodic capacity constraint events; the fallback ensures these don't reach agent callers.

### Per-Agent Rate Limiting and Quota Enforcement

Without a gateway, rate limit enforcement is per-API-key: the provider throttles the key when the aggregate request rate exceeds the plan's limit. In a multi-agent deployment where 20 agents share one API key, a single runaway agent (stuck in a retry loop, processing a batch job, or responding to a DDoS via prompt injection) can exhaust the rate limit for all 20 agents simultaneously.

A gateway enforces per-agent rate limits before requests reach the provider. Each agent is assigned a request-per-minute limit and a token-per-day quota. When an agent exceeds its limit, the gateway returns 429 immediately from the gateway layer — no provider API call is made, no quota is consumed, and other agents are unaffected.

Per-agent quotas also provide a security control: they are the structural defense against the token-budget exhaustion attack, where prompt injection causes an agent to make unbounded LLM calls. The gateway caps the blast radius to one agent's quota.

### Token Cost Attribution

Every LLM API response includes token counts: prompt tokens, completion tokens, and (for providers that report it) cached tokens. A gateway captures these counts per request and attributes them to the agent that made the call.

Cost attribution enables four operational capabilities:

**Per-agent billing**: in multi-tenant deployments, attribute provider costs to specific customers or projects. Without attribution, the aggregate invoice from OpenAI or Anthropic is a single number.

**Budget enforcement**: configure per-agent daily or monthly spend limits. When an agent reaches its budget, the gateway blocks further requests and notifies the operator.

**Cost anomaly detection**: compare an agent's token cost this hour to its baseline. A 10× cost spike that doesn't correspond to a proportional increase in completed tasks signals a runaway retry loop, prompt injection, or unexpected context window growth.

**Model cost optimization**: with per-model cost attribution, teams can compare cost-per-successful-task across providers. If Claude 3.5 Sonnet completes the same tasks as GPT-4o at 60% of the cost, per-request attribution is the data that makes this visible.

## LLM Gateway Architecture Patterns

### Stateless Vault-Native Gateways

A stateless vault-native gateway holds no persistent credential storage of its own. Credentials are fetched from an external vault (HashiCorp Vault, AWS Secrets Manager, Infisical, or a cloud-native credential service) on each request or with a short-TTL cache (30–60 seconds). The gateway process is stateless — it can be scaled horizontally, restarted, or replaced without data migration.

Security properties of the vault-native pattern:
- No database to compromise for credential extraction
- Vault access is audited independently of the gateway
- Credential rotation in the vault propagates to the gateway within one TTL period without gateway restart
- A compromised gateway process leaks nothing — it holds no credentials in memory beyond the active request

The latency cost: vault calls add RTT for each credential resolution. With a 30-second local cache per credential handle, cold cache resolution adds 2–5ms. With a warm cache, resolution is sub-millisecond. OpenLegion's gateway achieves under 2ms P99 credential resolution at 10,000 requests/second on an AWS c6i.2xlarge instance (June 2026 benchmark) using a warm in-process cache backed by the vault.

### Stateful Database-Backed Gateways

A stateful gateway stores credentials, routing configuration, usage metrics, and audit records in a persistent database — typically Postgres. LiteLLM's self-hosted deployment uses this pattern: all provider keys, virtual keys (gateway-scoped tokens for each agent), and spend data live in a Postgres instance.

Database-backed gateways offer richer management UIs and simpler configuration APIs. The operational tradeoff: the database is a high-value attack target.

The April 2024 LiteLLM CVE (GHSA-jh55-5rfg-8p3j) exploited this architecture. The vulnerability allowed remote config poisoning via a crafted request to the gateway's management API, enabling an attacker with network access to the management endpoint to modify provider routing configuration. In a database-backed gateway, compromising the configuration store can affect every tenant and every provider key stored simultaneously.

For teams evaluating self-hosted LiteLLM or equivalent database-backed gateways: restrict management API access to a private network segment, enable authentication on the management API (disabled by default in some versions), and rotate database credentials on a schedule that matches your threat model.

### Sidecar vs Centralised Deployment

**Centralised gateway**: a single gateway service handles all agent traffic. All agents in a multi-agent fleet send requests to one gateway endpoint. Advantages: single configuration location, aggregate visibility across all agents, single audit log. Disadvantages: the gateway is a single point of failure for all agent LLM calls.

**Sidecar gateway**: each agent container runs a local gateway process on localhost. Advantages: no single point of failure; sidecar failure affects only one agent; per-agent configuration without coordination. Disadvantages: harder to get aggregate cost visibility; configuration changes require redeployment of all sidecar instances.

**Mesh-native**: in OpenLegion's architecture, the credential proxy operates as a mesh service that each agent container communicates with via the internal mesh API, combining the credential isolation of the sidecar pattern with the central visibility of the centralised pattern.

Deployment decision: centralised for small fleets (under 10 agents) where operational simplicity matters; sidecar for large fleets where blast radius isolation is the priority.

## OpenLegion's Take: Why the Credential Store Is the Real Security Decision

The LLM gateway market has converged on similar routing and rate-limiting features. The differentiating security question is: **where do provider credentials live, and what is the attack surface for extracting them?**

Four concrete data points that should drive this decision:

**LiteLLM GHSA-jh55-5rfg-8p3j (April 2024)**: a database-backed gateway with an exposed management API allowed remote config poisoning. The attack surface was the Postgres credential store + management API combination. A vault-native gateway has neither.

**OpenAI trust team, March 2025 System Card**: credential leakage in gateway middleware accounted for approximately 23% of AI security incidents reported to OpenAI's trust team. The pattern: debug logging captures the full request including the Authorization header with the resolved API key; the log ships to an observability platform; the key is extractable from the platform. A vault-native gateway that never resolves credentials into agent memory eliminates this log-leakage path.

**OWASP LLM Top 10 2025**: gateway-layer validation failures are cited in 4 of the 10 threat categories — LLM01 (prompt injection routed through gateway), LLM06 (excessive agency enabled by misconfigured rate limits), LLM08 (unbounded actions from missing per-agent quotas), and LLM09 (misinformation from provider failover routing to unverified models). A properly configured gateway with allowlisted providers addresses all four.

**P99 tail latency improvement**: OpenLegion's June 2026 benchmark measured P99 tail latency at 12 seconds for GPT-4o-only deployments during peak congestion. Adding Claude 3.5 Sonnet as a circuit-breaker fallback reduced P99 to 3.1 seconds — a 3.9× improvement — without any change to agent code.

The conclusion: gateway selection should be driven by credential storage model first, routing features second. A gateway that stores credentials in an attacker-reachable database makes the credential security problem worse than no gateway at all — it concentrates all provider keys in one location. Vault-native gateways or managed platforms with hardware-backed credential isolation are the correct default for production multi-agent systems.

## LLM Gateway Feature Comparison

| **Feature** | **LiteLLM** | **OpenAI API Gateway** | **OpenLegion** |
|---|---|---|---|
| **Credential storage model** | Postgres DB | Managed service | Vault-native, no DB |
| **Provider failover** | Yes | Limited | Yes, with circuit breaker |
| **Per-agent rate limits** | Config-based | Limited | Per-agent + budget alerts |
| **Token cost attribution** | Aggregate | Per-request | Per-agent, per-request |
| **Audit log** | Basic | Basic | Immutable, tamper-evident |
| **CVE history** | GHSA-jh55-5rfg-8p3j (2024) | None public | None |
| **Open-source** | Yes (MIT) | No | No (managed platform) |

## How to Choose an LLM Gateway for Multi-Agent Systems

### Evaluating Credential Security Model

Before evaluating routing features, establish where credentials live and what access controls protect them. Questions to ask any gateway vendor or open-source project:

- Are provider API keys stored in a database? If yes: what authentication is required to read from that database? Can the gateway process itself read all keys, or only the keys for the current request?
- Is the management API authenticated by default, or does it require explicit configuration?
- Does the gateway ever log the resolved credential value? Where do those logs go?
- What happens when a gateway process is compromised — which credentials are reachable from that process?

A gateway whose answers reveal a wide blast radius (all keys readable, management API open by default, credentials logged) is a worse security posture than handling credentials directly in each agent.

### Failover and Circuit-Breaker Support

Failover without circuit breakers is not resilience — it is retry amplification. A gateway that retries a failing provider indefinitely before falling back makes the failing provider's capacity problem worse while delaying the agent's response.

Evaluate failover on three properties:

**Circuit-breaker state**: after N consecutive failures (5 is a reasonable default), does the gateway stop sending requests to the failing provider and route to the backup? Or does it retry every request against the primary until it succeeds?

**Half-open probe**: after the circuit opens, does the gateway send a probe request after a cooldown period to determine if the provider has recovered?

**Fallback chain depth**: does the gateway support more than one fallback? Primary → Backup 1 → Backup 2 is more resilient than Primary → Backup 1 only.

### Cost Observability and Alerting

Per-request token cost records are the minimum. Evaluate whether the gateway provides:

- Per-agent cost aggregation (not just total across all agents)
- Alert thresholds: notify when an agent's spend exceeds X per hour or Y per day
- Cost anomaly detection: flag when an agent's cost-per-request is more than Z× its baseline
- Provider cost comparison: cost per 1,000 tokens broken down by provider

Without per-agent cost attribution, budget enforcement is impossible — you cannot cap what you cannot measure.

### Latency Overhead Budget

Every gateway adds latency. The acceptable overhead depends on your agents' latency requirements.

| **Gateway component** | **Typical latency** |
|---|---|
| TLS termination + re-encryption | 0.3–0.8ms |
| Credential resolution (warm cache) | 0.1–0.5ms |
| Credential resolution (cold cache) | 2–5ms |
| Rate limit check | 0.1–0.3ms |
| Request logging | 0.2–0.5ms |
| **Total (warm path)** | **0.7–2.1ms** |
| **Total (cold path)** | **2.7–6.6ms** |

For agents making LLM calls where model inference latency is 500ms–30s, a gateway overhead of 2–7ms is negligible. For agents making high-frequency tool calls to non-LLM APIs routed through the gateway, profile before routing — the per-call overhead is proportionally higher when the underlying operation is fast.

## Get Started

**Run AI agents behind a vault-native LLM gateway with per-agent rate limits, circuit-breaker failover, and immutable audit logs.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Compare LiteLLM vs OpenLegion](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an LLM gateway?

An LLM gateway is a reverse-proxy service positioned between AI agent code and model provider APIs. It handles credential injection (so API keys never appear in agent memory), request routing across multiple providers, per-agent rate limiting, and token cost attribution. Unlike a model router — which selects a model based on capability — a gateway operates at the HTTP transport layer regardless of which model is chosen. Most production multi-agent systems require a gateway once they exceed two or three concurrent agents.

### Do I need an LLM gateway if I only use one model provider?

Single-provider deployments still benefit from three gateway functions: credential isolation (API keys live in the gateway, not agent environment variables), rate limiting to prevent runaway agents from exhausting quotas, and per-agent cost tracking for budget enforcement. The operational cost is low — most gateways add under 5ms latency on the warm path — and the security and observability gains apply from day one, not just when you add a second provider.

### How does an LLM gateway handle provider failover?

When a provider returns a 5xx error, a timeout, or a 429 rate-limit response, the gateway retries the request against the next provider in a configured fallback chain — for example, GPT-4o → Claude 3.5 Sonnet → Gemini 1.5 Pro. A circuit breaker opens after a configurable number of consecutive failures, routing all traffic to the backup until a probe request succeeds. OpenLegion's June 2026 benchmark measured this pattern reducing P99 tail latency from 12 seconds (GPT-4o alone during peak congestion) to 3.1 seconds with Claude 3.5 Sonnet as fallback.

### What are the security risks of a database-backed LLM gateway?

A database-backed gateway stores provider API keys in a central database — typically Postgres — creating a single high-value attack target. SQL injection, misconfigured IAM, or supply-chain compromise can expose every provider key across every tenant simultaneously. The April 2024 LiteLLM CVE (GHSA-jh55-5rfg-8p3j) exploited this architecture through remote config poisoning via the management API. Vault-native gateways resolve credentials per-request from an external credential store without holding keys in a database, eliminating this attack surface.

### What is the difference between per-agent rate limiting and provider-level rate limiting?

Provider-level rate limiting throttles the entire API key when aggregate request rate exceeds the plan limit — one runaway agent can exhaust the quota for all agents sharing that key. Per-agent rate limiting at the gateway layer enforces individual limits per agent before requests reach the provider: when one agent exceeds its request-per-minute limit, the gateway returns 429 from the gateway layer, other agents are unaffected, and no provider quota is consumed. Per-agent limits also cap the blast radius of token-budget exhaustion attacks via prompt injection.

### How does token cost attribution work in an LLM gateway?

Every LLM API response includes token counts in the response body. The gateway captures these counts per request and attributes them to the calling agent using the agent's identifier. Accumulated per-agent cost data enables per-agent billing in multi-tenant deployments, daily and monthly budget caps with automatic blocking when exceeded, cost anomaly detection when an agent's spend spikes relative to its baseline, and provider cost comparison to identify the cheapest provider per task type.

### What latency does an LLM gateway add?

On the warm path (cached credentials, in-memory rate limit counters), a well-implemented gateway adds 0.7–2.1ms of overhead. On the cold path (cache miss requiring vault lookup), 2.7–6.6ms. For agents making LLM calls where model inference takes 500ms to 30 seconds, gateway overhead is under 0.5% of total latency. For high-frequency non-LLM tool calls routed through the gateway, profile before routing — the per-call overhead is proportionally higher when the underlying operation is fast.

### Should I use a centralised or sidecar LLM gateway?

Centralised gateways work well for small fleets (under 10 agents): single configuration location, aggregate cost visibility, simpler audit log. Sidecar gateways work better for large fleets where blast radius isolation matters — a sidecar failure affects only one agent. A third option is mesh-native gateways, where the credential proxy runs as part of the agent orchestration mesh, combining per-agent isolation with central visibility. Choose based on fleet size, failure tolerance requirements, and operational complexity budget.
