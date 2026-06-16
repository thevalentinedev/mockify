/**
 * Patch biol-001..biol-005 in data/banks/conestoga/biology.json
 * using PDF-extracted content (IDs use biol- prefix to match existing bank).
 *
 * Usage: node scripts/patch-biology-pdf-questions.mjs
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bankPath = path.join(__dirname, "../data/banks/conestoga/biology.json");

const PDF_QUESTIONS = [
  {
    id: "biol-001",
    meta: {
      source: "verified",
      topics: ["Human Anatomy", "Circulatory System"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Blood flows directly from the right ventricle in the human heart to the:",
    options: ["left atrium", "left ventricle", "lungs", "right atrium"],
    explanation:
      "The right ventricle pumps deoxygenated blood to the lungs through the pulmonary arteries.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "Blood does not flow directly from the right ventricle to the left atrium.",
      "1": "The ventricles are not directly connected.",
      "3": "Blood enters the right ventricle from the right atrium, not the reverse.",
    },
  },
  {
    id: "biol-002",
    meta: {
      source: "verified",
      topics: ["Genetics", "Cell Biology"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Genes are located in (on) the:",
    options: [
      "centriole",
      "mitochondrion",
      "endoplasmic reticulum",
      "chromosomes",
    ],
    explanation: "Genes are segments of DNA located on chromosomes.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "Centrioles assist in cell division but do not contain genes.",
      "1": "Mitochondria contain some DNA but genes are primarily located on chromosomes.",
      "2": "The endoplasmic reticulum helps synthesize proteins and lipids.",
    },
  },
  {
    id: "biol-003",
    meta: {
      source: "verified",
      topics: ["Physiology", "Homeostasis"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "A constant body temperature is characteristic of:",
    options: [
      "mammals and reptiles",
      "birds and reptiles",
      "mammals only",
      "mammals and birds",
    ],
    explanation:
      "Mammals and birds are endothermic animals that regulate their body temperature internally.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "Reptiles are ectothermic and rely on environmental heat.",
      "1": "Birds maintain body temperature, reptiles do not.",
      "2": "Birds also maintain a constant body temperature.",
    },
  },
  {
    id: "biol-004",
    meta: {
      source: "verified",
      topics: ["Nervous System"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "The basic functional unit of the nervous system is the:",
    options: ["neuron", "spinal cord", "nerve", "dendrite"],
    explanation:
      "The neuron is the fundamental cell responsible for transmitting nerve impulses.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "The spinal cord is composed of many neurons.",
      "2": "A nerve is a bundle of neuron fibers.",
      "3": "A dendrite is only one part of a neuron.",
    },
  },
  {
    id: "biol-005",
    meta: {
      source: "verified",
      topics: ["Chemistry", "Homeostasis"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "The pH of blood is slightly basic. Which of the following would be most appropriate?",
    options: ["6.4", "4.6", "7.4", "13.8"],
    explanation: "Human blood normally has a pH of approximately 7.35–7.45.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "6.4 is acidic.",
      "1": "4.6 is strongly acidic.",
      "3": "13.8 is extremely basic and incompatible with life.",
    },
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
