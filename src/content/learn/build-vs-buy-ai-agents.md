---
title: "Build vs Buy AI Agents for SaaS: What Building Really Takes"
description: "Build vs buy AI agents for a SaaS product: every harness part you would own, our engineer-month estimate, the three real options compared, and a checklist."
slug: "/learn/build-vs-buy-ai-agents"
primary_keyword: "build vs buy ai agents"
secondary_keywords:
  - "build or buy ai agents"
  - "ai agent harness"
  - "managed agents"
  - "ai agent framework"
  - "multi-tenant ai agents"
  - "cost to build an ai agent"
  - "build vs buy ai"
date_published: "2026-11-04"
last_updated: "2026-11-04"
schema_types:
  - Article
  - FAQPage
  - DefinedTerm
page_type: "learn"
related:
  - "/learn/agent-harness"
  - "/learn/managed-agents"
  - "/learn/add-ai-agents-to-your-app"
  - "/learn/ai-agent-multi-tenancy"
  - "/learn/ai-agent-frameworks"
  - "/learn/ai-agent-cost"
---

# Build vs Buy AI Agents: What It Really Takes to Ship Agents in Your Product

Build vs buy AI agents is a decision about the harness, not the model. A model call with tools works in a week. Shipping agents to paying customers also takes per-customer isolation, secrets, approvals, metering tied to billing, receipts, webhooks, injection handling, evals and on-call. Our estimate: 8.5 to 17 engineer-months for a first production version, then one to two engineers to run it. Build if the agent is your core IP or must run on your infrastructure. Otherwise, buy the harness and build the agent.

<!-- SCHEMA: DefinitionBlock -->

> **What is the build vs buy decision for AI agents?**
> The build vs buy decision for AI agents is the choice between writing and operating your own agent harness (the tool execution, isolation, approvals, metering, audit and operations around a model) and adopting a framework, a model vendor's managed agents, or a hosted harness that supplies some or all of it.

## What "build" really means: the harness around the model call

The demo is a loop: send the conversation and tool schemas to a model, run the tool it picks, feed the result back. Every framework does that in a page of code. What you actually build is the [agent harness](/learn/agent-harness): everything that makes it safe for your first customer and your four-hundredth at once.

### Tool calling and execution

Validation, timeouts, parallel calls and streaming are routine. Retries are the trap: a write tool retried after a timeout sends the campaign twice, so every tool that changes state needs an idempotency key.

### Per-customer isolation

Multi-tenant AI agents need a tenant key on every run, memory, file, embedding and log row, enforced in the database rather than by convention in app code, and covered by cross-tenant tests. The usual leak is retrieval, not SQL: a shared vector index that surfaces one customer's document in another's context. See [AI agent multi-tenancy](/learn/ai-agent-multi-tenancy).

### Secrets

The agent acts with your customers' credentials for the systems it touches, so you own storage, refresh and per-customer scoping. The model must never hold a raw key, because anything in context can be echoed or exfiltrated. You need a broker that injects credentials outside the model and a leak scan on tool output ([credential management for AI agents](/learn/credential-management-ai-agents)).

### Approvals

Pausing for a person is a durable-execution problem: state must survive a deploy, the request must reach the right user in your UI, and the decision must be recorded as theirs. Choosing what to gate is harder. Gate everything and users click through; gate nothing and the first bad send is your incident. See [human-in-the-loop AI agents](/learn/human-in-the-loop-ai-agents).

### Metering and spending caps tied to billing

Counting tokens afterwards is easy. Enforcing a plan means reserving credits before each step, refusing at the cap, anchoring monthly windows to each customer's billing day, and reconciling with your billing system. A cap enforced after the run is just a bill. See [AI agent cost controls](/learn/ai-agent-cost).

### Receipts and audit

When a customer writes "your AI deleted my campaign", support needs who asked, which tool ran with what inputs, what it cost and who approved it. Retention and export requests arrive with your first enterprise deal.

### Webhooks

Agent work is asynchronous, so your backend must hear when a run finishes, waits for approval or hits a cap. That means signed events, retries, at-least-once delivery with ids to dedupe on, and replay for a receiver that was down.

### Prompt-injection handling for untrusted content

Web pages, inbound email and uploaded files can carry instructions, and no filter catches all of them. The workable defense is structural: label untrusted content, track it through the run, and require approval before any side effect it could have influenced. See [AI agent prompt injection](/learn/ai-agent-prompt-injection).

### Model churn

Providers keep shipping new models and retiring old ones. Each move shifts tool-calling behavior, cost and latency, and prompts tuned for one model drift on the next. (OpenLegion's answer is tiers: an agent picks a quality-versus-cost tier rather than a model id, and the platform keeps each tier on current models.)

### Evals

You need representative tasks per agent, graders, a CI gate, and regression runs whenever prompts, tools or models change. The first suite is cheap. Keeping it representative of real customer requests is not.

### On-call

Provider outages, rate-limit storms, a runaway loop draining one customer's budget at 2 a.m. You need alerts, runbooks and a kill switch that stops a run at its next step, not at the end of the job.

## How many engineer-months does building take? Our estimate

This is our estimate, not a survey: published figures on the cost to build an AI agent mostly measure enterprises adopting internal assistants. We priced the smallest version we would put in front of paying customers, for an experienced SaaS team that already has auth, a database and billing, with one model provider and one agent product.

| Component | First production version (engineer-months) | What keeps costing you |
|---|---|---|
| Tool calling and execution | 1–2 | New tools, provider API changes |
| Per-customer isolation | 1–2 | Cross-tenant tests on every schema change |
| Secrets | 0.5–1.5 | Refresh failures, rotation |
| Approvals | 1–1.5 | Tuning what needs a person |
| Metering and caps tied to billing | 1–2 | Plan changes, reconciliation |
| Receipts and audit | 0.5–1 | Retention and export requests |
| Webhooks | 0.5–1 | Delivery failures, versioning |
| Injection handling | 1–2 | Every new content source |
| Model churn | 0.5–1 | Re-tuning on each model move |
| Evals | 1–2 | Keeping datasets current |
| On-call setup | 0.5–1 | The rotation itself |
| **Total** | **8.5–17** | **One to two engineers, full time** |

That is about three engineers for three to six months, then 12 to 24 engineer-months a year of upkeep, mostly model churn, evals and on-call. It excludes your agent's instructions, tools and UI, which you build under every option. Code sandboxes, hours-long runs, several providers or data-residency rules push both numbers up. An agent that only reads and drafts shrinks approvals and injection handling a lot.

## The three real options compared

### Build on an AI agent framework or SDK

LangGraph (MIT) describes itself as a low-level orchestration framework and runtime for long-running, stateful agents, with checkpointing and human-in-the-loop pauses. The Vercel AI SDK (Apache 2.0) is a TypeScript toolkit for AI apps and agents. Mastra is a TypeScript agent framework, Apache 2.0 outside its `ee/` directories. The OpenAI Agents SDK (MIT, Python and TypeScript) provides agents, handoffs, guardrails, sessions and tracing. All of them give you the loop, not tenants, billing or a pager. Our [AI agent frameworks comparison](/learn/ai-agent-frameworks) goes deeper.

### Use a model vendor's managed agents

As of November 2026, per each vendor's documentation:

- **Claude Managed Agents** (Anthropic, beta): a hosted harness with cloud or self-hosted sandboxes, custom tools your app executes, and per-tool permission policies. Billed on tokens plus $0.08 per running session-hour.
- **OpenAI Agents API**: OpenAI's Codex harness as a managed API that handles sessions, orchestration and context compaction. Model usage at API rates, hosted sandboxes at container rates.
- **Google Gemini Enterprise Agent Platform**: Agent Runtime, Sessions, Memory Bank and an evaluation service, for agents built with ADK, LangGraph and others.
- **Amazon Bedrock AgentCore**: modular Runtime, Harness, Memory, Gateway, Identity, Policy and Evaluations services for any framework or model, priced on consumption.

These solve the runtime. Their core objects are agents, sessions and environments, and the customer is your organization. Mapping your customers onto them, enforcing each plan and keeping a per-customer record is still your code. Our [managed agents comparison](/learn/managed-agents) covers each one in depth.

### Buy a multi-tenant agent harness

OpenLegion is our product, so weigh this accordingly. You define the agent and its tools as code. OpenLegion runs one isolated workspace per end customer, checks every tool call against policy, keeps a receipt for each action, holds three kinds of action for a person's approval (reaching a third party, deleting data, acting on untrusted content), and reserves credits against per-customer caps before each step. Keys stay in a vault the model never sees.

Today it is in private beta and hosted only, with no published partner prices, a TypeScript kit still in development, and no SOC 2, ISO 27001 or HIPAA certification. For a buyer, that means joining as an early partner, not signing up and testing alone this afternoon.

| | Framework or SDK | Model vendor's managed agents | Multi-tenant agent harness |
|---|---|---|---|
| **Effort** | Highest: the whole harness (our estimate 8.5–17 engineer-months) | Medium: runtime done; tenancy, plan caps and audit are yours | Lowest: your agent, tools and UI |
| **Control** | Full, down to the loop | Within the vendor's configuration surface | Your instructions, tools and limits, inside the platform's policy model |
| **Multi-tenancy** | You build it | You map customers onto sessions | Built in: a workspace per customer |
| **Lock-in** | Low: open-source code, any model | One model family (Anthropic, OpenAI) or one cloud (Google, AWS) | Platform templates and policies; tools stay your functions or MCP server |
| **Cost model** | Free library, plus infra, tokens and your team | Tokens plus runtime or compute charges | Platform credits (OpenLegion: prepaid pool, per-customer caps, prices not yet published) |

## When building is the right call

- **The agent is your core IP.** If customers pay for how the agent plans, recovers and uses tools, the harness is the product. Don't rent it.
- **You need on-prem or self-hosting.** Hosted harnesses, OpenLegion included, are out. Some managed services can run execution in your sandbox, so check whether the control plane must be yours too.
- **You need a runtime nobody offers**, such as sub-second voice, on-device agents or robots.
- **You have the team and the volume.** At a large enough token bill, one to two engineers can cost less than a platform's margin.

## When buying is the right call

Buy when agents are a feature of your product, not the product. Buy when you need to ship this quarter, when your customers are on plans that agent usage must fit inside, or when nobody on the team wants an LLM pager. Above all, buy when your edge is your tools and data, not the loop that calls them.

## The hybrid path most teams end up on

Buy the harness, build the agent. Instructions, tools and UI hold your product knowledge, so keep them in your repo, and write tools as plain functions or an MCP server so they move with you. Here is a tool in OpenLegion's kit, shown as a preview of its API whose names may change before release:

```ts
import { defineTool } from "@openlegion/platform";
import { z } from "zod";
import { db } from "@/lib/db";

// One of your functions, now one of the agent's tools.
export const draftCampaign = defineTool({
  description: "Draft an email campaign for one audience",
  input: z.object({ audienceId: z.string(), brief: z.string() }),
  effect: "draft", // read · draft · write · egress
  run: async ({ audienceId, brief }, ctx) =>
    db.campaigns.createDraft(ctx.externalRef, audienceId, brief),
});
```

Everything inside `run` is your existing code, keyed by your own customer reference. Mirror receipts and events into your database through webhooks, so leaving never costs you history. If one part really is your edge, such as retrieval over your customers' data, build it and expose it as a read tool. The [step-by-step guide to adding AI agents to your app](/learn/add-ai-agents-to-your-app) walks through the rest.

## A decision checklist for build or buy AI agents

1. Is the agent loop itself what customers pay for? Yes: build.
2. Must it run inside your or your customers' infrastructure? Yes: build, or find a vendor with self-hosted execution.
3. Do you need a runtime no vendor offers? Yes: build.
4. Will many customers each bring their own data? Yes: budget one to two months for isolation, or buy it.
5. Must agent usage fit inside your customers' plans? Yes: you need caps that refuse before the run.
6. Will the agent write, delete or contact third parties? Yes: you need approvals and receipts from day one.
7. Will it read web pages, inbound email or uploads? Yes: plan for injection handling.
8. Can you staff one to two engineers on the harness indefinitely? No: buy.
9. Do your buyers require SOC 2 from vendors? Yes: check certifications first. OpenLegion holds none today.
10. Is launch less than six months away? Yes: buy or go hybrid.

If questions 1 to 3 are all "no", buying the harness is the default.

## OpenLegion's Take

Teams conflate building the agent with building the harness. Always build the agent. Build the harness only if it's what you sell.

Vendor-managed agents answer a different question than most SaaS teams are asking. They make one agent easy to run. They don't make four hundred customers' agents isolated, capped to each plan and auditable per customer. For an internal agent your own staff uses, start there: it's simpler than a multi-tenant harness.

Metering is the part teams underestimate most, more than isolation. Isolation is a familiar web-app problem. Refusing a run before it starts, against a plan your customer bought, is new work, and mistakes surface as lost margin on the invoice.

Approval on every action is a failure mode, not caution. We hold only three kinds of action for approval and let reading and drafting run, so an approval still means something. Regulated teams that gate every write are making a defensible call for their situation.

Our own limits matter here: OpenLegion is in private beta and hosted only, with no published prices or certifications. If you need self-hosting, a SOC 2 report or a signed price sheet this quarter, a framework or a managed-agent vendor is the better choice right now. If you can work as an early partner, you skip most of the table above. See [how billing works](/pricing) and [what the platform enforces](/security).

## CTA

**Build the agent your customers pay for. Skip building the harness.**
[Request early access](https://app.openlegion.ai/signin) | [Book a call](https://calendly.com/admin-openlegion/30min) | [How billing works](/pricing)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### Should I build or buy AI agents for my SaaS product?

Buy the harness and build the agent, unless the agent loop is your core IP, you must self-host, or you need a runtime no vendor offers. The harness is most of the work and rarely sets a product apart, while the agent's instructions, tools and UI stay in your codebase either way.

### How long does it take to build an AI agent harness in-house?

Our estimate for a first production version is 8.5 to 17 engineer-months, for an experienced SaaS team with one model provider and billing already in place. After launch, expect one to two engineers full time on model changes, evals and on-call. Code sandboxes, several providers or self-hosting push both numbers up.

### Is an open-source AI agent framework free to use?

The libraries are free: LangGraph and the OpenAI Agents SDK use the MIT license, and the Vercel AI SDK and most of Mastra use Apache 2.0. The real cost is the harness you build around them, plus model tokens, infrastructure and the engineers who run it.

### What is the difference between an agent framework and managed agents?

A framework is a library inside your application that gives you the agent loop and tool calling, while you supply the infrastructure. Managed agents are a hosted service from a model or cloud vendor that runs the loop, sandbox and sessions for you, usually billed on tokens plus runtime or compute. With either, per-customer isolation and plan caps stay your code.

### Can I use Claude Managed Agents or the OpenAI Agents API in a multi-tenant SaaS?

Yes, but you build the multi-tenant layer yourself. Both run the agent loop and sessions on the vendor's infrastructure and let your application supply custom tools, but their core objects are agents, sessions and environments, not your end customers. You decide how customers map to sessions, enforce each customer's usage limit and keep the per-customer audit trail.

### Is OpenLegion available today, and what does it cost?

OpenLegion is in private beta and is onboarding a small number of SaaS partners. It is hosted only, and partner prices are not published yet; billing uses one prepaid credit pool per partner with caps per customer workspace. It holds no SOC 2, ISO 27001 or HIPAA certification today.

### How do I avoid lock-in when I buy an agent harness?

Keep your tools as your own functions or an MCP server, and the agent's instructions in your repo, so they move with you. Mirror receipts and events into your own database through webhooks. Then list the harness components you would have to rebuild if you left, because that list is your real lock-in.
