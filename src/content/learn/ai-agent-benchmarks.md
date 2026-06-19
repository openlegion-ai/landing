---
title: "AI Agent Benchmarks: SWE-bench, GAIA, WebArena, and Private Evals"
description: "AI agent benchmarks: SWE-bench Verified scores, GAIA levels, AgentBench environments, tau-bench policy compliance, and WebArena results, plus how to run private evals on your own task distribution."
slug: /learn/ai-agent-benchmarks
primary_keyword: ai agent benchmarks
last_updated: "2026-06-19"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-evaluation
  - /learn/ai-agent-observability
  - /learn/llm-cost-optimization
  - /learn/ai-agent-architecture
  - /learn/agentic-workflows
  - /learn/ai-coding-agents
---

# AI Agent Benchmarks: SWE-bench, GAIA, WebArena, and Private Evals

AI agent benchmarks are standardized task suites measuring agent performance on specific categories of work: software engineering (SWE-bench), multi-step reasoning (GAIA), multi-environment interaction (AgentBench), policy-compliant tool use (tau-bench), and web automation (WebArena). Public benchmark scores serve two valid purposes: coarse model shortlisting and regression detection. They do not predict production performance. A 20-40 percentage point drop from public benchmark to real task distribution is routinely observed. Private evals on your own task samples are the production readiness signal.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent benchmarks** are standardized task suites with defined evaluation protocols and public leaderboards that measure agent and model performance on specific categories of tasks, including software engineering (SWE-bench), multi-step reasoning (GAIA), multi-environment interaction (AgentBench), tool-use policy compliance (tau-bench), and web automation (WebArena), enabling comparison across models and agent scaffolds under controlled conditions.

## Why Public Benchmark Scores Don't Predict Production Performance

### The Benchmark-to-Production Gap

A model scoring 49% on SWE-bench Verified does not necessarily solve 49% of your software engineering tickets. The benchmark measures performance on 500 human-verified GitHub issue patches drawn from 300 Python repositories: a specific task distribution. Your production task distribution differs in language mix, codebase size, issue complexity, test coverage, and domain. That difference alone accounts for 15-25 percentage points of gap in most documented cases.

Two additional factors compound the gap:

**Scaffold dependency**: the same model with different agent scaffolds (different system prompt, tool configuration, retry logic, memory access) produces 10-15 point variance on SWE-bench Verified. Leaderboard submissions disclose the scaffold, but rarely in enough detail to reproduce. A score achieved with a 2,000-token system prompt and 8-step retry loop does not transfer to a 200-token prompt with 3 retries.

**Contamination risk**: frontier models trained on web-crawled data may have ingested benchmark questions. GAIA's 466 questions have been public since November 2023 (arXiv:2311.12983). SWE-bench Verified instances are drawn from public GitHub issues. The degree of contamination is unknown and not disclosed by model providers. Contamination inflates benchmark scores relative to held-out private tasks.

The 20-40 point benchmark-to-production gap is the combined effect of these three factors. Plan for it: use benchmark scores to eliminate clearly unsuitable models, not to predict production pass rates.

### Benchmark Gaming and Leaderboard Saturation

By early 2026, the gap between the top three models on SWE-bench Verified had compressed to less than 5 percentage points. On GAIA Level 1, frontier model scores exceed 72% against a human baseline of 95%. On easier sub-tasks, multiple models cluster within statistical noise of each other. This is saturation: the benchmark has stopped differentiating between capable models.

Saturation shifts the decision-making burden to private evals. When the public leaderboard separates models by 2-3 points and scaffold variance is 10-15 points, the leaderboard position has less predictive value than a 50-task private eval on your actual workload.

Benchmark gaming is related but distinct: a lab optimizes scaffolding, prompting, and post-processing specifically for a benchmark's format without improving underlying capability. The tell is disproportionate benchmark improvement vs. downstream task improvement. Methodology transparency, specifically whether the submission includes the exact scaffold, prompt, and post-processing pipeline, is the disclosure standard that separates credible leaderboard entries from gamed results.

### What Benchmark Scores Are Actually Useful For

Four uses where public benchmark scores provide genuine signal:

1. **Coarse model filtering**: eliminate models below a threshold before running private evals. A model scoring <20% on SWE-bench Verified is unlikely to handle Python bug-fixing tasks even with scaffold improvements. Use benchmarks to reduce the private eval candidate list from ten models to three.

2. **Regression detection**: run the same benchmark slice on each new model release to detect capability regression between versions. A 5-point SWE-bench drop on a model update is an early signal to re-evaluate production configuration before deployment.

3. **Cross-architecture comparison**: benchmarks enable apples-to-apples comparison across model families under controlled conditions that your own infrastructure does not provide. Comparing GPT-4o and Claude Sonnet on your production tasks requires API access to both and controlled experimental design; SWE-bench provides this comparison at low cost.

4. **Research tracking**: monitor benchmark progress to understand the rate of capability improvement in the field. The ~25-point frontier improvement on SWE-bench Verified over 18 months through October 2024 is a data point for planning agent system capability timelines.

What benchmark scores are not useful for: making binary deployment decisions, predicting cost-per-task on production workloads, or comparing agent platforms that use different underlying models.

## SWE-bench: Software Engineering Agent Benchmarks

### SWE-bench Verified: Methodology and What the Score Means

SWE-bench Verified is the current standard for software engineering agent evaluation. The dataset contains 500 problem instances, each consisting of a GitHub issue, the pre-fix repository state, and a test suite that validates the correct fix. The 500 instances were sampled from 12,000 GitHub issues across 300 Python repositories and then human-verified to confirm each issue is correctly solvable and each test suite is reliable. The full SWE-bench dataset has 2,294 instances; SWE-bench Lite uses 300 instances and typically scores 3-8 points higher than Verified due to easier instance selection.

Evaluation procedure: the agent receives the repository snapshot and the issue description. It must produce a git patch that, when applied, causes the previously failing tests to pass without breaking any existing tests. No internet access. No execution of arbitrary code outside the test framework. The score is the percentage of instances where the agent's patch passes all tests.

The scaffold matters as much as the model. The same base model with different scaffolds (different retrieval strategy for locating relevant files, different retry logic for failing tests, different context management for large codebases) produces 10-15 point variance. When comparing leaderboard entries, always check whether the scaffold is disclosed and whether it's reproducible on your infrastructure.

### SWE-bench Scores: October 2024 Leaderboard

As of October 2024 (the most recent publicly verified snapshot with disclosed scaffold details):

| **Model + Scaffold** | **SWE-bench Verified** | **SWE-bench Lite** |
|---|---|---|
| Claude Sonnet 3.5 (Anthropic SWE-agent) | **49.0%** | ~52% |
| GPT-4o (SWE-agent) | **33.2%** | ~36% |
| Frontier model cluster (top 3) | <5 point gap | <5 point gap |
| Human developer baseline | ~87% | ~87% |

The ~25-point improvement in frontier model SWE-bench scores between April 2023 and October 2024 represents genuine progress, but the human baseline of ~87% illustrates the gap that remains. The human baseline measures professional developer performance on the same instances: it is not 100% because some instances are genuinely ambiguous or require architectural context not present in the repository snapshot.

Ceiling effects are visible: improvement from 40% to 49% (9 points) took more development effort than the improvement from 10% to 33% (23 points). This is the saturation pattern.

### When to Use SWE-bench for Agent Selection

SWE-bench Verified is the right benchmark for your evaluation if:
- Your production workload is primarily Python codebase modification
- Tasks involve fixing bugs identified in GitHub-style issue descriptions
- Your codebase has meaningful test coverage (SWE-bench measures test-validated fixes)
- You are comparing models that will use similar scaffolding in production

SWE-bench is a poor predictor of production performance if:
- Your primary language is not Python (TypeScript, Go, Rust, Java are not represented)
- Tasks involve architectural decisions or new feature generation (benchmark is bug-fix oriented)
- Your codebase has minimal test coverage (no tests means no way to validate agent patches)
- Your production scaffold differs substantially from the benchmark scaffold

For non-Python engineering tasks or architectural review, GAIA Level 2/3 may provide better signal on reasoning capability. For [agentic workflows](/learn/agentic-workflows) that combine engineering with external tool use, AgentBench's OS and database environments are closer analogs.

## GAIA: General AI Assistant Benchmark

### GAIA Methodology: Three Difficulty Levels

GAIA (Google DeepMind / Meta, 2023; arXiv:2311.12983) is a benchmark of 466 hand-crafted questions designed to resist memorization. Questions require multi-step reasoning, live tool execution (web search, file parsing, code execution), and multi-modal comprehension. The three levels measure distinct capabilities:

**Level 1**: Single-step or two-step reasoning with one tool. Frontier models score approximately 72% on Level 1; human annotators score approximately 95%. The 23-point gap at Level 1 primarily reflects model errors in basic factual retrieval and single tool execution.

**Level 2**: Multi-step reasoning requiring 2-4 tools and information synthesis across steps. Frontier models score approximately 45% on Level 2; humans approximately 88%. The 43-point gap reflects compounding errors in multi-step chains: each step's error rate multiplies.

**Level 3**: Complex multi-step reasoning with 5+ steps, multi-modal inputs, and ambiguous intermediate steps. Frontier models score approximately 40%; humans approximately 92%. The 52-point gap at Level 3 is the benchmark's headline finding: tasks that are straightforward for a careful human remain out of reach for current frontier agents.

GAIA's design specifically resists contamination: questions are hand-crafted, the test set is not public (only validation set questions are published), and many questions reference documents that did not exist before the benchmark was created.

### GAIA vs. SWE-bench: What Each Measures

SWE-bench and GAIA are orthogonal, not alternatives. A model that excels at SWE-bench (tight code editing loop, precise patch generation) may score poorly on GAIA Level 3 (broad reasoning, multi-modal synthesis, long context management across tool outputs). Conversely, a GAIA Level 2 leader may not produce clean git patches.

Select the benchmark that matches the agent's actual task type:
- Python bug-fix tasks -> SWE-bench Verified
- Research, analysis, multi-source synthesis -> GAIA Level 2 or 3
- Both -> run both; expect different model rankings

The [AI agent evaluation guide](/learn/ai-agent-evaluation) covers how to combine benchmark signal with task-specific private eval design.

## AgentBench: Multi-Environment Agent Evaluation

### AgentBench v0.2: Eight Environments

AgentBench (ICLR 2024; arXiv:2308.03688) evaluates agents across eight distinct environments in a single benchmark suite:

| **Environment** | **Task type** | **Typical frontier score** |
|---|---|---|
| OS (Bash shell) | File system manipulation, scripting | ~70% |
| Database (SQL) | Query generation, schema navigation | ~65% |
| Knowledge Graph | SPARQL, multi-hop queries | ~55% |
| ALFWorld | Household navigation (text) | ~60% |
| WebShop | E-commerce product search + purchase | ~25% |
| Mind2Web | Web task following natural language | ~30% |
| Card Game | Strategy under incomplete information | ~40% |
| Lateral Thinking | Reasoning outside standard patterns | ~35% |

Most frontier models score below 50% on the harder environments (WebShop, Mind2Web, Lateral Thinking). The same model scoring 70% on OS tasks scores 25% on WebShop: a 45-point within-model variance that aggregate scores obscure.

### Reading AgentBench Results: Environment-Level Analysis

Aggregate AgentBench scores are useful only for coarse elimination: a model with an aggregate below 40% is unlikely to handle any environment well. For deployment decisions, always request or reproduce the per-environment breakdown.

Environment-level analysis gives you three actionable signals:

**Task type match**: if your production agent primarily operates a Bash shell (DevOps automation, file processing), the OS environment score is more predictive than the aggregate. If your agent performs web shopping-style tasks (e-commerce automation, price comparison), the WebShop score is the relevant signal, and it will be dramatically lower than the OS score for the same model.

**Capability ceiling identification**: if the top model scores 30% on Mind2Web and your agent requires web navigation, you have a production ceiling to plan around. HITL (human-in-the-loop) at web navigation checkpoints may be necessary until scores improve. The [human-in-the-loop guide](/learn/human-in-the-loop-ai-agents) covers checkpoint design for low-confidence agent steps.

**Cross-model differentiation at environment level**: two models with identical aggregate AgentBench scores may have opposite strengths: one strong on OS/DB (structured environments) and one strong on WebShop/Mind2Web (unstructured web). Aggregate scores mask this differentiation; per-environment scores reveal it.

## tau-bench and WebArena: Tool-Use and Web Automation

### tau-bench: Policy-Compliant Tool Use

tau-bench (Sierra AI, 2024) evaluates agent performance on customer service tasks in retail and airline domains. The benchmark is distinctive because it measures not just whether the agent completes the task but whether it complies with business policy while completing it: a dimension absent from SWE-bench, GAIA, and AgentBench.

Each tau-bench task involves: identifying the relevant policy from a policy document, calling the correct tools in the correct sequence, maintaining multi-turn dialogue with a simulated user, and producing an outcome that satisfies both the user's request and the applicable business rule. Tasks fail if the agent violates policy (refunds a non-refundable fare, grants a discount the policy doesn't allow) even if the user is satisfied.

As of 2025, GPT-4o achieves approximately 60% on retail tasks and 42% on airline tasks in tau-bench. The policy compliance dimension makes tau-bench the most production-relevant benchmark for enterprise customer-facing agents where regulatory or contractual requirements govern permissible actions. If your agent interacts with customers under defined business rules, tau-bench pass rate is a more meaningful predictor of production behavior than SWE-bench or GAIA.

### WebArena: Real Web Automation at Scale

WebArena (2023) evaluates agent performance on 812 tasks across five sandboxed websites replicating real web applications: an e-commerce site, a social forum, a code repository, a content management system, and a map service. Tasks require multi-step navigation in rendered pages (clicking, form filling, search, navigation across page transitions) rather than structured API calls.

State-of-the-art WebArena performance was below 40% as of mid-2025. The benchmark's difficulty reflects a fundamental challenge in web automation: the agent must parse rendered HTML, identify interactive elements, handle dynamic page states, and recover from navigation errors, all without the structured interfaces that OS/DB environments provide.

The below-40% ceiling on WebArena justifies a production design principle for browser-automation agents: plan for human-in-the-loop escalation at low-confidence steps. An agent that completes 35% of web tasks autonomously and escalates the rest to a human operator delivers more value than one that attempts all tasks and produces incorrect outcomes on 65%.

### Benchmark Selection Guide

| **Agent task type** | **Primary benchmark** | **Secondary signal** |
|---|---|---|
| Python bug-fix, code review | SWE-bench Verified | SWE-bench Lite for speed |
| Research, multi-source analysis | GAIA Level 2/3 | AgentBench Knowledge Graph |
| Multi-tool, multi-environment | AgentBench (per-environment) | GAIA Level 1 sanity check |
| Customer service, policy compliance | tau-bench | Private eval on your policies |
| Web automation, browser tasks | WebArena | tau-bench if user-facing |
| None match your task type | Private eval (>=100 tasks) | Any benchmark for coarse filtering |

## Private Benchmarks: Evaluating on Your Own Task Distribution

### Why Private Evals Are Required for Production Decisions

Public benchmarks measure performance on their task distribution. Your production workload is a different task distribution. The only way to measure performance on your distribution is to evaluate on a sample of your actual tasks: a private eval.

Statistical requirements for a private eval to produce reliable signal: a minimum of 100 tasks gives +-10 percentage points of confidence at the 95% level. 200 tasks gives +-7 points. 400 tasks gives +-5 points. Below 50 tasks, confidence intervals are too wide to distinguish between models with similar capability levels.

Private eval design principles:
1. **Random sample from production logs**: do not hand-pick representative tasks. Random sampling captures your actual task distribution including edge cases.
2. **Hold out the eval set**: never use the eval tasks for prompting, fine-tuning, or scaffold optimization. Contaminating the eval set produces optimistic results that don't generalize.
3. **Score consistency**: define your scoring rubric before running the eval. Post-hoc rubric adjustment to match results is a form of benchmark gaming.
4. **Scaffold parity**: run all candidate models with the same scaffold. Scaffold differences confound model comparison.

### Running Private Benchmarks Without Third-Party Data Exposure

Many production workloads contain sensitive data (customer PII, proprietary code, internal documents) that cannot be sent to third-party evaluation platforms. Private eval must happen in your own infrastructure.

In OpenLegion, the blackboard replay mechanism enables private benchmarking without external data exposure. Agents write their tool calls, intermediate results, and final outputs to the blackboard during live runs. The replay system re-runs a recorded session with a different model or scaffold, substituting the new model's responses at each tool call while keeping the task context identical. This produces controlled model comparisons on real production tasks without re-exposing task data to external evaluation APIs.

For teams on raw Kubernetes infrastructure, the equivalent is a reproducible eval harness: containerized agent with the task set mounted as a read-only volume, model API calls routed through your own proxy (which logs without forwarding data to third parties), and a scoring function that runs post-completion inside the container. The eval data never leaves your network perimeter.

### Tracking Private Eval Results Over Time

A one-time private eval is a point-in-time snapshot. Production agent systems change: model providers update models, scaffolds are revised, task distributions drift. A governance-grade private eval program runs on a defined cadence:

- **Pre-deployment eval**: run before any model or scaffold change reaches production. Minimum 100 tasks, same rubric as the baseline eval.
- **Weekly regression check**: run a 50-task slice on the current production configuration. Detect capability regressions from silent model updates.
- **Quarterly distribution audit**: resample 200 tasks from recent production logs and compare against the baseline eval. Detect task distribution drift that makes the baseline eval unrepresentative.

The [AI agent observability guide](/learn/ai-agent-observability) covers how to instrument agents to collect the task samples and outcome signals needed for ongoing private eval programs without manual annotation.

## OpenLegion's Take

Public AI agent benchmark scores are useful for eliminating clearly unsuitable models and tracking industry-wide progress. They are not production deployment criteria. The benchmark-to-production gap, typically 20-40 percentage points driven by task distribution shift, scaffold dependency, and contamination, makes public leaderboard positions unreliable predictors of how a model performs on your workload.

The benchmark landscape in mid-2026 is saturated at the frontier for standard task categories: top models cluster within 5 points on SWE-bench, and GAIA Level 1 is approaching ceiling. The meaningful differentiation has shifted to harder variants (GAIA Level 3, WebArena's complex navigation tasks, tau-bench's policy compliance dimension) and to private evals on production task distributions.

Private eval is not a research exercise: it is an operational requirement for teams making deployment decisions. A 100-task private eval costs roughly 2-4 hours of engineering time and API spend in the range of $10-100 depending on model. The alternative is deploying a model on public benchmark signal and discovering the production gap when task failure rates surface in your [AI agent observability](/learn/ai-agent-observability) dashboards.

The benchmark suites covered in this guide (SWE-bench, GAIA, AgentBench, tau-bench, WebArena) each measure a specific capability dimension. None measures your capability dimension. Use them as a starting filter, not a finishing criterion. The [AI agent evaluation guide](/learn/ai-agent-evaluation) covers the full evaluation methodology from benchmark selection through production quality gates.

## Get Started

**Run private benchmarks on your own task distribution with full data isolation.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Explore AI Agent Evaluation](/learn/ai-agent-evaluation)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What are AI agent benchmarks and what are they used for?

AI agent benchmarks are standardized task suites with defined evaluation protocols and public leaderboards measuring agent performance on specific task categories: software engineering (SWE-bench), multi-step reasoning (GAIA), multi-environment interaction (AgentBench), tool-use policy compliance (tau-bench), and web automation (WebArena). They serve four valid purposes: coarse model filtering before private evals, regression detection across model versions, cross-architecture comparison under controlled conditions, and tracking field-wide capability progress. They do not reliably predict production pass rates on your specific task distribution.

### What is the benchmark-to-production gap?

The benchmark-to-production gap is the difference between a model's public benchmark score and its actual pass rate on production tasks, typically 20-40 percentage points. Three factors drive it: task distribution shift (the benchmark's task distribution differs from yours), scaffold dependency (10-15 point variance from the same model with different prompt and retry configuration), and contamination risk (frontier models may have been trained on benchmark questions). Plan for this gap when interpreting public leaderboard results.

### What does a SWE-bench Verified score mean?

SWE-bench Verified measures the percentage of 500 human-verified GitHub issue instances where an agent produces a git patch that passes the associated test suite. As of October 2024, Claude Sonnet 3.5 achieved 49.0% and GPT-4o achieved 33.2% using disclosed scaffolds. The score is specific to Python bug-fixing tasks in repositories with test coverage. It is a reliable signal for agent selection on Python codebase work but does not generalize to other languages, architectural decisions, or codebases without test suites.

### What are GAIA's three difficulty levels?

GAIA (arXiv:2311.12983) contains 466 hand-crafted questions at three levels. Level 1 requires single or two-step tool use: frontier models score approximately 72% vs. humans at 95%. Level 2 requires 2-4 tools and multi-step synthesis: frontier models score approximately 45% vs. humans at 88%. Level 3 requires 5+ steps with multi-modal inputs: frontier models score approximately 40% vs. humans at 92%. The 52-point gap at Level 3 is the benchmark's defining result: tasks routine for a careful human remain out of reach for current frontier agents.

### When should I use private benchmarks instead of public ones?

Always use private benchmarks for production deployment decisions. Public benchmarks measure performance on their specific task distribution, which differs from your production workload. Run a private eval with a minimum of 100 tasks (+-10 percentage points at 95% confidence) sampled randomly from your production logs. Public benchmarks are appropriate for coarse model filtering and regression tracking. They are not deployment decision criteria, especially when the top models cluster within 5 points and scaffold variance is 10-15 points.

### What makes tau-bench different from other agent benchmarks?

tau-bench (Sierra AI, 2024) evaluates policy-compliant tool use in retail and airline customer service domains. Unlike SWE-bench (which scores only on technical correctness) or GAIA (which scores on factual accuracy), tau-bench scores on whether the agent satisfies the user's request while adhering to defined business policies: refund eligibility rules, discount authorization limits, booking change procedures. GPT-4o achieves approximately 60% on retail tasks and 42% on airline tasks. This policy compliance dimension makes it the most production-relevant benchmark for customer-facing enterprise agents.

### What is WebArena and why are scores so low?

WebArena evaluates agents on 812 tasks across five sandboxed websites replicating e-commerce, social forums, code repositories, a CMS, and maps. Tasks require multi-step navigation in rendered web pages: parsing HTML, clicking interactive elements, handling dynamic page states across navigation transitions. State-of-the-art performance was below 40% as of mid-2025. The low scores reflect the fundamental difficulty of web automation compared to structured API or shell environments: rendered pages are unpredictable, interactive elements shift between page loads, and recovery from navigation errors requires reliable error detection.

### How many tasks do I need for a statistically reliable private benchmark?

A minimum of 100 tasks gives a confidence interval of +-10 percentage points at 95% confidence, enough to distinguish models separated by more than 20 points. For finer discrimination between closely-matched models, 200 tasks gives +-7 points and 400 tasks gives +-5 points. Tasks should be randomly sampled from production logs rather than hand-picked, the eval set should be held out and never used for scaffold optimization, and the scoring rubric should be defined before running the eval. Below 50 tasks, confidence intervals are too wide to support model selection decisions.
