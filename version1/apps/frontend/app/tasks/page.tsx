import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/session";
import { workspaceFor } from "@/lib/domain";
import { Header, Footer } from "@/components/chrome";
import { TaskQueue } from "@/components/task-queue";
export default async function TasksPage() {
  const identity = await getIdentity();
  if (!identity) redirect("/demo");
  if (!["teacher", "manager"].includes(identity.role))
    redirect(workspaceFor(identity));
  return (
    <>
      <Header identity={identity} />
      <TaskQueue identity={identity} />
      <Footer />
    </>
  );
}
