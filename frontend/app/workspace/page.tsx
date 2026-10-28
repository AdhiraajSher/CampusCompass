import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/session";
import { Header, Footer } from "@/components/chrome";
import { StudentLoader } from "@/components/student-loader";
export default async function Workspace() {
  const identity = await getIdentity();
  if (!identity) redirect("/demo");
  if (identity.role === "student") redirect("/student");
  return (
    <>
      <Header identity={identity} />
      <StudentLoader identity={identity} />
      <Footer />
    </>
  );
}
