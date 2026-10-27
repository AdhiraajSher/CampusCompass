import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/session";
import { studentsFor } from "@/lib/data";
import { Header, Footer } from "@/components/chrome";
import { Dashboard } from "@/components/dashboard";
export default async function Workspace() {
  const identity = await getIdentity();
  if (!identity) redirect("/demo");
  return (
    <>
      <Header identity={identity} />
      <Dashboard identity={identity} initialStudents={studentsFor(identity)} />
      <Footer />
    </>
  );
}
