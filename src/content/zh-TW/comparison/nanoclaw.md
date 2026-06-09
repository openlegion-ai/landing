---
title: OpenLegion vs NanoClaw — 詳細比較(2026)
description: >-
 OpenLegion vs NanoClaw:容器隔離的 AI 代理並列比較。憑證管理、多代理
 編排、供應商支援與生產安全的對照。
slug: /comparison/nanoclaw
primary_keyword: openlegion vs nanoclaw
secondary_keywords:
 - nanoclaw alternative
 - nanoclaw security
 - container ai agent
 - claude agent sdk
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /comparison/zeroclaw
 - /comparison/openclaw
 - /comparison/picoclaw
 - /comparison/nanobot
---

# OpenLegion vs NanoClaw:兩種容器優先哲學,不同深度

NanoClaw 是 OpenClaw 替代浪潮中的安全寵兒。2026 年 1 月底以 Claude Code 創建,NanoClaw 是一個 ~500 行的 TypeScript 核心,讓每個代理在自己的 OS 層級 Linux 容器中執行。它登上 Hacker News 首頁、獲得 VentureBeat 與 The Register 報導,並被開發者讚譽為「可管理、可稽核、有彈性」。具約 7,200 個 GitHub 星,它是輕量 OpenClaw 替代方案中最聚焦於安全的。

OpenLegion 是一個安全優先的 [AI 代理框架](/learn/ai-agent-platform),具強制 Docker 容器隔離、金庫代理憑證管理、每代理預算強制執行,以及艦隊模型協調(黑板 + 發布訂閱 + 交棒)。

NanoClaw 與 OpenLegion 是本領域中 *兩個都* 以 OS 層級容器隔離作為主要安全邊界的框架。問題在於那個基礎之上還有什麼。

<!-- SCHEMA: DefinitionBlock -->

> **OpenLegion 與 NanoClaw 的差別是什麼?**
> NanoClaw 是一個極精簡(核心 ~500 行)的 TypeScript AI 代理助理,建構於 Anthropic 的 Claude Agent SDK 之上。每個代理在隔離的 Linux 容器中執行,具敏感檔案封鎖與基於 stdin 的機密傳遞。OpenLegion 是一個基於 Python 的安全優先框架,在 Docker 容器隔離之上新增金庫代理憑證管理、每代理預算強制執行、艦隊模型協調(黑板 + 發布訂閱 + 交棒)、100+ LLM 供應商,以及多代理艦隊編排。NanoClaw 因哲學而極簡;OpenLegion 因設計而全面。

## 重點摘要

| 面向 | OpenLegion | NanoClaw |
|---|---|---|
| **主要焦點** | 生產安全基礎設施 | 激進的極簡主義 + 容器隔離 |
| **語言** | Python | TypeScript(核心 ~500 行) |
| **總程式碼庫** | ~77,000 行 | ~3,900 行(~15 個檔案) |
| **代理隔離** | 每代理 Docker 容器 | 每代理 Linux 容器(Apple Container/Docker) |
| **憑證安全** | 金庫代理 — 代理永不見金鑰 | Stdin JSON 注入;敏感檔案封鎖清單 |
| **預算控制** | 每代理每日 / 每月硬性截止 | 無內建 |
| **編排** | 艦隊模型協調(黑板 + 發布訂閱 + 交棒) | 對話驅動;無工作流程引擎 |
| **LLM 供應商** | 透過 LiteLLM 支援 100+ | 僅 Claude(Anthropic Agent SDK) |
| **訊息通路** | 5 | 4(WhatsApp、Telegram、Discord、Slack) |
| **多代理** | 艦隊範本,具每代理 ACL | Agent Swarms(Claude Code 團隊) |
| **客製化模型** | 設定 + 外掛 | 「Skills over Features」— AI 重寫原始碼 |
| **GitHub 星數** | ~59 | ~7,200 |
| **授權** | PolyForm Perimeter License 1.0.1 | MIT |
| **已知 CVE** | 0 | 0 |

## 何時選擇 NanoClaw

**激進的可稽核性是你最高優先。** NanoClaw 的 ~500 行核心可在八分鐘內讀完。每一行與安全相關的程式碼都對單一審查者可見。代理空間中沒有框架比這更可稽核。

**你只用 Claude 建構。** NanoClaw 直接建構於 Anthropic 的 Claude Agent SDK 之上。若你的堆疊以 Claude 為先,並想要與 Claude Code 的 agent-teams 能力進行最緊密的整合,NanoClaw 為此而生。

**你想要 AI 原生客製化。** NanoClaw 的「Skills over Features」哲學意味著新增通路或能力是讓 Claude Code 字面上重寫 NanoClaw 的原始碼。無外掛系統、無設定層 — AI 修改程式碼本身。這非常規,但在設計上消除功能膨脹。

**你需要 WhatsApp 作為一級通路。** NanoClaw 透過 Baileys 函式庫的 WhatsApp 整合是內建且經良好測試的,具 QR code 配對與每群組記憶檔。

**容器隔離很重要,但簡潔更重要。** NanoClaw 給你 OS 層級隔離,且不需要你學習 Docker 編排、艦隊模型協調或多代理設定。每代理一個容器,透過對話設定。

## 何時選擇 OpenLegion

**你需要超越檔案封鎖的憑證隔離。** NanoClaw 封鎖對敏感檔案(.ssh、.gnupg、.aws、.azure、.gcloud)的存取,並透過 stdin JSON 傳遞機密。然而,Anthropic 憑證被掛載以便 Claude Code 在容器內驗證 — 意味著代理 *可以* 透過 Bash 或檔案操作發現這些憑證。OpenLegion 的金庫代理在架構上不同:代理透過代理發出 API 呼叫,代理在網路層注入憑證。代理環境中不存在可被發現的憑證。

**你需要超過一個 LLM 供應商。** NanoClaw 因設計而僅支援 Claude。若你的部署需要 GPT-4、Gemini、Llama、Mistral 或任何非 Anthropic 模型,NanoClaw 無法滿足。OpenLegion 透過 LiteLLM 支援 100+ 供應商,具自帶 API 金鑰與零加價。

**你需要每代理預算強制執行。** NanoClaw 無機制能限制每代理 API 支出。在 Anthropic 按 token 計價的 Claude API 呼叫下,不受控的代理 swarm 可累積可觀成本。OpenLegion 強制執行每代理每日與每月上限,具自動硬性截止。

**你需要可稽核的多代理艦隊協調。** NanoClaw 的 Agent Swarm 是對話驅動的 — Claude Code 在對話中協調專業代理。這有彈性但非確定性。OpenLegion 的艦隊模型協調定義每代理明確的交棒記錄、工具存取與相依性。協調在執行前即可稽核。

**你需要擴展到個人使用以外。** NanoClaw 被設計為個人 AI 助理。其架構 — 單一程序 Node.js、AI 重寫原始碼、無設定管理 — 不會自然擴展為具角色式存取、合規需求或多租戶隔離的艦隊部署。

## 安全模型比較

### 機密儲存位置

**NanoClaw** 透過 stdin JSON 將機密傳遞給代理 — 它們永不載入 process.env。敏感檔案路徑(.ssh、.gnupg、.aws 等)透過明確封鎖清單封鎖。容器以非 root 執行,具唯讀專案掛載。**已知限制:** Anthropic 憑證被掛載以便 Claude Code 驗證,意味著代理可透過容器內的 Bash 或檔案操作發現這些憑證。

**OpenLegion** 將憑證儲存於代理無法存取的金庫中。API 呼叫透過金庫代理路由,代理在網路層注入憑證。代理容器內不存在憑證檔、環境變數或掛載機密。即便代理達成任意程式碼執行,也無憑證可找。

### 隔離模型

**兩者都使用 OS 層級容器隔離。** NanoClaw 使用 Apple Container(macOS)或 Docker(Linux),每代理具獨立的檔案系統、IPC namespace 與程序空間。掛載允許清單控制代理可存取哪些目錄。OpenLegion 使用具非 root 執行、無 Docker socket、no-new-privileges,以及每容器資源上限(CPU、記憶體、網路)的 Docker 容器。

隔離邊界相當。差別在容器 *內部* 發生的事:NanoClaw 給予代理廣泛能力(shell 存取、檔案讀寫、網頁瀏覽、Chromium),具檔案層級封鎖清單。OpenLegion 透過 YAML 定義的工具存取與每代理 ACL 約束代理。

### 預算控制

**NanoClaw** 無內建預算強制執行。Claude API 用量按 Anthropic 標準的每 token 費率計費,無每代理上限。

**OpenLegion** 強制執行每代理每日與每月支出上限,具自動硬性截止。

## NanoClaw 的生態圈:它做得最好的部分

### 「Skills over Features」哲學

NanoClaw 最激進的設計選擇是客製化透過程式碼重寫進行,而非設定。想新增 LINE 支援?要求 Claude Code 新增 — 它會直接修改 NanoClaw 的原始檔。想要新工具?Claude Code 撰寫並整合。這完全消除了傳統的外掛架構。結果是每個 NanoClaw 部署都是為其使用者打造的獨特分叉,這既是優點(無膨脹)也是限制(無共享外掛生態圈)。

### Agent Swarms

NanoClaw 自稱是首個支援 Agent Swarms 的個人 AI 助理 — 在同一對話中,專業代理團隊合作完成複雜任務。swarm 中每個代理具隔離的記憶脈絡。這利用 Claude Code 原生的 agent-teams 能力,代表對複雜個人工作流程的真實能力。

### 八分鐘稽核

在 ~500 行核心程式碼下,NanoClaw 可比任何競爭框架更快稽核。對於對程式碼庫信任至關重要、且正式安全稽核不切實際的個別開發者或小團隊,此級別的透明度具獨特價值。

### 常見的生產關切

**單一供應商鎖定。** 僅 Claude 意味著若 Anthropic 中斷則無後備、無法為簡單任務使用更便宜的模型,且完全相依於 Anthropic 的定價決策。

**憑證外洩向量。** 掛載的 Anthropic 憑證代表容器隔離模型中已知、有記錄的缺口。容器內具 shell 存取的代理可讀取這些憑證。

**無工作流程引擎。** 代理協調是對話驅動且非確定性的。無法定義、版本控制或事前稽核多步驟工作流程。

**擴展限制。** 單一程序 Node.js、AI 重寫原始碼,以及缺乏設定管理,讓艦隊部署不切實際。

### OpenLegion 的不同涵蓋方式

OpenLegion 在相同的容器隔離基礎上建構生產基礎設施:金庫代理消除憑證掛載問題、艦隊模型協調提供可稽核的多代理艦隊協調、每代理預算防止成本超支、100+ 供應商支援消除廠商鎖定,以及每代理 ACL 啟用角色式工具存取。

## 託管 vs 自我託管的取捨

**NanoClaw** 需要 Node.js 與 Apple Container(macOS)或 Docker(Linux)。設置是互動式的 — 你透過 Claude Code 對話設定,而非編輯設定檔。自我託管是唯一選項;無託管服務。

**OpenLegion** 需要 Python、SQLite 與 Docker。代管平台(即將推出)將為每使用者提供 VPS 實例。自我託管部署使用標準 Docker 工具。

## 適合誰

**NanoClaw** 適合想要具備容器隔離、WhatsApp/Telegram 連線與激進程式碼簡潔性的個人 AI 助理的個別開發者。理想使用者是想要自己的 Claw 風格代理、且比 OpenClaw 安全更好的 Claude 進階使用者 — 並且能接受改變透過對話而非設定發生的 AI 優先客製化模型。

**OpenLegion** 適合在生產環境中部署多代理系統的團隊。理想使用者管理處理敏感憑證的代理艦隊、需要每代理支出控制,並要求可稽核的工作流程定義以利合規。

## 誠實的取捨

NanoClaw 與 OpenLegion 是本比較中 *兩個都* 使用 OS 層級容器隔離的框架。NanoClaw 以 ~500 行程式碼達成這點 — 是了不起的工程成就,證明容器隔離不需要框架複雜度。

OpenLegion 提問:在容器隔離之外,生產部署還需要什麼?答案是憑證分離(金庫代理)、成本控制(每代理預算)、工作流程確定性(艦隊模型協調)、供應商獨立(100+ 模型),以及艦隊編排(多代理 ACL)。這些是區隔個人助理與生產平台的層次。

若你想要 500 行程式碼內的容器隔離個人 Claude 代理,選 NanoClaw。若你需要容器隔離之上的完整生產堆疊,選 OpenLegion。

完整版圖請參閱我們的 [AI 代理框架比較](/learn/ai-agent-frameworks)。

## CTA

**需要容器隔離之上的完整生產堆疊?**
[立即開始](https://app.openlegion.ai) | [閱讀文件](https://docs.openlegion.ai) | [查看所有比較](/comparison)

---

<!-- SCHEMA: FAQPage -->

## 常見問題

### 什麼是 NanoClaw?

NanoClaw 是一個極精簡(核心 ~500 行)的 TypeScript AI 代理助理,建構於 Anthropic 的 Claude Agent SDK 之上。它在隔離的 Linux 容器中執行每個代理,具 WhatsApp、Telegram、Discord 與 Slack 連線。具約 7,200 個 GitHub 星,並在開發者社群廣受讚譽。

### OpenLegion vs NanoClaw:差別是什麼?

兩者都使用 OS 層級容器隔離。NanoClaw 是 ~500 行的個人助理,專門建構於 Claude 之上,具 AI 驅動的客製化。OpenLegion 新增金庫代理憑證(代理永不見金鑰)、每代理預算強制執行、艦隊模型協調(黑板 + 發布訂閱 + 交棒)、100+ LLM 供應商,以及多代理艦隊編排。NanoClaw 極簡且個人化;OpenLegion 全面且生產導向。

### OpenLegion 是 NanoClaw 替代方案嗎?

是。兩者都以容器隔離作為安全基礎。OpenLegion 以金庫代理憑證管理、每代理成本控制、可稽核艦隊模型協調,以及對 100+ LLM 供應商的支援擴展這點。超出 NanoClaw 個人助理模型或需要供應商獨立的團隊,會發現 OpenLegion 是自然的下一步。

### OpenLegion 與 NanoClaw 在憑證處理上如何比較?

NanoClaw 透過 stdin JSON 傳遞機密並封鎖敏感檔案存取,但掛載 Anthropic 憑證以便 Claude Code 驗證 — 代理可透過 Bash 發現。OpenLegion 使用金庫代理,代理透過代理發出 API 呼叫,代理注入憑證。代理容器中不以任何形式存在憑證。

### 哪個更適合生產 AI 代理?

NanoClaw 被設計為個人助理,而非生產平台。它缺乏預算強制執行、工作流程確定性、多供應商支援與艦隊管理。OpenLegion 為生產而生,具每代理預算、艦隊模型協調、金庫代理憑證,以及 100+ 供應商支援。

### NanoClaw 支援多個 LLM 供應商嗎?

不。NanoClaw 專門建構於 Anthropic 的 Claude Agent SDK 之上。它僅與 Claude 模型運作。OpenLegion 透過 LiteLLM 支援 100+ 供應商,包括 OpenAI、Anthropic、Google、Meta、Mistral 與本地模型。

### 我能從 NanoClaw 遷移到 OpenLegion 嗎?

NanoClaw 的 AI 重寫原始碼與對話驅動設定需重構為艦隊模型協調,具明確的代理定義、工具存取控制與預算上限。Claude 特定的代理邏輯可轉移,因 OpenLegion 透過 LiteLLM 支援 Anthropic。請參閱我們的 [AI 代理編排](/learn/ai-agent-orchestration) 頁面。

---

## 相關比較

| 錨點文字 | 目的地 |
|---|---|
| OpenLegion vs ZeroClaw | /comparison/zeroclaw |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| OpenLegion vs PicoClaw | /comparison/picoclaw |
| OpenLegion vs nanobot | /comparison/nanobot |
| 2026 AI 代理框架比較 | /learn/ai-agent-frameworks |
| AI 代理安全分析 | /learn/ai-agent-security |
