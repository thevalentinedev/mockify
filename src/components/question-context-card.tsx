"use client";

import { getContextLabel } from "@/lib/question-context";
import { cn } from "@/lib/utils";
import type { QuestionContext, QuestionContextType } from "@/types/exam";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  FileText,
  ImageIcon,
  Shapes,
  Table2,
} from "lucide-react";

const ICONS: Record<QuestionContextType, typeof BookOpen> = {
  passage: BookOpen,
  comprehension: FileText,
  graph: BarChart3,
  table: Table2,
  diagram: Shapes,
  image: ImageIcon,
};

interface QuestionContextCardProps {
  context: QuestionContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuestionContextCard({
  context,
  open,
  onOpenChange,
}: QuestionContextCardProps) {
  const Icon = ICONS[context.type];
  const label = getContextLabel(context.type, context.title);

  return (
    <div className="rounded-xl border border-border/80 bg-muted/25 overflow-hidden">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80">
            <Icon className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">
              {open ? "Click to hide" : "Click to read"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border/60 bg-background/50 px-4 py-4">
          <div className="exam-passage max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {context.content}
          </div>
        </div>
      )}
    </div>
  );
}
