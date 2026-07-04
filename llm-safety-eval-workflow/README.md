# LLM Safety Eval Data Workflow

面向字节「AI 产品实习生 - AI 数据与安全」JD 的离线 MVP：从风险分类体系、样本 schema、合成样本生成、规则校验、质量指标、评估报告到可展示 demo，模拟一条小型的大模型安全评测数据生产与质量验收 Workflow。

![Demo screenshot](results/demo-chrome-screenshot.png)

## 项目定位

这个项目不是训练模型，也不是声称已经接入线上大模型服务。当前版本重点验证数据产品能力：

- 将抽象的 LLM 安全问题拆成可生产、可验收的数据分类体系。
- 用结构化 schema 约束评测样本字段、难度、预期行为和 judge rubric。
- 搭建「种子样本 -> 合成扩展 -> 规则校验 -> 质量指标 -> bad case 迭代」的离线流程。
- 输出评测数据质量报告和可视化 demo，用于支持简历项目描述和面试讲解。

## JD 对齐

| JD 关键词 | 项目证据 |
| --- | --- |
| 数据策略制定 | `docs/data_taxonomy.md` 定义风险类型、样本策略、难度分层 |
| 数据产线搭建 | `scripts/generate_samples.py` 生成合成样本并输出统一数据集 |
| 质量与效果评估 | `scripts/evaluate_quality.py` 输出质量指标与评估报告 |
| 模式创新 / 自动化 | `demo/` 展示 schema-first workflow、质量门禁和数据飞轮 |
| 合成数据 | `data/synthetic_samples.json` 由模板和规则生成 |
| Workflow / Agent | README 与 demo 中展示可扩展到 LLM-as-judge / human review 的编排路径 |

## 在线展示

公开仓库：

- GitHub：<https://github.com/yuyangjungle/llm-safety-eval-workflow>
- 在线 Demo：<https://yuyangjungle.github.io/llm-safety-eval-workflow/>

当前本地可打开：

- Demo：`demo/index.html`
- Case Study：`docs/case_study.md`
- 质量报告：`docs/eval_report.md`
- 模型评测报告：`docs/model_eval_report.md`

当前 GitHub Pages 根路径会自动跳转到 demo。部署到 Vercel 后，根路径同样会自动展示 demo。

## 项目结构

```text
llm-safety-eval-workflow/
  data/
    risk_taxonomy.json
    seed_samples.json
  demo/
    index.html
    styles.css
    app.js
  docs/
    case_study.md
    data_taxonomy.md
    schema.md
    jd_alignment.md
    llm_as_judge.md
    data_flywheel.md
  results/
  resume/
    bytedance_ai_data_resume_draft.md
    evidence_map.md
  scripts/
    generate_samples.py
    evaluate_quality.py
    generate_model_outputs.py
    judge_outputs.py
```

运行脚本后会生成：

```text
data/synthetic_samples.json
data/all_samples.json
data/model_outputs.json
data/judge_results.json
data/bad_cases.json
results/quality_report.json
results/model_eval_report.json
docs/eval_report.md
docs/model_eval_report.md
demo/data.js
```

## 快速运行

```powershell
cd llm-safety-eval-workflow
python scripts/generate_samples.py
python scripts/evaluate_quality.py
python scripts/generate_model_outputs.py
python scripts/judge_outputs.py
python scripts/verify_mvp.py
```

打开 `demo/index.html` 即可查看静态 demo。也可以在目录下启动本地服务器：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000/demo/`。

如果从仓库根目录运行：

```powershell
python -m pip install -r requirements.txt
npm run generate
npm run verify
npm run resume
npm run serve
```

然后访问 `http://localhost:8000/llm-safety-eval-workflow/demo/`。

## 当前 MVP 快照

- 风险分类：8 类。
- 样本规模：32 条，其中 8 条人工种子样本、24 条模板化合成样本。
- 质量门禁：Schema 完整率、风险覆盖率、Prompt 去重率、Rubric 完整率均为 100%。
- 模型评测：提供 `baseline_naive_v0` 与 `safety_workflow_v1` 两组候选输出样例、rubric judge、bad case 归因与数据飞轮建议。
- 展示产物：`demo/index.html` 静态 dashboard、`docs/eval_report.md` 质量报告、`docs/model_eval_report.md` 模型评测报告、`resume/bytedance_ai_data_resume_full.md` 简历草稿。
- 真实模型接入：支持通过 `DEEPSEEK_API_KEY` 生成 DeepSeek API 输出，详见 `docs/deepseek_integration.md`。

## 当前 MVP 边界

- 样本为人工种子 + 模板化合成数据，用于展示数据生产流程，不代表真实业务数据。
- 质量评估为离线规则校验与覆盖率统计，不声称等价于真实线上模型评测。
- 当前模型输出为离线候选输出样例，rubric judge 是可复现的规则 judge；真实 LLM-as-judge prompt 与人工抽检设计见 `docs/llm_as_judge.md`。
- 后续可接入真实 LLM API，补充模型输出、LLM-as-judge、人工抽检与多轮数据飞轮。

## DeepSeek API 接入

```powershell
$env:DEEPSEEK_API_KEY="your_key_here"
npm run deepseek:sample
```

脚本只从环境变量读取 key，不会把 key 写入仓库。完整说明见 `docs/deepseek_integration.md`。

## 发布路径

- Vercel：仓库根目录的 `vercel.json` 会把 `/` 指向 demo。
- GitHub Pages：`.github/workflows/pages.yml` 会在 push 到 `master` / `main` 后发布静态站点。
- 当前 GitHub 仓库已发布；Vercel 连接器可用，但正式部署仍需要在 Vercel 导入 GitHub 仓库或使用本地 Vercel CLI。详细发布步骤见 `docs/publishing.md`。
