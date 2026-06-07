---
title: "浏览器Use智能体 — AI智能体如何控制网络"
description: "浏览器Use智能体让AI能够自主浏览网站、填写表单并提取数据。了解其工作原理、安全风险以及如何在隔离容器中安全运行。"
slug: /learn/browser-use-agents
primary_keyword: browser use agents
secondary_keywords:
  - ai browser automation
  - browser agent python
  - web agent llm
  - headless browser ai agent
  - browser use security
date_published: 2026-05
last_updated: 2026-05-30
schema_types:
  - FAQPage
page_type: learn
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
  - /learn/multi-agent-systems
  - /learn/ai-agent-orchestration
  - /learn/model-context-protocol
---

# 浏览器Use智能体：AI智能体如何导航和控制网络

浏览器Use智能体是无需人工干预即可自主控制网络浏览器的AI系统，能够导航URL、点击按钮、填写表单、提取内容和处理身份验证。它们是2026年增长最快的AI智能体工具类别，由browser-use（截至2026年5月GitHub星标96,282颗）等框架驱动。

<!-- SCHEMA: DefinitionBlock -->

> **什么是浏览器Use智能体？**
> 浏览器Use智能体是一种AI智能体，它使用DOM遍历、辅助功能树解析、截图基准和LLM引导的动作选择，以编程方式驱动无头或有头网络浏览器，自主完成基于网络的任务。

## 浏览器Use智能体的工作原理

### 感知：DOM、辅助功能树和截图基准

浏览器智能体在采取行动前需要了解当前页面状态。常用三种感知策略。

**DOM提取**解析页面的原始HTML结构。速度快、token效率高，但在画布渲染内容和复杂SPA上会失败。

**辅助功能树**读取浏览器的内置辅助功能层，提供页面的结构化语义视图。这是browser-use使用的主要感知方法。

**截图基准**捕获页面的可视截图并传递给具有视觉能力的LLM。处理DOM和辅助功能树不可靠的页面，但每步token成本显著更高。

### 动作：点击、输入、导航和表单提交

浏览器智能体的动作空间广泛：导航到URL、点击元素、输入文本、按键、滚动、选择下拉选项、上传文件或切换浏览器标签页。每个动作都会改变页面状态。

## browser-use库

### 不到7个月获得96,282颗星

browser-use（GitHub：browser-use/browser-use）于2024年10月31日发布，截至2026年5月已达96,282颗星和10,802个fork。该库抽象了Playwright会话管理、辅助功能树提取和动作序列化。

### Playwright后端：browser-use如何控制Chromium

browser-use封装了Microsoft的Playwright自动化库，添加了智能体层：提取辅助功能树，转换为token高效格式，将LLM动作决策翻译为Playwright命令。

### LLM集成：GPT-4o、Claude、Gemini作为推理层

browser-use在推理层与LLM无关，支持OpenAI、Anthropic、Google以及任何OpenAI兼容API端点。

## OpenLegion的观点：浏览器智能体是风险最高的工具

浏览器智能体是AI智能体领域风险最高的工具类别。能够点击、填写表单和跟随重定向的浏览器智能体与拥有完整互联网访问权限的人类具有相同的攻击面。

### 150秒凭证盗窃演示

2025年公开记录的研究表明，通过网页中嵌入的隐藏指令，浏览器智能体可在150秒内被操纵盗取用户凭证。防御措施是架构性的：如果凭证不存在于智能体的上下文或进程内存中，注入攻击就无法提取它。OpenLegion的Vault代理确保会话凭证在网络层注入，从不出现在智能体的上下文窗口中。

### OWASP LLM08过度授权和浏览器权限

OWASP LLM十大风险2025将过度授权（LLM08）列为顶级风险类别。浏览器智能体是典型风险：拥有导航、读取、填写表单和点击按钮权限的智能体可以进行购买、发送消息、删除账户和泄露数据。

### OpenLegion如何沙箱化浏览器智能体（Camoufox + Zone 1）

OpenLegion在每个智能体的Zone 1 Docker容器内，以端口:8500运行每个智能体独立的Camoufox浏览器实例。四个特性：无共享会话状态、指纹抗性、Vault代理凭证、通过Mesh Host的网络路由。

## 浏览器智能体架构模式

### 无头与有头

**无头模式**速度更快，在服务器环境中运行，但可被机器人保护系统检测到。Camoufox以无头模式运行，但修补了无头检测脚本针对的JavaScript API。

### CAPTCHA处理

三种方法：行为浏览器（指纹抗性）、求解服务（每1,000次$1-3）、人工回路后备。OpenLegion通过仪表板支持人工回路CAPTCHA交接。

### 凭证注入：Vault代理vs.硬编码Cookie

**最差**：凭证直接写入智能体指令。**差**：环境变量（可通过`os.environ`访问）。**正确**：在网络层通过Vault代理注入。

## 浏览器Use智能体：架构对比

| **维度** | **OpenLegion** | **browser-use** | **Raw Playwright** | **Stagehand** |
|---|---|---|---|---|
| **执行后端** | Camoufox（Firefox，抗指纹） | Playwright（Chromium） | Playwright | 云端Chromium |
| **会话隔离** | 每智能体容器 | 共享进程 | 取决于实现 | 云管理 |
| **凭证处理** | Vault代理注入 | 通过上下文窗口 | 手动实现 | 托管 |
| **CAPTCHA支持** | Camoufox指纹+人工回路 | 无内置 | 无内置 | 求解服务 |
| **容器沙箱** | Zone 1 Docker，非root | 无 | 无 | 云沙箱 |
| **GitHub星标** | — | 96,282（2026年5月） | N/A | ~9,000 |
| **许可证** | BSL 1.1 | MIT | Apache 2.0 | MIT |

## 何时使用浏览器智能体（以及何时不使用）

**合法用例**：网络研究和数据提取、自有服务的表单自动化、监控和测试。**需要额外控制的用例**：已认证会话、金融网站。**没有严格沙箱化应避免的用例**：不受信任的用户提供URL。

## 在OpenLegion上开始使用安全浏览器智能体

**在隔离容器中使用Vault代理凭证和每智能体网络控制运行浏览器智能体。**
[开始使用](https://app.openlegion.ai) | [阅读文档](https://docs.openlegion.ai) | [查看平台](/learn/ai-agent-platform)

---

<!-- SCHEMA: FAQPage -->

## 常见问题

### 什么是浏览器Use智能体？

浏览器Use智能体是通过DOM遍历、辅助功能树解析和LLM引导的动作选择，自主控制网络浏览器的AI系统。browser-use库（GitHub星标96,282，MIT许可，2024年10月发布）是采用最广泛的开源实现。

### browser-use库如何工作？

browser-use封装Microsoft的Playwright，为LLM提供浏览器辅助功能树的结构化视图，然后将LLM动作决策转换为Playwright命令。支持GPT-4o、Claude、Gemini和兼容LLM，MIT许可，约20行Python即可实现工作智能体。

### 浏览器Use智能体有哪些安全风险？

三个主要风险：通过网络内容的提示注入（2025年演示显示150秒内凭证盗窃）、凭证泄露（如果会话Cookie在智能体进程内存中）、过度授权（OWASP LLM08:2025）。零点击链接预览泄露也已被证实。

### 如何安全运行浏览器智能体？

需要四个控制：容器隔离、Vault代理凭证、网络出口控制、每智能体预算限制。OpenLegion的Camoufox支持的浏览器服务默认在Zone 1 Docker容器中实现全部四个。

### 什么是Camoufox？OpenLegion为什么使用它？

Camoufox是一款基于Firefox的无头浏览器，修补JavaScript API以报告真实的硬件配置文件而非无头签名。OpenLegion在每个Zone 1 Docker容器的端口:8500上为每个智能体运行一个Camoufox实例。

### AI智能体中browser-use和Playwright有什么区别？

Playwright是没有AI智能体概念的低级浏览器自动化库。browser-use增加了智能体层：将浏览器状态转换为LLM可读格式，将LLM动作翻译为Playwright命令，处理跨页面的多步骤任务分解。

### 浏览器Use智能体能处理登录和已认证会话吗？

可以，但已认证会话处理是风险最高的操作之一。OpenLegion通过Vault代理在网络层注入会话凭证。

### 浏览器智能体如何处理CAPTCHA？

三种方法：行为浏览器（指纹抗性）、求解服务（每1,000次$1-3，延迟10-60秒）、人工回路后备。OpenLegion通过仪表板支持人工回路CAPTCHA交接。
