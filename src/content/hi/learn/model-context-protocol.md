---
title: Model Context Protocol (MCP) — AI एजेंट्स Tools का उपयोग कैसे करते हैं
description: >-
  Model Context Protocol (MCP) Anthropic का open standard है AI एजेंट्स को
  external tools discover और call करने देने के लिए। यह कैसे काम करता है,
  security caveats, और OpenLegion का MCP support।
slug: /learn/model-context-protocol
primary_keyword: model context protocol
secondary_keywords:
  - MCP
  - MCP server
  - MCP client
  - MCP integration
  - anthropic mcp
  - mcp tools
  - mcp security
  - mcp agents
date_published: 2026-05
last_updated: 2026-05
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison
---

# Model Context Protocol: AI एजेंट Tools के लिए Open Standard

**Model Context Protocol** (MCP) Anthropic द्वारा November 2024 में published open standard है जो AI एजेंट्स को external tools discover और call करने देता है — databases, file systems, APIs, internal services — bespoke glue code लिखे बिना। MCP servers capabilities expose करते हैं; MCP clients (एजेंट runtimes, IDEs, assistants) उन्हें consume करते हैं। Protocol deliberately minimal है, जो इसकी production catch भी है: deployments को safe होने से पहले authentication, sandboxing, और प्रति-tool budgets ऊपर layer करने होंगे।

<!-- SCHEMA: DefinitionBlock -->

> **Model Context Protocol क्या है?**
> Model Context Protocol एक open JSON-RPC-आधारित standard है, मूल रूप से Anthropic द्वारा published, जो define करता है कि AI एजेंट्स (clients) tools (servers) द्वारा exposed capabilities को कैसे discover और call करते हैं। यह editors के लिए LSP या hardware के लिए USB का AI एजेंट ecosystem equivalent है: एक protocol, कई implementations।

## TL;DR

- **MCP एजेंट ecosystem का USB port है** — एक protocol जो किसी भी compliant एजेंट runtime को किसी भी compliant tool server को custom glue code लिखे बिना उपयोग करने देता है।
- **Anthropic ने MCP को November 2024 में publish किया**; 2025 के दौरान major adopters में शामिल हैं OpenAI, Microsoft Copilot, Cursor, Zed, Continue, और अधिकांश एजेंट frameworks।
- **MCP चार primitive types define करता है**: tools (function-style calls), resources (read-only data), prompts (reusable templates), और sampling (client पर server-initiated LLM calls back)।
- **Transport JSON-RPC over stdio या HTTP/SSE है**। Stdio dominant local form है; HTTP/SSE remote MCP servers के लिए बढ़ रहा है।
- **Production MCP को तीन layers चाहिए जिन्हें अधिकांश tutorials skip करते हैं**: tool calls पर authentication, sandboxing, और budget enforcement।

## MCP कैसे काम करता है

एक MCP client (एक एजेंट runtime या AI assistant) एक या अधिक MCP servers से connect करता है। Connection पर, client एक capability list request करता है — यह server कौन से tools, resources, और prompts प्रदान करता है? प्रत्येक tool अपने arguments के लिए एक JSON schema advertise करता है। एजेंट का LLM tool list को अपने context के हिस्से के रूप में देखता है और तदनुसार tool calls चुनता है। Client calls को सही server पर route करता है, JSON marshal करता है, और results return करता है।

Transport JSON-RPC 2.0 है। दो transports common हैं: stdio (client server को एक subprocess के रूप में spawn करता है और stdin/stdout पर communicate करता है — Claude Desktop में default) और remote servers के लिए HTTP with Server-Sent Events जो network boundary के पार रहते हैं।

Protocol खुद intentionally minimal है। Complexity इसमें है कि MCP servers क्या expose करते हैं: एक filesystem server एक एजेंट को एक directory तक read और write access देता है; एक Postgres server query access देता है; एक Slack server message-send और channel-read capabilities देता है। समान एजेंट एक साथ कई servers से connect कर सकता है।

## MCP Servers बनाम MCP Clients

**MCP servers** tool side हैं। कोई भी एक लिख सकता है — Anthropic Python और TypeScript में reference SDKs publish करता है। 2026 के mid तक GitHub, Notion, Linear, Postgres, AWS, browser automation, और उससे परे को cover करने वाले हजारों community servers हैं। Servers छोटे होते हैं (कुछ सौ lines) क्योंकि protocol अधिकांश काम करता है।

**MCP clients** एजेंट runtimes, IDEs, और assistants हैं। Claude Desktop reference client था। Cursor, Zed, Continue, Windsurf, और अधिकांश एजेंट frameworks ने 2025 के दौरान MCP client support जोड़ा। एक single MCP client typically कई concurrent server connections को support करता है — एक एजेंट एक साथ filesystem server, एक database server, और एक Slack server से बात कर रहा है।

Key insight: LLM directly MCP नहीं बोलता। Client MCP tool list को LLM prompt के अंदर function definitions के रूप में render करता है; LLM एक function call emit करता है; client call को सही MCP server पर map करता है और JSON-RPC request forward करता है।

## Production MCP के लिए Security Considerations

MCP एक *capability-exposure* protocol है — authorization या audit protocol नहीं। Production deployments को वे parts जोड़ने चाहिए जिन्हें MCP intentionally बाहर छोड़ता है:

- **Authentication**: अधिकांश MCP servers locally unauthenticated चलते हैं। एक multi-tenant deployment को प्रति-एजेंट credentials और प्रति-server auth boundaries चाहिए।
- **Sandboxing**: broad path access वाला एक MCP filesystem server functionally host पर root है। MCP servers को containers में चलाएँ; sensitive volumes को blindly mount न करें।
- **Budget enforcement**: tool calls मुफ्त नहीं हैं। एक एजेंट loop में एक MCP web-scraping server calling serious cost rack up कर सकता है। प्रति-एजेंट budgets को tool invocations को cover करना चाहिए, केवल LLM tokens नहीं।
- **Audit logs**: MCP खुद call logging standardize नहीं करता। Production runtimes को [AI एजेंट सुरक्षा](/learn/ai-agent-security) review और incident response के लिए arguments, response shape, और timing के साथ हर server call record करना चाहिए।

Reference Claude Desktop MCP integration servers को host subprocesses के रूप में host user की filesystem permissions के साथ mount करता है। यह single-user developer setups के लिए काम करता है; यह production-safe नहीं है।

## OpenLegion MCP को कैसे Integrate करता है

OpenLegion default रूप से एक MCP client है। Runtime में एजेंट्स अपने fleet के लिए configured MCP servers को auto-discover करते हैं, अपने context window में tool list देखते हैं, और अंतर्निहित skills के समान vault-proxied, ACL-gated path के माध्यम से MCP tools call करते हैं। Mesh production-grade layers enforce करता है जिन्हें MCP बाहर छोड़ता है:

- प्रत्येक MCP server अपने स्वयं के sandboxed namespace में चलता है; एजेंट server process को कभी direct stdio access नहीं मिलता।
- प्रति-एजेंट ACLs gate करते हैं कि एक given एजेंट कौन से MCP servers call करने की अनुमति है।
- हर tool call एजेंट के प्रति-एजेंट बजट के विरुद्ध count होता है; अपनी cap से अधिक होने वाला एजेंट cut off होता है चाहे spend LLMs या MCP tools से आया हो।
- Mesh हर MCP call को trace log में record करता है — समान telemetry जो [AI एजेंट observability](/learn/ai-agent-observability) में covered है।

परिणाम: आप MCP ecosystem की breadth प्राप्त करते हैं इसकी default trust assumptions को inherit किए बिना।

## OpenLegion का दृष्टिकोण

MCP OpenAPI के बाद सबसे महत्वपूर्ण agent-ecosystem standard है — यह उस N × M integration work को collapse करता है जो otherwise होता (हर एजेंट framework × हर tool) N + M servers और clients में। लेकिन protocol की intentional minimalism का अर्थ है कि production teams को boring infrastructure rebuild करनी होगी — auth, sandboxing, budgets, audit — जिसे proprietary systems ने bundle किया था। Frameworks जो MCP को just-add-water के रूप में देखते हैं उन concerns को layer किए बिना insecure-by-default एजेंट्स ship करते हैं। एक [AI एजेंट प्लेटफ़ॉर्म](/learn/ai-agent-platform) चुनें जो MCP को इसे constrain करने के लिए पर्याप्त seriously लेता है।

## CTA

**अंतर्निहित production-grade controls के साथ MCP-compatible एजेंट्स deploy करें।**
[शुरू करें](https://app.openlegion.ai) | [Docs पढ़ें](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## अक्सर पूछे जाने वाले प्रश्न

### Model Context Protocol क्या है?

Model Context Protocol (MCP) एक open JSON-RPC standard है जिसे Anthropic ने November 2024 में पेश किया जो AI एजेंट्स को एक uniform interface के माध्यम से external tools discover और call करने देता है। MCP servers capabilities (tools, resources, prompts) expose करते हैं; MCP clients (एजेंट runtimes, IDEs, assistants) उन्हें consume करते हैं। 2025 के दौरान major adopters में शामिल हैं OpenAI, Microsoft Copilot, Cursor, Zed, और अधिकांश एजेंट frameworks।

### MCP किसने बनाया और क्या यह open है?

Anthropic ने MCP बनाया और इसे Python और TypeScript में reference SDKs के साथ एक open specification के तहत release किया। Spec GitHub के माध्यम से community-governed है, और कोई licensing या proprietary lock-in नहीं है। कोई भी एक MCP server या client लिख सकता है, और major LLM providers MCP-compatible tooling ship करते हैं।

### एक MCP server और एक MCP client में क्या अंतर है?

एक MCP server capabilities expose करता है — एक Postgres server query tools expose करता है, एक filesystem server file read और write expose करता है, एक Slack server message-send expose करता है। एक MCP client consumer side है — typically एक एजेंट runtime, एक IDE, या एक AI assistant। एक client एक साथ कई servers से connect कर सकता है; एक server कई clients द्वारा reused हो सकता है।

### क्या MCP default रूप से secure है?

नहीं — और यह intentional है। MCP एक capability-exposure protocol है, authorization protocol नहीं। Reference implementations (Claude Desktop, SDK examples) servers को host subprocesses के रूप में user की filesystem permissions के साथ unauthenticated चलाते हैं। Production deployments को MCP खुद के ऊपर authentication, sandboxing, प्रति-tool budgets, और audit logging जोड़नी चाहिए।

### MCP OpenAI function calling से कैसे तुलना करता है?

OpenAI function calling एक single-vendor pattern है जो एक LLM को API request में defined functions call करने देता है — यह standardize नहीं करता कि tools कैसे discover, packaged, या systems के बीच share होते हैं। MCP ecosystem level पर समान problem के लिए एक cross-vendor open standard है। दोनों complementary हैं: MCP servers capabilities expose करते हैं; एक MCP client उन्हें GPT models calling करते समय OpenAI-format function definitions के रूप में render कर सकता है, या Claude calling करते समय Anthropic tool-use format के रूप में।

### क्या मैं किसी भी LLM provider के साथ MCP का उपयोग कर सकता हूँ?

हाँ। MCP LLM-agnostic है — client MCP tool definitions को उस format में render करता है जो underlying LLM expect करता है (Anthropic tool use, OpenAI function calling, Gemini function declarations)। OpenLegion जैसे runtimes जो LiteLLM के माध्यम से 100+ providers को support करते हैं automatically MCP tools को प्रत्येक provider के calling convention के लिए adapt करते हैं।
