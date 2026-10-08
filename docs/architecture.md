# Phase 2 architecture

## Continuity

The [Module 1 brief](https://github.com/PenielOkoli/coinpilot-ai/blob/main/docs/product-brief.md) defines a chat-first copilot, human-reviewed proposals, and explicit uncertainty. [Phase 1](https://github.com/PenielOkoli/coinpilot-ai-phase-1) implemented the typed server/client foundation. This independent Phase 2 repository adds streaming conversation UX while retaining the sample portfolio, preference Server Action, and proposal review.

## Streaming path

```mermaid
sequenceDiagram
  actor User
  participant UI as React + useChat
  participant HTTP as DefaultChatTransport
  participant Route as Next.js Route Handler
  User->>UI: Submit a question
  UI->>HTTP: Bounded text history and scenario
  HTTP->>Route: POST /api/chat
  Route->>Route: Validate roles, text, context and actual bytes
  Route-->>UI: SSE start + server-authored metadata
  loop Three-word chunks
    Route-->>UI: text-delta
    UI->>UI: Render partial answer
  end
  Route-->>UI: text-end + finish
  UI-->>User: Completion status and response actions
  Note over User,Route: Stop aborts fetch; partial UI text remains
```

The route produces a `ReadableStream<UIMessageChunk>` and `createUIMessageStreamResponse` converts it to the AI SDK's SSE protocol. The first text arrives after a short demonstration pause; subsequent chunks arrive approximately every 85 ms. This pacing makes progressive rendering and cancellation inspectable. These are demo timings, not measured AI-model latency claims. The browser does not fetch a complete answer and fake typing afterward.

`DefaultChatTransport` and `useChat` parse the stream and update message parts. Browser state transitions through `submitted`, `streaming`, `ready`, and `error`. A separate delivery map distinguishes complete answers from stopped/error partial answers after streaming ends. The cancelable stream clears its pending timer when the reader is canceled; request aborts are also checked before emitting each chunk.

## Responsibilities

| Layer | Responsibility | Trust limit |
| --- | --- | --- |
| Server Components | Initial sample DTOs, validated risk preference, architecture page | Never serialize secrets |
| Chat Client Components | Drafts, incremental rendering, controls, accessibility, in-memory history | No API keys; client state is untrusted |
| Transport | Last 10 user/assistant text messages; excludes system/tool parts | Server revalidates the payload independently |
| Route Handler | 64 KiB actual-byte cap; max 20 wire turns, 1,000-character questions, 4,000-character answers, 16,000-character total context; alternating roles and final user turn | No client-provided system prompts, tool calls, model configuration or metadata accepted |
| Demo response layer | Limited prior-question context, repeatable failure and safety examples | No model, exchange or market-data connection |
| Server Actions | Validated sample review and preference mutation from Phase 1 | No real execution authority |

## Stop, retry and regenerate

- Stop aborts the active transport and preserves any partial assistant text. Before first text, a placeholder or unanswered question remains recoverable.
- Retry calls the SDK's regenerate path against the current user turn, restores the normal scenario, and replaces a partial answer. It does not append a duplicate user message or resume an old stream.
- Regenerate replaces the latest assistant answer using the same question and a bounded variation counter. Earlier turns remain intact.
- A synchronous guard blocks double submits before React can rerender the disabled send state. New conversation is unavailable during generation; Stop remains available.
- Failed requests and mid-stream errors have visible alerts and retry controls. The client transport also has a 20-second timeout.

## History and feedback

`useConversation` lives in the dashboard so moving between workspace views does not destroy it. History is in memory unless the user opts into session storage. Snapshots include text messages, delivery status, and feedback, capped at 40 messages (20 exchanges). Rehydration validates JSON, allowed metadata, size, and unique IDs. An unfinished saved answer returns as stopped, never complete. Storage exceptions show a recoverable warning.

This is an explicit demo exception to Module 1's eventual server-side storage design. Never reuse browser storage for real account history. Later authenticated server storage must enforce ownership and retention. Feedback remains in this demo tab; there is no claim that it trains a model or reaches a support team.

## Accessibility

The conversation log is navigable but does not announce every token. A separate atomic polite status region announces meaningful transitions and the completed response once. Errors use an alert. Focus moves to the composer following user-initiated send, stop, retry, regenerate or reset; arriving tokens do not move it. Automatic scrolling follows only when the reader is near the bottom. See [accessibility evidence](accessibility.md).

References: [AI SDK useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat), [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview), [ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions).
