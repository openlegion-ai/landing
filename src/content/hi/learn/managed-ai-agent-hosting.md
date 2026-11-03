---
title: "Managed AI एजेंट Hosting - सुरक्षित Agent Fleets Deploy करें"
description: >-
  OpenLegion से managed AI एजेंट hosting: vaulted credentials और प्रति-एजेंट
  budgets के साथ एक hosted web app में सुरक्षित agent teams चलाएँ, बिना VPS के
  deploy करें, खुद चलाने के लिए कोई infrastructure नहीं।
slug: /learn/managed-ai-agent-hosting
primary_keyword: managed AI एजेंट hosting
secondary_keywords:
  - host ai agents
  - managed ai agent platform
  - hosted ai agents
  - ai agent hosting service
  - dedicated vps for ai agents
  - ai agent infrastructure
  - cloud ai agent hosting
  - secure ai agent hosting
date_published: 2026-05
last_updated: 2026-05
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /comparison
---

# सुरक्षित Agent Fleets के लिए Managed AI एजेंट Hosting

आप एक AI workforce चाहते थे। जो आपको मिला वह DevOps में एक दूसरी नौकरी थी। Managed AI एजेंट hosting वह नौकरी वापस सौंप देता है। यह आपके एजेंट्स को चाहिए वे servers, isolation, credential vault, और budgets चलाता है, ताकि आप उनमें से कुछ भी खुद provision न करें। OpenLegion एक hosted web app है: Google से sign in करें और शुरू करें, install करने को कुछ नहीं और किराए पर लेने के लिए कोई dedicated VPS नहीं, आपकी keys एक ऐसे vault में जिसे एजेंट्स कभी touch नहीं करते, और default रूप से हर एजेंट पर एक बजट। आप एक goal लाते हैं; हम नीचे का floor चलाते हैं।

<!-- SCHEMA: DefinitionBlock -->

> **Managed AI एजेंट hosting क्या है?**
> Managed AI एजेंट hosting एक service है जो उस infrastructure को provision, isolate, secure, और operate करती है जिस पर स्वायत्त AI एजेंट्स चलते हैं: containers, credential storage, budgets, networking, और एक control dashboard, ताकि एक team उस infrastructure को खुद build या maintain किए बिना agent fleets deploy कर सके।

## TL;DR

- Managed AI एजेंट hosting आपके और एक running fleet के बीच का काम हटा देता है: कोई server setup नहीं, कोई Docker tuning नहीं, चलाने के लिए कोई vault नहीं।
- एजेंट्स durable records हैं, servers नहीं: एक बनाना instant है, एक idle एजेंट कुछ खर्च नहीं करता, और एक workspace सैकड़ों चला सकता है।
- Credentials एक vault में रहती हैं और model के बाहर inject होती हैं, जिसके पास सिर्फ़ एक handle रहता है, इसलिए एक compromised एजेंट उन्हें पढ़ नहीं सकता।
- हर एजेंट का अपना बजट होता है, और काम की हर unit एक record किया गया wake है जो $0.001 प्रति credit पर metered है।
- Engine PolyForm Perimeter License 1.0.1 के तहत source-available प्रकाशित है; hosted प्लेटफ़ॉर्म proprietary है।
- Free $0 है, 1,000 one-time credits और बिना card; Pro $29/month है, 10,000 credits के साथ; Team $99/month है, 35,000 के साथ।

## "बस एक एजेंट चलाओ" की छिपी हुई लागत

एक एजेंट खड़ा करना एक weekend है। एक ऐसा fleet चलाना जिस पर आप भरोसा कर सकें एक quarter है।

prototype और production के बीच कहीं, काम चुपचाप अपना आकार बदल देता है। आप prompts tune करना बंद कर देते हैं और containers tune करना शुरू कर देते हैं। आप यह सोचना बंद कर देते हैं कि एजेंट को क्या कहना चाहिए और यह सोचना शुरू कर देते हैं कि इसकी API keys कहाँ रहती हैं, जब कोई 3am पर loop करता है तो क्या होता है, और एक compromised एजेंट को बाकी नौ तक पहुँचने से कैसे रोका जाए। उनमें से कुछ भी वह काम नहीं है जो आपने करने का इरादा किया था। यह सब वह काम है जो तय करता है कि एजेंट्स को चलता छोड़ना safe है या नहीं।

Managed hosting ठीक उसी layer को absorb करने के लिए मौजूद है। OpenLegion की hosted offering के साथ आपको मिलता है:

- **एक hosted web app** जिसमें install करने को कुछ नहीं और किराए पर लेने के लिए कोई dedicated VPS नहीं — Google से sign in करें और शुरू करें।
- **हर task के लिए एक sandboxed run** — प्रत्येक task on demand चलता है और फिर रुक जाता है, और एजेंट जो code लिखता है उसके पास default पर कोई network access नहीं होता।
- **एक credential vault** जो API keys और OAuth tokens को पूरी तरह model के बाहर रखता है, जिसके पास सिर्फ़ एक handle रहता है।
- **प्रति-एजेंट budget enforcement** hard cutoffs के साथ, ताकि एक looping एजेंट एक surprise invoice generate न कर सके।
- **एक control dashboard** templates deploy करने, एजेंट्स के साथ chat करने, live cost और health देखने, और misbehave करने वाली किसी भी चीज़ को pause करने के लिए।
- **शामिल credits** हर plan पर, हर महीने refresh होते हुए, preset से चुने गए models के साथ — Smartest, Smart या Normal।

## Managed Hosting बनाम Self-Hosting: कैसे चुनें

OpenLegion वही engine दो तरीकों से ship करता है, इसलिए decision इस बारे में है कि box कौन चलाता है, न कि कौन सा version अधिक capable है।

| विचार | Self-hosted (PolyForm Perimeter License 1.0.1) | Managed hosting |
|---|---|---|
| Servers कौन चलाता है | आप | OpenLegion |
| Setup time | आपकी machine पर तीन commands | Google से sign in, install करने को कुछ नहीं |
| Credential vault | आप इसे operate करते हैं | आपके लिए operated, model के बाहर |
| Updates और patching | आप pull और redeploy करते हैं | आपके लिए applied |
| Data residency | पूरी तरह आपके infrastructure पर | हमारे द्वारा चलाए जाने वाले hosted प्लेटफ़ॉर्म पर |
| किसके लिए best | Regulated, air-gapped, full control | वे teams जो आज एक team चलाना चाहती हैं |
| Cost model | आपके अपने server costs | Free $0, Pro $29/mo, Team $99/mo |

Self-hosting तब चुनें जब compliance, data residency, या host पर total control इसे चलाने की लागत से अधिक भारी हो। Managed hosting तब चुनें जब आप चाहते हैं कि एजेंट्स आज दोपहर काम करें और एक vault, एक runtime, और एक update cadence के मालिक नहीं बनना पसंद करते। OpenLegion launch पर केवल hosted प्लेटफ़ॉर्म प्रदान करता है, इसलिए जाने के लिए कोई self-hosted प्लेटफ़ॉर्म है ही नहीं।

## जब आप Deploy दबाते हैं तो क्या होता है

Google से sign in करें और आपका workspace तैयार है — provision करने को कुछ नहीं है। इसके साथ एक assistant बनता है, और वह ज़रूरी teammates बनाता है। वहाँ से आप उस team का वर्णन करते हैं जो आप चाहते हैं: एक research desk, एक sales pipeline, एक content studio, और platform प्रत्येक role को अपने स्वयं के memory, budget, और tool permissions के साथ एक durable record के रूप में बनाता है।

एजेंट्स [orchestration layer](/learn/ai-agent-orchestration) के माध्यम से coordinate करते हैं: काम goals से tasks से एजेंट्स तक organise होता है, event wakes और teammates के बीच delegation के साथ। हर action एक intent है जिसे होने से पहले एक ही policy engine check करता है, जो behavior को auditable और costs को predictable रखता है। आप हर plan पर web chat में, Pro से Telegram और webhooks के माध्यम से, या Team तथा उससे ऊपर Slack और inbound email के माध्यम से एजेंट्स से बात करते हैं।

## ऐसी Security जो आपको Build नहीं करनी पड़ती

एजेंट्स को safely host करने का सबसे कठिन हिस्सा वह हिस्सा है जिसे teams अक्सर छोड़ देती हैं, क्योंकि यह तब तक invisible है जब तक यह fail न हो जाए। OpenLegion का managed plane वही defense-in-depth enforce करता है जो [AI एजेंट सुरक्षा](/learn/ai-agent-security) model में वर्णित है, default रूप से on:

- हर task के लिए एक sandboxed run, compromise करने के लिए कोई long-lived एजेंट process नहीं।
- एक credential vault जो credentials को model के बाहर inject करता है, इसलिए एजेंट्स कभी कच्ची keys नहीं रखते।
- एक प्रति-एजेंट permission matrix जो govern करती है कि प्रत्येक एजेंट कौन से tools, files, और operations उपयोग कर सकता है।
- हर boundary पर input sanitization, SSRF protection, और prompt-injection hardening।
- प्रति-एजेंट budget ceilings जो fail closed होते हैं।

आप इन्हें sign up करके inherit करते हैं, एक hardening guide पढ़कर और इसे खुद implement करके नहीं। नीचे के runtime के लिए, [AI एजेंट प्लेटफ़ॉर्म](/learn/ai-agent-platform) overview देखें।

## Pricing और आप किसके लिए भुगतान करते हैं

Free $0 है, 1,000 one-time credits और बिना card; Pro $29/month है, 10,000 credits के साथ; Team $99/month है, 35,000 के साथ; Enterprise $1,500 से शुरू होता है। काम $0.001 प्रति credit पर metered है, और हर task की exact cost दिखती है। शामिल credits हर महीने refresh होते हैं; आपके खरीदे गए credit packs कभी expire नहीं होते। Billing Stripe पर चलती है। [pricing page](/pricing) पर plan limits compare करें।

## OpenLegion की राय

market पर अधिकांश "AI agent hosting" एक shared process है जो सबकी एजेंट्स चलाता है, config में बैठी keys, कोई real budget enforcement नहीं। यह एक demo के लिए ठीक है और production में dangerous, क्योंकि जो failure modes वास्तव में आपको महंगे पड़ते हैं: एक leaked credential, एक runaway cost loop, एक compromised एजेंट जो दूसरे tenant तक पहुँचता है, ठीक वही हैं जिन्हें shared infrastructure और बदतर बनाता है। Managed hosting केवल तभी भुगतान करने लायक है अगर यह आपको isolation और credential safety खरीद कर देता है जो आपको अन्यथा हाथ से build करनी पड़ती। हमारा रुख यह है कि वे guarantees default होनी चाहिए, न कि कोई ऐसा tier जिसमें आप upgrade करें, इसलिए हर plan को वही isolation, वही vault, और हर action के आगे वही policy engine मिलता है।

## CTA

**Infrastructure चलाए बिना एक सुरक्षित agent team deploy करें।**
[शुरू करें](https://app.openlegion.ai) | [Pricing देखें](/pricing) | [Docs पढ़ें](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## अक्सर पूछे जाने वाले प्रश्न

### Managed AI एजेंट hosting क्या है?

Managed AI एजेंट hosting एक service है जो उस infrastructure को provision और operate करती है जिसकी स्वायत्त AI एजेंट्स को आवश्यकता है: isolated containers, एक credential vault, budget enforcement, networking, और एक control dashboard, ताकि एक team उस infrastructure को build या maintain किए बिना agent fleets deploy और चला सके। OpenLegion के साथ आप Google से sign in करते हैं और शुरू करते हैं — install करने को कुछ नहीं है और किराए पर लेने के लिए कोई dedicated VPS नहीं।

### Managed hosting OpenLegion self-hosting से कैसे भिन्न है?

OpenLegion एक hosted web app है, और launch पर कोई self-hosted प्लेटफ़ॉर्म नहीं है। सामान्य रूप से self-hosting का अर्थ है आप servers चलाते हैं, vault operate करते हैं, और updates खुद apply करते हैं, जो regulated या air-gapped environments के लिए उपयुक्त है। Managed hosting का अर्थ है OpenLegion प्लेटफ़ॉर्म चलाता है, vault operate करता है, और आपके लिए उसे patch करता है। नीचे का engine PolyForm Perimeter License 1.0.1 के तहत source-available प्रकाशित है; hosted प्लेटफ़ॉर्म proprietary है।

### क्या मेरी API और wallet keys रखने वाले AI एजेंट्स को host करना safe है?

हाँ, जब keys कभी एजेंट के अंदर नहीं रहतीं। OpenLegion पर, API keys और OAuth tokens एक vault में रखे जाते हैं और model के बाहर inject किए जाते हैं, जिसके पास सिर्फ़ एक handle रहता है, इसलिए एक पूरी तरह compromised एजेंट भी secret को पढ़ या exfiltrate नहीं कर सकता। OpenLegion wallet keys या agent funds बिल्कुल नहीं रखता।

### Managed AI एजेंट hosting की क्या लागत है?

Free $0 है, 1,000 one-time credits और बिना card; Pro $29/month है, 10,000 credits के साथ; Team $99/month है, 35,000 के साथ; Enterprise $1,500 से शुरू होता है। fee hosted प्लेटफ़ॉर्म, credential vault, dashboard, और plan के शामिल credits को cover करती है — भुगतान करने के लिए कोई dedicated VPS नहीं है। काम $0.001 प्रति credit पर metered है, शामिल credits हर महीने refresh होते हैं, और आपके खरीदे गए credit packs कभी expire नहीं होते।

### क्या managed hosting उपयोग करने के लिए मुझे Docker या DevOps जानने की आवश्यकता है?

नहीं। OpenLegion एक hosted web app है: Google से sign in करें और शुरू करें — install करने को कुछ नहीं है। आप एक dashboard के माध्यम से काम करते हैं: जो team आप चाहते हैं वह बताएँ, और assistant ज़रूरी teammates बना देता है। Docker, Python, और server administration इसका हिस्सा ही नहीं हैं।

### क्या मैं बाद में managed hosting से self-hosted पर जा सकता हूँ?

Launch पर नहीं। hosted प्लेटफ़ॉर्म ही आज OpenLegion चलाने का एकमात्र तरीका है, और यह proprietary है; नीचे का engine PolyForm Perimeter License 1.0.1 के तहत source-available प्रकाशित है। अभी migrate करने के लिए कोई self-hosted distribution नहीं है, इसलिए फ़िलहाल hosted प्लेटफ़ॉर्म की योजना बनाएँ।

### एक managed plan पर मैं कितने एजेंट्स host कर सकता हूँ?

Agent limits plan tier के साथ scale करती हैं, entry plan पर एक छोटी team से लेकर higher tiers पर बड़ी teams तक, enterprise के लिए custom limits के साथ। एजेंट्स servers के बजाय durable records हैं, इसलिए एक बनाना instant है और एक idle एजेंट कुछ खर्च नहीं करता — प्रत्येक एजेंट limit की ओर एक गिना जाता है, इसलिए एक Dev Team जैसी three-role team तीन एजेंट्स गिनी जाती है।
