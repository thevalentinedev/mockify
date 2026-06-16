import { PageShell } from "@/components/page-shell";

export default function ImportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PageShell variant="default">{children}</PageShell>;
}
