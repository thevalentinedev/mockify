import { Fragment, type ReactNode } from "react";

/**
 * Formats exam question text that lost typographic cues during PDF extraction.
 *
 * Display / font caveats:
 * - Superscripts flatten to inline text: "10 -3" reads like subtraction, not 10⁻³.
 * - Carets may be dropped: "x 106" means × 10⁶, not the integer 106.
 * - Multiplication is often ASCII "x" instead of "×".
 * - Negative exponents may lose spacing: "10-3" vs "10 -3".
 * - Units stay glued to coefficients (e.g. "km2", "m3") — we do not format those.
 * - Ordinary numbers (dates, counts, "10 000") are left alone unless they match
 *   scientific-notation patterns below; ambiguous cases favour math context.
 * - Already-correct Unicode (×, superscript digits) is preserved.
 */

type TextSegment = { kind: "text"; value: string };
type SciSegment = { kind: "sci"; coefficient: string; exponent: string };
type PowSegment = { kind: "pow"; exponent: string };

type Segment = TextSegment | SciSegment | PowSegment;

type MatchRange = { start: number; end: number; segment: Exclude<Segment, TextSegment> };

const SCI_NOTATION_RE =
  /(\d+(?:\.\d+)?)\s*[x×]\s*10(?:\s+(-?\d+)|\^(-?\d+)|(-\d+)|(\d+))/gi;

const STANDALONE_POWER_RE = /10(?:\s+(-?\d+)|\^(-?\d+))/gi;

function overlaps(
  start: number,
  end: number,
  ranges: MatchRange[]
): boolean {
  return ranges.some((r) => start < r.end && end > r.start);
}

function exponentFromGroups(groups: (string | undefined)[]): string {
  return groups.find((g) => g !== undefined) ?? "";
}

function findScientificMatches(text: string): MatchRange[] {
  const matches: MatchRange[] = [];
  SCI_NOTATION_RE.lastIndex = 0;

  let match = SCI_NOTATION_RE.exec(text);
  while (match) {
    const coefficient = match[1];
    const exponent = exponentFromGroups([match[2], match[3], match[4], match[5]]);
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      segment: { kind: "sci", coefficient, exponent },
    });
    match = SCI_NOTATION_RE.exec(text);
  }

  return matches;
}

function findStandalonePowerMatches(
  text: string,
  occupied: MatchRange[]
): MatchRange[] {
  const matches: MatchRange[] = [];
  STANDALONE_POWER_RE.lastIndex = 0;

  let match = STANDALONE_POWER_RE.exec(text);
  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    if (!overlaps(start, end, occupied)) {
      const exponent = exponentFromGroups([match[1], match[2]]);
      matches.push({
        start,
        end,
        segment: { kind: "pow", exponent },
      });
    }
    match = STANDALONE_POWER_RE.exec(text);
  }

  return matches;
}

function normalizeMultiplicationSign(text: string): string {
  return text
    .replace(/\s+x\s+/gi, " × ")
    .replace(/\bpi\b/gi, "π")
    .replace(/sqrt\(([^)]+)\)/gi, "√($1)")
    .replace(/(\d+)\/(\d+)/g, "$1⁄$2");
}

function parseMathText(text: string): Segment[] {
  const sciMatches = findScientificMatches(text);
  const powMatches = findStandalonePowerMatches(text, sciMatches);
  const allMatches = [...sciMatches, ...powMatches].sort(
    (a, b) => a.start - b.start
  );

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { start, end, segment } of allMatches) {
    if (start > cursor) {
      segments.push({
        kind: "text",
        value: normalizeMultiplicationSign(text.slice(cursor, start)),
      });
    }
    segments.push(segment);
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({
      kind: "text",
      value: normalizeMultiplicationSign(text.slice(cursor)),
    });
  }

  return segments.length > 0 ? segments : [{ kind: "text", value: text }];
}

function renderSegment(segment: Segment, key: number): ReactNode {
  if (segment.kind === "text") {
    return <Fragment key={key}>{segment.value}</Fragment>;
  }

  if (segment.kind === "sci") {
    return (
      <Fragment key={key}>
        {segment.coefficient} × 10<sup>{segment.exponent}</sup>
      </Fragment>
    );
  }

  return (
    <Fragment key={key}>
      10<sup>{segment.exponent}</sup>
    </Fragment>
  );
}

/** Parse question/option text into React nodes with restored math formatting. */
export function formatMathText(text: string): ReactNode[] {
  return parseMathText(text).map((segment, index) =>
    renderSegment(segment, index)
  );
}

export function FormatMathText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return <span className={className}>{formatMathText(children)}</span>;
}
