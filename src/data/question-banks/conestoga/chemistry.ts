import type { QuestionBank } from "@/types/exam";

export const chemistryBank: QuestionBank = {
  schoolId: "conestoga",
  subjectId: "chemistry",
  config: {
    questionCount: 31,
    timeLimitMinutes: 60,
  },
  questions: [
    {
      id: "chem-001",
      text: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctIndex: 2,
      explanation: "Au comes from the Latin word 'aurum'.",
    },
    {
      id: "chem-002",
      text: "How many protons does a carbon atom have?",
      options: ["4", "6", "8", "12"],
      correctIndex: 1,
    },
    {
      id: "chem-003",
      text: "What is the pH of a neutral solution at 25°C?",
      options: ["0", "7", "10", "14"],
      correctIndex: 1,
    },
    {
      id: "chem-004",
      text: "Which state of matter has a definite volume but no definite shape?",
      options: ["Solid", "Liquid", "Gas", "Plasma"],
      correctIndex: 1,
    },
    {
      id: "chem-005",
      text: "What type of bond involves the sharing of electron pairs?",
      options: ["Ionic", "Covalent", "Metallic", "Hydrogen"],
      correctIndex: 1,
    },
  ],
};
