import { PageShell } from "@/components/page-shell";

export default function ExamLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PageShell variant="focus">{children}</PageShell>;
}
