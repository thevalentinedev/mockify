import type { QuestionBank } from "@/types/exam";

export const biologyBank: QuestionBank = {
  schoolId: "conestoga",
  subjectId: "biology",
  config: {
    questionCount: 30,
    timeLimitMinutes: 50,
  },
  questions: [
    {
      id: "bio-001",
      text: "What is the basic unit of life?",
      options: ["Atom", "Cell", "Tissue", "Organ"],
      correctIndex: 1,
    },
    {
      id: "bio-002",
      text: "Which organelle is responsible for producing energy in the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
      correctIndex: 2,
    },
    {
      id: "bio-003",
      text: "DNA stands for:",
      options: [
        "Deoxyribonucleic acid",
        "Dinitrogen acid",
        "Dynamic nucleic acid",
        "Dual nitrogen acid",
      ],
      correctIndex: 0,
    },
    {
      id: "bio-004",
      text: "Which blood type is known as the universal donor?",
      options: ["A+", "B+", "AB+", "O−"],
      correctIndex: 3,
    },
    {
      id: "bio-005",
      text: "Photosynthesis primarily occurs in which part of the plant cell?",
      options: ["Mitochondria", "Chloroplast", "Vacuole", "Cell wall"],
      correctIndex: 1,
    },
  ],
};
