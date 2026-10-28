import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDown,
  ScanLine,
  Route,
  Repeat2,
  ShieldCheck,
  MoveUpRight,
} from "lucide-react";
import { Header, Footer, Abstract } from "@/components/chrome";
import { Scramble } from "@/components/effects";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="landing-hero shell">
          <div className="hero-meta mono">
            <span>adaptive student intervention system</span>
            <span>Built around people. Informed by evidence.</span>
          </div>
          <h1 className="mega-title">
            CAMPUS<span className="green">COMPASS</span>
          </h1>
          <div className="hero-split">
            <div>
              <span className="mono">education / a better way forward</span>
              <h2>
                See the signs.
                <br />
                <Scramble>Change the story.</Scramble>
              </h2>
            </div>
            <div className="hero-copy">
              <p>
                Connect the dots between attendance, learning, and mentor
                feedback. Give every student the right support, at the right
                moment.
              </p>
              <Link className="rainbow-button" href="/demo">
                <Scramble>Find your workspace</Scramble>
                <ArrowUpRight size={19} />
              </Link>
            </div>
          </div>
          <Abstract />
        </section>
        <div className="marquee" aria-hidden="true">
          <div>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i}>
                notice the signal <b>✳</b> act with care <b>✳</b> learn what
                works <b>✳</b>
              </span>
            ))}
          </div>
        </div>
        <section className="shell section-pad" id="approach" data-reveal>
          <div className="section-heading">
            <div>
              <span className="mono">
                01 / from scattered signals to shared action
              </span>
              <h2>
                Support shouldn’t
                <br />
                start too late<span className="green">.</span>
              </h2>
            </div>
            <p>
              One clear picture. A thoughtful next step.
              <br />A feedback loop that keeps learning.
            </p>
          </div>
          <div className="approach-grid">
            {[
              {
                n: "01",
                icon: ScanLine,
                title: "notice.the_signal()",
                copy: "Bring attendance, assessments, assignments, and mentor feedback into one educator view.",
              },
              {
                n: "02",
                icon: Route,
                title: "choose.the_support()",
                copy: "Review a contextual recommendation, understand the evidence, and decide how to help.",
              },
              {
                n: "03",
                icon: Repeat2,
                title: "learn.from_outcomes()",
                copy: "Record what worked. When an action fails, change the approach instead of repeating it.",
              },
            ].map(({ n, icon: Icon, title, copy }) => (
              <article key={n}>
                <span className="mono">{n} /</span>
                <Icon size={40} strokeWidth={1} />
                <h3>
                  <Scramble>{title}</Scramble>
                </h3>
                <p>{copy}</p>
                <ArrowDown size={20} />
              </article>
            ))}
          </div>
        </section>
        <section className="workspace-section" id="workspaces">
          <div className="shell section-pad" data-reveal>
            <div className="section-heading">
              <div>
                <span className="mono">
                  02 / different roles. one shared purpose.
                </span>
                <h2>
                  The right view.
                  <br />
                  For the right people.
                </h2>
              </div>
              <ShieldCheck size={46} strokeWidth={1} />
            </div>
            <div className="workspace-grid">
              <article className="glass-panel role-card">
                <span className="mono">01 / Teachers + batch managers</span>
                <h3>See the whole picture.</h3>
                <p>
                  Prioritize students, review academic evidence and mentor
                  updates, coordinate interventions, and track outcomes.
                </p>
                <div className="role-tags">
                  <span>Risk & evidence</span>
                  <span>Mentor updates</span>
                  <span>Case coordination</span>
                </div>
                <Link className="text-link" href="/demo">
                  <Scramble>Explore staff workspace</Scramble>
                  <MoveUpRight size={20} />
                </Link>
              </article>
              <article className="glass-panel role-card">
                <span className="mono">02 / Mentors</span>
                <h3>Make support personal.</h3>
                <p>
                  Focus on assigned students, mentoring notes, agreed next
                  steps, and follow-ups. Teacher and manager records stay
                  separate.
                </p>
                <div className="role-tags">
                  <span>Assigned students</span>
                  <span>Mentoring records</span>
                  <span>Follow-ups</span>
                </div>
                <Link className="text-link" href="/demo">
                  <Scramble>Explore mentor workspace</Scramble>
                  <MoveUpRight size={20} />
                </Link>
              </article>
            </div>
            <p className="access-caption mono">
              ↳ Your assigned account determines your workspace. Students
              receive next-step notifications, not a dashboard.
            </p>
          </div>
        </section>
        <section
          className="shell section-pad loop-section"
          id="loop"
          data-reveal
        >
          <div>
            <span className="mono">03 / the next recommendation remembers</span>
            <h2>
              Don’t repeat.
              <br />
              <span className="green">
                <Scramble>Adapt.</Scramble>
              </span>
            </h2>
            <p>
              A reminder didn’t help? The next step should be different.
              Intervention history becomes evidence for better support—with an
              educator always making the final call.
            </p>
            <Link href="/demo" className="rainbow-button">
              <Scramble>Try the adaptive loop</Scramble>
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="loop-visual glass-panel">
            <div>
              <span className="mono">01 / Detect</span>
              <strong>Three missed assignments</strong>
            </div>
            <ArrowDown />
            <div className="failed-step">
              <span className="mono">02 / Learn from history</span>
              <strong>
                Reminder email <em>Failed</em>
              </strong>
            </div>
            <ArrowDown />
            <div className="next-step">
              <span className="mono">03 / Change the approach</span>
              <strong>Guided peer-tutor session ↗</strong>
            </div>
          </div>
        </section>
        <section className="closing-banner shell">
          <span className="mono">
            a clearer path starts with a conversation
          </span>
          <h2>
            EVERY STUDENT.
            <br />
            <span className="green">A WAY FORWARD.</span>
          </h2>
          <Link className="rainbow-button" href="/demo">
            Enter the demo <ArrowUpRight size={20} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
