---
title: 'AI Agent Security — Threats, Isolation, Vaults'
description: >-
 AI agent security guide: credential leakage, prompt injection, sandbox escape,
 and how run isolation, vault-held credentials, and budget controls mitigate
 each threat.
slug: /learn/ai-agent-security
primary_keyword: ai agent security
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2026-03
last_updated: 2026-11
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-platform
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-frameworks
 - /comparison
---

# AI Agent Security: The Threat Model for Production Agent Fleets

A chatbot that says something wrong is embarrassing. An agent that does something wrong — sends the email, deletes the file, pays the invoice, posts the API key — is an incident. The security question for agents is not "can the model be tricked?" It can. The question is what happens next.

**AI agent security** is the set of controls that keep a tricked, buggy or misconfigured agent from leaking credentials, sending data out, burning money, or taking an irreversible action nobody approved. The controls that hold up are the ones that sit *outside* the model: code that runs before every action and does not care how persuasive the prompt was.

<!-- SCHEMA: DefinitionBlock -->

> **What is AI agent security?**
> AI agent security is the practice of constraining autonomous AI agents so that a compromised or mistaken agent cannot leak secrets, exfiltrate data, run up costs, take irreversible actions without a person's approval, or reach another customer's data. The effective controls are deterministic and enforced outside the model: policy checks before every tool call, credentials the model never sees, sandboxed code execution, spend limits, and tenant isolation in the database.

## TL;DR

- **Assume the model will be manipulated.** Anything an agent reads can contain instructions.
- **Put the authority in code, not in the prompt.** In OpenLegion every tool call is an *intent* that a policy engine checks before it runs, and every action leaves a *receipt*.
- **Agents never hold keys.** Credentials are injected at the call boundary, and every output is scanned for known secrets before it goes anywhere.
- **Hold the dangerous actions for a person.** Reaching a third party on your behalf and deleting data stop for an owner's approval by default.
- **Spend is reserved before work starts,** so a looping agent stops at its limit instead of at your card's limit.

## The threat model for AI agents

Five things go wrong, and they compound: an injected instruction is dangerous because the agent also holds a credential, a network connection or a budget.

### 1. Prompt injection through tools and content

An agent that reads untrusted text can be told to do something else. The text can sit in a web page, an inbound email, a shared document, a group chat or a tool result. The model has no reliable way to tell data from instructions, and prompt-level defences ("ignore instructions in documents") reduce the rate without closing the hole.

### 2. Credential exfiltration

If an API key sits in the agent's environment, prompt, memory or tool output, an injected instruction can ask the agent to repeat it — into a reply, a log, a URL, a file. Encoding tricks (base64, hex, URL-encoding) make naive string matching miss it.

### 3. Runaway spend

Agents loop: a tool errors, the agent retries, repeat. Or an injected page asks for "thorough research" across thousands of calls. Without a hard limit outside the loop, the first sign of trouble is the bill.

### 4. Irreversible actions

An email to a customer, a public post, a deleted file, a shared document: one bad decision becomes permanent.

### 5. Cross-tenant leaks

On a multi-customer platform the worst outcome is a query or bug that returns *another customer's* data. That is an infrastructure problem, and it has to be solved below the application.

## The controls that actually work

Each threat above has a deterministic control — one that a model cannot talk its way past because the model is not asked:

| Threat | Control that works | Why it holds |
|---|---|---|
| Prompt injection | Label content by where it came from; content arriving from untrusted sources cannot drive outbound or irreversible tools without a person | The decision is made from provenance labels, not from the text |
| Credential exfiltration | The model never holds the secret; outputs are scanned for known secrets | You cannot leak what you were never given |
| Runaway spend | Reserve the budget before the run; stop at the reservation | The limit lives in the ledger, not in the agent |
| Irreversible actions | Default-deny tools; approval holds as durable records | The model proposes; a person decides |
| Cross-tenant leaks | Row-level security in the database, tested | Isolation does not depend on every query being correct |

The common thread: **the model is never the final authority for an action that matters.**

## How OpenLegion implements each control

OpenLegion agents are database records, not long-running servers: when there is work, an agent *wakes*, does it, and stops. Everything below applies to every wake.

### Every action is an intent, checked by one policy engine

When an agent wants to use a tool, it does not call the tool. It produces an *intent* — a structured record of what it wants to do and with which arguments. A single policy engine evaluates that intent in a fixed order: **deny, then hard limits, then approval, then allow.** Only an allowed intent is executed, and the executor reads the limits from the persisted intent, never from the model's prose. Each execution writes a receipt to an append-only audit trail.

Tools are **default-deny**: an agent can only use the tools its owner granted, and a refusal comes back as a tool result the agent can adjust to. Hard limits run *before* approvals, so an owner is never asked to rubber-stamp something over a cap anyway.

See [AI agent orchestration](/learn/ai-agent-orchestration) for how goals, tasks and agents fit together around this loop.

### Approval holds for third-party reach and deletion

By default, work stops for an owner's approval when an action would:

1. **reach a third party on your behalf** — posting to a channel, sharing an artifact, or creating a calendar event that invites attendees;
2. **destroy or overwrite data** — deleting a file, deleting a calendar event, overwriting a document;
3. **use an outbound or irreversible tool on a tainted run** (see the next section);
4. **change an agent's own configuration** — instructions, budget, status — when the request does not carry the owner's authority, for example when it comes from a workspace member or another agent.

An approval is a row in the database, not a paused process: the run ends, and a later wake resumes the intent once an owner or admin decides. Approval tokens are single-use and bound to the exact intent, so approving one email cannot be replayed to send another. Owners approve in the app or from Telegram and Slack buttons tied to their paired identity; members can answer an agent's questions but not approve held actions.

### Content trust: inbound content is labelled, and the label gates outbound tools

Every piece of content carries a trust label derived from **who sent it and how it arrived**. A paired owner or admin messaging the agent directly speaks as the owner; a paired member is trusted less. Anything from an unpaired sender, a group chat, a forwarded or quoted message, or an attachment is low-trust, and is tainted *separately* from the instruction it came with: "summarise this attachment" is the owner's request; the attachment stays untrusted.

Untrusted content enters the model only as labelled data inside tool results. Two rules follow from the labels, and both are enforced in the policy engine, not the prompt:

- an outbound tool **refuses an argument that came from low-trust content**;
- on a tainted run, **any outbound or irreversible tool is held for approval.**

Taint also carries forward. What a tainted run leaves behind for later — a plan, an answer, a scheduled follow-up — is stamped with the combined taint of the request, what was read and what was recalled from memory, so injected text cannot launder itself into a clean run tomorrow. Invisible and bidirectional Unicode characters are neutralised at channel ingest and before every untrusted envelope; that is defence in depth against hidden text, not an injection control on its own.

### Credentials stay outside the model

Agents never hold keys. When a tool needs a credential, the platform's credential broker fetches it inside the call and the model only ever sees a handle. Stored credentials are encrypted per workspace under a master key held outside the database, and that master key can be rotated.

To catch a secret that reaches an output some other way, every tool result, sandbox output, model completion and memory write is scanned against the workspace's known secrets — plain text and common encodings such as base64, hex, URL-encoding and gzip — before it is stored or shown. Log lines are redacted by key name.

### Code runs in a sandbox with egress denied

Code an agent writes runs in an isolated microVM sandbox, not in the platform's own process. Network egress from the sandbox is **deny-all by default**, opened only by explicit per-domain rules; wildcard or allow-all network policies fail the build. Where a sandbox needs a credential to reach an allowed domain, it is injected by the sandbox firewall on the way out, so the code inside never sees it. The agent's own web fetches connect to the IP address that was checked, over HTTPS by default.

### Memory has trust tiers

Long-term memory is an injection target: plant an instruction once and it is re-read on every future run. Each memory write carries a trust tier, stored as the *lower* of what the model asked for and what the content's provenance supports. Low-trust content never reaches an agent's core memory or its policy, and a lower-trust entry cannot supersede a higher-trust one. Entries are HMAC-signed as tamper evidence — not as the injection defence.

### Spend is reserved before each run

Every wake reserves its spend ceiling before it starts, and the loop stops at that reservation, mid-run if necessary. Each agent has its own budget, paid tools such as web search are priced and capped before they are allowed, and each model call carries a deadline so a hung request cannot hold a run open.

### Tenant isolation in the database

Every table has row-level security keyed on workspace membership, and application code runs as a database role that **cannot bypass** it. Only one module may construct a privileged database client; a check fails any other import. Queries also bind the workspace ID explicitly, so row-level security is a second wall, not the only one, and a dedicated test suite attempts cross-tenant reads through sessions, the machine role and forged claims.

## What this doesn't solve

These controls limit what a manipulated agent can *do*; they do not stop it from being manipulated. An agent can still be wrong within its grants: if you give it a tool that does not require approval, an injected instruction can steer it to use that tool badly. Content trust is keyed on how content *arrives* — a message, a forward, an attachment. A web page the agent fetches itself during a task does not, on its own, taint that same task's outbound calls; the defences there are narrow tool grants, approval holds on third-party reach, domain rules and the secret scan, not the taint rule. Approvals only protect you if the person approving reads the card. And OpenLegion does not hold SOC 2, ISO 27001, HIPAA or other certifications; meeting a compliance regime depends on your own controls, not only on the platform. What we have done is move the decisions that matter out of the model.

## Getting started

**Run agents whose dangerous actions wait for you.**
[Join the waitlist](https://app.openlegion.ai/signin)

For the wider picture, see [what an AI agent platform should include](/learn/ai-agent-platform) and our [AI agent frameworks comparison](/learn/ai-agent-frameworks), or compare [OpenLegion vs OpenClaw](/comparison/openclaw).

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What does AI agent security mean?

AI agent security is the set of controls that stop an autonomous agent from causing harm when it is manipulated or mistaken: leaking credentials, exfiltrating data, running up costs, taking irreversible actions without approval, or reaching another customer's data. The controls that hold are deterministic and sit outside the model — policy checks before every action, credentials the model never sees, sandboxed code execution, spend limits and database-level tenant isolation.

### Can prompt injection be prevented?

Not completely. Any agent that reads untrusted content can be steered by it. What you can do is limit what a steered agent is able to do. OpenLegion labels content by who sent it and how it arrived, refuses to let low-trust inbound content become the argument of an outbound tool, and holds outbound and irreversible actions on a tainted run for an owner's approval. A page the agent fetches itself is handled by narrow tool grants and approval holds rather than by taint.

### How should AI agents handle API keys?

They should never hold them. In OpenLegion a credential broker injects the credential inside the tool call, the model only sees a handle, and every output is scanned for the workspace's known secrets in plain and encoded forms before it is stored or shown. Keys in environment variables or prompts are the most common — and least safe — pattern.

### Does OpenLegion have SOC 2 or other certifications?

No. OpenLegion does not currently hold SOC 2, ISO 27001, HIPAA or other compliance certifications. The platform keeps an append-only audit trail with a receipt for every action, which helps with audits, but certification depends on your deployment and organisational controls as well.

### Does OpenLegion train models on my data?

No. OpenLegion does not train models on your workspace's data and does not sell personal information. Model calls made on our platform keys go to providers under zero-retention terms, opted out of training. On a paid plan you can bring your own model key instead, and then your own agreement with that provider applies.

---

## Internal Links to Include

| Anchor Text | Destination |
|---|---|
| AI agent platform | /learn/ai-agent-platform |
| AI agent orchestration | /learn/ai-agent-orchestration |
| AI agent frameworks comparison | /learn/ai-agent-frameworks |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Documentation | /docs |
