---
title: LiteLLM替代方案 — Vault隔離 vs 憑證儲存
description: "OpenLegion vs LiteLLM：vault隔離與集中式憑證儲存。CVE-2026-42208（CVSS 9.3）SQL注入暴露LiteLLM憑證資料庫。分散式隔離 vs 閘道聚合。"
slug: /comparison/litellm
primary_keyword: litellm alternative
secondary_keywords:
  - openlegion vs litellm
  - litellm 安全性
  - litellm cve
  - llm代理替代方案
  - litellm 閘道
date_published: 2026-05
last_updated: "2026-11-03"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
---

# LiteLLM替代方案：OpenLegion分散式Vault vs 集中式閘道

OpenLegion vs LiteLLM代表了在模型之外注入的金庫保管憑證與集中式LLM閘道憑證聚合之間的根本安全性權衡。LiteLLM作為統一提供者閘道表現出色，擁有62,615個GitHub星標、成本追蹤和100多個LLM提供者支援，但遭受了CVE-2026-42208（CVSS 9.8 CRITICAL，已列入CISA已知遭利用漏洞目錄），SQL注入將整個憑證資料庫暴露給未經身份驗證的攻擊者。在OpenLegion中，憑證存放於金庫並在呼叫時注入，模型只持有代號 — 沒有任何憑證資料庫可供讀取。

<!-- SCHEMA: DefinitionBlock -->

> **LiteLLM是什麼，與OpenLegion相比如何？**
> LiteLLM是一個擁有62,615多個GitHub星標的集中式LLM閘道，將提供者憑證聚合到一個資料庫中，用於統一存取、成本追蹤和提供者路由。OpenLegion是一個安全優先的多智能體平台，憑證存放於金庫並在模型之外注入，消除憑證資料庫作為攻擊目標。LiteLLM提供閘道統一；OpenLegion提供架構安全性隔離。

## 總結

| **維度** | **LiteLLM** | **OpenLegion** |
|---|---|---|
| **主要目的** | 集中式LLM閘道和提供者代理 | 帶金庫保管憑證的安全優先多智能體平台 |
| **架構** | 帶API路由的集中式憑證資料庫 | 憑證存放於金庫，在模型之外注入 |
| **憑證儲存** | 集中式資料庫中的所有提供者金鑰 | 金庫在呼叫時注入憑證；模型只持有代號 |
| **近期CVE** | 2026年30多個CVE，包括CRITICAL SQL注入 | 不適用 — 代管平台 |
| **安全性隔離** | 帶存取控制的共享閘道 | 每項任務一次沙箱執行，憑證存放於金庫 |
| **提供者支援** | 統一API介面支援100多個LLM | Smartest、Smart與Normal模型預設 |
| **成本追蹤** | 內建支出追蹤和預算設定 | 每智能體點數預算，每項任務成本可見 |
| **部署模型** | 單一閘道服務 | 代管網頁應用；智能體是持久紀錄 |
| **容器安全性** | 預設root執行，無沙箱 | 沙箱執行，預設無網路存取 |
| **攻擊面** | 高價值集中式憑證目標 | 沒有任何智能體能觸及的憑證儲存 |

## 集中式閘道 vs 分散式Vault

### 憑證聚合 vs Vault注入

**LiteLLM**將所有LLM提供者憑證集中在一個可透過API端點存取的單一資料庫中。CVE-2026-42208證明了這一風險，SQL注入將LiteLLM的整個憑證資料庫暴露給未經身份驗證的攻擊者。

**OpenLegion**將憑證存取保留在金庫中，且從不鏡射到任何智能體可存取的位置。智能體發出呼叫時，憑證在模型之外注入，模型只持有代號，永遠不會收到明文API金鑰。

## 2026年CVE叢集：當集中化成為負擔

### CVE-2026-42208：CRITICAL SQL注入

**CVSS 9.8 CRITICAL**嚴重性漏洞（NVD的CVSS 3.1評分；GitHub的CVSS 4.0評分為9.3），LiteLLM的API金鑰驗證中的SQL注入將整個憑證資料庫暴露給未經身份驗證的攻擊者。受影響版本為1.81.16至1.83.6，已於v1.83.7修補。CISA於2026年5月8日將其列入已知遭利用漏洞（KEV）目錄，證實已遭實際利用。

### 2026年CVE模式：四個月內五個漏洞

2026年4月至5月間公開了**五個嚴重CVE**，而這只是全年總數的一部分：NVD收錄了2026年公開的30多個LiteLLM CVE：

1. **CVE-2026-42208**（CVSS 9.8 CRITICAL） - 向未經身份驗證的攻擊者暴露憑證資料庫的SQL注入。已於v1.83.7修補。
2. **CVE-2026-35029**（CVSS 8.8 HIGH） - `/config/update`缺少管理員授權：任何已驗證使用者都能修改代理設定，並註冊指向攻擊者控制之Python程式碼的pass-through處理常式，進而達成RCE。已於v1.83.0修補。
3. **CVE-2026-35030**（CVSS 9.1 CRITICAL） - OIDC userinfo快取鍵衝突：啟用JWT身份驗證時（預設未啟用），前20個字元與合法使用者快取權杖相同的偽造權杖會繼承該使用者的身分。已於v1.83.0修補。
4. **CVE-2026-40217**（CVSS 8.8 HIGH） - 透過`/guardrails/test_custom_code`的位元組碼改寫執行程式碼，即自訂程式碼護欄中的沙箱逃逸。已於v1.83.10修補。
5. **CVE-2026-42203**（CVSS 8.8 HIGH） - `/prompts/test`的伺服器端範本注入(SSTI) RCE：提示範本在沒有沙箱的情況下轉譯，任何持有有效代理API金鑰的人都能在代理程序中執行程式碼。受影響版本1.80.5至1.83.6；已於v1.83.7修補。

## 容器安全性：Root vs 隔離執行

### LiteLLM的預設Root執行

LiteLLM官方Docker映像檔預設**root使用者部署**，無權限分離或沙箱機制。

### OpenLegion的強制隔離

**臨時執行**取代長期存在的工作程序：每項任務按需執行後即停止，沒有常駐的智能體程序可供提權。一次執行不會取得超出政策引擎已為該智能體核准之意圖以外的任何權限。

## OpenLegion的觀點

CVE-2026-42208（CVSS 9.8 CRITICAL，據CISA已遭實際利用）證明了SQL注入可以暴露整個組織的憑證儲存。OpenLegion的憑證金庫完全消除了憑證聚合風險：沒有任何資料庫把API金鑰存放在可能被SQL注入、身份驗證繞過或沙箱逃逸暴露的地方。

## 選擇LiteLLM vs 選擇OpenLegion

### 當閘道統一是優先事項時選擇LiteLLM

您的團隊需要簡化的提供者整合，具有對100多個LLM提供者的統一API存取。

### 當憑證安全性至關重要時選擇OpenLegion

憑證聚合創造了不可接受的風險，一個元件的洩露可能暴露所有組織API金鑰。

## 從集中式閘道遷移到Vault代理

**提供者設定**不再是你需要維護的東西：OpenLegion以預設組合挑選模型 — Smartest、Smart或Normal — 可按智能體或按工作區設定。既有的提供者設定、模型對應與路由規則沒有對應項需要移植，也沒有金鑰需要輪替。

有關[AI智能體安全架構以及vault代理隔離與框架比較的更廣泛視圖](/learn/ai-agent-security)，憑證隔離模式是OpenLegion最重要的安全差異化因素。

<!-- SCHEMA: FAQPage -->

## 常見問題

### LiteLLM vs OpenLegion是什麼？

LiteLLM是一個擁有62,615多個GitHub星標的集中式LLM閘道，將憑證聚合到資料庫中用於統一存取100多個LLM提供者。OpenLegion是一個安全優先的多智能體平台，憑證存放於金庫並在模型之外注入，模型只持有代號。

### LiteLLM最近有哪些安全漏洞？

CVE-2026-42208（CVSS 9.8 CRITICAL）允許未經身份驗證的攻擊者透過精心構造的Authorization標頭進行SQL注入，讀取並可能修改整個憑證資料庫；受影響版本為1.81.16至1.83.6，已於v1.83.7修補，並已列入CISA已知遭利用漏洞目錄。2026年其他嚴重CVE包括：/config/update缺少管理員授權導致RCE（CVE-2026-35029）、啟用JWT身份驗證時可冒充其他使用者的OIDC快取鍵衝突（CVE-2026-35030）、自訂程式碼護欄中的沙箱逃逸（CVE-2026-40217），以及/prompts/test的SSTI RCE（CVE-2026-42203）。NVD收錄了2026年公開的30多個LiteLLM CVE。

### 如何處理LLM提供者憑證？

LiteLLM將所有提供者憑證儲存在可透過API端點存取的集中式資料庫中。OpenLegion的金庫在呼叫時、在模型之外注入憑證，模型只持有代號，不在任何智能體可存取的位置儲存。

### 哪個在生產環境中更安全？

LiteLLM聚合所有憑證，創造了已被證明易受CRITICAL SQL注入攻擊的高價值攻擊目標。OpenLegion將憑證存放於模型永不讀取的金庫中，為每項任務提供自己的沙箱執行，且沒有長期存在的智能體程序可供入侵。

### 部署差異是什麼？

LiteLLM在預設Docker映像檔中以root執行，無沙箱或權限分離。OpenLegion是代管網頁應用，沒有任何東西需要部署：以Google登入，每項任務按需在預設無網路存取的沙箱中執行。每個智能體都是持久紀錄，擁有自己的預算、自己的憑證範圍，以及每個動作的收據。

### 我可以從LiteLLM遷移到OpenLegion嗎？

是的。沒有提供者設定需要移轉，因為模型是以預設組合挑選 — Smartest、Smart或Normal — 可按智能體或按工作區設定。智能體仍需要的憑證會從集中式資料庫儲存遷移到金庫，模型只持有代號。

**立即試用OpenLegion。**
[開始使用](https://app.openlegion.ai) | [閱讀文件](https://docs.openlegion.ai) | [比較AI智能體安全架構](/learn/ai-agent-security)
