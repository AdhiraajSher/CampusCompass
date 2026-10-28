import type { Metadata } from "next";
import { Effects } from "@/components/effects";
import "./globals.css";
import "./cc-score.css";
import "./student-tasks.css";
export const metadata: Metadata = {
  title: "CampusCompass — Every student. A way forward.",
  description:
    "Adaptive student support for educators, batch managers, and mentors. Interactive hackathon prototype.",
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
