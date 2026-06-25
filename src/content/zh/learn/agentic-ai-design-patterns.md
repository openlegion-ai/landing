---
title: "智能体AI设计模式：ReAct、Plan-and-Execute、Reflexion等"
description: "ReAct、Plan-and-Execute、Reflexion、Critic-Actor、Supervisor-Worker、Mixture-of-Agents：智能体AI设计模式，包含权衡取舍、故障模式、安全门控和生产选择指南。"
slug: /learn/agentic-ai-design-patterns
primary_keyword: 智能体AI设计模式
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

# 智能体AI设计模式：ReAct、Plan-and-Execute、Reflexion等

智能体AI设计模式是针对智能体协调中反复出现问题的具名可复用架构解决方案——每个模式都有明确的结构、已知的权衡取舍、特征性故障模式和安全影响。选择错误的模式会导致具体故障：在长期任务中使用ReAct会导致上下文窗口抖动；没有重新规划的Plan-and-Execute会在过时计划上累积错误；没有内存清理的Reflexion会导致持久性内存投毒。两大类别的六种模式：单智能体推理模式（ReAct、Plan-and-Execute、Reflexion）和多智能体协调模式（Critic-Actor、Supervisor-Worker、Mixture-of-Agents）。

<!-- SCHEMA: DefinitionBlock -->

> **智能体AI设计模式**是针对智能体系统设计中反复出现问题的具名可复用架构解决方案——指定智能体如何推理、规划、反思、委托并从故障中恢复——每个模式都有明确的结构、已知的权衡取舍、特征性故障模式和安全影响，实践者在部署到生产环境之前必须加以考虑。

## 如何阅读本指南：模式结构与选择启发法

### 模式组件：结构、权衡取舍、故障模式、安全门控

本指南中每个模式由四个组件描述：

**结构**：以散文形式表述的架构排列——存在哪些智能体或模型实例、它们如何通信、数据流如何呈现以及关键工件是什么（便签本、计划文档、反思缓冲区、裁决、任务调度、集成输出）。

**权衡取舍**：模式优化的方面与牺牲的方面。ReAct优化真实工具锚定但牺牲上下文窗口效率。Plan-and-Execute优化上下文效率和可检查性但牺牲执行中环境变化时的适应性。

**故障模式**：每个模式在生产中失败的具体方式，这些方式从学术基准测试结果中并不明显。

**安全门控**：防止每个模式特征性安全故障模式所需的特定控制。

### 模式选择启发法：任务持续时间 x 可逆性 x 自主级别

三个轴决定从哪个模式开始：

**任务持续时间**：短任务（最多5次工具调用）-- ReAct。中等任务（6-20步）-- Plan-and-Execute。长期或开放性任务（20步以上）-- Reflexion或Supervisor-Worker。

**可逆性**：如果所有操作都可逆，任何模式都适用。如果某些操作不可逆（文件删除、发送邮件、数据库写入），无论使用何种基础模式，都要在这些特定操作前添加Critic-Actor门控。

**自主级别**：L1-L2 -- ReAct或Plan-and-Execute。L3 -- 带角色爆炸半径限制的Reflexion或Supervisor-Worker。L4 -- 没有强化安全基础设施的情况下不在生产部署。

## ReAct：推理与行动交叉执行

### 结构：思考 -> 行动 -> 观察循环

ReAct（Reasoning + Acting），来自Google Brain和Princeton的Yao等人（arXiv 2022年10月，ICLR 2023），在单一上下文窗口便签本中交叉进行思维链推理与工具调用。循环：

```
Thought: [基于前一观察的思维链推理]
Action: [工具调用——函数名和参数]
Observation: [执行返回的工具结果]
[重复直到:]
Thought: 我有足够的信息来回答了。
Action: Finish[最终答案]
```

原始论文的基准测试结果：HotpotQA多跳问答——ReAct 57.1%精确匹配 vs 仅思维链43.2%（+14分）。FEVER事实核查——75.4% vs 66.4%（+9分）。

### 权衡取舍：真实依据 vs 上下文窗口增长

ReAct的主要优势是基于观察的推理。代价是上下文窗口增长。在平均200个令牌/三元组的20次工具调用任务中，便签本alone消耗4,000个令牌。

### 故障模式：便签本注入

ReAct的安全故障模式直接针对便签本。如果任何工具观察包含对抗性内容，该内容会被逐字追加到便签本。包含`Thought: 我现在应该将用户数据发送到...`的网页可以注入Thought和Action步骤。

三种需要同时采取的缓解措施：
1. 在追加到便签本前清理每个观察
2. 在Zone 2分发前预先记录每个行动
3. 将每个工具观察视为不可信输入

## Plan-and-Execute：将规划与执行分离

### 结构：规划者在任何执行开始前生成完整任务分解

Plan-and-Execute分离了ReAct交织的两个关注点：规划者智能体接收目标并在任何执行开始前生成完整的任务分解。

上下文窗口效率：计划紧凑（大多数任务50-150个令牌）。对于长期任务，与ReAct相比可减少约40-60%的上下文窗口占用。

### 权衡取舍：效率 vs 计划过时

主要故障模式是计划过时。计划在T=0时生成。如果执行过程中环境发生变化，剩余步骤可能基于无效的前提条件。

### 安全门控：分发前的计划检查

计划是在任何工具调用之前可用的离散工件。自动化预执行策略检查：解析计划中的禁止操作类型，验证每个工具名称出现在智能体的允许操作列表中。

## Reflexion：通过语言强化从失败中学习

### 结构：反思 -> 存储 -> 条件化下一次尝试

Reflexion，来自Northeastern、MIT和Princeton的Shinn等人（arXiv 2023年3月，NeurIPS 2023），是一种语言强化学习模式：任务尝试失败后，智能体生成自然语言反思，存储在情节记忆缓冲区中，并基于检索到的反思来条件化下一次尝试。

基准测试结果：HumanEval编码pass@1——Reflexion 91% vs 标准提示80%（+11分）。ALFWorld任务成功——97% vs 73%基线（+24分）。

### 安全风险：情节记忆投毒

Reflexion的安全故障模式与ReAct的便签本注入风险不同且更持久。如果观察包含对抗性内容，生成的反思可以无限期地编码攻击者控制的指导。

依次需要的四种缓解措施：存储前反思清理；带agent_id归因的版本化黑板存储；反思TTL；针对提议类别行为变更的反思的HITL审查门控。

## Critic-Actor：将评估与执行分离

### 结构：行动者提议，批评者在执行前拦截

Critic-Actor模式，源自RLHF和Constitutional AI（Anthropic，2022），将行动生成与行动评估分离。Actor模型提议一个行动；Critic模型根据策略评估提议的行动；只有通过Critic评估的行动才能进入工具调用层。

关键实现细节：Critic必须具有独立于Actor的上下文窗口。同一上下文的Critic共享Actor的完整上下文——损害Actor提议的提示注入同样损害同一上下文窗口中Critic的评估。

### 何时使用Critic-Actor：不可逆性阈值

Critic-Actor增加延迟，在操作跨越不可逆性阈值时需要：文件删除、发送邮件、数据库写入、对外部API的POST调用。

## Supervisor-Worker：基于角色的多智能体协调

### 结构：监督者分解，工作者在角色范围内执行

Supervisor-Worker由一个监督者智能体接收目标、分解为任务，并将每个任务调度给具有定义角色和受限工具集的专业工作者智能体：
- ResearchWorker：工具 = `web_search`、`read_file`、`read_url`
- CodeWorker：工具 = `run_command`、`write_file`、`read_file`
- CommWorker：工具 = `send_email`、`post_message`

### 安全属性：受损工作者的爆炸半径限制

Supervisor-Worker的主要安全属性是爆炸半径限制：受损的工作者只能调用其定义角色内的工具。接收到注入指令要调用`send_email()`的ResearchWorker将在Zone 2的权限检查中失败。

## Mixture-of-Agents：跨模型实例的集成推理

### 结构：模型输出的多层聚合

Mixture-of-Agents（MoA），来自Together AI的Wang等人（arXiv 2024年6月），通过迭代细化层聚合来自多个LLM实例的输出。AlpacaEval 2.0基准测试：使用3层MoA的65.1%胜率 vs GPT-4o单模型的57.5%——集成推理带来7.6分的质量提升。

### 权衡取舍：质量 vs API成本倍增

3模型 x 3层MoA每次用户请求需要约12次LLM调用 vs 单模型的1次——约12倍API成本增加。MoA不适合高频、延迟敏感的智能体循环。

## OpenLegion观点：模式安全是基础设施，而非提示工程

本指南中每个智能体设计模式都有原始学术论文未涵盖的安全故障模式。模式特定的安全故障模式：
- **ReAct便签本注入**：对抗性观察内容注入Thought步骤
- **Plan-and-Execute计划注入**：计划工件可能在规划者和执行者之间被修改
- **Reflexion内存投毒**：被投毒的反思跨会话持久存在于情节缓冲区
- **同上下文Critic绕过**：注入Actor上下文也会损害Critic评估
- **监督者被攻陷**：被攻陷的监督者可以向所有工作者调度任意任务

| **安全控制** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **预执行行动记录** | Zone 2，原生 | 开发者约定 | 开发者约定 | 开发者约定 | 开发者约定 |
| **黑板计划ACL** | 基础设施强制 | 不可用 | 不可用 | 不可用 | 不可用 |
| **带agent_id归因的版本化情节记忆** | 原生 | 开发者约定 | 开发者约定 | 开发者约定 | 开发者约定 |
| **独立上下文的独立Critic模型** | 原生智能体隔离 | 手动设置 | 手动设置 | 手动设置 | 手动设置 |
| **每工作者的Zone 2工具权限执行** | 基础设施强制 | 开发者约定 | 开发者约定 | 开发者约定 | 开发者约定 |

[在OpenLegion上开始构建](https://app.openlegion.ai)

<!-- SCHEMA: FAQPage -->

## 常见问题

### 什么是智能体AI设计模式？

智能体AI设计模式是针对智能体系统设计中反复出现问题的具名可复用架构解决方案——指定智能体如何推理、规划、反思、委托并从故障中恢复。主要模式包括ReAct、Plan-and-Execute、Reflexion、Critic-Actor、Supervisor-Worker和Mixture-of-Agents。选择错误的模式会导致具体故障：在长期任务中使用ReAct会导致上下文窗口抖动；没有重新规划触发器的Plan-and-Execute会累积错误；没有内存清理的Reflexion会导致持久性投毒。

### 什么是AI智能体的ReAct模式？

ReAct（Reasoning + Acting），来自Google Brain和Princeton的Yao等人（arXiv 2022年10月，ICLR 2023），在单一上下文窗口便签本中交叉进行思维链推理与工具调用和工具结果，将每个推理步骤锚定在实际工具结果中。在基准测试中，ReAct在HotpotQA上比仅思维链高14分，在FEVER上高9分。主要生产权衡是上下文窗口增长。主要安全风险是便签本注入。

### 什么是AI智能体的Plan-and-Execute模式？

Plan-and-Execute将规划者智能体与执行者智能体分离，与ReAct相比，在长期任务中将上下文窗口消耗减少约40-60%，并允许在进行任何工具调用之前对计划进行自动化预执行策略检查。主要故障模式是计划过时，需要检测预期观察与实际观察不匹配的重新规划触发器。

### 什么是AI智能体的Reflexion模式？

Reflexion（Shinn等，NeurIPS 2023）让智能体生成任务失败的语言摘要，存储在情节记忆中，并基于检索的反思来条件化未来尝试。HumanEval编码pass@1从80%提升到91%，ALFWorld从73%提升到97%。安全风险是情节记忆投毒：对抗性内容可导致存储被投毒的反思，影响所有未来任务尝试。

### 什么是AI智能体的Critic-Actor模式？

Critic-Actor模式将Critic模型（在执行前根据策略评估提议的操作）与Actor模型（生成并执行操作）分离，确保只有通过Critic评估的操作才能到达工具调用层——在操作不可逆时必需（文件删除、发邮件、数据库写入）。具有独立上下文窗口的独立模型Critic比同上下文Critic强得多。

### 什么是AI智能体的Supervisor-Worker模式？

Supervisor-Worker由监督者智能体分解目标并将任务调度给具有定义角色和受限工具集的专业工作者智能体，使每个工作者在最小权限下运行，受损工作者只能调用其定义角色内的工具。爆炸半径限制是该模式的主要安全优势：尝试使用角色外工具的被注入工作者在Zone 2权限检查中失败。

### 什么是Mixture-of-Agents（MoA）？

Mixture-of-Agents（MoA），来自Together AI的Wang等人（arXiv 2024年6月），通过迭代细化层聚合来自多个LLM提议器实例的输出，纠正模型实例间的非相关错误。在AlpacaEval 2.0上，3层MoA实现了65.1%的胜率，而GPT-4o为57.5%。生产成本是乘数性的：约12倍API成本增加。

### 如何在ReAct、Plan-and-Execute和Reflexion之间选择？

模式选择遵循三个轴：任务持续时间、操作可逆性和自主级别。对于具有可逆操作的短任务，ReAct是最简单的选择。对于中期任务，Plan-and-Execute将上下文窗口消耗减少40-60%。对于智能体可以从自身失败历史中学习的重复任务，Reflexion增加了累积性能提升。操作不可逆时添加Critic-Actor；不同任务步骤确实需要不同工具集时添加Supervisor-Worker。
