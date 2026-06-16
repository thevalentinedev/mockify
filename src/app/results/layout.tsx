import { PageShell } from "@/components/page-shell";

export default function ResultsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PageShell variant="minimal">{children}</PageShell>;
}
