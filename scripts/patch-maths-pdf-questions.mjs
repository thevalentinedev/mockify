/**
 * Patch math-001..math-025 in data/banks/conestoga/maths.json
 * using PDF-extracted content. Converts correctAnswer → MCQ options.
 *
 * Usage: node scripts/patch-maths-pdf-questions.mjs
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
    id: "math-001",
    meta: { source: "verified", topics: ["Fundamentals", "Addition"], difficulty: "easy", answerConfidence: "high" },
    text: "216 + 64 + 1092 =",
    ...mcq("1372", ["1272", "1472", "1370"]),
    explanation: "Add the numbers: 216 + 64 = 280, and 280 + 1092 = 1372.",
    wrongAnswerHints: { "1": "1272 results from an addition error.", "2": "1472 is too high.", "3": "1370 is close but incorrect." },
  },
  {
    id: "math-002",
    meta: { source: "verified", topics: ["Fundamentals", "Subtraction"], difficulty: "easy", answerConfidence: "high" },
    text: "318 - 95 =",
    ...mcq("223", ["213", "228", "323"]),
    explanation: "318 minus 95 equals 223.",
    wrongAnswerHints: { "1": "213 subtracts incorrectly.", "2": "228 is not the difference.", "3": "323 does not subtract 95." },
  },
  {
    id: "math-003",
    meta: { source: "verified", topics: ["Fundamentals", "Multiplication"], difficulty: "easy", answerConfidence: "high" },
    text: "6 × 12 × 343 =",
    ...mcq("24696", ["2466", "24796", "246860"]),
    explanation: "First multiply 6 × 12 = 72. Then 72 × 343 = 24696.",
    wrongAnswerHints: { "1": "2466 is missing a factor of 10.", "2": "24796 is slightly off.", "3": "246860 multiplies incorrectly." },
  },
  {
    id: "math-004",
    meta: { source: "verified", topics: ["Fundamentals", "Area", "Word Problems"], difficulty: "easy", answerConfidence: "high" },
    text: "How much would it cost to cover a floor 8 m × 6 m with carpet that costs $13 per square metre?",
    ...mcq("$624", ["$548", "$704", "$48"]),
    explanation: "The floor area is 8 × 6 = 48 square metres. At $13 per square metre, the cost is 48 × 13 = $624.",
    wrongAnswerHints: { "1": "$548 uses the wrong rate or area.", "2": "$704 overestimates the cost.", "3": "$48 is only the area, not the total cost." },
  },
  {
    id: "math-005",
    meta: { source: "verified", topics: ["Fractions", "Lowest Common Denominator"], difficulty: "easy", answerConfidence: "high" },
    text: "Find the lowest common denominator of 1/3, 1/7, and 1/2.",
    ...mcq("42", ["21", "14", "84"]),
    explanation: "The lowest common denominator of 3, 7, and 2 is 42.",
    wrongAnswerHints: { "1": "21 is not divisible by 7 and 2.", "2": "14 is not divisible by 3.", "3": "84 is a common denominator but not the lowest." },
  },
  {
    id: "math-006",
    meta: { source: "verified", topics: ["Fractions", "Simplifying Fractions"], difficulty: "easy", answerConfidence: "high" },
    text: "Reduce 24/56 to lowest terms.",
    ...mcq("3/7", ["6/14", "4/7", "12/28"]),
    explanation: "Divide both 24 and 56 by their greatest common factor, 8. This gives 3/7.",
    wrongAnswerHints: { "1": "6/14 is equivalent but not in lowest terms.", "2": "4/7 is not equivalent to 24/56.", "3": "12/28 is equivalent but not reduced." },
  },
  {
    id: "math-007",
    meta: { source: "verified", topics: ["Fractions", "Prime Factors"], difficulty: "easy", answerConfidence: "high" },
    text: "List the prime factors of 216.",
    ...mcq("3 × 3 × 3 × 2 × 2 × 2", ["2 × 2 × 2 × 3 × 3", "3 × 3 × 2 × 2 × 2", "216"]),
    explanation: "216 = 27 × 8 = 3 × 3 × 3 × 2 × 2 × 2.",
    wrongAnswerHints: { "1": "This is equivalent but missing a factor of 3.", "2": "This is equivalent but missing a factor of 3.", "3": "216 is the number itself, not its prime factors." },
  },
  {
    id: "math-008",
    meta: { source: "verified", topics: ["Fractions", "Division by Zero"], difficulty: "medium", answerConfidence: "high" },
    text: "Evaluate 2/0.",
    ...mcq("Undefined", ["0", "2", "∞"]),
    explanation: "Division by zero is undefined.",
    wrongAnswerHints: { "1": "0 is not the result of dividing by zero.", "2": "2 is the numerator, not the quotient.", "3": "Infinity is not the standard answer for division by zero in this context." },
  },
  {
    id: "math-009",
    meta: { source: "verified", topics: ["Fractions", "Addition"], difficulty: "easy", answerConfidence: "high" },
    text: "3/4 + 7/8 =",
    ...mcq("1 5/8", ["1 1/8", "1 3/4", "10/8"]),
    explanation: "Convert 3/4 to 6/8. Then 6/8 + 7/8 = 13/8 = 1 5/8.",
    wrongAnswerHints: { "1": "1 1/8 adds incorrectly.", "2": "1 3/4 is too large.", "3": "10/8 equals 1 1/4, not the correct sum." },
  },
  {
    id: "math-010",
    meta: { source: "verified", topics: ["Fractions", "Subtraction"], difficulty: "easy", answerConfidence: "high" },
    text: "11/2 - 2/3 =",
    ...mcq("4 5/6", ["4 1/6", "5 1/6", "29/6"]),
    explanation: "11/2 = 33/6 and 2/3 = 4/6. So 33/6 - 4/6 = 29/6 = 4 5/6.",
    wrongAnswerHints: { "1": "4 1/6 subtracts incorrectly.", "2": "5 1/6 is too large.", "3": "29/6 is correct as an improper fraction but the mixed form is 4 5/6." },
  },
  {
    id: "math-011",
    meta: { source: "verified", topics: ["Fractions", "Multiplication"], difficulty: "easy", answerConfidence: "high" },
    text: "63/8 × 3/4 =",
    ...mcq("5 29/32", ["5 1/4", "189/32", "6"]),
    explanation: "Multiply numerators and denominators: 63 × 3 = 189 and 8 × 4 = 32. So the answer is 189/32 = 5 29/32.",
    wrongAnswerHints: { "1": "5 1/4 is not the product.", "2": "189/32 is correct as an improper fraction.", "3": "6 is too large." },
  },
  {
    id: "math-012",
    meta: { source: "verified", topics: ["Fractions", "Word Problems"], difficulty: "medium", answerConfidence: "high" },
    text: "If 60 2/3 litres of gasoline are added to a tank that already contains 5 1/2 litres, what is the total amount of gasoline in the tank?",
    ...mcq("66 1/6 litres", ["65 7/6 litres", "66 litres", "60 2/3 litres"]),
    explanation: "60 2/3 + 5 1/2 = 60 4/6 + 5 3/6 = 65 7/6 = 66 1/6.",
    wrongAnswerHints: { "1": "65 7/6 equals 66 1/6 but is not in simplest mixed form.", "2": "66 ignores the fractional part.", "3": "60 2/3 is only the amount added." },
  },
  {
    id: "math-013",
    meta: { source: "verified", topics: ["Fractions", "Multiplication"], difficulty: "medium", answerConfidence: "high" },
    text: "7/8 × 1/3 × 24/5 =",
    ...mcq("1 2/5", ["7/5", "2/5", "24/5"]),
    explanation: "Multiply and simplify: 7/8 × 1/3 × 24/5. Since 24 ÷ 8 = 3, the expression becomes 7 × 1 × 3 / 3 × 5 = 7/5 = 1 2/5.",
    wrongAnswerHints: { "1": "7/5 equals 1 2/5 as an improper fraction.", "2": "2/5 is too small.", "3": "24/5 ignores the other factors." },
  },
  {
    id: "math-014",
    meta: { source: "verified", topics: ["Fractions", "Division"], difficulty: "easy", answerConfidence: "high" },
    text: "2/3 ÷ 5/8 =",
    ...mcq("1 1/15", ["16/15", "10/24", "2/3"]),
    explanation: "Divide by multiplying by the reciprocal: 2/3 × 8/5 = 16/15 = 1 1/15.",
    wrongAnswerHints: { "1": "16/15 is correct as an improper fraction.", "2": "10/24 does not use the reciprocal correctly.", "3": "2/3 is the dividend, not the quotient." },
  },
  {
    id: "math-015",
    meta: { source: "verified", topics: ["Fractions", "Division"], difficulty: "medium", answerConfidence: "high" },
    text: "1 3/4 ÷ 5/8 =",
    ...mcq("14/5", ["2 4/5", "7/8", "35/8"]),
    explanation: "Convert 1 3/4 to 7/4. Then 7/4 ÷ 5/8 = 7/4 × 8/5 = 56/20 = 14/5.",
    wrongAnswerHints: { "1": "2 4/5 is not the quotient.", "2": "7/8 is the reciprocal, not the answer.", "3": "35/8 does not follow the division steps." },
  },
  {
    id: "math-016",
    meta: { source: "verified", topics: ["Fractions", "Measurement", "Word Problems"], difficulty: "medium", answerConfidence: "high" },
    text: "How many blocks which are 2/3 metres in length must be laid end to end to make a row 66 metres long?",
    ...mcq("99", ["44", "132", "66"]),
    explanation: "Divide the total length by the length of each block: 66 ÷ 2/3 = 66 × 3/2 = 99.",
    wrongAnswerHints: { "1": "44 multiplies instead of dividing.", "2": "132 doubles incorrectly.", "3": "66 is the total length, not the number of blocks." },
  },
  {
    id: "math-017",
    meta: { source: "verified", topics: ["Order of Operations"], difficulty: "easy", answerConfidence: "high" },
    text: "12 + 12 ÷ 6 + 4 =",
    ...mcq("18", ["16", "20", "14"]),
    explanation: "Do division first: 12 ÷ 6 = 2. Then 12 + 2 + 4 = 18.",
    wrongAnswerHints: { "1": "16 ignores order of operations.", "2": "20 adds before dividing.", "3": "14 subtracts incorrectly." },
  },
  {
    id: "math-018",
    meta: { source: "verified", topics: ["Order of Operations"], difficulty: "easy", answerConfidence: "high" },
    text: "36 ÷ 12 × 6 - 4 =",
    ...mcq("14", ["18", "12", "216"]),
    explanation: "Work left to right for division and multiplication: 36 ÷ 12 = 3, 3 × 6 = 18, and 18 - 4 = 14.",
    wrongAnswerHints: { "1": "18 forgets to subtract 4.", "2": "12 uses wrong operation order.", "3": "216 multiplies all numbers." },
  },
  {
    id: "math-019",
    meta: { source: "verified", topics: ["Order of Operations"], difficulty: "medium", answerConfidence: "high" },
    text: "(18 - 9) ÷ (20 × 6) =",
    ...mcq("3/40", ["9/120", "1/40", "3/20"]),
    explanation: "Evaluate brackets first: 18 - 9 = 9 and 20 × 6 = 120. Then 9/120 reduces to 3/40.",
    wrongAnswerHints: { "1": "9/120 does not reduce fully.", "2": "1/40 uses the wrong numerator.", "3": "3/20 doubles the numerator." },
  },
  {
    id: "math-020",
    meta: { source: "verified", topics: ["Order of Operations"], difficulty: "easy", answerConfidence: "high" },
    text: "15 + 5 ÷ 5 × 15 =",
    ...mcq("30", ["20", "75", "15"]),
    explanation: "Division and multiplication are done left to right: 5 ÷ 5 = 1, 1 × 15 = 15, then 15 + 15 = 30.",
    wrongAnswerHints: { "1": "20 adds incorrectly.", "2": "75 multiplies before dividing.", "3": "15 ignores the second term." },
  },
  {
    id: "math-021",
    meta: { source: "verified", topics: ["Exponents"], difficulty: "easy", answerConfidence: "high" },
    text: "Evaluate 10^3 × 10^4 =",
    ...mcq("10,000,000", ["1,000,000", "100,000,000", "10,000"]),
    explanation: "When multiplying powers with the same base, add the exponents: 10^3 × 10^4 = 10^7 = 10,000,000.",
    wrongAnswerHints: { "1": "1,000,000 is 10^6.", "2": "100,000,000 is 10^8.", "3": "10,000 is 10^4." },
  },
  {
    id: "math-022",
    meta: { source: "verified", topics: ["Exponents"], difficulty: "medium", answerConfidence: "high" },
    text: "Evaluate 2^2 ÷ 2^7 =",
    ...mcq("1/32", ["32", "1/5", "1/4"]),
    explanation: "When dividing powers with the same base, subtract exponents: 2^2 ÷ 2^7 = 2^-5 = 1/32.",
    wrongAnswerHints: { "1": "32 is 2^5, not the reciprocal.", "2": "1/5 subtracts exponents incorrectly.", "3": "1/4 is 2^-2." },
  },
  {
    id: "math-023",
    meta: { source: "verified", topics: ["Exponents", "Signed Numbers"], difficulty: "medium", answerConfidence: "high" },
    text: "Evaluate -(7^2)(-4)^2 =",
    ...mcq("-784", ["784", "-49", "16"]),
    explanation: "7^2 = 49 and (-4)^2 = 16. Then -(49)(16) = -784.",
    wrongAnswerHints: { "1": "784 forgets the leading negative sign.", "2": "-49 only squares 7.", "3": "16 only squares -4." },
  },
  {
    id: "math-024",
    meta: { source: "verified", topics: ["Exponents"], difficulty: "easy", answerConfidence: "high" },
    text: "Evaluate (7 - 4)^2 =",
    ...mcq("9", ["7", "3", "49"]),
    explanation: "First evaluate inside the brackets: 7 - 4 = 3. Then 3^2 = 9.",
    wrongAnswerHints: { "1": "7 forgets to subtract before squaring.", "2": "3 is the value inside brackets before squaring.", "3": "49 is 7^2, not 3^2." },
  },
  {
    id: "math-025",
    meta: { source: "verified", topics: ["Decimals", "Addition"], difficulty: "easy", answerConfidence: "high" },
    text: "0.653 + 1.09 =",
    ...mcq("1.743", ["1.733", "1.753", "0.1743"]),
    explanation: "Line up the decimal places: 0.653 + 1.090 = 1.743.",
    wrongAnswerHints: { "1": "1.733 misaligns the thousandths place.", "2": "1.753 adds incorrectly.", "3": "0.1743 misplaces the decimal." },
  },
];

const raw = await readFile(bankPath, "utf-8");
const bank = JSON.parse(raw);

const pdfIds = new Set(PDF_QUESTIONS.map((q) => q.id));
const rest = bank.questions.filter((q) => !pdfIds.has(q.id));

bank.questions = [...PDF_QUESTIONS, ...rest];

await writeFile(bankPath, JSON.stringify(bank, null, 2) + "\n");

console.log(
  JSON.stringify({
    ok: true,
    patched: PDF_QUESTIONS.length,
    totalQuestions: bank.questions.length,
  })
);
