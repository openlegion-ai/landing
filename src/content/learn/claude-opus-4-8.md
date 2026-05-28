---
title: Claude Opus 4.8 - Capabilities, Cost, and Agentic Performance
description: Claude Opus 4.8 launched May 28 2026: 84% on Online-Mind2Web, fast mode 3x cheaper, dynamic workflows in Claude Code, first Opus to complete every Super-Agent benchmark case at GPT-5.5 cost parity.
slug: /learn/claude-opus-4-8
primary_keyword: claude opus 4.8
secondary_keywords:
  - claude opus 4.8 api
  - claude opus 4.8 benchmarks
  - claude opus 4.8 vs gpt-5.5
  - claude opus 4.8 fast mode
  - claude opus 4.7 vs opus 4.8
date_published: "2026-05"
last_updated: "2026-05-28"
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
  - /learn/ai-agent-orchestration
  - /learn/agentic-workflows
  - /comparison/langgraph
  - /comparison/autogen
---

# Claude Opus 4.8: Agentic Performance, Fast Mode Pricing, and What Changed from Opus 4.7

Claude Opus 4.8 is Anthropic's upgrade to the Opus model class, announced May 28 2026 - the first model to complete every case in a Super-Agent benchmark at GPT-5.5 cost parity, with 84% on Online-Mind2Web browser-agent accuracy, a fix for the Opus 4.7 tool-calling verbosity issues that degraded autonomous engineering workloads, and fast mode (2.5x speed) now priced 3x cheaper than in previous Opus models. Standard API pricing is unchanged from Opus 4.7; the cost change is concentrated in fast mode. The API model identifier is `claude-opus-4-8-20260528`.

<!-- SCHEMA: DefinitionBlock -->

> **What is Claude Opus 4.8?**
> Claude Opus 4.8 is Anthropic's May 2026 upgrade to the Opus model class - a frontier-tier large language model optimized for long-running agentic tasks, multi-step reasoning, and autonomous tool use - featuring improved benchmark performance over Opus 4.7, fixes to tool-calling reliability regressions, and a fast mode (extended thinking at 2.5x speed) priced 3x lower than fast mode for previous Opus models.

## OpenLegion's Take: The Model That Changes Agentic Economics

Opus 4.8 is the model we recommend for any agent doing substantive agentic work as of May 2026. Three things changed from Opus 4.7 that matter for production agent fleets.

First: the tool-calling reliability fix. Scott Wu (Cognition / Devin CEO) confirmed publicly that Opus 4.7 introduced comment-verbosity and tool-calling inconsistencies that degraded Devin's autonomous engineering reliability. Opus 4.8 fixes both. For agents in tight tool-use loops, this is the difference between a model that requires frequent correction and one that completes tasks cleanly.

Second: 84% on Online-Mind2Web (outperforming GPT-5.5) and the first clean Super-Agent benchmark sweep at GPT-5.5 cost parity. Online-Mind2Web measures real browser-based task completion. The Super-Agent benchmark covered translation, deep research, slide-building, and analysis end-to-end. Opus 4.8 completed every case; GPT-5.5 did not.

Third: fast mode at 3x lower cost. Databricks reported 61% cheaper token cost vs Opus 4.7 in their Genie agent. For long-running tasks where you previously chose Sonnet for cost and accepted lower quality, fast mode Opus 4.8 changes the math.

The Anthropic announcement came the same day as their $65B Series H at $965B post-money valuation.

OpenLegion supports the full Anthropic API model roster. Setting `claude-opus-4-8-20260528` as your fleet default is a single config change. Vault-isolated API calls, per-agent budget caps, and container-isolated execution apply automatically - [what an AI agent platform provides for running Opus 4.8 with budget controls and vault isolation](/learn/ai-agent-platform).

## Benchmark Performance: What the Numbers Show

### Online-Mind2Web: 84% browser-agent accuracy

Online-Mind2Web is a benchmark for browser-based agent task completion - filling forms, navigating multi-page flows, extracting information from live web interfaces. Claude Opus 4.8 scored 84% on Online-Mind2Web as of May 2026, outperforming both Claude Opus 4.7 and GPT-5.5. This is the highest-published score on that benchmark at Opus 4.8's launch date. For builders deploying browser automation agents, this is the operative number.

### Super-Agent benchmark: first complete sweep at GPT-5.5 cost parity

Kay Zhu, Co-Founder and CTO, reported that Claude Opus 4.8 is the first model to complete every case end-to-end on their internal Super-Agent benchmark covering: translation at scale, deep research synthesis, slide deck construction from raw data, and multi-source analysis. GPT-5.5 did not complete every case. Opus 4.8 achieved this at GPT-5.5 cost parity.

### CursorBench: more efficient tool calling at every effort level

Cursor's internal coding benchmark measures code generation quality and tool-use efficiency. Claude Opus 4.8 outperforms prior Opus models at every effort level on CursorBench - fewer wasted tokens on verbose comments means more of the token budget goes to actual work.

### Legal Agent Benchmark: first to break 10% all-pass standard

Leya (a legal AI platform), reported by Head of Applied Research Niko Grupen, confirmed Claude Opus 4.8 is the first model to break 10% on the Legal Agent Benchmark's all-pass standard. The all-pass standard requires every step in a multi-step legal workflow to be correct - a single error fails the entire case.

### Databricks Genie: 61% cheaper than Opus 4.7

Databricks reported that Claude Opus 4.8 delivers 61% cheaper token cost compared to Opus 4.7 for their Genie agent - an AI agent for data analysis and knowledge work using multimodal reasoning over PDFs and diagrams.

## What Changed from Opus 4.7

### Tool-calling fix: the verbosity regression that hurt Devin and autonomous workloads

Claude Opus 4.7 introduced a regression in tool-calling behavior that multiple production teams noticed independently: agents produced excessive inline comments, wrapped outputs with unnecessary explanatory prose, and occasionally made duplicate or redundant tool calls.

Scott Wu (Cognition / Devin CEO) confirmed publicly that Opus 4.7 had "comment-verbosity and tool-calling issues" that Opus 4.8 fixes. Teams that downgraded from Opus 4.7 back to Opus 4.6 for tool-use reliability should re-evaluate with Opus 4.8.

### Dynamic workflows in Claude Code

Claude Code gains dynamic workflows with Opus 4.8 - the ability to tackle large-scale problems by creating, sequencing, and managing multi-step workflow structures. Claude Code can plan a large codebase migration, create subtasks, execute them in sequence while tracking intermediate state, and adapt its plan based on results at each step. Available in Claude Code using Opus 4.8 as of May 28 2026.

### Fast mode: 2.5x speed at 3x lower cost

Fast mode for Claude Opus 4.8 runs at 2.5x the speed of standard Opus using extended thinking, and is priced 3x lower than fast mode was for previous Opus models including Opus 4.7. Standard (non-fast-mode) pricing is unchanged from Opus 4.7.

Fast mode is enabled via the `budget_tokens` parameter in the API's extended thinking configuration. Setting `budget_tokens` to a lower value activates fast mode behavior.

## API Reference and Pricing

### Model identifier

The API model identifier for Claude Opus 4.8 is `claude-opus-4-8-20260528`. Use this string in the `model` parameter of any Anthropic API call, Amazon Bedrock model ID field, or Google Cloud Vertex AI model reference.

### Availability

Claude Opus 4.8 is available through three channels: the Anthropic API directly (api.anthropic.com), Amazon Bedrock, and Google Cloud Vertex AI. All three channels support the same feature set including extended thinking and fast mode.

### Context window

Claude Opus 4.8 uses the same context window as Opus 4.7 (200K tokens) and the same standard input/output token pricing. Cost improvements are concentrated in fast mode.

## When to Use Opus 4.8 vs Sonnet 4 vs Opus 4.7

### Opus 4.8: long-running agentic tasks, browser automation, large-scale coding

Choose Opus 4.8 when task quality is the constraint. Long-running autonomous agents in tight tool-use loops benefit from the tool-calling reliability fix. Browser automation agents (Online-Mind2Web: 84%) outperform any other model at this task type. Legal and financial analysis requiring zero-error chaining is Opus 4.8's domain.

For [AI agent frameworks that access Claude Opus 4.8 via the Anthropic API](/learn/ai-agent-frameworks), the migration path is a model identifier swap to `claude-opus-4-8-20260528`.

### Sonnet 4: high-volume, latency-sensitive pipelines

Choose Sonnet 4 when volume and latency are the constraint. High-frequency API calls where per-token cost determines unit economics, real-time response pipelines where latency is visible to end users. Sonnet 4 and Opus 4.8 fast mode now occupy adjacent cost/quality tiers - teams should benchmark both for their specific workload.

### When Opus 4.7 still applies

The only case for staying on Opus 4.7: prompts specifically tuned to its verbosity patterns. If your pipeline post-processes Opus output and relies on the comment structure Opus 4.7 generated, stay on 4.7 until you have time to adapt. Test on Opus 4.8 before migrating production prompts.

For [agentic workflow design and where Opus 4.8's judgment improvements change execution reliability](/learn/agentic-workflows), the tool-calling fix is the most impactful change for workflows with five or more tool calls per task.

## OpenLegion and Claude Opus 4.8

OpenLegion supports `claude-opus-4-8-20260528` as a fleet model option. Setting it as the default for an agent is a single field in the agent configuration:

```
model: anthropic/claude-opus-4-8-20260528
```

All OpenLegion security controls apply to Opus 4.8 calls automatically: vault proxy credential injection (the API key never enters the agent container), per-agent daily and monthly budget caps (a runaway Opus 4.8 loop cannot exhaust your API quota without hitting the cap), Docker container isolation, and full audit logging.

For multi-agent comparisons, see [OpenLegion vs LangGraph - deploying Opus 4.8 in graph-based vs flat fleet architecture](/comparison/langgraph) and [OpenLegion vs AutoGen - Opus 4.8 in shared-process vs isolated-container multi-agent systems](/comparison/autogen).

## Get Started with Claude Opus 4.8 on OpenLegion

**Set `claude-opus-4-8-20260528` as your fleet default. Vault-isolated, budget-capped, production-ready.**
[Start Building](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [See the Platform](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is Claude Opus 4.8?

Claude Opus 4.8 is Anthropic's upgrade to the Opus model class, announced May 28 2026. It builds on Claude Opus 4.7 with improved agentic judgment, stronger benchmark performance on coding, reasoning, and professional knowledge work, and fixes to tool-calling verbosity issues that affected Opus 4.7 autonomous workloads. It introduces dynamic workflows in Claude Code for large-scale multi-step problems and fast mode at 2.5x speed that is now 3x cheaper than fast mode was for previous Opus models.

### How does Claude Opus 4.8 compare to GPT-5.5?

On benchmarks relevant to agentic tasks, Claude Opus 4.8 outperforms or matches GPT-5.5 across multiple independent evaluations. On Online-Mind2Web, Opus 4.8 scored 84%, outperforming GPT-5.5. On an internal Super-Agent benchmark, Opus 4.8 was the first model to complete every case end-to-end, beating GPT-5.5 at cost parity. On the Legal Agent Benchmark, Opus 4.8 is the first to break 10% on the all-pass standard.

### How much cheaper is Claude Opus 4.8 fast mode compared to Opus 4.7?

Fast mode for Claude Opus 4.8 runs at 2.5x normal speed using extended thinking and is priced 3x lower than fast mode was for previous Opus models including Opus 4.7. Standard Opus 4.8 pricing (non-fast mode) is unchanged from Opus 4.7. Databricks reported 61% cheaper token cost vs Opus 4.7 for their Genie agent.

### What were the Opus 4.7 tool-calling problems that Opus 4.8 fixes?

Claude Opus 4.7 introduced comment-verbosity and tool-calling inconsistencies that reduced reliability for autonomous engineering workloads. Cognition (makers of the Devin autonomous coding agent) reported via CEO Scott Wu that Opus 4.7 was less consistent than Opus 4.6, and that Opus 4.8 fixes both the comment-verbosity regression and the tool-calling inconsistencies. Teams using Opus 4.7 in tight tool-use loops that saw noisier outputs or more correction steps than expected should test Opus 4.8 as a drop-in replacement.

### What is the Claude Opus 4.8 API model identifier?

The API model identifier for Claude Opus 4.8 is `claude-opus-4-8-20260528`. It is available through the Anthropic API directly, Amazon Bedrock, and Google Cloud Vertex AI. Fast mode (extended thinking at 2.5x speed) is enabled via the `budget_tokens` parameter in the extended thinking configuration. Standard pricing is identical to Opus 4.7; fast mode pricing is 3x lower than fast mode was for previous Opus models.

### What is Claude Code dynamic workflows in Opus 4.8?

Dynamic workflows is a feature in Claude Code launched alongside Opus 4.8 that enables tackling large-scale problems by dynamically creating, sequencing, and managing multi-step workflow structures. Claude Code can plan a large refactor or migration, create subtasks, execute them in sequence while tracking state, and adapt based on intermediate results. This makes Claude Code viable for large codebase migrations, full-stack feature builds spanning multiple files and services, and multi-repository changes that exceed the scope of a single-pass agent session.
