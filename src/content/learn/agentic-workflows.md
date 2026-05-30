---
title: Agentic Workflow - Patterns, Security, and Production Design
description: An agentic workflow is a multi-step AI process where agents autonomously choose tools, delegate subtasks, and adapt based on intermediate results. Core patterns, failure modes, and security design.
slug: /learn/agentic-workflows
primary_keyword: agentic workflow
secondary_keywords:
  - agentic workflow patterns
  - agentic workflow security
  - react loop ai agent
  - plan and execute ai
  - ai agent workflow design
date_published: "2026-05"
last_updated: "2026-05-27"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /comparison/langgraph
  - /comparison/crewai
---

# Agentic Workflow: Patterns, Security, and Production Design

An agentic workflow is a multi-step AI process in which one or more agents autonomously decide which tools to call, when to delegate subtasks to other agents, and how to adapt their approach based on intermediate results. Unlike a fixed pipeline where each step is hardcoded and executes exactly once, an agentic workflow is dynamic: the agent reads its environment, reasons over the state, and chooses the next action. That autonomy is the feature. It is also the attack surface.

OpenLegion is a security-first AI agent platform that treats agentic workflow design as an engineering discipline: each step runs in an isolated container, credentials are never present in the agent process, and every iteration loop has a hard stop condition enforced at the infrastructure level.

<!-- SCHEMA: DefinitionBlock -->

> **What is an agentic workflow?**
> An agentic workflow is a multi-step AI process in which autonomous agents select tools, delegate subtasks, and update their execution plan based on intermediate results - contrasted with static pipelines where each step is fixed at design time.

## TL;DR

- **Four core patterns**: ReAct loop, plan-and-execute, reflection loop, parallel fan-out. Each has distinct failure modes.
- **ReAct** (Reason + Act, Yao et al. 2023) is the most widely implemented pattern - used in LangGraph, OpenAI Agents SDK, AutoGen, and OpenLegion.
- **Primary attack vector**: Prompt injection via tool results (OWASP LLM Top 10 2025, LLM02). A malicious web page or document can hijack the agent next action.
- **Runaway loops are not edge cases**: A reflection loop or ReAct loop without a hard stop condition will run until your budget is exhausted.
- **OpenLegion mitigations**: Per-agent step budget (hard iteration cutoff), container isolation (compromised step cannot reach other agents credentials), zero telemetry.
- **Step budget vs. token budget**: Both matter. Token budgets cap spend; step budgets cap unbounded reasoning loops.

## What Makes an Agentic Workflow Different from a Pipeline

A traditional pipeline runs a fixed sequence: step 1, step 2, step 3. The developer defines every transition at design time. The system is deterministic: same input produces the same execution path.

An agentic workflow introduces a decision point at every step. The agent reads the current state, chooses an action (call a tool, hand off to another agent, produce a final answer, or loop again), and updates the state. The execution path is determined at runtime by the model, not by the developer.

This distinction has direct security implications. In a fixed pipeline, the blast radius of a compromised step is limited to that step outputs. In an agentic workflow, a compromised step can instruct the agent to take additional actions - call external APIs, exfiltrate data, generate malicious outputs that affect downstream steps. The [AI agent security guide](/learn/ai-agent-security) covers the full threat model; this page focuses on how workflow pattern choice affects the attack surface.

## The Four Core Agentic Workflow Patterns

### Pattern 1: ReAct Loop (Reason + Act)

**What it is.** Introduced in Yao et al. (2023), ReAct interleaves reasoning traces with action calls in a single loop. At each step, the model produces a Thought (reasoning about the current state), an Action (tool call or delegation), and an Observation (the tool result). The loop continues until the model produces a final answer.

**Where it is used.** ReAct is the default loop in LangGraph, OpenAI Agents SDK, AutoGen group chat, and OpenLegion. It is the most widely deployed agentic workflow pattern.

**Failure modes:**
- **Unbounded loop**: Without a hard iteration limit, a ReAct agent can loop indefinitely.
- **Prompt injection via observation**: The Observation step is the primary attack surface. OWASP LLM02 (Prompt Injection) is the top risk for ReAct-based workflows.
- **Context window inflation**: Long ReAct chains accumulate thought/action/observation triplets in context.

**OpenLegion mitigation**: Per-agent step budget (maximum iteration count enforced by the orchestrator) plus container isolation.

### Pattern 2: Plan-and-Execute

**What it is.** A Planner agent produces a complete task decomposition upfront. One or more Executor agents then carry out each step in the plan, without re-planning between steps.

**Advantages over ReAct.** Separating planning from execution reduces token cost significantly - the heavy reasoning happens once in the Planner. It also makes the execution path inspectable before it runs.

**Failure modes:**
- **Plan drift**: If an Executor encounters an unexpected result mid-plan, it may proceed with the stale plan.
- **Planner single point of failure**: A prompt injection that corrupts the Planner output affects every subsequent Executor step.
- **No adaptive re-planning**: Pure plan-and-execute cannot handle tasks where intermediate results materially change what subsequent steps should do.

**OpenLegion mitigation**: Planner and Executors run in separate containers. Blast radius bounded to the Planner container output.

### Pattern 3: Reflection Loop

**What it is.** An agent (or a separate Critic agent) evaluates its own output and iterates until a quality threshold is met. Common in content generation, code writing, and analysis tasks.

**Failure modes:**
- **Runaway iteration without stop condition**: If the Critic can always find something to improve, the loop runs indefinitely.
- **Self-reinforcing errors**: A model that misunderstands the task will generate critiques that reinforce the misunderstanding.
- **Cost amplification**: A 10-round reflection loop costs 10x the base generation.

**OpenLegion mitigation**: Per-agent step budget enforces a maximum reflection count at the infrastructure level.

### Pattern 4: Parallel Fan-Out

**What it is.** Multiple agents execute independent subtasks simultaneously. A Synthesis agent waits for all parallel branches to complete, then merges the results.

**Failure modes:**
- **Cost amplification**: N parallel agents cost N times the serial equivalent.
- **Synthesis poisoning**: A malicious branch output may corrupt the merged result.
- **Concurrency and shared-state conflicts**: CVE-2025-64168 (Agno, CVSS 7.1) demonstrated this: a race condition in shared session state under async concurrency exposed one user data to another.

**OpenLegion mitigation**: Each parallel agent runs in its own isolated Docker container. No shared mutable state between branches.

## Security Design for Agentic Workflows

### Threat 1: Prompt injection via tool results

Tool results are the primary injection vector in agentic workflows. OWASP LLM02 (Prompt Injection) is the top risk for LLM applications in the 2025 Top 10. For agentic workflows, the risk is amplified because agents have tool access, so an injected instruction can cause real-world actions.

OpenLegion applies Unicode sanitization at tool result ingestion (56 choke points for bidi overrides, tag characters, and zero-width chars) plus container isolation to bound the blast radius of any successful injection.

### Threat 2: Tool call amplification

An agent calling an expensive tool in a ReAct loop without a step budget can make hundreds of tool calls before the developer notices. Real-world incidents include overnight agent runs generating thousands of API calls to third-party services, triggering unexpected bills and rate-limit suspensions.

OpenLegion enforces both: per-agent token budget (spend cutoff) and per-agent step budget (iteration cutoff). Either limit halts the agent when reached.

### Threat 3: Credential exposure during delegation

In frameworks where agents share a Python process, Agent B has access to Agent A environment variables by default. A compromised delegation step can expose all credentials available to the workflow.

OpenLegion uses vault proxy credential injection via the Mesh Host. Agent B container receives only the credentials explicitly assigned to it in the fleet ACL matrix - not Agent A credentials.

### Threat 4: Unbounded recursion and self-spawning

An agentic workflow allowing agents to spawn sub-agents without limit can be manipulated into exponential recursion. OpenLegion bounds this: can_spawn permission requires explicit administrator authorization, sub-agent depth is bounded by mesh configuration, and fleet templates define maximum agent count.

## Step Budget vs. Token Budget: Why You Need Both

Token budgets cap the total spend per agent per day. They are necessary but not sufficient. A token budget does not prevent a ReAct loop from running 500 iterations using cheap tools. A step budget caps the number of reasoning iterations or tool calls, independent of token cost.

OpenLegion implements both: token budget enforced by the Cost Tracker in Zone 2, and step budget enforced by the orchestrator at the infrastructure level.

## Designing Production Agentic Workflows

### Choose the right pattern for the task

| Task type | Recommended pattern | Why |
|---|---|---|
| **Open-ended research** | ReAct loop with step budget | Needs adaptive tool selection; bound the loop |
| **Structured multi-step task** | Plan-and-execute | Inspectable plan; reduces token cost |
| **Quality-sensitive generation** | Reflection loop with step limit | Self-correction; hard-stop prevents runaway |
| **Parallel data gathering** | Fan-out + synthesis | Independent subtasks; per-agent isolation |
| **Long document processing** | Fan-out + sequential merge | Parallelizes chunked processing |

### Define stop conditions before deploying

Every loop in an agentic workflow needs an explicit stop condition enforced at the infrastructure level. If the model decides when to stop, a prompt injection can prevent it from stopping.

### Validate outputs at step boundaries

Each step boundary is an opportunity to validate output matches expected schema before passing to the next step. OpenLegion fleet-model coordination applies output validators at each handoff point. See the [AI agent orchestration guide](/learn/ai-agent-orchestration) for implementation details.

### Scope permissions to the minimum required

Each agent should have only the tools and permissions it needs for its specific step. Over-permissioned agents amplify the blast radius of any compromise. The per-agent ACL matrix in OpenLegion fleet configuration enforces minimum permissions at the orchestrator level.

## Agentic Workflow Frameworks: Pattern Support Comparison

| Framework | ReAct | Plan-and-Execute | Reflection | Fan-Out | Step budget | Container isolation |
|---|---|---|---|---|---|---|
| **OpenLegion** | Yes | Yes | Yes | Yes | Yes (hard) | Yes (mandatory) |
| **LangGraph** | Yes | Yes | Yes | Yes | No built-in | No |
| **CrewAI** | Yes (Flows) | Yes (Crews) | Limited | Yes (parallel) | No | No (CodeInterpreter only) |
| **OpenAI Agents SDK** | Yes | Limited | Limited | Yes (handoffs) | No | No |
| **AutoGen** | Yes | Yes | Yes | Yes (group chat) | No | Docker for code only |

For a detailed security and architecture comparison of these frameworks, see the [AI agent frameworks comparison](/learn/ai-agent-frameworks).

## OpenLegion's Take

Agentic workflows are where the security debt of most frameworks becomes visible in production. ReAct loops without step budgets have generated five- and six-figure surprise API bills. CVE-2025-64168 (Agno, CVSS 7.1, October 2025) demonstrated that concurrent agentic workflows sharing a Python process can expose one user session state to another under high async load. OWASP LLM02 (Prompt Injection, 2025 Top 10) identifies tool result injection as the primary attack vector against ReAct-based agentic workflows.

OpenLegion addresses three properties architecturally: hard step budgets (maximum iteration count enforced by the orchestrator), container isolation per agent (no shared mutable state between parallel branches), and vault proxy credential injection (delegation handoffs route through Zone 2). These are not configuration options - they are the default architecture.

The tradeoff: OpenLegion has ~59 GitHub stars to LangGraph ~25,200 and CrewAI ~44,600. For a comparison of how these patterns are implemented across frameworks, see the [AI agent frameworks comparison](/learn/ai-agent-frameworks).

## CTA

**Build agentic workflows with hard stop conditions, not hoped-for ones.**
[Get Started](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Learn: AI Agent Orchestration](/learn/ai-agent-orchestration)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an agentic workflow?

An agentic workflow is a multi-step AI process where one or more agents autonomously select tools, delegate subtasks to other agents, and adapt their execution plan based on intermediate results. Unlike static pipelines with fixed steps, an agentic workflow execution path is determined at runtime by the model reasoning. The four core patterns are ReAct loop, plan-and-execute, reflection loop, and parallel fan-out - each with distinct failure modes and security implications.

### What is the ReAct pattern in agentic workflows?

ReAct (Reason + Act) was introduced by Yao et al. in 2023 and interleaves reasoning traces with tool calls in a single loop. At each step, the model produces a Thought (reasoning), an Action (tool call), and an Observation (tool result). ReAct is the default agentic workflow pattern in LangGraph, OpenAI Agents SDK, AutoGen, and OpenLegion. Its primary failure modes are unbounded iteration and prompt injection via tool results.

### How do you prevent runaway agentic workflow loops?

The only reliable way to prevent runaway loops is enforcing a stop condition at the infrastructure level - not relying on the model to stop itself. Two controls are required: a step budget (maximum iteration or tool call count, enforced by the orchestrator) and a token budget (maximum spend, enforced by the cost tracker). Token budgets alone do not stop high-frequency cheap-tool loops. Step budgets alone do not cap expensive per-iteration LLM costs. OpenLegion enforces both per-agent as hard cutoffs.

### What is plan-and-execute in agentic workflows?

Plan-and-execute splits an agentic workflow into two phases: a Planner agent produces a complete task decomposition upfront, and one or more Executor agents carry out each step without re-planning. This reduces token cost compared to ReAct (heavy reasoning once vs. every step) and makes the execution path inspectable before it runs. The main failure mode is plan drift: if an Executor encounters an unexpected result, it may proceed with a stale plan rather than flagging the mismatch.

### What is the main security risk in agentic workflows?

The primary attack vector is prompt injection via tool results (OWASP LLM02, 2025 Top 10). When an agent reads a web page, file, database record, or external API response, that content arrives as trusted input. A malicious document can contain instructions that redirect the agent to take unintended actions. Mitigations include Unicode sanitization at tool result ingestion, output schema validation at step boundaries, and container isolation to bound the blast radius of any successful injection.

### How does parallel fan-out work in agentic workflows?

Parallel fan-out runs multiple agents simultaneously on independent subtasks, then merges results at a Synthesis step. It reduces wall-clock time for tasks that decompose into independent work streams. The failure modes are cost amplification (N agents cost N times more), synthesis poisoning (a malicious branch output corrupting the merged result), and shared-state conflicts in frameworks where concurrent agents share mutable process state. OpenLegion runs each parallel agent in an isolated Docker container with its own state, preventing shared-state conflicts and bounding each branch independently.

### What is plan drift in agentic workflows?

Plan drift occurs in plan-and-execute workflows when Executor agents encounter unexpected intermediate results but continue executing the original plan rather than flagging the mismatch. Mitigations include explicit plan-validation checkpoints, human-in-the-loop approval gates at critical plan steps, and structured handoff protocols that surface discrepancies before proceeding. OpenLegion fleet-model coordination supports human-in-the-loop checkpoints via channel integrations at any handoff point.

### How does agentic workflow design differ from AI agent orchestration?

Agentic workflow design focuses on step-level anatomy: which pattern (ReAct, plan-and-execute, reflection, fan-out), what stop conditions, how tool results are validated, and how credentials are scoped at each step. AI agent orchestration focuses on fleet-level coordination: how multiple workflows are sequenced, how agents hand off work to each other, how shared state is managed across a multi-agent system. The [AI agent orchestration guide](/learn/ai-agent-orchestration) covers fleet-level coordination primitives that operate on top of the workflow patterns described here.
