import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/session";
import { workspaceFor } from "@/lib/domain";
import { portalStore } from "@/lib/portal-store";
import { Header, Footer } from "@/components/chrome";
import { StudentPortal } from "@/components/student-portal";
export default async function StudentPage() {
  const identity = await getIdentity();
  if (!identity) redirect("/demo");
  if (identity.role !== "student") redirect(workspaceFor(identity));
  return (
    <div className="student-experience">
      <Header identity={identity} />
      <StudentPortal
        identity={identity}
        initialView={portalStore.studentView(identity)}
      />
      <Footer />
    </div>
  );
}
