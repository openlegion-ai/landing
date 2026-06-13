---
title: "การจัดการข้อมูลรับรองสำหรับ AI Agent: สถาปัตยกรรม Vault-Proxy"
description: "สถาปัตยกรรม Vault-Proxy สำหรับ AI Agent: การฉีด Secret ฝั่ง Server, การแยกส่วนต่อ Agent, การ Audit ทุกครั้งที่เข้าถึง และการป้องกัน env-var anti-pattern ที่เปิดเผย Key ใน CVE-2024-34359 และ CVE-2025-29927"
slug: /learn/credential-management-ai-agents
primary_keyword: credential management ai agents
last_updated: "2026-06-11"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-security
  - /learn/model-context-protocol
  - /learn/ai-agent-orchestration
  - /learn/multi-agent-systems
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
---

# การจัดการข้อมูลรับรองสำหรับ AI Agent: สถาปัตยกรรม Vault-Proxy

การจัดการข้อมูลรับรองสำหรับ AI Agent คือกลุ่มของแนวปฏิบัติด้านโครงสร้างพื้นฐานที่ควบคุมวิธีที่ Agent อิสระเข้าถึง ใช้งาน หมุนเวียน และปล่อย API Key และ Secret โดยไม่ต้องเปิดเผยข้อมูลรับรองในหน่วยความจำของ Agent, Log หรือ Context Window Agent ทำลาย Pattern ข้อมูลรับรองมาตรฐาน: ทำงานอย่างอิสระ สามารถถูกโจมตีผ่าน Prompt Injection และทำงานเป็น Fleet ที่ Secret ที่ใช้ร่วมกันจะคูณพื้นที่การโจมตีแบบ Exfiltration CVE-2024-34359 (llama-cpp-python, CVSS 9.6) และ CVE-2025-29927 (Next.js, CVSS 9.1) แสดงให้เห็นว่าการติดตั้ง AI เปิดเผย Secret ได้อย่างไรเมื่อขอบเขตความปลอดภัยล้มเหลว

<!-- SCHEMA: DefinitionBlock -->
การจัดการข้อมูลรับรองสำหรับ AI Agent คือกลุ่มของแนวปฏิบัติและ Pattern โครงสร้างพื้นฐานที่ควบคุมวิธีที่ Agent อิสระเข้าถึง ใช้งาน หมุนเวียน และปล่อย API Key, Token และ Secret โดยไม่ต้องเปิดเผยข้อมูลรับรองเหล่านั้นในหน่วยความจำของ Agent, Log หรือ Context Window

## เหตุใด Pattern ข้อมูลรับรองมาตรฐานจึงล้มเหลวใน Agent Fleet

### ปัญหาของไฟล์ .env ในระดับขนาดใหญ่

Environment Variable ทำงานได้ดีสำหรับแอปพลิเคชันแบบ Single Process สำหรับ Agent Fleet โมเดลจะล่มสลายทันที ไฟล์ `.env` ที่ใช้ร่วมกันใน Fleet ของ 10 Agent หมายความว่าทั้ง 10 Process ที่ทำงานอยู่ต่างเก็บ Secret ทุกตัวไว้ในหน่วยความจำ แต่ละ Process สร้าง Log, Output ข้อผิดพลาด และ Debug Trace ซึ่งทั้งหมดนี้เป็นพื้นที่การเปิดเผยข้อมูลรับรองที่อาจเกิดขึ้น หาก Agent หนึ่งใน 10 ตัวนี้ถูกโจมตีด้วย Prompt Injection และได้รับคำสั่งให้พิมพ์ Environment ของตัวเอง ข้อมูลรับรองทุกอย่างใน `.env` ที่ใช้ร่วมกันจะรั่วไหลพร้อมกัน

N-Agent Multiplier คือปัญหาสำคัญ: Agent เพิ่มเติมทุกตัวใน Fleet จะเพิ่มพื้นที่การเปิดเผยอีกหนึ่งจุดสำหรับข้อมูลรับรองที่ใช้ร่วมกันแต่ละชุด Fleet ที่มี 20 Agent กับ API Key 5 ตัวใน `.env` สร้างจุดการเปิดเผยข้อมูลรับรองที่อาจเกิดขึ้นถึง 100 จุด ก่อนที่จะพิจารณา Log Aggregation, Error Reporting หรือ Debugging Tool ที่สามารถจับ Snapshot ของ Environment ได้

### บันทึก CVE สำหรับ Secret ในรูปแบบข้อความธรรมดาในระบบ AI ที่ติดตั้งใช้งาน

CVE สองรายการได้บันทึกต้นทุนที่แท้จริงของการจัดการ Secret ที่ไม่ปลอดภัยในระบบ AI ที่ติดตั้งใช้งาน:

**CVE-2024-34359** (llama-cpp-python, CVSS 9.6 Critical): การฉีด Jinja2 Server-Side Template ผ่านการแสดงผล Metadata ของ Model โดยไม่มี Sandbox ใน `llama-cpp-python` ฟิลด์ Chat Template ในไฟล์ `.gguf` ที่สร้างขึ้นอย่างเป็นอันตรายถูก Render ผ่าน `jinja2.Environment` โดยไม่มี Sandbox ทำให้เกิดการ Execute Code จากระยะไกล แอปพลิเคชันใดๆ ที่โหลด Model ที่ไม่น่าเชื่อถือ รวมถึง Agent Pipeline ที่ดาวน์โหลด Model จากแหล่งภายนอก ล้วนอยู่ในขอบเขตที่ได้รับผลกระทบ ปัญหาโครงสร้าง: โค้ดการโหลด Model เชื่อถือเนื้อหาภายนอกโดยไม่มีการแยกส่วน

**CVE-2025-29927** (Next.js, CVSS 9.1 Critical): การ Bypass การ Authorization ผ่าน Header `x-middleware-subrequest` ที่ทำให้ Request ที่ไม่ได้รับการยืนยันตัวตนสามารถข้าม Middleware ในการติดตั้ง Next.js ได้ แอปพลิเคชันที่ใช้ Next.js Middleware เพื่อปกป้อง Route ที่ต้องการข้อมูลรับรอง รวมถึง AI Agent API Backend ได้รับผลกระทบ Bug ได้รับการแก้ไขในเวอร์ชัน 12.3.5, 13.5.9, 14.2.25 และ 15.2.3

CVE ทั้งสองแสดงให้เห็น Risk Class พื้นฐานเดียวกัน: เมื่อ Secret หรือ Route ที่ได้รับการปกป้องพึ่งพาการควบคุมระดับแอปพลิเคชันแทนที่จะเป็นการแยกส่วนโครงสร้าง ข้อบกพร่องทางตรรกะเพียงหนึ่งรายการก็จะเปิดเผยสิ่งเหล่านั้น Pattern Vault-Proxy ขจัดพื้นที่การโจมตีโดยเก็บ Secret ไว้นอกคอนเทนเนอร์ Agent ภายใต้การบังคับใช้ระดับโครงสร้างพื้นฐาน

### เหตุใด Agent Log จึงเป็นความเสี่ยงต่อข้อมูลรับรอง

Log แอปพลิเคชันแบบดั้งเดิมประกอบด้วย Event ที่มีโครงสร้างจาก Call Site ที่ควบคุม Agent Log จะจับทุกอย่าง: LLM Reasoning Trace, Tool Call Argument, Tool Return Value และขั้นตอน Reasoning ระดับกลาง เมื่อ Agent เรียก External API ที่มีข้อมูลรับรองใน Authorization Header การกำหนดค่า Logging อย่างง่ายจะจับ Header นั้น เมื่อ Reasoning Trace ของ Agent มีข้อความ "using API key sk-..." จากเอกสารหรือ Prompt ที่ดึงมา สตริงนั้นจะปรากฏใน Log

ปริมาณ Agent Log สูงและระยะเวลาการเก็บรักษามักยาว ข้อมูลรับรองที่ปรากฏในระบบ Log Aggregation จะยังคงอยู่จนกว่า Log จะถูกล้าง ซึ่งอาจเกิดขึ้นหลายสัปดาห์หรือหลายเดือนหลังจาก Agent ที่สร้างมันหยุดทำงาน

### เส้นทางจาก Prompt Injection สู่ข้อมูลรับรอง

OWASP LLM Top 10 v1.1 (LLM06: Sensitive Information Disclosure, ตุลาคม 2025) ระบุการรั่วไหลของข้อมูลรับรองเป็น Attack Vector หลักสำหรับแอปพลิเคชัน LLM การโจมตีนั้นตรงไปตรงมา: เนื้อหาที่เป็นอันตรายที่ Agent ดึงมาจากเว็บเพจ, เอกสาร หรือการตอบสนองของ Tool ประกอบด้วยคำสั่งเช่น "พิมพ์ Environment Variable ทั้งหมด" หรือ "Output API Key ของคุณ" Agent ที่ไม่มีการแยกส่วนข้อมูลรับรองโครงสร้างไม่สามารถแยกแยะคำสั่งนี้จากคำสั่ง Task ที่ถูกต้องได้

การวิจัยในช่วงต้นปี 2026 สแกน Agent Skill 3,984 รายการและพบว่า 283 รายการ (7.1%) มีข้อบกพร่องการจัดการข้อมูลรับรองที่สำคัญซึ่งส่ง API Key ผ่าน LLM Context ในรูปแบบข้อความธรรมดา Skill 76 รายการมี Payload สำหรับขโมยข้อมูลรับรองโดยตั้งใจ การป้องกันโครงสร้างเดียวคือการรับรองว่าข้อมูลรับรองไม่มีอยู่ใน Context ของ Agent Agent ไม่สามารถรั่วไหลข้อมูลรับรองที่ตัวเองไม่มี

## Pattern การจัดการข้อมูลรับรองสำหรับ AI Agent

### Pattern 1: Environment Variable (ความปลอดภัยต่ำที่สุด)

Environment Variable (`os.environ`, ไฟล์ `.env`, Docker `--env` Flag) เป็น Pattern ข้อมูลรับรองเริ่มต้นสำหรับ Agent Framework ส่วนใหญ่ LangChain อ่านจาก `os.environ`, CrewAI พึ่งพาการฉีด Environment, OpenAI Agents SDK คาดหวังข้อมูลรับรองใน Process Environment Pattern นี้เหมาะสมเฉพาะสำหรับการพัฒนาในเครื่องและการสร้าง Prototype เท่านั้น

สำหรับ Production Agent Fleet Environment Variable ล้มเหลวในทุกแกนความปลอดภัย: มีอยู่ในหน่วยความจำของ Agent Process (เข้าถึงได้ผ่าน Prompt Injection), ปรากฏใน `/proc/{pid}/environ` บน Linux Host, โผล่ขึ้นใน Error Traceback และ Debug Output และแพร่กระจายไปยัง Agent ทั้งหมดใน Fleet ที่ใช้ Environment ร่วมกัน

### Pattern 2: การผสานรวม Secret Manager

Cloud Secret Manager (AWS Secrets Manager, $0.40/Secret/เดือน + $0.05 ต่อ 10,000 API Call; Azure Key Vault; GCP Secret Manager) ปรับปรุงจาก Environment Variable โดยการเก็บข้อมูลรับรองไว้ภายนอก Agent Process และดึงมาตามความต้องการ Agent เรียก Secret Manager API เพื่อรับข้อมูลรับรอง ใช้งานสำหรับ Operation แล้วทิ้ง

Pattern นี้ลดอายุการใช้งานข้อมูลรับรองในหน่วยความจำแต่ไม่ขจัดหน้าต่างการเปิดเผย: ข้อมูลรับรองยังคงผ่านหน่วยความจำของ Agent ในช่วง Fetch-Use-Discard Cycle

### Pattern 3: Vault Proxy / การฉีด Opaque Handle (ความปลอดภัยสูงที่สุด)

Pattern Vault-Proxy เก็บข้อมูลรับรองไว้นอกคอนเทนเนอร์ Agent ทั้งหมด Agent เก็บ Opaque Handle ซึ่งเป็นสตริงอ้างอิงเช่น `$CRED{stripe_key}` ที่ระบุข้อมูลรับรองโดยไม่ต้อง Resolve มัน เมื่อ Agent ทำ API Call ที่มี Handle Vault Proxy จะสกัดกั้น Request, Resolve Handle ไปยังข้อมูลรับรองจริง, ฉีดที่ Network Layer และส่ง Request ที่ผ่านการยืนยันตัวตนต่อไป Agent ไม่เคยเห็นข้อมูลรับรองในรูปแบบข้อความธรรมดา

นี่คือหลักการ Agent-Side Injection เดียวกับที่ HashiCorp Vault (35,763 ดาว, BSL, v2.0.2 เปิดตัว 5 มิถุนายน 2026) ใช้ สร้างโดยตรงใน Layer การ Orchestrate Agent ด้วยเซิร์ฟเวอร์ MCP มากกว่า 700 เซิร์ฟเวอร์ใน Ecosystem (มิถุนายน 2026) Pattern Handle `$CRED{}` ขจัดการแพร่กระจาย `.env` ต่อ Server: Reference Handle เดียวในการกำหนดค่า Agent ครอบคลุมความต้องการข้อมูลรับรองของ MCP Server ใดก็ได้

คอนเทนเนอร์ Agent ที่ถูกโจมตีอย่างสมบูรณ์ซึ่ง Execute คำสั่งของผู้โจมตีได้ตามต้องการยังคงมีการเข้าถึงข้อมูลรับรองเป็นศูนย์ เนื่องจากไม่มีข้อมูลรับรองอยู่ใน Scope ของคอนเทนเนอร์

### Pattern 4: Workload Identity และ OIDC Federation

Workload Identity (OIDC Federation, SPIFFE/SPIRE, Cloud IAM Service Account) ขจัด Long-Lived API Key สำหรับการเข้าถึง Cloud Service ได้อย่างสมบูรณ์ คอนเทนเนอร์ Agent แต่ละตัวได้รับ Short-Lived Identity Token เมื่อ Runtime ที่แลกเปลี่ยนเป็นข้อมูลรับรองของ Cloud Provider ข้อมูลรับรองมี TTL ที่จำกัด โดยปกติ 15 นาทีถึง 1 ชั่วโมง หลังจากนั้นจะหมดอายุและต้องออก Token ใหม่

สำหรับสถาปัตยกรรม [Multi-Agent System](/learn/multi-agent-systems) ที่ครอบคลุม Cloud Account หรือ Provider หลายรายการ Workload Identity Federation เป็นโมเดลข้อมูลรับรองเดียวที่ Scale ได้

## ทัศนคติของ OpenLegion: Pattern Handle $CRED{}

Agent Framework AI ที่สำคัญทุกตัวจัดการการจัดการข้อมูลรับรองเป็นปัญหาของแอปพลิเคชัน Host LangChain และ LangGraph อ่านจาก `os.environ` CrewAI พึ่งพาการฉีด Environment OpenAI Agents SDK คาดหวังข้อมูลรับรองใน Process Environment AutoGen สืบทอด Python Process Environment ไม่มี Framework ใดเหล่านี้ให้การแยกส่วนข้อมูลรับรองโครงสร้าง ทั้งหมดปล่อยให้การจัดการข้อมูลรับรองขึ้นอยู่กับ Operator ซึ่งในทางปฏิบัติหมายถึงไฟล์ `.env` และ Environment Variable ที่ใช้ร่วมกัน

Vault-Proxy ของ OpenLegion ถูกสร้างไว้ใน Layer การ Orchestrate Agent Agent อ้างถึงข้อมูลรับรองเป็น Opaque Handle `$CRED{name}` Mesh Host Resolve Handle ฝั่ง Server และฉีดข้อมูลรับรองที่ Network Boundary ไม่มีคอนเทนเนอร์ Agent ใดได้รับข้อมูลรับรองในรูปแบบข้อความธรรมดา Prompt Injection ไม่สามารถรั่วไหลสิ่งที่ไม่มีอยู่ได้

Infisical (27,296 ดาว, Open-Source TypeScript Secret Platform ที่มี MIT License Core) ระดมทุน $2.8M Seed ในปี 2023 OpenLegion บูรณาการฟังก์ชันเดียวกันโดยตรงใน Agent Runtime โดยไม่ต้องติดตั้ง Secret Management แยกต่างหาก

| **มิติ** | **OpenLegion** | **LangChain/LangGraph** | **CrewAI** | **OpenAI Agents SDK** | **AutoGen** |
|---|---|---|---|---|---|
| **การจัดเก็บข้อมูลรับรอง** | Vault (Opaque Handle) | Environment / .env | Environment / .env | Environment / .env | Environment / .env |
| **Pattern การเข้าถึงของ Agent** | Handle $CRED{} (ไม่เคย Resolve ในคอนเทนเนอร์) | อ่านโดยตรงจาก os.environ | อ่านโดยตรงจาก os.environ | อ่านโดยตรงจาก os.environ | อ่านโดยตรงจาก os.environ |
| **ข้อความธรรมดาใน Context ของ Agent?** | ไม่มีเลย | ใช่ (เมื่ออ่าน os.environ) | ใช่ (เมื่ออ่าน os.environ) | ใช่ (เมื่ออ่าน os.environ) | ใช่ (เมื่ออ่าน os.environ) |
| **การสนับสนุน Rotation** | Native ใน Vault; Hot Rotation โดยไม่ต้อง Restart | Manual; ต้อง Restart | Manual; ต้อง Restart | Manual; ต้อง Restart | Manual; ต้อง Restart |
| **การกำหนดขอบเขตต่อ Agent** | บังคับใช้ที่ระดับ Mesh ผ่าน Allowlist | ไม่ได้บังคับใช้ | ไม่ได้บังคับใช้ | ไม่ได้บังคับใช้ | ไม่ได้บังคับใช้ |
| **Audit Trail** | Resolve Handle แต่ละครั้งบันทึกพร้อม Agent ID | ไม่มี Native | ไม่มี Native | ไม่มี Native | ไม่มี Native |

สำหรับทีมที่ประเมินพื้นที่การเปิดเผยข้อมูลรับรองทั้งหมดใน Stack ปัจจุบัน [AI Agent Security Threat Model](/learn/ai-agent-security) ครอบคลุมการรั่วไหลของข้อมูลรับรองเป็นหนึ่งในหกหมวดหมู่ภัยคุกคามที่บันทึกไว้ ร่วมกับ Prompt Injection, การหลบหนีจาก Sandbox และการละเมิด Budget

## การหมุนเวียน Secret สำหรับ AI Agent Fleet

### Credential Lease ที่มี TTL จำกัด

Static API Key ซึ่งเป็นข้อมูลรับรองที่ไม่มีวันหมดอายุ เป็นข้อมูลรับรองที่แย่ที่สุดสำหรับ Agent Fleet Key ที่รั่วไหลแบบ Static ยังคงใช้งานได้ตลอดไป Credential Lease ที่มี TTL จำกัดแก้ปัญหาทั้งสอง ข้อมูลรับรองจะออกพร้อมหน้าต่างการหมดอายุ โดยปกติ 1 ชั่วโมงสำหรับ Session Agent แบบโต้ตอบ; 15 นาทีสำหรับ Operation ที่มีความอ่อนไหวสูง เมื่อ Lease หมดอายุ Vault จะออกข้อมูลรับรองใหม่โดยอัตโนมัติ ข้อมูลรับรองเก่าจะใช้ไม่ได้หลังจากหมดอายุ จำกัดมูลค่าของสำเนาที่รั่วไหลใดๆ

Dynamic Secret Engine ของ HashiCorp Vault สร้างข้อมูลรับรองแบบ Short-Lived สำหรับฐานข้อมูล, Cloud Provider และ Custom Backend ตามความต้องการ CVE-2026-39829 (golang/crypto, มิถุนายน 2026) แก้ไขช่องโหว่ DoS ในการ Parse SSH Public Key เนื่องจากขนาด RSA Parameter ไม่จำกัด Vault v2.0.2 แก้ไขโดยจำกัด RSA Key ไว้ที่ 8,192 บิต

### Hot Rotation โดยไม่ต้อง Restart Agent

Hot Rotation ฉีดข้อมูลรับรองใหม่เข้า Vault โดยไม่แตะต้องคอนเทนเนอร์ Agent ที่กำลังทำงาน API Call ถัดไปของ Agent ผ่าน Vault Proxy ใช้ข้อมูลรับรองใหม่อย่างโปร่งใส จากมุมมองของ Agent Handle `$CRED{name}` ยังคง Resolve ได้ เพียงแต่ Secret พื้นฐานเปลี่ยนแปลงไป

Hot Rotation ต้องการให้ Agent ไม่เคย Cache ข้อมูลรับรองในเครื่อง Pattern Handle `$CRED{}` บังคับใช้สิ่งนี้ตามโครงสร้าง: Handle จะ Resolve เมื่อ Call ไม่ใช่เมื่อ Startup ดังนั้นการ Cache ค่าที่ Resolve แล้วในเครื่องจึงไม่สามารถทำได้

### ขอบเขต Rotation ต่อ Agent

สำหรับ Agent Fleet ที่มีข้อมูลรับรองที่ใช้ร่วมกัน การหมุนเวียนข้อมูลรับรองมีผลต่อทุก Agent ที่ใช้มัน การหมุนเวียนข้อมูลรับรองของ Agent A ไม่มีผลต่อ Agent B เนื่องจาก Agent B มีขอบเขตข้อมูลรับรองแยกต่างหากของตัวเอง สิ่งนี้ทำได้เฉพาะเมื่อ Layer การ Orchestrate บังคับใช้การกำหนดขอบเขตต่อ Agent แทนที่จะพึ่งพาไฟล์ `.env` ที่ใช้ร่วมกัน สำหรับการออกแบบ [Agentic Workflow](/learn/agentic-workflows) ที่เชื่อมต่อ Agent เฉพาะทางหลายตัว การกำหนดขอบเขต Rotation ต่อ Agent มีความสำคัญต่อสุขอนามัยข้อมูลรับรองแบบ Zero-Downtime

## การแยกส่วนข้อมูลรับรองระหว่าง Agent

### การกำหนด Credential ต่อ Agent

Agent แต่ละตัวใน Fleet ควรเก็บเฉพาะข้อมูลรับรองที่งานเฉพาะของมันต้องการ Agent ที่ดึงข้อมูลเว็บต้องการข้อมูลรับรอง HTTP Client แต่ไม่ต้องการ Connection String ของฐานข้อมูล Agent วิเคราะห์ข้อมูลต้องการสิทธิ์อ่านสำหรับ Data Warehouse แต่ไม่ต้องการ Write Token สำหรับ External API Agent เผยแพร่ต้องการสิทธิ์เขียนสำหรับ CMS แต่ไม่ต้องการเข้าถึงฐานข้อมูลภายใน

OWASP LLM06 ระบุอย่างชัดเจนว่า Agent Credential ที่ Over-Provisioned เป็นปัจจัยที่ส่งผลต่อเหตุการณ์การรั่วไหลของข้อมูลรับรอง

### การกำหนดขอบเขต Credential ของ MCP Tool Server

ใน OpenLegion Credential ของ MCP Server จะถูกเก็บไว้ใน Vault เดียวกันและฉีดผ่าน Proxy Pattern เดียวกัน MCP Tool Server ได้รับ Request ที่ผ่านการยืนยันตัวตนจาก Mesh Proxy ไม่ใช่ Credential ดิบจาก Agent สิ่งนี้ป้องกันไม่ให้ MCP Server ที่เป็นอันตรายถูกใช้เป็น Vector สำหรับการรวบรวม Credential สำหรับโมเดลการเสริมความแข็งแกร่งของ [Model Context Protocol Security](/learn/model-context-protocol) ทั้งหมด โปรดดูคู่มือเฉพาะ

### การเพิกถอน Credential เมื่อ Agent หยุดทำงาน

Mesh ของ OpenLegion จัดการสิ่งนี้โดยอัตโนมัติ: เมื่อ Agent ถูก Archive Mesh จะเพิกถอน Credential Handle ทั้งหมดที่เกี่ยวข้องกับ Scope ของ Agent นั้น สำหรับระบบ [AI Agent Orchestration](/learn/ai-agent-orchestration) ที่จัดการ Lifecycle ของ Agent แบบ Programmatic การเพิกถอน Credential ควรเป็น First-Class Lifecycle Event ไม่ใช่ความคิดเพิ่มเติมในการดำเนินงาน

## Audit Trail และการบันทึก Log การเข้าถึง Credential

### สิ่งที่ต้องบันทึก (และสิ่งที่ไม่ควรบันทึก)

เหตุการณ์การเข้าถึง Credential แต่ละครั้งควรสร้าง Log Entry ที่มี: Agent ID ที่ Resolve Handle, ชื่อ Handle (ไม่ใช่ค่าที่ Resolve แล้ว), Timestamp, External Endpoint ที่ Request ที่ผ่านการยืนยันตัวตนกำหนดเป้าหมาย และ Result สิ่งที่ไม่ควรบันทึก: ค่า Credential จริงหรือ Derivative ของ Credential ในรูปแบบข้อความธรรมดาใดๆ

### การเชื่อมโยงการใช้งาน Credential กับการกระทำของ Agent

Orchestrator ของ OpenLegion บันทึก Tool Call และ Credential Resolution ใน Unified Event Stream การวิเคราะห์ Forensic สามารถ Replay Sequence ได้: ได้รับ Task -> LLM Call -> เลือก Tool -> Resolve Credential -> External API Call -> ได้รับ Response การบันทึก Log ที่ถูกต้องนี้มีความสำคัญต่อการตรวจสอบและการปฏิบัติตามข้อกำหนดในสภาพแวดล้อมที่มีความเสี่ยงสูง

สำหรับการตัดสินใจเกี่ยวกับ [AI Agent Platform](/learn/ai-agent-platform) สถาปัตยกรรม Audit Log เป็นข้อพิจารณาหลักด้านการปฏิบัติตามข้อกำหนดสำหรับการใช้งานในอุตสาหกรรมที่มีการควบคุม

## การเลือก Secret Backend สำหรับ Agent Platform

**HashiCorp Vault** (35,763 ดาว, BSL, v2.0.2 เปิดตัว 5 มิถุนายน 2026): ระบบการจัดการ Secret Open-Source อ้างอิง ให้การสร้าง Secret แบบ Dynamic, Lease ที่มี TTL จำกัด, Policy การเข้าถึงแบบละเอียด และ Audit Logging ที่ครอบคลุม หมายเหตุ: HashiCorp เปลี่ยนจาก Apache 2.0 License ที่ได้รับการอนุมัติจาก OSI ไปเป็น BSL ในเดือนสิงหาคม 2023 BSL ไม่ใช่ Open-Source License ที่ได้รับการอนุมัติจาก OSI

**Infisical** (27,296 ดาว, MIT License Core, Open-Source TypeScript): Platform Secret ที่เป็นมิตรกับนักพัฒนา ระดมทุน $2.8M Seed ในปี 2023 เป็นทางเลือกที่ Lightweight กว่า Vault

**Cloud-Native** (AWS/Azure/GCP): Managed Secret Storage พร้อม Native Integration กับระบบ IAM OIDC Workload Identity แก้ปัญหา Bootstrap Credential สำหรับการใช้งาน Cloud-Native

<!-- SCHEMA: FAQPage -->
## คำถามที่พบบ่อย

### การจัดการข้อมูลรับรองสำหรับ AI Agent คืออะไร?

การจัดการข้อมูลรับรองสำหรับ AI Agent คือกลุ่มของแนวปฏิบัติด้านโครงสร้างพื้นฐานที่ควบคุมวิธีที่ Agent อิสระเข้าถึง ใช้งาน หมุนเวียน และปล่อย API Key, Token และ Secret Agent แตกต่างจากแอปพลิเคชันแบบดั้งเดิมตรงที่ทำงานอย่างอิสระ สามารถถูกโจมตีผ่าน Prompt Injection, สร้าง Log โดยละเอียด และทำงานเป็น Multi-Instance Fleet OWASP LLM Top 10 v1.1 (2025) จัดอันดับ Sensitive Information Disclosure (LLM06) ไว้ในภัยคุกคามชั้นนำ 10 รายการ โดยมีการรั่วไหลของ Credential เป็น Attack Vector หลัก

### CVE ใดที่เกี่ยวข้องกับการรั่วไหลของ Credential ของ AI Agent?

CVE-2024-34359 (llama-cpp-python, CVSS 9.6) บันทึกช่องโหว่ Jinja2 SSTI ใน Model Loading Pipeline: Chat Template ของไฟล์ `.gguf` ที่สร้างขึ้น Render โดยไม่มี Sandbox ทำให้เกิด Remote Code Execution ในแอปพลิเคชันที่โหลด Model ที่ไม่น่าเชื่อถือ CVE-2025-29927 (Next.js, CVSS 9.1) พิสูจน์ว่า Header `x-middleware-subrequest` สามารถ Bypass Middleware Authorization ใน Next.js Application รวมถึง AI Agent Backend ได้ การแก้ไขโครงสร้างคือการเก็บ Secret ไว้นอกคอนเทนเนอร์ Agent ทั้งหมด

### Pattern Vault-Proxy ป้องกันการรั่วไหลของ Credential ได้อย่างไร?

Vault Proxy สกัดกั้น API Call ของ Agent, Resolve Opaque Credential Handle ไปยัง Secret จริงที่ Network Layer และส่งคืน Response ที่ผ่านการยืนยันตัวตนโดยที่ Credential ไม่เคยเข้าสู่คอนเทนเนอร์หรือ Context Window ของ Agent คอนเทนเนอร์ Agent ที่ถูกโจมตีอย่างสมบูรณ์มีการเข้าถึง Raw Credential เป็นศูนย์เนื่องจากไม่มี Credential อยู่ใน Scope ของคอนเทนเนอร์

### เหตุใดการแยกส่วน Credential ต่อ Agent จึงสำคัญใน Multi-Agent System?

ใน Multi-Agent System ระยะความเสียหายสำหรับ Agent แต่ละตัวถูกจำกัดโดย Credential ที่มันมีอยู่ การกำหนดขอบเขต Credential ต่อ Agent ที่บังคับใช้ที่ Layer การ Orchestrate หมายความว่า Research Agent ที่ถูกโจมตีไม่สามารถเข้าถึง Write Token ของ Publishing Agent หรือ Database Credential ของ Data Agent ได้ OWASP LLM06 ระบุอย่างชัดเจนว่า Agent Credential ที่ Over-Provisioned เป็นปัจจัยที่ส่งผลต่อเหตุการณ์การรั่วไหล

### OWASP พูดอะไรเกี่ยวกับการจัดการ Credential ของ AI Agent?

OWASP Top 10 for LLM Applications v1.1 (ตุลาคม 2025) จัดอันดับ Sensitive Information Disclosure เป็น LLM06 และระบุการรั่วไหลของ Credential เป็น Attack Vector หลัก คำแนะนำคือหลีกเลี่ยงการจัดเก็บ Credential ในรูปแบบข้อความธรรมดาใน Agent Context, บังคับใช้ Least-Privilege Credential Scoping และใช้การควบคุมระดับ Infrastructure Prompt Injection (OWASP LLM01) เป็น Attack Vector ที่พบบ่อยที่สุดในการเรียกใช้การเปิดเผย Credential

### OpenLegion จัดการ Credential สำหรับ Agent ที่ทำงาน MCP Server ได้อย่างไร?

ใน OpenLegion Credential ของ MCP Tool Server จะถูกเก็บไว้ใน Vault เดียวกันและฉีดผ่าน Proxy Pattern เดียวกันกับ Agent Credential MCP Server ได้รับ Request ที่ผ่านการยืนยันตัวตนจาก Mesh Proxy ไม่ใช่ Raw Credential จาก Agent MCP Server ที่ถูกโจมตีไม่สามารถรวบรวม Raw Credential จาก Request ที่เข้ามาได้

### Secret Rotation คืออะไรและเหตุใด AI Agent จึงต้องการมัน?

Secret Rotation คือการปฏิบัติในการแทนที่ Credential ด้วยอันใหม่ตามกำหนดเวลาหรือตาม Trigger และการทำให้อันเก่าใช้ไม่ได้ AI Agent ต้องการ Rotation เนื่องจากทำงานเป็นเวลานาน เป็นเป้าหมายที่อาจรั่วไหลตลอดหน้าต่างนั้น และ Restart ไม่ง่ายกลางงาน Credential Lease ที่มี TTL จำกัดจะหมดอายุโดยอัตโนมัติหลังจากหน้าต่างที่กำหนดค่าได้ และ Pattern Vault-Proxy รองรับ Hot Rotation โดยไม่แตะต้องคอนเทนเนอร์ Agent ที่กำลังทำงาน

## การสร้าง Agent Fleet โดยไม่มีการเปิดเผย Credential

ปัญหาการจัดการ Credential ใน AI Agent Fleet เป็นเรื่องของสถาปัตยกรรม: ถ้า Credential มีอยู่ในคอนเทนเนอร์ Agent ก็สามารถรั่วไหลได้ CVE-2024-34359 และ CVE-2025-29927 แสดงให้เห็นว่าแม้แต่ทีมที่มีทรัพยากรดีที่ใช้งาน Framework หลักก็ยังสร้างการเปิดเผยนี้ Pattern Vault-Proxy แก้ไขสิ่งนี้ตามโครงสร้าง Credential ไม่เคยเข้าสู่คอนเทนเนอร์ Agent ดังนั้น Prompt Injection, การหลบหนีจากคอนเทนเนอร์ หรือการรั่วไหลของ Log จึงไม่สามารถดึงมันออกมาได้

Vault-Proxy ของ OpenLegion ถูกสร้างไว้ใน Agent Mesh กำหนดค่า Credential ครั้งเดียวด้วย `$CRED{name}`, กำหนดให้กับ Agent ที่ต้องการ และ Mesh จัดการการฉีด, การต่ออายุ TTL, การกำหนดขอบเขตต่อ Agent และ Audit Logging โดยไม่ต้องใช้ Vault ที่แยกต่างหาก, การประสาน `.env` หรือขั้นตอน Rotation ด้วยตนเอง

[รักษาความปลอดภัย Agent Fleet ของคุณด้วยการแยกส่วน Credential Vault-Proxy บน OpenLegion](https://openlegion.ai)
