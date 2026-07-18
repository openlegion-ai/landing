---
title: "AI Agent Versioning — Model Pinning, Prompt SemVer, and Behavior Drift"
description: "AI agent versioning: model snapshot pinning, SemVer 2.0.0 prompt contracts, behavior drift detection, rollback, EU AI Act Article 12 August 2026, and NIST AI RMF GOVERN 1.7 documentation."
slug: /learn/ai-agent-versioning
primary_keyword: ai agent versioning
last_updated: "2026-07-18"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-governance
  - /learn/ai-agent-testing
  - /learn/ai-agent-observability
  - /learn/ai-agent-deployment
  - /learn/agentic-workflows
  - /learn/ai-agent-debugging
---

# AI Agent Versioning: Model Pinning, Prompt SemVer, and Behavior Drift Detection

AI agent versioning is the practice of explicitly tracking all components that affect agent behavior — pinned model snapshot, versioned system prompt, and inter-agent hand-off contract format — so behavior changes are intentional rather than silent. Chen et al. 2023 documented GPT-4 code generation declining from 52% to 10% between March and June 2023 snapshots without announcement; EU AI Act Article 12 enforcement begins August 2026. Calling 'gpt-4o' instead of 'gpt-4o-2024-08-06' is an uncontrolled behavior change.

<!-- SCHEMA: DefinitionBlock -->

> **AI agent versioning** is the practice of explicitly tracking and controlling all components of an AI agent system that affect its behavior — the pinned model snapshot identifier (`gpt-4o-2024-08-06`, `claude-3-5-sonnet-20241022`), the versioned prompt and system message (using Semantic Versioning 2.0.0 to signal breaking vs backward-compatible changes), the tool schema version, and the inter-agent hand-off contract format — so that behavior changes are intentional and traceable, regressions can be detected before production deployment, and the system's state at any prior point can be reconstructed for audit or rollback.

## The Silent Drift Problem: Why Non-Pinned Models Fail in Production

### GPT-4 Behavior Drift: The Chen et al. 2023 Evidence

**Chen et al. 2023 (arXiv:2307.09009, Stanford and UC Berkeley)** conducted the first systematic study of GPT-4 behavior drift across API versions. The study compared `gpt-4-0314` (March 2023 snapshot) and `gpt-4-0613` (June 2023 snapshot) using identical prompts and benchmarks:

- **Code generation task pass rate: 52% to 10%** — a 42-point decline between March and June 2023
- **Math problem solving (chain-of-thought format compliance): 84% to 51%** — a 33-point decline

The regression was not announced by OpenAI. Teams calling the non-pinned `'gpt-4'` alias received the June snapshot automatically upon its release — experiencing different production behavior with no notification. The only teams that detected the regression were running systematic behavioral evaluation suites; teams without evals did not know their agent had changed.

This is the canonical evidence that non-pinned model aliases deliver uncontrolled behavior changes. Any agent deployment relying on an alias like `'gpt-4o'` or `'claude-3-5-sonnet-latest'` implicitly accepts that its behavior may change at any provider-determined time.

**Three categories of silent drift:**

1. **Capability regression** — measurable task performance decline on benchmarks, as in the Chen et al. case; code that passed previously fails; math that was solved correctly is now incorrect
2. **Format drift** — output format changes without capability regression; the model starts including markdown where it returned plain text, breaking a downstream parser or JSON extraction step; no error is raised, behavior is simply wrong
3. **Safety behavior drift** — the model refuses requests it previously handled; more common after safety fine-tuning updates; an agent that previously answered a category of question now returns a refusal, causing silent task failure

When a version regression reaches production without detection, reconstructing what changed and why requires the trace replay and post-mortem tools covered in [AI agent debugging and post-mortem analysis after version regressions](/learn/ai-agent-debugging).

### Provider Versioning Policies: OpenAI Snapshots and Anthropic Sunset

Understanding provider policies determines how much runway exists between a model update and production impact:

**OpenAI pinned snapshots:**

| **Pinned snapshot** | **Date** | **Notes** |
|---|---|---|
| **`gpt-4o-2024-08-06`** | August 6, 2024 | Current gpt-4o snapshot; structured outputs support |
| **`gpt-4-0613`** | June 13, 2023 | gpt-4 stable snapshot |
| **`gpt-4o-mini-2024-07-18`** | July 18, 2024 | gpt-4o-mini snapshot |

OpenAI policy: **pinned model snapshots are guaranteed available for at least 12 months after a deprecation notice is issued**. Non-pinned aliases (`'gpt-4o'`, `'gpt-4o-mini'`) are updated to newer snapshots without notice. Deprecation notices are published via the OpenAI platform changelog and email to API customers.

**Anthropic model versioning and sunset policy:**

Anthropic uses explicit date-versioned model IDs: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`. Non-date aliases (`claude-3-5-sonnet-latest`) point to the current latest version and change without notice.

**Anthropic deprecation policy: minimum 6-month notice** before API access is removed for any deprecated model version. The first model under this policy: `claude-3-opus-20240229`.

**Critical distinction:** the `anthropic-version: 2023-06-01` API header pins the Anthropic API response *schema* version — not the model version. These are separate concerns and must both be pinned independently.

**Google Gemini versioning:**

`gemini-1.5-pro-002` (second stable release), `gemini-1.5-flash-002`. The non-versioned alias `gemini-1.5-pro` points to the current latest. Google's deprecation policy: minimum 6 months notice before removal.

**Recommended production policy:**

```yaml
# config/models.yaml — version-controlled model pinning
models:
  orchestrator: "claude-3-5-sonnet-20241022"   # pinned snapshot
  classifier: "gpt-4o-mini-2024-07-18"         # pinned snapshot
  embedder: "text-embedding-3-small"            # model family, stable

# Calendar reminder: check deprecation notices at (deprecation_date - 5 months)
# Run behavioral evaluation suite before updating any pinned snapshot
```

Store pinned model IDs in version-controlled configuration, not hardcoded in application code. Track each pinned snapshot's deprecation date in your team calendar — update promptly to avoid forced migration under deadline.

## SemVer for Prompt Contracts: Versioning What the Model Receives

### Applying Semantic Versioning 2.0.0 to System Prompts

**Semantic Versioning 2.0.0** (semver.org, Tom Preston-Werner, 2013) defines `MAJOR.MINOR.PATCH` versioning where:

- **MAJOR**: breaking change — existing consumers of the output *must* update before deploying the new version
- **MINOR**: backward-compatible addition — new capabilities without breaking existing consumers
- **PATCH**: backward-compatible fix — no behavior consumers depend on has changed

Applied to agent system prompts and tool schemas:

**MAJOR version bump** — any change that:
- Alters the output schema: adds, removes, renames, or changes the type of a required field
- Changes the tool call format: adds a required parameter, renames a tool, changes argument encoding
- Changes the agent's fundamental behavioral contract (`'always respond in JSON'` to `'respond in markdown'`)

Downstream agents, parsers, and integrations consuming this agent's output *must be updated before the new prompt version is deployed*.

**MINOR version bump** — changes that:
- Add new optional output fields (consumers can ignore them)
- Expose new tool capabilities backward-compatible with existing consumers
- Extend system prompt with new capabilities that do not alter existing output format

**PATCH version bump** — changes that:
- Fix prompt clarity: remove ambiguous phrasing that caused inconsistent behavior
- Add few-shot examples to improve output consistency
- Tighten constraints on existing parameters
- No change to output schema or behavior that consumers depend on

**Version tag format:** `{agent-name}-prompt:{MAJOR}.{MINOR}.{PATCH}`

```bash
# Example version tags in git
research-agent-prompt:2.1.4
classifier-agent-prompt:1.0.0
summarizer-agent-prompt:3.0.0   # MAJOR: switched from plain text to JSON output
```

Store prompt files in git as text files (`prompts/research-agent/system_prompt.txt`). Tag every MAJOR and MINOR release. PATCH changes can be batched.

### Prompt Diffing and Change Documentation

Prompt versioning requires the same change documentation discipline as code versioning.

**Git as the prompt store:**

Every prompt change creates a commit with a descriptive message and a semantic version tag on the commit that introduces the change:

```
commit abc123
feat(research-agent): v2.1.0 Add optional citation_sources field to output schema

MINOR: citation_sources array added (default: null). Backward compatible
-- existing parsers that do not read citation_sources are unaffected.
```

`git diff research-agent-prompt:2.0.0 research-agent-prompt:2.1.0` shows exactly what changed between versions.

**CHANGELOG.md format for prompt versions:**

```markdown
## research-agent-prompt

### [2.1.0] — 2026-07-18
#### Added
- Optional `citation_sources` array in JSON output (default: `null` if no sources found)
#### Breaking Changes
None — citation_sources is optional; existing parsers unaffected.

### [2.0.0] — 2026-06-15
#### Breaking Changes
- `output_format` changed from plain text to structured JSON with required fields:
  `summary` (string), `confidence` (float 0-1), `sources` (array)
#### Migration
Update all downstream parsers to expect JSON response:
- Add `json.loads()` around agent output
- Handle `confidence` field as `0.0` default if absent
- Handle `sources` as empty list if not present
```

**Prompt hash as behavior fingerprint:**

```python
import hashlib

def get_prompt_hash(system_prompt: str) -> str:
    """SHA-256 hash of prompt — log with every LLM call."""
    return hashlib.sha256(system_prompt.encode()).hexdigest()[:16]

# Log with every API call
prompt_hash = get_prompt_hash(system_prompt)
logger.info("llm_call", model=model_id, prompt_hash=prompt_hash,
            prompt_version=PROMPT_VERSION)
```

If two consecutive LLM calls have different prompt hashes despite no intended change, an unintended modification occurred — a template interpolation bug, environment variable substitution failure, or accidental prompt concatenation. The hash surfaces the problem immediately rather than after behavioral anomalies accumulate in production.

**Prompt templates and variable injection:** document which variables are injected into the prompt template (`{user_name}`, `{current_date}`, `{tool_list}`) and treat changes to the injection logic as version changes — a bug in variable injection can silently alter behavior as severely as a direct prompt change.

For the evaluation suite tooling — golden datasets, LLM-graded correctness, and CI integration — that powers version-gate regression detection, see [AI agent testing and behavioral evaluation suite design](/learn/ai-agent-testing).

## Behavioral Regression Detection Across Model Versions

### Behavioral Evaluation Suites as Version Gates

A behavioral evaluation suite is a set of fixed input-output pairs that characterize the agent's expected behavior. Running the suite before and after any version change detects regressions before they reach production.

**Components of a behavioral evaluation suite:**

**1. Golden dataset (50-200 test cases):**

```python
golden_dataset = [
    {
        "input": {"message": "Summarize this paper in 3 bullet points.", "document": "..."},
        "expected": {
            "type": "json_schema",
            "schema": {"type": "object", "properties": {"bullets": {"type": "array", "minItems": 3, "maxItems": 3}}},
        },
        "tags": ["core_use_case", "format_compliance"]
    },
    {
        "input": {"message": "What is 2+2?"},
        "expected": {"type": "contains", "value": "4"},
        "tags": ["basic_reasoning", "safety_critical"]
    },
    # ... edge cases and previously-observed failure modes
]
```

Test cases cover: primary use cases (>=60%), edge cases (>=25%), previously-observed failure modes (>=15%), and safety-critical cases (flagged separately — any regression here is a blocking failure regardless of overall pass rate).

**2. Regression threshold:**

```python
REGRESSION_THRESHOLD = 0.95  # new version must maintain >=95% of golden dataset pass rate
SAFETY_REGRESSION_BLOCKING = True  # any safety-critical test failure blocks deployment

def evaluate_version(model_id: str, prompt_version: str, dataset: list) -> dict:
    results = run_eval_suite(model_id, prompt_version, dataset)

    overall_pass_rate = results["pass"] / results["total"]
    safety_pass_rate = results["safety_pass"] / results["safety_total"]

    return {
        "approved": overall_pass_rate >= REGRESSION_THRESHOLD and safety_pass_rate == 1.0,
        "overall_pass_rate": overall_pass_rate,
        "safety_pass_rate": safety_pass_rate,
        "regressions": results["failed_cases"]
    }
```

**3. Output distribution comparison:**

For generative outputs where exact match is too strict, compare output distributions using embedding cosine similarity:

```python
import numpy as np
from openai import OpenAI

client = OpenAI()

def compare_output_distributions(
    baseline_outputs: list[str],
    candidate_outputs: list[str]
) -> float:
    """Compare output distributions between model versions.
    Returns mean cosine similarity (>=0.85 = acceptable, <0.85 = significant drift)."""

    def embed(texts):
        resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
        return np.array([r.embedding for r in resp.data])

    baseline_emb = embed(baseline_outputs)
    candidate_emb = embed(candidate_outputs)

    # Pair-wise cosine similarity (same inputs, different model versions)
    similarities = np.sum(baseline_emb * candidate_emb, axis=1) / (
        np.linalg.norm(baseline_emb, axis=1) * np.linalg.norm(candidate_emb, axis=1)
    )
    return float(np.mean(similarities))

# mean cosine similarity < 0.85 indicates significant behavioral drift
```

**4. Format compliance tests:**

```python
import json, jsonschema

def test_format_compliance(model_id: str, prompt_version: str, n: int = 100) -> float:
    """Test that the model reliably returns valid JSON matching the expected schema."""
    schema = load_output_schema(prompt_version)
    passed = 0
    for _ in range(n):
        output = call_agent(model_id, prompt_version)
        try:
            parsed = json.loads(output)
            jsonschema.validate(parsed, schema)
            passed += 1
        except (json.JSONDecodeError, jsonschema.ValidationError):
            pass
    return passed / n
```

**5. Latency and cost regression:**

A new model version may produce equivalent quality at 2x the latency or 3x the token cost. Track P50 and P95 latency and mean input/output tokens per call in the evaluation suite alongside quality metrics.

### Canary Deployment for Agent Version Rollout

Canary deployment routes a fraction of production traffic to the new agent version before full rollout, enabling regression detection under real production conditions — real user inputs, real data, real downstream integrations.

**Canary rollout pattern for agent systems:**

```
Phase 1: Shadow mode (0% user-visible)
  -> Run new version on all inputs; discard output
  -> Compare internally against current version output
  -> If output distribution similarity >= 0.85: proceed to canary

Phase 2: 5% canary
  -> Route 5% of production traffic to new version
  -> Monitor: task success rate, format compliance, latency, downstream errors
  -> Alert threshold: >5% relative degradation on any metric vs current version
  -> Duration: 24 hours with no alerts before expanding

Phase 3: Progressive rollout
  -> 10% -> 25% -> 50% -> 100%
  -> 24-hour hold at each stage

Phase 4: Full deployment
  -> Current version retained as fallback for 72 hours
  -> Rollback trigger: automated if regression alert fires
```

**Rollback for stateful agents:**

For agent systems with stateful checkpoints (LangGraph `PostgresSaver`), ensure the checkpoint schema is backward-compatible with the rolled-back version. A MAJOR version bump to the checkpoint schema requires coordinated rollback of the checkpoint store — store checkpoint schema version alongside the checkpoint and validate on read.

```python
# Checkpoint schema validation on read
def load_checkpoint(checkpoint_id: str) -> dict:
    raw = checkpoint_store.get(checkpoint_id)
    if raw["schema_version"].split(".")[0] != CURRENT_SCHEMA_MAJOR:
        raise IncompatibleCheckpointVersion(
            f"Checkpoint uses schema {raw['schema_version']}, "
            f"agent requires {CURRENT_SCHEMA_MAJOR}.x.x"
        )
    return raw["state"]
```

For the observability instrumentation — OTel GenAI spans, task success rate dashboards, and latency monitoring — that surfaces behavioral regression during canary rollouts, see [AI agent observability and production behavior monitoring](/learn/ai-agent-observability).

## Inter-Agent Interface Contracts as Versioned APIs

### Hand-Off Brief Format as a Versioned Contract

In a multi-agent system, when agent A hands off to agent B, the data format of the hand-off brief is a contract between the two agents. If agent A's prompt is updated to produce a different format — renames a field, changes a field's type, adds a required field — agent B silently fails to parse the brief correctly, producing wrong behavior without an explicit error.

**Treating the hand-off format as a versioned API surface:**

```python
# Hand-off payload schema (versioned)
from pydantic import BaseModel
from typing import Literal

class ResearchBriefV2(BaseModel):
    schema_version: Literal["2.1.0"]  # SemVer — validated on receipt
    topic: str
    depth: Literal["surface", "deep", "exhaustive"]
    sources: list[str] = []           # Optional, added in v2.1
    deadline_iso8601: str | None = None

# Agent B validates schema_version on receipt
def receive_handoff(raw_payload: dict) -> ResearchBriefV2:
    schema_version = raw_payload.get("schema_version", "1.0.0")
    major = int(schema_version.split(".")[0])

    if major != 2:
        raise IncompatibleHandoffVersion(
            f"Cannot process schema_version {schema_version}: "
            f"expected major version 2"
        )

    return ResearchBriefV2(**raw_payload)
```

**Deployment coordination for MAJOR version bumps:**

```
WRONG — deploy sending agent first:
  1. Deploy agent A with new format (schema_version: 2.0.0)
  2. Agent B receives v2.0.0 payload but only understands v1.x.x
  3. Silent failure or explicit IncompatibleHandoffVersion error
  4. Deploy agent B with v2.0.0 support

CORRECT — deploy receiving agent first:
  1. Deploy agent B v2 — accepts both v1.x.x AND v2.0.0 during transition
  2. Deploy agent A — now sends v2.0.0 payloads
  3. Remove v1.x.x compatibility from agent B (PATCH version bump)
```

**Rollback compatibility matrix:**

```yaml
# compatibility-matrix.yaml — track which versions can interoperate
agent_pairs:
  - sender: research-agent
    receiver: summarizer-agent
    compatible:
      - sender_versions: "3.x.x"
        receiver_versions: ">=2.1.0"
      - sender_versions: "2.x.x"
        receiver_versions: ">=1.0.0, <3.0.0"
```

For the full multi-agent coordination architecture — orchestration patterns, hand-off protocols, and agent role design — that the versioned interface contracts govern, see [agentic workflows and multi-agent coordination patterns](/learn/agentic-workflows).

### Agent Manifests: Versioning the Full Agent Configuration

An agent manifest is a version-controlled document that captures the complete configuration of an agent at a specific deployment version, enabling full reconstruction of the agent's state at any prior point.

**Agent manifest format (YAML):**

```yaml
# manifests/research-agent-v3.2.1.yaml
agent_id: research-agent
version: "3.2.1"
deployed: "2026-07-18T09:00:00Z"
deployed_by: ci-pipeline

model:
  id: claude-3-5-sonnet-20241022           # pinned snapshot
  provider: anthropic
  deprecation_date: "2026-10-22"           # calendar reminder set
  deprecation_check_date: "2026-05-22"     # 5 months before

system_prompt:
  version: "2.1.4"                         # SemVer tag
  git_hash: abc123def456
  sha256: f4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5  # behavior fingerprint

tools:
  - name: search_web
    schema_version: "1.0.2"
  - name: read_file
    schema_version: "1.1.0"

hand_off:
  name: research-brief
  schema_version: "2.1.0"                 # what this agent produces

consumes_from:
  - agent: orchestrator
    hand_off_schema:
      name: task-assignment
      min_version: "1.0.0"
      max_version: "1.x.x"               # max compatible MAJOR

evaluation:
  suite_version: "3.0.0"
  pass_rate: 0.97
  safety_pass_rate: 1.00
  output_similarity: 0.92               # vs previous version
  run_date: "2026-07-18"
```

The manifest is committed to git with a semantic version tag matching the `version` field. The CI/CD pipeline generates the manifest automatically from configuration files on every deployment. The manifest enables:

- **Rollback**: reconstruct the exact agent configuration at any prior deployment by checking out the corresponding manifest
- **Compliance**: satisfies NIST AI RMF GOVERN 1.7 (version-controlled documentation of AI model configurations) and EU AI Act Annex IV (description of system versions and changes throughout lifecycle)
- **Incident reconstruction**: given a production incident timestamp, identify which manifest version was deployed and compare prompt hash against current version

## Compliance: EU AI Act and NIST AI RMF Documentation Requirements

### EU AI Act Article 12 and Article 11 Technical Documentation

**EU AI Act (Regulation EU 2024/1689):** high-risk AI system provisions are enforceable from **August 2, 2026**.

**Article 11** requires providers of high-risk AI systems to draw up technical documentation before placing the system on the market and keep it up to date throughout the lifecycle.

**Article 12** requires logging capabilities including identification of the persons involved in use of the system and the principal changes made to the system.

**Annex IV** specifies the technical documentation content:
- A general description of the AI system including a description of the versions of the software or firmware
- **A description of the changes made to the system through its lifecycle** — this requires a version-controlled changelog, not a static document; every model version change, prompt version change, and tool schema change must be documented with the date, nature of the change, and responsible party

**Which AI systems qualify as high-risk (Annex III):**
- Employment and workers management (CV screening, interview scheduling, performance evaluation)
- Education and vocational training (student assessment, exam proctoring)
- Access to essential services (credit scoring, insurance pricing, public benefit eligibility)
- Law enforcement, migration and asylum, administration of justice

**Non-compliance penalties:** up to **30M EUR or 6% of global annual turnover** for violations of documentation requirements.

**Practical implementation:** an agent manifest (as described above) satisfies Annex IV documentation requirements if it is generated automatically by the CI/CD pipeline on every deployment, committed to git with a semantic version tag, and includes model version, prompt version, tool schema versions, evaluation results, deployment timestamp, and deployed_by identity. The git history of the manifest file constitutes the version-controlled changelog Article 12 requires.

### NIST AI RMF 1.0: GOVERN 1.7 and MANAGE 2.2

**NIST AI RMF 1.0** (January 26, 2023): voluntary framework for managing AI risks, widely adopted as the de facto standard for US federal contractors and enterprise AI governance programs.

**GOVERN 1.7:** `Processes and procedures are in place for the periodic review, update, and improvement of AI risk management practices, including version-controlled documentation of AI model configurations.`

The NIST AI RMF Playbook elaborates: maintain a version-controlled model card for each production AI system including model version, training data version, evaluation benchmark results, and known limitations — updated on every production deployment.

**MANAGE 2.2:** `Mechanisms are in place to inventory AI systems and models used within the organization, including version information.`

This requires an AI system inventory with current and historical version information — not just a snapshot of current deployments. The agent manifest provides this: each production deployment generates a manifest, and the history of manifests in git constitutes the version inventory MANAGE 2.2 requires.

**MAP 2.3:** `Scientific findings, domain expertise, laws, regulations, and standards informing context-specific AI risk and benefit analysis are used.`

For LLM-based agents, this includes tracking provider model version policies as documented risk factors in the AI risk register:
- OpenAI: pinned snapshots available for 12 months after deprecation notice
- Anthropic: minimum 6-month deprecation notice
- Google Gemini: minimum 6-month notice

A snapshot nearing its deprecation date is a known risk that should appear in the MANAGE 2.2 inventory with a remediation plan.

For the organizational governance layer above versioning — accountability chains, human oversight mechanisms, and regulatory alignment for AI agent systems — see [AI agent governance and accountability frameworks for production deployments](/learn/ai-agent-governance).

## OpenLegion's Take: Versioning Is an Architectural Property, Not a Documentation Task

The most dangerous model upgrade is the one the team does not know happened. Chen et al. 2023 (arXiv:2307.09009) documented it: GPT-4 code generation pass rate declined from 52% to 10% between March and June 2023 API versions, and teams calling the non-pinned `'gpt-4'` alias received the June behavior in production without notification. This is not a past problem — it will happen again with every provider model update that reaches a non-pinned alias.

Three concrete facts about versioning in production:

**Model pinning is one line of config, and not doing it is an implicit bet that providers will never silently change model behavior.** Using `gpt-4o` instead of `gpt-4o-2024-08-06` is the same risk posture as using `pip install openai` instead of `pip install openai==1.30.1` — except that an OpenAI model update can change output semantics in ways that a library patch rarely does. Pin every model ID. Track them in version-controlled configuration. Create calendar reminders when deprecation notices arrive: the OpenAI 12-month guarantee and Anthropic 6-month notice are useful, but the migration evaluation still takes time and should not happen under deadline pressure.

**The inter-agent hand-off contract is the versioning surface teams most commonly neglect.** In a multi-agent pipeline, when agent A's prompt is updated to produce a different JSON output schema, agent B will silently misparse it — no `JSONDecodeError`, no stack trace, just incorrect downstream processing. Including a `schema_version` field in every hand-off payload, validating it on receipt, and treating MAJOR version bumps as coordinated deployments (receiver first, then sender) eliminates this class of production failure entirely. The discipline is identical to any inter-service API contract: consumers define the version they require; producers honor it or explicitly break compatibility.

**EU AI Act Article 12 enforcement begins August 2, 2026, and the documentation requirement is a changelog, not a snapshot.** Annex IV requires `a description of the changes made to the system through its lifecycle` — not the current configuration, but the full history. A team that has been generating agent manifests on every CI/CD deployment and committing them to git already has this artifact. A team that has been storing model IDs in application code and changing them ad hoc does not, and reconstructing 18 months of model and prompt version history retroactively is a significant compliance risk.

| **Versioning property** | **OpenLegion** | **LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Agent profiles carry version metadata (model_id, prompt version, tool schema version, hand-off schema version) — full configuration reconstructable from profile at any prior deployment** | Yes — agent manifest per deployment | No — user-defined | No — user-defined | No — user-defined | No — user-defined |
| **Hand-off brief format versioned as SemVer contract — MAJOR version bumps block deployment until downstream agents are updated; breaking format changes explicit not silent** | Yes — schema_version validated on receipt | No — unversioned | No — unversioned | No — unversioned | No — unversioned |
| **Behavioral evaluation suite runs in CI on every model_id or prompt version change — regression blocks merge** | Yes — regression gate in CI | No — user-defined | No — user-defined | No — user-defined | No — user-defined |
| **Blackboard key schemas versioned — agents validate schema_version on every read; incompatible MAJOR version triggers explicit error** | Yes — schema_version enforced | No | No | No | No |
| **EU AI Act Article 12 audit trail generated automatically from agent manifests — changelog, deployment dates, and responsible parties** | Yes — CI/CD manifest generation | No | No | No | No |
| **Credential vault schema versioned independently of agent versions — vault schema MAJOR bumps coordinated with agent migrations** | Yes — vault schema versioned | No | No | No | No |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is AI agent versioning?

AI agent versioning is the practice of explicitly tracking and controlling all components of an AI agent that affect its behavior — the pinned model snapshot (`gpt-4o-2024-08-06`, `claude-3-5-sonnet-20241022`), the system prompt with a SemVer tag, the tool schema version, and the inter-agent hand-off contract format — so that behavior changes are intentional and traceable rather than silent. Without versioning, a provider update to a non-pinned model alias (`'gpt-4o'` instead of `'gpt-4o-2024-08-06'`) can change agent behavior in production without any notification, as documented by Chen et al. 2023 (arXiv:2307.09009) where GPT-4 code generation pass rate declined from 52% to 10% between March and June 2023 snapshots. EU AI Act Article 12 (enforcement August 2026) requires version-controlled technical documentation for high-risk AI systems; NIST AI RMF 1.0 GOVERN 1.7 requires version-controlled documentation of AI model configurations.

### How do I pin a model version to prevent behavior drift?

Use explicit date-versioned model identifiers in all production API calls: `gpt-4o-2024-08-06` instead of `gpt-4o`, `claude-3-5-sonnet-20241022` instead of `claude-3-5-sonnet-latest`, `gemini-1.5-pro-002` instead of `gemini-1.5-pro`; non-pinned aliases are updated to newer model snapshots by providers without notice and may exhibit significantly different behavior. OpenAI's policy guarantees that pinned model snapshots remain available for at least 12 months after a deprecation notice is issued; Anthropic's policy provides a minimum 6-month notice before removing API access to a deprecated model version. Store pinned model IDs in version-controlled configuration (environment variables or a config YAML in git), and run your behavioral evaluation suite against any new snapshot before updating the pinned version in production.

### What did the Chen et al. 2023 study find about GPT-4 behavior drift?

Chen et al. 2023 (arXiv:2307.09009, Stanford and UC Berkeley) compared GPT-4 behavior between the March 2023 snapshot (`gpt-4-0314`) and the June 2023 snapshot (`gpt-4-0613`) using identical prompts and benchmarks, finding significant capability regressions: code generation task pass rate declined from 52% to 10%, and math problem solving chain-of-thought format compliance declined from 84% to 51%. The regression was not announced by OpenAI and was only detected by the research team's systematic evaluation — teams calling the non-pinned `'gpt-4'` alias received the June snapshot automatically upon its release, experiencing different production behavior with no notification. This study is the canonical evidence that non-pinned model aliases in production agent systems are a risk factor requiring behavioral evaluation suites to detect silent regressions before they impact users.

### How do I apply SemVer to agent prompts and tool schemas?

Semantic Versioning 2.0.0 (MAJOR.MINOR.PATCH) applies to prompt contracts as follows: a MAJOR version bump signals a breaking change — the output schema changed, a required field was removed or renamed, or the tool call format changed — requiring downstream agents and parsers to update before deploying the new prompt version; a MINOR bump adds optional output fields or new capabilities without breaking existing consumers; a PATCH bump fixes prompt clarity or adds examples with no output schema change. Store prompt files in git with semantic version tags (`research-agent-prompt:2.1.4`) and maintain a CHANGELOG.md with breaking change descriptions and migration instructions for every MAJOR and MINOR version; include a `schema_version` field in every inter-agent hand-off payload so downstream agents can reject incompatible MAJOR versions with an explicit error rather than silently misparse the data.

### What is an agent manifest and what should it contain?

An agent manifest is a version-controlled YAML or JSON document that captures the complete configuration of an AI agent at a specific deployment version, enabling full reconstruction of the agent's state at any prior point in time. Required fields: `agent_id` and `version` (SemVer), `model.id` (pinned snapshot identifier), `system_prompt` version and git hash and SHA-256, tool schema versions for each registered tool, hand-off schema name and version, dependencies on other agents and their required hand-off schema versions, evaluation suite version and pass rate and run date, and deployment timestamp and responsible party. The manifest satisfies NIST AI RMF 1.0 GOVERN 1.7 (version-controlled documentation of AI model configurations) and EU AI Act Annex IV requirements if it is generated automatically by the CI/CD pipeline on every deployment and committed to git with a semantic version tag.

### What does EU AI Act Article 12 require for AI agent versioning?

EU AI Act (Regulation EU 2024/1689) Article 12 requires high-risk AI systems to maintain logging capabilities including identification of principal changes made to the system; Article 11 requires technical documentation to be drawn up before market placement and kept up to date throughout the lifecycle; Annex IV specifies that the documentation must include a description of the versions of the software or firmware and a description of the changes made to the system through its lifecycle — effectively requiring a version-controlled changelog for every model version, prompt version, and tool schema change. High-risk AI systems under Annex III include AI used in employment (CV screening, interview evaluation), education (student assessment), credit scoring, insurance pricing, and law enforcement; providers of these systems face penalties of up to 30M EUR or 6% of global annual turnover for non-compliance. The enforcement date for high-risk AI provisions is August 2, 2026.

### How do I detect behavioral regression when upgrading model versions?

Build a behavioral evaluation suite of 50-200 fixed input-output test cases covering primary use cases, edge cases, and previously-observed failure modes; run the suite against both the current model snapshot and the candidate new snapshot using identical prompts, and require the new version to maintain >=95% of the golden dataset pass rate (with any safety-critical test failure being a blocking condition regardless of overall pass rate). For generative outputs where exact match is too strict, compare output distributions by embedding N outputs from each version with identical inputs and computing mean cosine similarity — similarity below 0.85 indicates significant behavioral drift. Additionally, run format compliance tests (JSON schema validation on 100 test outputs) and latency or cost regression checks, then use canary deployment to route 5% of production traffic to the new version before full rollout, monitoring task success rate and downstream integration errors against the current version in parallel.

### How should inter-agent hand-off contracts be versioned?

Inter-agent hand-off contracts — the data format one agent sends to another — should be versioned with SemVer and validated on receipt: include a `schema_version` field in every hand-off payload, and have the receiving agent reject payloads with an incompatible MAJOR version with an explicit error rather than attempting to parse an incompatible format. A MAJOR version bump in the hand-off schema requires a coordinated deployment: update the receiving agent first (it must accept both old and new format during the transition window), then deploy the sending agent with the new format; deploying the sending agent first leaves the receiving agent unable to parse the new format during the gap. For rollback scenarios, maintain a compatibility matrix of which sending agent versions produce hand-off formats that the receiving agent's current version accepts.

## Version Every Layer Before the Regression Finds You

AI agent versioning is not a documentation task to complete before a compliance audit — it is an architectural property that determines whether production behavior is controlled or accidental. Pin model snapshots today. Tag prompt versions in git. Version hand-off schemas and validate on receipt. The Chen et al. 2023 code generation regression from 52% to 10% happened between the March and June 2023 GPT-4 snapshots, silently, to every team that was not pinning model versions. EU AI Act Article 12 enforcement begins August 2, 2026 — the changelog requirement applies to changes that already happened.

For the deployment infrastructure patterns — blue-green deployments, traffic routing, and container orchestration — that enable canary rollout and instant rollback, see [AI agent deployment and infrastructure patterns for version rollout](/learn/ai-agent-deployment).
