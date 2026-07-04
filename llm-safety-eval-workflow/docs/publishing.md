# Publishing Guide

本项目已经发布到 GitHub，仍待完成 Vercel 在线部署。当前状态是：GitHub 仓库已创建并上传完整文件树；Vercel 连接器可响应账号信息，但直接部署仍需要一个已绑定的 Vercel 项目、GitHub 集成，或本地 Vercel CLI 登录。

## 当前状态

- 本地 demo：`demo/index.html`
- GitHub 仓库：<https://github.com/yuyangjungle/llm-safety-eval-workflow>
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

当前仓库包含 `.github/workflows/pages.yml`。推送到 GitHub 后，在仓库 Settings -> Pages 中选择 GitHub Actions，或者直接触发 workflow，即可发布静态 demo。

发布后根路径会显示 `index.html`，并跳转到：

```text
/llm-safety-eval-workflow/demo/
```

## Vercel 发布路径

推荐路径是：先把项目推送到 GitHub，再在 Vercel 中 Import 该仓库。导入后，Vercel 会根据仓库根目录的 `vercel.json` 将根路径指向 demo。

如果本地已安装并登录 Vercel CLI，也可以从当前工作区部署：

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

## 当前认证 blocker

- GitHub：仓库已发布；本地 git push 仍可能被代理配置影响，但 API 发布脚本可用。
- Vercel 连接器：可连接账号，但当前没有列出 team；直接部署仍依赖 Vercel 项目绑定或 CLI。
- 本机 CLI：未确认有可用的 `gh` 与 `vercel` 登录态；本地 git 网络可能受 `127.0.0.1:7890` 代理影响。

## 当前待完成

1. 在 Vercel 中导入 GitHub 仓库 `yuyangjungle/llm-safety-eval-workflow`，或登录 Vercel CLI 后运行 `vercel deploy --prod`。
2. 拿到线上 demo URL 后，更新 README 与简历 PDF 中的项目链接。
3. 重新运行 `npm run verify` 与 `npm run resume`。
