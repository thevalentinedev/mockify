# Mock Exam Prep — UI Redesign Implementation Plan

> **Companion doc:** [DESIGN-BIBLE.md](./DESIGN-BIBLE.md)  
> **Goal:** Redesign every user-facing page for easy, intuitive UX + modern SaaS polish.  
> **Strategy:** Ship in phases — exam first (highest pain), then setup, results, shell.

---

## Overview

### Pages in scope

| Route | Component | Current state | Priority |
|---|---|---|---|
| `/` | `ExamSetup` | 3-step wizard, sticky footer, compact resume banner | Done |
| `/exam` | `ExamRunner` | Focus shell, sticky header + fixed nav, scroll-to-top | Done |
| `/results` | `ExamResults` | Compact hero, sticky footer, collapsible review + expand all | Done |
| `/import` | `ImportManager` | Re-enabled at `/import` with PageShell | Done |
| All routes | `layout.tsx` | Route-aware header + PageShell variants | Done |

### Out of scope (this redesign)

- API routes, bank generation, AI enrich
- New features (command palette, auth, accounts)
- Dark mode theme overhaul (keep existing tokens)

### Success metrics (qualitative)

- [x] User can complete a 20-question exam without scrolling to find Next
- [x] Setup flow: always obvious what to do next (one primary CTA)
- [x] Results: score + next action visible within first viewport
- [x] All pages feel like one product (shared shell, spacing, components)

---

## Phase 0 — Foundation

**Goal:** Shared primitives and layout modes so later phases don't duplicate work.

**Duration estimate:** 1 session

### 0.1 Layout modes

Create route-aware shell behavior so exam/results can differ from setup.

| Task | File | Detail |
|---|---|---|
| Add `PageShell` wrapper | `src/components/page-shell.tsx` | Props: `variant: "default" \| "focus" \| "minimal"` |
| Focus variant | same | Flat background, hide footer, compact main padding |
| Default variant | same | Current gradient + footer |
| Wire exam page | `src/app/exam/page.tsx` | `variant="focus"` |
| Wire results page | `src/app/results/page.tsx` | `variant="default"` (or `minimal` footer) |

**Acceptance:** `/exam` has no decorative gradients and no site footer eating vertical space.

### 0.2 Exam CSS utilities

| Task | File | Detail |
|---|---|---|
| Add `.exam-density` | `globals.css` | Tighter card padding, option gaps |
| Add `.exam-content-pad` | `globals.css` | Bottom padding for fixed nav: `pb-[calc(4rem+env(safe-area-inset-bottom))]` |
| Add `scroll-padding-top/bottom` | `globals.css` | Match sticky header/footer heights |

### 0.3 Shared navigation components (stubs)

| Task | File | Detail |
|---|---|---|
| Create `ExamHeader` | `src/components/exam-header.tsx` | Progress, Q count, timer slot, autosave |
| Create `ExamNavBar` | `src/components/exam-nav-bar.tsx` | Prev · Flag · Review · Next |
| Create `SetupFooter` | `src/components/setup-footer.tsx` | Sticky Back / Continue bar for wizard steps |
| Create `KeyboardHints` | `src/components/keyboard-hints.tsx` | Dismissible shortcut strip |

**Acceptance:** Components render in isolation with mock props; no page wired yet.

### 0.4 Phase 0 checklist

- [x] `PageShell` with 3 variants
- [x] Exam CSS utilities in `globals.css`
- [x] `ExamHeader`, `ExamNavBar`, `SetupFooter`, `KeyboardHints` created
- [x] Design bible Section 16 updated with new files

---

## Phase 1 — Exam page redesign (P0)

**Goal:** Fix the scroll-after-Next problem. Make exam mode a true focus interface.

**Duration estimate:** 1–2 sessions  
**Depends on:** Phase 0

### Current problems (`exam-runner.tsx`)

1. Prev/Next live below scrollable content (~line 502)
2. Three metadata rows before the question (autosave, badge+timer, subject pills, progress)
3. Large card padding (`p-6 sm:p-8`) pushes content below fold
4. Keyboard shortcuts exist but are invisible
5. "Exit to home" below nav adds scroll height

### 1.1 Sticky top — `ExamHeader`

| Task | Detail |
|---|---|
| Merge metadata into one row | Mode badge (hide mobile) · progress bar · `3/20` · timer · autosave |
| Sticky positioning | `sticky top-14 z-30` (below site header) or replace site header in focus mode |
| Subject pills | Second row only if multi-subject; otherwise inline chip |
| Remove standalone autosave banner | Move into header as quiet text |

**Files:** `exam-header.tsx`, `exam-runner.tsx`

### 1.2 Fixed bottom — `ExamNavBar`

| Task | Detail |
|---|---|
| Extract nav from page bottom | Prev · Flag · Review · Next/Finish |
| Fixed bar | `fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl border-t` |
| Primary Next on right | Filled button, thumb-reachable |
| Safe area | `pb-[env(safe-area-inset-bottom)]` |
| Content padding | Main area uses `.exam-content-pad` |

**Files:** `exam-nav-bar.tsx`, `exam-runner.tsx`

### 1.3 Scroll-to-top on navigation

| Task | Detail |
|---|---|
| On `navigateToQuestion` | `window.scrollTo({ top: 0, behavior: "instant" })` |
| On subject change | Same |
| On enter/exit review | Same |
| Optional ref-based | Scroll `#exam-question` into view if using inner scroll container later |

**Files:** `exam-runner.tsx`

### 1.4 Compact exam density

| Task | Detail |
|---|---|
| Card padding | `p-4 sm:p-5` (was `p-6 sm:p-8`) |
| Option gaps | `space-y-2` (was `space-y-3`) |
| Option padding | `p-3 sm:p-4` (was `p-4 sm:p-5`) |
| Disable BentoCard hover lift | Pass `className` without hover translate in exam |
| Collapsed passage default | `QuestionContextCard` closed by default (verify) |

**Files:** `exam-runner.tsx`, `globals.css`, `bento-card.tsx` (optional `interactive={false}` prop)

### 1.5 Keyboard hints

| Task | Detail |
|---|---|
| Show hints in bottom nav or above it | `1–4 answer · N next · P prev · F flag · R review` |
| Dismissible | `localStorage` key `exam-hints-dismissed` |
| Add Enter = Next | `use-exam-keyboard.ts` when answer selected |

**Files:** `keyboard-hints.tsx`, `use-exam-keyboard.ts`, `exam-nav-bar.tsx`

### 1.6 Review mode within exam

| Task | Detail |
|---|---|
| Reuse question grid | Already exists in review branch |
| Add `ExamNavBar` variant | "Back to exam" + "Submit" instead of Prev/Next |
| Sticky submit | Submit stays in bottom bar on review screen |

**Files:** `exam-runner.tsx`, `exam-nav-bar.tsx`

### 1.7 Move Exit out of scroll flow

| Task | Detail |
|---|---|
| Exit to header | Icon button or dropdown in `ExamHeader` / site header |
| Confirm dialog | Optional: "Exit exam? Progress is saved." |

**Files:** `exam-header.tsx`, `exam-runner.tsx`, maybe `layout.tsx`

### Phase 1 acceptance criteria

- [x] Next/Previous reachable without scrolling on iPhone + 13" laptop
- [x] Changing question scrolls to top every time
- [x] Typical 4-option question visible without scroll (no long passage)
- [x] Keyboard hints visible on first exam
- [x] Autosave status in header, not a floating banner
- [x] Review screen has sticky submit in bottom bar
- [x] Exit exam confirms before leaving (progress saved locally)
- [ ] Manual test: complete 5-question quick exam, zero scroll-to-recover moments *(human QA)*

---

## Phase 2 — Setup page redesign (home `/`)

**Goal:** Wizard feels effortless — one clear action per step, sticky navigation, less visual noise.

**Duration estimate:** 1 session  
**Depends on:** Phase 0 (`SetupFooter`, `PageShell`)

### Current state (`exam-setup.tsx`)

- Works functionally: school → subjects → mode
- Hero only on step 1; step indicator on 2–3
- Back/Continue at bottom of scroll (same class of problem as exam, less severe)
- Resume banner, custom mode panels, session preview add density

### 2.1 Sticky setup footer

| Task | Detail |
|---|---|
| Use `SetupFooter` | Fixed/sticky bottom on steps 2–3 |
| Back left, Continue/Start right | Same pattern as `ExamNavBar` |
| Step 1 | Cards click-through to next step — no footer needed |

**Files:** `setup-footer.tsx`, `exam-setup.tsx`

### 2.2 Step clarity

| Task | Detail |
|---|---|
| One primary action per step | School card click OR Continue; not both competing |
| Step indicator always visible | Steps 2–3, sticky below header optional |
| Selected count | Keep badge on subjects step — good pattern |
| Session preview | Collapsible on mode step — default open if ≤3 subjects |

### 2.3 Visual polish (setup-only)

| Task | Detail |
|---|---|
| Resume banner | Compact, dismissible, matches design bible emerald pattern |
| Mode cards | Reduce badge clutter — one metadata line |
| Custom mode | Accordion per subject instead of full grid when 3+ subjects |
| Hero | Keep pill + title; tighten vertical spacing on mobile |

### 2.4 Preparing overlay (`exam-preparing.tsx`)

| Task | Detail |
|---|---|
| Full-screen focus overlay | Dim background, centered card |
| Progress + tip rotation | Keep; polish spacing |
| Block interaction | Already modal-like — ensure z-index above everything |

**Files:** `exam-preparing.tsx`, `exam-setup.tsx`

### Phase 2 acceptance criteria

- [x] Steps 2–3: Back/Continue always visible without scroll
- [x] Step 1: tap school → lands on subjects (unchanged behavior, cleaner layout)
- [x] Mode step: Start Exam is the only filled primary button
- [x] Preparing state feels intentional, not a layout jump
- [x] Resume exam banner doesn't push hero below fold on mobile

---

## Phase 3 — Results page redesign (`/results`)

**Goal:** Score + next action in first viewport. Review is useful but shouldn't bury the CTA.

**Duration estimate:** 1 session  
**Depends on:** Phase 0

### Current state (`exam-results.tsx`)

- Score hero at top — good
- Focus topics card — good
- Time stats, subject breakdown, full answer review — long scroll
- Retake/Home buttons at very bottom

### 3.1 Results hero (above the fold)

| Task | Detail |
|---|---|
| Score ring + headline | Keep; tighten to ~40vh max on mobile |
| Primary CTA immediately | "Practice weak topics" OR "Retake" right under score |
| Secondary stats | Subject breakdown as compact horizontal chips, not full card |

### 3.2 Sticky results actions

| Task | Detail |
|---|---|
| Bottom bar or sticky top actions | Retake · Home — same `SetupFooter` pattern |
| Weak topics CTA | Primary when focus topics exist |

### 3.3 Answer review — progressive disclosure

| Task | Detail |
|---|---|
| Collapsed by default | Show Q1–Qn list with ✓/✗ only |
| Expand per question | Tap to reveal options + explanation |
| Expand all / Collapse | Bulk toggle for full review pass |
| Subject filter | Keep `SubjectPills` — sticky below hero |
| Remove wall of text | Default view ≠ full review dump |

**Files:** `exam-results.tsx`, new optional `result-question-row.tsx`

### 3.4 Time stats

| Task | Detail |
|---|---|
| Collapse into "Details" accordion | Not a full card above the fold |
| Show slowest Q + average only | Full badge list on expand |

### Phase 3 acceptance criteria

- [x] Score + primary next action visible without scroll (mobile)
- [x] Retake reachable via sticky footer
- [x] Answer review collapsed by default; expand works per question
- [x] Expand all / Collapse all in review section
- [x] Multi-subject: switch subject without losing scroll position badly

---

## Phase 4 — App shell & cross-cutting polish

**Goal:** One cohesive product feel across all routes.

**Duration estimate:** 1 session  
**Depends on:** Phases 1–3

### 4.1 Header behavior

| Route | Header |
|---|---|
| `/` setup | Logo + app name (current) |
| `/exam` | Logo + question progress OR minimal logo-only |
| `/results` | Logo + "Results" label |
| `/import` | Admin label if re-enabled |

**Files:** `layout.tsx` or route-specific layouts (`src/app/exam/layout.tsx`)

### 4.2 Route layouts (recommended)

```
src/app/layout.tsx          → root font, providers
src/app/page.tsx            → PageShell default (setup)
src/app/exam/layout.tsx     → focus mode, no footer
src/app/results/layout.tsx  → minimal footer
src/app/import/layout.tsx   → default shell for admin
```

### 4.3 BentoCard variants

| Variant | Use |
|---|---|
| `interactive` (default) | Setup selection — hover lift |
| `static` | Exam question container — no hover |
| `compact` | Smaller padding |

**Files:** `bento-card.tsx`

### 4.4 Motion & feedback

| Task | Detail |
|---|---|
| Answer select | Subtle border/background transition (already exists) |
| Step transitions | Optional fade on setup step change |
| Reduced motion | Respect `prefers-reduced-motion` |

### 4.5 Mobile QA pass

Test on *(manual — verify in browser)*:
- [ ] iPhone SE width (375px)
- [ ] iPhone 14 Pro
- [ ] iPad
- [ ] 1280px laptop
- [ ] 200% browser zoom (accessibility)

### Phase 4 acceptance criteria

- [x] Exam route uses `exam/layout.tsx` with focus shell
- [x] No footer on exam page
- [x] Header adapts per route
- [x] BentoCard static mode used in exam
- [x] Full flow smoke test: setup → exam → results → retake

---

## Phase 5 — Advanced UX (post-launch polish)

**Goal:** Power-user features and long-exam affordances.

**Duration estimate:** 1–2 sessions  
**Depends on:** Phase 1 complete

### 5.1 Question navigator (20+ questions)

| Task | Detail |
|---|---|
| Desktop | Sticky right rail or collapsible drawer |
| Mobile | "Questions" button → bottom sheet grid |
| Tile states | Current · answered · flagged · empty |
| Jump + scroll top | Reuse review grid styles |

**Files:** `exam-question-nav.tsx`, `exam-runner.tsx`

### 5.2 Import admin UI (optional)

| Task | Detail |
|---|---|
| Re-enable `/import` route | Wire `ImportManager` |
| Apply same PageShell + tokens | Functional density OK |
| Not user-facing | Low priority |

### 5.3 Future (document only)

- Command palette (⌘K): jump to question, flag, review
- Swipe gestures on mobile for prev/next
- Exam fullscreen mode
- Haptic feedback on answer select (mobile PWA)

### Phase 5 acceptance criteria

- [x] Question navigator rail on desktop for 20+ question exams
- [x] Mobile questions sheet from bottom nav grid button
- [x] Tile states: current, answered, flagged, empty
- [x] `/import` route wired with `ImportManager` + PageShell

---

## Implementation order (recommended)

```
Phase 0  ──►  Phase 1  ──►  Phase 2  ──►  Phase 3  ──►  Phase 4  ──►  Phase 5
Foundation    Exam ★        Setup         Results       Shell         Advanced
              (do first)
```

**Minimum lovable redesign:** Phase 0 + Phase 1 + Phase 4.1 (exam layout only).

**Full redesign:** All phases through Phase 4.

---

## File change matrix

| File | Ph0 | Ph1 | Ph2 | Ph3 | Ph4 | Ph5 |
|---|---|---|---|---|---|---|
| `globals.css` | ✓ | ✓ | | | ✓ | |
| `layout.tsx` | | | | | ✓ | |
| `site-header.tsx` | | | | | ✓ | |
| `app/exam/layout.tsx` | ✓ | ✓ | | | ✓ | |
| `app/results/layout.tsx` | | | | | ✓ | |
| `app/import/layout.tsx` | | | | | | ✓ |
| `app/exam/page.tsx` | ✓ | ✓ | | | | |
| `app/page.tsx` | | | | | ✓ | |
| `app/import/page.tsx` | | | | | | ✓ |
| `app/results/page.tsx` | ✓ | | | ✓ | | |
| `page-shell.tsx` | ✓ | | | | ✓ | |
| `exam-header.tsx` | ✓ | ✓ | | | | |
| `exam-nav-bar.tsx` | ✓ | ✓ | | | | ✓ |
| `exam-question-nav.tsx` | | | | | | ✓ |
| `keyboard-hints.tsx` | ✓ | ✓ | | | | |
| `setup-footer.tsx` | ✓ | | ✓ | ✓ | | |
| `results-footer.tsx` | | | | ✓ | | |
| `result-question-row.tsx` | | | | ✓ | | |
| `exam-runner.tsx` | | ✓ | | | | ✓ |
| `exam-setup.tsx` | | | ✓ | | | |
| `exam-preparing.tsx` | | | ✓ | | | |
| `exam-results.tsx` | | | | ✓ | | |
| `bento-card.tsx` | | ✓ | | | ✓ | |
| `use-exam-keyboard.ts` | | ✓ | | | | |
| `question-context-card.tsx` | | ✓ | | | | |

---

## Testing plan (per phase)

### Automated

```bash
npm run typecheck
npm run lint
npm run smoke-test   # if exam flow covered
```

### Manual scripts

**Exam (Phase 1)**
1. Start quick exam, 2 subjects
2. Answer Q1, tap Next — question visible without scrolling up
3. Tap through 5 questions on mobile — thumb reaches Next
4. Press `N`, `P`, `1`–`4` — all work
5. Flag a question, open Review, submit subject
6. Refresh mid-exam — resume works, header shows autosave

**Setup (Phase 2)**
1. Fresh visit — select school, subjects, mode, start
2. Back button on each step
3. Resume banner → continue exam

**Results (Phase 3)**
1. Complete exam — score visible, Retake one tap away
2. Expand wrong answer — explanation shows
3. Practice weak topics → lands on setup with topics noted

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Fixed nav covers content | `.exam-content-pad` + test on small screens |
| Sticky header + site header = too much chrome | Exam layout hides/minimizes site header |
| Keyboard hints clutter mobile | Dismissible + hide after first exam |
| Results accordion hurts "review all" use case | "Expand all" / "Collapse" in review section ✓ |
| Scope creep into import/admin | Phase 5 only; keep user flow priority |

---

## Tracking

Update this doc as phases complete. Check boxes in phase acceptance criteria and link PRs if applicable.

| Phase | Status | Completed |
|---|---|---|
| Phase 0 — Foundation | Complete | 2026-06-15 |
| Phase 1 — Exam | Complete | 2026-06-15 |
| Phase 2 — Setup | Complete | 2026-06-15 |
| Phase 3 — Results | Complete | 2026-06-15 |
| Phase 4 — Shell | Complete | 2026-06-15 |
| Phase 5 — Advanced | Complete | 2026-06-15 |

**Version:** 1.1 · Implementation plan for UI redesign (all phases complete)
