---
title: "AI Agent Audit Log: Immutable Trails, Compliance, and Forensics"
description: "Build an immutable AI agent audit log for SOC 2, GDPR Article 30, and OWASP LLM06:2025. Covers append-only design, OTLP schema, SIEM integration, tamper-evidence, and forensic investigation."
slug: /learn/ai-agent-audit-log
primary_keyword: ai agent audit log
last_updated: "2026-11-03"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-observability
  - /learn/ai-agent-governance
  - /learn/ai-agent-monitoring
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-orchestration
---

# AI Agent Audit Log: Immutable Trails, Compliance, and Forensic Investigation

An AI agent audit log answers one question after the fact: what did this agent do, on whose behalf, under which rule, and who said yes? This page covers what such a log must capture, the records OpenLegion writes for one tool call (with our real column names), tamper-evidence, retention and export.

<!-- SCHEMA: DefinitionBlock -->

> **An AI agent audit log** is an append-only record of the actions an agent proposes and takes: each tool call, each policy decision, each human approval and each credential use. Every entry is attributed to an agent, a run and a timestamp, and the agent itself has no way to change it. Its job is to let an owner, auditor or investigator rebuild what happened without relying on the agent's own account.

## What an Agent Audit Log Must Capture

### Why ordinary application logs miss it

Application logs record requests: a user, an endpoint, a status code. One agent run can read an email, decide to reply, be held for approval, wait hours, resume in another process and send. Request logs show the send at most, not that the model proposed it, a policy held it, a person approved it, or that the prompt came from an untrusted web page.

Metrics and traces miss it too: they are often sampled, aggregated and kept for weeks. An audit log keeps each event, including refused and failed ones, for as long as someone may ask about it. See [AI agent observability](/learn/ai-agent-observability) for the operational side.

### The minimum record

For each action, record:

- **Actor**: which agent, or which person, system job or channel acted. Approvals are made by people, so the log needs both kinds of actor.
- **Run**: the specific execution (a run, wake or session) the action belongs to, so you can group everything that happened in one run.
- **Intent**: the tool and its full input as the model proposed it, plus a hash of that input, so you can show that the approved call is the call that ran.
- **Decision**: allow, deny or hold, with the reason, the risk tier and the trust level of the input that triggered it.
- **Approval**: who decided, when, and whether they approved, rejected or edited the call.
- **Outcome**: success, failure, or "unknown" when a call timed out after it may already have had an effect.
- **Credential use**: which named credential was used, never the secret itself.
- **Cost**, where the action spent money.

Refused actions belong in the log too. A denied call is often the most useful entry in an incident review: it shows the control working, or what an injected instruction tried to do.

## How OpenLegion Records an Agent Action

In OpenLegion, every side effect an agent causes goes through one component, the tool gateway. Its pipeline is `intent → policy → price/admission → execute → receipt`. The model never calls a tool directly. It gets back either the receipt's output or a structured refusal.

Four tables hold the evidence:

| Table | What it holds | Can it change? |
|---|---|---|
| `action_intents` | One row per proposed tool call: tool, input, `intent_hash` (SHA-256 over tenant, agent, tool and input), an idempotency key built from agent, run and step, the policy decision, and a status | Status moves through a fixed state machine |
| `approvals` | A held call: risk tier (`none`, `external_visible`, `financial`, `irreversible`), status, who decided and when | Decided once |
| `receipts` | The result of an executed call: output, external reference, cost | Written before the intent is marked finished; a call that settles later can merge into it |
| `audit_events` | The event stream across all of the above, plus workspace changes | Append-only: `UPDATE` and `DELETE` raise an error in the database |

A retried step reuses the same idempotency key, so it cannot act twice; a replay returns the existing receipt instead of running the tool again.

### One tool call, held for approval

Here is the sequence of `audit_events` rows for an agent sending an email that its owner has set to require approval. The column names are real; the IDs and values are illustrative.

```json
[
  {
    "id": 18041, "ts": "2026-11-03T02:14:07.112Z",
    "actor_type": "agent", "actor_id": "a1f…", "agent_id": "a1f…",
    "wake_id": "w7c…", "intent_id": "i93…",
    "action": "tool.awaiting_approval", "resource": "tool:email.send",
    "decision": "hold", "risk_tier": "external_visible", "trust_tier": "owner",
    "detail": { "tool": "email.send", "approvalId": "p52…", "reason": "…" }
  },
  {
    "id": 18077, "ts": "2026-11-03T03:40:51.904Z",
    "actor_type": "user", "actor_id": "u0b…", "agent_id": "a1f…",
    "intent_id": "i93…",
    "action": "approval.decided", "resource": "approval:p52…",
    "decision": "approve",
    "detail": { "kind": "…" }
  },
  {
    "id": 18079, "ts": "2026-11-03T03:40:53.230Z",
    "actor_type": "agent", "actor_id": "a1f…", "agent_id": "a1f…",
    "wake_id": "w8d…", "intent_id": "i93…",
    "action": "tool.executing", "resource": "tool:email.send",
    "decision": "allow", "risk_tier": "external_visible", "trust_tier": "owner",
    "detail": { "tool": "email.send", "executionToken": "…" }
  }
]
```

Three things to notice:

1. **The intent ID ties the chain together.** The hold, the decision and the execution share `intent_id`, although execution happens in a later run (`wake_id` differs).
2. **The approval is recorded as a person.** `actor_type` is `user`, written in the same database statement that records the decision.
3. **`tool.executing` is written before the tool runs.** If the process dies mid-call, the log still shows execution started.

After the call, the receipt holds the output. Before it is stored, the output is scanned for credential-shaped strings and each match is replaced with `[redacted:<shape>]`, so a secret echoed back by an API does not end up in the record.

The credential broker logs `credential.used` with an outcome, or `credential.denied` with a reason such as `credential_not_allowed`. The record names the credential and the purpose; a test checks that the secret never appears in it. More in [credential management for AI agents](/learn/credential-management-ai-agents).

### A trade-off we chose

The receipt is the hard guarantee: success, failure and settlement all write the receipt first and change the intent's status second, so a crash in between still leaves evidence. The audit row is not held to that standard: if writing it fails, the gateway logs a warning and the run continues, because we decided an audit outage should not stop every agent. If your regime requires fail-closed auditing, build it yourself and expect it to cost availability.

## Tamper-Evidence Options

"Append-only" can mean several things, and each defends against a different attacker.

**Database-level append-only.** A trigger that rejects `UPDATE` and `DELETE` stops application code and agents from editing history. OpenLegion does this on `audit_events`. The model never touches the table; rows are inserted by platform code. This does not stop someone with database superuser rights, who can drop the trigger.

**Hash chains and Merkle roots.** A hash chain links each entry to the previous one, so any change breaks every later hash. A Merkle tree gives the same detection with one root per batch, and can prove a single entry belongs to it. OpenLegion computes an RFC 6962 SHA-256 Merkle root for each workspace for each closed UTC day. Roots go into an `audit_roots` table that is itself append-only and readable by the workspace's members, and a verify function recomputes a day and compares it to the stored root. The root covers every column except `detail` and `ip`, for a reason explained under erasure below.

What is not built: publishing those roots anywhere outside our database. Someone able to rewrite both `audit_events` and `audit_roots` could make them agree. To defend against that attacker, the root has to be copied somewhere they cannot reach.

**Write-once storage and external copies.** If you run your own pipeline, the next step is write-once storage, such as Amazon S3 Object Lock in compliance mode, where not even the account root can shorten retention. Forwarding to a SIEM outside the recorded system's blast radius does the same job. Over OpenTelemetry, the OTLP log data model already has the fields: event time (`TimeUnixNano`), observed time (`ObservedTimeUnixNano`, set on receipt), trace and span IDs, and structured attributes. A large gap between the two times is worth an alert.

## Retention, Erasure and Export

**Retention.** No framework gives a single number. SOC 2 Type II is assessed over an observation period, so logs must cover at least that period. GDPR Article 30 requires a record of processing activities, described by purpose and category; an event log shows that record matches what your agents did. In OpenLegion, audit rows are never deleted. They have no foreign key to the workspace, so they survive the workspace's deletion.

**Erasure.** An immutable log and a right-to-erasure request conflict unless personal data is kept out of the fields you hash. OpenLegion's erase path has one way into `audit_events`: an update that empties `detail` and nulls `ip` and changes nothing else. Because the daily Merkle root covers only the columns that survive this redaction, an honoured erasure does not look like tampering. The Merkle roots are kept, since they hold hashes and counts, not content. Workspace erasure also removes the workspace's files from storage, with the exceptions listed in the erase job.

**Reading and export.** Workspace owners and admins can read the audit log under Settings → Ops on every plan. The owner can export the workspace, also on every plan, as a newline-delimited JSON file. Whether that export includes the activity log section depends on the plan: it does on Team and Enterprise. The export writes its own audit row before the first byte is sent, so a cancelled export is still on record.

## Rebuilding a Timeline After an Incident

With the structure above, an investigation is a set of queries rather than a reconstruction from memory:

```sql
-- Everything one agent did in one run, in order
select id, ts, actor_type, action, resource, decision, risk_tier, trust_tier
from audit_events
where agent_id = $1 and wake_id = $2
order by id;

-- Every human decision about one intent
select id, ts, actor_id, decision
from audit_events
where intent_id = $1 and action = 'approval.decided';
```

Start from the harmful action, follow its `intent_id` back to the hold and approval, then widen to the run with `wake_id`. An action that traces back to low-trust input, such as a web page (`trust_tier`), points at prompt injection. The [AI agent security](/learn/ai-agent-security) guide covers the controls that produce those refusals.

## Checklist

- Every tool call passes through one gateway that the model cannot bypass.
- Refused and held calls are logged, not only completed ones.
- Each entry names an actor type, so people and agents are distinguishable.
- Intents carry a hash of their input, and an entry is written before execution starts.
- Credentials appear by name only, and outputs are scanned for secrets before storage.
- The log rejects updates and deletes at the database level.
- Periodic hash or Merkle roots are computed, and copied outside the system if your threat model includes its administrators.
- Personal data sits in fields that can be redacted without breaking the hashes.
- You have decided, on purpose, whether an audit write failure stops the agent.
- Owners can read and export the log without filing a support request.

For review cadence and escalation rules, see [AI agent governance](/learn/ai-agent-governance).

## Get Started

**Deploy AI agents where every tool call, delegation and approval is recorded as a receipt the owner can read.**
[Join the waitlist](https://app.openlegion.ai/signin) | [Explore AI Agent Security](/learn/ai-agent-security)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is an AI agent audit log and how is it different from observability data?

An audit log is an append-only record of each action an agent proposes and takes, with the policy decision, any approval and the outcome. Observability data shows system health and is often sampled and short-lived; an audit log keeps every event, including refused ones.

### What fields should every agent audit log entry contain?

Actor and actor type, run, tool and input (or its hash), policy decision with reason and risk tier, trust level of the triggering input, any approval and who made it, outcome, credential name, and cost.

### How do I make an audit log tamper-evident?

Reject updates and deletes in the database, then compute periodic hashes or Merkle roots. OpenLegion computes one Merkle root per workspace per UTC day. To protect against the system's own administrators, copy roots or events to write-once storage or a separate SIEM.

### How do I handle GDPR erasure requests when audit logs must be immutable?

Keep personal data in fields excluded from the hash and erase by redacting them, not deleting rows. In OpenLegion, erasure empties `detail` and nulls `ip`; the daily root covers the other columns, so it still verifies.

### Can I export OpenLegion's audit log?

The workspace owner can export the workspace on every plan. The activity log section of the export is included on the Team and Enterprise plans. Owners and admins can read the audit log in Settings → Ops on every plan.
