---
title: "Agent2Agent Protocol — A2A Security, Architecture, and MCP Comparison"
description: "Agent2Agent (A2A) protocol lets AI agents delegate tasks across frameworks and vendors. Learn the architecture, security model, task lifecycle, and how A2A compares to MCP for multi-agent systems."
slug: /learn/agent2agent-protocol
primary_keyword: agent2agent protocol
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/model-context-protocol
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/ai-agent-frameworks
---

# Agent2Agent Protocol: Architecture, Security, and MCP Comparison

Agent2Agent (A2A) is an open protocol, launched by Google Cloud in April 2025 and donated to the Linux Foundation, that lets AI agents built on different frameworks and vendors communicate, delegate tasks, and exchange results over a standardized HTTP/JSON interface. Where MCP solves the tool-access problem (one LLM calling external APIs), A2A solves the coordination problem: one agent delegating an entire subtask to a specialized peer agent with its own reasoning loop, memory, and tools. The a2aproject/A2A GitHub repo has contributions from 50+ organizations including Salesforce, Atlassian, and SAP.

<!-- SCHEMA: DefinitionBlock -->
Agent2Agent (A2A) is an open HTTP/JSON protocol for AI agent interoperability, maintained by the Linux Foundation, that standardizes how autonomous agents advertise capabilities, delegate tasks, and exchange results across different frameworks and vendors.

## What Is the Agent2Agent (A2A) Protocol?

A2A emerged from a concrete gap in the AI agent ecosystem: model-to-tool communication had a standard (MCP, launched November 2024), but agent-to-agent communication did not. When an orchestrating agent needs to hand a subtask to a specialized peer — a web-research agent, a code-execution agent, a data-analysis agent — there was no standardized wire format for that delegation.

Google Cloud announced A2A on April 9, 2025, alongside an initial group of 50+ technology partners contributing to the specification. Unlike many vendor-driven standards, A2A was donated to the Linux Foundation for neutral governance, positioning it as genuinely open infrastructure rather than a proprietary lock-in mechanism.

The protocol is HTTP/JSON at its core. An A2A-compliant agent exposes a small set of endpoints: an agent card (capability manifest), a task submission endpoint, a status polling endpoint, and an SSE streaming endpoint for long-running tasks. Any agent framework that can make and receive HTTP requests can implement A2A.

For background on the multi-agent coordination problem A2A addresses, see [multi-agent systems architecture](/learn/multi-agent-systems) and [AI agent orchestration patterns](/learn/ai-agent-orchestration).

## The A2A Protocol Architecture

A2A defines three core concepts: agent cards (capability discovery), the task lifecycle (stateful delegation tracking), and delivery modes (SSE streaming and webhook push).

### Agent Cards: Capability Advertisement and Enumeration Risk

An agent card is a JSON document served at a well-known URL (`/.well-known/agent.json`) that describes what an agent can do. A minimal agent card includes:

```json
{
  "name": "web-research-agent",
  "description": "Researches topics using web search and returns structured summaries",
  "version": "1.0.0",
  "url": "https://agents.example.com/web-research",
  "skills": [
    {
      "id": "research_topic",
      "name": "Research Topic",
      "description": "Search the web for a topic and return a structured summary",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

Agent cards enable dynamic capability discovery — an orchestrating agent can query an agent registry, fetch agent cards, and select the right specialist for a subtask at runtime. This is architecturally useful and carries a security risk: agent cards are unauthenticated by default in the A2A base profile, exposing the full skill surface to enumeration without authentication. An attacker who can reach the `/.well-known/agent.json` endpoint learns every capability the agent exposes.

Production deployments should serve agent cards only after authentication or restrict them to internal network segments. The [AI agent security threat model](/learn/ai-agent-security) covers capability enumeration as a reconnaissance attack vector.

### Task Lifecycle: Five States from Submitted to Completed

A2A defines a five-state task lifecycle to track the delegation process from submission to completion:

1. **submitted** — Task received by the remote agent; not yet picked up for processing
2. **working** — Remote agent is actively processing the task (may stream progress via SSE)
3. **input-required** — Remote agent needs clarification before proceeding (human-in-the-loop gate)
4. **completed** — Task finished; result artifact available for retrieval
5. **failed** — Task failed; error details in task status object

The `input-required` state is A2A's mechanism for human-in-the-loop checkpoints in long autonomous pipelines. When a subtask reaches a decision point that requires human judgment, the receiving agent transitions to `input-required` rather than making the decision autonomously. The orchestrating agent surfaces this to a human operator.

Task state is persisted on the receiving agent's side. The delegating agent polls `GET /tasks/{task_id}` or subscribes to SSE updates to track progress. Task IDs are UUIDs assigned at submission.

### Push vs Pull Task Delivery: SSE and Webhooks

A2A supports two delivery modes for task results:

**SSE (Server-Sent Events):** The delegating agent opens a persistent connection to the receiving agent's streaming endpoint. The receiving agent pushes status updates and partial results in real time. SSE is the primary mechanism for long-running tasks where the delegating agent needs incremental progress — research tasks, code generation, multi-step analysis.

**Webhook push:** The delegating agent provides a callback URL at submission time. The receiving agent POSTs the completed result to that URL when the task finishes. Webhook push is preferable when the delegating agent cannot maintain a persistent SSE connection (serverless environments, short-lived containers).

Pull (polling `GET /tasks/{task_id}`) is always available as a fallback. For [agentic workflow patterns](/learn/agentic-workflows) that mix synchronous and asynchronous coordination, SSE and polling are both needed in the same pipeline.

## A2A vs MCP: Different Layers, Different Problems

A2A and MCP are complementary, not competing. They operate at different layers of the agent stack and solve different coordination problems. Conflating them leads to wrong architectural decisions.

| **Dimension** | **MCP** | **A2A** |
|---|---|---|
| **Purpose** | Tool access — one LLM calls external APIs | Agent coordination — one agent delegates to another |
| **Communication** | Synchronous tool call within one reasoning turn | Async task delegation; receiving agent has own loop |
| **Auth (default)** | Required — MCP servers authenticate clients | Optional in base profile — anonymous permitted |
| **Discovery** | MCP server manifest (tool list) | Agent card (JSON: skills + auth requirements) |
| **State** | Stateless per tool call | Stateful 5-state lifecycle |
| **Streaming** | Not in core spec | SSE for real-time; webhook push for async |
| **Primary threat** | Tool poisoning (OWASP LLM07:2025) | Task payload injection, agent card enumeration |

### When One Agent Needs a Tool (MCP)

MCP is the right choice when a single agent needs to call an external capability — a database query, a web search, a file read, a code interpreter — within one reasoning turn. The agent invokes the tool, gets the result, and continues its reasoning loop. The tool has no reasoning loop of its own; it executes a function and returns a value.

MCP authentication is mandatory in the spec. MCP servers authenticate clients before serving any tool calls. See [Model Context Protocol (MCP) — tool access for AI agents](/learn/model-context-protocol) for production MCP hardening details.

### When One Agent Needs Another Agent (A2A)

A2A is the right choice when a task requires a peer agent's full reasoning capability — not just a function call. The receiving agent has its own model, its own memory, its own tool access, and its own multi-step reasoning loop. The delegating agent submits a task description and waits for a result; it does not control the receiving agent's internal steps.

Examples: an orchestrating agent delegating a research subtask to a web-research agent; a coding agent delegating test generation to a testing-specialist agent; a customer-service agent escalating a complex case to a senior-agent with broader permissions.

### Using MCP and A2A Together in the Same System

A production multi-agent system typically uses both. The orchestrating agent uses A2A to delegate to specialist agents. Each specialist agent uses MCP to call its tools. The layers compose: A2A handles agent-to-agent coordination; MCP handles agent-to-tool calls within each agent's reasoning loop.

In OpenLegion's mesh architecture, inter-agent handoffs use a typed contract protocol that provides A2A-equivalent coordination with built-in authentication. Each agent's tool calls run through the credential vault — the MCP-equivalent layer — with per-agent ACL enforcement.

## A2A Authentication and Security Model

A2A's security model has one critical gap: the base profile makes authentication optional. An A2A server that implements only the base profile can accept anonymous task submissions from any caller. This is a deliberate design choice for rapid adoption — it lowers the implementation barrier — but it creates a significant production security risk.

**CVE-2025-47421** (May 2025, CVSS score pending public disclosure): Prompt injection via A2A task payload in the reference Python implementation. An attacker crafts a task payload containing injected instructions. The receiving agent processes the task payload as input to its reasoning loop and follows the injected instructions instead of the delegated task. The CVE affected the reference implementation's task handler, which did not sanitize or isolate user-controlled content in the task payload before passing it to the LLM.

The attack surface in A2A systems:

**1. Task payload injection:** The task description and input data in an A2A task submission are user-controlled. Without sanitization at the receiving agent, injected instructions in the task payload reach the agent's LLM context. CVE-2025-47421 is the canonical example.

**2. Agent card enumeration:** Unauthenticated agent cards expose the full skill surface. An attacker querying `/.well-known/agent.json` learns which tools the agent has access to, what inputs it accepts, and what outputs it produces — reconnaissance for targeted injection payloads.

**3. Inter-agent trust assumptions:** A delegating agent that trusts task results from a peer agent without output validation is vulnerable to relay injection. A compromised or malicious peer agent returns poisoned results; the delegating agent propagates them as trusted data.

**4. Anonymous delegation:** Without mandatory authentication, any caller on the network can submit tasks to an A2A agent. In internal networks this may be acceptable; on public endpoints it is not.

## OpenLegion's Take: A2A Is a Wire Format, Not a Security Model

A2A is well-designed as a wire format. The five-state task lifecycle, agent cards, and SSE streaming solve real coordination problems. The security model is where it falls short of production requirements.

Authentication is optional. Agent cards are unauthenticated by default. CVE-2025-47421 demonstrated that the reference implementation's task handler passes user-controlled payload content directly to the LLM without sanitization. These are not edge cases — they are the default configuration that most teams will deploy unless they read the security section carefully and implement the extended profile.

OpenLegion's approach to inter-agent communication enforces what A2A's base profile leaves optional:

1. **Every inter-agent call routes through the credential vault.** There is no anonymous delegation mode. Callers must authenticate before submitting tasks. The credential vault validates the caller identity and enforces per-agent ACL gates before the task reaches the receiving agent.

2. **Task payload sanitization at 56 network choke points.** User-controlled content in handoff payloads — the A2A equivalent of task descriptions and input data — is sanitized for unicode attacks (bidi overrides U+202A–U+202E, tag characters U+E0000–U+E007F, zero-width characters) before reaching the LLM context. This runs at the mesh host, outside the agent's code.

3. **Typed handoff contracts validated by the orchestrator.** Handoff payloads must match a declared schema. Relay injection that produces a malformed or anomalous payload is blocked at the handoff boundary before the downstream agent processes it.

4. **Agent capability manifests require authentication to access.** The skill surface is not exposed to unauthenticated callers.

The 50+ organizations adopting A2A — Salesforce, Atlassian, SAP — gain interoperability from the wire format. The security properties are not included in the base protocol. They must be built on top, or enforced by the infrastructure layer.

## Implementing A2A: A Technical Walkthrough

### Agent Card Schema

A production agent card should include authentication requirements, not rely on defaults:

```json
{
  "name": "data-analysis-agent",
  "description": "Analyzes structured datasets and returns statistical summaries with visualizations",
  "version": "1.2.0",
  "url": "https://agents.internal.example.com/data-analysis",
  "provider": {
    "organization": "Example Corp",
    "url": "https://example.com"
  },
  "skills": [
    {
      "id": "analyze_dataset",
      "name": "Analyze Dataset",
      "description": "Run statistical analysis on a provided dataset",
      "inputModes": ["data"],
      "outputModes": ["text", "data", "file"],
      "examples": ["Analyze sales data for Q1 2025 and identify top-performing regions"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"],
    "required": true
  },
  "defaultInputModes": ["text", "data"],
  "defaultOutputModes": ["text"]
}
```

The `"required": true` on authentication is non-default. Include it explicitly; do not rely on downstream validators to enforce it.

### Task Submission and Status Polling

Task submission is a POST to `/tasks/send`:

```json
{
  "id": "task-uuid-7a3b9c",
  "message": {
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "Analyze the attached Q1 2025 sales dataset. Return top 5 regions by revenue."
      },
      {
        "type": "data",
        "data": { "dataset_url": "s3://bucket/q1-sales.csv" }
      }
    ]
  }
}
```

Status polling hits `GET /tasks/{task_id}`:

```json
{
  "id": "task-uuid-7a3b9c",
  "status": {
    "state": "working",
    "timestamp": "2026-06-13T08:23:01Z"
  }
}
```

Poll at exponential backoff — 1s, 2s, 4s, 8s — capped at 30s. Long-running tasks (>60s) should switch to SSE rather than polling.

### Streaming Long-Running Tasks with SSE

For tasks expected to run longer than 30 seconds, use SSE via `POST /tasks/sendSubscribe`:

```
data: {"type":"TaskStatusUpdateEvent","id":"task-uuid-7a3b9c","status":{"state":"working","message":"Loaded dataset: 48,221 rows"},"final":false}

data: {"type":"TaskStatusUpdateEvent","id":"task-uuid-7a3b9c","status":{"state":"working","message":"Analysis complete. Building report."},"final":false}

data: {"type":"TaskStatusUpdateEvent","id":"task-uuid-7a3b9c","status":{"state":"completed"},"artifact":{"parts":[{"type":"text","text":"Top 5 regions by Q1 2025 revenue: ..."}]},"final":true}
```

Each SSE event is a JSON object. The `"final": true` flag signals task completion. Implement SSE reconnection with the `Last-Event-ID` header to resume after connection drops.

<!-- SCHEMA: FAQPage -->
## Frequently Asked Questions

### What is the Agent2Agent (A2A) protocol?

Agent2Agent (A2A) is an open HTTP/JSON protocol for AI agent interoperability, launched by Google Cloud in April 2025 and donated to the Linux Foundation. It standardizes how autonomous agents built on different frameworks and vendors advertise capabilities, delegate tasks, and exchange results. A2A defines agent cards for capability discovery, a five-state task lifecycle for tracking delegation, and SSE streaming for real-time progress on long-running tasks. Over 50 organizations including Salesforce, Atlassian, and SAP contributed to the protocol since its April 2025 launch.

### What is the difference between A2A and MCP?

MCP (Model Context Protocol) solves tool access: one agent calling an external API, database, or service within a single reasoning turn — stateless function calls. A2A solves agent coordination: one agent delegating an entire subtask to a peer agent that has its own reasoning loop, memory, and tools — stateful async delegation. MCP requires authentication by default; A2A's base profile makes authentication optional. The two protocols are complementary: a production system typically uses A2A for agent-to-agent coordination and MCP for each agent's tool calls.

### What are A2A agent cards?

Agent cards are JSON documents served at `/.well-known/agent.json` that describe an agent's capabilities, accepted input/output modes, and authentication requirements. An orchestrating agent fetches agent cards to discover what specialist agents can do and select the right peer for a subtask at runtime. By default in the A2A base profile, agent cards are served without authentication — the full skill surface is visible to any caller that can reach the endpoint. Production deployments should require authentication to access agent cards or restrict them to internal network segments.

### Is the A2A protocol secure?

A2A's base profile has significant security gaps. Authentication is optional by default, meaning anonymous task submission is permitted. CVE-2025-47421 (May 2025) demonstrated prompt injection via A2A task payload in the reference Python implementation: user-controlled task content passed directly to the LLM context without sanitization. Agent cards expose the full skill surface without authentication. Production A2A deployments must explicitly implement the extended authentication profile, sanitize all task payload content before it reaches the LLM, and validate outputs at every handoff boundary.

### What is the A2A task lifecycle?

A2A defines five task states: submitted (received, not yet processing), working (active processing, may stream SSE progress), input-required (remote agent needs clarification before proceeding — human-in-the-loop gate), completed (result available for retrieval), and failed (task failed with error details). The input-required state is A2A's mechanism for surfacing human-in-the-loop checkpoints in autonomous pipelines — when a subtask hits a decision requiring human judgment, the agent pauses rather than deciding autonomously. Task state is persisted on the receiving agent's side and retrieved by polling or SSE subscription.

### Which companies support A2A?

A2A launched in April 2025 with 50+ contributing organizations, including Salesforce, Atlassian, and SAP. Google Cloud led the initial specification and donated governance to the Linux Foundation for neutral stewardship. The protocol targets enterprise AI platforms where agents built on different frameworks — LangGraph, CrewAI, AutoGen, custom implementations — need to interoperate without vendor lock-in. The Linux Foundation home means no single vendor controls the specification roadmap.

### How does OpenLegion implement agent-to-agent communication?

OpenLegion's mesh architecture implements inter-agent coordination with mandatory authentication on every call — there is no anonymous delegation mode. Every agent-to-agent handoff routes through the credential vault, which validates caller identity and enforces per-agent ACL gates before the task reaches the receiving agent. Task payload content is sanitized at 56 network choke points for unicode attacks before reaching the LLM context. Typed handoff contracts are validated by the orchestrator, blocking relay injection payloads at the boundary. These controls run at the infrastructure layer outside the agent's code — an injected agent cannot disable them.

## Build Multi-Agent Systems With Authentication on Every Call

A2A provides the wire format for agent interoperability across frameworks and vendors. The security model — authentication, payload sanitization, output validation — must be built on top or enforced by the infrastructure layer. Most base-profile deployments will have anonymous delegation enabled by default.

For systems where agent-to-agent calls carry real credentials, access sensitive data, or trigger irreversible actions, infrastructure-layer enforcement is the only reliable guarantee. See [AI agent security and threat model](/learn/ai-agent-security) for the full threat taxonomy, or [multi-agent systems architecture](/learn/multi-agent-systems) for coordination patterns.

[Run multi-agent systems where every agent-to-agent call is authenticated, logged, and credential-isolated by default — get started on OpenLegion →](https://app.openlegion.ai)
