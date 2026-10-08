import { z } from "zod";
import type { UIMessage } from "ai";
export const scenarioSchema = z.enum([
  "normal",
  "outage",
  "connection-error",
  "interrupted",
  "safety",
]);
export type Scenario = z.infer<typeof scenarioSchema>;
export const chatMetadataSchema = z.object({
  mode: z.enum(["demo", "degraded", "safety"]),
  confidence: z.literal("not-assessed"),
  source: z.literal("CoinPilot teaching dataset · 01 Oct 2026 · Sample only"),
});
export type ChatMetadata = z.infer<typeof chatMetadataSchema>;
export type ChatMessage = UIMessage<ChatMetadata>;
export type Delivery = "complete" | "stopped" | "error";
export type Feedback = "helpful" | "unhelpful";
export const turnSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(4000),
  })
  .strict();
export const streamingRequestSchema = z
  .object({
    messages: z.array(turnSchema).min(1).max(20),
    scenario: scenarioSchema.default("normal"),
    variation: z.number().int().min(0).max(10000).default(0),
  })
  .strict()
  .superRefine(({ messages }, ctx) => {
    if (messages.at(-1)?.role !== "user")
      ctx.addIssue({
        code: "custom",
        message: "The final message must be from the user.",
      });
    messages.forEach((message, index) => {
      if (message.role === "user" && message.content.length > 1000)
        ctx.addIssue({
          code: "custom",
          message: "Questions must be at most 1,000 characters.",
        });
      if (index && messages[index - 1].role === message.role)
        ctx.addIssue({ code: "custom", message: "Turns must alternate." });
    });
    if (messages.reduce((sum, m) => sum + m.content.length, 0) > 16000)
      ctx.addIssue({
        code: "custom",
        message: "Conversation context is too long.",
      });
  });
export function messageText(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
const storedMessage = z.object({
  id: z.string().min(1).max(100),
  role: z.enum(["user", "assistant"]),
  parts: z
    .array(
      z.object({
        type: z.literal("text"),
        text: z.string().max(4000),
        state: z.enum(["streaming", "done"]).optional(),
      }),
    )
    .max(4),
  metadata: chatMetadataSchema.optional(),
});
export const savedConversationSchema = z
  .object({
    version: z.literal(2),
    messages: z.array(storedMessage).max(40),
    deliveries: z.record(
      z.string().max(100),
      z.enum(["complete", "stopped", "error"]),
    ),
    feedback: z.record(z.string().max(100), z.enum(["helpful", "unhelpful"])),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.messages.map((m) => m.id)).size !== value.messages.length)
      ctx.addIssue({ code: "custom", message: "Duplicate message IDs." });
  });
export const STORAGE_KEY = "coinpilot-phase-2-demo";
export function restoreConversation(raw: string | null) {
  if (!raw) return null;
  if (raw.length > 180000) throw new Error("Saved conversation is too large.");
  const saved = savedConversationSchema.parse(JSON.parse(raw));
  for (const message of saved.messages) {
    if (message.role === "assistant" && !saved.deliveries[message.id])
      saved.deliveries[message.id] = "stopped";
    for (const part of message.parts) part.state = "done";
  }
  return saved;
}
