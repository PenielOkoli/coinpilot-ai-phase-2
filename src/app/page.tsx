import { Dashboard } from "@/components/dashboard";
import { assets, demoProposal } from "@/lib/demo";
import { readRiskTolerance } from "@/lib/server/preferences";

// Server Component: obtain initial data here, then pass a safe serializable DTO.
export default async function HomePage() {
  const riskTolerance = await readRiskTolerance();
  return (
    <Dashboard
      assets={assets}
      proposal={demoProposal}
      initialRisk={riskTolerance}
    />
  );
}
