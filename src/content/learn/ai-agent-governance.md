---
title: "AI Agent Governance: RBAC, Audit Trails, and Regulatory Compliance"
description: "AI agent governance: RBAC, immutable audit trails, budget caps, and compliance for production agents. Covers EU AI Act Article 9, NIST AI RMF, SOC 2 CC6.1/CC7.2, and OWASP LLM06."
slug: /learn/ai-agent-governance
primary_keyword: ai agent governance
last_updated: "2026-06-18"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-observability
  - /learn/ai-agent-sandboxing
  - /learn/human-in-the-loop-ai-agents
  - /learn/ai-agent-deployment
---

# AI Agent Governance: RBAC, Audit Trails, and Regulatory Compliance

AI agent governance is the institutional control layer over autonomous agent systems — defining who can authorize agent actions, what permissions each agent holds, how every action is recorded, and how agents can be stopped. Unlike security (which defends against external threats), governance answers to regulators, auditors, and internal risk committees. EU AI Act Article 9, applying from August 2026, mandates risk management systems for high-risk AI. NIST AI RMF (January 2023) lists Govern as the prerequisite function. Neither requirement is satisfied by technical controls alone.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent governance** is the set of policies, access controls, audit mechanisms, and accountability structures that ensure every action taken by an autonomous AI agent is attributable to a defined identity, bounded by documented permission limits, recorded in an immutable log, and reviewable by authorized humans — enabling organizations to demonstrate control over agent behavior to regulators, auditors, and their own risk functions.

## Governance Controls at a Glance

| **Control** | **What it enforces** | **Regulatory mapping** |
|---|---|---|
| **RBAC + role definition** | Permission boundaries per agent role | SOC 2 CC6.1, OWASP LLM06, EU AI Act Art. 9 |
| **Quarterly access certification** | Least-privilege review, documented outcomes | SOC 2 CC6.1, NIST AI RMF GOVERN 1.1 |
| **Immutable audit trail** | Attributability, tamper-evident log | SOC 2 CC7.2, EU AI Act Art. 9 |
| **Budget cap (infrastructure layer)** | Cost boundary enforcement, chargeback | OWASP LLM10, internal finance governance |
| **Kill switch (tested monthly)** | Stoppability under 60 seconds | EU AI Act Art. 14 |
| **Policy-as-code (OPA/Git)** | Change-controlled permission enforcement | SOC 2 CC8.1 Change Management |
| **Anomaly detection** | Deviation from expected behavior | SOC 2 CC7.2, NIST AI RMF MEASURE 2.6 |

## The Four Required Properties of a Governed Agent System

A governed agent system satisfies four properties that cannot be delegated to the agent itself: attributability, structurally enforced permission boundaries, cost boundaries, and stoppability. Self-policing fails — an agent instructed to stay within limits can be overridden by prompt injection. Governance requires controls that operate outside the agent's own reasoning process.

### Property 1: Attributability — Every Action Tied to an Agent Identity

Every action an agent takes must be traceable to a specific agent identity at a specific time. This means a unique `agent_id` at the instance level (not the role level), a millisecond-precision UTC timestamp, and an immutable log entry that cannot be retroactively modified. SOC 2 Trust Service Criterion CC7.2 requires monitoring and logging of system activity — for agent systems, that means tool calls, blackboard writes, and agent-to-agent messages are all within scope.

Attributability breaks down when multiple agents share an identity (common in naive fleet deployments) or when logs can be overwritten. OpenLegion auto-generates a unique `agent_id` per fleet agent instance and appends every tool call to an append-only audit trail. Shared agent identities are structurally prevented at the mesh layer.

### Property 2: Permission Boundaries — Structurally Enforced, Not Self-Policed

An agent's permission boundary defines which tools it can call, which blackboard namespaces it can read or write, which other agents it can message, and which external network endpoints it can reach. These boundaries must be enforced by the infrastructure layer — not by agent instructions.

Self-policed boundaries fail for two reasons. First, a sufficiently crafted prompt injection overrides any instruction-based restriction. Second, a hallucinating model may interpret its own permission instructions incorrectly. OWASP LLM06 (Excessive Agency, LLM Top 10 2025) identifies the governance fix as a formal least-privilege access review checklist: enumerate every tool and permission the agent holds, document the task requirement that justifies each, remove any permission without documented justification, and record the outcome with reviewer identity and date.

In OpenLegion, permission boundaries are encoded as ACL configuration in Zone 2 — the credential and access control tier. Agent containers in Zone 1 cannot escalate their own permissions. The role definition document (name, task scope, tool allowlist, blackboard namespace ACL, communication ACL, external network allowlist) is the governance artifact that auditors review.

### Property 3: Cost Boundaries — Budget Enforcement at Infrastructure

Unbounded token consumption is a governance failure mode, not just a technical one. OWASP LLM10 (Unbounded Consumption) is the compliance-relevant framing: an agent that can spend without limit exposes the organization to unbudgeted cost that cannot be attributed to a cost center, reviewed in an audit, or explained to a finance committee.

Budget governance requires enforcement at the infrastructure layer, not the application layer. OpenLegion's Zone 2 Cost Tracker enforces $50/day and $200/month per agent by default. The limits are not bypassable by agent code — the LLM proxy blocks calls once the cap is reached. At 80% of the daily budget, an alert fires to the designated operator. This threshold alert is the chargeback mechanism: the cost center owning the agent receives a notification before the cap is hit, enabling budget reallocation without service disruption.

For multi-team deployments, showback reports (read-only cost visibility per agent role per team) and chargeback reports (cost allocated to cost centers) are the finance governance deliverables. Without per-agent cost attribution, audit committees cannot verify that agent spend was authorized and within approved budgets.

### Property 4: Stoppability — Any Agent, Under 60 Seconds

Every governed agent system requires a documented kill switch: a procedure, tested at least monthly, that halts any running agent within 60 seconds. EU AI Act Article 14 requires human oversight mechanisms including the ability to intervene and stop AI systems. A kill switch that exists in documentation but has never been tested does not satisfy this requirement.

In OpenLegion, the steer mechanism sends an immediate halt signal to any fleet agent by agent ID. The halt is logged to the immutable audit trail with the identity of the operator who issued it, the timestamp, and the agent's last recorded state. For Kubernetes deployments outside OpenLegion, the equivalent is a documented `kubectl delete pod` procedure with RBAC restricting who can issue it and a webhook that logs the deletion event to your audit system.

## Regulatory Framework: EU AI Act, NIST AI RMF, and SOC 2

### EU AI Act Article 9: Risk Management Systems for Autonomous Agents

Article 9 of the EU AI Act, applying from August 2026, requires high-risk AI systems to implement a risk management system that runs throughout the system's lifecycle. High-risk classifications relevant to agent deployments include systems used in employment and HR management, access to essential services and benefits, critical infrastructure, education, and law enforcement. If your agent system touches any of these domains, Article 9 applies.

The Article 9 requirements translate to governance deliverables: a risk register documenting identified risks and their mitigations, documented controls with evidence of implementation, and periodic review at least annually (more frequently for systems with rapid capability changes). The RBAC structure, audit trail, budget enforcement, and kill switch procedures described in this page are the technical implementation — Article 9 requires they also be documented, reviewed, and kept current.

### NIST AI RMF: Govern as the Foundation Function

NIST published AI Risk Management Framework 1.0 in January 2023. Its four functions — Govern, Map, Measure, Manage — are ordered deliberately: Govern is the prerequisite. You cannot Map risks you have not defined policies to govern, Measure risks without a baseline permission structure to deviate from, or Manage incidents without documented accountability structures.

GOVERN 1.1 requires written policies that assign accountability for AI risk, not just technical controls. For agent systems, this means: a governance committee or designated owner for each agent role, written acceptable use policies for what agents are authorized to do, and an incident response plan that covers agent misbehavior. The GOVERN function also requires documentation that policies are communicated and understood — a governance document that no one has read does not satisfy GOVERN 1.1.

Relevant NIST AI RMF subcategories for agent governance: GOVERN 1.1 (policies and accountability), GOVERN 1.2 (organizational roles and responsibilities), GOVERN 4.1 (organizational teams are committed to governance), MAP 5.1 (likelihood and magnitude of harms documented), MEASURE 2.6 (AI system behavior monitored), MANAGE 1.3 (response to AI risks is documented).

### SOC 2 CC6.1 and CC7.2: Logical Access and Monitoring

SOC 2 Type II audits are the standard enterprise procurement requirement for SaaS products handling customer data. Two Trust Service Criteria directly govern agent systems:

**CC6.1 (Logical and Physical Access Controls)**: requires that access to systems is restricted to authorized users and that access is reviewed periodically. For agent systems, CC6.1 maps to: vault proxy enforcement of per-agent credential scope (agents can only access the credentials their role is authorized to use), quarterly access certification reviews of agent role permissions, and documented provisioning/deprovisioning procedures for agent roles.

**CC7.2 (System Monitoring)**: requires that the organization monitors system components for anomalies and deviations from expected performance. For agent systems, CC7.2 maps to: immutable logs of all agent actions with anomaly detection rules (unusual tool call volume, unexpected external endpoint access, off-hours activity), and evidence that alerts are reviewed and acted on. The [AI agent observability guide](/learn/ai-agent-observability) covers the monitoring implementation that generates CC7.2 evidence.

SOC 2 auditors require 12 months of log retention as evidence. Design your audit trail retention with this in mind — 90-day minimum for operational review, 12-month minimum for SOC 2 evidence, and operational-lifetime retention for systems under EU AI Act high-risk classification.

### OWASP LLM06 Excessive Agency: The Governance Failure Mode

OWASP LLM Top 10 2025 item LLM06 (Excessive Agency) is not a technical vulnerability in the traditional sense — it is a governance failure mode. An agent with excessive agency has permissions beyond what its tasks require, and those excess permissions amplify the impact of any other failure (prompt injection, model error, misuse). The OWASP mitigation is a formal governance process:

1. Enumerate every tool and permission the agent holds
2. For each permission, document the specific task that requires it
3. Remove any permission that lacks documented justification
4. Record the review outcome with reviewer identity, date, and list of permissions removed or retained with rationale

This is a quarterly access certification process applied to agent systems. It produces the documentation that satisfies OWASP LLM06, EU AI Act Article 9 periodic review, and SOC 2 CC6.1 access review requirements simultaneously.

## Role-Based Access Control for Agent Systems

### Defining Agent Roles and Permission Boundaries

An agent role is the governance unit of RBAC for agent systems. Each role defines:

- **Name and task scope**: a description of what the agent is authorized to do, written in plain language for non-technical reviewers
- **Tool allowlist**: explicit enumeration of which tools the agent can call (no wildcards)
- **Blackboard namespace ACL**: which keys the agent can read and which it can write
- **Agent communication ACL**: which other agent roles this agent can send messages to or receive messages from
- **External network allowlist**: which domains or IP ranges the agent container can reach
- **Credential scope**: which `$CRED{}` handles the vault proxy will resolve for this role

The role definition document is the primary governance artifact — it is what an auditor reviews to assess whether least-privilege is implemented. It is also the evidence that EU AI Act Article 9 risk controls are documented and the SOC 2 CC6.1 access control record. In OpenLegion, this document maps directly to Zone 2 ACL configuration — the documentation and the technical enforcement are the same artifact.

Role proliferation is a governance risk. Ten narrowly scoped roles are easier to certify than one broadly scoped role, but thirty roles create certification overhead that causes access reviews to be skipped. Design roles around task categories, not individual agents. A `research-reader` role that covers all read-only research agents is easier to govern than thirty individually named research agents with near-identical permissions.

### Periodic Access Review: Quarterly Access Certification

Access certification is the formal process of reviewing every agent role's permissions and confirming that each permission is still justified. SOC 2 requires this review at least annually for most organizations; quarterly is the standard for systems handling sensitive data or operating under EU AI Act Article 9.

The quarterly access certification process for agent systems:

1. **Generate the permissions report**: a complete listing of every agent role and its current permissions, pulled directly from the enforcement system (Zone 2 ACL config in OpenLegion, OPA policy store, or equivalent). Reports generated from documentation rather than the enforcement system may not reflect actual permissions.

2. **Assign an independent reviewer**: the reviewer should not be the agent owner. This separation of duties is a SOC 2 requirement and prevents owners from certifying their own excess permissions.

3. **Certify or remediate each permission**: for each permission in the report, the reviewer confirms it is still justified by a current task requirement, or flags it for removal.

4. **Record the outcome**: document the reviewer's identity, the review date, which permissions were removed, and which were retained with rationale. This record is the audit evidence.

5. **Update the enforcement system**: permissions flagged for removal must be removed from the actual enforcement configuration, not just the documentation. Certification that results in documentation changes without enforcement changes does not satisfy SOC 2 CC6.1.

### Policy-as-Code: OPA for Agent Permission Enforcement

Open Policy Agent (OPA) is the industry-standard tool for policy-as-code enforcement. Agent permission rules written in OPA's Rego language are declarative, testable, and version-controlled in Git. The Git history of OPA policy files is a governance record: every permission change includes the author, date, and commit message explaining the justification.

A basic OPA rule enforcing agent tool allowlists:

```rego
package agent.authz

default allow = false

allow {
    input.agent_role == "research-reader"
    input.tool in {"web_search", "read_blackboard", "memory_search"}
}

allow {
    input.agent_role == "content-writer"
    input.tool in {"write_file", "save_artifact", "write_blackboard", "memory_save"}
}
```

Every tool call is evaluated against this policy before execution. A `research-reader` agent attempting to call `write_blackboard` receives a deny decision — not because the agent was instructed not to, but because the structural enforcement layer rejected the call. The deny decision is logged, creating an audit record of the attempted permission violation.

The governance benefit of policy-as-code over configuration-based ACLs: the policy is reviewable by non-technical governance stakeholders (a compliance officer can read Rego rules with training), testable with automated test suites, and subject to pull request review before deployment — which is a change control process that satisfies SOC 2 CC8.1 (Change Management).

## Audit Trail Design for Agent Governance

### The Minimum Governance Record: Twelve Required Fields

An agent action log entry that satisfies governance requirements must capture:

1. **timestamp_utc_ms** — millisecond precision UTC; enables reconstruction of multi-agent interaction sequences
2. **agent_id** — instance-level unique identifier; not the role name
3. **agent_role** — the role definition version in effect at the time of the action
4. **action_type** — tool_call, blackboard_write, blackboard_read, agent_message, llm_call, external_http
5. **action_target** — tool name, blackboard key, recipient agent ID, or external domain
6. **arguments_sanitized** — arguments with credential values redacted; do not log plaintext keys
7. **result_summary** — success/failure and a brief outcome description; not the full response body
8. **session_id** — the task or session that generated this action; links related actions
9. **human_operator_id** — the human who authorized or triggered the session, if applicable
10. **budget_consumed_usd** — token cost of the action, if an LLM call
11. **decision_source** — whether the action was autonomous or human-approved via HITL
12. **policy_version** — the OPA or ACL policy version that authorized the action

The most common governance gaps in agent audit trails: missing blackboard writes (treated as internal state, not logged), missing agent-to-agent messages (treated as internal communication), and missing the `human_operator_id` field (making it impossible to trace a sequence of agent actions back to the authorizing human).

### Immutability and Retention: Minimum Standards by Framework

Immutability means the log cannot be modified after the fact — not by the agent, not by the agent owner, not by an administrator with database access. Append-only storage satisfies this: each new entry is appended, and the storage system prevents modification of existing entries. Write-once object storage (S3 Object Lock, GCS Bucket Lock) is a common implementation. Cryptographic chaining — where each log entry includes the hash of the previous entry — provides tamper evidence even in systems without storage-level write-once enforcement.

Retention minimums:
- **90 days**: operational review (enough to reconstruct any incident within the standard incident response window)
- **12 months**: SOC 2 Type II evidence (auditors review the full prior-year period)
- **Operational lifetime + additional period**: EU AI Act Article 9 high-risk systems (the regulation specifies logs must be kept for a period appropriate to the purpose; the EDPB recommends the operational lifetime of the system plus any applicable statutory period)

Design retention tiers: hot storage (queryable) for 90 days, cold storage (archived, retrievable on request) for 12 months, deep archive for EU AI Act compliance periods. The cost difference between hot and cold storage is significant at scale — a fleet generating 100,000 log entries per day at 500 bytes per entry accumulates 1.5GB/month in hot storage.

### Anomaly Detection on Agent Audit Trails

Governance requires not just recording agent actions but detecting when recorded actions deviate from expected patterns. Three anomaly categories with governance relevance:

**Permission boundary anomalies**: an agent attempting a tool call that its role's ACL does not permit. Each denied call should generate an alert. A pattern of denied calls from the same agent role signals either an insufficient permission boundary (the role needs more permissions for legitimate tasks) or a compromise attempt (the agent is being directed to exceed its permissions). The [AI agent observability guide](/learn/ai-agent-observability) covers threshold and frequency-based anomaly detection implementation.

**Cost anomalies**: an agent exceeding its expected cost-per-task baseline by more than 2x standard deviation. Single-instance spikes may be legitimate (a complex task); sustained elevation indicates a runaway pattern or a change in task distribution that has not been reviewed and approved.

**Off-hours or off-pattern activity**: agent actions occurring outside the expected operational window (for scheduled agents) or using tool categories the agent has not historically used. Both require human review before being classified as legitimate.

## Governance Program Structure: From Controls to Committee

Governance controls are necessary but not sufficient. A governance program requires organizational structure to ensure controls are maintained, reviewed, and improved over time.

### Governance Committee and Ownership

Each agent role in production requires a designated owner — a named human accountable for the role's behavior, permissions, and compliance with acceptable use policy. The owner is responsible for the quarterly access certification, for responding to anomaly alerts within the SLA, and for initiating the kill switch procedure when warranted.

A governance committee (or equivalent function) is responsible for:

- Approving new agent roles before deployment to production
- Reviewing and approving changes to existing role permission boundaries
- Reviewing the quarterly access certification outcomes
- Reviewing incident reports involving agent misbehavior
- Maintaining the acceptable use policy and ensuring it reflects current regulatory requirements

For small teams, the governance committee may be a single designated reviewer with documented authority. For enterprises, it typically includes representatives from security, legal/compliance, and the business function owning the agent deployment.

### Acceptable Use Policy for Agent Systems

An acceptable use policy (AUP) for agent systems documents what agents are and are not authorized to do, in plain language. The AUP is the governance document that non-technical stakeholders — legal, compliance, executives — can review and approve. It defines:

- Which categories of tasks agents are authorized to perform
- Which external services agents may interact with
- What data agents may access and how long they may retain it
- What constitutes unauthorized agent use and the consequences
- How humans can report suspected agent misbehavior

The AUP is referenced in EU AI Act Article 9 risk management documentation and in NIST AI RMF GOVERN 1.1 policy documentation. It is not a technical document — it should be written for a non-technical compliance audience.

### Incident Response Plan for Agent Misbehavior

Every governed agent deployment needs an incident response plan that specifically covers agent misbehavior: what happens when an agent takes an action outside its authorized scope, generates harmful output, or causes a cost overrun. The plan must specify:

- Who is notified and in what order (agent owner, governance committee, security team, legal if data is involved)
- The procedure for halting the agent (the kill switch procedure, verified tested monthly)
- The evidence preservation procedure (freezing the audit trail for the incident period before any administrative actions that might affect logs)
- The post-incident review process (root cause, control failure, remediation action, review date)

The incident response plan is required by NIST AI RMF MANAGE 1.3 and is the operational evidence that governance controls are actively maintained rather than documented and ignored.

## OpenLegion's Take

Enterprise adoption of AI agents in 2026 is running ahead of governance program development. EU AI Act Article 9 applies from August 2026 — organizations deploying high-risk agent systems need documented risk management systems in place before that date. NIST AI RMF Govern function requirements have been published since January 2023 and are increasingly referenced in enterprise procurement questionnaires alongside SOC 2 CC6.1 and CC7.2.

The technical controls — RBAC, immutable logs, budget caps, kill switches — are implementable in weeks. The governance program — committee structure, quarterly access certification, acceptable use policy, incident response plan — takes longer because it requires organizational decisions about accountability, not just technical configuration. The bottleneck is not tooling; it is the organizational will to assign named owners and run quarterly reviews.

OpenLegion's mesh encodes governance controls structurally: Zone 2 ACL enforcement means permission boundaries cannot be self-policed away, the append-only audit trail means logs cannot be modified, and the Zone 2 Cost Tracker means budget governance is not optional. The governance program — documentation, reviews, committee structure — is the organization's responsibility. The platform provides the enforcement substrate and the audit evidence. Organizations that treat governance as a compliance checkbox rather than an operational practice will find their controls failing the first time an agent acts outside its intended scope.

For the technical security layer that defends against external threats (as distinct from governance), see the [AI agent security guide](/learn/ai-agent-security). For the observability implementation that generates CC7.2 monitoring evidence, see [AI agent observability](/learn/ai-agent-observability). For sandboxing controls that harden agent containers, see [AI agent sandboxing](/learn/ai-agent-sandboxing).

## Get Started

**Governance-ready agent deployment with Zone 2 ACL enforcement, immutable audit trails, and per-agent budget caps.**
[Start Building on OpenLegion](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai) | [Explore AI Agent Security](/learn/ai-agent-security)

---

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent governance and why is it different from AI agent security?

AI agent governance is the institutional control layer: defining authorized permissions, recording every action in an immutable audit trail, enforcing cost boundaries, and ensuring agents can be stopped. Security defends against external adversaries — attackers, prompt injectors, supply chain compromises. Governance answers to internal stakeholders — regulators, auditors, finance committees, and risk functions. Both are required in production, but they address different failure modes and require different documentation.

### Does the EU AI Act apply to AI agent deployments?

EU AI Act Article 9, applying from August 2026, requires high-risk AI systems to implement a risk management system throughout the system's lifecycle. High-risk categories include systems used in employment, access to essential services, critical infrastructure, education, and law enforcement. Organizations deploying agent systems in these domains must maintain a risk register, documented controls, and periodic review evidence. The technical controls covered in this guide are the implementation; Article 9 also requires they be documented, reviewed at least annually, and kept current.

### What SOC 2 criteria cover AI agent systems?

SOC 2 Trust Service Criteria CC6.1 (Logical Access Controls) and CC7.2 (System Monitoring) are the primary criteria for agent governance. CC6.1 requires access restricted to authorized users with periodic access reviews — satisfied by per-agent role RBAC with quarterly access certification. CC7.2 requires monitoring for anomalies — satisfied by immutable audit trails with anomaly detection rules. SOC 2 auditors require 12 months of log retention as audit evidence.

### What is a quarterly access certification for agent systems?

A quarterly access certification is a formal review of every agent role's permissions. An independent reviewer (not the agent owner) examines each permission the agent holds, confirms it is justified by a current task requirement, and documents the outcome. Permissions without documented justification are removed from the enforcement configuration. The record — reviewer identity, date, permissions removed or retained with rationale — is the SOC 2 CC6.1 access review evidence and satisfies the OWASP LLM06 least-privilege governance requirement.

### What fields must an agent audit log include for governance purposes?

A governance-compliant agent audit log entry requires at minimum: millisecond-precision UTC timestamp, instance-level agent ID, agent role and policy version, action type, action target, sanitized arguments, result summary, session ID, human operator ID, budget consumed, decision source, and the policy version that authorized the action. The most common governance gaps are missing blackboard writes, missing agent-to-agent messages, and missing the human operator ID that links agent actions back to an authorizing human.

### How long must agent audit logs be retained?

Minimum 90 days for operational incident review. SOC 2 Type II audits require 12 months of evidence — design retention accordingly. EU AI Act Article 9 high-risk systems require logs for the operational lifetime of the system plus any applicable statutory period. Use tiered storage: hot queryable storage for 90 days, cold archived storage for 12 months, deep archive for long-term regulatory requirements.

### What is the stoppability requirement for governed agent systems?

Every governed agent system requires a documented procedure to halt any running agent within 60 seconds, tested at least monthly. EU AI Act Article 14 requires human oversight mechanisms including the ability to intervene and stop AI systems. A kill switch that exists in documentation but has not been tested does not satisfy this requirement. The halt event must be logged to the immutable audit trail with the operator identity, timestamp, and the agent's last recorded state.

### What is OWASP LLM06 Excessive Agency and how does governance address it?

OWASP LLM06 (Excessive Agency, LLM Top 10 2025) identifies agents with permissions beyond what their tasks require as a primary failure mode — excess permissions amplify the impact of any other failure including prompt injection or model error. The governance mitigation is a formal quarterly access review: enumerate every tool and permission the agent holds, document the task requirement for each, remove unjustified permissions, and record the outcome. This process simultaneously satisfies LLM06, EU AI Act Article 9 periodic review, and SOC 2 CC6.1 access certification requirements.
