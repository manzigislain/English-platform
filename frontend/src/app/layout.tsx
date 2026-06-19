import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "./layout-wrapper";

export const metadata: Metadata = {
  title: "English Dari Learning Platform",
  description: "Learn English through structured lessons, pronunciation practice, and community engagement",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-background text-text antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
