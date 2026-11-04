---
title: "What Is an Agent Harness? Anatomy, Examples, Harness vs Framework"
description: "An agent harness is the code around the model: loop, tools, context, permissions, sandbox, budgets, receipts. Real examples from Anthropic, LangChain, OpenAI."
slug: "/learn/agent-harness"
primary_keyword: "agent harness"
secondary_keywords:
  - "ai agent harness"
  - "harness engineering"
  - "agent harness vs framework"
  - "agent harness examples"
  - "claude agent sdk"
  - "multi-tenant agent harness"
  - "hosted agent harness"
  - "agent loop"
date_published: "2026-11-04"
last_updated: "2026-11-04"
schema_types:
  - Article
  - FAQPage
  - DefinedTerm
page_type: "learn"
related:
  - "/learn/add-ai-agents-to-your-app"
  - "/learn/build-vs-buy-ai-agents"
  - "/learn/managed-agents"
  - "/learn/ai-agent-frameworks"
  - "/learn/agentic-loop"
  - "/learn/ai-agent-multi-tenancy"
---

# What Is an Agent Harness? Anatomy, Examples, and Harness vs Framework

An agent harness is all the software around a language model that turns it into a working agent: the loop that calls the model, the code that executes its tool calls, and the rules for what it may see, do and spend. The model proposes the next step. The harness decides what actually happens, which is why two products built on the same model can behave nothing alike.

<!-- SCHEMA: DefinitionBlock -->

> **Agent harness**
> An agent harness is the runtime around a language model that runs the agent loop, executes and checks tool calls, manages context and state, and enforces permissions, budgets and records, so that everything an agent does besides choosing its next step is decided by code rather than by the model.

## What does an agent harness actually do?

LangChain's Vivek Trivedy put it bluntly in March 2026: "Agent = Model + Harness," and "If you're not the model, you're the harness." Anthropic's narrower version, from its April 2026 Managed Agents write-up, is "the loop that calls Claude and routes Claude's tool calls to the relevant infrastructure."

The model only produces text, some of it a request to call a tool. Whether that call runs, with which credentials, against whose data, at what cost and after whose approval is the harness's decision. A prompt asks the model to behave. The harness enforces it.

## The anatomy of an AI agent harness

Nine parts appear in every serious harness. When a production agent misbehaves, one of them is usually missing.

### 1. The agent loop

Call the model, run what it asks for, feed back the result, repeat. The stop conditions matter most: done, a step cap, a budget, a timeout, a person interrupting. In a product the loop must also survive waiting, because a run held for approval at 5 p.m. may resume the next morning in another process. See [how the agentic loop works](/learn/agentic-loop).

### 2. Tool calling and execution

Validate arguments, run the call with a timeout, and return the result or error as text the model can act on. Tool descriptions are prompt, so vague ones produce vague calls. Execution must be idempotent, so a step retried after a timeout cannot send the email twice. More in [AI agent tool use](/learn/ai-agent-tool-use).

### 3. Context management

The harness picks what enters the window each turn and compacts or offloads the rest. An OpenAI team that built a product entirely with Codex kept its AGENTS.md to roughly 100 lines, "the table of contents" rather than "the encyclopedia," with the detail in a structured docs directory. The wider discipline is [context engineering](/learn/context-engineering).

### 4. Permissions and approvals

Which tools run automatically, which need a person, and which never run. In the Claude Agent SDK this is the permissions setting. Classify tools by effect (read, draft, write, reach outside) and enforce holds outside the model. An agent asking "shall I send it?" in chat is not an approval. See [human-in-the-loop approvals](/learn/human-in-the-loop-ai-agents).

### 5. Sandboxing and isolation

Where model-written code runs and what it can reach. Anthropic's Managed Agents design separates the "brain" (Claude and its harness) from the "hands" (sandboxes and tools), and "the harness is never made aware of any credentials." Single-user harnesses usually skip the second question: can one user's agent see another user's data? See [AI agent sandboxing](/learn/ai-agent-sandboxing).

### 6. Memory and state

Session history, durable state that survives a crash, and long-term memory. Anthropic's long-running harness has its first session write a progress log and an initial git commit, so later sessions starting from an empty context can pick up the work. Watch for the agent remembering something wrong as fact.

### 7. Budgets and limits

Steps, tokens, time and money, per run and per period. Reserve before a step runs and refuse when the budget is gone. A bill afterward only reports the runaway loop. See [AI agent cost controls](/learn/ai-agent-cost).

### 8. Observability and receipts

Traces help engineers debug and are often sampled. Receipts record every action, refused ones included: who asked, what ran, what it cost, who approved. Only receipts can answer a customer asking what the agent did on Tuesday.

### 9. Evals

A harness change is a behavior change, so it needs the same regression suite as a model change. LangChain reports moving its coding agent from the top 30 to the top 5 on Terminal Bench 2.0 "by only changing the harness."

## Agent harness vs framework vs SDK vs model vs platform

Harrison Chase's October 2025 split is the clearest: LangChain is a framework (abstractions), LangGraph a runtime (durable execution), and Deep Agents a harness ("batteries included"). Even he calls LangGraph "probably best described as both a runtime and a framework."

| Layer | What it gives you | What you still build | Examples (as of November 2026) |
|---|---|---|---|
| Model | Next-step predictions, including tool-call requests | Everything else | Claude, GPT and Gemini models |
| SDK | A typed client, sometimes with a built-in loop | Tools, limits, storage, hosting | OpenAI Agents SDK, Anthropic's client SDKs |
| Framework | Building blocks: tool wrappers, chains, graphs | The opinions: defaults, guardrails, operations | LangChain |
| Runtime | Durable execution, persistence, streaming | Agent behavior and policy | LangGraph |
| Harness | A working agent: loop, tools, context, permissions | Your tools and instructions | Claude Code and the Claude Agent SDK, Deep Agents |
| Hosted harness | The harness run as a service | Your tools, UI and policy choices | Claude Managed Agents (beta), OpenLegion (private beta) |

The short answer to agent harness vs framework: a framework helps you write an agent, and a harness is an agent you configure. The Claude Agent SDK blurs the line, since it is an SDK that ships a complete harness. For the building-block side, see [AI agent frameworks compared](/learn/ai-agent-frameworks).

## Agent harness examples from Anthropic, LangChain and OpenAI

**Claude Code and the Claude Agent SDK.** Renaming the Claude Code SDK in September 2025, Anthropic wrote that "the agent harness that powers Claude Code (the Claude Code SDK) can power many other types of agents, too." The Claude Agent SDK packages Claude Code's tools, agent loop and context management for Python and TypeScript, running in a process you operate. By June 2026, with dynamic workflows, "Claude can now write its own harness on the fly."

**Claude Managed Agents.** Anthropic's hosted "pre-built, configurable agent harness," in beta as of November 2026, runs sessions in an Anthropic-managed cloud sandbox or a self-hosted one. We compare it with the OpenAI, Google, AWS and LangChain offerings in [managed agents compared](/learn/managed-agents).

**LangChain Deep Agents.** LangChain's docs call it "the agent harness for complex, multi-step work": planning, a virtual filesystem, subagents, sandboxed shell execution, summarization and human approval, on the LangGraph runtime.

**OpenAI Agents SDK.** Agents, handoffs and guardrails, with sessions and tracing, and "a built-in loop that continues until the task is complete," unlike the Responses API, where you own the loop.

## What is harness engineering, and why does it decide agent quality?

Harness engineering is improving an agent by changing its environment, tools, context and feedback loops rather than the model. The reference case is OpenAI's February 2026 harness engineering post: over five months, a team that started with three engineers shipped an internal beta of a product with no manually written code, about a million lines across roughly 1,500 merged pull requests. Their diagnosis: "Early progress was slower than we expected, not because Codex was incapable, but because the environment was underspecified."

The harness now decides more of agent quality than the model. Competitors share the same few models, and harness fixes are permanent: a test or a narrower tool removes a class of mistake, where a prompt tweak only makes it rarer. The counterweight comes from Anthropic: "harnesses encode assumptions about what Claude can't do on its own," and those assumptions "can go stale as models improve." Keep the parts that encode your world (who the user is, what they may spend, what needs consent) and keep the model workarounds thin.

## A harness for one developer vs a harness for every customer

Claude Code is the canonical single-developer harness: one person is user, operator and approver, on their own machine, paying one bill. Inside a SaaS product those roles split across you, your customer and the third parties the agent reaches, and no customer's data may reach another customer's agent.

| Concern | One developer's agent | Agents for many end customers |
|---|---|---|
| Isolation | Protect the machine from the agent | Keep each customer's data, memory and records apart |
| Identity | Implicit: it's you | Every tool call names its customer, verifiably |
| Approvals | You, at the keyboard | Your customer, in your UI, recorded as theirs |
| Budgets | One bill, one ceiling | A cap per customer that mirrors their plan |
| Records | Session logs for debugging | Receipts your customer and support team can read |
| Untrusted input | Your files, plus pages the agent fetches | Other people's emails, pages and documents in every workspace |

That is the job of a multi-tenant agent harness, and the category OpenLegion is in: a hosted agent harness for SaaS products and AI apps. It runs one isolated workspace per end customer, separated by row-level security. Every tool call is an intent checked by one policy engine before it runs, and every action leaves a receipt. Work stops for a person's approval at three walls only: reaching a third party, deleting data, and acting on untrusted content. Credits are reserved before each step, so a customer at their cap is refused before the run, not billed after. Secrets stay in a vault, and the model holds only a handle. More in [AI agent multi-tenancy](/learn/ai-agent-multi-tenancy), and step by step in [how to add AI agents to your app](/learn/add-ai-agents-to-your-app).

Tools are your own functions or MCP server, called with a signed request that names the customer, and each declares its effect. This is a preview of the TypeScript kit's API, which is in development, so names may change:

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

Status, plainly: private beta, hosted only, partner prices not published, and no SOC 2, ISO 27001 or HIPAA certification.

## OpenLegion's Take

- **Inside a product, the harness is a permissions and billing system that happens to call a model.** The loop is small. Our estimate is a few hundred lines, since it only calls the model, dispatches tools, appends results and checks a cap. Identity, isolation, consent and money are the large part, and better models do not shrink them.
- **Approvals only mean something if they are rare.** Gate by effect at a few walls, not per tool. A harness that asks before every write trains people to click Approve unread, which is worse than no gate: it records consent nobody gave.
- **A control in the prompt is not a control.** "Never send without approval" in the instructions is a hope. A held call that only a person can release is a control, and a budget checked after the model call is a report.
- **Don't pick a harness for its cleverness.** Models keep absorbing planning, self-checking and even writing their own harness. Pick one for the invariants that outlast every model release.

## When to build your own agent harness, and when not to

Build your own, or start from an open harness, when:

- **The harness is your product.** A coding or research agent competes on its loop and context strategy. Start from the Claude Agent SDK or Deep Agents, not from zero.
- **There is one trust boundary.** An internal agent for your own staff needs no tenancy or per-customer caps.
- **You must self-host.** A hosted harness, OpenLegion included, will not fit.
- **A buyer requires SOC 2 or HIPAA today.** OpenLegion holds neither yet.

Don't build it when the agent is a feature that acts for your customers. Then the work is tenancy, per-customer metering, approvals that resume hours later, signed tool calls, a secrets vault and receipts. Our estimate is a quarter or more for a small team, because each piece touches your auth, billing and data model and needs cross-tenant tests. The component-by-component estimate is in [build vs buy AI agents](/learn/build-vs-buy-ai-agents).

You have outgrown a homegrown harness when a retried step sends twice, one customer surprises you on the model bill, support cannot answer "what did the agent do?", or approvals live in the chat transcript.

## CTA

**Give every customer their own agent without building the harness yourself.**
[Request early access](https://app.openlegion.ai/signin) | [Book a call](https://calendly.com/admin-openlegion/30min) | [How billing works](/pricing)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an agent harness in simple words?

An agent harness is everything around an AI model that makes it work as an agent. The model suggests the next step, and the harness runs the loop, executes tool calls, manages context and memory, and limits what the agent may do and spend.

### What is the difference between an agent harness and an agent framework?

A framework gives you building blocks for writing an agent and leaves the opinions to you. A harness is a working agent with those opinions built in: a loop, default tools, context management and permissions. LangChain calls itself a framework and its Deep Agents library a harness.

### Is the Claude Agent SDK an agent harness?

Yes. Anthropic describes it as the agent harness that powers Claude Code, packaged as a Python and TypeScript library that runs in a process you operate. Claude Managed Agents, in beta as of November 2026, is Anthropic's hosted version of a harness.

### What is harness engineering?

Harness engineering is improving an AI agent by changing what surrounds the model: its tools, context, tests and feedback loops. Instead of re-prompting after a mistake, you change the environment so that class of mistake cannot recur.

### Does the harness matter more than the model?

For most production agents the harness now decides more of the outcome, because competing products often run on the same few models. LangChain reported moving its coding agent from the top 30 to the top 5 on Terminal Bench 2.0 by changing only the harness. The model still sets the ceiling.

### Should I build my own agent harness?

Build one if the agent itself is your product or everything must run on your own infrastructure, ideally starting from an existing harness such as the Claude Agent SDK or Deep Agents. If the agent is a feature that acts for your customers, most of the work is tenancy, metering, approvals and audit, which a hosted harness can provide.

### What is a multi-tenant agent harness?

A multi-tenant agent harness runs agents for many end customers inside one product and keeps each customer's data, memory, budget and records separate. It adds per-customer isolation, usage caps that match each plan, approvals decided by the customer, and receipts for every action. OpenLegion is a hosted harness of this kind, in private beta.
