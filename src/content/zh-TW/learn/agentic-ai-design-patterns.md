---
title: "智能體AI設計模式：ReAct、Plan-and-Execute、Reflexion等"
description: "ReAct、Plan-and-Execute、Reflexion、Critic-Actor、Supervisor-Worker、Mixture-of-Agents：智能體AI設計模式，含權衡取捨、故障模式、安全閘門和生產選擇指南。"
slug: /learn/agentic-ai-design-patterns
primary_keyword: 智能體AI設計模式
last_updated: "2026-06-25"
schema_types: ["FAQPage"]
related:
  - /learn/agentic-workflows
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-planning
  - /learn/ai-agent-reliability
  - /learn/multi-agent-systems
  - /learn/ai-agent-security
---

# 智能體AI設計模式：ReAct、Plan-and-Execute、Reflexion等

智能體AI設計模式是針對智能體協調中反覆出現問題的具名可重用架構解決方案——每個模式都有明確的結構、已知的權衡取捨、特徵性故障模式和安全影響。選擇錯誤的模式會導致具體故障：在長期任務中使用ReAct會導致上下文視窗抖動；沒有重新規劃的Plan-and-Execute會在過時計劃上累積錯誤；沒有記憶體清理的Reflexion會導致持續性記憶體投毒。兩大類別的六種模式：單智能體推理模式（ReAct、Plan-and-Execute、Reflexion）和多智能體協調模式（Critic-Actor、Supervisor-Worker、Mixture-of-Agents）。

<!-- SCHEMA: DefinitionBlock -->

> **智能體AI設計模式**是針對智能體系統設計中反覆出現問題的具名可重用架構解決方案——指定智能體如何推理、規劃、反思、委派並從故障中恢復——每個模式都有明確的結構、已知的權衡取捨、特徵性故障模式和安全影響，實踐者在部署至生產環境之前必須加以考量。

## 如何閱讀本指南：模式結構與選擇啟發法

### 模式組件：結構、權衡取捨、故障模式、安全閘門

本指南中每個模式由四個組件描述：

**結構**：以散文形式呈現的架構配置——存在哪些智能體或模型實例、它們如何通訊、資料流程如何呈現以及關鍵工件是什麼。

**權衡取捨**：模式最佳化的方面與犧牲的方面。ReAct最佳化真實工具錨定但犧牲上下文視窗效率。

**故障模式**：每個模式在生產環境中失敗的具體方式，這些方式從學術基準測試結果中並不明顯。

**安全閘門**：防止每個模式特徵性安全故障模式所需的特定控制。

### 模式選擇啟發法：任務持續時間 x 可逆性 x 自主等級

三個軸決定從哪個模式開始：

**任務持續時間**：短任務（最多5次工具呼叫）-- ReAct。中等任務（6-20步驟）-- Plan-and-Execute。長期或開放性任務（20步驟以上）-- Reflexion或Supervisor-Worker。

**可逆性**：如果所有動作都可逆，任何模式都適用。如果某些動作不可逆（檔案刪除、發送郵件、資料庫寫入），無論使用何種基礎模式，都要在這些特定動作前新增Critic-Actor閘門。

**自主等級**：L1-L2 -- ReAct或Plan-and-Execute。L3 -- 帶角色爆炸半徑限制的Reflexion或Supervisor-Worker。L4 -- 沒有強化安全基礎設施的情況下不在生產環境部署。

## ReAct：推理與行動交叉執行

### 結構：思考 -> 行動 -> 觀察迴圈

ReAct（Reasoning + Acting），來自Google Brain和Princeton的Yao等人（arXiv 2022年10月，ICLR 2023），在單一上下文視窗便條本中交叉進行思維鏈推理與工具呼叫。迴圈：

```
Thought: [基於前一觀察的思維鏈推理]
Action: [工具呼叫——函式名稱和參數]
Observation: [執行返回的工具結果]
[重複直到:]
Thought: 我有足夠的資訊來回答了。
Action: Finish[最終答案]
```

原始論文的基準測試結果：HotpotQA多跳問答——ReAct 57.1%精確匹配 vs 僅思維鏈43.2%（+14分）。FEVER事實查核——75.4% vs 66.4%（+9分）。

### 權衡取捨：真實依據 vs 上下文視窗增長

ReAct的主要優勢是基於觀察的推理。代價是上下文視窗增長。在平均200個令牌/三元組的20次工具呼叫任務中，便條本alone消耗4,000個令牌。

### 故障模式：便條本注入

ReAct的安全故障模式直接針對便條本。如果任何工具觀察包含對抗性內容，該內容會被逐字追加到便條本。

三種需要同時採取的緩解措施：
1. 在追加到便條本前清理每個觀察
2. 在Zone 2分發前預先記錄每個行動
3. 將每個工具觀察視為不可信輸入

## Plan-and-Execute：將規劃與執行分離

### 結構：規劃者在任何執行開始前生成完整任務分解

Plan-and-Execute分離了ReAct交織的兩個關注點：規劃者智能體接收目標並在任何執行開始前生成完整的任務分解。

上下文視窗效率：計劃緊湊（大多數任務50-150個令牌）。對於長期任務，與ReAct相比可減少約40-60%的上下文視窗佔用。

### 權衡取捨：效率 vs 計劃過時

主要故障模式是計劃過時。計劃在T=0時生成。如果執行過程中環境發生變化，剩餘步驟可能基於無效的前提條件。

### 安全閘門：分發前的計劃檢查

計劃是在任何工具呼叫之前可用的離散工件。自動化預執行策略檢查：解析計劃中的禁止動作類型，驗證每個工具名稱出現在智能體的允許動作清單中。

## Reflexion：透過語言強化從失敗中學習

### 結構：反思 -> 儲存 -> 條件化下一次嘗試

Reflexion，來自Northeastern、MIT和Princeton的Shinn等人（arXiv 2023年3月，NeurIPS 2023），是一種語言強化學習模式：任務嘗試失敗後，智能體生成自然語言反思，儲存在情節記憶緩衝區中，並基於檢索到的反思來條件化下一次嘗試。

基準測試結果：HumanEval程式編碼pass@1——Reflexion 91% vs 標準提示80%（+11分）。ALFWorld任務成功——97% vs 73%基線（+24分）。

### 安全風險：情節記憶投毒

Reflexion的安全故障模式與ReAct的便條本注入風險不同且更持久。如果觀察包含對抗性內容，生成的反思可以無限期地編碼攻擊者控制的指導。

依次需要的四種緩解措施：儲存前反思清理；帶agent_id歸因的版本化黑板儲存；反思TTL；針對提議類別行為變更的反思的HITL審查閘門。

## Critic-Actor：將評估與執行分離

### 結構：行動者提議，批評者在執行前攔截

Critic-Actor模式，源自RLHF和Constitutional AI（Anthropic，2022），將行動生成與行動評估分離。Actor模型提議一個行動；Critic模型根據策略評估提議的行動；只有通過Critic評估的行動才能進入工具呼叫層。

關鍵實作細節：Critic必須具有獨立於Actor的上下文視窗。同一上下文的Critic共享Actor的完整上下文。

### 何時使用Critic-Actor：不可逆性閾值

Critic-Actor增加延遲，在動作跨越不可逆性閾值時需要：檔案刪除、發送郵件、資料庫寫入、對外部API的POST呼叫。

## Supervisor-Worker：基於角色的多智能體協調

### 結構：監督者分解，工作者在角色範圍內執行

Supervisor-Worker由一個監督者智能體接收目標、分解為任務，並將每個任務調度給具有定義角色和受限工具集的專業工作者智能體：
- ResearchWorker：工具 = `web_search`、`read_file`、`read_url`
- CodeWorker：工具 = `run_command`、`write_file`、`read_file`
- CommWorker：工具 = `send_email`、`post_message`

### 安全屬性：受損工作者的爆炸半徑限制

Supervisor-Worker的主要安全屬性是爆炸半徑限制：受損的工作者只能呼叫其定義角色內的工具。接收到注入指令要呼叫`send_email()`的ResearchWorker將在Zone 2的權限檢查中失敗。

## Mixture-of-Agents：跨模型實例的集成推理

### 結構：模型輸出的多層聚合

Mixture-of-Agents（MoA），來自Together AI的Wang等人（arXiv 2024年6月），透過迭代細化層聚合來自多個LLM實例的輸出。AlpacaEval 2.0基準測試：使用3層MoA的65.1%勝率 vs GPT-4o單模型的57.5%——集成推理帶來7.6分的品質提升。

### 權衡取捨：品質 vs API成本倍增

3模型 x 3層MoA每次使用者請求需要約12次LLM呼叫 vs 單模型的1次——約12倍API成本增加。MoA不適合高頻、延遲敏感的智能體迴圈。

## OpenLegion觀點：模式安全是基礎設施，而非提示工程

本指南中每個智能體設計模式都有原始學術論文未涵蓋的安全故障模式。模式特定的安全故障模式：
- **ReAct便條本注入**：對抗性觀察內容注入Thought步驟
- **Plan-and-Execute計劃注入**：計劃工件可能在規劃者和執行者之間被修改
- **Reflexion記憶體投毒**：被投毒的反思跨會話持久存在於情節緩衝區
- **同上下文Critic繞過**：注入Actor上下文也會損害Critic評估
- **監督者被攻陷**：被攻陷的監督者可以向所有工作者調度任意任務

| **安全控制** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **預執行行動記錄** | Zone 2，原生 | 開發者慣例 | 開發者慣例 | 開發者慣例 | 開發者慣例 |
| **黑板計劃ACL** | 基礎設施強制 | 不可用 | 不可用 | 不可用 | 不可用 |
| **帶agent_id歸因的版本化情節記憶** | 原生 | 開發者慣例 | 開發者慣例 | 開發者慣例 | 開發者慣例 |
| **獨立上下文的獨立Critic模型** | 原生智能體隔離 | 手動設定 | 手動設定 | 手動設定 | 手動設定 |
| **每工作者的Zone 2工具權限執行** | 基礎設施強制 | 開發者慣例 | 開發者慣例 | 開發者慣例 | 開發者慣例 |

[在OpenLegion上開始構建](https://app.openlegion.ai)

<!-- SCHEMA: FAQPage -->

## 常見問題

### 什麼是智能體AI設計模式？

智能體AI設計模式是針對智能體系統設計中反覆出現問題的具名可重用架構解決方案——指定智能體如何推理、規劃、反思、委派並從故障中恢復。主要模式包括ReAct、Plan-and-Execute、Reflexion、Critic-Actor、Supervisor-Worker和Mixture-of-Agents。選擇錯誤的模式會導致具體故障。

### 什麼是AI智能體的ReAct模式？

ReAct（Reasoning + Acting），來自Google Brain和Princeton的Yao等人（arXiv 2022年10月，ICLR 2023），在單一上下文視窗便條本中交叉進行思維鏈推理與工具呼叫和工具結果，將每個推理步驟錨定在實際工具結果中。在基準測試中，ReAct在HotpotQA上比僅思維鏈高14分，在FEVER上高9分。主要生產權衡是上下文視窗增長。主要安全風險是便條本注入。

### 什麼是AI智能體的Plan-and-Execute模式？

Plan-and-Execute將規劃者智能體與執行者智能體分離，與ReAct相比，在長期任務中將上下文視窗消耗減少約40-60%，並允許在進行任何工具呼叫之前對計劃進行自動化預執行策略檢查。主要故障模式是計劃過時，需要檢測預期觀察與實際觀察不符的重新規劃觸發器。

### 什麼是AI智能體的Reflexion模式？

Reflexion（Shinn等，NeurIPS 2023）讓智能體生成任務失敗的語言摘要，儲存在情節記憶中，並基於檢索的反思來條件化未來嘗試。HumanEval程式編碼pass@1從80%提升到91%，ALFWorld從73%提升到97%。安全風險是情節記憶投毒。

### 什麼是AI智能體的Critic-Actor模式？

Critic-Actor模式將Critic模型（在執行前根據策略評估提議的動作）與Actor模型（生成並執行動作）分離，確保只有通過Critic評估的動作才能到達工具呼叫層——在動作不可逆時必需。具有獨立上下文視窗的獨立模型Critic比同上下文Critic強得多。

### 什麼是AI智能體的Supervisor-Worker模式？

Supervisor-Worker由監督者智能體分解目標並將任務調度給具有定義角色和受限工具集的專業工作者智能體，使每個工作者在最小權限下運作，受損工作者只能呼叫其定義角色內的工具。爆炸半徑限制是該模式的主要安全優勢。

### 什麼是Mixture-of-Agents（MoA）？

Mixture-of-Agents（MoA），來自Together AI的Wang等人（arXiv 2024年6月），透過迭代細化層聚合來自多個LLM提議器實例的輸出，修正模型實例間的非相關錯誤。在AlpacaEval 2.0上，3層MoA實現了65.1%的勝率，而GPT-4o為57.5%。生產成本是乘數性的：約12倍API成本增加。

### 如何在ReAct、Plan-and-Execute和Reflexion之間選擇？

模式選擇遵循三個軸：任務持續時間、動作可逆性和自主等級。對於具有可逆動作的短任務，ReAct是最簡單的選擇。對於中期任務，Plan-and-Execute將上下文視窗消耗減少40-60%。對於智能體可以從自身失敗歷史中學習的重複任務，Reflexion增加了累積性能提升。動作不可逆時新增Critic-Actor；不同任務步驟確實需要不同工具集時新增Supervisor-Worker。
