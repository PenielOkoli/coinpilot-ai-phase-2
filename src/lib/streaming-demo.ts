import { makeDemoReply } from "@/lib/demo";
import type { ChatMetadata, Scenario } from "@/lib/chat-contract";
export function prepareDemo(
  messages: { role: "user" | "assistant"; content: string }[],
  scenario: Scenario,
  variation: number,
): { text: string; metadata: ChatMetadata } {
  const question = messages.at(-1)!.content;
  const metadata: ChatMetadata = {
    mode: "demo",
    confidence: "not-assessed",
    source: "CoinPilot teaching dataset · 01 Oct 2026 · Sample only",
  };
  // A narrow teaching guard, not a production moderation classifier.
  if (
    scenario === "safety" ||
    /\b(seed phrase|private key|api secret|pump.and.dump|steal|bypass.*approval|guaranteed profit)\b/i.test(
      question,
    )
  )
    return {
      metadata: { ...metadata, mode: "safety" },
      text: "I can help explain risk and review a sample portfolio, but I cannot handle private keys, bypass approval, promise profits, or help manipulate a market. Never paste wallet credentials here. Try asking: “What risks should I check before reviewing a signal?” No action has been taken.",
    };
  if (scenario === "outage")
    return {
      metadata: { ...metadata, mode: "degraded" },
      text: makeDemoReply(question, "outage").content,
    };
  const earlier = messages
    .filter((m) => m.role === "user")
    .slice(0, -1)
    .at(-1)?.content;
  const isFollowUp =
    /\b(that|it|this|more|why|explain further|what about)\b/i.test(question);
  let text = makeDemoReply(
    isFollowUp && earlier ? `${earlier} ${question}` : question,
    "normal",
  ).content;
  if (earlier && isFollowUp)
    text = `Following up on your earlier question, “${earlier.slice(0, 120)}”:\n\n${text}`;
  if (variation % 2 === 1)
    text = `Another way to think about it:\n\n${text}\n\nSeparate the observation, the uncertainty, and your own decision. This is an educational example, not a live recommendation.`;
  return { text, metadata };
}
