import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CoinPilot AI — Your next move, understood.",
  description:
    "CoinPilot Phase 2: accessible streaming conversations, recoverable interruptions, and a clearly labeled educational demo.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
