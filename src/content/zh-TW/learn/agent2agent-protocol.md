---
title: "Agent2Agent協議：A2A安全、架構與MCP比較"
description: "Agent2Agent（A2A）協議讓AI智能體能夠跨框架委派任務。了解架構、安全模型、任務生命週期以及與MCP的比較。"
slug: /learn/agent2agent-protocol
primary_keyword: agent2agent協議
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/model-context-protocol
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/agentic-workflows
  - /learn/ai-agent-frameworks
---

# Agent2Agent協議：架構、安全與MCP比較

Agent2Agent（A2A）是一個開放協議，由Google Cloud於2025年4月發布並捐贈給Linux Foundation，讓基於不同框架和供應商構建的AI智能體能夠透過標準化的HTTP/JSON介面進行通訊、委派任務並交換結果。MCP解決的是工具存取問題（一個LLM呼叫外部API），而A2A解決的是協調問題：一個智能體將完整的子任務委派給具有獨立推理循環、記憶體和工具的專業對等智能體。a2aproject/A2A GitHub儲存庫擁有來自50多個組織的貢獻，包括Salesforce、Atlassian和SAP。

<!-- SCHEMA: DefinitionBlock -->
Agent2Agent（A2A）是一個由Linux Foundation維護的AI智能體互通性開放HTTP/JSON協議，標準化了自主智能體如何在不同框架和供應商之間宣傳能力、委派任務和交換結果。

## Agent2Agent（A2A）協議是什麼？

A2A源於AI智能體生態系統中的一個具體空白：模型到工具的通訊有了標準（MCP，2024年11月推出），但智能體到智能體的通訊卻沒有。當一個編排智能體需要將子任務交給專業對等體時，沒有標準化的線格式用於該委派。

Google Cloud於2025年4月9日宣佈A2A，同時宣佈了超過50個為規範做出貢獻的初始技術合作夥伴組。與許多供應商驅動的標準不同，A2A被捐贈給Linux Foundation進行中立治理。

協議的核心是HTTP/JSON。A2A相容智能體暴露少量端點：智能體卡片（能力清單）、任務提交端點、狀態輪詢端點以及用於長時間執行任務的SSE串流端點。

有關A2A解決的多智能體協調問題的背景，請參閱[多智能體系統架構](/learn/multi-agent-systems)和[AI智能體編排模式](/learn/ai-agent-orchestration)。

## A2A協議架構

A2A定義了三個核心概念：智能體卡片（能力發現）、任務生命週期（有狀態委派追蹤）和傳遞模式（SSE串流和webhook推送）。

### 智能體卡片：能力廣告與列舉風險

智能體卡片是在已知URL（`/.well-known/agent.json`）提供的JSON文件，描述智能體能做什麼。最小智能體卡片包括：

```json
{
  "name": "web-research-agent",
  "description": "使用網路搜尋研究主題並返回結構化摘要",
  "version": "1.0.0",
  "url": "https://agents.example.com/web-research",
  "skills": [
    {
      "id": "research_topic",
      "name": "研究主題",
      "description": "搜尋網路上的主題並返回結構化摘要",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

智能體卡片實現動態能力發現，但存在安全風險：在A2A基本設定檔中，智能體卡片預設不進行身分驗證，將完整技能界面暴露給無需身分驗證的列舉。

生產部署應僅在身分驗證後提供智能體卡片，或將其限制在內部網路段。[AI智能體安全威脅模型](/learn/ai-agent-security)將能力列舉作為偵察攻擊向量。

### 任務生命週期：從提交到完成的五種狀態

A2A定義了五狀態任務生命週期：

1. **submitted** - 任務被遠端智能體接收；尚未開始處理
2. **working** - 遠端智能體正在積極處理任務（可透過SSE串流進度）
3. **input-required** - 遠端智能體在繼續之前需要說明（人機協作閘控）
4. **completed** - 任務完成；結果製品可供檢索
5. **failed** - 任務失敗；任務狀態物件中有錯誤詳情

`input-required`狀態是A2A在長期自主管道中的人機協作檢查點機制。

### 推送與拉取任務傳遞：SSE和webhook

A2A支援兩種任務結果傳遞模式：

**SSE（伺服器發送事件）：** 委派智能體向接收智能體的串流端點打開持久連線。SSE是需要增量進度的長時間執行任務的主要機制。

**webhook推送：** 委派智能體在提交時提供回調URL。在無法維持持久SSE連線的無伺服器環境中更為適用。

## A2A與MCP：不同層次，不同問題

A2A和MCP是互補的，不是競爭關係。它們在智能體堆疊的不同層次運作，解決不同的協調問題。

| **維度** | **MCP** | **A2A** |
|---|---|---|
| **目的** | 工具存取 - 一個LLM呼叫外部API | 智能體協調 - 一個智能體委派給另一個 |
| **通訊** | 在一個推理回合內的同步工具呼叫 | 非同步任務委派；接收智能體有自己的循環 |
| **身分驗證（預設）** | 必要 - MCP伺服器對客戶端進行身分驗證 | 基本設定檔中可選 - 允許匿名 |
| **發現** | MCP伺服器清單（工具列表） | 智能體卡片（JSON：技能+身分驗證要求） |
| **狀態** | 每次工具呼叫無狀態 | 有狀態，5狀態生命週期 |
| **串流** | 核心規範中沒有 | 即時SSE；非同步webhook推送 |
| **主要威脅** | 工具中毒（OWASP LLM07:2025） | 任務載荷注入、智能體卡片列舉 |

### 當智能體需要工具時（MCP）

MCP是在單個推理回合內需要呼叫外部能力的正確選擇。工具沒有自己的推理循環；它執行函數並返回值。

### 當智能體需要另一個智能體時（A2A）

A2A是當任務需要對等智能體的完整推理能力時的正確選擇。接收智能體有自己的模型、記憶體、工具存取和多步推理循環。

### 在同一系統中同時使用MCP和A2A

生產多智能體系統通常同時使用兩者。編排智能體使用A2A委派給專業智能體。每個專家使用MCP進行工具呼叫。

## A2A身分驗證和安全模型

A2A的安全模型有一個關鍵缺口：基本設定檔使身分驗證變為可選。透過A2A任務載荷的提示注入是針對接受來自不可信呼叫者任務的任何A2A部署的已記錄攻擊類別。

A2A系統的攻擊面：

**1. 任務載荷注入：** A2A任務提交中的任務描述和輸入資料是使用者控制的。

**2. 智能體卡片列舉：** 未經身分驗證的智能體卡片暴露完整的技能界面。

**3. 智能體間信任假設：** 不經輸出驗證就信任對等智能體結果的委派智能體容易受到中繼注入攻擊。

**4. 匿名委派：** 沒有強制身分驗證，網路上的任何呼叫者都可以向A2A智能體提交任務。

## OpenLegion的觀點：A2A是線格式，不是安全模型

A2A作為線格式設計得很好。安全模型未達到生產要求。

OpenLegion對智能體間通訊的方法強制執行A2A基本設定檔留為可選的內容：

1. **每次智能體間呼叫都透過憑證保管庫路由。** 沒有匿名委派模式。

2. **在56個網路瓶頸點進行任務載荷消毒。** 用戶控制的內容在到達LLM上下文之前針對unicode攻擊進行消毒。

3. **由編排器驗證的型別化握手契約。** 中繼注入載荷在握手邊界被阻止。

4. **智能體能力清單需要身分驗證才能存取。** 技能界面不對匿名呼叫者暴露。

## 實作A2A：技術演練

### 智能體卡片架構

生產智能體卡片應明確包含身分驗證要求：

```json
{
  "name": "data-analysis-agent",
  "description": "分析結構化資料集並返回帶視覺化的統計摘要",
  "version": "1.2.0",
  "url": "https://agents.internal.example.com/data-analysis",
  "skills": [
    {
      "id": "analyze_dataset",
      "name": "分析資料集",
      "description": "對提供的資料集執行統計分析",
      "inputModes": ["data"],
      "outputModes": ["text", "data", "file"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"],
    "required": true
  }
}
```

### 任務提交和狀態輪詢

任務提交是向`/tasks/send`的POST。狀態輪詢使用`GET /tasks/{task_id}`。以指數退避輪詢（1s、2s、4s、8s，上限30s）。長時間執行任務（>60s）應切換到SSE。

### 使用SSE串流長時間執行任務

對於預計執行時間超過30秒的任務，透過`POST /tasks/sendSubscribe`使用SSE。`"final": true`標誌表示任務完成。使用`Last-Event-ID`標頭實作SSE重連。

<!-- SCHEMA: FAQPage -->
## 常見問題

### Agent2Agent（A2A）協議是什麼？

Agent2Agent（A2A）是AI智能體互通性的開放HTTP/JSON協議，由Google Cloud於2025年4月推出並捐贈給Linux Foundation。它標準化了不同框架上構建的自主智能體如何宣傳能力、委派任務和交換結果。包括Salesforce、Atlassian和SAP在內的50多個組織自2025年4月發布以來為該協議做出了貢獻。

### A2A和MCP有什麼區別？

MCP解決工具存取：單個智能體在單個推理回合內呼叫外部API（無狀態函數呼叫）。A2A解決智能體協調：一個智能體將完整的子任務委派給具有獨立推理循環、記憶體和工具的對等智能體（有狀態非同步委派）。MCP預設需要身分驗證；A2A的基本設定檔使其成為可選。兩個協議是互補的。

### A2A智能體卡片是什麼？

智能體卡片是在`/.well-known/agent.json`提供的JSON文件，描述智能體的能力、接受的輸入/輸出模式和身分驗證要求。在A2A基本設定檔中，預設不經身分驗證提供。生產部署應要求身分驗證才能存取智能體卡片。

### A2A協議安全嗎？

A2A的基本設定檔存在重大安全漏洞。身分驗證預設是可選的。透過A2A任務載荷的提示注入是現實的生產風險。生產A2A部署必須明確實作擴展身分驗證設定檔，在到達LLM之前消毒所有任務載荷內容，並在每個握手邊界驗證輸出。

### A2A任務生命週期是什麼？

A2A定義了五種任務狀態：submitted（已接收，尚未處理）、working（積極處理中，可串流SSE進度）、input-required（遠端智能體在繼續前需要說明 - 人機協作閘控）、completed（結果可供檢索）和failed（任務失敗，有錯誤詳情）。`input-required`狀態是A2A在自主管道中顯示人機協作檢查點的機制。

### 哪些公司支援A2A？

A2A於2025年4月發布，有50多個貢獻組織，包括Salesforce、Atlassian和SAP。Google Cloud主導了初始規範，並將治理移交給Linux Foundation。

### OpenLegion如何實作智能體間通訊？

OpenLegion的網格架構實作了每次呼叫都強制身分驗證的智能體間協調。每個智能體間握手都透過憑證保管庫路由。任務載荷內容在56個網路瓶頸點針對unicode攻擊進行消毒。這些控制在智能體程式碼外部的基礎設施層執行。

## 在每次呼叫都有身分驗證的情況下構建多智能體系統

A2A提供了跨框架和供應商智能體互通性的線格式。安全模型必須在其上構建或由基礎設施層強制執行。

請參閱[AI智能體安全與威脅模型](/learn/ai-agent-security)或[多智能體系統架構](/learn/multi-agent-systems)。

[在OpenLegion上執行每次智能體間呼叫都預設進行身分驗證、記錄和憑證隔離的多智能體系統](https://app.openlegion.ai)
