---
title: "AI Agent Error Handling: Retries, Circuit Breakers, and Fallback Chains"
description: "AI agent error handling: exponential backoff with jitter, circuit breaker pattern (Fowler 2014), Anthropic 529 vs 429, Temporal RetryPolicy, gRPC status codes, OWASP LLM05:2025, and OTel error spans."
slug: /learn/ai-agent-error-handling
primary_keyword: ai agent error handling
last_updated: "2026-07-22"
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

AI agent error handling is the runtime code executed when a tool invocation, LLM call, or inter-agent hand-off throws an exception — exponential backoff loops, pybreaker circuit state machines, fallback chains, and exception sanitization boundaries that prevent OWASP LLM05:2025 Improper Output Handling violations. Without explicit handling, a single 529 Overloaded response from Anthropic can cascade through an agent chain and surface system prompt fragments in user-facing HTTP responses.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent error handling** is the set of runtime code paths — retry loops with exponential backoff and jitter, circuit breakers that halt retry storms against degraded providers, fallback chains that substitute alternative actions when primary tool calls throw exceptions, and error boundary functions that catch and sanitize exceptions before they propagate across agent-to-agent hand-offs — implemented at the function call level to convert transient failures into brief pauses rather than cascading exceptions that expose internal context to callers.

For the system-level SLO design and uptime targets that govern acceptable exception rates at the architecture level — the pre-deployment counterpart to these runtime patterns — see [AI agent reliability and SLO design for production agent systems](/learn/ai-agent-reliability).

## Classifying Exceptions: What to Retry, What to Escalate

### The Retryable vs Non-Retryable Decision Tree

The most expensive runtime mistake in agent error handling: treating every caught exception as retryable. A `BadRequestError` (HTTP 400) retried five times produces five identical 400 responses and burns five LLM API calls against the rate limit quota. Worse — a tight retry loop on a non-retryable exception amplifies load on a degraded provider that cannot absorb additional traffic.

**Exception classification for LLM API calls:**

| **HTTP status / exception** | **Retryable?** | **Handling** |
|---|---|---|
| **429 Too Many Requests** | Yes | Read `Retry-After` header; sleep exactly that duration; retry once |
| **529 Overloaded (Anthropic)** | Yes | Exponential backoff base=2s; resolves in 30–120s |
| **500 Internal Server Error** | Yes (max 2) | Backoff; cap at 2 retries; escalate if persists |
| **503 Service Unavailable** | Yes | Backoff; provider temporarily offline |
| **400 Bad Request** | **No** | Malformed request payload; fix the payload, not the retry count |
| **401 Unauthorized** | **No** | Credential invalid; credential rotation required |
| **403 Forbidden** | **No** | Permission denied; structural access control issue |
| **422 Unprocessable Entity** | **No** | Input validation failure; fix input before retrying |

**gRPC status codes** for agent tool calls that communicate via gRPC:

```
UNAVAILABLE (14)       → RETRY with backoff
                          Provider offline; common cause: startup, network partition

DEADLINE_EXCEEDED (4)  → RETRY only if idempotent (reads, lookups)
                          CHECK before retrying if side effects (writes, sends, charges)
                          The operation may have completed server-side before the deadline

INTERNAL (13)          → DO NOT RETRY
                          Server hit unexpected condition; operation state unknown
                          Log and surface structured error to caller

RESOURCE_EXHAUSTED (8) → RETRY after quota window resets
                          Equivalent to HTTP 429; rate limited or quota exceeded

INVALID_ARGUMENT (3)   → DO NOT RETRY
                          Malformed request; retrying produces identical error

PERMISSION_DENIED (7)  → DO NOT RETRY
                          Access control rejection; escalate to human operator
```

**Temporal.io `NonRetryableErrorTypes`:** when running agent activities inside Temporal, list non-retryable exception class names at configuration time — without this, Temporal retries a `BadRequestError` the full `MaximumAttempts` count, burning retry budget on a call that cannot succeed:

```python
from temporalio.common import RetryPolicy
from datetime import timedelta

llm_api_retry_policy = RetryPolicy(
    initial_interval=timedelta(seconds=2),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(seconds=60),
    maximum_attempts=5,
    non_retryable_error_types=[
        "BadRequestError",       # HTTP 400 -- malformed payload
        "AuthenticationError",   # HTTP 401 -- credential invalid
        "InvalidInputError",     # HTTP 422 -- input validation failure
        "PermissionDeniedError", # HTTP 403 -- access control rejection
    ],
)
```

The `non_retryable_error_types` list is inspected by Temporal's activity execution layer before each retry attempt: a matching exception class causes immediate activity failure rather than consuming the next retry slot.

## Exponential Backoff: The AWS Jitter Formula

### Why Fixed-Interval Backoff Creates Thundering Herd

**AWS Builders' Library (2019), "Timeouts, retries and backoff with jitter":** the canonical formula for safe retry timing in distributed systems:

```
sleep = min(cap, base * 2^attempt) + random(0, 1)
```

Recommended parameters for LLM API calls: `base = 1 second`, `cap = 60 seconds`. Computed sleep intervals:

| **Attempt** | **Base interval** | **With jitter (~)** |
|---|---|---|
| **0** | 1 s | 1.5 s |
| **1** | 2 s | 2.7 s |
| **2** | 4 s | 4.3 s |
| **3** | 8 s | 8.4 s |
| **4** | 16 s | 16.6 s |
| **5** | 32 s | 32.6 s |
| **6** | 60 s (cap) | 60.5 s |

**The thundering herd failure mode:** without jitter, every agent that catches a 429 at the same timestamp computes the same `2^n` sleep interval. They all wake up simultaneously and fire a second burst — re-triggering the 429. The `+ random(0, 1)` term spreads retries across a 1-second window; with 20 agents, that is 20 distinct retry moments rather than one synchronized spike.

**Full jitter variant** for high-concurrency fleets where many agents retry the same provider endpoint simultaneously:

```
sleep = random(0, min(cap, base * 2^attempt))
```

Full jitter removes the fixed component entirely. With 100 agents retrying at the same time, retries spread across the full `min(cap, base * 2^n)` window rather than a 1-second window. Maximum spread; minimum collision.

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
            # HTTP 429 -- rate limited; use Retry-After header if present
            if attempt < max_retries - 1:
                time.sleep(backoff_sleep(attempt))
            else:
                raise

        except APIStatusError as e:
            if e.status_code == 529:
                # Anthropic overloaded -- separate code path (see below)
                if attempt < max_retries - 1:
                    time.sleep(backoff_sleep(attempt, base=2.0))
                else:
                    raise
            elif e.status_code in (500, 503):
                # Provider internal exception -- cap at 2 retries
                if attempt < min(2, max_retries - 1):
                    time.sleep(backoff_sleep(attempt))
                else:
                    raise
            else:
                raise  # Non-retryable: 400, 401, 403, 422
```

### Anthropic 529 vs 429: Two Distinct Exception Handlers

Anthropic's HTTP error codes require two completely separate exception-handling code paths. Treating 529 and 429 identically is the most common Anthropic-specific retry bug.

**HTTP 529 "Overloaded":**
- Non-standard code (not in the HTTP/1.1 or HTTP/2 specification)
- Indicates Anthropic's inference cluster is at capacity — a **provider-side capacity constraint**, not a caller quota violation
- The caller's rate limit quota is NOT consumed by the failed call
- Recovery: exponential backoff starting at 2–5 seconds; typically resolves within 30–120 seconds
- `anthropic-sdk-python` >=0.25.0 handles this automatically with configurable `max_retries`; earlier versions silently treat 529 as an unhandled status code

**HTTP 429 "Too Many Requests":**
- Standard HTTP status code
- Indicates the caller's per-minute or per-day quota is exhausted
- Response includes `Retry-After` header with the exact seconds to wait before the quota window resets
- Correct recovery: sleep exactly `Retry-After` seconds then retry exactly once — exponential backoff here would over-wait when the header already gives the precise interval

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
            # Overloaded -- capacity issue, NOT a quota violation
            if attempt < max_retries - 1:
                sleep_time = min(60, 2 * (2 ** attempt)) + random.random()
                time.sleep(sleep_time)
            else:
                raise AnthropicOverloadedError("Max retries exceeded for 529 Overloaded")

        elif response.status_code == 429:
            # Quota exhausted -- use Retry-After, NOT exponential backoff
            retry_after = int(response.headers.get("Retry-After", 60))
            if attempt < max_retries - 1:
                time.sleep(retry_after)
            else:
                raise RateLimitExceededError(f"Rate limited after {max_retries} retries")

        elif response.status_code in (500, 503):
            if attempt < min(2, max_retries - 1):
                time.sleep(backoff_sleep(attempt))
            else:
                raise ProviderError(f"HTTP {response.status_code} after {attempt + 1} retries")

        else:
            # Non-retryable -- raise immediately, do not consume retry slots
            raise NonRetryableError(f"HTTP {response.status_code}: {response.text[:200]}")

    raise MaxRetriesExceeded("All retry attempts exhausted")
```

`anthropic-sdk-python` >=0.20.0 handles 429 automatically via `Retry-After`; >=0.25.0 handles 529 with configurable `max_retries`. At those versions the retry logic above is handled by the SDK — but understanding the distinct semantics is required to debug unexpected retry behavior and tune `max_retries` correctly.

For injecting faults to validate that these exception paths execute correctly under load — see [AI agent testing and chaos engineering for error path validation](/learn/ai-agent-testing).

## Circuit Breakers: Stopping Retry Storms at the Call Site

### Three-State State Machine Implementation

**Martin Fowler, 2014 (martinfowler.com/bliki/CircuitBreaker.html):** the circuit breaker pattern wraps calls to a degraded dependency. Without it, 20 agent workers independently retrying a provider that cannot serve traffic send 100+ requests during the outage window — which prevents recovery. Three states:

```
CLOSED --[5 failures in 60s]--> OPEN --[30s timer]--> HALF-OPEN
  ^                                                         |
  +--[probe success]------------------------------------------+
                                  |[probe failure]
                                  v
                                OPEN (reset timer)
```

**State behavior:**

- **Closed**: calls execute normally. Each exception increments a failure counter. When the counter reaches the threshold (5 failures in 60 seconds), transition to Open and record the Open timestamp.
- **Open**: every call throws `CircuitBreakerError` immediately without invoking the provider. After 30 seconds, transition to Half-Open.
- **Half-Open**: one probe call is allowed through. Success: transition to Closed, reset the failure counter. Failure: return to Open, restart the 30-second timer.

**Python implementation with `pybreaker`:**

```python
import pybreaker
import redis

# Shared Redis state: CRITICAL for multi-worker deployments
redis_client = redis.Redis(host="localhost", port=6379)

class RedisCircuitBreakerStorage(pybreaker.CircuitBreakerStorage):
    """Store circuit breaker state in Redis so all workers share the same instance."""
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

# One breaker per provider -- Anthropic outage must not trip the OpenAI breaker
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

**Three critical configuration decisions:**

**1. Per-provider breakers:** sharing one breaker across providers means an Anthropic outage trips the breaker that controls OpenAI calls — the model fallback chain then has no working provider to fall back to.

**2. Redis-backed shared state:** in-process breakers let each of 20 workers independently probe the failed provider. Worker 1's successful Half-Open probe closes only Worker 1's breaker — the remaining 19 workers each send a probe of their own. With Redis: the first successful probe closes the breaker for all 20 workers simultaneously.

**3. Exclude non-transient exceptions from the failure counter:** a `BadRequestError` indicates a malformed request, not a degraded provider. Including it in the failure counter causes the breaker to Open due to bad requests rather than provider outage — incorrect semantics that breaks the circuit on caller errors, not provider health signals.

### Bulkhead Pattern: Per-Agent Thread Pool Isolation

The bulkhead pattern prevents a flood of exceptions in one agent type from exhausting the thread pool available to other agent types:

```python
from concurrent.futures import ThreadPoolExecutor
import asyncio

# Separate pools -- research agents cannot exhaust the executor agent pool
research_pool = ThreadPoolExecutor(max_workers=8, thread_name_prefix="research")
executor_pool = ThreadPoolExecutor(max_workers=4, thread_name_prefix="executor")
orchestrator_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="orchestrator")

async def call_research_agent(task: dict) -> dict:
    """Research agents: 120s timeout for expensive web retrieval."""
    try:
        return await asyncio.wait_for(run_research(task), timeout=120.0)
    except asyncio.TimeoutError:
        return {"status": "timeout", "agent": "research", "task_id": task["id"]}

async def call_executor_agent(task: dict) -> dict:
    """Executor agents: 30s timeout for fast execution calls."""
    try:
        return await asyncio.wait_for(run_executor(task), timeout=30.0)
    except asyncio.TimeoutError:
        return {"status": "timeout", "agent": "executor", "task_id": task["id"]}
```

A flood of research agent retries exhausts `research_pool` (max 8 threads) but `executor_pool` (max 4 threads) remains fully available. Per-tool circuit breakers further prevent a failing `web_search` invocation from tripping the breaker that controls `read_file` or `run_code` calls.

For the multi-agent chain topology that bulkheads isolate — see [agentic workflows and multi-agent chain design](/learn/agentic-workflows).

## Fallback Chains: Ordered Alternative Handlers

### Tool Fallback Chains and Model Fallback

When all retries for a tool invocation are exhausted — or the circuit breaker throws `CircuitBreakerError` — the agent needs a programmatic decision: invoke a fallback tool, return a partial result struct, or escalate to the orchestrator. A fallback chain executes this decision:

```python
from dataclasses import dataclass

@dataclass
class FallbackChain:
    """Ordered list of alternative handlers to invoke when the primary throws."""
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
            except (pybreaker.CircuitBreakerError, MaxRetriesExceeded, ProviderError) as e:
                logger.warning("fallback_step_failed", step=step["name"],
                               exception_type=type(e).__name__, query_prefix=query[:50])
                continue

        # All steps exhausted -- return partial result struct, not exception
        return {
            "result": None,
            "provider": None,
            "is_complete": False,
            "missing_tools": ["web_search"],
            "reason": "All web search providers unavailable -- tried 3 handlers"
        }

# Web search fallback: primary (paid API) -> alternative (paid API) -> free tier
web_search_chain = FallbackChain(steps=[
    {"name": "tavily", "fn": tavily_search, "is_fallback": False},
    {"name": "serper", "fn": serper_search, "is_fallback": True},
    {"name": "ddgs",   "fn": ddgs_search,   "is_fallback": True},
])
```

**Model fallback when the primary provider circuit is Open:**

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
        except (pybreaker.CircuitBreakerError, MaxRetriesExceeded):
            continue

    raise AllProvidersUnavailable("All LLM providers in fallback chain unavailable")
```

**Graceful degradation:** returning `{"is_complete": False, "reason": "..."}` instead of raising lets the orchestrator decide: wait for provider recovery, skip this step, or escalate to a human. A raised exception removes that choice — the orchestrator's exception handler must catch and decide anyway, but with less context.

### Exception Storage for Failed Task Recovery

When a task throws after exhausting all fallback handlers, store the exception context in a structured recovery store for operator inspection and manual re-queue:

```python
import json
from datetime import datetime

class AgentExceptionStore:
    """Storage for tasks that exhausted their exception handling budget."""

    def __init__(self, redis_client, retention_days: int = 14):
        self.redis = redis_client
        self.retention_seconds = retention_days * 86400
        self.STORE_KEY = "agent:exception_store"
        self.SIZE_ALERT_THRESHOLD = 50

    def record(self, task: dict, exc: Exception,
               attempt_count: int, agent_id: str) -> str:
        entry_id = f"exc:{task['task_id']}:{int(datetime.utcnow().timestamp())}"

        entry = {
            "entry_id": entry_id,
            "task_id": task["task_id"],
            "agent_id": agent_id,
            "original_input": task["input"],
            "exception_type": type(exc).__name__,
            "exception_message": str(exc)[:500],  # truncate -- never log full context
            "attempt_count": attempt_count,
            "last_attempt": datetime.utcnow().isoformat(),
            "trace_id": get_current_trace_id(),
        }

        self.redis.lpush(self.STORE_KEY, json.dumps(entry))
        self.redis.expire(entry_id, self.retention_seconds)

        store_size = self.redis.llen(self.STORE_KEY)
        if store_size > self.SIZE_ALERT_THRESHOLD:
            send_high_priority_alert(
                f"Exception store has {store_size} unresolved entries -- "
                f"possible provider outage or deployment bug",
                trace_id=entry["trace_id"]
            )

        return entry_id
```

Retention: 14 days minimum to allow investigation of failures that only manifest under specific load conditions. The `SIZE_ALERT_THRESHOLD` of 50 entries signals a systemic provider or deployment issue rather than individual task failures.

For the task queue architecture (Celery 5.3, Redis broker, ack configuration) that this recovery store integrates with — see [AI agent long running tasks and Celery task queue patterns](/learn/ai-agent-long-running-tasks).

## Exception Boundaries in Multi-Agent Chains

### Sanitizing Exceptions at Hand-Off Points

In a multi-agent chain (orchestrator -> researcher -> executor), an unhandled exception thrown in the executor propagates through the researcher to the orchestrator. If the orchestrator's handler re-raises without sanitizing, the full exception context — researcher's tool call arguments, executor's intermediate data, internal endpoint URLs — surfaces in the orchestrator's output and reaches the user-facing HTTP response.

**Exception boundary pattern:**

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class AgentError:
    """Structured exception response for inter-agent communication.
    Contains ONLY context safe for external exposure."""
    error_code: str
    message: str
    correlation_id: str
    is_retryable: bool
    retry_after_seconds: int
    agent_id: str
    task_id: str

def execute_with_exception_boundary(agent_fn, task: dict, agent_id: str) -> Any:
    """
    Exception boundary: wrap every outbound agent invocation.
    Catches ALL exceptions, logs full context internally,
    returns sanitized AgentError struct to the upstream caller.
    """
    try:
        return agent_fn(task)

    except ProviderRateLimitError as e:
        logger.error("agent_rate_limit", agent_id=agent_id,
                     task_id=task["task_id"], exc_info=True)
        return AgentError(
            error_code="PROVIDER_RATE_LIMIT",
            message="LLM provider rate limited -- retry this task in 60 seconds",
            correlation_id=get_current_trace_id(),
            is_retryable=True,
            retry_after_seconds=60,
            agent_id=agent_id,
            task_id=task["task_id"]
        )

    except Exception as e:
        # Catch-all: unknown exception -- maximum sanitization
        logger.error("agent_unexpected_exception", agent_id=agent_id,
                     task_id=task["task_id"], exc_info=True)
        return AgentError(
            error_code="UNEXPECTED_ERROR",
            message="An unexpected exception occurred -- see correlation ID in logs",
            correlation_id=get_current_trace_id(),
            is_retryable=False,
            retry_after_seconds=0,
            agent_id=agent_id,
            task_id=task["task_id"]
        )
```

### OWASP LLM05:2025 -- Exception Leakage Through Agent Outputs

**OWASP LLM Top 10 v2 2025, LLM05: Improper Output Handling** covers the security risk of unhandled exceptions propagating sensitive agent context to callers.

**Vulnerable pattern:**

```python
# INSECURE: full exception context returned to HTTP caller
@app.post("/agent/run")
async def run_agent(request: AgentRequest):
    try:
        result = agent.run(request.task)
        return {"result": result}
    except Exception as e:
        # str(e) may contain: system prompt content, tool call arguments,
        # internal endpoint URLs, environment variable names
        raise HTTPException(status_code=500, detail=str(e))  # <- LEAKS INTERNAL CONTEXT

# SECURE: sanitized external response; full context in internal telemetry
@app.post("/agent/run")
async def run_agent_safe(request: AgentRequest):
    correlation_id = generate_correlation_id()
    try:
        result = agent.run(request.task)
        return {"result": result, "correlation_id": correlation_id}

    except Exception as e:
        logger.error("agent_task_exception",
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

**External exception response must NEVER contain:** full exception tracebacks, tool call argument values (may contain user PII), system prompt content, internal endpoint URLs, credential handle names.

**External exception response MUST contain:** `error_code` (programmatic string the caller can switch on), `message` (safe for end-user display), `correlation_id` (for operator log lookup by task).

For inspecting the error spans and distributed traces produced by these boundaries after a production exception — see [AI agent debugging and post-mortem trace analysis](/learn/ai-agent-debugging).

## Durable Execution: Temporal RetryPolicy and Crash-Safe Retry State

### Why In-Process Retry State Loses Progress on Worker Crashes

**Temporal.io** (open-source durable execution platform, launched 2022) stores retry state in its database rather than in worker process memory. The classic in-process failure mode:

```
Attempt 1: worker-1 picks up task -> throws -> Temporal logs "attempt 1 failed"
Attempt 2: worker-1 retries -> throws -> Temporal logs "attempt 2 failed"
Attempt 3: worker-1 starts -> worker-1 crashes (OOM, deployment restart)
           Temporal detects heartbeat timeout
           -> task re-dispatched to worker-2
           -> worker-2 starts from ATTEMPT 4 (Temporal's database has attempts 1-3)
           NOT from attempt 1 (in-process retry counter was on worker-1's stack)
```

**RetryPolicy configuration for LLM API activities:**

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

| **Attempt** | **Sleep before retry** |
|---|---|
| **2 (first retry)** | 2 s |
| **3** | 4 s |
| **4** | 8 s |
| **5** | 16 s |

## Observability: OTel Exception Spans

### Recording Exceptions with OpenTelemetry

**OpenTelemetry (CNCF):** `span.set_status(StatusCode.ERROR)` combined with `span.record_exception(exception)` creates a unified exception trace that correlates across the full agent invocation chain.

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

**ERROR status propagation:** if a child span catches an exception and the parent does NOT implement a successful fallback for that exception, the parent span also receives ERROR status. If the parent catches it and falls back successfully, the parent span is OK. Observability platforms use this propagation to distinguish "tool threw, but agent recovered" from "tool threw, task failed."

**Trace-exception store correlation:**

```python
def record_to_exception_store(task: dict, exc: Exception, agent_id: str) -> str:
    current_span = trace.get_current_span()
    trace_id = format(current_span.get_span_context().trace_id, "032x")
    entry = {
        "task_id": task["task_id"],
        "trace_id": trace_id,
        "exception_type": type(exc).__name__,
    }
    return exception_store.record_entry(entry)
```

An exception store entry with `trace_id` can be looked up in Jaeger, Tempo, or Honeycomb to see the full distributed trace for root cause investigation.

For full OTel instrumentation setup — tracer provider, exporter configuration, and GenAI semantic conventions — see [AI agent observability and distributed tracing instrumentation](/learn/ai-agent-observability).

## OpenLegion's Take: Exception Handling at the Infrastructure Layer

The exception handling failure mode that triggers the most production incidents in multi-agent systems is not an individual tool call throwing — it is the cascading re-throw through agent layers when no layer catches and sanitizes. When the executor throws, the researcher re-throws, the orchestrator re-throws — and if each layer re-raises the original exception, by the time it reaches the HTTP boundary it contains accumulated context from every layer that OWASP LLM05:2025 explicitly prohibits in external responses: system prompt fragments, tool call argument values, intermediate computation data.

Three concrete implementation facts:

**The AWS jitter formula prevents the second incident that retry loops cause.** `sleep = min(60, base * 2^attempt) + random(0, 1)` is not arbitrary — the `random(0, 1)` term is what prevents 100 agents from synchronizing their retry bursts. Full jitter (`sleep = random(0, min(cap, base * 2^attempt))`) removes even the fixed base interval for maximum spread across large fleets. This was documented by AWS after observing real retry storm incidents in their own infrastructure in 2019 — the pattern maps directly to multi-agent LLM systems where dozens of agent workers share the same provider rate limit.

**HTTP 529 and HTTP 429 from Anthropic are semantically different exceptions requiring different code paths.** HTTP 529 means Anthropic's inference cluster is at capacity — the caller's quota is intact; backoff of 2–5 seconds is appropriate because the condition typically clears in 30–120 seconds. HTTP 429 means the caller's rate limit window is exhausted — the `Retry-After` header gives the exact reset interval; exponential backoff here over-waits when the header already provides the necessary duration. Most HTTP client libraries silently fall through on 529 since it is not in the HTTP specification — it must be explicitly matched before generic exception handling.

**Temporal's database-persisted retry state prevents silent data loss on worker crashes.** A research task that completes sub-tasks 1 through 3 before its worker process is killed should resume from sub-task 4, not from sub-task 1. In-process retry counters on the call stack are lost when the process dies. Temporal writes each attempt result to its database: `RetryPolicy{InitialInterval: 2s, BackoffCoefficient: 2.0, MaximumInterval: 60s, MaximumAttempts: 5, NonRetryableErrorTypes: ['BadRequestError', 'AuthenticationError']}` — the retry budget is tracked in the database across worker lifetimes, not per-process.

| **Exception handling property** | **OpenLegion** | **LangChain** | **CrewAI** | **Temporal.io + agents** | **AutoGen** |
|---|---|---|---|---|---|
| **Per-agent retry budgets enforced at platform layer -- one agent cannot exhaust provider limits for others** | Yes -- platform-enforced | No -- agent-level | No -- agent-level | Partial -- per-workflow | No |
| **Shared circuit breaker state across all workers -- one probe closes breaker for all; per-process state not used** | Yes -- Redis-backed | No -- per-process | No -- per-process | Workflow-level only | No |
| **Sanitized exception boundaries at hand-off layer -- internal context stripped; correlation_id for log lookup** | Yes -- enforced at transport | No -- raw exceptions | No -- raw exceptions | Partial -- workflow errors | No |
| **Exception recovery store with trace_id -- operator alert, manual re-queue, no silent data loss** | Yes -- built-in store | No | No | Yes -- Temporal history | No |
| **Fault-isolated containers -- one agent's crash loop cannot exhaust other agents' processes** | Yes -- per-container | No -- shared process | No -- shared process | No -- shared worker | No |
| **Durable retry counter across worker crashes -- count not reset on worker restart** | Yes -- platform-persisted | No -- in-process | No -- in-process | Yes -- Temporal's core feature | No |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent error handling?

AI agent error handling is the set of runtime code paths that execute when a tool invocation, LLM call, or inter-agent hand-off throws an exception: retry loops with exponential backoff and jitter, circuit breaker state machines that halt retry storms against degraded providers, fallback chains that invoke alternative handlers when primary calls throw, and exception boundary functions that catch and sanitize exceptions before they propagate across agent hand-off points. It is distinct from reliability engineering (which designs SLOs and acceptable exception rates at the architecture level) and from debugging (which analyzes exceptions after they occur in production): error handling is the runtime code path that executes the moment an exception is thrown mid-task. OWASP LLM05:2025 Improper Output Handling identifies unhandled agent exceptions as a data leakage risk — exceptions that carry system prompt content, tool call arguments, or user data expose that context to callers if not caught and sanitized at the agent boundary.

### How does exponential backoff with jitter prevent thundering herd in multi-agent fleets?

The AWS Builders' Library formula for exponential backoff with jitter is: sleep = min(cap, base x 2^attempt) + random(0, 1), with base=1 second and cap=60 seconds for LLM API calls — producing sleep intervals of approximately 1.5s, 2.7s, 4.3s, 32.6s, and 60.5s for attempts 0 through 6. Without the jitter term, every agent that catches a 429 at the same timestamp computes the same `2^n` interval and retries simultaneously — triggering a second burst that re-fires the 429. The `random(0, 1)` term spreads retries across a 1-second window after each backoff period. For fleets with many concurrent agents retrying the same provider endpoint, full jitter is more effective: sleep = random(0, min(cap, base x 2^attempt)) — this removes the fixed base component entirely and spreads retries across the full backoff window rather than a 1-second window.

### How does the circuit breaker state machine work for LLM API calls?

The circuit breaker pattern (Martin Fowler, 2014) wraps provider calls in a three-state state machine: Closed (normal -- calls execute; exception counter increments on each throw; when counter exceeds threshold such as 5 exceptions in 60 seconds, transition to Open), Open (all calls throw CircuitBreakerError immediately without invoking the provider; a 30-second timer starts; when it expires, transition to Half-Open), and Half-Open (one probe call is allowed through; success transitions back to Closed and resets the counter; failure returns to Open and restarts the timer). For LLM agents, use one breaker per provider so that an Anthropic outage does not prevent OpenAI fallback calls; back the breaker with Redis rather than in-process state so that one worker's successful Half-Open probe closes the breaker for all workers simultaneously. Exclude non-transient exceptions (400 Bad Request, 401 Unauthorized) from the failure counter -- these indicate malformed requests, not provider health degradation, and should not contribute to opening the circuit.

### What is the difference between Anthropic HTTP 529 and HTTP 429 for exception handling?

Anthropic HTTP 529 "Overloaded" is a non-standard status code indicating Anthropic's inference cluster is at capacity -- it is not a quota violation (the caller's rate limit is not exhausted); the correct handler is exponential backoff starting at 2–5 seconds, as the condition typically clears in 30–120 seconds. HTTP 429 "Too Many Requests" indicates the caller's per-minute or per-day quota is exhausted; the response includes a Retry-After header with the exact number of seconds until the quota window resets; the correct handler sleeps exactly that duration and retries once -- exponential backoff here over-waits when the header already provides the necessary interval. Both require separate exception-handling branches: if response.status_code == 529: time.sleep(backoff(attempt, base=2)), elif response.status_code == 429: time.sleep(int(response.headers.get("Retry-After", 60))). Most HTTP client libraries do not handle 529 since it is not part of the HTTP specification -- it silently falls through to generic exception handling if not explicitly matched.

### How should exceptions propagate across multi-agent chains?

Implement an exception boundary at every agent-to-agent hand-off point: the calling agent wraps its invocation in a try/except block that catches all exceptions, logs the full exception details internally (exception type, message, full traceback, task_id, agent_id), and returns a structured AgentError dataclass that exposes only an error_code, a human-readable message safe for external display, and a correlation_id the upstream agent can use to look up the internal log. The structured AgentError response must never include full exception tracebacks, tool call argument values, system prompt content, or internal endpoint URLs -- OWASP LLM05:2025 classifies exception content reaching callers as an Improper Output Handling violation. The structured response enables the upstream agent to make a programmatic decision: the error_code field drives a switch statement that determines whether to retry, invoke a fallback handler, or escalate to a human operator -- a raw re-raised exception removes this decision point by immediately unwinding the call stack.

### What is an exception recovery store and how does it prevent data loss when all handlers fail?

An exception recovery store is a persistent storage destination for agent tasks that exhausted all retry attempts and fallback handlers, preventing silent data loss while making failed tasks available for operator inspection and manual re-queue. When a task exhausts its exception handling budget, the agent writes the task payload (original input, task_id, agent_id, exception_type, sanitized exception_message capped at 500 characters, attempt count, last attempt timestamp, and OTel trace_id for telemetry correlation) to the store and fires an operator alert with the task_id and exception summary. The operator retrieves the store entry, identifies the root cause (provider outage, malformed input, permission exception), and either fixes the root cause and re-queues the task payload or marks it permanently unresolvable with a documented reason. Retention of 14 days minimum covers intermittent exceptions that only appear under specific load patterns; a size alert threshold (typically 50 entries) signals systemic failure rather than isolated task exceptions.

### How does Temporal.io's RetryPolicy prevent retry progress loss on worker crashes?

Temporal.io's RetryPolicy defines activity retry behavior with: InitialInterval (first retry delay -- 2 seconds for LLM API calls), BackoffCoefficient (exponential multiplier -- 2.0 by default), MaximumInterval (retry cap -- 60 seconds), MaximumAttempts (total attempts including the first -- 3–5 for LLM API calls), and NonRetryableErrorTypes (list of exception class names to fail immediately rather than retry -- include BadRequestError, AuthenticationError, InvalidInputError). The key advantage over in-process retry loops is database-persisted retry state: if the worker process is killed on attempt 3, Temporal dispatches the task to another worker starting from attempt 4 rather than attempt 1. In-process retry counters on the call stack are lost when the process dies; Temporal's database retains them across worker lifetimes. NonRetryableErrorTypes prevents the most common wasted-retry bug: without it, Temporal retries a 400 BadRequestError the full MaximumAttempts count even though the same malformed payload throws the same exception every time.

### How do I instrument exception spans with OpenTelemetry for agent debugging?

Use span.set_status(StatusCode.ERROR, description) combined with span.record_exception(exception) to mark a span as failed and attach the exception details as span events; include OTel GenAI semantic convention attributes: gen_ai.operation.name, gen_ai.system (openai or anthropic), error.type (exception class name), http.response.status_code for HTTP tool call exceptions, and error.retryable and error.attempt as custom attributes. Propagate ERROR status from child spans to parent spans when the parent does not implement a successful fallback handler for the thrown exception -- observability platforms use this propagation to surface which invocations genuinely failed versus which recovered via fallback. Include the OTel trace_id and span_id in exception recovery store entries so stored entries can be correlated with the full distributed trace in Jaeger, Tempo, or Honeycomb to identify which specific tool call or LLM invocation triggered the exception.

## Contain Every Exception at the Boundary Where You Can Still Make a Decision

Exception handling in multi-agent systems is not defensive programming -- it is the code that determines whether failures stay local or cascade. Exponential backoff with jitter prevents retry bursts from amplifying provider outages. Circuit breakers prevent retry storms from hammering providers that cannot yet recover. Fallback chains keep task execution progressing when individual tool calls throw. Exception boundaries keep internal context out of cross-agent messages and HTTP responses. Together they produce 30-second recoveries instead of cascading failures that expose system internals to users.

[Start building on OpenLegion](https://app.openlegion.ai) -- per-agent retry budgets enforced at the platform layer, Redis-backed circuit breakers shared across all worker instances, exception recovery stores with OTel trace correlation, exception boundary enforcement at the hand-off transport layer, and fault-isolated containers that prevent one agent's crash loop from exhausting another's thread pool.
