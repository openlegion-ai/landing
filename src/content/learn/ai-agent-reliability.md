---
title: "AI Agent Reliability — Circuit Breakers, Backoff, and Dead-Letter Queues"
description: "Reliable AI agents: exponential backoff with jitter for LLM 429s, circuit breakers for cascading failures, dead-letter queues, idempotency keys for safe retries, and budget caps as guardrails."
slug: /learn/ai-agent-reliability
primary_keyword: ai agent reliability
last_updated: "2026-06-22"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-deployment
  - /learn/ai-agent-observability
  - /learn/ai-agent-monitoring
  - /learn/ai-agent-security
  - /learn/human-in-the-loop-ai-agents
  - /learn/llm-cost-optimization
---

# AI Agent Reliability: Circuit Breakers, Backoff, and Dead-Letter Queues

AI agent reliability is the set of fault tolerance patterns that determine whether a production agent recovers gracefully from tool failures, LLM API rate limits, and coordination errors — or enters cascading failure modes that exhaust budgets and require manual intervention. Agents differ from web services: they are stateful, consume variable token budgets per call, and can enter retry loops functionally indistinguishable from DoS attacks on downstream APIs. Error messages can also leak system prompt fragments.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent reliability** is the set of fault tolerance patterns — exponential backoff with jitter, circuit breakers, dead-letter queues, idempotency keys, and supervisor-gated retries — that determine whether a production AI agent recovers gracefully from tool failures, LLM API rate limits, and coordination errors, or instead enters cascading failure modes that exhaust budgets, expose error side-channels, and require manual operator intervention to stop.

## Reliability Patterns at a Glance

| **Pattern** | **Failure it addresses** | **Key parameter** |
|---|---|---|
| **Exponential backoff + jitter** | LLM 429s, transient tool failures | cap=20s, base=1s, full jitter |
| **Circuit breaker** | Cascading failure from repeated downstream errors | 5 failures / 30s → Open; 60s cooldown |
| **Dead-letter queue** | Unprocessable tasks: permanent errors, budget-exhausted retries | Alert on DLQ entry; human review required |
| **Idempotency key** | Duplicate side-effects from safe retries | hash(agent\_id + task\_id + tool\_name + call\_number) |
| **Budget cap** | Runaway retry loops, unbounded token spend | Fail-open at 80%, fail-closed at 100% |
| **Error taxonomy** | Conflating transient and permanent errors | RFC 7807 type field; never retry 400/401/404/422 |

## The Three Failure Layers in Production Agent Systems

### Layer 1: Tool Failures — Timeouts, 4xx, and 5xx Errors

Tool failures fall into three categories with different recovery strategies:

**Transient errors** (retryable with backoff): network timeouts, 503 Service Unavailable, 502 Bad Gateway, 504 Gateway Timeout. The tool's upstream service is temporarily unavailable. Retry with exponential backoff and jitter. Max 3 retries. If all 3 fail, send to the dead-letter queue.

**Permanent errors** (not retryable): 400 Bad Request (malformed arguments the agent controls), 401 Unauthorized (credential invalid — rotation required, not a retry situation), 403 Forbidden (insufficient permissions — structural issue, not transient), 404 Not Found (target resource doesn't exist), 422 Unprocessable Entity (valid request but semantically invalid). Retrying permanent errors wastes tokens and budget. Route directly to the dead-letter queue.

**Partial failures** (hardest to detect): the tool returns HTTP 200 but the response is truncated, malformed, or missing required fields. Naive error handling misses these entirely because the HTTP status is success. Fix: validate response shape against the expected schema before treating a call as successful. If the response shape doesn't match, treat the call as a transient error and apply backoff.

RFC 7807 (IETF, 2016) defines a standard problem detail format for HTTP API errors: `{type, title, status, detail, instance}`. The `type` field is a URI that uniquely identifies the error class — use it to route between transient and permanent error handling without string-matching on `message` fields that change between API versions.

### Layer 2: LLM API Failures — Rate Limits, Overload, and Timeouts

LLM API failures require different handling than tool failures because they carry semantic meaning for budget and quota:

**429 RateLimitError (OpenAI)**: the model's `openai-python` v1.x SDK (2024) sets `max_retries=2` by default — two retries with exponential backoff before raising to the caller. Override to `max_retries=3` for production. Always check the `Retry-After` header before computing a backoff interval — the API's retry hint takes priority over your computed interval. After SDK exhaustion, send the task to the dead-letter queue and notify the operator.

**overloaded_error (Anthropic)**: indicates the Anthropic API is temporarily over capacity — distinct from a rate limit. Retry up to 3 times with delays of 60s / 120s / 240s (doubling). If all 3 fail, send to DLQ and notify the operator. Do not conflate `overloaded_error` with `rate_limit_error` — `rate_limit_error` means a quota is exhausted (not a transient condition), and retrying burns more quota against the same limit.

**context_length_exceeded**: not retryable. The request will fail again with the same context. Truncate the context, summarize prior conversation history, or chunk the task — but do not retry unchanged. Route to DLQ with a note that context reduction is required.

**connection_error / timeout**: retryable with full jitter backoff. Cap total retry time at the task's wall-clock timeout.

Never configure unlimited retries on any LLM error type. An agent retrying indefinitely on a `rate_limit_error` consumes tokens on failed calls while blocking other agents sharing the same API key.

### Layer 3: Inter-Agent Coordination Failures — Dropped Tasks and Stale State

Multi-agent pipelines introduce a third failure layer that doesn't exist in single-agent systems:

**Dropped hand-offs**: a `hand_off()` call completes without error on the sender's side, but the recipient agent never receives or processes the task. Detection: the sender writes the task to the blackboard with a timestamp; a supervisor checks that the recipient acknowledges within a timeout window (typically 2× the recipient's expected task duration).

**Stale blackboard state**: an upstream agent writes a value to the blackboard; a downstream agent reads it and begins processing; the upstream agent then overwrites the value with a revised version. Fix: versioned blackboard writes — include a `version` field in every blackboard entry, and downstream agents check the version against what they read before using a value.

**Circular dependency deadlock**: Agent A is waiting for Agent B to complete a task; Agent B is waiting for Agent A. Detection: heartbeat monitoring — each agent writes a heartbeat timestamp to `heartbeat/{agent_id}` every 60 seconds. A supervisor that observes two agents with stale heartbeats and a dependency relationship between their current tasks can identify and break the deadlock.

## Exponential Backoff with Jitter: Preventing Retry Storms

### Why Naive Exponential Backoff Fails at Scale

Standard exponential backoff — wait 2^n seconds between retries — solves the immediate retry problem but creates the thundering herd at scale. When N agents fail simultaneously (a common pattern when a shared downstream API goes down), they all compute the same backoff interval and retry in synchronized waves.

Marc Brooker documented this problem and its solution in the AWS Architecture Blog (2015). The solution is full jitter:

```
wait = random(0, min(cap, base × 2^n))
```

With `cap=20s` and `base=1s` (AWS recommended values), retry waits are:
- Attempt 1: random 0–2s
- Attempt 2: random 0–4s
- Attempt 3: random 0–8s
- Attempt 4+: random 0–20s (capped)

Full jitter distributes retry attempts uniformly across the time window. At 100 agents retrying simultaneously, full jitter spreads retries across the cap window; naive exponential backoff clusters them at `base × 2^n`.

Two alternatives:

**Equal jitter**: `wait = (cap/2) + random(0, cap/2)`. Ensures the wait is never near zero but clusters more than full jitter. Use when you need a guaranteed minimum cooldown period.

**Decorrelated jitter**: `wait = min(cap, random(base, prev_wait × 3))`. Produces the widest spread of retry intervals. Recommended when agent population exceeds 100 and the downstream API has sensitive capacity limits.

### Retry Budget: Hard Limits Before the Circuit Opens

| **Error type** | **Max retries** | **Backoff** | **After exhaustion** |
|---|---|---|---|
| Transient tool error (5xx, timeout) | 3 | Full jitter, cap=20s | DLQ + operator alert |
| LLM 429 (OpenAI) | 3 + SDK retries | Retry-After header first | DLQ + operator alert |
| Anthropic overloaded\_error | 3 | 60s / 120s / 240s | DLQ + operator alert |
| Permanent tool error (4xx) | 0 | — | Immediate DLQ |
| context\_length\_exceeded | 0 | — | DLQ + context-reduction note |
| rate\_limit\_error (quota exhausted) | 0 | — | Suspend until next window |

The total retry delay for any single task must be bounded by the task's wall-clock timeout. If the timeout is 300 seconds and 3 retries with 60/120/240s backoff would take 420 seconds total, cut to 2 retries.

### Anthropic and OpenAI-Specific Retry Handling

**Anthropic SDK**: implement retries at the application layer:

```python
import anthropic, time, random

client = anthropic.Anthropic()

def call_with_retry(messages, max_retries=3):
    delays = [60, 120, 240]
    for attempt in range(max_retries):
        try:
            return client.messages.create(
                model="claude-opus-4-5",
                max_tokens=8096,
                messages=messages
            )
        except anthropic.RateLimitError:
            raise  # Quota exhausted — do NOT retry
        except anthropic.APIStatusError as e:
            if e.status_code == 529:  # overloaded_error
                if attempt == max_retries - 1:
                    raise
                time.sleep(delays[attempt] + random.uniform(0, 10))
            else:
                raise
```

**OpenAI SDK**: override `max_retries` and add a post-exhaustion DLQ hook:

```python
from openai import OpenAI

client = OpenAI(max_retries=3)

def call_with_dlq_fallback(messages, task_id):
    try:
        return client.chat.completions.create(
            model="gpt-4o", messages=messages
        )
    except Exception as e:
        send_to_dlq(task_id=task_id, error=str(e), error_type=type(e).__name__)
        raise
```

## Circuit Breakers: Preventing Cascading Failure

### Circuit Breaker States: Closed, Open, Half-Open

Martin Fowler documented the circuit breaker pattern at martinfowler.com/bliki/CircuitBreaker.html (2014). A circuit breaker wraps calls to a downstream dependency and tracks failure rate. Three states:

**Closed** (normal operation): calls pass through. The circuit breaker counts failures. When the failure count exceeds the threshold — typically 5 failures in 30 seconds — the circuit opens.

**Open** (dependency considered down): calls fail immediately without reaching the dependency. The circuit breaker returns a cached error response or raises a `CircuitOpenError`. No downstream calls are made, preventing a failing dependency from receiving an increasing retry load that would prevent recovery. The circuit remains open for a 60-second cooldown.

**Half-Open** (recovery probe): after the cooldown, exactly one probe request is allowed through. If the probe succeeds, the circuit closes. If the probe fails, the circuit reopens with a doubled cooldown (60s → 120s → 240s).

One circuit breaker per dependency. A failure in a web search API should not open the circuit for database reads.

### Agent-Level Circuit Breaker: INSTRUCTIONS.md Pattern

In OpenLegion, circuit breaker state is maintained on the blackboard (not in-process) because agents restart across sessions:

```markdown
## Circuit Breaker Protocol

Maintain failure counter in `circuit/{tool_name}` on the blackboard.

On tool call failure:
1. Increment `circuit/{tool_name}/failures`
2. If failures >= 5 within last 30 seconds:
   - Set `circuit/{tool_name}/state: open`
   - Set `circuit/{tool_name}/open_until: [current_time + 60s]`
   - Call update_status(state="working", summary="Circuit open on {tool_name}, resuming at {timestamp}")

On circuit open, probe after cooldown:
1. Read `circuit/{tool_name}/open_until`
2. If current_time > open_until: attempt one probe call
3. Probe success: set state=closed, reset failures=0
4. Probe failure: set open_until = current_time + (prev_cooldown × 2)
```

The mesh supervisor monitors `circuit/*/state` keys. Any circuit open for more than 5 minutes triggers an operator alert — a circuit that doesn't recover within 5 minutes indicates an outage, not a transient blip.

## Dead-Letter Queues and Idempotency: Handling Unrecoverable Tasks

### Dead-Letter Queue Design for Agent Systems

A DLQ is a blackboard namespace: `dlq/{timestamp}/{task_id}`. Every entry must include:

```json
{
  "task_id": "...",
  "original_task": {},
  "agent_id": "...",
  "error_type": "overloaded_error | RateLimitError | context_length_exceeded | ...",
  "error_message": "...",
  "retry_count": 3,
  "last_attempt_at": "2026-06-22T14:23:11Z",
  "recommended_action": "operator_review | context_reduction | quota_check | credential_rotation",
  "budget_consumed_usd": 0.42
}
```

The `recommended_action` field classifies the failure at write time so operators know what action is needed without reading the full error log:

- `operator_review`: permanent or unclassified error
- `context_reduction`: context_length_exceeded — truncate and retry
- `quota_check`: LLM quota exhausted — verify budget allocation
- `credential_rotation`: 401 or auth failure — rotate the affected `$CRED{}` handle

Alert on every DLQ entry. A silent DLQ means tasks are being lost without operator awareness.

### Idempotency Keys: Safe Retries for Side-Effect Tools

An idempotency key guarantees that retrying a failed operation does not produce duplicate side effects. Without one, a task that commits a file on attempt 1 and receives a network timeout before the response arrives will commit again on attempt 2.

Construct from content stable across retries:

```python
import hashlib

def make_idempotency_key(agent_id, task_id, tool_name, call_number):
    payload = f"{agent_id}:{task_id}:{tool_name}:{call_number}"
    return hashlib.sha256(payload.encode()).hexdigest()[:32]
```

Pass it in every side-effect call:

```python
http_request(
    url="https://api.example.com/messages",
    method="POST",
    headers={
        "Authorization": "Bearer $CRED{example_key}",
        "Idempotency-Key": make_idempotency_key(AGENT_ID, TASK_ID, "http_request", 3)
    },
    body=json.dumps({"content": message})
)
```

For APIs without server-side idempotency, store the key and result in the blackboard before returning: check `results/{idempotency_key}` before executing any side-effect call. If the key exists, return the cached result.

### Delivery Guarantees: At-Most-Once vs. At-Least-Once

**At-most-once**: execute the call, never retry on failure. No duplicates, but failures mean lost tasks. Appropriate for: logging events, metrics updates, blackboard status writes.

**At-least-once**: retry on failure, accept possible duplicates. Appropriate for: side-effect operations protected by idempotency keys, task queue consumption.

**Exactly-once**: achieved at the application layer by combining at-least-once delivery with idempotency key deduplication. Blackboard writes in OpenLegion are naturally at-least-once (writes are idempotent); LLM API calls are at-most-once by default — converting them requires idempotency management at the application layer.

## Error Side-Channels and the Security Dimension of Reliability

### Error Messages as Information Leakage Vectors

OWASP ML Security Top 10 v1.0 (2023) item ML05:2023 identifies error side-channel attacks on AI systems. Three specific leakage patterns in agent error handling:

**System prompt exposure**: some LLM error responses include the request context in the error detail. If the system prompt is in the request and the error detail is logged verbatim, the system prompt appears in the log. Mitigation: sanitize error messages before logging — log only the error type, status code, and a sanitized message.

**Tool name exposure in stack traces**: if exception stack traces from failed tool calls appear in the agent's context window or logs, they reveal the internal tool registry. Mitigation: catch all exceptions at the tool call boundary and return sanitized error objects: `{error_type: "tool_timeout", tool: "external_api"}`.

**Credential usage pattern exposure via retry timing**: an adversary with visibility into retry timing can infer which credentials are used and at what rate. Mitigation: add random jitter (0–5s) to every retry interval independently of the exponential backoff calculation.

OWASP ML08:2023 (Improper Error Handling) covers the complement: error handlers that silently swallow exceptions, preventing operators from detecting failures. Log detailed errors internally to the append-only audit trail; return sanitized errors to external consumers and to the agent context window.

### Retry Storms as Self-Inflicted DoS

An agent retrying without a circuit breaker generates more load on a failing dependency than the original request rate. If 10 agents each retry a 5-second timeout 3 times with 2-second backoff:

- Without circuit breaker: 40 requests in ~30 seconds while the dependency is struggling
- With circuit breaker (opens after 5 failures): 5 requests total; the dependency recovers

OpenAI and Anthropic both implement automatic credential suspension for excessive retry rates. A suspended credential is a service outage. The circuit breaker prevents this by stopping retries when the circuit opens.

## Budget Caps as Reliability Guardrails

### The Budget Cap as an Automatic Circuit Breaker

Budget caps at the infrastructure layer act as a backstop circuit breaker: when the agent's daily cap is reached, all LLM calls are rejected, forcing a blocked state regardless of retry logic.

OpenLegion's Zone 2 Cost Tracker enforces per-agent daily and monthly caps. At 80% of the daily cap, an alert fires. At 100%, calls are rejected.

Calibrate the cap to reflect failure modes, not just success modes:

```
Normal daily spend: $10/day (20 tasks × $0.50)
Worst-case retry storm: 4× = $40/day
Cap: $50/day (operator alerted at $40)
```

Setting the cap at 1.2× normal spend means a retry storm hits the limit before an operator can respond. 3–4× is the calibration target.

### The Four Golden Signals Applied to Agent Reliability

Google's SRE Book (Beyer et al., O'Reilly, 2016) defines four golden signals for service reliability: latency, traffic, errors, and saturation. Applied to agents:

**Latency**: p50 and p99 task completion time. p99 latency spikes are the first signal of upstream API degradation — before error rates increase, response times grow. Alert on p99 > 2× baseline.

**Traffic**: tasks per hour per agent role. A drop below 20% of baseline for 30 minutes indicates the agent is stuck (circuit open, budget exhausted, blackboard stall).

**Errors**: DLQ entry rate. Not raw tool failure rate — only unrecovered failures (DLQ entries) count as reliability errors for SLO purposes.

**Saturation**: budget consumed as a fraction of the daily cap. Alert at 80% consumption by 50% of the day — the leading indicator of a retry storm in progress.

The [AI agent observability guide](/learn/ai-agent-observability) covers how to instrument these four signals.

## OpenLegion's Take

Reliability engineering for agent systems requires treating the agent as a network client, not as an application. The patterns — backoff, circuit breakers, DLQs, idempotency — are from distributed systems engineering (AWS 2015 jitter paper, Martin Fowler's 2014 circuit breaker, Google SRE 2016). What changes for agents is the failure surface: retry loops that consume unbounded token budget, error messages that expose system prompt fragments, and retry storms that get credentials suspended.

The security dimension of reliability is under-specified in most agent framework documentation. OWASP ML05:2023 (error side-channels) and ML08:2023 (improper error handling) apply directly to agent error handling — but neither framework implements these mitigations by default. Teams building production agents need to add them explicitly: sanitize error messages before logging, implement circuit breakers per-dependency, and treat retry storm risk as a credential security issue.

OpenLegion's blackboard-based circuit breaker pattern writes circuit state to `circuit/{tool_name}` keys that persist across agent restarts — a key requirement for heartbeat-scheduled agents. In-process circuit breaker objects lose state on restart; blackboard-based state persists. For the credential management patterns that harden the credential side-channel risk, see [credential management for AI agents](/learn/credential-management-ai-agents). For the deployment configuration that sets container resource limits, see [AI agent deployment](/learn/ai-agent-deployment).

## Get Started

**Production-grade agent reliability with blackboard circuit breakers, budget cap guardrails, and DLQ alerting.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Explore AI Agent Monitoring](/learn/ai-agent-monitoring)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent reliability and why is it different from web service reliability?

AI agent reliability covers fault tolerance across three failure layers: tool failures, LLM API failures, and inter-agent coordination failures. It differs from web service reliability because agents are stateful across multiple tool calls, consume variable token budgets per call, and can enter retry loops functionally indistinguishable from DoS attacks on downstream APIs. Error messages in agent systems can also leak system prompt fragments, adding a security dimension absent from standard web service error handling.

### What is exponential backoff with full jitter and why is it recommended?

Plain exponential backoff schedules retries at 2^n second intervals. When N agents fail simultaneously, they all compute the same interval and retry in synchronized waves — the thundering herd problem. Full jitter (Marc Brooker, AWS, 2015) computes `wait = random(0, min(cap, base × 2^n))` with cap=20s and base=1s. This distributes retry attempts uniformly across the time window rather than clustering them, preventing synchronized retry waves from re-overwhelming a recovering dependency.

### What errors should never be retried by an AI agent?

Four error categories must never be retried: 400 Bad Request (the agent controls the request — retrying the same arguments produces the same failure), 401 Unauthorized (credential is invalid — rotation required, not a retry), 404 Not Found (the target resource doesn't exist), and `context_length_exceeded` (the same context will fail again on every retry — context reduction is required first). Also do not retry `rate_limit_error` (quota exhausted) — retrying burns more quota against the same limit.

### What are the three circuit breaker states and how does the transition work?

Closed (normal): calls pass through; failures are counted. Open (dependency down): calls fail immediately without reaching the dependency; opens after 5 failures in 30 seconds. Half-Open (recovery probe): after a 60-second cooldown, one probe request is allowed through. If the probe succeeds, the circuit closes. If it fails, the circuit reopens with a doubled cooldown (60s → 120s → 240s). Use one circuit breaker per dependency — a failure in one service should not open circuits for unrelated services.

### What should go in a dead-letter queue entry for an agent task?

Every DLQ entry needs: the original task payload, the agent ID, error type and message (sanitized to avoid system prompt leakage), retry count and timestamps, budget consumed during retry attempts, and a `recommended_action` field classifying the failure as `operator_review`, `context_reduction`, `quota_check`, or `credential_rotation`. The `recommended_action` field means operators can triage the DLQ without reading full error logs. Alert on every DLQ entry — a silent DLQ means tasks are being lost without operator awareness.

### What is an idempotency key and how do I construct one for agent tool calls?

An idempotency key guarantees that retrying a failed side-effect operation does not produce duplicate effects. Construct it from: `hash(agent_id + task_id + tool_name + call_number)`. The `call_number` is the sequential count of this specific tool call within the task, ensuring different calls to the same tool get different keys while retries of the same call share a key. Store the key and result in the blackboard before returning, then check the blackboard before re-executing any side-effect call.

### How can agent error messages leak security-sensitive information?

Three leakage patterns: LLM error responses that include request context can expose system prompt fragments if logged verbatim. Exception stack traces from failed tool calls reveal the internal tool registry if returned to the context window or logs. Retry timing patterns expose credential usage rates to adversaries with timing visibility. OWASP ML05:2023 covers error side-channel attacks. Mitigations: sanitize error messages before logging, catch exceptions at the tool call boundary and return sanitized error objects, and add random jitter (0–5s) to retry intervals independently of the backoff calculation.

### How do budget caps function as reliability guardrails?

Budget caps enforced at the LLM proxy layer act as a backstop circuit breaker for retry storms. When the daily cap is reached, all LLM calls are rejected — forcing a blocked state regardless of the agent's retry logic. Set the cap at 3–4× normal daily spend: this covers worst-case retry storms while alerting the operator at 80% consumption. OpenLegion's Zone 2 Cost Tracker enforces these limits at the proxy layer, not bypassable by agent code. A cap set at 1.2× normal spend hits the limit before any operator response is possible.
