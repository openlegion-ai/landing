---
title: "AI Agent Tool Use — Function Calling, Schemas, and Safe Execution"
description: "How AI agents use tools: defining tool schemas, function calling across providers, parallel and chained calls, output parsing, error recovery, and permission scoping for safe production execution."
slug: ai-agent-tool-use
primary_keyword: ai agent tool use
last_updated: "2026-06-08"
schema_types:
  - FAQPage
related:
  - /learn/agentic-workflows
  - /learn/model-context-protocol
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-evaluation
  - /learn/ai-agent-frameworks
---

# AI Agent Tool Use: Function Calling, Schemas, and Safe Execution

AI agent tool use is the mechanism by which an LLM requests execution of external functions — web search, database queries, API calls, file operations — by emitting structured tool call JSON that a runtime intercepts, validates against a JSON Schema, and executes before returning a tool result. The LLM never executes anything; it only requests. The runtime enforces schema validation, ACL checks, and step budgets before any execution. tau-bench (2025) shows argument construction errors are the top tool-use failure mode.

<!-- SCHEMA: DefinitionBlock -->
AI agent tool use is the mechanism by which a large language model requests execution of external functions — web search, database queries, API calls, file operations, or custom business logic — by emitting a structured tool call in its output that a runtime intercepts, validates against a JSON Schema definition, executes, and returns as a tool result in the next context turn.

## How Tool Calling Works: The Request-Execute-Return Loop

### The Tool Call Lifecycle

Every tool call follows the same five-step loop regardless of which framework or provider is involved:

1. **Context setup** — the agent receives the task plus a list of available tools, each described by a name, a natural-language description, and a JSON Schema definition of its parameters.
2. **LLM decision** — the model emits a tool call block in its output: a function name and a JSON object of arguments matching the declared schema.
3. **Runtime interception** — the framework intercepts the tool call before any execution occurs. Arguments are validated against the schema. The agent's ACL is checked: is this agent permitted to call this tool?
4. **Execution** — if validation and permission checks pass, the runtime executes the function and collects its output.
5. **Context injection** — the tool result is injected back into the conversation context as a tool result turn. The LLM continues reasoning from this enriched context — calling another tool, or producing a final answer.

The critical architectural fact: the LLM never executes anything. It only requests. Every unsafe action — writing a file, calling an API, sending an email — is gated by the runtime. This separation between request and execution is the foundation of safe agent tool use.

### Provider Format Differences: OpenAI vs Anthropic vs Google

All three major LLM providers support tool use natively, but the JSON format differs:

**OpenAI** (openai/openai-python, 30,941 ⭐, Apache-2.0): tool definitions go in the `tools` parameter as an array of JSON Schema objects. The model returns tool calls in the `tool_calls` field of the assistant message. The client sends tool results back as messages with `role: "tool"`. The Responses API (March 2025) added built-in tools (`web_search`, `file_search`, `computer_use`) that execute server-side without requiring client-side dispatch.

**Anthropic** (anthropic-sdk-python, 3,595 ⭐, MIT): tool definitions go in the top-level `tools` parameter. The model returns `tool_use` content blocks inside the assistant turn. The client must parse these blocks and return `tool_result` content blocks in the next human turn. The round-trip is explicit — the client owns the execution step between the two turns.

**Google Gemini**: tool definitions use `functionDeclarations` inside the `tools` parameter, following JSON Schema semantics. The model returns `functionCall` parts; the client sends `functionResponse` parts. Gemini supports a `tool_config` with `ANY` mode (force the model to always call a tool) and `AUTO` mode (let the model decide) — a reliability lever most teams leave at the default.

The formats are semantically equivalent: name, description, parameters, required fields. Syntactically they differ enough that hardcoding one provider's convention breaks when you swap models. Agent frameworks that abstract provider differences — translating a single tool definition to the correct format at call time — are substantially easier to maintain across model changes.

### Who Actually Executes the Tool (and Why That Matters for Security)

The LLM cannot execute tools. It can only request them. This is not a limitation — it is the security boundary. When a runtime enforces an ACL gate before every tool execution, no LLM output, no matter how crafted, can bypass the permission check. The model can ask for `delete_all_records()` with whatever arguments it likes; if the agent's permission matrix doesn't include that tool, the runtime rejects the request before any execution occurs.

Frameworks that pass tool execution responsibility directly back to the LLM — giving the model a `code_interpreter` with no ACL gate — sacrifice this boundary. The blast radius of a prompt-injected agent is bounded by its permitted tool set, not by its reasoning quality.

## Defining Tool Schemas That LLMs Use Correctly

tau-bench (ServiceNow Research, 2025) measured GPT-4o at 44% pass@1 on retail tool-use tasks. The largest failure category was not tool selection — the model chose the right tool — but argument construction: the model called the right function with wrong or malformed arguments. Schema quality is the primary reliability lever.

### JSON Schema Anatomy for Tool Definitions

A minimal valid tool schema requires four fields:

```json
{
  "name": "search_web",
  "description": "Search the public web for current information. Use when the task requires facts from after your training cutoff, real-time data, or sources not in your training data.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query. Use specific, targeted terms — not a full sentence."
      },
      "max_results": {
        "type": "integer",
        "description": "Maximum number of results to return. Default 5, max 20.",
        "default": 5
      }
    },
    "required": ["query"]
  }
}
```

The `required` array matters: parameters not in `required` are optional. The model may or may not provide them. Required parameters that are often omitted indicate a schema description problem — the model doesn't know it must provide them.

### Writing Descriptions That Reduce Argument Errors

Three rules for tool descriptions that improve argument construction accuracy:

1. **Name with a verb-noun pair**: `search_web`, `create_ticket`, `read_file`. Avoids ambiguity between similar tools (`get` vs `fetch` vs `read`).
2. **Disambiguate in the description**: if two tools look similar, explicitly state when to use each. "Use `search_web` for real-time data. Use `query_knowledge_base` for internal documents indexed before 2025."
3. **Describe parameters with examples**: `"The search query. Example: 'LangGraph v0.2 parallel tool calls'"` outperforms `"The query string"` in argument accuracy.

### Common Schema Mistakes and How to Fix Them

| **Mistake** | **Effect** | **Fix** |
|---|---|---|
| Unconstrained `"type": "string"` for categorical values | Model invents invalid values | Use `"enum": ["option_a", "option_b"]` |
| Missing `description` on parameters | Model guesses argument semantics | Write explicit descriptions with examples |
| All parameters in `required` | Model refuses to call when optional fields are unknown | Only list truly required parameters |
| Vague tool name (`process`, `handle`) | Model can't distinguish from similar tools | Use verb-noun: `submit_form`, `parse_date` |
| No `required` array at all | JSON Schema is invalid; some runtimes silently skip validation | Always include `required`, even if empty (`[]`) |

### Strict Mode: Enforcing Exact Schema Adherence

OpenAI's structured outputs strict mode (`"strict": true` on a tool definition) guarantees the model's output JSON exactly matches the declared schema — no extra fields, no missing required fields, no type mismatches. This eliminates the entire category of argument-construction errors at the schema-validation step, at the cost of restricting the schema to a subset of JSON Schema (no `anyOf`, limited `$ref` use).

Anthropic's tool use also validates argument structure against the schema before returning the tool_use block. Both guarantee that if the model calls a tool, the arguments will be syntactically valid — semantic correctness (is the query actually useful?) remains the model's responsibility.

## Parallel and Sequential Tool Calls

### When to Use Parallel Tool Calls

OpenAI's Responses API (March 2025) made parallel tool calls the default. In a single LLM turn, the model can request multiple tool executions simultaneously. For independent tools — tools whose outputs don't depend on each other — parallel dispatch reduces round-trips from N sequential turns to one concurrent batch.

Example: a research agent needs current stock price, recent news, and a company's SEC filing. All three are independent. Sequential execution: 3 LLM turns × 10s each = 30s. Parallel execution: 1 LLM turn + max(tool latencies) ≈ 10s. The saving compounds across pipelines.

The precondition: the tools must be genuinely independent. If tool B needs tool A's output as an argument, they must be sequential. If both tools write to the same stateful resource without transaction support, parallel dispatch risks a race condition.

### Sequential Tool Calls for Dependent Operations

Tool chaining — using one tool's output as the next tool's input — requires sequential execution. The pattern: `search_web(query)` → `fetch_page(url from search result)` → `extract_data(page content)` → `summarize(extracted data)`. Each step depends on the previous step's output.

The runtime injects each tool result back into context before the LLM decides on the next call. The LLM reads the previous result and constructs the next argument from it. Sequential chaining adds one LLM round-trip per step; minimizing the chain depth — batching what can be batched — reduces total latency.

### Concurrency Risks with Stateful Resources

Parallel tool calls against stateful resources need ordering guarantees the parallel dispatch doesn't provide. Two concurrent writes to the same database record without locking produce undefined results. Two concurrent email sends with partially overlapping content produce duplicate sends.

The rule: parallel dispatch is safe when tools are read-only or write to independent resources. When tools have overlapping write targets, enforce sequential ordering explicitly — either by structuring the tool schema so dependent tools cannot be called in parallel, or by enforcing sequential execution at the framework level.

## Tool Output Parsing and Error Recovery

Tool calls fail. The external API returns 503. The database query times out. The LLM constructs an argument value that passes schema validation but fails semantic validation at execution time. A well-designed tool use implementation handles failures without requiring human intervention for recoverable errors.

### Validating Tool Outputs (Not Just Checking for Errors)

A tool returning HTTP 200 with a response body is not the same as a tool returning a correct, useful result. Validate the output against an expected schema before injecting it back into the agent's context. An empty result set, a null body, or a response containing an error message buried in a 200 response will mislead the agent if accepted uncritically.

Define an output schema for each tool alongside the input schema. Validate the raw response against it. Surface validation failures as structured errors rather than passing malformed output into context.

### Retry Strategies: When and How to Re-Invoke

Three retry patterns for different failure modes:

- **Transient failure retry** (network timeout, rate limit): re-invoke the same tool with the same arguments after a brief backoff. Idempotent tools only — retrying a non-idempotent tool (one that creates a record) without idempotency keys creates duplicates.
- **Argument clarification retry**: return a structured error to the LLM explaining why the argument was rejected, then let the LLM construct a corrected call. Works well for semantic validation failures where the model can self-correct.
- **Fallback tool**: if tool A fails after N retries, route to tool B with equivalent capability. Requires declaring fallback relationships in the tool registry.

### Surfacing Tool Failures to the Orchestrator

Recoverable errors — the model corrects its argument and retries — stay within the agent's context loop. Unrecoverable errors — the tool is down, the agent has exhausted its retry budget, the task cannot proceed — must surface to the orchestrator. For multi-agent pipelines, the orchestrator needs a structured failure signal with the failed tool name, the error category, and whether the task is retryable. For [AI agent orchestration patterns](/learn/ai-agent-orchestration), this is the escalation path that triggers reroute or cancel semantics.

## Tool Permission Scoping and Security

### Least-Privilege Tool Assignment

Each agent should hold only the tools its specific task requires. A research agent needs `search_web` and `fetch_page`. It does not need `send_email`, `delete_record`, or `execute_code`. The blast radius of a successfully prompt-injected agent is bounded by its permitted tool set — an agent without `send_email` cannot be weaponized to send email, regardless of what the injected instruction requests.

OWASP LLM Top 10 v1.1 (2025) lists prompt injection (LLM01) as the top risk for LLM applications. In tool-enabled agents, tool results carrying attacker-controlled content — a scraped web page, an email body, a database record — are the primary injection vector. Least-privilege assignment is the primary mitigation at the permission layer.

### Input Validation Before Execution

Validate tool call arguments at two layers: schema validation (does the argument match the declared type and constraints?) and semantic validation (does the argument make sense for this execution context?). Schema validation is automatic with strict mode. Semantic validation requires custom logic: a `fetch_page` tool should reject arguments with `file://` or `localhost` URLs to prevent SSRF; a `run_query` tool should reject arguments containing DROP or DELETE statements unless explicitly permitted.

See the [AI agent security threat model](/learn/ai-agent-security) for the full taxonomy of tool-level attack vectors including SSRF, SQL injection, and path traversal via tool arguments.

### Irreversible Actions: Human-in-the-Loop Gates

Tool calls with irreversible side effects — sending emails, deleting records, transferring funds, publishing content — require explicit human confirmation gates or idempotency checks before execution. An agent that can send email autonomously, combined with a prompt injection in a retrieved document, is a phishing vector. The gate can be synchronous (pause and wait for human approval) or asynchronous (queue the action for human review before executing). For low-risk reversible actions, idempotency tokens prevent duplicate execution on retry without requiring human review.

## OpenLegion's Take: The Tool Registry and ACL Gate

Every major LLM provider has a different tool calling API. OpenAI uses `tools` with JSON Schema. Anthropic uses `tool_use` content blocks. Google uses `functionDeclarations`. A codebase that handles each format separately becomes unmaintainable as model counts grow. The correct abstraction: define a tool once — name, description, JSON Schema — and let the framework translate it to the correct provider convention at call time.

OpenLegion's tool registry implements this abstraction. Define `search_web` once. The mesh translates the definition to OpenAI `tools`, Anthropic `tools`, or Gemini `functionDeclarations` depending on which model the agent is configured to use. Swapping from GPT-4o to Claude Sonnet requires no tool definition changes.

The ACL gate is non-optional. Every tool call — built-in, MCP, or custom — routes through the per-agent permission matrix before execution. The LLM cannot call a tool the agent isn't explicitly permitted to use. This is structural enforcement, not a prompting convention. Combined with per-agent token and step budgets, it bounds both the permission scope and the computational cost of any single agent run.

| **Dimension** | **OpenLegion** | **LangChain / LangGraph** | **OpenAI Agents SDK** | **CrewAI** | **Anthropic direct** |
|---|---|---|---|---|---|
| **Tool definition format** | Single schema → provider-translated | Provider-specific wrappers required | OpenAI format only | CrewAI tool decorator | Anthropic tool_use format only |
| **Provider abstraction** | Yes — GPT-4o, Claude, Gemini unified | Partial — via LangChain integrations | No — OpenAI models only | Partial | No — Anthropic only |
| **ACL enforcement** | Per-agent permission matrix, structural | None built-in | None built-in | None built-in | None built-in |
| **Parallel tool calls** | Supported | Supported (provider-dependent) | Yes — default in Responses API | Supported | Yes — Claude supports |
| **Built-in tools** | Browser, file, HTTP, shell, image gen | Via LangChain community tools | web_search, file_search, computer_use | None built-in | None built-in |
| **MCP integration** | Native — same ACL/budget pipeline | Via LangChain MCP adapters | Experimental | Not native | Not native |

For the MCP specification, server architecture, and per-server permission requirements, see the [Model Context Protocol guide](/learn/model-context-protocol). For a full framework feature comparison covering tool support alongside other dimensions, see the [AI agent frameworks comparison](/learn/ai-agent-frameworks).

## Built-in Tools vs MCP Tools vs Custom Tools

### Built-in Runtime Tools

Built-in tools come pre-hardened by the runtime: browser automation, file operations, HTTP requests, shell commands, image generation. They have ACL enforcement, budget tracking, and error handling already applied. Use built-in tools first — they carry the lowest implementation burden and highest security confidence.

OpenLegion's built-in tools include `browser_navigate`, `http_request`, `write_file`, `run_command`, and `generate_image`. Each is gated by the agent's permission matrix and counts against the agent's token and step budgets.

### MCP Tool Servers

MCP tools are served by Model Context Protocol servers — external processes that expose tools via JSON-RPC over stdio or HTTP. The agent discovers available tools at startup by querying the server's `tools/list` endpoint. MCP enables connecting to GitHub, Slack, databases, or any custom API without modifying the core agent runtime.

MCP tools require explicit sandboxing and per-server permission scoping. A compromised MCP server can return malicious tool results; per-server trust levels and output sanitization are required before MCP tool results re-enter the agent's context. For the full MCP specification and production security requirements, see the [Model Context Protocol guide](/learn/model-context-protocol).

### Custom Tool Registration

Custom tools are Python (or TypeScript) functions you write and register in the agent's tool registry. They give full flexibility: any business logic, any internal API, any data source. The trade-off is that you own validation, error handling, idempotency, and security controls. Registering a custom tool in OpenLegion routes it through the same ACL gate and budget enforcement as built-in tools — the framework provides the permission layer; the implementation provides the logic.

For benchmarks that measure tool-use reliability across frameworks and model versions, see the [AI agent evaluation guide](/learn/ai-agent-evaluation).

<!-- SCHEMA: FAQPage -->
## Frequently Asked Questions

### What is AI agent tool use?

AI agent tool use is the mechanism by which a large language model requests execution of external functions — web search, API calls, database queries, file operations — by emitting structured tool call JSON that a runtime intercepts, validates against a schema, and executes before returning a tool result. The LLM never executes anything directly; it only describes what it wants called and with what arguments. The runtime decides whether to honor the request, based on schema validation, ACL checks, and budget enforcement. This separation between request and execution is the foundation of safe agent tool use.

### How does function calling work in AI agents?

Function calling works in a request-execute-return loop: the agent receives a task and a list of available tools (each with a name, description, and JSON Schema); the LLM emits a tool call naming the function and providing arguments; the runtime validates those arguments, executes the function, and injects the result back into context as a tool result; the LLM then continues reasoning. Major providers support function calling natively — OpenAI via the `tools` parameter and `tool_calls` response field, Anthropic via `tool_use` content blocks, Google via `functionDeclarations` — though the JSON format differs between providers, requiring abstraction in multi-model deployments.

### What makes a good tool schema for AI agents?

A good tool schema uses a verb-noun name (`search_web`, `create_ticket`), a description that unambiguously states when to use it and what each parameter means, strongly typed parameters with enums instead of unconstrained strings where possible, and a `required` array listing mandatory parameters. tau-bench (ServiceNow Research, 2025) shows that incorrect argument construction — not tool selection — is the most common failure mode for agent tool use, meaning schema quality directly determines reliability. A practical test: ask a human to fill in the parameters from the description alone; if they'd be uncertain, the LLM will make mistakes too.

### What are parallel tool calls and when should I use them?

Parallel tool calls let an agent request multiple tool executions in a single LLM turn, dispatched concurrently by the runtime. OpenAI's Responses API (March 2025) made parallel tool calls the default, reducing round-trips for independent operations from N sequential turns to one concurrent dispatch. Use parallel calls when tools are independent — their outputs don't depend on each other and they don't write to shared stateful resources. Avoid parallel calls when tool B needs tool A's output as an argument, or when both tools write to the same resource without transaction support.

### How do I prevent tool call loops in AI agents?

Tool call loops occur when an agent keeps invoking tools without converging on a final answer — typically because tool results are ambiguous, the task is under-specified, or reasoning enters a cycle. The only reliable prevention is a step budget enforced at the infrastructure level: a hard maximum on tool calls per agent run, enforced by the orchestrator rather than left to the LLM. Relying on the model to self-terminate is insufficient because a prompt injection can prevent it from stopping. Per-agent step budgets, combined with token budgets, bound both iteration count and cumulative cost.

### What is the security risk of AI agent tool use?

The primary risk is tool result injection: when an agent calls a tool returning attacker-controlled content — a web page, email body, database record, or API response — that content arrives in context as trusted input and can redirect the agent's behavior. OWASP LLM Top 10 v1.1 (2025) lists prompt injection as the top risk for LLM applications, and tool results are the dominant injection vector in agentic systems. Mitigations include output sanitization before tool results re-enter context, least-privilege tool assignment so agents only hold tools their task requires, and human-in-the-loop gates for irreversible actions like sending emails or deleting records.

### What is the difference between built-in tools, MCP tools, and custom tools?

Built-in tools are provided by the agent runtime — browser automation, file operations, HTTP requests, shell commands — with ACL enforcement and budget tracking already applied. MCP tools are served by Model Context Protocol servers that expose external capabilities via JSON-RPC, discovered at runtime; they require explicit sandboxing and per-server permission scoping. Custom tools are functions you write and register in the tool registry, giving full flexibility at the cost of implementing your own validation, error handling, and security controls. All three should route through the same ACL gate rather than executing at different trust levels.

### How do different LLM providers implement tool use?

OpenAI implements tool use via the `tools` parameter — JSON Schema tool definitions, `tool_calls` in the assistant response, `role: "tool"` result messages. Anthropic uses `tool_use` content blocks in the assistant turn with `tool_result` blocks returned in the next human turn. Google Gemini uses `functionDeclarations` with `functionCall` parts in responses and `functionResponse` parts in follow-up turns. The three formats are semantically equivalent but syntactically different, requiring provider-specific handling or a framework abstraction layer that translates a single tool definition to the correct format at call time.

## Define Your Tools Once, Execute Them Safely Everywhere

tau-bench (2025) puts GPT-4o at 44% pass@1 on tool-use tasks, with argument construction as the dominant failure category. Precise schemas with verb-noun names, typed enums, and parameter examples close most of that gap. Parallel dispatch cuts latency for independent tools. ACL gating bounds the blast radius of any injection attempt.

For [agentic workflow patterns](/learn/agentic-workflows) covering step budgets and loop prevention at the workflow level, and for [AI agent evaluation benchmarks](/learn/ai-agent-evaluation) measuring tool-use reliability across models, those guides extend the foundations this page covers.

[Build tool-using agents with per-agent ACL enforcement on OpenLegion →](https://openlegion.ai)
