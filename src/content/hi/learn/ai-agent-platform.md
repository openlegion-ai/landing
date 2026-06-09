---
title: AI एजेंट प्लेटफ़ॉर्म — Secure एजेंट्स Deploy करें
description: >-
 OpenLegion एक managed AI एजेंट प्लेटफ़ॉर्म है container isolation, credential
 vaulting, और budget controls के साथ। अपनी खुद की LLM API keys लाएँ।
slug: /learn/ai-agent-platform
primary_keyword: ai agent platform
secondary_keywords:
 - managed ai agent platform
 - self-hosted agent deployment
 - ai agent cost control
 - ai agent credential security
 - production ai agent infrastructure
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-security
 - /learn/ai-agent-frameworks
 - /comparison
---

# Production के लिए बना AI एजेंट प्लेटफ़ॉर्म

अधिकांश teams एक framework के साथ शुरू करती हैं। वे LangGraph nodes या CrewAI crews को एक साथ string करती हैं, एक demo को काम करवाती हैं, और फिर एक wall से टकराती हैं: containers कौन manage करता है? API keys कहाँ जाती हैं? एक rogue एजेंट को रात भर में $500 tokens में burn करने से क्या रोकता है?

एक **AI एजेंट प्लेटफ़ॉर्म** आपके पहले एजेंट को लिखने से पहले उन प्रश्नों का उत्तर देता है। OpenLegion एक managed AI एजेंट प्लेटफ़ॉर्म है जो container isolation, vault-proxied credentials, प्रति-एजेंट budget controls, और fleet-model coordination (blackboard + pub/sub + handoff) ship करता है — सभी default रूप से enabled। अपनी खुद की LLM API keys लाएँ। Model usage पर कोई markup नहीं।

<!-- SCHEMA: DefinitionBlock -->

> **AI एजेंट प्लेटफ़ॉर्म क्या है?**
> एक AI एजेंट प्लेटफ़ॉर्म production में स्वायत्त AI एजेंट्स को deploy, orchestrate, और govern करने के लिए managed infrastructure है। Raw frameworks के विपरीत, एक प्लेटफ़ॉर्म isolation, credential management, cost controls, और observability handle करता है ताकि teams DevOps को scratch से build किए बिना एजेंट्स ship कर सकें।

## TL;DR

- **Platform, framework नहीं** — OpenLegion containers, credentials, budgets, और networking manage करता है। आप एजेंट logic manage करते हैं।
- **Vault-proxied credentials** — एजेंट्स एक vault proxy के माध्यम से API calls execute करते हैं। वे कच्ची keys कभी नहीं देखते।
- **प्रति एजेंट कंटेनर isolation** — प्रत्येक एजेंट configurable resource caps (384MB RAM / 0.15 CPU default), non-root execution, और कोई shared filesystem के साथ अपने स्वयं के Docker कंटेनर में चलता है।
- **प्रति-एजेंट बजट enforcement** — Automatic hard cutoff के साथ दैनिक और मासिक token limits set करें। कोई surprise bills नहीं।
- **BYO API keys** — LiteLLM (100+ supported) के माध्यम से किसी भी LLM provider को connect करें। आप providers को सीधे उनकी published rates पर भुगतान करते हैं।
- **Auditable fleet-model coordination** — task routing के लिए fleet-model coordination (blackboard + pub/sub + handoff)। कोई "CEO एजेंट" अपारदर्शी decisions नहीं करता।
- **MCP-compatible extensibility** — 50+ अंतर्निहित skills के साथ-साथ किसी भी MCP tool server (databases, filesystems, APIs) को connect करें। एजेंट्स द्वारा Auto-discovered।
- **Persistent एजेंट memory** — एजेंट्स vector search, workspace files, और error learnings के साथ sessions में याद रखते हैं। Context automatically managed।

## Managed बनाम Self-Hosted: प्रत्येक कब Sense करता है

AI एजेंट frameworks और AI एजेंट platforms के बीच distinction deploy time पर सबसे अधिक मायने रखता है। एक framework आपको building blocks देता है — एजेंट definitions, tool integrations, conversation patterns। एक प्लेटफ़ॉर्म आपको production layer देता है: एजेंट्स कहाँ चलते हैं, वे credentials कैसे access करते हैं, उन्हें off the rails जाने से क्या रोकता है।

**Self-hosted frameworks** (LangGraph, CrewAI, AutoGen) आपको maximum control देते हैं। आप infrastructure के मालिक हैं। आप containers configure करते हैं। आप credential pipeline build करते हैं। यह तब काम करता है जब आपकी team के पास dedicated DevOps capacity और existing infrastructure है जिसके साथ एजेंट्स को deeply integrate करना है।

**Managed AI एजेंट platforms** operational layer handle करते हैं ताकि आपकी team एजेंट logic पर focus करे। OpenLegion यहाँ बैठता है — लेकिन एक critical अंतर के साथ: यह PolyForm Perimeter License 1.0.1 के तहत source-available है। आप infrastructure side पर vendor lock-in के बिना platform-grade operations (isolation, vaulting, budget controls) प्राप्त करते हैं।

प्रश्न यह नहीं है कि कौन सा "better" है। यह है कि आपकी team को एजेंट security infrastructure पर engineering hours खर्च करने चाहिए या एजेंट्स पर ही।

### Self-hosted कब sense करता है

- आपके पास strict data residency आवश्यकताएँ हैं जो किसी भी managed service को preclude करती हैं
- आपके एजेंट्स को existing on-prem infrastructure के साथ deep integration की आवश्यकता है
- आपकी team पहले से Kubernetes clusters operate करती है और परिपक्व DevOps practices हैं
- आपको runtime environment को एक level पर customize करने की आवश्यकता है जो managed platforms expose नहीं करते

### एक managed AI एजेंट प्लेटफ़ॉर्म कब sense करता है

- आपको production में एजेंट्स दिनों में चाहिए, महीनों में नहीं
- आपकी team 1–5 engineers की है और infrastructure के लिए headcount dedicate नहीं कर सकती
- आपको खुद उन्हें build किए बिना [AI एजेंट सुरक्षा](/learn/ai-agent-security) guarantees चाहिए
- आप सब कुछ manually instrument किए बिना cost controls और request tracing चाहते हैं

## BYO API Keys Model — यह क्यों मायने रखता है

अधिकांश managed AI platforms प्रति token charge करते हैं या model usage पर margin लेते हैं। यह दो समस्याएँ बनाता है: cost opacity और provider lock-in।

OpenLegion एक भिन्न approach लेता है। आप किसी भी provider से अपनी खुद की LLM API keys लाते हैं — OpenAI, Anthropic, Google, Mistral, या LiteLLM के माध्यम से supported 100+ providers में से कोई। आपके tokens directly provider को उनकी published rates पर flow करते हैं। OpenLegion प्लेटफ़ॉर्म और orchestration के लिए charge करता है, model access के लिए नहीं।

यह तीन कारणों से मायने रखता है:

**Cost transparency।** आप exactly देखते हैं कि प्रत्येक एजेंट प्रत्येक provider पर क्या खर्च करता है। कोई hidden markup नहीं। कोई "platform tokens" नहीं जो real costs को obscure करें।

**Provider flexibility।** प्रति एजेंट models swap करें। Complex reasoning के लिए GPT-4o चलाएँ, long-context tasks के लिए Claude, और high-volume classification के लिए एक local Llama model — सभी समान project में, समान dashboard से managed।

**कोई lock-in नहीं।** यदि आप OpenLegion छोड़ते हैं, आपकी API keys और model configurations आपके साथ जाती हैं। दूर migrate करने के लिए कोई proprietary model layer नहीं है।

## यह किसके लिए है

### एजेंट products build करने वाले Solo developers

आप एक agent-powered product ship कर रहे हैं और इसे पहले दिन से secure चाहते हैं। OpenLegion आपको production infrastructure देता है — कंटेनर isolation, credential vaulting, cost controls — DevOps team को hire किए बिना। एक अंतर्निहित team template (Dev Team, Sales Pipeline, Content Studio) के साथ शुरू करें और वहाँ से customize करें।

### तेज़ ship करने वाली Startup teams

आपकी team 2–10 engineers की है। आपको इस sprint में production में एजेंट्स चाहिए, अगले quarter नहीं। Install तीन commands है: `git clone`, `./install.sh`, `openlegion start`। Guided setup wizard आपकी API keys configure करता है, एक team template चुनता है, और तीन मिनट से कम में आपका पहला एजेंट fleet deploy करता है।

### Enterprise सुरक्षा teams

आपको request tracing और workflow observability चाहिए, credential isolation जो एक compromised एजेंट से बच जाए, और बजट controls जो runaway costs को रोकें। OpenLegion का architecture उन environments के लिए designed है जिन्हें defense-in-depth चाहिए। Auditable fleet-model coordination का अर्थ है कि हर workflow step explicit और traceable है — control plane में कोई अपारदर्शी LLM decision-making नहीं। पूर्ण threat model के लिए हमारा [AI एजेंट सुरक्षा](/learn/ai-agent-security) पेज देखें।

## Production Readiness: OpenLegion क्या handle करता है बनाम DIY

| क्षमता | DIY (केवल Framework) | OpenLegion |
|---|---|---|
| **एजेंट runtime** | आप Docker configure करते हैं, images manage करते हैं, networking handle करते हैं | प्रत्येक एजेंट isolated कंटेनर में auto-provisioned (384MB RAM, 0.15 CPU default, non-root, no-new-privileges) |
| **Credential management** | Environment variables या custom vault integration | Blind injection के साथ vault proxy — एजेंट्स कच्ची keys कभी नहीं देखते |
| **Cost controls** | Manual tracking, कोई hard limits नहीं | Automatic cutoff के साथ प्रति-एजेंट दैनिक/मासिक budgets |
| **Orchestration** | अपनी खुद की routing logic code करें या LLM-आधारित routing का उपयोग करें | fleet-model coordination (blackboard + pub/sub + handoff) — auditable |
| **Observability** | LangSmith, Datadog, या custom logging integrate करें | Live streaming, cost charts, request traces के साथ अंतर्निहित dashboard |
| **Multi-channel deployment** | प्रति channel integrations build करें | CLI, Telegram, Discord, Slack, WhatsApp — साथ ही external integrations के लिए webhook endpoints |
| **Browser automation** | Playwright/Puppeteer configure करें, Chrome instances manage करें | KasmVNC (ports 6100..6163), CDP control, और auto-recovery के साथ shared browser-service कंटेनर में प्रति-एजेंट Camoufox (stealth Firefox) |
| **Tool extensibility** | Custom integrations build करें या LangChain tools का उपयोग करें | MCP-compatible — किसी भी MCP server + 50+ अंतर्निहित skills को connect करें, auto-discovered |
| **एजेंट memory** | Custom RAG या state management build करें | Auto context management के साथ प्रति एजेंट persistent vector memory |
| **Model failover** | प्रति provider Custom retry logic | LiteLLM के माध्यम से providers के बीच Configurable failover chains |

सारांश: यदि आप [AI एजेंट frameworks](/learn/ai-agent-frameworks) का मूल्यांकन कर रहे हैं और खुद को एजेंट logic से अधिक infrastructure build करते हुए पाते हैं, तो आप framework tools के साथ एक platform problem solve कर रहे हैं। OpenLegion platform layer handle करता है ताकि आप focus कर सकें कि आपके एजेंट्स वास्तव में क्या करते हैं।

## MCP-Compatible Tool Extensibility

OpenLegion external tools को connect करने के लिए Model Context Protocol (MCP) को support करता है। कोई भी MCP server — databases, filesystems, APIs, internal services — configuration के माध्यम से जोड़ा जा सकता है और एजेंट्स द्वारा auto-discovered होता है। यह 50+ अंतर्निहित skills के साथ-साथ बैठता है जो browser automation, file operations, HTTP requests, web search, memory management, code execution, और mesh communication को cover करते हैं।

MCP integration का अर्थ है कि एजेंट्स अंतर्निहित capabilities तक सीमित नहीं हैं। एक Postgres server, एक GitHub integration, या एक custom internal API connect करें — एजेंट्स available tools को automatically discover करते हैं और उन्हें अपनी permission boundaries के अंदर उपयोग करते हैं।

## Persistent एजेंट Memory

OpenLegion में एजेंट्स vector search, workspace files, और error learnings का उपयोग करके sessions में memory maintain करते हैं। जब एक एजेंट एक problem का सामना करता है और इसे solve करता है, solution store और भविष्य के sessions में recall किया जाता है — repeated failures को कम करता है और समय के साथ execution quality को सुधारता है।

Memory प्रति एजेंट scoped है और प्रत्येक एजेंट के isolated SQLite + vector database में उसके कंटेनर के अंदर stored है। Auto context management केवल current task के लिए relevant memories surface करके token usage को efficient रखता है, पूरी conversation histories लोड करने के बजाय।

## Architecture: चार-Zone Trust Model

OpenLegion हर deployment को चार trust zones plus एक operator-or-internal tier में separate करता है:

**Zone 0 — Untrusted External Input।** Users या third parties से आने वाली कोई भी चीज़: CLI, Telegram, Discord, Slack, WhatsApp, और webhook endpoints। सभी inputs mesh तक पहुँचने से पहले prompt-injection guards के माध्यम से validated और sanitized होते हैं।

**Zone 1 — Sandboxed Agent Containers (Untrusted)।** प्रत्येक एजेंट एक dedicated Docker कंटेनर में अपने स्वयं के FastAPI instance के रूप में अपने `/data` volume, memory database, और strict resource caps के साथ चलता है। एक पूरी तरह compromised एजेंट भी आपकी API keys, अन्य एजेंट्स के data, या host system तक access नहीं कर सकता।

**Zone 2 — Mesh Host (Trusted)।** FastAPI server जो Blackboard (SQLite + WAL के माध्यम से shared state), PubSub message router, Credential Vault (proxy जो blind injection handle करता है), ACL matrix, Container Manager, Cost Tracker, और Browser Service (:8500 पर प्रति-एजेंट Camoufox) चलाता है। यह brain है — और यह एकमात्र component है जो आपकी API keys को touch करता है।

**Zone 2.5 — Operator-or-Internal।** Operator एजेंट या internal mesh tooling के लिए available reserved control-plane operations — fleet management, एजेंट edits, permission grants (Operator `can_spawn` या `can_use_wallet` grant नहीं कर सकता)।

**Zone 3 — Loopback-Only Internal।** सबसे-restricted tier: endpoints जिन्हें `x-mesh-internal: 1` header और एक loopback source IP दोनों चाहिए। केवल mesh-internal coordination calls के लिए उपयोग।

इस architecture का अर्थ है कि [AI एजेंट orchestration](/learn/ai-agent-orchestration) और सुरक्षा अलग concerns नहीं हैं — वे समान system हैं।

## शुरुआत

```bash
git clone https://github.com/openlegion-ai/openlegion.git
cd openlegion && ./install.sh
openlegion start # inline setup on first run, then agents deploy in isolated containers
```

पहला install 2–3 मिनट लेता है। Python 3.10+ और Docker चाहिए।

## CTA

**Secure एजेंट्स deploy करने के लिए तैयार हैं?**
[शुरू करें](https://app.openlegion.ai) | [Docs पढ़ें](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## अक्सर पूछे जाने वाले प्रश्न

### AI एजेंट प्लेटफ़ॉर्म क्या है?

एक AI एजेंट प्लेटफ़ॉर्म managed infrastructure है जो स्वायत्त AI एजेंट्स चलाने के operational concerns को handle करता है: container isolation, credential management, cost controls, orchestration, और observability। यह LangGraph या CrewAI जैसे frameworks के ऊपर बैठता है और वह production layer प्रदान करता है जो frameworks आपके पास छोड़ते हैं।

### Production के लिए सबसे अच्छा AI एजेंट प्लेटफ़ॉर्म क्या है?

Production के लिए सबसे अच्छा AI एजेंट प्लेटफ़ॉर्म आपकी सुरक्षा और operational आवश्यकताओं पर निर्भर करता है। यदि आपको custom infrastructure build किए बिना अंतर्निहित कंटेनर isolation, vault-proxied credentials, और प्रति-एजेंट बजट controls चाहिए, OpenLegion इन्हें out of the box प्रदान करता है। Microsoft ecosystem में deeply invested teams के लिए, Azure AI Agent Service evaluate करने योग्य है। अधिक DIY effort के साथ maximum flexibility के लिए, LangSmith के साथ LangGraph self-hosting मजबूत observability देता है।

### Enterprise AI एजेंट प्लेटफ़ॉर्म क्या है?

एक enterprise AI एजेंट प्लेटफ़ॉर्म basic एजेंट orchestration के ऊपर governance, compliance, और सुरक्षा controls जोड़ता है। Key आवश्यकताओं में शामिल हैं: credential isolation (एजेंट्स को कच्ची API keys कभी नहीं देखनी चाहिए), workflow traceability, runaway costs को रोकने के लिए बजट enforcement, role-based access control, और deployment options जो data residency आवश्यकताओं को support करते हैं। OpenLegion का architecture उन environments के लिए designed है जिन्हें ये controls चाहिए।

### क्या मैं अपनी खुद की API keys के साथ AI एजेंट्स host कर सकता हूँ?

हाँ। OpenLegion एक BYO (Bring Your Own) API key model का उपयोग करता है। आप किसी भी LLM provider से अपनी खुद की keys connect करते हैं — OpenAI, Anthropic, Google, Mistral, और LiteLLM के माध्यम से 100+ अन्य। आपके tokens directly provider को उनकी published rates पर flow करते हैं। अपनी खुद की LLM API keys लाएँ। Model usage पर कोई markup नहीं।

### Managed बनाम self-hosted AI एजेंट्स: अंतर क्या है?

Managed AI एजेंट platforms आपके लिए container provisioning, credential vaulting, cost controls, और observability handle करते हैं। Self-hosted का अर्थ है आप एक framework (LangGraph, CrewAI, AutoGen) को अपने स्वयं के infrastructure पर deploy करते हैं और इन operational layers को खुद build करते हैं। Managed production तक faster है और कम DevOps investment की आवश्यकता है। Self-hosted maximum infrastructure control देता है। OpenLegion एक hybrid प्रदान करता है: source-available code (PolyForm Perimeter License 1.0.1) जिसे आप self-host कर सकते हैं, अंतर्निहित managed platform capabilities के साथ।

### OpenLegion अन्य AI एजेंट platforms से कैसे तुलना करता है?

OpenLegion security-first architecture पर differentiate करता है। लिखने के समय public documentation के आधार पर, कोई अन्य बड़ा [AI एजेंट framework](/learn/ai-agent-frameworks) अंतर्निहित vault-proxied credentials, प्रति एजेंट अनिवार्य कंटेनर isolation, या native प्रति-एजेंट बजट enforcement प्रदान नहीं करता। OpenClaw, LangGraph, CrewAI, AutoGen, और Semantic Kernel में विस्तृत breakdown के लिए हमारा [frameworks comparison](/learn/ai-agent-frameworks) देखें।

### OpenLegion कौन सी license उपयोग करता है?

OpenLegion PolyForm Perimeter License 1.0.1 के तहत source-available है और [GitHub](https://github.com/openlegion-ai/openlegion) पर available है। Project उन teams के लिए एक hosted प्लेटफ़ॉर्म भी प्रदान करता है जो self-hosting के बिना managed infrastructure चाहती हैं।

### मैं अपना पहला एजेंट कितनी जल्दी deploy कर सकता हूँ?

तीन commands और तीन मिनट से कम में। `git clone`, `./install.sh`, `openlegion start`। Guided setup wizard आपकी API keys configure करता है, एक team template select करता है, और आपका पहला isolated एजेंट fleet automatically provision करता है।

---

## Include करने के लिए आंतरिक Links

| Anchor Text | Destination |
|---|---|
| AI एजेंट प्लेटफ़ॉर्म | /learn/ai-agent-platform |
| AI एजेंट orchestration | /learn/ai-agent-orchestration |
| AI एजेंट frameworks comparison | /learn/ai-agent-frameworks |
| AI एजेंट सुरक्षा | /learn/ai-agent-security |
| OpenClaw विकल्प | /openclaw-alternative |
| OpenLegion बनाम OpenClaw | /comparison/openclaw |
| Documentation | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
