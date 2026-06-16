import { ExamSetup } from "@/components/exam-setup";
import { PageShell } from "@/components/page-shell";

export default function HomePage() {
  return (
    <PageShell variant="default">
      <ExamSetup />
    </PageShell>
  );
}
