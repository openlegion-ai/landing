---
title: Model Context Protocol (MCP) — How AI Agents Use Tools
description: >-
  Model Context Protocol (MCP) is Anthropic's open standard for letting AI
  agents discover and call external tools. How it works, security caveats,
  and OpenLegion's MCP support.
slug: /learn/model-context-protocol
primary_keyword: model context protocol
secondary_keywords:
  - MCP
  - MCP server
  - MCP client
  - MCP integration
  - anthropic mcp
  - mcp tools
  - mcp security
  - mcp agents
date_published: 2026-05
last_updated: 2026-05
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison
---

# Model Context Protocol: The Open Standard for AI Agent Tools

**Model Context Protocol** (MCP) is the open standard Anthropic published in November 2024 that lets AI agents discover and call external tools — databases, file systems, APIs, internal services — without writing bespoke glue code. MCP servers expose capabilities; MCP clients (agent runtimes, IDEs, assistants) consume them. The protocol is deliberately minimal, which is also its production catch: deployments must layer authentication, sandboxing, and per-tool budgets on top before they're safe to run.

<!-- SCHEMA: DefinitionBlock -->

> **What is the Model Context Protocol?**
> The Model Context Protocol is an open JSON-RPC-based standard, originally published by Anthropic, that defines how AI agents (clients) discover and call capabilities exposed by tools (servers). It is the AI agent ecosystem's equivalent of LSP for editors or USB for hardware: one protocol, many implementations.

## TL;DR

- **MCP is the agent ecosystem's USB port** — one protocol that lets any compliant agent runtime use any compliant tool server without writing custom glue code.
- **Anthropic published MCP in November 2024**; major adopters during 2025 include OpenAI, Microsoft Copilot, Cursor, Zed, Continue, and most agent frameworks.
- **MCP defines four primitive types**: tools (function-style calls), resources (read-only data), prompts (reusable templates), and sampling (server-initiated LLM calls back to the client).
- **Transport is JSON-RPC over stdio or HTTP/SSE**. Stdio is the dominant local form; HTTP/SSE is gaining for remote MCP servers.
- **Production MCP requires three layers most tutorials skip**: authentication, sandboxing, and budget enforcement on tool calls.

## How MCP Works

An MCP client (an agent runtime or AI assistant) connects to one or more MCP servers. On connection, the client requests a capability list — what tools, resources, and prompts does this server offer? Each tool advertises a JSON schema for its arguments. The agent's LLM sees the tool list as part of its context and chooses tool calls accordingly. The client routes the calls to the right server, marshals JSON, and returns results.

The transport is JSON-RPC 2.0. Two transports are common: stdio (the client spawns the server as a subprocess and communicates over stdin/stdout — the default in Claude Desktop) and HTTP with Server-Sent Events for remote servers that live across a network boundary.

The protocol itself is intentionally minimal. The complexity is in what MCP servers expose: a filesystem server gives an agent read and write access to a directory; a Postgres server gives query access; a Slack server gives message-send and channel-read capabilities. The same agent can connect to multiple servers concurrently.

## MCP Servers vs MCP Clients

**MCP servers** are the tool side. Anyone can write one — Anthropic publishes reference SDKs in Python and TypeScript. As of mid-2026 there are thousands of community servers covering GitHub, Notion, Linear, Postgres, AWS, browser automation, and beyond. Servers tend to be small (a few hundred lines) because the protocol does most of the work.

**MCP clients** are agent runtimes, IDEs, and assistants. Claude Desktop was the reference client. Cursor, Zed, Continue, Windsurf, and most agent frameworks added MCP client support during 2025. A single MCP client typically supports multiple concurrent server connections — one agent talking to a filesystem server, a database server, and a Slack server simultaneously.

The key insight: the LLM does not speak MCP directly. The client renders the MCP tool list as function definitions inside the LLM prompt; the LLM emits a function call; the client maps the call to the right MCP server and forwards the JSON-RPC request.

## Security Considerations for Production MCP

MCP is a *capability-exposure* protocol — not an authorization or audit protocol. Production deployments need to add the parts MCP intentionally leaves out:

- **Authentication**: most MCP servers run unauthenticated locally. A multi-tenant deployment needs per-agent credentials and per-server auth boundaries.
- **Sandboxing**: an MCP filesystem server with broad path access is functionally root on the host. Run MCP servers in containers; do not mount sensitive volumes blindly.
- **Budget enforcement**: tool calls are not free. An agent calling an MCP web-scraping server in a loop can rack up serious cost. Per-agent budgets must cover tool invocations, not just LLM tokens.
- **Audit logs**: MCP itself does not standardize call logging. Production runtimes need to record every server call with arguments, response shape, and timing for [AI agent security](/learn/ai-agent-security) review and incident response.

The reference Claude Desktop MCP integration mounts servers as host subprocesses with the host user's filesystem permissions. That works for single-user developer setups; it is not production-safe.

## How OpenLegion Integrates MCP

OpenLegion is an MCP client by default. Agents in the runtime auto-discover MCP servers configured for their fleet, see the tool list in their context window, and call MCP tools through the same vault-proxied, ACL-gated path as built-in skills. The mesh enforces the production-grade layers MCP leaves out:

- Each MCP server runs in its own sandboxed namespace; the agent never gets direct stdio access to the server process.
- Per-agent ACLs gate which MCP servers a given agent is allowed to call.
- Every tool call counts against the agent's per-agent budget; an agent exceeding its cap is cut off whether the spend came from LLMs or MCP tools.
- The mesh records every MCP call into the trace log — the same telemetry covered in [AI agent observability](/learn/ai-agent-observability).

The result: you get the MCP ecosystem's breadth without inheriting its default trust assumptions.

## OpenLegion's Take

MCP is the most important agent-ecosystem standard since OpenAPI — it collapses what would otherwise be N × M integration work (every agent framework times every tool) into N + M servers and clients. But the protocol's intentional minimalism means production teams have to rebuild the boring infrastructure — auth, sandboxing, budgets, audit — that proprietary systems had bundled. Frameworks that treat MCP as just-add-water without layering those concerns ship insecure-by-default agents. Pick an [AI agent platform](/learn/ai-agent-platform) that takes MCP seriously enough to constrain it.

## CTA

**Deploy MCP-compatible agents with production-grade controls built in.**
[Get Started](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is the Model Context Protocol?

The Model Context Protocol (MCP) is an open JSON-RPC standard introduced by Anthropic in November 2024 that lets AI agents discover and call external tools through a uniform interface. MCP servers expose capabilities (tools, resources, prompts); MCP clients (agent runtimes, IDEs, assistants) consume them. Major adopters during 2025 include OpenAI, Microsoft Copilot, Cursor, Zed, and most agent frameworks.

### Who created MCP and is it open?

Anthropic created MCP and released it under an open specification with reference SDKs in Python and TypeScript. The spec is community-governed via GitHub, and there is no licensing or proprietary lock-in. Anyone can write an MCP server or client, and the major LLM providers ship MCP-compatible tooling.

### What is the difference between an MCP server and an MCP client?

An MCP server exposes capabilities — a Postgres server exposes query tools, a filesystem server exposes file read and write, a Slack server exposes message-send. An MCP client is the consumer side — typically an agent runtime, an IDE, or an AI assistant. A client can connect to many servers concurrently; a server can be reused by many clients.

### Is MCP secure by default?

No — and that is intentional. MCP is a capability-exposure protocol, not an authorization protocol. The reference implementations (Claude Desktop, the SDK examples) run servers unauthenticated as host subprocesses with the user's filesystem permissions. Production deployments must add authentication, sandboxing, per-tool budgets, and audit logging on top of MCP itself.

### How does MCP compare to OpenAI function calling?

OpenAI function calling is a single-vendor pattern for letting one LLM call functions defined in the API request — it does not standardize how tools are discovered, packaged, or shared across systems. MCP is a cross-vendor open standard for the same problem at the ecosystem level. The two are complementary: MCP servers expose capabilities; an MCP client can render them as OpenAI-format function definitions when calling GPT models, or as Anthropic tool-use format when calling Claude.

### Can I use MCP with any LLM provider?

Yes. MCP is LLM-agnostic — the client renders MCP tool definitions into whatever format the underlying LLM expects (Anthropic tool use, OpenAI function calling, Gemini function declarations). Runtimes like OpenLegion that support 100+ providers via LiteLLM automatically adapt MCP tools to each provider's calling convention.
