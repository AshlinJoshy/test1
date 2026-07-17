import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Task Manager",
  description: "Track leads, follow-ups and deals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
