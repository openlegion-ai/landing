---
title: "Prompt Caching — Anthropic, OpenAI, and Gemini Cache Architecture Guide"
description: "How prompt caching works: Anthropic 90% discount, OpenAI 50%, Gemini ~75%. Minimum thresholds, TTL windows, prefix stability requirements, and savings math for agent fleets."
slug: /learn/llm-prompt-caching
primary_keyword: prompt caching
last_updated: "2026-07-05"
schema_types: ["FAQPage"]
related:
  - /learn/llm-cost-optimization
  - /learn/ai-agent-cost
  - /learn/agentic-workflows
  - /learn/ai-agent-security
  - /learn/llm-gateway
  - /learn/ai-agent-observability
---

# Prompt Caching: Cache Hit Architecture for Anthropic, OpenAI, and Gemini

Prompt caching is an LLM inference optimization that stores the computed key-value attention state of a repeated token prefix on the provider's servers, so subsequent calls skip recomputation and receive a discounted price — Anthropic at 90% off (cache reads $0.30/MTok vs $3.00/MTok for Claude 3.5 Sonnet), OpenAI at 50% off (auto-applied ≥1,024 tokens), Gemini at approximately 75% off. The single constraint: the cached prefix must be byte-for-byte identical at the start of every prompt within the TTL window.

<!-- SCHEMA: DefinitionBlock -->

> **Prompt caching** is an LLM inference optimization that stores the computed key-value (KV) attention state of a repeated token prefix on the provider's servers, so that subsequent requests containing the same prefix skip recomputation and are billed at a discounted rate — Anthropic at 90% off (cache reads: $0.30/MTok vs $3.00/MTok for Claude 3.5 Sonnet), OpenAI at 50% off (auto-applied for prefixes ≥1,024 tokens), and Google Gemini at approximately 75% off for context-cached content — with savings conditional on prefix stability across calls within the cache TTL window.

## How Prompt Caching Works: KV Cache Mechanics

### The KV Cache: What Is Being Stored and Why It Saves Money

LLM inference has two phases for every input token: compute the key (K) and value (V) attention vectors for that token, then use those KV vectors in the attention mechanism to generate output. For a 10,000-token system prompt, the provider computes 10,000 KV sets on every API call — even when the content is identical to the previous call. Prompt caching stores those computed KV vectors on the provider's servers after the first call; subsequent calls with the same prefix retrieve the stored state instead of recomputing.

The cost saving reflects compute skipped: KV recomputation is the expensive phase of input token processing. Providers pass the compute savings to the customer as a token discount. The key constraint: the cached prefix must be **byte-for-byte identical** on every call for the provider to recognize a cache hit. Any change — whitespace, punctuation, token ordering, even a single character — is a cache miss. On Anthropic, a cache miss while using `cache_control` also triggers a 25% write surcharge, making broken caching actively more expensive than no caching.

Understanding why the input token count matters so much requires understanding how context accumulates across loop iterations — see [agentic workflows and how context accumulates across iterations](/learn/agentic-workflows).

### Cache TTL: How Long the KV State Is Stored

Cache TTL is the duration the provider stores the KV state before eviction. After TTL expiry, the next call is a cache miss.

| **Provider** | **Default TTL** | **Max TTL** | **TTL reset on hit?** |
|---|---|---|---|
| **Anthropic** | 5 minutes | 1 hour | Yes — resets on every read |
| **OpenAI** | ~5–10 minutes | Not configurable | Not documented |
| **Gemini** | 4.5 hours | 24 hours | Configurable on creation |

TTL design implication for agent systems: agent calls must arrive within the TTL window to benefit from caching. A batch agent running 100 tasks with 2-second spacing covers 200 seconds per batch — within Anthropic's 5-minute TTL on every call. A nightly report agent running 100 tasks at 30-second intervals (50 minutes total) misses Anthropic's 5-minute TTL on all calls after the first few. For infrequent agents: extend TTL to 1 hour or disable caching entirely — the write surcharge on every miss makes low-frequency Anthropic caching more expensive than uncached.

Anthropic TTL extension requires explicit configuration; OpenAI TTL is load-dependent and not configurable; Gemini TTL is set when creating the CachedContent object.

## Provider Implementations: Anthropic, OpenAI, and Gemini

### Anthropic Prompt Caching: Explicit cache_control with 90% Discount

**GA: August 2024.** Supported models: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku.

**Pricing (Claude 3.5 Sonnet):**
- Normal input: $3.00/MTok
- Cache write: **$3.75/MTok** (25% surcharge — paid on first call or after TTL expiry)
- Cache read: **$0.30/MTok** (90% discount)

**Minimum cacheable block:** 1,024 tokens  
**Default TTL:** 5 minutes (extendable to 1 hour)  
**Activation:** Explicit — add `{cache_control: {type: 'ephemeral'}}` to the last content block that should be included in the cache

Anthropic caches all content at or before the `cache_control` breakpoint. Up to 4 breakpoints per request are supported — useful for caching the system prompt separately from a large document injected as context.

**Response usage reporting:**
- `usage.cache_creation_input_tokens` — tokens written to cache this call
- `usage.cache_read_input_tokens` — tokens read from cache this call
- `usage.input_tokens` — uncached tokens processed normally

**Real-world savings calculation** (10,000-token system prompt × 100 agent calls):
- 1 cache write: `10,000 tokens × $3.75/MTok` = **$0.0375**
- 99 cache reads: `99 × 10,000 tokens × $0.30/MTok` = **$0.297**
- Total cached cost: **$0.3345**
- Uncached equivalent: **$3.00**
- Net savings: **$2.666 per 100-call batch (88.9% reduction)**

Break-even: additional write cost = `$0.0375 − $0.030 = $0.0075`; savings per read = `$0.030 − $0.003 = $0.027`; break-even = `0.0075 / 0.027 = 0.28 reads` — less than one subsequent call within the TTL window recoups the write surcharge. Any agent that calls the same system prompt twice within 5 minutes benefits from Anthropic caching.

### OpenAI Prompt Caching: Implicit 50% Discount, No Configuration Required

**GA: October 2024.** Supported models: gpt-4o, gpt-4o-mini, o1, o1-mini, gpt-4o-realtime-preview, gpt-4o-audio-preview.

**Pricing:**
- Cached input tokens: **50% of normal input price** (auto-applied)
- No write surcharge — cache misses billed at the normal rate with no penalty

**Minimum eligible prefix:** ≥1,024 tokens  
**TTL:** ~5–10 minutes (load-dependent, disk-based LRU; not documented precisely)  
**Activation:** None required — caching is implicit for all supported models

OpenAI caching identifies the longest matching prefix from a recent call with the same API key and applies the 50% discount automatically. Developers do not restructure API calls to benefit — any existing application with a repeated system prompt ≥1,024 tokens gains caching without code changes.

**Verification:** Check `usage.prompt_tokens_details.cached_tokens` in the API response. A value > 0 confirms a cache hit. If `cached_tokens` is consistently 0 for calls that should be caching:

1. Verify the system prompt + tool schemas total ≥1,024 tokens
2. Check call frequency — gaps >10 minutes may exceed the TTL
3. Check for prefix variability — dynamic content before the 1,024-token mark prevents caching
4. Verify model support — older gpt-3.5-turbo models do not support implicit caching

The trade-off of implicit caching: no control over which content is cached, no TTL extension option, no explicit cache invalidation.

### Google Gemini Context Caching: Explicit Object API, 4.5h TTL, High Minimum

**GA: November 2024.** Supported models: Gemini 1.5 Pro, Gemini 1.5 Flash.

**Pricing (Gemini 1.5 Pro):**
- Storage: **$1.00/hour per 1M cached tokens**
- Per-query cost reduction: **~75%** for the cached prefix

**Minimum cacheable content:** **32,768 tokens** (far higher than Anthropic's 1,024 or OpenAI's 1,024)  
**Default TTL:** 4.5 hours (configurable up to 24 hours)  
**Activation:** Explicit object API — create a `CachedContent` resource via the Gemini API before use

Gemini's 32,768-token minimum targets large document corpora, not system prompts. The use case is RAG applications that load a 100-page PDF (~50,000 tokens) once and query it repeatedly within the TTL window. The 4.5-hour TTL and $1.00/hr storage cost are optimized for this access pattern.

**What can be cached:** system instructions, large documents, tool definitions, and conversation history.

**CachedContent workflow:**
1. POST to caches endpoint with content, TTL, and optional expiration time
2. Receive a `CachedContent` object with a resource name
3. Reference the cached content by name in subsequent `GenerateContent` calls

For multi-agent systems with high-frequency calls and 2,000-token system prompts, Anthropic and OpenAI are the better fit. Gemini context caching becomes cost-effective when the cached payload exceeds 32,768 tokens and is reused many times across the 4.5-hour TTL.

## Prefix Stability: The Architecture That Determines Cache Hit Rate

### What Breaks Cache Hits: Common Prefix Instability Patterns

A cache hit requires byte-for-byte identical prefix matching. Five patterns that commonly destroy cache hit rate in production:

**1. Timestamps in system prompts.** A system prompt containing `Current time: 2026-07-05T14:23:11Z` generates a different byte sequence every second. Every call is a cache miss. Fix: remove timestamps from system prompts; inject time only when the task requires it, in a user message after the cacheable prefix.

**2. User-specific content at prompt position 1.** A system prompt starting with `You are serving user {user_id}: {user_name}.` changes on every call. Fix: move user-specific context to the end of the system prompt or to the first user message, after the cacheable static prefix.

**3. Dynamic tool schemas.** Tool descriptions that include live state — current stock counts, user permissions, active features — change on every call. Fix: tool descriptions must be static; dynamic state belongs in tool results returned by the tool call, not in tool definitions.

**4. Non-deterministic serialization.** Python dicts and JSON objects with non-deterministic key ordering produce different byte sequences on each call even when the content is logically identical. Fix: use `json.dumps(schema, sort_keys=True)` for all tool schema content; use raw string literals for system prompt templates.

**5. Conversation history injected before the system prompt.** Some frameworks prepend conversation history to the messages array before the system prompt, pushing the system prompt out of the cacheable prefix position (position 0). Fix: system prompt must always be at position 0 in the messages array; conversation history follows after.

On Anthropic, every cache miss while `cache_control` is configured triggers the 25% write surcharge with no corresponding read discount. An agent with broken prefix stability paying $3.75/MTok instead of $3.00/MTok on every call is 25% more expensive than uncached. Monitor `cache_creation_input_tokens` vs `cache_read_input_tokens` — if the ratio is consistently > 1.0, prefix instability is the cause.

### Designing for Maximum Cache Hit Rate

Structure agent prompts so that stable content appears before dynamic content, with the Anthropic `cache_control` breakpoint at the stable/dynamic boundary:

```
[STATIC — cache this]
1. System prompt: role definition, behavioral instructions, security rules, output format requirements
   Typically 500–3,000 tokens. Identical across all calls for this agent type.
2. Tool schemas: tool names, descriptions, parameter schemas
   Typically 500–2,000 tokens. Changes only on deployment.

[SEMI-STATIC — cache with second breakpoint if reused across multiple calls]
3. Large document context: RAG results reused across multiple queries in the same session

[DYNAMIC — do not cache]
4. Conversation history: previous messages in this session. Grows with each turn.
5. Current user message: the user's actual query.
```

**Anthropic cache_control placement:** pass `system` as an array of content blocks; add `{cache_control: {type: 'ephemeral'}}` to the last block:

```json
{
  "system": [
    {
      "type": "text",
      "text": "<full system prompt + tool schemas>",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [
    {"role": "user", "content": "<current user message>"}
  ]
}
```

For a 2,000-token system prompt + 1,500-token tool schemas = 3,500 cacheable tokens. The cache hit discount applies to those 3,500 tokens on every call after the first, regardless of how different the conversation history and user messages are. Dynamic content (positions 4–5) is processed at the full uncached rate.

**OpenAI optimization:** ensure the static prefix is ≥1,024 tokens before any per-call dynamic content. No breakpoints required — just validate via `cached_tokens` in the response after the first few calls.

### Cache Hit Rate Math: When Caching Saves vs Costs Money

**Anthropic break-even analysis** (Claude 3.5 Sonnet, 10,000-token system prompt):

- Normal input: `10,000/1M × $3.00` = $0.030 per call
- Cache write: `10,000/1M × $3.75` = $0.0375 per call (+$0.0075 vs normal)
- Cache read: `10,000/1M × $0.30` = $0.003 per call (−$0.027 vs normal)
- Break-even reads: `$0.0075 / $0.027 = 0.28` — less than 1 read recoups the write surcharge

**Caching saves money** when the same prefix is called more than once per TTL window. Any agent called twice in 5 minutes benefits.

**Caching costs money** when prefix instability causes misses: every miss at $3.75/MTok vs the $3.00/MTok uncached rate is a 25% penalty. The threshold for whether broken caching helps or hurts: if hit rate < 20%, broken caching costs more than uncached at Claude 3.5 Sonnet rates.

**Monthly savings estimate** (2,000-token system prompt, 50 calls/day, Anthropic Claude 3.5 Sonnet, 20 working days, 95% cache hit rate):
- Uncached: `50 × 20 × 2,000 tokens × $3.00/MTok` = $6.00/month on system prompt tokens
- Cached: 1 write/day × 20 days = 20 writes; 49 reads/day × 20 days = 980 reads
  - Write cost: `20 × 2,000 × $3.75/MTok` = $0.15
  - Read cost: `980 × 2,000 × $0.30/MTok` = $0.588
  - Total: **$0.738/month** vs $6.00 uncached = **$5.26/month savings per agent type**

For cost control at the fleet level — loop amplification, per-agent budget caps, and runaway loop prevention — see [AI agent cost and per-agent budget enforcement](/learn/ai-agent-cost).

## Multi-Agent Fleet Caching: Shared Prefixes and Parallel Amplification

### Fleet Caching Multiplier: N Agents Sharing One Cache Write

In a multi-agent fleet where N agents of the same type run concurrently with identical system prompts and tool schemas, the cache write cost is paid once by the first agent and amortized across N−1 subsequent reads in the TTL window.

**Fleet multiplier calculation** (Anthropic, 10,000-token shared system prompt, 100 concurrent agents):

| **Scenario** | **Total cost** | **Per-agent cost** | **vs uncached** |
|---|---|---|---|
| **Uncached (100 calls)** | $3.00 | $0.030 | baseline |
| **Cached (1 write + 99 reads)** | $0.3345 | $0.003345 | ≈−88.9% |
| **1,000 agents (1 write + 999 reads)** | $3.0375 → per agent $0.003 | $0.003 | ≈−90% |

The fleet multiplier: as N approaches infinity, per-agent cost approaches the pure read price ($0.003 for 10,000 tokens at Claude 3.5 Sonnet rates). A fleet of 1,000 agents running the same task simultaneously pays one write and 999 reads — 99.9% of the write cost is amortized.

**Why multi-agent systems naturally benefit:** in a well-architected fleet, all instances of the same agent type use identical system prompts and tool schemas defined in a shared configuration file. The first agent to call within a TTL window pays the write; every subsequent agent reads from cache. No additional configuration is required — fleet cache amplification is an automatic property of shared agent definitions.

For LLM gateway-level orchestration that routes calls to maximize fleet cache hit rates, see [LLM gateway routing and centralized cache management](/learn/llm-gateway).

### Per-Tenant Cache Isolation: Security and Cost Attribution

Cache isolation ensures that one tenant's cached prompt prefix cannot be read by another tenant's agent call. This is a security requirement — cross-tenant prefix sharing could allow one tenant to observe cache hit timing and infer another tenant's system prompt structure — and a cost attribution requirement.

**Provider isolation mechanism:** both Anthropic and OpenAI isolate caches by API key. A cache entry created by one API key can only be hit by subsequent calls using the same API key. Different tenants using different API keys never share cache entries, regardless of identical prompt content.

Within a single API key, all agents that share the same system prompt prefix share cache entries — this is the intended fleet sharing behavior, not a security concern. The cache is content-addressed within the API key namespace.

**Multi-tenant architecture requirement:** each tenant must use a separate API key to ensure cache isolation. Using a single shared API key across tenants with different system prompts still provides isolation (cache hits only occur on matching prefixes), but provides no isolation against timing-based inference attacks.

For the full OWASP LLM security implications — including prompt injection at cache re-entry boundaries — see [AI agent security and prompt injection at the cache re-entry point](/learn/ai-agent-security).

For cache hit rate monitoring and fleet-level observability dashboards, see [AI agent observability and cache hit rate monitoring](/learn/ai-agent-observability).

## Implementation Patterns: cache_control, Response Monitoring, and Pitfalls

### Anthropic cache_control Implementation

Pass `system` as an array of content blocks rather than a plain string; add the `cache_control` field to the last block:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "system": [
    {
      "type": "text",
      "text": "You are a research agent. [full system prompt content]",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "Research question: [task-specific content]"
    }
  ]
}
```

For caching both system prompt and a large document context, use two breakpoints:

```json
{
  "system": [
    {
      "type": "text",
      "text": "[system prompt + tool schemas]",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "[large document context for this session]",
          "cache_control": {"type": "ephemeral"}
        },
        {
          "type": "text",
          "text": "[actual user question]"
        }
      ]
    }
  ]
}
```

**Monitoring in production:** log `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`, and `usage.input_tokens` on every API response. Compute hit rate as `cache_read_input_tokens / (cache_read_input_tokens + cache_creation_input_tokens)`. Alert when hit rate drops below 80% — this indicates prefix instability and means the write surcharge is being paid without proportional read savings.

### OpenAI Implicit Caching: Verification and Optimization

No configuration required. Verify by checking `usage.prompt_tokens_details.cached_tokens` in the response:

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[system_message, user_message]
)
cached = response.usage.prompt_tokens_details.cached_tokens
total_prompt = response.usage.prompt_tokens
hit_rate = cached / total_prompt if total_prompt > 0 else 0
```

If `cached_tokens` is consistently 0 for calls that should be caching, check in order:
1. Total prompt length ≥1,024 tokens
2. System prompt + tool schemas appear before any per-call dynamic content
3. Call frequency — gaps >10 minutes may exceed the TTL
4. Model version — older gpt-3.5-turbo models do not support implicit caching

Optimization: ensure the static prefix (system prompt + tool schemas) is ≥1,024 tokens. If the system prompt alone is only 600 tokens, adding a comprehensive set of tool schemas typically pushes the stable prefix past 1,024 tokens and enables caching.

### Common Caching Pitfalls and How to Avoid Them

**1. Timestamp injection before cache breakpoint.**
Agent frameworks that automatically inject `Current date/time: X` into system prompts break every cache call. Fix: move time injection to a user message or to a position after the `cache_control` breakpoint. If the task genuinely needs the current time, inject it only in the user message, not the system prompt.

**2. Stale cache content after system prompt update.**
If the system prompt is updated (new tool added, behavioral change) but the TTL has not expired, calls within the TTL window retrieve the old cached version. Fix: after deploying a system prompt change, wait for TTL expiry (5 minutes for Anthropic's default) before relying on the updated version. To force immediate cache busting: change a single non-semantic character (e.g., add a trailing space) to invalidate the existing cache entry.

**3. Write surcharge on low-frequency agents (Anthropic).**
An agent called once per hour with the default 5-minute TTL incurs a cache write on every call (TTL expired between calls) with zero reads to amortize it — 25% more expensive than uncached. Fix: extend TTL to 1 hour for infrequent agents, or remove `cache_control` breakpoints entirely for agents called less than twice per 5-minute window.

**4. Non-deterministic tool schema serialization.**
Tool schemas generated by serializing Python dicts or TypeScript objects with non-deterministic key ordering produce different byte sequences on each call. Fix: use sorted-key JSON serialization for all tool schema content:

```python
import json
tool_schema_str = json.dumps(tool_schemas, sort_keys=True, separators=(',', ':'))
```

**5. Template-based system prompt whitespace variability.**
f-string or Jinja template-based system prompts that produce slightly different indentation or newline sequences on each instantiation generate different byte sequences. Fix: use raw string literals for system prompt templates; test for byte-for-byte stability by generating the prompt 10 times and asserting all outputs are identical.

## OpenLegion's Take: Design Agent Systems for Cache-First Architecture

Prompt caching is one of the few LLM cost optimizations with zero quality tradeoff — you pay less for the same output, with no model behavior change. It is also one of the easiest to accidentally break.

Three concrete failure modes that turn a cost-saving feature into a cost-increasing one:

**The broken Anthropic cache costs more than no cache.** A 10,000-token system prompt with `cache_control` configured but broken prefix stability (timestamp in the system prompt, user ID at position 1) pays $3.75/MTok on every call instead of $3.00/MTok — a 25% cost increase vs uncached. With 1,000 calls/day at this rate: $37.50/day vs $30.00/day uncached = **$7.50/day in cost from broken caching**. Caching is not opt-in-and-forget; it requires monitoring `cache_creation_input_tokens` vs `cache_read_input_tokens` in production.

**Fleet cache hit rate is a property of shared agent definitions, not cache configuration.** In a 100-agent fleet where each agent has a slightly different system prompt (user ID injected, per-session state, different tool schema ordering) — even with `cache_control` correctly configured — no cache sharing occurs between agents and each incurs the write surcharge. In a 100-agent fleet with identical INSTRUCTIONS.md-defined system prompts across all instances of the same agent type, one cache write amortizes across 99 reads automatically. The amplification comes from the agent architecture, not from cache settings.

**The break-even on Anthropic is 0.28 reads.** Any agent called more than once per 5-minute window benefits — which covers virtually every production agent system. The write surcharge concern is real but only applies to agents called at intervals longer than the TTL with no TTL extension configured.

| **Cache architecture property** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **System prompt defined in git (byte-for-byte stable across all instances of same agent type)** | INSTRUCTIONS.md, committed | Developer convention | Developer convention | Developer convention | Developer convention |
| **Tool schemas static per agent role (no dynamic content in tool descriptions)** | Enforced by Zone 2 | Developer responsibility | Developer responsibility | Developer responsibility | Developer responsibility |
| **Dynamic content injected after cache breakpoint (not in system prompt)** | Zone 2 architecture | Developer responsibility | Developer responsibility | Developer responsibility | Developer responsibility |
| **Fleet cache sharing — N parallel agents share one cache write** | Natural consequence of shared INSTRUCTIONS.md | Possible if manually designed | Not built-in | Not built-in | Not built-in |
| **Per-project API key isolation (per-tenant cache entries — no cross-tenant bleed)** | $CRED{} per project | Manual | Manual | Manual | Manual |
| **Cache hit rate monitoring (cache_read_input_tokens in observability pipeline)** | Zone 2 tagged, observable | Manual (LangSmith) | Manual | Manual | Manual |

[Start building on OpenLegion](https://app.openlegion.ai) — agent definitions in git, cache-first architecture by default.

For broader LLM cost controls beyond caching — model selection, prompt compression, quantized models, and batch inference — see [LLM cost optimization at the model and infrastructure layer](/learn/llm-cost-optimization).

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is prompt caching?

Prompt caching is an LLM inference optimization that stores the computed key-value (KV) attention state of a repeated prompt prefix on the provider's servers, so subsequent requests with the same prefix skip recomputation and receive a discounted rate. Anthropic's cache read price is $0.30/MTok for Claude 3.5 Sonnet (90% discount vs $3.00/MTok uncached); OpenAI applies a 50% discount automatically to cached prefixes ≥1,024 tokens; Google Gemini reduces per-query cost approximately 75% for context-cached content (minimum 32,768 tokens, $1.00/hr storage cost at Gemini 1.5 Pro rates). The core requirement for caching to produce savings is prefix stability — the cached token sequence must be byte-for-byte identical at the start of every prompt within the cache TTL window; dynamic content (timestamps, user IDs, live state) injected before the cacheable content breaks every cache call and, on Anthropic, triggers a 25% write surcharge with no corresponding read discount.

### How does Anthropic prompt caching work?

Anthropic prompt caching uses explicit `cache_control` breakpoints in the messages array — add `{cache_control: {type: 'ephemeral'}}` to the last content block that should be cached, and Anthropic stores the KV state for all tokens at or before that breakpoint. Cache hit pricing for Claude 3.5 Sonnet: $0.30/MTok (90% discount vs $3.00/MTok normal input price); cache write surcharge: $3.75/MTok (25% above normal, paid on the first call or after TTL expiry); minimum cacheable block: 1,024 tokens; default TTL: 5 minutes, reset on every cache read. Break-even is 0.28 reads — a 10,000-token system prompt called twice within the TTL window saves more in read discounts than the write surcharge cost on the first call, so any agent repeated within 5 minutes benefits from Anthropic caching. Monitor `cache_creation_input_tokens` and `cache_read_input_tokens` in every API response — high `cache_creation_input_tokens` with zero `cache_read_input_tokens` means the cache is never being hit and the write surcharge is paid on every call.

### How does OpenAI prompt caching work?

OpenAI prompt caching is implicit — no configuration is required; a 50% discount is automatically applied to any input tokens that match a cached prefix from a recent call with the same API key. The discount applies to gpt-4o, gpt-4o-mini, o1, and o1-mini for prompts ≥1,024 tokens; cached tokens appear in `usage.prompt_tokens_details.cached_tokens` in the API response. There is no write surcharge — cache misses are billed at the normal rate with no penalty. The cache TTL is approximately 5–10 minutes (load-dependent, not documented precisely); any dynamic content injected before the 1,024-token mark prevents caching. Because caching is automatic, verify by checking `cached_tokens` in the response — a value of 0 for calls that should be hitting the cache indicates prefix instability or calls spaced beyond the TTL window.

### How does Google Gemini context caching work?

Google Gemini context caching is an explicit object API — the developer creates a `CachedContent` resource via the Gemini API (specifying content, TTL, and optional expiration time) and then references the cached content by name in subsequent `GenerateContent` calls. The minimum cacheable content is 32,768 tokens (far higher than Anthropic's 1,024 or OpenAI's 1,024), making it optimized for large document corpora (RAG applications, large codebases) rather than system prompts. Storage costs $1.00/hour per 1M cached tokens for Gemini 1.5 Pro; the default TTL is 4.5 hours (configurable up to 24 hours); per-query cost reduction for the cached prefix is approximately 75%. Gemini context caching is best suited for applications that load a large static corpus once (a 100-page document, a full codebase) and query it repeatedly within the TTL window — the 4.5-hour TTL and low per-hour storage cost optimize for this access pattern rather than the high-frequency, short-TTL pattern of agent system prompt caching.

### What breaks prompt cache hits?

The most common cause of prompt cache misses is dynamic content injected before the cacheable prefix: timestamps (`Current time: 2026-07-05T14:23:11Z`), user-specific content (`You are serving user {id}`), or live state values in the system prompt that change on every call — any varying token pushes everything after it out of the cacheable prefix. Other common causes include non-deterministic tool schema serialization (Python dict or JSON with varying key ordering producing different byte sequences per call), whitespace variability in template-based system prompts, and calling agents at intervals longer than the cache TTL (the cache expires between calls, making every call a cache write). On Anthropic, cache misses with `cache_control` configured trigger a 25% write surcharge — broken prefix stability means paying $3.75/MTok instead of $3.00/MTok on every call, a 25% cost increase vs no caching. Verify via `cache_creation_input_tokens` and `cache_read_input_tokens` in the API response; if `cache_creation_input_tokens` dominates with minimal `cache_read_input_tokens`, prefix instability is destroying the hit rate.

### How much does prompt caching save in a multi-agent fleet?

In a multi-agent fleet where N agents of the same type run concurrently with identical system prompts and tool schemas, the cache write cost is paid once by the first agent and amortized across N−1 subsequent reads in the TTL window. For 100 agents sharing a 10,000-token system prompt with Anthropic caching at Claude 3.5 Sonnet rates: 1 write ($0.0375) + 99 reads ($0.297) = $0.3345 total vs $3.00 uncached — $2.666 savings per 100-agent batch (88.9% reduction). For a 1,000-agent fleet, the per-agent cost approaches the pure read price ($0.003/call for 10,000 tokens), reducing system prompt token cost by approximately 90%. For OpenAI implicit caching, no configuration is needed — any fleet of agents using the same API key and the same system prompt prefix ≥1,024 tokens automatically shares cache hits within the TTL window.

### How should I structure my system prompt for maximum cache hit rate?

Structure prompts so that all static content appears before any dynamic content, with the `cache_control` breakpoint placed at the static/dynamic boundary: (1) system prompt text (static — never changes per call), (2) tool schema definitions (static — changes only on deployment), (3) large reused document context if applicable (semi-static — cache with a second breakpoint if reused across calls), then (4) conversation history and (5) current user message (dynamic — not cached). On OpenAI, no breakpoints are needed — just ensure the static prefix is ≥1,024 tokens and appears before any per-call dynamic content. Common mistakes that break cache hit rate include injecting timestamps or user IDs into the system prompt before the cache breakpoint, using template-generated system prompts with non-deterministic whitespace or key ordering, and placing conversation history before the system prompt in the messages array.

### Is prompt caching secure in multi-tenant agent systems?

Prompt caching is isolated by API key on both Anthropic and OpenAI — a cache entry created by one API key can only be hit by calls using the same API key; different API keys never share cache entries regardless of identical prompt content. In a properly architected multi-tenant system where each tenant uses a separate API key, there is no cross-tenant cache sharing and no way for one tenant to infer another's system prompt through cache timing attacks. The security risk arises when multiple tenants share a single API key — agents with different system prompts but a shared API key do not share cache entries (prefixes differ), but a tenant could construct requests designed to probe whether a particular prefix is cached, inferring information about another tenant's system prompt structure. For high-security multi-tenant deployments, enforce one API key per tenant as a hard architectural rule, not just a convention.
