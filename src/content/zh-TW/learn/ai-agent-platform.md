---
title: AI 代理平台 — 部署安全代理
description: >-
 OpenLegion 是具備容器隔離、憑證金庫與預算控制的代管 AI 代理平台。
 自帶 LLM API 金鑰。
slug: /learn/ai-agent-platform
primary_keyword: ai 代理平台
secondary_keywords:
 - managed ai agent platform
 - self-hosted agent deployment
 - ai agent cost control
 - ai agent credential security
 - production ai agent infrastructure
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-security
 - /learn/ai-agent-frameworks
 - /comparison
---

# 為生產而生的 AI 代理平台

多數團隊從框架開始。他們串起 LangGraph 節點或 CrewAI crews,做出能跑的 Demo,然後撞牆:誰管容器?API 金鑰放哪?要怎麼阻止流氓代理在一夜之間燒掉 $500 token?

**AI 代理平台** 在你寫下第一個代理前就回答這些問題。OpenLegion 是一個代管的 AI 代理平台,內建容器隔離、金庫代理憑證、每代理預算控制與艦隊模型協調(黑板 + 發布訂閱 + 交棒)— 全部預設啟用。自帶 LLM API 金鑰。模型用量零加價。

<!-- SCHEMA: DefinitionBlock -->

> **什麼是 AI 代理平台?**
> AI 代理平台是用於在生產環境部署、編排與治理自主 AI 代理的代管基礎設施。與原始框架不同,平台處理隔離、憑證管理、成本控制與可觀測性,讓團隊無需從零打造 DevOps 就能交付代理。

## 重點摘要

- **平台,不是框架** — OpenLegion 管理容器、憑證、預算與網路。你管理代理邏輯。
- **金庫代理憑證** — 代理透過金庫代理執行 API 呼叫。它們永不見原始金鑰。
- **每代理容器隔離** — 每個代理在自己的 Docker 容器中執行,具可配置資源上限(預設 384MB RAM / 0.15 CPU)、非 root 執行,且無共享檔案系統。
- **每代理預算強制執行** — 設定每日與每月 token 上限,具自動硬性截止。沒有意外帳單。
- **自帶 API 金鑰** — 透過 LiteLLM 連接任何 LLM 供應商(支援 100+)。以供應商公開費率直接付款。
- **可稽核艦隊模型協調** — 任務路由採艦隊模型協調(黑板 + 發布訂閱 + 交棒)。沒有「CEO 代理」做不透明決策。
- **MCP 相容可擴展性** — 連接任何 MCP 工具伺服器(資料庫、檔案系統、API),搭配 50+ 內建技能。由代理自動探索。
- **持久化代理記憶** — 代理跨會話記憶,具向量搜尋、工作區檔案與錯誤學習。脈絡自動管理。

## 代管 vs 自我託管:何時各自合適

AI 代理框架與 AI 代理平台的區別在部署時最重要。框架給你基礎元件 — 代理定義、工具整合、對話模式。平台給你生產層:代理在哪裡執行、如何存取憑證、什麼能阻止它們失控。

**自我託管框架**(LangGraph、CrewAI、AutoGen)給你最大控制。你擁有基礎設施。你配置容器。你打造憑證管線。這在你的團隊有專責 DevOps 量能,以及代理需要深度整合既有基礎設施時可行。

**代管 AI 代理平台** 處理營運層,讓團隊聚焦於代理邏輯。OpenLegion 就在這 — 但有一個關鍵差異:它採 BSL 1.1 原始碼可取得授權。你獲得平台級營運(隔離、金庫、預算控制),且基礎設施面無廠商鎖定。

問題不在於哪個「比較好」,而在於團隊應該把工程小時花在代理安全基礎設施,還是代理本身。

### 何時自我託管合適

- 你有嚴格的資料居住地需求,排除任何代管服務
- 你的代理需要與既有 on-prem 基礎設施深度整合
- 你的團隊已運作 Kubernetes 叢集,具成熟 DevOps 實務
- 你需要在代管平台未公開的層級客製化執行環境

### 何時代管 AI 代理平台合適

- 你需要在數天內、而非數月,讓代理進生產
- 你的團隊 1-5 人,無法投入專責基礎設施人力
- 你需要 [AI 代理安全](/learn/ai-agent-security) 保證,但不想自己打造
- 你想要成本控制與請求追蹤,且不必手動檢測一切

## 自帶 API 金鑰模式 — 為何重要

多數代管 AI 平台按 token 收費,或對模型用量抽成。這造成兩個問題:成本不透明與供應商鎖定。

OpenLegion 採不同做法。你自帶任何供應商的 LLM API 金鑰 — OpenAI、Anthropic、Google、Mistral,或透過 LiteLLM 支援的 100 多家供應商。你的 token 以公開費率直接流向供應商。OpenLegion 收取平台與編排費用,不收取模型存取費用。

這在三方面很重要:

**成本透明。** 你能精確看到每個代理在每個供應商上花了多少。無隱藏加價。無模糊真實成本的「平台 token」。

**供應商彈性。** 每代理可換模型。複雜推理跑 GPT-4o、長上下文任務跑 Claude、大量分類跑本地 Llama 模型 — 全部在同一專案中,從同一儀表板管理。

**無鎖定。** 若你離開 OpenLegion,你的 API 金鑰與模型配置一起帶走。沒有需要遷移的專有模型層。

## 適合誰

### 打造代理產品的獨立開發者

你正在交付代理驅動產品,並需要從第一天就安全。OpenLegion 給你生產基礎設施 — 容器隔離、憑證金庫、成本控制 — 無需聘請 DevOps 團隊。從內建團隊範本(Dev Team、Sales Pipeline、Content Studio)開始,並客製化下去。

### 快速交付的新創團隊

你的團隊 2-10 位工程師。你需要這個 sprint、而非下一季,讓代理進生產。安裝是三道指令:`git clone`、`./install.sh`、`openlegion start`。引導式設定精靈會設定你的 API 金鑰、挑選團隊範本,並在三分鐘內部署你的第一支代理艦隊。

### 企業安全團隊

你需要請求追蹤與工作流程可觀測性、能在代理被入侵後仍存活的憑證隔離,以及防止成本失控的預算控制。OpenLegion 的架構為要求縱深防禦的環境而設計。可稽核艦隊模型協調意味著每個工作流程步驟都明確且可追蹤 — 控制平面沒有不透明的 LLM 決策。完整威脅模型請參閱我們的 [AI 代理安全](/learn/ai-agent-security) 頁面。

## 生產就緒度:OpenLegion 處理 vs DIY

| 能力 | DIY(僅框架) | OpenLegion |
|---|---|---|
| **代理執行時** | 你配置 Docker、管理映像、處理網路 | 每個代理自動佈建於隔離容器(預設 384MB RAM、0.15 CPU、非 root、no-new-privileges) |
| **憑證管理** | 環境變數或自訂金庫整合 | 金庫代理含盲注入 — 代理永不見原始金鑰 |
| **成本控制** | 手動追蹤、無硬性上限 | 每代理每日 / 每月預算,自動截止 |
| **編排** | 自寫路由邏輯或使用 LLM 式路由 | 艦隊模型協調(黑板 + 發布訂閱 + 交棒)— 可稽核 |
| **可觀測性** | 整合 LangSmith、Datadog 或自訂日誌 | 內建儀表板,具即時串流、成本圖表、請求追蹤 |
| **多通路部署** | 為每個通路打造整合 | CLI、Telegram、Discord、Slack、WhatsApp — 外加用於外部整合的 webhook 端點 |
| **瀏覽器自動化** | 配置 Playwright/Puppeteer、管理 Chrome 實例 | 每代理的 Camoufox(隱蹤 Firefox)在共享瀏覽器服務容器中,具 KasmVNC(連接埠 6100..6163)、CDP 控制與自動恢復 |
| **工具可擴展性** | 打造自訂整合或使用 LangChain 工具 | MCP 相容 — 連接任何 MCP 伺服器 + 50+ 內建技能,自動探索 |
| **代理記憶** | 打造自訂 RAG 或狀態管理 | 每代理持久化向量記憶,具自動脈絡管理 |
| **模型容錯切換** | 每供應商自訂重試邏輯 | 透過 LiteLLM 跨供應商可配置容錯鏈 |

總結:若你正在評估 [AI 代理框架](/learn/ai-agent-frameworks) 並發現自己在建構的基礎設施比代理邏輯還多,你正在用框架工具解平台問題。OpenLegion 處理平台層,讓你能聚焦於代理實際做什麼。

## MCP 相容工具可擴展性

OpenLegion 支援 Model Context Protocol (MCP) 以連接外部工具。任何 MCP 伺服器 — 資料庫、檔案系統、API、內部服務 — 都可透過設定加入,並由代理自動探索。這與涵蓋瀏覽器自動化、檔案操作、HTTP 請求、網頁搜尋、記憶管理、程式碼執行與網狀通訊的 50+ 內建技能並存。

MCP 整合意味著代理不限於內建能力。連接 Postgres 伺服器、GitHub 整合或自訂內部 API — 代理自動探索可用工具,並在權限邊界內使用。

## 持久化代理記憶

OpenLegion 中的代理使用向量搜尋、工作區檔案與錯誤學習,跨會話維持記憶。當代理遇到問題並解決時,解法會被儲存並於未來會話中召回 — 降低重複失敗並隨時間提升執行品質。

記憶以代理為範圍,並儲存於每個代理容器內隔離的 SQLite + 向量資料庫中。自動脈絡管理藉由僅呈現與當前任務相關的記憶來維持 token 用量效率,而非載入整個對話歷史。

## 架構:四區信任模型

OpenLegion 將每個部署分為四個信任區,加上一個操作員或內部層:

**Zone 0 — 不可信外部輸入。** 任何來自使用者或第三方的輸入:CLI、Telegram、Discord、Slack、WhatsApp 與 webhook 端點。所有輸入在抵達網狀架構前皆經過提示注入防護驗證與清理。

**Zone 1 — 沙箱化代理容器(不可信)。** 每個代理作為自己的 FastAPI 實例,於專屬 Docker 容器中執行,具自己的 `/data` 容量、記憶資料庫與嚴格資源上限。即便代理完全被入侵,也無法存取你的 API 金鑰、其他代理的資料或主機系統。

**Zone 2 — Mesh Host(可信)。** 執行 Blackboard(透過 SQLite + WAL 的共享狀態)、PubSub 訊息路由器、Credential Vault(處理盲注入的代理)、ACL 矩陣、Container Manager、Cost Tracker 與 Browser Service(每代理 Camoufox 於 :8500)的 FastAPI 伺服器。這是大腦 — 也是唯一接觸你 API 金鑰的元件。

**Zone 2.5 — 操作員或內部。** 保留給 Operator agent 或內部網狀工具的控制平面操作 — 艦隊管理、代理編輯、權限授予(Operator 無法授予 `can_spawn` 或 `can_use_wallet`)。

**Zone 3 — 僅 loopback 內部。** 最受限階層:同時需要 `x-mesh-internal: 1` 標頭與 loopback 來源 IP 的端點。僅用於網狀內部協調呼叫。

這個架構意味著 [AI 代理編排](/learn/ai-agent-orchestration) 與安全不是分開的關切 — 它們是同一個系統。

## 開始使用

```bash
git clone https://github.com/openlegion-ai/openlegion.git
cd openlegion && ./install.sh
openlegion start # 首次執行時進行內嵌式設定,接著代理會部署於隔離容器中
```

首次安裝需 2-3 分鐘。需要 Python 3.10+ 與 Docker。

## CTA

**準備部署安全代理?**
[立即開始](https://app.openlegion.ai) | [閱讀文件](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## 常見問題

### 什麼是 AI 代理平台?

AI 代理平台是處理執行自主 AI 代理營運關切的代管基礎設施:容器隔離、憑證管理、成本控制、編排與可觀測性。它位於 LangGraph 或 CrewAI 等框架之上,提供框架留給你處理的生產層。

### 生產環境最佳 AI 代理平台是什麼?

生產環境最佳 AI 代理平台取決於你的安全與營運需求。若你需要內建容器隔離、金庫代理憑證,以及每代理預算控制,且不想打造自訂基礎設施,OpenLegion 即裝即用提供這些。對於深度投入微軟生態圈的團隊,Azure AI Agent Service 值得評估。若想要最大彈性、願意投入更多 DIY,自我託管 LangGraph 搭配 LangSmith 提供強大可觀測性。

### 什麼是企業 AI 代理平台?

企業 AI 代理平台在基本代理編排之上加上治理、合規與安全控制。關鍵需求包括:憑證隔離(代理永不見原始 API 金鑰)、工作流程可追蹤性、防止成本失控的預算強制執行、角色式存取控制,以及支援資料居住地需求的部署選項。OpenLegion 的架構為要求這些控制的環境而設計。

### 我能用自己的 API 金鑰託管 AI 代理嗎?

可以。OpenLegion 採 BYO(自帶)API 金鑰模式。你連接來自任何 LLM 供應商的自有金鑰 — OpenAI、Anthropic、Google、Mistral,以及透過 LiteLLM 的其他 100 多家。你的 token 以公開費率直接流向供應商。自帶 LLM API 金鑰。模型用量零加價。

### 代管 vs 自我託管 AI 代理:差別是什麼?

代管 AI 代理平台為你處理容器佈建、憑證金庫、成本控制與可觀測性。自我託管意味著你在自有基礎設施上部署框架(LangGraph、CrewAI、AutoGen),並自行打造這些營運層。代管較快達到生產,且需較少 DevOps 投資。自我託管給予最大基礎設施控制。OpenLegion 提供混合:原始碼可取得程式碼(BSL 1.1)可自我託管,且內建代管平台能力。

### OpenLegion 與其他 AI 代理平台相比如何?

OpenLegion 以安全優先架構區隔。根據撰寫當下的公開文件,沒有其他主要 [AI 代理框架](/learn/ai-agent-frameworks) 提供內建的金庫代理憑證、每代理強制容器隔離,或原生每代理預算強制執行。跨 OpenClaw、LangGraph、CrewAI、AutoGen 與 Semantic Kernel 的詳細比較,請參閱我們的 [框架比較](/learn/ai-agent-frameworks)。

### OpenLegion 使用什麼授權?

OpenLegion 採 BSL 1.1 原始碼可取得授權,並可在 [GitHub](https://github.com/openlegion-ai/openlegion) 取得。本專案也為想要代管基礎設施但不想自我託管的團隊提供託管平台。

### 我能多快部署第一個代理?

三道指令、不到三分鐘。`git clone`、`./install.sh`、`openlegion start`。引導式設定精靈會設定你的 API 金鑰、選擇團隊範本,並自動佈建你的第一支隔離代理艦隊。

---

## 應包含的內部連結

| 錨點文字 | 目的地 |
|---|---|
| AI 代理平台 | /learn/ai-agent-platform |
| AI 代理編排 | /learn/ai-agent-orchestration |
| AI 代理框架比較 | /learn/ai-agent-frameworks |
| AI 代理安全 | /learn/ai-agent-security |
| OpenClaw 替代方案 | /openclaw-alternative |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| 文件 | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
