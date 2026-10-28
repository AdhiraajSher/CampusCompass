import { redirect } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { workspaceFor } from "@/lib/domain";
import { getIdentity } from "@/lib/session";
import { Header, Footer, Abstract } from "@/components/chrome";
import { Scramble } from "@/components/effects";
import { LoginForm } from "@/components/login-form";

export default async function Demo() {
  const current = await getIdentity();
  if (current) redirect(workspaceFor(current));
  return (
    <>
      <Header />
      <main id="main" className="shell signin-page">
        <div className="signin-intro">
          <span className="mono">role-based access / authenticated portal</span>
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
            Secure institutional authentication with Role-Based Access Control (RBAC).
            Sign in as a Student, Teacher, or Mentor to access your dedicated workspace.
          </p>
          <Abstract compact />
        </div>
        <section className="glass-panel signin-panel">
          <LockKeyhole size={27} strokeWidth={1.4} />
          <h2>User Login Authentication</h2>
          <p className="muted text-xs mb-4">
            Enter your credentials or choose a seed persona to test RBAC isolation.
          </p>

          <LoginForm />

          <div className="signin-notice mono mt-6">
            Protected by HMAC-SHA256 session tokens with PBKDF2 password verification.
            Strict data isolation prevents cross-role data leaks.
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
