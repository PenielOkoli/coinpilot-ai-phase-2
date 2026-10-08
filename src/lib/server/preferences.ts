import "server-only";
import { cookies } from "next/headers";
import { preferencesSchema } from "@/lib/validation";
import type { RiskTolerance } from "@/types/domain";
export async function readRiskTolerance(): Promise<RiskTolerance> {
  const jar = await cookies();
  const parsed = preferencesSchema.safeParse({
    riskTolerance: jar.get("coinpilot-risk")?.value,
  });
  return parsed.success ? parsed.data.riskTolerance : "balanced";
}
