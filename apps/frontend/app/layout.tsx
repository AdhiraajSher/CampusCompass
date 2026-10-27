import type { Metadata } from "next";
import { Effects } from "@/components/effects";
import "./globals.css";
import "./cc-score.css";
import "./student-tasks.css";
export const metadata: Metadata = {
  title: "CampusCompass — Adaptive Student Support",
  description:
    "Adaptive student support for instructors, batch managers, mentors and students. Hackathon demonstration.",
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
