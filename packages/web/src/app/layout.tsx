import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/forge-ui.css";
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
