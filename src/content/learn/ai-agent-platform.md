---
title: AI Agent Platform — Deploy Secure Agents
description: >-
  OpenLegion is a managed AI agent platform with container isolation, credential
  vaulting, and budget controls. Bring your own LLM API keys.
slug: /learn/ai-agent-platform
primary_keyword: ai agent platform
secondary_keywords:
  - managed ai agent platform
  - self-hosted agent deployment
  - ai agent cost control
  - ai agent credential security
  - production ai agent infrastructure
date_published: 2025-12
last_updated: 2026-03
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /comparison
---

# The AI Agent Platform Built for Production

Most teams start with a framework. They string together LangGraph nodes or CrewAI crews, get a demo working, and then hit a wall: who manages the containers? Where do the API keys go? What stops a rogue agent from burning $500 in tokens overnight?

An **AI agent platform** answers those questions before you write your first agent. OpenLegion is a managed AI agent platform that ships container isolation, blind credential injection, per-agent budget controls, and deterministic orchestration — all enabled by default. Bring your own LLM API keys. No markup on model usage.

<!-- SCHEMA: DefinitionBlock -->

> **What is an AI agent platform?**
> An AI agent platform is managed infrastructure for deploying, orchestrating, and governing autonomous AI agents in production. Unlike raw frameworks, a platform handles isolation, credential management, cost controls, and observability so teams ship agents without building DevOps from scratch.

## TL;DR

- **Platform, not framework** — OpenLegion manages containers, credentials, budgets, and networking. You manage agent logic.
- **Blind credential injection** — Agents execute API calls through a vault proxy. They never see raw keys.
- **Container isolation per agent** — Each agent runs in its own Docker container with configurable resource caps (384MB RAM / 0.15 CPU default), non-root execution, and no shared filesystem.
- **Per-agent budget enforcement** — Set daily and monthly token limits with automatic hard cutoff. No surprise bills.
- **BYO API keys** — Connect any LLM provider via LiteLLM (100+ supported). You pay providers directly at their published rates.
- **Deterministic orchestration** — YAML-defined DAG workflows for task routing. No "CEO agent" making opaque decisions.
- **MCP-compatible extensibility** — Connect any MCP tool server (databases, filesystems, APIs) alongside 50+ built-in skills. Auto-discovered by agents.
- **Persistent agent memory** — Agents remember across sessions with vector search, workspace files, and error learnings. Context managed automatically.

## Managed vs Self-Hosted: When Each Makes Sense

The distinction between AI agent frameworks and AI agent platforms matters most at deploy time. A framework gives you building blocks — agent definitions, tool integrations, conversation patterns. A platform gives you the production layer: where agents run, how they access credentials, what stops them from going off the rails.

**Self-hosted frameworks** (LangGraph, CrewAI, AutoGen) give you maximum control. You own the infrastructure. You configure the containers. You build the credential pipeline. This works when your team has dedicated DevOps capacity and existing infrastructure that agents need to integrate with deeply.

**Managed AI agent platforms** handle the operational layer so your team focuses on agent logic. OpenLegion sits here — but with a critical difference: it's source-available under BSL 1.1. You get platform-grade operations (isolation, vaulting, budget controls) without vendor lock-in on the infrastructure side.

The question isn't which is "better." It's whether your team should spend engineering hours on agent security infrastructure or on the agents themselves.

### When self-hosted makes sense

- You have strict data residency requirements that preclude any managed service
- Your agents need deep integration with existing on-prem infrastructure
- Your team already operates Kubernetes clusters and has mature DevOps practices
- You need to customize the runtime environment at a level managed platforms don't expose

### When a managed AI agent platform makes sense

- You need agents in production within days, not months
- Your team is 1–5 engineers and can't dedicate headcount to infrastructure
- You need [AI agent security](/learn/ai-agent-security) guarantees without building them yourself
- You want cost controls and request tracing without instrumenting everything manually

## The BYO API Keys Model — Why It Matters

Most managed AI platforms charge per token or take a margin on model usage. This creates two problems: cost opacity and provider lock-in.

OpenLegion takes a different approach. You bring your own LLM API keys from any provider — OpenAI, Anthropic, Google, Mistral, or any of 100+ providers supported via LiteLLM. Your tokens flow directly to the provider at their published rates. OpenLegion charges for platform and orchestration, not for model access.

This matters for three reasons:

**Cost transparency.** You see exactly what each agent spends on each provider. No hidden markup. No "platform tokens" that obscure real costs.

**Provider flexibility.** Swap models per agent. Run GPT-4o for complex reasoning, Claude for long-context tasks, and a local Llama model for high-volume classification — all in the same project, managed from the same dashboard.

**No lock-in.** If you leave OpenLegion, your API keys and model configurations go with you. There's no proprietary model layer to migrate away from.

## Who It's For

### Solo developers building agent products

You're shipping an agent-powered product and need it secure from day one. OpenLegion gives you production infrastructure — container isolation, credential vaulting, cost controls — without hiring a DevOps team. Start with a built-in team template (Dev Team, Sales Pipeline, Content Studio) and customize from there.

### Startup teams shipping fast

Your team is 2–10 engineers. You need agents in production this sprint, not next quarter. The install is three commands: `git clone`, `./install.sh`, `openlegion start`. The guided setup wizard configures your API keys, picks a team template, and deploys your first agent fleet in under three minutes.

### Enterprise security teams

You need request tracing and workflow observability, credential isolation that survives a compromised agent, and budget controls that prevent runaway costs. OpenLegion's architecture is designed for environments that require SOC 2-level controls. Deterministic DAG execution means every workflow step is explicit and traceable — no opaque LLM decision-making in the control plane. See our [AI agent security](/learn/ai-agent-security) page for the full threat model.

## Production Readiness: What OpenLegion Handles vs DIY

| Capability | DIY (Framework Only) | OpenLegion |
|---|---|---|
| **Agent runtime** | You configure Docker, manage images, handle networking | Each agent auto-provisioned in isolated container (384MB RAM, 0.15 CPU default, non-root, no-new-privileges) |
| **Credential management** | Environment variables or custom vault integration | Vault proxy with blind injection — agents never see raw keys |
| **Cost controls** | Manual tracking, no hard limits | Per-agent daily/monthly budgets with automatic cutoff |
| **Orchestration** | Code your own routing logic or use LLM-based routing | YAML-defined DAG workflows — deterministic, auditable |
| **Observability** | Integrate LangSmith, Datadog, or custom logging | Built-in dashboard with live streaming, cost charts, request traces |
| **Multi-channel deployment** | Build integrations per channel | CLI, Telegram, Discord, Slack, WhatsApp — plus webhook endpoints for external integrations |
| **Browser automation** | Configure Playwright/Puppeteer, manage Chrome instances | Shared Camoufox (stealth Firefox) browser service with KasmVNC, CDP control, auto-recovery |
| **Tool extensibility** | Build custom integrations or use LangChain tools | MCP-compatible — connect any MCP server + 50+ built-in skills, auto-discovered |
| **Agent memory** | Build custom RAG or state management | Persistent vector memory per agent with auto context management |
| **Model failover** | Custom retry logic per provider | Configurable failover chains across providers via LiteLLM |

The summary: if you're evaluating [AI agent frameworks](/learn/ai-agent-frameworks) and find yourself building more infrastructure than agent logic, you're solving a platform problem with framework tools. OpenLegion handles the platform layer so you can focus on what your agents actually do.

## MCP-Compatible Tool Extensibility

OpenLegion supports the Model Context Protocol (MCP) for connecting external tools. Any MCP server — databases, filesystems, APIs, internal services — can be added via configuration and auto-discovered by agents. This sits alongside 50+ built-in skills covering browser automation, file operations, HTTP requests, web search, memory management, code execution, and mesh communication.

MCP integration means agents aren't limited to built-in capabilities. Connect a Postgres server, a GitHub integration, or a custom internal API — agents discover available tools automatically and use them within their permission boundaries.

## Persistent Agent Memory

Agents in OpenLegion maintain memory across sessions using vector search, workspace files, and error learnings. When an agent encounters a problem and solves it, the solution is stored and recalled in future sessions — reducing repeated failures and improving execution quality over time.

Memory is scoped per agent and stored in each agent's isolated SQLite + vector database within its container. Auto context management keeps token usage efficient by surfacing only relevant memories for the current task, rather than loading entire conversation histories.

## Architecture: The Three-Zone Trust Model

OpenLegion separates every deployment into three trust zones:

**Zone 1 — User Zone (Full Trust).** This is where you interact: CLI, Telegram, Discord, Slack, WhatsApp — plus webhook endpoints. All inputs are validated and sanitized before reaching the mesh.

**Zone 2 — Mesh Host (Trusted Coordinator).** The FastAPI server that runs the Blackboard (shared state via SQLite), PubSub message router, Credential Vault (the proxy that handles blind injection), Orchestrator with permission matrix, and the Container Manager with cost tracking. This is the brain — and it's the only component that touches your API keys.

**Zone 3 — Agent Containers (Untrusted).** Each agent runs as its own FastAPI instance in a dedicated Docker container with its own `/data` volume, memory database, and strict resource caps. Even a fully compromised agent cannot access your API keys, other agents' data, or the host system.

This architecture means [AI agent orchestration](/learn/ai-agent-orchestration) and security aren't separate concerns — they're the same system.

## Getting Started

```bash
git clone https://github.com/openlegion-ai/openlegion.git
cd openlegion && ./install.sh
openlegion start   # inline setup on first run, then agents deploy in isolated containers
```

First install takes 2–3 minutes. Requires Python 3.10+ and Docker.

## CTA

**Ready to deploy secure agents?**
[Get Started](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an AI agent platform?

An AI agent platform is managed infrastructure that handles the operational concerns of running autonomous AI agents: container isolation, credential management, cost controls, orchestration, and observability. It sits above frameworks like LangGraph or CrewAI and provides the production layer that frameworks leave to you.

### What is the best AI agent platform for production?

The best AI agent platform for production depends on your security and operational requirements. If you need built-in container isolation, blind credential injection, and per-agent budget controls without building custom infrastructure, OpenLegion provides these out of the box. For teams deeply invested in the Microsoft ecosystem, Azure AI Agent Service is worth evaluating. For maximum flexibility with more DIY effort, self-hosting LangGraph with LangSmith gives strong observability.

### What is an enterprise AI agent platform?

An enterprise AI agent platform adds governance, compliance, and security controls on top of basic agent orchestration. Key requirements include: credential isolation (agents should never see raw API keys), workflow traceability, budget enforcement to prevent runaway costs, role-based access control, and deployment options that support data residency requirements. OpenLegion's architecture is designed for environments that require these controls.

### Can I host AI agents with my own API keys?

Yes. OpenLegion uses a BYO (Bring Your Own) API key model. You connect your own keys from any LLM provider — OpenAI, Anthropic, Google, Mistral, and 100+ others via LiteLLM. Your tokens flow directly to the provider at their published rates. Bring your own LLM API keys. No markup on model usage.

### Managed vs self-hosted AI agents: what's the difference?

Managed AI agent platforms handle container provisioning, credential vaulting, cost controls, and observability for you. Self-hosted means you deploy a framework (LangGraph, CrewAI, AutoGen) on your own infrastructure and build these operational layers yourself. Managed is faster to production and requires less DevOps investment. Self-hosted gives maximum infrastructure control. OpenLegion offers a hybrid: source-available code (BSL 1.1) you can self-host, with managed platform capabilities built in.

### How does OpenLegion compare to other AI agent platforms?

OpenLegion differentiates on security-first architecture. Based on public documentation at the time of writing, no other major [AI agent framework](/learn/ai-agent-frameworks) provides built-in blind credential injection, mandatory container isolation per agent, or native per-agent budget enforcement. See our [frameworks comparison](/learn/ai-agent-frameworks) for a detailed breakdown across OpenClaw, LangGraph, CrewAI, AutoGen, and Semantic Kernel.

### What license does OpenLegion use?

OpenLegion is source-available under the BSL 1.1 license and available on [GitHub](https://github.com/openlegion-ai/openlegion). The project also offers a hosted platform for teams who want managed infrastructure without self-hosting.

### How quickly can I deploy my first agent?

Three commands and under three minutes. `git clone`, `./install.sh`, `openlegion start`. The guided setup wizard configures your API keys, selects a team template, and provisions your first isolated agent fleet automatically.

---

## Internal Links to Include

| Anchor Text | Destination |
|---|---|
| AI agent platform | /learn/ai-agent-platform |
| AI agent orchestration | /learn/ai-agent-orchestration |
| AI agent frameworks comparison | /learn/ai-agent-frameworks |
| AI agent security | /learn/ai-agent-security |
| OpenClaw alternative | /openclaw-alternative |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Documentation | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
