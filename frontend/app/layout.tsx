import type { Metadata } from "next";
import { Effects } from "@/components/effects";
import "./globals.css";
import "./cc-score.css";
import "./student-tasks.css";
export const metadata: Metadata = {
  title: "CampusCompass v2 — Adaptive Student Intervention System",
  description:
    "Next-generation student support with research-informed CC Score, 1-minute daily AI check-ins, and adaptive intervention workflows.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Effects />
        {children}
      </body>
    </html>
  );
}
