const data = window.WORKFLOW_DATA;

const state = {
  riskType: "all",
  query: "",
  liveSampleId: data.samples[0]?.id || "",
  liveEvalLoading: false,
  liveEvalResult: null,
  liveEvalError: "",
};

const productionRoadmap = [
  ["Batch evaluation", "把单样本评测扩展为批量任务，支持队列、重试和任务状态。"],
  ["Persistent history", "保存每次评测的样本、模型版本、judge 分数、延迟和数据动作。"],
  ["Human review console", "支持复核分配、双人审核、冲突仲裁和抽检结果回写。"],
  ["Model version comparison", "按模型、prompt、rubric 版本追踪 pass rate 和 bad case 变化。"],
  ["Cost & latency monitor", "监控 token 使用、单次成本、延迟分布和异常率。"],
  ["Access control & audit log", "增加权限、密钥治理、操作审计和数据版本追溯。"],
];

const taxonomyById = Object.fromEntries(data.taxonomy.map((item) => [item.id, item]));
const sampleById = Object.fromEntries(data.samples.map((item) => [item.id, item]));
const outputByKey = Object.fromEntries(
  (data.modelOutputs || []).map((item) => [`${item.sample_id}:${item.model_id}`, item]),
);
const judgeByKey = Object.fromEntries(
  (data.judgeResults || []).map((item) => [`${item.sample_id}:${item.model_id}`, item]),
);

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const priorityRank = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

function badCasePriority(item) {
  const sample = sampleById[item.sample_id];
  const judge = judgeByKey[`${item.sample_id}:${item.model_id}`];
  const severity = sample?.label?.severity || "medium";
  const score = judge?.final_score ?? 0;

  if (severity === "high" && score <= 0.3) return "P0";
  if (severity === "high" || score <= 0.3) return "P1";
  if (score <= 0.6) return "P2";
  return "P3";
}

function badCaseStatus(item) {
  if (item.failure_reason.includes("不可逆")) return "待人审抽检";
  if (item.failure_reason.includes("证据不足")) return "待补证据约束";
  return "待补样扩展";
}

function sortedBadCases() {
  return [...(data.badCases || [])].sort((a, b) => {
    const priorityDelta = priorityRank[badCasePriority(a)] - priorityRank[badCasePriority(b)];
    if (priorityDelta !== 0) return priorityDelta;
    return a.sample_id.localeCompare(b.sample_id);
  });
}

function groupBadCases(cases) {
  const groups = new Map();
  cases.forEach((item) => {
    const key = item.failure_reason;
    const sample = sampleById[item.sample_id];
    const taxonomy = taxonomyById[item.risk_type];
    const priority = badCasePriority(item);
    const status = badCaseStatus(item);
    if (!groups.has(key)) {
      groups.set(key, {
        reason: key,
        action: item.recommended_data_action,
        count: 0,
        priority,
        statuses: new Set(),
        riskTypes: new Set(),
        samples: [],
      });
    }
    const group = groups.get(key);
    group.count += 1;
    if (priorityRank[priority] < priorityRank[group.priority]) group.priority = priority;
    group.statuses.add(status);
    group.riskTypes.add(taxonomy?.name || item.risk_type);
    group.samples.push({
      id: item.sample_id,
      severity: sample?.label?.severity || "medium",
      difficulty: sample?.label?.difficulty || "-",
    });
  });

  return [...groups.values()].sort((a, b) => {
    const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    return b.count - a.count;
  });
}

function dataActionText(judge) {
  return judge.pass
    ? "Accept: 当前样本通过 rubric judge，可进入通过样本池。"
    : `Action: ${judge.recommended_data_action || "转入 bad case 归因与下一轮补样。"}`;
}

function buildCachedEvalResult(reason) {
  const sample = sampleById[state.liveSampleId] || data.samples[0];
  const modelId = "safety_workflow_v1";
  const output = outputByKey[`${sample.id}:${modelId}`] || outputByKey[`${sample.id}:baseline_naive_v0`];
  const judge = judgeByKey[`${sample.id}:${modelId}`] || judgeByKey[`${sample.id}:baseline_naive_v0`];

  return {
    ok: true,
    live: false,
    cached: true,
    fallback_reason: reason,
    generated_at: new Date().toISOString(),
    model: `${modelId} cached`,
    latency_ms: 0,
    usage: null,
    sample: {
      id: sample.id,
      risk_type: sample.risk_type,
      scenario: sample.scenario,
      user_prompt: sample.user_prompt,
      expected_behavior: sample.expected_behavior,
      severity: sample.label?.severity,
      difficulty: sample.label?.difficulty,
    },
    model_output: output?.output || "缓存样例：当前请求被切换到可复现 demo 输出，便于继续展示 judge 和数据动作。",
    judge: judge || {
      sample_id: sample.id,
      model_id: modelId,
      risk_type: sample.risk_type,
      expected_behavior: sample.expected_behavior,
      final_score: 1,
      pass: true,
      failure_reason: "",
      recommended_data_action: "",
      rubric_scores: sample.rubric.map((item) => ({
        criterion: item.criterion,
        weight: item.weight,
        score: 1,
        weighted_score: item.weight,
      })),
    },
    scope_note:
      "Cached demo result: live API 暂不可用时展示的本地评测样例，用于面试演示不中断；不代表新的线上模型调用。",
  };
}

function renderMetrics() {
  const riskCount = new Set(data.samples.map((item) => item.risk_type)).size;
  const outputCount = data.modelOutputs?.length || 0;
  const badCaseCount = data.badCases?.length || 0;
  const items = [
    ["Risk categories", riskCount, "安全风险分类"],
    ["Evaluation samples", data.report.sample_count, "seed + synthetic"],
    ["Candidate outputs", outputCount, "双模型候选输出"],
    ["Live API", "ON", "实时单样本评测"],
    ["Rubric judge", "ON", "质量验收规则"],
    ["Bad case flywheel", badCaseCount, "失败归因与补样"],
  ];
  document.getElementById("metrics").innerHTML = items
    .map(
      ([label, value, desc]) => `
        <article class="metric">
          <strong>${value}</strong>
          <span>${label} · ${desc}</span>
        </article>
      `,
    )
    .join("");
}

function renderFilters() {
  const filters = [
    { id: "all", name: "全部风险类型" },
    ...data.taxonomy.map((item) => ({ id: item.id, name: item.name })),
  ];
  document.getElementById("filters").innerHTML = filters
    .map(
      (item) => `
        <button class="filter-button ${state.riskType === item.id ? "active" : ""}" data-risk="${item.id}">
          ${item.name}
        </button>
      `,
    )
    .join("");
}

function sampleMatches(sample) {
  const matchesRisk = state.riskType === "all" || sample.risk_type === state.riskType;
  const q = state.query.trim().toLowerCase();
  if (!q) return matchesRisk;
  const text = [
    sample.id,
    sample.risk_type,
    taxonomyById[sample.risk_type]?.name,
    sample.scenario,
    sample.user_prompt,
    sample.expected_behavior,
  ]
    .join(" ")
    .toLowerCase();
  return matchesRisk && text.includes(q);
}

function renderSamples() {
  const samples = data.samples.filter(sampleMatches);
  document.getElementById("sample-list").innerHTML = samples
    .map((sample) => {
      const taxonomy = taxonomyById[sample.risk_type];
      return `
        <article class="sample-item">
          <div class="sample-topline">
            <div class="tag-row">
              <span class="tag">${sample.id}</span>
              <span class="tag">${taxonomy.name}</span>
              <span class="tag ${sample.label.severity}">${sample.label.severity}</span>
              <span class="tag">D${sample.label.difficulty}</span>
              <span class="tag">${sample.source_type}</span>
            </div>
            <span class="tag">${sample.expected_behavior}</span>
          </div>
          <p class="prompt">${sample.user_prompt}</p>
          <ol class="rubric">
            ${sample.rubric.map((item) => `<li>${item.criterion} (${Math.round(item.weight * 100)}%)</li>`).join("")}
          </ol>
        </article>
      `;
    })
    .join("");
}

function renderGates() {
  document.getElementById("quality-gates").innerHTML = Object.entries(data.report.quality_gates)
    .map(([key, passed]) => {
      const status = passed ? "PASS" : "FAIL";
      return `
        <article class="gate ${passed ? "pass" : "fail"}">
          <strong>${status}</strong>
          <span>${key}</span>
        </article>
      `;
    })
    .join("");
}

function renderLiveEvalPanel() {
  const select = document.getElementById("live-sample");
  if (!select) return;
  select.innerHTML = data.samples
    .map((sample) => {
      const taxonomy = taxonomyById[sample.risk_type];
      return `
        <option value="${escapeHtml(sample.id)}" ${state.liveSampleId === sample.id ? "selected" : ""}>
          ${escapeHtml(sample.id)} / ${escapeHtml(taxonomy?.name || sample.risk_type)}
        </option>
      `;
    })
    .join("");
  renderLiveEvalResult();
}

function renderLiveEvalResult() {
  const el = document.getElementById("live-eval-result");
  const button = document.getElementById("run-live-eval");
  if (!el || !button) return;

  button.disabled = state.liveEvalLoading;
  button.textContent = state.liveEvalLoading ? "评测中..." : "运行实时评测";

  if (state.liveEvalLoading) {
    el.innerHTML = `
      <article class="live-placeholder">
        <strong>正在调用后端模型 API</strong>
        <span>样本 ${escapeHtml(state.liveSampleId)} · 返回后自动展示 judge 结果</span>
      </article>
    `;
    return;
  }

  if (state.liveEvalError && !state.liveEvalResult) {
    el.innerHTML = `
      <article class="live-placeholder error">
        <strong>实时评测暂不可用</strong>
        <span>${escapeHtml(state.liveEvalError)}</span>
      </article>
    `;
    return;
  }

  if (!state.liveEvalResult) {
    const sample = sampleById[state.liveSampleId];
    el.innerHTML = `
      <article class="live-placeholder">
        <strong>${escapeHtml(sample?.id || "选择样本")}</strong>
        <span>${escapeHtml(sample?.scenario || "选择一条样本后运行实时评测")}</span>
      </article>
    `;
    return;
  }

  const result = state.liveEvalResult;
  const judge = result.judge;
  const sample = result.sample;
  const statusClass = judge.pass ? "pass" : "fail";
  const statusText = judge.pass ? "PASS" : "REVIEW";
  const sourceText = result.live ? "Live API result" : "Cached demo result";
  const sourceClass = result.live ? "pass" : "cached";
  const promptTokens = result.usage?.prompt_tokens ?? "-";
  const completionTokens = result.usage?.completion_tokens ?? "-";
  el.innerHTML = `
    <article class="live-result-card">
      ${
        result.cached
          ? `<div class="live-banner cached"><strong>Cached demo result</strong><span>Live API 请求失败时自动展示可复现样例：${escapeHtml(result.fallback_reason || "fallback enabled")}</span></div>`
          : `<div class="live-banner live"><strong>Live API result</strong><span>本次结果来自 Vercel Serverless 实时模型调用。</span></div>`
      }
      <div class="live-result-head">
        <div>
          <span class="tag">${escapeHtml(sample.id)}</span>
          <span class="tag">${escapeHtml(sample.risk_type)}</span>
          <span class="tag">${escapeHtml(result.model)}</span>
        </div>
        <strong class="${statusClass}">${statusText} · ${pct(judge.final_score)}</strong>
      </div>
      <div class="live-status-grid">
        <div>
          <span>Source</span>
          <strong class="${sourceClass}">${sourceText}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong class="${statusClass}">${statusText}</strong>
        </div>
        <div>
          <span>Latency</span>
          <strong>${result.live ? `${result.latency_ms} ms` : "cached"}</strong>
        </div>
        <div>
          <span>Usage</span>
          <strong>${promptTokens}/${completionTokens}</strong>
        </div>
      </div>
      <p class="prompt">${escapeHtml(sample.user_prompt)}</p>
      <div class="live-output">
        <h3>${result.live ? "实时模型输出" : "缓存模型输出"}</h3>
        <p>${escapeHtml(result.model_output)}</p>
      </div>
      <div class="rubric-trace">
        ${judge.rubric_scores
          .map(
            (item) => `
              <div>
                <span>${escapeHtml(item.criterion)}</span>
                <strong>${item.score ? "PASS" : "MISS"} · ${Math.round(item.weight * 100)}%</strong>
              </div>
            `,
          )
          .join("")}
      </div>
      <p class="data-action">
        ${escapeHtml(dataActionText(judge))}
      </p>
      <div class="live-meta">
        <span>${escapeHtml(result.generated_at)}</span>
        <span>${escapeHtml(result.model)}</span>
        <span>${escapeHtml(result.scope_note)}</span>
      </div>
    </article>
  `;
}

async function runLiveEval() {
  state.liveEvalLoading = true;
  state.liveEvalError = "";
  state.liveEvalResult = null;
  renderLiveEvalResult();

  try {
    const response = await fetch("/api/run-eval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sampleId: state.liveSampleId }),
    });
    const contentType = response.headers.get("content-type") || "";
    const rawBody = await response.text();
    if (!contentType.includes("application/json")) {
      if (rawBody.includes("Vercel Security Checkpoint")) {
        throw new Error("Vercel Security Checkpoint 拦截了实时 API，请在普通浏览器中打开或调整 Vercel 防护设置。");
      }
      throw new Error("实时 API 返回了非 JSON 响应。");
    }
    const payload = JSON.parse(rawBody);
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || payload.error || "live_eval_failed");
    }
    state.liveEvalResult = payload;
  } catch (error) {
    state.liveEvalError = error.message || "实时评测请求失败";
    state.liveEvalResult = buildCachedEvalResult(state.liveEvalError);
  } finally {
    state.liveEvalLoading = false;
    renderLiveEvalResult();
    renderRecentRuns();
  }
}

function renderRecentRuns() {
  const el = document.getElementById("recent-runs");
  if (!el) return;

  const liveRun = state.liveEvalResult
    ? [
        {
          source: state.liveEvalResult.live ? "Live API" : "Cached demo",
          sampleId: state.liveEvalResult.sample.id,
          modelId: state.liveEvalResult.model,
          riskName: taxonomyById[state.liveEvalResult.sample.risk_type]?.name || state.liveEvalResult.sample.risk_type,
          score: state.liveEvalResult.judge.final_score,
          pass: state.liveEvalResult.judge.pass,
          latency: state.liveEvalResult.live ? `${state.liveEvalResult.latency_ms} ms` : "cached",
          action: dataActionText(state.liveEvalResult.judge),
        },
      ]
    : [];

  const offlineRuns = [...(data.judgeResults || [])]
    .sort((a, b) => Number(a.pass) - Number(b.pass) || a.sample_id.localeCompare(b.sample_id))
    .slice(0, 6 - liveRun.length)
    .map((judge) => {
      const sample = sampleById[judge.sample_id];
      return {
        source: "Offline batch",
        sampleId: judge.sample_id,
        modelId: judge.model_id,
        riskName: taxonomyById[judge.risk_type]?.name || judge.risk_type,
        score: judge.final_score,
        pass: judge.pass,
        latency: "demo dataset",
        action: dataActionText(judge),
        severity: sample?.label?.severity || "medium",
      };
    });

  const rows = [...liveRun, ...offlineRuns];
  el.innerHTML = rows
    .map(
      (run) => `
        <article class="run-card">
          <div class="run-head">
            <div>
              <span class="tag">${escapeHtml(run.source)}</span>
              <span class="tag">${escapeHtml(run.sampleId)}</span>
            </div>
            <strong class="${run.pass ? "pass" : "fail"}">${run.pass ? "PASS" : "REVIEW"} · ${pct(run.score)}</strong>
          </div>
          <p>${escapeHtml(run.riskName)} · ${escapeHtml(run.modelId)}</p>
          <div class="run-meta">
            <span>${escapeHtml(run.latency)}</span>
            ${run.severity ? `<span>${escapeHtml(run.severity)}</span>` : ""}
          </div>
          <p class="data-action">${escapeHtml(run.action)}</p>
        </article>
      `,
    )
    .join("");
}

function renderRecommendedActions() {
  const el = document.getElementById("recommended-actions");
  if (!el) return;
  const groups = groupBadCases(sortedBadCases()).slice(0, 4);
  el.innerHTML = groups
    .map(
      (group) => `
        <article class="action-card">
          <div class="action-head">
            <span class="priority-tag ${group.priority.toLowerCase()}">${group.priority}</span>
            <strong>${escapeHtml(group.reason)}</strong>
          </div>
          <p>${escapeHtml(group.action)}</p>
          <div class="run-meta">
            <span>${group.count} bad cases</span>
            <span>${group.riskTypes.size} risk types</span>
            <span>${[...group.statuses].map(escapeHtml).join(" / ")}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderProductionRoadmap() {
  const el = document.getElementById("production-roadmap");
  if (!el) return;
  el.innerHTML = productionRoadmap
    .map(
      ([title, detail], index) => `
        <article class="roadmap-card">
          <span class="tag">Step ${index + 1}</span>
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(detail)}</p>
        </article>
      `,
    )
    .join("");
}

function renderModelEval() {
  const el = document.getElementById("model-summary");
  if (!data.modelEval) {
    el.innerHTML = `<article class="model-card"><strong>未生成</strong><span>运行 scripts/judge_outputs.py 后显示模型评测结果</span></article>`;
    return;
  }
  el.innerHTML = data.modelEval.model_summary
    .map(
      (item) => `
        <article class="model-card">
          <strong>${Math.round(item.pass_rate * 100)}%</strong>
          <span>${item.model_id} · ${item.pass_count}/${item.total} pass · avg ${item.avg_score}</span>
        </article>
      `,
    )
    .join("");
}

function renderJudgeTrace() {
  const el = document.getElementById("judge-trace");
  const badCases = data.badCases || [];
  const traceSeeds = badCases
    .filter((item) => item.model_id === "baseline_naive_v0")
    .slice(0, 3)
    .map((item) => item.sample_id);

  if (!traceSeeds.length || !data.judgeResults || !data.modelOutputs) {
    el.innerHTML = `<article class="trace-card"><h3>暂无 judge trace</h3><p>运行 scripts/judge_outputs.py 后显示逐条判分链路。</p></article>`;
    return;
  }

  el.innerHTML = traceSeeds
    .map((sampleId) => {
      const sample = sampleById[sampleId];
      const taxonomy = taxonomyById[sample.risk_type];
      const baseline = judgeByKey[`${sampleId}:baseline_naive_v0`];
      const safety = judgeByKey[`${sampleId}:safety_workflow_v1`];
      const baselineOutput = outputByKey[`${sampleId}:baseline_naive_v0`];
      const safetyOutput = outputByKey[`${sampleId}:safety_workflow_v1`];
      const action = baseline.recommended_data_action || "当前样本已通过，无需补样。";

      return `
        <article class="trace-card">
          <div class="trace-head">
            <div>
              <span class="tag">${sample.id}</span>
              <span class="tag">${taxonomy.name}</span>
            </div>
            <strong>${Math.round(baseline.final_score * 100)}% → ${Math.round(safety.final_score * 100)}%</strong>
          </div>
          <p class="prompt">${sample.user_prompt}</p>
          <div class="output-compare">
            <div>
              <h3>baseline_naive_v0</h3>
              <p>${baselineOutput.output}</p>
            </div>
            <div>
              <h3>safety_workflow_v1</h3>
              <p>${safetyOutput.output}</p>
            </div>
          </div>
          <div class="rubric-trace">
            ${baseline.rubric_scores
              .map(
                (item) => `
                  <div>
                    <span>${item.criterion}</span>
                    <strong>${item.score ? "PASS" : "MISS"} · ${Math.round(item.weight * 100)}%</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
          <p class="data-action">数据动作：${action}</p>
        </article>
      `;
    })
    .join("");
}

function renderBadCases() {
  const el = document.getElementById("bad-cases");
  const cases = sortedBadCases().slice(0, 8);
  if (!cases.length) {
    el.innerHTML = `<article class="bad-case"><h3>暂无 bad case</h3><span>当前候选输出全部通过 rubric judge</span></article>`;
    return;
  }
  el.innerHTML = cases
    .map((item) => {
      const taxonomy = taxonomyById[item.risk_type];
      const priority = badCasePriority(item);
      const status = badCaseStatus(item);
      return `
        <article class="bad-case">
          <div class="bad-case-head">
            <h3>${item.model_id} / ${item.sample_id}</h3>
            <span class="priority-tag ${priority.toLowerCase()}">${priority}</span>
          </div>
          <div class="tag-row">
            <span class="tag">${taxonomy?.name || item.risk_type}</span>
            <span class="tag">${status}</span>
          </div>
          <p>${item.failure_reason}</p>
          <span>${item.recommended_data_action}</span>
        </article>
      `;
    })
    .join("");
}

function renderBadCaseTriage() {
  const el = document.getElementById("bad-case-triage");
  const cases = sortedBadCases();
  if (!cases.length) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = groupBadCases(cases)
    .map((group) => {
      const samples = group.samples
        .slice(0, 3)
        .map((sample) => `<span>${sample.id} · ${sample.severity} · D${sample.difficulty}</span>`)
        .join("");
      return `
        <article class="triage-card">
          <div class="triage-head">
            <span class="priority-tag ${group.priority.toLowerCase()}">${group.priority}</span>
            <strong>${group.reason}</strong>
          </div>
          <p>${group.action}</p>
          <div class="triage-meta">
            <span>${group.count} cases</span>
            <span>${group.riskTypes.size} risk types</span>
            <span>${[...group.statuses].join(" / ")}</span>
          </div>
          <div class="triage-samples">${samples}</div>
        </article>
      `;
    })
    .join("");
}

function renderSamplingPlan() {
  const el = document.getElementById("sampling-plan");
  const plan = data.samplingPlan;
  if (!plan?.items?.length) {
    el.innerHTML = "";
    return;
  }

  const topItems = plan.items.slice(0, 4);
  el.innerHTML = `
    <article class="sampling-summary">
      <strong>${plan.total_target_new_samples}</strong>
      <span>建议新增样本 · 基于 ${plan.total_bad_cases} 个 bad case</span>
    </article>
    ${topItems
      .map(
        (item) => `
          <article class="plan-card">
            <div class="plan-head">
              <span class="priority-tag ${item.priority.toLowerCase()}">${item.priority}</span>
              <strong>${item.risk_name}</strong>
            </div>
            <p>${item.failure_reason}</p>
            <div class="plan-meta">
              <span>${item.target_new_samples} new samples</span>
              <span>${item.review_mode}</span>
            </div>
            <div class="plan-angles">
              ${item.sampling_angles.map((angle) => `<span>${angle}</span>`).join("")}
            </div>
          </article>
        `,
      )
      .join("")}
  `;
}

function renderHumanReviewQueue() {
  const el = document.getElementById("human-review-queue");
  const protocol = data.humanReviewProtocol;
  if (!protocol?.items?.length) {
    el.innerHTML = "";
    return;
  }

  const topItems = protocol.items.slice(0, 6);
  el.innerHTML = `
    <article class="review-summary">
      <strong>${protocol.queue_size}</strong>
      <span>人审队列 · ${protocol.p0_count} 条 P0 · ${protocol.double_review_count} 条双人复核</span>
    </article>
    ${topItems
      .map(
        (item) => `
          <article class="review-card">
            <div class="review-head">
              <div>
                <span class="tag">${item.review_id.replace(/^HRQ/, "RQ")}</span>
                <span class="tag">${item.assignment}</span>
              </div>
              <span class="priority-tag ${item.priority.toLowerCase()}">${item.priority}</span>
            </div>
            <strong>${item.risk_name} / ${item.sample_id}</strong>
            <p>${item.review_focus}</p>
            <div class="review-meta">
              <span>${item.severity}</span>
              <span>D${item.difficulty}</span>
              <span>${item.source_type}</span>
            </div>
            <ol class="review-checks">
              ${item.acceptance_checks.slice(0, 2).map((check) => `<li>${check}</li>`).join("")}
            </ol>
          </article>
        `,
      )
      .join("")}
  `;
}

function bindEvents() {
  document.getElementById("filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-risk]");
    if (!button) return;
    state.riskType = button.dataset.risk;
    renderFilters();
    renderSamples();
  });
  document.getElementById("search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderSamples();
  });
  document.getElementById("live-sample").addEventListener("change", (event) => {
    state.liveSampleId = event.target.value;
    state.liveEvalResult = null;
    state.liveEvalError = "";
    renderLiveEvalPanel();
  });
  document.getElementById("run-live-eval").addEventListener("click", runLiveEval);
}

renderMetrics();
renderFilters();
renderSamples();
renderGates();
renderLiveEvalPanel();
renderRecentRuns();
renderRecommendedActions();
renderModelEval();
renderJudgeTrace();
renderBadCaseTriage();
renderSamplingPlan();
renderHumanReviewQueue();
renderBadCases();
renderProductionRoadmap();
bindEvents();
