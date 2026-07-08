---
title: "LLM Fine Tuning: LoRA, QLoRA, Security Risks, and When to Fine-Tune"
description: "When and how to fine-tune LLMs: LoRA vs QLoRA vs full fine-tuning, OpenAI API pricing, GDPR Art. 17 PII-in-weights risk, catastrophic forgetting, fine-tuning vs RAG decision framework."
slug: /learn/llm-fine-tuning
primary_keyword: llm fine tuning
last_updated: "2026-07-08"
schema_types: ["FAQPage"]
related:
  - /learn/llm-cost-optimization
  - /learn/ai-agent-security
  - /learn/llm-gateway
  - /learn/llm-routing
  - /learn/ai-agent-observability
  - /learn/credential-management-ai-agents
---

# LLM Fine Tuning: LoRA, QLoRA, Security Risks, and the Decision Framework for Agents

LLM fine tuning is the process of adapting a pre-trained language model to a specific domain by continuing training on a curated dataset — updating all model weights (full fine-tuning) or only small added adapter matrices (LoRA, QLoRA). The decision between fine-tuning, RAG, and prompt engineering is not obvious: fine-tuning is the right tool for stylistic and structural behaviors with ≥100 labeled examples; it is the wrong tool for adding factual knowledge to a frequently-changing domain.

<!-- SCHEMA: DefinitionBlock -->

> **LLM fine tuning** is the process of adapting a pre-trained language model to a specific domain, task, or behavioral style by continuing training on a curated dataset — updating model weights (full fine-tuning) or a small set of added adapter weights (parameter-efficient fine-tuning, or PEFT) — so that the model reliably produces outputs appropriate for that domain without requiring long few-shot examples in every prompt.

## Fine-Tuning vs RAG vs Prompt Engineering: The Decision Framework

### When Fine-Tuning Is the Right Tool

Fine-tuning is the correct choice when all three of the following conditions are true:

**1. The behavior you need is stylistic or structural, not factual.** Fine-tuning reliably changes how a model writes — output format, tone, vocabulary, schema compliance. It is unreliable at adding new factual knowledge: the model may hallucinate facts not well-represented in the training data, and fine-tuned factual knowledge cannot be updated without retraining. RAG is the correct architecture for factual grounding on proprietary or frequently-changing knowledge.

**2. You have ≥100 high-quality labeled examples** (ideally ≥1,000). Fine-tuning on fewer examples tends to overfit — the model memorizes training examples without generalizing. Below 100 examples, few-shot prompt engineering almost always outperforms fine-tuning and is easier to iterate on.

**3. The domain is stable.** Fine-tuned knowledge becomes stale as the domain evolves. A model trained on last year's product catalog will be wrong about this year's products. RAG with an updated knowledge base is the correct architecture for facts that change faster than your retraining cadence.

Fine-tuning is particularly effective for:
- Teaching a specific JSON output schema for structured extraction tasks
- Adapting to a proprietary writing style (company tone, technical documentation format)
- Learning domain-specific terminology not present in the base model's training data
- Reducing prompt length by baking frequently-repeated instructions into model weights instead of the system prompt

For the runtime routing layer that decides which model (including fine-tuned variants) handles each agent task, see [LLM routing and per-agent model assignment](/learn/llm-routing).

### When RAG or Prompt Engineering Beats Fine-Tuning

**RAG outperforms fine-tuning when:**
- The domain changes frequently — product catalogs, legal regulations, news, pricing. Facts must be current; fine-tuned knowledge cannot be updated without retraining.
- Facts need to be auditable with citations. RAG surfaces the retrieved source alongside the answer; fine-tuned model knowledge is opaque — you cannot verify what the model "knows" or trace a specific claim to a source.
- Private documents contain PII or legal privilege constraints that prevent inclusion in a training dataset.
- The dataset is too small to fine-tune reliably (<100 examples).

**Prompt engineering outperforms fine-tuning when:**
- Iteration speed matters. Changing a system prompt takes seconds; retraining a fine-tuned model takes hours plus evaluation time.
- The task requires complex reasoning more than domain-specific memorization. For frontier models (GPT-4o, Claude 3.7 Sonnet), a well-engineered system prompt often matches or exceeds fine-tuned quality.
- You need to test multiple approaches quickly. Prompt changes are reversible; fine-tuning creates a new model artifact that must be evaluated and deployed.

**The most common mistake:** teams reach for fine-tuning when the model doesn't reliably follow complex instructions. The root cause is almost always an under-engineered prompt — the model is capable of the behavior but the instructions are ambiguous, incomplete, or buried under irrelevant context. Improving the system prompt is faster, cheaper, and far easier to iterate on than weight adaptation.

## Fine-Tuning Methods: Full Fine-Tuning, LoRA, and QLoRA

### Full Fine-Tuning: All Weights, Maximum Risk of Catastrophic Forgetting

Full fine-tuning updates all model parameters during training. For a 7B parameter model, all 7 billion weights are updated on every training step.

**Advantages:** maximum expressiveness — the model can learn any behavior representable in the weight space; highest potential quality on the target domain if sufficient training data exists.

**Disadvantages:**
- **Compute cost:** 7B model full fine-tuning requires approximately 40–80GB GPU RAM at fp16. A 70B model requires 4–8× A100 80GB GPUs running in parallel.
- **Catastrophic forgetting:** Stanford HELM (2023) measured **40–60% degradation in general reasoning benchmark performance** when full fine-tuning is applied to narrow domain datasets. The model overwrites the weight configurations that supported general-purpose reasoning in favor of configurations optimized for the narrow training distribution.
- **Storage:** a full fine-tuned checkpoint is the same size as the base model — a 7B model at fp16 ≈ 14GB per checkpoint.
- **No modularity:** a different domain requires a separate full model checkpoint.

Full fine-tuning is appropriate when the domain is fundamentally different from the base model's training distribution, the quality requirements justify the compute cost, and the fine-tuned model will be used only for the specific narrow task (so catastrophic forgetting of general capabilities is acceptable).

For monitoring fine-tuned model quality in production — tracking benchmark degradation over time and alerting on output distribution shifts — see [AI agent observability and fine-tuned model quality monitoring](/learn/ai-agent-observability).

### LoRA: 10,000× Fewer Trainable Parameters, Frozen Base Weights

**LoRA** (Low-Rank Adaptation, Edward Hu et al., 2021, arXiv:2106.09685, NeurIPS 2022) freezes all pre-trained model weights and adds trainable rank decomposition matrices alongside each targeted transformer weight matrix.

**Architecture:** for a pre-trained weight matrix W ∈ R^(d×k), LoRA adds the modification BA where B ∈ R^(d×r) and A ∈ R^(r×k), with rank r ≪ min(d, k). During training, only A and B are updated; W is frozen. B is initialized to zero so the adapter starts as the identity transformation. At inference, BA can be merged into W with `merge_and_unload()` — no latency cost.

**Trainable parameter count:** for GPT-3 175B with rank r=4 targeting Q and V attention matrices, LoRA yields approximately **18M trainable parameters — 0.01% of the 175B total (a 10,000× reduction)**. For a 7B model with rank 16 targeting all attention projections, approximately 4–8M trainable parameters.

**HuggingFace PEFT** (21,000+ GitHub stars, 2026): `get_peft_model(model, lora_config)` applies LoRA to any HuggingFace model in 3 lines of code. Key hyperparameters:

| **Hyperparameter** | **Typical range** | **Effect** |
|---|---|---|
| **r (rank)** | 4–64 | Higher rank = more expressiveness, more parameters, higher overfitting risk |
| **lora_alpha** | 8–128 (typically 2× rank) | Scaling factor for adapter contribution |
| **target_modules** | q_proj, v_proj (minimum) or all attention + MLP | More modules = higher quality, more parameters |
| **lora_dropout** | 0.05–0.1 | Regularization; prevents adapter overfitting |

**Adapter size:** typically 10–100MB, compared to 14–70GB for a full base model at fp16.

**Why LoRA prevents catastrophic forgetting:** the base model weights are frozen throughout training. Only the small added B and A matrices are updated. The base model's general-purpose weight configurations — the ones that support reasoning, instruction following, and general knowledge — are unchanged. The adapter layers capture the domain-specific adaptation while the base model preserves its general capabilities.

### QLoRA: 65B Parameters on One 48GB GPU

**QLoRA** (Quantized LoRA, Dettmers et al., 2023, arXiv:2305.14314) combines 4-bit NF4 quantization of the frozen base model with LoRA adapters trained in bfloat16.

**Memory reduction:** a 65B parameter model at fp16 requires approximately 130GB GPU RAM. QLoRA reduces this to approximately 40GB — fitting on **a single 48GB GPU**. Before QLoRA, fine-tuning a 65B model required a cluster of 8× A100 GPUs ($16+/hr); after QLoRA, a single rented 48GB GPU ($2–4/hr) is sufficient.

**Benchmark:** QLoRA achieves near-parity with full fp16 fine-tuning on MMLU and Vicuna benchmarks — the paper reports it "preserves full 16-bit finetuning task performance."

**QLoRA techniques:**
- **NF4 quantization:** a quantization data type optimized for normally-distributed model weights; compresses base model from 16-bit to 4-bit per parameter
- **Double quantization:** quantizes the quantization constants themselves (8-bit → 4-bit), saving approximately 0.37 bits per parameter on top of NF4
- **Paged optimizers:** uses GPU unified memory paging to handle occasional memory spikes during training without out-of-memory errors

**Axolotl** (12,000+ GitHub stars, 2026): YAML-configured trainer built on HuggingFace PEFT and DeepSpeed. Enables QLoRA with `load_in_4bit: true` and `adapter: qlora` in the config file. Supports Flash Attention 2, DeepSpeed ZeRO stages 1/2/3 for multi-GPU training, and multiple dataset formats (Alpaca, FLAN, ShareGPT, custom JSONL).

For the broader LLM cost stack — model routing, prompt compression, and quantization at inference time — see [LLM cost optimization and model selection tradeoffs](/learn/llm-cost-optimization).

### Other PEFT Methods: Prefix Tuning, IA3, and AdaLoRA

HuggingFace PEFT (21,000+ GitHub stars, 2026) supports several PEFT methods beyond LoRA:

- **Prefix Tuning** (Li and Liang, 2021): prepends learned virtual tokens to the input at each transformer layer. The virtual tokens are trained while the base model is frozen. Slightly fewer trainable parameters than LoRA but generally lower generation quality.
- **IA3** (Infused Adapter by Inhibiting and Amplifying Inner Activations): scales specific transformer activations with learned vectors. Extremely parameter-efficient — even fewer parameters than LoRA. Effective for few-shot adaptation, less so for full fine-tuning datasets.
- **AdaLoRA** (Zhang et al., 2022): adaptive variant of LoRA that automatically allocates the parameter budget across weight matrices based on each matrix's importance, rather than using a fixed rank everywhere. Achieves better quality than fixed-rank LoRA at the same total parameter count.

For most production fine-tuning use cases, LoRA or QLoRA is the correct starting point — the quality, tooling support, and documentation are most mature for these two methods.

## Training Infrastructure: OpenAI API, Self-Hosted Axolotl, and HuggingFace

### OpenAI Fine-Tuning API: Managed, No GPU Required

OpenAI's fine-tuning API supports GPT-4o mini and GPT-4o as of 2025.

**Pricing:**

| **Model** | **Training** | **Inference (input)** | **Inference (output)** |
|---|---|---|---|
| **GPT-4o mini** | $8.00/M training tokens | $0.30/M (2× base) | $1.20/M (2× base) |
| **GPT-4o** | $25.00/M training tokens | $3.75/M (1.5× base) | $15.00/M |

**Example training cost:** 1,000 examples × 2,000 tokens/example = 2M training tokens × $8/M = **$16 for a GPT-4o mini fine-tuning run**.

**Process:** upload a JSONL training file (one conversation per line in OpenAI message format), create a fine-tuning job via API, wait for completion (typically 15–60 minutes for small datasets), use the resulting `ft:gpt-4o-mini-{suffix}:{id}` model identifier in API calls.

**Limitations:** no access to model weights (the fine-tuned model is served exclusively via OpenAI API); no control over hyperparameters beyond `n_epochs`; fine-tuning is only available for OpenAI models.

**Best fit:** teams without GPU infrastructure who need a managed fine-tuning pipeline and are already committed to GPT-4o or GPT-4o mini as their base model.

### Self-Hosted Fine-Tuning with Axolotl and HuggingFace PEFT

**Axolotl** (12,000+ GitHub stars, 2026): YAML-configured distributed fine-tuning framework supporting LoRA, QLoRA, full fine-tuning, and instruction tuning.

**Typical Axolotl QLoRA training run:**
- GPU: 1× A100 80GB ($2–4/hr on RunPod, Lambda Labs)
- Base model: Llama 3.1 8B or Mistral 7B
- Dataset: 1,000–10,000 examples
- Training time: 30 minutes – 4 hours
- Total compute cost: $1–16
- Output: `adapter_model.safetensors` + `adapter_config.json` (typically 20–150MB)

**Model serving after fine-tuning:**
- **vLLM:** OpenAI-compatible inference server; supports LoRA adapter hot-loading per-request
- **Text Generation Inference (TGI):** HuggingFace's production inference server; supports dynamic LoRA loading

Both vLLM and TGI load the base model once and serve multiple LoRA adapters on a single GPU instance — the correct architecture for multi-tenant serving where different teams or agent types use different fine-tuned adapters.

For the API gateway layer in front of fine-tuned model inference servers — authentication, rate limiting, and spend enforcement — see [LLM gateway for serving fine-tuned model endpoints](/learn/llm-gateway).

## Security Risks: GDPR Erasure, Weight Exfiltration, and Data Poisoning

### GDPR Article 17 Right to Erasure: PII in Model Weights

GDPR Article 17 grants individuals the right to request erasure of their personal data. When personal data — user chat histories, support tickets, medical notes, customer profiles — is included in a fine-tuning training dataset, that data is encoded in model weights during training.

**The problem:** the encoding is diffuse and non-addressable. Personal data is not stored at a discrete address in model weights; it is distributed across millions of weight values through the backpropagation process. An Art. 17 erasure request for a specific user cannot be honored by deleting a database row. The only remedy is retraining the model without that user's data.

**Retraining costs:**
- LoRA adapter on a 7B model: approximately **$50–500 in compute and 4–24 hours** of wall-clock time
- Full fine-tune of a 70B model: approximately **$5,000–50,000 in compute and days of compute time**

At scale, if user data enters fine-tuning training sets, every erasure request triggers a full training run. A consumer product with 10,000 users and a 0.1% erasure request rate produces 10 retraining events per year — each potentially costing thousands of dollars and requiring weeks of engineering time.

**Required mitigation:** never include personal data in fine-tuning training sets. Use synthetic examples, de-identified data, or format-only examples (demonstrating output structure without including actual user content). Maintain full data lineage documentation for every example in every training dataset used in a model weight. This documentation is required to identify which retraining runs are affected by a specific erasure request.

For the credential vault architecture that governs access to fine-tuned adapter weights and model serving endpoints, see [credential management for securing model API keys and adapter access](/learn/credential-management-ai-agents).

### Model Weight Exfiltration and Adapter Security

LoRA adapter weights are intellectual property and a competitive asset — they encode the behavioral knowledge extracted from your proprietary training data. Four exfiltration vectors:

**1. Shared GPU environment:** fine-tuning in a shared cloud environment (Jupyter on a shared cluster, cloud notebooks) may expose adapter weight files to other users with access to the same storage volume. Adapter files default to the current working directory — no ACL applied.

**2. Training pipeline logging:** frameworks that log model checkpoints to shared storage (S3 buckets, NFS volumes) without ACLs expose every checkpoint to anyone with bucket access.

**3. Multi-tenant adapter serving infrastructure:** a vLLM or TGI deployment serving multiple LoRA adapters must enforce that adapter A (for tenant 1) is never loaded for tenant 2's requests. Misrouting an adapter is both a correctness failure and an IP exposure.

**4. Model inversion attacks:** with sufficient API access to a fine-tuned model, an adversary can use membership inference or model inversion techniques to partially reconstruct training data or infer adapter parameters. This is particularly relevant for fine-tuned models deployed as public APIs.

**Mitigations:** store adapter weights with strict ACLs; run fine-tuning in isolated compute environments per project; use OpenLegion's per-project container isolation for serving fine-tuned adapters; enable model checkpoint encryption at rest; audit all adapter-loading decisions in the inference server log.

For the full attack surface of production agent systems beyond training data — prompt injection, tool hijacking, and credential exposure — see [AI agent security and training data attack surfaces](/learn/ai-agent-security).

### Training Data Poisoning

Fine-tuning training data is an attack surface. If an adversary can inject malicious examples into the training dataset, they can embed backdoors — the model behaves normally in general but produces specific outputs when a trigger phrase appears — or systematically shift model behavior in targeted ways.

**Data poisoning risk is highest when:**
- Training data is collected from user-generated sources (chat logs, support tickets) without adversarial filtering
- Training data is sourced from the internet without provenance verification
- Multiple data sources are merged without per-source quality audits

**Mitigations:** curate fine-tuning training data with the rigor applied to production code. Every training example should be reviewed by a human or generated by a controlled automated process with auditable logic. Maintain a full data lineage record (source, timestamp, curator, version) for every example. Run anomaly detection on training data to identify outlier examples. Evaluate fine-tuned models specifically for backdoor behaviors — test with known trigger phrases, test for unexpected outputs on adversarially constructed inputs — before promoting to production.

## Catastrophic Forgetting and Evaluation

### How Catastrophic Forgetting Happens and How to Prevent It

Catastrophic forgetting occurs when fine-tuning on a narrow dataset overwrites the weight configurations that supported general-purpose reasoning, factual knowledge, and instruction following in the base model.

**Mechanism:** gradient updates during fine-tuning push all weight values toward minimizing loss on the training data. If training data is sufficiently different from the pre-training distribution, the weight values critical for general capabilities are overwritten.

**Severity:** Stanford HELM (2023) measured **40–60% degradation in general reasoning benchmark performance** when full fine-tuning is applied to narrow domain datasets. The metrics most relevant to agent deployments: instruction-following accuracy and tool call JSON validity rate.

**Prevention strategies:**

1. **Use LoRA or QLoRA instead of full fine-tuning.** Frozen base weights cannot be overwritten. The adapter matrices capture domain-specific adaptation; the base model's general capabilities are unchanged.

2. **Include replay examples in the training mix** (for full fine-tuning): add 10–20% of training examples drawn from general-purpose instruction tuning datasets (Alpaca, FLAN, Open-Orca). The model must also minimize loss on these general examples, preventing complete overwriting of general-purpose weight configurations.

3. **Reduce n_epochs.** More training passes over a narrow dataset increases forgetting risk. For LoRA adapters, 1–3 epochs is typically sufficient. For full fine-tuning on narrow datasets, 1–2 epochs reduces forgetting at a small cost to domain task quality.

4. **L2 regularization** on weight changes relative to the base model (Elastic Weight Consolidation, EWC). Penalizes large weight changes on parameters important for general capabilities.

### Evaluating Fine-Tuned Models Before Production Deployment

A fine-tuned model must pass three evaluation gates before production deployment:

**Gate 1 — Domain task evaluation:** test on a held-out set (20% of training data reserved for evaluation). Measure the task-specific metric: F1 for extraction, exact match for structured output, BLEU for translation. The fine-tuned model should outperform the base model with few-shot examples on this metric by a meaningful margin.

**Gate 2 — General capability regression:** run both the base model and fine-tuned model on MMLU (knowledge breadth), HellaSwag (commonsense reasoning), and TruthfulQA (factuality). The fine-tuned model should not score more than 5% lower than the base model on any benchmark (for LoRA/QLoRA; full fine-tuning may tolerate 10–15% depending on use case). A 30% drop means catastrophic forgetting has occurred.

**Gate 3 — Agent-specific capability:** test tool call JSON validity rate (what percentage of tool calls pass schema validation?), instruction-following accuracy on the agent's system prompt, and multi-turn coherence. The fine-tuned model must not degrade on any of these metrics vs the base model.

If the fine-tuned model fails any gate: reduce `n_epochs`, reduce LoRA rank, add replay examples, retrain.

## OpenLegion's Take: Fine-Tune for Format, Not for Facts — and Never With PII

Three concrete problems define the fine-tuning failure mode in production:

**Catastrophic forgetting is underestimated.** Teams fine-tune on a proprietary dataset, the domain task quality improves, and they ship to production — then discover the agent fails on general instruction-following tasks it handled correctly before fine-tuning. Stanford HELM's 40–60% benchmark degradation number applies to full fine-tuning; LoRA's frozen base weights prevent this, but LoRA adapters can still overfit and degrade tool call accuracy if the rank is too high or training runs too long. The evaluation gates above are required before every production deployment, not optional.

**OpenAI's fine-tuning inference is 2× more expensive.** A fine-tuned GPT-4o mini deployment costs $0.30/M input tokens vs $0.15/M for the base model. If the fine-tuned model reduces prompt length (by baking instructions into weights), this premium is offset. If it doesn't, the cost-benefit requires explicit calculation: does the quality improvement justify the inference premium, plus the $16 training run plus the evaluation time?

**GDPR Article 17 PII-in-weights liability is a show-stopper in regulated industries.** Retraining a 7B LoRA adapter costs $50–500 and 4–24 hours per erasure request. At scale — consumer products in the EU with thousands of users — this liability compounds. The correct mitigation is a hard policy: personal data never enters fine-tuning training sets.

| **Fine-tuning property** | **OpenLegion** | **OpenAI fine-tuning API** | **Self-hosted (Axolotl + vLLM)** | **HuggingFace Inference Endpoints** | **AWS Bedrock fine-tuning** |
|---|---|---|---|---|---|
| **Per-agent adapter isolation** | Adapter weights loaded per agent type, not shared across project boundaries | Per API key, not per agent | Manual implementation required | Per endpoint deployment | Per model deployment |
| **Training data lineage logging** | Training dataset versions tracked in project git — full audit trail | Not provided | Manual (DVC, MLflow) | Not provided | Not provided |
| **PII-in-training enforcement** | INSTRUCTIONS.md policy enforced at project level | No enforcement | No enforcement | No enforcement | No enforcement |
| **Adapter weight ACL** | Credential vault governs adapter weight access | OpenAI manages; no external access | Manual S3/filesystem ACLs | HuggingFace Hub access controls | S3 + IAM |
| **Post-fine-tuning regression gate** | MMLU + tool call accuracy required before deployment | No — fine-tuned model deploys automatically | Manual | Manual | Manual |
| **Isolated container serving per agent type** | Yes — no cross-tenant adapter loading possible | Not applicable | Manual | Not applicable | Not applicable |

<!-- SCHEMA: FAQPage -->

## Frequently Asked Questions

### What is LLM fine tuning?

LLM fine tuning is the process of adapting a pre-trained language model to a specific domain, task, or behavioral style by continuing training on a curated dataset — updating model weights (full fine-tuning) or a small set of added adapter weights (LoRA, QLoRA) — so that the model reliably produces outputs appropriate for that domain without requiring long few-shot examples in every prompt. Fine-tuning changes model parameters at training time (offline), which distinguishes it from prompt engineering (changes the input at inference time) and RAG (retrieves external knowledge at inference time without changing model parameters). Fine-tuning is most effective for teaching stylistic and structural behaviors — output format, tone, schema compliance — rather than adding factual knowledge, because factual knowledge added through fine-tuning tends to hallucinate and cannot be updated without retraining.

### What is LoRA and how does it work?

LoRA (Low-Rank Adaptation, arXiv:2106.09685, Edward Hu et al., NeurIPS 2022) freezes all pre-trained model weights and adds trainable rank decomposition matrices alongside each transformer weight matrix — for a weight matrix W, LoRA adds B×A where B and A are low-rank matrices with rank r ≪ the original weight dimensions, reducing trainable parameters by approximately 10,000× compared to full fine-tuning. For GPT-3 175B with rank 4, LoRA reduces trainable parameters from 175 billion to approximately 18 million (0.01% of total), enabling fine-tuning on consumer-grade hardware while preserving base model general capabilities because base weights are frozen and catastrophic forgetting is prevented. After training, the LoRA adapter matrices can be merged into the base model weights with `merge_and_unload()` for zero inference latency, or kept separate and loaded dynamically — HuggingFace PEFT's `get_peft_model()` API applies LoRA to any HuggingFace model in 3 lines of code, saving adapter weights as a 20–150MB file vs 14–70GB for the full base model.

### What is QLoRA?

QLoRA (Quantized LoRA, Dettmers et al., 2023, arXiv:2305.14314) combines 4-bit NF4 quantization of the frozen base model with LoRA adapters trained in bfloat16, enabling fine-tuning of a 65B parameter model on a single 48GB GPU — compared to approximately 520GB of GPU RAM required for full fp16 fine-tuning of the same model size. The paper reports that QLoRA preserves full 16-bit finetuning task performance, making it the practical standard for fine-tuning large models without a GPU cluster. QLoRA uses three techniques: NF4 quantization (4-bit data type optimized for normally-distributed weights), double quantization (quantizing the quantization constants for an additional 0.37 bits/parameter saving), and paged optimizers (GPU unified memory paging to handle training memory spikes), implemented in HuggingFace PEFT and Axolotl with a simple `load_in_4bit: true` configuration.

### When should I fine-tune an LLM vs use RAG?

Fine-tune when the behavior you need is stylistic or structural (output format, tone, schema compliance, domain-specific writing style), you have ≥100 high-quality labeled examples, and the domain is stable enough that training data won't go stale faster than your retraining cadence. Use RAG when the domain changes frequently (product catalogs, regulations, news, pricing), facts need to be auditable with citations, the knowledge lives in private documents that cannot be included in a training dataset, or you have fewer than 100 examples (few-shot prompt engineering almost always outperforms fine-tuning at that scale). A common mistake is reaching for fine-tuning when a model doesn't reliably follow complex instructions — the root cause is usually an under-engineered prompt, and improving the system prompt is faster, cheaper, and easier to iterate on than weight-level adaptation.

### What is the GDPR risk of fine-tuning on user data?

GDPR Article 17 (right to erasure) creates significant compliance liability when personal data is included in fine-tuning training datasets: personal data is encoded diffusely across model weights during backpropagation and cannot be selectively deleted — the only remedy for an erasure request is retraining the model from scratch without that user's data. Retraining costs range from $50–500 in compute and 4–24 hours for a LoRA adapter on a 7B model, to $5,000–50,000 and multiple days for a full fine-tune of a 70B model — and each erasure request triggers a new retraining run if user data was included in the training set. The correct mitigation is strict: never include personal data in fine-tuning training sets; use synthetic examples, de-identified data, or format-only examples; maintain full data lineage documentation for every training dataset used in a model weight.

### What is catastrophic forgetting in LLM fine tuning?

Catastrophic forgetting occurs when full fine-tuning on a narrow domain dataset overwrites the weight configurations that supported general-purpose reasoning, factual knowledge, and instruction-following in the base model — Stanford HELM (2023) measured 40–60% degradation in general reasoning benchmark performance when full fine-tuning is applied to narrow datasets. The mechanism: gradient updates push all weight values toward minimizing loss on the training data; if training data differs significantly from the pre-training distribution, weights that supported general capabilities are overwritten. LoRA and QLoRA prevent catastrophic forgetting by freezing all base model weights — only the small added adapter matrices are updated, so the base model's general capabilities are preserved. For full fine-tuning deployments, catastrophic forgetting is mitigated by including 10–20% general-purpose replay examples from datasets like Alpaca, FLAN, or Open-Orca, reducing n_epochs to 1–2, and evaluating on MMLU and HellaSwag before deployment.

### How much does it cost to fine-tune an LLM?

OpenAI's fine-tuning API for GPT-4o mini costs $8.00/million training tokens — $16 for a 1,000-example dataset at 2,000 tokens per example — plus a 2× inference premium ($0.30/M input, $1.20/M output vs $0.15/M base). Self-hosted QLoRA fine-tuning on Llama 3.1 8B or Mistral 7B using a rented 48GB GPU ($2–4/hr on RunPod or Lambda Labs) typically costs $1–16 in compute for 1,000–10,000 example datasets taking 30 minutes to 4 hours of training time. Full fine-tuning costs scale with model size: a 70B model requires 4–8× A100 80GB GPUs, making a training run $100–500+. QLoRA's ability to fine-tune a 65B parameter model on a single 48GB GPU for under $10 in compute has made parameter-efficient fine-tuning the default approach for teams without a GPU cluster.

### What are HuggingFace PEFT and Axolotl?

HuggingFace PEFT (Parameter-Efficient Fine-Tuning) is an open-source Python library (21,000+ GitHub stars, 2026) implementing LoRA, QLoRA, Prefix Tuning, IA3, AdaLoRA, and other PEFT methods with a 3-line API (`get_peft_model(model, lora_config)`) compatible with any HuggingFace Transformers model — adapter weights are saved as a small file (20–150MB vs 14–70GB for the full base model). Axolotl is an open-source distributed fine-tuning framework (12,000+ GitHub stars, 2026) built on PEFT and DeepSpeed, configured via YAML for reproducible training runs and supporting Flash Attention 2, DeepSpeed ZeRO stages 1/2/3 for multi-GPU training, and dataset formats including Alpaca, FLAN, ShareGPT, and custom JSONL. Together they form the standard self-hosted fine-tuning stack: Axolotl manages training orchestration and dataset loading, PEFT handles the LoRA/QLoRA adapter mechanics, and vLLM or Text Generation Inference (TGI) serves the resulting adapter in production with OpenAI-compatible APIs and per-request LoRA hot-loading.

## Start Fine-Tuning LLMs for Production Agents

Fine-tuning is a narrow tool: it changes how a model writes, not what it knows. LoRA and QLoRA are the correct default methods for production agent deployments — frozen base weights prevent catastrophic forgetting, 10–100MB adapter files replace 14–70GB model copies, and QLoRA puts 65B models on a single 48GB GPU. Full fine-tuning's 40–60% general reasoning degradation risk makes it inappropriate unless the narrow task is the only thing the model will ever do.

The three constraints before any fine-tuning run: ≥100 labeled examples, no personal data in the training set, and a post-training evaluation gate on MMLU + tool call accuracy before production deployment.

[Start building on OpenLegion](https://app.openlegion.ai) — isolated adapter serving per agent type, per-project container boundaries, and credential vault for adapter weight access control.

For the full LLM cost stack including routing, prompt caching, and inference optimization beyond fine-tuning, see [LLM cost optimization and model selection tradeoffs](/learn/llm-cost-optimization).
