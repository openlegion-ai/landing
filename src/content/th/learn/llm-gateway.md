---
title: "LLM Gateway: การกำหนดเส้นทาง การยืนยันตัวตน และการควบคุมค่าใช้จ่ายสำหรับ AI Agent"
description: "LLM Gateway กำหนดเส้นทางคำขอของ AI Agent ระหว่างผู้ให้บริการโมเดล บังคับใช้ขีดจำกัดอัตรา ฉีด credential โดยไม่เปิดเผยให้กับโค้ด agent และนำค่าใช้จ่าย token ไปยัง agent แต่ละตัว"
slug: /learn/llm-gateway
primary_keyword: llm gateway
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /comparison/litellm
  - /learn/ai-agent-mcp-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-monitoring
  - /learn/llm-cost-optimization
  - /learn/ai-agent-security
---

# LLM Gateway: การกำหนดเส้นทาง การยืนยันตัวตน และการควบคุมค่าใช้จ่ายสำหรับ AI Agent

LLM Gateway คือ HTTP reverse proxy ที่วางอยู่ระหว่างกระบวนการ AI agent และ endpoint ของผู้ให้บริการโมเดล upstream ทำหน้าที่เป็น data plane สำหรับ inference traffic ขาออกทั้งหมด มันแก้ไข opaque key handle บนเลเยอร์เครือข่ายก่อนการส่งต่อ บังคับใช้โควตาการจำกัดอัตราต่อ tenant โดยใช้ตัวนับ sliding window ส่ง OpenTelemetry telemetry ค่าใช้จ่ายต่อคำขอ และเปิด circuit breaker เมื่อ latency P99 upstream เกินเกณฑ์ที่กำหนด โดยไม่ต้องเปลี่ยนแปลงโค้ดแอปพลิเคชันของ agent เลย ทุก fleet ที่รัน inference consumer พร้อมกันตั้งแต่สามตัวขึ้นไปควรปรับใช้หนึ่งตัว

<!-- SCHEMA: DefinitionBlock -->

> **LLM Gateway** คือ HTTP reverse proxy ที่อยู่ใน data plane ระหว่างกระบวนการ AI agent และ endpoint ของผู้ให้บริการโมเดล โดยให้การแก้ไข key แบบ opaque บนเลเยอร์เครือข่าย การบังคับใช้โควตาต่อ tenant ผ่านตัวนับ sliding window telemetry ค่าใช้จ่าย OpenTelemetry ต่อคำขอ และการ failover ด้วย circuit breaker ทั้งหมดเป็น infrastructure primitive ที่มองไม่เห็นสำหรับโค้ดแอปพลิเคชัน

## ปัญหา Data Plane ใน Multi-Agent Inference

หากไม่มี data plane สำหรับ inference โดยเฉพาะ กระบวนการ agent แต่ละตัวจัดการการเชื่อมต่อ upstream ของตัวเอง: การแก้ไข key จากสถานะ environment ไม่มีโควตาต่อกระบวนการ ไม่มี telemetry ต่อคำขอ และไม่มีการมองเห็นว่า endpoint upstream เสื่อมสภาพหรือไม่ เมื่อมี agent สองตัวสามารถจัดการได้ เมื่อมียี่สิบตัวจะเกิดโหมดความล้มเหลวสี่แบบที่แตกต่างกัน

### การรั่วไหลของ Key ผ่านการตรวจสอบ Environment

กระบวนการ agent ที่เก็บ key ผู้ให้บริการแบบ plaintext ไว้ใน environment ห่างจากการรั่วไหลเพียงคำสั่งเดียวที่เป็นปฏิปักษ์ พื้นผิวการโจมตีคือ environment ของกระบวนการเอง: `os.environ`, `/proc/self/environ` บน Linux host, error traceback แบบละเอียดที่ serialize สถานะกระบวนการ และการกำหนดค่า debug log ที่บันทึก HTTP header ขาออกรวมถึงฟิลด์ Authorization

การโจมตี prompt injection ที่ทำให้ agent สะท้อนสถานะ environment เป็นคลาสการโจมตีที่มีเอกสารยืนยันต่อ agent ที่มี plaintext key (OWASP LLM01:2025) การแก้ไขเชิงโครงสร้างไม่ใช่การตรวจสอบ input ที่ดีขึ้น: แต่คือการลบ plaintext key ออกจากกระบวนการ agent โดยสมบูรณ์ LLM Gateway ที่แก้ไข opaque handle (`$CRED{openai}`) บนเลเยอร์เครือข่ายก่อนที่จะเขียน Authorization header หมายความว่ากระบวนการ agent ไม่เคยเก็บวัสดุที่อาจถูกขโมยได้

OpenLegion mesh นำไปใช้ในระดับ infrastructure: `$CRED{}` handle แก้ไขที่ขอบเขต mesh host คอนเทนเนอร์ agent ไม่สามารถเข้าถึงค่าที่แก้ไขแล้วได้ในเชิงโครงสร้าง ไม่ใช่เพราะได้รับคำสั่งไม่ให้ทำ แต่เพราะการแก้ไขเกิดขึ้นนอก address space ของพวกมัน

### การหมดโควตาจากการจำกัด Key ที่แชร์

ผู้ให้บริการโมเดล upstream จำกัดอัตราในระดับ API key ใน fleet ที่กระบวนการ agent ยี่สิบตัวแชร์ key เดียว กระบวนการเดียวที่ส่งคำขอในอัตราเร็วกว่าที่คาดไว้ 10 เท่า ไม่ว่าจะผ่าน retry storm, loop ที่ควบคุมไม่ได้ หรือ payload การ injection prompt ที่ทำให้เกิดการเรียก inference ไม่จำกัด สามารถผลักดัน key ไปสู่ territory การจำกัดอัตราสำหรับอีก 19 ตัว

Gateway บังคับใช้โควตาต่อ tenant โดยใช้ตัวนับ sliding window ที่จัดทำดัชนีบน agent identifier เมื่อตัวนับของ agent ถึงขีดจำกัดที่กำหนด gateway จะตอบสนองด้วย HTTP 429 ที่ระดับ gateway: ไม่มีการส่งคำขอ upstream ไม่มีการใช้โควตาผู้ให้บริการ และ agent พี่น้องไม่ได้รับผลกระทบ

โควตาต่อ agent ยังเป็นมาตรการบรรเทาเชิงโครงสร้างสำหรับ OWASP LLM10:2025 (การบริโภคไม่จำกัด) ซึ่งเป็นรูปแบบที่คำสั่งปฏิปักษ์ทำให้ agent ส่งการเรียก inference ไม่จำกัด

### การขาด Observability ของ Upstream

หากไม่มี data plane ของ inference, telemetry ต่อคำขอต้องการการใช้เครื่องมือวัดภายในกระบวนการ agent แต่ละตัว ซึ่งทั้งซ้ำซ้อนและไม่สอดคล้องกัน Gateway ส่ง OpenTelemetry OTLP log record ต่อคำขอบนเลเยอร์เครือข่าย บันทึก: agent identifier, endpoint upstream, ชื่อโมเดล, จำนวน input token, จำนวน output token, cache-hit token, HTTP response status และระยะเวลาคำขอ

บันทึกค่าใช้จ่ายต่อคำขอ (`input_token × ราคาต่อ_1k_input + output_token × ราคาต่อ_1k_output`) สะสมในสมุดบัญชีค่าใช้จ่ายต่อ agent สมุดบัญชีนี้รองรับขีดจำกัดค่าใช้จ่ายรายวันและรายเดือนและการแจ้งเตือนความผิดปกติของค่าใช้จ่าย

### การเสื่อมสภาพ Upstream ที่มองไม่เห็น

Endpoint ผู้ให้บริการเสื่อมสภาพ latency P99 tail บน GPT-4o ในระหว่างเหตุการณ์ความจุสามารถถึง 12 วินาที (OpenLegion infrastructure benchmark, มิถุนายน 2026) หากไม่มี circuit breaker ใน data plane agent ทุกตัวใน fleet จะดูดซับการเสื่อมสภาพนี้ในทุกคำขอ

Gateway ที่มี circuit breaker ติดตามอัตราข้อผิดพลาดและ latency P99 ต่อ endpoint เมื่อเกินเกณฑ์ความล้มเหลวที่กำหนดได้ เช่น การตอบสนอง 5xx ห้าครั้งติดต่อกัน หรือ P99 เกิน 8 วินาทีในหน้าต่าง 30 วินาที วงจรจะเปิด: คำขอถัดไปจะถูกส่งไปยัง endpoint สำรองที่กำหนดไว้ทันที

OpenLegion benchmark มิถุนายน 2026 วัดโทโพโลยี GPT-4o primary → Claude 3.5 Sonnet failover: P99 ลดลงจาก 12 วินาทีเป็น 3.1 วินาที (3.9 เท่า) โดยไม่มีการเปลี่ยนแปลงโค้ด agent เลย

## สถาปัตยกรรม Gateway: Data Plane กับ Control Plane

### Data Plane: การบังคับใช้ต่อคำขอ

คำขอ inference แต่ละรายการผ่าน data plane ตามลำดับ:

1. **TLS Termination**: กระบวนการ agent เชื่อมต่อกับ gateway ผ่าน TLS สำหรับการปรับใช้ mTLS, agent ยังนำเสนอใบรับรองด้วย mTLS ขจัดความจำเป็นสำหรับ authentication token ต่อคำขอระหว่าง agent และ gateway

2. **การแก้ไข Workload Identity**: gateway แมป workload ที่เชื่อมต่อกับ tenant identity ในการปรับใช้ mTLS, SPIFFE SVID ที่ฝังในใบรับรองไคลเอนต์นำ workload identity

3. **การแก้ไข Opaque Handle**: gateway ตรวจสอบ Authorization header ขาออกสำหรับรูปแบบ `$CRED{}` handle handle ที่ตรงกันจะถูกแก้ไขกับ secret store ของ gateway

4. **การตรวจสอบโควตา**: gateway เพิ่มตัวนับ sliding window ของ tenant และเปรียบเทียบกับขีดจำกัดที่กำหนด หากตัวนับเกินขีดจำกัด gateway จะส่งคืน 429 พร้อม header `Retry-After` ไม่มีการเปิดการเชื่อมต่อ upstream

5. **การตรวจสอบ Circuit Breaker**: gateway ประเมินสถานะวงจรของ endpoint เป้าหมาย หากวงจรเปิดอยู่ คำขอจะถูกเปลี่ยนเส้นทางไปยัง failover ทันที โดยไม่ลองกับ primary

6. **Upstream Dispatch**: gateway เปิดการเชื่อมต่อจาก connection pool ของตัวเองไปยัง endpoint upstream และสตรีม response กลับ

7. **การส่ง Telemetry**: เมื่อ response เสร็จสมบูรณ์ gateway จะเขียน OTLP log record ไปยัง telemetry pipeline

ค่าใช้จ่ายรวมบน warm path: 0.7-2.1 ms บน cold path (cache miss): 2.6-6.6 ms ที่ latency inference ผู้ให้บริการ 500 ms-30 วินาที ค่าใช้จ่าย warm path น้อยกว่า 0.5% ของเวลา round-trip ทั้งหมด

### Control Plane: การกำหนดค่าและนโยบาย

Control plane ควบคุมพฤติกรรมของ data plane ความรับผิดชอบหลัก:

**การกำหนดค่า Tenant Identity และโควตา**, **Endpoint Topology**, **Handle Permission Scope**: workload identity ใดได้รับอนุญาตให้แก้ไข handle ใด tenant ที่มีสโคป `openai:read` สามารถแก้ไข `$CRED{openai}` แต่ไม่ใช่ `$CRED{anthropic}` ซึ่งป้องกันการเคลื่อนที่ด้านข้างระหว่าง tenant

**นโยบายการตรวจสอบ**: ฟิลด์ใดที่ปรากฏใน OTLP log record

API ของ control plane ไม่ควรสามารถเข้าถึงได้จากเครือข่าย agent-side GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, แก้ไขใน v1.83.0) แสดงให้เห็นว่าเกิดอะไรขึ้นเมื่อ configuration write path ของ control plane สามารถเข้าถึงได้ผ่านเครือข่ายโดยไม่มีการอนุญาตที่เพียงพอ

## โทโพโลยีการปรับใช้

### Centralized Ingress

Cluster gateway เดียวจัดการ inference traffic ขาออกทั้งหมดของ agent fleet เหมาะสำหรับ fleet ที่มีถึงประมาณ 50 agent โดยที่ความเรียบง่ายในการดำเนินงานมีความสำคัญ

### รูปแบบ Sidecar

Container agent แต่ละตัวรันกระบวนการ gateway บน loopback interface ของตัวเอง โดเมนความล้มเหลวคือ container agent หนึ่งตัว เหมาะสำหรับ fleet ขนาดใหญ่ (50+ agent) ที่การแยกความล้มเหลวต่อ agent มีความสำคัญ

### Mesh-Native Proxy

ใน OpenLegion proxy inference เป็น mesh service โมเดล mesh-native จัดการ workload identity แบบ native: container agent แต่ละตัวได้รับ mesh-issued identity เมื่อ spawn

## ความเห็นของ OpenLegion

ชุดคุณลักษณะ LLM Gateway ได้แก่ mTLS, การบังคับใช้โควตา sliding window, telemetry ค่าใช้จ่าย OTLP, circuit-breaker failover ไม่ใช่ infrastructure เสริมสำหรับ multi-agent fleet แต่เป็น data plane ขั้นต่ำที่สามารถทำงานได้

การวัดสามรายการจากการทดสอบ infrastructure ของ OpenLegion เดือนมิถุนายน 2026 ระบุมูลค่าของความเสี่ยง:

**P99 tail latency โดยไม่มี failover**: 12 วินาทีบนการปรับใช้ GPT-4o เท่านั้นในระหว่างเหตุการณ์ความจุผู้ให้บริการ เมื่อกำหนดค่า Claude 3.5 Sonnet เป็น circuit-breaker failover: 3.1 วินาที การปรับปรุง 3.9 เท่าไม่ต้องการการเปลี่ยนแปลงโค้ดแอปพลิเคชัน agent เลย

**พื้นผิวการโจมตีการรั่วไหลของ Key**: ใน fleet 20 agent ที่ agent ทั้งหมดเก็บ plaintext key ไว้ใน environment ของตน agent เดียวที่ถูกโจมตีด้วย prompt injection (OWASP LLM01:2025) สามารถขโมย key สำหรับ upstream connection ของ agent อื่นทุกตัวได้ ใน fleet ที่ gateway เป็นตัวกลางด้วย opaque handle resolution, agent เดียวกันที่ถูกโจมตีไม่มีวัสดุที่จะขโมยได้

**OWASP LLM Coverage**: การบังคับใช้โควตาต่อ tenant ที่ gateway แก้ไข LLM10:2025 (การบริโภคไม่จำกัด) การบังคับใช้ handle scope แก้ไข LLM06:2025 (Excessive Agency)

สำหรับทีมที่ประเมิน[รูปแบบการจัดการ credential สำหรับ AI agent](/learn/credential-management-ai-agents), การแก้ไข opaque handle ของ gateway คือการนำ vault-proxy pattern ที่อธิบายไว้ที่นั่นไปใช้ในระดับการปรับใช้

## การเปรียบเทียบ LLM Gateway

| **ความสามารถ** | **Self-hosted (LiteLLM)** | **OpenAI Native** | **OpenLegion Mesh Proxy** |
|---|---|---|---|
| **โมเดลการแก้ไข Key** | Postgres-backed key store | Managed service | Opaque handle → vault บนเลเยอร์เครือข่าย |
| **mTLS Workload Identity** | ไม่รองรับ | ไม่รองรับ | SPIFFE SVID ต่อ agent container |
| **การบังคับใช้โควตา** | กำหนดค่าได้, ต่อ key | ขีดจำกัดต่อ org | Sliding window counter, ต่อ tenant |
| **Circuit Breaker Failover** | Plugin-based | ไม่มี | Native พร้อม half-open probe |
| **OTLP Expense Telemetry** | บางส่วน | ไม่ export | ต่อคำขอ ทุกฟิลด์ |
| **การแยก Control Plane** | Manual; เปิดเผยโดยค่าเริ่มต้น | Managed | Private mesh subnet เท่านั้น |
| **ประวัติ CVE (2024-2026)** | GHSA-53mr-6c8q-9789 + อื่นๆ | ไม่มีสาธารณะ | ไม่มี |

## การเลือก Gateway สำหรับ Fleet ของคุณ

### mTLS กับการยืนยันตัวตน Bearer Token

mTLS (mutual TLS) ยืนยันตัวตนทั้งไคลเอนต์ (agent) และเซิร์ฟเวอร์ (gateway) ที่เลเยอร์ TLS handshake ก่อนที่จะมีการแลกเปลี่ยน HTTP payload ใดๆ ใบรับรองไคลเอนต์นำ SPIFFE SVID ซึ่งเป็น workload identity ที่สามารถตรวจสอบด้วยการเข้ารหัส ไม่มีการส่ง bearer token ใน header และไม่จำเป็นต้องออก แจกจ่าย หรือหมุนเวียน token

สำหรับ multi-agent fleet ในการผลิต mTLS ที่มี SPIFFE-issued SVID คือโมเดลการยืนยันตัวตนที่ถูกต้อง ซึ่งขจัดพื้นผิวการจัดการ token ทั้งหมด

### Sliding Window กับ Fixed Window Quota Counter

Fixed window counter รีเซ็ตที่ขอบเขตเวลา agent สามารถ burst ได้เป็นสองเท่าของอัตราปกติ Sliding window counter รักษาการนับแบบ rolling ตลอดช่วงเวลาต่อเนื่องโดยไม่มีขอบเขตเวลาที่ถูกนำไปใช้ประโยชน์ สำหรับ inference workload การบังคับใช้ sliding window คือโมเดลที่ถูกต้อง

### ข้อกำหนดความละเอียดของ Telemetry

OTLP record ต่อคำขอคือขั้นต่ำสำหรับ fleet observability ที่มีประโยชน์ ประเมินว่า gateway ให้ฟิลด์เหล่านี้ในแต่ละ record หรือไม่: `agent_id`, `model_id`, `input_tokens`, `output_tokens`, `cache_tokens`, `upstream_latency_ms`, `upstream_status` Gateway ที่รวม telemetry ไม่สามารถรองรับการตรวจจับความผิดปกติค่าใช้จ่ายต่อ agent หรือการปรับแต่ง circuit breaker ที่แม่นยำ

## เริ่มต้น

**ปรับใช้ multi-agent inference fleet ด้วย mTLS workload identity, การบังคับใช้โควตา sliding window และ OTLP expense telemetry ต่อคำขอ**
[เริ่มต้นบน OpenLegion](https://app.openlegion.ai) | [อ่านเอกสาร](https://docs.openlegion.ai) | [เปรียบเทียบ LiteLLM กับ OpenLegion](/comparison/litellm)

---

<!-- SCHEMA: FAQPage -->

## คำถามที่พบบ่อย

### LLM Gateway คืออะไร?

LLM Gateway คือ HTTP reverse proxy ที่วางอยู่ใน data plane ระหว่างกระบวนการ AI agent และ endpoint ของผู้ให้บริการโมเดล upstream มันแก้ไข opaque key handle บนเลเยอร์เครือข่าย (กระบวนการ agent ไม่เคยเก็บ plaintext key) บังคับใช้ขีดจำกัดโควตา sliding window ต่อ tenant ก่อนการส่ง upstream ส่ง OpenTelemetry expense telemetry ต่อคำขอ และเปิด circuit breaker เมื่อ endpoint upstream เกินเกณฑ์ที่กำหนด ฟังก์ชันเหล่านี้ทำงานเป็น infrastructure primitive ที่ไม่ต้องการการเปลี่ยนแปลงโค้ดแอปพลิเคชัน agent

### ฉันต้องการ LLM Gateway หากฉันใช้ผู้ให้บริการโมเดลเพียงรายเดียวหรือไม่?

Fleet ที่มีผู้ให้บริการรายเดียวก็ยังได้รับประโยชน์จากฟังก์ชัน gateway สามอย่าง: การแก้ไข opaque handle, การบังคับใช้โควตาต่อ tenant และ OTLP expense telemetry ต่อคำขอ ค่าใช้จ่าย warm path คือ 0.7-2.1 ms ซึ่งน้อยมากเมื่อเทียบกับ inference latency ผู้ให้บริการ 500 ms ถึง 30 วินาที

### Circuit-breaker failover ทำงานอย่างไรใน LLM Gateway?

Gateway ติดตามอัตราข้อผิดพลาดและ latency P99 ต่อ endpoint ภายใน rolling observation window เมื่อเกินเกณฑ์ความล้มเหลวที่กำหนดได้ เช่น การตอบสนอง 5xx ห้าครั้งติดต่อกัน หรือ P99 เกิน 8 วินาทีในหน้าต่าง 30 วินาที วงจรจะเปิด: คำขอถัดไปทั้งหมดจะถูกส่งต่อไปยัง endpoint failover ที่กำหนดไว้ทันที หลังจากช่วงเวลา cooldown gateway จะส่ง half-open probe ไปยัง primary probe ที่ประสบความสำเร็จจะปิดวงจร probe ที่ล้มเหลวจะรีสตาร์ท cooldown timer

### mTLS คืออะไรและทำไมมันสำคัญสำหรับ LLM Gateway?

mTLS (mutual TLS) ยืนยันตัวตนทั้งกระบวนการ agent ที่เชื่อมต่อและ gateway ที่เลเยอร์ TLS handshake ก่อนที่จะมีการแลกเปลี่ยน HTTP payload ใดๆ agent นำเสนอใบรับรองไคลเอนต์ที่มี SPIFFE SVID ซึ่งเป็น workload identity ที่สามารถตรวจสอบด้วยการเข้ารหัส ไม่มีการส่ง bearer token ใน HTTP header และไม่จำเป็นต้องออก แจกจ่าย หรือหมุนเวียน token workload identity ที่ได้รับจาก SVID ขับเคลื่อนการบังคับใช้ handle scope

### ความแตกต่างระหว่างการบังคับใช้โควตา sliding window และ fixed window คืออะไร?

Fixed window counter รีเซ็ตที่ขอบเขตนาฬิกา agent สามารถ burst ได้เป็นสองเท่าของอัตราปกติโดยการส่งคำขอด้วยความเร็วสูงสุดในวินาทีสุดท้ายของหน้าต่างหนึ่งและวินาทีแรกของหน้าต่างถัดไป Sliding window counter รักษาการนับ rolling ตลอดช่วงเวลาต่อเนื่องโดยไม่มีขอบเขตนาฬิกาที่จะถูกนำไปใช้ประโยชน์ สำหรับ inference workload การบังคับใช้ sliding window คือโมเดลที่ถูกต้อง

### OTLP telemetry ต่อคำขอแตกต่างจากการรายงานค่าใช้จ่ายแบบรวมอย่างไร?

OpenTelemetry OTLP record ต่อคำขอบันทึกฟิลด์แต่ละรายการในทุก inference call: agent identifier, model variant, input token, output token, cache-hit token, upstream latency และ HTTP status record เหล่านี้สะสมในสมุดบัญชีค่าใช้จ่ายต่อ agent ที่รองรับขีดจำกัดงบประมาณรายวันและรายเดือน การตรวจจับความผิดปกติค่าใช้จ่าย และการเปรียบเทียบต้นทุนข้ามโมเดล รายงานค่าใช้จ่ายแบบรวมไม่สามารถรองรับการตรวจจับความผิดปกติได้

### Control plane ของ gateway ไม่ควรเปิดเผยอะไรให้กับเครือข่าย agent-side?

Control plane จัดการการกำหนดค่าโควตา, endpoint topology, handle permission scope และนโยบายการตรวจสอบ ควรปรับใช้ใน private subnet โดยไม่มีเส้นทางการเข้าถึงจากภายนอก GHSA-53mr-6c8q-9789 (LiteLLM, CVE-2026-35029, แก้ไขใน v1.83.0) ได้บันทึกการอนุญาตไม่เพียงพอบน management API เครือข่าย agent-side ควรเข้าถึงเฉพาะพอร์ต data plane ของ gateway เท่านั้น

### ฉันจะปรับแต่งเกณฑ์ circuit breaker สำหรับ fleet ของฉันอย่างไร?

รวบรวม histograms latency P50, P95 และ P99 ต่อ endpoint ผู้ให้บริการตลอด traffic การผลิตสองถึงสี่สัปดาห์ เกณฑ์การเปิด circuit breaker ควรตั้งที่ค่า P99 ที่ชัดเจนว่าเสื่อมสภาพเมื่อเทียบกับ SLA ปกติของผู้ให้บริการ โดยทั่วไปคือ 2-3 เท่าของ P99 มัธยฐาน ช่วงเวลา cooldown ก่อน half-open probe ควรเกินเวลาการกู้คืนทั่วไปของผู้ให้บริการ โดย 30-60 วินาทีเป็น baseline ที่สมเหตุสมผล
