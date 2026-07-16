---
title: "AI Agent Long Running Tasks: Queues, Checkpoints, and Credential Refresh"
description: "AI agent long running tasks in production: Celery 5.3 task queues, LangGraph checkpointing, OAuth credential refresh, progressive summarization every 20-30 steps, and Lambda timeout workarounds."
slug: /learn/ai-agent-long-running-tasks
primary_keyword: ai agent long running tasks
last_updated: "2026-07-16"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-loop
  - /learn/ai-agent-reliability
  - /learn/ai-agent-deployment
  - /learn/credential-management-ai-agents
  - /learn/llm-prompt-caching
  - /learn/ai-agent-debugging
---

# AI Agent Long Running Tasks: Queues, Checkpoints, and Credential Refresh

AI agent long running tasks are autonomous multi-step workflows that run for more than 5 minutes, often 30 minutes to multiple hours or days, exceeding the hard timeout limits of serverless infrastructure. Three production failure modes emerge at this time scale: cloud runtime timeouts (AWS Lambda 15 minutes, Azure Functions Consumption 10 minutes, GCP Cloud Run 60 minutes), context window exhaustion from accumulated step history, and OAuth access token expiry at the 60-minute mark. The solutions are task queues, checkpointing, and per-call credential injection.

<!-- SCHEMA: DefinitionBlock -->

> **An AI agent long running task** is an autonomous multi-step agentic workflow that runs for more than 5 minutes, often 30 minutes to multiple hours or days, requiring infrastructure beyond a single serverless function invocation: a persistent task queue (Celery, SQS, Cloud Tasks) to escape cloud runtime timeouts of 10-60 minutes on serverless plans, a checkpointing mechanism (LangGraph MemorySaver, SqliteSaver, or PostgresSaver) to persist state between steps so a crash or timeout does not restart the task from the beginning, and per-call credential injection to prevent OAuth access token expiry from causing 401 failures mid-task.

For the execution mechanics of a single agent step, tool call, result, reasoning, that long-running tasks repeat hundreds of times, see [the agentic loop and single-step execution mechanics](/learn/agentic-loop).

## Why Standard Execution Environments Fail for Long-Running Agents

### Cloud Runtime Timeout Limits

Standard cloud execution environments impose hard runtime limits that terminate any process still running at the boundary:

| **Platform** | **Limit** | **Shutdown behavior** |
|---|---|---|
| **AWS Lambda** | 15 minutes (900s) | Hard kill, no graceful shutdown signal |
| **Azure Functions Consumption Plan** | 10 minutes (600s) | Hard kill at boundary |
| **Azure Functions Premium Plan** | Unbounded | No platform timeout; 60-minute grace period during scale-in |
| **GCP Cloud Run** | 60 minutes (3,600s) | Hard kill at boundary |

No graceful shutdown signal precedes the kill on plans with hard limits. Any in-flight LLM call, tool execution, or state write in progress at minute 15 (Lambda) or minute 60 (Cloud Run) is abandoned. The agent cannot checkpoint before being killed because it does not receive advance notice.

**The async queue pattern, the only correct solution:**

The cloud function is not the task executor. The cloud function receives the request, enqueues the work, and returns immediately:

```python
from celery import Celery
from flask import Flask, jsonify, request

app = Flask(__name__)
celery = Celery(broker="redis://localhost:6379/0", backend="redis://localhost:6379/1")

@app.route("/agent/run", methods=["POST"])
def enqueue_agent_task():
    payload = request.json
    task = run_long_agent.apply_async(args=[payload])
    return jsonify({"task_id": task.id, "status": "queued"}), 202

@celery.task(bind=True, max_retries=3)
def run_long_agent(self, payload):
    return execute_agent(payload)
```

The Celery worker runs on a persistent process: an EC2 instance, GKE pod, or Cloud Run service with `min-instances=1`. The client polls `AsyncResult(task_id).state` for `PENDING`, `STARTED`, or `SUCCESS`, or receives a webhook on completion.

For the full infrastructure selection guide, when to use serverless vs containers vs managed agent platforms, see [AI agent deployment and infrastructure selection](/learn/ai-agent-deployment).

### Context Window Exhaustion Over Multi-Step Runs

Each step of an agent run appends tokens to the context window: the tool call sent (100-500 tokens), the tool result received (200-2,000 tokens), and the model's reasoning (200-800 tokens). In a computer use or research agent, each step may also append a screenshot description (500-2,000 tokens).

**Anthropic's Computer Use beta (October 2024)** documented context window exhaustion at approximately **100,000 tokens** for tasks with **50+ sequential steps**. The accumulation:

- 50 steps x average 2,000 tokens/step = 100,000 tokens of step history
- Plus system prompt (2,000-5,000 tokens), task description (500-2,000 tokens), tool definitions (1,000-3,000 tokens)
- Total: 103,000-110,000 tokens, 50-55% of Claude 3.5 Sonnet's 200,000-token limit before task completion

The failure is often silent: the provider truncates the oldest context without notifying the developer. The agent loses track of what it has already done and repeats completed steps, or loses the original task goal and pursues a subgoal.

**Cost dimension:** at $3.00/MTok input (Claude 3.5 Sonnet), running a 50-step task with full context at every step costs approximately $22.50 in input tokens alone. With progressive summarization, the same task costs approximately $2.50, an 89% reduction.

### OAuth Credential Expiry at the 60-Minute Mark

OAuth 2.0 (RFC 6749, Section 5.1) specifies that access tokens SHOULD have a limited lifetime via the `expires_in` parameter in the token response. In practice:

- **Google OAuth2:** 1 hour (3,600 seconds)
- **Microsoft Entra ID:** 1 hour (configurable 5 minutes-1 day, default 1 hour)
- **GitHub Apps:** 1 hour

An agent injected with an OAuth access token at task start and running for 61+ minutes receives `401 Unauthorized` on the first tool call after expiry.

**Why the agent-side refresh pattern fails:**

1. The access token is in the agent's context window, visible to prompt injection attacks and logged by observability platforms
2. The refresh token (which has an indefinitely long TTL with some providers) is also in the agent's context window, a far more serious exposure
3. The refresh logic is in the agent's reasoning loop, so the model can hallucinate "I refreshed the token" without executing the HTTP request
4. If the agent is paused for 24+ hours (waiting for an external event to complete), the refresh token itself may expire

The correct fix is architectural: per-call vault injection. Covered in the Credential Management section below.

For the full credential management architecture, vault proxy patterns, secret rotation, and OWASP LLM06 defenses, see [credential management for AI agents and vault proxy architecture](/learn/credential-management-ai-agents).

## Task Queue Architecture: Celery and Persistent Workers

### Celery 5.3 with Redis: The Standard Production Pattern

Celery 5.3.x (2024) with Redis or RabbitMQ is the standard Python task queue for long-running agent work. The architecture has four components:

1. **Broker (Redis or RabbitMQ):** receives task messages and delivers them to workers; Redis is simpler; RabbitMQ provides more durable message storage for mission-critical tasks
2. **Worker:** a long-lived Python process; runs on EC2, GKE, or Cloud Run with `min-instances=1`; no timeout ceiling
3. **Result backend:** stores task results and status; client polls via `AsyncResult(task_id).state`
4. **Celery Beat:** periodic task scheduler for scheduled agent runs

**Agent task definition with key parameters:**

```python
from celery import Celery

celery = Celery(
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1"
)

celery.conf.update(
    task_acks_late=True,          # acknowledge only after completion -- requeue on worker crash
    task_time_limit=7200,         # hard kill after 2 hours
    task_soft_time_limit=6900,    # SIGTERM at 1h55m -- allows graceful checkpoint save
    task_serializer="json",
    result_expires=86400,
)

@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def run_long_agent_task(self, task_id: str, input_data: dict):
    try:
        self.update_state(state="STARTED", meta={"step": 0, "task_id": task_id})
        result = execute_agent(task_id=task_id, input_data=input_data, celery_task=self)
        return {"status": "success", "result": result, "task_id": task_id}
    except SoftTimeLimitExceeded:
        checkpoint_current_state(task_id)
        raise
    except TransientError as e:
        raise self.retry(exc=e, countdown=60)
```

**`task_acks_late=True` is critical:** by default, Celery acknowledges the task message when the worker picks it up (before execution). If the worker crashes mid-execution, the task is lost. With `task_acks_late=True`, acknowledgment defers until the task function returns. A worker crash causes the broker to redeliver the task to another worker.

For the within-step resilience patterns, retry-with-backoff, circuit breakers, timeout enforcement, see [AI agent reliability and circuit breaker patterns](/learn/ai-agent-reliability).

### Task Status, Revocation, and ETA Scheduling

Long-running agent tasks require lifecycle management beyond simple execute-and-wait.

**Progress reporting:**

```python
def execute_agent(task_id: str, input_data: dict, celery_task):
    for step_num, step in enumerate(agent_steps):
        result = execute_step(step)
        celery_task.update_state(
            state="PROGRESS",
            meta={"current_step": step_num + 1, "task_id": task_id}
        )
        save_checkpoint(task_id, step_num, result)
```

**Task revocation:**

```python
from celery.app.control import Control

Control(celery).revoke(task_id, terminate=True, signal="SIGTERM")
```

**ETA scheduling and countdown:**

```python
from datetime import datetime, timedelta

# Schedule at specific time
task = run_long_agent_task.apply_async(
    args=[task_id, input_data],
    eta=datetime(2026, 7, 17, 2, 0, 0)
)

# Relative delay
task = run_long_agent_task.apply_async(
    args=[task_id, input_data],
    countdown=3600  # 1 hour from now
)

# Expiry
task = run_long_agent_task.apply_async(
    args=[task_id, input_data],
    expires=datetime.utcnow() + timedelta(hours=24)
)
```

**Celery Beat for scheduled agent runs:**

```python
from celery.schedules import crontab

celery.conf.beat_schedule = {
    "daily-research-agent": {
        "task": "tasks.run_long_agent_task",
        "schedule": crontab(hour=9, minute=0, day_of_week="mon-fri"),
        "args": [generate_task_id(), {"type": "daily_research"}]
    }
}
```

## Checkpointing: Persisting State for Crash Resume

### LangGraph Checkpointers: MemorySaver, SqliteSaver, PostgresSaver

LangGraph v0.1 (May 2024) persists graph state after every node execution, enabling crash resume without restarting from the beginning. Three checkpointers:

**MemorySaver, development only:**

```python
from langgraph.checkpoint.memory import MemorySaver

app = graph.compile(checkpointer=MemorySaver())
# State is lost when the process exits -- never use in production
```

**SqliteSaver, single-process production:**

```python
from langgraph.checkpoint.sqlite import SqliteSaver

app = graph.compile(checkpointer=SqliteSaver.from_conn_string("/data/checkpoints.db"))
config = {"configurable": {"thread_id": task_id}}

# First run
result = await app.ainvoke(initial_state, config)

# Resume after crash: pass None -- LangGraph loads latest checkpoint for thread_id
resumed = await app.ainvoke(None, config)
```

**PostgresSaver, multi-process production:**

```python
from langgraph.checkpoint.postgres import PostgresSaver

app = graph.compile(checkpointer=PostgresSaver.from_conn_string(
    "postgresql://user:password@postgres:5432/checkpoints"
))

# Any worker can resume any task by passing the same thread_id
resumed = await app.ainvoke(None, config)
```

PostgresSaver is required for multi-worker deployments: if worker A crashes mid-task, worker B picks up and resumes using the checkpoint in Postgres. State is not tied to any specific worker process.

**Checkpoint mechanics:** LangGraph writes a checkpoint entry after every node execution. On `invoke(None, config)`, LangGraph queries for the latest checkpoint matching the `thread_id`, identifies the last completed node, and begins from the next node, without re-running checkpointed nodes.

When a long-running task fails mid-execution, the debugging tools in [AI agent debugging and post-mortem analysis for failed long-running runs](/learn/ai-agent-debugging) reconstruct the agent's state at the failure step.

### Designing for Idempotent Checkpointing

Checkpointing is only valuable if operations already checkpointed are safe to skip and operations not yet checkpointed are safe to re-execute.

**External API calls with side effects:**

```python
async def create_record_idempotent(task_id: str, step_id: int, data: dict):
    idempotency_key = f"{task_id}_{step_id}"
    existing = await db.get_result(idempotency_key)
    if existing:
        return existing  # cached -- do not re-execute
    result = await external_api.create(data, idempotency_key=idempotency_key)
    await db.set_result(idempotency_key, result)
    return result
```

**Database writes:**

```sql
INSERT INTO task_results (task_id, step_id, result, updated_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (task_id, step_id)
DO UPDATE SET result = EXCLUDED.result, updated_at = NOW();
```

**File operations:** write to `output/{task_id}/step_{step_id}_result.json`. Re-writing the same content to the same path is idempotent.

**LLM calls:** LangGraph caches the LLM call result as part of the node checkpoint. On resume, if the node's checkpoint exists, LangGraph returns the cached result rather than making a new API call.

## Credential Management for Multi-Hour Agent Runs

### The OAuth Expiry Problem and Why Agent-Side Refresh Fails

The 61-minute failure is the most common surprise in production long-running agents: the task works perfectly for an hour, then receives `401 Unauthorized` when the OAuth token that was valid at task start expired 60 seconds ago.

**The agent-side refresh pattern (common but incorrect):**

```python
# WRONG -- agent holds token value in context and handles refresh
class AgentWithOAuthToken:
    def __init__(self, access_token: str, refresh_token: str, expires_at: datetime):
        self.access_token = access_token      # in agent context: visible to injection
        self.refresh_token = refresh_token    # in agent context: serious exposure
        self.expires_at = expires_at

    async def call_api(self, endpoint: str, data: dict):
        if datetime.utcnow() >= self.expires_at:
            new_tokens = await oauth.refresh(self.refresh_token)  # can be hallucinated
            self.access_token = new_tokens["access_token"]
            self.expires_at = datetime.utcnow() + timedelta(seconds=3600)
        return await api_client.post(endpoint, data, auth=self.access_token)
```

Four problems:
1. Access token in context window, visible to prompt injection, logged by observability
2. Refresh token in context window, indefinite or multi-month TTL with many providers
3. Refresh logic in reasoning loop, model can hallucinate the refresh without executing it
4. Extended pause expiry: if agent pauses 24+ hours, even the refresh token may expire

### Per-Call Vault Injection: The Correct Architecture

```python
# CORRECT -- agent holds credential reference, not token value
class AgentWithVaultCredential:
    def __init__(self, credential_name: str):
        self.credential_name = credential_name  # e.g., "google_calendar_oauth"
        # No token value. No refresh token. No expiry timestamp.

    async def call_api(self, endpoint: str, data: dict):
        # Vault: checks expiry -> refreshes if <5 min remaining -> injects fresh token
        return await vault_proxy.call_api(
            endpoint=endpoint,
            data=data,
            credential=self.credential_name
        )
```

**How the vault handles expiry and refresh:**

1. Agent sends tool call with `credential: "google_calendar_oauth"` reference
2. Vault checks `expires_at`; refreshes if less than 5 minutes remaining
3. Vault updates the stored access token and `expires_at` with the refreshed value
4. Vault injects the fresh token into the outgoing HTTP request at the network layer
5. Agent never sees the token value, only the API call result

**What this eliminates:**
- No token value in the agent's context window, not injectable, not loggable
- No refresh token in context window, most serious security gap eliminated
- No refresh logic in reasoning loop, cannot be hallucinated
- A 24-hour pause does not cause token expiry failures
- Audit log records `agent_id`, `credential`, and `timestamp` per tool call

## Context Window Management for Multi-Hour Runs

### Progressive Summarization Every N Steps

**Anthropic's documented recommendation for computer use agents (October 2024):** progressive context summarization every 20-30 steps.

```python
SUMMARIZE_EVERY_N_STEPS = 25

async def agent_loop_with_summarization(task: str, max_steps: int = 100):
    messages = [{"role": "user", "content": task}]
    step_count = 0

    while step_count < max_steps:
        response = await llm.complete(messages=messages, tools=tools)
        messages.append(response.to_message())

        if response.stop_reason == "end_turn":
            return extract_final_answer(messages)

        tool_results = await execute_tool_calls(response.tool_calls)
        messages.extend(tool_results)
        step_count += 1

        if step_count % SUMMARIZE_EVERY_N_STEPS == 0:
            messages = await summarize_step_history(messages, task)

async def summarize_step_history(messages: list, original_task: str) -> list:
    system_messages = [m for m in messages if m["role"] == "system"]
    recent_messages = messages[-5:]
    to_summarize = messages[len(system_messages):-5]

    if not to_summarize:
        return messages

    summary_response = await cheap_llm.complete(
        model="claude-3-5-haiku-20241022",  # $0.80/MTok vs $3.00/MTok for Sonnet
        messages=[{
            "role": "user",
            "content": (
                f"Original task: {original_task}\n\n"
                "Summarize these agent execution steps. Include: what has been completed, "
                "key findings, current state, and what remains.\n\n"
                f"Steps:\n{format_messages(to_summarize)}"
            )
        }],
        max_tokens=500
    )

    summary_message = {
        "role": "assistant",
        "content": f"[CONTEXT SUMMARY]\n{summary_response.content[0].text}"
    }
    return system_messages + [summary_message] + recent_messages
```

**Cost comparison (Claude 3.5 Sonnet at $3.00/MTok input):**

| **Strategy** | **Input tokens at step 50** | **Input cost** |
|---|---|---|
| **Full context (no summarization)** | ~150,000 tokens | ~$22.50 |
| **Progressive summarization every 25 steps** | ~15,000 tokens | ~$2.50 |
| **Savings** | 90% fewer input tokens | **89% cost reduction** |

### Prompt Caching for Stable Context Sections

Anthropic prompt caching (`cache_control`, available since August 2024) reduces cost of stable context sections that do not change between steps.

Cache hit price: **$0.30/MTok** vs $3.00/MTok, a **90% discount**. Cache lifetime: 5 minutes, extended on each hit.

```python
messages = [{
    "role": "user",
    "content": [
        {
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"}  # cache stable system prompt
        },
        {
            "type": "text",
            "text": f"[CONTEXT SUMMARY]\n{current_summary}",
            "cache_control": {"type": "ephemeral"}  # cache the summary too
        },
        {
            "type": "text",
            "text": recent_step_text  # not cached -- changes every step
        }
    ]
}]
```

For a 5,000-token system prompt across 50 LLM calls in a long-running task: without caching $0.75 in system prompt tokens; with caching ~$0.09, a $0.66 saving on the system prompt alone.

For the complete prompt caching reference, see [LLM prompt caching and input cost reduction across repeated calls](/learn/llm-prompt-caching).

## Heartbeat-Driven Wakeup for Multi-Day Agent Tasks

### Cron Scheduling and Autonomous Heartbeat Patterns

Tasks spanning multiple days cannot run as a continuous process. The heartbeat pattern terminates the process between units of work:

1. Agent does a unit of work
2. Agent writes its state to persistent storage
3. Agent process terminates
4. Cron scheduler re-awakens the agent at a specified interval
5. Agent reads state, continues from where it left off

**Polling loop vs heartbeat pattern:**

| **Polling loop (wrong)** | **Heartbeat pattern (correct)** |
|---|---|
| **Process runs continuously**, hits timeout limits | **Process terminates between wakeups**, no timeout |
| **Wastes compute** while waiting for external condition | **Zero resource usage** between wakeups |
| **Hard to resume** after infrastructure failure | **Survives restart**, state in persistent store |
| **One process per task** | **Scales horizontally**, any worker handles wakeup |

**Heartbeat pattern for external event dependencies:**

```python
@celery.task(bind=True)
def check_and_continue_task(self, task_id: str):
    state = task_state_store.get(task_id)

    if condition_is_met(state):
        result = execute_next_step(task_id, state)
        state["completed_steps"].append(result)
        task_state_store.set(task_id, state)

        if state_is_terminal(state):
            notify_completion(task_id, state)
        else:
            check_and_continue_task.apply_async(args=[task_id], countdown=6 * 3600)
    else:
        # Condition not met -- reschedule and terminate
        check_and_continue_task.apply_async(args=[task_id], countdown=3600)
        # Process terminates here -- zero resource usage until next wakeup
```

This pattern handles "wait for PR to be merged" or "wait for batch job to complete" without keeping a process alive during the wait. The agent wakes, checks, and either proceeds or re-schedules and exits.

## OpenLegion's Take: Long-Running Tasks Require Infrastructure, Not Agent Logic

The production failure that catches teams off-guard is not the 5-minute timeout, documented everywhere. It is the **61-minute failure**: the task that runs flawlessly for an hour, then fails with a 401 when the OAuth token expired 60 seconds ago.

Three concrete facts about long-running agent task infrastructure in production:

**Per-call vault injection is the only OAuth pattern that works at 60+ minutes.** RFC 6749 specifies that Google OAuth2, Microsoft Entra ID, and GitHub Apps all issue access tokens with 1-hour TTL. An agent that injects the token at task start will fail at minute 61. The agent-side refresh alternative puts the refresh token in the agent's context window, a security gap far more serious than the original 401, because refresh tokens have indefinitely long or multi-month TTLs. OpenLegion's vault resolves the token at the network layer for every tool call. The agent never holds the token value; refresh happens transparently; a 6-hour task never hits a 401.

**`task_acks_late=True` on Celery workers prevents task loss on crash.** With the default `task_acks_early=True`, Celery acknowledges the task message when the worker picks it up, before execution. If the worker crashes at step 47 of a 100-step task, the task is gone: the broker already acknowledged it. `task_acks_late=True` defers acknowledgment until the task function returns. Combined with LangGraph's PostgresSaver checkpointing, the redelivered task resumes from step 47, not from step 1.

**Progressive summarization at every 20-30 steps is an economic requirement, not a feature.** Anthropic's October 2024 Computer Use documentation confirms 50+ sequential step tasks hit ~100,000 tokens of context from step history alone. At $3.00/MTok input (Claude 3.5 Sonnet), full-context 50-step tasks cost ~$22.50 in input tokens per task. With progressive summarization, ~$2.50, an 89% reduction. At 1,000 tasks/day: $22,500 vs $2,500.

| **Long-running task capability** | **OpenLegion** | **LangGraph + Celery** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Vault per-call credential injection: OAuth token refresh at network layer; agent never holds token value; no 61-minute 401 failure** | Yes, vault per-call | No, user-defined | No, env var | No, env var | No, env var |
| **Heartbeat-driven autonomous wakeup: native multi-day task; agent terminates between steps; zero resource usage during waits** | Yes, cron native | Celery Beat (user config) | No | No | No |
| **Blackboard as task state store: persistent state survives process termination; next wakeup reads progress** | Yes, hierarchical blackboard | Postgres/SQLite (user setup) | No, in-memory | No, in-memory | No, in-memory |
| **task_id propagated to all writes, tool calls, and LLM spans: full task state reconstructable post-hoc** | Yes, mesh-layer propagation | Manual (thread_id discipline) | No | No | No |
| **Progressive summarization every 20-30 steps: context budget stays constant for tasks of arbitrary length** | Yes, documented + cost data | User-defined | Not built-in | Not built-in | Not built-in |
| **Graceful checkpoint-before-kill on mesh timeout** | Yes, pre-kill checkpoint hook | task_soft_time_limit (user handler) | No | No | No |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an AI agent long running task?

An AI agent long running task is an autonomous multi-step agentic workflow that runs for more than 5 minutes, commonly 30 minutes to multiple hours or days, requiring infrastructure beyond a single serverless function invocation. The three production failure modes that emerge at this time scale are cloud runtime timeouts (AWS Lambda 15 minutes, Azure Functions Consumption 10 minutes, GCP Cloud Run 60 minutes, all hard-kill with no graceful shutdown signal), context window exhaustion from accumulated step history (Anthropic documented exhaustion at approximately 100,000 tokens in 50+ step computer use tasks, October 2024), and OAuth access token expiry at the 60-minute mark (RFC 6749: Google OAuth2, Microsoft Entra ID, and GitHub Apps all issue tokens with 1-hour TTL). The infrastructure solutions are a persistent task queue (Celery with Redis or RabbitMQ) to escape timeout limits, LangGraph checkpointing (SqliteSaver or PostgresSaver) for crash resume, and per-call vault credential injection to prevent mid-task 401 failures.

### How do I run an AI agent longer than AWS Lambda's 15-minute timeout?

AWS Lambda's maximum execution time is 15 minutes (900 seconds), a hard kill with no graceful shutdown signal; Azure Functions Consumption Plan is 10 minutes; GCP Cloud Run is 60 minutes; all three hard-kill the process at the boundary, losing any in-flight work and in-memory state. The correct architecture separates enqueueing from execution: the cloud function receives the request, enqueues the task to a Celery queue backed by Redis or RabbitMQ, and returns HTTP 202 Accepted with a task ID; a Celery worker running on a persistent EC2 instance, GKE pod, or Cloud Run service with `min-instances=1` executes the agent work without a timeout ceiling. The client polls `AsyncResult(task_id).state` for `PENDING`, `STARTED`, or `SUCCESS` status, or receives a webhook callback on completion.

### How does LangGraph checkpointing enable crash resume for long-running agents?

LangGraph v0.1 (May 2024) persists graph state after every node execution using configurable checkpointers: SqliteSaver (SQLite file; single-process; survives crash if file is on persistent storage) and PostgresSaver (Postgres; multi-process; supports multiple workers picking up the same task). Enable checkpointing with `graph.compile(checkpointer=SqliteSaver.from_conn_string('/data/checkpoints.db'))` and invoke with `config = {'configurable': {'thread_id': task_id}}`; on resume after a crash, pass `None` as initial state and the same config. LangGraph loads the latest checkpoint for that thread ID and continues from the next node after the last checkpointed node, without re-running already-completed steps. PostgresSaver is required for multi-worker deployments: if worker A crashes mid-task, worker B can resume using the checkpoint in shared Postgres, identified by the same thread ID.

### How do I prevent OAuth token expiry from failing a long-running agent?

OAuth 2.0 (RFC 6749) access tokens have a limited lifetime. Google OAuth2, Microsoft Entra ID, and GitHub Apps all issue tokens with a 1-hour TTL; an agent running for 61+ minutes will receive 401 Unauthorized on the first tool call after expiry if the token was injected at task start. The agent-side refresh pattern (agent holds both access token and refresh token in context, calls refresh endpoint on 401) is insecure: the refresh token is in the agent's context window where prompt injection can extract it, and the refresh logic is in the reasoning loop where it can be hallucinated. The correct architecture is per-call vault injection: the agent holds only a credential reference; every tool call triggers fresh injection from the vault; the vault checks expiry and refreshes automatically using the stored refresh token, transparently, without agent involvement, and without the token ever appearing in the agent's context window.

### What is the progressive summarization pattern for long-running agents?

Progressive summarization condenses accumulated step history into a structured summary every 20-30 steps to prevent context window exhaustion. This is Anthropic's documented recommendation for computer use agents (October 2024). Each step in a research or computer use agent appends 800-3,000 tokens of history; at 50 steps this is 40,000-150,000 tokens, consuming 20-75% of Claude 3.5 Sonnet's 200,000-token context window before the task completes. The pattern calls a cheap summarization model (Claude 3.5 Haiku at $0.80/MTok, or GPT-4o-mini) every 25 steps to condense the step history into a 200-500 token structured summary, replacing the raw step history; at $3.00/MTok input for Claude 3.5 Sonnet, the 50-step input cost drops from approximately $22.50 (full context) to approximately $2.50 (summarized), an 89% reduction.

### How does Celery 5.3 handle long-running AI agent tasks?

Celery 5.3.x (2024) with Redis or RabbitMQ is the standard Python task queue for long-running agent work: a Celery worker running in a persistent process picks up agent tasks from the broker and executes them without a timeout ceiling, unlike serverless functions. The key parameters for agent tasks are `task_acks_late=True` (task acknowledged only after completion, worker crash causes requeue rather than task loss), `task_soft_time_limit` (SIGTERM before hard kill, allows graceful checkpoint before termination), and `max_retries` with `default_retry_delay` for transient failure retry. Celery Beat provides cron-style scheduling, `apply_async(eta=datetime_obj)` for future-scheduled execution, and `celery.control.revoke(task_id, terminate=True)` for user-initiated cancellation of running agent tasks.

### What is the heartbeat pattern for multi-day AI agent tasks?

The heartbeat pattern terminates the agent process between units of work rather than keeping it running continuously: the agent does a step, writes its state to persistent storage, terminates, and is re-awakened by a cron scheduler at a specified interval to read its state and continue. This pattern avoids timeout issues (no process runs long enough to hit any platform limit), eliminates resource waste during waits (an agent checking a condition once per hour uses zero compute for 59 minutes), and naturally handles external event dependencies. The agent wakes, checks whether the PR was merged or the batch job completed, and either proceeds or re-schedules and terminates. For tasks waiting on events like code reviews that take 2 days or batch exports that take 12 hours, the heartbeat interval can be set to hours or days with the agent waking and immediately re-scheduling if the condition is not yet met.

### How do I make long-running agent operations idempotent for safe retry?

Idempotency, ensuring the same operation produces the same result regardless of how many times it executes, is required for long-running agent tasks because a crash may occur after an operation completes but before its checkpoint is written, causing the operation to re-execute on resume. For external API calls with side effects (payments, emails, record creation), use provider-supplied idempotency keys: pass a unique key derived from `task_id + step_id`; the API returns the same response for duplicate requests without re-executing. For database writes use `UPSERT` (`INSERT ... ON CONFLICT DO UPDATE`) rather than `INSERT`; for file writes include the task ID and step ID in the path; LangGraph's checkpoint namespace functions as an idempotency key. Re-running the same node returns the cached checkpoint result rather than making a new API call.

## Run Long-Duration Agents Without Silent Failures

Long-running agent tasks expose three failure modes that short tasks never encounter: hard-kill timeouts, silent context truncation, and OAuth expiry at minute 61. Each requires infrastructure, not agent logic, to fix.

The production stack: Celery 5.3 with `task_acks_late=True` for timeout-free execution and crash-safe requeue; LangGraph PostgresSaver for crash-resume without full restart; progressive summarization every 25 steps for context budget control; per-call vault injection for credential freshness independent of task duration.

[Start building on OpenLegion](https://app.openlegion.ai): vault per-call credential injection, heartbeat-driven autonomous wakeup with native cron scheduling, blackboard task state persisting across process restarts, and `task_id` propagated to every tool call and LLM span.
