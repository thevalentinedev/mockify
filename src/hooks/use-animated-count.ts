"use client";

import { useEffect, useState } from "react";

/** Smoothly ticks the displayed number toward the target */
export function useAnimatedCount(target: number, maxStep = 1): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (display === target) return;

    const diff = target - display;
    const step = diff > 0 ? Math.min(maxStep, diff) : Math.max(-maxStep, diff);
    const timer = setTimeout(() => setDisplay((value) => value + step), 40);
    return () => clearTimeout(timer);
  }, [display, target, maxStep]);

  return target < display ? target : display;
}
