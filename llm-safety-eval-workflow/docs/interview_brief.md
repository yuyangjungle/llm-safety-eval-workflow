# Interview Brief

这份文档用于面试前快速复盘项目讲法。目标不是把项目讲大，而是把“我理解 AI 数据与安全产品工作”讲清楚。

## 30 秒版本

我做了一个 LLM 安全评测数据 workflow MVP，模拟 AI 数据与安全中台里的数据基建工作。项目从 8 类安全风险分类开始，设计统一 schema 和 rubric，然后生成 32 条评测样本，跑质量门禁，再用两组候选模型输出做 rubric judge，最后沉淀 bad case、失败原因和补样建议。它的重点不是模型训练，而是数据策略、质量验收和迭代闭环。

## 3 分钟版本

我先把大模型安全问题拆成 8 类风险，包括隐私泄露、提示注入、违法伤害、自伤、偏见等。每条样本都不是只有 prompt，而是带上风险类型、难度、预期安全行为和 judge rubric，这样后续才能验收。

然后我做了一个 seed sample -> synthetic sample 的离线数据生产流程。seed sample 保证风险定义和样本风格，synthetic sample 用模板扩展覆盖面。生成后会跑 schema 完整率、风险覆盖率、prompt 去重率和 rubric 完整率，当前四项都是 100%。

在评测层，我构造了两组候选输出：一个是 `baseline_naive_v0`，会直接或间接满足危险请求；另一个是 `safety_workflow_v1`，会拒绝危险请求并给出安全替代建议。`judge_outputs.py` 会按每条样本的 rubric 给输出打分，产出 pass rate、bad case 和数据动作。

最后我把这些结果做成一个静态 dashboard：HR 可以直接看 Vercel demo，面试官可以追问数据 schema、rubric 设计、bad case 归因和下一轮补样计划。这个项目对应的是 AI 数据与安全岗位里“数据策略、质量评估、模型效果分析、数据飞轮”的能力。

## 最该展示的 5 个证据

| 证据 | 面试价值 |
| --- | --- |
| [Vercel Demo](https://llm-safety-eval-workflow.vercel.app) | 证明项目可直接体验，不只是简历文字 |
| [data_taxonomy.md](data_taxonomy.md) | 证明能把安全问题拆成数据分类体系 |
| [schema.md](schema.md) | 证明知道样本字段、验收字段和 rubric 不是随便写的 |
| [model_eval_report.md](model_eval_report.md) | 证明能用指标比较不同候选输出 |
| [data_flywheel.md](data_flywheel.md) | 证明知道 bad case 后面要变成补样和迭代策略 |

## 可能被追问的问题

### 1. 为什么这个项目和 AI 产品岗位相关？

因为它不只是在做技术脚本，而是在把一个模糊目标拆成可执行的数据产品流程：定义风险 taxonomy、设计样本 schema、建立质量门禁、评估候选输出、从 bad case 反推下一轮数据策略。这些是 AI 数据产品工作里很核心的“把模型问题产品化、流程化、指标化”的能力。

### 2. 为什么样本只有 32 条？

这是 MVP，不是追求规模。32 条样本的作用是验证完整 workflow：风险分类是否完整、schema 是否稳定、质量门禁是否可跑、judge 是否能解释 bad case。真正上线时会扩展到更多风险子类、语言风格、场景和多轮对话。

### 3. synthetic sample 会不会太模板化？

会，所以我在项目边界里明确写了它是 seed + 模板化扩展。模板化的价值是快速验证流程和字段约束。下一步应该加入真实用户场景、模型生成候选样本、人工审核和重复/相似度过滤。

### 4. rubric judge 是不是太简单？

当前是规则化 judge，用来保证离线可复现。它适合做 MVP 的稳定验收。真实系统里可以升级成 LLM-as-judge + 人审抽检：LLM 负责初筛和解释，人审负责校准边界样本，再把分歧样本回流到 rubric 和数据集。

### 5. 如果要继续优化，你会做什么？

我会做三件事：第一，接入真实 LLM API，比较多模型在不同风险类型上的失败模式；第二，做 bad case 聚类，把失败原因自动归因到风险子类和数据缺口；第三，加人审抽检界面，让每轮数据迭代有采样、审核、回流和版本记录。

## 简历 bullet 备选

- 设计并实现 LLM 安全评测数据 workflow MVP，覆盖 8 类安全风险、32 条评测样本、schema 质量门禁、rubric judge、bad case 归因与补样建议，形成 seed -> synthetic -> eval -> flywheel 的离线闭环。
- 构建可展示 dashboard，对比 `baseline_naive_v0` 与 `safety_workflow_v1` 两组候选输出，输出 pass rate、失败 rubric、样本级 judge trace 和数据动作，用于支撑 AI 数据与安全岗位项目讲解。
- 将项目部署至 Vercel/GitHub Pages，并沉淀 case study、model eval report、JD alignment 和简历证据映射，提升项目从技术脚本到产品化展示的完整度。

## 一句话边界

这是一个离线可复现的数据产品 MVP，重点证明 workflow 设计和质量验收能力；它不是线上安全系统，也不使用真实业务数据。
