---
title: Mastra 대안 — 보안 우선 AI 에이전트 플랫폼 비교
description: Mastra는 이중 라이선스, 전용 ee/ 뒤 RBAC, CVE-2025-61685로 자격 증명을 노출하는 TypeScript 프레임워크입니다. Mastra 대안을 비교하세요.
slug: /comparison/mastra
primary_keyword: mastra 대안
secondary_keywords:
  - openlegion vs mastra
  - mastra 보안
  - mastra typescript 에이전트
  - mastra 엔터프라이즈
last_updated: "2026-05-26"
schema_types:
  - FAQPage
page_type: comparison
related:
  - /comparison/langgraph
  - /comparison/crewai
  - /comparison/autogen
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-platform
---

# Mastra 대안: 보안 우선 플랫폼 vs TypeScript 우선 프레임워크

Mastra는 Gatsby 팀이 만든 24,329개의 GitHub 스타를 보유한 TypeScript 에이전트 프레임워크입니다. CVE-2025-61685(CVSS 6.5)는 Cursor IDE 프롬프트 인젝션을 통해 자격 증명 파일을 노출하고, RBAC와 Auth는 Apache 2.0으로는 이용할 수 없는 전용 ee/ 디렉터리에 잠겨 있으며, 두 개의 미병합 PR이 2026년 5월 기준으로 여전히 미패치 상태입니다. 보안 우선 팀에게 필요한 Mastra 대안은 볼트 프록시 격리가 필요합니다.

<!-- SCHEMA: DefinitionBlock -->

> **Mastra란 무엇인가?**
> Mastra는 Kepler Software(Gatsby 팀)가 만든 오픈소스 TypeScript 에이전트 프레임워크로 24,329개의 GitHub 스타를 보유하며 2024년 8월에 출시되었습니다. 이중 라이선스 하에 워크플로우 오케스트레이션, 도구 호출, RAG 프리미티브를 제공합니다.
## Mastra 대안을 찾는 이유

### CVE-2025-61685: MCP Docs 서버를 통한 자격 증명 파일 노출

CVE-2025-61685(CVSS 6.5, CWE-548, 2025년 9월 24일)는 @mastra/mcp-docs-server 버전 ≤0.13.8의 디렉터리 탐색 취약점입니다. Liran Tal이 발견했으며, Cursor IDE 프롬프트 인젝션이 readMdxContent의 유효성 검사를 우회하여 ~/.aws/credentials, ~/.config/, ~/.cursor/ 파일을 노출합니다. Mastra는 버전 0.17.0에서 패치했습니다. ≤0.13.8을 실행 중인 팀은 계속 노출됩니다.

### 이중 라이선스: ee/ 유료 장벽 뒤의 보안 기능

Mastra의 Apache 2.0 라이선스는 코어 프레임워크에만 적용됩니다. Auth 통합, RBAC, 어댑터 권한 시행을 포함한 ee/ 디렉터리는 전용 재산입니다.

**RBAC는 엔터프라이즈 추가 기능입니다.** 특정 에이전트의 권한을 제어하려면 ee/ 업그레이드가 필요합니다.

**어댑터 권한은 제한됩니다.** 다중 테넌트 에이전트 배포에서 격리와 공유 액세스의 차이입니다.

**Auth 통합은 전용입니다.** ee/ 디렉터리에는 WorkOS AuthKit(@workos/authkit-session)과 better-auth OAuth 플로우가 포함됩니다.

### 엔터프라이즈 Auth 스택의 미병합 보안 PR

**CVE-2026-42565(CVSS 4.3)**: @workos/authkit-session의 오픈 리다이렉트. 신뢰할 수 있는 도메인 리다이렉트 체인을 통한 피싱을 가능하게 합니다.

**GHSA-wxw3-q3m9-c3jr(CVSS 5.3)**: better-auth의 OAuth CSRF. OAuth 콜백 처리에 미패치 CSRF 취약점이 있습니다.
## OpenLegion의 견해: 세 가지 구조적 보안 격차

**설계에 의한 자격 증명 노출.** Mastra 에이전트는 환경 변수로 자격 증명을 받습니다. CVE-2025-61685는 주변 툴체인이 에이전트 코드가 깨끗해도 자격 증명에 접근할 수 있음을 보여주었습니다. OpenLegion의 볼트 프록시는 네트워크 계층에서 자격 증명을 주입합니다. 에이전트 프로세스는 평문 API 키를 절대 받지 않습니다.

**보안의 엔터프라이즈 업그레이드.** RBAC, 어댑터 접근 제어, Auth 통합은 전용 ee/ 티어가 필요합니다. OpenLegion의 볼트 프록시와 블랙보드 권한은 모든 사용자를 위한 핵심 기능입니다.

**유료 티어에 미패치 Auth 취약점.** CVE-2026-42565와 GHSA-wxw3-q3m9-c3jr은 엔터프라이즈 ee/ 디렉터리의 Auth 의존성에 있습니다. OpenLegion의 Zero CVE 실적(2026년 5월 기준)은 에이전트가 자격 증명을 보유하지 않는 아키텍처를 반영합니다.

## Mastra vs OpenLegion: 비교표

| **항목** | **Mastra** | **OpenLegion** |
|---|---|---|
| **언어 지원** | TypeScript만 | Python(에이전트); 임의 언어 도구 인터페이스 |
| **라이선스** | Apache 2.0 (코어) + 전용 ee/ | BSL 1.1 → 4년 후 Apache 2.0 |
| **GitHub 스타** | 24,329 (2026년 5월) | 프리릴리스 |
| **자격 증명 모델** | 환경 변수 — 에이전트가 키 보유 | 볼트 프록시 — 에이전트는 키 미보유 |
| **에이전트 격리** | 프로세스 수준 | 필수 Docker 컨테이너 |
| **RBAC** | 전용 ee/ 티어만 | 에이전트별 블랙보드 권한 (모든 사용자) |
| **CVE 이력** | CVE-2025-61685 (CVSS 6.5) + 2개의 오픈 PR | 0 CVE 보고 |
| **Auth** | WorkOS AuthKit / better-auth (ee/만) | 볼트 프록시 (Auth 계층 불필요) |
| **예산 제어** | 없음 | 에이전트별 일일/월별 한도 |
| **멀티 에이전트** | 워크플로우 오케스트레이션 | Blackboard + pub/sub + mesh handoff |
| **오픈 이슈** | 433 (2026년 5월 26일) | 프리릴리스 |
## TypeScript 전용: 실무상의 의미

Mastra는 TypeScript-first 설계로 현재 TypeScript만 지원합니다. Python이 필요한 팀에는 적합하지 않습니다. OpenLegion, LangGraph, CrewAI, AutoGen은 모두 Python을 네이티브로 지원합니다.

TypeScript 풀스택 팀에게 Mastra의 개발자 경험은 뛰어납니다. 도구 스키마의 타입 추론, Node.js 에코시스템과의 긴밀한 통합, async/await 패턴이 자연스러운 개발 경험을 제공합니다.

## 보안 아키텍처: 볼트 프록시 vs 환경 변수

Mastra 에이전트는 process.env를 통해 LLM API 키와 서비스 자격 증명을 받습니다. CVE-2025-61685는 @mastra/mcp-docs-server의 디렉터리 탐색이 ~/.aws/credentials에 도달할 수 있음을 보여주었습니다.

OpenLegion의 볼트 프록시는 에이전트와 LLM 공급자 사이의 네트워크 계층에 위치합니다. 에이전트 프로세스는 자격 증명 문자열을 절대 받지 않습니다. 자세한 분석은 [AI 에이전트 보안: 자격 증명 격리 및 컨테이너 강화](/learn/ai-agent-security)를 참조하세요.

## Mastra 대안으로서의 OpenLegion

Blackboard 상태, pub/sub 이벤트, mesh handoff를 통한 멀티 에이전트 협조. 볼트 프록시 자격 증명 주입. Docker 레이어 격리. 에이전트별 일일/월볔 예산 한도. LiteLLM을 통한 100+ LLM 공급자.

**솔직한 트레이드오프**: TypeScript SDK 없음 — Python만 지원. Mastra의 24,329 스타보다 작은 커뮤니티.

[AI 에이전트 플랫폼이 프레임워크를 넘어 제공하는 것](/learn/ai-agent-platform)도 다루고 있습니다. [OpenLegion vs LangGraph](/comparison/langgraph), [OpenLegion vs CrewAI](/comparison/crewai), [OpenLegion vs AutoGen](/comparison/autogen)도 확인하세요. [AI 에이전트 프레임워크 비교 2026](/learn/ai-agent-frameworks)에서 전체 그림을 확인할 수 있습니다.
<!-- SCHEMA: FAQPage -->

## 자주 묻는 질문

### Mastra란 무엇이며 누가 만든나요?

Mastra는 Kepler Software(Gatsby 팀)가 2024년 8월부터 개발한 24,329개의 GitHub 스타를 보유한 TypeScript 에이전트 프레임워크입니다. 이중 라이선스 하에 TypeScript 개발자를 위한 워크플로우 오케스트레이션, 도구 호출, RAG 프리미티브를 제공합니다.

### Mastra의 CVE-2025-61685는 무엇인가요?

CVE-2025-61685(CVSS 6.5, 2025년 9월 24일)는 Liran Tal이 발견한 @mastra/mcp-docs-server ≤0.13.8의 디렉터리 탐색 취약점입니다. Cursor IDE 프롬프트 인젝션이 readMdxContent의 경로 탐색 보호를 우회하여 ~/.aws/credentials, ~/.config/, ~/.cursor/ 파일을 노출합니다. Mastra는 버전 0.17.0에서 패치했습니다.

### Mastra에 무료 티어 RBAC가 있나요?

없습니다. RBAC, 어댑터 권한, Auth 통합은 Mastra의 전용 ee/ 디렉터리에 있으며 Apache 2.0 오픈소스 라이선스로는 이용할 수 없습니다. OpenLegion은 에이전트별 블랙보드 권한과 볼트 프록시 격리를 모든 사용자를 위한 핵심 플랫폼 기능으로 제공합니다.

### 2026년 5월 기준 Mastra의 미패치 보안 문제는?

Mastra의 엔터프라이즈 Auth 스택에 두 개의 보안 PR이 미병합 상태로 남아 있습니다: CVE-2026-42565(CVSS 4.3, @workos/authkit-session의 오픈 리다이렉트)와 GHSA-wxw3-q3m9-c3jr(CVSS 5.3, better-auth의 OAuth CSRF). 2026년 5월 26일 기준으로 어느 것도 병합되지 않았습니다.

### TypeScript 개발자도 OpenLegion을 사용할 수 있나요?

OpenLegion 에이전트는 Python만 지원합니다. TypeScript 팀은 Python 에이전트를 실행하거나 OpenLegion API를 호출하는 TypeScript 툴링을 구축해야 합니다. 네이티브 TypeScript SDK는 없습니다. 보안 격리 요구사항이 언어 선호도보다 중요할 때 OpenLegion이 적합한 선택입니다.

### Mastra는 프로덕션 사용에 충분히 안정적인가요?

Mastra는 24,329개의 GitHub 스타와 2024년 8월부터의 활발한 개발을 보유하며 2026년 5월 26일 기준으로 433개의 오픈 이슈가 있습니다. 프로덕션 환경에서 Mastra를 체택하는 팀은 안정적인 릴리스에 고정하고 @mastra/mcp-docs-server를 0.17.0+로 업그레이드하며 CVE-2026-42565와 GHSA-wxw3-q3m9-c3jr의 상위 수정 사항을 계획해야 합니다.

## 시작하기

OpenLegion은 무료로 시도할 수 있습니다. [app.openlegion.ai에서 시작하기](https://app.openlegion.ai) 또는 [플랫폼 문서 읽기](https://docs.openlegion.ai). TypeScript 프레임워크를 평가 중이신가요? [OpenLegion vs LangGraph — 보안 아키텍처와 CVE 이력 비교](/comparison/langgraph)를 확인하세요.
