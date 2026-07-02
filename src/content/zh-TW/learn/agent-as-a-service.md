---
title: "Agent as a Service：定價、租戶隔離與 AaaS 對比自架設"
description: "Agent as a Service（AaaS）：基於消費計費的托管基礎設施 AI 代理。涵蓋 AWS Bedrock Agents、OpenAI Operator、CVE-2024-5184 隔離及 AaaS 與自架設 TCO 比較。"
slug: /learn/agent-as-a-service
primary_keyword: agent as a service
last_updated: "2026-07-02"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-deployment
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-multi-tenancy
  - /learn/credential-management-ai-agents
  - /learn/llm-cost-optimization
---

# Agent as a Service：定價模型、租戶隔離與 AaaS 決策框架

Agent as a Service（AaaS）是一種商業交付模式，AI 代理在供應商的托管基礎設施上運行，處理編排、工具執行、記憶體和憑證管理，按令牌、按操作或按代理小時計費，無需客戶部署自己的執行環境。AaaS 於 2026 年確立為企業採購類別：OpenAI Operator 於 2025 年 1 月推出，Google Agent Space 達到 GA，AWS Bedrock Agents 擴展至企業規模，搜尋量從 2025 年 6 月的 90 次/月增至 2026 年 Q1 的 260-390 次/月，CPC $32.88。

<!-- SCHEMA: DefinitionBlock -->

> **Agent as a Service（AaaS）**是一種商業交付模式，AI 代理在供應商的托管基礎設施上運行，處理編排、工具執行、記憶體和憑證管理，按消費基礎（每輸入令牌、每執行操作或每代理小時）向客戶計費，無需客戶部署和運營自己的代理執行環境。

## Agent as a Service 的含義：三項平台承諾

每個 AaaS 平台都提出三項主張。了解哪些主張得到良好履行、哪些是行銷話術，有助於買家在承諾基礎設施預算前評估供應商。

### 承諾 1：托管基礎設施（無需運營執行環境）

AaaS 將整個代理執行堆疊委託給供應商：編排引擎、工具執行環境、記憶體後端、可觀測性管道、水平擴展和運行時間 SLA。客戶定義代理（系統提示、工具和記憶體設定）並呼叫它。供應商執行它。

這與任何托管服務的取捨相同：RDS 對比自管 Postgres，Lambda 對比自管容器。以放棄可設定性並可能支付溢價為代價，換取不承擔運營負擔。托管基礎設施承諾由 AWS Bedrock Agents、Google Agent Space 和大多數成熟 AaaS 平台良好履行。

當客戶需要平台未公開的執行設定時，承諾就會破裂：自訂工具執行環境、非標準記憶體後端、特定模型版本，或與平台固定編排模型不同的代理循環邏輯。

有關基礎設施層的詳細資訊，請參閱 [AI 代理部署基礎設施和托管選項](/learn/ai-agent-deployment)。

### 承諾 2：消費計費（按令牌、操作或小時付費）

2026 年 AaaS 定價已收斂為三種結構：

**模型成本之上的每令牌編排費用。** 平台將其編排層與底層 LLM 分開收費。AWS Bedrock Agents：編排層每處理一個輸入令牌收取 $0.000025，在標準 LLM 模型費率之上收取。對於 Bedrock 上的 Claude 3.5 Sonnet（$3.00/M 輸入令牌），編排費用增加 $0.025/M 輸入令牌，不足 1% 的額外負擔。但對於較便宜的模型，如 Amazon Titan Text（$0.30/M），編排費用佔模型成本的 8.33% 額外負擔。

**工具整合的每操作費用。** AWS Bedrock Knowledge Base 查詢：$0.0004/次。每次會話進行 50 次 KB 查詢的代理支付 $0.02/會話的 KB 費用。每天 100,000 次 KB 查詢：僅操作費用就高達 $40/天。

**每代理小時訂閱層級。** 一些平台提供層級，每個活躍代理無論令牌消耗多少都計入包含的小時數。此模型為穩定的代理群提供成本可預測性，但對於突發性工作負載可能效率低下。

消費定價將供應商激勵與客戶使用對齊，但為長時間運行的代理帶來成本不可預測性。失控的代理循環同時在編排層和模型層產生費用。

有關成本降低策略，請參閱 [代理群的 LLM 成本最佳化和令牌預算策略](/learn/llm-cost-optimization)。

### 承諾 3：憑證隔離（憑證從不出現在代理上下文中）

憑證隔離是區分托管平台與「在雲端 VM 上運行、環境變數中有 API 金鑰的代理程式碼」的 AaaS 安全原語。憑證在執行時從服務器端注入，從不出現在代理的上下文視窗中、日誌檔案中或代理程式碼建構的工具呼叫參數中。

CVE-2024-5184（Palo Alto Unit 42，2024 年 6 月，CVSS 9.1 CRITICAL）證明透過工具回應的提示注入可導致代理洩露其自身的上下文視窗。如果 API 金鑰在上下文視窗中，它們就可以透過此向量被洩露。

向每個 AaaS 供應商提出的診斷問題：**「如果攻擊者透過提示注入提取了我代理的完整上下文視窗，哪些憑證面臨風險？」** 正確答案是：無，憑證不在代理的上下文視窗中。

- **AWS Bedrock Agents**：每次呼叫的 IAM 角色承擔；代理在臨時 IAM 角色令牌下執行，從不持有原始 API 金鑰
- **OpenLegion**：Zone 2 的 `$CRED{}` 句柄解析；代理程式碼按名稱引用憑證；Zone 2 在執行時解析實際值而不將其返回給代理

有關 Vault 代理模式和 `$CRED{}` 句柄架構，請參閱 [AI 代理的憑證管理和每租戶 API 金鑰範圍](/learn/credential-management-ai-agents)。

## 2026 年 AaaS 供應商格局

### AWS Bedrock Agents：具有 IAM 隔離的企業 AaaS

AWS Bedrock Agents 是市場覆蓋範圍最廣的主導企業 AaaS 平台。代理透過 Bedrock 控制台或 API 定義，具有操作群組和知識庫。

**定價（2026 年）：**
- 編排層：$0.000025/輸入令牌
- 模型成本：標準 Bedrock 費率（Claude 3.5 Sonnet：輸入 $3.00/M，輸出 $15.00/M）
- Knowledge Base 查詢：$0.0004/次
- Code Interpreter：$0.000025/輸入令牌

**憑證隔離：** 每次呼叫的 IAM 角色承擔。每個 Bedrock Agent 分配有 IAM 執行角色。代理本身從不持有原始憑證。

**限制：** 與 AWS 服務緊密耦合。不支援自訂代理循環邏輯。對於上下文繁重的代理，每令牌編排費用會快速累積。

### OpenAI Operator：面向瀏覽器任務的消費者 AaaS

OpenAI Operator 於 2025 年 1 月推出，是第一個主流消費者面向的 AaaS 產品，在沙盒瀏覽器會話中代表用戶執行網頁任務，按任務完成計費。

**憑證隔離：** 每個任務的沙盒瀏覽器會話。會話不跨任務持久化或共享。

**限制：** 僅限瀏覽器範圍，除網頁瀏覽外無自訂工具整合。無用於自訂代理定義的開發者 API。

### Google Agent Space：面向 Workspace 重度企業的 AaaS

Google Agent Space（2025 年推出，2026 年 GA）是 Google Cloud 的企業 AaaS 平台，定位於已在 Google Workspace 上標準化的組織。

**定價：** 透過 Google Cloud 消費計費，與 Vertex AI 模型成本加上 Cloud Run 呼叫費用掛鉤。

**限制：** Google Cloud 生態系統鎖定。對多雲整合靈活性較低。多個計費維度的定價不透明。

有關 AaaS 平台的功能級比較，請參閱 [AI 代理平台功能和框架比較](/learn/ai-agent-platform)。

## AaaS 定價：了解您的總成本

### 編排層費用：模型定價背後隱藏的成本

| **模型** | **輸入價格** | **編排費用** | **編排佔模型成本 %** |
|---|---|---|---|
| Claude 3.5 Sonnet | $3.00/M | $0.025/M | 0.83% |
| Claude 3 Haiku | $0.25/M | $0.025/M | 10% |
| Amazon Titan Text | $0.30/M | $0.025/M | 8.33% |

### 每操作費用與長時間運行代理稅

- **AWS Bedrock KB（每天 100,000 次查詢）**：$40/天 = $1,200/月
- **t3.medium 上的自架設 OpenSearch**（每天 100,000 次查詢）：約 $0.16/天 = $5/月

交叉點計算：AaaS 操作費用超過自架設基礎設施成本的時點約為**每天 12,500 次查詢**。

### AaaS 中的失控循環成本：雙重計費

失控的代理循環在 AaaS 中比自架設部署成本更高，因為 AaaS 在每次迭代中同時對模型成本和編排層費用計費。

## AaaS 安全：憑證隔離和 CVE-2024-5184 測試

### AaaS 平台的 CVE-2024-5184 測試

CVE-2024-5184（Palo Alto Unit 42，2024 年 6 月，CVSS 9.1 CRITICAL）：透過工具 API 回應的提示注入。

**CVE-2024-5184 測試**：「如果攻擊者透過提示注入提取了我代理的上下文視窗，哪些憑證可存取？」

**通過**（上下文視窗中無憑證）：
- AWS Bedrock Agents
- OpenLegion

**未通過**（憑證可存取）：
- 開發者在系統提示中放置了 API 金鑰的任何平台

### 多租戶提示隔離

**基礎設施級隔離（最強）：**
- AWS Bedrock Agents：每個租戶獨立的 IAM 角色
- Google Agent Space：透過 Google Cloud 專案邊界隔離
- OpenLegion：每個專案的黑板命名空間 ACL

**系統提示級隔離（最弱）：** 當提示注入覆蓋租戶指令時失敗（OWASP LLM06:2023）。

有關每租戶憑證範圍和命名空間 ACL 的完整架構，請參閱 [AI 代理多租戶和跨租戶隔離架構](/learn/ai-agent-multi-tenancy)。

### AaaS 中的共享責任模型

造成安全漏洞的常見客戶錯誤：

1. 系統提示中的憑證
2. 過於寬泛的工具權限
3. 沒有每代理工具範圍
4. 對不可逆操作沒有 HITL 中斷

## AaaS 對比自架設：決策框架

### AaaS 獲勝的情況

當以下條件成立時，AaaS 是更好的選擇：
- **低到中等量**：操作費用低於自架設基礎設施成本（交叉點約每天 12,500 次查詢）
- **快速生產就緒是優先級**：AaaS 消除了數週的基礎設施設置
- **合規繼承減少稽核負擔**：SOC 2 Type II 認證 AaaS 平台

### 自架設獲勝的情況

自架設基礎設施是正確選擇的情況：
- **規模超過 AaaS 交叉點**：每天代理操作超過 50,000 次
- **自訂執行環境需求**：非標準工具執行環境
- **資料駐留要求**：受監管行業
- **供應商鎖定風險不可接受**

### 總擁有成本

每天 100,000 次操作的 TCO 比較：

**AaaS（AWS Bedrock 風格）：**
- KB 查詢：$1,200/月
- 編排費用：約 $300/月
- 合計：約 $1,500/月 + 模型成本

**自架設：**
- Kubernetes 叢集：$800/月
- 向量儲存：$200/月
- 可觀測性堆疊：$150/月
- 工程：$2,400/月
- 合計：約 $3,550/月 + 模型成本

## OpenLegion 的觀點：AaaS 安全是憑證架構問題

Agent as a Service 是 2026 年成長最快的企業 AI 採購類別，也是安全基準最不標準化的類別。

**架構級執行**：憑證從不進入代理程式碼或上下文視窗。此屬性不能被開發者錯誤繞過。

**基於慣例的隔離**：開發者被指示不要將憑證放在系統提示中。在時間壓力、程式碼審查漏洞和開發者入職失敗下會崩潰。

三個具體數字：
- **CVE-2024-5184（CVSS 9.1 CRITICAL，2024 年 6 月）**
- **$32.88 CPC**（2026 年 Q1-Q2 的「agent as a service」）
- **年比年 4 倍成長**（2025 年 6 月至 2026 年初的搜尋量）

| **安全控制** | **OpenLegion** | **AWS Bedrock Agents** | **Google Agent Space** | **OpenAI Operator** | **LangGraph（自架設）** |
|---|---|---|---|---|---|
| **具有 $CRED{} 句柄解析的憑證 Vault** | Zone 2，架構級 | IAM 角色承擔 | 服務帳戶範圍 | 會話隔離 | 開發者責任 |
| **每代理每日支出上限（基礎設施層）** | Zone 2，$0-$50/天 | 不可用 | 不可用 | 不可用 | 開發者責任 |
| **每租戶專案的黑板 ACL** | 架構級 | 基於 IAM | 基於專案 | 不適用 | 開發者責任 |
| **每代理工具權限範圍** | 執行環境強制 | 操作群組 IAM | 基於 IAM | 不適用 | 開發者責任 |
| **每租戶 WORM 稽核日誌（SOC 2 CC6.1）** | 原生 | CloudTrail | Cloud Audit Logs | 不適用 | 開發者責任 |
| **git 中的代理定義** | INSTRUCTIONS.md | 控制台/API | 控制台/API | 不適用 | 開發者責任 |

[開始在 OpenLegion 上建構](https://app.openlegion.ai) -- 透過 Zone 2 的 `$CRED{}` Vault 代理解析部署具有架構級憑證隔離、Zone 2 強制的每代理每日支出上限以及使跨租戶狀態存取在架構上不可能的黑板 ACL 的代理。

<!-- SCHEMA: FAQPage -->

## 常見問題

### 什麼是 Agent as a Service（AaaS）？

Agent as a Service（AaaS）是一種商業交付模式，AI 代理在供應商的托管基礎設施上運行，處理編排、工具執行、記憶體和憑證管理，按消費基礎向客戶計費。AaaS 類別於 2026 年隨 OpenAI Operator 發布（2025 年 1 月）、Google Agent Space GA 和 AWS Bedrock Agents 達到企業規模而確立。每個 AaaS 平台做出三項承諾：托管基礎設施、消費計費和憑證隔離。

### Agent as a Service 的成本是多少？

AaaS 定價有三個成本層：底層 LLM 模型成本、編排層費用（AWS Bedrock Agents：$0.000025/輸入令牌）以及工具整合的每操作費用（AWS Bedrock Knowledge Base：$0.0004/次）。每天 100,000 次代理操作時，AaaS 平台費用通常在模型成本之前達到 $1,500-$3,600/月。

### AWS Bedrock Agents 是什麼，如何計費？

AWS Bedrock Agents 是亞馬遜的托管 AaaS 平台，在基於 IAM 角色的憑證隔離的 AWS 托管基礎設施上提供代理編排、操作群組和知識庫。定價（2026 年）：編排層每輸入令牌 $0.000025；Knowledge Base 查詢每次 $0.0004。

### OpenAI Operator 是什麼，為什麼對 AaaS 重要？

2025 年 1 月推出的 OpenAI Operator 是第一個主流消費者面向的 Agent as a Service 產品，在沙盒瀏覽器會話中代表用戶執行網頁任務，按任務完成計費。Operator 的重要性在於展示了消費者也會為代理任務執行作為服務付費，與 2026 年初「agent as a service」搜尋量年比年 4 倍成長直接相關。

### AaaS 平台中的憑證隔離如何運作？

AaaS 中的憑證隔離意味著平台從不將客戶的 LLM API 金鑰、資料庫憑證或工具密鑰暴露給代理程式碼。AWS Bedrock Agents 透過 IAM 角色承擔實現這一點。OpenLegion 使用 Zone 2 的 `$CRED{}` 句柄解析：代理程式碼按名稱引用憑證；Zone 2 在執行時解析實際值而不將其返回給代理。

### AaaS 平台特有的安全風險是什麼？

主要的 AaaS 特有安全風險是提示注入的擴大攻擊面（CVE-2024-5184，CVSS 9.1 CRITICAL）：AaaS 代理代表租戶呼叫外部 API 並處理外部網頁內容，任何外部回應都可能包含對抗性指令。第二個風險是弱隔離架構下的跨租戶提示洩露。第三個風險是共享責任差距。

### 我應該何時使用 AaaS 對比自架設基礎設施？

AaaS 是低到中等量、快速生產就緒或合規繼承的更好選擇。自架設在規模上獲勝（超過 50,000 次操作/天）、自訂執行環境需求、資料駐留法規或供應商鎖定風險不可接受時。TCO 計算必須始終包含運營自架設基礎設施的工程時間。

### AaaS 中的多租戶提示隔離是什麼？

AaaS 中的多租戶提示隔離意味著租戶 A 的系統提示、對話歷史、工具結果和記憶體狀態從不出現在租戶 B 的代理上下文中。最強的隔離機制是基礎設施級別的。最弱的模式是系統提示級隔離，當提示注入覆蓋或忽略租戶指令時失敗（OWASP LLM06:2023）。
