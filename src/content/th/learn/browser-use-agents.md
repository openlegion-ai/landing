---
title: "Browser Use Agents — วิธีที่ AI Agents ควบคุมเว็บ"
description: "Browser Use Agents ช่วยให้ AI สามารถนำทางเว็บไซต์อัตโนมัติ กรอกแบบฟอร์ม และดึงข้อมูลได้ เรียนรู้วิธีการทำงาน ความเสี่ยงด้านความปลอดภัย และวิธีรันอย่างปลอดภัยในคอนเทนเนอร์ที่แยกออกจากกัน"
slug: /learn/browser-use-agents
primary_keyword: browser use agents
secondary_keywords:
  - ai browser automation
  - browser agent python
  - web agent llm
  - headless browser ai agent
  - browser use security
date_published: 2026-05
last_updated: 2026-05-30
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/model-context-protocol
---

# Browser Use Agents: วิธีที่ AI Agents นำทางและควบคุมเว็บ

Browser Use Agents คือระบบ AI ที่ควบคุมเว็บเบราว์เซอร์อย่างอัตโนมัติโดยไม่ต้องมีการป้อนข้อมูลจากมนุษย์ในแต่ละขั้นตอน: นำทาง URL กดปุ่ม กรอกแบบฟอร์ม ดึงเนื้อหา และจัดการการยืนยันตัวตน พวกเขาเป็นหมวดหมู่เครื่องมือ AI agent ที่เติบโตเร็วที่สุดในปี 2026 โดยมี framework อย่าง browser-use (96,282 GitHub stars ณ เดือนพฤษภาคม 2026) เป็นผู้ขับเคลื่อน

<!-- SCHEMA: DefinitionBlock -->

> **Browser Use Agent คืออะไร?**
> Browser Use Agent คือ AI agent ที่ขับเคลื่อนเว็บเบราว์เซอร์แบบ headless หรือมีหัวด้วยโปรแกรมโดยใช้การทำ DOM traversal, การแยกวิเคราะห์ accessibility tree, screenshot grounding และการเลือกการกระทำที่นำโดย LLM เพื่อทำงานบนเว็บได้อย่างอัตโนมัติ

## วิธีการทำงานของ Browser Use Agents

### การรับรู้: DOM, Accessibility Tree และ Screenshot Grounding

Browser agent ต้องเข้าใจสถานะของหน้าปัจจุบันก่อนที่จะดำเนินการ มีกลยุทธ์การรับรู้ 3 แบบที่ใช้กันทั่วไป

**การดึง DOM** แยกวิเคราะห์โครงสร้าง HTML ดิบของหน้า รวดเร็วและมีประสิทธิภาพในแง่ token แต่ล้มเหลวกับเนื้อหาที่เรนเดอร์ด้วย canvas และ SPA ที่ซับซ้อน

**Accessibility Tree** อ่านชั้น accessibility ในตัวของเบราว์เซอร์ ให้มุมมองทางความหมายที่มีโครงสร้างของหน้า นี่คือวิธีการรับรู้หลักที่ browser-use ใช้

**Screenshot Grounding** จับภาพหน้าจอแบบภาพของหน้าและส่งต่อไปยัง LLM ที่มีความสามารถด้านภาพ จัดการกับหน้าที่ DOM และ accessibility tree ไม่น่าเชื่อถือ แต่ค่าใช้จ่ายด้าน token สูงกว่ามากในแต่ละขั้นตอน

### การกระทำ: คลิก พิมพ์ นำทาง ส่งแบบฟอร์ม

พื้นที่การกระทำของ browser agent นั้นกว้าง: นำทางไปยัง URL คลิกองค์ประกอบ พิมพ์ข้อความ กดปุ่ม เลื่อน เลือกดรอปดาวน์ อัปโหลดไฟล์ หรือสลับแท็บเบราว์เซอร์ การกระทำแต่ละอย่างเปลี่ยนสถานะของหน้า

## ไลบรารี browser-use

### 96,282 Stars ในเวลาไม่ถึง 7 เดือน

browser-use (GitHub: browser-use/browser-use) เปิดตัวเมื่อวันที่ 31 ตุลาคม 2024 และมีถึง 96,282 stars และ 10,802 forks ในเดือนพฤษภาคม 2026 ไลบรารีนี้ abstract การจัดการ session ของ Playwright, การดึง accessibility tree และการทำ action serialization

### Playwright Backend: วิธีที่ browser-use ควบคุม Chromium

browser-use ห่อหุ้มไลบรารี automation ของ Playwright จาก Microsoft และเพิ่มชั้น agent: ดึง accessibility tree แปลงเป็นรูปแบบที่มีประสิทธิภาพด้าน token แปลการตัดสินใจการกระทำของ LLM เป็นคำสั่ง Playwright

### การผสาน LLM: GPT-4o, Claude, Gemini ในฐานะชั้นการใช้เหตุผล

browser-use ไม่ผูกติดกับ LLM ใดๆ ในชั้นการใช้เหตุผล รองรับ OpenAI, Anthropic, Google และ endpoint API ที่เข้ากันได้กับ OpenAI ทุกตัว

## มุมมองของ OpenLegion: Browser Agents คือเครื่องมือที่มีความเสี่ยงสูงสุด

Browser agents คือหมวดหมู่เครื่องมือที่มีความเสี่ยงสูงสุดใน agentic AI Browser agent ที่สามารถคลิก กรอกแบบฟอร์ม และติดตาม redirect มีพื้นที่การโจมตีเหมือนกับมนุษย์ที่มีการเข้าถึงอินเทอร์เน็ตอย่างสมบูรณ์

### การสาธิตการขโมย Credential ใน 150 วินาที

งานวิจัยที่บันทึกไว้อย่างเป็นสาธารณะในปี 2025 แสดงให้เห็นว่า browser agent สามารถถูกจัดการเพื่อขโมย credential ได้ภายใน 150 วินาที ผ่านคำสั่งที่ซ่อนอยู่ในหน้าเว็บ การป้องกันนั้นเป็นแบบสถาปัตยกรรม: หาก credentials ไม่มีอยู่ใน context ของ agent หรือหน่วยความจำของ process การ injection ก็ไม่สามารถดึงออกมาได้ ใน OpenLegion credentials อยู่ใน vault และถูก inject นอกโมเดล ซึ่งถือเพียง handle เท่านั้น จึงไม่ปรากฏใน context window ของ agent เลย

### OWASP LLM08 Excessive Agency และการอนุญาตของเบราว์เซอร์

OWASP LLM Top 10 2025 จัดอันดับ excessive agency (LLM08) เป็นหมวดหมู่ความเสี่ยงอันดับต้นๆ Browser agents คือตัวอย่างที่ชัดเจน: agent ที่มีสิทธิ์ในการนำทาง อ่าน กรอกแบบฟอร์ม และกดปุ่มสามารถทำการซื้อ ส่งข้อความ ลบบัญชี และขโมยข้อมูล

### วิธีที่ OpenLegion Sandbox การกระทำของ Agent (แซนด์บ็อกซ์ + การอนุมัติ)

OpenLegion ไม่มี browser automation ตอนเปิดตัว และโค้ดที่ agent เขียนรันในแซนด์บ็อกซ์ที่ไม่มีการเข้าถึงเครือข่ายเป็นค่าเริ่มต้น มีสี่คุณสมบัติที่กำหนดกรอบการกักงานของ agent: ไม่มีสถานะ session ที่ใช้ร่วมกัน ต้านทานการ fingerprint เป็นคุณสมบัติของชั้นเบราว์เซอร์, credentials ที่เก็บใน vault, การอนุมัติก่อนกระทำต่อเนื้อหาที่ไม่น่าเชื่อถือ

## รูปแบบสถาปัตยกรรม Browser Agent

### Headless กับ Headed

**โหมด Headless** เร็วกว่าและทำงานในสภาพแวดล้อม server แต่สามารถตรวจพบได้โดยระบบป้องกัน bot Camoufox รันในโหมด headless แต่ patch JavaScript APIs ที่สคริปต์ตรวจจับ headless กำหนดเป้าหมาย

### การจัดการ CAPTCHA

สามแนวทาง: เบราว์เซอร์เชิงพฤติกรรม (ต้านทานการ fingerprint), บริการแก้ CAPTCHA ($1-3 ต่อ 1,000 การแก้), การสำรองแบบ human-in-the-loop สิ่งที่เทียบเท่าใน OpenLegion คือกำแพงการอนุมัติ: งานหยุดในแอปเมื่อเจ้าของหรือผู้ดูแลระบบต้องตัดสินใจ

### การ Inject Credentials: Credential Vault กับ Cookie ที่ฮาร์ดโค้ด

**แย่ที่สุด**: credentials โดยตรงในคำสั่งของ agent **แย่**: ตัวแปรสภาพแวดล้อม (เข้าถึงได้ผ่าน `os.environ`) **ถูกต้อง**: การ inject จาก credential vault นอกโมเดล ซึ่งถือเพียง handle เท่านั้น

## Browser Use Agents: การเปรียบเทียบสถาปัตยกรรม

| **มิติ** | **OpenLegion** | **browser-use** | **Raw Playwright** | **Stagehand** |
|---|---|---|---|---|
| **Execution Backend** | ไม่มีตอนเปิดตัว — ไม่มี browser automation | Playwright (Chromium) | Playwright | Cloud Chromium |
| **Session Isolation** | การรันในแซนด์บ็อกซ์ต่องาน — เชิงโครงสร้าง | Process ที่ใช้ร่วมกัน | ขึ้นอยู่กับการนำไปใช้ | จัดการโดย cloud |
| **การจัดการ Credentials** | เก็บใน vault ฉีดนอกโมเดล | ผ่าน context window | การนำไปใช้ด้วยตนเอง | จัดการ |
| **รองรับ CAPTCHA** | ไม่เกี่ยวข้อง — ไม่มี browser automation | ไม่มีในตัว | ไม่มีในตัว | บริการแก้ CAPTCHA |
| **Container Sandboxing** | การรันงานในแซนด์บ็อกซ์ ไม่มีเครือข่ายเป็นค่าเริ่มต้น | ไม่มี | ไม่มี | Cloud sandbox |
| **GitHub Stars** | — | 96,282 (พฤษภาคม 2026) | N/A | ~9,000 |
| **ใบอนุญาต** | PolyForm Perimeter 1.0.1 (เอนจิน) | MIT | Apache 2.0 | MIT |

## เมื่อใดควรใช้ Browser Agents (และเมื่อใดไม่ควร)

**กรณีการใช้งานที่ถูกต้อง**: การวิจัยเว็บและการดึงข้อมูล, การทำแบบฟอร์มอัตโนมัติสำหรับบริการของตนเอง, การตรวจสอบและการทดสอบ **กรณีการใช้งานที่ต้องการการควบคุมเพิ่มเติม**: session ที่ผ่านการยืนยันตัวตน, เว็บไซต์การเงิน **หลีกเลี่ยงหากไม่มี sandbox ที่เข้มงวด**: URL ที่ไม่น่าเชื่อถือที่ผู้ใช้ให้มา

## เริ่มต้นกับการกระทำของ Agent ที่ปลอดภัยบน OpenLegion

**รัน agent ด้วย credentials ที่เก็บใน vault, การรันในแซนด์บ็อกซ์ต่องาน และการอนุมัติก่อนพวกมันลงมือ**
[เริ่มต้น](https://app.openlegion.ai) | [อ่านเอกสาร](https://docs.openlegion.ai) | [ดูแพลตฟอร์ม](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## คำถามที่พบบ่อย

### Browser Use Agents คืออะไร?

Browser Use Agents คือระบบ AI ที่ควบคุมเว็บเบราว์เซอร์อย่างอัตโนมัติผ่าน DOM traversal, การแยกวิเคราะห์ accessibility tree และการเลือกการกระทำที่นำโดย LLM ไลบรารี browser-use (96,282 GitHub stars, ใบอนุญาต MIT, เปิดตัวตุลาคม 2024) คือการนำไปใช้ open-source ที่ได้รับการยอมรับอย่างแพร่หลายที่สุด

### ไลบรารี browser-use ทำงานอย่างไร?

browser-use ห่อหุ้ม Playwright ของ Microsoft ให้ LLM มีมุมมองที่มีโครงสร้างของ accessibility tree ของเบราว์เซอร์ จากนั้นแปลการตัดสินใจการกระทำของ LLM เป็นคำสั่ง Playwright รองรับ GPT-4o, Claude, Gemini และ LLM ที่เข้ากันได้ มีใบอนุญาต MIT ต้องการโค้ด Python ประมาณ 20 บรรทัดสำหรับ agent ที่ทำงานได้

### ความเสี่ยงด้านความปลอดภัยของ Browser Use Agents คืออะไร?

ความเสี่ยงหลักสามประการ: prompt injection ผ่านเนื้อหาเว็บ (การสาธิตในปี 2025 แสดงให้เห็นการขโมย credential ใน 150 วินาที), การรั่วไหลของ credentials (หาก session cookies อยู่ในหน่วยความจำ process ของ agent), excessive agency (OWASP LLM08:2025) นอกจากนี้ยังมีการสาธิต zero-click link preview exfiltration ด้วย

### จะรัน browser agents อย่างปลอดภัยได้อย่างไร?

ต้องการการควบคุมสี่ประการ: การแยก container, credentials ที่เก็บใน vault, การควบคุม network egress, ขีดจำกัดงบประมาณต่อ agent OpenLegion ไม่มี browser automation ตอนเปิดตัว แต่ใช้การควบคุมทั้งสี่อย่างเดียวกันกับทุกการกระทำของ agent

### Camoufox คืออะไร และ OpenLegion ใช้มันหรือไม่?

Camoufox คือเบราว์เซอร์แบบ headless ที่ใช้ Firefox เป็นพื้นฐาน ซึ่ง patch JavaScript APIs เพื่อรายงานโปรไฟล์ฮาร์ดแวร์จริงแทนลายเซ็น headless OpenLegion ไม่ได้รัน Camoufox หรือ browser automation อื่นใดตอนเปิดตัว; การแยกของมันมาจากการรันในแซนด์บ็อกซ์ต่องานที่โค้ดในแซนด์บ็อกซ์ไม่มีการเข้าถึงเครือข่ายเป็นค่าเริ่มต้น

### ความแตกต่างระหว่าง browser-use และ Playwright สำหรับ AI agents คืออะไร?

Playwright คือไลบรารี automation เบราว์เซอร์ระดับต่ำที่ไม่มีแนวคิดของ AI agents browser-use เพิ่มชั้น agent: แปลงสถานะเบราว์เซอร์เป็นรูปแบบที่อ่านได้โดย LLM แปลการกระทำของ LLM เป็นคำสั่ง Playwright จัดการการแยกย่อยงานหลายขั้นตอนข้ามหน้าต่างๆ

### Browser Use Agents สามารถจัดการการเข้าสู่ระบบและ session ที่ผ่านการยืนยันตัวตนได้หรือไม่?

ได้ แต่การจัดการ session ที่ผ่านการยืนยันตัวตนเป็นหนึ่งในการดำเนินงานที่มีความเสี่ยงสูงสุด OpenLegion เก็บ credentials ไว้ใน vault และ inject นอกโมเดล — agent ทำงานผ่าน session ที่ยืนยันตัวตนโดยถือเพียง handle

### Browser agents จัดการ CAPTCHA อย่างไร?

สามแนวทาง: เบราว์เซอร์เชิงพฤติกรรม (ต้านทานการ fingerprint), บริการแก้ CAPTCHA ($1-3 ต่อ 1,000 ครั้ง, ความหน่วง 10-60 วินาที), การสำรองแบบ human-in-the-loop OpenLegion ไม่มี browser automation ตอนเปิดตัว; สิ่งที่เทียบเท่าแบบ human-in-the-loop คือกำแพงการอนุมัติ
