import { z } from "zod";
export const chatSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, "Enter a question.")
      .max(1000, "Use 1,000 characters or fewer."),
    scenario: z.enum(["normal", "outage"]).default("normal"),
  })
  .strict();
export const preferencesSchema = z
  .object({ riskTolerance: z.enum(["cautious", "balanced", "adventurous"]) })
  .strict();
export const reviewSchema = z
  .object({
    proposalId: z.literal("demo-sol-review"),
    decision: z.enum(["approve", "reject"]),
    acknowledged: z.boolean(),
  })
  .strict()
  .refine(
    (value) => value.decision !== "approve" || value.acknowledged,
    "Confirm that this is a simulation before approving.",
  );
