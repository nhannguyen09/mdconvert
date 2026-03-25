# Contributing to mdconvert

Thanks for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/nhannguyen09/mdconvert.git
cd mdconvert
npm install
cp .env.example .env
# Fill in .env (see README)
npx prisma migrate dev
npm run dev
```

Prerequisites: Node.js 20+, PostgreSQL, Pandoc, Ghostscript.

## Code Style

- **TypeScript strict** — no `any`, no implicit types
- **`lib/`** — all business logic (converters, AI calls, compression, cleanup)
- **`app/api/`** — HTTP routes only, thin handlers, delegate to `lib/`
- **`components/`** — UI components, no business logic
- Keep PRs focused — one feature or fix per PR

## PR Process

1. Fork → create a feature branch (`feat/your-feature` or `fix/your-bug`)
2. Make changes, test locally
3. Describe what changed and why in the PR description
4. Open PR against `main`

## Bug Reports

Open an issue using the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:
- File type and size
- Steps to reproduce
- Expected vs actual behavior
- Error message or screenshot

## Feature Requests

Open an issue using the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md). Describe your use case first — not just the solution.
