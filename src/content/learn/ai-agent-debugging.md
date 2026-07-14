---
title: "AI Agent Debugging: Loops, Hallucinated Calls, and Post-Mortem Traces"
description: "AI agent debugging: diagnosing infinite loops, hallucinated tool names, context overflow, and credential 401s using OTel GenAI spans, LangSmith trace replay, and structured post-mortem templates."
slug: /learn/ai-agent-debugging
primary_keyword: ai agent debugging
last_updated: "2026-07-14"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-testing
  - /learn/agentic-workflows
  - /learn/ai-agent-reliability
  - /learn/llm-observability
  - /learn/context-engineering
---

# AI Agent Debugging: Diagnosing Loops, Hallucinated Calls, and Context Failures

AI agent debugging is the practice of diagnosing and resolving failures in deployed AI agents — distinct from testing (pre-production validation) and observability (ongoing runtime metrics) in that debugging is reactive investigation of a specific failure that already occurred. Where a stateless web application failure is localized to a request-response log and a line number, an agent failure at step 15 requires reconstructing 14 turns of accumulated context to find the divergence point. Three failure categories account for most production incidents: infinite loops, hallucinated tool names, and context overflow.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent debugging** is the practice of diagnosing and resolving failures in deployed AI agents — identifying the specific step in a multi-step agentic run where reasoning diverged, tool calls failed, or context exceeded its limit — by reconstructing the agent's full state at the failure point from trace spans, blackboard writes, and audit logs, so that the root cause can be identified and a fix can be verified without waiting for the failure to recur in production.

For ongoing runtime monitoring of agent health — task success rates, tool call counts, latency SLOs, and cost attribution — see [AI agent observability and runtime metrics for healthy systems](/learn/ai-agent-observability); debugging starts where observability alerts leave off.

## Why Agent Debugging Is Different from Application Debugging

### The State Reconstruction Problem

In a stateless web application, the request-response log is sufficient for debugging: what came in, what went out, what error was returned, at what line number. The error is localized to a single function call with a single input and a single output.

In a multi-step agent, the state at failure step 15 is not localized — it is the accumulated product of:

- System prompt: 2,000–5,000 tokens
- 14 turns of conversation history: 30,000–70,000 tokens
- 10 tool call results appended to context: 20,000–50,000 tokens
- Intermediate reasoning traces from scratchpad steps

Without reconstructing this full state, debugging means guessing: "maybe the model hallucinated at step 12" or "maybe the tool result from step 8 poisoned the context." The key insight: **agent failures are often not errors** — no exception was thrown, the API returned 200 — but behavioral divergences: the agent took an action that was syntactically valid but semantically wrong. Finding the divergence point requires seeing what the model saw at each step.

A grep of error logs shows nothing. The agent did not crash. It produced a response — just the wrong one. The investigation starts with: which step was the last step where the agent was still on track?

### Debugging vs Testing vs Observability

Three distinct disciplines that are frequently conflated:

**Testing (pre-production):** running the agent against known-good inputs with expected outputs before deployment. Catches regressions before they reach users. Tools: eval datasets, golden input/output pairs, pytest-asyncio, promptflow. When: CI/CD pipeline, before every deployment. Testing cannot catch the failure that occurs only in production with a specific user input the test suite did not cover.

**Observability (runtime):** ongoing measurement of a healthy system in production. Task success rates, tool call counts, P99 latency, cost per task. Answers: "is the system healthy right now?" Tools: AgentOps dashboards, LangSmith aggregate views, OTel GenAI spans feeding Grafana, error rate alerts. When: always, via automated alerts. Observability tells you that something failed — it does not tell you why.

**Debugging (reactive):** investigating a specific failure that already occurred. Answers: "why did this specific run fail at step 15 on Tuesday at 14:32 UTC?" Tools: trace replay, log queries, blackboard state reconstruction, post-mortem analysis. When: after a failure is reported. Debugging starts where an observability alert ends — the alert says the error rate spiked; debugging determines the root cause.

The tools overlap (LangSmith does both observability dashboards and trace replay for debugging), but the workflow is different: debugging requires reproducing a specific failure, not averaging metrics across thousands of runs. For catching failures before they reach production — eval datasets, regression test suites, and golden input/output pairs — see [AI agent testing and pre-production validation](/learn/ai-agent-testing).

## The Three ReAct Failure Categories and How to Diagnose Each

### Infinite Loop: Agent Never Emits Final Answer

**Failure signature:** agent reaches the `max_iterations` circuit breaker without producing a final response. The last N iterations show repeating or oscillating tool calls with slightly different arguments, or the same tool call with the same arguments and the same error.

**Root cause 1 — Dependency cycle:** the model generates an Action that requires a tool result it has not yet received. The tool result requires another call to complete. The agent cannot make progress because it is waiting on itself.

Diagnosis: examine the last 5 tool calls for a cycle pattern:

```
Step 16: Call search_web(query="X pricing")
Step 17: Call fetch_competitor_data(source=search_result)  ← waits for step 16
Step 18: Call search_web(query="X pricing")               ← step 16 result unused?
Step 19: Call fetch_competitor_data(source=search_result)  ← cycle
```

Fix: explicit ordering in the system prompt. "Complete tool A before calling tool B. Do not call `fetch_competitor_data` until you have a result from `search_web`."

**Root cause 2 — Tool error loop:** a tool call fails; the model retries with the same arguments (no retry budget in the system prompt); the tool fails again; the model has no fallback path.

Fix: explicit retry-and-abandon instruction in the system prompt: "If a tool fails twice with the same error, do not retry. Report the error as your Final Answer instead."

**Root cause 3 — Goal confusion from context overflow:** the model has lost track of the original goal because context overflow evicted the initial user request. The agent is now pursuing an implicit subgoal in an endless refinement loop.

Diagnosis: check whether the original user request is present in the context window at the failure step. If it was evicted, context overflow is the root cause, not the loop logic.

**Detection in production:**

```python
MAX_ITERATIONS = 20  # hard limit on all production agent loops

for iteration in range(MAX_ITERATIONS):
    # Log iteration count at every LLM call
    logger.info({
        "trace_id": trace_id,
        "step": iteration,
        "input_tokens": count_tokens(messages),
        "operation": "llm_call"
    })

    # Alert at 75% of limit
    if iteration == 15:
        logger.warning({
            "trace_id": trace_id,
            "event": "approaching_max_iterations",
            "step": 15,
            "last_tool": last_tool_called
        })

    response = model.complete(messages)
    if response.finish_reason == "stop":
        return response.content

raise RuntimeError(f"Circuit breaker: trace {trace_id} exceeded {MAX_ITERATIONS} iterations")
```

For the full agentic loop architecture — how tool calls chain across turns, loop termination conditions, and the dependency patterns that create infinite loops — see [the agentic loop and the mechanics that produce infinite loops](/learn/agentic-workflows).

### Hallucinated Tool Name: ToolNotFoundError

**Failure signature:** agent emits a tool call with a name that does not exist in the registered tool registry. The executor raises `ToolNotFoundError` (LangChain), `tool_not_found` (AutoGen), or equivalent. The agent may or may not recover depending on how tool errors are returned to the model.

**Root cause 1 — Natural language tool description without exact name:**

The system prompt says: "You have access to a web search tool for finding current information."

The model invents a plausible name: `web_search`, `browse_web`, `internet_search`, `search_internet`. The actual registered tool name is `search_web`. None of the invented names match.

Fix: always provide the exact tool name string in the system prompt:

```
You have access to the following tools:

- search_web (exact name: search_web): Search the web for current information.
  Usage: search_web(query="your search query")

- read_file (exact name: read_file): Read a file from the workspace.
  Usage: read_file(path="relative/path/to/file.txt")
```

**Root cause 2 — Tool name changed in deployment:**

A tool was renamed (`search` → `search_web`) but the system prompt still references the old name, or a fine-tuned model was trained on prompts referencing the old name.

Diagnosis: compare the tool names listed in the system prompt against the registered tool registry at agent startup.

**Root cause 3 — Model confuses tool names with built-in function names:**

When a tool name matches a common Python built-in (`open`, `read`, `write`, `print`), the model may hallucinate calling `open(file, mode)` as if it were a Python built-in rather than the registered tool.

Fix: use descriptive, unambiguous tool names with domain prefixes. `fs_read_file` not `read`. `web_search_query` not `search`.

**Tool registry validation at startup:**

```python
def validate_tool_registry(system_prompt: str, registered_tools: list[str]) -> None:
    """Catch tool name mismatches before the first user request."""
    tool_name_pattern = re.compile(r'exact name:\s*(\w+)')
    mentioned_names = tool_name_pattern.findall(system_prompt)

    unregistered = [name for name in mentioned_names if name not in registered_tools]
    if unregistered:
        raise ConfigError(
            f"System prompt references unregistered tools: {unregistered}. "
            f"Registered: {registered_tools}"
        )

# Call at agent startup — fails fast before first LLM call
validate_tool_registry(SYSTEM_PROMPT, [t.name for t in tools])
```

**Diagnosis query for existing failures:**

```sql
-- Find ToolNotFoundError events and the hallucinated tool name
SELECT timestamp, trace_id, step, tool_called, error_message
FROM agent_logs
WHERE error_type = 'ToolNotFoundError'
ORDER BY timestamp DESC
LIMIT 50;
```

Compare the `tool_called` values against the registered tool list. If the hallucinated names cluster around similar patterns (`web_search`, `internet_search`, `search_internet`), the system prompt tool description is ambiguous. If the hallucinated name matches an old tool name exactly, the deployment introduced a rename without updating the system prompt.

### Context Overflow: Silent Truncation and Goal Loss

**Failure signature:** the agent appears to "forget" its goal, repeats actions it already completed, or starts producing incoherent responses after a certain step. Often no explicit error is raised.

**Sub-case 1 — Token limit exceeded with error:**

The provider returns a `context_length_exceeded` error (OpenAI) or equivalent. This is the easy case — it appears in logs as an API error with a clear message. Fix: context compression before the next call.

**Sub-case 2 — Silent truncation (the hard case):**

The provider applies automatic truncation without notifying the developer. The agent continues running but with a context window that has silently dropped earlier turns.

Symptoms of silent truncation:
- Agent repeats actions it already completed (those steps are no longer in context)
- Agent ignores constraints stated in the first few turns of the conversation
- Agent asks for information the user already provided
- Agent's responses become shorter and less coherent after a specific step

The OpenAI Assistants API applies automatic truncation at approximately 32,000 tokens with **no developer-visible eviction policy** — what was kept or dropped is not visible to the developer, making post-mortem reconstruction of "what was in context at step 14" impossible without external logging.

**Detection:**

```python
CONTEXT_ALERT_THRESHOLD = 0.80  # alert at 80% of model's context limit
MODEL_CONTEXT_LIMITS = {
    "claude-3-5-sonnet-20241022": 200_000,
    "gpt-4o": 128_000,
    "gpt-4o-mini": 128_000,
}

def check_context_budget(model: str, input_tokens: int, trace_id: str, step: int):
    limit = MODEL_CONTEXT_LIMITS.get(model, 128_000)
    utilization = input_tokens / limit

    if utilization >= CONTEXT_ALERT_THRESHOLD:
        logger.warning({
            "event": "context_budget_alert",
            "trace_id": trace_id,
            "step": step,
            "model": model,
            "input_tokens": input_tokens,
            "limit": limit,
            "utilization_pct": round(utilization * 100, 1)
        })
```

For Claude 3.5 Sonnet's 200,000-token window, the alert threshold is 160,000 tokens. A sudden decrease in `input_tokens` between consecutive steps (step 13: 145,000 tokens → step 14: 32,000 tokens) is the fingerprint of the Assistants API's ~32K truncation.

For the proactive context management strategies that prevent overflow — tool result compression, sliding window history, and the blackboard pattern as external working memory — see [context engineering and preventing context overflow before it occurs](/learn/context-engineering).

## Debugging Tools: OTel Spans, Trace Replay, and Session Recording

### OTel GenAI Spans: The Debugging Primitive

OpenTelemetry GenAI Semantic Conventions v1.26.0 (released May 2024) first introduced standardized span attributes for LLM call tracing — prior draft versions varied across instrumentation libraries, making cross-tool trace correlation unreliable.

**Key span attributes for debugging:**

| **Span attribute** | **Type** | **Debugging use** |
|---|---|---|
| **`gen_ai.request.model`** | string | Catches silent model routing errors — wrong model was used for a specific call |
| **`gen_ai.usage.input_tokens`** | int | Context overflow detection — spike = large tool result appended; sudden drop = eviction |
| **`gen_ai.usage.output_tokens`** | int | Truncation detection — drop to 1–5 tokens = model hit `max_tokens` mid-response |
| **`gen_ai.response.finish_reasons`** | string[] | `"stop"` = normal; `"length"` = max_tokens hit; `"content_filter"` = policy; `"tool_calls"` = tool invocation |
| **`gen_ai.operation.name`** | string | `"chat"`, `"embeddings"`, `"tool"` — operation type |

**Debugging workflow using OTel spans:**

1. Identify the failed run by its `trace_id`
2. List all LLM spans in the trace ordered by timestamp
3. Find the span where `finish_reason` changed from expected (`"stop"`) to unexpected (`"length"`, `"content_filter"`, or `"tool_calls"` when text was expected)
4. Examine `input_tokens` at that span — is it near the model's context limit?
5. If content logging is enabled (with PII scrubbing), examine the `gen_ai.prompt` span event to see the exact context the model received

```python
from opentelemetry import trace

tracer = trace.get_tracer("agent.llm")

with tracer.start_as_current_span("llm_call") as span:
    span.set_attribute("gen_ai.request.model", model_name)
    span.set_attribute("gen_ai.operation.name", "chat")

    response = client.messages.create(model=model_name, messages=messages, max_tokens=2048)

    span.set_attribute("gen_ai.usage.input_tokens", response.usage.input_tokens)
    span.set_attribute("gen_ai.usage.output_tokens", response.usage.output_tokens)
    span.set_attribute("gen_ai.response.finish_reasons", [response.stop_reason])
```

For the complete OTel GenAI semantic conventions reference and instrumentation options — see [LLM observability and OTel GenAI span instrumentation](/learn/llm-observability).

### LangSmith and AgentOps: Trace Replay for Root Cause Analysis

**LangSmith** (LangChain): processes over 1 billion LLM traces per month as of Q1 2025. The core debugging feature is trace replay: given a `trace_id` from a failed production run, the LangSmith UI reconstructs the full step-by-step execution — each LLM call with its full input context, the model's output, each tool call with arguments and results, and cumulative token counts and cost at each step.

Trace replay enables reliable reproduction of non-deterministic failures:
- Same system prompt, same conversation history, same tool results
- `temperature=0` for deterministic output
- Developers test a fix without waiting for the failure to recur in production

The critical capability to verify before relying on any tracing tool: **does it capture the full prompt sent to the model at each step, or only the final output?** Without full prompt capture, identifying the root cause requires guessing.

**AgentOps** (agentops.ai): repo created August 2023 (github.com/AgentOps-AI/agentops); 5,700+ GitHub stars as of July 2026. Session-level tracing via decorator-based instrumentation:

```python
import agentops

agentops.init(api_key="your-key")

@agentops.record_action("search")
def search_web(query: str) -> str:
    return web_search_api.search(query)

@agentops.record_tool("send_email")
def send_email(to: str, subject: str, body: str) -> dict:
    return email_api.send(to=to, subject=subject, body=body)
```

All LLM calls and tool calls in a run share a `session_id`. The AgentOps dashboard provides a session timeline — every LLM call, tool call, and state transition in chronological order — and cost breakdown per session.

### Structured Logging for Post-Mortem Queries

Structured logging — JSON log lines, not plain text — is the prerequisite for effective post-mortem queries.

```json
{
  "timestamp": "2026-07-13T14:32:05.847Z",
  "level": "INFO",
  "trace_id": "abc123def456",
  "session_id": "session_xyz789",
  "step": 14,
  "agent_id": "research-agent",
  "operation": "llm_call",
  "model": "claude-3-5-sonnet-20241022",
  "input_tokens": 45823,
  "output_tokens": 412,
  "finish_reason": "tool_calls",
  "tool_called": "search_web",
  "tool_args": {"query": "OpenLegion pricing 2026"},
  "duration_ms": 1843,
  "cost_usd": 0.0014
}
```

**`trace_id` propagation is the prerequisite for post-mortem reconstruction:**

Every agent run starts with a unique `trace_id` generated at the entry point. That `trace_id` is propagated to every LLM call, tool call, and blackboard write. Post-mortem queries filter by `trace_id`:

```sql
SELECT timestamp, step, agent_id, operation, model, input_tokens,
       finish_reason, tool_called, error_type, error_message
FROM agent_logs
WHERE trace_id = 'abc123def456'
ORDER BY timestamp ASC;
```

Without `trace_id` propagation, correlating which tool call belonged to which agent run in a multi-agent system requires timestamp heuristics that break under concurrency.

## Credential and Auth Failure Debugging

### Diagnosing 401/403 Errors in Tool Calls

Auth failures in agent tool calls are among the most misleading because the error appears in the tool result — a 401 JSON response from an external API — rather than as an exception. The agent may then handle it in ways that obscure the root cause: retrying with the same invalid credential, or incorrectly concluding the resource does not exist.

**Step 1 — Identify the failing tool call:**

```sql
SELECT timestamp, trace_id, step, tool_called, error_type, error_message
FROM agent_logs
WHERE (error_message LIKE '%401%' OR error_message LIKE '%403%')
ORDER BY timestamp DESC
LIMIT 20;
```

**Step 2 — Narrow the cause using the symptom pattern:**

| **Symptom** | **Likely cause** |
|---|---|
| **401 on all calls from the first step** | Wrong credential name or env var not set |
| **401 appears mid-run after working for N steps** | Credential expired mid-run (JWT TTL, rotated API key) |
| **401 on production, works in staging** | Staging credentials used with production endpoint |
| **403 (not 401)** | Credential valid but insufficient permissions for this endpoint |

**Vault-proxied credential audit (OpenLegion pattern):**

With vault-proxied credentials, the audit log records which credential name was accessed (`stripe_api_key`), by which agent (`research-agent`), at which step (timestamp). The credential value is never logged. The entry "credential `stripe_api_key` accessed by `research-agent` at step 7" confirms the correct credential name was used — isolating the problem to credential expiry or endpoint misconfiguration rather than "wrong env var."

Frameworks using `os.environ["STRIPE_API_KEY"]` cannot produce an equivalent audit entry without explicit logging at every access point. Even then, the env var value at that moment is not recoverable without also logging it — which is itself a security violation.

**Credential expiry in long-running agents:**

JWT tokens typically expire after 1–24 hours. An agent run spanning a JWT TTL boundary produces a 401 mid-run with a valid-at-start credential. Fix: refresh the token in the tool executor, not at agent startup:

```python
class AuthenticatedToolExecutor:
    def __init__(self, credential_name: str):
        self.credential_name = credential_name
        self._token = None
        self._token_expires_at = 0

    def get_token(self) -> str:
        if time.time() > self._token_expires_at - 60:  # refresh 60s before expiry
            self._token = vault.get_credential(self.credential_name)
            self._token_expires_at = vault.get_credential_expiry(self.credential_name)
        return self._token
```

## Post-Mortem: From Failure to Fix

### Reproducing Agent Failures Reliably

Agent failures are often non-deterministic at `temperature > 0`. Reliable reproduction strategies:

**Set `temperature=0`:** most providers support deterministic outputs at `temperature=0` given identical inputs. Pin the exact model version (`claude-3-5-sonnet-20241022`, not `claude-3-5-sonnet-latest`) — "latest" may point to a different version than the one that failed.

**Use trace replay:** replay the exact inputs from the failed production run — same system prompt, same conversation history, same tool results — via LangSmith or AgentOps rather than recreating the scenario manually.

**Isolate the failing step:** once the divergence point is identified (step 14 of a 20-step run), create a minimal reproduction starting at step 14 with the reconstructed context from step 13 — not the full 20-step run:

```python
context_at_step_13 = load_from_trace(trace_id="abc123", up_to_step=13)

response = model.complete(
    model="claude-3-5-sonnet-20241022",  # exact version
    messages=context_at_step_13,
    tools=tools,
    temperature=0
)

# Verify the failure reproduces
assert response.stop_reason == "tool_calls"
assert response.tool_calls[0].function.name == "web_search"  # hallucinated name
assert "web_search" not in [t.name for t in tools]
```

For the resilience patterns that prevent failures from becoming incidents — `max_iterations` circuit breakers, retry-with-backoff, and graceful degradation — see [AI agent reliability and circuit breaker patterns](/learn/ai-agent-reliability).

### Post-Mortem Template for Agent Failures

Eight required fields:

**1. Incident summary** — observable user or system impact, duration, and scale:
"The research agent failed on 47 of 312 runs between 14:00 and 16:00 UTC on 2026-07-13 (15% failure rate vs normal <1%). Users received a timeout error. Root cause: tool name mismatch introduced in the 13:45 deployment."

**2. Timestamp-ordered timeline** with `trace_id` and step references, including MTTR.

**3. Root cause** — specific step and mechanism:
"At step 3 (trace_id: abc123, step: 3), the model called `search_web` — the previous tool name. The 13:45 deployment renamed the tool to `web_search` without updating the system prompt."

**4. Contributing factors** — what architectural gap made the root cause possible:
"No tool registry validation at agent startup. Tool name mismatch was not detected until the first real production call."

**5. Detection gap** — time from first failure to first alert, and what monitoring would have caught it sooner.

**6. Fix applied** — the specific code or prompt change.

**7. Regression test added to CI:**

```python
def test_tool_registry_consistency():
    """Tool names in system prompt must match registered tool registry."""
    validate_tool_registry(SYSTEM_PROMPT, [t.name for t in tools])
    # Raises ConfigError if mismatch — catches tool renames before deployment
```

**8. Prevention measure** — what architectural change prevents the failure class:
"Added `validate_tool_registry()` call at agent startup. Future tool renames raise `ConfigError` before the agent processes any user request."

## OpenLegion's Take: The Blackboard as a Debugging Surface

The hardest part of debugging a broken agent is not finding the error — it is reconstructing what the agent believed to be true at the moment it made the wrong decision. In a stateless web application, the request-response log tells you everything. In a multi-step agent, the relevant state at step 15 is the system prompt, 14 turns of conversation history, 10 tool results, and reasoning traces. Without state reconstruction capability, debugging is guessing.

Three concrete facts that define the OpenLegion debugging architecture:

**Every blackboard write is timestamped, keyed, and agent-attributed.** The full state of any agent run can be reconstructed by querying all blackboard writes with a given `task_id` prefix — no external SaaS dependency, no in-memory history lost on process exit. Frameworks that accumulate state in-memory have no equivalent post-hoc reconstruction path.

**Credential access is vault-audited, not env-var-opaque.** When a tool call returns a 401, the audit log records which credential name was accessed (`stripe_api_key`), by which agent (`research-agent`), at which step (2026-07-13T14:32:05Z). The value is never logged. Frameworks using `os.environ["STRIPE_API_KEY"]` cannot provide an equivalent audit trail without logging credential values — a security violation. Vault-audited access isolates auth failures to expiry or endpoint misconfiguration in seconds.

**OTel GenAI spans (v1.26.0) emitted at every LLM call** capture `gen_ai.usage.input_tokens` and `gen_ai.response.finish_reasons` at the call level. Combined with `task_id` propagation to every handoff and blackboard write, and `max_iterations` circuit breakers enforced at the mesh layer, the debugging surface is complete: any failure can be localized to a specific step with the exact context that step received.

| **Debugging capability** | **OpenLegion** | **LangChain agents** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Every blackboard write timestamped + agent-attributed — full run state reconstructable by task_id prefix** | Yes — blackboard as debugging surface | No — in-memory, lost on exit | No — in-memory | No — in-memory | No — in-memory |
| **Vault credential access audit log — which secret accessed, by which agent, at which step** | Yes — vault audit, value never logged | No — env var, no audit trail | No — env var | No — env var | No — env var |
| **OTel GenAI spans v1.26.0 at every LLM call (input_tokens, finish_reasons)** | Yes — stable conventions | LangSmith (LangChain-native) | Not built-in | Not built-in | OpenAI dashboard only |
| **task_id propagated to every handoff, blackboard write, and LLM span** | Yes — mesh-layer propagation | Manual trace_id required | Manual | Manual | Not enforced |
| **max_iterations circuit breaker at mesh layer** | Yes — platform-wide | Per-agent, configurable | Per-agent | Per-agent | Not built-in |
| **Validator stage catches schema/link/content failures before production** | Yes — CI gate before every PR | Not built-in | Not built-in | Not built-in | Not built-in |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent debugging?

AI agent debugging is the practice of diagnosing and resolving failures in deployed AI agents — identifying the specific step in a multi-step agentic run where reasoning diverged, tool calls failed, or context exceeded its limit — by reconstructing the agent's full state at the failure point from trace spans, audit logs, and blackboard writes. It is distinct from AI agent testing (pre-production validation against known-good inputs) and AI agent observability (ongoing runtime metrics of a healthy system): debugging is reactive investigation of a specific failure requiring tools that can reconstruct what the model believed to be true at the moment it made the wrong decision. The three failure categories documented in the original ReAct paper (arXiv:2210.03629, Yao et al. 2022) and confirmed in production are infinite loops, hallucinated tool names, and context overflow.

### What are the most common AI agent failure modes?

The three failure categories documented in the ReAct paper (arXiv:2210.03629, Yao et al. 2022) and confirmed in production deployments are: infinite loops (the agent reaches the `max_iterations` circuit breaker without producing a final response — caused by tool dependency cycles, repeated tool errors with no fallback strategy, or goal confusion from context overflow); hallucinated tool names (the agent calls a tool with a name not in the registered registry, typically because the system prompt described tools in natural language without specifying exact name strings); and context overflow (the agent loses track of its goal or repeats completed actions because the context window was silently truncated, evicting the original task specification). Each category requires a different debugging approach: iteration logging and dependency cycle analysis for infinite loops, tool registry validation at startup for hallucinated tool names, and per-call `input_tokens` monitoring with threshold alerts for context overflow.

### What are OpenTelemetry GenAI spans and how do I use them for agent debugging?

OpenTelemetry GenAI Semantic Conventions v1.26.0 (released May 2024) first introduced standardized span attributes for LLM call tracing: `gen_ai.request.model` (which model was called — catches routing errors), `gen_ai.usage.input_tokens` (context overflow detection — a spike indicates a large tool result was appended; a sudden drop indicates eviction), `gen_ai.usage.output_tokens` (truncation detection — a drop to 1–5 tokens indicates the model hit `max_tokens`), and `gen_ai.response.finish_reasons` (`"stop"` = normal completion, `"length"` = max_tokens hit, `"content_filter"` = content policy rejection, `"tool_calls"` = tool invocation). The debugging workflow: list all LLM spans in the failed run ordered by timestamp, find the span where `finish_reason` changed from expected to unexpected, and examine `input_tokens` at that span to determine if context overflow contributed.

### How does LangSmith trace replay work for agent debugging?

LangSmith processes over 1 billion LLM traces per month (Q1 2025) and provides trace replay as its core debugging feature: given a trace ID from a failed production run, the LangSmith UI reconstructs the full step-by-step execution showing each LLM call's full input context, the model's output, each tool call with arguments and results, and cumulative token counts and cost. Trace replay enables reliable reproduction of non-deterministic failures by replaying the exact same inputs with `temperature=0` rather than trying to manually recreate the scenario — the model produces the same failure consistently, allowing testing a fix without waiting for recurrence in production. AgentOps (repo created August 2023, 5,700+ GitHub stars as of July 2026) provides comparable session-level replay with `@agentops.record_action` and `@agentops.record_tool` decorators and a timeline view of every call and state transition.

### How do I debug an AI agent stuck in an infinite loop?

Set `max_iterations=20` on all production agent loops and log the iteration count at every LLM call so you can observe when an agent is approaching the limit. When an agent hits the circuit breaker, examine the last 5–10 tool calls in the trace to determine whether they form a dependency cycle (each call waiting for the other's result), represent repeated retries of the same failed tool call, or show the agent pursuing a different goal than the original task. For dependency cycles, make tool call ordering explicit in the system prompt; for repeated tool error retries, add an explicit abandon instruction ("If a tool fails twice with the same error, report the error as your Final Answer"); for goal confusion, check whether the original user request is still in the context window at the failure step — if it was evicted, apply context compression or the blackboard pattern.

### How do I debug hallucinated tool names in AI agents?

Hallucinated tool names occur when the model emits a tool call with a name not in the registered registry, typically because the system prompt described tools in natural language without specifying exact name strings. The immediate fix: grep logs for `ToolNotFoundError`, extract the hallucinated tool name, and compare it against the registered tool list to determine whether it is a naming mismatch (tool renamed in deployment) or a fully invented name (ambiguous system prompt). The structural fix: update the system prompt to include the exact tool name string alongside each description, and add a `validate_tool_registry()` call at agent startup that raises `ConfigError` if any tool name in the system prompt is not in the registered registry — catching mismatches before the first user request.

### How do I debug context overflow in a long-running AI agent?

Context overflow is the hardest failure to diagnose because the provider often applies automatic truncation without raising an error. Log `gen_ai.usage.input_tokens` at every LLM call and alert when it exceeds 80% of the model's context limit (160,000 tokens for Claude 3.5 Sonnet's 200,000-token window; 102,400 for GPT-4o's 128,000-token window); a sudden drop in `input_tokens` between consecutive steps indicates an eviction occurred. The OpenAI Assistants API is particularly problematic because it applies automatic truncation at approximately 32,000 tokens with no developer-visible eviction policy — what was kept or dropped is invisible to the developer, making post-mortem reconstruction impossible without external logging. Apply context compression proactively: tool result extraction, sliding window history with pinned original request, or the blackboard pattern to keep context at a fixed target size regardless of task length.

### How do I write a useful post-mortem for an AI agent failure?

An effective agent failure post-mortem requires eight components: incident summary (observable user impact), a timestamp-ordered timeline with `trace_id` and step number references, a specific root cause statement citing the exact step and mechanism, contributing factors (what architectural gap made the root cause possible), a detection gap analysis (time from first failure to first alert), the specific fix applied, a regression test added to CI that would have caught the failure, and a prevention measure addressing the failure class. The regression test is the most commonly skipped and most valuable component — a minimal test starting at the divergence step with reconstructed context, verified at `temperature=0`, prevents the same failure class from shipping in future deployments. Without `trace_id` propagation across all LLM calls, tool calls, and blackboard writes, the timeline reconstruction step becomes guesswork.

## Start Debugging with Structured Traces

Agent debugging is state reconstruction. The tools that matter are not error monitors — they are trace replay systems, structured loggers with `trace_id` propagation, and audit logs with per-step attribution.

Set `max_iterations` on every loop. Log `input_tokens` at every LLM call. Put exact tool name strings in every system prompt. Validate the tool registry at startup. Write the regression test before closing the incident ticket.

[Start building on OpenLegion](https://app.openlegion.ai) — `task_id` propagated to every handoff and blackboard write, OTel GenAI spans at every LLM call, vault audit logs for credential access, and `max_iterations` circuit breakers enforced at the mesh layer.
