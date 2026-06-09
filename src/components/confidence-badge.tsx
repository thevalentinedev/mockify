import { Badge } from "@/components/ui/badge";
import type { AnswerConfidence } from "@/types/exam";

export function ConfidenceBadge({
  confidence,
}: {
  confidence?: AnswerConfidence;
}) {
  if (!confidence || confidence === "high") return null;

  return (
    <Badge
      variant={confidence === "low" ? "destructive" : "secondary"}
      className="text-xs"
    >
      {confidence === "low" ? "Low confidence answer key" : "Medium confidence"}
    </Badge>
  );
}
