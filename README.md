# LLM Safety Eval Workflow

[![Verify data workflow](https://github.com/yuyangjungle/llm-safety-eval-workflow/actions/workflows/verify.yml/badge.svg)](https://github.com/yuyangjungle/llm-safety-eval-workflow/actions/workflows/verify.yml)
[![Vercel Demo](https://img.shields.io/badge/Vercel-live-000?logo=vercel)](https://llm-safety-eval-workflow.vercel.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2ea44f?logo=github)](https://yuyangjungle.github.io/llm-safety-eval-workflow/)

Portfolio-ready AI Data & Safety workflow release candidate: a reproducible LLM safety evaluation data workflow covering risk taxonomy, sample production, schema checks, live model response, rubric judge, bad case analysis, data action, and next-round sampling.

## Quick Links

- Vercel Demo: https://llm-safety-eval-workflow.vercel.app
- GitHub Repo: https://github.com/yuyangjungle/llm-safety-eval-workflow
- GitHub Pages: https://yuyangjungle.github.io/llm-safety-eval-workflow/
- Project README: [llm-safety-eval-workflow/README.md](llm-safety-eval-workflow/README.md)
- Project Snapshot: [llm-safety-eval-workflow/docs/hr_snapshot.md](llm-safety-eval-workflow/docs/hr_snapshot.md)
- Product Brief: [llm-safety-eval-workflow/docs/interview_brief.md](llm-safety-eval-workflow/docs/interview_brief.md)
- Live API Eval: [llm-safety-eval-workflow/docs/live_api_eval.md](llm-safety-eval-workflow/docs/live_api_eval.md)
- Human Review: [llm-safety-eval-workflow/docs/human_review_protocol.md](llm-safety-eval-workflow/docs/human_review_protocol.md)
- Sampling Plan: [llm-safety-eval-workflow/docs/next_sampling_plan.md](llm-safety-eval-workflow/docs/next_sampling_plan.md)
- Release Notes v0.2.0: [llm-safety-eval-workflow/docs/release_notes_v0.2.0.md](llm-safety-eval-workflow/docs/release_notes_v0.2.0.md)
- Verification Guide: [llm-safety-eval-workflow/docs/verification.md](llm-safety-eval-workflow/docs/verification.md)

## What This Project Demonstrates

- Turns abstract LLM safety risks into a structured data taxonomy and sample pool.
- Produces 32 evaluation samples across 8 risk categories with schema and rubric fields.
- Compares 64 candidate outputs from two model-response strategies.
- Uses rubric judge results to identify bad cases, recommend data actions, and plan the next sampling round.
- Runs a real Vercel Serverless live API eval for one selected sample without exposing the model API key to the browser.

## Current MVP Scope

- Online dashboard for workflow explanation and sample exploration.
- Live single-sample DeepSeek evaluation through `/api/run-eval`.
- Frontend-driven Recent Runs and Human Review Queue views built from existing evaluation artifacts.
- Reproducible local scripts for sample generation, quality checks, model-output judging, and public surface verification.

## Not Production-Grade Yet

This is a portfolio MVP and release candidate, not a production labeling platform. It does not include authentication, persistent history, a database, queue-backed batch jobs, reviewer assignment operations, cost monitoring, or audit-log storage.

## Next Steps Toward Production

- Batch evaluation jobs.
- Persistent evaluation history.
- Human review console.
- Model and prompt version comparison.
- Cost and latency monitoring.
- Access control.
- Audit log and data versioning.

## Local Run

```powershell
npm run generate
npm run verify
npm run verify:public
npm run serve
```

Visit:

```text
http://localhost:8000/llm-safety-eval-workflow/demo/
```

## Publishing

GitHub, Vercel, and GitHub Pages are already configured. If normal `git push` fails because of the local proxy `127.0.0.1:7890`, use the repository's GitHub API publishing script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish_via_github_api.ps1 -Owner yuyangjungle -Repo llm-safety-eval-workflow -Branch main -Message "Update project"
```
