---
title: "Agent Handoff Patterns: Routing Work Between AI Agents"
description: "Agent handoff patterns define how AI agents transfer tasks, context, and credentials: push handoff, pull dispatch, blackboard-pointer routing, and streaming transfer for multi-agent systems."
slug: /learn/agent-handoff-patterns
primary_keyword: "agent handoff patterns"
last_updated: "2026-06-05"
schema_types:
  - FAQPage
related:
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/agentic-workflows
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-observability
---

# Agent Handoff Patterns: Routing Work Between AI Agents

Agent handoff patterns are the protocols by which one AI agent transfers a task, accumulated context, and execution authority to another agent — determining what data crosses the boundary, what gets discarded, and whether credentials travel with the task. Most handoff failures are not routing failures; they are context-loss or credential-leakage failures that only surface when a downstream agent fails silently or a compromised agent exfiltrates sensitive payload data.

<!-- SCHEMA: DefinitionBlock -->
An agent handoff pattern is a software design pattern that governs how an autonomous AI agent delegates a task to a peer or specialist agent, specifying the data contract for context transfer, the routing mechanism for task delivery, and the isolation guarantees that prevent credential or context leakage between agents.

## The Four Canonical Handoff Patterns

### Push Handoff: Caller Wakes the Callee Directly

In push handoff, the calling agent constructs a payload containing task context and directly notifies the receiving agent — typically by calling a function, sending a message, or invoking an API that wakes the callee. The caller controls exactly what data the callee receives, when it receives it, and which agent handles the task.

Push handoff is the pattern used by OpenAI Agents SDK's `handoff()` primitive (26,937 GitHub stars, MIT). The caller can optionally pass an `input_filter` function that strips or transforms context fields before transfer — but this requires explicit opt-in. Without `input_filter`, the full context window passes to the callee, including any sensitive content the caller has accumulated.

**Strengths**: low latency, direct control over task routing, simple to trace in observability tools.  
**Risks**: caller must explicitly strip credentials and sensitive context; tight coupling between caller and callee means routing logic must change when specialist agents are added or removed.

### Pull Dispatch: Callee Claims from a Shared Queue

In pull dispatch, the calling agent writes a task to a shared queue or inbox and does not directly notify any specific agent. Callee agents monitor the queue and claim tasks that match their capabilities. This enables load balancing across a worker pool and decouples the caller from knowledge of which specific agent will handle the work.

Pull dispatch reduces credential exposure: the queue message contains only a task description and an output key pointer, not the caller's full context. Callees retrieve additional context by reading the blackboard pointer — they never receive more than they need.

**Strengths**: horizontal scaling, loose coupling, natural load balancing across identical workers.  
**Risks**: queue depth can grow unbounded under load; task ordering guarantees depend on queue semantics; observability requires correlating task IDs across multiple queue reads.

### Blackboard Routing: Pointer-Based Context Isolation

In blackboard-pointer handoff, the caller writes its output to a named key on a shared persistent store — for example, `output/researcher/task_abc123` — and sends the callee only the key name. The callee reads the key and retrieves exactly the fields it needs. Raw credentials, intermediate scratchpad content, and the caller's full context never appear in the handoff message.

OpenLegion's `hand_off()` function implements this pattern natively: it writes output data to `output/{agent_id}/{handoff_id}` on the blackboard, creates a task entry in the recipient's inbox with a pointer to that key, and wakes the recipient. The recipient reads the blackboard key to retrieve the full payload. Credentials stored in the vault are injected by the mesh at execution time — they never appear in the handoff payload itself.

**Strengths**: highest credential isolation, callee reads only what it needs, full audit trail via key version history, decoupled timing (callee can read on its own schedule).  
**Risks**: adds a read operation vs. direct push; requires a reliable shared store with appropriate access controls.

### Streaming Handoff: Incremental Context Transfer

In streaming handoff, context transfers token-by-token or chunk-by-chunk as the calling agent generates it — rather than waiting for the full output before notifying the callee. This minimizes end-to-end latency in real-time pipelines where the callee can begin processing before the caller has finished.

Streaming handoff carries the highest credential exposure risk: the stream may include sensitive content generated mid-reasoning before the caller has had a chance to filter it. Streaming also complicates observability — attributing latency and errors to specific agents requires token-level tracing rather than single trace events.

**Strengths**: lowest end-to-end latency, enables real-time multi-agent collaboration.  
**Risks**: hardest to secure (credentials may appear mid-stream), most complex to observe, requires the callee to handle partial context gracefully.

## OpenLegion's Take: Why Context Loss and Credential Leakage Are the Real Handoff Bugs

Most multi-agent handoff failures fall into two categories: context-loss bugs and credential-leakage bugs. Both are preventable by design.

**Context-loss numbers**: A 2024 study on LLM context compression found that naive truncation at the handoff boundary — cutting the context window to fit token limits — caused a 34% drop in task-completion rate on multi-hop reasoning tasks compared to structured summarization. When a researcher agent hands a 4,000-token analysis to a writer agent with only a 200-token task description, the writer agent starts from scratch on context that the researcher already established. The solution is not a larger context window — it is a structured handoff payload with explicit fields for completed work, remaining work, and key findings.

**Credential leakage**: OWASP LLM06:2025 (Sensitive Information Disclosure) explicitly covers credential exfiltration via agent-to-agent message passing as a top-10 LLM vulnerability. Frameworks that pass the full Session or context object during handoff — including environment variables, bearer tokens, or vault-injected API keys — create an exfiltration path that a compromised downstream agent can exploit.

### The Context-Loss Problem: What Gets Dropped at the Boundary

The root cause of context loss is the mismatch between what the calling agent knows and what the handoff payload communicates. Callers often summarize by token budget rather than by relevance: they truncate the oldest context first, which may include the original task requirements or early decisions that the callee needs to understand the full picture.

Structured handoff payloads prevent this. Rather than truncating, the caller explicitly populates fields: task objective, work completed so far, outstanding subtasks, key findings, and output key pointer. The callee reads a structured spec rather than reconstructing context from a truncated transcript.

### Credential Exfiltration via Handoff Payloads (OWASP LLM06:2025)

Google ADK's `transfer_to_agent()` passes the full Session object — including conversation history — to the receiving agent, creating a context transfer of up to 32k tokens by default. If the session includes any injected credentials (common in pipelines where API keys are injected as system prompt context rather than via a vault), those credentials travel with every handoff.

OpenAI Agents SDK's `handoff()` mitigates this with `input_filter` (added v0.0.5, March 2025) — a function that strips or transforms context before transfer. But adoption requires explicit opt-in: the default behavior passes the full context. Teams using either framework need to audit their handoff implementations against [AI agent security: credential isolation and prompt injection defense](/learn/ai-agent-security) to verify no credentials cross handoff boundaries.

### The Blackboard-Pointer Pattern as the Secure Default

The blackboard-pointer pattern eliminates credential exposure at the protocol level rather than relying on application-layer filtering. Credentials stored in OpenLegion's vault are never injected into agent context — they are resolved at the API call boundary by the mesh proxy. This means there are no credentials in agent context to exfiltrate via handoff, regardless of which pattern the caller uses.

For teams adopting OpenLegion: `hand_off(to="agent_id", summary="...", data="...")` is the complete handoff API. The `data` parameter is written to the blackboard; the recipient reads it via the task's `output_key`. No credential appears in the payload. The blackboard key version history provides a full audit trail of what was transferred and when.

## How Major Frameworks Implement Handoff

### OpenAI Agents SDK: handoff() with input_filter (26,937 Stars)

openai/openai-agents-python (26,937 GitHub stars, MIT license) is the most widely cited agent handoff implementation in the current ecosystem. Released March 2025, it implements push handoff via a `handoff()` function that takes a target agent and an optional `input_filter` parameter.

```python
from agents import Agent, handoff, RunContextWrapper

def strip_credentials(ctx: RunContextWrapper, input_data: ResearchInput) -> ResearchInput:
    # Remove any sensitive fields before handing off
    return ResearchInput(task=input_data.task, context=input_data.context)

researcher = Agent(
    name="researcher",
    handoffs=[handoff(writer_agent, input_filter=strip_credentials)]
)
```

Without `input_filter`, the entire context including tool call history passes to the callee. The `input_filter` API is the correct approach but requires teams to implement the stripping logic explicitly.

### Google ADK: transfer_to_agent() and Session Object Transfer (19,995 Stars)

google/adk-python (19,995 GitHub stars, Apache-2.0) implements handoff via `transfer_to_agent()`, which passes the full `Session` object to the receiving agent. The Session includes the complete conversation history, which can reach 32k tokens in long-running pipelines. The callee receives everything — including context it does not need — and must explicitly discard irrelevant history.

ADK's approach prioritizes continuity (the callee has complete context) over isolation (the callee receives only what it needs). This is the right trade-off for tightly integrated agent pairs but creates unnecessary exposure in pipelines where callees should operate with limited context.

### LangGraph: Command(goto=) with Shared Typed State

LangGraph (langchain-ai/langgraph, Apache-2.0) implements agent routing via `Command(goto='node_name')` with optional state updates. The state is a typed dict shared across all nodes in the graph — not isolated per agent. Every node can read every field in the state unless the graph definition explicitly restricts access.

```python
from langgraph.types import Command

def researcher_node(state: AgentState) -> Command:
    result = researcher.invoke(state)
    return Command(
        goto="writer",
        update={"research_output": result, "completed_steps": state["completed_steps"] + ["research"]}
    )
```

LangGraph's shared state model is expressive for tightly coupled workflows but provides no credential isolation between nodes. Any node that has access to the graph can read any state field, including fields that should be restricted to specific roles.

### OpenLegion: hand_off() with Blackboard Pointer and Inbox Delivery

OpenLegion's `hand_off()` function implements blackboard-pointer handoff natively. The caller writes output data to `output/{agent_id}/{handoff_id}`, creates a task in the recipient's inbox with the `output_key` pointer, and wakes the recipient. The recipient reads the blackboard key to retrieve full payload data.

```python
hand_off(
    to="writer",
    summary="Research complete: langchain-alternative, 2847 words of source material",
    data='{"topic": "langchain-alternative", "sources_key": "research/langchain-alt-sources", "word_count_target": 3000}'
)
```

Credentials injected by the vault mesh proxy never appear in `data`. The recipient's `check_inbox()` returns the task with `output_key` pointing to the blackboard entry — the recipient calls `read_blackboard(output_key)` to retrieve the full structured payload.

## Handoff Data Contracts

### What to Include: Task Summary, Output Key, Relevant History

A well-designed handoff payload is a structured specification, not a transcript dump. Include:

- **Task summary** (≤200 words): what the callee needs to accomplish, stated precisely enough to act on without reading prior context
- **Output key pointer**: the blackboard key where the caller's output is stored, so the callee can retrieve structured data rather than parsing free text
- **Completed work summary**: what has already been done, stated as facts not as conversation — "Identified 7 CVEs affecting Flowise versions 1.6.x–1.8.x" not "We discussed CVEs earlier"
- **Outstanding subtasks**: the specific items the callee is responsible for, enumerated explicitly
- **Structured parameters**: any typed inputs the callee's task requires (target branch, customer ID, output format specification)

### What to Exclude: Raw Credentials, Full Context Windows, Intermediate Scratchpads

Exclude from handoff payloads:
- **API keys, tokens, and credentials** — these should be injected by the mesh at execution time, never stored in handoff data
- **Full conversation transcripts** — truncate to relevant summaries; the callee does not need to know every tool call the caller made
- **Intermediate reasoning scratchpads** — the caller's chain-of-thought while working through a problem is not useful to the callee and may contain sensitive information
- **Data the callee's role does not require** — apply least-privilege to context just as you apply it to permissions

### Structured vs. Free-Text Handoff Payloads

Free-text handoff summaries create ambiguity: the callee must parse the intent, re-derive constraints, and make assumptions about what the caller meant. This is a source of silent failure — the callee completes a task confidently that does not match what the caller intended.

Structured payloads with typed fields eliminate ambiguity. JSON with explicit keys for `task_type`, `output_format`, `constraints`, and `source_key` is more expensive to write but produces predictably lower callee failure rates. For [agentic workflow design and step sequencing](/learn/agentic-workflows), the handoff data contract is the interface specification between workflow stages — treat it with the same rigor as an API schema.

## Handoff Routing Mechanisms

### Static Routing: Hardcoded Agent IDs

Static routing sends every handoff of a given type to a specific named agent. Simple to implement, easy to trace, and reliable when the specialist agent is always available. Appropriate for small pipelines with one specialist per role.

Breaks when the target agent is unavailable, overloaded, or replaced. Requires code changes to reroute — no runtime flexibility.

### Dynamic Routing: LLM-Selected Specialist

Dynamic routing uses an LLM call to select the appropriate specialist agent based on task characteristics. The orchestrator presents a task description and a list of available agents with their capabilities; the LLM selects the best match.

Provides flexibility when agent capabilities overlap or when the task type is not known in advance. Adds latency (one extra LLM call per handoff) and introduces the possibility of routing errors when the LLM misclassifies the task. For [multi-agent system architecture and topology patterns](/learn/multi-agent-systems), dynamic routing is common in swarm topologies where no fixed task-to-agent mapping exists.

### Conditional Routing: Rule-Based Escalation

Conditional routing applies deterministic rules to select the target agent: if task complexity exceeds a threshold, route to a senior specialist; if the task domain is security, route to the security agent; if the result requires human review, escalate to the operator inbox.

More predictable than LLM-based routing and lower latency, but requires explicit rule definition for every routing condition. Works well in pipelines with well-defined escalation paths and task taxonomies.

### Fallback and Timeout Handling

Every handoff should define what happens when the callee does not respond within a timeout window. Options:
- **Retry with the same callee**: appropriate when the failure is likely transient (callee was busy)
- **Reroute to an alternative agent**: appropriate when the primary callee is consistently unavailable
- **Escalate to operator**: appropriate when the task requires human judgment or the pipeline is blocked
- **Write failure to blackboard and continue**: appropriate when the downstream task is optional or has a valid no-op fallback

For [AI agent orchestration and pipeline coordination](/learn/ai-agent-orchestration), timeout handling is a first-class pipeline design concern — not an afterthought. Define timeout values and fallback behaviors before deploying, not after the first production failure.

## Handoff Pattern Security and Reliability Comparison

| **Dimension** | **Push handoff** | **Pull dispatch** | **Blackboard routing** | **Streaming handoff** |
|---|---|---|---|---|
| **Routing mechanism** | Direct wake call to callee | Shared queue / inbox claim | Key write + callee watch | Incremental token stream |
| **Context isolation** | Caller controls payload; input_filter required | Queue message only | Highest — callee reads named key only | Lowest — full context crosses boundary |
| **Credential exposure risk** | Medium — depends on input_filter opt-in | Low — queue holds task pointer | Very low — credentials never in payload | High — stream may include sensitive context |
| **Observability** | Single trace event per handoff | Queue depth + claim events | Key version history + inbox events | Token-level tracing required |
| **Latency** | Lowest | Low (queue read overhead) | Low (blackboard read overhead) | Lowest end-to-end (streaming) |
| **Best for** | Tightly coupled specialist delegation | Load-balanced worker pools | Async decoupled pipelines | Real-time collaboration |

For [agent observability: tracing handoffs across pipeline stages](/learn/ai-agent-observability), each pattern generates different observability signals — push handoffs produce clean single-span events while streaming handoffs require token-level attribution to identify which agent introduced a latency spike.

<!-- SCHEMA: FAQPage -->
## Frequently Asked Questions

### What is an agent handoff pattern?

An agent handoff pattern is a protocol for transferring a task from one AI agent to another, specifying what context data crosses the boundary, how the receiving agent is notified, and what isolation guarantees prevent credential or memory leakage. The four canonical patterns are push handoff, pull dispatch, blackboard-pointer routing, and streaming handoff — each with different security, latency, and observability trade-offs.

### How does OpenAI Agents SDK implement handoff?

OpenAI Agents SDK (26,937 GitHub stars, MIT) implements handoff() as a push pattern — the calling agent invokes handoff() with a target agent and an optional input_filter function that strips fields from the context before transfer. The input_filter parameter was added in v0.0.5 (March 2025) and requires explicit opt-in; without it, the full context window passes to the callee, including any accumulated sensitive content.

### How does Google ADK implement agent handoff?

Google ADK (19,995 GitHub stars, Apache-2.0) uses transfer_to_agent(), which passes the full Session object — including conversation history — to the receiving agent. This creates a context transfer of up to 32k tokens by default. The receiving agent receives the complete history and must explicitly discard irrelevant prior context rather than receiving only the fields it needs.

### What is the blackboard-pointer handoff pattern and why is it more secure?

In blackboard-pointer handoff, the caller writes its output to a named key on a shared store (such as output/agent-id/task-id), then sends the callee only the key pointer — not the data itself. The callee reads only the fields it needs. Credentials never appear in the handoff message, eliminating the OWASP LLM06:2025 (Sensitive Information Disclosure) exfiltration vector. OpenLegion's hand_off() implements this pattern natively.

### What security risks exist in agent handoff?

The primary risk is credential exfiltration: frameworks that include environment variables, bearer tokens, or API keys in the context object passed during handoff expose them to the receiving agent, which may be compromised or have broader network access. OWASP LLM06:2025 identifies this as a top-10 LLM vulnerability. The secondary risk is context poisoning — an adversarial agent writing malicious content to a shared blackboard key that a downstream agent reads as trusted task input.

### How do you handle handoff failures and timeouts?

Robust handoff pipelines define a timeout — for example, 30 seconds for inbox delivery acknowledgment — and a fallback path: retry with the same callee, reroute to an alternative specialist, escalate to a human operator, or write a failure record to the blackboard. The calling agent should track handoff IDs and monitor for task completion events rather than assuming successful delivery after sending.

### What data should be included in a handoff payload?

Include: a concise task summary (under 200 words), a pointer to the output data key on the shared store, completed work facts, outstanding subtasks, and any structured parameters the callee's role requires. Exclude: raw API credentials, full conversation transcripts, intermediate reasoning scratchpads, and any data the callee's role does not need. Minimal, structured payloads reduce both token cost and attack surface.

## Secure Agent Handoff in OpenLegion

The handoff boundary is where most multi-agent reliability problems originate — context loss degrades downstream task quality, and credential leakage in the payload creates exfiltration risk that grows with pipeline length. Both failures are architectural, not implementation bugs: they stem from patterns that pass too much data across the boundary by default.

OpenLegion's blackboard-pointer handoff addresses both problems at the protocol level. `hand_off()` writes output to a named key, delivers only a pointer to the recipient's inbox, and relies on vault-proxied credential injection rather than context-embedded API keys. The recipient reads exactly what it needs from the blackboard, nothing more. The key version history provides an audit trail of every handoff without requiring additional instrumentation.

For the monitoring layer that catches failures the handoff protocol misses, see [agent observability: tracing handoffs across pipeline stages](/learn/ai-agent-observability). For the framework layer that determines which handoff pattern to choose, see [comparing AI agent frameworks for production deployments](/learn/ai-agent-frameworks).

[Build secure multi-agent pipelines on OpenLegion →](https://openlegion.ai)
