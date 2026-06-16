"use client";

import { SUBJECTS } from "@/lib/exam-config";
import { cn } from "@/lib/utils";
import { pill as pillClass, pillActive, pillDone } from "@/lib/surface";
import type { SubjectId } from "@/types/exam";
import { Check } from "lucide-react";

interface SubjectPillsProps {
  subjects: SubjectId[];
  activeSubjectId: SubjectId;
  completedSubjects: SubjectId[];
  onSelect?: (subjectId: SubjectId) => void;
  interactive?: boolean;
}

export function SubjectPills({
  subjects,
  activeSubjectId,
  completedSubjects,
  onSelect,
  interactive = false,
}: SubjectPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {subjects.map((subjectId) => {
        const subject = SUBJECTS.find((s) => s.id === subjectId);
        const isActive = subjectId === activeSubjectId;
        const isCompleted = completedSubjects.includes(subjectId);

        const pill = (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium transition-colors",
              pillClass,
              isCompleted && pillDone,
              isActive && !isCompleted && pillActive,
              isActive &&
                isCompleted &&
                "ring-2 ring-emerald-500/35 ring-offset-2 ring-offset-background",
              interactive &&
                (isCompleted || isActive) &&
                "cursor-pointer hover:opacity-90"
            )}
          >
            {isCompleted && <Check className="size-3.5" />}
            {subject?.name ?? subjectId}
          </span>
        );

        if (interactive && onSelect && (isCompleted || isActive)) {
          return (
            <button
              key={subjectId}
              type="button"
              onClick={() => onSelect(subjectId)}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {pill}
            </button>
          );
        }

        return <div key={subjectId}>{pill}</div>;
      })}
    </div>
  );
}
