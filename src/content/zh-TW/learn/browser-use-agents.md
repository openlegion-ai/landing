---
title: "瀏覽器Use智能體 — AI智能體如何控制網路"
description: "瀏覽器Use智能體讓AI能夠自主瀏覽網站、填寫表單並提取資料。了解其運作原理、安全風險以及如何在隔離容器中安全運行。"
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

# 瀏覽器Use智能體：AI智能體如何導航和控制網路

瀏覽器Use智能體是無需人工干預即可自主控制網路瀏覽器的AI系統，能夠導航URL、點擊按鈕、填寫表單、提取內容和處理身份驗證。它們是2026年成長最快的AI智能體工具類別，由browser-use（截至2026年5月GitHub星標96,282顆）等框架驅動。

<!-- SCHEMA: DefinitionBlock -->

> **什麼是瀏覽器Use智能體？**
> 瀏覽器Use智能體是一種AI智能體，它使用DOM遍歷、無障礙功能樹解析、截圖基準和LLM引導的動作選擇，以程式化方式驅動無頭或有頭網路瀏覽器，自主完成基於網路的任務。

## 瀏覽器Use智能體的運作原理

### 感知：DOM、無障礙功能樹和截圖基準

瀏覽器智能體在採取行動前需要了解當前頁面狀態。常用三種感知策略。

**DOM提取**解析頁面的原始HTML結構。速度快、token效率高，但在畫布渲染內容和複雜SPA上會失敗。

**無障礙功能樹**讀取瀏覽器的內建無障礙功能層，提供頁面的結構化語義視圖。這是browser-use使用的主要感知方法。

**截圖基準**捕獲頁面的可視截圖並傳遞給具有視覺能力的LLM。處理DOM和無障礙功能樹不可靠的頁面，但每步token成本顯著更高。

### 動作：點擊、輸入、導航和表單提交

瀏覽器智能體的動作空間廣泛：導航到URL、點擊元素、輸入文字、按鍵、滾動、選擇下拉選項、上傳檔案或切換瀏覽器分頁。每個動作都會改變頁面狀態。

## browser-use函式庫

### 不到7個月獲得96,282顆星

browser-use（GitHub：browser-use/browser-use）於2024年10月31日發布，截至2026年5月已達96,282顆星和10,802個fork。該函式庫抽象了Playwright會話管理、無障礙功能樹提取和動作序列化。

### Playwright後端：browser-use如何控制Chromium

browser-use封裝了Microsoft的Playwright自動化函式庫，添加了智能體層：提取無障礙功能樹，轉換為token高效格式，將LLM動作決策翻譯為Playwright命令。

### LLM整合：GPT-4o、Claude、Gemini作為推理層

browser-use在推理層與LLM無關，支援OpenAI、Anthropic、Google以及任何OpenAI相容API端點。

## OpenLegion的觀點：瀏覽器智能體是風險最高的工具

瀏覽器智能體是AI智能體領域風險最高的工具類別。能夠點擊、填寫表單和跟隨重新導向的瀏覽器智能體與擁有完整網際網路存取權限的人類具有相同的攻擊面。

### 150秒憑證盜竊示範

2025年公開記錄的研究表明，透過網頁中嵌入的隱藏指令，瀏覽器智能體可在150秒內被操縱盜取使用者憑證。防禦措施是架構性的：如果憑證不存在於智能體的上下文或程序記憶體中，注入攻擊就無法提取它。OpenLegion的Vault代理確保會話憑證在網路層注入，從不出現在智能體的上下文視窗中。

### OWASP LLM08過度授權和瀏覽器權限

OWASP LLM十大風險2025將過度授權（LLM08）列為頂級風險類別。瀏覽器智能體是典型風險：擁有導航、讀取、填寫表單和點擊按鈕權限的智能體可以進行購買、傳送訊息、刪除帳戶和洩露資料。

### OpenLegion如何沙箱化瀏覽器智能體（Camoufox + Zone 1）

OpenLegion在每個智能體的Zone 1 Docker容器內，以連接埠:8500運行每個智能體獨立的Camoufox瀏覽器執行個體。四個特性：無共享會話狀態、指紋抗性、Vault代理憑證、透過Mesh Host的網路路由。

## 瀏覽器智能體架構模式

### 無頭與有頭

**無頭模式**速度更快，在伺服器環境中運行，但可被機器人保護系統偵測到。Camoufox以無頭模式運行，但修補了無頭偵測腳本針對的JavaScript API。

### CAPTCHA處理

三種方法：行為瀏覽器（指紋抗性）、求解服務（每1,000次$1-3）、人工回路後備。OpenLegion透過儀表板支援人工回路CAPTCHA移交。

### 憑證注入：Vault代理vs.硬編碼Cookie

**最差**：憑證直接寫入智能體指令。**差**：環境變數（可透過`os.environ`存取）。**正確**：在網路層透過Vault代理注入。

## 瀏覽器Use智能體：架構比較

| **維度** | **OpenLegion** | **browser-use** | **Raw Playwright** | **Stagehand** |
|---|---|---|---|---|
| **執行後端** | Camoufox（Firefox，抗指紋） | Playwright（Chromium） | Playwright | 雲端Chromium |
| **會話隔離** | 每智能體容器 | 共享程序 | 取決於實作 | 雲管理 |
| **憑證處理** | Vault代理注入 | 透過上下文視窗 | 手動實作 | 託管 |
| **CAPTCHA支援** | Camoufox指紋+人工回路 | 無內建 | 無內建 | 求解服務 |
| **容器沙箱** | Zone 1 Docker，非root | 無 | 無 | 雲沙箱 |
| **GitHub星標** | — | 96,282（2026年5月） | N/A | ~9,000 |
| **授權** | BSL 1.1 | MIT | Apache 2.0 | MIT |

## 何時使用瀏覽器智能體（以及何時不使用）

**合法用例**：網路研究和資料提取、自有服務的表單自動化、監控和測試。**需要額外控制的用例**：已驗證會話、金融網站。**沒有嚴格沙箱化應避免的用例**：不受信任的使用者提供URL。

## 在OpenLegion上開始使用安全瀏覽器智能體

**在隔離容器中使用Vault代理憑證和每智能體網路控制運行瀏覽器智能體。**
[開始使用](https://app.openlegion.ai) | [閱讀文件](https://docs.openlegion.ai) | [檢視平台](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## 常見問題

### 什麼是瀏覽器Use智能體？

瀏覽器Use智能體是透過DOM遍歷、無障礙功能樹解析和LLM引導的動作選擇，自主控制網路瀏覽器的AI系統。browser-use函式庫（GitHub星標96,282，MIT授權，2024年10月發布）是採用最廣泛的開源實作。

### browser-use函式庫如何運作？

browser-use封裝Microsoft的Playwright，為LLM提供瀏覽器無障礙功能樹的結構化視圖，然後將LLM動作決策轉換為Playwright命令。支援GPT-4o、Claude、Gemini和相容LLM，MIT授權，約20行Python即可實作工作智能體。

### 瀏覽器Use智能體有哪些安全風險？

三個主要風險：透過網路內容的提示注入（2025年示範顯示150秒內憑證盜竊）、憑證洩露（如果會話Cookie在智能體程序記憶體中）、過度授權（OWASP LLM08:2025）。零點擊連結預覽洩露也已被證實。

### 如何安全運行瀏覽器智能體？

需要四個控制：容器隔離、Vault代理憑證、網路出口控制、每智能體預算限制。OpenLegion的Camoufox支援的瀏覽器服務預設在Zone 1 Docker容器中實作全部四個。

### 什麼是Camoufox？OpenLegion為什麼使用它？

Camoufox是一款基於Firefox的無頭瀏覽器，修補JavaScript API以回報真實的硬體設定檔而非無頭簽名。OpenLegion在每個Zone 1 Docker容器的連接埠:8500上為每個智能體運行一個Camoufox執行個體。

### AI智能體中browser-use和Playwright有什麼區別？

Playwright是沒有AI智能體概念的低階瀏覽器自動化函式庫。browser-use增加了智能體層：將瀏覽器狀態轉換為LLM可讀格式，將LLM動作翻譯為Playwright命令，處理跨頁面的多步驟任務分解。

### 瀏覽器Use智能體能處理登入和已驗證會話嗎？

可以，但已驗證會話處理是風險最高的操作之一。OpenLegion透過Vault代理在網路層注入會話憑證。

### 瀏覽器智能體如何處理CAPTCHA？

三種方法：行為瀏覽器（指紋抗性）、求解服務（每1,000次$1-3，延遲10-60秒）、人工回路後備。OpenLegion透過儀表板支援人工回路CAPTCHA移交。
