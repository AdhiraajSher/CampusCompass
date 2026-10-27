import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  LockKeyhole,
  GraduationCap,
  Users,
  MessageCircle,
  HeartHandshake,
} from "lucide-react";
import { identities, workspaceFor } from "@/lib/domain";
import { getIdentity } from "@/lib/session";
import { Header, Footer, Abstract } from "@/components/chrome";
import { Scramble } from "@/components/effects";
export default async function Demo() {
  const current = await getIdentity();
  if (current) redirect(workspaceFor(current));
  return (
    <>
      <Header />
      <main id="main" className="shell signin-page">
        <div className="signin-intro">
          <span className="mono">workspace access / demo environment</span>
          <h1>
            Your role.
            <br />
            Your workspace.
            <br />
            <span className="green">
              <Scramble>Your impact.</Scramble>
            </span>
          </h1>
          <p>
            In the connected product, your institution account determines your
            access. Explore the staff workspaces or try the separate student
            account.
          </p>
          <Abstract compact />
        </div>
        <section className="glass-panel signin-panel">
          <LockKeyhole size={27} strokeWidth={1.4} />
          <h2>Meet your workspace.</h2>
          <p className="muted">
            Select a demo account. You’ll be routed to its assigned workspace.
            To explore another role, sign out first.
          </p>
          <div className="demo-accounts">
            {identities.map((identity, i) => {
              const Icon = [
                GraduationCap,
                Users,
                MessageCircle,
                HeartHandshake,
              ][i];
              return (
                <form
                  key={identity.id}
                  action="/api/demo-session"
                  method="post"
                >
                  <input type="hidden" name="identity" value={identity.id} />
                  <button className="account-card" type="submit">
                    <span className="avatar">
                      <Icon size={22} strokeWidth={1.5} />
                    </span>
                    <span>
                      <strong>{identity.name}</strong>
                      <small>{identity.title}</small>
                    </span>
                    <ArrowUpRight size={21} />
                  </button>
                </form>
              );
            })}
          </div>
          <div className="signin-notice mono">
            Demo accounts only. No real credentials or student information
            required. This is not institutional authentication.
          </div>
          <Link href="/" className="text-link">
            Back to the overview <span>↗</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
