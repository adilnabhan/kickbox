import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kickbox Championship Manager",
  description: "Tournament registration, brackets, match scoring, and winner reports for kickboxing championships."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

