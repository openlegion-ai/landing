---
title: "AI Agent Parallelization — Fan-Out, asyncio, and Race Condition Safety"
description: "AI agent parallelization: fan-out/fan-in, asyncio.gather(), Semaphore backpressure, OpenAI parallel_tool_calls (Nov 2023), Anthropic tool_use (Mar 2024), LangGraph Send(), race conditions."
slug: /learn/ai-agent-parallelization
primary_keyword: ai agent parallelization
last_updated: "2026-07-15"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-orchestration
  - /learn/multi-agent-systems
  - /learn/agentic-loop
  - /learn/function-calling
  - /learn/ai-agent-reliability
  - /learn/llm-cost-optimization
---

# AI Agent Parallelization: Fan-Out, asyncio, Checkpointing, and Race Condition Safety

AI agent parallelization is the concurrent execution of multiple agent tasks or tool calls within a single agentic workflow — dispatching independent subtasks to run simultaneously rather than sequentially, collecting their outputs when complete (fan-in), and merging the results. OpenAI enabled `parallel_tool_calls` on November 6 2023, Anthropic enabled Claude 3 parallel `tool_use` on March 4 2024, and LangGraph's `Send()` API launched in May 2024; Anthropic's multi-agent research documents up to 80% latency reduction for independent workflows. The key risk: race conditions in shared agent state.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent parallelization** is the concurrent execution of multiple agent tasks or tool calls within a single agentic workflow — dispatching independent subtasks to run simultaneously rather than sequentially (fan-out), collecting their outputs when complete (fan-in), and merging the results into a unified output — reducing end-to-end latency by up to 80% for workflows whose subtasks have no data dependencies between them, while requiring explicit checkpointing, idempotency design, and rate limiting to prevent race conditions, state corruption, and API rate limit exhaustion.

For the broader taxonomy of multi-agent architectures — hierarchical, peer-to-peer, and market-based coordination — see [multi-agent systems and the taxonomy of agent coordination patterns](/learn/multi-agent-systems).

## The Fan-Out/Fan-In Pattern: How Agent Parallelization Works

### Fan-Out: Dispatching Independent Subtasks in Parallel

Fan-out is the dispatch phase: from a single orchestrating step, N independent subtasks are dispatched to run concurrently. The prerequisite for fan-out is **independence**: subtask B can run in parallel with subtask A only if B does not need A's output as its input.

**Identifying independent subtask patterns:**
- Fetching data from N different sources (search 5 databases in parallel)
- Processing N items of the same type (summarize 10 documents in parallel)
- Calling N independent APIs (get weather for 5 cities in parallel)
- Running N agents with different specializations on the same input (have research, legal, and technical agents all analyze the same proposal simultaneously)

**Partial independence:** subtasks B and C both depend on A but not on each other. Execute A first, then fan-out B and C in parallel, then collect B+C results. Total latency = time(A) + max(time(B), time(C)) instead of time(A) + time(B) + time(C).

**Latency math:**
- 5 independent subtasks x 10s each = 50s sequential
- Parallel fan-out = 10s (slowest subtask) + 2–5s overhead = 12–15s total
- **Reduction: ~70–76%**

Anthropic's multi-agent research ("Building effective agents," December 2024) documents **up to 80% latency reduction** for fully independent workflows.

For the single-agent execution loop that each parallel branch runs internally — the tool call, result, reasoning cycle within one agent — see [the agentic loop and single-agent execution mechanics](/learn/agentic-loop).

### Fan-In: Collecting and Merging Parallel Outputs

Fan-in is the collection phase: after parallel subtasks complete, their outputs are gathered and merged into a single result for the next step.

**Three fan-in strategies:**

**1 — Wait-all (`asyncio.gather`):** wait for all N parallel tasks to complete before proceeding. Simplest pattern. Use `asyncio.wait_for()` with a per-task timeout to prevent an indefinitely hanging task from blocking the entire fan-in:

```python
import asyncio

async def fan_in_all(subtasks: list, timeout_seconds: float = 30.0):
    tasks = [asyncio.wait_for(t, timeout=timeout_seconds) for t in subtasks]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    successes = [r for r in results if not isinstance(r, Exception)]
    failures = [r for r in results if isinstance(r, Exception)]
    return successes, failures
```

**2 — Wait-first (`asyncio.wait` with `FIRST_COMPLETED`):** proceed as soon as the fastest result arrives. Use for the **redundant agent pattern**: dispatch the same task to multiple agents, use whichever finishes first, cancel the rest:

```python
tasks = {asyncio.create_task(agent.run(task)) for agent in redundant_agents}
done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)

fastest_result = done.pop().result()
for task in pending:
    task.cancel()
```

**3 — Partial results (`asyncio.as_completed`):** process results as they arrive in completion order. Useful for streaming outputs to a user while other subtasks are still running:

```python
async for completed_task in asyncio.as_completed(subtasks):
    result = await completed_task
    yield result
```

**Merge strategies:** concatenation (combine all N results into a list), structured merge (each subtask writes to a distinct blackboard key; collector reads all keys), or reduction (aggregate N outputs via sum, consensus, or LLM synthesis). The merge must be **idempotent** when used with checkpointing: running the merge twice on the same inputs must produce the same output.

## Implementing Parallelization: asyncio.gather() vs Thread Pools

### asyncio.gather() for I/O-Bound Agent Tasks

`asyncio.gather(*coroutines, return_exceptions=True)` is the primary primitive for parallelizing I/O-bound agent tasks — LLM API calls, database queries, web requests.

How it works: all coroutines run on the same event loop thread. When one coroutine awaits I/O, the event loop switches to another coroutine that is ready to run. No threads, no GIL overhead, no shared memory hazards. All coroutines run in the same process and memory space.

**`return_exceptions=True` is critical for agent parallelization:**

- Without it: a single failing coroutine raises an exception that cancels all other coroutines in the gather — one bad subtask kills 9 good ones
- With it: each result in the returned list is either the coroutine's return value or an `Exception` instance — the caller handles failures per-agent without aborting the workflow

```python
import asyncio
from typing import Any

async def run_parallel_agents(items: list) -> tuple[list, list[Exception]]:
    tasks = [process_item(item) for item in items]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    successes = [r for r in results if not isinstance(r, Exception)]
    failures  = [r for r in results if isinstance(r, Exception)]

    for i, (item, result) in enumerate(zip(items, results)):
        if isinstance(result, Exception):
            logger.error({"item": item, "error": str(result), "step": i})

    return successes, failures
```

**Limitation:** `asyncio` is not parallel for CPU-bound work. All coroutines run on a single OS thread — Python's GIL prevents true parallel CPU execution. For CPU-bound agent tasks (local model inference, data processing), use `ThreadPoolExecutor` or `ProcessPoolExecutor` instead.

### asyncio.Semaphore() for Backpressure and Rate Limiting

**The thundering herd problem:** when 50 parallel agents all start simultaneously and each calls the same LLM provider in its first step, the resulting burst of 50 concurrent requests hits the provider's rate limit and cascades 429 errors through all 50 agents simultaneously.

`asyncio.Semaphore(n)` limits concurrent operations to at most n at any time — the other agents queue and drain as capacity opens:

```python
import asyncio

semaphore = asyncio.Semaphore(10)

async def rate_limited_call(item):
    async with semaphore:
        return await llm_call(item)

tasks = [rate_limited_call(item) for item in items]
results = await asyncio.gather(*tasks, return_exceptions=True)
```

**Setting the semaphore limit (Little's Law):**

```
max_concurrency = target_RPS x average_latency_seconds
```

Example: API rate limit 60 req/s, average call latency 2s — max_concurrency = 60 x 2 = 120. Set `Semaphore(100)` to leave 17% headroom for latency variance.

**LLM provider rate limits (2025):**

| **Provider** | **Tier** | **Rate limit** | **req/s** | **Semaphore at 2s latency** |
|---|---|---|---|---|
| **OpenAI** | Tier 5 | 10,000 RPM | 167 | Semaphore(280) |
| **Anthropic** | Tier 4 | 4,000 RPM | 67 | Semaphore(110) |
| **Google Gemini 1.5 Pro** | — | 1,000 RPM | 17 | Semaphore(28) |

For managing the cost implications of parallel agent execution — N parallel LLM calls multiply token costs Nx — see [LLM cost optimization and token budget management across parallel calls](/learn/llm-cost-optimization).

### ThreadPoolExecutor for CPU-Bound and Blocking Agent Tasks

`ThreadPoolExecutor` is appropriate when agent tasks involve work that blocks the event loop:

1. **CPU-bound work:** local model inference (llama.cpp, vLLM local), heavy data processing, image/audio processing
2. **Blocking I/O:** synchronous library calls that do not support `async` (some database drivers, legacy HTTP clients)
3. **Mixed workloads:** some tasks are async-native (LLM API calls via `httpx`) while others require blocking calls

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=10)

async def run_blocking_task(func, *args):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, func, *args)

results = await asyncio.gather(
    async_llm_call(prompt),
    run_blocking_task(local_inference, data),
    return_exceptions=True
)
```

**`max_workers` guidance:**

- For blocking I/O tasks: `max_workers = number_of_concurrent_tasks` (threads wait, not compute)
- For CPU-bound tasks: `max_workers = os.cpu_count()` to avoid context switching overhead
- Default: `min(32, os.cpu_count() + 4)` (Python 3.8+ default)

**GIL note:** Python's GIL means even `ThreadPoolExecutor` runs only one thread's Python bytecode at a time. CPU-bound tasks that release the GIL (NumPy, PyTorch C++ extensions) benefit from multi-threading. Pure-Python CPU-bound tasks should use `ProcessPoolExecutor` instead for true parallelism.

## Parallel Tool Calls: OpenAI, Anthropic, and LangGraph

### OpenAI parallel_tool_calls and Anthropic Parallel tool_use

**OpenAI parallel function calling (GA: November 6, 2023, GPT-4 Turbo):**

When `finish_reason='tool_calls'` and the `tool_calls` array contains multiple entries, the model has determined these tool calls are independent and can execute concurrently. Each `tool_call` has a unique `id` (`call_abc123`), `function.name`, and `function.arguments` (a JSON string requiring `json.loads()`).

Execute all in parallel, return all results in one follow-up message:

```python
import asyncio, json

async def handle_parallel_tool_calls(response, tool_registry: dict):
    tool_calls = response.choices[0].message.tool_calls

    async def execute_one(tc):
        fn = tool_registry[tc.function.name]
        args = json.loads(tc.function.arguments)
        result = await fn(**args)
        return {"tool_call_id": tc.id, "role": "tool", "content": str(result)}

    tool_results = await asyncio.gather(
        *[execute_one(tc) for tc in tool_calls],
        return_exceptions=True
    )
    return tool_results

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    parallel_tool_calls=False  # disable for sequential-only scenarios
)
```

**Latency example:** 5 independent tool calls each taking 300ms:
- Sequential: 5 x 300ms = 1,500ms
- Parallel: 300ms + ~100ms overhead = 400ms — **73% reduction**

**Anthropic Claude 3 parallel tool_use (GA: March 4, 2024, Claude 3 Sonnet):**

When `stop_reason='tool_use'` and the response `content` array contains multiple `tool_use` blocks, execute all in parallel. Key differences from OpenAI:

- `tool_use` blocks have unique ids (`toolu_01A09q90...`)
- `input` field is a **parsed dict** (not a JSON string — no `json.loads()` needed)
- Claude is conservative: only parallelizes clearly independent calls
- Maximum **64 tools per request** across all parallel `tool_use` blocks
- Return a single `user` message with multiple `tool_result` blocks

```python
async def handle_anthropic_parallel_tools(response, tool_registry: dict):
    tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

    async def execute_one(block):
        fn = tool_registry[block.name]
        result = await fn(**block.input)  # input is already a dict
        return {
            "type": "tool_result",
            "tool_use_id": block.id,
            "content": str(result)
        }

    tool_results = await asyncio.gather(
        *[execute_one(b) for b in tool_use_blocks],
        return_exceptions=True
    )
    return {"role": "user", "content": tool_results}
```

For the full function calling protocol — tool schema design, strict JSON Schema, and tool error handling that underpins parallel tool calls — see [function calling and parallel tool call implementation](/learn/function-calling).

### LangGraph Send() API: Parallel Node Execution

**LangGraph v0.1 (May 2024)** introduced the `Send()` API for parallel node execution in `StateGraph`:

```python
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from typing import TypedDict, Annotated
import operator

class WorkflowState(TypedDict):
    items: list[str]
    results: Annotated[list, operator.add]  # reducer: append all parallel results

def dispatch_parallel(state: WorkflowState):
    return [Send("worker_node", {"item": x, "index": i})
            for i, x in enumerate(state["items"])]

async def worker_node(state: dict) -> dict:
    result = await process_item(state["item"])
    return {"results": [result]}

def collector_node(state: WorkflowState) -> dict:
    merged = merge_results(state["results"])
    return {"final_output": merged}
```

**Checkpointing for parallel state safety:**

LangGraph's checkpointer serializes state writes from parallel branches using distinct namespaces:

```
checkpoint key = graph_id + thread_id + branch_id + step_id
```

No two parallel branches write to the same checkpoint key. If a parallel branch fails mid-execution, the graph resumes from that branch's last successful checkpoint — not from the beginning of the entire graph.

```python
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = SqliteSaver.from_conn_string("checkpoints.db")     # development
checkpointer = PostgresSaver.from_conn_string(DATABASE_URL)         # production

app = graph.compile(checkpointer=checkpointer)
result = await app.ainvoke(
    {"items": items},
    config={"configurable": {"thread_id": run_id}}
)
```

## Race Conditions, Partial Failures, and Idempotency

### Race Conditions in Shared Agent State

The most dangerous failure mode of parallel agent execution is a **race condition in shared state**: two or more parallel agents read the same state, make independent decisions, and write back to the same key. The second write overwrites the first — silently losing the first agent's result.

**The classic race:**

```
t=0: Agent A reads state["findings"] = []
t=0: Agent B reads state["findings"] = []
t=1: Agent A appends "finding_A" -> writes ["finding_A"]
t=2: Agent B appends "finding_B" -> writes ["finding_B"]  <- overwrites A's result

final state["findings"] = ["finding_B"]  # A's finding is lost
```

No error was raised. The agent returned 200. The result is wrong and will not be caught by a test that runs agents sequentially.

**Prevention strategies:**

**Strategy 1 — Disjoint state keys (preferred):** each parallel agent writes to a distinct key. A collector node merges the keys after fan-in:

```python
async def worker_agent(agent_id: str, task: str, state: dict) -> dict:
    result = await process(task)
    return {f"result_{agent_id}": result}  # distinct key per agent

def collector(state: dict) -> dict:
    all_results = [state[f"result_{aid}"] for aid in agent_ids if f"result_{aid}" in state]
    return {"merged_findings": merge(all_results)}
```

**Strategy 2 — Atomic database operations:**

```python
db.execute("UPDATE state SET findings = array_append(findings, %s)", [new_finding])
```

**Strategy 3 — Optimistic locking:**

```python
updated = db.execute(
    "UPDATE state SET findings = %s, version = version + 1 "
    "WHERE key = 'findings' AND version = %s",
    [new_data, current_version]
)
if updated.rowcount == 0:
    raise ConcurrentWriteConflict("Version mismatch — retry")
```

**Strategy 4 — LangGraph checkpointing:** serializes writes to shared state via database transactions at node boundaries.

For the broader resilience patterns — circuit breakers, retry-with-backoff, and graceful degradation under provider outages — see [AI agent reliability and circuit breaker patterns for parallel failures](/learn/ai-agent-reliability).

### Partial Failure Handling in Parallel Agent Workflows

**Fail-fast vs best-effort:**

| **Mode** | **`return_exceptions`** | **When to use** |
|---|---|---|
| **Fail-fast** | `False` (default) | All N results are required; any failure aborts the workflow |
| **Best-effort** | `True` | Partial results are sufficient; workflow continues with successful results |

**Per-agent retry (not workflow-level retry):**

```python
async def resilient_agent(item, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return await process_item(item)
        except TransientError as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
```

**Compensation (rollback) for partial writes:**

When parallel writes partially succeed before a fatal failure, roll back successful writes to avoid leaving shared state inconsistent:

```python
committed_agents = []
try:
    for agent in parallel_agents:
        result = await agent.run()
        committed_agents.append(agent)
except FatalError:
    for agent in committed_agents:
        await agent.rollback()
    raise
```

### Idempotency: Safe Parallel Execution and Retry

An **idempotent operation** produces the same result regardless of how many times it executes with the same inputs — the critical property for parallel agents that may be retried after partial failures.

**Idempotency keys at dispatch time:**

```python
async def fan_out_with_idempotency(items: list, run_id: str):
    tasks = []
    for i, item in enumerate(items):
        idempotency_key = f"{run_id}_{i}_{hash(str(item))}"
        tasks.append(idempotent_process(item, idempotency_key=idempotency_key))
    return await asyncio.gather(*tasks, return_exceptions=True)

async def idempotent_process(item, idempotency_key: str):
    existing = await db.get_result(idempotency_key)
    if existing:
        return existing
    result = await process(item)
    await db.set_result(idempotency_key, result)
    return result
```

**UPSERT for parallel safety:**

```sql
INSERT INTO agent_results (task_id, branch_id, result, updated_at)
VALUES (%s, %s, %s, NOW())
ON CONFLICT (task_id, branch_id)
DO UPDATE SET result = EXCLUDED.result, updated_at = NOW();
```

**LangGraph's checkpoint namespace is an idempotency key:** `graph_id + thread_id + branch_id + step_id`. Re-running the same parallel branch returns the cached checkpoint result.

## Security: Credential Isolation in Parallel Agent Execution

### The Credential Contention Problem in Parallel Execution

When N parallel agents all call the same external API with the same credential, the naive implementation stores the credential in a shared environment variable accessible to all N agent processes.

**Security problems with shared credential env vars:**

1. **Exposure radius:** if any one of the N parallel agents is compromised via prompt injection or a supply chain attack, the attacker accesses the env var — getting the credential used by all N agents
2. **Audit opacity:** the log shows the credential was used N times, but cannot attribute specific API calls to specific agents
3. **Rotation complexity:** rotating the credential requires restarting all N running agents

**Vault-proxied credential injection (OpenLegion pattern):**

Each parallel agent receives credential injection per-request at the network layer. The credential value is never written to any agent process's environment. A compromise of one parallel agent has no access to the credential. Credential rotation in the vault takes effect on the next request without restarting agents. The audit log records `agent_id`, `credential_name`, and `timestamp` per access — not just "this credential was used N times."

## OpenLegion's Take: Parallel Agents Need Isolated Execution, Not Shared State

Parallelization is the highest-impact latency optimization available to agent builders — and the source of the most subtle production failures. Sequential agent failures are linear: step 3 failed because step 2 produced bad output. Parallel agent failures are non-linear: agents 3A and 3B succeed individually, but their combined writes to shared state corrupt it in ways that only manifest when a specific write interleaving occurs.

Three concrete facts about parallel agent failures in production:

**Race conditions in agent state are silent.** The agent returns 200. The output passes validation. The result is wrong. Agent A wrote `["finding_A"]` to `state["findings"]`; agent B overwrote it with `["finding_B"]`. Neither A nor B raised an exception. A sequential test run would never catch this because sequential execution eliminates the write interleaving that causes the corruption. The correct architecture eliminates shared write targets entirely: each parallel agent writes to a distinct key; a collector node merges after all branches complete.

**Thundering herd against LLM provider rate limits is avoidable with one primitive.** OpenAI Tier 5 is 10,000 RPM (167 req/s); Anthropic Tier 4 is 4,000 RPM (67 req/s); Gemini 1.5 Pro is 1,000 RPM (17 req/s). Fan-out to 50 parallel agents all calling Anthropic simultaneously produces a burst of 50 requests in the same 50ms window — well above rate limit thresholds. `asyncio.Semaphore()` with a Little's Law-sized limit turns a thundering herd into a rate-limit-safe stream with no retries and no wasted compute from 429-triggered agent failures.

**Vault-proxied credentials eliminate the parallel execution credential blast radius.** LangGraph, CrewAI, AutoGen, and LangChain implement parallel execution with shared `os.environ` credential storage: all N parallel agents share the same env var value. A prompt injection attack against one of 50 agents yields the credential used by all 50. OpenLegion's Zone 2 network-layer credential injection means each parallel agent receives credential resolution per-request — the env var containing the actual credential value does not exist in the agent process. A compromise of agent N=3 yields nothing.

| **Parallelization property** | **OpenLegion** | **LangGraph** | **CrewAI** | **AutoGen** | **LangChain agents** |
|---|---|---|---|---|---|
| **Per-agent vault credential injection at request time — no shared env var across parallel agents** | Yes — Zone 2 network-layer resolution | No — env var | No — env var | No — env var | No — env var |
| **Disjoint blackboard keys per parallel agent — no read-modify-write race conditions** | Yes — hierarchical key design, collector node merges | Partial — checkpointer serializes, merge logic is user-defined | No — shared crew state | No — shared agent state | No — shared memory |
| **asyncio.Semaphore() backpressure — parallel agents cannot thundering-herd provider rate limits** | Yes — platform-enforced backpressure | User-defined | Not built-in | Not built-in | Not built-in |
| **task_id + branch_id idempotency keys on parallel tool calls** | Yes — mesh-layer task_id propagation | Yes — checkpoint namespace (graph_id + thread_id + branch_id) | No | No | No |
| **max_parallelism enforced at mesh layer** | Yes — operator-configured ceiling | User-defined | Not enforced | Not enforced | Not enforced |
| **Partial failure resume from checkpoint (not full restart)** | Yes — blackboard key-level recovery | Yes — SQLite/Postgres checkpoint resume | No — full restart | No — full restart | No — full restart |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent parallelization?

AI agent parallelization is the concurrent execution of multiple agent tasks or tool calls within a single agentic workflow — dispatching independent subtasks to run simultaneously rather than sequentially (fan-out), collecting their outputs when complete (fan-in), and merging the results into a unified output for the next step. The primary benefit is latency reduction: Anthropic's multi-agent research ("Building effective agents," December 2024) documents up to 80% latency reduction vs sequential execution for workflows whose subtasks have no data dependencies between them. The prerequisite is independence: subtask B can run in parallel with subtask A only if B does not need A's output as its input; identifying and separating independent from dependent subtasks is the core design challenge.

### How do OpenAI parallel tool calls work?

OpenAI parallel function calling (GA November 6, 2023, GPT-4 Turbo) allows the model to return multiple `tool_call` objects in a single response's `tool_calls` array when `finish_reason='tool_calls'`, indicating the model has determined those tool calls can execute concurrently. Each `tool_call` has a unique `id`, `function.name`, and `function.arguments` (a JSON string); the caller executes all in parallel using `asyncio.gather()` and returns all results in a single follow-up message with one `role='tool'` message per `tool_call_id`. The latency benefit: 5 independent tool calls each at 300ms = 1,500ms sequential vs 400ms parallel (73% reduction); disable with `parallel_tool_calls=False` when tool calls must execute in a specific order.

### How does Anthropic Claude support parallel tool use?

Anthropic Claude 3 (GA March 4, 2024) supports parallel tool use: when `stop_reason='tool_use'` and the response `content` array contains multiple `tool_use` blocks, all tool calls should be executed in parallel; each `tool_use` block has a unique id and the caller returns a single `user` message with multiple `tool_result` blocks each referencing its `tool_use_id`. Claude's parallel tool use is intentionally conservative — it only issues multiple simultaneous `tool_use` blocks when the calls are clearly independent; for dependent calls (output of A is input to B), Claude issues them sequentially across multiple turns. The maximum is 64 tools per request across all parallel `tool_use` blocks, and unlike OpenAI, the `input` field is already a parsed dict (not a JSON string requiring `json.loads()`).

### What is asyncio.gather() and when should I use it for agent parallelization?

`asyncio.gather(*coroutines, return_exceptions=True)` executes all provided coroutines concurrently on the same event loop thread — the event loop switches between coroutines when one awaits I/O (LLM API call, database query, web request), achieving concurrency without threads or GIL overhead. The `return_exceptions=True` parameter is critical: without it, a single failing coroutine cancels all others; with it, each result is either the coroutine's return value or an `Exception` instance, allowing per-agent failure handling without aborting the entire parallel workflow. `asyncio.gather()` is appropriate for I/O-bound agent tasks (the dominant case — LLM agents spend most of their execution time awaiting API responses); for CPU-bound tasks (local model inference, data processing), use `ThreadPoolExecutor` via `asyncio.get_event_loop().run_in_executor()` to avoid blocking the event loop.

### What is asyncio.Semaphore() and how does it prevent thundering herd in parallel agents?

`asyncio.Semaphore(n)` limits concurrent operations to at most n at any time — when n operations are running, additional operations wait until one completes — preventing the thundering herd problem where N parallel agents simultaneously send N API requests and exhaust the provider's rate limit. The pattern: `semaphore = asyncio.Semaphore(10); async def rate_limited_call(item): async with semaphore: return await llm_call(item)` — at most 10 LLM calls run concurrently; the semaphore limit formula is `target_RPS x average_latency_seconds` (Little's Law). LLM provider rate limits as of 2025: OpenAI Tier 5 at 10,000 RPM (167 req/s); Anthropic Tier 4 at 4,000 RPM (67 req/s); Google Gemini 1.5 Pro at 1,000 RPM (17 req/s) — set the semaphore at ~80% of the calculated maximum to leave headroom.

### What is LangGraph's Send() API and how does it enable parallel agent execution?

LangGraph v0.1 (May 2024) introduced the `Send()` API for parallel node execution in `StateGraph`: a node function returns a list of `Send('node_name', state_copy)` objects to dispatch N copies of the current state to N parallel invocations of the named node; LangGraph schedules all N invocations concurrently and collects their outputs via a state reducer before invoking downstream nodes. LangGraph's checkpointing (SqliteSaver for development, PostgresSaver for production) serializes state writes from parallel branches into distinct namespaces (`graph_id + thread_id + branch_id`), preventing write conflicts and enabling resume-from-checkpoint on partial failure. The `Send()` API implements map-reduce: the sending node maps N items to N worker nodes in parallel; a collector node reduces all N results and is invoked only after all parallel branches complete.

### What are race conditions in parallel AI agents and how do I prevent them?

A race condition in parallel agent state occurs when two or more concurrent agents read the same state, make independent decisions, and write back to the same key — the second write overwrites the first, silently losing the first agent's result; this is non-deterministic (only occurs when writes interleave in a specific order) and will not be caught by sequential tests. The primary prevention is disjoint state keys: each parallel agent writes to a distinct key (`result_agent_A`, `result_agent_B`) with no shared write targets; a collector node merges distinct keys after fan-in, eliminating write conflicts because no two agents ever write to the same key. For unavoidable shared state, use atomic database operations (SQL `UPSERT`/`INSERT ... ON CONFLICT`, Redis atomic operations) rather than read-modify-write patterns, or use LangGraph's checkpointer which serializes writes via database transactions at node boundaries.

### How should I handle partial failures in parallel agent workflows?

The two design decisions are: fail-fast (`asyncio.gather` without `return_exceptions=True`) — any agent failure aborts the entire workflow, appropriate when all N results are required; or best-effort (`return_exceptions=True`) — agent failures are captured as `Exception` instances and the workflow continues with successful results, appropriate when partial results are sufficient. Retry individual failing agents with per-agent exponential backoff (`await asyncio.sleep(2**attempt)`) rather than retrying all N agents because one failed — this wastes the N-1 successful results. For parallel writes that partially succeed before a fatal failure, implement compensation (roll back successful writes) or design all writes as idempotent upserts so retries of failed agents cannot duplicate the successful agents' side effects.

## Ship Parallel Agent Workflows That Stay Safe

Fan-out/fan-in delivers real latency gains — 5 independent 10-second subtasks become 12 seconds, not 50. OpenAI, Anthropic, and LangGraph all ship native parallel execution primitives. The implementation is `asyncio.gather()` with `return_exceptions=True` and `asyncio.Semaphore()` for backpressure.

The failure modes to design against before scaling: disjoint state keys (not shared write targets), idempotency keys on all parallel tool calls, and per-agent credential injection (not shared env vars).

[Start building on OpenLegion](https://app.openlegion.ai) — disjoint blackboard keys per parallel agent, `$CRED{}` vault injection per-request at the network layer, `asyncio.Semaphore()` backpressure enforced at the mesh layer, and `max_parallelism` bounded by operator configuration.
