import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/components/shell/shell.css";

export const metadata: Metadata = {
  title: "Stamped Energy",
  description: "Ops-first plant control room — Stamped L6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
