---
title: "AI Agent Planning: ReAct, Tree of Thoughts, and Plan-and-Execute"
description: "AI agent planning: ReAct reasoning traces, Tree of Thoughts multi-path search, Plan-and-Execute separation, extended thinking in o3, and pre-execution HITL gates before irreversible actions."
slug: /learn/ai-agent-planning
primary_keyword: ai agent planning
last_updated: "2026-06-23"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-architecture
  - /learn/agentic-workflows
  - /learn/ai-agent-orchestration
  - /learn/human-in-the-loop-ai-agents
  - /learn/ai-agent-security
  - /learn/multi-agent-systems
---

# AI Agent Planning: ReAct, Tree of Thoughts, and Plan-and-Execute

AI agent planning is the process by which an agent generates, evaluates, and revises intended actions before or during execution, distinct from simply reacting to the last observation. OpenAI o3's 71.7% SWE-bench score (January 2025) versus GPT-4o's 48.9% is a planning improvement: extended thinking tokens allow longer inference-time reasoning before any tool call fires. Planning also creates a security-critical interception point where generated plans can be inspected and blocked before irreversible actions reach the real world.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent planning** is the process by which an agent generates, evaluates, and revises a sequence of intended actions before or during execution, using patterns such as ReAct (interleaved reasoning and tool calls), Tree of Thoughts (multi-path plan exploration), Plan-and-Execute (upfront plan generation followed by step-by-step execution), or extended thinking (longer inference-time reasoning), to improve task success rates and create interception points where plans can be validated before irreversible actions fire.

## Planning Patterns at a Glance

| **Pattern** | **Planning phase** | **Best for** | **Key tradeoff** |
|---|---|---|---|
| **ReAct** | Interleaved per step | Speed, adaptability | No pre-execution checkpoint |
| **Tree of Thoughts** | Full pre-execution search | Multi-path problems with definable eval | High LLM call cost |
| **Plan-and-Execute** | Full pre-execution plan | Long-horizon tasks, executor isolation | Plan goes stale under failure |
| **Reflexion** | Post-failure revision | Iterative improvement across attempts | Requires attempt + self-evaluation |
| **Extended thinking (o3)** | Extended inference time | Complex reasoning, code, math | Token cost scales with think budget |

## What AI Agent Planning Is (and What It Is Not)

### Planning vs. Orchestration vs. Architecture

Three concepts that appear in agent system design and are frequently conflated:

**Planning** is an intra-agent cognitive process: one agent reasoning about what sequence of actions to take to accomplish its goal. Planning happens inside a single agent's context window. A planning failure manifests as that agent producing an incorrect or harmful action sequence.

**Orchestration** is inter-agent coordination: routing tasks between agents, managing handoffs, handling dependencies across agent roles. An orchestration failure manifests as a task being sent to the wrong agent, a dependency not being resolved before an agent starts, or a result not being delivered to the next stage. The [AI agent orchestration guide](/learn/ai-agent-orchestration) covers inter-agent coordination patterns.

**Architecture** is the structural configuration: which agents exist, what tools they have, how they connect to external systems. Architecture determines the capability space; planning determines how that capability space is used on a specific task.

Debugging distinction: if one agent produces a wrong answer (bad action sequence, hallucinates a tool parameter, misses a task step), that is a planning failure. If the correct agent receives a task but it arrives incomplete or from the wrong predecessor, that is an orchestration failure. If no agent in the system has access to the tool the task requires, that is an architecture failure.

### The Two Planning Regimes: Pre-Execution and Interleaved

**Pre-execution planning**: the agent generates a complete action sequence before any tool call fires. The plan exists as an artifact, a list of steps in the blackboard, a structured JSON object, a markdown outline, that can be inspected, logged, and blocked before execution starts. This is the natural HITL interception point. Downside: the plan is generated from the agent's initial information state. If step 3 produces an unexpected result, a pre-execution plan may be invalidated by the time execution reaches step 6.

**Interleaved planning (ReAct)**: the agent generates one Thought, executes one Action, observes the result, and reasons again. The plan is implicit in the Thought trace; it exists only in the context window, not as a discrete artifact. Interleaved planning adapts continuously to new information but provides no pre-execution checkpoint. A Thought and its corresponding Action fire in the same LLM turn with no pause for inspection.

Production rule: use pre-execution planning (Plan-and-Execute or Tree of Thoughts) when the task involves irreversible actions, such as repository commits, email sends, API POSTs to external services. Use interleaved planning (ReAct) when speed matters more than pre-execution inspection and all tool calls are read-only or reversible.

## ReAct: Interleaved Reasoning and Tool Calls

### ReAct Methodology: Thought, Action, Observation

ReAct (Yao et al. 2022, arXiv:2210.03629) interleaves reasoning and acting in a continuous loop. Each iteration has three components:

**Thought**: the agent's natural-language reasoning about what to do next, written to the context window before any tool call. The Thought functions as a scratchpad; the agent can work through multi-step logic, consider alternatives, and update its plan based on prior observations. Crucially, the Thought is explicit in the context window and can be logged, audited, and (with the right tooling) inspected before the corresponding Action fires.

**Action**: a function call derived from the reasoning in the Thought. The agent specifies tool name and arguments. In LangChain's AgentExecutor, AutoGPT, and LlamaIndex, all of which use ReAct as their default loop, the Action is parsed from the Thought text and dispatched to the tool registry.

**Observation**: the tool's return value, appended to the context window as the next input. The agent reads the Observation in its next Thought step. The Observation may confirm the plan, reveal an error that requires plan revision, or provide new information that changes the next Action.

By 2025, arXiv:2210.03629 had accumulated over 2,000 citations, making it the single most-cited paper in the agent planning literature. ReAct's dominance as the default loop architecture reflects its combination of simplicity (one pattern, easy to implement) and interpretability (the Thought trace is a debug log).

### ReAct Failure Modes: Hallucinated Tools and Reasoning Drift

**Hallucinated tool calls**: the agent writes a Thought referencing a tool with parameters that don't exist in the tool schema, or calls a real tool with an invented parameter name. The tool registry raises a validation error at runtime. The failure is caught; the agent gets an error Observation, but the wasted iteration costs tokens and time. Fix: write precise tool descriptions that include a "when NOT to use" clause for each parameter that commonly causes confusion. Precise descriptions reduce hallucinated tool invocations by 30-60% in practice.

**Reasoning drift**: over long ReAct loops, the agent's Thoughts gradually drift from the original task goal. By iteration 12, the Thought may be reasoning about how to handle a tangential problem that arose at iteration 7, while the original task objective has been dropped from the active reasoning. Fix: include the task goal in the system prompt and re-state it at the beginning of each Thought via a prompt template. Set a `max_iterations` cap; LangChain's default of 15 is a reasonable starting point, reduce it for tasks that should complete in 5-8 steps.

### ReAct and the Missing Pre-Execution Checkpoint

The Thought and its corresponding Action fire in the same LLM turn. There is no architectural pause between "the agent has decided to call `commit_file`" and "`commit_file` being called." For read-only tools, this is acceptable; the worst outcome is a wasted API call. For irreversible tools, this is a governance gap.

Production pattern to add a checkpoint without changing the framework: in INSTRUCTIONS.md, add a routing rule that triggers before any high-risk tool call:

```markdown
Before any Action that calls commit_file, http_request (POST), send_email, or spawn_fleet_agent:
1. Write the proposed Action to the Thought as: "PROPOSED ACTION: [tool] with args [args]"
2. Call update_status(state="working", summary="Proposed: [tool] — awaiting 30min approval window")
3. Wait 30 minutes. If a steer message arrives approving the action, proceed.
4. If no steer: call update_status(state="blocked", summary="Pending approval: [tool]")
```

This creates a 30-minute inspection window between the agent's plan and the irreversible execution, implemented entirely at the instruction level.

## Tree of Thoughts: Multi-Path Plan Exploration

### Tree of Thoughts Methodology: Generate, Evaluate, Search

Tree of Thoughts (Yao et al. 2023, arXiv:2305.10601) structures the planning process as an explicit search over a tree of candidate action sequences. Three steps:

**Generate**: the agent produces N candidate next steps (branches) at each decision point. N is a hyperparameter, typically 3-5. Each branch represents a different possible action or reasoning direction.

**Evaluate**: for each candidate branch, the agent (or a separate evaluator prompt) scores the branch against a defined criterion: "does this branch move toward the task goal?", "does this branch comply with the tool allowlist?", "does this branch avoid the known failure modes from prior attempts?" The evaluation criterion must be expressible before execution; this is ToT's key constraint.

**Search**: the agent selects which branches to explore using breadth-first search (BFS), depth-first search (DFS), or beam search. BFS explores all branches at each depth before going deeper; better for problems where shallow decisions have high impact. DFS commits to one branch and explores it fully before backtracking; better for problems where early elimination is possible.

The benchmark results from arXiv:2305.10601: on the Game of 24 mathematical puzzle, standard chain-of-thought prompting with GPT-4 achieves 4%. ToT with BFS achieves 74%, an 18.5x improvement. On a creative writing task requiring adherence to five constraints simultaneously, standard prompting achieves 40%; ToT achieves 78%.

### When to Use Tree of Thoughts vs. ReAct

ToT is justified when all four conditions hold:
1. The task has a hard success criterion evaluable before execution
2. The cost of executing a wrong plan is high (irreversible actions, regulatory consequences, expensive API calls)
3. The search space is well-defined (plausible next steps at each point are bounded and small)
4. The latency budget allows multiple LLM calls per decision point (ToT with N=3 branches x 10 decision points = 30 LLM calls minimum)

Do not use ToT when:
- The task plan cannot be evaluated without execution
- Latency is the primary constraint
- The action space is large or continuous (too many branches to evaluate per step)

Default: start with ReAct. Add ToT on task classes with repeated planning failures that have a definable evaluation criterion.

## Plan-and-Execute: Separating Reasoning from Action

### Plan-and-Execute Architecture

Plan-and-Execute (Harrison Chase, LangChain, 2023) separates planning and execution into distinct agent roles. The planner agent receives the full task context and generates a complete step list, a structured artifact written to a shared store (blackboard or equivalent) before any step executes. Executor agents receive individual steps and execute them, returning results that update the shared store.

The isolation reduces hallucinated tool calls because executors operate with a narrow context: one step, the relevant tool schemas, the prior step results. They do not have the full task context that can lead a planner to invent tool parameters that don't exist. The planner does not call tools; it reasons at a high level and produces a plan.

In OpenLegion's multi-agent mesh, Plan-and-Execute maps directly to the coordination model: the planner writes the plan to the blackboard, then uses `hand_off()` to dispatch each step to an executor role. Executor results are written back to the blackboard as each step completes. The planner can read these results and revise the remaining plan if an early step produces unexpected output.

### Pre-Execution Plan Inspection: The Security Advantage of Plan-and-Execute

Because the planner generates a full plan before any executor fires, the plan exists as a discrete artifact that can be inspected before execution begins. This is Plan-and-Execute's primary security advantage over ReAct.

Plan inspection workflow:

1. Planner generates the full step list and writes it to `plans/{task_id}` on the blackboard
2. A plan-inspector component (human, supervisor agent, or automated rule engine) reads the plan
3. Inspector checks for: tool calls outside the agent role's allowlist, actions targeting unapproved external endpoints, credential references that would require resolving handles into values, sequences matching known prompt-injection patterns
4. If the plan passes: set `plans/{task_id}/approved: true`, executors proceed
5. If the plan fails: set `plans/{task_id}/blocked: true` with a rejection reason; planner revises

OWASP LLM Top 10 2025 item LLM06 (Excessive Agency) identifies the absence of a pre-execution checkpoint for irreversible actions as the primary mitigation gap; Plan-and-Execute with plan inspection closes this gap structurally.

### Plan Staleness Under Failure: When to Revise vs. Abort

Plan-and-Execute's weakness is plan staleness. A plan generated from the agent's initial information state may be invalidated by the results of early execution steps.

Two mitigation strategies:

**Adaptive re-planning**: after each executor step, the planner receives the step result and evaluates whether the remaining plan is still valid. If the result changes any assumption the plan relied on, the planner generates a revised plan for the remaining steps.

**Abort conditions**: define explicit abort conditions in the plan itself. "If step 3 result does not contain field X, abort; the downstream steps require X and cannot proceed without it." The executor checks the abort condition before proceeding. Aborting early is cheaper than discovering the plan failure at step 8.

## Reflexion: Plan Revision Under Failure

### Reflexion Methodology: Attempt, Evaluate, Reflect, Revise

Reflexion (Shinn et al. 2023, arXiv:2303.11366) adds a self-evaluation loop to any planning pattern. After an attempt fails, the agent generates a reflection, a natural-language diagnosis of what went wrong and how to avoid the same mistake on the next attempt. The reflection is stored in memory and prepended to the next attempt's context.

Results from arXiv:2303.11366: on HumanEval (Python coding benchmark), a single-attempt GPT-3.5 baseline achieves 67.0% pass rate. With Reflexion over 3 attempts, the pass rate reaches 91.0%, a 24-point improvement from the same base model.

### When Reflexion Adds Value vs. Amplifying Errors

Reflexion is most effective when:
- The success criterion is computable (you can evaluate whether the attempt succeeded)
- Failures are diagnosable from the attempt output
- Multiple attempts are permissible (the action is not irreversible after the first try)

Reflexion can amplify errors when the agent's self-evaluation is wrong. An incorrect diagnosis, "I failed because I used the wrong tool" when the actual failure was a bad plan, compounds across iterations. Mitigation: include the actual error message and tool output in the Observation that feeds the Reflect step.

Reflexion does not help when the failure is caused by an incorrect tool schema or a missing permission. Diagnose structural failures before applying Reflexion.

## Extended Thinking: Inference-Time Planning in o3

### How Extended Thinking Works

OpenAI's o3 model (January 2025) achieves 71.7% on SWE-bench Verified versus GPT-4o's 48.9%, a 22.8-point improvement with extended thinking enabled. The model generates thinking tokens, an internal chain of reasoning not shown in the final response, before committing to an answer or tool call. Extended thinking is inference-time planning: more reasoning within a single LLM call, rather than multi-call planning (ToT) or multi-step interleaved planning (ReAct).

The thinking budget is configurable: higher budgets improve performance on complex reasoning tasks and increase cost. On tasks where planning complexity is low (simple retrieval, single-step tool calls), a high thinking budget wastes tokens. On tasks requiring multi-step code generation or complex constraint satisfaction, the budget pays for itself in reduced failure rate.

### Extended Thinking and Plan Security

Extended thinking tokens are internal to the model; they are not exposed in the tool call trace or the context window visible to downstream systems. The tool call appears in the log; the reasoning that produced it does not.

For audit-grade deployments, use Plan-and-Execute with explicit plan artifacts rather than relying on extended thinking as the primary planning mechanism. The explicit plan artifact is the auditable record. Extended thinking is most appropriate for tasks where planning quality matters more than planning auditability: complex coding, mathematical reasoning, research synthesis. For tasks where the plan must be auditable, any task triggering irreversible actions under regulated conditions, use pre-execution planning with explicit plan artifacts.

## OpenLegion's Take

The 22.8-point improvement from GPT-4o to o3 on SWE-bench is the clearest data point on the value of planning in agent systems. That improvement came from inference-time reasoning budget, not a larger model. Teams still defaulting to "just use the biggest model" for hard agent tasks should run the same task on a smaller model with extended thinking enabled and compare cost-per-successful-completion; inference-time planning frequently wins on that metric.

The security dimension of planning is underweighted in most agent system designs. Plans generated before execution create interception points that don't exist in pure ReAct loops. OWASP LLM06 (Excessive Agency) in the 2025 Top 10 is not a prompt-injection problem; it is a governance problem: agents that execute irreversible actions without a pre-execution checkpoint have no structural defense against executing a bad plan. Plan-and-Execute with plan inspection closes that gap; ReAct with instruction-level approval gates partially closes it; pure ReAct with no inspection gates does not.

OpenLegion's mesh provides two structural planning controls: the blackboard as a shared plan artifact store (plans written to `plans/{task_id}` are readable by supervisor agents and operators before executors start), and the steer mechanism as a real-time plan interception tool. Neither requires framework changes.

For the architectural context that determines which planning pattern fits your agent topology, see the [AI agent architecture guide](/learn/ai-agent-architecture). For the multi-agent coordination patterns that govern how planners hand off to executors at scale, see [multi-agent systems](/learn/multi-agent-systems).

## Get Started

**Deploy planning-capable agents with built-in pre-execution inspection and HITL approval gates.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Explore Agentic Workflows](/learn/agentic-workflows)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent planning and how is it different from AI agent orchestration?

AI agent planning is an intra-agent cognitive process: one agent reasoning about what sequence of actions to take on its current task. It happens inside a single agent's context window. Orchestration is inter-agent coordination: routing tasks between agents, managing handoffs, resolving dependencies across roles. A planning failure produces a wrong or harmful action sequence from a single agent. An orchestration failure produces a correctly-planned task that reaches the wrong agent or arrives with incomplete inputs.

### What is the ReAct planning pattern?

ReAct (Yao et al. 2022, arXiv:2210.03629) interleaves reasoning and acting in a Thought, Action, Observation loop. The agent writes a natural-language Thought (reasoning about what to do), calls a tool as the Action, and reads the tool's return value as the Observation. The Thought is explicit in the context window, functions as an audit trace, and serves as a scratchpad for multi-step reasoning. ReAct is the default loop in LangChain AgentExecutor, AutoGPT, and LlamaIndex, with over 2,000 citations by 2025.

### What is Tree of Thoughts and when should I use it?

Tree of Thoughts (Yao et al. 2023, arXiv:2305.10601) structures planning as a search over N candidate next steps at each decision point. The agent generates branches, evaluates each against a defined criterion, and searches using BFS or DFS. On the Game of 24 benchmark, GPT-4 achieves 4% with standard prompting and 74% with ToT, an 18.5x improvement. Use ToT when the task has a hard evaluable success criterion, the cost of a wrong plan is high, and the latency budget allows multiple LLM calls per decision. Start with ReAct and add ToT only on task classes with repeated planning failures.

### What is the difference between Plan-and-Execute and ReAct?

ReAct interleaves planning and execution one step at a time. Plan-and-Execute generates a complete plan before any execution begins, then dispatches individual steps to executor agents. Plan-and-Execute creates a pre-execution checkpoint where the plan can be inspected and blocked before irreversible actions fire. ReAct adapts continuously to new information but has no pre-execution checkpoint; Thought and Action fire in the same LLM turn. Use Plan-and-Execute when tasks involve irreversible actions that need inspection before execution.

### What is Reflexion and how does it improve agent planning?

Reflexion (Shinn et al. 2023, arXiv:2303.11366) adds a self-evaluation loop to any planning pattern. After an attempt fails, the agent generates a natural-language diagnosis of what went wrong. The diagnosis is stored in memory and prepended to the next attempt's context. On HumanEval (Python coding), a single-attempt GPT-3.5 baseline achieves 67.0%; three-attempt Reflexion reaches 91.0%, a 24-point improvement from the same base model. Reflexion works best when the success criterion is computable, failures are diagnosable from output, and multiple attempts are permissible.

### How did OpenAI o3 achieve 71.7% on SWE-bench?

o3 achieves 71.7% on SWE-bench Verified (January 2025) versus GPT-4o's 48.9%, a 22.8-point improvement, through extended thinking: additional inference-time compute allocated to reasoning before the model commits to any output. The model generates internal thinking tokens that explore more plan branches and catch more reasoning errors before producing a final answer or tool call. This is inference-time planning (more reasoning within a single LLM call) rather than multi-call planning like Tree of Thoughts.

### How do I add a pre-execution inspection gate to my agent?

Use Plan-and-Execute: have the planner write its full step list to a shared blackboard key before dispatching any executor. A plan-inspector component reads the plan and checks for out-of-allowlist tool calls, unapproved external endpoints, and injection-pattern matches. If the plan passes, set an approved flag and let executors proceed. If not, block with a rejection reason that feeds back to the planner for revision. For ReAct-based agents, add an INSTRUCTIONS.md routing rule that waits 30 minutes for operator approval before any high-risk Action fires.

### What are the security implications of extended thinking in agent planning?

Extended thinking tokens are internal to the model and not exposed in the tool call trace or the context window visible to downstream audit systems. The tool call appears in the log; the reasoning that produced it does not. For audit-grade deployments where plans must be inspectable before irreversible actions execute, use Plan-and-Execute with explicit plan artifacts rather than relying on extended thinking as the sole planning mechanism. Extended thinking optimizes for planning quality; explicit plan artifacts optimize for planning auditability. Use both where both matter.
