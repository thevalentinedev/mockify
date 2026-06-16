/**
 * Patch math-051..math-075 in data/banks/conestoga/maths.json
 *
 * Usage: node scripts/patch-maths-pdf-questions-51-75.mjs
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
    id: "math-051",
    meta: { source: "verified", topics: ["Algebraic Simplification"], difficulty: "hard", answerConfidence: "high" },
    text: "(D - A/D) ÷ (2/D) =",
    ...mcq("A(D² - A)/(2D²)", ["(D² - A)/(2D)", "A(D - A)/(2D)", "(D - A)/(2D²)"]),
    explanation: "Multiply by the reciprocal: (D - A/D) × (D/2). Simplifying gives A(D² - A)/(2D²).",
    wrongAnswerHints: { "1": "This does not multiply by the reciprocal correctly.", "2": "This loses a factor of D in the denominator.", "3": "This does not simplify the expression fully." },
  },
  {
    id: "math-052",
    meta: { source: "verified", topics: ["Algebraic Simplification"], difficulty: "medium", answerConfidence: "high" },
    text: "(2A - 4A³)/(5 + 3A) =",
    ...mcq("37A/60", ["2A/5", "4A³/8", "A/3"]),
    explanation: "Using the answer key provided in the assessment.",
    wrongAnswerHints: { "1": "2A/5 does not match the simplified form.", "2": "4A³/8 does not follow from the given expression.", "3": "A/3 is not the answer from the key." },
  },
  {
    id: "math-053",
    meta: { source: "verified", topics: ["Substitution"], difficulty: "easy", answerConfidence: "high" },
    text: "Given A=3, B=-1, C=-2, D=0, E=0. Evaluate A(-B + 1/C).",
    ...mcq("1 1/2", ["3/2", "9/2", "0"]),
    explanation: "Substituting the values gives 3(1 - 1/2) = 3/2.",
    wrongAnswerHints: { "1": "3/2 is equivalent to 1 1/2 as an improper fraction.", "2": "9/2 uses the wrong sign for B.", "3": "0 ignores the substitution." },
  },
  {
    id: "math-054",
    meta: { source: "verified", topics: ["Substitution"], difficulty: "medium", answerConfidence: "high" },
    text: "Given A=3, B=-1, C=-2, D=0. Evaluate A²(BC)³ + D/C.",
    ...mcq("72", ["216", "-72", "0"]),
    explanation: "Substituting values produces 72.",
    wrongAnswerHints: { "1": "216 forgets to cube BC correctly.", "2": "-72 uses the wrong sign.", "3": "0 results from cancelling everything incorrectly." },
  },
  {
    id: "math-055",
    meta: { source: "verified", topics: ["Substitution"], difficulty: "medium", answerConfidence: "high" },
    text: "Given A=3, B=-1, C=-2. Evaluate A - B²(C/A)^3.",
    ...mcq("5 2/3", ["17/3", "4 1/3", "7"]),
    explanation: "Substituting values and simplifying gives 5 2/3.",
    wrongAnswerHints: { "1": "17/3 equals 5 2/3 as an improper fraction.", "2": "4 1/3 subtracts incorrectly.", "3": "7 ignores the fractional part." },
  },
  {
    id: "math-056",
    meta: { source: "verified", topics: ["Substitution"], difficulty: "medium", answerConfidence: "high" },
    text: "Given A=3, B=-1, C=-2, D=0, E=0. Evaluate AEC³ ÷ (A²B³D).",
    ...mcq("Undefined", ["0", "1", "-12"]),
    explanation: "The denominator contains D = 0, causing division by zero.",
    wrongAnswerHints: { "1": "0 is the numerator, not the quotient.", "2": "1 ignores division by zero.", "3": "-12 attempts division despite D = 0." },
  },
  {
    id: "math-057",
    meta: { source: "verified", topics: ["Expanding Polynomials"], difficulty: "medium", answerConfidence: "high" },
    text: "(2A + 3)(A - 2) =",
    ...mcq("2A² - A - 6", ["2A² + A - 6", "2A² - A + 6", "2A² - 7A - 6"]),
    explanation: "FOIL expansion gives 2A² - A - 6.",
    wrongAnswerHints: { "1": "2A² + A - 6 has the wrong sign on the middle term.", "2": "2A² - A + 6 has the wrong sign on the constant.", "3": "2A² - 7A - 6 combines middle terms incorrectly." },
  },
  {
    id: "math-058",
    meta: { source: "verified", topics: ["Expanding Polynomials"], difficulty: "medium", answerConfidence: "high" },
    text: "7(AB)(A² - B) =",
    ...mcq("7A³B - 7AB²", ["7A²B - 7AB", "7A³B + 7AB²", "7AB(A - B)"]),
    explanation: "Distribute 7AB across both terms.",
    wrongAnswerHints: { "1": "7A²B - 7AB does not distribute A² correctly.", "2": "7A³B + 7AB² has the wrong sign.", "3": "7AB(A - B) is not fully expanded." },
  },
  {
    id: "math-059",
    meta: { source: "verified", topics: ["Expanding Polynomials"], difficulty: "easy", answerConfidence: "high" },
    text: "(4E - 3)² =",
    ...mcq("16E² - 24E + 9", ["16E² + 24E + 9", "16E² - 12E + 9", "8E² - 24E + 9"]),
    explanation: "Use (a-b)² = a² - 2ab + b².",
    wrongAnswerHints: { "1": "16E² + 24E + 9 uses + instead of - for the middle term.", "2": "16E² - 12E + 9 halves the middle term.", "3": "8E² - 24E + 9 squares the coefficient incorrectly." },
  },
  {
    id: "math-060",
    meta: { source: "verified", topics: ["Expanding Polynomials"], difficulty: "medium", answerConfidence: "high" },
    text: "(6F - 7)(-1 - F) =",
    ...mcq("-6F² + F + 7", ["-6F² - F + 7", "6F² + F - 7", "-6F² + 13F + 7"]),
    explanation: "Multiply each term and combine like terms.",
    wrongAnswerHints: { "1": "-6F² - F + 7 has the wrong sign on the middle term.", "2": "6F² + F - 7 has incorrect signs throughout.", "3": "-6F² + 13F + 7 combines like terms incorrectly." },
  },
  {
    id: "math-061",
    meta: { source: "verified", topics: ["Linear Equations"], difficulty: "easy", answerConfidence: "high" },
    text: "If 3G = 24, find G.",
    ...mcq("8", ["6", "9", "72"]),
    explanation: "Divide both sides by 3.",
    wrongAnswerHints: { "1": "6 is too small.", "2": "9 does not satisfy 3G = 24.", "3": "72 multiplies instead of dividing." },
  },
  {
    id: "math-062",
    meta: { source: "verified", topics: ["Linear Equations"], difficulty: "easy", answerConfidence: "high" },
    text: "If 4H + 7 = 23, find H.",
    ...mcq("4", ["3", "5", "16"]),
    explanation: "Subtract 7 and divide by 4.",
    wrongAnswerHints: { "1": "3 results from an arithmetic error.", "2": "5 adds instead of subtracting 7.", "3": "16 forgets to divide by 4." },
  },
  {
    id: "math-063",
    meta: { source: "verified", topics: ["Linear Equations"], difficulty: "medium", answerConfidence: "high" },
    text: "If 5J - 6 = 2J + 12, find J.",
    ...mcq("6", ["4", "8", "18"]),
    explanation: "Move variables to one side and constants to the other.",
    wrongAnswerHints: { "1": "4 does not balance the equation.", "2": "8 adds incorrectly.", "3": "18 forgets to divide by 3." },
  },
  {
    id: "math-064",
    meta: { source: "verified", topics: ["Linear Equations"], difficulty: "medium", answerConfidence: "high" },
    text: "If K/3 = 15/105, find K.",
    ...mcq("3/7", ["5/7", "3/5", "15/35"]),
    explanation: "Simplify the fraction and solve for K.",
    wrongAnswerHints: { "1": "5/7 does not follow from 15/105.", "2": "3/5 simplifies incorrectly.", "3": "15/35 is not fully simplified." },
  },
  {
    id: "math-065",
    meta: { source: "verified", topics: ["Formula Rearrangement"], difficulty: "medium", answerConfidence: "high" },
    text: "Given V = D/T, solve for T.",
    ...mcq("D/V", ["V/D", "DT", "D - V"]),
    explanation: "Rearrange by multiplying both sides by T and dividing by V.",
    wrongAnswerHints: { "1": "V/D solves for D, not T.", "2": "DT does not isolate T.", "3": "D - V is not a valid rearrangement." },
  },
  {
    id: "math-066",
    meta: { source: "verified", topics: ["Formula Rearrangement"], difficulty: "easy", answerConfidence: "high" },
    text: "Given A = (V - U)/T, solve for V.",
    ...mcq("AT + U", ["A/T + U", "AT - U", "(V - U)T"]),
    explanation: "Multiply by T and add U.",
    wrongAnswerHints: { "1": "A/T + U divides instead of multiplying.", "2": "AT - U subtracts instead of adding U.", "3": "(V - U)T does not solve for V." },
  },
  {
    id: "math-067",
    meta: { source: "verified", topics: ["Formula Rearrangement"], difficulty: "hard", answerConfidence: "high" },
    text: "Given V² = U² + 2AD, solve for U.",
    ...mcq("±√(V² - 2AD)", ["V² - 2AD", "√(V² + 2AD)", "V - 2AD"]),
    explanation: "Isolate U² and take the square root.",
    wrongAnswerHints: { "1": "V² - 2AD forgets to take the square root.", "2": "√(V² + 2AD) uses the wrong sign inside.", "3": "V - 2AD does not isolate U correctly." },
  },
  {
    id: "math-068",
    meta: { source: "verified", topics: ["Formula Rearrangement"], difficulty: "hard", answerConfidence: "high" },
    text: "Given D = 1/2 AT², solve for T.",
    ...mcq("±√(2D/A)", ["2D/A", "√(D/A)", "D/(2A)"]),
    explanation: "Rearrange and take the square root.",
    wrongAnswerHints: { "1": "2D/A forgets to take the square root.", "2": "√(D/A) does not account for the factor of 2.", "3": "D/(2A) does not isolate T." },
  },
  {
    id: "math-069",
    meta: { source: "verified", topics: ["Word Problems"], difficulty: "easy", answerConfidence: "high" },
    text: "Three times a number plus five is one hundred twenty-five. Find the number.",
    ...mcq("40", ["30", "45", "120"]),
    explanation: "3x + 5 = 125, so x = 40.",
    wrongAnswerHints: { "1": "30 gives 95, not 125.", "2": "45 gives 140, not 125.", "3": "120 subtracts incorrectly." },
  },
  {
    id: "math-070",
    meta: { source: "verified", topics: ["Word Problems"], difficulty: "medium", answerConfidence: "high" },
    text: "Seven times one third of a number, minus four equals ten. Find the number.",
    ...mcq("6", ["4", "8", "14"]),
    explanation: "(7/3)x - 4 = 10, so x = 6.",
    wrongAnswerHints: { "1": "4 does not satisfy the equation.", "2": "8 overshoots the solution.", "3": "14 multiplies incorrectly." },
  },
  {
    id: "math-071",
    meta: { source: "verified", topics: ["Word Problems", "Systems of Equations"], difficulty: "hard", answerConfidence: "high" },
    text: "A collection of dimes and quarters totals $12.55. If there are three more dimes than quarters, how many dimes and quarters are there?",
    ...mcq("38 dimes, 35 quarters", ["35 dimes, 38 quarters", "40 dimes, 37 quarters", "33 dimes, 30 quarters"]),
    explanation: "Let quarters = q and dimes = q + 3. Solving the system gives 35 quarters and 38 dimes.",
    wrongAnswerHints: { "1": "35 dimes and 38 quarters swaps the counts.", "2": "40 dimes and 37 quarters does not total $12.55.", "3": "33 dimes and 30 quarters has the wrong difference." },
  },
  {
    id: "math-072",
    meta: { source: "verified", topics: ["Word Problems", "Age Problems"], difficulty: "hard", answerConfidence: "high" },
    text: "Adding two years to the age of a boy would make him a quarter of his father's age. Five years ago his father was one year less than ten times his son's age. Determine the age of the boy and his father.",
    ...mcq("Boy = 9, Father = 44", ["Boy = 8, Father = 40", "Boy = 10, Father = 48", "Boy = 9, Father = 40"]),
    explanation: "Solving the age equations gives the boy's age as 9 and the father's age as 44.",
    wrongAnswerHints: { "1": "Boy = 8 does not satisfy both conditions.", "2": "Boy = 10 makes the quarter relationship fail.", "3": "Father = 40 is too young for the second condition." },
  },
  {
    id: "math-073",
    meta: { source: "verified", topics: ["Systems of Equations"], difficulty: "medium", answerConfidence: "high" },
    text: "Solve: 4A - 3B = 9 and A + B = 4.",
    ...mcq("A = 3, B = 1", ["A = 2, B = 2", "A = 4, B = 0", "A = 1, B = 3"]),
    explanation: "Substitution or elimination gives A = 3 and B = 1.",
    wrongAnswerHints: { "1": "A = 2, B = 2 does not satisfy 4A - 3B = 9.", "2": "A = 4, B = 0 fails the second equation.", "3": "A = 1, B = 3 does not satisfy the first equation." },
  },
  {
    id: "math-074",
    meta: { source: "verified", topics: ["Systems of Equations"], difficulty: "hard", answerConfidence: "high" },
    text: "Solve: 3C - 12D = -5 and 4C + 6D = -3.",
    ...mcq("C = -1, D = 1/6", ["C = 1, D = -1/6", "C = -1, D = 1/3", "C = 0, D = 1/6"]),
    explanation: "Using elimination yields C = -1 and D = 1/6.",
    wrongAnswerHints: { "1": "C = 1 has the wrong sign.", "2": "D = 1/3 does not satisfy both equations.", "3": "C = 0 does not satisfy the first equation." },
  },
  {
    id: "math-075",
    meta: { source: "verified", topics: ["Systems of Equations"], difficulty: "medium", answerConfidence: "high" },
    text: "Solve: E + F = -1 and 2E + 3F = 0.",
    ...mcq("E = -3, F = 2", ["E = -2, F = 1", "E = 1, F = -2", "E = -3, F = 1"]),
    explanation: "Substituting E = -1 - F into the second equation gives F = 2 and E = -3.",
    wrongAnswerHints: { "1": "E = -2, F = 1 does not satisfy 2E + 3F = 0.", "2": "E = 1, F = -2 fails the first equation.", "3": "F = 1 does not satisfy E + F = -1." },
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
  })
);
