# LLM Safety Eval Workflow Workspace

This repository contains a static demo and evidence-backed resume project for an LLM safety evaluation data workflow.

Current publish status:

- GitHub repository is published: https://github.com/yuyangjungle/llm-safety-eval-workflow
- Vercel connector is reachable, but deployment still needs either Vercel Git import or a local Vercel CLI login.
- Local `git push` may fail while the global git proxy points to an unavailable `127.0.0.1:7890` proxy.

Open the demo locally:

```powershell
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/llm-safety-eval-workflow/demo/
```

Optional PDF resume generation requires Python dependencies:

```powershell
python -m pip install -r requirements.txt
npm run resume
```

Main project README:

```text
llm-safety-eval-workflow/README.md
```
