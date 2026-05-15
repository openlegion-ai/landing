---
title: 模型上下文协议（MCP） — AI 智能体如何使用工具
description: >-
  模型上下文协议（MCP）是 Anthropic 推出的开放标准，让 AI 智能体能发现并调用外部工具。它的工作原理、安全注意事项以及 OpenLegion 的 MCP 支持。
slug: /learn/model-context-protocol
primary_keyword: 模型上下文协议
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

# 模型上下文协议：AI 智能体工具的开放标准

**模型上下文协议**（MCP）是 Anthropic 在 2024 年 11 月发布的开放标准，让 AI 智能体能发现并调用外部工具——数据库、文件系统、API、内部服务——而无需编写定制的胶水代码。MCP 服务器暴露能力；MCP 客户端（智能体运行时、IDE、助手）消费它们。该协议刻意保持极简，这同时也是其生产隐患：在投产之前，部署必须在其之上叠加身份认证、沙箱和按工具的预算控制。

<!-- SCHEMA: DefinitionBlock -->

> **什么是模型上下文协议？**
> 模型上下文协议是一个开放、基于 JSON-RPC 的标准，最初由 Anthropic 发布，定义了 AI 智能体（客户端）如何发现并调用工具（服务器）暴露的能力。它对 AI 智能体生态的意义就像 LSP 之于编辑器或 USB 之于硬件：一个协议，多个实现。

## 摘要

- **MCP 是智能体生态的 USB 接口** —— 一个协议让任何合规的智能体运行时都能使用任何合规的工具服务器，无需编写定制胶水代码。
- **Anthropic 于 2024 年 11 月发布 MCP**；2025 年期间的主要采纳者包括 OpenAI、Microsoft Copilot、Cursor、Zed、Continue 以及大多数智能体框架。
- **MCP 定义了四种原语类型**：tools（函数式调用）、resources（只读数据）、prompts（可复用模板）和 sampling（服务器主动向客户端发起的 LLM 调用）。
- **传输是基于 stdio 或 HTTP/SSE 的 JSON-RPC。** stdio 是主流的本地形式；HTTP/SSE 正在远程 MCP 服务器中逐渐普及。
- **生产级 MCP 需要多数教程跳过的三层**：在工具调用上的身份认证、沙箱和预算执行。

## MCP 如何工作

MCP 客户端（智能体运行时或 AI 助手）连接到一个或多个 MCP 服务器。建立连接时，客户端请求一份能力清单——该服务器提供哪些工具、资源和提示词？每个工具会公布其参数的 JSON Schema。智能体的 LLM 把工具列表视为上下文的一部分，并据此选择工具调用。客户端将调用路由到正确的服务器、组装 JSON 并返回结果。

传输是 JSON-RPC 2.0。常见的两种传输：stdio（客户端把服务器作为子进程启动，通过 stdin/stdout 通信——Claude Desktop 的默认方式）和带 Server-Sent Events 的 HTTP，用于跨网络边界的远程服务器。

协议本身刻意保持极简。复杂性在于 MCP 服务器暴露的内容：文件系统服务器赋予智能体对某个目录的读写访问；Postgres 服务器赋予查询访问；Slack 服务器赋予消息发送和频道读取能力。同一个智能体可以同时连接到多个服务器。

## MCP 服务器 vs MCP 客户端

**MCP 服务器** 是工具端。任何人都可以写一个——Anthropic 发布了 Python 和 TypeScript 的参考 SDK。截至 2026 年中，社区已有数千个服务器，覆盖 GitHub、Notion、Linear、Postgres、AWS、浏览器自动化等。服务器往往很小（几百行），因为大部分工作由协议完成。

**MCP 客户端** 是智能体运行时、IDE 和助手。Claude Desktop 是参考客户端。Cursor、Zed、Continue、Windsurf 以及大多数智能体框架在 2025 年期间加入了 MCP 客户端支持。单一 MCP 客户端通常支持多个并发的服务器连接——一个智能体同时与文件系统服务器、数据库服务器和 Slack 服务器对话。

关键洞察：LLM 本身不直接说 MCP。客户端将 MCP 工具列表渲染为 LLM 提示词中的函数定义；LLM 发出函数调用；客户端将该调用映射到正确的 MCP 服务器并转发 JSON-RPC 请求。

## 生产 MCP 的安全考量

MCP 是 *能力暴露* 协议——不是授权或审计协议。生产部署需要补上 MCP 刻意未做的部分：

- **身份认证**：多数 MCP 服务器在本地以未认证方式运行。多租户部署需要按智能体的凭证和按服务器的认证边界。
- **沙箱**：具有广路径访问的 MCP 文件系统服务器在功能上等同于宿主上的 root。请在容器中运行 MCP 服务器；不要盲目挂载敏感卷。
- **预算执行**：工具调用并非免费。循环调用 MCP 网络抓取服务器的智能体会累积可观成本。单智能体预算必须涵盖工具调用，而不仅是 LLM token。
- **审计日志**：MCP 本身没有标准化的调用日志。生产运行时需要为每次服务器调用记录参数、响应形态和时序，供 [AI 智能体安全](/learn/ai-agent-security) 审查和事件响应使用。

参考的 Claude Desktop MCP 集成将服务器挂载为宿主子进程，使用宿主用户的文件系统权限。这适合单用户的开发者环境；不是生产安全的做法。

## OpenLegion 如何集成 MCP

OpenLegion 默认就是一个 MCP 客户端。运行时中的智能体会自动发现为其舰队配置的 MCP 服务器，在上下文窗口中看到工具列表，并通过与内置技能相同的密钥库代理、ACL 关卡路径调用 MCP 工具。Mesh 负责执行 MCP 留白的生产级各层：

- 每个 MCP 服务器在自己的沙箱命名空间中运行；智能体永远无法直接获得对服务器进程的 stdio 访问。
- 单智能体 ACL 控制某个智能体被允许调用哪些 MCP 服务器。
- 每次工具调用都计入该智能体的单智能体预算；无论开销来自 LLM 还是 MCP 工具，超出上限的智能体都会被切断。
- Mesh 把每次 MCP 调用记录到追踪日志中——也就是 [AI 智能体可观测性](/learn/ai-agent-observability) 中所涵盖的同一份遥测。

结果：你获得了 MCP 生态的广度，而无需继承它的默认信任假设。

## OpenLegion 的看法

MCP 是自 OpenAPI 以来最重要的智能体生态标准——它把原本是 N × M 的集成工作（每个智能体框架 × 每个工具）压缩为 N + M 个服务器和客户端。但协议刻意的极简意味着生产团队必须重建那些枯燥但不可或缺的基础设施——认证、沙箱、预算、审计——这些都是过去专有系统打包提供的。把 MCP 视为"加水即用"而不叠加这些关切的框架，交付的是默认不安全的智能体。请选择一个足够重视 MCP 以便对它加以约束的 [AI 智能体平台](/learn/ai-agent-platform)。

## CTA

**部署 MCP 兼容、且内置生产级控制的智能体。**
[立即开始](https://app.openlegion.ai) | [阅读文档](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## 常见问题

### 什么是模型上下文协议？

模型上下文协议（MCP）是 Anthropic 在 2024 年 11 月推出的开放 JSON-RPC 标准，让 AI 智能体通过统一接口发现并调用外部工具。MCP 服务器暴露能力（工具、资源、提示词）；MCP 客户端（智能体运行时、IDE、助手）消费它们。2025 年期间的主要采纳者包括 OpenAI、Microsoft Copilot、Cursor、Zed 以及大多数智能体框架。

### MCP 由谁创建，是否开放？

Anthropic 创建了 MCP，并以开放规范发布，附 Python 和 TypeScript 的参考 SDK。规范通过 GitHub 由社区治理，不存在许可证或专有锁定。任何人都可以编写 MCP 服务器或客户端，主流 LLM 提供商也发布了 MCP 兼容工具。

### MCP 服务器和 MCP 客户端的区别是什么？

MCP 服务器暴露能力——Postgres 服务器暴露查询工具，文件系统服务器暴露文件读写，Slack 服务器暴露消息发送。MCP 客户端是消费端——通常是智能体运行时、IDE 或 AI 助手。一个客户端可以并发连接多个服务器；一个服务器可以被多个客户端复用。

### MCP 默认安全吗？

不安全——这是刻意为之。MCP 是能力暴露协议，不是授权协议。参考实现（Claude Desktop、SDK 示例）以未认证方式将服务器作为宿主子进程运行，使用用户的文件系统权限。生产部署必须在 MCP 之上添加身份认证、沙箱、按工具预算和审计日志。

### MCP 与 OpenAI 函数调用相比如何？

OpenAI 函数调用是单一厂商的模式，用于让某一个 LLM 调用 API 请求中定义的函数——它没有为跨系统的工具发现、打包或共享建立标准。MCP 是面向同一问题的跨厂商开放标准、面向生态层面。两者互补：MCP 服务器暴露能力；MCP 客户端可以在调用 GPT 模型时把它们渲染为 OpenAI 格式的函数定义，在调用 Claude 时渲染为 Anthropic 工具使用格式。

### 我可以在任意 LLM 提供商上使用 MCP 吗？

可以。MCP 与 LLM 无关——客户端会把 MCP 工具定义渲染为底层 LLM 所期望的任何格式（Anthropic tool use、OpenAI function calling、Gemini function declarations）。像 OpenLegion 这样通过 LiteLLM 支持 100+ 家提供商的运行时，会自动把 MCP 工具适配到每家提供商的调用约定。
