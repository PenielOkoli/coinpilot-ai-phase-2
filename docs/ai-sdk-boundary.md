# The AI SDK boundary in Phase 2

The browser uses `useChat` from `@ai-sdk/react` and `DefaultChatTransport` from `ai`. These manage request cancellation, message parts, regeneration, and the submitted/streaming/ready/error lifecycle. React supplies our composer, controls and accessible announcements.

The Next.js route validates our bounded text-history contract and returns the SDK's UI message stream format. `createUIMessageStreamResponse` wraps text-start, text-delta, text-end, finish and error chunks as SSE. The server currently supplies deterministic sample content, but the browser consumes the same kind of streaming message interface that a provider integration can produce later.

The retained `@ai-sdk/anthropic` server adapter is inactive. A future authenticated implementation can use the SDK's provider streaming layer without embedding provider credentials or HTTP details into React components. The SDK does not replace authorization, reliable evidence, quotas, storage policy, or a moderation system.

References: [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview), [useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat), [Anthropic streaming](https://platform.claude.com/docs/en/build-with-claude/streaming).
