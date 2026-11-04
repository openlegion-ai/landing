---
title: "Managed Agents Compared: Claude, OpenAI, Gemini, AWS and LangChain"
description: "Managed agents from Anthropic, OpenAI, Google, AWS and LangChain, compared on status, pricing, approvals, spend caps and per-customer isolation (Nov 2026)."
slug: "/learn/managed-agents"
primary_keyword: "managed agents"
secondary_keywords:
  - "claude managed agents"
  - "openai agents api"
  - "managed agents in the gemini api"
  - "bedrock agentcore"
  - "managed deep agents"
  - "managed agents pricing"
  - "per-customer spending caps"
  - "hosted agent platform"
date_published: "2026-11-04"
last_updated: "2026-11-04"
schema_types:
  - Article
  - FAQPage
  - DefinedTerm
page_type: "learn"
related:
  - "/learn/agent-harness"
  - "/learn/build-vs-buy-ai-agents"
  - "/learn/add-ai-agents-to-your-app"
  - "/learn/ai-agent-multi-tenancy"
  - "/learn/human-in-the-loop-ai-agents"
  - "/learn/ai-agent-cost"
---

# Managed Agents Compared: What Each Vendor Runs and What It Leaves to You

Managed agents are hosted agent runtimes: you define the agent's model, instructions and tools (your own functions or MCP servers), and the vendor runs the loop, the sandbox, session state and tool execution. As of November 2026, Anthropic, OpenAI, Google, AWS and LangChain all offer one, most in beta or preview. Each runs the agent loop for you. The per-customer layer a SaaS product needs, meaning isolation, spending caps, approvals and receipts for each customer, is mostly still yours to build.

<!-- SCHEMA: DefinitionBlock -->

> **Managed agents**
> Managed agents are AI agents whose execution loop, sandbox, session state and tool calls run on a vendor's infrastructure, so the developer supplies the agent's definition and the vendor operates the runtime.

## What "managed" covers, and what it leaves to you

Every product here runs the same core: the loop that calls the model and dispatches tools, a [sandbox](/learn/ai-agent-sandboxing) for code and shell commands, session state that survives pauses, and an event stream you can read back. Most add web search, MCP connections and a credential vault.

What none of them knows is who your customers are. The vendor sees your API key, not the bakery on your Starter plan. So four jobs stay in your code: mapping each customer to their sessions, credentials and memory; summing spend per customer per billing period; routing an approval to the right person in your product; and keeping receipts a customer can read. Those four jobs are where the offerings differ most.

## Claude Managed Agents (Anthropic)

Claude Managed Agents launched in public beta on April 8, 2026, and is still in beta as of November 2026. You define an agent, an environment (Anthropic's cloud sandbox or a self-hosted one) and sessions that stream events, with built-in bash, file and web tools. Pricing is tokens plus $0.08 per session-hour, counted only while a session is running.

It has more per-user building blocks than most. A vault holds one end user's credentials, Anthropic's cookbook recommends one memory store per end user, the `always_ask` policy pauses a tool call until your app sends a `user.tool_confirmation` event, and a session budget puts a hard dollar cap on a session.

Know the edges. Vaults are workspace-scoped, so any API key with workspace access can reference any user's vault: the boundary between your customers is your mapping code. Permission policies don't cover custom tools. The docs say the `auto` policy "is not a human checkpoint." A budget bounds one session, not a customer's month. And Managed Agents is not eligible for zero data retention or HIPAA coverage.

## OpenAI Agents API

OpenAI released the Agents API in public beta on September 10, 2026. It gives your application the Codex harness through an OpenAI-managed API: OpenAI handles sessions, orchestration, context compaction and recovery, and you choose the environment (none, OpenAI-hosted or self-hosted). Pricing is model tokens, tool fees and container rates for hosted sandboxes. Agent Builder, a separate product, shuts down on November 30, 2026.

Its built-in review is a model, not a person. With `auto_review`, an OpenAI-managed reviewer approves or denies risky actions; with `none`, the docs say actions are not sent "to your application for manual approval." For a human decision, put the action behind a function tool: the session waits on `required_actions` until your code answers. Spend limits are organization and project hard caps, added July 22, 2026. Sessions accept metadata and vault IDs but no user or budget field. Tracing is on by default.

## Managed Agents in the Gemini API and Agent Runtime (Google)

Managed Agents in the Gemini API launched on May 19, 2026, and is in public preview. One API call provisions a Linux sandbox, driven through the Interactions API, and a July update added background runs, remote MCP and custom functions. Environment compute isn't billed during the preview, so you pay for tokens and tool fees.

The controls are thin for multi-tenant use. Credentials are project-wide, there is no end-user concept, and project spend caps are "experimental and limited in scope," with agent sessions able to overrun them. A custom function pauses the interaction in `requires_action` for your code. Hooks can block built-in sandbox tools but skip custom functions and MCP tools, and a hook that crashes or times out counts as `allow`.

Agent Runtime, the April 2026 name for Vertex AI Agent Engine, hosts agent code you deploy, with managed Sessions and Memory Bank. It is the more tenant-aware of the two: "All sessions must have a user ID," memories are isolated per scope, and IAM conditions can limit users to their own sessions. We found no approval step or spend cap specific to Agent Runtime in its docs.

## Amazon Bedrock AgentCore and Bedrock Managed Agents (AWS)

AgentCore, generally available since October 13, 2025, is a set of separate services (Runtime, Gateway, Identity, Memory, Policy, Observability) plus a managed harness, generally available since June 17, 2026, that runs the loop for you. It works with any framework and several model providers. Runtime bills CPU and memory per second, from $0.0895 per vCPU-hour on v1, with no CPU charge during I/O wait; the other services bill per operation.

Isolation is its strongest card: "Each session in AgentCore Runtime receives its own dedicated microVM," and memory can be scoped per actor. But "AgentCore does not enforce session-to-user mappings," so your backend keeps them. Inline functions hand a tool call back to your code, which AWS calls "the pattern for human-in-the-loop approvals." Cost limits are per invocation (iterations, timeout, tokens), with attribution by resource tags. Audit goes to CloudWatch and CloudTrail.

Bedrock Managed Agents, powered by OpenAI, runs the Codex harness on AWS. Announced in April 2026 as a limited preview, it opened in preview on September 29, 2026, with no extra charge during preview beyond the AWS resources it uses. The original Bedrock Agents, now Agents Classic, closed to new customers on July 30, 2026.

## LangChain Managed Deep Agents and LangSmith Deployment

Managed Deep Agents entered public beta on August 7, 2026. You define an agent as a folder, and it runs the open-source Deep Agents harness with a sandbox per durable thread. It is the only offering here with end-user identity in the agent definition: `identity.py` verifies your users' tokens, threads and stored credentials are keyed to that user, and cross-user requests get a `403`. The caveat: anyone with API access to the LangSmith workspace can read every thread. Interrupts pause sensitive tool calls so a person can approve, edit or reject them. We found no published price and no per-customer cap.

LangSmith Deployment, renamed from LangGraph Platform in October 2025, is the generally available option for your own LangGraph code, with custom auth that scopes threads and runs to a user. Our [LangGraph comparison](/comparison/langgraph-vs-openlegion) covers the framework side.

## Managed agents compared side by side

Status and controls as of November 2026, from each vendor's own documentation.

| Offering | Status | Pricing basis | Per-customer isolation | Human approval | Spend cap | Audit trail |
|---|---|---|---|---|---|---|
| Claude Managed Agents | Beta | Tokens plus $0.08 per running session-hour | Per-user vaults and memory; the mapping is yours | `always_ask` pauses for your app | Per session | Event history, OpenTelemetry |
| OpenAI Agents API | Public beta | Tokens, tools, container rates | Session metadata and vaults; the mapping is yours | Through your function tools | Per org or project | Traces on by default |
| Managed Agents in the Gemini API | Public preview | Tokens and tools; sandbox free in preview | Project-wide credentials | Custom functions pause for your code | Experimental, per project | Interactions kept up to 55 days (paid tier) |
| AWS Bedrock AgentCore | GA | Per-second CPU and memory, per-call services | MicroVM per session; the mapping is yours | Inline functions return to your code | Per invocation | CloudWatch, CloudTrail |
| LangChain Managed Deep Agents | Public beta | Not published | Per-user threads via `identity.py` | Interrupts | None found | LangSmith traces |
| OpenLegion | Private beta, hosted only | Prepaid credits; prices not published | A workspace per customer, row-level security | Three walls; your user decides | Monthly and daily, per customer | A receipt per action, signed webhooks |

## The gap for SaaS builders is the per-customer layer

Read the table by column. Isolation attaches to a session, a microVM or a thread. Caps attach to a session, an invocation or a project. Approvals are a pause your code must answer. That is reasonable for a runtime, whose natural unit is the session. A SaaS product's unit is the customer, so on top of any of these you build four things:

1. **A customer record that owns everything**, with a test proving customer A can never read customer B's objects ([AI agent multi-tenancy](/learn/ai-agent-multi-tenancy)).
2. **A ledger that reserves before it spends.** A per-session cap does nothing about a customer who opens forty sessions on your cheapest plan, and a project-level cap only helps if you run one project per customer ([per-customer spending caps and agent cost](/learn/ai-agent-cost)).
3. **An approval queue tied to your users** that records each decision as theirs ([human-in-the-loop AI agents](/learn/human-in-the-loop-ai-agents)).
4. **Receipts per customer**, not just engineering traces ([AI agent audit logs](/learn/ai-agent-audit-log)).

### Where OpenLegion fits

OpenLegion is a hosted agent harness built around the customer. Your backend creates a workspace per customer with `POST /workspaces` and your own `external_ref`, and workspace data is isolated by row-level security. Credits are reserved before each step against monthly and daily caps that mirror your plans; a reached cap refuses the run and fires `workspace.cap_reached`, which you can turn into your own upgrade screen. Work stops for approval at three walls (reaching a third party, deleting data, acting on untrusted content), your user decides in your UI, and the decision is recorded as theirs. Every action leaves a receipt, and OpenLegion never contacts your customers.

A preview of the TypeScript kit's API (names may change before release):

```ts
import { defineAgent } from "@openlegion/platform";
import * as tools from "./tools";

export default defineAgent({
  slug: "email-marketer",
  instructions: "Plan and draft campaigns. Never send without approval.",
  tools,
  model: "smart",
  limits: { periodCredits: 10_000 },
});
```

The status, plainly: the partner platform is in private beta, the kit is in development, it is hosted only, partner prices are not published (see [how billing works](/pricing)), and it holds no SOC 2, ISO 27001 or HIPAA certification. It can also sit alongside a vendor runtime, with an internal research job on one and your customer-facing agents in per-customer workspaces on the other.

## How to choose a managed agent platform

- **An internal or single-tenant agent:** pick the runtime that matches your model and cloud. The per-customer layer doesn't matter to you.
- **Claude with the most session controls:** Claude Managed Agents.
- **All-in on AWS:** AgentCore, for microVM isolation, IAM and CloudTrail.
- **Already on LangGraph or Deep Agents:** LangChain, especially for per-user threads.
- **Your own infrastructure:** Claude's self-hosted sandboxes, AgentCore in your account, or LangSmith's bring-your-own-cloud. OpenLegion is hosted only.
- **Agents for many customers inside your product:** if isolation, plan-tied caps, in-app approvals and per-customer receipts are most of the work, evaluate a hosted agent platform built per customer before building that layer yourself. The trade-off is laid out in [build vs buy AI agents](/learn/build-vs-buy-ai-agents), and the integration steps in [how to add AI agents to your app](/learn/add-ai-agents-to-your-app).

## OpenLegion's Take

The [agent harness](/learn/agent-harness) is becoming a commodity. Five vendors now ship a managed loop with a sandbox, compaction and tool dispatch, and the feature lists converge with every release. Choosing on harness features means choosing on what is least likely to differ next year.

The session is the wrong unit for SaaS spend. The costly failure is rarely one runaway session; it is one customer running hundreds of reasonable sessions on a plan priced for twenty a month. Caps belong on the customer, renewing on their billing day, and a reached cap should be a refusal you can show as an upgrade screen.

A model reviewing a model is a filter, not an approval. For actions that reach a third party or delete data, a person on the customer's side should decide, and the record should say it was them.

Keep your customer layer independent of any one model vendor's session objects. If your ledger, approvals and receipts live inside them, changing models becomes a data migration.

## CTA

**Give every customer their own isolated, capped agent workspace.**
[Request early access](https://app.openlegion.ai/signin) | [Book a call](https://calendly.com/admin-openlegion/30min) | [How billing works](/pricing)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What are managed agents?

Managed agents are AI agents whose loop, sandbox, session state and tool execution run on a vendor's infrastructure, while you supply the model, instructions and tools. As of November 2026, Anthropic, OpenAI, Google, AWS and LangChain each offer one. The term describes who operates the runtime, not what the agent does.

### Are Claude Managed Agents generally available?

No. As of November 2026, Claude Managed Agents is in beta, and every endpoint requires the managed-agents-2026-04-01 beta header. It launched in public beta on April 8, 2026.

### How much do managed agents cost?

Managed agents pricing usually combines model tokens with a runtime charge. Claude Managed Agents adds $0.08 per running session-hour, AWS AgentCore bills CPU and memory per second, and OpenAI bills hosted sandboxes at container rates. Google does not bill sandbox compute during its preview.

### What is the difference between managed agents and an agent SDK?

An agent SDK is a library that runs the agent loop inside your own process, so you host and operate it. Managed agents run the loop on the vendor's infrastructure, with the sandbox, state and event history handled for you. You trade some control over the loop for no operations work.

### Can managed agents run on behalf of my customers?

Yes, but most leave the customer mapping to you. Anthropic offers per-user vaults, AWS isolates each session in a microVM, and LangChain keys threads to a verified user, yet each expects your backend to decide which customer owns which session. None of them has a built-in spending cap per end customer per billing period; the closest is a monthly cap on a project or workspace, which works only if you create one per customer.

### Do managed agents support human approval?

Most can pause for a decision, but the mechanisms differ. Claude Managed Agents holds tool calls under an always_ask policy until your app confirms them, AWS and OpenAI hand control back through client-side or function tools, and LangChain uses interrupts. Your product still routes the pause to the right person and records the decision.

### Is OpenLegion a managed agents platform?

OpenLegion is a hosted agent harness for SaaS products that runs one isolated workspace per end customer, with policy checks, approvals, receipts and per-customer credit caps. As of November 2026 it is in private beta and hosted only, with partner prices not published and no SOC 2, ISO 27001 or HIPAA certification.
