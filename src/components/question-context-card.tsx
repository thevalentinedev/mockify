"use client";

import { getContextImageSrc } from "@/lib/context-image";
import { getContextLabel } from "@/lib/question-context";
import { divider, iconTile, shell, surface } from "@/lib/surface";
import { cn } from "@/lib/utils";
import type { QuestionContext, QuestionContextType, SchoolId, SubjectId } from "@/types/exam";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  FileText,
  ImageIcon,
  Shapes,
  Table2,
} from "lucide-react";
import { useMemo, useState } from "react";

const ICONS: Record<QuestionContextType, typeof BookOpen> = {
  passage: BookOpen,
  comprehension: FileText,
  graph: BarChart3,
  table: Table2,
  diagram: Shapes,
  image: ImageIcon,
};

const PASSAGE_CHUNK = 1200;

interface QuestionContextCardProps {
  context: QuestionContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId?: SchoolId;
  subjectId?: SubjectId;
}

export function QuestionContextCard({
  context,
  open,
  onOpenChange,
  schoolId,
  subjectId,
}: QuestionContextCardProps) {
  const Icon = ICONS[context.type];
  const label = getContextLabel(context.type, context.title);
  const imageSrc = getContextImageSrc(context, schoolId, subjectId);
  const isLongPassage =
    (context.type === "passage" || context.type === "comprehension") &&
    context.content.length > PASSAGE_CHUNK;
  const chunks = useMemo(() => {
    if (!isLongPassage) return [context.content];
    const parts: string[] = [];
    let cursor = 0;
    while (cursor < context.content.length) {
      parts.push(context.content.slice(cursor, cursor + PASSAGE_CHUNK));
      cursor += PASSAGE_CHUNK;
    }
    return parts;
  }, [context.content, isLongPassage]);
  const [chunkIndex, setChunkIndex] = useState(0);

  return (
    <div className={cn(shell, "overflow-hidden")}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn(iconTile, "size-8 shrink-0")}>
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
        <div className="space-y-3 px-4 pb-4">
          <div className={divider} />
          {imageSrc && (
            <div className={cn(surface, "overflow-hidden p-2")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={label}
                className="mx-auto max-h-80 w-full rounded-[var(--radius-surface)] object-contain dark:brightness-95"
              />
            </div>
          )}
          {context.content && (
            <div className="space-y-2">
              <div className="exam-passage max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {chunks[chunkIndex]}
              </div>
              {chunks.length > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="underline disabled:opacity-40"
                    disabled={chunkIndex === 0}
                    onClick={() => setChunkIndex((i) => Math.max(0, i - 1))}
                  >
                    Previous section
                  </button>
                  <span>
                    Part {chunkIndex + 1} of {chunks.length}
                  </span>
                  <button
                    type="button"
                    className="underline disabled:opacity-40"
                    disabled={chunkIndex >= chunks.length - 1}
                    onClick={() =>
                      setChunkIndex((i) => Math.min(chunks.length - 1, i + 1))
                    }
                  >
                    Next section
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
