/**
 * Patch chem-001..chem-015 in data/banks/conestoga/chemistry.json
 * using PDF-extracted content.
 *
 * Usage: node scripts/patch-chemistry-pdf-questions.mjs
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bankPath = path.join(__dirname, "../data/banks/conestoga/chemistry.json");

const PDF_QUESTIONS = [
  {
    id: "chem-001",
    meta: {
      source: "verified",
      topics: ["Chemical Changes"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Iron rusting is an example of what kind of change?",
    options: ["chemical", "physical", "nuclear", "biological"],
    explanation: "Rusting forms a new substance, iron oxide, so it is a chemical change.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "A physical change does not create a new substance.",
      "2": "Rusting does not involve changes in the nucleus.",
      "3": "Rusting is not a biological process.",
    },
  },
  {
    id: "chem-002",
    meta: {
      source: "verified",
      topics: ["Atomic Structure"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "A structure consisting of nucleus with electrons orbiting around it is a(n):",
    options: ["molecule", "organism", "cell", "atom"],
    explanation: "An atom has a nucleus with electrons surrounding it.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "A molecule is made of two or more atoms bonded together.",
      "1": "An organism is a living thing.",
      "2": "A cell is the basic unit of life, not a nucleus with orbiting electrons.",
    },
  },
  {
    id: "chem-003",
    meta: {
      source: "verified",
      topics: ["Chemical Bonding", "Ionic Bonds"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "A bond that is formed between two atoms of opposite charge is called:",
    options: ["impossible", "ionic", "maternal", "covalent"],
    explanation:
      "An ionic bond forms through attraction between oppositely charged ions.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "Opposite charges can attract and form bonds.",
      "2": "Maternal is unrelated to chemical bonding.",
      "3": "A covalent bond involves sharing electrons.",
    },
  },
  {
    id: "chem-004",
    meta: {
      source: "verified",
      topics: ["Ions", "Atomic Structure"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Atoms which have gained or lost electrons are:",
    options: ["molecules", "ions", "neutrons", "neutral"],
    explanation:
      "Atoms become ions when they gain or lose electrons and develop a charge.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "Molecules are groups of bonded atoms.",
      "2": "Neutrons are particles in the nucleus.",
      "3": "Neutral atoms have no net charge.",
    },
  },
  {
    id: "chem-005",
    meta: {
      source: "verified",
      topics: ["Atomic Structure", "Molecules", "Relative Size"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Arrange the following components in descending order of relative size (largest first, smallest last): 1) glucose molecule (C6H12O6), 2) electron, 3) water molecule (H2O), 4) carbon atom",
    options: ["1, 3, 4, 2", "2, 1, 3, 4", "3, 1, 2, 4", "4, 1, 3, 2"],
    explanation:
      "A glucose molecule is larger than a water molecule; a water molecule is larger than a carbon atom; an electron is smallest.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "An electron is the smallest item, not the largest.",
      "2": "Water is smaller than glucose, and an electron is smaller than an atom.",
      "3": "A carbon atom is smaller than the molecules listed.",
    },
  },
  {
    id: "chem-006",
    meta: {
      source: "verified",
      topics: ["Solutions", "Solvents and Solutes"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "When sugar is dissolved in water, the water is called the:",
    options: ["solution", "solvent", "solute", "syrup"],
    explanation:
      "The solvent is the substance that dissolves the solute. In this case, water dissolves sugar.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "The solution is the complete mixture of sugar and water.",
      "2": "The solute is the substance being dissolved, which is sugar.",
      "3": "Syrup is a concentrated sugar solution, not the role of water.",
    },
  },
  {
    id: "chem-007",
    meta: {
      source: "verified",
      topics: ["Chemical Bonding", "Covalent Bonds"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "A bond that is formed through a sharing of electrons by two atoms is:",
    options: ["impossible", "covalent", "unlikely", "ionic"],
    explanation: "A covalent bond forms when atoms share electrons.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "Atoms can form bonds by sharing electrons.",
      "2": "Sharing electrons is a common way atoms bond.",
      "3": "An ionic bond involves transfer of electrons and attraction between ions.",
    },
  },
  {
    id: "chem-008",
    meta: {
      source: "verified",
      topics: ["Acids and Bases"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Compounds releasing hydroxyl ions (OH-1) when dissolved in water are:",
    options: ["alcohols", "acids", "salts", "bases"],
    explanation: "Bases release hydroxyl ions, OH⁻, in water.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "Alcohols contain hydroxyl groups but do not necessarily release hydroxyl ions in water.",
      "1": "Acids release hydrogen ions, not hydroxyl ions.",
      "2": "Salts are ionic compounds formed from acids and bases.",
    },
  },
  {
    id: "chem-009",
    meta: {
      source: "verified",
      topics: ["Kinetic Molecular Theory", "Heat"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "When heat is applied to a liquid, the molecules of the liquid:",
    options: [
      "come closer together",
      "increase in weight",
      "are converted to heat energy",
      "move faster",
    ],
    explanation: "Heating adds energy to molecules, causing them to move faster.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "Heating usually increases molecular motion and separation.",
      "1": "Heating does not increase molecular weight.",
      "2": "The molecules gain kinetic energy; they are not converted into heat energy.",
    },
  },
  {
    id: "chem-010",
    meta: {
      source: "verified",
      topics: ["Ions", "Atomic Structure"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Which of the following is NOT true of an ion?",
    options: [
      "it has an unequal number of protons and electrons",
      "it has an electrical charge",
      "it has the same number of electrons and protons",
      "it is an atom that has gained or lost electrons",
    ],
    explanation:
      "An ion has gained or lost electrons, so it does not have the same number of electrons and protons.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "This is true of an ion.",
      "1": "This is true because ions carry a charge.",
      "3": "This is the definition of an ion.",
    },
  },
  {
    id: "chem-011",
    meta: {
      source: "verified",
      topics: ["Atomic Structure", "Atomic Number", "Neutrons"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "If the atomic weight of an element is eight, and if it contains four protons in the nucleus, what else do we know about the atom?",
    options: [
      "there are eight electrons in its shell",
      "the atomic number is eight",
      "there are four electrons in the nucleus",
      "there are four neutrons in the nucleus",
    ],
    explanation:
      "Atomic weight is approximately protons plus neutrons. If the mass is 8 and there are 4 protons, there are 4 neutrons.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "A neutral atom with four protons would have four electrons, not eight.",
      "1": "Atomic number equals the number of protons, so it would be four.",
      "2": "Electrons are not found in the nucleus.",
    },
  },
  {
    id: "chem-012",
    meta: {
      source: "verified",
      topics: ["Acids and Bases"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Many hydrogen ions will be yielded by:",
    options: ["strong acids", "weak bases", "strong bases", "weak acids"],
    explanation: "Strong acids release many hydrogen ions, H⁺, in solution.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "Bases do not yield many hydrogen ions.",
      "2": "Strong bases release hydroxide ions, not hydrogen ions.",
      "3": "Weak acids release fewer hydrogen ions than strong acids.",
    },
  },
  {
    id: "chem-013",
    meta: {
      source: "verified",
      topics: ["Atoms, Molecules, and Ions"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Indicate whether CO2 is an atom, molecule, or ion.",
    options: ["atoms", "molecules", "ions"],
    explanation:
      "CO2 contains more than one atom chemically bonded together, so it is a molecule.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "CO2 is made of multiple atoms, not a single atom.",
      "2": "CO2 is neutral here, not charged.",
    },
  },
  {
    id: "chem-014",
    meta: {
      source: "verified",
      topics: ["Atoms, Molecules, and Ions"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Indicate whether H+ is an atom, molecule, or ion.",
    options: ["atoms", "molecules", "ions"],
    explanation: "H+ has a positive charge, so it is an ion.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "A charged hydrogen particle is not neutral, so it is classified as an ion.",
      "1": "H+ is not made of multiple bonded atoms.",
    },
  },
  {
    id: "chem-015",
    meta: {
      source: "verified",
      topics: ["Atoms, Molecules, and Ions"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Indicate whether O is an atom, molecule, or ion.",
    options: ["atoms", "molecules", "ions"],
    explanation: "O represents a single oxygen atom with no charge shown.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "A molecule would contain two or more bonded atoms, such as O2.",
      "2": "An ion would show a charge, such as O2-.",
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
