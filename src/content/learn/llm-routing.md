---
title: "LLM Routing: Model Selection, Cost Optimization, and Router Architecture"
description: "How LLM routing works: model selection by complexity and cost. RouteLLM 40% savings, OpenRouter, AWS Bedrock intelligent routing, LiteLLM OSS, Martian, and adversarial ML router security risks."
slug: /learn/llm-routing
primary_keyword: llm routing
last_updated: "2026-07-07"
schema_types: ["FAQPage"]
related:
  - /learn/llm-gateway
  - /learn/llm-cost-optimization
  - /learn/ai-agent-cost
  - /learn/llm-prompt-caching
  - /learn/ai-agent-observability
  - /learn/multi-agent-systems
---

# LLM Routing: Model Selection Policies, Cost-Quality Tradeoffs, and Router Architecture

LLM routing is the practice of directing each language model query to the most appropriate endpoint — selecting among models of different capability and price based on query complexity, quality requirements, and cost. Model prices span 100×: GPT-4o-mini at $0.15/M vs GPT-4o at $2.50/M; routing 70% to the cheap model cuts total cost 65%. RouteLLM (LMSYS, June 2024) proved a trained classifier achieves 40% fewer strong-model calls with less than 5% quality degradation.

<!-- SCHEMA: DefinitionBlock -->

> **LLM routing** is the practice of directing each language model query to the most appropriate model endpoint — selecting among models of different capability levels, providers, and price points based on the query's complexity, the task's quality requirements, and cost constraints — rather than always using a single default model, with the goal of minimizing cost while maintaining output quality above an acceptable threshold.

## Why LLM Routing Matters: The Model Price-Quality Frontier

### The 100× Price Spread Across Model Tiers

LLM pricing in 2026 spans more than 100× from cheapest to most capable. GPT-4o-mini at $0.15/M input tokens vs Claude 3.7 Sonnet at $3.00/M input tokens = 20× difference. Llama 3.1 8B on a self-hosted instance at an effective $0.01/M input equivalent vs GPT-4o at $2.50/M input = 250× difference.

For a production system processing 1,000 queries per day at an average 2,000 input tokens per query:

| **Routing policy** | **Daily cost** | **vs all-strong** |
|---|---|---|
| **All GPT-4o** | $52/day | baseline |
| **All GPT-4o-mini** | $3/day | −94% |
| **Routed (70% mini, 30% GPT-4o)** | $17.70/day | −66% |

The routing savings ($52 − $17.70 = $34.30/day = 65% reduction) are substantial without requiring all queries to use the cheap model. The economic case: if a routing classifier can correctly identify the 70% of queries adequately served by the cheap model, it captures most of the cheap-model savings while avoiding quality degradation on the complex 30%.

For the full agent runtime cost model — per-agent budget caps, loop cost analysis, and runaway detection — see [AI agent cost and per-agent budget enforcement](/learn/ai-agent-cost).

### The Quality-Cost Tradeoff: What RouteLLM Proved

**RouteLLM** (LMSYS, June 2024, arxiv:2406.18665) trained a lightweight routing classifier to decide per-query whether GPT-4 or a cheaper model should handle each request. The classifier was trained on preference data from Chatbot Arena — human ratings of which model (GPT-4 or GPT-3.5 Turbo) produced the preferred response to each query.

**Benchmark:** MT-Bench, a conversational evaluation benchmark covering reasoning, math, coding, and writing tasks.

**Result:** the matrix factorization router variant — the best-performing RouteLLM configuration — achieved a **40% reduction in GPT-4 calls with less than 5% quality degradation** in MT-Bench scores vs always using GPT-4.

**What the paper established:** a trained routing classifier can approximate the "which model is better for this query?" decision at scale, with meaningful cost savings and acceptable quality tradeoff on the MT-Bench metric.

**What the paper did not cover:** MT-Bench is a conversational benchmark. The RouteLLM results apply to open-ended queries — the quality metric is "which response do humans prefer?" Production agent tasks are fundamentally different: a tool call that returns malformed JSON is not a "lower quality answer" — it is a broken output that causes the downstream agent to fail or retry. Routing classifiers trained on conversational preference data may perform significantly worse on agent tasks where quality means correct tool call parameters, schema-valid output, and accurate multi-step reasoning chains. Teams applying RouteLLM to production agent systems should validate routing accuracy on their specific task types, not rely solely on MT-Bench numbers.

For the full range of LLM cost reduction techniques beyond model routing — prompt compression, quantized models, batch inference — see [LLM cost optimization and model selection at the infrastructure layer](/learn/llm-cost-optimization).

## Routing Architectures: Four Approaches

### Classifier-Based Routing: Query Complexity Scoring

Classifier-based routing uses a lightweight ML model to score each query's complexity before dispatching it to a strong or weak model. Architecture: the query (and optionally the system prompt and conversation history) passes to a complexity classifier; the classifier outputs a score between 0 and 1; queries above the threshold go to the strong model, below to the weak model.

**Implementations using this pattern:** RouteLLM's matrix factorization router, Martian's per-customer complexity model, and AWS Bedrock intelligent prompt routing.

**Tradeoffs:**
- **Latency:** the classification call happens before the LLM call — typically 10–50ms for a small BERT classifier, or 100–500ms for an LLM-based classifier. This adds to every query's total latency, including those routed to the fast cheap model.
- **Classifier accuracy limits:** RouteLLM achieves 40% cost reduction with <5% degradation on MT-Bench; on agent tasks with structured output requirements, degradation may be substantially higher.
- **Adversarial target:** a query crafted to appear simple to the classifier but requiring strong reasoning is misrouted to the cheap model. See the security section below.
- **Best fit:** high-volume mixed-complexity chatbot workloads (100,000+ queries/day) where quality is measurable with a continuous metric and routing failures are non-cascading.

### Cascade Routing: Try Cheap, Escalate on Low Confidence

Cascade routing first sends the query to the cheap model. If the cheap model returns a low-confidence or low-quality response — detected by a quality classifier, output schema validation, or a confidence score from the model — it escalates to the strong model.

**Tradeoffs:**
- **Always incurs the cheap model cost:** there is no fast path that skips the cheap model. Every query pays at least the cheap model's token cost.
- **Failure path is expensive:** in the escalation case, total cost = cheap model cost + quality checker cost + strong model cost — more expensive than routing directly to the strong model in the first place.
- **Latency:** cascaded queries incur two sequential LLM calls plus the quality check — significantly higher total latency than direct routing.
- **Best fit:** query distributions where the cheap model succeeds 85%+ of the time, making the expensive failure path rare; and where the quality check can be automated (schema validation, structured output compliance, confidence scores).

### Structural Routing: Per-Agent Model Assignment

Structural routing assigns a model to each agent type at design time rather than making per-query routing decisions at runtime. Every query from a routing/classification agent uses the cheap model; every query from a reasoning or audit agent uses the strong model. The routing decision is made once during system design, not computed per query.

**Rationale:** different agent roles have predictably different complexity requirements. A routing agent that decides which specialist to call next runs intent classification — inherently simple, correctly served by GPT-4o-mini. An analysis agent that synthesizes findings from multiple sources runs complex multi-step reasoning — requires Claude 3.7 Sonnet or GPT-4o. These role-based complexity profiles are stable across queries; per-query classification adds overhead without improving the routing decision.

**Tradeoffs:**
- **No per-query adaptability:** a complex query routed to a role whose configured model is too weak produces a failure, not an escalation. The system does not automatically promote the query to a stronger model.
- **Requires upfront role design discipline:** the model assignment must accurately reflect each role's actual task complexity. Poorly designed roles (a "simple" role that sometimes handles complex queries) break under structural routing.
- **Advantages:** zero routing overhead (no classifier call, no latency added), zero adversarial attack surface on the routing decision (no ML classifier to manipulate), deterministic behavior (same input always routes to same model), full audit trail (model assignment committed to git alongside role definition).

For the full architecture of assigning different model configurations to different agent roles in a multi-agent system, see [multi-agent systems and per-role model configuration](/learn/multi-agent-systems).

### Fallback and Load-Balancing Routing: Availability and Resilience

Fallback routing directs queries to a backup model or provider when the primary fails:
- Rate limit (429) → try backup provider offering the same model
- API error → try a comparable model at a different provider
- Latency SLA breach → fall back to a faster model at acceptable quality

Load-balancing routing distributes queries across multiple equivalent endpoints (same model, different provider or region) to reduce per-provider load and improve throughput.

**Distinction from cost-quality routing:** fallback and load balancing are about availability and resilience, not model selection intelligence. They ensure requests reach a working endpoint under failure or rate limit conditions; they do not select the cheapest model for each query's complexity. LiteLLM OSS implements both strategies and is the standard open-source tool for production resilience routing.

## Router Implementations: RouteLLM, OpenRouter, AWS, Martian, LiteLLM

### RouteLLM: Open-Source Research Router

**RouteLLM** (LMSYS, arxiv:2406.18665, June 2024): open-source Python library implementing four router variants:
- **Matrix factorization** (best MT-Bench performance): learns latent features from human preference data on when users prefer GPT-4 over GPT-3.5
- **BERT-based classifier:** lightweight text classifier trained on the same preference data
- **Similarity-based:** cosine similarity of query embedding to strong-model-preferred examples
- **Random:** baseline comparison

**Usage:** drop-in replacement for the OpenAI Python client with routing added. Queries with the `strong/` prefix go to the strong model; the router classifies each query and dispatches accordingly without changing existing code structure.

**Production limitations:** RouteLLM routers are trained on Chatbot Arena conversational preference data. They are calibrated to predict human preference between open-ended responses, not to predict whether a structured agent task (tool call, JSON schema compliance, multi-step reasoning chain) will succeed on a cheap model. Production agent deployments using RouteLLM should retrain or fine-tune the classifier on domain-specific task quality data.

### OpenRouter: 200+ Endpoints, Unified API

**OpenRouter** (openrouter.ai) aggregates 200+ LLM endpoints (2025) under a single OpenAI-compatible API with one API key across all providers. Coverage includes: OpenAI, Anthropic, Google, Meta Llama, Mistral, Cohere, and dozens of open-source model providers.

**Routing policies:**
- **Model-by-name:** specify the exact model; OpenRouter routes to the cheapest provider currently offering it
- **Cheapest-available:** specify capability requirements; OpenRouter selects the lowest-cost endpoint that meets them
- **Fallback chains:** ordered model list — OpenRouter falls back to the next model on rate limit or API error
- **Load balancing:** distribute across equivalent model endpoints

**Pricing:** provider cost plus an OpenRouter margin of approximately 5–10% per call (varies by model and provider). For teams with high-volume API relationships directly with providers, OpenRouter's margin makes it more expensive per call than direct access. For teams that value unified access and billing visibility across many models, the margin is the cost of that consolidation.

**Architecture implication:** OpenRouter is a single point of failure for all LLM API calls. If OpenRouter's API is unavailable, all routing through it fails. Production deployments using OpenRouter as the sole routing layer should maintain direct provider access as a fallback.

### AWS Bedrock Intelligent Prompt Routing: Managed Complexity Classifier

**AWS Bedrock intelligent prompt routing** (GA 2025) uses an AWS-managed complexity classifier to score each query and route between two models within the same model family. AWS reports an average **30% cost reduction** for mixed-complexity workloads using intelligent prompt routing vs always using the heavier model.

**Supported model families (as of 2025):** Anthropic Claude (Claude 3 Haiku, Claude 3.5 Haiku, Claude 3.5 Sonnet), Amazon Nova (Nova Lite, Nova Pro), and Meta Llama (Llama 3.1 70B/8B, Llama 3.2, Llama 3.3 70B). Each router pairs two models within the same family; the routing threshold is configurable via the Bedrock console or API.

**Limitations:**
- Routes only within a single model family on AWS Bedrock — no cross-provider routing, no cross-family routing (e.g., cannot route between a Claude model and a Llama model in a single router).
- No ability to inject custom routing logic or retrain the complexity classifier on domain-specific data.
- Threshold configuration is coarse — no per-query-type tuning.

Best fit: AWS-native deployments already using Bedrock, where query complexity is genuinely mixed and the capability gap between the two models in the chosen family is acceptable for the simpler tier.

### Martian and LiteLLM: Enterprise Router and OSS Router

**Martian** (withmartian.com): raised a **$9M Series A in 2024** originally focused on model routing. As of 2026, the company has pivoted to AI interpretability research ("Understanding Intelligence"). Teams relying on Martian's routing product should verify current availability directly with the company.

**LiteLLM OSS router** (github.com/BerriAI/litellm, Apache 2.0): open-source Python library and proxy server supporting **100+ LLM providers**. Routing features:
- **Fallback:** priority list of models — try model A, fall back to model B on error or rate limit
- **Retry:** exponential backoff on rate limit errors, configurable `max_retries`
- **Load balancing:** round-robin or latency-weighted across equivalent model endpoints
- **Cost-based routing:** selects the cheapest provider currently offering the specified model
- **RPM/TPM limits:** per-model limits with automatic overflow routing to the fallback

LiteLLM can be deployed as a Python library (embedded in agent code) or as a self-hosted proxy server with an OpenAI-compatible API. Existing agent frameworks connect to the proxy without code changes.

For monitoring routing decisions in production — tracking which model each query was routed to, measuring quality by route, and detecting threshold drift — see [AI agent observability and routing decision monitoring](/learn/ai-agent-observability).

## Routing Policy Design: Choosing the Right Router for Your Use Case

### When Dynamic Per-Query Routing Is Worth the Overhead

Dynamic per-query routing (classifier-based or cascade) justifies its implementation overhead when:

1. **High query volume with genuinely mixed complexity:** a customer-facing chatbot handling 100,000+ queries/day where 60–70% are simple FAQ-style questions and 30–40% require complex reasoning. At this volume, routing savings of $30–50/day justify classifier development and maintenance.

2. **Query complexity is unpredictable from role alone:** a general-purpose agent whose task complexity varies significantly per user input and cannot be predicted from the agent's role definition.

3. **The quality metric is continuous and measurable:** a routing classifier can be evaluated and threshold-tuned because quality can be measured (user preference ratings, structured output validity rate, BLEU score for generation tasks).

4. **Routing failures are non-cascading:** a wrong routing decision (weak model handles a complex query) produces a lower-quality answer that the user accepts or retries — not a broken tool call that propagates failure through downstream agents.

**Not worth the overhead when:** query volume is below 10,000/day (routing savings under $30/month at typical prices), agent roles have predictable complexity, structured output requirements make routing failures cascade into pipeline errors, or security requirements make an ML classifier adversarial attack surface unacceptable.

### Routing Thresholds: Setting the Quality-Cost Tradeoff

The routing threshold determines what fraction of queries goes to the strong vs weak model. Higher threshold (more queries to strong model) = higher quality, higher cost. Lower threshold = lower cost, higher risk of quality degradation.

**Threshold calibration process:**
1. Sample 500–1,000 production queries representative of your workload
2. Run each query on both the weak and strong model
3. For each query, measure the quality gap (structured output validity, user preference rating, task completion rate)
4. Identify the complexity percentile below which the weak model quality gap is acceptable (e.g., the weak model produces acceptable output on 72% of queries)
5. Set the threshold to route that percentile to the weak model
6. Monitor the weak-model quality distribution monthly — distribution shift (new query types, changing user behavior) causes threshold drift

**RouteLLM achieved 40% GPT-4 reduction at a threshold maintaining <5% MT-Bench degradation.** For agent systems where structured output validity matters: measure tool call accuracy (the percentage of weak-model responses that pass schema validation and produce correct tool parameters) rather than MT-Bench. Set the threshold so that tool call accuracy for routed queries is within 2% of strong-model accuracy.

Model routing and prompt caching are complementary cost controls — see [LLM prompt caching and 90% token cost reduction](/learn/llm-prompt-caching) for the caching layer that applies after the routing decision is made.

## Routing Security: The Router as an Attack Surface

### Adversarial Complexity Manipulation

An ML-based router that scores query complexity is an adversarial target. Three attack vectors:

**1. Complexity deflation.** A user crafts a query that appears simple to the complexity classifier but requires strong-model reasoning. The router sends it to the cheap model, which produces an incorrect or low-quality response. The attacker exploits this to elicit incorrect answers from an agent system that appear authoritative. In customer-facing deployments, this is a reliability attack; in security-sensitive deployments, it is a capability extraction technique.

**2. Complexity inflation.** A user crafts a trivial query that appears complex to the classifier, routing it to the expensive model. At scale — thousands of artificially complex queries — this is a cost-of-service attack that inflates the operator's API spend. OpenAI Tier 1 rate limits (500 RPM, 30,000 TPM) also make this a throughput attack: filling expensive-model quota with trivial queries blocks legitimate complex queries from reaching the strong model.

**3. Routing probe.** A user systematically varies query phrasing to map the routing decision boundary — learning which patterns trigger strong-model vs weak-model routing. This intelligence is then used to craft queries that reliably route to the strong model (for capability extraction) or to the weak model (for quality degradation attacks).

**Mitigations:**
- **Structural routing:** per-agent model assignment eliminates the ML classifier attack surface entirely — routing decisions are not influenced by query content
- **Log all routing decisions:** log each routing decision with the full query, the classifier score, and the model selected; audit for anomalous patterns (high variance in classifier scores from a single user, systematic threshold probing)
- **Per-user rate limits on the strong model:** cap how many strong-model queries a single authenticated user can generate per hour to limit cost-inflation attack impact
- **Routing classifier input sanitization:** if using a content-based classifier, apply the same prompt injection filters used on LLM inputs before passing the query to the classifier

### Routing Data Exfiltration and Vault-Proxied Routing

Routing systems that log query content to make routing decisions — some classifier-based routers log query-decision pairs for threshold calibration — have access to potentially sensitive query content.

**Data exfiltration risk:** a compromised or malicious routing layer exfiltrates query content including PII, proprietary data, or confidential instructions in system prompts. The routing layer sits between the agent and the LLM provider — it sees every query before the model does.

**Mitigation options:**
- Make routing decisions on structural features (query length, token count, sentence count, structural complexity signals) rather than raw query text
- If raw text is required for classifier accuracy, apply PII filtering before logging
- Treat the routing service as a data processor in your compliance model (SOC 2, GDPR data processing agreement with the routing vendor)
- For the highest security posture: use structural per-agent model assignment — routing decisions are made on agent role identity, not query content; no routing layer inspects the query

## OpenLegion's Take: Structural Routing Beats Dynamic Routing for Production Agent Fleets

The RouteLLM paper, and the AWS Bedrock documentation all position dynamic per-query routing as the goal. Route each query to the cheapest model that can handle it, trained classifier decides in real time. The savings numbers are compelling: 40% cost reduction, 30% cost reduction, always-available.

Three concrete problems that reframe this for production agent systems:

**Routing failures in multi-agent pipelines cost more than they save.** A chatbot routing failure produces a lower-quality response the user can re-ask. An agent routing failure produces a broken tool call with malformed parameters — the downstream agent parses invalid input, throws an exception or produces an incorrect result, and the error propagates. The retry costs the expensive model call anyway. RouteLLM proved 40% GPT-4 reduction on MT-Bench conversations; it made no claims about structured agent task completion rates. The correct framing: "which model is cheapest that will not cause a downstream cascade failure for this agent role?" — not "which model is cheapest for this query?"

**OpenAI Tier 1 limits gpt-4o to 500 RPM and 30,000 TPM.** A dynamic router that unevenly distributes queries between cheap and expensive model tiers can cause a different failure mode: cheap-model throughput is fine, but the expensive-model allocation is consumed faster than expected by routing decisions. This requires monitoring not just cost but quota consumption per model tier.

**OpenLegion enforces per-agent model configuration in INSTRUCTIONS.md, committed to git.** Every model assignment is a git commit — full audit trail of which agent role uses which model and when that changed. The routing decision is made once by a developer who understands the role's complexity requirements; the mesh router enforces it at every call without a classifier. Zero classifier overhead, zero adversarial attack surface, deterministic behavior, full auditability.

| **Routing property** | **OpenLegion** | **RouteLLM (OSS)** | **OpenRouter** | **AWS Bedrock routing** | **LiteLLM** |
|---|---|---|---|---|---|
| **Per-agent model config (structural routing)** | INSTRUCTIONS.md, committed to git | Not available | Not available | Not available | Not available |
| **Routing decision audit trail** | Every model call tagged with agent_id and model | Logging configurable | Per-call response metadata | CloudWatch logs | Dashboard |
| **Adversarial attack surface on routing** | None (structural, not content-based) | ML classifier (BERT/MF) — attackable | Model-by-name (low surface) | AWS-managed classifier — attackable | Config-based (low surface) |
| **Vault-proxied model calls** | Zone 2 proxy, credentials never in agent context | No | No | IAM role | No |
| **Per-agent budget cap** | daily_budget, monthly_budget in INSTRUCTIONS.md | No | Per-key budget limit | Bedrock cost allocation | Per-team budget |
| **Cross-provider routing** | Per-agent model config can target any provider | OpenAI-compatible | 200+ endpoints | Within Bedrock only | 100+ providers |

For the proxy/authentication layer that complements routing — API key consolidation, rate limiting, and request logging — see [LLM gateway authentication, rate limiting, and spend enforcement](/learn/llm-gateway).

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is LLM routing?

LLM routing is the practice of directing each language model query to the most appropriate model endpoint — selecting among models of different capability levels, providers, and price points based on the query's complexity, quality requirements, and cost constraints — rather than always sending every query to the same default model. The economic case: model prices span 100× (GPT-4o-mini at $0.15/M input tokens vs GPT-4o at $2.50/M); routing 70% of queries to the cheap model and 30% to the strong model reduces total cost 65% vs using the strong model for all queries. RouteLLM (LMSYS, June 2024) demonstrated that a trained routing classifier can achieve a 40% reduction in strong-model calls with less than 5% quality degradation on the MT-Bench benchmark vs always using GPT-4.

### What is the RouteLLM paper and what did it prove?

RouteLLM (LMSYS, June 2024, arxiv:2406.18665) trained a lightweight routing classifier to decide per-query whether GPT-4 or a cheaper model should handle each request, evaluating on MT-Bench — a conversational benchmark covering reasoning, math, coding, and writing. The best-performing variant, a matrix factorization router trained on Chatbot Arena human preference data, achieved a 40% reduction in GPT-4 calls with less than 5% degradation in MT-Bench quality scores vs always using GPT-4. An important limitation: MT-Bench is a conversational benchmark covering open-ended responses, not structured agent tasks like tool call generation, JSON schema compliance, or multi-step reasoning chains where routing errors cascade into pipeline failures. Teams applying RouteLLM to production agent systems should validate routing accuracy on their specific task types — tool call accuracy, structured output validity rate — rather than relying solely on MT-Bench numbers.

### What is OpenRouter and how does it work?

OpenRouter is a model aggregator providing access to 200+ LLM endpoints (2025) through a single OpenAI-compatible API and a unified API key, eliminating separate API keys and billing relationships for OpenAI, Anthropic, Google, Meta Llama, Mistral, and dozens of other providers. Routing policies include model-by-name (OpenRouter selects the cheapest provider offering that model), cheapest-available (selects based on capability requirements), and fallback chains (ordered model list that falls back on error or rate limit). Pricing is the provider's cost plus an OpenRouter margin of approximately 5–10% per call; this margin is the cost of unified access and consolidated billing visibility. OpenRouter is a single point of failure for all routed LLM calls — production deployments should maintain direct provider access as a fallback.

### What is AWS Bedrock intelligent prompt routing?

AWS Bedrock intelligent prompt routing (generally available 2025) uses an AWS-managed complexity classifier to score each query and route it between two models within the same model family on AWS Bedrock. AWS reports an average 30% cost reduction for mixed-complexity workloads vs always using the heavier model. Supported families include Anthropic Claude, Amazon Nova, and Meta Llama models. The feature routes only within a single model family — no cross-provider routing, no cross-family routing, no custom routing logic, and no ability to retrain the complexity classifier on domain-specific data. It is best suited for AWS-native deployments already using Bedrock with a genuinely mixed-complexity query distribution.

### What is the difference between LLM routing and an LLM gateway?

An LLM gateway is a proxy layer that handles authentication, rate limiting, request logging, spend enforcement, and OpenAI-compatible API translation — it is a network-layer control that all LLM calls pass through regardless of which model they target. LLM routing is an application-layer decision about which model to send each query to, based on query complexity, task requirements, and cost constraints — it determines the destination model, not the network path. A gateway can implement routing (an LLM gateway that inspects each request and selects the model before forwarding it is both a gateway and a router), but routing does not require a gateway (per-agent structural routing in INSTRUCTIONS.md is routing without a gateway layer). The two are complementary: gateways provide authentication, audit logging, and rate limiting; routing provides cost optimization through intelligent model selection.

### What is the security risk of ML-based LLM routing?

ML-based routers that score query complexity are adversarial targets through three attack vectors: complexity deflation (a user crafts a query that appears simple to the classifier but requires strong-model reasoning — the router misroutes it to the cheap model, producing an incorrect response that appears authoritative); complexity inflation (a user crafts a trivial query to appear complex, routing it to the expensive model — at scale this is a cost-of-service attack inflating operator API spend); and routing probe (systematically varying query phrasing to map the routing decision boundary, learning which patterns trigger strong-model vs weak-model routing for capability extraction or quality degradation). Mitigation options include structural routing (per-agent model assignment not influenced by query content, eliminating the classifier attack surface), logging all routing decisions with the full query for audit, and setting per-user rate limits on the strong model to cap cost-inflation attack impact.

### How does LiteLLM router work?

LiteLLM is an open-source Python library (Apache 2.0) with a built-in router supporting 100+ LLM providers and implementing four routing strategies: fallback (try model A, fall back to model B on error or rate limit — configurable as a priority list), retry (exponential backoff on rate limit errors with configurable max_retries), load balancing (round-robin or latency-weighted distribution across equivalent model endpoints), and cost-based routing (selects the cheapest provider currently offering the specified model). The router can be used as a Python library embedded in agent code, or deployed as a self-hosted proxy server with an OpenAI-compatible API that existing agent frameworks connect to without code changes. LiteLLM router is primarily focused on availability and resilience routing — ensuring requests reach a working endpoint — rather than quality-cost optimization routing based on query complexity classification.

### When should I use structural routing vs dynamic per-query routing?

Structural routing (assigning a fixed model to each agent role at design time) is preferable when agent roles have predictable complexity profiles, when structured output requirements make routing errors cascade into pipeline failures, when query volume is below 10,000/day (where routing savings are below $30/month at typical prices), or when the adversarial attack surface of an ML classifier is unacceptable in the security model. Dynamic per-query routing (classifier-based or cascade) is better when query complexity varies unpredictably within a single agent role, when query volume is high enough to justify classifier development (100,000+ queries/day), when the quality metric is continuous and measurable for threshold calibration, and when routing failures are non-cascading (a wrong routing decision produces a lower-quality answer, not a broken downstream pipeline). In multi-agent systems, structural routing captures most of the cost savings through role-based model assignment — cheap models for classification and routing agents, strong models for reasoning and audit agents — without classifier overhead, routing failure modes, or adversarial attack surface.

## Start Building with LLM Routing

LLM routing is a cost optimization technique: it works when the cheaper model produces acceptable quality on enough queries to justify the routing infrastructure. The RouteLLM benchmark (40% GPT-4 reduction, <5% MT-Bench degradation) establishes that a trained classifier can make good routing decisions on conversational queries. For multi-agent pipelines with structured outputs and tool calls, validate routing accuracy on your specific task types before trusting generic benchmark numbers.

The structural routing pattern — per-agent model assignment in committed configuration, zero classifier overhead, zero adversarial attack surface — captures role-based complexity savings without dynamic routing's operational overhead. A reasoning agent assigned Claude 3.7 Sonnet and a routing agent assigned GPT-4o-mini is LLM routing without a classifier.

[Start building on OpenLegion](https://app.openlegion.ai) — per-agent model configuration in INSTRUCTIONS.md, vault-proxied model calls, per-agent budget enforcement.

For the proxy/authentication layer that complements routing — API key consolidation, rate limiting, and request logging — see [LLM gateway authentication, rate limiting, and spend enforcement](/learn/llm-gateway).
