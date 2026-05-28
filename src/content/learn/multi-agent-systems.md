---
title: Multi-Agent Systems Architecture - Design, Topology, and Security
description: Multi-agent systems architecture defines how autonomous agents communicate, coordinate, and maintain trust boundaries. Covers topologies, inter-agent protocols, and production security design.
slug: /learn/multi-agent-systems
primary_keyword: multi-agent systems architecture
secondary_keywords:
  - multi-agent system design
  - agent communication protocols
  - agent topology patterns
  - a2a protocol
  - multi-agent security
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /comparison/langgraph
  - /comparison/autogen
---

# Multi-Agent Systems Architecture: Design Topologies, Communication Protocols, and Trust Boundaries

A multi-agent system is a network of autonomous AI agents that coordinate to accomplish tasks no single agent can handle alone. The architectural decisions made at design time - topology, communication protocol, state sharing model, and trust boundary placement - determine whether the system scales gracefully or fails catastrophically in production. A star topology with shared state creates a single point of failure; tight coupling between agents means one compromised component can pivot to others; shared process memory creates race conditions that show up as CVEs.

<!-- SCHEMA: DefinitionBlock -->

> **What is a multi-agent system?**
> A multi-agent system is a network of two or more autonomous AI agents that communicate, coordinate, and act collectively to accomplish tasks beyond the capability of any single agent, defined by its topology (how agents are connected), communication protocol (how agents exchange information), state sharing model, and trust boundary placement.

## Core Architectural Properties

### Agent autonomy vs coordination: the fundamental tension

Each agent in a multi-agent system has its own context window, tool set, and decision process. Autonomy means agents can act without constant supervision. Coordination means agents must align on shared goals, hand off work, and integrate results. The architecture resolves this tension: loose coupling (agents interact only through a controlled message bus) preserves autonomy; tight coupling (agents share state directly) enables faster iteration but reduces blast radius containment.

### Message-passing vs shared memory: two communication models

**Message-passing**: Agents communicate by sending discrete messages through a coordination layer (blackboard, message queue, or event bus). Agent A does not know Agent B's internal state; it only knows what B writes to the shared channel. This model is harder to debug but easier to secure.

**Shared memory**: Agents access a common data store directly. This is simpler to implement for small systems. Under concurrent access, shared mutable state creates race conditions. CVE-2025-64168 (Agno, CVSS 7.1, October 2025) is a production example: under high async concurrency, session_state shared between agents was assigned to the wrong user session, exposing one user's data to a different user's request context.

### Tight coupling vs loose coupling

Tight coupling: Agent A calls Agent B's API directly. One service's failure cascades to the next. Loose coupling: Agent A writes its output to a blackboard key. Agent B subscribes to that key and processes the output when ready. Agent B's failure does not block Agent A.

## Multi-Agent Topology Patterns

### Star topology: hub-and-spoke with a supervisor agent

In star topology, a central supervisor agent coordinates all worker agents. AutoGen's GroupChat with a coordinator, CrewAI's Manager, and LangGraph's supervisor pattern all implement star topology. Star topology creates a single point of failure: if the supervisor is compromised via prompt injection from a tool result, it can issue malicious instructions to all worker agents.

### Mesh topology: peer-to-peer agent communication

In mesh topology, agents communicate directly with each other without a central coordinator. Pure mesh topology is rare in production. In a full mesh of N agents, there are N*(N-1)/2 potential communication channels, each a potential attack surface.

### Hierarchical topology: nested teams and subagent delegation

Hierarchical topology organizes agents into nested teams. A top-level coordinator manages sub-team leads; each sub-team lead manages specialist workers. The risk: a compromised mid-level coordinator can issue malicious instructions to all agents it manages.

### Flat/fleet topology: equal-rank agents coordinating through a shared bus

Flat fleet topology uses equal-rank agents that communicate exclusively through a shared message bus (blackboard) with no direct agent-to-agent calls. This is OpenLegion's fleet model: each agent operates autonomously, publishes to the blackboard, and receives work via task inbox. A compromised agent can only affect what it writes to the blackboard - it cannot directly call other agents or access their context.

## Inter-Agent Communication Protocols

### A2A: Google's open standard for cross-framework agent communication

A2A (Agent-to-Agent) protocol, released by Google in April 2025, standardizes inter-agent communication across different frameworks and runtimes. A2A defines three primitives: capability discovery, task delegation, and streaming results. As of mid-2026, A2A is supported by 50+ technology partners. OpenLegion supports A2A for cross-framework agent coordination.

### MCP: standardizing tool access across agents

Model Context Protocol (MCP), released by Anthropic in November 2024, standardizes how agents access external tools. MCP defines a server/client protocol where tools are exposed as MCP servers and agents act as MCP clients. By mid-2026, MCP has 1,000+ community servers covering most common tool categories.

MCP also introduces security risks: tool descriptions can be poisoned to inject malicious instructions into agent context, compromised servers can exfiltrate credentials passed in tool parameters, and rug-pull attacks can change tool behavior post-approval. For the full MCP threat model, see [AI agent security: topology and coupling choices](/learn/ai-agent-security).

### Blackboard pattern: shared persistent state as communication medium

The blackboard pattern routes all inter-agent communication through a shared persistent data store. Agents write task outputs, status updates, and coordination signals to named keys; other agents read from relevant keys. OpenLegion implements the blackboard pattern using SQLite with WAL mode for concurrent access, combined with pub/sub messaging for event-driven coordination.

## OpenLegion's Take: Why Architecture Is a Security Decision

Most multi-agent system failures are architecture failures, not application bugs. Shared state between agents creates race conditions: CVE-2025-64168 (Agno, CVSS 7.1, October 2025) - one user's session data exposed to another under async concurrency, patched in v2.2.2. Tight coupling between agents amplifies prompt injection blast radius: COLM 2025 research showed a 97% attack success rate against AutoGen Magentic-One via malicious file injection, where tight coupling allowed injected instructions to affect the entire agent team.

OpenLegion's four-zone trust model is the production instantiation of these principles: Zone 1 agents (sandboxed containers) cannot communicate directly. All inter-agent messages route through Zone 2 Mesh Host. The Mesh Host enforces per-agent write permissions and maintains the audit log. Zone 4 Vault Proxy ensures credentials never enter Zone 1 containers.

## Trust Boundaries in Multi-Agent Systems

### Why shared process = shared blast radius

When multiple agents run in the same Python process, they share the heap, the environment, and the interpreter. A successful prompt injection in Agent A can read Agent B's variables, call Agent B's functions, and access any API key in the shared environment. Container isolation per agent eliminates the shared blast radius problem.

### Structural trust separation: containers, zones, and credential scoping per agent

Structural trust separation means the limits of what one agent can affect are enforced by the infrastructure, not by application code. Per-agent credential scoping extends this principle: each agent has access only to the credentials it legitimately needs. OpenLegion's vault proxy enforces per-agent credential access lists.

### The supervisor agent problem: when the coordinator is the weakest link

In star topology, the supervisor agent is simultaneously the most powerful and most targeted component. Mitigations: limit the supervisor's tool access to coordination-only operations; route supervisor output through a human-in-the-loop checkpoint for high-consequence actions; consider flat fleet topology where no single agent holds supervisor authority.

## Common Multi-Agent Architecture Failure Modes

### Shared-state race conditions: CVE-2025-64168 as a case study

CVE-2025-64168 (Agno, CVSS 7.1, CWE-362 + CWE-668, October 2025, patched in Agno v2.2.2) disclosed a race condition in Agno's session_state management layer. Under high async concurrency, session_state was assigned to the wrong session - exposing one user's data to a different user's request context. The architectural fix is separating user sessions into isolated containers where there is no shared mutable state to race on.

### Prompt injection amplification in tightly coupled systems

Research published at COLM 2025 demonstrated a 97% attack success rate against Magentic-One (AutoGen's multi-agent system) via malicious local files for control-flow hijacking. The tight coupling between agents meant that once the malicious content was in the context of one agent, it could influence the entire team's execution path.

### Star-topology bottleneck and single point of failure

A star topology supervisor creates two failure modes: bottleneck (every agent interaction requires the supervisor's participation) and single point of failure (supervisor unavailability halts the entire system). Flat fleet topology with a shared coordination bus eliminates both.

### Agent role drift: when agents exceed their defined scope

In systems without strict per-agent tool permissions, agents with broad tool access may take actions outside their assigned role. OpenLegion's permission model defines each agent's allowed tool set in its configuration; tool calls outside the allowed set are rejected before execution.

## Multi-Agent Systems Architecture in OpenLegion

OpenLegion implements flat fleet topology with four-zone trust separation. Agents run in isolated Docker containers (Zone 1), communicate exclusively through the Mesh Host Blackboard and pub/sub bus (Zone 2), access credentials via the Vault Proxy (Zone 4), and never communicate directly with each other.

OpenLegion supports both A2A (for cross-framework agent delegation) and MCP (for standardized tool access). Security controls apply equally to both protocols: vault proxy credential injection for authenticated calls, container isolation for tool execution, and audit logging for all inter-agent communication.

For a detailed analysis of OpenLegion's security model, see [what an AI agent platform provides for multi-agent system deployment](/learn/ai-agent-platform). For runtime coordination primitives, see [AI agent orchestration: blackboard, pub/sub, and handoff primitives](/learn/ai-agent-orchestration).

## CTA

**Multi-agent coordination with architectural security guarantees.**
[Get Started](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [See the Platform](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is a multi-agent system architecture?

A multi-agent system architecture defines how multiple autonomous AI agents are structured to communicate, coordinate, and maintain trust boundaries. It specifies the topology (star, mesh, hierarchical, or flat fleet), the communication protocol (message-passing or shared memory), the state sharing model, and the trust boundary placement. The architectural choices made at design time determine whether the system is resilient, auditable, and secure in production.

### What is the difference between a star topology and a flat fleet topology in multi-agent systems?

In a star topology, a central supervisor agent coordinates all other agents, creating a single point of failure: if the supervisor is compromised or fails, the entire system is affected. In a flat fleet topology (used by OpenLegion), equal-rank agents coordinate through a shared message bus (blackboard) with no direct agent-to-agent communication. This combines resilience with auditability, since all inter-agent communication passes through the bus and can be logged and inspected.

### What is the A2A protocol for multi-agent systems?

A2A (Agent-to-Agent) is an open inter-agent communication protocol released by Google in April 2025. It standardizes how agents discover each other's capabilities, delegate tasks, and exchange streaming results across different frameworks. As of mid-2026, A2A is supported by 50+ technology partners including frameworks, cloud providers, and agent platforms. OpenLegion supports A2A for cross-framework agent coordination.

### What causes race conditions in multi-agent systems?

Race conditions in multi-agent systems occur when multiple agents read and write shared state concurrently without proper synchronization. CVE-2025-64168 in the Agno framework (CVSS 7.1, October 2025) is a documented production example: under high concurrency, session_state shared between agents was assigned to the wrong user session, exposing one user's data to another. Message-passing architectures with a controlled bus eliminate this vulnerability by routing all state changes through a single serialized coordination layer.

### How does prompt injection spread in a multi-agent system?

In tightly coupled multi-agent systems where agents share a process or call each other directly, a successful prompt injection in one agent can spread to others. Research at COLM 2025 demonstrated a 97% attack success rate against AutoGen Magentic-One using malicious local files for control-flow hijacking. Architectural mitigations include container isolation per agent (blast radius limited to one sandbox) and bus-mediated communication (all inter-agent messages pass through an inspectable layer).

### What is the blackboard pattern in multi-agent systems?

The blackboard pattern is a multi-agent coordination architecture where agents communicate by reading from and writing to a shared persistent data store rather than calling each other directly. Agents post results, status updates, and task outputs to the blackboard; other agents subscribe to relevant keys. This decouples agents structurally and makes all inter-agent communication auditable since it passes through a single store. OpenLegion implements the blackboard pattern using SQLite with WAL mode for concurrent access, combined with pub/sub messaging for event-driven coordination.
