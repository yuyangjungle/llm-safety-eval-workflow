from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DOCS_DIR = ROOT / "docs"
RESULTS_DIR = ROOT / "results"
DEMO_DIR = ROOT / "demo"

REQUIRED_FIELDS = [
    "id",
    "source_type",
    "risk_type",
    "modality",
    "scenario",
    "user_prompt",
    "expected_behavior",
    "label",
    "rubric",
    "notes",
]


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def ratio(value: int, total: int) -> float:
    return round(value / total, 4) if total else 0.0


def validate_sample(sample: dict, taxonomy_ids: set[str]) -> list[str]:
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in sample or sample[field] in ("", None, []):
            errors.append(f"missing:{field}")
    if sample.get("risk_type") not in taxonomy_ids:
        errors.append("invalid:risk_type")
    label = sample.get("label", {})
    if label.get("severity") not in {"low", "medium", "high"}:
        errors.append("invalid:severity")
    if label.get("difficulty") not in {1, 2, 3}:
        errors.append("invalid:difficulty")
    if not isinstance(label.get("should_refuse"), bool):
        errors.append("invalid:should_refuse")
    rubric = sample.get("rubric", [])
    if len(rubric) < 3:
        errors.append("weak:rubric_count")
    weight_sum = round(sum(item.get("weight", 0) for item in rubric), 2)
    if abs(weight_sum - 1.0) > 0.05:
        errors.append("weak:rubric_weight_sum")
    return errors


def build_report(taxonomy: list[dict], samples: list[dict]) -> dict:
    taxonomy_ids = {item["id"] for item in taxonomy}
    errors_by_id = {}
    for sample in samples:
        errors = validate_sample(sample, taxonomy_ids)
        if errors:
            errors_by_id[sample["id"]] = errors

    total = len(samples)
    valid_count = total - len(errors_by_id)
    prompts = [sample["user_prompt"] for sample in samples]
    unique_prompt_count = len(set(prompts))
    risk_counts = Counter(sample["risk_type"] for sample in samples)
    severity_counts = Counter(sample["label"]["severity"] for sample in samples)
    difficulty_counts = Counter(str(sample["label"]["difficulty"]) for sample in samples)
    source_counts = Counter(sample["source_type"] for sample in samples)

    missing_categories = [risk_id for risk_id in sorted(taxonomy_ids) if risk_counts[risk_id] == 0]
    below_target = [risk_id for risk_id in sorted(taxonomy_ids) if risk_counts[risk_id] < 3]
    rubric_complete = sum(1 for sample in samples if len(sample.get("rubric", [])) >= 3)

    gates = {
        "schema_pass_rate_gte_95": ratio(valid_count, total) >= 0.95,
        "all_categories_covered": len(missing_categories) == 0,
        "each_category_has_3_samples": len(below_target) == 0,
        "unique_prompt_ratio_gte_90": ratio(unique_prompt_count, total) >= 0.9,
        "rubric_complete_gte_95": ratio(rubric_complete, total) >= 0.95,
        "difficulty_has_1_2_3": {"1", "2", "3"}.issubset(set(difficulty_counts.keys())),
    }

    recommendations = []
    if below_target:
        recommendations.append(f"补充样本不足的风险类型：{', '.join(below_target)}。")
    if not gates["difficulty_has_1_2_3"]:
        recommendations.append("补齐难度 1/2/3 的分布，避免评测集只覆盖简单拒答。")
    if errors_by_id:
        recommendations.append("优先修复 schema 或 rubric 错误样本，避免进入评测集。")
    if not recommendations:
        recommendations.append("进入下一轮：接入真实模型输出，加入 LLM-as-judge 与人工抽检一致性评估。")

    category_detail = []
    for item in taxonomy:
        category_samples = [sample for sample in samples if sample["risk_type"] == item["id"]]
        category_detail.append(
            {
                "id": item["id"],
                "name": item["name"],
                "count": len(category_samples),
                "expected_behavior": item["expected_behavior"],
                "example_prompt": category_samples[0]["user_prompt"] if category_samples else "",
            }
        )

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sample_count": total,
        "metrics": {
            "schema_pass_rate": ratio(valid_count, total),
            "taxonomy_coverage_rate": ratio(len(taxonomy_ids) - len(missing_categories), len(taxonomy_ids)),
            "unique_prompt_ratio": ratio(unique_prompt_count, total),
            "rubric_completeness_rate": ratio(rubric_complete, total),
        },
        "distributions": {
            "risk_counts": dict(sorted(risk_counts.items())),
            "severity_counts": dict(sorted(severity_counts.items())),
            "difficulty_counts": dict(sorted(difficulty_counts.items())),
            "source_counts": dict(sorted(source_counts.items())),
        },
        "quality_gates": gates,
        "errors_by_id": errors_by_id,
        "category_detail": category_detail,
        "recommendations": recommendations,
        "workflow_notes": {
            "mvp_scope": "离线规则校验与覆盖率评估，尚未接入真实模型调用。",
            "next_iteration": "接入候选模型输出、LLM-as-judge、人工抽检一致性和失败样本自动补样。",
        },
    }


def write_markdown_report(report: dict) -> None:
    metrics = report["metrics"]
    gates = report["quality_gates"]
    lines = [
        "# LLM 安全评测数据质量报告",
        "",
        f"生成时间：{report['generated_at']}",
        "",
        "## 摘要",
        "",
        f"- 样本总数：{report['sample_count']}",
        f"- Schema 完整率：{metrics['schema_pass_rate']:.0%}",
        f"- 风险类型覆盖率：{metrics['taxonomy_coverage_rate']:.0%}",
        f"- Prompt 去重率：{metrics['unique_prompt_ratio']:.0%}",
        f"- Rubric 完整率：{metrics['rubric_completeness_rate']:.0%}",
        "",
        "## 质量门禁",
        "",
    ]
    for gate, passed in gates.items():
        status = "PASS" if passed else "FAIL"
        lines.append(f"- `{gate}`: {status}")

    lines.extend(["", "## 风险类型覆盖", ""])
    lines.append("| 风险类型 | 样本数 | 示例 |")
    lines.append("| --- | ---: | --- |")
    for item in report["category_detail"]:
        prompt = item["example_prompt"].replace("|", " ")
        lines.append(f"| {item['name']} | {item['count']} | {prompt} |")

    lines.extend(["", "## 分布", ""])
    for name, values in report["distributions"].items():
        lines.append(f"### {name}")
        lines.append("")
        for key, value in values.items():
            lines.append(f"- {key}: {value}")
        lines.append("")

    lines.extend(["## 下一轮数据策略", ""])
    for recommendation in report["recommendations"]:
        lines.append(f"- {recommendation}")

    lines.extend(
        [
            "",
            "## MVP 边界",
            "",
            "- 当前报告基于离线规则校验与覆盖率统计，不代表真实线上模型安全效果。",
            "- 下一步应接入真实模型输出，比较模型失败率、LLM-as-judge 与人工抽检一致性，并基于失败样本补充合成数据。",
            "",
        ]
    )

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "eval_report.md").write_text("\n".join(lines), encoding="utf-8")


def write_demo_data(taxonomy: list[dict], samples: list[dict], report: dict) -> None:
    payload = {
        "taxonomy": taxonomy,
        "samples": samples,
        "report": report,
    }
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    js = "window.WORKFLOW_DATA = "
    js += json.dumps(payload, ensure_ascii=False, indent=2)
    js += ";\n"
    (DEMO_DIR / "data.js").write_text(js, encoding="utf-8")


def main() -> None:
    taxonomy = load_json(DATA_DIR / "risk_taxonomy.json")
    samples = load_json(DATA_DIR / "all_samples.json")
    report = build_report(taxonomy, samples)
    dump_json(RESULTS_DIR / "quality_report.json", report)
    write_markdown_report(report)
    write_demo_data(taxonomy, samples, report)
    print(f"Evaluated {report['sample_count']} samples.")
    print(f"Schema pass rate: {report['metrics']['schema_pass_rate']:.0%}")
    print("Wrote results/quality_report.json, docs/eval_report.md, demo/data.js.")


if __name__ == "__main__":
    main()

