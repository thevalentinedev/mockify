import type { QuestionBank } from "@/types/exam";

export const mathsBank: QuestionBank = {
  schoolId: "conestoga",
  subjectId: "maths",
  config: {
    questionCount: 100,
    timeLimitMinutes: 120,
  },
  questions: [
    {
      id: "math-001",
      text: "What is 15% of 200?",
      options: ["20", "25", "30", "35"],
      correctIndex: 2,
      explanation: "15% of 200 = 0.15 × 200 = 30",
    },
    {
      id: "math-002",
      text: "Solve for x: 2x + 6 = 18",
      options: ["4", "5", "6", "7"],
      correctIndex: 2,
      explanation: "2x = 12, so x = 6",
    },
    {
      id: "math-003",
      text: "What is the area of a rectangle with length 8 cm and width 5 cm?",
      options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"],
      correctIndex: 2,
    },
    {
      id: "math-004",
      text: "Simplify: 3/4 + 1/2",
      options: ["4/6", "5/4", "1 1/4", "4/4"],
      correctIndex: 2,
      explanation: "3/4 + 2/4 = 5/4 = 1 1/4",
    },
    {
      id: "math-005",
      text: "What is the value of 5² − 3²?",
      options: ["4", "16", "25", "34"],
      correctIndex: 1,
      explanation: "25 − 9 = 16",
    },
  ],
};
