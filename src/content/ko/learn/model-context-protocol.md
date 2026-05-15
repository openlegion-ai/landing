---
title: Model Context Protocol (MCP) — AI 에이전트가 도구를 사용하는 방법
description: >-
  Model Context Protocol(MCP)은 AI 에이전트가 외부 도구를 검색하고 호출할 수 있게 하는 Anthropic의 오픈 표준입니다.
  작동 방식, 보안 주의사항, OpenLegion의 MCP 지원.
slug: /learn/model-context-protocol
primary_keyword: model context protocol
secondary_keywords:
  - MCP
  - MCP server
  - MCP client
  - MCP integration
  - anthropic mcp
  - mcp tools
  - mcp security
  - mcp agents
date_published: 2026-05
last_updated: 2026-05
page_type: learn
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-observability
  - /learn/ai-agent-platform
  - /learn/ai-agent-frameworks
  - /learn/ai-agent-security
  - /comparison
---

# Model Context Protocol: AI 에이전트 도구를 위한 오픈 표준

**Model Context Protocol**(MCP)은 Anthropic이 2024년 11월에 발표한 오픈 표준으로, AI 에이전트가 맞춤 글루 코드를 작성하지 않고 외부 도구 — 데이터베이스, 파일시스템, API, 내부 서비스 — 를 검색하고 호출할 수 있게 합니다. MCP 서버는 기능을 노출하고, MCP 클라이언트(에이전트 런타임, IDE, 어시스턴트)는 이를 소비합니다. 프로토콜은 의도적으로 미니멀하며, 이는 또한 프로덕션에서의 함정이기도 합니다: 배포는 안전하게 실행하기 전에 인증, 샌드박싱, 도구별 예산을 그 위에 레이어로 두어야 합니다.

<!-- SCHEMA: DefinitionBlock -->

> **Model Context Protocol이란 무엇입니까?**
> Model Context Protocol은 원래 Anthropic이 발표한 JSON-RPC 기반 오픈 표준으로, AI 에이전트(클라이언트)가 도구(서버)에 의해 노출되는 기능을 어떻게 검색하고 호출하는지 정의합니다. 에디터를 위한 LSP나 하드웨어를 위한 USB와 동등한 AI 에이전트 생태계의 표준입니다: 하나의 프로토콜, 다수의 구현.

## 핵심 요약

- **MCP는 에이전트 생태계의 USB 포트입니다** — 호환 에이전트 런타임이 커스텀 글루 코드 없이 호환 도구 서버를 사용할 수 있게 하는 하나의 프로토콜.
- **Anthropic은 2024년 11월 MCP를 발표했습니다**. 2025년의 주요 채택자에는 OpenAI, Microsoft Copilot, Cursor, Zed, Continue, 대부분의 에이전트 프레임워크가 포함됩니다.
- **MCP는 네 가지 프리미티브 유형을 정의합니다**: tools(함수 스타일 호출), resources(읽기 전용 데이터), prompts(재사용 가능한 템플릿), sampling(서버가 시작한 클라이언트로의 LLM 호출).
- **전송은 stdio 또는 HTTP/SSE를 통한 JSON-RPC**입니다. stdio는 지배적인 로컬 형태이고, HTTP/SSE는 원격 MCP 서버에서 점차 사용되고 있습니다.
- **프로덕션 MCP는 대부분의 튜토리얼이 건너뛰는 세 가지 레이어를 요구합니다**: 도구 호출에 대한 인증, 샌드박싱, 예산 시행.

## MCP가 작동하는 방식

MCP 클라이언트(에이전트 런타임 또는 AI 어시스턴트)는 하나 이상의 MCP 서버에 연결합니다. 연결 시 클라이언트는 기능 목록을 요청합니다 — 이 서버가 어떤 tools, resources, prompts를 제공합니까? 각 도구는 인수에 대한 JSON 스키마를 광고합니다. 에이전트의 LLM은 도구 목록을 컨텍스트의 일부로 보고 그에 따라 도구 호출을 선택합니다. 클라이언트는 호출을 올바른 서버로 라우팅하고, JSON을 마샬링하며, 결과를 반환합니다.

전송은 JSON-RPC 2.0입니다. 두 가지 전송이 일반적입니다: stdio(클라이언트가 서버를 서브프로세스로 스폰하고 stdin/stdout으로 통신 — Claude Desktop의 기본값)와 네트워크 경계를 가로지르는 원격 서버를 위한 Server-Sent Events가 있는 HTTP.

프로토콜 자체는 의도적으로 미니멀합니다. 복잡성은 MCP 서버가 노출하는 것에 있습니다: 파일시스템 서버는 에이전트에게 디렉토리에 대한 읽기 및 쓰기 접근을 제공하고, Postgres 서버는 쿼리 접근을 제공하고, Slack 서버는 메시지 전송 및 채널 읽기 기능을 제공합니다. 동일한 에이전트가 여러 서버에 동시에 연결할 수 있습니다.

## MCP 서버 vs MCP 클라이언트

**MCP 서버**는 도구 측입니다. 누구나 작성할 수 있습니다 — Anthropic은 Python과 TypeScript로 레퍼런스 SDK를 발표합니다. 2026년 중반 기준으로 GitHub, Notion, Linear, Postgres, AWS, 브라우저 자동화 외 다수를 커버하는 수천 개의 커뮤니티 서버가 있습니다. 프로토콜이 대부분의 작업을 하기 때문에 서버는 작은 경향이 있습니다(수백 줄).

**MCP 클라이언트**는 에이전트 런타임, IDE, 어시스턴트입니다. Claude Desktop이 레퍼런스 클라이언트였습니다. Cursor, Zed, Continue, Windsurf, 대부분의 에이전트 프레임워크가 2025년 동안 MCP 클라이언트 지원을 추가했습니다. 단일 MCP 클라이언트는 일반적으로 여러 동시 서버 연결을 지원합니다 — 하나의 에이전트가 파일시스템 서버, 데이터베이스 서버, Slack 서버와 동시에 통신.

핵심 통찰: LLM은 MCP를 직접 말하지 않습니다. 클라이언트가 MCP 도구 목록을 LLM 프롬프트 내부의 함수 정의로 렌더링하고, LLM이 함수 호출을 발행하고, 클라이언트가 호출을 올바른 MCP 서버에 매핑해 JSON-RPC 요청을 전달합니다.

## 프로덕션 MCP를 위한 보안 고려사항

MCP는 *기능 노출* 프로토콜입니다 — 인가 또는 감사 프로토콜이 아닙니다. 프로덕션 배포는 MCP가 의도적으로 빼놓은 부분을 추가해야 합니다:

- **인증**: 대부분의 MCP 서버는 로컬에서 인증 없이 실행됩니다. 멀티 테넌트 배포는 에이전트별 자격 증명과 서버별 인증 경계가 필요합니다.
- **샌드박싱**: 광범위한 경로 접근이 있는 MCP 파일시스템 서버는 기능적으로 호스트의 루트입니다. MCP 서버를 컨테이너에서 실행하십시오. 민감한 볼륨을 맹목적으로 마운트하지 마십시오.
- **예산 시행**: 도구 호출은 무료가 아닙니다. 루프에서 MCP 웹 스크레이핑 서버를 호출하는 에이전트는 심각한 비용을 누적할 수 있습니다. 에이전트별 예산은 LLM 토큰뿐만 아니라 도구 호출도 커버해야 합니다.
- **감사 로그**: MCP 자체는 호출 로깅을 표준화하지 않습니다. 프로덕션 런타임은 [AI 에이전트 보안](/learn/ai-agent-security) 검토 및 인시던트 대응을 위해 인수, 응답 형태, 타이밍과 함께 모든 서버 호출을 기록해야 합니다.

레퍼런스 Claude Desktop MCP 통합은 서버를 호스트 사용자의 파일시스템 권한으로 호스트 서브프로세스로 마운트합니다. 이는 단일 사용자 개발자 셋업에서는 작동합니다. 프로덕션 안전하지는 않습니다.

## OpenLegion이 MCP를 통합하는 방법

OpenLegion은 기본적으로 MCP 클라이언트입니다. 런타임의 에이전트는 자신의 플릿에 구성된 MCP 서버를 자동 검색하고, 컨텍스트 윈도우에서 도구 목록을 보고, 내장 스킬과 동일한 볼트 프록시, ACL 게이트 경로를 통해 MCP 도구를 호출합니다. 메시는 MCP가 빼놓은 프로덕션급 레이어를 시행합니다:

- 각 MCP 서버는 자체 샌드박스 네임스페이스에서 실행됩니다. 에이전트는 서버 프로세스에 대한 직접적인 stdio 접근을 절대 받지 못합니다.
- 에이전트별 ACL은 주어진 에이전트가 호출할 수 있는 MCP 서버를 게이트합니다.
- 모든 도구 호출은 에이전트의 에이전트별 예산에 산정됩니다. 한도를 초과한 에이전트는 지출이 LLM에서 왔든 MCP 도구에서 왔든 차단됩니다.
- 메시는 모든 MCP 호출을 트레이스 로그에 기록합니다 — [AI 에이전트 관측 가능성](/learn/ai-agent-observability)에서 다루는 동일한 텔레메트리.

결과: MCP 생태계의 폭을 그 기본 신뢰 가정을 상속받지 않고 얻습니다.

## OpenLegion의 견해

MCP는 OpenAPI 이후 가장 중요한 에이전트 생태계 표준입니다 — 그렇지 않으면 N × M 통합 작업(모든 에이전트 프레임워크 × 모든 도구)이 되었을 일을 N + M 서버와 클라이언트로 압축합니다. 그러나 프로토콜의 의도적인 미니멀리즘은 프로덕션 팀이 독점 시스템이 번들했던 지루한 인프라 — 인증, 샌드박싱, 예산, 감사 — 를 재구축해야 함을 의미합니다. MCP를 그러한 관심사를 레이어링하지 않고 그냥 추가하는 것으로 취급하는 프레임워크는 기본적으로 안전하지 않은 에이전트를 출시합니다. MCP를 충분히 진지하게 받아들여 제약하는 [AI 에이전트 플랫폼](/learn/ai-agent-platform)을 선택하십시오.

## CTA

**프로덕션급 통제가 내장된 MCP 호환 에이전트를 배포하십시오.**
[지금 시작하기](https://app.openlegion.ai) | [문서 보기](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## 자주 묻는 질문

### Model Context Protocol이란 무엇입니까?

Model Context Protocol(MCP)은 Anthropic이 2024년 11월에 도입한 오픈 JSON-RPC 표준으로, AI 에이전트가 균일한 인터페이스를 통해 외부 도구를 검색하고 호출할 수 있게 합니다. MCP 서버는 기능(tools, resources, prompts)을 노출하고, MCP 클라이언트(에이전트 런타임, IDE, 어시스턴트)는 이를 소비합니다. 2025년의 주요 채택자에는 OpenAI, Microsoft Copilot, Cursor, Zed, 대부분의 에이전트 프레임워크가 포함됩니다.

### 누가 MCP를 만들었고 오픈 표준입니까?

Anthropic이 MCP를 만들었고 Python과 TypeScript의 레퍼런스 SDK와 함께 오픈 사양으로 공개했습니다. 사양은 GitHub를 통해 커뮤니티 거버넌스되며, 라이선싱이나 독점 락인이 없습니다. 누구나 MCP 서버 또는 클라이언트를 작성할 수 있으며, 주요 LLM 제공자는 MCP 호환 도구를 출시합니다.

### MCP 서버와 MCP 클라이언트의 차이는 무엇입니까?

MCP 서버는 기능을 노출합니다 — Postgres 서버는 쿼리 도구를 노출하고, 파일시스템 서버는 파일 읽기 및 쓰기를 노출하며, Slack 서버는 메시지 전송을 노출합니다. MCP 클라이언트는 소비자 측입니다 — 일반적으로 에이전트 런타임, IDE 또는 AI 어시스턴트. 클라이언트는 여러 서버에 동시에 연결할 수 있으며, 서버는 여러 클라이언트에 의해 재사용될 수 있습니다.

### MCP는 기본적으로 안전합니까?

아니요 — 그리고 그것은 의도적입니다. MCP는 기능 노출 프로토콜이며 인가 프로토콜이 아닙니다. 레퍼런스 구현(Claude Desktop, SDK 예제)은 서버를 사용자의 파일시스템 권한으로 호스트 서브프로세스로 인증 없이 실행합니다. 프로덕션 배포는 MCP 자체 위에 인증, 샌드박싱, 도구별 예산, 감사 로깅을 추가해야 합니다.

### MCP는 OpenAI 함수 호출과 어떻게 비교됩니까?

OpenAI 함수 호출은 하나의 LLM이 API 요청에 정의된 함수를 호출하게 하는 단일 벤더 패턴입니다 — 도구가 시스템 전반에서 어떻게 검색되고, 패키징되고, 공유되는지 표준화하지 않습니다. MCP는 동일한 문제를 생태계 수준에서 다루는 크로스 벤더 오픈 표준입니다. 두 가지는 보완적입니다: MCP 서버는 기능을 노출하고, MCP 클라이언트는 GPT 모델을 호출할 때 OpenAI 형식의 함수 정의로 또는 Claude를 호출할 때 Anthropic 도구 사용 형식으로 렌더링할 수 있습니다.

### 모든 LLM 제공자에서 MCP를 사용할 수 있습니까?

가능합니다. MCP는 LLM 불가지론입니다 — 클라이언트는 MCP 도구 정의를 기반 LLM이 기대하는 모든 형식(Anthropic 도구 사용, OpenAI 함수 호출, Gemini 함수 선언)으로 렌더링합니다. LiteLLM을 통해 100+ 제공자를 지원하는 OpenLegion 같은 런타임은 MCP 도구를 각 제공자의 호출 컨벤션에 자동으로 적응시킵니다.
