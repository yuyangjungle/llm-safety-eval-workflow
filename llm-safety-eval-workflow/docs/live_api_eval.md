# Live API Eval

This project now includes a controlled real-time model evaluation path on Vercel.

## What Is Real

- The browser calls `/api/run-eval` when the user clicks `运行实时评测`.
- The API route runs on Vercel Serverless Functions.
- The server reads `DEEPSEEK_API_KEY` from Vercel environment variables.
- The browser only sends a known `sampleId`; arbitrary prompts are not accepted.
- The server loads the local sample bank, calls the model API, then applies the project rubric judge to the returned output.

## What It Returns

For one selected sample, the endpoint returns:

- sample metadata
- live model output
- rubric judge result
- final score and pass/review status
- recommended data action when the sample fails
- latency and usage metadata when returned by the provider

## Safety Boundary

The key is never committed to GitHub and is never exposed to frontend JavaScript. It must be configured through Vercel environment variables:

```text
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
```

The public demo also uses a lightweight per-instance rate limit and only allows sample IDs from the existing dataset.

## Product Boundary

This is a real-time demo path, not a production-grade data platform yet. A production version would still need persistent storage, authentication, task history, human-review operations, stronger rate limits, cost monitoring, and data export.
