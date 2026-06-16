/**
 * Patch engl-001..engl-029 in data/banks/conestoga/english.json
 * using PDF-extracted content with shared contexts (contextId).
 *
 * Usage: node scripts/patch-english-pdf-questions.mjs
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { mergePatchQuestion } from "./lib/merge-patch-question.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bankPath = path.join(__dirname, "../data/banks/conestoga/english.json");

const PDF_CONTEXTS = {
  "pdf-uncle-sal": {
    id: "pdf-uncle-sal",
    type: "passage",
    title: "Uncle Sal's Stories",
    content:
      "Light from the candles bounced off the dark windows and made strange shadows on the walls. After hearing Uncle Sal's stories, we all sat nervously, listening for creaking footsteps and squeaking doors. Leo was the first to speak. \"You don't really believe all those stories about the old Potter place, do you, Uncle Sal?\" \"I don't know,\" Uncle Sal said slowly, \"no one has seen Mr. Potter in town for the last five years. Some say he hasn't set foot out of the house.\"",
  },
  "pdf-energy-water": {
    id: "pdf-energy-water",
    type: "comprehension",
    title: "Ontario Home Energy Use",
    content:
      "How energy is used in Ontario homes: For an annual energy bill of $2,000, water heating is 20–21%, or $400–$420.",
  },
  "pdf-energy-cooling": {
    id: "pdf-energy-cooling",
    type: "comprehension",
    title: "Ontario Home Energy Use",
    content:
      "How energy is used in Ontario homes: For an annual energy bill of $2,000, cooling is 0–7%, or $0–$200.",
  },
  "pdf-energy-factors": {
    id: "pdf-energy-factors",
    type: "comprehension",
    title: "Factors Affecting Energy Bills",
    content:
      "Many factors can affect your annual energy bill, such as size and location of your home, yearly variations in weather, efficiency of your furnace and other appliances, thermostat settings, number of occupants, and the local cost of energy.",
  },
  "pdf-blue-box": {
    id: "pdf-blue-box",
    type: "comprehension",
    title: "Blue Box Recycling",
    content:
      "The Region gives out free Blue Boxes from listed locations. If your box is broken, bring it with you to have it recycled.",
  },
  "pdf-blue-box-hours": {
    id: "pdf-blue-box-hours",
    type: "comprehension",
    title: "Blue Box Pickup Hours",
    content:
      "Cambridge Works Yard is open Monday to Friday, 7:00 a.m. – 3:30 p.m. Other listed locations generally open at 8:30 a.m.",
  },
  "pdf-poem-important": {
    id: "pdf-poem-important",
    type: "passage",
    title: "What's Important",
    content:
      "In the poem 'What's Important,' the speaker says, 'What's More Important? It's got to be the lessons. The knowledge we have gained.'",
  },
  "pdf-poem-wealth": {
    id: "pdf-poem-wealth",
    type: "passage",
    title: "What's Important",
    content:
      "The poem says of wealth: 'You know it's often said, 'tis the root of all that's evil.'",
  },
  "pdf-ed-shoe-store": {
    id: "pdf-ed-shoe-store",
    type: "passage",
    title: "Sentence Combining",
    content: "Ed went to the shoe store. It is at the mall.",
  },
};

const PDF_QUESTIONS = [
  {
    id: "engl-001",
    contextId: "pdf-uncle-sal",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "What time of day is it in the story?",
    options: ["Morning", "Noon", "Afternoon", "Evening"],
    explanation:
      "The story mentions candles, dark windows, and shadows, which indicate it is evening.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "Morning does not match the dark setting and candlelight.",
      "1": "Noon would usually be bright, not dark.",
      "2": "Afternoon is not strongly supported by the details.",
    },
  },
  {
    id: "engl-002",
    contextId: "pdf-uncle-sal",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "What kind of stories did Uncle Sal tell?",
    options: ["Peaceful", "Scary", "Sad", "Funny"],
    explanation:
      "The listeners are nervous, and the story mentions strange shadows, creaking footsteps, and squeaking doors.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "Peaceful does not fit the nervous mood.",
      "2": "Sad is not the main feeling created by the passage.",
      "3": "Funny is not supported by the details.",
    },
  },
  {
    id: "engl-003",
    contextId: "pdf-energy-water",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension", "Financial Literacy"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "If an annual energy bill was $1,500, approximately how much of it was for heating water?",
    options: ["$500", "$100", "$300", "$200"],
    explanation:
      "Water heating is about 20–21% of the annual bill. About 20% of $1,500 is $300.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "$500 is too high for about 20% of $1,500.",
      "1": "$100 is too low.",
      "3": "$200 is lower than the estimated water heating cost.",
    },
  },
  {
    id: "engl-004",
    contextId: "pdf-energy-cooling",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension", "Financial Literacy"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Presently your annual electric bill is $2,000. If you install an air conditioner, approximately how much more could your annual electric bill be?",
    options: ["$150 - $200", "$250 - $300", "$350 - $400", "$450 - $500"],
    explanation:
      "The chart shows cooling can cost up to about $200 on a $2,000 annual bill.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "$250 - $300 is higher than the chart's cooling estimate.",
      "2": "$350 - $400 is much higher than expected.",
      "3": "$450 - $500 is an exaggerated estimate.",
    },
  },
  {
    id: "engl-005",
    contextId: "pdf-energy-factors",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "What factor would be least likely to affect your annual electric bill?",
    options: [
      "Square footage of house",
      "Seasonal changes",
      "Age of furnace and appliances",
      "The North American costs of energy",
    ],
    explanation:
      "The passage mentions local cost of energy, not the broader North American cost of energy.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "House size is listed as a factor.",
      "1": "Yearly or seasonal weather changes are listed as a factor.",
      "2": "Efficiency or age of appliances can affect energy use.",
    },
  },
  {
    id: "engl-006",
    contextId: "pdf-blue-box",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension", "Functional Reading"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "If your blue box has been run over by the garbage truck, to receive a new one you should:",
    options: [
      "Collect the pieces and take them to the nearest Operation Centre/Works Yard",
      "Go to the nearest Operation Centre/Works Yard to order a new blue box",
      "Phone (519) 883-5100 to request that a new one be sent to you",
      "Take your damaged box to any of the Operation Centres/Works Yards on the weekend to pick up a new one",
    ],
    explanation:
      "The notice says that if the box is broken, you should bring it with you to have it recycled.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "The notice says to bring the broken box, not just order one.",
      "2": "The phone number is for transfer station hours, not delivery.",
      "3": "The listed locations are open weekdays, not weekends.",
    },
  },
  {
    id: "engl-007",
    contextId: "pdf-blue-box-hours",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension", "Functional Reading"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "You work from 8:00 a.m. – 5:00 p.m. every Monday – Friday. Where is the only location you can pick up a new blue box?",
    options: ["Kitchener", "Waterloo", "Cambridge", "North Dumfries Township"],
    explanation:
      "Cambridge opens at 7:00 a.m., so it is the only listed option available before an 8:00 a.m. workday.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "Kitchener opens at 8:30 a.m., after work begins.",
      "1": "Waterloo opens at 8:30 a.m., after work begins.",
      "3": "North Dumfries opens at 8:30 a.m., after work begins.",
    },
  },
  {
    id: "engl-008",
    contextId: "pdf-poem-important",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension", "Poetry"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "According to the poet, which of the following is most important?",
    options: ["Wealth", "Love", "Health", "Knowledge"],
    explanation:
      "The poet emphasizes lessons and knowledge as more important than wealth, love, or health.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "The poet questions the value of wealth.",
      "1": "Love is mentioned, but it is not the answer in the choices supported by the poem.",
      "2": "Health is important, but the poet emphasizes knowledge.",
    },
  },
  {
    id: "engl-009",
    contextId: "pdf-poem-wealth",
    meta: {
      source: "verified",
      topics: ["Reading Comprehension", "Vocabulary"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "\"'Tis the root of all that's evil\" refers to",
    options: ["Fear", "Pain", "Wealth", "Bleeding hearts"],
    explanation: "The phrase appears in the section discussing wealth.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "Fear is mentioned later, but not as the root of evil.",
      "1": "Pain is mentioned as part of struggle, not the root of evil.",
      "3": "Bleeding hearts is part of a phrase, not the main reference.",
    },
  },
  {
    id: "engl-010",
    meta: {
      source: "verified",
      topics: ["Capitalization"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Choose the sentence with the correct capitalization: He is a student in ____.",
    options: ["high school", "High school", "High School", "high School"],
    explanation:
      "The phrase 'high school' is not a proper noun here, so it should not be capitalized.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "High should not be capitalized here.",
      "2": "Neither word should be capitalized.",
      "3": "School should not be capitalized here.",
    },
  },
  {
    id: "engl-011",
    meta: {
      source: "verified",
      topics: ["Capitalization"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Choose the sentence with the correct capitalization: I'm taking ____.",
    options: [
      "geography, mathematics, law and french",
      "Geography, Mathematics, Law and French",
      "geography, Mathematics, law and French",
      "geography, mathematics, law and French",
    ],
    explanation:
      "School subjects are lowercase unless they are proper nouns or languages. French is capitalized because it is a language.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "French should be capitalized.",
      "1": "The general subjects should not all be capitalized.",
      "2": "Mathematics should not be capitalized here.",
    },
  },
  {
    id: "engl-012",
    meta: {
      source: "verified",
      topics: ["Punctuation"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Choose the sentence with the correct punctuation: My brother carried the boxes into the ____ unpacked them.",
    options: ["house I", "house; I", "house, I", "house: I"],
    explanation:
      "A semicolon correctly joins two closely related independent clauses.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "This creates a run-on sentence.",
      "2": "A comma alone creates a comma splice.",
      "3": "A colon is not the best punctuation here.",
    },
  },
  {
    id: "engl-013",
    meta: {
      source: "verified",
      topics: ["Punctuation"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Choose the sentence with the correct punctuation.",
    options: [
      "Although, it was raining on Saturday we decided to go to the park.",
      "Although it was raining on Saturday we decided to go to the park.",
      "Although it was raining, on Saturday, we decided to go to the park.",
      "Although it was raining on Saturday, we decided to go to the park.",
    ],
    explanation: "A comma is needed after the introductory dependent clause.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "There should not be a comma immediately after Although.",
      "1": "A comma is needed after the introductory clause.",
      "2": "The commas around 'on Saturday' are unnecessary.",
    },
  },
  {
    id: "engl-014",
    meta: {
      source: "verified",
      topics: ["Punctuation", "Quotation Marks"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Choose the sentence with the correct punctuation.",
    options: [
      "Maria asked, \"Would you like me to take care of the problem?\"",
      "Maria asked \"Would you like me to take care of the problem?\"",
      "Maria asked, \"Would you like me to take care of the problem\"?",
      "Maria asked \"if she should take care of the problem.\"",
    ],
    explanation:
      "A comma should introduce a direct quotation, and the question mark belongs inside the quotation marks.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "A comma is needed before the direct quotation.",
      "2": "The question mark should be inside the quotation marks.",
      "3": "This is not punctuated as a direct quotation.",
    },
  },
  {
    id: "engl-015",
    meta: {
      source: "verified",
      topics: ["Punctuation", "Possessives"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Choose the sentence with the correct punctuation.",
    options: [
      "The childrens toys filled the room.",
      "The childrens' toys filled the room.",
      "The children's toys filled the room.",
      "The children's toy's filled the room.",
    ],
    explanation: "Children is already plural, so the possessive form is children's.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "The possessive apostrophe is missing.",
      "1": "Childrens is not the correct plural form.",
      "3": "Toy's is incorrectly made possessive.",
    },
  },
  {
    id: "engl-016",
    meta: {
      source: "verified",
      topics: ["Grammar", "Subject-Verb Agreement"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Decide which word or group of words belongs in the blank: The wind ____ through the trees.",
    options: ["rustles", "are rustling", "do rustle", "rustle"],
    explanation: "The singular subject 'wind' takes the singular verb 'rustles.'",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "Are rustling does not agree with the singular subject.",
      "2": "Do rustle does not agree with the singular subject.",
      "3": "Rustle does not agree with the singular subject.",
    },
  },
  {
    id: "engl-017",
    meta: {
      source: "verified",
      topics: ["Grammar", "Pronouns"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Decide which word or group of words belongs in the blank: The car belongs to ____.",
    options: ["he and I", "him and I", "he and me", "him and me"],
    explanation: "After the preposition 'to,' object pronouns are needed: him and me.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "He and I are subject pronouns, not object pronouns.",
      "1": "I should be me after a preposition.",
      "2": "He should be him after a preposition.",
    },
  },
  {
    id: "engl-018",
    meta: {
      source: "verified",
      topics: ["Grammar", "Verb Tense"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Choose the correct sentence.",
    options: [
      "I found an excellent job after I graduated from college.",
      "I find an excellent job after I graduated from college.",
      "I have found an excellent job after I am graduating from college.",
      "I will have found an excellent job after I am graduated from college.",
    ],
    explanation:
      "The past-tense verbs 'found' and 'graduated' correctly match the completed actions.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "Find is present tense and does not match graduated.",
      "2": "Am graduating does not fit with have found in this sentence.",
      "3": "Am graduated is awkward and incorrect here.",
    },
  },
  {
    id: "engl-019",
    meta: {
      source: "verified",
      topics: ["Grammar", "Comparatives and Superlatives"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Decide which word or group of words belongs in the blank: That movie was one of the ____.",
    options: [
      "excitingest that I have ever seen",
      "excitinger that I have ever seen",
      "most exciting that I have ever seen",
      "most excitable that I have ever seen",
    ],
    explanation:
      "For longer adjectives like exciting, the correct superlative form is 'most exciting.'",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "Excitingest is not standard English.",
      "1": "Excitinger is not standard English.",
      "3": "Excitable means easily excited, not exciting to watch.",
    },
  },
  {
    id: "engl-020",
    meta: {
      source: "verified",
      topics: ["Sentence Correctness", "Parallel Structure"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "For each question, decide which sentence is written clearly and correctly.",
    options: [
      "She read the paragraph, explained it, and sat down.",
      "June felt surprised, worried and anger.",
      "Watching a play is more interesting than to watch a movie.",
      "The room is warm, comfortable, and has good lights.",
    ],
    explanation:
      "The correct sentence uses clear, parallel verbs: read, explained, and sat.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "Anger is a noun and does not match surprised and worried.",
      "2": "The comparison is not parallel.",
      "3": "The list is not parallel.",
    },
  },
  {
    id: "engl-021",
    meta: {
      source: "verified",
      topics: ["Sentence Correctness", "Fragments"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "For each question, decide which sentence is written clearly and correctly.",
    options: [
      "Since they were late for the meeting.",
      "Waiting for the bus, I ate my lunch.",
      "The player who is the best.",
      "One of the children in the playground.",
    ],
    explanation:
      "Only the second option is a complete sentence with a clear subject and verb.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "This is a sentence fragment.",
      "2": "This is a sentence fragment.",
      "3": "This is a sentence fragment.",
    },
  },
  {
    id: "engl-022",
    meta: {
      source: "verified",
      topics: ["Sentence Correctness", "Run-on Sentences"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "For each question, decide which sentence is written clearly and correctly.",
    options: [
      "He thought he had the best seat, he was in the front row.",
      "The class was cancelled the students were pleased.",
      "Her car broke down, so she was late for the appointment.",
      "We laughed then we cried.",
    ],
    explanation:
      "The correct sentence joins the two ideas with a comma and the conjunction 'so.'",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "This is a comma splice.",
      "1": "This is a run-on sentence.",
      "3": "This needs clearer punctuation or a conjunction.",
    },
  },
  {
    id: "engl-023",
    meta: {
      source: "verified",
      topics: ["Sentence Correctness"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "For each question, decide which sentence is written clearly and correctly.",
    options: [
      "The class was full, so more chairs were needed.",
      "People were rushing around, yet little was being accomplished.",
      "Although the problem had been identified, we chose to ignore it.",
      "Since we had finished the report early, we had time for a break.",
    ],
    explanation:
      "The answer key identifies this as the correct option. It is a complete and clear sentence with a dependent clause followed by an independent clause.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "This sentence is grammatical, but it is not the answer selected by the provided key.",
      "1": "This sentence is grammatical, but it is not the answer selected by the provided key.",
      "2": "This sentence is grammatical, but it is not the answer selected by the provided key.",
    },
  },
  {
    id: "engl-024",
    meta: {
      source: "verified",
      topics: ["Sentence Correctness", "Parallel Structure"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "For each question, decide which sentence is written clearly and correctly.",
    options: [
      "I wondered whether you were coming and if you had forgotten about the meeting.",
      "The employees were happy to receive a raise in pay, an increase in vacation time and medical benefits were improved.",
      "Good students should be organized, independent, and stay positive.",
      "Robert lost his keys, and he looked under the desk, between the filing cabinets, and his backpack was searched.",
    ],
    explanation: "The first option is the clearest and most grammatically correct sentence.",
    correctIndex: 0,
    wrongAnswerHints: {
      "1": "The sentence has faulty parallel structure.",
      "2": "The list is not fully parallel.",
      "3": "The structure shifts awkwardly at the end.",
    },
  },
  {
    id: "engl-025",
    contextId: "pdf-ed-shoe-store",
    meta: {
      source: "verified",
      topics: ["Sentence Combining"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Choose the answer that best combines these sentences without changing their meaning.",
    options: [
      "Ed went at the mall to the shoe store.",
      "Ed's shoe store is at the mall.",
      "Ed went to the shoe store at the mall.",
      "To the shoe store at the mall went Ed.",
    ],
    explanation:
      "This option combines both ideas clearly: Ed went to the shoe store, and the shoe store is at the mall.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "The word order is awkward.",
      "1": "This changes the meaning by suggesting Ed owns the store.",
      "3": "The word order is awkward and unnatural.",
    },
  },
  {
    id: "engl-026",
    meta: {
      source: "verified",
      topics: ["Sentence Effectiveness", "Conciseness"],
      difficulty: "easy",
      answerConfidence: "high",
    },
    text: "Choose the most effective sentence.",
    options: [
      "You will receive a complimentary free gift at no charge.",
      "Paul walked into the adjacent building next door.",
      "Karen mailed the package today.",
      "Joseph himself was there live and in person.",
    ],
    explanation: "The correct sentence is concise and avoids unnecessary repetition.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "Complimentary, free, and at no charge are repetitive.",
      "1": "Adjacent and next door are repetitive.",
      "3": "Himself, live, and in person are repetitive.",
    },
  },
  {
    id: "engl-027",
    meta: {
      source: "verified",
      topics: ["Sentence Effectiveness", "Dangling Modifiers"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Choose the most effective sentence.",
    options: [
      "Flying over the house, Nancy heard a helicopter.",
      "Full of energy, the house was cleaned in an hour.",
      "I called to ask you to wait for me on the telephone.",
      "My brother George just started high school.",
    ],
    explanation:
      "The correct sentence is clear and does not contain a misplaced or dangling modifier.",
    correctIndex: 3,
    wrongAnswerHints: {
      "0": "This sounds as if Nancy was flying over the house.",
      "1": "This sounds as if the house was full of energy.",
      "2": "On the telephone is misplaced and could be misunderstood.",
    },
  },
  {
    id: "engl-028",
    meta: {
      source: "verified",
      topics: ["Sentence Effectiveness"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Choose the most effective sentence.",
    options: [
      "The dog was hungry and wanted more.",
      "He always enjoyed music, so he became a music teacher.",
      "Hiding under the desk, the instructor found his pen.",
      "My employer offered me a raise which pleased me.",
    ],
    explanation:
      "The correct sentence clearly connects the idea of enjoying music with becoming a music teacher.",
    correctIndex: 1,
    wrongAnswerHints: {
      "0": "The sentence is understandable but vague.",
      "2": "This sounds as if the instructor was hiding under the desk.",
      "3": "The wording is less clear because 'which pleased me' is loosely attached.",
    },
  },
  {
    id: "engl-029",
    meta: {
      source: "verified",
      topics: ["Sentence Effectiveness", "Logic"],
      difficulty: "medium",
      answerConfidence: "high",
    },
    text: "Choose the most effective sentence.",
    options: [
      "Even though the organizers did an outstanding job in planning the event, many people attended.",
      "Unless you are certain, you should give the incorrect answer.",
      "Because I finished the report on time, I treated myself to an ice cream cone.",
      "Since reading that book, my confidence has grown.",
    ],
    explanation: "The sentence has a logical cause-and-effect relationship.",
    correctIndex: 2,
    wrongAnswerHints: {
      "0": "Even though creates an illogical contrast.",
      "1": "The advice is illogical.",
      "3": "This has a dangling modifier; it sounds as if confidence read the book.",
    },
  },
];

const raw = await readFile(bankPath, "utf-8");
const bank = JSON.parse(raw);

bank.contexts = { ...bank.contexts, ...PDF_CONTEXTS };

const pdfIds = new Set(PDF_QUESTIONS.map((q) => q.id));
const existingById = new Map(bank.questions.map((q) => [q.id, q]));
const patched = PDF_QUESTIONS.map((patch) =>
  mergePatchQuestion(existingById.get(patch.id), patch)
);
const rest = bank.questions.filter((q) => !pdfIds.has(q.id));

bank.questions = [...patched, ...rest];

await writeFile(bankPath, JSON.stringify(bank, null, 2) + "\n");

console.log(
  JSON.stringify({
    ok: true,
    patched: PDF_QUESTIONS.length,
    contextsAdded: Object.keys(PDF_CONTEXTS).length,
    totalQuestions: bank.questions.length,
  })
);
