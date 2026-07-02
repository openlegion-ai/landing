---
title: "Agentic Loop — Perceive, Think, Act: The Core Agent Runtime Explained"
description: "How the agentic loop works: perceive-think-act iteration cycle, ReAct mechanics, iteration budgets, runaway prevention, CVE-2024-5184 tool-response injection, OpenAI max_turns, and fleet spend caps."
slug: /learn/agentic-loop
primary_keyword: agentic loop
last_updated: "2026-07-01"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/agentic-ai-design-patterns
  - /learn/ai-agent-tool-use
  - /learn/ai-agent-security
  - /learn/ai-agent-reliability
  - /learn/ai-agent-planning
---

# Agentic Loop: Perceive, Think, Act — The Core Agent Runtime

The agentic loop is the repeating perceive-think-act iteration cycle that drives every AI agent runtime — the agent observes, generates a reasoning step and action, executes via a tool call, receives the result as a new observation, and repeats. It is simultaneously the primary cost surface and the primary attack surface in production: every iteration charges a full LLM call on a growing context window, every tool response re-enters as input, and loops require external budget enforcement because agents cannot reliably self-terminate.

<!-- SCHEMA: DefinitionBlock -->

> **The agentic loop** is the repeating perceive-think-act iteration cycle at the core of every AI agent runtime — on each iteration, the agent receives an observation (tool result, user message, or environment state), generates a reasoning step and selects an action, executes the action via a tool call, receives the tool result as the next observation, and repeats until a termination condition is met or an external budget is exhausted.

## The Perceive-Think-Act Cycle: One Iteration in Detail

### Perceive: What Enters the Context Window Each Iteration

On each loop iteration the agent's context window contains the full accumulated state of all previous iterations plus the new observation. On iteration 1, the context window holds the system prompt, tool schemas, and the initial user message. On iteration N, it holds all of that plus every Thought, Action, and Observation from iterations 1 through N-1, plus the current Observation (the tool result from iteration N-1).

Context window growth is a hard upper loop limit that exists regardless of any configured iteration budget. A Claude 3.5 Sonnet context window caps at 200,000 tokens. With a 3,000-token system prompt and tool schemas plus 1,500 tokens per iteration (Thought ≈ 300, Action ≈ 200, Observation ≈ 1,000 tokens typical), the window exhausts at approximately 132 iterations. In practice, loops running past 20–30 iterations are almost always stuck in an error-recovery failure mode, not making genuine progress. The context window limit is a backstop, not a production loop control.

The system prompt and tool schemas are typically cached after iteration 1 (Anthropic prompt caching at 90% discount, OpenAI prefix caching at 50%) — so the per-iteration cost accrues primarily on the Thought-Action-Observation triples added each iteration, not on re-reading the system prompt every time.

For how agentic loops connect into sequential, parallel, and conditional pipeline structures, see [agentic workflow design and pipeline topology](/learn/agentic-workflows).

### Think: The LLM Call That Generates Thought and Action

The think step is the LLM API call that takes the full current context window and generates the next Thought (a reasoning trace about what to do) and Action (a specific tool call, or a final answer). Every think step is charged at the full accumulated context window token count — not just the new tokens added this iteration.

On iteration N, with a 3,000-token system prompt + 1,200 tokens per iteration average: iteration 1 charges 3,000 + 1,200 = 4,200 input tokens; iteration 10 charges 3,000 + (10 × 1,200) = 15,000 input tokens; iteration 20 charges 3,000 + (20 × 1,200) = 27,000 input tokens. At Claude 3.5 Sonnet $3.00/million input tokens: iteration 1 ≈ $0.013; iteration 10 ≈ $0.045; iteration 20 ≈ $0.081. The per-iteration cost nearly doubles every 5 iterations at typical Observation sizes. This compounding structure makes runaway loops an acute spend risk — the cost of a 20-iteration storm is not 20× the cost of iteration 1, it is closer to 7× as much due to the growth in accumulated context.

For the planning algorithms that structure the think step — STRIPS, HTN, and hierarchical goal decomposition — see [AI agent planning and goal decomposition for loop task design](/learn/ai-agent-planning).

### Act: Tool Execution and the Observation Re-Entry Point

The act step dispatches the tool call generated in the think step and returns the tool result. That result becomes the Observation for the next loop iteration — it is appended to the context window and fed back into the next LLM call as trusted environmental feedback.

This re-entry point is the loop's primary security surface. Any adversarial content in the tool result enters the agent's context window on the next think step alongside the agent's own accumulated reasoning. If the tool response contains instruction-style content, the LLM incorporates it into the next Thought and generates a new Action based on the injected instruction — CVE-2024-5184 (Palo Alto Unit 42, May 2024) demonstrates this attack vector at production severity. The tool result must be treated as untrusted input and sanitized before re-entry, regardless of whether it came from an internal or external tool.

Sanitization requirements before every tool result enters the context window: truncate to a maximum length (2,000 tokens is a workable ceiling for most tools); strip any content matching prompt-injection patterns (`Ignore previous instructions`, `Your new task is`, `You are now`, `System:`); wrap tool results in a structured format that separates tool output from instruction-style content.

For tool schema design including error response formats and idempotency requirements, see [AI agent tool use and tool schema design](/learn/ai-agent-tool-use).

## ReAct: The Academic Foundation of the Agentic Loop

### Yao et al. 2022: Formalizing Thought-Action-Observation

ReAct (Reasoning + Acting), Yao et al. 2022, arXiv:2210.03629, Google Brain and Princeton, presented at ICLR 2023 — the academic formalization of the agentic loop as an interleaved Thought-Action-Observation sequence.

Before ReAct, LLM agents either reasoned without acting (chain-of-thought: the model generated a reasoning trace but made no tool calls, grounding its conclusions in its own priors) or acted without explicit reasoning (action-only: the model called tools but had no reasoning trace explaining why). ReAct's contribution: grounding each Thought in the Observation from the previous Action prevents the agent from reasoning past incorrect assumptions. If a tool result contradicts the agent's expectation, the next Thought reckons with the actual tool result — it cannot hallucinate past it.

Benchmark results from the paper: HotpotQA multi-hop question answering — 57.1% exact match with ReAct vs 43.2% chain-of-thought-only (+14 percentage points). FEVER fact-checking — 75.4% vs 66.4% (+9 points). The improvements come directly from observation grounding: the Thought after a Wikipedia retrieval call incorporates what the retrieval actually returned, not what the model expects it to say.

The paper models the loop as a sequence of steps indexed by t, with the Finish action as the natural termination condition. The academic model does not specify external loop budget enforcement — it assumes the agent will self-terminate via Finish. Production experience showed this assumption fails under three specific conditions that do not appear on benchmark tasks.

For the full taxonomy of design patterns built on top of the ReAct loop — Plan-and-Execute, Reflexion, Critic-Actor, Supervisor-Worker, Mixture-of-Agents — see [agentic AI design patterns including ReAct and Plan-and-Execute](/learn/agentic-ai-design-patterns).

### From Research to Runtime: What the Papers Don't Cover

ReAct and subsequent agentic loop research evaluate on benchmark tasks with clear termination conditions: the correct answer either exists or it doesn't, and the agent terminates when it generates a Finish action containing the answer. Production deployments have ambiguous termination conditions, external systems that return errors rather than answers, and adversarial inputs.

Three production failure modes absent from the ReAct model:

**1. Error retry storm.** The agent calls a tool that returns a transient error. The agent interprets the error as "try again" and calls the same tool with identical parameters on the next iteration. The tool returns the same error. The loop continues until the iteration budget terminates it. No natural termination condition is ever met — there is no Finish action to generate while the tool is failing. The academic model has no mechanism for this case.

**2. Plan revision loop.** The agent's goal is underspecified — the task is open-ended enough that the agent cannot determine when it has "done enough." On each iteration the agent determines that its current plan is incomplete, revises the plan, executes one step, determines the plan still needs revision, and repeats. The agent is perpetually planning rather than completing. Again, no Finish action is generated.

**3. Loop injection via adversarial tool response.** An adversarially crafted tool result (CVE-2024-5184) redirects the agent's next Thought onto an attacker-controlled task. The agent now has a new goal injected at the Observation re-entry point, and it will pursue that goal through subsequent iterations until budget exhaustion or completion.

All three failure modes require external loop budget enforcement. The academic loop model does not provide it. Production agents must supply it.

## Loop Termination: Five Conditions and One Hard Stop

### Natural Termination Conditions

Five legitimate conditions that terminate the agentic loop:

**1. Finish action.** The agent generates a final answer rather than a tool call — the most common natural termination. The agent determines it has sufficient information to respond to the user's request and generates a response instead of dispatching another tool call.

**2. Task completion signal.** A tool returns an explicit completion status — for example, a long-running code execution job returns `{"status": "completed", "output": "..."}`. The agent recognizes the signal and generates a response summarizing the result.

**3. Human-in-the-loop interrupt.** The agent reaches a designated checkpoint — about to take an irreversible action (send an email, write to a database, execute a payment) — and requests human approval. The human approves (loop continues) or denies (loop terminates with an explanation of why the action was not taken). Anthropic's 2025 agent documentation explicitly recommends HITL interrupt points before irreversible actions as a mandatory production control.

**4. Tool unavailability.** All tools return errors and the agent has no viable action available. A well-designed agent generates a "cannot complete" response explaining which tool failed and what was attempted. Poorly designed agents re-attempt the unavailable tool instead — this is the entry point for error retry storms.

**5. Context window exhaustion.** The accumulated context reaches the model's maximum context length and the API returns a `context_length_exceeded` error. The loop terminates with an error rather than a graceful conclusion. This is a legitimate termination condition but an undesirable one — it means the loop has been running long enough to fill the context window, which is almost certainly an error state.

Conditions 4 and 5 are legitimate but frequently handled poorly. They are the natural conditions most likely to trigger an error retry storm rather than a clean termination.

### The Hard Stop: Iteration Budget and Spend Cap

The iteration budget is the external enforcement mechanism that terminates the loop when none of the five natural conditions are met. Current framework defaults:

- **OpenAI Agents SDK (2025)**: `max_turns` defaults to 10 — raises `MaxTurnsExceeded` after 10 loop iterations regardless of task completion status. Configurable at agent instantiation. The default of 10 is documented as a safety floor, not a production recommendation; complex multi-step tasks typically require 20–50 turns.
- **LangChain AgentExecutor**: `max_iterations` defaults to 15 in most implementations. Configurable per agent.
- **Anthropic Claude API**: stateless — no built-in loop counter. The orchestrator must maintain the iteration count and enforce a budget. Anthropic's 2025 agent documentation recommends explicit loop budgets as a mandatory production control.
- **AutoGen**: `max_consecutive_auto_reply` defaults to 10 per agent in a conversation.

These are all **application-layer controls** — enforced by the SDK or framework wrapper, not by the LLM provider's infrastructure. An agent making direct API calls that bypass the framework has no default loop limit. A misconfigured `max_turns = 1000` provides effectively no protection.

The spend cap is the infrastructure-layer complement. OpenLegion enforces a per-agent daily budget cap ($0–$50/day, configurable) at Zone 2 before each LLM call — when the cap is exhausted, Zone 2 rejects the next call with a `budget_exceeded` error and the loop hard-stops. This applies regardless of what the agent code requests, regardless of framework configuration, and regardless of whether the agent is making direct API calls or going through a framework. The cap cannot be raised by agent code at runtime — it is set in the agent's `INSTRUCTIONS.md`, committed to the repo, and enforced from the authenticated mesh session context.

The iteration budget and the spend cap are complementary controls. The iteration budget stops loops early regardless of cost. The spend cap stops loops regardless of iteration count when cost is the binding constraint. Both should be configured for every production agent.

### Cycle Detection: Identifying Stuck Loops Before Budget Exhaustion

Cycle detection identifies stuck loops before the full iteration budget is consumed. The simplest approach: if the same tool is called with identical parameters on two consecutive iterations, the agent is in a retry loop.

More sophisticated: hash the `(tool_name, parameters)` tuple on each iteration and store the last N hashes. If the same hash appears within the last N iterations, trigger a loop interrupt. Interrupt options in ascending severity:

1. **Inject a context message**: add a system message to the context window flagging the repeated call — "You have called `tool_name` with these parameters twice in a row. The previous call returned `result`. Please change your approach or report that you cannot complete this task." This is the lowest-cost intervention and resolves most stuck loops without human involvement.

2. **Escalate to HITL**: surface the stuck state to a human-in-the-loop agent for review before consuming more budget.

3. **Hard-stop**: terminate the loop with a diagnostic message containing the last 3 iterations for post-incident review.

On OpenLegion, the blackboard version history provides a natural cycle detection audit trail — every tool call is logged with `agent_id`, `tool_name`, parameters, and timestamp. A watchdog process queries the last N blackboard entries for the agent and detects repeated calls before the iteration budget is exhausted, with zero changes required to agent code.

## The Tool Call Storm: Production Failure Mode

### How Tool Call Storms Start

LangChain's 2025 State of AI Agents report found that 23% of agent failures in surveyed production deployments were caused by infinite tool call loops — the tool call storm anti-pattern. The typical storm sequence:

1. Agent calls a tool that is unavailable, rate-limited, or returning a transient error.
2. The agent interprets the error as "try again" — no explicit error escalation instruction in the system prompt or tool schema.
3. Agent calls the same tool with identical parameters on the next iteration.
4. Tool returns the same error.
5. Repeat.

Each iteration incurs a full LLM call cost (on a growing context window) plus the failed tool call's latency. A 10-iteration storm on a task with 2,000-token accumulated context at Claude 3.5 Sonnet pricing costs approximately $0.20 for a loop that produces zero useful output.

At scale — 1,000 concurrent agents each potentially hitting a tool call storm — the exposure before infrastructure budget caps terminate them is approximately $860 fleet-wide (see cost calculation in the next section).

Prevention requires two controls working together: an error escalation instruction in every tool schema, and an infrastructure-layer loop budget.

The error escalation instruction belongs in the tool schema itself (it is part of the cacheable prefix and applies on every loop iteration without consuming additional tokens at call time):

```
"description": "If this tool returns an error twice consecutively with the same 
parameters, do not retry. Generate a human-readable error report describing what 
was attempted and what failed, and stop the task."
```

This alone resolves most storms. The infrastructure-layer budget cap is the backstop for cases where the agent's error escalation instruction is insufficient.

For retry logic, circuit breakers, and dead-letter queue patterns that prevent tool call storms from within the loop, see [AI agent reliability and circuit breaker patterns for tool failures](/learn/ai-agent-reliability).

### Cost Compounding: Why Runaway Loops Spend Non-Linearly

A concrete cost calculation for a runaway loop on a task with a 3,000-token system prompt and tool schemas, with 1,200 tokens per iteration (Thought ≈ 300, Action ≈ 200, Observation ≈ 700 tokens average):

| **Iteration** | **Input tokens** | **Cost at $3/M** | **Cumulative** |
|---|---|---|---|
| 1 | 4,200 | $0.013 | $0.013 |
| 5 | 9,000 | $0.027 | $0.094 |
| 10 | 15,000 | $0.045 | $0.268 |
| 15 | 21,000 | $0.063 | $0.553 |
| 20 | 27,000 | $0.081 | $0.858 |

A 20-iteration storm per agent costs approximately **$0.86**. For 100 concurrent agents each hitting a 20-iteration storm: **$86** in a few minutes. For 1,000 agents: **$860** before any infrastructure cap terminates them.

Early termination has disproportionate cost impact: stopping at iteration 5 instead of iteration 20 saves approximately **85% of the total storm cost** because the cost per iteration is lowest in the early iterations. The iteration budget should be set as tight as the task allows — not as high as "just to be safe."

## Security: The Observation Re-Entry Attack Surface

### CVE-2024-5184: Prompt Injection via Tool Response

CVE-2024-5184, Palo Alto Unit 42, May 2024, CVSS 8.1 HIGH: prompt injection via tool response hijacking the next agentic loop iteration.

**Attack vector**: an adversarially crafted tool response — a web page the agent fetches via `read_url`, an API response from a compromised or attacker-controlled endpoint, a database record containing injected text — enters the agent's context window as an Observation on iteration N. On the next think step (iteration N+1), the LLM processes the full context window including the injected Observation. If the Observation contains instruction-style content, the LLM incorporates it into the next Thought and generates a new Action based on the injected instruction.

The attack does not require access to the original user prompt or system prompt. It only requires access to any tool output that the agent treats as trusted feedback. A single compromised external endpoint is sufficient to redirect the agent's subsequent iterations onto an attacker-controlled task — data exfiltration, unauthorized tool calls, adversarial messages to downstream systems.

This is OWASP LLM01 Prompt Injection targeting the observation re-entry point of the agentic loop specifically. For the full OWASP LLM Top 10 threat model for agent systems, see [AI agent security and OWASP LLM prompt injection](/learn/ai-agent-security).

### Tool Response Sanitization: The Loop Injection Defense

Three-layer defense against observation re-entry injection, applied before every tool result is appended to the context window:

**Layer 1 — Structural wrapping.** Enclose every tool result in a rigid schema before appending to the context:

```json
{
  "tool": "web_search",
  "call_id": "iter_7_call_1",
  "status": "success",
  "result": "<sanitized tool output here>"
}
```

The structured schema separates tool output from free-form text that the LLM might otherwise interpret as instructions. The `tool` and `call_id` fields anchor the LLM's interpretation: this is a structured data record from a specific tool call, not a message or instruction.

**Layer 2 — Content sanitization.** Before inserting the raw tool output into the `result` field, run it through an injection pattern filter. Strip content matching: `Ignore previous instructions`, `Your new task is`, `Forget your`, `You are now`, `System:`, `SYSTEM:`, `Disregard your training`. Log stripped content to the audit trail with tool name and iteration number for post-incident review. Stripped content that appears in a legitimate tool response is rare and warrants investigation.

**Layer 3 — Length truncation.** Truncate tool responses to a maximum length before appending — 2,000 tokens covers the useful signal in most tool responses. Excessively long responses are the primary mechanism for adversarial content to overwhelm the stable system prompt in a long-running loop: a 15,000-token malicious web page response, if not truncated, dominates the context window on the subsequent iterations and drowns the system instructions.

### Idempotent Tool Calls: Loop-Safe Tool Design

Loop-safe tool design reduces both security risk and cost risk for runaway loops by distinguishing between operations that are safe to repeat and operations that are not.

**Idempotent tools** — safe to call with the same parameters on consecutive iterations: `read_file`, `web_search`, `get_weather`, `query_database` (SELECT only), `fetch_url`. Calling these repeatedly in a stuck loop causes cost and latency waste, but no real-world side effects.

**Non-idempotent tools** — dangerous in runaway loops: `send_email`, `write_file`, `delete_record`, `post_message`, `execute_payment`. Calling these in a stuck loop causes real-world damage: duplicate emails, data corruption, repeated financial transactions, unintended public posts.

Three mitigations for non-idempotent tools in production loops:

1. **Critic-Actor gate**: a separate evaluation agent that confirms the call is intentional before Zone 2 dispatches it. The Actor proposes the action; the Critic approves or blocks it. A stuck loop calling `send_email` 10 times will trigger the Critic on the second call — the Critic sees that this email was already sent in this loop run and blocks the repeat.

2. **Per-tool call-count limit within a loop run**: a counter stored in the loop state that blocks a non-idempotent tool after N calls per loop execution. `send_email` max 1; `write_file` max 3 (one create, two updates is reasonable; ten writes is a storm). The limit is enforced at Zone 2, not by agent code.

3. **Idempotency key**: include a deterministic key derived from `task_id` and call count in every non-idempotent tool call. The tool backend deduplicates on the key — if the same idempotency key arrives twice (because a stuck loop called the tool twice), the backend returns the original result without executing the operation again.

## Configuring Loop Budgets: Framework Defaults and Infrastructure Controls

### Framework Defaults: OpenAI, Anthropic, LangChain

Current framework defaults for loop iteration limits (2025):

| **Framework** | **Default limit** | **Parameter** | **Layer** |
|---|---|---|---|
| OpenAI Agents SDK | 10 | `max_turns` | Application |
| LangChain AgentExecutor | 15 | `max_iterations` | Application |
| AutoGen | 10 | `max_consecutive_auto_reply` | Application |
| Anthropic Claude API | None (stateless) | Orchestrator responsibility | — |
| OpenLegion Zone 2 | $0–$50/day spend cap | Per-agent config | Infrastructure |

OpenAI documents `max_turns = 10` as a safety default, not a production recommendation. Complex multi-step tasks typically require 20–50 turns. Increasing `max_turns` in the OpenAI Agents SDK is one line at agent instantiation: `agent = Agent(max_turns=30)`. The risk is that developers increase `max_turns` to resolve task failures without adding the complementary spend cap at the infrastructure layer — replacing a tight application-layer limit with a looser one, without adding an infrastructure-layer backstop.

Anthropic's stateless API design reflects a deliberate architectural choice: loop management is the orchestrator's responsibility, not the API's. Anthropic's 2025 agent documentation recommends three specific controls: (1) an explicit iteration counter maintained by the orchestrator, incremented on every LLM call, with a configured maximum; (2) `max_tokens_per_tool_call` to prevent individual tool responses from growing unboundedly and consuming the context window; (3) human-in-the-loop interrupt points before irreversible actions.

### Setting Iteration Budgets for Production Tasks

Production iteration budget calibration: measure the typical iteration count for the task type in staging before setting a production budget. The production budget should be `typical_iterations × 1.5` (50% headroom for legitimate variance), with a hard stop at `typical_iterations × 3` — beyond which the loop is almost certainly stuck.

Task type guidelines:

- **Simple Q&A with 1–2 tool calls**: max_turns = 5
- **Research tasks with web search**: max_turns = 15–25
- **Code generation + test + fix loops**: max_turns = 30–50
- **Open-ended autonomous tasks**: max_turns = 50 + infrastructure spend cap as the ultimate backstop

The spend cap does not replace the iteration budget — it is the backstop when the iteration budget is misconfigured (too high), bypassed (direct API calls), or when the iteration count alone understates the cost risk (a loop with 30 turns on a task with large Observations can cost more than a loop with 100 turns on a task with small Observations). Both controls should be set.

## OpenLegion's Take: Budget the Loop at the Infrastructure Layer

The agentic loop is not just the mechanism that makes agents useful — it is the primary attack surface and the primary cost liability in every production agent deployment.

**On cost**: LangChain's 2025 State of AI Agents report found that 23% of agent failures in production were caused by infinite tool call loops. A 20-iteration storm per agent costs approximately $0.86 at Claude 3.5 Sonnet pricing. At 1,000 concurrent agents, that is $860 before any infrastructure cap terminates them. Early termination at iteration 5 instead of 20 saves 85% of storm cost. These are not theoretical numbers — they are the bill that arrives at the end of the month when iteration budgets are set too high or spend caps are absent.

**On security**: CVE-2024-5184 (CVSS 8.1, Palo Alto Unit 42, May 2024) demonstrated that the Observation re-entry point of the agentic loop is an injection surface that does not require system prompt access to exploit. Any tool output the agent trusts is a potential attack vector. Structural sanitization, content filtering, and length truncation before every re-entry are not optional hardening — they are the minimum viable security posture for any agent that calls external tools.

**On framework vs infrastructure controls**: OpenAI Agents SDK `max_turns = 10` and LangChain `max_iterations = 15` are application-layer controls — they protect against loops running too long within a single agent run using that specific framework. They do not protect against: an agent restarted after hitting `MaxTurnsExceeded` (re-launch storm); `max_turns` misconfigured to 1000; direct API calls bypassing the framework; or a multi-agent setup where a sub-agent calls the LLM directly.

Infrastructure-layer spend caps are the defense-in-depth backstop that closes all four gaps. OpenLegion's Zone 2 enforces per-agent daily caps before each LLM call — when the cap is exhausted, the call is rejected regardless of application code, framework choice, or agent cooperation. The cap is set in `INSTRUCTIONS.md`, committed to version control, and enforced from the authenticated session context. Agent code cannot raise it at runtime.

| **Loop control** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Per-agent daily spend cap (infrastructure layer)** | Zone 2, enforced | Not available | Not available | Not available | Not available |
| **Tool response structural sanitization** | Zone 2, default | Developer convention | Developer convention | Developer convention | Developer convention |
| **Cycle detection (repeated tool + params hash)** | Blackboard watchdog | Developer convention | Developer convention | Developer convention | Developer convention |
| **Non-idempotent tool call-count limit per loop run** | Zone 2, configurable | Developer convention | Developer convention | Developer convention | Developer convention |
| **Iteration count in observability pipeline** | Native | Developer convention | Developer convention | Developer convention | Developer convention |
| **HITL interrupt before irreversible actions** | Native checkpoint | Manual | Manual | Manual | Manual |

[Start building on OpenLegion](https://app.openlegion.ai) — deploy agentic loops with infrastructure-enforced spend caps, structural tool response sanitization at Zone 2, cycle detection via the blackboard watchdog, and per-tool idempotency controls, without managing any of it in application code.

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an agentic loop?

The agentic loop is the repeating perceive-think-act iteration cycle at the core of every AI agent runtime — on each iteration, the agent receives an observation (tool result, user message, or environment state), generates a reasoning step and selects an action, executes the action via a tool call, receives the result as the next observation, and repeats until a termination condition is met or an external budget is exhausted. The loop was formalized by ReAct (Yao et al. 2022, arXiv:2210.03629), which showed that grounding each Thought in an actual tool Observation improved accuracy by 9–14 percentage points on multi-hop benchmarks compared to chain-of-thought-only approaches. In production, loops require external budget enforcement (iteration limits and spend caps) because agents cannot reliably self-terminate when tools return errors or goals are underspecified.

### What causes infinite loops in AI agents?

The most common cause is the tool call storm anti-pattern: the agent calls a tool that returns an error, interprets the error as "try again," and calls the same tool with identical parameters on the next iteration — repeating until an external loop budget terminates it. LangChain's 2025 State of AI Agents report found that 23% of agent failures in surveyed production deployments were caused by infinite tool call loops, with the absence of infrastructure-level loop budgets identified as the primary contributing factor. Other common causes are underspecified goals (the agent cannot determine when it has done enough), plan revision loops (the agent revises its plan each iteration without executing), and injection-redirected loops (CVE-2024-5184 — an adversarial tool response redirects the agent onto an attacker-controlled task). Prevention requires both an error escalation instruction in every tool schema and an iteration budget or spend cap enforced externally.

### What is the ReAct loop and how does it relate to the agentic loop?

ReAct (Reasoning + Acting), Yao et al. 2022 (arXiv:2210.03629), Google Brain and Princeton, ICLR 2023, is the academic formalization of the agentic loop as an interleaved Thought-Action-Observation sequence where each Thought is grounded in the Observation from the previous Action, preventing the agent from reasoning past incorrect assumptions. ReAct showed this interleaved structure improved accuracy over chain-of-thought-only by 14 percentage points on HotpotQA (57.1% vs 43.2% EM) and 9 points on FEVER fact-checking (75.4% vs 66.4%). The ReAct loop is the theoretical foundation that most production agent runtimes implement, but the paper models natural termination via a Finish action and does not specify external loop budget enforcement — that gap is what production deployments must address through iteration limits, spend caps, and cycle detection.

### How do I set a loop iteration limit for my AI agent?

The correct iteration limit is the typical iteration count for the task type measured in staging, multiplied by 1.5 for legitimate variance headroom, with a hard stop at 3× the typical count — beyond which the loop is almost certainly stuck rather than making progress. Framework defaults: OpenAI Agents SDK `max_turns` defaults to 10 (configurable at instantiation, raises `MaxTurnsExceeded` when reached); LangChain AgentExecutor `max_iterations` defaults to 15; AutoGen `max_consecutive_auto_reply` defaults to 10. Task type guidelines: simple Q&A with 1–2 tool calls → max_turns 5; research tasks with web search → 15–25; code generation + test + fix loops → 30–50; open-ended autonomous tasks → 50 with an infrastructure spend cap as the backstop. The iteration budget and a per-agent spend cap are complementary controls — the iteration budget stops loops early regardless of cost, the spend cap stops loops regardless of iteration count when cost is the binding constraint.

### What is CVE-2024-5184 and how does it affect AI agents?

CVE-2024-5184 (Palo Alto Unit 42, May 2024, CVSS 8.1 HIGH) is a prompt injection vulnerability targeting the observation re-entry point of the agentic loop — an adversarially crafted tool response (a web page the agent fetches, an API response from a compromised endpoint, a database record with injected text) enters the context window as a trusted Observation and redirects the agent's next Thought and Action onto an attacker-controlled task without requiring access to the original user prompt or system prompt. The attack requires only access to any tool output that the agent trusts. Mitigation requires three layers applied before every tool result enters the context window: structural wrapping (rigid JSON schema separating tool output from free-form text), content sanitization (stripping injection pattern matches), and length truncation (capping tool responses at 2,000 tokens to prevent adversarial content from overwhelming the stable system prompt).

### How much does a runaway agentic loop cost?

Runaway loop costs compound non-linearly because the context window grows each iteration. For a 3,000-token system prompt with 1,200 tokens per iteration at Claude 3.5 Sonnet pricing ($3.00/million input tokens): iteration 1 costs approximately $0.013; iteration 10 costs $0.045; iteration 20 costs $0.081 — and cumulative cost for a 20-iteration storm reaches approximately $0.86 per agent. For 100 concurrent agents each running a 20-iteration storm, that is $86 in minutes; for 1,000 agents, $860 before any infrastructure cap intervenes. Stopping at iteration 5 instead of iteration 20 saves approximately 85% of total storm cost because per-iteration cost is lowest in the early iterations. Per-agent daily spend caps enforced at the infrastructure layer are the most reliable protection because they apply regardless of whether the framework's iteration limit was misconfigured or bypassed by direct API calls.

### What is a tool call storm in AI agents?

A tool call storm is the agentic loop anti-pattern where the agent calls the same tool with the same parameters repeatedly when the tool returns an error, without error escalation logic to break the cycle. LangChain's 2025 State of AI Agents report identified tool call storms as the cause of 23% of agent failures in surveyed production deployments, with the primary contributing factor being the absence of infrastructure-level loop budgets. The fix requires two controls working together: an error escalation instruction embedded in every tool schema directing the agent to report the error and stop rather than retry with identical parameters after two consecutive failures, and an iteration budget or spend cap enforced externally to terminate the loop if the agent's own escalation logic is insufficient.

### What is an idempotent tool call and why does it matter for agent loops?

An idempotent tool call produces the same result when called multiple times with the same parameters, making it safe to call in a stuck loop without accumulating real-world side effects — read_file, web_search, query_database (SELECT), and fetch_url are idempotent. Non-idempotent tools — send_email, write_file, delete_record, execute_payment — are dangerous in runaway loops because they cause real-world damage when called repeatedly: duplicate emails, data corruption, repeated financial transactions. Mitigations for non-idempotent tools include Critic-Actor gates (a separate evaluation step confirming the call is intentional before execution), per-tool call-count limits within a single loop run enforced at the infrastructure layer, and idempotency keys derived from the task_id and call count (the tool backend deduplicates on the key, preventing duplicate effects even if the agent calls the tool multiple times in a stuck loop).
