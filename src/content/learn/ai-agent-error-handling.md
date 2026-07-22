---
title: "AI Agent Error Handling — Retries, Circuit Breakers, and Fallback Chains"
description: "AI agent error handling: exponential backoff with jitter, circuit breaker pattern (Fowler 2014), Anthropic 529 vs 429, Temporal RetryPolicy, gRPC status codes, OWASP LLM05:2025, and OTel error spans."
slug: /learn/ai-agent-error-handling
primary_keyword: ai agent error handling
last_updated: "2026-07-18"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-reliability
  - /learn/ai-agent-debugging
  - /learn/ai-agent-observability
  - /learn/ai-agent-long-running-tasks
  - /learn/agentic-workflows
  - /learn/ai-agent-testing
---

# AI Agent Error Handling: Retries, Circuit Breakers, and Fallback Chains

AI agent error handling is the set of runtime code paths — exponential backoff retry loops, circuit breakers that halt retry storms, fallback chains, and error boundaries that sanitize exceptions before cross-agent propagation — that determine whether a transient failure causes a brief pause and recovery or a cascading failure. OWASP LLM05:2025 Improper Output Handling flags unhandled agent exceptions as a data leakage risk when exception messages contain system prompt content or tool call arguments.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent error handling** is the set of runtime patterns — retry logic with exponential backoff and jitter, circuit breakers that halt retry storms against degraded providers, fallback strategies that substitute alternative actions when primary tools fail, and error boundaries that catch and sanitize exceptions before they propagate across agent-to-agent hand-offs — that determine whether a transient failure causes a temporary pause and recovery, or a cascading failure that surfaces sensitive internal context to callers.

For SLO design and uptime targets that define acceptable error rates at the system level — the design-time counterpart to these runtime patterns — see [AI agent reliability and SLO design for production agent systems](/learn/ai-agent-reliability).

## Retry Logic: Exponential Backoff, Jitter, and Error Classification

### Exponential Backoff with Jitter: The AWS Formula

**AWS Builders' Library (2019) — "Timeouts, retries and backoff with jitter":** the canonical formula for safe retry timing in distributed systems:

```
sleep = min(cap, base * 2^attempt) + random(0, 1)
```

Recommended values for LLM API calls: `base = 1 second`, `cap = 60 seconds`. Computed sleep intervals across attempts:

| **Attempt** | **Base interval** | **With jitter (~)** |
|---|---|---|
| **0** | 1 s | 1.5 s |
| **1** | 2 s | 2.7 s |
| **2** | 4 s | 4.3 s |
| **3** | 8 s | 8.4 s |
| **4** | 16 s | 16.6 s |
| **5** | 32 s | 32.6 s |
| **6** | 60 s (cap) | 60.5 s |

**Why jitter matters — the thundering herd problem:**

Without jitter: all agents that receive a 429 rate limit response at the same time compute exactly the same `2^n` second sleep interval. They all wake up simultaneously and send a second spike — re-triggering the rate limit. The backoff achieved nothing.

With jitter: the `+ random(0, 1)` term (a random float between 0 and 1 second) spreads the retry timing across a 1-second window. In a fleet of 20 agents all retrying at once, retries are distributed across 20 individual moments rather than firing as a single burst.

**Full jitter variant** — for high-concurrency deployments with many agents retrying the same provider simultaneously:

```
sleep = random(0, min(cap, base * 2^attempt))
```

Full jitter eliminates the fixed component entirely. With 100 agents retrying simultaneously, retries spread across the full `min(cap, base * 2^n)` window rather than a 1-second window. Maximum spread; minimum spike.

**Python implementation:**

```python
import random
import time
from anthropic import RateLimitError, APIStatusError

def backoff_sleep(attempt: int, base: float = 1.0, cap: float = 60.0) -> float:
    """Exponential backoff with jitter (AWS formula)."""
    return min(cap, base * (2 ** attempt)) + random.random()

def call_llm_with_retry(client, messages: list, max_retries: int = 5) -> str:
    """Retry LLM calls with exponential backoff for transient errors."""
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                messages=messages,
            )
            return response.content[0].text

        except RateLimitError:
            # HTTP 429 — rate limited; use Retry-After header if present
            if attempt < max_retries - 1:
                time.sleep(backoff_sleep(attempt))
            else:
                raise

        except APIStatusError as e:
            if e.status_code == 529:
                # Anthropic overloaded — separate retry branch (see below)
                if attempt < max_retries - 1:
                    time.sleep(backoff_sleep(attempt, base=2.0))
                else:
                    raise
            elif e.status_code in (500, 503):
                # Provider internal error — retry with cap of 2
                if attempt < min(2, max_retries - 1):
                    time.sleep(backoff_sleep(attempt))
                else:
                    raise
            else:
                raise  # Non-retryable: 400, 401, 403, 422
```

### Classifying Errors: Retryable vs Non-Retryable

The most common retry implementation mistake: treating all errors as retryable. A 400 Bad Request retried 5 times produces 5 identical bad request errors. Worse — a retry storm on a non-retryable error amplifies load on a degraded provider that is already struggling.

**HTTP status codes for LLM APIs:**

| **Status** | **Retryable?** | **Strategy** |
|---|---|---|
| **429 Too Many Requests** | Yes | Wait for `Retry-After` header value; then retry once |
| **529 Overloaded (Anthropic)** | Yes | Exponential backoff, base=2s; resolves in 30–120s |
| **500 Internal Server Error** | Yes (limited) | Backoff; max 2 retries; escalate if persists |
| **503 Service Unavailable** | Yes | Backoff; provider temporarily offline |
| **400 Bad Request** | **No** | Malformed request; retrying produces identical error |
| **401 Unauthorized** | **No** | Invalid API key; retrying will not fix |
| **403 Forbidden** | **No** | Permission denied; retrying will not fix |
| **422 Unprocessable Entity** | **No** | Input validation failure; fix input before retrying |

**gRPC status code decision tree** for agent tool calls that communicate over gRPC:

```
UNAVAILABLE (14)       → RETRY with backoff
                          Provider temporarily offline; common cause: startup, network partition

DEADLINE_EXCEEDED (4)  → RETRY if idempotent (reads, searches)
                          CHECK before retrying if side effects (writes, sends, charges)
                          The operation may have completed server-side before the deadline

INTERNAL (13)          → DO NOT RETRY
                          Server encountered unexpected condition; operation state unknown
                          Log and alert; return structured error to caller

RESOURCE_EXHAUSTED (8) → RETRY after quota period resets
                          Equivalent to HTTP 429; rate limited or quota exceeded

INVALID_ARGUMENT (3)   → DO NOT RETRY
                          Request is malformed; retrying produces the same error
                          Fix the request before retrying

PERMISSION_DENIED (7)  → DO NOT RETRY
                          Access control rejection; escalate to human operator
```

**Temporal.io NonRetryableErrorTypes:** when using Temporal for durable agent task execution, list non-retryable error class names explicitly:

```python
# Temporal RetryPolicy — mark non-retryable errors to prevent wasted retries
retry_policy = RetryPolicy(
    initial_interval=timedelta(seconds=2),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(seconds=60),
    maximum_attempts=5,
    non_retryable_error_types=[
        "BadRequestError",       # 400 — malformed request
        "AuthenticationError",   # 401 — invalid API key
        "InvalidInputError",     # 422 — input validation failure
        "PermissionDeniedError", # 403 — access control rejection
    ]
)
```

Without `non_retryable_error_types`, Temporal retries a 400 Bad Request 5 times — each attempt identical and each failing identically. The list tells Temporal to fail immediately on these error types without burning retry budget.

### Anthropic 529 vs 429: Separate Retry Branches

Anthropic's HTTP error codes require two distinct retry code paths. Treating them identically is the most common Anthropic-specific retry mistake.

**HTTP 529 "Overloaded":**
- Non-standard status code (not in the HTTP specification)
- Meaning: Anthropic's infrastructure is at capacity — this is a **provider-side capacity issue**, not a caller quota issue
- The caller's rate limit is NOT exceeded
- Recovery: exponential backoff starting at 2–5 seconds; issue typically resolves within 30–120 seconds
- Most HTTP client libraries do not handle 529 by default — must be explicitly checked before other status codes

**HTTP 429 "Too Many Requests":**
- Standard status code
- Meaning: the caller has exceeded their rate limit quota
- The response includes a `Retry-After` header specifying the exact seconds to wait
- Recovery: wait for `Retry-After` seconds then retry once — do NOT use exponential backoff here; the header gives the exact required wait time

```python
import time
from anthropic import Anthropic

client = Anthropic()

def call_anthropic_with_retry(messages: list, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        response = client._client.post(
            "/v1/messages",
            json={"model": "claude-3-5-sonnet-20241022", "messages": messages,
                  "max_tokens": 4096}
        )

        if response.status_code == 200:
            return response.json()["content"][0]["text"]

        elif response.status_code == 529:
            # Overloaded — provider capacity issue; NOT a rate limit
            # Separate backoff: base=2s (slightly faster than default)
            if attempt < max_retries - 1:
                sleep_time = min(60, 2 * (2 ** attempt)) + random.random()
                time.sleep(sleep_time)
            else:
                raise AnthropicOverloadedError("Max retries exceeded for 529 Overloaded")

        elif response.status_code == 429:
            # Rate limited — caller quota issue
            # Use Retry-After header; NOT exponential backoff
            retry_after = int(response.headers.get("Retry-After", 60))
            if attempt < max_retries - 1:
                time.sleep(retry_after)
            else:
                raise RateLimitExceededError(f"Rate limited after {max_retries} retries")

        elif response.status_code in (500, 503):
            # Provider internal error — retry with standard backoff (max 2 retries)
            if attempt < min(2, max_retries - 1):
                time.sleep(backoff_sleep(attempt))
            else:
                raise ProviderError(f"HTTP {response.status_code} after {attempt + 1} retries")

        else:
            # Non-retryable: 400, 401, 403, 422 — raise immediately
            raise NonRetryableError(f"HTTP {response.status_code}: {response.text[:200]}")

    raise MaxRetriesExceeded("All retry attempts exhausted")
```

**Anthropic SDK handling:** `anthropic-sdk-python` >=0.20.0 handles 429 automatically via `Retry-After`; >=0.25.0 handles 529 with configurable `max_retries` parameter. If using the SDK at these versions, you do not need to implement the 429/529 retry logic manually — but you do need to configure `max_retries` and understand the difference to debug retry behavior correctly.

For validating that these error paths behave correctly under fault injection — see [AI agent testing and chaos engineering for error path validation](/learn/ai-agent-testing).

## Circuit Breakers: Preventing Retry Storms

### Three-State Circuit Breaker Implementation

**Martin Fowler, 2014 (martinfowler.com/bliki/CircuitBreaker.html):** the circuit breaker pattern prevents a degraded external dependency from being hammered by retry attempts. Three states:

```
CLOSED —[5 failures in 60s]—► OPEN —[30s timer]—► HALF-OPEN
  ▲                                                         │
  └──────[probe success]────────────────────────────────────┘
                                  │[probe failure]
                                  ▼
                                OPEN (reset timer)
```

**State behavior:**

- **Closed** (normal): requests pass through. Failure counter increments on each error. If the failure count exceeds the threshold (5 failures in 60 seconds), transition to Open and reset the timer.
- **Open**: all requests fail immediately without attempting the operation. The 30-second timer runs. When the timer expires, transition to Half-Open.
- **Half-Open**: one probe request is allowed through. If it succeeds: transition to Closed, reset failure counter. If it fails: transition back to Open and restart the 30-second timer.

**Why this matters for AI agents:** without a circuit breaker, when an LLM provider becomes overloaded, each agent worker independently retries — each applying exponential backoff individually. With 20 workers each running 5 retries over 60 seconds, the provider receives 100 requests during a period when it already cannot handle normal traffic. The circuit breaker cuts this to 1 probe request per 30 seconds until the provider recovers.

**Python implementation with `pybreaker`:**

```python
import pybreaker
import redis

# Shared state across all agent instances — CRITICAL for multi-worker deployments
redis_client = redis.Redis(host="localhost", port=6379)

class RedisCircuitBreakerStorage(pybreaker.CircuitBreakerStorage):
    """Store circuit breaker state in Redis so all workers share the same state."""
    def __init__(self, name: str):
        super().__init__(name)
        self._key = f"circuit_breaker:{name}"

    @property
    def state(self):
        value = redis_client.get(f"{self._key}:state")
        return value.decode() if value else pybreaker.STATE_CLOSED

    @state.setter
    def state(self, value):
        redis_client.set(f"{self._key}:state", value)

    @property
    def counter(self) -> int:
        return int(redis_client.get(f"{self._key}:counter") or 0)

    def increment_counter(self):
        redis_client.incr(f"{self._key}:counter")

    def reset_counter(self):
        redis_client.set(f"{self._key}:counter", 0)

# Separate circuit breakers per provider — Anthropic outage ≠ OpenAI circuit tripped
anthropic_breaker = pybreaker.CircuitBreaker(
    fail_max=5,
    reset_timeout=30,
    exclude=[
        BadRequestError,
        AuthenticationError,
        PermissionDenied,
        InvalidInputError,
    ],
    state_storage=RedisCircuitBreakerStorage("anthropic"),
)

@anthropic_breaker
def call_anthropic(messages: list) -> str:
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=messages,
        max_tokens=4096
    )
    return response.content[0].text
```

**Key configuration decisions:**

- **Separate circuit breakers per provider:** an Anthropic outage should not trip the OpenAI circuit breaker. If the orchestrator falls back to OpenAI when Anthropic's circuit is Open, and the OpenAI circuit is also Open, no provider is available — the fallback chain fails.
- **Shared Redis state across workers:** per-process circuit breakers allow each of 20 workers to independently hammer a degraded provider. Worker 1's successful Half-Open probe closes only Worker 1's circuit — the other 19 workers each send their own probe. Shared Redis state: one successful probe closes the circuit for all 20 workers simultaneously.
- **Exclude non-transient errors from failure counter:** a 400 Bad Request error does not indicate that the provider is unhealthy — it indicates that the request is malformed. Including it in the failure counter causes the circuit to trip due to bad requests rather than provider degradation.

### Bulkhead Pattern: Isolating Agent Error Domains

The bulkhead pattern isolates agent subsystems so that a failure in one cannot exhaust resources needed by others.

**For AI agent deployments:**

**1. Separate thread/process pools per agent type:**

```python
from concurrent.futures import ThreadPoolExecutor

# Separate pools — research agents cannot exhaust the executor pool
research_pool = ThreadPoolExecutor(max_workers=8, thread_name_prefix="research")
executor_pool = ThreadPoolExecutor(max_workers=4, thread_name_prefix="executor")
orchestrator_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="orchestrator")

# A flood of research agent retries exhausts research_pool (max 8 threads)
# but executor_pool (max 4 threads) remains fully available
```

**2. Per-agent timeout budgets:**

```python
import asyncio

async def call_research_agent(task: dict) -> dict:
    """Research agents have 120s budget — expensive web search tasks."""
    try:
        return await asyncio.wait_for(run_research(task), timeout=120.0)
    except asyncio.TimeoutError:
        return {"status": "timeout", "agent": "research", "task_id": task["id"]}

async def call_executor_agent(task: dict) -> dict:
    """Executor agents have 30s budget — fast execution tasks."""
    try:
        return await asyncio.wait_for(run_executor(task), timeout=30.0)
    except asyncio.TimeoutError:
        return {"status": "timeout", "agent": "executor", "task_id": task["id"]}
```

**3. Separate circuit breakers per tool** (not just per provider): a failing `web_search` tool should not trip the circuit breaker for `read_file` or `run_code`. Tool-level circuit breakers enable the agent to continue using working tools while failing gracefully on the broken tool.

For the multi-agent chain architecture that bulkheads protect — see [agentic workflows and multi-agent chain design](/learn/agentic-workflows).

## Fallback Strategies: What to Do When Retries Are Exhausted

### Tool Fallback Chains and Model Fallback

When all retries for a tool call are exhausted — or the circuit breaker is Open — the agent needs a decision: try a fallback tool, return a partial result, or escalate. A fallback chain provides that decision in code:

```python
from dataclasses import dataclass

@dataclass
class FallbackChain:
    """Ordered list of alternatives to try when the primary action fails."""
    steps: list[dict]

    def execute(self, query: str) -> dict:
        for step in self.steps:
            try:
                result = step["fn"](query)
                return {
                    "result": result,
                    "provider": step["name"],
                    "is_fallback": step.get("is_fallback", False)
                }
            except (CircuitBreakerError, MaxRetriesExceeded, ProviderError) as e:
                logger.warning("fallback_step_failed", step=step["name"],
                               error=type(e).__name__, query_truncated=query[:50])
                continue

        # All steps exhausted — return partial result, not exception
        return {
            "result": None,
            "provider": None,
            "is_complete": False,
            "missing_tools": ["web_search"],
            "reason": "All web search providers unavailable — retried 3 providers"
        }

# Web search fallback chain: primary (paid) → alternative (paid) → free (rate-limited)
web_search_chain = FallbackChain(steps=[
    {"name": "tavily", "fn": tavily_search, "is_fallback": False},
    {"name": "serper", "fn": serper_search, "is_fallback": True},
    {"name": "ddgs",   "fn": ddgs_search,   "is_fallback": True},
])
```

**Model fallback — when the primary LLM provider circuit is Open:**

```python
MODEL_FALLBACK_CHAIN = [
    {"model": "claude-3-5-sonnet-20241022", "provider": "anthropic",
     "breaker": anthropic_breaker},
    {"model": "gpt-4o-2024-08-06",         "provider": "openai",
     "breaker": openai_breaker},
    {"model": "gpt-4o-mini-2024-07-18",    "provider": "openai",
     "breaker": openai_breaker},
]

def call_with_model_fallback(messages: list) -> dict:
    for entry in MODEL_FALLBACK_CHAIN:
        if entry["breaker"].current_state == pybreaker.STATE_OPEN:
            logger.info("model_fallback_skipped", model=entry["model"],
                        reason="circuit_open")
            continue

        try:
            result = call_llm(entry["model"], entry["provider"], messages)
            return {"text": result, "model": entry["model"],
                    "provider": entry["provider"],
                    "is_fallback": entry["model"] != MODEL_FALLBACK_CHAIN[0]["model"]}
        except (CircuitBreakerError, MaxRetriesExceeded):
            continue

    raise AllProvidersUnavailable("All LLM providers in fallback chain are unavailable")
```

**Graceful degradation:** prefer returning `{"is_complete": False, "reason": "..."}` over raising an exception that terminates the task. A `False` completion flag lets the orchestrator decide: wait for recovery, skip the step, or escalate to a human. A raised exception removes that choice.

### Dead-Letter Queues for Failed Agent Hand-Offs

When an agent task fails after all retries, it should not silently disappear — it should be routed to a dead-letter queue (DLQ) for inspection and manual re-queue.

```python
import json
from datetime import datetime

class AgentDLQ:
    """Dead-letter queue for agent tasks that exceeded their retry budget."""

    def __init__(self, redis_client, retention_days: int = 14):
        self.redis = redis_client
        self.retention_seconds = retention_days * 86400
        self.DLQ_KEY = "agent:dlq"
        self.DLQ_SIZE_ALERT_THRESHOLD = 50

    def enqueue(self, task: dict, error: Exception,
                attempt_count: int, agent_id: str) -> str:
        entry_id = f"dlq:{task['task_id']}:{int(datetime.utcnow().timestamp())}"

        dlq_entry = {
            "entry_id": entry_id,
            "task_id": task["task_id"],
            "agent_id": agent_id,
            "original_input": task["input"],
            "error_type": type(error).__name__,
            "error_message": str(error)[:500],
            "attempt_count": attempt_count,
            "last_attempt": datetime.utcnow().isoformat(),
            "trace_id": get_current_trace_id(),
        }

        self.redis.lpush(self.DLQ_KEY, json.dumps(dlq_entry))
        self.redis.expire(entry_id, self.retention_seconds)

        dlq_size = self.redis.llen(self.DLQ_KEY)
        if dlq_size > self.DLQ_SIZE_ALERT_THRESHOLD:
            send_high_priority_alert(
                f"DLQ has {dlq_size} failed tasks — possible systemic failure",
                trace_id=dlq_entry["trace_id"]
            )

        return entry_id
```

**DLQ retention:** 14 days minimum — long enough to investigate intermittent failures that only appear under specific conditions. Maximum DLQ size alert: if the queue grows beyond a configured threshold (50 tasks), the alert is high-priority rather than low-priority — it signals systemic failure (provider outage, deployment bug) rather than individual task failure.

For the task queue architecture (Celery 5.3, Redis broker, and task acknowledgment settings) that DLQs integrate with — see [AI agent long running tasks and Celery task queue patterns](/learn/ai-agent-long-running-tasks).

## Error Propagation in Multi-Agent Chains

### Error Boundaries: Containing Failures at Agent Hand-Off Points

In a multi-agent chain (orchestrator → researcher → executor), an unhandled exception in the executor propagates up through the researcher to the orchestrator. If the orchestrator's exception handler re-raises without sanitizing, the full exception context — the researcher's tool call history, the executor's intermediate data — is exposed in the orchestrator's output and potentially in the user-facing response.

**Error boundary pattern:**

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class AgentError:
    """Structured error response for cross-agent communication.
    Contains ONLY information safe for external consumption."""
    error_code: str
    message: str
    correlation_id: str
    is_retryable: bool
    retry_after_seconds: int
    agent_id: str
    task_id: str

def execute_with_error_boundary(agent_fn, task: dict, agent_id: str) -> Any:
    """
    Error boundary: wrap every outbound agent call in this.
    Catches ALL exceptions, logs full details internally,
    returns sanitized AgentError to the upstream agent.
    """
    try:
        return agent_fn(task)

    except ProviderRateLimitError as e:
        logger.error("agent_rate_limit", agent_id=agent_id,
                     task_id=task["task_id"], exc_info=True)

        return AgentError(
            error_code="PROVIDER_RATE_LIMIT",
            message="LLM provider rate limited — task can be retried after 60 seconds",
            correlation_id=get_current_trace_id(),
            is_retryable=True,
            retry_after_seconds=60,
            agent_id=agent_id,
            task_id=task["task_id"]
        )

    except Exception as e:
        # Catch-all: unknown exception — maximum sanitization
        logger.error("agent_unexpected_error", agent_id=agent_id,
                     task_id=task["task_id"], exc_info=True)

        return AgentError(
            error_code="UNEXPECTED_ERROR",
            message="An unexpected error occurred — see correlation ID in logs",
            correlation_id=get_current_trace_id(),
            is_retryable=False,
            retry_after_seconds=0,
            agent_id=agent_id,
            task_id=task["task_id"]
        )
```

### OWASP LLM05:2025 — Exception Leakage via Agent Outputs

**OWASP LLM Top 10 v2 2025, LLM05: Improper Output Handling** covers the security risk of unhandled exceptions propagating sensitive agent context to callers.

**Common leak pattern:**

```python
# VULNERABLE: exception propagates with full context
@app.post("/agent/run")
async def run_agent(request: AgentRequest):
    try:
        result = agent.run(request.task)
        return {"result": result}
    except Exception as e:
        # This returns the FULL exception in the HTTP response
        # The exception may contain system prompt content, tool call arguments,
        # internal endpoint URLs, or environment variable names
        raise HTTPException(status_code=500, detail=str(e))  # ← LEAKS INTERNAL CONTEXT

# SAFE: sanitized external error; full context in internal log
@app.post("/agent/run")
async def run_agent_safe(request: AgentRequest):
    correlation_id = generate_correlation_id()

    try:
        result = agent.run(request.task)
        return {"result": result, "correlation_id": correlation_id}

    except Exception as e:
        logger.error("agent_task_failed",
                     correlation_id=correlation_id,
                     task_id=request.task_id,
                     exc_info=True,
                     exception_type=type(e).__name__)

        return JSONResponse(
            status_code=500,
            content={
                "error_code": "AGENT_TASK_FAILED",
                "message": "The agent task could not be completed.",
                "correlation_id": correlation_id,
            }
        )
```

**The external error response must NEVER contain:** exception tracebacks, tool call arguments (may contain user PII), system prompt content, internal endpoint URLs, or API key names.

**The external error response SHOULD contain:** `error_code` (a programmatic string the caller can handle), `message` (human-readable, safe for end-user display), `correlation_id` (for operator log lookup).

For inspecting the error spans and traces produced by these boundaries after a failure — see [AI agent debugging and post-mortem trace analysis](/learn/ai-agent-debugging).

## Durable Execution: Temporal RetryPolicy and Persistent Retry State

### Temporal.io RetryPolicy for Agent Tasks

**Temporal.io** (open-source durable execution platform, launched 2022) persists retry state to its database rather than keeping it in-process. This eliminates the most common retry state failure mode: the worker crashes on attempt 3, and all retry progress is lost — the next worker starts from attempt 1.

**How Temporal persists retry state:**

```
Attempt 1: worker-1 picks up task → fails → Temporal logs "attempt 1 failed"
Attempt 2: worker-1 retries → fails → Temporal logs "attempt 2 failed"
Attempt 3: worker-1 starts → worker-1 crashes (OOM, deployment restart)
           Temporal detects worker-1 heartbeat stopped
           → task re-queued to worker-2
           → worker-2 starts from ATTEMPT 4 (Temporal knows attempts 1-3 failed)
           NOT from attempt 1 (in-process retry state was lost with worker-1)
```

**RetryPolicy configuration for LLM API calls:**

```python
# Python Temporal SDK (temporal-sdk-python >=1.0.0)
from temporalio.common import RetryPolicy
from datetime import timedelta

llm_api_retry_policy = RetryPolicy(
    initial_interval=timedelta(seconds=2),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(seconds=60),
    maximum_attempts=5,
    non_retryable_error_types=[
        "BadRequestError",
        "AuthenticationError",
        "InvalidInputError",
        "PermissionDeniedError",
    ],
)

@activity.defn
async def call_llm_tool(params: ToolCallParams) -> ToolCallResult:
    response = await anthropic_client.messages.create(
        model=params.model,
        messages=params.messages,
        max_tokens=params.max_tokens,
    )
    return ToolCallResult(text=response.content[0].text)

@workflow.defn
class AgentTask:
    @workflow.run
    async def run(self, task: TaskInput) -> TaskOutput:
        result = await workflow.execute_activity(
            call_llm_tool,
            params,
            start_to_close_timeout=timedelta(minutes=2),
            retry_policy=llm_api_retry_policy,
        )
        return TaskOutput(result=result)
```

**Retry intervals with `initial_interval=2s, coefficient=2.0, cap=60s`:**

| **Attempt** | **Sleep before** |
|---|---|
| **2 (first retry)** | 2 s |
| **3** | 4 s |
| **4** | 8 s |
| **5** | 16 s |

## Observability: OpenTelemetry Error Spans and Error Budgets

### OTel Error Spans: span.status = ERROR and Recorded Exceptions

**OpenTelemetry (CNCF):** `span.set_status(StatusCode.ERROR)` combined with `span.record_exception(exception)` creates a unified error trace across the full agent chain.

```python
from opentelemetry import trace
from opentelemetry.trace import StatusCode

tracer = trace.get_tracer("agent.error_handling")

def web_search_with_tracing(query: str, attempt: int = 0) -> str:
    with tracer.start_as_current_span("tool.web_search") as span:
        span.set_attribute("gen_ai.operation.name", "tool_call")
        span.set_attribute("tool.name", "web_search")
        span.set_attribute("error.attempt", attempt)

        try:
            result = tavily_search(query)
            span.set_status(StatusCode.OK)
            return result

        except WebSearchError as e:
            span.set_status(StatusCode.ERROR, f"WebSearchError: {type(e).__name__}")
            span.record_exception(e, attributes={
                "error.retryable": True,
                "error.attempt": attempt,
                "tool.name": "web_search",
                "error.type": type(e).__name__,
                "http.response.status_code": getattr(e, "status_code", 0),
            })
            raise
```

**ERROR status propagation rule:** if a child span has ERROR status and the parent does NOT implement a fallback for that error, the parent span should also be set to ERROR. If the parent catches the error and successfully falls back, the parent span is OK. This allows observability platforms to distinguish "tool failed, but agent recovered" from "tool failed, task failed."

**Trace-DLQ correlation:**

```python
def enqueue_to_dlq(task: dict, error: Exception, agent_id: str) -> str:
    current_span = trace.get_current_span()
    trace_id = format(current_span.get_span_context().trace_id, "032x")

    dlq_entry = {
        "task_id": task["task_id"],
        "trace_id": trace_id,
        "error_type": type(error).__name__,
    }
    return dlq.enqueue(dlq_entry)
```

A DLQ entry with a `trace_id` can be looked up in Jaeger, Tempo, or Honeycomb to see the full distributed trace for root cause investigation.

For the full OTel instrumentation setup — tracer provider configuration, exporter selection, and GenAI semantic conventions — see [AI agent observability and distributed tracing instrumentation](/learn/ai-agent-observability).

## OpenLegion's Take: Error Handling Is a Platform Concern, Not Agent Logic

The error handling failure mode that causes the most production incidents in multi-agent systems is not the individual agent failure — it is the cascading failure through the agent chain when errors are not contained at hand-off boundaries. When executor fails, researcher fails waiting for it, orchestrator fails waiting for researcher — and if each layer re-raises the original exception rather than returning a structured error, the exception message accumulates context from each layer and arrives at the user-facing API response containing everything OWASP LLM05:2025 says should never be there: system prompt fragments, tool call arguments, intermediate task data.

Three concrete facts about error handling in production:

**The AWS backoff formula prevents the second incident that retries cause.** `sleep = min(60, base * 2^attempt) + random(0, 1)` is not arbitrary — the `random(0, 1)` jitter term is the difference between 100 agents retrying simultaneously (second spike, second 429 storm) and 100 agents spreading retries across 1-second windows (load stays flat during recovery). Full jitter (`sleep = random(0, min(cap, base * 2^attempt))`) removes even the fixed base interval — maximum spread for maximum fleet sizes. This is the pattern AWS documented after observing real retry storm incidents in their own infrastructure in 2019; it applies directly to multi-agent LLM systems where dozens of agents share the same provider rate limit.

**HTTP 529 and HTTP 429 from Anthropic are not the same error and must not be handled by the same code path.** HTTP 529 means Anthropic's infrastructure is at capacity — the caller's quota is not exceeded; a short backoff (starting 2–5 seconds) is appropriate because the issue typically resolves within 30–120 seconds. HTTP 429 means the caller's rate limit is exceeded — the `Retry-After` header gives the exact wait time; exponential backoff from that header would make the wait arbitrarily long when a 60-second wait is all that is needed. Treating both as generic "retry with backoff" either under-waits on 429 (retries before quota resets) or over-waits on 529 (waits 2^5 = 32 seconds when the provider recovered in 10 seconds). Most HTTP libraries do not handle 529 at all — it is a non-standard code that silently falls through to generic error handling.

**Temporal's durable retry state is the correct architecture for agent tasks that cannot afford to restart from the beginning.** A research task that completes steps 1–3 of 5 steps before its worker crashes should resume at step 4, not restart from step 1. In-process retry state (stored in variables on the call stack) is lost when the worker process dies. Temporal persists retry state to its database: `RetryPolicy{InitialInterval: 2s, BackoffCoefficient: 2.0, MaximumInterval: 60s, MaximumAttempts: 5, NonRetryableErrorTypes: ['BadRequestError', 'AuthenticationError']}` — the retry budget is accounted across worker lifetimes, not per-process. For long-running agent tasks with multi-step tool call sequences, this is the difference between a correctly handled transient failure and a silent data loss.

| **Error handling property** | **OpenLegion** | **LangChain** | **CrewAI** | **Temporal.io + agents** | **AutoGen** |
|---|---|---|---|---|---|
| **Per-agent retry budgets enforced at platform layer — one agent cannot exhaust provider rate limits for other agents by consuming entire retry quota** | Yes — platform-enforced budget | No — agent-level | No — agent-level | Partial — per-workflow | No |
| **Shared circuit breaker state across all worker instances — one probe closes circuit for all workers; per-process state not used** | Yes — Redis-backed | No — per-process | No — per-process | Workflow-level only | No |
| **Structured error boundaries at agent hand-off layer — exception context stripped before delivery to upstream agents; correlation_id for internal lookup** | Yes — enforced at transport | No — raw exceptions | No — raw exceptions | Partial — workflow errors | No |
| **Dead-letter queue for tasks exceeding retry budget — persisted with trace_id, operator alert, manual re-queue without data loss** | Yes — built-in DLQ | No | No | Yes — Temporal history | No |
| **Fault-isolated containers — one agent's crash loop or stuck retry cannot affect other agents' processes** | Yes — per-container | No — shared process | No — shared process | No — shared worker | No |
| **Durable retry state persisted across worker crashes — retry count not reset on worker restart** | Yes — platform-persisted | No — in-process | No — in-process | Yes — Temporal's core feature | No |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent error handling?

AI agent error handling is the set of runtime patterns — retry logic with exponential backoff and jitter, circuit breakers that halt retry storms against degraded providers, fallback strategies that substitute alternative actions when primary tools fail, and error boundaries that catch and sanitize exceptions before they propagate across agent-to-agent hand-offs — that determine whether a transient failure causes a temporary pause and recovery or a cascading failure that surfaces sensitive internal context to callers. It differs from reliability engineering (which designs SLOs and uptime targets), from debugging (which investigates failures after they occur), and from testing (which validates behavior before production): error handling is the code path that executes when a failure occurs mid-task. OWASP LLM05:2025 Improper Output Handling identifies unhandled agent exceptions as a security risk — exceptions that include system prompt content, tool call arguments, or user data in their message propagate that context to callers if not caught and sanitized at the agent boundary.

### How does exponential backoff with jitter prevent thundering herd in agent systems?

The AWS Builders' Library formula for exponential backoff with jitter is: sleep = min(cap, base x 2^attempt) + random(0, 1), with base=1 second and cap=60 seconds for LLM API calls — this produces sleep intervals of approximately 1.5s, 2.7s, 4.3s, 32.6s, and 60.5s for attempts 0 through 6. Without jitter, all agents that receive a 429 rate limit response at the same time sleep for exactly 2^n seconds and then retry simultaneously, causing a second spike that re-triggers the rate limit; with jitter, the random term spreads retries across a 1-second window after each backoff interval. For high-concurrency deployments with many agents retrying the same provider, use full jitter instead: sleep = random(0, min(cap, base x 2^attempt)) — this eliminates the fixed component entirely and maximizes spread of retry timing across agents.

### How does the circuit breaker pattern work for LLM API calls?

The circuit breaker pattern (Martin Fowler, 2014) has three states: Closed (normal operation — requests pass through; failure counter increments on each error; if failure count exceeds threshold such as 5 failures in 60 seconds, transition to Open), Open (all requests fail immediately without attempting the operation; a 30-second timer starts; when it expires, transition to Half-Open), and Half-Open (one probe request allowed through; if it succeeds, transition back to Closed and reset failure counter; if it fails, transition back to Open). For LLM agents, implement separate circuit breakers per provider so that an Anthropic outage does not trip the OpenAI circuit breaker; store circuit breaker state in Redis rather than in-process so that the state is shared across all agent worker instances and one worker's successful probe closes the circuit for all workers simultaneously. Exclude non-transient errors (400 Bad Request, 401 Unauthorized) from the failure counter — these are not provider health signals and should not contribute to tripping the circuit.

### What is the difference between Anthropic HTTP 529 and HTTP 429 for retry logic?

Anthropic's HTTP 529 "Overloaded" is a non-standard status code indicating that Anthropic's infrastructure is at capacity — it is not a rate limit (the caller's quota is not exceeded); the correct retry strategy is exponential backoff starting at 2–5 seconds, as the issue typically resolves within 30–120 seconds. HTTP 429 "Too Many Requests" is a rate limit — the caller has exceeded their quota; the response includes a Retry-After header specifying the exact number of seconds to wait; the correct strategy is to retry exactly once after the Retry-After interval rather than using exponential backoff, since the header gives the precise wait time. The code paths must be separate: if response.status_code == 529: time.sleep(backoff(attempt, base=2)), elif response.status_code == 429: time.sleep(int(response.headers.get("Retry-After", 60))); most HTTP client libraries do not handle 529 by default and will treat it as an unknown error if not explicitly checked.

### How should I handle errors propagating across multi-agent chains?

Implement an error boundary at every agent-to-agent hand-off point: each agent wraps its outbound communication in a try/except block that catches all exceptions, logs the full exception details internally (exception type, message, traceback, task_id, agent_id), and returns a structured error object that includes only an error_code, a human-readable message safe for external exposure, and a correlation_id the upstream agent can use to reference the internal log. The structured error response should never include exception tracebacks, tool call arguments, system prompt content, or internal endpoint URLs — OWASP LLM05:2025 documents the security risk of exception content propagating to callers. The structured error enables the upstream agent to make a programmatic decision: is the error retryable, should it invoke a fallback, or should it escalate to a human operator — a raw exception removes this choice by terminating the task immediately.

### What is a dead-letter queue and how does it work for agent task failures?

A dead-letter queue (DLQ) is a storage destination for agent tasks that have failed after all retry attempts, preventing them from silently disappearing while keeping them available for inspection and manual re-queue. When a task exceeds its retry budget, the task payload (original input, task_id, agent_id, error_type, sanitized error_message, attempt count, last attempt timestamp, and OTel trace_id for log correlation) is written to the DLQ and an operator alert is triggered with the task_id and error summary. The operator investigates the DLQ entry to identify the root cause — provider outage, malformed input, permission error — and either fixes the root cause and re-enqueues the task, or marks it permanently failed with a documented reason. DLQ entries should be retained for at least 14 days to allow investigation of intermittent failures; if the DLQ grows beyond a configured threshold such as 50 tasks, a high-priority alert signals systemic failure rather than individual task debugging.

### How does Temporal.io's RetryPolicy work for agent tasks?

Temporal.io's RetryPolicy defines retry behavior for activities (individual tool calls) and workflows (agent tasks) with fields: InitialInterval (first retry backoff duration — use 2 seconds for LLM API calls), BackoffCoefficient (exponential multiplier — default 2.0), MaximumInterval (cap on retry interval — use 60 seconds), MaximumAttempts (total attempts — use 3–5 for LLM API calls), and NonRetryableErrorTypes (list of error class names not to retry — include BadRequestError, AuthenticationError, and InvalidInputError). The key advantage over in-process retry logic is that Temporal persists the retry state in its database: if the worker process crashes on attempt 3, Temporal retries from attempt 4 rather than restarting from attempt 1 as in-memory retry state would require. NonRetryableErrorTypes is critical for preventing wasted retry attempts on permanent errors — without it, Temporal will retry a 400 Bad Request the full MaximumAttempts times even though the same malformed request produces the same error every time.

### How do I trace agent errors with OpenTelemetry?

Use span.set_status(StatusCode.ERROR, description) combined with span.record_exception(exception) to mark a span as failed and attach exception details; include OTel GenAI semantic convention attributes: gen_ai.operation.name, gen_ai.system (openai or anthropic), error.type (exception class name), http.response.status_code for HTTP tool calls, and error.retryable and error.attempt as custom attributes. An ERROR status on a child span should propagate to the parent span unless the parent explicitly handled the error with a successful fallback — an unhandled error in a tool call span represents an unhandled error in the agent task span, and observability platforms use this propagation to surface which tasks are truly failing versus which are recovering via fallback. Include the trace_id and span_id in dead-letter queue entries so DLQ items can be correlated with the full distributed trace in Jaeger, Tempo, or Honeycomb for root cause investigation.

## Contain Every Failure at the Boundary Where You Can Still Make a Decision

Error handling in multi-agent systems is not defensive programming — it is the architectural pattern that determines whether failures stay local or cascade. Exponential backoff with jitter prevents retry spikes from amplifying incidents. Circuit breakers prevent retry storms from hammering degraded providers. Fallback chains keep tasks progressing when individual tools fail. Error boundaries keep exception context out of cross-agent messages. The combination is the difference between a 30-second recovery and a cascading failure that surfaces internal system context in user-facing responses.

[Start building on OpenLegion](https://app.openlegion.ai) — per-agent retry budgets, Redis-backed circuit breakers shared across workers, dead-letter queues with trace correlation, error boundary enforcement at hand-off layer, and fault-isolated containers that prevent crash loops from cascading.
