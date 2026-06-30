---
title: "LLM Prompt Caching — Cut Costs 50–90% on Anthropic, OpenAI, Gemini"
description: "LLM prompt caching: Anthropic 90% reduction (5-min TTL), OpenAI 50% auto-applied, Gemini 75% (1-hour min). Covers prefix ordering, cache hit monitoring, per-tenant isolation, and fleet ROI."
slug: /learn/llm-prompt-caching
primary_keyword: llm prompt caching
last_updated: "2026-06-30"
schema_types: ["FAQPage"]
related:
  - /learn/llm-cost-optimization
  - /learn/llm-gateway
  - /learn/ai-agent-security
  - /learn/ai-agent-observability
  - /learn/ai-agent-reliability
  - /learn/credential-management-ai-agents
---

# LLM Prompt Caching: Cut Token Costs 50–90% Across Anthropic, OpenAI, and Gemini

LLM prompt caching is a provider-side optimization that stores the KV attention state of a repeated token prefix — system prompts, tool schemas, static documents — so subsequent requests skip recomputation and pay 50–90% less on cached tokens. For agent fleets that send the same system prompt and tool schemas on every LLM call, caching that prefix is the single highest-ROI cost optimization available. All three major providers now support it: Anthropic reached GA in August 2024, OpenAI in October 2024, and Google Gemini in June 2024.

<!-- SCHEMA: DefinitionBlock -->

> **LLM prompt caching** is a provider-side optimization that stores the computed key-value (KV) attention state of a repeated token prefix — such as a system prompt, tool schema set, or document context — so that subsequent API requests sharing the same prefix skip the recomputation cost, reducing cached-token billing by 50–90% depending on the provider and returning lower-latency responses for requests that hit the cache.

## How LLM Prompt Caching Works: KV Cache and Prefix Matching

### The KV Attention Cache: What Gets Stored

LLM inference computes key-value (KV) attention states for every token in the input context. This computation scales as O(n²) in the number of tokens and constitutes the bulk of input processing cost for long prompts. Prompt caching stores the computed KV states for a specific token sequence on the provider's servers. When a subsequent request arrives with the same token sequence as a prefix, the provider retrieves the cached KV states instead of recomputing them — charging only for the uncached portion of the input at the discounted cached-token rate.

What is cached is not the raw text but the computed numerical KV tensors. Two requests with identical text but different tokenization (different BPE vocabulary versions or model families) will not share a cache entry. The cached token count does not consume API rate limit quota in most provider implementations — a meaningful secondary benefit for high-frequency agent fleets that run close to TPM ceilings.

### Prefix Matching: The Stability Requirement

Cache lookup is exact prefix matching: the first N tokens of the new request must be byte-for-byte identical to the first N tokens of a previously cached request. This is not fuzzy or semantic matching. A single token difference in the prefix invalidates the cache for everything after that token.

The practical implication is that stable content must come before dynamic content in every LLM call. The canonical order that maximizes cache hit rate across all three providers:

1. **Static system instructions** — agent role, behavioral rules, output format requirements; identical across all calls for the same agent
2. **Static tool schemas** — all tool definitions in fixed alphabetical order; include all possible tools, not a task-specific subset
3. **Static reference documents** — knowledge base, API documentation, code style guides; large documents that benefit most from caching
4. **Dynamic conversation history** — accumulated turns from the current session; cacheable as a secondary cache point
5. **Current user message** — never cached; always dynamic

Any inversion of this order breaks the cache. Placing a per-call timestamp (`Current date: {date}`), a tenant ID, or a request trace ID before the static system instructions moves dynamic content into the cacheable prefix position and produces a cache miss on every single call. The date should go in the user message. The tenant ID should go after a secondary cache boundary marker, not before the system instructions.

For LLM routing strategies that can direct requests to the provider with the highest cache hit rate for a given prefix, see [LLM gateway routing and provider fallback chains](/learn/llm-gateway).

## Anthropic Prompt Caching: 90% Reduction, 5-Minute TTL

### Mechanics: cache_control, TTL, and Write Surcharge

Anthropic prompt caching reached general availability in August 2024. Unlike OpenAI's auto-applied approach, Anthropic requires explicit opt-in via a `cache_control: {type: 'ephemeral'}` marker placed in the message content at the desired cache boundary. Content up to and including the marker is cached as a single unit.

Key mechanics:

- **Cached token price**: 10% of normal input price — a 90% reduction
- **Cache TTL**: 5 minutes from the **last cache read** (not from write) — every cache hit refreshes the timer
- **Write surcharge**: 25% above normal input price on the first request that populates the cache
- **Break-even point**: 2 cache hits amortize the write surcharge; any system prompt used more than twice per 5-minute window is net-positive
- **Minimum cacheable block**: 1,024 tokens for Claude 3 Haiku, Claude 3 Sonnet, Claude 3 Opus, and Claude 3.5 Sonnet
- **API response fields**: `cache_creation_input_tokens` (tokens written to cache this call) and `cache_read_input_tokens` (tokens served from cache this call)

The 5-minute TTL refreshed on hit behavior means active conversations maintain the cache indefinitely — each LLM call within a 5-minute window resets the timer. For agent fleets running at 100+ calls per hour, the cache is effectively permanent for as long as the fleet is active.

### Agent Fleet Calculation: $47,000/Year Savings on System Prompts

Concrete ROI for a 10-agent fleet:

- **Setup**: 10 agents, 2,000-token system prompt, 100 calls/hour per agent = 1,000 fleet calls/hour
- **Pricing**: Claude 3.5 Sonnet input at $3.00/million tokens
- **Uncached cost**: 2,000 tokens × 1,000 calls × $3.00/M = **$6.00/hour = $52,560/year** in system prompt tokens alone
- **With 90% caching**: cache write surcharge on first call ≈ $0.0075; subsequent calls ≈ $0.0006 each for the 2,000-token prefix
- **Effective cost**: approximately **$0.60/hour = $5,256/year** for the system prompt prefix portion
- **Annual savings**: approximately **$47,000/year on system prompt tokens alone**

Tool schemas — commonly 500–3,000 additional tokens in tool-heavy agents — are also cacheable in the same prefix block at the same 90% discount, multiplying the savings further. At 100 calls/hour per agent, each agent sends 1.67 calls per minute, well within the 5-minute TTL window. Every call after the first per TTL window is a cache hit.

For the broader cost reduction landscape including model selection, batching, and output length controls, see [LLM cost optimization and token budget strategies](/learn/llm-cost-optimization).

### What Can and Cannot Be Cached

**Cacheable with Anthropic**: system prompt text, tool schema definitions (the `tools` array in the API request), static document context injected before conversation history, any content placed before the `cache_control` marker.

**Not cacheable**: content after the marker (per-request dynamic content, current user message), tool call results and Observation turns (dynamic by nature), image content within the cached prefix (counted differently).

**Multi-turn caching strategy**: place the `cache_control` marker at the end of the system prompt and tool schemas block, before conversation history begins. On each turn, the system prompt and tool schemas serve from cache; only the conversation history and current message pay full input price. As conversation history grows, a second `cache_control` marker placed at the end of accumulated history caches the conversation state as well — enabling a two-tier cache: stable prefix at Tier 1, growing history at Tier 2.

## OpenAI Prefix Caching: 50% Discount, Auto-Applied

### Mechanics: Automatic, Per-API-Key, No Opt-In

OpenAI prefix caching launched in October 2024 with a different philosophy: no configuration required. Any API request with a prompt of 1,024 tokens or more automatically benefits from caching. The first request pays full input price; subsequent requests from the same API key sharing the same prefix pay 50% of normal input token cost for the cached portion.

Key mechanics:

- **Opt-in required**: none — auto-applied to all prompts ≥1,024 tokens
- **Cached token price**: 50% of normal input price (vs Anthropic's 90% reduction)
- **Cache scope**: per API key — all requests from the same API key share a cache namespace
- **Write surcharge**: none — first request pays full price, no surcharge penalty
- **Cache TTL**: not publicly documented; clears between sessions and on prefix change
- **API response field**: `usage.cached_tokens` for monitoring

The 50% discount is less favorable than Anthropic's 90%, but the zero-configuration model and no write surcharge make it the lowest-friction path for teams already using OpenAI models that want immediate cost reduction without prompt structure changes.

### The Tool Schema Ordering Problem

The most common OpenAI prefix cache invalidation cause in production agent systems is dynamic tool schema ordering. Many agent frameworks register tools based on task type — a coding task registers `code_execution` and `file_read`; a research task registers `web_search` and `read_document`. If the `tools` array is rebuilt per request with task-specific tool definitions, the prefix changes on every call and the cache never hits.

The OpenAI cookbook (2024) explicitly documents this: "Ensure that the static prefix remains consistent across API calls to maximize cache utilization. Any changes to the prefix, including adding or removing tools, will invalidate the cache."

The fix: register **all tools** that an agent may ever use in the prefix, in a fixed alphabetical order, on every call — even if only a subset will be used for the current task. The LLM calls only the tools it determines relevant; unused tool schemas in context are inert. The cache hit rate improvement from stable tool schema ordering outweighs the token cost of including unused tool definitions.

For reliability patterns around cold starts and first-request failures that also affect cache miss spikes, see [AI agent reliability and cold-start failure patterns](/learn/ai-agent-reliability).

## Google Gemini Context Caching: 75% Discount, Explicit API

### Mechanics: Named Cache Objects, 1-Hour Minimum, Storage Cost

Google Gemini context caching, released in June 2024, uses an explicit model rather than automatic or marker-based caching. The developer creates a named `CachedContent` object via a separate API call specifying the content, model, and TTL. Subsequent requests reference the `cache_id`. This is fundamentally different from the other two providers — the cache is a first-class API resource, not a side effect of prefix matching.

Key mechanics:

- **Discount**: 75% off input token pricing for cached content
- **Minimum TTL**: 1 hour — cannot be set below 1 hour; Gemini caching is designed for long-lived contexts
- **Maximum TTL**: up to 7 days
- **Minimum context size**: 32,768 tokens for Gemini 1.5 Pro; 2,048 tokens for Gemini 1.5 Flash
- **Cache storage cost**: $1.00 per million tokens per hour — a separate billing line item absent in Anthropic and OpenAI

The storage cost is a critical ROI factor not present in other implementations. At the 32,768-token minimum for Gemini 1.5 Pro: storage cost = 32,768/1,000,000 × $1.00 = $0.033/hour per cache object. For a 1-hour cache window, this storage cost must be recovered by the inference savings from cache hits within that hour. Short-duration low-volume use cases can end up paying more in storage than they save in inference.

### When to Use Gemini Context Caching vs Anthropic/OpenAI

**Gemini is the right choice when**: the cached content is very large (full codebases, legal document sets, extended knowledge bases exceeding 32,768 tokens); the same content will be referenced across many requests over multiple hours (the 1-hour minimum TTL is a feature — the cache persists without requiring request activity to maintain it, unlike Anthropic's 5-minute refresh requirement); and the 75% discount multiplied by expected cache hits outweighs the $1.00/M/hour storage cost over the cache lifetime.

**Anthropic is the right choice for**: per-agent system prompts and tool schemas (typically 1,024–5,000 tokens), high-frequency agent loops where 5-minute TTL is maintained by call frequency, and any use case where the 90% discount and zero storage cost are the dominant factors.

**OpenAI is the right choice when**: zero configuration overhead is the priority, the deployment is OpenAI-model-only, and the 50% discount is sufficient. The auto-applied model removes any risk of misconfigured cache_control markers.

## Maximizing Cache Hit Rate: Prefix Design and Ordering

### Canonical Prefix Order: Static First, Dynamic Last

The universal rule across all three providers: stable content must precede dynamic content. Any violation of this order produces a cache miss. Common violations and their fixes:

| **Violation** | **Cache Impact** | **Fix** |
|---|---|---|
| `Current date: {date}` in system prompt | Cache miss on every call | Move date to user message |
| Tool schemas registered per-task in varying order | Cache miss when tool set changes | Always register all tools alphabetically |
| Tenant ID prepended before system instructions | Cache miss per tenant | Put tenant context after cache boundary marker |
| Request trace ID in prefix | Cache miss on every call | Add trace ID as metadata, not prompt content |
| Agent framework update changes system prompt template | Cache miss after deployment | Version-pin system prompt template; test cache hit rate post-deploy |

The full canonical prefix structure:

```
[1] Static system instructions (always first)
[2] Static tool schemas (all tools, alphabetical order, always identical)
[3] Static reference documents (knowledge base, docs)
--- cache_control marker (Anthropic) / automatic boundary (OpenAI) ---
[4] Dynamic conversation history (accumulated per session)
[5] Current user message (never cached)
```

### Monitoring Cache Hit Rate: What to Measure

Cache performance is invisible without explicit monitoring. Silent cache invalidation — a prefix change that no one notices — produces a cost spike that appears in the next billing cycle.

**Anthropic monitoring**: track `cache_creation_input_tokens` (cache miss on a cacheable prefix — expensive) vs `cache_read_input_tokens` (cache hit — cheap). Target: `cache_read_input_tokens` should represent >90% of system prompt token consumption for a stable agent. An alert when cache hit rate drops below 80% catches the problem before it costs thousands of dollars.

**OpenAI monitoring**: track `usage.cached_tokens` in the API response. Target: `cached_tokens` should equal the full system prompt + tool schema token count on all calls after the first per session. A sustained drop toward zero is a signal of prefix structure change.

**Gemini monitoring**: track `CachedContent` usage statistics via the API or Cloud Monitoring dashboard. Monitor total cache hits vs misses per cache object per hour.

Alert threshold: a cache hit rate drop from >90% to <50% on a fleet with $47,000/year in cache savings represents approximately $23,000/year in unrecovered cost. Set the alert before the billing cycle ends, not after. For the full observability stack including token cost telemetry, see [AI agent observability and cost monitoring pipelines](/learn/ai-agent-observability).

### Cache Warming: Pre-Populating for Cold Starts

Cache warming pre-sends a request with the target prefix before the first user-facing request, ensuring the first production call hits the cache rather than paying full price plus a write surcharge.

**For Anthropic** (5-minute TTL): on agent startup, send a minimal request — a single-token user message like "ping" — with the full system prompt and tool schemas in the prefix with `cache_control` markers. This populates the cache at startup cost. To maintain warmth across an idle fleet, a dedicated health-check agent sends a minimal ping to each worker agent every 4 minutes — well within the 5-minute TTL window. A fleet of 10 agents requires 10 pings every 4 minutes, costing approximately 10 × 2,000 tokens × $0.30/M = $0.006 per 4-minute cycle — negligible compared to the savings.

**For Gemini** (explicit cache objects): create the `CachedContent` object during the deployment process, not on the first user request. Cache object creation takes a few seconds; adding it to the hot path adds perceptible latency to the first user-facing call. Treat cache creation as infrastructure provisioning, not runtime behavior.

**For OpenAI** (auto-applied): the first request in any new session pays full price regardless. No warm-up is strictly necessary because the cache persists across the session automatically. However, for latency-sensitive applications, a synthetic first request can pre-populate the cache before user traffic arrives.

## Security: Per-Tenant Cache Isolation

### Cross-Tenant Cache Bleed: Two Attack Vectors

A shared prompt cache — multiple tenants using the same API key, sharing the same cache key space — creates two data leakage vectors that are absent from most provider documentation.

**Vector 1: Cache timing side-channel.** Cache hits return lower latency than cache misses because KV state retrieval is faster than recomputation. A TenantB agent that can measure API response latency can infer whether TenantA recently sent a specific system prompt: if TenantB constructs TenantA's suspected prefix and receives a cache hit (lower latency), it confirms TenantA's prefix was recently active. Severity: low for prefix-only leakage (the attacker learns that TenantA used a specific prefix, but not the prefix content, unless the prefix itself is the sensitive data).

**Vector 2: Semantic cache cross-contamination.** In deployments that augment provider-level prefix caching with an application-layer semantic cache — using embedding similarity to return cached responses for semantically similar queries — TenantB's query may retrieve TenantA's cached response if the queries are semantically similar. Severity: high — this is direct information disclosure of TenantA's response content to TenantB. This attack is not hypothetical for multi-tenant platforms that implement semantic caching without per-tenant namespace isolation.

The cross-tenant cache bleed vectors here are instances of the broader OWASP LLM information disclosure threat model — see [AI agent security and cross-tenant data leakage risks](/learn/ai-agent-security) for the full framework.

### Per-Tenant Cache Key Namespacing

**For Anthropic and OpenAI** (automatic prefix caching, per-API-key cache scope): the most effective isolation is one API key per tenant. Since the cache is maintained per API key, different tenants on different API keys cannot share cache state. This doubles as a billing isolation control — per-tenant API key usage is reported separately. OpenLegion's `$CRED{}` vault proxy provisions per-project credentials by default; each project (tenant) resolves its own API key handle through Zone 2, making per-tenant cache isolation automatic.

**For Gemini** (explicit cache objects): the `cache_id` is tenant-specific by construction — each tenant's `CachedContent` object is created with the tenant's content and referenced only by that tenant's requests. Cross-tenant cache access requires explicit `cache_id` disclosure, which should not occur in a correctly implemented authorization model.

**For application-layer semantic caches**: every cache key must include a `tenant_id` prefix or hash. The cache lookup query must filter by `tenant_id` before embedding similarity comparison. This enforcement must happen at the storage client layer — agent code that constructs cache queries can be bypassed by prompt injection, but a storage client wrapper that enforces `tenant_id` scoping on all reads and writes cannot be bypassed through the agent's context.

For the full per-tenant API key isolation architecture, see [credential management and per-tenant API key isolation](/learn/credential-management-ai-agents).

## OpenLegion's Take: Cache Hit Rate Is an Infrastructure Property

Prompt caching is the highest-ROI cost optimization available for multi-agent fleets in 2026. A 10-agent fleet running Claude 3.5 Sonnet at scale saves approximately $47,000/year on system prompt tokens alone with Anthropic's 90% discount — before accounting for tool schemas, which can add another $10,000–30,000/year in savings depending on schema complexity.

The reason caching is underused is not lack of awareness of the discount percentages. It is that most agent frameworks make it trivially easy to accidentally invalidate the cache. Three specific patterns produce silent cache invalidation:

1. **Dynamic tool schema injection**: registering task-specific tool subsets instead of a fixed full set. The cache miss is invisible unless you monitor `cache_creation_input_tokens`. Teams discover the problem when they review their monthly bill.

2. **Variable system prompt construction**: prepending tenant-specific context before static instructions, or building the system prompt from templates that vary slightly between deployments. A template that adds a single extra space invalidates the cache across the entire fleet.

3. **Inconsistent message ordering**: agent frameworks that compose the messages array differently depending on conversation state or tool availability produce different prefixes even when the content is semantically identical.

Three concrete numbers that frame the cost of silent cache invalidation:

- **$47,000/year** saved when a 10-agent fleet maintains >90% cache hit rate on a 2,000-token system prompt at Claude 3.5 Sonnet pricing
- **$23,000/year** in unrecovered cost when cache hit rate drops from >90% to <50% on a fleet with $47,000/year in cache savings — the alert threshold that justifies continuous monitoring
- **4 minutes** — the health-check ping interval required to maintain Anthropic's 5-minute cache TTL across an idle fleet; missing one ping per agent per 5-minute window means a cold-start cache miss on the next request

| **Cache property** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Canonical prefix ordering enforced at infra layer** | Zone 2, by construction | Developer convention | Developer convention | Developer convention | Developer convention |
| **Per-project API key isolation (cache namespace per tenant)** | Vault proxy, default | Manual | Manual | Manual | Manual |
| **cache_creation_input_tokens surfaced in observability** | Native pipeline | Developer convention | Developer convention | Developer convention | Developer convention |
| **Cache hit rate alerting (<80% trigger)** | Native | Not available | Not available | Not available | Not available |
| **Cache warming on agent startup** | Health-check pattern | Manual | Manual | Manual | Manual |
| **Semantic cache with per-tenant namespace isolation** | Storage client layer | Developer responsibility | Developer responsibility | Developer responsibility | Developer responsibility |

Cache hit rate is not an application property. It is determined by prefix structure consistency — whether the first N tokens of every LLM call from a given agent are byte-for-byte identical across calls. That consistency is an infrastructure guarantee, not something that emerges from careful coding by each individual agent author. When the infrastructure builds the LLM request (enforcing canonical prefix order, injecting credentials via `$CRED{}` handles, composing the messages array in a fixed structure), cache hit rate is stable by construction. When agent code builds the LLM request, every agent author is a potential source of prefix variation.

[Start building on OpenLegion](https://app.openlegion.ai) — deploy multi-agent fleets where canonical prefix ordering is enforced at the mesh layer, cache hit rate is surfaced in the built-in observability pipeline, and per-project API key isolation prevents cross-tenant cache bleed by default.

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is LLM prompt caching?

LLM prompt caching stores the computed key-value (KV) attention state of a repeated token prefix — system prompt, tool schemas, or document context — on the provider's servers so that subsequent API requests sharing the same prefix skip recomputation and receive a discount on cached-token billing: 90% with Anthropic (GA August 2024), 50% with OpenAI (October 2024), and 75% with Google Gemini (June 2024). The cache works through exact prefix matching — the first N tokens of the new request must be byte-for-byte identical to the cached prefix, so any modification to the cached prefix portion (reordering, whitespace changes, dynamic content injected before static content) invalidates the cache and triggers a full-price miss. For multi-agent systems where the same system prompt and tool schemas are sent on every LLM call, prompt caching is typically the single highest-ROI cost optimization available, cutting input token costs for the stable prefix portion by 50–90% across all cached calls.

### How does Anthropic prompt caching work?

Anthropic prompt caching (GA August 2024) is activated by placing a `cache_control: {type: 'ephemeral'}` marker at the desired cache boundary in the API request — content up to and including that marker is cached as a unit. Cached tokens are billed at 10% of normal input price (90% reduction); the first request that populates the cache incurs a one-time write surcharge of 25% above normal input price, which breaks even after 2 cache hits. The cache TTL is 5 minutes from the last cache read — every cache hit refreshes the timer, so active agent conversations maintain the cache indefinitely as long as requests arrive within 5-minute windows. The API response includes `cache_creation_input_tokens` and `cache_read_input_tokens` fields that enable monitoring cache hit rate in an observability pipeline; the minimum cacheable block is 1,024 tokens for Claude 3 and Claude 3.5 models.

### How does OpenAI prefix caching work?

OpenAI prefix caching (October 2024) is automatically applied to all API requests with prompts of 1,024 tokens or more with no opt-in required — the first request pays full input price, and all subsequent requests from the same API key sharing the same prefix receive a 50% discount on cached tokens. The cache is maintained per API key, meaning all requests from the same API key share a cache namespace, providing implicit cache isolation between tenants on different API keys but creating a shared cache surface if multiple tenants use the same key. Cache invalidation occurs on any change to the first 1,024 tokens of the prompt, including whitespace changes and tool schema reordering; the OpenAI cookbook (2024) explicitly documents that dynamic tool schema ordering is the most common cause of cache invalidation in agent systems. The API response includes `usage.cached_tokens` for monitoring.

### How does Google Gemini context caching work?

Google Gemini context caching (June 2024) requires explicit cache creation: the developer creates a named `CachedContent` object via a separate API call specifying the content, model, and TTL, then references the `cache_id` in subsequent requests. Cached tokens receive a 75% discount; the minimum cache duration is 1 hour (TTL cannot be set below 1 hour); and cache storage is billed separately at $1.00 per million tokens per hour — a cost not present in Anthropic or OpenAI implementations that must be included in ROI calculations. The minimum context size is 32,768 tokens for Gemini 1.5 Pro and 2,048 tokens for Gemini 1.5 Flash, making Gemini context caching most appropriate for large static document corpora referenced across many requests over hours or days, where the storage cost is amortized across a high volume of cache hits.

### Why does my prompt cache keep getting invalidated?

The most common cache invalidation causes in agent systems are: dynamic tool schema ordering (registering task-specific tool subsets in varying orders instead of all tools in fixed alphabetical order on every call), injecting dynamic content before static content in the prefix (a timestamp, request ID, or per-tenant identifier placed before the system instructions forces a cache miss on every call), and agent framework updates that change the system prompt template structure. The fix requires enforcing a canonical stable-before-dynamic prefix order: static system instructions first, then static tool schemas in fixed alphabetical order, then static reference documents, then dynamic conversation history, then the current user message — any dynamic content that changes per call must come after the cache boundary, not before it. Monitoring `cache_creation_input_tokens` (Anthropic) or `usage.cached_tokens` (OpenAI) in an observability pipeline is the only way to detect silent cache invalidation before it becomes a cost spike in the next billing cycle.

### How much money can prompt caching save in a multi-agent fleet?

For a 10-agent fleet sending a 2,000-token system prompt on every LLM call at 100 calls per hour per agent (1,000 total fleet calls per hour) at Claude 3.5 Sonnet's input price of $3.00 per million tokens, the uncached system prompt cost is $6.00 per hour or $52,560 per year. With Anthropic prompt caching at 90% reduction on cached tokens, the same prefix costs approximately $0.60 per hour for the cached portion — savings of approximately $47,000 per year on system prompt tokens alone, before accounting for tool schemas (commonly 500–3,000 additional cacheable tokens) that multiply the savings further. The ROI calculation improves at higher call frequency: more cache hits per cache write surcharge means better amortization of the 25% write cost and higher absolute savings per unit time.

### Is prompt caching a security risk in multi-tenant systems?

A shared prompt cache — multiple tenants using the same API key and sharing the same cache key space — creates two data leakage vectors: cache timing side-channels (a tenant can infer whether a specific prefix was recently cached by measuring the latency difference between a cache hit and a cache miss, revealing that another tenant recently sent a specific system prompt structure) and semantic cache cross-contamination (in application-layer semantic caches using embedding similarity lookup, a semantically similar query from TenantB may retrieve TenantA's cached response, a high-severity information disclosure). The mitigation for provider-level caching (Anthropic, OpenAI) is per-tenant API key isolation — since the cache is maintained per API key, different tenants on different keys cannot share cache state. For application-layer semantic caches, every cache key must include the `tenant_id` and lookup must filter by tenant before embedding similarity comparison, enforced at the storage client layer rather than by agent code.

### What is cache warming and why does it matter for agent fleets?

Cache warming is the practice of pre-sending a request with the target prefix before the first user-facing request, ensuring the first production call hits the cache rather than paying full price plus a write surcharge. For Anthropic (5-minute TTL refreshed on hit), a dedicated health-check pattern — sending a minimal ping request with the full system prompt and tool schemas in the prefix every 4 minutes — maintains cache warmth across an idle fleet and prevents cold-start cache misses when traffic resumes; 10 agents × 2,000-token pings every 4 minutes costs approximately $0.006 per cycle at Claude 3.5 Sonnet cached pricing. For Gemini (explicit cache objects with 1-hour minimum TTL), the `CachedContent` object should be created during the deployment process rather than on the first user request, since object creation takes a few seconds and adds latency to the hot path. For OpenAI (auto-applied), the first request in each new session always pays full price — no warm-up mechanism is available — but the cache persists automatically throughout the session without requiring refresh activity.
