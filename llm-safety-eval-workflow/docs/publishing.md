# Publishing Guide

本项目已经发布到 GitHub、Vercel 与 GitHub Pages。当前状态是：GitHub 仓库已创建并上传完整文件树；Vercel 项目已创建并部署生产环境；GitHub Pages 已启用并由 Actions 自动发布。

## 当前状态

- 本地 demo：`demo/index.html`
- GitHub 仓库：<https://github.com/yuyangjungle/llm-safety-eval-workflow>
- Vercel Demo：<https://llm-safety-eval-workflow.vercel.app>
- GitHub Pages Demo：<https://yuyangjungle.github.io/llm-safety-eval-workflow/>
- Vercel 根目录入口：仓库根目录 `index.html` + `vercel.json`
- 项目内 Vercel 入口：`llm-safety-eval-workflow/index.html` + `llm-safety-eval-workflow/vercel.json`
- 简历 PDF：`resume/bytedance_ai_data_resume.pdf`
- 验证脚本：`scripts/verify_mvp.py`

## GitHub 发布路径

推荐仓库名：

```text
llm-safety-eval-workflow
```

仓库已创建：

```text
https://github.com/yuyangjungle/llm-safety-eval-workflow
```

如果使用本地 git 推送，执行：

```powershell
git remote add origin https://github.com/yuyangjungle/llm-safety-eval-workflow.git
git push -u origin master
```

也可以从仓库根目录运行自动化脚本：

```powershell
.\scripts\publish_after_auth.ps1 -RepoUrl "https://github.com/yuyangjungle/llm-safety-eval-workflow.git"
```

如果已安装并登录 Vercel CLI：

```powershell
.\scripts\publish_after_auth.ps1 -RepoUrl "https://github.com/yuyangjungle/llm-safety-eval-workflow.git" -DeployVercel
```

当前本地 git 曾因 `127.0.0.1:7890` 代理不可用导致无法连接 GitHub。如果再次遇到推送失败，优先检查代理是否开启，或临时清除 git 的 `http.proxy` / `https.proxy` 配置。

如果本地 git 网络仍不可用，可以使用仓库根目录的 API 发布脚本，它会读取 Git Credential Manager 中已有的 GitHub 登录态，不会打印 token：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish_via_github_api.ps1
```

如果希望仓库根目录就是项目本身，可以把 `llm-safety-eval-workflow/` 目录作为独立仓库发布；如果直接发布当前工作区，Vercel 根目录配置和 GitHub Pages workflow 都已经能跳转到 demo。

## GitHub Pages 路径

当前仓库包含 `.github/workflows/pages.yml`。GitHub Pages 已启用并通过 GitHub Actions 发布静态 demo：

```text
https://yuyangjungle.github.io/llm-safety-eval-workflow/
```

根路径会显示 `index.html`，并跳转到：

```text
/llm-safety-eval-workflow/demo/
```

## Vercel 发布路径

当前 Vercel 生产环境：

```text
https://llm-safety-eval-workflow.vercel.app
```

根目录的 `vercel.json` 将根路径指向 demo，并显式设置为静态站点，避免被 Python 脚本误判为 Python 服务。

如需重新部署，可从当前工作区运行：

```powershell
vercel deploy --prod
```

如果从项目子目录部署：

```powershell
cd llm-safety-eval-workflow
vercel deploy --prod
```

## 发布后需要更新

1. 将线上 demo URL 写入 `README.md` 的「在线展示」。
2. 将 GitHub repo URL 和 Vercel/GitHub Pages demo URL 写入简历 PDF。
3. 重新运行：

```powershell
python scripts/verify_mvp.py
python scripts/build_resume_pdf.py
```

## 当前注意事项

- GitHub：仓库已发布；本地 git push 仍可能被代理配置影响，但 API 发布脚本可用。
- Vercel：CLI 已登录并创建项目；`.vercel/` 与 `.env.local` 保持本地忽略，不提交到公开仓库。
- 本机 git 网络可能受 `127.0.0.1:7890` 代理影响。

## 当前待完成

1. 后续如有内容更新，运行 `npm run verify` 与 `npm run resume`。
2. 用 `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish_via_github_api.ps1` 同步 GitHub。
3. 用 `vercel deploy --prod` 更新 Vercel Demo。
