# Multi-agent Review

Launch multiple agents to review the codebase in parallel:
- Agent 1: Security (đọc docs/security-requirements.md, check file upload validation, Gemini API key exposure, child_process sanitization, auth middleware, CORS)
- Agent 2: Performance (Gemini rate limiting, sharp memory usage với hình HD, large file handling, ZIP streaming, N+1 queries)
- Agent 3: Code Quality (error handling, edge cases: empty PDF, corrupt DOCX, Gemini timeout, TypeScript types)
- Agent 4: Architecture (file structure matches docs/architecture.md, lib/ separation, component reuse, naming convention)
- Agent 5: Spec Compliance (so sánh code với specs/001-convert-engine/spec.md, tìm acceptance criteria chưa đạt)

Each agent reports findings independently before synthesizing.
