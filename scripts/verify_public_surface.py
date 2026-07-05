from __future__ import annotations

import re
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

MARKDOWN_FILES = [
    "README.md",
    "llm-safety-eval-workflow/README.md",
    "llm-safety-eval-workflow/docs/hr_snapshot.md",
    "llm-safety-eval-workflow/docs/human_review_protocol.md",
    "llm-safety-eval-workflow/docs/interview_brief.md",
    "llm-safety-eval-workflow/docs/live_api_eval.md",
    "llm-safety-eval-workflow/docs/next_sampling_plan.md",
    "llm-safety-eval-workflow/docs/case_study.md",
    "llm-safety-eval-workflow/docs/publishing.md",
    "llm-safety-eval-workflow/docs/verification.md",
]

HTML_FILES = [
    "index.html",
    "llm-safety-eval-workflow/index.html",
    "llm-safety-eval-workflow/demo/index.html",
]

STATIC_SITE_FILES = [
    "robots.txt",
    "sitemap.xml",
]

EXTERNAL_PREFIXES = (
    "http://",
    "https://",
    "mailto:",
    "#",
)


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def require(condition: bool, name: str) -> tuple[str, bool]:
    print(f"{name}: {'PASS' if condition else 'FAIL'}")
    return name, condition


def markdown_links(text: str) -> list[str]:
    return [match.group(1).strip() for match in re.finditer(r"\[[^\]]+\]\(([^)]+)\)", text)]


def local_target_exists(base_file: str, href: str) -> bool:
    clean_href = href.split("#", 1)[0]
    if not clean_href or clean_href.startswith(EXTERNAL_PREFIXES):
        return True
    target = (ROOT / base_file).parent / clean_href
    return target.exists()


def png_dimensions(relative_path: str) -> tuple[int, int]:
    path = ROOT / relative_path
    if not path.exists():
        return 0, 0
    with path.open("rb") as file:
        header = file.read(24)
    if not header.startswith(b"\x89PNG\r\n\x1a\n") or header[12:16] != b"IHDR":
        return 0, 0
    return struct.unpack(">II", header[16:24])


def meta_content(html: str, selector: str) -> str:
    if selector.startswith("property="):
        prop = re.escape(selector[len("property=") :])
        pattern = rf'<meta\s+property="{prop}"\s+content="([^"]+)"'
    elif selector.startswith("name="):
        name = re.escape(selector[len("name=") :])
        pattern = rf'<meta\s+name="{name}"\s+content="([^"]+)"'
    else:
        raise ValueError(f"Unsupported selector: {selector}")
    match = re.search(pattern, html)
    return match.group(1) if match else ""


def main() -> None:
    checks: list[tuple[str, bool]] = []

    for file in MARKDOWN_FILES:
        path = ROOT / file
        checks.append(require(path.exists(), f"markdown_exists:{file}"))
        if not path.exists():
            continue
        text = read_text(file)
        missing = [href for href in markdown_links(text) if not local_target_exists(file, href)]
        checks.append(require(not missing, f"markdown_local_links:{file}"))
        if missing:
            print(f"  missing: {missing}")

    root_readme = read_text("README.md")
    project_readme = read_text("llm-safety-eval-workflow/README.md")
    checks.extend(
        [
            require("actions/workflows/verify.yml/badge.svg" in root_readme, "root_readme_verify_badge"),
            require("llm-safety-eval-workflow.vercel.app" in root_readme, "root_readme_vercel_link"),
            require("yuyangjungle.github.io/llm-safety-eval-workflow" in root_readme, "root_readme_pages_link"),
            require("llm-safety-eval-workflow/docs/verification.md" in root_readme, "root_readme_verification_guide_link"),
            require("llm-safety-eval-workflow/docs/hr_snapshot.md" in root_readme, "root_readme_hr_snapshot_link"),
            require("llm-safety-eval-workflow/docs/human_review_protocol.md" in root_readme, "root_readme_human_review_link"),
            require("llm-safety-eval-workflow/docs/live_api_eval.md" in root_readme, "root_readme_live_api_link"),
            require("llm-safety-eval-workflow/docs/next_sampling_plan.md" in root_readme, "root_readme_sampling_plan_link"),
            require("actions/workflows/verify.yml/badge.svg" in project_readme, "project_readme_verify_badge"),
            require("docs/hr_snapshot.md" in project_readme, "project_readme_hr_snapshot_link"),
            require("docs/human_review_protocol.md" in project_readme, "project_readme_human_review_link"),
            require("docs/interview_brief.md" in project_readme, "project_readme_interview_brief_link"),
            require("docs/live_api_eval.md" in project_readme, "project_readme_live_api_link"),
            require("docs/next_sampling_plan.md" in project_readme, "project_readme_sampling_plan_link"),
            require("docs/verification.md" in project_readme, "project_readme_verification_guide_link"),
            require("docs/model_eval_report.md" in project_readme, "project_readme_model_report_link"),
        ]
    )

    for file in HTML_FILES:
        html = read_text(file)
        checks.extend(
            [
                require("LLM Safety Eval Workflow | AI Data & Safety MVP" in html, f"html_title:{file}"),
                require("portfolio-ready LLM safety evaluation data workflow" in html, f"html_description:{file}"),
                require('rel="canonical"' in html, f"html_canonical:{file}"),
                require(meta_content(html, "property=og:image").endswith("results/demo-chrome-screenshot.png"), f"html_og_image:{file}"),
                require(meta_content(html, "name=twitter:card") == "summary_large_image", f"html_twitter_card:{file}"),
            ]
        )

    for file in STATIC_SITE_FILES:
        checks.append(require((ROOT / file).exists(), f"static_site_file_exists:{file}"))

    screenshot_path = "llm-safety-eval-workflow/results/demo-chrome-screenshot.png"
    screenshot_file = ROOT / screenshot_path
    screenshot_width, screenshot_height = png_dimensions(screenshot_path)
    checks.extend(
        [
            require(screenshot_file.exists(), "demo_screenshot_exists"),
            require(screenshot_width >= 1200 and screenshot_height >= 2400, "demo_screenshot_large_enough"),
            require(screenshot_file.exists() and screenshot_file.stat().st_size >= 250_000, "demo_screenshot_has_content"),
        ]
    )

    robots = read_text("robots.txt")
    sitemap = read_text("sitemap.xml")
    checks.extend(
        [
            require("Sitemap: https://llm-safety-eval-workflow.vercel.app/sitemap.xml" in robots, "robots_sitemap_url"),
            require("<loc>https://llm-safety-eval-workflow.vercel.app/</loc>" in sitemap, "sitemap_root_url"),
            require("<loc>https://llm-safety-eval-workflow.vercel.app/llm-safety-eval-workflow/demo/</loc>" in sitemap, "sitemap_demo_url"),
            require("docs/human_review_protocol.md" in sitemap, "sitemap_human_review_url"),
            require("docs/hr_snapshot.md" in sitemap, "sitemap_hr_snapshot_url"),
            require("docs/interview_brief.md" in sitemap, "sitemap_interview_brief_url"),
            require("docs/live_api_eval.md" in sitemap, "sitemap_live_api_url"),
            require("docs/next_sampling_plan.md" in sitemap, "sitemap_sampling_plan_url"),
            require("docs/verification.md" in sitemap, "sitemap_verification_url"),
        ]
    )

    demo_html = read_text("llm-safety-eval-workflow/demo/index.html")
    checks.extend(
        [
            require("https://github.com/yuyangjungle/llm-safety-eval-workflow" in demo_html, "demo_github_link"),
            require("https://llm-safety-eval-workflow.vercel.app" in demo_html, "demo_vercel_link"),
            require("../docs/hr_snapshot.md" in demo_html, "demo_hr_snapshot_link"),
            require("../docs/human_review_protocol.md" in demo_html, "demo_human_review_link"),
            require("../docs/interview_brief.md" in demo_html, "demo_interview_brief_link"),
            require("../docs/next_sampling_plan.md" in demo_html, "demo_sampling_plan_link"),
            require("../docs/case_study.md" in demo_html, "demo_case_study_link"),
            require("../docs/model_eval_report.md" in demo_html, "demo_model_report_link"),
            require('id="bad-case-triage"' in demo_html, "demo_bad_case_triage_mount"),
            require('id="human-review-queue"' in demo_html, "demo_human_review_mount"),
            require('id="sampling-plan"' in demo_html, "demo_sampling_plan_mount"),
            require('id="live-sample"' in demo_html, "demo_live_sample_mount"),
            require('id="run-live-eval"' in demo_html, "demo_live_eval_button"),
            require('id="live-eval-result"' in demo_html, "demo_live_eval_result_mount"),
        ]
    )

    demo_app = read_text("llm-safety-eval-workflow/demo/app.js")
    checks.extend(
        [
            require("function renderBadCaseTriage()" in demo_app, "demo_app_renders_bad_case_triage"),
            require("function renderHumanReviewQueue()" in demo_app, "demo_app_renders_human_review_queue"),
            require("function renderSamplingPlan()" in demo_app, "demo_app_renders_sampling_plan"),
            require("function badCasePriority(item)" in demo_app, "demo_app_derives_bad_case_priority"),
            require("function groupBadCases(cases)" in demo_app, "demo_app_groups_bad_cases"),
            require("async function runLiveEval()" in demo_app, "demo_app_runs_live_eval"),
            require('fetch("/api/run-eval"' in demo_app, "demo_app_calls_live_api"),
            require("function escapeHtml(value)" in demo_app, "demo_app_escapes_live_output"),
        ]
    )

    live_api = read_text("api/run-eval.js")
    checks.extend(
        [
            require('process.env.DEEPSEEK_API_KEY' in live_api, "live_api_reads_env_key"),
            require("sampleId" in live_api, "live_api_uses_sample_id"),
            require("readSamples()" in live_api, "live_api_loads_sample_bank"),
            require("callModel" in live_api and "/chat/completions" in live_api, "live_api_calls_model"),
            require("judgeOutput" in live_api, "live_api_returns_judge"),
            require("rateBuckets" in live_api, "live_api_has_rate_limit"),
        ]
    )

    demo_data = read_text("llm-safety-eval-workflow/demo/data.js")
    checks.extend(
        [
            require("modelOutputs" in demo_data, "demo_data_model_outputs"),
            require("judgeResults" in demo_data, "demo_data_judge_results"),
            require("baseline_naive_v0" in demo_data, "demo_data_baseline_model"),
            require("humanReviewProtocol" in demo_data, "demo_data_human_review_protocol"),
            require("double_review_count" in demo_data, "demo_data_human_review_double_review"),
            require("safety_workflow_v1" in demo_data, "demo_data_safety_model"),
            require("samplingPlan" in demo_data, "demo_data_sampling_plan"),
            require("total_target_new_samples" in demo_data, "demo_data_sampling_plan_targets"),
        ]
    )

    verify_workflow = read_text(".github/workflows/verify.yml")
    pages_workflow = read_text(".github/workflows/pages.yml")
    checks.extend(
        [
            require("npm run generate" in verify_workflow, "ci_runs_generate"),
            require("npm run verify" in verify_workflow, "ci_runs_verify"),
            require("npm run verify:public" in verify_workflow, "ci_runs_public_surface_verify"),
            require("PAGES_ARTIFACT_NAME: github-pages-${{ github.run_id }}-${{ github.run_attempt }}" in pages_workflow, "pages_unique_artifact_name"),
            require("artifact_name: ${{ env.PAGES_ARTIFACT_NAME }}" in pages_workflow, "pages_deploy_uses_unique_artifact"),
        ]
    )

    vercel_config = read_text("vercel.json")
    checks.extend(
        [
            require('"destination": "/llm-safety-eval-workflow/demo/"' in vercel_config, "vercel_root_redirects_to_demo"),
            require('"framework": null' in vercel_config, "vercel_static_framework_config"),
        ]
    )

    failed = [name for name, passed in checks if not passed]
    if failed:
        raise SystemExit(f"Failed public surface checks: {failed}")

    print("Public surface verification passed.")


if __name__ == "__main__":
    main()
