# Verification Guide

这份文档说明如何验证项目不是只停留在静态展示，而是具备可复现的数据 workflow、公开展示入口和部署状态证据。

## 本地验证

从仓库根目录运行：

```powershell
npm run generate
npm run verify
npm run verify:public
```

三条命令分别覆盖：

| 命令 | 验证内容 |
| --- | --- |
| `npm run generate` | 重新生成 synthetic samples、quality report、candidate outputs、rubric judge、bad cases 和 demo data |
| `npm run verify` | 验证 8 类风险、32 条样本、质量门禁、模型评测、简历证据等 MVP 核心指标 |
| `npm run verify:public` | 验证 README 链接、badge、demo meta、OG/Twitter card、证据链链接、Pages/Vercel 配置和 CI 关键步骤 |

## GitHub Actions

公开仓库使用两条 workflow：

| Workflow | 文件 | 作用 |
| --- | --- | --- |
| Verify data workflow | `.github/workflows/verify.yml` | 在 push / pull request 时运行 `generate`、`verify`、`verify:public`，并上传报告 artifact |
| Deploy static demo to GitHub Pages | `.github/workflows/pages.yml` | 发布整个静态站点到 GitHub Pages fallback |

`pages.yml` 使用 `github.run_id` 和 `github.run_attempt` 生成唯一 artifact 名，避免 rerun 时多个 `github-pages` artifact 撞名导致部署失败。

## 公开入口

| Surface | URL | 期望 |
| --- | --- | --- |
| GitHub Repo | https://github.com/yuyangjungle/llm-safety-eval-workflow | README、badge、topic、case study 和 verification docs 可见 |
| Vercel Demo | https://llm-safety-eval-workflow.vercel.app | 生产 alias 指向静态 demo，Vercel CLI `inspect` 应显示 Ready |
| GitHub Pages | https://yuyangjungle.github.io/llm-safety-eval-workflow/ | fallback 静态站点可访问，并跳转到 demo |

## Demo 展示验收

demo 页面应至少能看到：

- `Interview Evidence` / 面试证据链
- GitHub、Vercel、Interview Brief、Case Study、Model Report 链接
- `baseline_naive_v0` 与 `safety_workflow_v1` 两组模型输出对比
- `Rubric Judge Trace` / 判分追踪
- bad case 和数据动作建议

## Vercel 验证说明

Vercel 对连续 headless browser 或命令行 HTTP 请求可能返回 security checkpoint / 403。出现这种情况时，不直接等价于真实用户访问失败。更可靠的部署状态证据是：

```powershell
npx vercel inspect https://llm-safety-eval-workflow.vercel.app
npx vercel ls llm-safety-eval-workflow --yes
```

期望 production deployment 显示 `Ready`，并且 aliases 包含：

```text
https://llm-safety-eval-workflow.vercel.app
```

## 面试时如何引用

可以这样说：

> 这个项目不只放了静态 demo。我补了两层验证：一层是数据 workflow 的 generate + verify，确保样本、评测报告、bad case 和简历证据能复现；另一层是 public surface verification，检查 README、badge、Open Graph、demo 证据链、Pages/Vercel 配置和 GitHub Actions 关键步骤，保证项目作为公开作品集链接不会悄悄失效。
