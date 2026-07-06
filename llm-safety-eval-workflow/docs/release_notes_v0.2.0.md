# Release Notes v0.2.0

## Portfolio-Ready AI Data & Safety Workflow Release Candidate

v0.2.0 upgrades the project from a live API prototype into a clearer, portfolio-ready release candidate for LLM safety evaluation data production and quality acceptance.

## What Changed

- Retained the live API eval path through Vercel `/api/run-eval`, including real server-side model calls and rubric judge output.
- Clarified the first-screen product story around sample pool, live model response, rubric judge, human review, bad case analysis, data action, and next-round sampling.
- Added product dashboard metrics for risk categories, evaluation samples, candidate outputs, live API status, rubric judge, and bad case flywheel.
- Added a lightweight Recent Runs view that combines current live session output with existing offline judge artifacts.
- Kept the Human Review Queue lightweight and frontend-driven while making it more visible as part of the workflow.
- Reduced job-application wording in the public demo by replacing HR/JD/interview labels with product-oriented names such as Project Snapshot, Product Brief, Project Evidence, and Workflow Overview.
- Added README sections for what the project demonstrates, current MVP scope, production boundaries, and next steps toward production.

## Current Boundaries

This release is still a portfolio MVP, not a production-grade evaluation platform. It does not add authentication, a real database, queue-backed batch jobs, persistent run history, reviewer operations, access control, or audit-log storage.

## Production Roadmap

- Batch evaluation.
- Persistent history.
- Human review console.
- Model and prompt version comparison.
- Cost and latency monitoring.
- Access control.
- Audit log and data versioning.
