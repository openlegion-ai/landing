---
title: LiteLLM 대안 — Vault 격리 vs 자격증명 저장소
description: "OpenLegion vs LiteLLM: vault 격리 vs 중앙 집중형 자격증명 저장소. CVE-2026-42208(CVSS 9.3) SQL 삽입으로 LiteLLM 자격증명 DB 노출. 분산 격리 vs 게이트웨이 집계."
slug: /comparison/litellm
primary_keyword: litellm alternative
secondary_keywords:
  - openlegion vs litellm
  - litellm 보안
  - litellm cve
  - llm proxy 대안
  - litellm 게이트웨이
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

# LiteLLM 대안: OpenLegion 분산 Vault vs 중앙 집중형 게이트웨이

OpenLegion vs LiteLLM은 모델 외부에서 주입되는 볼트 보관 자격증명과 중앙 집중형 LLM 게이트웨이 자격증명 집계 사이의 근본적인 보안 트레이드오프를 나타냅니다. LiteLLM은 GitHub 스타 62,615개, 비용 추적, 100개 이상의 LLM 공급자 지원을 갖춘 통합 공급자 게이트웨이로 뛰어나지만, CVE-2026-42208(CVSS 9.8 CRITICAL, CISA의 Known Exploited Vulnerabilities 카탈로그 등재)을 겪었는데, SQL 삽입으로 전체 자격증명 데이터베이스가 인증되지 않은 공격자에게 노출되었습니다. OpenLegion에서는 자격증명이 볼트에 보관되어 호출 시 주입되고 모델은 핸들만 보유합니다 — 읽어낼 자격증명 데이터베이스 자체가 없습니다.

<!-- SCHEMA: DefinitionBlock -->

> **LiteLLM이란 무엇이며 OpenLegion과 어떻게 비교됩니까?**
> LiteLLM은 GitHub 스타 62,615개 이상의 중앙 집중형 LLM 게이트웨이로, 통합 접근, 비용 추적, 공급자 라우팅을 위해 공급자 자격증명을 하나의 데이터베이스에 집계합니다. OpenLegion은 자격증명이 볼트에 보관되어 모델 외부에서 주입되는 보안 우선 멀티 에이전트 플랫폼으로, 자격증명 데이터베이스를 공격 대상에서 제거합니다.

## TL;DR

| **차원** | **LiteLLM** | **OpenLegion** |
|---|---|---|
| **주요 목적** | 중앙 집중형 LLM 게이트웨이 및 공급자 프록시 | 볼트 보관 자격증명을 갖춘 보안 우선 멀티 에이전트 플랫폼 |
| **아키텍처** | API 라우팅을 가진 중앙 집중형 자격증명 DB | 볼트에 보관되고 모델 외부에서 주입되는 자격증명 |
| **자격증명 저장** | 중앙 집중형 DB에 모든 공급자 키 | 볼트가 호출 시 주입; 모델은 핸들만 보유 |
| **최근 CVE** | 2026년 CVE 30개 이상, CRITICAL SQL 삽입 포함 | 해당 없음 — 호스팅 플랫폼 |
| **보안 격리** | 접근 제어를 갖춘 공유 게이트웨이 | 작업별 샌드박스 실행, 볼트 보관 자격증명 |
| **공급자 지원** | 통합 API 인터페이스로 100개 이상 LLM | Smartest, Smart, Normal 모델 프리셋 |
| **비용 추적** | 내장 지출 추적 및 예산 설정 | 에이전트별 크레딧 예산, 작업별 비용 표시 |
| **배포 모델** | 단일 게이트웨이 서비스 | 호스팅 웹 앱; 에이전트는 영속 레코드 |
| **컨테이너 보안** | 기본 root 실행, 샌드박싱 없음 | 샌드박스 실행, 기본 네트워크 접근 차단 |
| **공격 표면** | 고가치 중앙 집중형 자격증명 대상 | 에이전트가 닿을 수 있는 자격증명 저장소 없음 |

## 중앙 집중형 게이트웨이 vs 분산 Vault

### 자격증명 집계 vs Vault 주입

**LiteLLM**은 모든 LLM 공급자 자격증명을 API 엔드포인트를 통해 접근 가능한 단일 데이터베이스에 중앙 집중화합니다. CVE-2026-42208은 SQL 삽입으로 인증되지 않은 공격자에게 LiteLLM의 전체 자격증명 데이터베이스가 노출되었을 때 이 위험을 입증했습니다.

**OpenLegion**은 에이전트가 접근 가능한 어떤 위치에도 복제되지 않는 볼트에 자격증명 접근을 둡니다. 자격증명은 모델 외부에서 주입되고 모델은 핸들만 보유합니다.

## 2026년 CVE 클러스터: 중앙화가 부채가 될 때

### CVE-2026-42208: CRITICAL SQL 삽입

**CVSS 9.8 CRITICAL** 심각도 취약점(NVD의 CVSS 3.1 점수이며, GitHub의 CVSS 4.0 점수는 9.3)으로, LiteLLM의 API 키 검증에서 SQL 삽입으로 전체 자격증명 데이터베이스가 인증되지 않은 공격자에게 노출되었습니다. 영향을 받은 버전은 1.81.16부터 1.83.6까지이며 v1.83.7에서 패치되었습니다. CISA는 2026년 5월 8일 이 취약점을 Known Exploited Vulnerabilities 카탈로그에 추가해 실제 악용을 확인했습니다.

### 2026년 CVE 패턴: 4개월 동안 5개의 취약점

2026년 4월과 5월 사이에 **심각한 CVE 5개**가 공개되었으며, 이는 연간 총계의 일부에 불과합니다. NVD에는 2026년에 공개된 LiteLLM CVE가 30개 이상 등록되어 있습니다:

1. **CVE-2026-42208** (CVSS 9.8 CRITICAL) - 인증되지 않은 공격자에게 자격증명 데이터베이스를 노출하는 SQL 삽입. v1.83.7에서 수정.
2. **CVE-2026-35029** (CVSS 8.8 HIGH) - `/config/update`의 관리자 권한 검사 누락: 인증된 사용자라면 누구나 프록시 설정을 변경하고 공격자가 제어하는 Python 코드를 가리키는 pass-through 핸들러를 등록해 RCE를 달성할 수 있었습니다. v1.83.0에서 수정.
3. **CVE-2026-35030** (CVSS 9.1 CRITICAL) - OIDC userinfo 캐시 키 충돌: JWT 인증이 활성화된 경우(기본값 아님), 처음 20자가 정상 사용자의 캐시된 토큰과 일치하도록 조작된 토큰이 해당 사용자의 신원을 넘겨받습니다. v1.83.0에서 수정.
4. **CVE-2026-40217** (CVSS 8.8 HIGH) - `/guardrails/test_custom_code`에서 바이트코드 재작성을 통한 코드 실행으로, 커스텀 코드 가드레일의 샌드박스 탈출입니다. v1.83.10에서 수정.
5. **CVE-2026-42203** (CVSS 8.8 HIGH) - `/prompts/test`의 Server-Side Template Injection (SSTI) RCE: 프롬프트 템플릿이 샌드박스 없이 렌더링되어 유효한 프록시 API 키를 가진 누구나 프록시 프로세스에서 코드를 실행할 수 있었습니다. 영향 버전 1.80.5~1.83.6, v1.83.7에서 수정.

## 컨테이너 보안: Root vs 격리 실행

### LiteLLM의 기본 Root 실행

권한 분리나 샌드박싱 메커니즘 없이 LiteLLM 공식 Docker 이미지의 기본값으로 **root 사용자 배포**.

### OpenLegion의 필수 격리

**임시 실행**이 상주 워커를 대체합니다: 각 작업은 필요할 때 실행된 뒤 종료되므로 권한을 상승시킬 상주 에이전트 프로세스가 없습니다.

## OpenLegion의 견해

LiteLLM vs OpenLegion은 AI 인프라에서 고전적인 보안 대 편의성 트레이드오프를 나타냅니다. CVE-2026-42208(CVSS 9.8 CRITICAL, CISA 기준 실제 악용 확인)은 SQL 삽입이 전체 조직 자격증명 저장소를 노출할 수 있음을 입증했습니다.

OpenLegion의 자격증명 볼트는 자격증명 집계 위험을 완전히 제거합니다. SQL 삽입, 인증 우회, 샌드박스 탈출로 노출될 수 있는 API 키를 저장하는 데이터베이스가 없습니다.

## LiteLLM vs OpenLegion 선택

### 게이트웨이 통합이 우선인 경우 LiteLLM 선택

팀이 개별 통합을 관리하지 않고 100개 이상의 LLM 공급자에 대한 통합 API 접근이 필요한 경우.

### 자격증명 보안이 필수인 경우 OpenLegion 선택

하나의 구성 요소 침해로 모든 조직 API 키가 노출될 수 있는 자격증명 집계가 허용할 수 없는 위험을 만드는 경우.

## 중앙 집중형 게이트웨이에서 Vault Proxy로 마이그레이션

**공급자 구성**은 더 이상 유지할 대상이 아닙니다: OpenLegion은 에이전트별 또는 워크스페이스별로 Smartest, Smart, Normal 프리셋으로 모델을 선택합니다.

[AI 에이전트 보안 아키텍처와 vault proxy 격리가 프레임워크 간에 어떻게 비교되는지에 대한 광범위한 보기](/learn/ai-agent-security)는 자격증명 격리 패턴이 OpenLegion의 가장 중요한 보안 차별화 요소입니다.

<!-- SCHEMA: FAQPage -->

## 자주 묻는 질문

### LiteLLM vs OpenLegion이란 무엇입니까?

LiteLLM은 GitHub 스타 62,615개 이상의 중앙 집중형 LLM 게이트웨이로 비용 추적과 함께 100개 이상의 LLM 공급자에 통합 접근을 위해 자격증명을 집계합니다. OpenLegion은 자격증명이 볼트에 보관되어 모델 외부에서 주입되는 보안 우선 멀티 에이전트 플랫폼입니다.

### LiteLLM의 최근 보안 취약점은 무엇입니까?

CVE-2026-42208(CVSS 9.8 CRITICAL)은 조작된 Authorization 헤더를 통한 인증 없는 SQL 삽입으로 전체 자격증명 데이터베이스를 읽고, 경우에 따라 수정할 수 있게 했습니다. 영향 버전은 1.81.16~1.83.6이며 v1.83.7에서 패치되었고, CISA의 Known Exploited Vulnerabilities 카탈로그에 등재되어 있습니다. 2026년의 다른 심각한 CVE로는 /config/update의 관리자 권한 검사 누락으로 인한 RCE(CVE-2026-35029), JWT 인증 활성화 시 다른 사용자로 가장할 수 있게 하는 OIDC 캐시 키 충돌(CVE-2026-35030), 커스텀 코드 가드레일의 샌드박스 탈출(CVE-2026-40217), /prompts/test의 SSTI RCE(CVE-2026-42203)가 있습니다. NVD에는 2026년에 공개된 LiteLLM CVE가 30개 이상 등록되어 있습니다.

### LLM 공급자 자격증명을 어떻게 처리합니까?

LiteLLM은 모든 공급자 자격증명을 API 엔드포인트를 통해 접근 가능한 중앙 집중형 데이터베이스에 저장합니다. OpenLegion의 볼트는 에이전트가 접근 가능한 위치에 저장하지 않고 모델 외부에서 호출 시 자격증명을 주입합니다.

### 프로덕션에서 어느 것이 더 안전합니까?

LiteLLM은 CRITICAL SQL 삽입에 취약한 것으로 입증된 고가치 공격 대상을 만드는 모든 자격증명을 집계합니다. OpenLegion은 모델이 결코 읽지 않는 볼트에 자격증명을 보관하고, 모든 작업에 자체 샌드박스 실행을 부여하며, 탈취될 상주 에이전트 프로세스를 남기지 않습니다.

### 배포 차이점은 무엇입니까?

LiteLLM은 샌드박싱이나 권한 분리 없이 기본 Docker 이미지에서 root로 실행됩니다. OpenLegion은 배포할 것이 없는 호스팅 웹 앱으로, 각 작업이 기본적으로 네트워크 접근 없는 샌드박스에서 필요할 때만 실행됩니다.

### LiteLLM에서 OpenLegion으로 마이그레이션할 수 있습니까?

예. 모델을 에이전트별 또는 워크스페이스별 프리셋으로 선택하므로 옮길 공급자 구성이 없으며, 필요한 자격증명은 볼트로 이전됩니다.

**지금 OpenLegion을 사용해 보세요.**
[시작하기](https://app.openlegion.ai) | [문서 읽기](https://docs.openlegion.ai) | [AI 에이전트 보안 아키텍처 비교](/learn/ai-agent-security)
