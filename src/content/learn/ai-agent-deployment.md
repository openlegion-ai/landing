---
title: "AI Agent Deployment — Container TTLs, Budget Caps, and Circuit Breakers"
description: "Deploy AI agents to production: container TTLs, per-agent budget caps, LLM circuit breakers, credential vault proxy, graceful shutdown, and Kubernetes HPA. Covers Docker hardening and OpenLegion mesh deployment."
slug: /learn/ai-agent-deployment
primary_keyword: ai agent deployment
last_updated: "2026-06-17"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-observability
  - /learn/ai-agent-sandboxing
  - /learn/ai-agent-architecture
  - /learn/human-in-the-loop-ai-agents
---

# AI Agent Deployment: Container TTLs, Budget Caps, and Circuit Breakers

AI agent deployment is the process of moving AI agent workloads into production — configuring container isolation, credential injection, resource limits, LLM circuit breakers, and budget enforcement so agents operate reliably within cost bounds. Unlike stateless web services, agents carry context windows and can enter runaway retry loops that exhaust token budgets in minutes. Production-grade deployment requires three controls absent from standard web service playbooks: per-agent budget caps enforced at the infrastructure layer, container TTLs that auto-terminate zombie workloads, and circuit breakers on LLM API calls.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent deployment** is the process of moving AI agent workloads from development to production environments — configuring container isolation, credential injection, resource limits, autoscaling, circuit breakers on LLM API calls, budget enforcement, and observability instrumentation — so that agents operate reliably, within cost bounds, and without becoming a security liability in production.

## Why AI Agent Deployment Differs from Web Service Deployment

A standard web service request is stateless: the server reads input, computes output, and discards all working state. Horizontal scaling is straightforward — add replicas, distribute load. AI agents break every one of these assumptions. They carry state between steps, acquire credentials mid-run, and consume variable compute measured in dollars rather than milliseconds.

### Agents Are Stateful: Context Window, Working Memory, and Credential Handles

An agent accumulates context across tool calls. By step eight of a fifteen-step research task, its context window holds the original instruction, seven intermediate results, and the current working state. That state cannot be handed off to another replica mid-task the way an HTTP request can be re-routed. When a pod is evicted or rescheduled, the agent's in-progress work is lost unless you implement explicit checkpoint-and-resume logic.

This statefulness changes your scaling model. You cannot rely on standard horizontal autoscaling during an active task. Pod disruption budgets (PDBs) become essential: `maxUnavailable: 0` during active execution windows prevents the scheduler from evicting running agents. Graceful drain periods must be at least as long as your longest expected task. The [AI agent architecture guide](/learn/ai-agent-architecture) covers state persistence patterns including checkpoint-to-storage and blackboard-based handoffs.

### Variable Token Consumption: From $0.01 to $50 Per Task

A web service request consuming 50ms of CPU is predictable. An agent task consuming 50 LLM calls at gpt-4o pricing of $0.0025/1K tokens, with a 128K-token context window, can cost $12.80 in a single run — or $0.04 if the task resolves in two steps. OWASP LLM10 (Unbounded Consumption) explicitly identifies infrastructure-level budget caps as the required mitigation: application-layer limits can be bypassed if the agent is compromised or the prompt is injected. Budget enforcement at the infrastructure layer — enforced by the orchestration platform, not the agent process itself — is not optional for production deployments handling external inputs.

OpenLegion enforces budget caps at Zone 2 (Cost Tracker): $50/day and $200/month per agent by default, configurable per role. These limits are not bypassable by agent code — the LLM proxy rejects calls once the cap is reached, regardless of what the agent process requests.

### Runaway Loops: The Retry-Until-Bankrupt Failure Mode

LangChain's `AgentExecutor` sets `max_iterations=15` by default. An agent that misreads tool output and retries the same failing call fifteen times at $0.50/call generates $7.50 in wasted spend before halting. Without a circuit breaker, a rate-limited LLM API (HTTP 429) triggers the agent's retry logic, which accelerates API calls, which triggers more 429s, which triggers more retries — a retry storm that can exhaust both your rate limit quota and your token budget simultaneously.

Circuit breakers break this loop at the infrastructure layer before your budget is consumed.

## Container Configuration for Production Agent Deployment

### Resource Limits: Memory, CPU, and the OOM Kill Problem

Start with 512MB memory and 0.25 CPU for a general-purpose Python agent. OpenLegion's default template uses 384MB/0.15 CPU for lightweight task agents and 768MB/0.5 CPU for agents loading embedding models. The pattern: run a load test with a representative task set, measure p95 memory consumption, and set `resources.limits.memory` to p95 × 2. OOM kills happen silently in Kubernetes — the pod is evicted with reason `OOMKilled` and the agent's in-progress work is lost without a checkpoint.

For Docker-only deployments, the equivalent flags are `--memory 512m --cpus 0.25`. Docker's default is no limit — an unconstrained agent can consume all host memory during a runaway loop.

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

Set requests below limits. The scheduler uses requests for bin-packing; limits enforce the hard ceiling. A gap between request and limit gives the agent burst headroom for model inference peaks without over-provisioning base allocation.

### Container TTL: Auto-Termination for Lifecycle Management

Every spawned agent container needs a time-to-live. Without TTL enforcement, a container that loses its task reference — due to a scheduler restart, a network partition, or an orphaned handoff — continues running indefinitely, consuming resources and accumulating cost.

In OpenLegion, `spawn_fleet_agent(ttl=3600)` sets a 3,600-second (one-hour) hard limit. The mesh terminates the container at TTL expiry regardless of task state. For tasks expected to run longer, extend the TTL at spawn time: `spawn_fleet_agent(ttl=7200)` for two-hour tasks.

In Kubernetes, the equivalent is `activeDeadlineSeconds` on the Pod spec:

```yaml
spec:
  activeDeadlineSeconds: 3600
```

Kubernetes marks the pod as `DeadlineExceeded` after the deadline and terminates it. Combine with a sidecar watchdog for additional defense: a lightweight process that checks task heartbeat and sends SIGTERM if no heartbeat is received within 2× the expected task interval.

### Health Checks: Liveness, Readiness, and Startup Probes

Three probe types serve distinct purposes in agent deployments:

**Startup probe**: Fires repeatedly during initialization until it succeeds, then hands off to liveness. Use for agents that load embedding models or download artifacts at startup. A 60-second startup window with a 15-second initial delay and 5-second period is a reasonable baseline for model-loading agents. Without a startup probe, liveness checks can kill the container before it finishes initializing.

**Readiness probe**: Determines whether the container should receive traffic or tasks. An agent that has not finished loading its tool registry is not ready for task assignment. The readiness probe blocks the scheduler from routing work to the pod until it returns healthy. Mark readiness true only after the agent has loaded its configuration and confirmed connectivity to required external services.

**Liveness probe**: Detects a deadlocked or stuck agent and triggers a container restart. Point it at an HTTP health endpoint (`/health`) or a simple TCP socket check. A liveness failure restarts the container — losing in-progress work — so tune the threshold conservatively: `failureThreshold: 5` with a `periodSeconds: 30` prevents restarts on transient hiccups while catching true deadlocks.

### Graceful Shutdown: Draining Tasks Before SIGTERM

Kubernetes sends SIGTERM to the container `terminationGracePeriodSeconds` (default: 30) before SIGKILL. For agents with multi-minute task durations, 30 seconds is not enough to complete in-flight work. Set `terminationGracePeriodSeconds` to at least the 95th-percentile task duration:

```yaml
spec:
  terminationGracePeriodSeconds: 300
```

In the agent process, catch SIGTERM and drain cleanly:

```python
import signal
import sys

def handle_sigterm(signum, frame):
    agent.stop_accepting()
    agent.drain(timeout=280)
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
```

Without a SIGTERM handler, the agent process exits mid-task when the grace period expires. The task appears failed from the orchestrator's perspective, triggering a retry — which then races with the replacement container starting up.

## LLM API Circuit Breaker: Preventing Retry Storms

### The Three States: Closed, Open, and Half-Open

Martin Fowler documented the circuit breaker pattern in 2014. The three states:

**Closed** — normal operation. Requests pass through to the LLM API. The circuit breaker tracks consecutive failure counts. The circuit opens after a configurable threshold: 5 consecutive 429 (rate limit) responses within a 30-second window is a sensible starting point for LLM deployments.

**Open** — the circuit is tripped. All requests fail immediately without reaching the LLM API. The circuit remains open for a configured backoff period: 60 seconds minimum, extending exponentially on each trip (60s → 120s → 240s). During the open state, your agent should either queue the task for later retry or escalate via [human-in-the-loop approval](/learn/human-in-the-loop-ai-agents) rather than spinning in a loop.

**Half-open** — after the backoff period, the circuit allows a single probe request through. If the probe succeeds, the circuit resets to closed. If it fails, the circuit returns to open with doubled backoff. This prevents the stampeding-herd problem where every agent simultaneously retries when the LLM API recovers.

### Exponential Backoff with Jitter for Rate-Limit Responses

Pure exponential backoff without jitter causes synchronized retries: all agents hit the API at 2s, then 4s, then 8s simultaneously, reproducing the spike that caused the rate limit in the first place. AWS's full-jitter formula distributes retries across the backoff window:

```python
import random
import time

def backoff_with_jitter(attempt: int, base: float = 1.0, cap: float = 60.0) -> float:
    return random.uniform(0, min(cap, base * (2 ** attempt)))

for attempt in range(3):
    try:
        response = call_llm_api()
        break
    except RateLimitError as e:
        if attempt == 2:
            raise
        retry_after = e.headers.get('Retry-After')
        wait = float(retry_after) if retry_after else backoff_with_jitter(attempt)
        time.sleep(wait)
```

Retry-After header takes priority over computed backoff when the LLM provider supplies it — Anthropic and OpenAI both include it in 429 responses. Apply 0 retries to 4xx responses that are not 429 (bad request, invalid model, content filter) — retrying these wastes budget without changing the outcome.

### Circuit Breaker vs. Per-Agent Budget: Two Complementary Controls

These controls operate at different layers and neither substitutes for the other:

| **Control** | **Protects against** | **Enforcement point** |
|---|---|---|
| Circuit breaker | LLM API rate-limit cascade, retry storms | Per-agent, at LLM call site |
| Budget cap | Runaway cost from unbounded token consumption | Infrastructure layer, LLM proxy |
| Max iterations | Single-task infinite loop | Agent framework (LangChain AgentExecutor) |
| Container TTL | Zombie container resource consumption | Orchestration layer (K8s, mesh) |

A compromised agent that bypasses `max_iterations` in application code still hits the budget cap at the infrastructure proxy. A retry storm blocked by the circuit breaker still consumes budget if the task re-queues repeatedly — the budget cap prevents the total from exceeding your configured ceiling. All four controls together define a complete runaway prevention stack.

## Credential Injection at Deployment: Vault Proxy vs. Environment Variables

### Environment Variables: The Insecure Default

The most common pattern for injecting LLM API keys into containers is environment variables. It is also the most dangerous for production agent deployments:

- `docker inspect <container>` reveals all environment variables to any user with Docker socket access
- Application logging that prints environment state (common in debugging) leaks keys to log aggregators
- Prompt injection attacks that elicit `print(os.environ)` or equivalent exfiltrate every key the agent holds
- In Kubernetes, env vars sourced from Secrets are readable by any principal with `kubectl exec` access to the pod

The [AI agent security guide](/learn/ai-agent-security) details how environment variable exfiltration combines with prompt injection to produce complete credential theft. OWASP LLM06 (Excessive Agency) includes credential exfiltration through over-permissioned environment access as a primary attack vector.

### Vault Proxy Pattern: Credentials Never in Agent Memory

OpenLegion's vault proxy keeps API keys in Zone 2, separated from agent containers in Zone 1 by a network boundary. Agent code references credentials as opaque handles (`$CRED{openai_key}`) — the handle is a string token with no embedded key material. When the agent makes an LLM call, the request routes through the Zone 2 proxy, which resolves the handle to the actual key and injects it at the network layer before forwarding the request.

The agent container never holds the plaintext key. No memory dump, no environment print, no prompt injection exfiltrates the actual credential — there is nothing to exfiltrate from within the agent's address space. The vault proxy also enforces per-agent credential scope: agent roles define which credential handles they can resolve. An agent configured for read-only research tasks cannot resolve write-scope credentials even if instructed by a compromised prompt.

For deployments not using OpenLegion's mesh, the equivalent pattern is HashiCorp Vault Agent (35,736 GitHub stars, BSL 1.1 license) sidecar injection: Vault Agent runs as a sidecar, authenticates to Vault using the pod's Kubernetes service account, and writes short-lived credentials to a shared in-memory volume rather than environment variables. The credentials rotate automatically, and the agent process reads them from the in-memory volume — never from env vars.

### Kubernetes Secrets: Better Than Env Vars, Still Not Vault-Grade

Kubernetes Secrets improve on plain env vars in one important way: they can be mounted as files in a memory-backed `tmpfs` volume rather than environment variables, and they update without restarting the container when the Secret is rotated. They also support encryption at rest when etcd encryption is configured.

They fall short of vault-grade for agent deployments because `kubectl exec` still provides runtime access to mounted files, RBAC misconfiguration is common in practice, and secrets are not short-lived — a compromised secret remains valid until manually rotated. For financial or production LLM credentials, vault proxy injection is the production-grade standard.

## Autoscaling: Kubernetes HPA for Agent Fleets

### HPA v2 API: Custom Metrics for Agent Workloads

Kubernetes Horizontal Pod Autoscaler v2 supports scaling on custom metrics via `custom.metrics.k8s.io`. CPU utilization — the default HPA metric — is a poor proxy for agent workload: an agent blocked on an LLM API call consumes near-zero CPU while representing a full unit of productive capacity. Queue depth is the correct scaling signal for agent fleets.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-fleet-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agent-workers
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: External
    external:
      metric:
        name: task_queue_depth
      target:
        type: AverageValue
        averageValue: "5"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 60
```

The `stabilizationWindowSeconds: 300` default on scale-down prevents the autoscaler from removing pods during a transient queue lull, then scrambling to restore them when new tasks arrive. For agent fleets with variable burst patterns, increase this to 600s. Scale-up should be aggressive (no stabilization window); scale-down should be conservative.

### Cold Start: Managing Latency for Ephemeral Containers

Container cold starts add latency at the worst time — when new tasks arrive and replicas are spinning up. Python runtime startup takes approximately 200ms. Importing a typical agent dependency set (LangChain, httpx, pydantic) adds 1–5 seconds. Loading an embedding model adds 15–60 seconds depending on model size and storage backend.

Three mitigations:

**Pre-warmed pool**: Keep a minimum replica count (`minReplicas: 2`) running at all times, even during zero-load periods. The marginal cost of two idle Python containers is small compared to the p99 latency penalty of cold-starting from zero on the first task of the day.

**Image optimization**: Use multi-stage Docker builds to minimize image size. Pre-download model artifacts into the image layer during build rather than at runtime. A container that starts from a layer cache hit takes 1–3 seconds rather than 30–60.

**Startup probe tolerance**: Configure the startup probe with an `initialDelaySeconds` of 10–15 seconds for model-loading agents. A startup probe that fires too early kills the container before the model finishes loading, triggering a restart loop that compounds cold-start latency.

AWS Lambda cold starts for Python functions run 100ms–1s (AWS documentation, 2024) — faster than container cold starts but with tighter execution time limits (15 minutes maximum) and no persistent filesystem. For agent tasks under 15 minutes with highly variable traffic, Lambda can reduce infrastructure costs by eliminating idle replica costs. For tasks requiring persistent state, longer execution windows, or custom base images, container deployment remains the standard.

## Canary and Blue-Green Deployment for Agent Updates

Agent deployments introduce a specific rollout risk that standard web services do not face: an updated agent with a changed system prompt or tool configuration may behave differently mid-flight on tasks that the previous version started. A blue-green cutover during active task execution loses in-flight context.

**Canary deployment for agent fleets**: Route 5% of new task assignments to the updated agent version while existing tasks continue on the current version. Monitor error rate, cost per task, and task completion rate on the canary. Promote if the canary's metrics match or improve on baseline after 100 task completions. This requires task routing logic that respects version affinity — a task started on v1 should complete on v1 even if v2 is deployed.

**Blue-green with drain**: Start the green (new) deployment. Stop routing new tasks to blue (old). Wait for all in-flight blue tasks to complete or time out (drain period = max task TTL). Switch traffic fully to green. Shut down blue. The drain period is the operational cost of blue-green for agent fleets — budget for it explicitly in your deployment runbooks.

## OpenLegion's Take

Production AI agent deployment in 2026 fails in one of three ways: cost overruns from unbounded token consumption, runaway containers from missing TTLs, and credential exposure from environment variable injection. Each has a documented mitigation that the web service deployment playbook does not cover. OWASP LLM10 on unbounded consumption has been in the Top 10 since 2023 and is still the most common production failure mode in agent systems because teams apply web-service cost models to workloads with $50-per-task variance.

The Kubernetes HPA v2 custom metrics API, circuit breaker patterns, and vault proxy injection are all available as open-source infrastructure. The gap is not tooling — it is operational knowledge applied to agent-specific failure modes. The four-control runaway prevention stack (circuit breaker + budget cap + max iterations + TTL) is not complex to implement; it is simply not in the default configuration of any agent framework as of June 2026.

OpenLegion's mesh enforces three of the four controls at the platform layer: budget caps (Zone 2 Cost Tracker), TTLs (`spawn_fleet_agent(ttl=N)`), and credential isolation (Zone 2 vault proxy with opaque handles). `max_iterations` is set per agent role in the mesh configuration. Teams adopting the mesh inherit this runaway prevention stack without implementing it from scratch. Teams building on raw Kubernetes need to wire each control explicitly.

For deeper coverage of the observability layer that surfaces circuit breaker trips, OOM kills, and budget cap events in production, see the [AI agent observability guide](/learn/ai-agent-observability). For the sandboxing layer that hardens agent containers against prompt injection exfiltration, see [AI agent sandboxing](/learn/ai-agent-sandboxing).

## Get Started

**Deploy agents with enforced budget caps, auto-terminating TTLs, and air-gapped credentials from day one.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Explore AI Agent Architecture](/learn/ai-agent-architecture)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What makes AI agent deployment different from deploying a web service?

AI agents are stateful, consume variable token budgets measured in dollars per task, and can enter runaway retry loops that exhaust rate limits and budgets simultaneously. Standard web service deployment assumes stateless, CPU-bounded workloads that scale horizontally. Agent deployment requires three additional controls: per-agent budget caps enforced at the infrastructure layer, container TTLs that auto-terminate zombie workloads, and circuit breakers on LLM API calls that prevent retry storms from cascading.

### What is a container TTL and why do agents need one?

A container TTL (time-to-live) is a hard deadline after which the container is automatically terminated, regardless of task state. Agents that lose their task reference due to a scheduler restart or orphaned handoff continue running indefinitely without a TTL, consuming resources and accumulating cost. In Kubernetes, set `activeDeadlineSeconds` on the Pod spec. In OpenLegion, pass `ttl=3600` to `spawn_fleet_agent`. The TTL should be set to at least 2× the expected maximum task duration.

### How do LLM circuit breakers work in production agent deployments?

A circuit breaker tracks consecutive LLM API failures. After a threshold — typically 5 consecutive 429 rate-limit responses within 30 seconds — it trips to the open state and fails all subsequent LLM calls immediately without reaching the API. After a backoff period (starting at 60 seconds, doubling on each trip), it enters half-open state and allows a single probe request. Success resets the circuit; failure extends the backoff. This prevents retry storms where agents amplify rate-limit pressure by retrying aggressively.

### Why are environment variables unsafe for LLM API keys in agent containers?

Environment variables are readable via `docker inspect`, logged by environment-print debugging statements, accessible via `kubectl exec` by any principal with pod exec permissions, and exfiltrable through prompt injection attacks that instruct the agent to print its environment. For production agent deployments handling external inputs, use a vault proxy pattern instead: credentials are stored in an air-gapped zone and injected at the network layer. The agent process never holds the plaintext key.

### What Kubernetes metrics should I use for autoscaling agent fleets?

CPU utilization is a poor autoscaling signal for agent fleets because LLM-blocked agents consume near-zero CPU while representing full productive capacity. Use queue depth as the primary scaling metric via the Kubernetes HPA v2 `custom.metrics.k8s.io` API. Target an average queue depth per replica — 5 pending tasks per replica is a common starting point. Set `scaleDown.stabilizationWindowSeconds` to at least 300 seconds to prevent scale-down flapping during transient lulls.

### How should I handle graceful shutdown for long-running agent tasks?

Set `terminationGracePeriodSeconds` in Kubernetes to at least the p95 task duration. In the agent process, register a SIGTERM handler that stops accepting new tasks and calls a drain function that waits for in-flight work to complete before exiting. Without a SIGTERM handler, the agent exits mid-task when Kubernetes sends SIGTERM before SIGKILL, the task appears failed, and the orchestrator retries it — racing with the replacement container.

### What is the difference between a circuit breaker and a per-agent budget cap?

A circuit breaker protects against LLM API rate-limit cascades: it trips when the API returns too many 429s in a short window and blocks calls until the API recovers. A per-agent budget cap protects against unbounded cost accumulation: it rejects LLM calls once the agent exceeds its configured daily or monthly spend, regardless of whether the API is rate-limiting. Both are required — a circuit breaker does not prevent cost overruns from a slow trickle of expensive calls, and a budget cap does not prevent the retry storm that exhausts rate-limit quota before the cap is hit.

### How do I deploy agents to production on Kubernetes without OpenLegion?

You need to wire five controls manually: set `resources.limits` on each pod for OOM protection, configure `activeDeadlineSeconds` for TTL enforcement, implement a circuit breaker library (tenacity for Python, resilience4j for Java) at the LLM call site, use HashiCorp Vault Agent sidecar or Kubernetes External Secrets for credential injection rather than environment variables, and deploy a cost-tracking sidecar or external billing guard to enforce per-agent budget caps. The Kubernetes HPA v2 API handles autoscaling if you expose a queue-depth custom metric from your task broker.
