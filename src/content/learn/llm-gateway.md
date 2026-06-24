---
title: "LLM Gateway: Routing, Auth, and Cost Control for AI Agents"
description: "An LLM gateway routes AI agent requests across model providers, enforces rate limits, injects credentials without exposing them to agent code, and attributes token costs per agent."
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

# LLM Gateway: Routing, Auth, and Cost Control for AI Agents

An LLM gateway is an HTTP reverse-proxy positioned between AI agent processes and upstream model provider endpoints, operating as the data plane for all outbound inference traffic. It resolves opaque key handles at the wire layer before forwarding, enforces per-tenant throttle quotas using sliding-window counters, emits per-request OpenTelemetry spend telemetry, and opens circuit breakers when upstream P99 latency breaches configured thresholds — none of which require any change to agent application code. Any fleet running three or more concurrent inference consumers should put one in place.

<!-- SCHEMA: DefinitionBlock -->

> An **LLM gateway** is an HTTP reverse-proxy that sits in the data plane between AI agent processes and model-provider endpoints, providing opaque-key resolution at the wire layer, per-tenant quota enforcement via sliding-window counters, OpenTelemetry spend telemetry per request, and circuit-breaker failover — all as infrastructure primitives invisible to application code.

## The Data Plane Problem in Multi-Agent Inference

Without a dedicated inference data plane, each agent process manages its own upstream connections: resolving keys from environment state, enforcing no per-process quota, emitting no per-request telemetry, and having no visibility into whether the upstream endpoint is degraded. At two agents this is manageable. At twenty, it produces four distinct failure modes.

### Key Exfiltration via Environment Introspection

Every agent process that holds a plaintext provider key in its environment is one adversarial instruction away from leaking it. The attack surface is the process environment itself: `os.environ`, `/proc/self/environ` on Linux hosts, verbose error tracebacks that serialize the process state, and debug log configurations that capture outbound HTTP headers including Authorization fields.

Prompt injection attacks that cause agents to echo environment state are a documented attack class against agents holding plaintext keys (OWASP LLM01:2025). The structural fix is not better input validation: it is removing the plaintext key from the agent process entirely. An LLM gateway that resolves opaque handles (`$CRED{openai}`) at the wire layer before the Authorization header is written means the agent process never holds material that can be exfiltrated. The handle is not a key; resolving it produces a key only within the gateway's own memory scope, for the duration of one upstream request.

OpenLegion's mesh implements this at the infrastructure level: `$CRED{}` handles resolve at the mesh host boundary. Agent containers are structurally unable to reach the resolved value — not because they are instructed not to, but because the resolution happens outside their address space.

### Quota Exhaustion via Shared Key Throttling

Upstream model providers throttle at the API-key level. In a fleet where twenty agent processes share one key, a single process emitting requests at 10× its expected rate — whether through a retry storm, a runaway loop, or a prompt injection payload that causes unbounded inference calls — can push the key into rate-limit territory for the other nineteen.

A gateway enforces per-tenant quotas using a sliding-window counter keyed on agent identifier. The sliding window maintains a count of requests (or consumed tokens) within a rolling time interval. When an agent's counter reaches the configured ceiling, the gateway responds with HTTP 429 at the gateway layer: no upstream request is dispatched, no provider quota is consumed, and sibling agents are unaffected.

The token bucket variant allows configurable burst capacity: an agent permitted 60 requests/minute can absorb a burst of 90 over a 10-second window, with the burst drawdown applied against the following window's budget. This is the correct model for agents that are bursty by nature (large batch processing jobs) but should be bounded over longer horizons.

The per-agent quota is also the structural mitigation for OWASP LLM10:2025 (Unbounded Consumption) — the pattern where adversarial instructions cause an agent to emit unbounded inference calls. The gateway's quota window caps the blast radius to one tenant's budget regardless of how many calls the injection triggers.

### Missing Upstream Observability

Without an inference data plane, per-request telemetry requires instrumentation inside every agent process. This is both duplicative and inconsistent: different agent roles instrument differently, some don't instrument at all, and none of them have visibility into the upstream latency distribution across the fleet.

A gateway emits per-request OpenTelemetry OTLP log records at the wire layer, capturing: agent identifier, upstream endpoint, model name, input token count, output token count, cache-hit tokens (where reported by the upstream), HTTP response status, and request duration. These records flow to a telemetry collector (Grafana, Datadog, OpenSearch, or any OTLP-compatible backend) without any per-agent instrumentation.

The spend record per request — `input_tokens × price_per_1k_input + output_tokens × price_per_1k_output` — accumulates into a per-agent spend ledger. This ledger supports daily and monthly spend ceilings (the gateway blocks an agent whose ceiling is reached until the window resets) and spend anomaly alerting (flag when an agent's cost-per-request is N× its rolling baseline, which typically signals context accumulation or a retry loop).

### Invisible Upstream Degradation

Provider endpoints degrade. P99 tail latency on GPT-4o during capacity events can reach 12 seconds (OpenLegion infrastructure benchmark, June 2026). Without a circuit breaker in the data plane, every agent in the fleet absorbs this degradation on every request. The agents cannot distinguish "upstream is slow" from "my task is taking longer" without per-endpoint latency telemetry they do not have.

A gateway with a circuit breaker tracks per-endpoint error rates and P99 latency. When a configurable failure threshold is breached — for example, five consecutive 5xx responses or P99 exceeding 8 seconds over a 30-second window — the circuit opens: subsequent requests are immediately dispatched to the configured fallback endpoint without waiting for the degraded primary to time out.

OpenLegion's June 2026 benchmark measured GPT-4o primary → Claude 3.5 Sonnet fallback topology: P99 dropped from 12 seconds to 3.1 seconds (3.9×) without any modification to agent code. The circuit breaker also implements the half-open probe: after the circuit opens and a cooldown period elapses, one probe request is dispatched to the primary endpoint to test recovery. A successful probe closes the circuit; a failed probe restarts the cooldown timer.

## Gateway Architecture: Data Plane vs Control Plane

An LLM gateway separates two distinct concerns: the data plane (the hot path that every inference request traverses) and the control plane (the configuration surface that governs how the data plane behaves).

### The Data Plane: Per-Request Enforcement

Every inference request passes through the data plane in sequence:

1. **TLS termination**: the agent process connects to the gateway over TLS. The gateway presents a certificate; for mTLS deployments, the agent presents a certificate as well. mTLS eliminates the need for per-request authentication tokens between agent and gateway — the mutual certificate handshake authenticates both parties at the connection layer.

2. **Workload identity resolution**: the gateway maps the connecting workload to a tenant identity. In mTLS deployments, the SPIFFE SVID (SPIFFE Verifiable Identity Document) embedded in the client certificate carries the workload identity — no separate authentication header is needed. In non-mTLS deployments, the gateway reads a bearer token from the Authorization header and validates it against the control plane's identity store.

3. **Opaque handle resolution**: the gateway inspects the outbound Authorization header for `$CRED{}` handle patterns. Matching handles are resolved against the gateway's backing secret store (HashiCorp Vault, AWS Secrets Manager, or equivalent) using the tenant identity's permission scope. The resolved value is substituted into the outbound request header. The inbound request from the agent is never forwarded unchanged — the gateway always rebuilds the outbound request with the resolved material.

4. **Quota check**: the gateway increments the tenant's sliding-window counter and compares it against the configured ceiling. If the counter exceeds the ceiling, the gateway returns 429 with `Retry-After` and `X-RateLimit-Reset` headers. No upstream connection is opened.

5. **Circuit breaker check**: the gateway evaluates the target endpoint's circuit state. If the circuit is open, the request is immediately redirected to the fallback endpoint without attempting the primary.

6. **Upstream dispatch**: the gateway opens a connection from its own connection pool to the upstream endpoint (not the agent's connection), forwards the rebuilt request, and streams the response back.

7. **Telemetry emission**: on response completion, the gateway writes an OTLP log record to the telemetry pipeline with all per-request fields.

Total overhead on the warm path (resolved handle in cache, quota counter in memory, circuit closed, upstream connection pooled): 0.7–2.1ms. On the cold path (cache miss requiring an outbound secret store lookup): 2.6–6.6ms. At provider inference latency of 500ms–30s, warm-path overhead is under 0.5% of total round-trip time.

### The Control Plane: Configuration and Policy

The control plane governs the data plane's behavior. It is not in the hot path for individual requests, but changes to it take effect on subsequent requests. Key control plane responsibilities:

**Tenant identity and quota configuration**: which workload identities are permitted, what quota ceiling applies per tenant, what spend ceiling applies per billing period.

**Endpoint topology**: which upstream endpoints are available, what the circuit breaker parameters are for each, and what the failover chain is (primary → fallback A → fallback B).

**Handle permission scope**: which tenant identities are permitted to resolve which handles. A tenant with scope `openai:read` can resolve `$CRED{openai}` but not `$CRED{anthropic}`. This scoping prevents lateral movement between tenants — a compromised agent process can only resolve the handles its workload identity is scoped for.

**Audit policy**: what fields appear in OTLP log records, whether request bodies are logged (generally not, for data minimization), and what telemetry backend receives the records.

The control plane API should not be reachable from agent-side networks. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, patched in v1.83.0) demonstrated what happens when the control plane's configuration write path is network-reachable without sufficient authorization — any authenticated user could modify proxy configuration and register arbitrary endpoint handlers. Correct control plane deployment: private subnet, authenticated, no external exposure.

## Deployment Topologies

### Centralised Ingress

A single gateway cluster handles all outbound inference traffic from the agent fleet. All agents connect to one gateway endpoint. The cluster is horizontally scaled behind a load balancer.

**Advantages**: single configuration point for all tenants, unified OTLP telemetry stream, no per-agent deployment surface to manage. **Failure domain**: the gateway cluster is a shared failure point — ingress cluster degradation affects all agents. Mitigate with multi-AZ deployment and health checks that route around unhealthy gateway instances.

Suitable for fleets up to approximately 50 agents where operational simplicity outweighs blast-radius concerns.

### Sidecar Pattern

Each agent container runs a gateway process on its loopback interface. The agent dispatches to `localhost:8080`; the sidecar manages the upstream TLS connection, quota enforcement, and telemetry emission.

**Advantages**: failure domain is one agent container — a crashed sidecar affects one agent, not the fleet. Per-agent configuration is possible without fleet-wide control plane changes. Zero additional network hop between agent and gateway. **Tradeoff**: OTLP telemetry from sidecars must be aggregated by a separate collector. Fleet-wide quota coordination requires a shared counter backend (Redis, DynamoDB, or equivalent).

Suitable for large fleets (50+ agents) where per-agent failure isolation is the priority.

### Mesh-Native Proxy

In OpenLegion, the inference proxy is a mesh service: each agent container communicates with the mesh proxy via the internal mesh transport. The mesh provides the per-agent failure isolation of the sidecar model while maintaining a fleet-wide spend ledger and OTLP stream in the mesh host. The mesh-native model handles workload identity natively: each agent container receives a mesh-issued identity at spawn time, which the proxy uses for handle-scope enforcement without the agent process managing any authentication material.

## OpenLegion's Take

The LLM gateway feature set — mTLS, sliding-window quota enforcement, OTLP spend telemetry, circuit-breaker failover — is not optional infrastructure for multi-agent fleets. It is the minimum viable data plane. Without it, every agent process is simultaneously a potential key exfiltration surface, an unthrottled inference consumer that can exhaust shared quotas, and a blind spot in the fleet's spend telemetry.

Three measurements from OpenLegion's June 2026 infrastructure testing quantify the stakes:

**P99 tail latency without failover**: 12 seconds on GPT-4o-only deployments during provider capacity events. With Claude 3.5 Sonnet as a circuit-breaker fallback configured at the gateway layer: 3.1 seconds. The 3.9× improvement required zero changes to agent application code.

**Key exfiltration surface area**: in a 20-agent fleet where all agents hold plaintext keys in their environment, a single agent compromised by prompt injection (OWASP LLM01:2025) can exfiltrate keys valid for every other agent's upstream connections. In a gateway-mediated fleet with opaque handle resolution, the same compromised agent holds no material that can be exfiltrated — the handle resolves to the plaintext key inside the gateway's memory scope only.

**OWASP LLM coverage**: per-tenant quota enforcement at the gateway addresses LLM10:2025 (Unbounded Consumption). Handle-scope enforcement addresses LLM06:2025 (Excessive Agency — agents can only resolve the handles their identity is scoped for, not handles belonging to other tenants). Both controls operate at the infrastructure layer and require no agent-level code changes.

For teams evaluating [credential management patterns for AI agents](/learn/credential-management-ai-agents), the gateway's opaque handle resolution is the deployment-level implementation of the vault-proxy pattern described there. For teams integrating [MCP security controls](/learn/ai-agent-mcp-security), gateway-layer handle scoping ensures that MCP tool servers receive authenticated requests without the agent process holding the upstream key.

## LLM Gateway Comparison

| **Capability** | **Self-hosted (LiteLLM)** | **OpenAI native** | **OpenLegion mesh proxy** |
|---|---|---|---|
| **Key resolution model** | Postgres-backed key store | Managed service | Opaque handle → vault at wire layer |
| **mTLS workload identity** | Not supported | Not supported | SPIFFE SVID per agent container |
| **Quota enforcement** | Config-based, per-key | Per-org limits | Sliding-window counter, per-tenant |
| **Circuit-breaker failover** | Plugin-based | Not available | Native, with half-open probe |
| **OTLP spend telemetry** | Partial | Not exported | Per-request, all fields |
| **Control plane isolation** | Manual; exposed by default | Managed | Private mesh subnet only |
| **CVE history (2024–2026)** | GHSA-53mr-6c8q-9789 + others (see advisories) | None public | None |

## Selecting a Gateway for Your Fleet

### mTLS vs Bearer-Token Authentication

mTLS (mutual TLS) authenticates both the client (agent) and the server (gateway) at the TLS handshake layer, before any HTTP payload is exchanged. The client certificate carries a SPIFFE SVID — a cryptographically verifiable workload identity. No bearer token is passed in headers; no token can be stolen from headers; the identity assertion is part of the TLS session.

Bearer-token authentication is simpler to set up but introduces a token that must be managed: issued, distributed to agent containers, rotated on expiry, and revoked when an agent is decommissioned. Tokens in HTTP headers are visible to anything that can read the HTTP stream — logging middleware, debug proxies, observability agents that capture request headers.

For production multi-agent fleets, mTLS with SPIFFE-issued SVIDs is the correct authentication model. It eliminates the token management surface entirely. The prerequisite is a SPIFFE-compatible identity issuance system — SPIRE is the reference implementation; cloud providers offer equivalents (AWS IAM Roles Anywhere, GCP Workload Identity Federation).

### Sliding-Window vs Fixed-Window Quota Counters

Fixed-window quota counters reset at clock boundaries (e.g., minute 0:00, 1:00, 2:00). An agent can burst 60 requests in the last 10 seconds of minute 0 and another 60 in the first 10 seconds of minute 1 — effectively 120 requests in 20 seconds, double the nominal rate. This boundary burst is a well-known artifact of fixed-window counting.

Sliding-window counters maintain a rolling count over a continuous time interval. There is no clock boundary to exploit. The counter always reflects the request rate over the most recent N seconds. Sliding-window enforcement is the correct model for rate limiting inference workloads where boundary bursts can trigger upstream provider throttling even when the overall rate is within the configured ceiling.

### Telemetry Granularity Requirements

Per-request OTLP records are the minimum for useful fleet observability. Evaluate whether the gateway provides these fields on every record:

- `agent_id`: the tenant identifier — required for per-agent spend ledgers and anomaly detection
- `model_id`: the specific model variant used — required for cross-model cost benchmarking
- `input_tokens`, `output_tokens`, `cache_tokens`: required for accurate spend calculation
- `upstream_latency_ms`: time from upstream connection to first response byte — required for P99 tracking and circuit-breaker calibration
- `upstream_status`: HTTP status from the upstream endpoint — required for error rate tracking that feeds circuit-breaker decisions

Gateways that aggregate telemetry (hourly totals rather than per-request records) cannot support per-agent spend anomaly detection or accurate circuit-breaker calibration.

## Get Started

**Deploy multi-agent inference fleets with mTLS workload identity, sliding-window quota enforcement, and per-request OTLP spend telemetry.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Compare LiteLLM vs OpenLegion](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an LLM gateway?

An LLM gateway is an HTTP reverse-proxy positioned in the data plane between AI agent processes and upstream model provider endpoints. It resolves opaque key handles at the wire layer (so agent processes never hold plaintext keys), enforces per-tenant sliding-window quota limits before dispatching upstream, emits per-request OpenTelemetry spend telemetry, and opens circuit breakers when upstream endpoints breach configured latency or error-rate thresholds. These functions operate as infrastructure primitives requiring no changes to agent application code.

### Do I need an LLM gateway if I only use one model provider?

Single-provider fleets still benefit from three gateway functions: opaque handle resolution (plaintext keys stay out of agent environments and logs), per-tenant quota enforcement (one runaway agent cannot exhaust the shared key's rate budget), and per-request OTLP spend telemetry (without which per-agent spend ledgers and anomaly detection are impossible). Warm-path overhead is 0.7–2.1ms — negligible against provider inference latency of 500ms to 30 seconds. The safety and observability primitives the gateway provides apply from day one, not just after adding a second provider.

### How does circuit-breaker failover work in an LLM gateway?

The gateway tracks per-endpoint error rates and P99 latency within rolling observation windows. When a configurable failure threshold is breached — for example, five consecutive 5xx responses, or P99 exceeding 8 seconds over a 30-second window — the circuit opens: all subsequent requests are immediately forwarded to the configured fallback endpoint without waiting for the degraded primary to time out. After a cooldown period, the gateway dispatches one half-open probe to the primary. A successful probe closes the circuit; a failed probe restarts the cooldown. OpenLegion's June 2026 benchmark measured this reducing P99 from 12 seconds to 3.1 seconds on a GPT-4o → Claude 3.5 Sonnet topology.

### What is mTLS and why does it matter for LLM gateways?

mTLS (mutual TLS) authenticates both the connecting agent process and the gateway at the TLS handshake layer, before any HTTP payload is exchanged. The agent presents a client certificate carrying a SPIFFE SVID — a cryptographically verifiable workload identity. No bearer token is transmitted in HTTP headers; no token needs to be issued, distributed, or rotated. The workload identity derived from the SVID drives handle-scope enforcement: the gateway permits the connecting workload to resolve only the opaque handles that its SPIFFE identity is scoped for, preventing lateral movement between tenants even if one agent container is compromised.

### What is the difference between sliding-window and fixed-window quota enforcement?

Fixed-window counters reset at clock boundaries (e.g., every whole minute). An agent can burst twice its nominal rate by requesting at full speed in the last seconds of one window and the first seconds of the next — 60 requests/minute becomes 120 requests in 20 seconds at the boundary. Sliding-window counters maintain a rolling count over a continuous time interval with no clock boundaries to exploit. The counter always reflects the request rate over the most recent N seconds. For inference workloads where boundary bursts can trigger upstream provider throttling, sliding-window enforcement is the correct model.

### How does per-request OTLP telemetry differ from aggregate spend reporting?

Per-request OpenTelemetry OTLP records capture individual fields on every inference call: agent identifier, model variant, input tokens, output tokens, cache-hit tokens, upstream latency, and HTTP status. These records accumulate into per-agent spend ledgers that support daily and monthly budget ceilings (the gateway blocks an agent that reaches its ceiling), spend anomaly detection (flag when an agent's cost-per-request is N× its rolling baseline, signaling context accumulation or retry storms), and cross-model cost benchmarking. Aggregate spend reports cannot support anomaly detection because the signal is in the per-request variance, not the aggregate.

### What should the gateway control plane not expose to agent-side networks?

The control plane manages quota configuration, endpoint topology, handle permission scopes, and audit policy. It should be deployed on a private subnet with no external access path. GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, patched in v1.83.0) documented insufficient authorization on the management API, allowing any authenticated user to modify proxy configuration. Agent-side networks should only reach the gateway's data plane port — the TLS endpoint that handles individual inference requests. Control plane write access should require a separate authentication path available only to operators, not agent workloads.

### How do I calibrate circuit-breaker thresholds for my fleet?

Collect P50, P95, and P99 upstream latency histograms per provider endpoint over two to four weeks of production traffic. The circuit-breaker open threshold should be set at a P99 value clearly degraded relative to the provider's normal SLA — typically 2–3× the median P99. The failure count threshold (consecutive errors before the circuit opens) should be low enough to catch real degradation quickly (five is a common starting point) but high enough to avoid spurious opens from transient errors. The cooldown period before the half-open probe should exceed the provider's typical recovery time — 30–60 seconds is a reasonable baseline.
