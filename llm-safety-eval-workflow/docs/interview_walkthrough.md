# Interview Walkthrough

## 30 秒项目介绍

这是一个大模型安全评测数据生产与质量验收 Workflow demo。它把安全风险拆成 8 类 taxonomy，再通过结构化样本、质量门禁、实时模型响应、rubric judge、bad case 归因、人审队列和下一轮补样计划，展示一条从数据生产到评测闭环的轻量流程。

当前版本不是生产级标注平台，而是一个可在线演示的 MVP：前端可查看样本池和评测结果，Vercel Serverless Function 可对单条样本发起真实模型调用，并返回模型输出、judge 分数、延迟、token usage 和推荐数据动作。

## 3 分钟演示路径

1. 先看首屏指标：8 类风险、32 条评测样本、64 条候选输出、Live API Eval、Rubric Judge 和 Bad Case Flywheel。
2. 进入 Workflow Overview：说明流程是 risk taxonomy -> sample schema -> live response -> rubric judge -> bad case -> data action -> next sampling。
3. 打开 Sample Explorer：挑一条样本，解释 `expected_behavior`、severity、difficulty 和 rubric 字段如何帮助数据验收。
4. 在 Live API Eval 里运行一次单样本评测：如果接口正常，展示真实模型输出；如果接口失败，页面自动展示 cached demo result，并明确标记不是新调用。
5. 看 Recent Runs、Recommended Data Actions 和 Bad Case Flywheel：解释失败样本如何被归因、进入人审队列，并转化为下一轮补样计划。

## 5 分钟详细讲解

### 1. 数据对象

样本不是散点 prompt，而是带有风险类型、场景、用户输入、期望行为、难度、严重程度和 rubric 的结构化评测对象。这样做的目的是让安全评测能被生产、验收和复盘。

### 2. 质量门禁

质量门禁覆盖 schema 完整率、taxonomy 覆盖、prompt 去重和 rubric 完整性。它解决的是数据生产早期最常见的问题：样本字段缺失、类别覆盖不均、prompt 重复，以及验收标准不可解释。

### 3. 实时评测链路

浏览器只发送 `sampleId` 到 `/api/run-eval`。Vercel Serverless Function 在服务端读取样本、调用模型 API、计算 rubric judge，并返回安全后的结果。API key 只在环境变量中读取，不进入浏览器和仓库。

### 4. Judge 和 bad case

MVP 使用规则化 rubric judge，优点是可复现、可解释、便于定位失败原因。每条失败样本会被归到 failure reason，再生成 recommended data action，例如补充拒答边界、强化证据约束、增加权限确认类样本。

### 5. 数据飞轮

Bad case 不是终点，而是下一轮数据生产的输入。页面里的 Recommended Data Actions、Human Review Queue 和 Next Sampling Plan 展示了从失败归因到补样计划的闭环。

## 真实与模拟边界

真实实现：

- `/api/run-eval` 是真实 Vercel Serverless Function。
- 单样本 live eval 会服务端调用模型 API。
- 返回值包含模型输出、judge 分数、pass/review、latency、usage 和 data action。
- 样本、taxonomy、model outputs、judge results、bad cases 都来自可复现的数据文件和脚本。

轻量模拟或前端视图：

- Recent Runs 由当前 live session 加本地评测结果组合展示，尚未持久化。
- Human Review Queue 是根据 bad case 和 review protocol 生成的队列视图，尚未接入真实审核系统。
- Recommended Data Actions 和 Production Roadmap 是产品化展示，尚未接入任务分发、数据库或权限系统。
- Cached demo result 只用于 live API 不可用时不中断演示，页面会明确标记为 cached。

## 为什么 MVP 用规则化 rubric judge

规则化 judge 更适合当前阶段，因为它能保证每次演示结果稳定，便于解释每个分数和失败原因。对于安全数据项目，早期重点不是追求复杂 judge，而是先把 taxonomy、schema、质量门禁、失败归因和补样闭环跑通。

生产化阶段可以逐步引入 LLM-as-judge、人工仲裁、双人审核、judge 校准集和一致性评估，但这些需要更多标注数据和评测治理成本。

## 生产化路线

1. Batch evaluation：把单样本评测扩展成批量任务，支持队列、重试和任务状态。
2. Persistent history：保存每次评测的样本、模型版本、judge 分数、延迟和数据动作。
3. Human review console：支持复核分配、双人审核、冲突仲裁和抽检结果回写。
4. Model version comparison：按模型、prompt、rubric 版本追踪 pass rate 和 bad case 变化。
5. Cost and latency monitor：监控 token 使用、单次成本、延迟分布和异常率。
6. Access control and audit log：增加权限、密钥治理、操作审计和数据版本追溯。

## 高频问题

Q: 这个项目真实调用模型了吗？

A: 是。Vercel 上的 `/api/run-eval` 会在服务端读取环境变量并调用模型 API。前端不会拿到 API key。

Q: 如果现场 live API 挂了怎么办？

A: 页面会自动展示 cached demo result，并明确标记来源。这样演示不会中断，同时不会把缓存结果说成新模型调用。

Q: 为什么不直接做成完整生产系统？

A: 这个版本的目标是面试演示和产品验证，所以保留最关键的闭环：数据生产、质量验收、实时评测、失败归因和补样计划。数据库、鉴权、队列、人审工作台会放到生产化路线里。

Q: 这个项目和普通 prompt demo 的区别是什么？

A: 普通 prompt demo 只展示单次回答；这个项目展示数据对象、评测标准、质量门禁、失败归因和下一轮数据动作，更贴近 AI 数据与安全中台的工作流。

Q: 后续最值得补什么？

A: 优先补批量评测和持久化历史，因为它们能把一次 demo 变成可追踪的评测系统；其次补人审控制台和模型版本对比。
