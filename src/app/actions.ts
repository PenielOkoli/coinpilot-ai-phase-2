"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { preferencesSchema, reviewSchema } from "@/lib/validation";
import type { ActionResult, Proposal, RiskTolerance } from "@/types/domain";

export async function savePreferences(
  _previous: ActionResult<RiskTolerance> | null,
  form: FormData,
): Promise<ActionResult<RiskTolerance>> {
  const parsed = preferencesSchema.safeParse({
    riskTolerance: form.get("riskTolerance"),
  });
  if (!parsed.success)
    return { ok: false, message: "Choose a valid risk preference." };
  const jar = await cookies();
  jar.set("coinpilot-risk", parsed.data.riskTolerance, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  revalidatePath("/");
  return {
    ok: true,
    data: parsed.data.riskTolerance,
    message: "Preference saved for this browser for 7 days.",
  };
}
export async function reviewProposal(
  input: unknown,
): Promise<ActionResult<Proposal["status"]>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Invalid review. Confirm this is a simulation before approving.",
    };
  return {
    ok: true,
    data:
      parsed.data.decision === "approve" ? "approved-demo" : "rejected-demo",
    message:
      parsed.data.decision === "approve"
        ? "Demo approved. No trade was placed. This review resets on refresh."
        : "Demo rejected. No trade was placed. This review resets on refresh.",
  };
}
