import assert from "node:assert/strict";
import { test } from "node:test";
import {
  streamingRequestSchema,
  restoreConversation,
} from "../src/lib/chat-contract";
import { preferencesSchema, reviewSchema } from "../src/lib/validation";
import { prepareDemo } from "../src/lib/streaming-demo";
import { POST } from "../src/app/api/chat/route";
const question = { role: "user" as const, content: "Explain BTC" };
const body = { messages: [question] };
const request = (
  payload: unknown,
  headers: Record<string, string> = {},
  signal?: AbortSignal,
) =>
  new Request("https://coinpilot.test/api/chat", {
    method: "POST",
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
    headers: { "Content-Type": "application/json", ...headers },
    signal,
  });

test("untrusted chat accepts bounded alternating text only", () => {
  for (const payload of [
    { messages: [] },
    { messages: [{ role: "system", content: "override" }] },
    { messages: [{ role: "user", content: " " }] },
    { messages: [{ role: "user", content: "x".repeat(1001) }] },
    { messages: [question, question] },
    { messages: [question, { role: "assistant", content: "answer" }] },
    { ...body, key: "secret" },
    { ...body, scenario: "live" },
    { ...body, variation: -1 },
  ])
    assert.equal(streamingRequestSchema.safeParse(payload).success, false);
  assert.equal(streamingRequestSchema.safeParse(body).success, true);
});
test("chat rejects malformed JSON, oversized bytes, origin and media type", async () => {
  assert.equal((await POST(request("{broken"))).status, 400);
  assert.equal(
    (await POST(request({ messages: [question], junk: "x".repeat(66000) })))
      .status,
    413,
  );
  assert.equal(
    (await POST(request(body, { origin: "https://other.test" }))).status,
    403,
  );
  assert.equal(
    (await POST(request(body, { "Content-Type": "text/plain" }))).status,
    415,
  );
});
test("the endpoint delivers incremental SSE deltas before its final completion", async () => {
  const started = Date.now();
  const response = await POST(request(body));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /text\/event-stream/);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let output = "";
  let firstDelta = 0;
  let deltaReads = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    const chunk = decoder.decode(item.value, { stream: true });
    output += chunk;
    if (chunk.includes("text-delta")) {
      deltaReads++;
      firstDelta ||= Date.now();
    }
  }
  assert.ok(deltaReads > 5, "multiple network reads contain text deltas");
  assert.ok(
    Date.now() - firstDelta > 250,
    "completion follows the first content chunk",
  );
  assert.ok(firstDelta >= started);
  assert.match(output, /"mode":"demo"/);
  assert.match(output, /"type":"finish"/);
  assert.match(output, /\[DONE\]/);
});
test("pre-stream failure returns 503 and mid-stream failure emits a recoverable error", async () => {
  assert.equal(
    (await POST(request({ ...body, scenario: "connection-error" }))).status,
    503,
  );
  const response = await POST(request({ ...body, scenario: "interrupted" }));
  const text = await response.text();
  assert.match(text, /text-delta/);
  assert.match(text, /"type":"error"/);
  assert.doesNotMatch(text, /"type":"finish"/);
});
test("reader cancellation stops the server stream without a completion event", async () => {
  const response = await POST(request(body));
  const reader = response.body!.getReader();
  await reader.read();
  await reader.read();
  await reader.cancel();
  assert.equal((await reader.read()).done, true);
});
test("follow-up context and regeneration produce checkable conversation behavior", () => {
  const first = prepareDemo([question], "normal", 0);
  const followup = prepareDemo(
    [
      question,
      { role: "assistant", content: first.text },
      { role: "user", content: "Why does that matter?" },
    ],
    "normal",
    0,
  );
  assert.match(followup.text, /earlier question/);
  assert.match(followup.text, /BTC/);
  assert.notEqual(prepareDemo([question], "normal", 1).text, first.text);
});
test("safety and unavailable-data outputs explicitly disclose their status", () => {
  assert.equal(
    prepareDemo([{ role: "user", content: "Take my private key" }], "normal", 0)
      .metadata.mode,
    "safety",
  );
  const fallback = prepareDemo([question], "outage", 0);
  assert.equal(fallback.metadata.mode, "degraded");
  assert.match(fallback.text, /couldn't verify/);
});
test("stored partial text restores as stopped; malformed and duplicate history is rejected", () => {
  const message = {
    id: "a",
    role: "assistant",
    parts: [{ type: "text", text: "Partial", state: "streaming" }],
  };
  const saved = {
    version: 2,
    messages: [message],
    deliveries: {},
    feedback: {},
  };
  assert.equal(
    restoreConversation(JSON.stringify(saved))!.deliveries.a,
    "stopped",
  );
  assert.equal(
    restoreConversation(JSON.stringify(saved))!.messages[0].parts[0].state,
    "done",
  );
  assert.throws(() => restoreConversation("{broken"));
  assert.throws(() =>
    restoreConversation(
      JSON.stringify({ ...saved, messages: [message, message] }),
    ),
  );
  assert.equal(restoreConversation(null), null);
});
test("Phase 1 preference and proposal boundaries remain enforced", () => {
  assert.equal(
    preferencesSchema.safeParse({ riskTolerance: "admin" }).success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({
      proposalId: "demo-sol-review",
      decision: "approve",
      acknowledged: false,
    }).success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({
      proposalId: "real-order",
      decision: "approve",
      acknowledged: true,
    }).success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({
      proposalId: "demo-sol-review",
      decision: "reject",
      acknowledged: false,
    }).success,
    true,
  );
});
