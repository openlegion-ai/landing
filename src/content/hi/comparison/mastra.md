---
title: Mastra का विकल्प — सुरक्षा-प्रथम AI एजेंट प्लेटफ़ॉर्म
description: Mastra TypeScript-केवल फ्रेमवर्क है जो RBAC को proprietary ee/ के पीछे बंद रखता है और CVE-2025-61685 क्रेडेंशियल उजागर करता है। Mastra विकल्पों की तुलना करें।
slug: /comparison/mastra
primary_keyword: mastra विकल्प
secondary_keywords:
  - openlegion बनाम mastra
  - mastra सुरक्षा
  - mastra typescript agent framework
  - mastra enterprise edition
last_updated: "2026-05-26"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
---

# Mastra का विकल्प: सुरक्षा-प्रथम प्लेटफ़ॉर्म बनाम TypeScript-प्रथम फ्रेमवर्क

Mastra Gatsby टीम का TypeScript एजेंट फ्रेमवर्क है जिसके 24,329 GitHub स्टार हैं — लेकिन CVE-2025-61685 (CVSS 6.5) Cursor IDE प्रॉम्प्ट इंजेक्शन के ज़रिए `~/.aws` क्रेडेंशियल फ़ाइलें उजागर करता है, RBAC और auth proprietary `ee/` डायरेक्टरी के पीछे बंद हैं जो Apache 2.0 के अंतर्गत उपलब्ध नहीं है, और दो अनमर्ज्ड PRs open-redirect और OAuth CSRF कमज़ोरियों को मई 2026 तक बिना पैच के छोड़ते हैं। सुरक्षा-प्रथम टीमों के लिए Mastra विकल्प को vault में रखे गए credentials की ज़रूरत है, environment variable credentials की नहीं।

<!-- SCHEMA: DefinitionBlock -->

> **Mastra क्या है?**
> Mastra Kepler Software (Gatsby टीम) का open-source TypeScript एजेंट फ्रेमवर्क है जिसके 24,329 GitHub स्टार हैं, अगस्त 2024 में जारी किया गया। यह TypeScript और JavaScript डेवलपर्स के लिए workflow orchestration, tool calling, और RAG primitives प्रदान करता है — dual license के अंतर्गत: core के लिए Apache 2.0 और auth, RBAC तथा adapter permission enforcement वाले `ee/` enterprise डायरेक्टरी के लिए proprietary license।

## डेवलपर्स Mastra का विकल्प क्यों ढूंढते हैं

### CVE-2025-61685: MCP Docs Server के ज़रिए क्रेडेंशियल फ़ाइल एक्सपोज़र

CVE-2025-61685 (CVSS 6.5, 24 सितंबर 2025) `@mastra/mcp-docs-server` संस्करण ≤0.13.8 में directory traversal कमज़ोरी है। Liran Tal द्वारा खोजी गई, यह कमज़ोरी Cursor IDE के ज़रिए prompt injection से `readMdxContent` में path traversal सुरक्षा को bypass करके `~/.aws/credentials`, `~/.config/`, और `~/.cursor/` तक पहुंचने देती है। Mastra ने संस्करण 0.17.0 में पैच किया।

### Dual License: `ee/` Paywall के पीछे सुरक्षा सुविधाएं

Apache 2.0 license core framework को कवर करता है। `ee/` डायरेक्टरी — जिसमें auth integrations, RBAC, और adapter permission enforcement हैं — proprietary है और open-source license के अंतर्गत उपलब्ध नहीं है।

**RBAC एक enterprise add-on है।** Fine-grained agent permission control के लिए enterprise edition ज़रूरी है। **Adapter permissions गेटेड हैं।** **Auth integrations proprietary हैं।**

### Enterprise Auth Stack में खुले Unmerged Security PRs

**CVE-2026-42565 (CVSS 4.3)**: `@workos/authkit-session` में open redirect। **GHSA-wxw3-q3m9-c3jr (CVSS 5.3)**: `better-auth` में OAuth CSRF। दोनों कमज़ोरियां `ee/` enterprise डायरेक्टरी में हैं — वही tier जो production-grade security का दावा करती है।

## OpenLegion का नज़रिया: तीन संरचनात्मक सुरक्षा कमियां

**डिज़ाइन से क्रेडेंशियल एक्सपोज़र।** Mastra एजेंट environment variables के रूप में credentials लेते हैं। OpenLegion credentials को एक vault में रखता है और उन्हें model के बाहर इंजेक्ट करता है — कोई भी एजेंट रन कभी plaintext API key नहीं पाता।

**Enterprise upgrade के रूप में सुरक्षा।** RBAC, adapter permissions, और auth integrations के लिए proprietary `ee/` tier चाहिए। OpenLegion में ये core features सभी users के लिए उपलब्ध हैं।

**Paid tier में unpatched auth कमज़ोरियां।** OpenLegion उस exposure class को जड़ से हटाता है: credentials कभी एजेंट के पास नहीं रहते, और vault उन्हें model के बाहर inject करता है।

## Mastra बनाम OpenLegion: तुलना

| **आयाम** | **Mastra** | **OpenLegion** |
|---|---|---|
| **भाषा समर्थन** | केवल TypeScript | कोई नहीं — एजेंट web app में configure होते हैं |
| **License** | Apache 2.0 (core) + proprietary `ee/` | PolyForm Perimeter License 1.0.1 (engine) |
| **GitHub स्टार** | 24,329 (मई 2026) | Pre-release |
| **क्रेडेंशियल मॉडल** | Environment variables — एजेंट keys रखते हैं | Vault में रखे — एजेंट कभी keys नहीं रखते |
| **एजेंट isolation** | Process-level, कोई container boundary नहीं | हर task के लिए एक sandboxed run |
| **RBAC** | Proprietary `ee/` tier केवल | Per-agent tool और vault grants (सभी users) |
| **CVE रिकॉर्ड** | CVE-2025-61685 (CVSS 6.5) + 2 खुले PRs | Pre-release |
| **Auth** | WorkOS AuthKit / better-auth (केवल `ee/`) | Google sign-in; credentials vault में रहते हैं |
| **Budget controls** | कोई नहीं | Per-agent credit budgets |
| **Multi-agent** | Workflow orchestration | Goals, फिर tasks, फिर एजेंट्स, delegation के साथ |

## TypeScript-Only: व्यवहार में इसका मतलब

Mastra TypeScript-first है और वर्तमान में TypeScript-only। कोई Python SDK नहीं, कोई Go client नहीं, कोई JVM integration नहीं। Python ML/data infrastructure वाली टीमों के लिए Mastra व्यवहार्य विकल्प नहीं है। LangGraph, CrewAI, और AutoGen सभी Python को natively support करते हैं; OpenLegion को किसी SDK की ज़रूरत ही नहीं।

## सुरक्षा आर्किटेक्चर: Vault Proxy बनाम Environment Variables

Mastra एजेंट `process.env` के ज़रिए LLM API keys और service credentials लेते हैं। CVE-2025-61685 ने ठोस जोखिम दर्शाया: `@mastra/mcp-docs-server` में directory traversal `~/.aws/credentials` तक पहुंच सकता था।

OpenLegion का credential vault model के बाहर, एजेंट और जिन services को वे call करते हैं उनके बीच बैठता है। एजेंट के tool call में सिर्फ़ एक handle जाता है; model कभी credential string नहीं पाता। विस्तृत विश्लेषण के लिए देखें [AI एजेंट सुरक्षा](/learn/ai-agent-security)।

## OpenLegion Mastra के विकल्प के रूप में

Goals, tasks और एजेंट्स के ज़रिए multi-agent coordination, event wakes और delegation के साथ। Vault में रखे credentials model के बाहर inject होते हैं, इसलिए कोई एजेंट रन API keys नहीं रखता। हर task के लिए एक sandboxed run। Per-agent credit budgets, $0.001 प्रति credit पर metered। Preset से चुने गए models — Smartest, Smart या Normal।

**ईमानदार trade-offs:** import करने के लिए कोई SDK नहीं — OpenLegion एक hosted web app है, आपकी अपनी service में build की जाने वाली library नहीं। Mastra के 24,329 स्टार से छोटा community। कोई built-in workflow visualization नहीं।

<!-- SCHEMA: FAQPage -->

## अक्सर पूछे जाने वाले प्रश्न

### Mastra क्या है और इसे किसने बनाया?

Mastra Kepler Software (Gatsby टीम) का TypeScript एजेंट फ्रेमवर्क है जिसके 24,329 GitHub स्टार हैं, अगस्त 2024 से विकसित। यह TypeScript developers के लिए workflow orchestration, tool calling, RAG primitives, और multi-agent coordination प्रदान करता है — dual license के अंतर्गत।

### Mastra में CVE-2025-61685 क्या है?

CVE-2025-61685 (CVSS 6.5, 24 सितंबर 2025) `@mastra/mcp-docs-server` ≤0.13.8 में directory traversal है जो Liran Tal ने खोजी। Cursor IDE के ज़रिए prompt injection path traversal सुरक्षा bypass करके `~/.aws/credentials`, `~/.config/`, और `~/.cursor/` फ़ाइलें उजागर करती है। Mastra ने संस्करण 0.17.0 में पैच किया।

### क्या Mastra में free tier में RBAC है?

नहीं। RBAC, adapter permissions, और auth integrations Mastra के proprietary `ee/` डायरेक्टरी में हैं, Apache 2.0 open-source license के अंतर्गत उपलब्ध नहीं। OpenLegion per-agent tool grants और vault में रखे गए credentials सभी users को core platform features के रूप में प्रदान करता है।

### मई 2026 तक Mastra की अनpatched सुरक्षा समस्याएं क्या हैं?

Enterprise auth stack में दो security PRs खुले हैं: CVE-2026-42565 (CVSS 4.3, `@workos/authkit-session` में open redirect) और GHSA-wxw3-q3m9-c3jr (CVSS 5.3, `better-auth` में OAuth CSRF)। 26 मई 2026 तक दोनों unmerged थे।

### क्या TypeScript developers OpenLegion उपयोग कर सकते हैं?

OpenLegion किसी भी भाषा का SDK नहीं है। यह एक hosted web app है: Google से sign in करें और browser में एजेंट configure करें — import करने के लिए कोई TypeScript package नहीं है।

### क्या Mastra production के लिए पर्याप्त stable है?

Mastra के 24,329 GitHub स्टार हैं और अगस्त 2024 से active development है, 26 मई 2026 तक 433 खुले issues के साथ। Production के लिए adopt करने वाली टीमों को `@mastra/mcp-docs-server` को 0.17.0+ पर upgrade करना चाहिए और CVE-2026-42565 और GHSA-wxw3-q3m9-c3jr के upstream fixes की निगरानी करनी चाहिए।

---

पूर्ण तुलना के लिए देखें [OpenLegion बनाम LangGraph](/comparison/langgraph), [OpenLegion बनाम CrewAI](/comparison/crewai), [OpenLegion बनाम AutoGen](/comparison/autogen), और [AI एजेंट फ्रेमवर्क तुलना 2026](/learn/ai-agent-frameworks)।
