---
title: "Agent2Agent协议：A2A安全、架构与MCP对比"
description: "Agent2Agent（A2A）协议让AI智能体能够跨框架委托任务。了解架构、安全模型、任务生命周期以及与MCP的比较。"
slug: /learn/agent2agent-protocol
primary_keyword: agent2agent协议
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

# Agent2Agent协议：架构、安全与MCP对比

Agent2Agent（A2A）是一个开放协议，由Google Cloud于2025年4月发布并捐赠给Linux Foundation，让基于不同框架和供应商构建的AI智能体能够通过标准化的HTTP/JSON接口进行通信、委托任务并交换结果。MCP解决的是工具访问问题（一个LLM调用外部API），而A2A解决的是协调问题：一个智能体将完整的子任务委托给具有独立推理循环、内存和工具的专业对等智能体。a2aproject/A2A GitHub仓库拥有来自50多个组织的贡献，包括Salesforce、Atlassian和SAP。

<!-- SCHEMA: DefinitionBlock -->
Agent2Agent（A2A）是一个由Linux Foundation维护的AI智能体互操作性开放HTTP/JSON协议，标准化了自主智能体如何在不同框架和供应商之间宣传能力、委托任务和交换结果。

## Agent2Agent（A2A）协议是什么？

A2A源于AI智能体生态系统中的一个具体空白：模型到工具的通信有了标准（MCP，2024年11月推出），但智能体到智能体的通信却没有。当一个编排智能体需要将子任务交给专业对等体时，没有标准化的线格式用于该委托。

Google Cloud于2025年4月9日宣布A2A，同时宣布了超过50个为规范做出贡献的初始技术合作伙伴组。与许多供应商驱动的标准不同，A2A被捐赠给Linux Foundation进行中立治理。

协议的核心是HTTP/JSON。A2A兼容智能体暴露少量端点：智能体卡片（能力清单）、任务提交端点、状态轮询端点以及用于长时间运行任务的SSE流式端点。

有关A2A解决的多智能体协调问题的背景，请参阅[多智能体系统架构](/learn/multi-agent-systems)和[AI智能体编排模式](/learn/ai-agent-orchestration)。

## A2A协议架构

A2A定义了三个核心概念：智能体卡片（能力发现）、任务生命周期（有状态委托跟踪）和传递模式（SSE流式传输和webhook推送）。

### 智能体卡片：能力广告与枚举风险

智能体卡片是在已知URL（`/.well-known/agent.json`）提供的JSON文档，描述智能体能做什么。最小智能体卡片包括：

```json
{
  "name": "web-research-agent",
  "description": "使用网络搜索研究主题并返回结构化摘要",
  "version": "1.0.0",
  "url": "https://agents.example.com/web-research",
  "skills": [
    {
      "id": "research_topic",
      "name": "研究主题",
      "description": "搜索网络上的主题并返回结构化摘要",
      "inputModes": ["text"],
      "outputModes": ["text", "data"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

智能体卡片实现动态能力发现，但存在安全风险：在A2A基础配置文件中，智能体卡片默认不进行身份验证，将完整技能界面暴露给无需身份验证的枚举。

生产部署应仅在身份验证后提供智能体卡片，或将其限制在内部网络段。[AI智能体安全威胁模型](/learn/ai-agent-security)将能力枚举作为侦察攻击向量。

### 任务生命周期：从提交到完成的五种状态

A2A定义了五状态任务生命周期：

1. **submitted** - 任务被远程智能体接收；尚未开始处理
2. **working** - 远程智能体正在积极处理任务（可通过SSE流式传输进度）
3. **input-required** - 远程智能体在继续之前需要说明（人机协作门控）
4. **completed** - 任务完成；结果制品可供检索
5. **failed** - 任务失败；任务状态对象中有错误详情

`input-required`状态是A2A在长期自主管道中的人机协作检查点机制。

### 推送与拉取任务传递：SSE和webhook

A2A支持两种任务结果传递模式：

**SSE（服务器发送事件）：** 委托智能体向接收智能体的流式端点打开持久连接。SSE是需要增量进度的长时间运行任务的主要机制。

**webhook推送：** 委托智能体在提交时提供回调URL。在无法维持持久SSE连接的无服务器环境中更为适用。

## A2A与MCP：不同层次，不同问题

A2A和MCP是互补的，不是竞争关系。它们在智能体栈的不同层次运作，解决不同的协调问题。

| **维度** | **MCP** | **A2A** |
|---|---|---|
| **目的** | 工具访问 - 一个LLM调用外部API | 智能体协调 - 一个智能体委托给另一个 |
| **通信** | 在一个推理轮次内的同步工具调用 | 异步任务委托；接收智能体有自己的循环 |
| **身份验证（默认）** | 必需 - MCP服务器对客户端进行身份验证 | 基础配置文件中可选 - 允许匿名 |
| **发现** | MCP服务器清单（工具列表） | 智能体卡片（JSON：技能+身份验证要求） |
| **状态** | 每次工具调用无状态 | 有状态，5状态生命周期 |
| **流式传输** | 核心规范中没有 | 实时SSE；异步webhook推送 |
| **主要威胁** | 工具中毒（OWASP LLM07:2025） | 任务载荷注入、智能体卡片枚举 |

### 当智能体需要工具时（MCP）

MCP是在单个推理轮次内需要调用外部能力的正确选择。工具没有自己的推理循环；它执行函数并返回值。

### 当智能体需要另一个智能体时（A2A）

A2A是当任务需要对等智能体的完整推理能力时的正确选择。接收智能体有自己的模型、内存、工具访问和多步推理循环。

### 在同一系统中同时使用MCP和A2A

生产多智能体系统通常同时使用两者。编排智能体使用A2A委托给专业智能体。每个专家使用MCP进行工具调用。这两层相互补充。

## A2A身份验证和安全模型

A2A的安全模型有一个关键缺口：基础配置文件使身份验证变为可选。通过A2A任务载荷的提示注入是针对接受来自不可信调用者任务的任何A2A部署的已记录攻击类别。

A2A系统的攻击面：

**1. 任务载荷注入：** A2A任务提交中的任务描述和输入数据是用户控制的。

**2. 智能体卡片枚举：** 未经身份验证的智能体卡片暴露完整的技能界面。

**3. 智能体间信任假设：** 不经输出验证就信任对等智能体结果的委托智能体容易受到中继注入攻击。

**4. 匿名委托：** 没有强制身份验证，网络上的任何调用者都可以向A2A智能体提交任务。

## OpenLegion的观点：A2A是线格式，不是安全模型

A2A作为线格式设计得很好。安全模型未达到生产要求。

OpenLegion对智能体间通信的方法强制执行A2A基础配置文件留为可选的内容：

1. **每次智能体间调用都通过凭证保险库路由。** 没有匿名委托模式。

2. **在56个网络瓶颈点进行任务载荷消毒。** 用户控制的内容在到达LLM上下文之前针对unicode攻击进行消毒（双向覆盖U+202A-U+202E、标签字符U+E0000-U+E007F、零宽字符）。

3. **由编排器验证的类型化握手契约。** 中继注入载荷在握手边界被阻止。

4. **智能体能力清单需要身份验证才能访问。** 技能界面不对匿名调用者暴露。

## 实现A2A：技术演练

### 智能体卡片架构

生产智能体卡片应明确包含身份验证要求，不依赖默认值：

```json
{
  "name": "data-analysis-agent",
  "description": "分析结构化数据集并返回带可视化的统计摘要",
  "version": "1.2.0",
  "url": "https://agents.internal.example.com/data-analysis",
  "skills": [
    {
      "id": "analyze_dataset",
      "name": "分析数据集",
      "description": "对提供的数据集运行统计分析",
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

### 任务提交和状态轮询

任务提交是向`/tasks/send`的POST。状态轮询使用`GET /tasks/{task_id}`。以指数退避轮询（1s、2s、4s、8s，上限30s）。长时间运行任务（>60s）应切换到SSE。

### 使用SSE流式传输长时间运行任务

对于预计运行时间超过30秒的任务，通过`POST /tasks/sendSubscribe`使用SSE。`"final": true`标志表示任务完成。使用`Last-Event-ID`头实现SSE重连以在连接断开后恢复。

<!-- SCHEMA: FAQPage -->
## 常见问题

### Agent2Agent（A2A）协议是什么？

Agent2Agent（A2A）是AI智能体互操作性的开放HTTP/JSON协议，由Google Cloud于2025年4月推出并捐赠给Linux Foundation。它标准化了不同框架上构建的自主智能体如何宣传能力、委托任务和交换结果。包括Salesforce、Atlassian和SAP在内的50多个组织自2025年4月发布以来为该协议做出了贡献。

### A2A和MCP有什么区别？

MCP解决工具访问：单个智能体在单个推理轮次内调用外部API（无状态函数调用）。A2A解决智能体协调：一个智能体将完整的子任务委托给具有独立推理循环、内存和工具的对等智能体（有状态异步委托）。MCP默认需要身份验证；A2A的基础配置文件使其成为可选。两个协议是互补的。

### A2A智能体卡片是什么？

智能体卡片是在`/.well-known/agent.json`提供的JSON文档，描述智能体的能力、接受的输入/输出模式和身份验证要求。在A2A基础配置文件中，默认不经身份验证提供。生产部署应要求身份验证才能访问智能体卡片。

### A2A协议安全吗？

A2A的基础配置文件存在重大安全漏洞。身份验证默认是可选的。通过A2A任务载荷的提示注入是现实的生产风险。生产A2A部署必须明确实现扩展身份验证配置文件，在到达LLM之前消毒所有任务载荷内容，并在每个握手边界验证输出。

### A2A任务生命周期是什么？

A2A定义了五种任务状态：submitted（已接收，尚未处理）、working（积极处理中，可流式传输SSE进度）、input-required（远程智能体在继续前需要说明 - 人机协作门控）、completed（结果可供检索）和failed（任务失败，有错误详情）。`input-required`状态是A2A在自主管道中显示人机协作检查点的机制。

### 哪些公司支持A2A？

A2A于2025年4月发布，有50多个贡献组织，包括Salesforce、Atlassian和SAP。Google Cloud主导了初始规范，并将治理移交给Linux Foundation。该协议针对需要不同框架（LangGraph、CrewAI、AutoGen、自定义实现）上构建的智能体无需供应商锁定即可互操作的企业AI平台。

### OpenLegion如何实现智能体间通信？

OpenLegion的网格架构实现了每次调用都强制身份验证的智能体间协调——没有匿名委托模式。每个智能体间握手都通过凭证保险库路由，在任务到达接收智能体之前验证调用者身份并执行每个智能体的ACL门控。任务载荷内容在56个网络瓶颈点针对unicode攻击进行消毒。这些控制在智能体代码外部的基础设施层运行。

## 在每次调用都有身份验证的情况下构建多智能体系统

A2A提供了跨框架和供应商智能体互操作性的线格式。安全模型必须在其上构建或由基础设施层强制执行。

有关完整威胁分类，请参阅[AI智能体安全与威胁模型](/learn/ai-agent-security)，有关协调模式，请参阅[多智能体系统架构](/learn/multi-agent-systems)。

[在OpenLegion上运行每次智能体间调用都默认进行身份验证、日志记录和凭证隔离的多智能体系统](https://app.openlegion.ai)
