"use client";

import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useState } from "react";

const DEFAULT_STORAGE_KEY = "exam-hints-dismissed";

const DEFAULT_HINTS = [
  { keys: "1–4", label: "answer" },
  { keys: "Enter", label: "next" },
  { keys: "N", label: "next" },
  { keys: "P", label: "prev" },
  { keys: "F", label: "flag" },
  { keys: "R", label: "review" },
] as const;

export interface KeyboardHint {
  keys: string;
  label: string;
}

export interface KeyboardHintsProps {
  storageKey?: string;
  dismissible?: boolean;
  hints?: readonly KeyboardHint[];
  className?: string;
}

function readDismissed(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

export function KeyboardHints({
  storageKey = DEFAULT_STORAGE_KEY,
  dismissible = true,
  hints = DEFAULT_HINTS,
  className,
}: KeyboardHintsProps) {
  const isClient = useIsClient();
  const [forceHidden, setForceHidden] = useState(false);

  const isHidden =
    forceHidden ||
    (dismissible && isClient && readDismissed(storageKey));

  function dismiss() {
    setForceHidden(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
  }

  if (isHidden) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
        className
      )}
    >
      {hints.map(({ keys, label }) => (
        <span key={keys} className="inline-flex items-center gap-1">
          <kbd className="rounded border border-border/60 bg-background px-1.5 py-0.5 font-mono text-[0.65rem] font-medium text-foreground">
            {keys}
          </kbd>
          {label}
        </span>
      ))}

      {dismissible && (
        <button
          type="button"
          onClick={dismiss}
          className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
          aria-label="Dismiss keyboard hints"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
