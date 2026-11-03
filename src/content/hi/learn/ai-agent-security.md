---
title: 'AI एजेंट सुरक्षा — Threats, Isolation, Vaults'
description: >-
 AI एजेंट सुरक्षा guide: credential leakage, prompt injection, sandbox escape,
 और कैसे run isolation, vault में रखे credentials, और budget controls
 प्रत्येक threat को mitigate करते हैं।
slug: /learn/ai-agent-security
primary_keyword: ai agent security
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2026-03
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-platform
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-frameworks
 - /comparison
---

# AI एजेंट सुरक्षा: Production एजेंट Fleets के लिए Threat Model

हर AI एजेंट framework आपको एजेंट्स build करने के लिए tools देता है। लगभग कोई भी आपको उन्हें contain करने के लिए tools नहीं देता। जब एक एजेंट APIs call कर सकता है, web browse कर सकता है, code execute कर सकता है, और databases access कर सकता है, सुरक्षा प्रश्न यह नहीं है कि क्या कुछ गलत हो सकता है — यह है कि blast radius कैसा दिखता है जब होता है।

**AI एजेंट सुरक्षा** स्वायत्त एजेंट्स को constrain करने का practice है ताकि एक compromised, misconfigured, या misbehaving एजेंट credentials leak न करे, data exfiltrate न करे, budgets drain न करे, या privileges escalate न करे। OpenLegion इसे एक core architectural concern मानता है, add-on नहीं। हर action एक intent है जिसे होने से पहले एक ही policy engine check करता है, credentials model के बाहर एक vault में रहते हैं, और हर एजेंट का अपना बजट होता है — सभी default रूप से enabled।

Models preset से चुने जाते हैं — Smartest, Smart या Normal — प्रति एजेंट या प्रति workspace।

<!-- SCHEMA: DefinitionBlock -->

> **AI एजेंट सुरक्षा क्या है?**
> AI एजेंट सुरक्षा उन controls को encompass करती है जो स्वायत्त AI एजेंट्स को नुकसान पहुँचाने से रोकती हैं — चाहे credential leakage, prompt injection, resource abuse, data exfiltration, या excessive agency के माध्यम से। इसमें runtime isolation, credential management, cost enforcement, permission controls, और infrastructure level पर applied input validation शामिल हैं।

## TL;DR

- **Threat real है।** Research दिखाता है कि AI deployments वाले 77% organizations ने 2024 में security incidents का अनुभव किया। केवल 5% अपने AI सुरक्षा measures में विश्वास व्यक्त करते हैं।
- **चार primary threats**: Credential leakage, prompt injection, resource abuse (denial of wallet), और data exfiltration। प्रत्येक को एक भिन्न mitigation चाहिए।
- **कोई बड़ा framework अंतर्निहित सुरक्षा प्रदान नहीं करता।** Public documentation के आधार पर, LangGraph, CrewAI, AutoGen, और OpenClaw सभी credentials के लिए environment variables पर rely करते हैं बिना native isolation या बजट enforcement के।
- **OpenLegion का layered defense**: हर action के आगे एक policy engine, sandboxed task runs, credential separation (model के बाहर एक vault), permission enforcement, input validation, और unicode sanitization — सभी default रूप से enabled।
- **आपके अपने service credentials सुरक्षित रहते हैं** — credentials एक vault में रहते हैं और model के बाहर inject होते हैं, जिसके पास सिर्फ़ एक handle रहता है और जो कभी कोई कच्चा secret नहीं देखता।

## AI एजेंट्स के लिए Threat Model

### Threat 1: Credential leakage

**क्या होता है।** एक एजेंट जिसके पास API keys तक access है — environment variables, configuration files, या in-context passing के माध्यम से — उन keys को prompt injection, logging, error messages, या malicious tool calls के माध्यम से leak करता है।

**कितना common।** 2026 की शुरुआत में published research ने पाया कि 3,984 scanned एजेंट skills में से 283 (7.1%) में critical credential-handling flaws थे, plaintext में LLM context के माध्यम से API keys और passwords pass करते थे। अलग से, 76 skills में credential theft के लिए designed deliberately malicious payloads थे। High-profile incidents में शामिल हैं एक xAI employee द्वारा GitHub पर API key leak करना जो 60+ private LLMs तक दो महीने के लिए access प्रदान करती थी, और एक popular LLM platform में एक vulnerability जो एक unauthenticated endpoint के माध्यम से API keys expose करती थी।

**OpenLegion इसे कैसे mitigate करता है।** Credentials एक vault में रहते हैं और model के बाहर inject होते हैं, जिसके पास सिर्फ़ एक handle रहता है। जब एक एजेंट को एक external API call करने की आवश्यकता है, प्लेटफ़ॉर्म call boundary पर credential inject करता है। एजेंट कच्ची key को कभी नहीं देखता, log नहीं करता, या उसकी memory access नहीं रखता। एक पूरी तरह compromised एजेंट भी credentials extract नहीं कर सकता क्योंकि वे उसके run में कभी present नहीं होते।

### Threat 2: Prompt injection

**क्या होता है।** एक attacker उस content में malicious instructions embed करता है जिसे एजेंट process करता है — web pages, documents, emails, database records, user inputs। एजेंट injected instructions का पालन करता है इसके intended task के बजाय (या इसके अतिरिक्त)।

**कितना common।** Prompt injection security audits के दौरान assessed 73% से अधिक production AI deployments में दिखाई देता है। OpenAI ने December 2025 में कहा कि prompt injection "is unlikely to ever be fully solved।" OWASP इसे LLM applications के लिए #1 vulnerability rank करता है। Real-world incidents में शामिल हैं एक browser एजेंट जिसे hidden instructions के माध्यम से 150 seconds में credentials चुराने के लिए tricked किया गया, और enterprise RAG systems जहाँ public documents में malicious content ने एजेंट्स को proprietary data leak करने का कारण बनाया।

**OpenLegion इसे कैसे mitigate करता है।** OpenLegion multiple layers में defense in depth apply करता है। Unicode sanitization invisible characters (bidi overrides, tag characters, zero-width characters) को content के LLM context तक पहुँचने से पहले strip करता है — इन characters का सामान्यतः injected instructions hide करने के लिए उपयोग किया जाता है। Input validation path traversal को रोकता है और safe condition evaluation enforce करता है। Untrusted content पर act करना उन तीन walls में से एक है जहाँ काम owner की approval के लिए रुकता है, जो blast radius सीमित करता है: एक injected एजेंट केवल अपनी scoped permissions के भीतर ही act कर सकता है। यह अन्य एजेंट्स के data, credential vault, या host system तक नहीं पहुँच सकता।

कोई system prompt injection से पूर्ण immunity guarantee नहीं कर सकता। OpenLegion का approach attack surface को minimize करना और damage को contain करना है।

### Threat 3: Resource abuse (Denial of Wallet)

**क्या होता है।** एक एजेंट recursive loop में प्रवेश करता है, अत्यधिक API calls करता है, या जितना आवश्यक है उससे कहीं अधिक resources consume करने के लिए manipulated होता है। Multi-agent systems में, यह compounds करता है — एक 5-agent workflow एक single एजेंट से 5x costs करता है, और एक runaway loop किसी के notice करने से पहले minutes में सैकड़ों dollars burn कर सकता है।

**कितना common।** यह OWASP LLM10:2025 (Unbounded Consumption) के रूप में listed है। अधिकांश cloud billing systems automatically charges नहीं रोकते जब budgets exceeded होते हैं — alerts fire करते हैं, लेकिन meter चलता रहता है। CrewAI और LangGraph users की community reports token-burning loops का वर्णन करती हैं जिन्होंने 10x expected budgets consume किए।

**OpenLegion इसे कैसे mitigate करता है।** Hard cutoff के साथ प्रति-एजेंट budgets। Team में प्रत्येक एजेंट का अपना बजट है, और काम की हर unit एक record किया गया wake है जो $0.001 प्रति credit पर metered है। जब limit पहुँच जाती है, [orchestration layer](/learn/ai-agent-orchestration) उस specific एजेंट को halt करती है। बाकी workflow gracefully जारी रहता है या pause होता है। कोई "soft warning" नहीं जो ignore हो — cutoff प्लेटफ़ॉर्म level पर enforced है।

### Threat 4: Data exfiltration

**क्या होता है।** एक एजेंट को sensitive data attacker-controlled endpoint पर भेजने के लिए manipulated किया जाता है। Techniques में शामिल हैं: एजेंट को URL parameters में data encode करने का instruct करना (जो logged होते हैं या link previews के माध्यम से भेजे जाते हैं), एजेंट के browser का उपयोग करके attacker-controlled pages visit करना, या tool calls का exploit करके external APIs को data forward करना।

**कितना common।** Zero-click exfiltration techniques messaging platforms में operating एजेंट्स के विरुद्ध demonstrate किए गए हैं (जहाँ link previews automatically URLs fetch करते हैं), enterprise collaboration tools, और code repositories। Banking एजेंट्स पर research ने data exfiltration attacks के लिए लगभग 20% success rates दिखाए।

**OpenLegion इसे कैसे mitigate करता है।** एजेंट जो code लिखता है वह default पर बिना network access के एक sandbox में चलता है, और आपकी ओर से किसी third party तक पहुँचना owner की approval के लिए रुक जाता है। Permission matrix प्रति एजेंट allowed tools, files, और operations define करता है। Outbound requests controlled channels के माध्यम से route करते हैं। Credential isolation (एजेंट के पास exfiltrate करने के लिए कोई credentials नहीं) और हर action record करने वाली receipts के साथ combined, exfiltration के लिए attack surface unrestricted network access के साथ shared process spaces में चलने वाले एजेंट्स की तुलना में significantly कम है।

### Threat 5: Sandbox escape

**क्या होता है।** एक एजेंट या इसका executed code अपने कंटेनर से बाहर निकलता है और host system, अन्य containers, या orchestration layer तक access प्राप्त करता है। Container escape vulnerabilities regularly discover होती हैं — November 2025 में कई high-severity runC CVEs disclosed किए गए जो बड़े cloud providers में Docker और Kubernetes को affect करते हैं।

**OpenLegion इसे कैसे mitigate करता है।** एजेंट जो code लिखता है वह default पर बिना network access के एक sandbox में चलता है, और हर task on demand चलकर रुक जाता है — compromise करने के लिए कोई long-lived एजेंट process नहीं है। प्रत्येक एजेंट को अपना storage मिलता है, कभी shared नहीं। हर action के आगे एक policy engine का अर्थ है कि यदि एक run subvert भी हो जाए, तो उसके पास credential vault या किसी अन्य एजेंट के data तक कोई direct path नहीं है। Credentials model के बाहर inject होते हैं, इसलिए एक subverted run के पास चुराने को कुछ नहीं है।

### Threat 6: Supply chain attacks

**क्या होता है।** Malicious code एजेंट skills, MCP tool servers, shared configurations, या framework dependencies के माध्यम से introduce किया जाता है। Malicious MCP servers npm पर legitimate services को impersonate करते हुए पाए गए हैं। Crowdsourced configuration files hidden LLM-triggered prompts के साथ weaponize किए गए हैं।

**OpenLegion इसे कैसे mitigate करता है।** एजेंट जिस भी tool तक पहुँच सकता है वह owner द्वारा explicitly grant किया जाता है, runtime पर discover नहीं होता, और launch पर कोई third-party plugin surface है ही नहीं। Tool grants हर call पर policy engine द्वारा check होते हैं, और हर grant एक receipt के रूप में record होता है जिसे owner पढ़ सके। Goal-and-task coordination का अर्थ है कि tool calls task definition में explicit हैं, dynamically resolve नहीं होते — unexpected tool injection के लिए surface को कम करता है।

## OpenLegion में AI एजेंट Isolation कैसे काम करता है

OpenLegion हर action के आगे एक ही policy engine रखता है, और एक workspace को distinct security boundaries में separate करता है:

**Untrusted input।** Users या third parties से आने वाली कोई भी चीज़: web chat, Telegram, Slack, inbound email, और webhook endpoints। Inputs prompt-injection guards के माध्यम से validated और sanitized होते हैं, और untrusted content पर act करना owner की approval के लिए रुक जाता है।

**एजेंट का run।** प्रत्येक task on demand चलता है और फिर रुक जाता है। एजेंट जो code लिखता है वह default पर बिना network access के एक sandbox में चलता है, और run कोई credentials नहीं रखता — सिर्फ़ एक handle। एजेंट्स durable records हैं, servers नहीं, इसलिए compromise करने के लिए कोई long-lived process नहीं है, एक बनाना instant है, एक idle एजेंट कुछ खर्च नहीं करता, और एक workspace सैकड़ों चला सकता है।

**Policy engine।** हर action को होने से पहले एक intent के रूप में check किया जाता है: tool call, delegation, approval, cost। यह vault तक access वाला एकमात्र component है, यह credentials को model के बाहर inject करता है, और हर action को एक receipt के रूप में record करता है जिसे owner पढ़ सके।

**Owner और admin decisions।** काम केवल तीन walls पर approval के लिए रुकता है: आपकी ओर से किसी third party तक पहुँचना, data delete करना, और untrusted content पर act करना। Approvals app में एक owner या admin तय करता है, कभी एजेंट खुद नहीं।

**Workspace isolation।** एक workspace के एजेंट्स, tasks, memory और receipts उसी workspace तक scoped हैं, और प्रति-एजेंट permission grants इसे और संकीर्ण करते हैं। एजेंट जो कुछ करता है वह owner द्वारा दिए गए grants से बाहर नहीं जाता।

इस architecture का अर्थ है कि एक compromised एजेंट vault या किसी अन्य एजेंट के data तक नहीं पहुँच सकता। किसी भी single एजेंट compromise का blast radius उस एजेंट के run और उसके अपने grants तक contained है।

## AI एजेंट Credential Management: Credential Vault बनाम Environment Variables

[AI एजेंट frameworks](/learn/ai-agent-frameworks) में सबसे common credential management pattern environment variables है। आपकी API key एक `.env` file में बैठती है या `OAI_CONFIG_LIST` के माध्यम से pass होती है। एजेंट process इसे directly पढ़ता है। इसका अर्थ है:

- Key एजेंट के memory space में मौजूद है
- एक prompt injection attack एजेंट को key print या exfiltrate करने का instruct कर सकता है
- Logs, error messages, और debug output key contain कर सकते हैं
- यदि एजेंट compromised है, attacker के पास सभी injected credentials तक direct access है

OpenLegion का credential vault इस architecture को fundamentally बदलता है। API keys vault में, model के बाहर stored हैं। जब एक एजेंट को एक authenticated API call करनी है, प्लेटफ़ॉर्म call boundary पर credential inject करता है, authenticated call करता है, और एजेंट को result return करता है। Model के पास सिर्फ़ एक handle रहता है, और वह कच्ची key को कभी नहीं देखता, store करता है, या उसकी memory access नहीं रखता।

यह **vault में रखे credentials** हैं — HashiCorp Vault जैसे enterprise secret management systems द्वारा उपयोग किया जाने वाला समान principle, लेकिन अलग infrastructure की आवश्यकता के बजाय [AI एजेंट orchestration](/learn/ai-agent-orchestration) layer में built।

## Containerized AI एजेंट्स: Process-Level Isolation पर्याप्त क्यों नहीं है

कई frameworks isolation का कुछ form प्रदान करते हैं, लेकिन implementation details मायने रखते हैं:

| Framework | Isolation approach | वास्तव में क्या isolated है | क्या shared है |
|---|---|---|---|
| **OpenLegion** | प्रति task sandboxed run (हमेशा on) | Process, filesystem, network, memory, credentials | कुछ नहीं — एजेंट्स पूरी तरह isolated हैं |
| **OpenClaw** | Docker कंटेनर (optional) | Process, filesystem | Docker socket default रूप से mounted; host network accessible |
| **LangGraph** | अंतर्निहित नहीं | N/A | सब कुछ — एजेंट्स Python process share करते हैं |
| **CrewAI** | CodeInterpreter के लिए Docker | Code execution output | Agent processes Python runtime share करते हैं |
| **AutoGen** | Code execution के लिए Docker | Code execution output | Agent processes Python runtime share करते हैं |

Critical distinction: OpenLegion **task run को ही** isolate करता है। अन्य frameworks जो Docker isolation प्रदान करते हैं typically केवल **code execution output** को isolate करते हैं — एजेंट process, इसकी memory, और इसकी credential access shared रहती है। इसका अर्थ है कि एक prompt injection जो LangGraph या CrewAI में एक एजेंट को compromise करता है, shared process में सभी credentials और state तक access रखता है। OpenLegion में, समान compromise credential access के बिना एक single sandboxed run तक contained है।

## AI एजेंट Cost Controls: सुरक्षा के रूप में Budget Enforcement

Cost controls केवल financial governance नहीं हैं — वे एक security mechanism हैं। Unlimited tokens consume करने वाला एक runaway एजेंट एक resource abuse attack है, चाहे malicious prompt injection या एजेंट के reasoning loop में एक simple bug द्वारा triggered।

OpenLegion का बजट enforcement orchestrator level पर काम करता है:

- प्रत्येक एजेंट का अपना configurable बजट है, $0.001 प्रति credit पर metered
- Usage real time में tracked है, और हर task की exact cost दिखती है
- जब एक एजेंट अपनी limit hit करता है, orchestrator एक hard cutoff issue करता है — एजेंट halted है
- बाकी workflow pipeline gracefully जारी रहता है या pause होता है
- Cost data प्रति-एजेंट breakdowns के साथ dashboard में visible है

कोई अन्य बड़ा AI एजेंट framework इस capability को अंतर्निहित प्रदान नहीं करता, लिखने के समय public documentation के आधार पर।

## Compliance और Audit Considerations

OpenLegion **उन environments के लिए designed है जिन्हें** compliance controls चाहिए, including:

- **Request tracing**: Auditable goal-and-task coordination का अर्थ है कि हर workflow step explicit और traceable है। हर tool call, delegation और approval एजेंट की identity, एक timestamp और task की exact cost के साथ record होता है। Goals और tasks का साझा record एजेंट्स के बीच coordination context प्रदान करता है।
- **Auditable goal-and-task coordination**: goal-and-task coordination (goals → tasks → एजेंट्स) execution से पहले audit किया जा सकता है — आप system चलाए बिना data, permissions, और एजेंट interactions के complete flow को verify कर सकते हैं।
- **Data isolation**: प्रति-एजेंट storage और प्रति-एजेंट permission grants ensure करते हैं कि एक एजेंट द्वारा processed sensitive data अन्य एजेंट्स के लिए accessible नहीं है।
- **Least privilege**: हर एजेंट के tools, files, और operations owner द्वारा explicitly grant किए जाते हैं, और हर grant एक receipt के रूप में record होता है।

**Important**: OpenLegion वर्तमान में SOC 2, ISO 27001, HIPAA, या अन्य compliance certifications नहीं रखता। Architecture इन आवश्यकताओं वाले environments को support करने के लिए built है, लेकिन certification आपके deployment, configuration, और organizational controls का function है — केवल framework का नहीं।

## CTA

**Default रूप से secure एजेंट्स deploy करें।**
[शुरू करें](https://app.openlegion.ai) | [Docs पढ़ें](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## अक्सर पूछे जाने वाले प्रश्न

### AI एजेंट सुरक्षा का क्या अर्थ है?

AI एजेंट सुरक्षा controls का set है जो स्वायत्त AI एजेंट्स को credential leakage, prompt injection, resource abuse, data exfiltration, sandbox escape, या excessive agency के माध्यम से नुकसान पहुँचाने से रोकता है। यह runtime isolation (sandboxing एजेंट्स), credential management (key exposure रोकना), cost enforcement (runaway spending रोकना), permission controls (एजेंट्स क्या कर सकते हैं इसे सीमित करना), और input validation (malicious inputs filter करना) में फैला है।

### आप API keys के साथ AI एजेंट्स को कैसे secure करते हैं?

सबसे secure approach vault में रखे credentials हैं: API keys एक vault में store करें जिसे एजेंट्स directly access नहीं कर सकते। जब एक एजेंट को एक authenticated call करनी हो, प्लेटफ़ॉर्म credential को model के बाहर inject करता है। एजेंट कच्ची key को कभी नहीं देखता। OpenLegion इसे एक credential vault के साथ implement करता है जिसे model केवल एक handle से reference कर सकता है। सबसे कम secure (और सबसे common) approach environment variables है, जहाँ keys एजेंट की memory में मौजूद हैं और prompt injection, logging, या error output के माध्यम से leaked हो सकती हैं।

### AI एजेंट isolation कैसे काम करता है?

एजेंट isolation का अर्थ है प्रत्येक एजेंट को अपने sandboxed environment में चलाना — separate process, filesystem, network namespace, और memory space। OpenLegion में, प्रत्येक task on demand चलकर रुक जाता है, एजेंट जो code लिखता है वह default पर बिना network access के एक sandbox में चलता है, और एजेंट्स कोई storage share नहीं करते। इसका अर्थ है कि एक compromised एजेंट अन्य एजेंट्स के data, credential vault, या host system को access नहीं कर सकता। यह उन frameworks से भिन्न है जहाँ एजेंट्स एक Python process share करते हैं और एक-दूसरे की memory को access कर सकते हैं।

### AI एजेंट्स को बजट / cost controls क्यों चाहिए?

स्वायत्त एजेंट्स recursive loops में प्रवेश कर सकते हैं, अत्यधिक API calls कर सकते हैं, या जितना आवश्यक है उससे कहीं अधिक resources consume करने के लिए manipulated हो सकते हैं। बजट controls के बिना, एक single runaway एजेंट minutes में सैकड़ों dollars tokens में drain कर सकता है। Multi-agent systems में यह compounds करता है — प्रत्येक एजेंट risk को गुणा करता है। OpenLegion हर एजेंट को उसका अपना बजट एक hard cutoff के साथ देता है, $0.001 प्रति credit पर metered, किसी भी single एजेंट को unbounded cost का कारण बनने से रोकता है।

### क्या secure AI एजेंट्स BYO keys के साथ संभव हैं?

OpenLegion LLMs के लिए BYO (bring your own) key model का उपयोग नहीं करता — models preset से चुने जाते हैं, Smartest, Smart या Normal, प्रति एजेंट या प्रति workspace। जो service credentials आप लाते हैं, जैसे OAuth tokens और third-party API keys, एक vault में रखे जाते हैं और model के बाहर inject होते हैं, जिसके पास सिर्फ़ एक handle रहता है। आपको फिर भी full cost transparency मिलती है: काम की हर unit एक record किया गया wake है जो $0.001 प्रति credit पर metered है, और हर task की exact cost दिखती है।

### AI एजेंट्स के लिए OWASP Top 10 क्या है?

OWASP ने December 2025 में Agentic Applications के लिए Top 10 publish किया। #1 risk Agent Goal Hijacking है — जहाँ एक attacker एक एजेंट को user के intended goals से भिन्न goals का पीछा करने के लिए manipulate करता है। अन्य top risks में शामिल हैं credential leakage, excessive agency (एजेंट्स अपने scope से परे actions ले रहे हैं), और supply chain vulnerabilities (malicious tools या plugins)। OpenLegion इन्हें vault में रखे credentials, sandboxed task runs, permission matrices, और goal-and-task coordination (goals → tasks → एजेंट्स) के माध्यम से address करता है।

### OpenLegion सुरक्षा पर OpenClaw से कैसे तुलना करता है?

Public documentation के आधार पर, OpenLegion कठोर security defaults प्रदान करता है। OpenClaw के default local deployment को Docker socket mounting (broad host access प्रदान करता है) की आवश्यकता है, इसके security analyzer में consistent activation के साथ reported issues हुए हैं, और यह एजेंट process के लिए accessible configuration में credentials store करता है। OpenLegion हर task को एक sandboxed run में चलाता है, credentials को एक vault में रखता है जो model के बाहर inject होते हैं, प्रति-एजेंट budgets enforce करता है, और कई choke points पर unicode sanitization apply करता है। विस्तृत comparison के लिए, [OpenLegion बनाम OpenClaw](/comparison/openclaw) देखें।

### AI एजेंट्स पर कौन से compliance frameworks apply होते हैं?

Key frameworks में शामिल हैं OWASP Top 10 for LLM Applications (2025) और Agentic Applications (2026), NIST AI Risk Management Framework (आगामी AI Agent Standards के साथ), ISO/IEC 42001 (AI management systems), EU AI Act (enforcement August 2026 में शुरू), और आपके domain के आधार पर HIPAA, SOC 2, और SOX जैसे industry-specific regulations। OpenLegion का architecture उन environments के लिए designed है जिन्हें ये controls चाहिए लेकिन यह स्वयं certifications नहीं रखता।

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
