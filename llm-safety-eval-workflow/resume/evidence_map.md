# 简历证据映射

| 简历描述 | 支撑文件 | 当前证据强度 |
| --- | --- | --- |
| 设计 8 类 LLM 安全风险分类体系 | `data/risk_taxonomy.json`, `docs/data_taxonomy.md` | 已完成 MVP |
| 定义评测样本 schema 与 judge rubric | `docs/schema.md`, `data/seed_samples.json` | 已完成 MVP |
| 生成 32 条 MVP 样本 | `scripts/generate_samples.py`, `data/all_samples.json` | 运行脚本后验证 |
| 输出质量验收报告 | `scripts/evaluate_quality.py`, `docs/eval_report.md`, `results/quality_report.json` | 运行脚本后验证 |
| 静态 demo 展示样本浏览和质量门禁 | `demo/index.html`, `demo/app.js`, `demo/data.js` | 运行脚本后验证 |
| 候选模型输出、rubric judge、bad case 与数据飞轮 | `data/model_outputs.json`, `scripts/judge_outputs.py`, `docs/model_eval_report.md`, `docs/data_flywheel.md` | 已完成增强版 MVP |
| 完整字节定制简历草稿 | `resume/bytedance_ai_data_resume_full.md` | 已完成文字版，尚未排版为 PDF |
| 后续可接入真实模型输出与 LLM-as-judge | `README.md`, `docs/jd_alignment.md` | 规划中，不能写成已完成 |
