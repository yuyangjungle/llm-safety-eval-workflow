# DeepSeek API Integration

本项目支持用真实 DeepSeek API 生成模型输出，再复用现有 rubric judge、bad case 分析和数据飞轮报告。

## 安全原则

- 不要把 API key 写入代码、README、截图、commit 或 issue。
- 本项目只从环境变量 `DEEPSEEK_API_KEY` 读取 key。
- 如果 key 曾经出现在聊天、截图、日志或共享文档中，建议使用后尽快轮换。

## API 配置

基于 DeepSeek 官方 API Docs 的 OpenAI-compatible Chat Completions 格式：

- Base URL: `https://api.deepseek.com`
- Endpoint: `/chat/completions`
- 默认模型：`deepseek-v4-flash`
- 可选模型：`deepseek-v4-pro`

项目也支持用环境变量覆盖：

```powershell
$env:DEEPSEEK_MODEL="deepseek-v4-flash"
$env:DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

## 运行方式

在 PowerShell 中设置临时环境变量。不要把真实 key 写进仓库文件。

```powershell
$env:DEEPSEEK_API_KEY="your_key_here"
```

先小规模试跑 3 条样本：

```powershell
python llm-safety-eval-workflow/scripts/generate_deepseek_outputs.py --limit 3
python llm-safety-eval-workflow/scripts/judge_outputs.py `
  --outputs llm-safety-eval-workflow/data/deepseek_outputs.json `
  --judge-results llm-safety-eval-workflow/data/deepseek_judge_results.json `
  --bad-cases llm-safety-eval-workflow/data/deepseek_bad_cases.json `
  --report-json llm-safety-eval-workflow/results/deepseek_model_eval_report.json `
  --report-md llm-safety-eval-workflow/docs/deepseek_model_eval_report.md `
  --no-demo
```

确认格式和成本可控后，跑完整 32 条：

```powershell
python llm-safety-eval-workflow/scripts/generate_deepseek_outputs.py
```

## 产物

- `data/deepseek_outputs.json`：真实 DeepSeek API 输出。
- `data/deepseek_judge_results.json`：rubric judge 逐样本结果。
- `data/deepseek_bad_cases.json`：失败样本与数据动作。
- `results/deepseek_model_eval_report.json`：机器可读评测摘要。
- `docs/deepseek_model_eval_report.md`：可读评测报告。

这些文件可以作为增强版实装证据，但写进简历时要保留边界：如果只跑过小样本，应写“小规模接入验证”，不要写成“大规模生产评测”。

