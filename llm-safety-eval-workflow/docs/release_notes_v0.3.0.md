# Release Notes v0.3.0

## Summary

v0.3.0 upgrades the project from a portfolio-ready live API prototype into an interview-ready AI Data & Safety demo. The core live API path is preserved, while the frontend now explains the workflow faster, survives live API failure with a clearly marked cached result, and adds a guided demo path for product discussion.

## Added

- Demo Walkthrough section with a 3-minute path from taxonomy to next-round sampling.
- Cached demo fallback for `/api/run-eval` failures, clearly marked as non-live output.
- Recommended Data Actions section grouped from bad case failure reasons.
- Production Roadmap section covering batch eval, persistence, review console, version comparison, cost monitoring, and auditability.
- `docs/interview_walkthrough.md` with pitch, demo script, real-vs-simulated boundary, rubric judge rationale, roadmap, and likely Q&A.

## Changed

- Version bumped to `0.3.0`.
- Page metadata now positions the site as an AI Data & Safety demo.
- Project evidence links now point to Demo Walkthrough and v0.3.0 release notes.
- Recent Runs now identifies live results vs cached demo results.
- README content now emphasizes current MVP scope, live API path, limitations, and production next steps.

## Not Changed

- `/api/run-eval` live serverless API path is unchanged.
- No API keys are committed or exposed.
- No database, authentication, task queue, or reviewer assignment backend was added.
- The project still does not claim to be production-grade.

## Verification

Run locally:

```powershell
npm run generate
npm run verify
npm run verify:public
```

Then test live API on Vercel:

```powershell
Invoke-RestMethod -Uri "https://llm-safety-eval-workflow.vercel.app/api/run-eval" -Method Post -ContentType "application/json" -Body '{"sampleId":"SEED-PRIV-001"}'
```
