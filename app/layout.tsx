import type { Metadata } from "next";
import "./globals.css";
import "./collection.css";

export const metadata: Metadata = {
  title: "CDC HABITAT · Suivi clientèle Bambilor",
  description: "Suivi privé des acquéreurs, parcelles et versements de Bambilor.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head><meta name="referrer" content="no-referrer" /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
