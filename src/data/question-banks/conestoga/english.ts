import type { QuestionBank } from "@/types/exam";

export const englishBank: QuestionBank = {
  schoolId: "conestoga",
  subjectId: "english",
  config: {
    questionCount: 108,
    timeLimitMinutes: 110,
  },
  questions: [
    {
      id: "eng-001",
      text: "Choose the sentence with correct punctuation:",
      options: [
        "Its a beautiful day, isn't it?",
        "It's a beautiful day, isn't it?",
        "Its' a beautiful day, isn't it?",
        "It's a beautiful day isn't it?",
      ],
      correctIndex: 1,
      explanation: "The contraction 'it's' means 'it is'. A comma is needed before the tag question.",
    },
    {
      id: "eng-002",
      text: "Which word is a synonym for 'abundant'?",
      options: ["Scarce", "Plentiful", "Fragile", "Ancient"],
      correctIndex: 1,
    },
    {
      id: "eng-003",
      text: "Identify the verb in: 'The students studied diligently for the exam.'",
      options: ["students", "studied", "diligently", "exam"],
      correctIndex: 1,
    },
    {
      id: "eng-004",
      text: "Which sentence uses the correct form of 'their/there/they're'?",
      options: [
        "Their going to the library after class.",
        "There going to the library after class.",
        "They're going to the library after class.",
        "Theyre going to the library after class.",
      ],
      correctIndex: 2,
    },
    {
      id: "eng-005",
      text: "What is the main purpose of a topic sentence in a paragraph?",
      options: [
        "To provide a conclusion",
        "To introduce the main idea",
        "To list supporting evidence",
        "To ask a rhetorical question",
      ],
      correctIndex: 1,
    },
  ],
};
