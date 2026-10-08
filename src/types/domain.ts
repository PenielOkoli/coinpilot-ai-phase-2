export type Token = "BTC" | "ETH" | "SOL";
export type RiskTolerance = "cautious" | "balanced" | "adventurous";
export interface Source {
  id: string;
  title: string;
  kind: "fixture" | "market-api";
  observedAt: string;
  freshness: "sample" | "fresh" | "stale";
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence: "not-assessed" | "low" | "medium" | "high";
  mode: "demo" | "degraded" | "model";
  sources: Source[];
}
export interface MarketAsset {
  symbol: Token;
  name: string;
  price: number;
  change: number;
  allocation: number;
  trend: number[];
}
export interface Proposal {
  id: string;
  asset: Token;
  title: string;
  reasoning: string;
  risk: "low" | "medium" | "high";
  status: "awaiting-review" | "approved-demo" | "rejected-demo";
}
export interface ToolDefinition {
  name: "getMarketSnapshot" | "draftProposal";
  description: string;
  available: boolean;
  requiresApproval: boolean;
}
export type ToolResult<T> =
  | { ok: true; data: T; source: Source }
  | { ok: false; reason: "unavailable" | "stale" | "timeout" };
export type ActionResult<T> =
  { ok: true; data: T; message: string } | { ok: false; message: string };
