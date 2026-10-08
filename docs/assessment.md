# Phase 2 assessment map

| Deliverable | Evidence |
| --- | --- |
| Streaming output | Real SSE Route Handler with incremental text-delta events; `useChat` renders message parts |
| User/assistant/status/error messages | Separate components in `src/components/chat-message.tsx` |
| Loading and stop | Submitted/streaming status, Stop button, Escape, abort handling, preserved partial text |
| Retry and regenerate | Same-question retry; last-answer regeneration with alternate sample phrasing |
| Copy and feedback | Clipboard API with failure notice; Helpful/Unhelpful pressed state and local persistence |
| Conversation history | In-memory transcript across views plus explicit opt-in session storage across refreshes |
| Accessibility | Named controls, keyboard behavior, focus management, atomic status region, accessible errors; [evidence](accessibility.md) |
| Moderation/safety fallback | Labeled safety message, safer alternative question, deterministic simulation and keyword example |
| Source uncertainty | Unavailable-data response names its degraded state; all evidence remains clearly marked sample |
| Submission | New GitHub repository and independent live Vercel URL in README |

## Verification record

Local verification on 8 October 2026:

- ESLint, strict TypeScript, and the production build pass.
- All 9 server/contract tests pass, including progressive SSE chunks, cancellation, pre-stream and mid-stream errors, context, fallback metadata, and malformed saved history.
- All 6 browser tests pass on the production build, covering progressive rendering, stop, retry, regeneration, clipboard, pressed feedback state, reload persistence, clear, corrupted storage, keyboard and status semantics, 390px layout, and retained proposal review.
- `npm audit` reports zero vulnerabilities at verification time.

Live verification on 8 October 2026 at https://coinpilot-ai-phase-2.vercel.app:

- All 6 browser tests also pass against the production Vercel deployment (44.3 seconds for the suite).
- `node scripts/verify-stream.mjs https://coinpilot-ai-phase-2.vercel.app` passes. One measured request delivered text in 16 separate reads: first content at 1,865 ms, last content at 3,137 ms, and a complete finish event at 3,219 ms. These are one-run observations, not a latency guarantee.
- The Vercel production build completed successfully with no AI credentials configured.

The UI and network transport are real. The response content is a deterministic demo by explicit request. No live AI quality, trading performance, or full WCAG certification is claimed.
