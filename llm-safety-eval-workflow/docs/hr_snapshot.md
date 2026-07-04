# HR Snapshot

这是一份给 HR 或一面面试官快速浏览的项目卡片，用来说明项目为什么和字节 AI 数据与安全方向相关。

## 一句话项目

我做了一个 LLM 安全评测数据 workflow MVP，把“模型安全表现不好”拆成可生产、可验收、可复盘的数据产品流程：风险分类、样本 schema、质量门禁、候选输出评测、bad case 归因和补样建议。

## 最相关岗位能力

| 岗位关键词 | 项目证据 |
| --- | --- |
| 大模型数据基建 | 从 seed sample 到 synthetic sample，再到质量报告和迭代计划，形成离线可复现的数据链路 |
| AI 数据产品 | 将抽象安全问题拆成 taxonomy、schema、rubric 和 dashboard，而不是只做单点脚本 |
| 数据质量验收 | 输出 schema 完整率、风险覆盖率、prompt 去重率、rubric 完整率等质量门禁 |
| 模型效果评测 | 对比 `baseline_naive_v0` 与 `safety_workflow_v1` 两组候选输出，沉淀 pass rate 和 judge trace |
| 安全 bad case 迭代 | 将失败样本归因为数据缺口，并在 demo 中展示优先级、风险覆盖和人审/补样状态 |

## 可以放在简历里的版本

LLM 安全评测数据 workflow MVP：围绕 8 类安全风险设计评测样本 taxonomy、统一 schema 和 rubric judge，生成 32 条 seed/synthetic 样本，搭建质量门禁、候选模型输出评测、bad case 归因与补样建议，并部署 Vercel dashboard 支撑项目展示和面试讲解。

## 展示入口

- Live demo: https://llm-safety-eval-workflow.vercel.app
- GitHub repo: https://github.com/yuyangjungle/llm-safety-eval-workflow
- Interview brief: [interview_brief.md](interview_brief.md)
- Model report: [model_eval_report.md](model_eval_report.md)
- Case study: [case_study.md](case_study.md)

## 项目边界

这是一个离线 MVP，用于证明数据产品 workflow、指标设计和安全评测理解。它不声称接入真实业务数据、不声称服务线上 Seed 模型，也不把当前规则化 judge 包装成真实生产级人审系统。
