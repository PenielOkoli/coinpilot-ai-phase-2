import type {
  MarketAsset,
  Message,
  Proposal,
  Source,
  ToolDefinition,
} from "@/types/domain";
export const sampleSource: Source = {
  id: "fixture-01",
  title: "CoinPilot teaching dataset",
  kind: "fixture",
  observedAt: "2026-10-01T12:00:00Z",
  freshness: "sample",
};
export const assets: MarketAsset[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 67432.8,
    change: 2.34,
    allocation: 45,
    trend: [22, 27, 21, 32, 26, 37, 33, 41, 37, 48, 45, 57],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 3521.64,
    change: 1.82,
    allocation: 30,
    trend: [22, 28, 26, 35, 29, 30, 39, 35, 44, 40, 48, 51],
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 148.92,
    change: -0.76,
    allocation: 25,
    trend: [51, 43, 46, 37, 41, 35, 39, 30, 34, 28, 31, 23],
  },
];
export const demoProposal: Proposal = {
  id: "demo-sol-review",
  asset: "SOL",
  title: "Review your SOL concentration",
  reasoning:
    "SOL represents 25% of the sample portfolio. Compare that concentration with your risk tolerance before considering any changes.",
  risk: "medium",
  status: "awaiting-review",
};
export const tools: ToolDefinition[] = [
  {
    name: "getMarketSnapshot",
    description: "Read market evidence on the server.",
    available: false,
    requiresApproval: false,
  },
  {
    name: "draftProposal",
    description: "Prepare a proposal for human review.",
    available: false,
    requiresApproval: true,
  },
];
export function makeDemoReply(
  input: string,
  scenario: "normal" | "outage",
): Omit<Message, "id"> {
  if (scenario === "outage")
    return {
      role: "assistant",
      content:
        "AI couldn't verify this. This is a simulated market-data outage. The teaching dataset is still visible, but it is not current market evidence. Wait for a verified source before making a decision.",
      confidence: "not-assessed",
      mode: "degraded",
      sources: [sampleSource],
    };
  const query = input.toLowerCase();
  let content =
    "This demo can explain the BTC sample signal, review sample portfolio concentration, and demonstrate proposal review. It does not fetch live prices or generate trading advice. Try one of the suggested questions.";
  if (/portfolio|risk|rebalanc|sol|concentration/.test(query))
    content =
      "In the teaching portfolio, BTC is 45%, ETH is 30%, and SOL is 25%. Holding three crypto assets can still leave the portfolio exposed to the same broad market risks. The review card below demonstrates how a concentration concern becomes a proposal you control. No allocation change or trade will be made.";
  else if (/proposal|approv|reject|review/.test(query))
    content =
      "A proposal is a suggestion awaiting your decision. Read its reasoning and risk level, then approve or reject it. In this demo, approval requires checking the simulation acknowledgement and the server validates your decision. No trade is placed, and the result resets on refresh. A future live flow must verify your identity and bind a single-use approval to the exact proposal before any execution.";
  else if (/btc|bitcoin|signal|market|eth/.test(query))
    content =
      "The sample BTC snapshot shows $67,432.80 and a +2.34% change. A positive move describes past price behavior; it does not establish what happens next. A real signal review would compare timestamped price, volume, and liquidity sources. These figures are illustrative fixtures, so confidence is not assessed.";
  return {
    role: "assistant",
    content,
    confidence: "not-assessed",
    mode: "demo",
    sources: [sampleSource],
  };
}
