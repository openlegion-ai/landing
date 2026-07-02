---
title: "Agent as a Service — Pricing, Tenant Isolation, and AaaS vs Self-Hosted"
description: "Agent as a service (AaaS): AI agents on managed infrastructure with consumption pricing. Covers AWS Bedrock Agents, OpenAI Operator, CVE-2024-5184 isolation, and AaaS vs self-hosted TCO."
slug: /learn/agent-as-a-service
primary_keyword: agent as a service
last_updated: "2026-07-02"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-deployment
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-multi-tenancy
  - /learn/credential-management-ai-agents
  - /learn/llm-cost-optimization
---

# Agent as a Service: Pricing Models, Tenant Isolation, and the AaaS Decision Framework

Agent as a service (AaaS) is a commercial delivery model where AI agents run on a vendor's managed infrastructure — orchestration, tool execution, memory, credential management — billed per token, per action, or per agent-hour rather than requiring customers to deploy their own runtime. AaaS crystallized as an enterprise purchasing category in 2026: OpenAI Operator launched January 2026, Google Agent Space reached GA, and AWS Bedrock Agents scaled to enterprise use — driving search volume from 90/month in June 2025 to 260–390/month by Q1 2026, CPC $32.88.

<!-- SCHEMA: DefinitionBlock -->

> **Agent as a service (AaaS)** is a commercial delivery model in which AI agents run on a vendor's managed infrastructure — handling orchestration, tool execution, memory, and credential management — and are billed to the customer on a consumption basis (per input token, per action executed, or per agent-hour) rather than requiring the customer to deploy and operate their own agent runtime.

## What Agent as a Service Means: The Three Platform Promises

Every AaaS platform makes three claims. Understanding which claims are well-delivered and which are marketing helps buyers evaluate vendors before committing infrastructure budget.

### Promise 1: Managed Infrastructure (No Runtime to Operate)

AaaS offloads the entire agent runtime stack to the vendor: orchestration engine, tool execution environment, memory backends, observability pipeline, horizontal scaling, and uptime SLA. The customer defines the agent — system prompt, tools, memory configuration — and invokes it. The vendor runs it.

This is the same trade-off as any managed service: RDS vs. self-managed Postgres, Lambda vs. self-managed containers. You give up configurability and potentially pay a premium, in exchange for not owning operational burden. The managed infrastructure promise is well-delivered by AWS Bedrock Agents, Google Agent Space, and most mature AaaS platforms — genuine managed runtimes with documented uptime SLAs and no agent orchestration code to maintain.

The promise breaks down when the customer needs a runtime configuration the platform doesn't expose: custom tool execution environments, non-standard memory backends, specific model versions not yet available on the platform, or agent loop logic that differs from the platform's fixed orchestration model. When those requirements emerge, the AaaS abstraction becomes a constraint rather than a benefit.

For the infrastructure-layer details — container orchestration, cold-start latency, and uptime SLAs across deployment environments — see [AI agent deployment infrastructure and hosting options](/learn/ai-agent-deployment).

### Promise 2: Consumption Pricing (Pay Per Token, Action, or Hour)

AaaS pricing in 2026 has converged on three structures:

**Per-token orchestration fee on top of model cost.** The platform charges for its orchestration layer separately from the underlying LLM. AWS Bedrock Agents: $0.000025 per input token processed by the orchestration layer, charged on top of the standard LLM model rate. For Claude 3.5 Sonnet on Bedrock ($3.00/M input tokens), the orchestration fee adds $0.025/M input tokens — less than 1% overhead at that model's price point. But for cheaper models — Amazon Titan text at $0.0003/M input tokens — the $0.025/M orchestration fee is actually larger than the model cost itself, an 8× overhead. The orchestration fee is model-agnostic; it disproportionately impacts cost-sensitive deployments on low-cost models.

**Per-action fee for tool integrations.** Platforms that define discrete "actions" (API calls, database queries, knowledge base lookups) charge per execution. AWS Bedrock Knowledge Base queries: $0.0004/query. An agent making 50 knowledge base lookups per session pays $0.02/session in KB fees — manageable at low volume, significant at scale. At 100,000 KB queries/day: $40/day in action fees alone, before model or orchestration costs.

**Per-agent-hour subscription tiers.** Some platforms (including OpenLegion) offer tiers where each active agent counts against included hours regardless of token consumption. This model provides cost predictability for stable agent fleets but can be inefficient for spiky, bursty workloads.

Consumption pricing aligns vendor incentives with customer usage but creates cost unpredictability for long-running agents. A single runaway agentic loop generates charges across both the orchestration layer and the model layer simultaneously — a double-billing structure that makes infrastructure-level budget caps doubly important in AaaS contexts.

For the full range of cost reduction strategies — prompt caching, model tiering, and batch inference — see [LLM cost optimization and token budget strategies for agent fleets](/learn/llm-cost-optimization).

### Promise 3: Credential Isolation (Credentials Never in Agent Context)

Credential isolation is the AaaS security primitive that distinguishes a managed platform from "agent code running on a cloud VM with API keys in environment variables." Credential isolation means the platform never exposes the customer's LLM API keys, database credentials, or tool secrets to agent code or to other tenants — credentials are injected server-side at execution time and never appear in the agent's context window, in log files, or in tool call parameters that agent code constructs.

This matters because CVE-2024-5184 (Palo Alto Unit 42, May 2024, CVSS 8.1 HIGH) demonstrated that prompt injection via tool response can cause an agent to exfiltrate its own context window. If API keys are in the context window — as system prompt strings, environment variable references, or tool configuration values — they are exfiltrable through this vector.

The diagnostic question to ask every AaaS vendor: **"If my agent's full context window is extracted by an attacker through prompt injection, what credentials are at risk?"** The correct answer is: none — credentials are not in the agent's context window.

Platforms that achieve credential isolation architecturally:
- **AWS Bedrock Agents**: IAM role assumption per invocation — the agent executes under a temporary IAM role token, never a raw API key; the agent code never receives or holds credentials
- **OpenLegion**: `$CRED{}` handle resolution at Zone 2 — agent code references a credential by name (e.g., `$CRED{openai_key}`), Zone 2 resolves the handle to the actual value at execution time without returning it to the agent; credential handles are not present in the agent's context window

Platforms that do not achieve full isolation: any platform where the developer puts API keys in the system prompt, or where tool configurations with raw credentials are serialized into the agent's context at invocation.

For the vault proxy pattern and `$CRED{}` handle architecture, see [credential management and per-tenant API key scoping for AI agents](/learn/credential-management-ai-agents).

## The AaaS Vendor Landscape in 2026

### AWS Bedrock Agents: Enterprise AaaS with IAM Isolation

AWS Bedrock Agents is the dominant enterprise AaaS platform by market reach, running on the AWS customer base. The architecture: agents are defined via the Bedrock console or API, with action groups (Lambda functions or OpenAPI schemas) and knowledge bases (vector stores backed by OpenSearch Serverless or Aurora PostgreSQL). Orchestration is managed by Bedrock; the customer writes Lambda functions and system prompts.

**Pricing (2026):**
- Orchestration layer: $0.000025/input token (on top of model cost)
- Model cost: billed at standard Bedrock rates (Claude 3.5 Sonnet: $3.00/M input, $15.00/M output)
- Knowledge Base queries: $0.0004/query
- Code Interpreter: $0.000025/input token

**Credential isolation:** IAM role assumption per invocation. Each Bedrock Agent is assigned an IAM execution role. Lambda action group functions are invoked under that role. The agent itself never holds raw credentials — only scoped, temporary IAM tokens. This is credential isolation achieved at the AWS identity layer, not by developer convention.

**Limitations:** Agents are tightly coupled to AWS services. Cross-cloud or on-premises tool integrations require Lambda function wrappers, adding latency and maintenance. Custom agent loop logic (non-standard tool selection, multi-step planning algorithms) is not supported — the Bedrock orchestration model is fixed. The per-token orchestration fee accumulates quickly for context-heavy multi-step agents.

### OpenAI Operator: Consumer AaaS for Browser Tasks

OpenAI Operator launched in January 2026 — the first mainstream consumer-facing AaaS product. It operates as a browser-use agent that executes web tasks (form submission, account management, online ordering, research extraction) in a sandboxed browser session on the user's behalf, priced per task completion rather than per token.

**Credential isolation:** Sandboxed browser session per task. The session is not persisted or shared across tasks. Website credentials entered by the agent during task execution are not stored in OpenAI's systems, per the January 2026 privacy policy. This provides session-scoped isolation — credentials exist only within a single task execution and are not retrievable after task completion.

**Market significance:** Operator marks the mainstream consumer arrival of AaaS. The 4× YoY growth in "agent as a service" search volume between June 2025 and early 2026 correlates directly with Operator's launch and the associated media coverage. Operator demonstrated that consumers, not just enterprise procurement teams, will pay for agent task execution as a service.

**Limitations:** Browser-only scope — no custom tool integrations beyond web browsing at launch. No developer API for custom agent definitions. Consumer-focused task set with limited applicability for enterprise workflows requiring access to internal systems.

### Google Agent Space: AaaS for Workspace-Heavy Enterprises

Google Agent Space (launched 2025, generally available 2026) is Google Cloud's enterprise AaaS platform, positioned for organizations already standardized on Google Workspace — Gmail, Docs, Drive, Calendar. Agents run in tenant-isolated Google Cloud projects. Workspace integrations use service account credentials scoped per tenant workspace — the agent accesses Gmail and Drive under a service account authorized for that specific workspace, not a shared cross-tenant credential.

**Pricing:** Via Google Cloud consumption billing, tied to Vertex AI model costs plus Cloud Run invocation fees for agent execution. Pricing is not fixed in a single line item — it is the sum of Vertex AI, Cloud Run, and any additional Google Cloud services the agent invokes.

**Differentiation:** Pre-built Workspace connectors (email drafting, document summarization, calendar management, Drive search) with enterprise SSO integration. For Workspace-heavy buyers who don't want to build custom Workspace API connectors, Agent Space provides significant time-to-production advantage over self-hosted alternatives.

**Limitations:** Google Cloud ecosystem lock-in. Less flexible for multi-cloud or on-premises tool integrations. Custom agent loop logic is more constrained than developer-first platforms. Pricing opacity — multiple billing dimensions make TCO harder to estimate in advance.

For a feature-level comparison of AaaS platforms including orchestration capabilities, memory backends, and tool integrations, see [AI agent platform features and framework comparison](/learn/ai-agent-platform).

## AaaS Pricing: Understanding Your Total Cost

### The Orchestration Layer Fee: The Cost Hidden Behind Model Pricing

Most AaaS buyers focus on the LLM model cost and treat the orchestration layer fee as a rounding error. For high-cost models this is approximately correct. For low-cost models it is not.

AWS Bedrock Agents charges $0.000025/input token for orchestration — equal to $0.025/M input tokens. Compare:

| **Model** | **Input price** | **Orchestration fee** | **Orchestration % of model cost** |
|---|---|---|---|
| Claude 3.5 Sonnet | $3.00/M | $0.025/M | 0.83% |
| Claude 3 Haiku | $0.25/M | $0.025/M | 10% |
| Amazon Titan Text | $0.0003/M | $0.025/M | 8,333% |

The orchestration fee is the same absolute amount regardless of which model you use. Buyers planning to use cheap models to reduce cost must factor the orchestration overhead into their total cost — at Amazon Titan pricing, the orchestration fee is 83× the model cost itself.

For buyers evaluating AaaS platforms, calculate orchestration overhead as a percentage of your specific model's input token price, not as an absolute number.

### Per-Action Fees and the Long-Running Agent Tax

Per-action fees compound for agents that make many tool calls per session. AWS Bedrock Knowledge Base: $0.0004/query. At 50 KB lookups per session: $0.02/session in KB fees.

Comparing AaaS per-action fees vs. self-hosted alternatives at scale:

- **AWS Bedrock KB at 100,000 queries/day**: $40/day = $1,200/month in query fees
- **Self-hosted OpenSearch on t3.medium** handling 100,000 queries/day: ~$0.16/day in compute = $5/month

The crossover calculation: AaaS per-action fees exceed self-hosted infrastructure cost when `(daily_actions × per_action_fee) > (monthly_infra_cost ÷ 30)`. For AWS KB at $0.0004/query vs. a $150/month self-hosted vector store, the crossover occurs at approximately **12,500 queries/day** — above which self-hosted is cheaper even before accounting for the operational overhead of running the vector store.

At low volume (< 12,500 queries/day), AaaS per-action fees are cheaper than the fixed monthly infrastructure cost of a self-hosted vector store. At high volume, the economics flip.

### Runaway Loop Cost in AaaS: Double Billing

Runaway agentic loops cost more in AaaS than in self-hosted deployments because AaaS bills both the model cost and the orchestration layer fee on every iteration, plus per-action fees for each tool call within the loop.

A runaway loop running 20 iterations on AWS Bedrock with Claude 3.5 Sonnet, with one Knowledge Base query per iteration:

- Model input cost (growing context window): approximately $0.86 cumulative
- Orchestration fee (0.83% overhead): approximately $0.007 additional
- KB query fees: 20 × $0.0004 = $0.008 additional
- **Total**: approximately $0.875 per agent vs. $0.86 self-hosted

At 1,000 concurrent agents each in a 20-iteration storm: approximately $875 in AaaS vs. $860 self-hosted — the AaaS premium is small in absolute terms but the total exposure makes infrastructure-level budget caps essential.

OpenLegion's $0–$50/day per-agent cap enforced at Zone 2 applies to the total cost of all LLM calls and tool invocations, not just the model cost line item — it caps the complete AaaS billing exposure, not a subset of it.

## AaaS Security: Credential Isolation and the CVE-2024-5184 Test

### The CVE-2024-5184 Test for AaaS Platforms

CVE-2024-5184 (Palo Alto Unit 42, May 2024, CVSS 8.1 HIGH): prompt injection via tool API response. An adversarially crafted external API response causes the agent to execute attacker-controlled instructions during the next loop iteration. In an AaaS context, the attack surface expands beyond what a single self-hosted agent faces: the AaaS agent calls external APIs and processes external web content on behalf of the tenant, and any of those external responses can contain injected instructions.

The **CVE-2024-5184 test** for AaaS platforms: "If my agent's system prompt and full context window are extracted by an attacker through prompt injection, what credentials are accessible?"

**Pass** — credentials are not in the agent's context window:
- AWS Bedrock Agents: IAM role tokens used for action execution; raw credentials not in context
- OpenLegion: `$CRED{}` handles resolved at Zone 2 and not returned to agent code; agent context contains no credential values

**Fail** — credentials are accessible in the agent's context:
- Any platform where the developer has placed API keys in the system prompt
- Any platform where tool configuration strings containing raw credentials are serialized into the agent's context at invocation time

Passing the test is a platform architecture property, not a developer discipline property. A platform where developers are instructed not to put credentials in system prompts passes by convention — and conventions break under time pressure, code review gaps, or developer onboarding failures. A platform where credential values architecturally never enter the agent's context window passes unconditionally.

For the full OWASP LLM Top 10 threat model for agent systems, see [AI agent security and the OWASP LLM prompt injection threat model](/learn/ai-agent-security).

### Multi-Tenant Prompt Isolation: What AaaS Platforms Must Enforce

AaaS platforms serving multiple tenants must enforce prompt isolation: TenantA's system prompt, conversation history, and tool results must never appear in TenantB's agent context. The mechanism determines the strength of the isolation guarantee.

**Infrastructure-level isolation (strongest):**
- **AWS Bedrock Agents**: each agent is a separate Bedrock resource with its own IAM execution role; there is no shared context between customers' agents unless explicitly configured via cross-account permissions
- **Google Agent Space**: tenant isolation via Google Cloud project boundaries; agents in ProjectA cannot access ProjectB's data without explicit cross-project IAM grants
- **OpenLegion**: blackboard namespace ACL per project — agents in ProjectA cannot read ProjectB's blackboard state; credential handles are project-scoped (`ProjectA`'s `$CRED{openai_key}` resolves to ProjectA's API key, never ProjectB's)

Infrastructure-level isolation makes cross-tenant access architecturally impossible without explicit configuration changes — it is not policy-prohibited, it is technically blocked.

**System-prompt-level isolation (weakest):**
Injecting `"You are serving TenantA. Never access TenantB data."` into the agent's system prompt as the sole isolation mechanism. This fails when prompt injection (CVE-2024-5184) overwrites or ignores the tenant instruction, allowing the agent to access another tenant's data in subsequent loop iterations. This is OWASP LLM06 Sensitive Information Disclosure — the tenant boundary is enforced by an instruction that an adversary can override.

For the full architecture of per-tenant credential scoping, namespace ACLs, and SOC 2 controls, see [AI agent multi-tenancy and cross-tenant isolation architecture](/learn/ai-agent-multi-tenancy).

### The Shared Responsibility Model in AaaS

AaaS platforms operate under a shared responsibility model parallel to cloud IaaS/PaaS: the platform is responsible for infrastructure security (compute isolation, network security, credential vault, audit logging); the customer is responsible for application security (system prompt design, tool permission scoping, data classification, HITL controls for irreversible actions).

Common customer mistakes that create security gaps within an otherwise secure AaaS platform:

1. **Credentials in system prompts**: placing raw API keys or connection strings in the agent's system prompt — exfiltrable via prompt injection even if the platform's vault is architecturally sound
2. **Over-broad tool permissions**: granting agents write access to production databases or email systems when read-only or send-limited access is sufficient for the stated task
3. **No per-agent tool scoping**: all tools enabled for all agents instead of least-privilege per agent role — an agent designed for customer inquiry research should not have access to payment execution tools
4. **No HITL interrupt for irreversible actions**: skipping human-in-the-loop checkpoints before email sends, database writes, or payment execution because they "slow things down" in demos

The shared responsibility gap is not an AaaS platform failure — it is a customer misconfiguration. But AaaS platforms that make it architecturally hard to make these mistakes (enforced tool scoping, vault-only credential injection, required HITL confirmation for destructive actions) provide a better security baseline than platforms that permit them by default.

## AaaS vs Self-Hosted: The Decision Framework

### When AaaS Wins: Low Volume, Fast Start, Compliance Inheritance

AaaS is the better choice when three conditions hold simultaneously:

**Low-to-medium volume.** Per-action fees are less than self-hosted infrastructure costs. For AWS Bedrock Knowledge Base at $0.0004/query, the crossover vs. a $150/month self-hosted vector store is approximately 12,500 queries/day. Below that threshold, AaaS is cheaper — there is no fixed monthly infrastructure cost to pay. Above it, self-hosted infrastructure amortizes across higher query volume.

**Fast time-to-production is the priority.** AaaS eliminates weeks of infrastructure setup: no container orchestration to configure, no credential vault to deploy, no observability pipeline to build, no agent runtime to maintain. A team that ships a working agent on an AaaS platform in 2 days vs. 3 weeks of self-hosted setup has a valid fast-start argument even at a modest per-action premium — especially if engineering time has a high opportunity cost.

**Compliance inheritance reduces audit burden.** AaaS platforms with SOC 2 Type II and ISO 27001 certifications allow customers to inherit those certifications for the infrastructure layer. A SOC 2 audit of a self-hosted agent system requires the customer to certify their own infrastructure controls — storage encryption, access logging, network segmentation, change management. Inheriting those controls from a certified AaaS vendor can reduce the audit scope materially.

### When Self-Hosted Wins: Scale, Customization, Data Residency

Self-hosted infrastructure is the right choice when:

**Scale exceeds AaaS crossover.** At >50,000 agent actions/day on typical AaaS per-action pricing, a self-managed Kubernetes cluster ($800–$1,200/month for the infrastructure) handling all agent orchestration is almost always cheaper than per-action fees. The crossover varies by platform and action type but is consistently in the 10,000–50,000 actions/day range for most AaaS pricing structures in 2026.

**Custom runtime requirements.** Non-standard tool execution environments, proprietary memory backends, custom agent loop logic (multi-step planning algorithms, non-standard tool selection strategies, custom cycle detection), or specific model versions that the AaaS platform's orchestration engine doesn't support. AaaS platforms provide a fixed orchestration model — custom requirements beyond that model are either unsupported or require complex workarounds.

**Data residency requirements.** Regulated industries — healthcare (HIPAA), finance (SOX), government (FedRAMP) — may require all agent-processed data to remain in a specific geographic region or network perimeter. AaaS platforms may offer region selection, but fine-grained data residency controls (data never leaves a specific network, no cross-border transfer even for logs) may require self-hosted infrastructure in the required jurisdiction.

**Vendor lock-in risk is unacceptable.** Deep integration with an AaaS platform's proprietary agent definition format (Bedrock's action group schema, Agent Space's connector configuration) creates migration barriers if the platform changes pricing, deprecates features, or is acquired. Self-hosted platforms using open frameworks (LangGraph, AutoGen, OpenLegion — where the agent definition is committed to a git repository in a standard format) maintain portability.

### Total Cost of Ownership: The Full AaaS vs Self-Hosted Calculation

TCO comparison for a mid-scale agent deployment (500 agents, 200 actions/agent/day = 100,000 actions/day):

**AaaS (AWS Bedrock-style) at 100,000 actions/day:**
- KB queries: 100,000 × $0.0004 = $40/day = $1,200/month
- Orchestration fees: approximately $300/month (depends on context length)
- Model costs: variable (same for AaaS and self-hosted)
- Engineering operational overhead: minimal — platform is managed
- **Platform cost total: approximately $1,500/month + model costs**

**Self-hosted equivalent:**
- Kubernetes cluster: $800/month
- Vector store (OpenSearch): $200/month
- Observability stack: $150/month
- Engineering operational overhead: 4 hours/week × $150/hour engineer = $2,400/month
- **Total: approximately $3,550/month + model costs**

At this specific scale, AaaS is cheaper — $1,500/month vs. $3,550/month — primarily because engineering operational overhead dominates the self-hosted TCO. The self-hosted option only wins on pure infrastructure cost ($1,150/month) without engineering time, but that comparison is only valid if the infrastructure operates autonomously with zero engineering attention.

At 2× scale (200,000 actions/day):
- AaaS: approximately $3,000/month + model costs (scales linearly with action count)
- Self-hosted: approximately $4,200/month (larger cluster, same engineering overhead that does not scale with volume)

The crossover favors AaaS below 150,000–200,000 actions/day when full engineering TCO is included. Above that volume, self-hosted infrastructure wins even accounting for engineering time, because the action-count-independent engineering overhead is now amortized across a much higher volume.

The TCO calculation must always include engineering time. Teams without dedicated platform engineers who would otherwise spend that time on product features should factor in the opportunity cost of self-hosting. Comparing AaaS fees to raw infrastructure cost without engineering overhead consistently overstates the self-hosted advantage.

## OpenLegion's Take: AaaS Security Is a Credential Architecture Question

Agent as a service is 2026's fastest-growing purchasing category for enterprise AI — and also the category with the least standardized security baseline. Every AaaS platform claims credential isolation. The differentiator is whether isolation is enforced architecturally or by convention.

**Architectural enforcement**: credentials never enter agent code or the agent's context window. The vault resolves them at the infrastructure layer before each tool call. If the agent's context window is extracted through prompt injection, there are no credentials in it to steal. This property cannot be bypassed by a developer mistake, a misconfigured system prompt, or an adversarial external API response. It is enforced at the layer below the agent's code.

**Convention-based isolation**: the developer is instructed not to put credentials in system prompts. The documentation says "don't do this." The CI/CD pipeline doesn't check for it. The runtime doesn't prevent it. Convention-based isolation breaks under time pressure, code review gaps, and developer onboarding failures — the exact conditions under which most production security incidents occur.

Three concrete numbers that frame the AaaS security decision:

- **CVE-2024-5184 (CVSS 8.1, May 2024)**: the prompt injection via tool response attack demonstrated at production severity that agent context windows are exfiltrable attack targets. If credentials are in the context window, they are at risk.
- **$32.88 CPC** for "agent as a service" in Q1–Q2 2026 — the buyers searching this keyword are making infrastructure budget decisions. The security posture they inherit from the AaaS vendor they choose will persist for years.
- **4× YoY growth** in search volume from June 2025 to early 2026 — the AaaS market is expanding faster than the security baseline is maturing. Vendors are competing on features and pricing; credential isolation architecture is a differentiator precisely because it is not yet a baseline requirement.

| **Security control** | **OpenLegion** | **AWS Bedrock Agents** | **Google Agent Space** | **OpenAI Operator** | **LangGraph (self-hosted)** |
|---|---|---|---|---|---|
| **Credential vault with $CRED{} handle resolution (not in agent context)** | Zone 2, architectural | IAM role assumption | Service account scoping | Session isolation | Developer responsibility |
| **Per-agent daily spend cap (infrastructure layer)** | Zone 2, $0–$50/day | Not available | Not available | Not available | Developer responsibility |
| **Blackboard ACL per tenant project (cross-tenant reads blocked)** | Architectural | IAM-based | Project-based | N/A | Developer responsibility |
| **Per-agent tool permission scoping (least-privilege enforced by runtime)** | Runtime-enforced | Action group IAM | IAM-based | N/A | Developer responsibility |
| **WORM audit log per tenant (SOC 2 CC6.1)** | Native | CloudTrail | Cloud Audit Logs | N/A | Developer responsibility |
| **Agent definition in git (full permission change audit trail)** | INSTRUCTIONS.md | Console/API | Console/API | N/A | Developer responsibility |

[Start building on OpenLegion](https://app.openlegion.ai) — deploy agents with architectural credential isolation via `$CRED{}` vault proxy resolution, per-agent daily spend caps enforced at Zone 2, and blackboard ACLs that make cross-tenant state access architecturally impossible, not just policy-prohibited.

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is agent as a service (AaaS)?

Agent as a service (AaaS) is a commercial delivery model in which AI agents run on a vendor's managed infrastructure — handling orchestration, tool execution, memory, and credential management — billed to the customer on a consumption basis (per input token, per action executed, or per agent-hour) rather than requiring the customer to deploy and operate their own agent runtime. The AaaS category crystallized in 2026 with the launch of OpenAI Operator (January 2026), the general availability of Google Agent Space, and AWS Bedrock Agents reaching enterprise scale — driving search volume from 90/month in June 2025 to 260–390/month in Q1–Q2 2026, with a $32.88 CPC indicating buyers at the evaluation stage. Every AaaS platform makes three promises: managed infrastructure (no runtime to operate), consumption pricing (pay for what you use), and credential isolation (API keys and secrets never exposed to agent code or other tenants).

### How much does agent as a service cost?

AaaS pricing has three cost layers: the underlying LLM model cost (billed at the standard rate for the chosen model), an orchestration layer fee charged by the platform for managing the agent runtime (AWS Bedrock Agents: $0.000025/input token, separate from model cost), and per-action fees for tool integrations (AWS Bedrock Knowledge Base queries: $0.0004/query). For a session processing 10,000 tokens with 5 KB lookups on AWS Bedrock with Claude 3.5 Sonnet: model cost ≈ $0.030 + orchestration ≈ $0.00025 + KB fees = $0.002 = approximately $0.032/session total platform cost. At scale (100,000 agent actions/day), AaaS platform fees typically reach $1,500–$3,600/month before model costs — comparable to self-hosted infrastructure costs only when full engineering operational overhead is included in the self-hosted TCO.

### What is AWS Bedrock Agents and how is it priced?

AWS Bedrock Agents is Amazon's managed AaaS platform providing agent orchestration, action groups (Lambda function integrations or API schemas), and knowledge bases (vector stores) on AWS-managed infrastructure with IAM role-based credential isolation. Pricing (2026): $0.000025 per input token for the orchestration layer, charged in addition to the underlying LLM model's costs; Knowledge Base queries cost $0.0004 per query; Code Interpreter usage costs $0.000025 per input token processed. The orchestration fee disproportionately affects low-cost model deployments — for Amazon Titan text at $0.0003/million input tokens, the $0.025/million orchestration fee is larger than the model cost itself — so buyers should calculate orchestration overhead as a percentage of their chosen model's price rather than treating it as a negligible add-on.

### What was OpenAI Operator and why does it matter for AaaS?

OpenAI Operator, launched January 2026, is the first mainstream consumer-facing agent as a service product — an AI agent executing web tasks (form submissions, account management, online purchasing, research) in a sandboxed browser session on the user's behalf, priced per task completion rather than per token. Operator's significance for the AaaS category is its role as a market signal: it demonstrated that consumers, not just enterprise procurement teams, will pay for agent task execution as a service, directly correlating with the 4× year-over-year increase in "agent as a service" search volume observed in early 2026. The sandboxed browser session architecture — where website credentials entered during task execution are not persisted or shared across sessions — established an early reference implementation for consumer-grade AaaS credential isolation.

### How does credential isolation work in AaaS platforms?

Credential isolation in AaaS means the platform never exposes the customer's LLM API keys, database credentials, or tool secrets to agent code or to other tenants — credentials are injected server-side at execution time and never appear in the agent's context window, in log files, or in tool call parameters. AWS Bedrock Agents achieves this through IAM role assumption — the agent executes under a temporary scoped IAM role token, not a raw API key — so the agent code never receives or stores underlying credentials. OpenLegion uses `$CRED{}` handle resolution at Zone 2: agent code references a credential by name, Zone 2 resolves the actual value at execution time without returning it to the agent; if the agent's context window is extracted through prompt injection (CVE-2024-5184), no credentials are present to steal. The diagnostic question for any AaaS platform is: "If my agent's full context window is extracted by an attacker, what credentials are at risk?" — the correct answer is none.

### What security risks are specific to AaaS platforms?

The primary AaaS-specific security risk is the expanded attack surface for prompt injection (CVE-2024-5184, Palo Alto Unit 42, May 2024, CVSS 8.1 HIGH): AaaS agents call external APIs and process external web content on behalf of tenants, and any of those external responses can contain adversarially crafted instructions — if credentials are in the agent's context window, they are exfiltrable through this vector. The second AaaS-specific risk is cross-tenant prompt bleed: platforms using system-prompt-level tenant isolation (injecting "You are serving TenantA" as the sole boundary) are vulnerable when prompt injection overwrites that instruction, allowing the agent to access another tenant's data (OWASP LLM06 Sensitive Information Disclosure). A third risk is the shared responsibility gap: customers who assume the AaaS platform handles all security and therefore put API keys in system prompts, grant over-broad tool permissions, or skip HITL controls for irreversible actions, creating exploitable gaps within an otherwise secure platform.

### When should I use AaaS vs self-hosted agent infrastructure?

AaaS is the better choice when volume is low-to-medium (typically below 50,000 agent actions/day, where per-action fees are less than self-hosted infrastructure costs), when fast time-to-production matters (AaaS eliminates weeks of infrastructure setup), or when compliance inheritance from a SOC 2 Type II certified platform reduces audit scope. Self-hosted infrastructure wins at scale (above 50,000 actions/day where fixed infrastructure costs amortize below per-action AaaS fees), when custom runtime requirements exceed the AaaS platform's fixed orchestration model, when data residency regulations require on-premises or specific-region processing, or when vendor lock-in risk from proprietary agent definition formats is unacceptable. The TCO calculation must always include engineering time to operate self-hosted infrastructure — comparing AaaS fees to raw infrastructure cost without engineering overhead consistently overstates the self-hosted advantage.

### What is multi-tenant prompt isolation in AaaS?

Multi-tenant prompt isolation in AaaS means TenantA's system prompt, conversation history, tool results, and memory state never appear in TenantB's agent context — each tenant's agent execution is isolated so that one tenant cannot read, influence, or be influenced by another's data. The strongest isolation mechanisms are infrastructure-level: separate IAM roles per tenant (AWS Bedrock), separate Google Cloud projects per tenant (Google Agent Space), or separate blackboard namespace ACLs per project (OpenLegion) — these make cross-tenant access architecturally impossible without explicit configuration changes. The weakest pattern is system-prompt-level isolation — injecting "You are serving TenantA. Never access TenantB data." as the sole boundary — which fails when prompt injection overwrites or ignores the instruction, making the isolation bypassable by any adversarial content in an external tool response (OWASP LLM06 Sensitive Information Disclosure).
