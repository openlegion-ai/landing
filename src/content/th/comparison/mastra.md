---
title: ทางเลือก Mastra — แพลตฟอร์ม AI Agent ที่ให้ความสำคัญด้านความปลอดภัย
description: Mastra เป็นเฟรมเวิร์ค TypeScript เท่านั้น ล็อก RBAC ไว้หลัง ee/ กรรมสิทธิ์ และ CVE-2025-61685 เปิดเผยข้อมูลรับรอง เปรียบเทียบทางเลือก Mastra
slug: /comparison/mastra
primary_keyword: ทางเลือก mastra
secondary_keywords:
  - openlegion เทียบ mastra
  - ความปลอดภัย mastra
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

# ทางเลือก Mastra: แพลตฟอร์มที่เน้นความปลอดภัย เทียบกับเฟรมเวิร์ค TypeScript-first

Mastra คือเฟรมเวิร์ค AI Agent ด้วย TypeScript จากทีม Gatsby มี 24,329 GitHub Stars — แต่ CVE-2025-61685 (CVSS 6.5) เปิดเผยไฟล์ข้อมูลรับรอง  ผ่านการฉีด Prompt ใน Cursor IDE, RBAC และ Auth ถูกล็อกไว้หลังไดเรกทอรี่  กรรมสิทธิ์ และ PR สองรายการที่ยังไม่ได้ Merge ทิ้งช่องโหว่ open-redirect และ OAuth CSRF ไว้โดยไม่ได้ Patch จนถึงพฤษภาคม 2026

<!-- SCHEMA: DefinitionBlock -->

> **Mastra คืออะไร?**
> Mastra คือเฟรมเวิร์ค AI Agent TypeScript แบบโอเพนซอร์สจาก Kepler Software (ทีมที่สร้าง Gatsby) มี 24,329 GitHub Stars เปิดตัวสิงหาคม 2024 ให้บริการ workflow orchestration, tool calling และ RAG primitives ภายใต้ใบอนุญาตสองชั้น — Apache 2.0 สำหรับ core และใบอนุญาตกรรมสิทธิ์สำหรับไดเรกทอรี่ 

## เหตุใดนักพัฒนาจึงมองหาทางเลือก Mastra

### CVE-2025-61685: การเปิดเผยไฟล์ข้อมูลรับรองผ่าน MCP Docs Server

CVE-2025-61685 (CVSS 6.5, 24 กันยายน 2025) เป็นช่องโหว่การข้ามผ่านไดเรกทอรี่ใน `@mastra/mcp-docs-server` เวอร์ชัน ≤0.13.8 ค้นพบโดย Liran Tal ช่วยให้ฉีด Prompt ผ่าน Cursor IDE เพื่อเข้าถึง `~/.aws/credentials`, `~/.config/` และ `~/.cursor/` Mastra แก้ไขในเวอร์ชัน 0.17.0

### ใบอนุญาตสองชั้น: ฟีเจอร์ความปลอดภัยอยู่หลัง Paywall `ee/`

ไดเรกทอรี่ `ee/` มี auth integrations, RBAC และการบังคับใช้สิทธิ์ adapter เป็นกรรมสิทธิ์ **RBAC เป็น enterprise add-on** **สิทธิ์ Adapter ถูกล็อก** **Auth integrations เป็นกรรมสิทธิ์**

### PR ความปลอดภัยที่ยังไม่ได้ Merge ใน Enterprise Auth Stack

**CVE-2026-42565 (CVSS 4.3)**: open redirect ใน `@workos/authkit-session`

**GHSA-wxw3-q3m9-c3jr (CVSS 5.3)**: OAuth CSRF ใน `better-auth`

## มุมมอง OpenLegion: ช่องโหว่ความปลอดภัยเชิงโครงสร้างสามด้าน

**การเปิดเผยข้อมูลรับรองตามการออกแบบ** Vault proxy ของ OpenLegion ฉีดข้อมูลรับรองที่ชั้น network — กระบวนการ agent ไม่เคยได้รับ API key แบบ plaintext

**ความปลอดภัยเป็น enterprise upgrade** RBAC, สิทธิ์ adapter และ auth integrations ต้องการ tier `ee/` ใน OpenLegion สิ่งเหล่านี้เป็นฟีเจอร์หลักสำหรับทุกคน

**ช่องโหว่ auth ที่ไม่ได้ Patch ในระดับที่ต้องชำระเงิน** OpenLegion มีสถิติ CVE เป็นศูนย์จนถึงพฤษภาคม 2026

## Mastra เทียบ OpenLegion: เปรียบเทียบแบบคู่ขนาน

| **มิติ** | **Mastra** | **OpenLegion** |
|---|---|---|
| **รองรับภาษา** | TypeScript เท่านั้น | Python (agents) |
| **ใบอนุญาต** | Apache 2.0 (core) + `ee/` กรรมสิทธิ์ | BSL 1.1 → Apache 2.0 หลัง 4 ปี |
| **GitHub Stars** | 24,329 (พฤษภาคม 2026) | Pre-release |
| **โมเดลข้อมูลรับรอง** | Environment variables | Vault proxy |
| **การแยกตัว Agent** | ระดับ Process | Docker container บังคับ |
| **RBAC** | Tier `ee/` เท่านั้น | สิทธิ์ blackboard ต่อ agent |
| **สถิติ CVE** | CVE-2025-61685 + 2 PR ที่เปิดอยู่ | 0 CVE ที่รายงาน |
| **Auth** | WorkOS AuthKit / better-auth (ee/) | Vault proxy |
| **ควบคุมงบประมาณ** | ไม่มีในตัว | วงเงินรายวัน/รายเดือนต่อ agent |
| **Multi-agent** | Workflow orchestration | Blackboard + pub/sub + mesh |
| **Open Issues** | 433 (26 พฤษภาคม 2026) | Pre-release |

## TypeScript เท่านั้น: ความหมายในทางปฏิบัติ

Mastra เป็น TypeScript-first โดยการออกแบบและปัจจุบันเป็น TypeScript เท่านั้น สำหรับทีมที่มีโครงสร้างพื้นฐาน Python ML/data อยู่แล้ว Mastra ไม่ใช่ตัวเลือกที่ใช้งานได้

## สถาปัตยกรรมความปลอดภัย: Vault Proxy เทียบ Environment Variables

Mastra agents รับ LLM API keys ผ่าน `process.env` CVE-2025-61685 แสดงให้เห็นความเสี่ยงที่จับต้องได้ Vault proxy ของ OpenLegion อยู่ที่ชั้น network ระหว่าง agents และผู้ให้บริการ LLM สำหรับการวิเคราะห์เพิ่มเติม ดู [ความปลอดภัย AI agent: การแยกตัว credential](/learn/ai-agent-security)

## OpenLegion เป็นทางเลือก Mastra

การประสานงาน multi-agent ผ่าน blackboard state, pub/sub events และ mesh handoff การฉีดข้อมูลรับรอง vault proxy วงเงินงบประมาณรายวันและรายเดือนต่อ agent ผู้ให้บริการ LLM 100+ ผ่าน LiteLLM

**Trade-offs ที่ซื่อสัตย์:** ไม่มี TypeScript SDK — Python เท่านั้น ชุมชนเล็กกว่า 24,329 Stars ของ Mastra ไม่มี workflow visualization ในตัว

ดูสิ่งที่ [แพลตฟอร์ม AI agent ให้มากกว่าเฟรมเวิร์ค](/learn/ai-agent-platform) เปรียบเทียบ [OpenLegion กับ LangGraph](/comparison/langgraph), [OpenLegion กับ CrewAI](/comparison/crewai) และ [เฟรมเวิร์ค AI agent 2026](/learn/ai-agent-frameworks)

<!-- SCHEMA: FAQPage -->

## คำถามที่พบบ่อย

### Mastra คืออะไรและใครสร้างมัน?

Mastra คือเฟรมเวิร์ค TypeScript agent มี 24,329 GitHub Stars สร้างโดย Kepler Software (ทีม Gatsby) ตั้งแต่สิงหาคม 2024 ให้บริการ workflow orchestration, tool calling, RAG primitives ภายใต้ใบอนุญาตสองชั้น Apache 2.0 สำหรับ core และใบอนุญาตกรรมสิทธิ์สำหรับไดเรกทอรี `ee/`

### CVE-2025-61685 ส่งผลกระทบต่อการใช้งาน Mastra อย่างไร?

CVE-2025-61685 (CVSS 6.5) เป็นช่องโหว่การข้ามผ่านไดเรกทอรีใน `@mastra/mcp-docs-server` เวอร์ชัน ≤0.13.8 ช่วยให้ผู้โจมตีเข้าถึงไฟล์ `~/.aws/credentials`, `~/.config/` และ `~/.cursor/` ผ่าน Cursor IDE Mastra แก้ไขในเวอร์ชัน 0.17.0 ทีมงานที่ใช้เวอร์ชันก่อนหน้าควรอัปเดตทันที

### ทำไม RBAC ของ Mastra ถึงถูกล็อกไว้หลังไดเรกทอรี `ee/`?

ไดเรกทอรี `ee/` มี auth integrations, RBAC และการบังคับใช้สิทธิ์ adapter ภายใต้ใบอนุญาตกรรมสิทธิ์ โดยไม่มีภายใต้ Apache 2.0 ซึ่งหมายความว่าฟีเจอร์ความปลอดภัยหลักต้องชำระเงิน ทีมที่ต้องการควบคุมการเข้าถึงโดยไม่ต้องชำระเงินเพิ่มเติมควรประเมินทางเลือก OpenLegion มีสิทธิ์ blackboard ต่อ agent สำหรับทุกคน

### ความแตกต่างสำคัญระหว่าง Mastra และ OpenLegion คืออะไร?

Mastra เป็น TypeScript-only มี environment variable credentials และ RBAC อยู่หลัง tier `ee/` กรรมสิทธิ์ OpenLegion เป็น Python-only มี vault proxy credentials และ RBAC เป็นสิทธิ์หลัก การเลือกขึ้นอยู่กับว่าทีมใช้ TypeScript หรือ Python เป็นหลัก และข้อกำหนดความปลอดภัยโดยไม่มีต้นทุนเพิ่มเติม

### Mastra รองรับภาษาโปรแกรมอะไรบ้าง?

Mastra รองรับ TypeScript เท่านั้น ไม่มี Python SDK, Go client หรือ JVM integration ทีมที่มีโครงสร้างพื้นฐาน Python ML/data อยู่แล้วควรประเมิน OpenLegion, LangGraph หรือ CrewAI แทน

### Mastra มีการประสานงาน multi-agent อย่างไร?

Mastra ใช้ workflow orchestration และ tool calling สำหรับการประสานงาน multi-agent รองรับ step sequencing และ parallel execution ผ่าน TypeScript APIs อย่างไรก็ตาม RBAC และ permission enforcement สำหรับ agent-to-agent communication ถูกล็อกไว้หลัง `ee/`

### OpenLegion จัดการการแยกตัว agent อย่างไร?

OpenLegion แยกตัว agents ด้วย Docker containers ต่อ agent บังคับ vault proxy ฉีดข้อมูลรับรองที่ชั้น network กระบวนการ agent ไม่เคยได้รับ API keys แบบ plaintext สิ่งนี้ทำให้การเปิดเผยข้อมูลรับรองในรูปแบบ CVE-2025-61685 เป็นไปไม่ได้เชิงโครงสร้าง

### PR ความปลอดภัยที่ยังไม่ได้ Merge ในระบบ Mastra auth คืออะไร?

PR สองรายการที่ยังไม่ได้ Merge ณ พฤษภาคม 2026: CVE-2026-42565 (CVSS 4.3) open redirect ใน `@workos/authkit-session` และ GHSA-wxw3-q3m9-c3jr (CVSS 5.3) OAuth CSRF ใน `better-auth` ทั้งสองส่งผลกระทบต่อ enterprise auth stack ใน tier `ee/`

### เมื่อใดที่ควรเลือก Mastra แทน OpenLegion?

เลือก Mastra เมื่อทีมเป็น TypeScript-first, ต้องการ workflow visualization ในตัว หรือต้องการระบบนิเวศที่ใหญ่กว่า (24,329 Stars) เลือก OpenLegion เมื่อทีมใช้ Python, ต้องการ vault proxy credential isolation โดยไม่มีต้นทุนเพิ่มเติม หรือต้องการ RBAC เป็นฟีเจอร์หลักไม่ใช่ enterprise add-on
