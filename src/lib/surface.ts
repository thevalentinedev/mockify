import { cn } from "@/lib/utils";

/** Soft UI class tokens — pair with globals.css concentric radius scale */
export const shell = "soft-shell";
export const shellSelected = "soft-shell-selected";
export const surface = "soft-surface";
export const row = "soft-row";
export const rowSelected = "soft-row-selected";
export const check = "soft-check";
export const checkSelected = "soft-check-selected";
export const iconTile = "soft-icon-tile";
export const statTile = "soft-stat-tile";
export const chrome = "soft-chrome";
export const kbd = "soft-kbd";
export const pill = "soft-pill";
export const pillActive = "soft-pill-active";
export const pillDone = "soft-pill-done";
export const divider = "soft-divider";

export function softRow(selected?: boolean, className?: string) {
  return cn(row, selected && rowSelected, className);
}

export function softCheck(selected?: boolean, className?: string) {
  return cn(check, selected && checkSelected, className);
}
