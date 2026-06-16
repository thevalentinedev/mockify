/**
 * Patch math-026..math-050 in data/banks/conestoga/maths.json
 *
 * Usage: node scripts/patch-maths-pdf-questions-26-50.mjs
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
    id: "math-026",
    meta: { source: "verified", topics: ["Decimals", "Multiplication"], difficulty: "easy", answerConfidence: "high" },
    text: "45.75 × 1.20 =",
    ...mcq("54.90", ["54.09", "55.90", "45.90"]),
    explanation: "45.75 × 1.20 = 54.90.",
    wrongAnswerHints: { "1": "54.09 misplaces the decimal.", "2": "55.90 multiplies incorrectly.", "3": "45.90 is too small." },
  },
  {
    id: "math-027",
    meta: { source: "verified", topics: ["Decimals", "Division"], difficulty: "easy", answerConfidence: "high" },
    text: "15.75 ÷ 0.25 =",
    ...mcq("63", ["62", "64", "3.9375"]),
    explanation: "Dividing by 0.25 is the same as multiplying by 4. So 15.75 × 4 = 63.",
    wrongAnswerHints: { "1": "62 is one less than the correct quotient.", "2": "64 is one more than the correct quotient.", "3": "3.9375 divides by 4 instead of multiplying." },
  },
  {
    id: "math-028",
    meta: { source: "verified", topics: ["Decimals", "Place Value"], difficulty: "easy", answerConfidence: "high" },
    text: "Write as a decimal: one thousand twenty-two and eighty-three hundredths.",
    ...mcq("1022.83", ["1022.083", "102.283", "10228.3"]),
    explanation: "One thousand twenty-two is 1022, and eighty-three hundredths is 0.83.",
    wrongAnswerHints: { "1": "1022.083 treats eighty-three as thousandths.", "2": "102.283 misplaces the thousands.", "3": "10228.3 shifts the decimal too far." },
  },
  {
    id: "math-029",
    meta: { source: "verified", topics: ["Metric Conversions"], difficulty: "easy", answerConfidence: "high" },
    text: "456 mm to m =",
    ...mcq("0.456 m", ["4.56 m", "0.0456 m", "456 m"]),
    explanation: "There are 1000 millimetres in 1 metre, so 456 mm = 456 ÷ 1000 = 0.456 m.",
    wrongAnswerHints: { "1": "4.56 m divides by 100 instead of 1000.", "2": "0.0456 m divides by 10,000.", "3": "456 m does not convert units." },
  },
  {
    id: "math-030",
    meta: { source: "verified", topics: ["Metric Conversions", "Area"], difficulty: "medium", answerConfidence: "high" },
    text: "1500 m² to km² =",
    ...mcq("0.0015 km²", ["0.015 km²", "0.00015 km²", "1.5 km²"]),
    explanation: "1 km² = 1,000,000 m². So 1500 m² = 1500 ÷ 1,000,000 = 0.0015 km².",
    wrongAnswerHints: { "1": "0.015 km² divides by 100,000.", "2": "0.00015 km² divides by 10,000,000.", "3": "1.5 km² is far too large." },
  },
  {
    id: "math-031",
    meta: { source: "verified", topics: ["Metric Conversions", "Area"], difficulty: "hard", answerConfidence: "medium" },
    text: "36 km² to mm² =",
    ...mcq("3.6 × 10^13 mm²", ["3.6 × 10^12 mm²", "36 × 10^6 mm²", "3.6 × 10^10 mm²"]),
    explanation: "1 km = 1,000,000 mm, so 1 km² = 10¹² mm². Therefore, 36 km² = 36 × 10¹² = 3.6 × 10¹³ mm².",
    wrongAnswerHints: { "1": "10^12 mm² is one km², not 36.", "2": "36 × 10^6 mm² uses linear conversion, not area.", "3": "10^10 is too small for this area conversion." },
  },
  {
    id: "math-032",
    meta: { source: "verified", topics: ["Metric Conversions", "Volume"], difficulty: "hard", answerConfidence: "high" },
    text: "125 mm³ to m³ =",
    ...mcq("1.25 × 10^-7 m³", ["1.25 × 10^-4 m³", "0.125 m³", "1.25 × 10^-9 m³"]),
    explanation: "1 m = 1000 mm, so 1 mm = 0.001 m. Cubing gives 1 mm³ = 10^-9 m³. Therefore, 125 mm³ = 1.25 × 10^-7 m³.",
    wrongAnswerHints: { "1": "10^-4 uses a linear factor instead of cubing.", "2": "0.125 m³ does not account for cubic conversion.", "3": "10^-9 is the factor for 1 mm³, not 125 mm³." },
  },
  {
    id: "math-033",
    meta: { source: "verified", topics: ["Fractions", "Decimals", "Percents"], difficulty: "easy", answerConfidence: "high" },
    text: "Write 2/3 as a percent.",
    ...mcq("66 2/3%", ["66%", "67%", "0.67%"]),
    explanation: "2/3 = 0.666..., which is 66 2/3%.",
    wrongAnswerHints: { "1": "66% rounds down incorrectly.", "2": "67% rounds up incorrectly.", "3": "0.67% forgets to multiply by 100." },
  },
  {
    id: "math-034",
    meta: { source: "verified", topics: ["Fractions", "Decimals", "Percents"], difficulty: "easy", answerConfidence: "high" },
    text: "Write 12 1/2% as a decimal.",
    ...mcq("0.125", ["0.0125", "1.25", "0.25"]),
    explanation: "12 1/2% = 12.5%. Divide by 100 to get 0.125.",
    wrongAnswerHints: { "1": "0.0125 divides by 1000 instead of 100.", "2": "1.25 forgets to divide by 100.", "3": "0.25 is 25%, not 12.5%." },
  },
  {
    id: "math-035",
    meta: { source: "verified", topics: ["Fractions", "Decimals", "Percents"], difficulty: "easy", answerConfidence: "high" },
    text: "Write 0.125 as a fraction.",
    ...mcq("1/8", ["1/4", "1/5", "125/100"]),
    explanation: "0.125 = 125/1000, which reduces to 1/8.",
    wrongAnswerHints: { "1": "1/4 equals 0.25.", "2": "1/5 equals 0.2.", "3": "125/100 is not in lowest terms." },
  },
  {
    id: "math-036",
    meta: { source: "verified", topics: ["Fractions", "Decimals", "Percents"], difficulty: "easy", answerConfidence: "high" },
    text: "42.5 is what percent of 170?",
    ...mcq("25%", ["20%", "30%", "42.5%"]),
    explanation: "42.5 ÷ 170 = 0.25, and 0.25 as a percent is 25%.",
    wrongAnswerHints: { "1": "20% is too low.", "2": "30% is too high.", "3": "42.5% does not divide correctly." },
  },
  {
    id: "math-037",
    meta: { source: "verified", topics: ["Signed Numbers"], difficulty: "easy", answerConfidence: "high" },
    text: "-12 + 20 - (-12) =",
    ...mcq("20", ["8", "32", "-4"]),
    explanation: "-12 + 20 = 8. Subtracting -12 is the same as adding 12, so 8 + 12 = 20.",
    wrongAnswerHints: { "1": "8 forgets to add 12 after subtracting -12.", "2": "32 adds incorrectly.", "3": "-4 subtracts instead of adding." },
  },
  {
    id: "math-038",
    meta: { source: "verified", topics: ["Signed Numbers", "Order of Operations"], difficulty: "medium", answerConfidence: "high" },
    text: "(-6)(2) ÷ (-12)(6) =",
    ...mcq("6", ["-6", "1", "72"]),
    explanation: "Work left to right for multiplication and division: (-6)(2) = -12, -12 ÷ -12 = 1, and 1 × 6 = 6.",
    wrongAnswerHints: { "1": "-6 ignores the final multiplication by 6.", "2": "1 stops after the division step.", "3": "72 multiplies all numbers without dividing." },
  },
  {
    id: "math-039",
    meta: { source: "verified", topics: ["Signed Numbers"], difficulty: "medium", answerConfidence: "high" },
    text: "-(-1) + (1) ÷ [-(-1)] =",
    ...mcq("2", ["0", "1", "-2"]),
    explanation: "-(-1) = 1, and [-(-1)] = 1. Then 1 + 1 ÷ 1 = 2.",
    wrongAnswerHints: { "1": "0 subtracts instead of adding.", "2": "1 forgets the addition after division.", "3": "-2 uses wrong signs." },
  },
  {
    id: "math-040",
    meta: { source: "verified", topics: ["Signed Numbers", "Comparing Numbers"], difficulty: "easy", answerConfidence: "high" },
    text: "Which of the following would represent the lower temperature? 45°, -24°, 51°, -17°, 0°",
    options: ["45°", "-24°", "51°", "-17°", "0°"],
    correctIndex: 1,
    explanation: "The lowest temperature is the smallest number. Among the choices, -24° is lowest.",
    wrongAnswerHints: { "0": "45° is positive and much warmer.", "2": "51° is the highest temperature.", "3": "-17° is cold but not the lowest.", "4": "0° is warmer than negative temperatures." },
  },
  {
    id: "math-041",
    meta: { source: "verified", topics: ["Scientific Notation"], difficulty: "easy", answerConfidence: "high" },
    text: "Express 4.95 × 10^-3 in ordinary notation.",
    ...mcq("0.00495", ["0.0495", "0.000495", "4950"]),
    explanation: "10^-3 means move the decimal 3 places left: 4.95 becomes 0.00495.",
    wrongAnswerHints: { "1": "0.0495 moves the decimal only 2 places.", "2": "0.000495 moves the decimal 4 places.", "3": "4950 moves the decimal the wrong direction." },
  },
  {
    id: "math-042",
    meta: { source: "verified", topics: ["Scientific Notation"], difficulty: "easy", answerConfidence: "high" },
    text: "Express 1.75 × 10^4 in ordinary notation.",
    ...mcq("17500", ["1750", "175000", "0.175"]),
    explanation: "10^4 means move the decimal 4 places right: 1.75 becomes 17500.",
    wrongAnswerHints: { "1": "1750 moves the decimal only 3 places.", "2": "175000 moves the decimal 5 places.", "3": "0.175 moves the decimal left." },
  },
  {
    id: "math-043",
    meta: { source: "verified", topics: ["Scientific Notation"], difficulty: "medium", answerConfidence: "high" },
    text: "Express 0.000875 in scientific notation.",
    ...mcq("8.75 × 10^-4", ["8.75 × 10^4", "87.5 × 10^-5", "0.875 × 10^-3"]),
    explanation: "Move the decimal 4 places right to get 8.75, so the exponent is -4.",
    wrongAnswerHints: { "1": "A positive exponent gives a large number.", "2": "87.5 × 10^-5 is equivalent but not standard form.", "3": "0.875 × 10^-3 uses the wrong coefficient." },
  },
  {
    id: "math-044",
    meta: { source: "verified", topics: ["Scientific Notation"], difficulty: "easy", answerConfidence: "high" },
    text: "Express 9250000 in scientific notation.",
    ...mcq("9.25 × 10^6", ["9.25 × 10^5", "92.5 × 10^5", "0.925 × 10^7"]),
    explanation: "Move the decimal 6 places left to get 9.25, so the exponent is 6.",
    wrongAnswerHints: { "1": "10^5 moves the decimal only 5 places.", "2": "92.5 × 10^5 is not standard scientific notation.", "3": "0.925 × 10^7 is equivalent but not standard form." },
  },
  {
    id: "math-045",
    meta: { source: "verified", topics: ["Exponents", "Algebraic Simplification"], difficulty: "medium", answerConfidence: "high" },
    text: "Simplify 2A^2(2A)^2.",
    ...mcq("8A^4", ["4A^4", "16A^4", "8A^2"]),
    explanation: "(2A)^2 = 4A^2. Then 2A^2 × 4A^2 = 8A^4.",
    wrongAnswerHints: { "1": "4A^4 forgets the leading coefficient 2.", "2": "16A^4 squares incorrectly.", "3": "8A^2 does not add exponents." },
  },
  {
    id: "math-046",
    meta: { source: "verified", topics: ["Exponents", "Algebraic Simplification"], difficulty: "medium", answerConfidence: "high" },
    text: "Simplify (4B^3)^2.",
    ...mcq("16B^6", ["8B^6", "16B^5", "4B^6"]),
    explanation: "Square both the coefficient and the variable power: 4^2 = 16 and (B^3)^2 = B^6.",
    wrongAnswerHints: { "1": "8B^6 doubles instead of squaring the coefficient.", "2": "16B^5 adds exponents incorrectly.", "3": "4B^6 forgets to square the coefficient." },
  },
  {
    id: "math-047",
    meta: { source: "verified", topics: ["Exponents", "Algebraic Simplification"], difficulty: "medium", answerConfidence: "high" },
    text: "Simplify 12C^2 ÷ (CD^0).",
    ...mcq("12C", ["12C^2", "12CD", "12"]),
    explanation: "D^0 = 1, so the denominator is C. Then 12C^2 ÷ C = 12C.",
    wrongAnswerHints: { "1": "12C^2 does not divide by C.", "2": "12CD keeps D in the denominator incorrectly.", "3": "12 divides out both C terms." },
  },
  {
    id: "math-048",
    meta: { source: "verified", topics: ["Exponents", "Algebraic Simplification"], difficulty: "medium", answerConfidence: "high" },
    text: "Simplify 5E^5 ÷ (5E)^4.",
    ...mcq("E/125", ["E/25", "5E", "E^5/625"]),
    explanation: "(5E)^4 = 625E^4. Then 5E^5 ÷ 625E^4 = E/125.",
    wrongAnswerHints: { "1": "E/25 uses the wrong power of 5.", "2": "5E does not simplify the division.", "3": "E^5/625 does not cancel correctly." },
  },
  {
    id: "math-049",
    meta: { source: "verified", topics: ["Algebraic Simplification", "Fractions"], difficulty: "hard", answerConfidence: "medium" },
    text: "Simplify (5AB/C^2) ÷ (A^3C/B).",
    ...mcq("5B^2/(A^2C^3)", ["5B/(A^2C^2)", "5AB^2/(A^3C^3)", "5B^2/(AC^3)"]),
    explanation: "Divide by multiplying by the reciprocal: (5AB/C^2) × (B/A^3C) = 5B^2/(A^2C^3).",
    wrongAnswerHints: { "1": "5B/(A^2C^2) loses a factor of B.", "2": "5AB^2/(A^3C^3) does not cancel A correctly.", "3": "5B^2/(AC^3) has the wrong power of A." },
  },
  {
    id: "math-050",
    meta: { source: "verified", topics: ["Algebraic Simplification", "Signed Numbers"], difficulty: "medium", answerConfidence: "high" },
    text: "2[7 - (-4 + 2) - 1] =",
    ...mcq("16", ["14", "18", "8"]),
    explanation: "First simplify inside the parentheses: -4 + 2 = -2. Then 7 - (-2) - 1 = 8. Finally, 2 × 8 = 16.",
    wrongAnswerHints: { "1": "14 forgets to double the inner result.", "2": "18 adds instead of subtracting inside brackets.", "3": "8 is the value inside brackets before multiplying by 2." },
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
