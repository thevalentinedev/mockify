# Mockify

A modern pre-assessment practice app for entrance exams. Built with Next.js, shadcn/ui, and a bento-card UI.

## Getting started

```bash
npm install
cp .env.example .env   # add OPENAI_API_KEY and optional DATABASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Push local JSON banks to Neon |

## CI

GitHub Actions runs **lint**, **typecheck**, and **build** on every push/PR to `main`.

## Flow

1. **School** — Select Conestoga College (more schools can be added)
2. **Subjects** — Pick one or more: English, Mathematics, Biology, Chemistry
3. **Mode**
   - **Practice** — Same question count, no time limit
   - **Mock** — Timed like the real exam
4. **Exam** — Answer questions with navigation and review
5. **Results** — Score breakdown by subject with answer review

## Importing questions from PDF (AI)

1. Add your OpenAI key to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```
2. Go to **Import PDFs** (`/import`) or drop files into:
   ```
   uploads/conestoga/english/
   uploads/conestoga/maths/
   uploads/conestoga/biology/
   uploads/conestoga/chemistry/
   ```
3. Select school + subject, pick a PDF, click **Extract questions with AI** (uses `gpt-5.4-mini`)
4. Review the preview, set time limit / question count if needed, then **Save to question bank**

Saved banks go to `data/banks/{school}/{subject}.json` and override the placeholder questions.

## AI strategy (generate once, serve many)

All AI runs in **admin/batch** on the Import page — results are saved to JSON. Students never trigger OpenAI during exams.

| Step | What it does |
|------|----------------|
| **Extract** | Pull questions from PDF |
| **Enrich** | Infer topics from samples, verify answers, add explanations + wrong-answer tips |
| **Generate** | Create new practice questions across topics (similar style to samples) |

Recommended workflow: `Import PDF → Save → Enrich → Generate`

Students get pre-built explanations on the results page and topic-based study focus — no per-user AI cost.

Explanations and wrong-answer hints are saved on each question in the bank (Neon `question_banks.data` JSONB when `DATABASE_URL` is set, plus local JSON mirror). Enrichment only calls AI for questions that are still missing hints — already-saved questions are reused.

## Adding questions manually

Question banks can also be edited in `src/data/question-banks/{school}/{subject}.ts` (used as fallback).

Each bank file exports a `QuestionBank`:

```ts
export const englishBank: QuestionBank = {
  schoolId: "conestoga",
  subjectId: "english",
  config: {
    questionCount: 5,      // questions pulled per attempt
    timeLimitMinutes: 30,  // used in mock mode (summed across subjects)
  },
  questions: [
    {
      id: "eng-001",
      text: "Your question here?",
      options: ["A", "B", "C", "D"],
      correctIndex: 1,     // 0-based index
      explanation: "Optional explanation shown in results",
    },
  ],
};
```

Register new banks in `src/data/question-banks/index.ts`.

## Shuffling

On every attempt:

- Questions are randomly selected from the bank (up to `questionCount`)
- Question order is shuffled
- Answer options are shuffled per question

Retakes always produce a fresh order.

## Adding a new school

1. Add the school to `SCHOOLS` in `src/lib/exam-config.ts`
2. Create question bank files under `src/data/question-banks/{school-id}/`
3. Register banks in `src/data/question-banks/index.ts`

## Future: AI-generated questions

The bank structure supports adding AI-generated similar questions. Each question needs a unique `id` — append new ones to the `questions` array in the subject bank file.
