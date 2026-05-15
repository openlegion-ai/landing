---
title: Model Context Protocol (MCP) — วิธีที่ AI Agent ใช้เครื่องมือ
description: >-
  Model Context Protocol (MCP) คือมาตรฐานเปิดของ Anthropic ที่ให้ AI agent
  ค้นพบและเรียกเครื่องมือภายนอก วิธีการทำงาน ข้อควรระวังด้านความปลอดภัย
  และการรองรับ MCP ของ OpenLegion
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

# Model Context Protocol: มาตรฐานเปิดสำหรับเครื่องมือ AI Agent

**Model Context Protocol** (MCP) คือมาตรฐานเปิดที่ Anthropic เผยแพร่ในเดือนพฤศจิกายน 2024 ซึ่งให้ AI agent ค้นพบและเรียกเครื่องมือภายนอก — ฐานข้อมูล, file system, API, บริการภายใน — โดยไม่ต้องเขียนโค้ดเชื่อมต่อเฉพาะ MCP server เปิดเผยความสามารถ; MCP client (รันไทม์เอเจนต์, IDE, ผู้ช่วย) ใช้พวกมัน โปรโตคอลตั้งใจให้น้อยที่สุด ซึ่งก็เป็นจุดติดด้านโปรดักชัน: การดีพลอยต้องเพิ่มชั้นการ authenticate, sandboxing และงบประมาณต่อเครื่องมือก่อนปลอดภัยพอที่จะรัน

<!-- SCHEMA: DefinitionBlock -->

> **Model Context Protocol คืออะไร**
> Model Context Protocol คือมาตรฐานเปิดบน JSON-RPC ที่เผยแพร่ครั้งแรกโดย Anthropic ซึ่งกำหนดวิธีที่ AI agent (client) ค้นพบและเรียกความสามารถที่เปิดเผยโดยเครื่องมือ (server) มันคือสิ่งเทียบเท่ากับ LSP สำหรับ editor หรือ USB สำหรับฮาร์ดแวร์ในระบบนิเวศ AI agent: หนึ่งโปรโตคอล หลายการนำไปใช้

## TL;DR

- **MCP คือพอร์ต USB ของระบบนิเวศเอเจนต์** — โปรโตคอลเดียวที่ให้รันไทม์เอเจนต์ที่เข้ากันได้ตัวใดก็ได้ใช้ tool server ที่เข้ากันได้ตัวใดก็ได้โดยไม่ต้องเขียนโค้ดเชื่อมต่อ custom
- **Anthropic เผยแพร่ MCP ในเดือนพฤศจิกายน 2024**; ผู้ใช้รายใหญ่ในปี 2025 รวมถึง OpenAI, Microsoft Copilot, Cursor, Zed, Continue และ agent framework ส่วนใหญ่
- **MCP กำหนด primitive 4 ประเภท**: tool (การเรียกแบบฟังก์ชัน), resource (ข้อมูล read-only), prompt (เทมเพลตที่ใช้ซ้ำได้) และ sampling (การเรียก LLM ที่ server เริ่มต้นกลับไปที่ client)
- **Transport คือ JSON-RPC บน stdio หรือ HTTP/SSE** Stdio เป็นรูปแบบหลักในเครื่อง HTTP/SSE กำลังได้รับความนิยมสำหรับ MCP server ระยะไกล
- **MCP โปรดักชันต้องการ 3 ชั้นที่บทเรียนส่วนใหญ่ข้าม**: การ authenticate, sandboxing และการบังคับงบประมาณบน tool call

## MCP ทำงานอย่างไร

MCP client (รันไทม์เอเจนต์หรือผู้ช่วย AI) เชื่อมต่อกับ MCP server หนึ่งหรือมากกว่า เมื่อเชื่อมต่อ client ขอรายการความสามารถ — server นี้เสนอ tool, resource และ prompt อะไรบ้าง เครื่องมือแต่ละตัวประกาศ JSON schema สำหรับ argument LLM ของเอเจนต์เห็นรายการเครื่องมือเป็นส่วนหนึ่งของ context และเลือก tool call ตามนั้น client route การเรียกไปยัง server ที่ถูกต้อง, marshal JSON และคืนผลลัพธ์

Transport คือ JSON-RPC 2.0 มี 2 transport ที่พบบ่อย: stdio (client spawn server เป็น subprocess และสื่อสารผ่าน stdin/stdout — ค่าเริ่มต้นใน Claude Desktop) และ HTTP กับ Server-Sent Events สำหรับ server ระยะไกลที่อยู่ข้ามขอบเขตเครือข่าย

โปรโตคอลเองตั้งใจให้น้อยที่สุด ความซับซ้อนอยู่ในสิ่งที่ MCP server เปิดเผย: filesystem server ให้เอเจนต์อ่านและเขียนใน directory; Postgres server ให้การเข้าถึงการ query; Slack server ให้ความสามารถในการส่ง message และอ่าน channel เอเจนต์เดียวสามารถเชื่อมต่อกับ server หลายตัวพร้อมกันได้

## MCP Server vs MCP Client

**MCP server** คือฝั่งเครื่องมือ ใครก็เขียนได้ — Anthropic เผยแพร่ SDK อ้างอิงใน Python และ TypeScript ณ กลางปี 2026 มี community server หลายพันตัวครอบคลุม GitHub, Notion, Linear, Postgres, AWS, browser automation และอื่น ๆ Server มักเล็ก (ไม่กี่ร้อยบรรทัด) เพราะโปรโตคอลทำงานส่วนใหญ่

**MCP client** คือรันไทม์เอเจนต์, IDE และผู้ช่วย Claude Desktop เป็น client อ้างอิง Cursor, Zed, Continue, Windsurf และ agent framework ส่วนใหญ่เพิ่มการรองรับ MCP client ในปี 2025 MCP client ตัวเดียวมักรองรับการเชื่อมต่อ server หลายตัวพร้อมกัน — เอเจนต์ตัวเดียวคุยกับ filesystem server, database server และ Slack server พร้อมกัน

ข้อมูลเชิงลึกสำคัญ: LLM ไม่พูด MCP โดยตรง client render รายการ tool MCP เป็นนิยามฟังก์ชันภายใน prompt ของ LLM; LLM ส่ง function call; client map การเรียกไปยัง MCP server ที่ถูกต้องและส่งต่อ request JSON-RPC

## ข้อพิจารณาด้านความปลอดภัยสำหรับ MCP โปรดักชัน

MCP เป็นโปรโตคอล *capability-exposure* — ไม่ใช่โปรโตคอลการอนุมัติหรือการตรวจสอบ การดีพลอยโปรดักชันต้องเพิ่มส่วนที่ MCP ตั้งใจละไว้:

- **การ authenticate**: MCP server ส่วนใหญ่รันโดยไม่ authenticate ในเครื่อง การดีพลอย multi-tenant ต้องการข้อมูลรับรองรายเอเจนต์และขอบเขต auth ต่อ server
- **Sandboxing**: MCP filesystem server ที่มีการเข้าถึง path อย่างกว้างมีฟังก์ชันเทียบเท่า root บนโฮสต์ รัน MCP server ในคอนเทนเนอร์; อย่า mount volume ที่ละเอียดอ่อนอย่างไร้สติ
- **การบังคับงบประมาณ**: tool call ไม่ฟรี เอเจนต์ที่เรียก MCP web-scraping server ในลูปสามารถสะสมต้นทุนร้ายแรงได้ งบประมาณรายเอเจนต์ต้องครอบคลุมการเรียกเครื่องมือ ไม่ใช่แค่ token LLM
- **Audit log**: MCP เองไม่ทำให้การบันทึกการเรียกเป็นมาตรฐาน รันไทม์โปรดักชันต้องบันทึกการเรียก server ทุกครั้งพร้อม argument, รูปของ response และ timing สำหรับการ review [ความปลอดภัย AI agent](/learn/ai-agent-security)และการตอบสนองต่อเหตุการณ์

การผสาน MCP อ้างอิงของ Claude Desktop mount server เป็น subprocess ของโฮสต์ด้วยสิทธิ์ filesystem ของผู้ใช้โฮสต์ สิ่งนี้ใช้ได้สำหรับการตั้งค่านักพัฒนาผู้ใช้คนเดียว; ไม่ปลอดภัยสำหรับโปรดักชัน

## วิธีที่ OpenLegion ผสาน MCP

OpenLegion เป็น MCP client โดยค่าเริ่มต้น เอเจนต์ในรันไทม์ค้นพบ MCP server ที่ตั้งค่าสำหรับฝูงของตนอัตโนมัติ, เห็นรายการเครื่องมือใน context window ของตน และเรียกเครื่องมือ MCP ผ่าน path ผ่าน vault proxy, gate ด้วย ACL เหมือนกับ skill ในตัว Mesh บังคับชั้นระดับโปรดักชันที่ MCP ละไว้:

- MCP server แต่ละตัวรันใน namespace ที่ sandbox ของตัวเอง; เอเจนต์ไม่เคยได้รับการเข้าถึง stdio โดยตรงกับโพรเซส server
- ACL รายเอเจนต์ gate ว่า MCP server ใดที่เอเจนต์ที่กำหนดได้รับอนุญาตให้เรียก
- ทุก tool call นับเข้างบประมาณรายเอเจนต์ของเอเจนต์; เอเจนต์ที่เกินเพดานจะถูกตัดไม่ว่าการใช้จ่ายจะมาจาก LLM หรือ MCP tool
- Mesh บันทึกการเรียก MCP ทุกครั้งลงใน trace log — telemetry เดียวกันที่ครอบคลุมใน[การ observe AI agent](/learn/ai-agent-observability)

ผลลัพธ์: คุณได้ความกว้างของระบบนิเวศ MCP โดยไม่สืบทอดสมมติฐานความเชื่อใจค่าเริ่มต้นของมัน

## มุมมองของ OpenLegion

MCP คือมาตรฐานระบบนิเวศเอเจนต์ที่สำคัญที่สุดตั้งแต่ OpenAPI — มันยุบสิ่งที่ไม่งั้นจะเป็นงานผสาน N × M (ทุก agent framework คูณทุกเครื่องมือ) เป็น server N + M และ client แต่ความเรียบง่ายโดยตั้งใจของโปรโตคอลหมายความว่าทีมโปรดักชันต้องสร้างโครงสร้างพื้นฐานน่าเบื่อใหม่ — auth, sandboxing, งบประมาณ, การตรวจสอบ — ที่ระบบกรรมสิทธิ์รวมเข้าไว้ Framework ที่มอง MCP เป็น just-add-water โดยไม่เพิ่มชั้นเหล่านั้นส่งเอเจนต์ที่ไม่ปลอดภัยเป็นค่าเริ่มต้น เลือก[แพลตฟอร์ม AI agent](/learn/ai-agent-platform)ที่จริงจังกับ MCP พอที่จะจำกัดมัน

## CTA

**ดีพลอยเอเจนต์ที่เข้ากันได้กับ MCP พร้อมการควบคุมระดับโปรดักชันในตัว**
[เริ่มต้นใช้งาน](https://app.openlegion.ai) | [อ่านเอกสาร](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## คำถามที่พบบ่อย

### Model Context Protocol คืออะไร

Model Context Protocol (MCP) คือมาตรฐาน JSON-RPC แบบเปิดที่แนะนำโดย Anthropic ในเดือนพฤศจิกายน 2024 ซึ่งให้ AI agent ค้นพบและเรียกเครื่องมือภายนอกผ่านอินเทอร์เฟซที่เป็นเอกภาพ MCP server เปิดเผยความสามารถ (tool, resource, prompt); MCP client (รันไทม์เอเจนต์, IDE, ผู้ช่วย) ใช้พวกมัน ผู้ใช้รายใหญ่ในปี 2025 รวมถึง OpenAI, Microsoft Copilot, Cursor, Zed และ agent framework ส่วนใหญ่

### ใครสร้าง MCP และเป็นโอเพนหรือไม่

Anthropic สร้าง MCP และปล่อยภายใต้ข้อกำหนดเปิดพร้อม SDK อ้างอิงใน Python และ TypeScript ข้อกำหนดถูกกำกับโดยชุมชนผ่าน GitHub และไม่มีการ license หรือ lock-in กรรมสิทธิ์ ใครก็เขียน MCP server หรือ client ได้ และผู้ให้บริการ LLM หลักส่งเครื่องมือที่เข้ากันได้กับ MCP

### MCP server กับ MCP client ต่างกันอย่างไร

MCP server เปิดเผยความสามารถ — Postgres server เปิดเผย tool การ query, filesystem server เปิดเผยการอ่านและเขียนไฟล์, Slack server เปิดเผยการส่ง message MCP client คือฝั่งผู้บริโภค — โดยทั่วไปคือรันไทม์เอเจนต์, IDE หรือผู้ช่วย AI client สามารถเชื่อมต่อกับ server หลายตัวพร้อมกัน; server สามารถใช้ซ้ำได้โดย client หลายตัว

### MCP ปลอดภัยเป็นค่าเริ่มต้นหรือไม่

ไม่ — และนี่ตั้งใจ MCP เป็นโปรโตคอล capability-exposure ไม่ใช่โปรโตคอลการอนุมัติ การนำไปใช้อ้างอิง (Claude Desktop, ตัวอย่าง SDK) รัน server โดยไม่ authenticate เป็น subprocess ของโฮสต์ด้วยสิทธิ์ filesystem ของผู้ใช้ การดีพลอยโปรดักชันต้องเพิ่มการ authenticate, sandboxing, งบประมาณต่อเครื่องมือ และ audit logging บน MCP เอง

### MCP เปรียบเทียบกับ OpenAI function calling อย่างไร

OpenAI function calling เป็นรูปแบบผู้ขายเดียวที่ให้ LLM หนึ่งตัวเรียกฟังก์ชันที่กำหนดใน request API — ไม่ทำให้การค้นพบ, การจัดแพ็กเกจ หรือการแชร์เครื่องมือข้ามระบบเป็นมาตรฐาน MCP เป็นมาตรฐานเปิดข้ามผู้ขายสำหรับปัญหาเดียวกันที่ระดับระบบนิเวศ ทั้งสองเป็นส่วนเสริม: MCP server เปิดเผยความสามารถ; MCP client สามารถ render พวกมันเป็นนิยามฟังก์ชันรูปแบบ OpenAI เมื่อเรียก GPT model หรือเป็นรูปแบบ Anthropic tool-use เมื่อเรียก Claude

### ฉันใช้ MCP กับผู้ให้บริการ LLM ใดก็ได้หรือไม่

ได้ MCP ไม่ผูกกับ LLM — client render นิยาม tool MCP เป็นรูปแบบใดก็ตามที่ LLM พื้นฐานคาดหวัง (Anthropic tool use, OpenAI function calling, Gemini function declaration) รันไทม์อย่าง OpenLegion ที่รองรับผู้ให้บริการ 100+ รายผ่าน LiteLLM ปรับ MCP tool เข้ากับ convention การเรียกของผู้ให้บริการแต่ละรายอัตโนมัติ
