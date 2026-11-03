---
title: Mastra 替代方案—安全优先的 AI 智能体平台比较
description: Mastra 是双重许可证、RBAC 魁于专有 ee/ 目录、CVE-2025-61685 暴露凭据的 TypeScript 岂框架。比较 Mastra 替代方案。
slug: /comparison/mastra
primary_keyword: mastra 替代
secondary_keywords:
  - openlegion vs mastra
  - mastra 安全
  - mastra typescript 智能体
  - mastra 企业版
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

# Mastra 替代方案：安全优先平台 vs TypeScript 优先框架

Mastra 是由 Gatsby 团队打造、拥有24,329 个 GitHub star 的 TypeScript 智能体框架。CVE-2025-61685（CVSS 6.5）通过 Cursor IDE 提示注入暴露凭据文件，RBAC 和 Auth 锁在 Apache 2.0 下不可用的专有 ee/ 目录中，两个安全 PR 截至 2026 年 5 月仍未合并。

<!-- SCHEMA: DefinitionBlock -->

> **什么是 Mastra？**
> Mastra 是 Kepler Software（Gatsby 团队）开发的开源 TypeScript 智能体框架，拥有24,329 个 GitHub star，2024 年 8 月发布。基于双重许可证，为 JavaScript/TypeScript 开发者提供工作流编排、工具调用和 RAG 原语。

## 开发者寇找 Mastra 替代方案的原因

### CVE-2025-61685：通过 MCP Docs 服务器暴露凭据文件

CVE-2025-61685（CVSS 6.5，CWE-548，2025 年 9 月 24 日）是 @mastra/mcp-docs-server 版本 ≤0.13.8 的目录遍历漏洞。由 Liran Tal 发现，Cursor IDE 提示注入可绕过 readMdxContent 的验证，访问 ~/.aws/credentials、~/.config/、~/.cursor/ 文件。Mastra 在 0.17.0 修复了该漏洞。

### 双重许可证：ee/ 付费壁后的安全功能

Mastra 的 Apache 2.0 许可证仅涵盖核心框架。ee/ 目录包含 Auth 集成、RBAC 和适配器权限，属于专有财产。

**RBAC 是企业级功能。** 控制特定智能体的权限需要 ee/ 升级。

**Auth 集成属于专有。** ee/ 目录包含 WorkOS AuthKit（@workos/authkit-session）和 better-auth OAuth 流程。

### 企业 Auth 堆栈中未合并的安全 PR

**CVE-2026-42565（CVSS 4.3）**：@workos/authkit-session 中的开放重定向。允许通过可信域名重定向链进行钓鱼攻击。

**GHSA-wxw3-q3m9-c3jr（CVSS 5.3）**：better-auth 中的 OAuth CSRF。OAuth 回调处理中存在未修复的 CSRF 漏洞。
## OpenLegion 的观点：三个结构性安全缺口

**设计导致凭据暴露。** Mastra 智能体通过环境变量接收凭据。CVE-2025-61685 表明，即使智能体代码本身干净，周边工具链也可到达凭据。OpenLegion 把凭据保存在密钥库中并在模型之外注入，智能体的运行过程永远不会收到明文 API 密钥。

**安全功能需付费升级。** RBAC、适配器访问控制和 Auth 集成需要专有 ee/ 层。OpenLegion 的凭证密钥库、沙箱化的任务运行和单智能体工具授权是所有用户的核心功能。

**付费层存在未修复的 Auth 漏洞。** CVE-2026-42565 和 GHSA-wxw3-q3m9-c3jr 在企业 ee/ 目录的 Auth 依赖项中。OpenLegion 从根上移除了这一类暴露：智能体从不持有凭据，密钥库在模型之外注入它们，而不是把 Auth 当成一个额外模块挂上去。

## Mastra vs OpenLegion: 对比表

| **维度** | **Mastra** | **OpenLegion** |
|---|---|---|
| **语言支持** | 仅 TypeScript | 无 —— 智能体在 Web 应用中配置 |
| **许可证** | Apache 2.0（核心）+ 专有 ee/ | PolyForm Perimeter License 1.0.1（引擎） |
| **GitHub star** | 24,329（2026 年 5 月） | 预发布 |
| **凭据模型** | 环境变量 — 智能体持有密钥 | 密钥库托管 — 智能体不持有密钥 |
| **智能体隔离** | 进程级别 | 每个任务一次沙箱化运行 |
| **RBAC** | 仅专有 ee/ 层 | 每个智能体的工具与密钥库授权（所有用户） |
| **CVE 记录** | CVE-2025-61685（CVSS 6.5）+ 2 个未关闭 PR | 预发布 |
| **Auth** | WorkOS AuthKit / better-auth（仅 ee/） | Google 登录；凭据留在密钥库中 |
| **预算控制** | 无 | 每个智能体的积分预算 |
| **多智能体** | 工作流编排 | 先目标、再任务、再智能体，并带委派 |
| **未关闭 Issue** | 433（2026 年 5 月 26 日） | 预发布 |

## 仅支持 TypeScript：实务影响

Mastra 是 TypeScript-first 设计，目前仅支持 TypeScript。需要 Python 的团队不适合使用。LangGraph、CrewAI 和 AutoGen 均原生支持 Python；OpenLegion 则根本不需要任何 SDK。

TypeScript 全栈团队的开发体验非常好。工具模式类型推断、Node.js 生态笼紧密集成、熟悉的 async/await 模式提供了公蒸的开发体验。

## 安全架构：金库代理 vs 环境变量

Mastra 智能体通过 process.env 接收 LLM API 密钥和服务凭据。CVE-2025-61685 表明 @mastra/mcp-docs-server 的目录遍历可到达 ~/.aws/credentials。

OpenLegion 的凭证密钥库位于模型之外，处在智能体与它所调用服务之间。模型永远不会收到凭据字符串。详细分析请参阅 [AI 智能体安全：凭据隔离与容器加固](/learn/ai-agent-security)。

## 作为 Mastra 替代方案的 OpenLegion

通过目标、任务与智能体，配合事件唤醒和委派进行多智能体协同。凭据由密钥库在模型之外注入。每个任务一次沙箱化运行。每个智能体一份积分预算，按每积分 $0.001 计量。模型通过预设选择——最智能、智能或普通。

**诚实的权衡**：没有任何 SDK 可以导入——OpenLegion 是托管 Web 应用，不是嵌入你自己服务里的库。社区规模小于 Mastra 的 24,329 star。

[了解 AI 智能体平台超越框架的价值](/learn/ai-agent-platform)。另请参阅 [OpenLegion vs LangGraph](/comparison/langgraph)、[OpenLegion vs CrewAI](/comparison/crewai)、[OpenLegion vs AutoGen](/comparison/autogen)。[2026 年 AI 智能体框架对比](/learn/ai-agent-frameworks)提供全景视图。
<!-- SCHEMA: FAQPage -->

## 常见问题

### Mastra 是什么？谁开发的？

Mastra 是 Kepler Software（Gatsby 团队）自 2024 年 8 月起开发的 TypeScript 智能体框架，拥有24,329 个 GitHub star。基于双重许可证，为 TypeScript 开发者提供工作流编排、工具调用和 RAG 原语。

### Mastra 的 CVE-2025-61685 是什么？

CVE-2025-61685（CVSS 6.5，2025 年 9 月 24 日）是由 Liran Tal 发现的 @mastra/mcp-docs-server ≤0.13.8 目录遍历漏洞。Cursor IDE 提示注入绕过 readMdxContent 的路径验证，暴露 ~/.aws/credentials、~/.config/、~/.cursor/ 文件。Mastra 在 0.17.0 修复了该漏洞。

### Mastra 免费层有 RBAC 吗？

没有。RBAC、适配器权限和 Auth 集成均在 Mastra 专有 ee/ 目录中， Apache 2.0 开源许可证下不可用。OpenLegion 将每个智能体的工具授权和密钥库托管的凭据作为核心平台功能向所有用户提供。

### 2026 年 5 月，Mastra 有哪些未修复的安全问题？

Mastra 企业 Auth 堆栈中有两个安全 PR 仍未合并：CVE-2026-42565（CVSS 4.3，@workos/authkit-session 开放重定向）和 GHSA-wxw3-q3m9-c3jr（CVSS 5.3，better-auth OAuth CSRF）。截至 2026 年 5 月 26 日，均未合并。

### TypeScript 开发者能使用 OpenLegion 吗？

OpenLegion 不是任何语言的 SDK。它是一个托管 Web 应用：用 Google 登录，在浏览器中配置智能体——没有 TypeScript 包可以导入。当安全隔离要求高于语言偏好时，OpenLegion 是合适的选择。

### Mastra 生产环境够稳定吗？

Mastra 拥有24,329 个 GitHub star 和自 2024 年 8 月以来活跃的开发，2026 年 5 月 26 日有 433 个未关闭 Issue。生产环境采用 Mastra 的团队应固定到稳定版本、将 @mastra/mcp-docs-server 升级到 0.17.0+，并在依赖企业 Auth 功能前计划修复 CVE-2026-42565 和 GHSA-wxw3-q3m9-c3jr。

## 开始使用

OpenLegion 免费提供试用。[app.openlegion.ai 注册](https://app.openlegion.ai) 或[阅读平台文档](https://docs.openlegion.ai)。[OpenLegion vs LangGraph — 安全架构与 CVE 历史对比](/comparison/langgraph)。
