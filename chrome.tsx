import Link from "next/link";
import { ArrowUpRight, Compass, LogOut } from "lucide-react";
import { Scramble } from "./effects";
import type { Identity } from "@/lib/domain";
export function Header({ identity }: { identity?: Identity }) {
  return (
    <>
      <div className="status-strip">
        <span>
          <i /> campuscompass.support / <b>every student counts</b>
        </span>
        <span>ASIS · Hackathon prototype · Fictional data</span>
      </div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="CampusCompass home">
          <Compass size={28} strokeWidth={1.8} />
          <span>
            CC<span className="green">’</span>26
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {identity ? (
            <>
              <a href="#queue">
                <Scramble>Students</Scramble>
              </a>
              <a href="#case">
                <Scramble>Interventions</Scramble>
              </a>
              <a href="#notifications">
                <Scramble>Notifications</Scramble>
              </a>
            </>
          ) : (
            <>
              <Link href="/#approach">
                <Scramble>Our approach</Scramble>
              </Link>
              <Link href="/#workspaces">
                <Scramble>Workspaces</Scramble>
              </Link>
              <Link href="/#loop">
                <Scramble>How it adapts</Scramble>
              </Link>
            </>
          )}
        </nav>
        <div className="nav-account">
          {identity ? (
            <>
              <span className="account-label">
                {identity.name}
                <small>{identity.title}</small>
              </span>
              <form action="/api/demo-session" method="post">
                <input type="hidden" name="action" value="signout" />
                <button className="nav-signout" aria-label="Sign out">
                  <LogOut size={17} />
                  <span>Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <Link className="nav-cta" href="/demo">
              <Scramble>Enter workspace</Scramble>
              <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Link href="/" className="brand">
        <Compass size={22} /> CampusCompass
      </Link>
      <span className="mono">Human decisions. Better-informed support.</span>
      <span className="mono">education / 2026 ↗</span>
    </footer>
  );
}
export function Abstract({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`abstract-scene ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      <div className="scene-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="glass-book">
        <div className="book-page page-one">
          <span />
          <span />
          <span />
          <i />
        </div>
        <div className="book-page page-two">
          <span />
          <span />
          <span />
          <b>↗</b>
        </div>
      </div>
      <div className="abstract-tag tag-one">
        <i /> signal detected
      </div>
      <div className="abstract-tag tag-two">
        support.adapts() <span>✳</span>
      </div>
      <div className="pixel-cluster">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <span className="scene-coordinate mono">N 23.026 / E 72.571</span>
      <span className="scene-caption mono">
        A little direction.
        <br />A world of possibility.
      </span>
    </div>
  );
}
