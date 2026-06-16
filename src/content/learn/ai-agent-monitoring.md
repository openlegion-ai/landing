---
title: "AI Agent Monitoring — Runtime Alerts, Dashboards, and Cost Tracking"
description: "AI agent monitoring tracks live execution health—token consumption, tool call failures, latency spikes, and runaway loops—so engineering teams catch incidents before users do."
slug: /learn/ai-agent-monitoring
primary_keyword: ai agent monitoring
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-evaluation
  - /learn/ai-agent-security
  - /learn/ai-agent-testing
  - /learn/credential-management-ai-agents
  - /learn/llm-cost-optimization
---

# AI Agent Monitoring — Runtime Alerts, Dashboards, and Cost Tracking

AI agent monitoring is the practice of observing live agent execution health — tracking token consumption, tool call failure rates, latency percentiles, and runaway loop detection — so engineering teams receive automated alerts before a silent failure cascades into user-visible downtime or runaway cloud spend. Unlike static observability instrumentation, monitoring operates in real time against defined thresholds and SLOs.

<!-- SCHEMA: DefinitionBlock -->
AI agent monitoring is the continuous measurement of autonomous AI agent execution health — including token consumption, tool call error rates, latency, and loop detection — against predefined thresholds that trigger automated alerts when exceeded.

## Why Agent Monitoring Differs from Traditional App Monitoring

Traditional application monitoring assumes deterministic code paths: a request enters a handler, the handler calls known dependencies, and the response follows a predictable execution graph. You set P99 latency thresholds and error rate alerts because you know which operations run on each request. Agent monitoring cannot make these assumptions.

### Non-Deterministic Execution Paths

An agent's execution path depends on LLM output, which varies across requests. One execution calls three tools and completes in 12 seconds. The next, with a slightly different prompt, calls seven tools, triggers two retries, and takes 94 seconds. Neither path was hardcoded — the LLM selected the tool sequence at runtime. This variability means threshold-based monitoring must account for legitimate variance in execution depth, not just outlier spikes.

The practical consequence: alert on runaway behavior (same tool called × N within a single session), not on individual call latency, which has legitimate high variance. A research agent that calls a search tool 15 times is behaving normally. The same agent calling a search tool 150 times in 90 seconds is in a loop.

### Token Budgets as a Cost Control Plane

Every agent invocation consumes tokens: input context, LLM generation, tool results fed back into context. Without a cost control plane, a single misbehaving agent can consume thousands of dollars in API credits before any human notices. The Q3 2025 Arize AI Incident Report identified tool call error cascades as the most common production incident type for multi-agent systems — a single tool returning HTTP 429 rate-limit errors triggered retry loops that consumed 40–100× the expected token budget before the agent was manually stopped.

Traditional APM tools have no concept of token budgets. Agent monitoring requires a budget dimension: per-agent daily cap, per-session cap, and a hard enforcement mechanism — not just an alert — that blocks further LLM calls when the cap is exceeded.

### Tool Call Chains Amplify Single-Point Failures

In a traditional application, a dependency failure produces an error at that call site. The retry policy handles it, and if retries exhaust, the request fails cleanly. In an agent, a tool call failure may cause the LLM to reroute — attempting alternative tools, retrying with modified arguments, or producing verbose error analysis before failing. Each of these LLM turns consumes tokens. A tool failure in an agent is not a leaf-node error; it is the start of a reasoning sequence that may consume significant compute before halting.

Monitor tool call failure rate and retry depth together, not individually. A tool with 5% error rate and zero retries is benign. A tool with 1% error rate and average retry depth of 8 is a budget risk.

## OpenLegion's Take: Budget Caps at the Mesh Layer

Most agent frameworks treat monitoring as the host application's responsibility. LangChain and LangGraph provide callback hooks for logging but no platform-level enforcement. CrewAI's `max_iter` parameter sets a per-agent iteration limit, but it is a static configuration value, not a runtime alert that escalates. AutoGen's `max_consecutive_auto_reply` is similarly static.

None of these enforce budget caps at the platform layer. An agent whose own code has a bug — or has been compromised via prompt injection — can consume unbounded tokens because the framework has no authority to block LLM calls. The developer's application-level guard is the only protection, and it runs inside the agent's own execution context.

OpenLegion enforces four monitoring primitives at the mesh layer, outside agent code:

1. **Per-agent daily and monthly token budget caps enforced by the mesh host.** A misconfigured agent cannot exceed its cap even if the agent's own code has no guard. When the cap fires, the mesh blocks further LLM calls automatically — the agent cannot instruct the mesh to lift its own cap.

2. **Built-in runaway loop detection.** Repeated calls to the same tool within a session trigger a configurable alert — default threshold is the same tool called ×5 within 60 seconds. The alert routes to the on-call escalation path; the agent can be auto-paused pending human review.

3. **Heartbeat monitoring for autonomous agents.** Each agent operating on a scheduled or long-running task writes a status update to the mesh every N seconds. If no heartbeat is received within the configured window, the mesh marks the agent stuck and pages the on-call team via the configured escalation channel. Mean Time to Detection (MTTD) for stuck agents is under 60 seconds.

4. **Credential vault audit log as a monitoring signal.** OpenLegion's credential vault logs every handle resolution with agent ID, timestamp, and target endpoint. Anomalous credential access patterns — an agent resolving handles it has never accessed before, or resolving the same handle at 10× the normal rate — appear in the vault audit log as a real-time monitoring signal. This eliminates the OWASP LLM Top 10 #2 risk (Insecure Output Handling) surface where agents disclose credentials in tool outputs, because no plaintext credential ever exists in agent memory to disclose.

## The Five Metrics Every Agent System Must Monitor

### 1. Token Consumption Rate (Per-Agent, Per-Session)

Track tokens consumed per minute per agent and cumulative tokens per session. Baseline from the first two weeks of production traffic; alert when a session exceeds 3× the baseline P95 session token count. Two derived metrics matter:

- **Token velocity**: tokens/minute within a session. A spike signals a runaway loop or unexpected context expansion.
- **Context window fill rate**: percentage of the model's context window consumed. When an agent approaches 80% context fill, performance degrades and cost per useful output increases.

Budget cap alert: alert at 80% of the daily cap (warning), hard-block at 100% (enforcement). Never rely solely on the warning alert — agents can exceed the remaining 20% budget before any human responds to a warning.

### 2. Tool Call Error Rate and Retry Depth

Monitor both dimensions separately:

- **Error rate**: failed tool calls / total tool calls, per tool and per agent. Baseline per tool. Alert at 2× baseline error rate sustained for ≥5 minutes.
- **Retry depth**: number of retries before success or final failure. A tool that succeeds on retry 1 or 2 is behaving normally under transient load. A tool that requires ≥8 retries per success has a structural reliability problem.

Combine: high error rate + high retry depth = budget cascade risk. Alert on the combination, not the individual metrics in isolation.

### 3. End-to-End Latency P50/P95/P99

Agent latency has two components: LLM inference latency (model-side, limited control) and tool call latency (external dependency, monitorable and alertable). Track both separately.

For SLO definition, use P95 rather than P99 for multi-step agents — P99 will include legitimate long-running planning sessions that are not incidents. A useful SLO structure:

- **P50 < 8 seconds** (typical single-step response)
- **P95 < 45 seconds** (multi-tool orchestration)
- **P99 < 120 seconds** (complex planning sequences; alert but do not page)

SLA for user-facing agents: P95 < 45 seconds sustained over any 5-minute window. Breach triggers an on-call page.

### 4. Runaway Loop Detection (Same-Tool Repeated Calls)

A runaway loop occurs when an agent calls the same tool repeatedly within a session — typically because tool results are not satisfying the LLM's implicit success criterion and the LLM keeps retrying. The loop may be caused by a broken tool, a malformed task objective, or prompt injection that redirects the agent into an infinite search loop.

Detection rule: same tool called × N within window W, where N=5 and W=60 seconds is a reasonable production default. Alert immediately; optionally auto-pause the agent pending human review for high-cost tools (LLM calls, external API calls with per-call billing). Do not use session-level iteration counts alone — a legitimate research agent may call a search tool 20 times across a 10-minute session without triggering a loop condition.

### 5. Credential Exposure Events (Vault Audit Log)

If your agent platform has a credential vault with audit logging, monitor for anomalous handle resolution patterns:

- An agent resolving a credential handle it has not previously accessed (new-credential-access alert)
- A credential handle resolved ×10× the normal rate within a 5-minute window (rate anomaly alert)
- A credential resolve immediately followed by an outbound network request to a new domain (potential exfiltration signal)

For platforms without credential vault isolation — where credentials live in environment variables or are passed as strings — this monitoring signal is not available. Credential leakage is detected only after exfiltration, if at all.

## Comparison: Agent Monitoring Approaches

| **Platform** | **Budget enforcement** | **Loop detection** | **Alert latency** | **Credential audit** | **Multi-agent scope** |
|---|---|---|---|---|---|
| **OpenLegion** | Mesh-layer hard cap (blocks LLM calls when exceeded) | Built-in: repeated same-tool call detection, configurable threshold | <1 second (mesh-side, not polled) | Full vault audit log, no credentials in agent memory | Per-agent and fleet-level dashboards |
| **LangChain / LangGraph** | Application-level only; no platform cap | Not built-in; requires custom callback handler | Depends on external APM (Langfuse, LangSmith) | Credentials passed as strings; no vault isolation | Per-run traces only |
| **CrewAI** | No platform-level budget cap | max\_iter parameter per agent (not runtime alert) | Via third-party AgentOps or custom hooks | Environment variables; no audit trail | Crew-level, not per-agent breakdown |
| **AutoGen** | OpenAI API key budget only (account-level) | max\_consecutive\_auto\_reply (static, not runtime alert) | No built-in alerting; manual log scraping | Keys in config; no vault | Conversation-level logs |

## Setting Up Effective Alert Thresholds

### Starting Thresholds for New Agent Deployments

When a new agent goes to production without a baseline, use these conservative defaults and tighten after two weeks of traffic:

| Metric | Warning | Page on-call |
|---|---|---|
| Token budget consumed | 80% of daily cap | 100% (hard block) |
| Tool error rate (5-min window) | 2× expected | 5× expected |
| Same-tool call within 60s | 3 calls | 5 calls |
| End-to-end P95 latency | 60s | 120s |
| No heartbeat received | 2× expected interval | 3× expected interval |

These are starting points. Agents with expensive external tools (LLM-based tool chains, paid API services) warrant tighter loop detection thresholds. Agents with long legitimate reasoning sequences (research, planning) warrant looser latency thresholds.

### SLO vs SLA for Autonomous Agents

An SLO (Service Level Objective) is an internal engineering target. An SLA (Service Level Agreement) is a contractual commitment to users or customers. For AI agents:

**SLO**: P95 completion time < 45s, tool error rate < 2%, session token budget < 50,000 tokens/session. Engineering teams alert on SLO breach but users are not automatically notified.

**SLA**: For user-facing agents, define maximum acceptable failure rate and completion time across a measurement window (e.g., "95% of user sessions complete without error within 60 seconds over any rolling 1-hour period"). SLA breach triggers user communication and post-incident review.

Autonomous agents running background tasks (scheduled workflows, fleet-wide jobs) should have SLOs, not SLAs — they are infrastructure, and their output feeds into user-facing services that carry their own SLAs.

### Escalation Paths: Auto-Pause vs Page On-Call

Not every alert warrants human intervention. Define two escalation paths:

**Auto-pause**: Agent is suspended automatically, task is queued for retry or human handoff. Appropriate for runaway loop detection, token budget exhaustion, and credential anomaly events — situations where continued execution causes harm. The agent's state is preserved; a human can review and resume.

**Page on-call**: Alert sent to an on-call rotation (PagerDuty, Opsgenie, or equivalent). Appropriate for SLA breaches, novel error patterns, and any anomaly that auto-pause does not resolve within a configured timeout. Mean time to page should be under 60 seconds from event detection.

Never set all alerts to page on-call. Alert fatigue destroys the value of the on-call system. Auto-pause and auto-retry handle the recoverable cases; on-call handles the unresolvable ones.

## Common Monitoring Anti-Patterns

### Logging Without Alerting

The most common monitoring mistake: high-quality log output with no alerting layer. Engineers can manually query logs to diagnose an incident after it occurs, but no one receives an alert when the incident starts. This produces a monitoring system that improves post-mortems without improving MTTD.

Alerting requires defined thresholds. If you cannot state what token consumption rate is "too high" or what loop detection threshold you want to enforce, you cannot alert on them. Define thresholds before going to production, even if they are conservative; tighten them after observing baseline behavior.

### Alerting at the Application Layer Instead of the Platform Layer

Application-layer monitoring — callback hooks, middleware, custom exception handlers — runs inside the agent's execution context. A prompt-injected agent can be instructed to suppress its own monitoring callbacks. A bug in agent code can prevent monitoring calls from firing. Application-layer monitoring has the same failure modes as the agent it monitors.

Platform-layer monitoring runs outside the agent's execution context. Budget caps enforced by the mesh host fire even when agent code is entirely compromised. Heartbeat monitoring detects stuck agents even when the agent cannot write its own status. For production AI agents handling sensitive tasks, application-layer monitoring is a supplement, not a substitute, for platform-layer enforcement.

### Missing Runaway Loop Detection

Latency and error rate alerts do not catch runaway loops. A loop where the agent calls the same tool repeatedly may have low per-call latency and low per-call error rate — the tool returns successfully each time, but the LLM dissatisfied with each response calls it again. Session-level token consumption will spike, but only after the loop has been running long enough to accumulate cost.

Runaway loop detection on the same-tool-within-window pattern catches these loops within the first 60–120 seconds of onset, before significant cost accumulates. It is the only reliable early-warning signal for this failure mode.

<!-- SCHEMA: FAQPage -->
## Frequently Asked Questions

### What is the difference between AI agent monitoring and AI agent observability?

Observability refers to instrumentation that captures execution data — logs, metrics, and event records — for post-hoc analysis and debugging. Monitoring refers to real-time threshold evaluation and automated alerting when live execution deviates from expected behavior. Both are needed: observability tells you what happened after an incident; monitoring tells you an incident is happening now. An observability pipeline without alerting thresholds means you learn about failures only after users report them.

### What metrics should I monitor for AI agents in production?

Five metrics are critical for production agent monitoring: token consumption rate (per-agent and per-session), tool call error rate and retry depth, end-to-end latency at P95/P99, runaway loop detection (same tool called more than N times within a window), and credential exposure events from vault audit logs. Token budget and loop detection are unique to agents; traditional APM tools do not provide them. Latency and error rate monitoring follows established patterns but requires agent-aware baselines.

### How do I detect a runaway loop in an AI agent?

Runaway loop detection works by counting calls to the same tool within a fixed time window within a single session. A threshold of five calls to the same tool within 60 seconds is a reasonable production starting point. Detecting loops by session-level iteration count alone misses loops where a legitimate research session makes many diverse tool calls but one particular tool is being called repeatedly in a tight cycle. Same-tool-within-window detection catches this pattern within the first 60–120 seconds before significant token costs accumulate.

### What is a token budget cap and why does it matter for agent monitoring?

A token budget cap is a hard limit on the number of tokens an agent can consume in a session or time period, enforced by the platform before any LLM call is made. Without a budget cap, a misbehaving agent — one in a loop, or compromised via prompt injection, or given an underspecified task — can consume thousands of dollars in API credits before any human notices. Budget caps enforced at the platform layer, outside agent code, fire even when agent code is buggy or compromised. Alerting at 80% of budget and hard-blocking at 100% is the recommended enforcement pattern.

### How do I set alert thresholds for a new AI agent with no traffic baseline?

For a new agent with no baseline, start with conservative defaults: alert at 80% of the daily token budget, page on five same-tool calls within 60 seconds, and alert on tool error rates above 2× expected for more than five minutes. After two weeks of production traffic, measure P50/P95 session token consumption, tool error rates per tool, and completion latency. Tighten loop detection thresholds for expensive tools and loosen latency thresholds for agents with legitimately long planning sequences.

### What is heartbeat monitoring for AI agents?

Heartbeat monitoring is a liveness check for long-running or scheduled autonomous agents. The agent writes a status update to the platform at a regular interval — every 30 or 60 seconds. If the platform receives no heartbeat within the expected window, it marks the agent stuck and triggers an alert. Heartbeat monitoring catches agents that are neither failing nor succeeding — they are processing indefinitely, consuming compute and blocking downstream workflows. It is the primary detection mechanism for hung agents that have not yet hit a token budget cap or loop detection threshold.

## Build Agents That Alert Before Users Notice

Agent monitoring is infrastructure work, not application work. Thresholds, budget caps, and loop detection rules that live in agent code inherit every failure mode of the agent they are meant to monitor. Platform-layer enforcement — budget caps that block LLM calls, loop detection that triggers from outside the agent process, heartbeat monitoring that detects silence — closes the failure mode gap.

For the post-hoc analysis layer that works alongside real-time monitoring, see [AI agent observability — traces and performance analysis](/learn/ai-agent-observability). For the security context behind credential audit monitoring, see [AI agent security and threat model](/learn/ai-agent-security).

[Run agents with mesh-layer budget caps, loop detection, and heartbeat monitoring enforced by default — get started on OpenLegion →](https://app.openlegion.ai)
