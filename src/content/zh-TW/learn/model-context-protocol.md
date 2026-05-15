---
title: Model Context Protocol (MCP) — AI 代理如何使用工具
description: >-
  Model Context Protocol (MCP) 是 Anthropic 為讓 AI 代理探索與呼叫外部工具
  所制定的開放標準。它如何運作、安全注意事項,以及 OpenLegion 對 MCP 的支援。
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

# Model Context Protocol:AI 代理工具的開放標準

**Model Context Protocol**(MCP)是 Anthropic 在 2024 年 11 月發布的開放標準,讓 AI 代理探索並呼叫外部工具 — 資料庫、檔案系統、API、內部服務 — 而無需撰寫客製化的黏合程式碼。MCP 伺服器暴露能力;MCP 客戶端(代理執行環境、IDE、助理)消費這些能力。協定刻意極簡,這也是其生產上的陷阱:部署必須在其之上加層驗證、沙箱與每工具預算,才能安全執行。

<!-- SCHEMA: DefinitionBlock -->

> **什麼是 Model Context Protocol?**
> Model Context Protocol 是一個由 Anthropic 原始發布、基於 JSON-RPC 的開放標準,定義 AI 代理(客戶端)如何探索並呼叫工具(伺服器)暴露的能力。它在 AI 代理生態圈中相當於編輯器的 LSP 或硬體的 USB:一套協定、多種實作。

## 重點摘要

- **MCP 是代理生態圈的 USB 連接埠** — 一套協定讓任何相容的代理執行環境使用任何相容的工具伺服器,無需撰寫自訂黏合程式碼。
- **Anthropic 於 2024 年 11 月發布 MCP**;2025 年間主要採用者包括 OpenAI、Microsoft Copilot、Cursor、Zed、Continue 與多數代理框架。
- **MCP 定義四種基礎元件**:tools(函式式呼叫)、resources(唯讀資料)、prompts(可重用範本),以及 sampling(伺服器主動發起回客戶端的 LLM 呼叫)。
- **傳輸採 JSON-RPC over stdio 或 HTTP/SSE**。stdio 是主流的本地形式;HTTP/SSE 在遠端 MCP 伺服器上日漸普及。
- **生產級 MCP 需要多數教學略過的三層**:工具呼叫上的驗證、沙箱與預算強制執行。

## MCP 如何運作

MCP 客戶端(代理執行環境或 AI 助理)連接到一個或多個 MCP 伺服器。連接時,客戶端要求能力清單 — 這個伺服器提供哪些 tools、resources、prompts?每個工具會公告其參數的 JSON schema。代理的 LLM 將工具清單作為脈絡的一部分,並據此選擇要呼叫的工具。客戶端將呼叫路由至正確的伺服器、編組 JSON,並回傳結果。

傳輸採 JSON-RPC 2.0。兩種傳輸常見:stdio(客戶端將伺服器作為子程序啟動,並透過 stdin/stdout 通訊 — Claude Desktop 的預設方式),以及 HTTP 加 Server-Sent Events,用於跨網路邊界的遠端伺服器。

協定本身刻意極簡。複雜度在於 MCP 伺服器暴露什麼:檔案系統伺服器給代理一個目錄的讀寫存取權;Postgres 伺服器給予查詢存取;Slack 伺服器給予發送訊息與讀取頻道的能力。同一個代理可同時連接到多個伺服器。

## MCP 伺服器 vs MCP 客戶端

**MCP 伺服器** 是工具端。任何人都能寫一個 — Anthropic 發布了 Python 與 TypeScript 的參考 SDK。截至 2026 年中,已有數千個社群伺服器涵蓋 GitHub、Notion、Linear、Postgres、AWS、瀏覽器自動化等。伺服器通常很小(數百行),因為協定處理了大部分工作。

**MCP 客戶端** 是代理執行環境、IDE 與助理。Claude Desktop 是參考客戶端。Cursor、Zed、Continue、Windsurf 與多數代理框架在 2025 年間加入 MCP 客戶端支援。單一 MCP 客戶端通常支援多個並行伺服器連線 — 一個代理同時與檔案系統伺服器、資料庫伺服器與 Slack 伺服器對話。

關鍵洞察:LLM 不直接說 MCP 語言。客戶端將 MCP 工具清單在 LLM 提示中呈現為函式定義;LLM 發出函式呼叫;客戶端將呼叫映射到正確的 MCP 伺服器並轉發 JSON-RPC 請求。

## 生產 MCP 的安全考量

MCP 是 *能力暴露* 協定 — 不是授權或稽核協定。生產部署需要加上 MCP 刻意略過的部分:

- **驗證**:多數 MCP 伺服器在本地以未驗證方式執行。多租戶部署需要每代理憑證與每伺服器驗證邊界。
- **沙箱**:具廣泛路徑存取的 MCP 檔案系統伺服器在功能上等同主機 root。請在容器中執行 MCP 伺服器;不要盲目掛載敏感容量。
- **預算強制執行**:工具呼叫不是免費的。代理在迴圈中呼叫 MCP 網頁抓取伺服器可能累積可觀成本。每代理預算必須涵蓋工具呼叫,而非僅 LLM token。
- **稽核日誌**:MCP 本身不標準化呼叫日誌。生產執行環境需要記錄每次伺服器呼叫的參數、回應形狀與計時,以供 [AI 代理安全](/learn/ai-agent-security) 審查與事件回應使用。

參考的 Claude Desktop MCP 整合將伺服器掛載為主機子程序,使用主機使用者的檔案系統權限。這對單使用者開發者設置可行;不適合生產。

## OpenLegion 如何整合 MCP

OpenLegion 預設是 MCP 客戶端。執行環境中的代理自動探索為其艦隊設定的 MCP 伺服器、在脈絡視窗中看到工具清單,並透過與內建技能相同的金庫代理、ACL 把關路徑呼叫 MCP 工具。網狀架構強制執行 MCP 略過的生產級層:

- 每個 MCP 伺服器在自己的沙箱化命名空間中執行;代理永遠無法直接 stdio 存取伺服器程序。
- 每代理 ACL 把關特定代理被允許呼叫哪些 MCP 伺服器。
- 每次工具呼叫都計入代理的每代理預算;代理超過上限時會被截斷,無論支出來自 LLM 或 MCP 工具。
- 網狀架構將每次 MCP 呼叫記錄至追蹤日誌 — 與 [AI 代理可觀測性](/learn/ai-agent-observability) 涵蓋的相同遙測。

結果:你能取得 MCP 生態圈的廣度,而不繼承其預設信任假設。

## OpenLegion 的觀點

MCP 是自 OpenAPI 以來最重要的代理生態圈標準 — 它將原本是 N × M 的整合工作(每個代理框架乘以每個工具)壓縮為 N + M 個伺服器與客戶端。但協定刻意極簡意味著生產團隊必須重建專有系統原已捆綁的無聊基礎設施 — 驗證、沙箱、預算、稽核。把 MCP 當作「加水即可」而不疊上這些關切的框架,出貨的是預設不安全的代理。請選擇認真到願意約束 MCP 的 [AI 代理平台](/learn/ai-agent-platform)。

## CTA

**部署 MCP 相容代理,內建生產級控制。**
[立即開始](https://app.openlegion.ai) | [閱讀文件](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## 常見問題

### 什麼是 Model Context Protocol?

Model Context Protocol(MCP)是由 Anthropic 在 2024 年 11 月推出的開放 JSON-RPC 標準,讓 AI 代理透過統一介面探索並呼叫外部工具。MCP 伺服器暴露能力(tools、resources、prompts);MCP 客戶端(代理執行環境、IDE、助理)消費它們。2025 年間的主要採用者包括 OpenAI、Microsoft Copilot、Cursor、Zed 與多數代理框架。

### 誰建立了 MCP,它是開放的嗎?

Anthropic 建立 MCP,以開放規格發布,並提供 Python 與 TypeScript 的參考 SDK。規格透過 GitHub 由社群治理,無授權或專有鎖定。任何人都能撰寫 MCP 伺服器或客戶端,主要 LLM 供應商也都出貨相容 MCP 的工具。

### MCP 伺服器與 MCP 客戶端的差別是什麼?

MCP 伺服器暴露能力 — Postgres 伺服器暴露查詢工具、檔案系統伺服器暴露檔案讀寫、Slack 伺服器暴露訊息發送。MCP 客戶端是消費端 — 通常是代理執行環境、IDE 或 AI 助理。客戶端可同時連接多個伺服器;伺服器可被多個客戶端重複使用。

### MCP 預設安全嗎?

不是 — 而且是刻意設計的。MCP 是能力暴露協定,不是授權協定。參考實作(Claude Desktop、SDK 範例)以未驗證方式執行伺服器作為主機子程序,使用使用者的檔案系統權限。生產部署必須在 MCP 之上加上驗證、沙箱、每工具預算與稽核日誌。

### MCP 與 OpenAI function calling 相比如何?

OpenAI function calling 是讓單一 LLM 呼叫 API 請求中定義的函式的單一廠商模式 — 它不標準化工具如何被探索、封裝或跨系統共享。MCP 則是針對同一問題的跨廠商開放標準,層級在生態圈。兩者互補:MCP 伺服器暴露能力;MCP 客戶端可在呼叫 GPT 模型時將其呈現為 OpenAI 格式的函式定義,或在呼叫 Claude 時呈現為 Anthropic 的工具使用格式。

### 我能將 MCP 與任何 LLM 供應商一起使用嗎?

可以。MCP 與 LLM 無關 — 客戶端將 MCP 工具定義呈現為底層 LLM 期望的任何格式(Anthropic tool use、OpenAI function calling、Gemini function declarations)。像 OpenLegion 這類透過 LiteLLM 支援 100 多家供應商的執行環境,會自動將 MCP 工具適配為各供應商的呼叫慣例。
