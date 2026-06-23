---
title: "How to Build an AI Agent: Tools, Credentials, Deployment, and Scheduling"
description: "Build an AI agent step by step: define the agent loop, register tools, configure vault credential injection, set budget caps, deploy to production, schedule with heartbeat cron, and add observability."
slug: /learn/build-ai-agent
primary_keyword: build ai agent
last_updated: "2026-06-23"
schema_types: ["FAQPage"]
related:
  - /learn/what-is-an-ai-agent
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-tool-use
  - /learn/ai-agent-deployment
  - /learn/credential-management-ai-agents
  - /learn/human-in-the-loop-ai-agents
---

# How to Build an AI Agent: Tools, Credentials, Deployment, and Scheduling

Building an AI agent requires more than a system prompt and a tool list. Production-safe agents need credential isolation (so raw API keys never enter the agent's context window), budget caps enforced at the infrastructure layer, structured stopping conditions, and a kill switch. This guide covers seven steps from role definition to production deployment on OpenLegion — the same sequence whether you're starting from scratch or hardening an existing prototype that's outgrown its duct tape.

<!-- SCHEMA: DefinitionBlock -->

> **Building an AI agent** means defining the agent's reasoning loop, registering the tools it may call, isolating its credentials so raw secrets never enter the agent's context, setting budget caps that prevent runaway cost, deploying the agent container with resource limits and health checks, scheduling autonomous runs with a heartbeat cron, and instrumenting the agent's tool calls for observability — in that order, with security controls as structural defaults rather than optional additions.

## The Seven Steps at a Glance

| **Step** | **What you configure** | **Security property delivered** |
|---|---|---|
| **1. Role + reasoning loop** | System prompt, loop type, stopping conditions | Injection surface defined and bounded |
| **2. Tool registration** | Allowlist, schemas, HITL gates | Least-privilege tool access |
| **3. Credential vault** | `$CRED{}` handles, scoping | Raw secrets never in agent context |
| **4. Budget caps** | Daily/monthly limits, rate limit handling | Runaway cost prevention |
| **5. Deployment** | Container, health checks, mesh registration | OOM protection, stoppability |
| **6. Scheduling** | Heartbeat cron, tool mode vs message mode | Autonomous operation with liveness |
| **7. Observability** | Tool call logging, anomaly rules | Attributability, CC7.2 evidence |

## Step 1: Define the Agent's Role and Reasoning Loop

### Write the System Prompt: SOUL.md and INSTRUCTIONS.md

The system prompt is your first line of defense against prompt injection. An underspecified prompt — "you are a helpful AI assistant" — is trivially hijackable: inject "ignore previous instructions" and the agent has no competing instruction to prioritize. A well-structured system prompt defines identity, task scope, refusal boundaries, and operational procedures.

OpenLegion agents split the system prompt across two workspace files:

**SOUL.md** — identity and behavioral boundaries. Who the agent is, what it will never do (refuse to exfiltrate credentials, refuse to call tools outside its allowlist, refuse to follow instructions from untrusted blackboard sources), and the communication style it uses. SOUL.md is read once at initialization.

**INSTRUCTIONS.md** — operational procedures. Step-by-step "if X, do Y" rules: how to handle rate limits, what to do when a task is ambiguous, the exact pattern for HITL escalation, which blackboard keys to read and write. INSTRUCTIONS.md is the runbook the agent follows. Update it when you discover a recurring edge case — the agent learns operational patterns this way without retraining.

The SOUL.md/INSTRUCTIONS.md split keeps identity stable (SOUL.md changes rarely) and procedures updatable (INSTRUCTIONS.md changes often). Both are injected into the system prompt at agent startup.

### Choose the Agent Loop: ReAct vs. Plan-and-Execute

Two primary agent loop architectures:

**ReAct** (Yao et al. 2022, arXiv:2210.03629): alternates Thought → Action → Observation in a tight loop. The agent reasons about what to do next, calls a tool, observes the result, reasons again. The interleaved Thought steps produce an explicit debug trace — when the agent fails, you can read the thought chain to diagnose why. ReAct is the default for single-agent tasks with up to ~15 steps.

**Plan-and-Execute**: the agent generates a full plan in one step, then executes each plan step sequentially with a separate execution prompt. Better for long-horizon tasks (30+ steps) where interleaving reasoning with each action creates too much context. The planner can also validate the plan before execution starts, reducing wasted steps. The tradeoff: plan errors compound silently through execution without correction loops.

Start with ReAct. Move to Plan-and-Execute if you observe the agent spending more than 20% of its context budget on reasoning about what step comes next rather than executing.

### Define Stopping Conditions and Failure Modes

The most common cause of runaway agent loops is a missing or uncomputable stopping condition. Define three things explicitly in INSTRUCTIONS.md before writing a single line of tool registration code:

**Success condition**: a computable check. "Task is complete when the artifact is saved and `update_status(state=done)` is called" — not "when the work is finished." The agent must be able to evaluate the success condition programmatically at each iteration.

**Failure conditions**: distinction between stop-and-report vs. retry-and-continue. Rate limit errors → wait and retry up to 3 times. Tool unavailability → stop and report. Invalid input data → stop immediately, do not retry. Each failure mode needs a documented response.

**Hard iteration cap**: LangChain's `AgentExecutor` defaults to `max_iterations=15`. Treat this as a starting point, not a permanent limit. For tasks that legitimately require 30 steps, set the cap at 40 (1.3× headroom). For tasks that should complete in 5 steps, set it at 10. A misconfigured cap is a budget drain: 15 iterations of a $0.50-per-call tool costs $7.50 per failed run.

## Step 2: Register Tools — Capabilities and Constraints

### The Tool Allowlist: Only What the Task Requires

Every tool the agent can call is a potential misuse vector. OWASP LLM06 (Excessive Agency, LLM Top 10 2025) identifies over-permissioned agents as the primary governance failure mode. Before registering any tool, write a one-sentence justification for why this specific agent role requires it.

Tool risk categories, in ascending order:

| **Category** | **Example tools** | **Default gate** |
|---|---|---|
| **Read** | `web_search`, `read_blackboard`, `read_file` | None — low risk |
| **Write** | `write_file`, `write_blackboard`, `memory_save` | None — reversible |
| **Side-effect** | `http_request` (POST), `send_email`, `commit_file` | HITL recommended |
| **Spawn** | `spawn_fleet_agent`, `spawn_subagent` | HITL required |

Any tool in the side-effect or spawn category should require a HITL gate before execution in production. The cost of a confirmation step is low; the cost of an unintended mass-email or erroneous repository commit is high.

Remove any tool from the allowlist that does not have a one-sentence justification written in the role definition document. That document is your OWASP LLM06 compliance artifact.

### Tool Schemas: Precise Descriptions Reduce Hallucination

Each tool registration requires four fields. The fourth is the most-neglected:

```python
tool_schema = {
    "name": "commit_file",
    "description": "Commits a single file to a GitHub repository. Use after "
                   "content has been validated locally. Do NOT use for draft "
                   "content, experimental changes, or files containing "
                   "$CRED{} handles.",
    "parameters": {
        "repo": {"type": "string", "description": "owner/repo format"},
        "path": {"type": "string", "description": "File path within repo"},
        "content": {"type": "string", "description": "File content to commit"},
        "message": {"type": "string", "description": "Commit message"}
    },
    "returns": "Commit URL on success, error string on failure"
}
```

The `"Do NOT use for..."` clause in the description is the field that reduces hallucinated calls. Precise descriptions of when a tool should not be used cut hallucinated tool invocations by 30–60% in observed deployments, because the model can evaluate its current situation against the exclusion conditions before deciding to call the tool.

### Irreversible Tool Gates: HITL Before Destructive Actions

For any tool whose effects cannot be reversed — repository commits, external API POSTs, email sends, database writes — add an explicit HITL gate pattern in INSTRUCTIONS.md:

```markdown
Before calling commit_file, send_email, or any http_request with method POST:
1. Call update_status(state="working", summary="Proposed: [describe the action]")
2. Wait 30 minutes for a steer message from the operator
3. If no steer received: call update_status(state="blocked", summary="Awaiting approval for [action]")
4. If steer says proceed: execute the tool call
5. If steer says cancel: update_status(state="done", summary="Action cancelled by operator")
```

This pattern implements the [human-in-the-loop approval gate](/learn/human-in-the-loop-ai-agents) at the instruction level rather than requiring framework changes. The agent reads the pattern from INSTRUCTIONS.md and applies it autonomously.

## Step 3: Configure Credential Vault — Zero Raw Secrets in Agent Context

### Storing Credentials: vault_generate_secret and request_credential

Two methods for getting credentials into the vault, both producing opaque `$CRED{name}` handles that never return the raw value:

**`vault_generate_secret(name, length=32)`**: generates a cryptographically random secret and stores it in the vault. Use for internal secrets: webhook signing keys, inter-service tokens, database passwords the agent itself needs to provision. The generated secret is written to the vault and never returned to the agent or to any log.

**`request_credential(name, service, description)`**: prompts the operator to enter an existing API key through a secure input channel. The operator types the key into an encrypted UI field; the value goes directly to the vault. The agent receives the `$CRED{name}` handle. No log, no transcript, no blackboard entry contains the raw value.

After either call, the credential is accessible only as a handle. `vault_list()` returns credential names, not values. There is no method to retrieve a raw secret once stored — by design.

### Using $CRED{} in Tool Calls: Network-Layer Injection

Pass `$CRED{name}` handles directly in tool call arguments anywhere a secret is needed:

```python
http_request(
    url="https://api.openai.com/v1/chat/completions",
    method="POST",
    headers={"Authorization": "Bearer $CRED{openai_key}"},
    body=json.dumps({"model": "gpt-4o", "messages": [...]})
)
```

The mesh intercepts the outbound request before it leaves the agent's network namespace. It resolves `$CRED{openai_key}` from Zone 2 (credential vault), substitutes the actual key into the Authorization header, and forwards the request. The agent process sees only the handle string. The request log records the handle, not the resolved value.

This is the SOC 2 CC6.1 control: credential access is restricted to authorized callers and not visible to the agent container that uses the credential. An agent compromised by prompt injection cannot exfiltrate a key it has never possessed.

### Credential Scoping: One Credential Per Service Per Role

Name credentials with the pattern `{service}_{role}_{env}`:
- `openai_researcher_prod`
- `github_publisher_prod`
- `stripe_billing_read_staging`

One credential per service per role means: a compromise of the `researcher` agent role does not expose the `publisher` role's GitHub token. Rotation of the `publisher` token does not require touching the `researcher` configuration. Audit logs that include the credential name attribute actions to the specific role that made them, not just to "an agent."

Fleet agents spawned by a parent agent inherit the parent's credential access by default. Override this explicitly: when spawning a sub-agent that should have narrower access, pass a `credential_scope` parameter limiting which handles it can resolve. This prevents a spawned agent from inheriting write credentials it doesn't need for its task.

## Step 4: Set Budget Caps and Rate Limits

### Calculate and Set Per-Agent Budget Caps

Budget caps prevent unbounded spend when an agent loops, retries excessively, or is compromised. Calculate your cap before deployment:

```
Expected daily cost = avg_tokens_per_task × tasks_per_day × (price_per_1M_tokens / 1,000,000)
Cap = Expected daily cost × 3–5 (safety multiplier)
```

Example: agent processes 20 tasks/day, each consuming ~50K tokens at gpt-4o pricing ($5/1M input + $15/1M output, blended ~$10/1M):
- Expected daily cost: 20 × 50,000 × ($10 / 1,000,000) = $10/day
- Cap: $30–50/day

OpenLegion enforces $50/day and $200/month per agent at Zone 2 (Cost Tracker) by default. These limits are not bypassable by agent code — the LLM proxy rejects calls once the cap is reached. At 80% of the daily cap, an alert fires to the designated operator.

Never set "unlimited." An agent that can spend without limit converts any runaway loop from an operational nuisance to an unbound financial liability.

When the cap is hit, the agent suspends and calls `update_status(state="blocked", summary="Daily budget cap reached")`. The operator receives a notification and decides whether to reallocate budget or investigate the spend pattern before resuming.

### LLM API Rate Limit Handling: Circuit Breaker Pattern

Document the rate limit handling pattern explicitly in INSTRUCTIONS.md — the agent reads and follows it:

```markdown
## Rate Limit Handling

If an LLM API call returns HTTP 429 (Too Many Requests):
1. Check the Retry-After header. If present, wait that many seconds.
2. If no Retry-After, wait 2^(attempt) seconds (2s, 4s, 8s for attempts 1, 2, 3).
3. Maximum 3 retries. On the 3rd consecutive 429:
   - Call update_status(state="blocked", summary="LLM API rate limit exhausted after 3 retries")
   - Stop processing until operator steers to continue or wait period passes.
4. Never retry non-rate-limit 4xx errors (400, 401, 403, 422) — these require operator intervention.
```

This instruction-level circuit breaker complements the Zone 2 infrastructure circuit breaker (which trips after 5 consecutive 429s across all agents on the same API key). The instruction-level version catches rate limits at the single-agent level before they propagate to the infrastructure breaker.

## Step 5: Deploy to Production — Container, Health Checks, and Mesh Registration

### Mesh Registration: spawn_fleet_agent vs. Heartbeat Agent

Two deployment modes for production agents:

**`spawn_fleet_agent()`**: task-scoped ephemeral agent. Spawned on demand, runs to completion, auto-cleaned up at `ttl` expiry. Use for work that arrives irregularly — processing a document, running a research task, handling a webhook. The spawning agent passes task parameters and receives results when the fleet agent completes.

```python
result = spawn_fleet_agent(
    role="research-agent",
    task="Research competitors for {company} and write findings to blackboard key research/{company}",
    ttl=3600
)
```

**Heartbeat agent**: persistent agent with a cron schedule. Registered once, wakes on schedule, runs its task, goes back to sleep. Use for recurring work — daily reports, monitoring checks, content pipeline steps. The heartbeat is the scheduling primitive for autonomous operation.

### Container Resource Limits and Health Checks

Every production agent container needs explicit resource limits. Without limits, a runaway loop consumes all available host memory and takes down co-located containers. Starting values from OpenLegion's default templates:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

Measure p95 memory on your actual task set and set limits at p95 × 2. OOM kills are silent in Kubernetes — the pod is evicted with `OOMKilled` and in-progress work is lost.

Health check configuration for agent containers:

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 5
  failureThreshold: 12
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 10
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  periodSeconds: 30
  failureThreshold: 5
```

OpenLegion agents achieve cold start (heartbeat trigger to first tool call) in under 500ms for dependency-light configurations. Model-loading agents will need a longer startup probe window — measure actual startup time before setting `failureThreshold`.

### The Kill Switch: Documented and Tested

Before deploying any agent to production, document and test the kill switch procedure. EU AI Act Article 14 requires the ability to intervene and stop AI systems. A kill switch that exists only in documentation does not satisfy the requirement.

For OpenLegion: `steer(agent_id="...", message="HALT")` sends an immediate halt signal. The agent stops processing, logs its current state to the audit trail, and calls `update_status(state="done", summary="Halted by operator")`.

For Kubernetes: `kubectl delete pod <agent-pod-name>` with a SIGTERM handler that logs the halt event. Set `terminationGracePeriodSeconds` to at least the p95 task duration so in-flight work can complete.

Test the kill switch monthly. A kill switch no one has exercised is not a kill switch.

## Step 6: Schedule Autonomous Runs — Heartbeat Cron

### Three Scheduling Modes: Tool Mode, Message Mode, and Heartbeat Mode

OpenLegion's `set_cron` supports three modes for different scheduling patterns:

**Tool mode** (`tool_name` parameter): the scheduler calls a specific tool directly on each tick — no LLM inference, no token cost. Use for deterministic actions: polling a status endpoint, writing a heartbeat to the blackboard, sending a notification.

```python
set_cron(
    schedule="every 5m",
    tool_name="write_blackboard",
    tool_params=json.dumps({"key": "heartbeat/monitor-agent", "value": "alive"})
)
```

**Message mode** (`message` parameter): the scheduler sends a message to the agent on each tick. The agent wakes, processes the message with full LLM reasoning, and goes back to sleep. Use for tasks that require judgment: "check if any new briefs need processing."

```python
set_cron(
    schedule="every 4h",
    message="Check briefs/ for unprocessed entries. Write any missing pages and hand off to page-validator."
)
```

**Heartbeat mode** (`heartbeat=True`): updates the agent's own autonomous wakeup schedule. Change this only when the operator explicitly asks — each heartbeat call costs API credits.

### Scheduling Patterns for Common Agent Types

| **Agent type** | **Schedule** | **Mode** | **Rationale** |
|---|---|---|---|
| Daily content pipeline | `0 8 * * *` | Message | Needs judgment on task selection |
| Status heartbeat | `every 5m` | Tool | Deterministic, zero inference cost |
| Weekly report | `0 9 * * 1` | Message | Monday 9am, needs reasoning |
| Monitoring alert check | `every 15m` | Tool | Write to blackboard if threshold exceeded |
| Hourly task drain | `0 * * * *` | Message | Check inbox and process pending work |

For message-mode schedules, write the message as a specific trigger with expected output. Vague messages ("do your work") produce inconsistent behavior because the agent must infer what work means at each tick.

### Idempotency and Run Deduplication

Scheduled agents must be idempotent: running the same task twice produces the same result without side effects. Design for this from the start:

- Before processing a task, check if a result already exists in the blackboard. If yes, skip.
- Use a `run_id` derived from task content hash rather than timestamp. The same task gets the same `run_id`, and a dedup check prevents re-processing.
- For side-effect tools (commits, emails, API POSTs), store a `sent_at` timestamp in the blackboard keyed by the action's content hash.

Idempotency makes your agent safe to restart after a crash, safe to run at higher frequency for testing, and safe to replay during debugging.

## Step 7: Add Observability — Tool Call Logging and Anomaly Rules

### What to Log at Every Tool Call

Each tool call should produce a structured log entry. Minimum fields for production observability:

```python
log_entry = {
    "timestamp_utc_ms": int(time.time() * 1000),
    "agent_id": AGENT_ID,
    "agent_role": AGENT_ROLE,
    "tool_name": tool_name,
    "tool_args_sanitized": redact_credentials(tool_args),
    "result_status": "success" | "error" | "timeout",
    "duration_ms": elapsed,
    "llm_tokens_used": tokens,
    "cost_usd": cost,
    "session_id": SESSION_ID,
}
```

The `tool_args_sanitized` field is critical: log the argument structure but redact any field that might contain resolved credential values. An agent that logs its HTTP headers after credential injection would expose secrets in the log aggregator — the exact exposure the vault proxy prevents.

OpenLegion automatically appends every tool call to the agent's append-only audit trail. The [AI agent observability guide](/learn/ai-agent-observability) covers querying audit trails and setting threshold-based anomaly alerts.

### Three Anomaly Rules to Set From Day One

Configure these three alert rules before your agent goes to production:

**Rule 1 — Tool call rate spike**: alert when the agent makes more than 2× its baseline number of tool calls per hour. Cause: retry loop. Response: check the audit trail for the repeated call and fix the failure mode in INSTRUCTIONS.md.

**Rule 2 — Unexpected tool category**: alert when the agent calls a tool outside its expected categories. Cause: prompt injection directing the agent to use tools outside its task scope. Response: check the full session transcript, rotate credentials if any side-effect tools were called.

**Rule 3 — Cost spike**: alert when per-task cost exceeds 3× the rolling average. Cause: context window bloat, unexpected multi-step expansion, or a task distribution shift. Response: review the task that triggered the spike and check whether the stopping conditions need tightening.

All three rules require a log stream with per-tool-call cost attribution. Without cost per tool call in the log, Rule 3 is undetectable until the daily cap is hit.

## OpenLegion's Take

The seven steps above are sequential because the security properties are sequential: you cannot scope credentials before the tool allowlist exists, cannot set budget caps before knowing what tools cost, cannot configure health checks before knowing resource requirements. Teams that skip steps — typically credential management and budget caps — build agents that work in prototypes and fail in production when a retry loop or prompt injection occurs.

The prototype-to-production gap is smaller than it looks. Installing `openlegion>=0.4.0`, configuring `$CRED{}` handles, and setting a daily budget cap takes under an hour for an existing agent. The SOUL.md/INSTRUCTIONS.md refactor of an existing system prompt takes another hour. Health check configuration and kill switch documentation add a third. A prototype that's been running for a week can be production-grade in a day.

A TypeScript SDK is available for teams building agents in Node environments. The configuration model is identical — SOUL.md, INSTRUCTIONS.md, `$CRED{}` handles, same scheduling primitives — with TypeScript types for all tool call signatures.

For the framework selection decision that precedes this guide, see [AI agent frameworks](/learn/ai-agent-frameworks). For the tool use patterns that inform Step 2's allowlist design, see [AI agent tool use](/learn/ai-agent-tool-use). For the credential management patterns that back Step 3 in detail, see [credential management for AI agents](/learn/credential-management-ai-agents).

## Get Started

**Build your first production-safe agent in under an hour.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [What Is an AI Agent?](/learn/what-is-an-ai-agent)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What do I need before I can build an AI agent?

You need three things: a clear definition of what task the agent will perform (narrow beats broad), an API key for the LLM you plan to use, and a list of tools the agent needs to complete the task. Everything else — credential isolation, budget caps, health checks, scheduling — is configuration that follows from these three inputs. Install `openlegion>=0.4.0` (or equivalent framework), write a SOUL.md defining the agent's identity, and write an INSTRUCTIONS.md defining its task procedures before writing any tool registration code.

### How do I prevent my AI agent from spending too much money?

Set a per-agent budget cap at the infrastructure layer before the agent makes its first production LLM call. Calculate expected daily spend (average tokens per task × tasks per day × price per token), then set the cap at 3–5× that estimate. In OpenLegion, the Zone 2 Cost Tracker enforces $50/day and $200/month per agent by default — these limits are not bypassable by agent code. When the cap is hit, the agent suspends and alerts the operator rather than continuing to spend.

### What is a $CRED{} handle and why should I use it instead of environment variables?

A `$CRED{name}` handle is an opaque token that references a secret stored in the credential vault. The handle never contains the raw key value. When the agent passes a handle in an HTTP request header, the mesh resolves the handle to the actual key at the network layer before forwarding the request — the agent process never sees the plaintext secret. Environment variables are visible via `docker inspect`, logged by debugging statements, and exfiltrable through prompt injection. The `$CRED{}` pattern eliminates all three exposure vectors.

### What is the difference between spawn_fleet_agent and a heartbeat agent?

`spawn_fleet_agent()` creates a task-scoped ephemeral agent: it runs to completion and auto-terminates at the configured TTL (default 3,600 seconds). Use it for on-demand work — processing a document, handling a webhook, running a research task. A heartbeat agent is a persistent scheduled agent with a cron expression. It wakes on schedule, runs its configured task, and sleeps until the next tick. Use heartbeat agents for recurring work: daily content pipeline, monitoring checks, periodic reports.

### How do I choose between ReAct and plan-and-execute for my agent loop?

Start with ReAct (Yao et al. 2022, arXiv:2210.03629): it interleaves Thought/Action/Observation steps, producing an explicit debug trace at each step. ReAct is easier to debug and works well for tasks up to ~15 steps. Switch to plan-and-execute if your tasks have 30+ steps and the agent spends more than 20% of its context budget on meta-reasoning about the next step rather than executing. Plan-and-execute generates a full task plan upfront, then executes each step with a separate executor — better for long-horizon tasks where compounding reasoning overhead becomes costly.

### What tools should I register for a new agent?

Register the minimum set that enables the task — nothing more. Write a one-sentence justification for each tool before registering it; this is your OWASP LLM06 compliance artifact and prevents permission creep over time. Categorize tools by risk: read tools carry low risk; write tools are reversible; side-effect tools (HTTP POST, email, repository commit) require a HITL gate before execution; spawn tools require HITL in all cases. Remove any tool that cannot be justified by the specific task requirements.

### How do I test a kill switch for my production agent?

On OpenLegion, send a `steer(agent_id="...", message="HALT")` signal to a running agent during a scheduled test window. Verify the agent stops processing, logs its current state to the audit trail, and calls `update_status(state="done", summary="Halted by operator")`. On Kubernetes, verify `kubectl delete pod <name>` terminates the agent within the configured `terminationGracePeriodSeconds` and that the SIGTERM handler runs the drain procedure before exit. Run this test monthly. EU AI Act Article 14 requires tested, functional human oversight mechanisms — a documented but untested kill switch does not satisfy the requirement.

### How do I add observability to an agent I've already built?

Add structured logging at every tool call: timestamp, agent ID, tool name, sanitized arguments (with credential handles, not resolved values), result status, duration, and cost if an LLM call. Set three alerting rules: tool call rate spike (>2× baseline per hour), unexpected tool category call, and per-task cost spike (>3× rolling average). Route logs to an append-only store — not a mutable database — for audit trail integrity. If adding observability post-hoc, the minimum viable starting point is logging tool name, status, and cost per call, then adding anomaly rules once you have 100+ calls of baseline data to calibrate against.
