from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "README.md",
    "data/risk_taxonomy.json",
    "data/seed_samples.json",
    "data/synthetic_samples.json",
    "data/all_samples.json",
    "docs/data_taxonomy.md",
    "docs/schema.md",
    "docs/eval_report.md",
    "demo/index.html",
    "demo/app.js",
    "demo/styles.css",
    "demo/data.js",
    "results/quality_report.json",
    "results/model_eval_report.json",
    "results/demo-chrome-screenshot.png",
    "results/resume_preview-1.png",
    "data/model_outputs.json",
    "data/judge_results.json",
    "data/bad_cases.json",
    "data/human_review_protocol.json",
    "data/next_sampling_plan.json",
    "docs/case_study.md",
    "docs/human_review_protocol.md",
    "docs/model_eval_report.md",
    "docs/next_sampling_plan.md",
    "docs/llm_as_judge.md",
    "docs/data_flywheel.md",
    "docs/publishing.md",
    "resume/bytedance_ai_data_resume_full.md",
    "resume/bytedance_ai_data_resume.pdf",
    "resume/evidence_map.md",
]


def read_json(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


def main() -> None:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).exists()]
    if missing:
        raise SystemExit(f"Missing required files: {missing}")

    taxonomy = read_json("data/risk_taxonomy.json")
    samples = read_json("data/all_samples.json")
    report = read_json("results/quality_report.json")
    model_report = read_json("results/model_eval_report.json")
    model_outputs = read_json("data/model_outputs.json")
    bad_cases = read_json("data/bad_cases.json")
    human_review = read_json("data/human_review_protocol.json")
    sampling_plan = read_json("data/next_sampling_plan.json")
    resume = (ROOT / "resume/bytedance_ai_data_resume_full.md").read_text(encoding="utf-8")

    checks = {
        "taxonomy_has_8_categories": len(taxonomy) == 8,
        "sample_count_is_32": len(samples) == 32,
        "report_sample_count_is_32": report["sample_count"] == 32,
        "all_quality_gates_pass": all(report["quality_gates"].values()),
        "model_outputs_cover_two_models": len(model_outputs) == 64,
        "model_report_has_two_models": len(model_report["model_summary"]) == 2,
        "bad_cases_exist": len(bad_cases) > 0,
        "human_review_queue_has_items": len(human_review["items"]) > 0,
        "human_review_has_double_review": human_review["double_review_count"] > 0,
        "sampling_plan_has_items": len(sampling_plan["items"]) > 0,
        "sampling_plan_targets_new_samples": sampling_plan["total_target_new_samples"] > 0,
        "resume_contains_new_project": "LLM 安全评测数据生产与质量验收 Workflow MVP" in resume,
        "resume_contains_sample_count": "32 条 MVP 样本" in resume,
        "resume_contains_model_eval": "rubric judge" in resume and "bad case" in resume,
    }

    failed = [name for name, passed in checks.items() if not passed]
    for name, passed in checks.items():
        print(f"{name}: {'PASS' if passed else 'FAIL'}")

    if failed:
        raise SystemExit(f"Failed checks: {failed}")

    print("MVP verification passed.")


if __name__ == "__main__":
    main()
