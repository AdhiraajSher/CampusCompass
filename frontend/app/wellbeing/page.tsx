import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/session";
import { wellbeingFor } from "@/lib/wellbeing-data";
import { WellbeingDashboard } from "@/components/wellbeing-dashboard";
import { Header, Footer } from "@/components/chrome";
export default async function WellbeingPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const identity = await getIdentity();
  if (!identity) redirect("/demo");
  if (identity.role === "student") redirect("/student");
  const selected = (await searchParams).student;
  return (
    <>
      <Header identity={identity} />
      <WellbeingDashboard
        identity={identity}
        initialProfiles={wellbeingFor(identity)}
        initialSelected={selected}
      />
      <Footer />
    </>
  );
}
