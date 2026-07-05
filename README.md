# LLM Safety Eval Workflow

[![Verify data workflow](https://github.com/yuyangjungle/llm-safety-eval-workflow/actions/workflows/verify.yml/badge.svg)](https://github.com/yuyangjungle/llm-safety-eval-workflow/actions/workflows/verify.yml)
[![Vercel Demo](https://img.shields.io/badge/Vercel-live-000?logo=vercel)](https://llm-safety-eval-workflow.vercel.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2ea44f?logo=github)](https://yuyangjungle.github.io/llm-safety-eval-workflow/)

面向 AI 数据与安全方向的可展示项目：用一个可复现 workflow 展示从安全风险分类、评测样本生产、schema 校验、模型输出评测到 bad case 数据迭代的完整闭环，并提供 Vercel Serverless 实时单样本模型评测 Demo。

## 快速入口

- Vercel Demo: https://llm-safety-eval-workflow.vercel.app
- GitHub Repo: https://github.com/yuyangjungle/llm-safety-eval-workflow
- GitHub Pages: https://yuyangjungle.github.io/llm-safety-eval-workflow/
- 项目 README: [llm-safety-eval-workflow/README.md](llm-safety-eval-workflow/README.md)
- HR 快速项目卡: [llm-safety-eval-workflow/docs/hr_snapshot.md](llm-safety-eval-workflow/docs/hr_snapshot.md)
- 面试速记: [llm-safety-eval-workflow/docs/interview_brief.md](llm-safety-eval-workflow/docs/interview_brief.md)
- Case Study: [llm-safety-eval-workflow/docs/case_study.md](llm-safety-eval-workflow/docs/case_study.md)
- 下一轮补样计划: [llm-safety-eval-workflow/docs/next_sampling_plan.md](llm-safety-eval-workflow/docs/next_sampling_plan.md)
- 人审抽检协议: [llm-safety-eval-workflow/docs/human_review_protocol.md](llm-safety-eval-workflow/docs/human_review_protocol.md)
- Live API Eval: [llm-safety-eval-workflow/docs/live_api_eval.md](llm-safety-eval-workflow/docs/live_api_eval.md)
- Verification Guide: [llm-safety-eval-workflow/docs/verification.md](llm-safety-eval-workflow/docs/verification.md)

## 当前产物

- 32 条安全评测样本，覆盖 8 类风险。
- 两组候选模型输出：`baseline_naive_v0` 与 `safety_workflow_v1`。
- 可复现的 rubric judge、bad case 归因和补样建议。
- Vercel dashboard demo，可用于 HR 预览和面试讲解，并支持后端实时调用单条样本评测。
- 针对字节 AI 数据与安全中台 JD 的项目说明、简历证据映射和 PDF 简历草稿。

## 本地运行

```powershell
npm run generate
npm run verify
npm run verify:public
npm run serve
```

访问：

```text
http://localhost:8000/llm-safety-eval-workflow/demo/
```

生成简历 PDF：

```powershell
python -m pip install -r requirements.txt
npm run resume
```

## 发布说明

当前 GitHub、Vercel 和 GitHub Pages 均已发布。若本机 `git push` 因代理 `127.0.0.1:7890` 失败，可使用仓库内的 GitHub API 发布脚本：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish_via_github_api.ps1 -Owner yuyangjungle -Repo llm-safety-eval-workflow -Branch main -Message "Update project"
```
