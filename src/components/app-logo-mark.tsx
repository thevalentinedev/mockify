import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export function AppLogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className
      )}
    >
      <GraduationCap className="size-4" aria-hidden />
    </div>
  );
}
