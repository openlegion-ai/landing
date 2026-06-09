---
title: OpenLegion vs nanobot — 詳細比較(2026)
description: >-
 OpenLegion vs nanobot:安全優先框架 vs 極輕量 OpenClaw 替代方案。
 比較憑證處理、隔離與生產就緒度。
slug: /comparison/nanobot
primary_keyword: openlegion vs nanobot
secondary_keywords:
 - nanobot alternative
 - nanobot security
 - nanobot vulnerability
 - lightweight ai agent framework
 - openclaw alternative python
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /comparison/nanoclaw
 - /comparison/picoclaw
 - /comparison/zeroclaw
 - /comparison/openclaw
---

# OpenLegion vs nanobot:CVSS 10.0 弱點告訴我們什麼關於代理安全

nanobot 可能是 AI 代理安全領域中最具啟發性的案例研究。由學術研究實驗室於 2026 年初創建,它將 OpenClaw 的 430,000+ 行壓縮為約 4,000 行 Python — 99% 的程式碼縮減,在 Hacker News 贏得 218 分(任何 Claw 替代方案中最強的迴響),並獲約 20,000-26,000 個 GitHub 星。

接著,在推出後數週內,安全研究員揭露了一個 **重大弱點(CVSS 10.0)**:nanobot 的 WhatsApp 橋接器將其 WebSocket 伺服器繫結至 0.0.0.0:3001,無任何驗證。網路上任何人都可劫持 WhatsApp 會話。接著又發現額外重大弱點 — shell 指令注入、路徑遍歷繞過,以及繼承自 LiteLLM 相依性的遠端程式碼執行瑕疵。

nanobot 是一個立意良善的教學工具,卻意外成為「輕量程式碼不等同安全程式碼」的案例研究。OpenLegion 的存在,正是為了讓此教訓成為結構性。

OpenLegion 是一個安全優先的 [AI 代理框架](/learn/ai-agent-platform),具強制 Docker 容器隔離、金庫代理憑證管理、每代理預算強制執行,以及艦隊模型協調(黑板 + 發布訂閱 + 交棒)。

<!-- SCHEMA: DefinitionBlock -->

> **OpenLegion 與 nanobot 的差別是什麼?**
> nanobot 是 OpenClaw 的約 4,000 行 Python 重新實作,專注於教學的簡潔與可讀性。它支援 11+ LLM 供應商與 8+ 訊息通路,但曾出現重大 WhatsApp 橋接器弱點(CVSS 10.0,未驗證 WhatsApp 會話劫持)、shell 注入、路徑遍歷,以及 LiteLLM RCE 弱點。OpenLegion 是一個安全優先的 Python 框架,具每代理強制 Docker 容器隔離、代理永不見 API 金鑰的金庫代理憑證管理、每代理預算強制執行,以及艦隊模型協調(黑板 + 發布訂閱 + 交棒)。nanobot 為學習與簡潔最佳化;OpenLegion 為生產安全最佳化。

## 重點摘要

| 面向 | OpenLegion | nanobot |
|---|---|---|
| **主要焦點** | 生產安全基礎設施 | 教育簡潔性 |
| **語言** | Python | Python(~4,000 行) |
| **代理隔離** | 每代理 Docker 容器、非 root | `restrict_to_workspace` 旗標(應用層級) |
| **憑證安全** | 金庫代理 — 代理永不見金鑰 | 設定檔(`~/.nanobot/config.json`) |
| **預算控制** | 每代理每日 / 每月硬性截止 | 無內建 |
| **編排** | 艦隊模型協調(黑板 + 發布訂閱 + 交棒) | 單代理加背景子代理 |
| **LLM 供應商** | 透過 LiteLLM 支援 100+ | 11+(OpenRouter、Anthropic、OpenAI、DeepSeek 等) |
| **訊息通路** | 5 | 8+(Telegram、Discord、WhatsApp、Feishu、DingTalk 等) |
| **多代理** | 艦隊範本,具每代理 ACL | 子代理孵化(無艦隊編排) |
| **記憶** | 每代理持久,具向量搜尋 | 基於 grep 的檢索(刻意避免 RAG) |
| **GitHub 星數** | ~59 | ~20,000-26,000 |
| **授權** | PolyForm Perimeter License 1.0.1 | MIT |
| **已知 CVE** | 0 | **重大 WhatsApp 橋接器弱點(CVSS 10.0)** + 3 個額外重大修補 |
| **起源** | 獨立 | 學術研究實驗室 |

## 何時選擇 nanobot

**你想要學習 AI 代理如何運作。** nanobot 是一個教學骨架。在 4,000 行、結構清晰的程度下,它是理解核心代理迴圈最佳的程式碼庫:供應商抽象、工具派遣、記憶檢索與聊天閘道。DataCamp 發布了完整教學。創建者明確為教育可讀性設計。

**你需要亞洲訊息平台支援。** nanobot 對 Feishu(Lark)、DingTalk、QQ 與 WeChat 周邊平台具一級支援 — 這些是西方為主的框架難以涵蓋的通路。若你的部署目標為中國企業訊息,nanobot 的生態圈定位獨特。

**你想要在 Raspberry Pi 上執行代理。** nanobot 輕量到能在單板電腦上執行。搭配 Ollama 進行本地推理,你可獲得完全離線的代理運作。

**你重視簡潔勝於基礎設施。** JSON 設定、基於 grep 的記憶(無需向量資料庫)與 pip install。無 Docker、無艦隊模型協調、無金庫設置。從安裝到代理運作不到五分鐘。

**社群動能對你很重要。** nanobot 的 218 分 HN 推出、活躍 Discord、DataCamp 整合與 ~20,000+ 星,代表可觀的社群投入與大量快速修問題的貢獻者(CVSS 10.0 在數天內修補)。

## 何時選擇 OpenLegion

**安全必須是架構性的,不是可選的。** nanobot 的 `restrict_to_workspace` 旗標是主要隔離機制 — 一個可被切換關閉的布林值。它的 API 金鑰存於明文 JSON 設定檔中。它的 WebSocket 伺服器在無驗證下出貨。這些不是隱晦的邊角案例;它們是基本的架構決策,在數週內就產生了 CVSS 10.0。OpenLegion 讓不安全的設定在結構上不可能:容器隔離是強制的、金庫代理是唯一憑證路徑,且艦隊模型協調由每代理工具迴圈偵測界限。

**你無法承受生產中的 CVSS 10.0。** 重大 WhatsApp 橋接器弱點允許未驗證的網路鄰近攻擊者透過連接 nanobot 在連接埠 3001 上未受保護的 WebSocket 伺服器,劫持 WhatsApp 會話。額外的 shell 注入與路徑遍歷弱點由單一安全研究員在單一稽核中發現。OpenLegion 的金庫代理架構意味著無憑證可劫持 — 代理透過代理進行呼叫,代理在網路層注入金鑰。

**你需要每代理成本控制。** nanobot 無預算強制執行。在 11+ 供應商支援與孵化背景子代理能力下,不受控的 API 支出會悄悄累積。OpenLegion 強制執行每代理每日與每月上限,具自動硬性截止。

**你需要可稽核的多代理艦隊協調。** nanobot 支援孵化子代理,但編排是 LLM 驅動且非確定性的。OpenLegion 的艦隊模型協調定義每代理明確的交棒記錄、工具存取與相依性 — 部署前即可稽核。

**你需要向利害關係人證明安全姿態。** nanobot 的 CVE 紀錄讓它難以說服安全團隊、合規審查者或企業採購。OpenLegion 的金庫代理架構、強制容器隔離與每代理 ACL 提供可展示的安全控制。

## 安全模型比較

### 機密儲存位置

**nanobot** 將 API 金鑰存於 `~/.nanobot/config.json` — 磁碟上的明文 JSON 檔。設定檔最初以 0644 權限寫入(所有人可讀);後續修補為 0600。執行時,金鑰被載入 Python 程序記憶體。在代理程序內執行的任何程式碼皆可讀取。

**OpenLegion** 將憑證儲存於代理無法存取的金庫中。API 呼叫透過金庫代理路由,代理在網路層注入憑證。無含明文金鑰的設定檔、無含機密的環境變數、無掛載的憑證檔案。代理程序永不持有 API 金鑰。

### 隔離模型

**nanobot** 使用 `restrict_to_workspace` 旗標,將檔案操作限制於工作區目錄。這是 Python 程式碼中的應用層級檢查 — 若代理達成任意程式碼執行(shell 注入弱點證明可能),工作區限制可被繞過。無強制執行的 OS 層級隔離。

**OpenLegion** 使用每代理 Docker 容器隔離。每個代理在獨立容器中執行,具非 root 執行、無 Docker socket 存取、no-new-privileges,以及每容器資源上限。即便代理在容器內達成任意程式碼執行,也無法存取其他代理、主機系統或憑證儲存。

### CVE 紀錄

**nanobot** 在短暫存在中已累積重大安全議題:

- **重大 WhatsApp 橋接器弱點(CVSS 10.0):** WhatsApp WebSocket 橋接器繫結至 0.0.0.0:3001,無驗證。網路鄰近攻擊者可劫持會話。由安全研究員發現。
- **shell 指令注入(中等):** 未清理的使用者輸入傳遞給 shell 執行。
- **路徑遍歷繞過(中等):** `restrict_to_workspace` 可被規避。
- **透過 `eval()` 的 LiteLLM RCE(重大):** 繼承自相依性。透過精心打造的輸入執行遠端程式碼。
- **會話污染(2026 年 2 月 26 日修補):** 訊息歷史操弄。

**OpenLegion** 截至 v0.1.0 無 CVE 回報。其架構讓 nanobot 多個弱點類別在結構上不可能:金庫代理消除憑證暴露、Docker 隔離防止路徑遍歷逃逸,以及艦隊模型協調防止無明確工具授予的任意 shell 執行。

### 預算控制

**nanobot** 無內建支出上限。背景子代理可在無上限下發出 API 呼叫。

**OpenLegion** 強制執行每代理每日與每月上限,具自動硬性截止。

## nanobot 的生態圈:它做得最好的部分

### 教學骨架

nanobot 最大的貢獻是教育性的。核心代理迴圈 — 接收訊息、檢索脈絡、呼叫 LLM、派遣工具、回傳回應 — 在乾淨、可讀的 Python 中赤裸呈現。刻意選用基於 grep 的記憶檢索而非 RAG,讓檢索機制透明。JSON 設定可由人類閱讀。每個架構決策都優先考量理解勝過精密。

對學生、研究員與學習 AI 代理內部運作的開發者,nanobot 可說是最佳起點。

### 亞洲平台整合

nanobot 的通路支援包含 Feishu(Lark)、DingTalk、QQ 與 Matrix — 主導中國企業通訊的平台。OpenClaw 生態圈中沒有其他框架提供可比的覆蓋。專案的學術起源可能解釋此聚焦,且對於在亞洲市場運作的團隊代表真實價值。

### ClawHub 技能相容性

nanobot 與 ClawHub 技能生態圈整合,使其能存取社群貢獻的代理技能。SKILL.md 文件格式在 nanobot、PicoClaw 與其他 Claw 家族專案間共享。

### 快速反應文化

當重大 WhatsApp 橋接器弱點被揭露時,nanobot 團隊在數天內修補。會話污染修復於 2 月 26 日落地。shell 注入與路徑遍歷迅速處理。社群的反應力確實令人印象深刻 — 但也凸顯這些議題首先不應出貨。

### 常見的生產陷阱

**根本問題是架構性的。** nanobot 被設計為教學工具,卻在生產上變得受歡迎。其安全模型 — 應用層級工作區限制、明文設定、無網路隔離 — 適合本地實驗但對生產危險。CVSS 10.0 不是複雜程式碼中的 bug;是 WebSocket 伺服器無驗證。這種疏忽正是架構性安全限制可防止的。

**相依鏈風險。** LiteLLM RCE(透過 `eval()`)展示即便最小程式碼庫也繼承其相依性的弱點。nanobot 的 ~4,000 行可稽核,但完整相依樹不行。

**無網路安全模型。** nanobot 無網路政策、入口控制或服務網狀隔離的概念。代理可發出任意對外連線。結合 shell 存取,這造成廣大的攻擊面。

### OpenLegion 的不同涵蓋方式

OpenLegion 的架構在設計上防止 nanobot 的弱點類別:

- **重大 WhatsApp 橋接器弱點(未驗證網路服務):** OpenLegion 代理執行於 Docker 容器中,預設無暴露連接埠。網路存取需以每代理為單位明確授予。
- **shell 注入:** OpenLegion 的艦隊模型協調需要明確的工具授予。shell 存取除非在代理的 ACL 中特別啟用,否則不可用。
- **路徑遍歷:** 具唯讀掛載與無 Docker socket 的 Docker 容器隔離,消除路徑遍歷作為有意義的攻擊向量。
- **憑證暴露:** 金庫代理意味著代理環境中不存在可竊取的憑證。
- **相依 RCE:** 容器隔離限制影響範圍 — 即便相依性有 RCE,攻擊者也被約束於無憑證的沙箱容器內。

## 託管 vs 自我託管的取捨

**nanobot** 為本地自我託管而設計。pip install、JSON 設定,數分鐘內代理運作。無託管服務存在。輕量本質意味著任何 Linux 系統、macOS,甚至 Raspberry Pi 都能託管。

**OpenLegion** 需要 Python、SQLite 與 Docker。代管平台(即將推出)將為每使用者提供 VPS 實例,$19/月。Docker 需求增加基礎設施負擔,但提供讓生產部署安全的隔離層。

## 適合誰

**nanobot** 適合想透過乾淨、可讀程式碼庫理解 AI 代理架構的學生、研究員與獨立開發者。對於以亞洲訊息平台(Feishu、DingTalk、QQ)為目標的團隊也有價值。理想使用者在本地執行 nanobot 處理個人任務,且不暴露於不可信網路。

**OpenLegion** 適合在安全事件具商業後果的環境中部署代理的工程團隊。理想使用者需要向利害關係人展示憑證隔離、成本控制與稽核軌跡 — 且無法承擔生產中的 CVSS 10.0。

## 誠實的取捨

nanobot 證明了你能在 4,000 行內重建 AI 代理執行環境。該成就對生態圈而言真實且有價值。但重大 WhatsApp 橋接器弱點證明,簡潔與安全並非同義詞。具 CVSS 10.0 的 4,000 行程式碼庫,比起讓該弱點類別不可能存在的具架構限制之 ~77,000 行程式碼庫,更不安全。

若你想學習代理如何運作,讀 nanobot 的原始碼。若你想安全部署代理,使用一個不安全設定無法發生的框架。

完整版圖請參閱我們的 [AI 代理框架比較](/learn/ai-agent-frameworks)。

## CTA

**部署具架構性、非願景式安全的代理。**
[立即開始](https://app.openlegion.ai) | [閱讀文件](https://docs.openlegion.ai) | [查看所有比較](/comparison)

---

<!-- SCHEMA: FAQPage -->

## 常見問題

### 什麼是 nanobot?

nanobot 是由學術研究實驗室創建的 ~4,000 行 Python OpenClaw 重新實作。它支援 11+ LLM 供應商與 8+ 訊息通路(包含 Feishu、DingTalk 與 QQ 等亞洲平台)。它於 2026 年 2 月 2 日推出,具約 20,000-26,000 個 GitHub 星。它在任何 OpenClaw 替代方案中獲得 Hacker News 最強迴響(218 分、111 則留言)。

### OpenLegion vs nanobot:差別是什麼?

nanobot 是教學骨架 — 極簡、可讀,為學習而設計。OpenLegion 是生產安全框架。nanobot 使用應用層級工作區限制與明文 JSON 設定;OpenLegion 使用 Docker 容器隔離與金庫代理憑證。nanobot 曾發生重大 WhatsApp 橋接器弱點(CVSS 10.0)加上三個額外重大弱點;OpenLegion 截至 v0.1.0 無 CVE 回報,且其架構讓那些弱點類別在結構上不可能。

### OpenLegion 是 nanobot 替代方案嗎?

是。兩者都是基於 Python 的 AI 代理框架,但服務不同目的。nanobot 最適合學習與本地實驗。OpenLegion 對於需要生產級安全的團隊是替代方案 — 金庫代理憑證隔離、每代理預算強制執行、Docker 容器隔離,以及艦隊模型協調(黑板 + 發布訂閱 + 交棒)。

### OpenLegion 與 nanobot 在憑證處理上如何比較?

nanobot 將 API 金鑰存於 `~/.nanobot/config.json`(修補前所有人可讀)。金鑰在執行時被載入 Python 程序記憶體。OpenLegion 使用金庫代理 — 代理透過代理發出 API 呼叫,代理在網路層注入憑證。代理絕不持有、讀取或以任何形式存取 API 金鑰。

### 哪個更適合生產 AI 代理?

OpenLegion 顯著更適合生產。nanobot 被設計為教學工具,並在推出後數週內累積重大 WhatsApp 橋接器弱點(CVSS 10.0)、shell 注入、路徑遍歷與相依 RCE 弱點。OpenLegion 的強制容器隔離、金庫代理憑證、每代理預算與可稽核艦隊模型協調,精確處理影響 nanobot 的弱點類別。

### nanobot 與 nanobot(Obot AI)相同嗎?

不同。有兩個完全不同的專案共享此名稱。本頁討論的 nanobot 是來自學術研究實驗室的 ~4,000 行 Python OpenClaw 替代方案。Obot AI 的 nanobot 是基於 Go 的 MCP 代理平台,由 Rancher Labs 團隊獲得 3,500 萬美元種子輪資金。本頁比較 OpenLegion 與 Python OpenClaw 替代版本。

### nanobot 的重大 WhatsApp 橋接器弱點是什麼?

nanobot 的 WhatsApp 橋接器含有重大弱點(CVSS 10.0),WebSocket 伺服器繫結至 0.0.0.0:3001,無任何驗證。任何網路鄰近攻擊者可連接並劫持活躍的 WhatsApp 會話。該弱點迅速被修補,但證明了部署不具架構性網路隔離的代理框架的風險。

### 我能從 nanobot 遷移到 OpenLegion 嗎?

nanobot 的 JSON 設定與代理設置會被重構為艦隊模型協調,具明確的工具授予、預算上限與每代理 ACL。LLM 供應商設定可直接轉移,因兩者皆使用相容 LiteLLM 的供應商設定。請參閱我們的 [AI 代理編排](/learn/ai-agent-orchestration) 頁面。

---

## 相關比較

| 錨點文字 | 目的地 |
|---|---|
| OpenLegion vs NanoClaw | /comparison/nanoclaw |
| OpenLegion vs PicoClaw | /comparison/picoclaw |
| OpenLegion vs ZeroClaw | /comparison/zeroclaw |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| 2026 AI 代理框架比較 | /learn/ai-agent-frameworks |
| AI 代理安全分析 | /learn/ai-agent-security |
