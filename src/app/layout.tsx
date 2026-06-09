import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mock Exam Prep — Pre-Assessment Practice",
  description:
    "Practice and mock exams for pre-assessment entrance tests. Conestoga College and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />

        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </div>
              <span className="hidden sm:inline">Mock Exam Prep</span>
            </Link>
          </div>
        </header>

        {children}

        <footer className="mt-auto border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
          Pre-assessment practice
        </footer>
      </body>
    </html>
  );
}
