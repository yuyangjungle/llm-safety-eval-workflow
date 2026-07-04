const data = window.WORKFLOW_DATA;

const state = {
  riskType: "all",
  query: "",
};

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

function renderMetrics() {
  const metrics = data.report.metrics;
  const items = [
    ["样本总数", data.report.sample_count, "seed + synthetic"],
    ["风险覆盖", pct(metrics.taxonomy_coverage_rate), "8 类安全风险"],
    ["Schema 完整", pct(metrics.schema_pass_rate), "字段与 rubric 校验"],
    ["Prompt 去重", pct(metrics.unique_prompt_ratio), "避免重复样本"],
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
}

renderMetrics();
renderFilters();
renderSamples();
renderGates();
renderModelEval();
renderJudgeTrace();
renderBadCaseTriage();
renderSamplingPlan();
renderBadCases();
bindEvents();
