---
title: "Agent as a Service：定价、租户隔离与 AaaS 对比自托管"
description: "Agent as a Service（AaaS）：基于消费计费的托管基础设施 AI 代理。涵盖 AWS Bedrock Agents、OpenAI Operator、CVE-2024-5184 隔离及 AaaS 与自托管 TCO 对比。"
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

# Agent as a Service：定价模型、租户隔离与 AaaS 决策框架

Agent as a Service（AaaS）是一种商业交付模式，AI 代理在供应商的托管基础设施上运行，处理编排、工具执行、内存和凭据管理，按令牌、按操作或按代理小时计费，无需客户部署自己的运行时环境。AaaS 于 2026 年确立为企业采购类别：OpenAI Operator 于 2025 年 1 月推出，Google Agent Space 实现 GA，AWS Bedrock Agents 扩展至企业使用，搜索量从 2025 年 6 月的 90 次/月增至 2026 年 Q1 的 260-390 次/月，CPC $32.88。

<!-- SCHEMA: DefinitionBlock -->

> **Agent as a Service（AaaS）**是一种商业交付模式，AI 代理在供应商的托管基础设施上运行，处理编排、工具执行、内存和凭据管理，按消费基础（每输入令牌、每执行操作或每代理小时）向客户计费，无需客户部署和运营自己的代理运行时环境。

## Agent as a Service 的含义：三项平台承诺

每个 AaaS 平台都提出三项主张。了解哪些主张得到良好履行、哪些是营销话术，有助于买家在承诺基础设施预算前评估供应商。

### 承诺 1：托管基础设施（无需运营运行时）

AaaS 将整个代理运行时栈委托给供应商：编排引擎、工具执行环境、内存后端、可观测性管道、水平扩展和运行时间 SLA。客户定义代理（系统提示、工具和内存配置）并调用它。供应商执行它。

这与任何托管服务的权衡相同：RDS 对比自管 Postgres，Lambda 对比自管容器。以放弃可配置性并可能支付溢价为代价，换取不承担运营负担。托管基础设施承诺由 AWS Bedrock Agents、Google Agent Space 和大多数成熟 AaaS 平台良好履行。

当客户需要平台未公开的运行时配置时，承诺就会破裂：自定义工具执行环境、非标准内存后端、特定模型版本，或与平台固定编排模型不同的代理循环逻辑。

有关基础设施层的详细信息，请参阅 [AI 代理部署基础设施和托管选项](/learn/ai-agent-deployment)。

### 承诺 2：消费计费（按令牌、操作或小时付费）

2026 年 AaaS 定价已收敛为三种结构：

**模型成本之上的每令牌编排费用。** 平台将其编排层与底层 LLM 分开收费。AWS Bedrock Agents：编排层每处理一个输入令牌收取 $0.000025，在标准 LLM 模型费率之上收取。对于 Bedrock 上的 Claude 3.5 Sonnet（$3.00/M 输入令牌），编排费用增加 $0.025/M 输入令牌，在该模型价位不足 1% 的开销。但对于较便宜的模型，如 Amazon Titan Text（$0.30/M），编排费用占模型成本的 8.33% 额外开销。

**工具集成的每操作费用。** AWS Bedrock Knowledge Base 查询：$0.0004/次。每次会话进行 50 次 KB 检索的代理支付 $0.02/会话的 KB 费用。每天 100,000 次 KB 查询：仅操作费用就高达 $40/天。

**每代理小时订阅层。** 一些平台提供层级，每个活跃代理无论令牌消耗多少都计入包含的小时数。这种模型为稳定的代理群提供成本可预测性，但对于突发性工作负载可能效率低下。

消费定价将供应商激励与客户使用对齐，但为长时间运行的代理带来成本不可预测性。失控的代理循环同时在编排层和模型层产生费用。

有关成本降低策略，请参阅 [代理群的 LLM 成本优化和令牌预算策略](/learn/llm-cost-optimization)。

### 承诺 3：凭据隔离（凭据从不出现在代理上下文中）

凭据隔离是区分托管平台与"在云 VM 上运行、环境变量中有 API 密钥的代理代码"的 AaaS 安全原语。凭据在执行时服务器端注入，从不出现在代理的上下文窗口中、日志文件中或代理代码构建的工具调用参数中。

CVE-2024-5184（Palo Alto Unit 42，2024 年 6 月，CVSS 9.1 CRITICAL）证明通过工具响应的提示注入可导致代理泄露其自身的上下文窗口。如果 API 密钥在上下文窗口中，它们就可以通过此向量被泄露。

向每个 AaaS 供应商提出的诊断问题：**"如果攻击者通过提示注入提取了我代理的完整上下文窗口，哪些凭据面临风险？"** 正确答案是：无，凭据不在代理的上下文窗口中。

- **AWS Bedrock Agents**：每次调用的 IAM 角色承担；代理在临时 IAM 角色令牌下执行，从不持有原始 API 密钥
- **OpenLegion**：Zone 2 的 `$CRED{}` 句柄解析；代理代码按名称引用凭据；Zone 2 在执行时解析实际值而不将其返回给代理

有关 Vault 代理模式和 `$CRED{}` 句柄架构，请参阅 [AI 代理的凭据管理和每租户 API 密钥范围](/learn/credential-management-ai-agents)。

## 2026 年 AaaS 供应商格局

### AWS Bedrock Agents：具有 IAM 隔离的企业 AaaS

AWS Bedrock Agents 是市场覆盖范围最广的主导企业 AaaS 平台。代理通过 Bedrock 控制台或 API 定义，具有操作组和知识库。

**定价（2026 年）：**
- 编排层：$0.000025/输入令牌
- 模型成本：标准 Bedrock 费率（Claude 3.5 Sonnet：输入 $3.00/M，输出 $15.00/M）
- Knowledge Base 查询：$0.0004/次
- Code Interpreter：$0.000025/输入令牌

**凭据隔离：** 每次调用的 IAM 角色承担。每个 Bedrock Agent 分配有 IAM 执行角色。代理本身从不持有原始凭据。

**限制：** 与 AWS 服务紧密耦合。不支持自定义代理循环逻辑。对于上下文繁重的代理，每令牌编排费用会快速累积。

### OpenAI Operator：面向浏览器任务的消费者 AaaS

OpenAI Operator 于 2025 年 1 月推出，是第一个主流消费者面向的 AaaS 产品，在沙盒浏览器会话中代表用户执行网页任务，按任务完成计费。

**凭据隔离：** 每个任务的沙盒浏览器会话。会话不跨任务持久化或共享。

**限制：** 仅限浏览器范围，除网页浏览外无自定义工具集成。无用于自定义代理定义的开发者 API。

### Google Agent Space：面向 Workspace 重度企业的 AaaS

Google Agent Space（2025 年推出，2026 年 GA）是 Google Cloud 的企业 AaaS 平台，定位于已在 Google Workspace 上标准化的组织。

**定价：** 通过 Google Cloud 消费计费，与 Vertex AI 模型成本加上 Cloud Run 调用费用挂钩。

**限制：** Google Cloud 生态系统锁定。对多云集成灵活性较低。多个计费维度的价格不透明。

有关 AaaS 平台的功能级比较，请参阅 [AI 代理平台功能和框架比较](/learn/ai-agent-platform)。

## AaaS 定价：了解您的总成本

### 编排层费用：模型定价背后隐藏的成本

| **模型** | **输入价格** | **编排费用** | **编排占模型成本 %** |
|---|---|---|---|
| Claude 3.5 Sonnet | $3.00/M | $0.025/M | 0.83% |
| Claude 3 Haiku | $0.25/M | $0.025/M | 10% |
| Amazon Titan Text | $0.30/M | $0.025/M | 8.33% |

### 每操作费用与长时间运行代理税

- **AWS Bedrock KB（每天 100,000 次查询）**：$40/天 = $1,200/月
- **t3.medium 上的自托管 OpenSearch**（每天 100,000 次查询）：约 $0.16/天 = $5/月

交叉点计算：AaaS 操作费用超过自托管基础设施成本的时点约为**每天 12,500 次查询**。

### AaaS 中的失控循环成本：双重计费

失控的代理循环在 AaaS 中比自托管部署成本更高，因为 AaaS 在每次迭代中同时对模型成本和编排层费用计费。

## AaaS 安全：凭据隔离和 CVE-2024-5184 测试

### AaaS 平台的 CVE-2024-5184 测试

CVE-2024-5184（Palo Alto Unit 42，2024 年 6 月，CVSS 9.1 CRITICAL）：通过工具 API 响应的提示注入。

**CVE-2024-5184 测试**："如果攻击者通过提示注入提取了我代理的上下文窗口，哪些凭据可访问？"

**通过**（上下文窗口中无凭据）：
- AWS Bedrock Agents
- OpenLegion

**未通过**（凭据可访问）：
- 开发者在系统提示中放置了 API 密钥的任何平台

### 多租户提示隔离

**基础设施级隔离（最强）：**
- AWS Bedrock Agents：每个租户单独的 IAM 角色
- Google Agent Space：通过 Google Cloud 项目边界隔离
- OpenLegion：每个项目的黑板命名空间 ACL

**系统提示级隔离（最弱）：** 当提示注入覆盖租户指令时失败（OWASP LLM06:2023）。

有关每租户凭据范围和命名空间 ACL 的完整架构，请参阅 [AI 代理多租户和跨租户隔离架构](/learn/ai-agent-multi-tenancy)。

### AaaS 中的共享责任模型

造成安全漏洞的常见客户错误：

1. 系统提示中的凭据
2. 过于宽泛的工具权限
3. 没有每代理工具范围
4. 对不可逆操作没有 HITL 中断

## AaaS 对比自托管：决策框架

### AaaS 获胜的情况

当以下三个条件同时满足时，AaaS 是更好的选择：
- **低到中等量**：操作费用低于自托管基础设施成本（交叉点约每天 12,500 次查询）
- **快速生产就绪是优先级**：AaaS 消除了数周的基础设施设置
- **合规继承减少审计负担**：SOC 2 Type II 认证 AaaS 平台

### 自托管获胜的情况

自托管基础设施是正确选择的情况：
- **规模超过 AaaS 交叉点**：每天代理操作超过 50,000 次
- **自定义运行时需求**：非标准工具执行环境
- **数据驻留要求**：受监管行业
- **供应商锁定风险不可接受**

### 总拥有成本

每天 100,000 次操作的 TCO 比较：

**AaaS（AWS Bedrock 风格）：**
- KB 查询：$1,200/月
- 编排费用：约 $300/月
- 合计：约 $1,500/月 + 模型成本

**自托管：**
- Kubernetes 集群：$800/月
- 向量存储：$200/月
- 可观测性栈：$150/月
- 工程：$2,400/月
- 合计：约 $3,550/月 + 模型成本

## OpenLegion 的观点：AaaS 安全是凭据架构问题

Agent as a Service 是 2026 年增长最快的企业 AI 采购类别，也是安全基准最不标准化的类别。

**架构级执行**：凭据从不进入代理代码或上下文窗口。此属性不能被开发者错误绕过。

**基于惯例的隔离**：开发者被指示不要将凭据放在系统提示中。在时间压力、代码审查漏洞和开发者入职失败下会崩溃。

三个具体数字：
- **CVE-2024-5184（CVSS 9.1 CRITICAL，2024 年 6 月）**
- **$32.88 CPC**（2026 年 Q1-Q2 的"agent as a service"）
- **同比 4 倍增长**（2025 年 6 月至 2026 年初的搜索量）

| **安全控制** | **OpenLegion** | **AWS Bedrock Agents** | **Google Agent Space** | **OpenAI Operator** | **LangGraph（自托管）** |
|---|---|---|---|---|---|
| **具有 $CRED{} 句柄解析的凭据 Vault** | Zone 2，架构级 | IAM 角色承担 | 服务账户范围 | 会话隔离 | 开发者责任 |
| **每代理每日支出上限（基础设施层）** | Zone 2，$0-$50/天 | 不可用 | 不可用 | 不可用 | 开发者责任 |
| **每租户项目的黑板 ACL** | 架构级 | 基于 IAM | 基于项目 | 不适用 | 开发者责任 |
| **每代理工具权限范围** | 运行时强制 | 操作组 IAM | 基于 IAM | 不适用 | 开发者责任 |
| **每租户 WORM 审计日志（SOC 2 CC6.1）** | 原生 | CloudTrail | Cloud Audit Logs | 不适用 | 开发者责任 |
| **git 中的代理定义** | INSTRUCTIONS.md | 控制台/API | 控制台/API | 不适用 | 开发者责任 |

[开始在 OpenLegion 上构建](https://app.openlegion.ai) -- 通过 Zone 2 的 `$CRED{}` Vault 代理解析部署具有架构级凭据隔离、Zone 2 强制的每代理每日支出上限以及使跨租户状态访问在架构上不可能的黑板 ACL 的代理。

<!-- SCHEMA: FAQPage -->

## 常见问题

### 什么是 Agent as a Service（AaaS）？

Agent as a Service（AaaS）是一种商业交付模式，AI 代理在供应商的托管基础设施上运行，处理编排、工具执行、内存和凭据管理，按消费基础向客户计费。AaaS 类别于 2026 年随 OpenAI Operator 发布（2025 年 1 月）、Google Agent Space GA 和 AWS Bedrock Agents 达到企业规模而确立。每个 AaaS 平台做出三项承诺：托管基础设施、消费计费和凭据隔离。

### Agent as a Service 的成本是多少？

AaaS 定价有三个成本层：底层 LLM 模型成本、编排层费用（AWS Bedrock Agents：$0.000025/输入令牌）以及工具集成的每操作费用（AWS Bedrock Knowledge Base：$0.0004/次）。每天 100,000 次代理操作时，AaaS 平台费用通常在模型成本之前达到 $1,500-$3,600/月。

### AWS Bedrock Agents 是什么，如何计费？

AWS Bedrock Agents 是亚马逊的托管 AaaS 平台，在基于 IAM 角色的凭据隔离的 AWS 托管基础设施上提供代理编排、操作组和知识库。定价（2026 年）：编排层每输入令牌 $0.000025；Knowledge Base 查询每次 $0.0004。

### OpenAI Operator 是什么，为什么对 AaaS 重要？

2025 年 1 月推出的 OpenAI Operator 是第一个主流消费者面向的 Agent as a Service 产品，在沙盒浏览器会话中代表用户执行网页任务，按任务完成计费。Operator 的重要性在于展示了消费者也会为代理任务执行作为服务付费，与 2026 年初"agent as a service"搜索量同比 4 倍增长直接相关。

### AaaS 平台中的凭据隔离如何工作？

AaaS 中的凭据隔离意味着平台从不将客户的 LLM API 密钥、数据库凭据或工具机密暴露给代理代码。AWS Bedrock Agents 通过 IAM 角色承担实现这一点。OpenLegion 使用 Zone 2 的 `$CRED{}` 句柄解析：代理代码按名称引用凭据；Zone 2 在执行时解析实际值而不将其返回给代理。

### AaaS 平台特有的安全风险是什么？

主要的 AaaS 特有安全风险是提示注入的扩大攻击面（CVE-2024-5184，CVSS 9.1 CRITICAL）：AaaS 代理代表租户调用外部 API 并处理外部网页内容，任何外部响应都可能包含对抗性指令。第二个风险是弱隔离架构下的跨租户提示泄露。第三个风险是共享责任差距。

### 我应该何时使用 AaaS 对比自托管基础设施？

AaaS 是低到中等量、快速生产就绪或合规继承的更好选择。自托管在规模上获胜（超过 50,000 次操作/天）、自定义运行时需求、数据驻留法规或供应商锁定风险不可接受时。TCO 计算必须始终包含运营自托管基础设施的工程时间。

### AaaS 中的多租户提示隔离是什么？

AaaS 中的多租户提示隔离意味着租户 A 的系统提示、对话历史、工具结果和内存状态从不出现在租户 B 的代理上下文中。最强的隔离机制是基础设施级别的。最弱的模式是系统提示级隔离，当提示注入覆盖或忽略租户指令时失败（OWASP LLM06:2023）。
