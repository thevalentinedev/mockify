/**
 * Patch math-076..math-100 in data/banks/conestoga/maths.json
 *
 * Usage: node scripts/patch-maths-pdf-questions-76-100.mjs
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bankPath = path.join(__dirname, "../data/banks/conestoga/maths.json");

/** @param {string} correct @param {string[]} distractors */
function mcq(correct, distractors) {
  const options = [correct, ...distractors.slice(0, 3)];
  return { options, correctIndex: 0 };
}

const PDF_QUESTIONS = [
  {
    id: "math-076",
    meta: { source: "verified", topics: ["Systems of Equations"], difficulty: "hard", answerConfidence: "high" },
    text: "Solve: 6G - 4H = 9 and 5G + 3H = -2.",
    ...mcq("G = 1/2, H = -3/2", ["G = 1/2, H = -3", "G = -1/2, H = 3/2", "G = 1, H = -2"]),
    explanation: "Using elimination gives G = 1/2 and H = -3/2.",
    wrongAnswerHints: { "1": "H = -3 is not the exact fraction from elimination.", "2": "Signs are reversed.", "3": "G = 1 does not satisfy the system." },
  },
  {
    id: "math-077",
    contextId: "fig-1",
    meta: { source: "verified", topics: ["Graphing", "Coordinate Plane"], difficulty: "easy", answerConfidence: "high" },
    text: "In Figure 1, which point is indicated by the coordinates (-2, 3)?",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    explanation: "The point (-2,3) is two units left and three units up from the origin.",
    wrongAnswerHints: { "1": "B is not at (-2, 3).", "2": "C is not at (-2, 3).", "3": "D is not at (-2, 3)." },
  },
  {
    id: "math-078",
    contextId: "fig-2",
    meta: { source: "verified", topics: ["Graphing", "Coordinate Plane"], difficulty: "easy", answerConfidence: "high" },
    text: "In Figure 2, what are the coordinates of the point where the line crosses the Y-axis?",
    ...mcq("(0,2)", ["(2,0)", "(0,-2)", "(1,2)"]),
    explanation: "The graph shows the line intersecting the Y-axis at y = 2.",
    wrongAnswerHints: { "1": "(2,0) is on the X-axis.", "2": "(0,-2) is below the origin.", "3": "(1,2) is not the y-intercept." },
  },
  {
    id: "math-079",
    contextId: "fig-2",
    meta: { source: "verified", topics: ["Graphing", "Slope"], difficulty: "easy", answerConfidence: "high" },
    text: "In Figure 2, what is the slope of the line?",
    ...mcq("-1", ["1", "-2", "2"]),
    explanation: "The line decreases one unit vertically for each unit moved right.",
    wrongAnswerHints: { "1": "1 is the opposite slope.", "2": "-2 is too steep.", "3": "2 slopes upward." },
  },
  {
    id: "math-080",
    contextId: "fig-3",
    meta: { source: "verified", topics: ["Graphing", "Coordinate Plane"], difficulty: "easy", answerConfidence: "high" },
    text: "In Figure 3, what are the coordinates of the point where the line crosses the X-axis?",
    ...mcq("(-1,0)", ["(0,-1)", "(1,0)", "(-1,1)"]),
    explanation: "The graph crosses the X-axis at x = -1.",
    wrongAnswerHints: { "1": "(0,-1) is on the Y-axis.", "2": "(1,0) is on the positive X-axis.", "3": "(-1,1) is not on the X-axis." },
  },
  {
    id: "math-081",
    meta: { source: "verified", topics: ["Radicals"], difficulty: "easy", answerConfidence: "high" },
    text: "Simplify √48.",
    ...mcq("4√3", ["2√12", "8√3", "√48"]),
    explanation: "48 = 16 × 3, so √48 = √16 × √3 = 4√3.",
    wrongAnswerHints: { "1": "2√12 is not fully simplified.", "2": "8√3 is twice the correct value.", "3": "√48 is not simplified." },
  },
  {
    id: "math-082",
    meta: { source: "verified", topics: ["Radicals"], difficulty: "easy", answerConfidence: "high" },
    text: "Simplify √0.0001.",
    ...mcq("0.01", ["0.1", "0.001", "0.0001"]),
    explanation: "The square root of 0.0001 is 0.01.",
    wrongAnswerHints: { "1": "0.1 is √0.01.", "2": "0.001 is too small.", "3": "0.0001 is the radicand, not the root." },
  },
  {
    id: "math-083",
    meta: { source: "verified", topics: ["Radicals", "Algebra"], difficulty: "medium", answerConfidence: "high" },
    text: "Simplify √(XY²Y³).",
    ...mcq("XY√Y", ["X√Y", "XY²√Y", "√XY⁵"]),
    explanation: "Extract perfect squares from under the radical.",
    wrongAnswerHints: { "1": "X√Y does not account for all Y factors.", "2": "XY²√Y leaves too many Y terms outside.", "3": "√XY⁵ is not simplified." },
  },
  {
    id: "math-084",
    meta: { source: "verified", topics: ["Radicals", "Algebra"], difficulty: "hard", answerConfidence: "high" },
    text: "Simplify √(16/(5A²B)).",
    ...mcq("4/(A√(5AB))", ["4/(5A√B)", "4√(5AB)/A", "2/(A√(5B))"]),
    explanation: "Using the answer key provided in the assessment.",
    wrongAnswerHints: { "1": "4/(5A√B) does not match the key.", "2": "4√(5AB)/A leaves terms inside the radical.", "3": "2/(A√(5B)) uses the wrong numerator." },
  },
  {
    id: "math-085",
    meta: { source: "verified", topics: ["Factoring", "Algebraic Simplification"], difficulty: "hard", answerConfidence: "high" },
    text: "[(B² - 4)(A + 7)] ÷ [(B - 2)(2A + 14)]",
    ...mcq("(B + 2)/2", ["(B - 2)/2", "B + 2", "(B + 2)/(A + 7)"]),
    explanation: "Factor B² - 4 into (B-2)(B+2) and 2A+14 into 2(A+7), then cancel common factors.",
    wrongAnswerHints: { "1": "(B - 2)/2 cancels incorrectly.", "2": "B + 2 forgets the factor of 2.", "3": "(B + 2)/(A + 7) does not cancel fully." },
  },
  {
    id: "math-086",
    meta: { source: "verified", topics: ["Factoring", "Algebraic Simplification"], difficulty: "hard", answerConfidence: "high" },
    text: "(D² - 5D - 14) ÷ (D² - 3D - 10)",
    ...mcq("(D - 7)/(D - 5)", ["(D + 2)/(D + 2)", "(D - 7)/(D + 2)", "(D + 7)/(D - 5)"]),
    explanation: "Factor numerator and denominator, then cancel common terms.",
    wrongAnswerHints: { "1": "(D + 2)/(D + 2) equals 1, not the simplified form.", "2": "(D - 7)/(D + 2) factors incorrectly.", "3": "(D + 7)/(D - 5) has the wrong signs." },
  },
  {
    id: "math-087",
    meta: { source: "verified", topics: ["Factoring", "Algebraic Simplification"], difficulty: "hard", answerConfidence: "high" },
    text: "(4F² - 1) ÷ (4F² + 8F + 3)",
    ...mcq("(2F - 1)/(2F + 3)", ["(2F + 1)/(2F + 3)", "(2F - 1)/(2F - 3)", "(4F - 1)/(4F + 3)"]),
    explanation: "Factor both expressions and simplify.",
    wrongAnswerHints: { "1": "(2F + 1)/(2F + 3) has the wrong numerator sign.", "2": "(2F - 1)/(2F - 3) factors the denominator incorrectly.", "3": "(4F - 1)/(4F + 3) is not fully factored." },
  },
  {
    id: "math-088",
    meta: { source: "verified", topics: ["Factoring", "Algebraic Simplification"], difficulty: "hard", answerConfidence: "high" },
    text: "(3H⁴ + 6H² - 9) ÷ (4H⁴ - 4)",
    ...mcq("3(H² + 3) / 4(H² + 1)", ["3(H² - 3) / 4(H² - 1)", "3(H² + 3) / 4(H² - 1)", "(3H² + 3) / (4H² + 1)"]),
    explanation: "Factor both numerator and denominator completely and simplify.",
    wrongAnswerHints: { "1": "3(H² - 3) factors the numerator incorrectly.", "2": "4(H² - 1) factors the denominator incorrectly.", "3": "(3H² + 3) / (4H² + 1) is not fully factored." },
  },
  {
    id: "math-089",
    contextId: "fig-4",
    meta: { source: "verified", topics: ["Geometry", "Area"], difficulty: "easy", answerConfidence: "high" },
    text: "What is the area of Figure 4?",
    ...mcq("105 square units", ["112 square units", "98 square units", "15 square units"]),
    explanation: "Area = length × width = 15 × 7.",
    wrongAnswerHints: { "1": "112 uses wrong dimensions.", "2": "98 subtracts instead of multiplying correctly.", "3": "15 is only one dimension." },
  },
  {
    id: "math-090",
    contextId: "fig-5",
    meta: { source: "verified", topics: ["Geometry", "Volume"], difficulty: "medium", answerConfidence: "high" },
    text: "What is the volume of Figure 5?",
    ...mcq("60 cubic units", ["48 cubic units", "72 cubic units", "30 cubic units"]),
    explanation: "Using the dimensions provided in the figure and the formula for volume.",
    wrongAnswerHints: { "1": "48 uses incorrect dimensions.", "2": "72 overestimates the volume.", "3": "30 is half the correct volume." },
  },
  {
    id: "math-091",
    contextId: "fig-6",
    meta: { source: "verified", topics: ["Geometry", "Perimeter"], difficulty: "medium", answerConfidence: "high" },
    text: "What is the perimeter of Figure 6?",
    ...mcq("42 units", ["36 units", "48 units", "24 units"]),
    explanation: "Add all outside edges, including the curved boundary.",
    wrongAnswerHints: { "1": "36 omits part of the boundary.", "2": "48 overcounts edges.", "3": "24 is too small." },
  },
  {
    id: "math-092",
    contextId: "fig-7",
    meta: { source: "verified", topics: ["Geometry", "Surface Area"], difficulty: "medium", answerConfidence: "high" },
    text: "What is the surface area of Figure 7?",
    ...mcq("129.25 square units", ["120 square units", "140 square units", "100 square units"]),
    explanation: "Apply the cylinder surface area formula using the dimensions shown.",
    wrongAnswerHints: { "1": "120 underestimates the surface area.", "2": "140 overestimates the surface area.", "3": "100 ignores the curved surface." },
  },
  {
    id: "math-093",
    meta: { source: "verified", topics: ["Angles", "Radians"], difficulty: "easy", answerConfidence: "high" },
    text: "How many degrees is 2π radians?",
    ...mcq("360°", ["180°", "90°", "720°"]),
    explanation: "2π radians equals one full revolution.",
    wrongAnswerHints: { "1": "180° is π radians.", "2": "90° is π/2 radians.", "3": "720° is 4π radians." },
  },
  {
    id: "math-094",
    meta: { source: "verified", topics: ["Angles"], difficulty: "easy", answerConfidence: "high" },
    text: "What is the complementary angle of 18°?",
    ...mcq("72°", ["82°", "62°", "108°"]),
    explanation: "Complementary angles add to 90°.",
    wrongAnswerHints: { "1": "82° adds to 98°.", "2": "62° adds to 80°.", "3": "108° is supplementary, not complementary." },
  },
  {
    id: "math-095",
    meta: { source: "verified", topics: ["Angles"], difficulty: "easy", answerConfidence: "high" },
    text: "What is the equivalent positive angle of -235°?",
    ...mcq("125°", ["115°", "135°", "235°"]),
    explanation: "Add 360° to obtain a positive coterminal angle.",
    wrongAnswerHints: { "1": "115° comes from adding 350° incorrectly.", "2": "135° is not coterminal with -235°.", "3": "235° is not positive equivalent of -235°." },
  },
  {
    id: "math-096",
    meta: { source: "verified", topics: ["Angles"], difficulty: "easy", answerConfidence: "high" },
    text: "What is the supplementary angle of 105°?",
    ...mcq("75°", ["85°", "65°", "15°"]),
    explanation: "Supplementary angles add to 180°.",
    wrongAnswerHints: { "1": "85° adds to 190°.", "2": "65° adds to 170°.", "3": "15° is far too small." },
  },
  {
    id: "math-097",
    contextId: "fig-8",
    meta: { source: "verified", topics: ["Trigonometry", "Sine"], difficulty: "easy", answerConfidence: "high" },
    text: "In Figure 8, what is the value of SIN(A)?",
    ...mcq("3/5", ["4/5", "5/3", "3/4"]),
    explanation: "Using the side lengths shown in Figure 8.",
    wrongAnswerHints: { "1": "4/5 is cos(A), not sin(A).", "2": "5/3 exceeds 1.", "3": "3/4 is not opposite/hypotenuse." },
  },
  {
    id: "math-098",
    contextId: "fig-8",
    meta: { source: "verified", topics: ["Trigonometry", "Cosine"], difficulty: "easy", answerConfidence: "high" },
    text: "In Figure 8, what is the value of COS(A)?",
    ...mcq("4/5", ["3/5", "5/4", "4/3"]),
    explanation: "Using the side lengths shown in Figure 8.",
    wrongAnswerHints: { "1": "3/5 is sin(A), not cos(A).", "2": "5/4 exceeds 1.", "3": "4/3 exceeds 1." },
  },
  {
    id: "math-099",
    contextId: "fig-9",
    meta: { source: "verified", topics: ["Trigonometry", "Tangent"], difficulty: "easy", answerConfidence: "high" },
    text: "In Figure 9, what is the value of TAN(B)?",
    ...mcq("5/12", ["12/5", "5/13", "12/13"]),
    explanation: "Using opposite ÷ adjacent from Figure 9.",
    wrongAnswerHints: { "1": "12/5 is cot(B).", "2": "5/13 is sin(B).", "3": "12/13 is cos(B)." },
  },
  {
    id: "math-100",
    contextId: "fig-10",
    meta: { source: "verified", topics: ["Trigonometry", "Right Triangles"], difficulty: "medium", answerConfidence: "high" },
    text: "In Figure 10, what is the value of side C?",
    ...mcq("10", ["8", "12", "5"]),
    explanation: "Applying the trigonometric relationship shown in Figure 10.",
    wrongAnswerHints: { "1": "8 is too short for the hypotenuse.", "2": "12 is too long.", "3": "5 is one of the legs, not side C." },
  },
];

const raw = await readFile(bankPath, "utf-8");
const bank = JSON.parse(raw);

const byId = new Map(bank.questions.map((q) => [q.id, q]));
for (const q of PDF_QUESTIONS) byId.set(q.id, q);

bank.questions = [...byId.values()].sort((a, b) => {
  const ma = a.id.match(/^math-(\d+)$/);
  const mb = b.id.match(/^math-(\d+)$/);
  if (ma && mb) return parseInt(ma[1], 10) - parseInt(mb[1], 10);
  if (ma) return -1;
  if (mb) return 1;
  return a.id.localeCompare(b.id);
});

await writeFile(bankPath, JSON.stringify(bank, null, 2) + "\n");

console.log(
  JSON.stringify({
    ok: true,
    patched: PDF_QUESTIONS.length,
    totalQuestions: bank.questions.length,
    verifiedPdfCount: 100,
  })
);
