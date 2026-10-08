import { createUIMessageStreamResponse, type UIMessageChunk } from "ai";
import { streamingRequestSchema, type ChatMetadata } from "@/lib/chat-contract";
import { prepareDemo } from "@/lib/streaming-demo";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
async function readBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      throw new Error("too-large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return Response.json({ error: "Send application/json." }, { status: 415 });
  let body: unknown;
  try {
    body = JSON.parse(await readBody(request));
  } catch (error) {
    return Response.json(
      { error: "Invalid or oversized request." },
      {
        status:
          error instanceof Error && error.message === "too-large" ? 413 : 400,
      },
    );
  }
  const parsed = streamingRequestSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      {
        error:
          "Send bounded, alternating user/assistant text turns ending with a question.",
      },
      { status: 400 },
    );
  const { messages, scenario, variation } = parsed.data;
  if (scenario === "connection-error")
    return Response.json(
      {
        error:
          "Simulated connection failure. Retry to request a fresh response.",
      },
      { status: 503 },
    );
  const { text, metadata } = prepareDemo(messages, scenario, variation);
  const words = text.match(/\S+\s*/g) ?? [text];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 3)
    chunks.push(words.slice(i, i + 3).join(""));
  const messageId = crypto.randomUUID();
  const textId = crypto.randomUUID();
  let index = -1;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let wake: (() => void) | undefined;
  const cancel = () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    wake?.();
  };
  const stream = new ReadableStream<UIMessageChunk<ChatMetadata>>({
    async pull(controller) {
      if (request.signal.aborted) {
        controller.close();
        return;
      }
      if (index === -1) {
        controller.enqueue({
          type: "start",
          messageId,
          messageMetadata: metadata,
        });
        controller.enqueue({ type: "text-start", id: textId });
        index = 0;
        return;
      }
      await new Promise<void>((resolve) => {
        wake = resolve;
        timer = setTimeout(resolve, index === 0 ? 350 : 85);
      });
      wake = undefined;
      if (cancelled) return;
      if (request.signal.aborted) {
        controller.close();
        return;
      }
      if (scenario === "interrupted" && index === 6) {
        controller.enqueue({
          type: "error",
          errorText:
            "The demo connection dropped mid-response. Your partial answer is preserved.",
        });
        controller.close();
      } else if (index < chunks.length)
        controller.enqueue({
          type: "text-delta",
          id: textId,
          delta: chunks[index++],
        });
      else {
        controller.enqueue({ type: "text-end", id: textId });
        controller.enqueue({
          type: "finish",
          finishReason: "stop",
          messageMetadata: metadata,
        });
        controller.close();
      }
    },
    cancel,
  });
  return createUIMessageStreamResponse({
    stream,
    headers: {
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
