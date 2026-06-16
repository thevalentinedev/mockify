# Mock Exam Prep — Design Bible

> **North star:** Easy, intuitive UX first — then modern SaaS polish. Users should never hunt for the next action, scroll to recover context, or wonder if their work saved.

This document is the single source of truth for visual and interaction design in Mock Exam Prep (Mockify). When in doubt, choose the option that feels quieter, clearer, and more consistent.

**The bar (Duolingo product standard):** Useful · Intuitive · Delightful · Polished — in that order. Polish comes *after* the flow is proven.

---

## 1. What we're building toward

### The feeling

Users should think: *"That's clean. That's easy. I know what to do next."*

That reaction comes from:

| Layer | What it means here |
|---|---|
| **Easy UX** | Primary actions always reachable. No scroll-to-recover after every tap. Zero manual required |
| **Visual design** | Calm surfaces, soft depth, limited palette — chrome recedes, content leads |
| **Interaction design** | Instant feedback, keyboard paths, autosave, scroll-to-top on step change |
| **Information architecture** | Setup → Exam → Results. One job per screen. Strip chrome in focus mode |

### What "intuitive" actually means

Intuitive is not "minimal." It means:

1. **Predictable** — Back/Next always in the same place. Submit only when it makes sense.
2. **Recoverable** — Autosave, resume banner, no data loss anxiety.
3. **Efficient** — Power users fly with keyboard; mouse users never chase buttons.
4. **Self-explanatory** — If it needs a tooltip to understand, redesign it (Duolingo: *show, don't tell*).

Small friction kills love for a product. Scrolling up after every "Next" is exactly that kind of small thing.

### Reference aesthetic (Modern SaaS)

Think Linear, Notion, Vercel dashboard, or a well-designed CRM:

- **Floating panels** on a soft background — cards feel layered, not boxed in
- **Rounded geometry** — large radius on containers (`rounded-2xl`), smaller on controls (`rounded-lg`)
- **Semantic color** — color carries meaning (status, subject, urgency), not decoration
- **Whitespace as structure** — spacing defines groups; borders are secondary
- **Muted chrome, loud content** — UI recedes; questions and data come forward
- **Micro-hierarchy** — labels small and uppercase; numbers and titles carry weight

---

## 2. Design principles

### 1. Restraint wins

Remove before you add. One accent per view. One primary button. No competing focal points.

### 2. Consistency is craft

Same radius, same shadow, same spacing scale everywhere. Deviations should be intentional and documented here.

### 3. Progressive disclosure

Show only what's needed for the current step. Advanced options (custom mode, import) stay nested — never on the hero.

### 4. Calm by default, urgent when needed

Setup and results can be warm and inviting. **Exam mode is focus mode** — minimal header, no distractions, typography optimized for reading.

### 5. Feedback closes the loop

Every action gets a visible response: hover, selected state, loading, success, error. Silence feels broken.

### 6. Accessible by default

Contrast, focus rings, keyboard nav, and readable type sizes are non-negotiable — not a polish pass.

### 7. Content over chrome (Linear)

In focus modes, navigation and metadata should **recede**. The question and answers are the only things that matter. Borders, badges, and decorative gradients compete with the task.

### 8. Actions stay reachable (Material / thumb-zone)

If the user must act repeatedly (Next, Previous, Flag), those controls must stay in a **fixed or sticky zone** — not at the bottom of a scrolling page.

---

## 2b. What modern products teach us

Research-backed patterns from companies that nail "effortless."

### Linear — speed, calm, invisible craft

| Pattern | Lesson for us |
|---|---|
| **Keyboard-first** | Every exam action has a shortcut; shortcuts are discoverable, not hidden |
| **Command palette (⌘K)** | Future: jump to question, flag, review without hunting UI |
| **Contextual menus teach shortcuts** | Show `N` next to Next, `1–4` next to options — learn by doing |
| **Invisible details** | Scroll-to-top on question change, safe hover zones — users *feel* it, don't see it |
| **Calm interface refresh** | Sidebar/chrome dimmer; content area brighter. Exam mode = maximum calm |
| **Reduced visual noise** | Fewer borders, softer separators, clearer hierarchy |

> *"Not every element should carry equal visual weight. Parts central to the user's task stay in focus; orientation recedes."* — Linear design refresh

### Duolingo — useful, intuitive, delightful, polished

| Principle | Application |
|---|---|
| **No manual needed** | Setup wizard is self-explanatory; exam needs zero instructions |
| **One action per step** | Answer → Next. Don't show Submit until review/final step |
| **Instant feedback** | Selected answer state, progress bar, autosave indicator |
| **Number keys for choices** | Already implemented (`1`–`4`) — surface this in UI |
| **Enter to continue** | Consider: Enter = Next when an answer is selected |
| **Functional delight** | Subtle check on select, progress tick — not confetti overload |
| **Gradual complexity** | Quick mode first; custom/import for power users |

### Superhuman / Raycast — power without punishment

- Keyboard paths for everything, but mouse path is equally smooth
- Shortcuts shown inline where actions live
- No mode where keyboard works but mouse user is punished (or vice versa)

### Exam platforms (Quiz Navigator, professional testing UX)

| Pattern | When to use |
|---|---|
| **Sticky question navigator** | 20+ questions — grid or sidebar always visible |
| **Question status colors** | Not visited · Answered · Flagged — at a glance in review |
| **Section-based navigation** | Multi-subject exams — subject pills + per-section progress |
| **Mark for review** | Flag (`F`) — already implemented; make status visible in nav grid |
| **Compact sidebar layout** | Long exams on desktop; bottom bar on mobile |

### Mobile / thumb-zone rules (Material, Apple HIG)

- Primary actions live in the **bottom third** of the screen
- Touch targets ≥ **44px** height; **48px** preferred on mobile
- **Floating bottom bar** — rounded, blurred, `backdrop-blur-xl`, soft shadow
- Bar may hide on scroll-down when reading a long passage; **reappear on scroll-up or when answer selected**
- Icon + short label — never icon-only for Prev/Next

### Sticky UI rules (Smart Interface Design Patterns)

Use sticky/fixed chrome **only when the job is to act, save, or navigate** — which describes exam mode exactly.

When adding sticky elements:

- Set `scroll-padding-top` / `scroll-padding-bottom` so content isn't hidden behind bars
- Keep sticky zones **compact** — exam bottom bar ≤ 64px
- Ensure keyboard focus isn't trapped behind fixed layers
- Test at 200% browser zoom

---

## 2c. Known UX gaps (exam flow)

**Status:** Resolved in Phases 1–5. Kept for historical context.

| Problem | Why it hurt | Fix shipped |
|---|---|---|
| **Next at page bottom** | Scroll-to-recover after Next | Fixed `ExamNavBar` + scroll-to-top on question change |
| **Too much vertical chrome** | Question pushed below fold | Compact `ExamHeader`, exam density utilities |
| **Generous option padding** | Tall option column | `.exam-density` + tighter padding |
| **Keyboard shortcuts invisible** | Users didn't discover shortcuts | Dismissible `KeyboardHints` bar |
| **Submit visible too early** | Users thought they were done | Submit only on last Q or review screen |
| **Autosave message easy to miss** | Progress anxiety | Quiet indicator in exam header |

**Priority order (done):** sticky bottom nav + scroll-to-top → compact density → shortcut hints → question grid navigator (20+ Q).

## 3. Stack & implementation

| Tool | Role |
|---|---|
| **Tailwind CSS v4** | Utility layout, spacing, responsive behavior |
| **shadcn/ui + Radix** | Accessible primitives (Button, Input, Radio, etc.) |
| **Design tokens** | CSS variables in `src/app/globals.css` |
| **Plus Jakarta Sans** | Primary typeface (`layout.tsx`) |
| **Lucide React** | Icon set — thin stroke, consistent sizing |
| **CVA** | Component variants (`buttonVariants`, etc.) |

**Rule:** Extend tokens and existing components before inventing new patterns.

---

## 4. Design tokens

All colors use **OKLCH** for perceptual consistency. Defined in `:root` and `.dark` in `globals.css`.

### Core semantic colors

| Token | Usage |
|---|---|
| `--background` | Page canvas |
| `--foreground` | Primary text |
| `--card` | Elevated surfaces (cards, panels) |
| `--muted` / `--muted-foreground` | Secondary surfaces and helper text |
| `--primary` / `--primary-foreground` | Primary actions, brand accent |
| `--border` | Dividers, input outlines |
| `--destructive` | Errors, discard actions |
| `--ring` | Focus rings |

### Radius scale

Base: `--radius: 0.625rem` (10px)

| Token | Use for |
|---|---|
| `radius-sm` / `radius-md` | Chips, small buttons |
| `radius-lg` | Buttons, inputs, standard cards |
| `radius-xl` / `radius-2xl` | Bento cards, feature panels |
| `rounded-full` | Pills, step dots, avatars |

### Shadows

| Utility | Use for |
|---|---|
| `shadow-sm` | Default card elevation |
| `soft-shadow` | Featured panels (custom utility in `globals.css`) |
| `hover:shadow-md` | Interactive cards on hover |

Shadows should be **soft and low-contrast** — never harsh drop shadows.

---

## 5. Typography

### Font

**Plus Jakarta Sans** — geometric, friendly, readable at small sizes. Weights: 400 (body), 500 (labels), 600 (headings), 700 (hero).

### Scale

| Element | Classes | Notes |
|---|---|---|
| Hero title | `text-3xl sm:text-4xl font-bold tracking-tight` | Home only |
| Section title | `text-lg font-semibold` | "Select your school" |
| Card title | `font-semibold text-lg` or `text-base font-medium` | Inside BentoCard |
| Body | default / `text-sm` | Descriptions, metadata |
| Label | `text-sm font-medium` or `.exam-label` | Form labels, section tags |
| Stat number | `text-2xl font-bold` | Session preview counts |
| Muted helper | `text-xs text-muted-foreground` | Footnotes, bank stats |

### Exam-specific type (reading-first)

Defined in `globals.css` — use these during the exam, not generic body styles:

| Class | Purpose |
|---|---|
| `.exam-question` | Question stem — larger, medium weight, relaxed leading |
| `.exam-option` | Answer choices — comfortable line height |
| `.exam-passage` | Reading passages — slightly smaller, high leading |
| `.exam-label` | "Question 3 of 20" — small caps, muted |

### Rules

- Headings use `tracking-tight` and `text-wrap: balance`
- Body uses `leading-relaxed`
- Never more than **3 distinct sizes** on one screen
- Muted text for everything that isn't the main task

---

## 6. Spacing & layout

### Spacing scale (Tailwind)

Use the **4px base grid**: `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `10` (40px), `16` (64px).

| Context | Spacing |
|---|---|
| Between major sections | `space-y-8` |
| Inside a section | `space-y-4` |
| Inside a card | `space-y-3` or `p-5` |
| Inline icon + text | `gap-2` |
| Page horizontal padding | `px-4 sm:px-6` |
| Page vertical padding | `py-10 sm:py-16` |

### Layout widths

| Container | Max width |
|---|---|
| Setup / home | `max-w-4xl` |
| Site header/footer | `max-w-5xl` |
| Exam question area | `max-w-3xl` (focus) |

### Background treatment

Layered, subtle — never flat gray:

```tsx
// layout.tsx pattern — keep this
<div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5" />
<div className="fixed inset-0 -z-10 bg-[radial-gradient(...)] from-primary/8 via-transparent to-transparent" />
```

---

## 7. Color usage

### The 90/10 rule

~90% neutrals (background, card, muted, border). ~10% accent (primary, semantic status colors).

### Semantic accents (allowed beyond neutrals)

| Meaning | Color approach |
|---|---|
| Success / resume | `emerald-500/5` bg, `emerald-500/20` border |
| Warning / weak topics | `amber-700` / `amber-400` (dark) |
| Subject identity | Subject gradient on BentoCard (`from-*-500/10`) |
| Selected state | `border-primary ring-2 ring-primary/20` |
| Destructive | `destructive` token only |

### Do not

- Use random Tailwind colors for decoration
- Put gradients on buttons
- Use more than one strong accent color per viewport
- Rely on color alone — pair with icon, label, or weight

---

## 8. Components

### BentoCard — primary selection surface

Our signature interactive card. Used for schools, subjects, modes, previews.

**Anatomy:**
- `rounded-2xl border bg-card/80 p-5`
- `backdrop-blur-sm shadow-sm`
- Hover: `hover:shadow-md hover:-translate-y-0.5` (subtle lift)
- Selected: `border-primary ring-2 ring-primary/20 shadow-md`
- Optional gradient wash: `bg-gradient-to-br from-primary/5 to-transparent`

**When to use:** Any tappable choice with title + description + optional metadata.

**When not to use:** Dense data tables, inline form fields, exam answer rows (use RadioGroup).

### Button hierarchy

| Variant | When |
|---|---|
| `default` | Primary action — one per screen ("Start Exam", "Continue") |
| `outline` | Secondary toggle / alternate choice |
| `ghost` | Back, cancel, tertiary actions |
| `destructive` | Discard, delete — always confirm or use icon-only with aria-label |

Sizes: `sm` for inline toggles, `default` for nav, `lg` for final CTA on setup.

### Badge

Metadata only — counts, mode tags, availability. Never use as a primary button.

Variants: `secondary` (default info), `outline` (neutral count), avoid loud colors.

### StepIndicator

Linear-style progress for multi-step setup. Completed = filled primary + check. Current = primary/10 ring. Future = muted.

Keep to **3–4 steps max**. Labels hidden on mobile (`hidden sm:block`).

### Header (app chrome)

- Sticky, blurred: `bg-background/70 backdrop-blur-xl`
- Thin border: `border-b border-border/50`
- Height: `h-14` — compact, not tall
- Logo mark in `rounded-lg bg-primary` square

### Cards vs BentoCards

| Component | Use |
|---|---|
| `BentoCard` | Interactive selection, feature blocks |
| `Card` (shadcn) | Static content, results breakdown, import forms |

### ExamNavBar — fixed bottom navigation *(planned)*

The most important exam UX component. Keeps Prev/Next reachable without scrolling.

**Anatomy:**
- Fixed to viewport bottom, full width, max-width aligned with content (`max-w-3xl`)
- `bg-background/80 backdrop-blur-xl border-t border-border/50`
- Height `h-14` (56px) + safe-area inset
- Primary action (Next) always on the right, filled `default` variant

**Behavior:**
- Never unmounts during exam — only hidden on review/submit screens (review has its own nav)
- Disabled states clear (Prev on Q1, Next never disabled unless submitting)
- Optional: subtle slide-up entrance on first question

**Do not:** Put exam navigation inline at the bottom of scrollable content.

### ExamHeader — sticky top chrome *(planned)*

Single compact row replacing three separate metadata rows.

**Contains:** thin progress bar · question count · timer (if timed) · autosave status · mode badge (optional, hide on mobile)

**Height budget:** ≤ 48px content + 2px progress = 50px total.

---

## 9. Motion & interaction

### Timing

| Interaction | Duration | Easing |
|---|---|---|
| Hover lift / shadow | `300ms` | default |
| Button press | instant | `active:translate-y-px` |
| Page transitions | 150–200ms | ease-out |
| Loading states | spinner or skeleton | no layout shift |

### Hover

- Cards lift slightly (`-translate-y-0.5`) — never scale
- Buttons darken/lighten — no bounce
- Links underline on hover only (`variant="link"`)

### Focus

Always visible: `focus-visible:ring-3 focus-visible:ring-ring/50`. Never remove focus styles.

### Exam keyboard

Exam runner supports keyboard shortcuts via `useExamKeyboard`. **Shortcuts must be visible in the UI** — hidden power features don't count as UX wins.

Planned: `Enter` advances when an answer is selected (Duolingo pattern).

---

## 10. Screen modes

### Setup mode (home, school, subjects, mode)

- Warm, inviting, bento grid layout
- Hero on home: pill badge + title + one-line description
- Clear step progress when past home
- Session preview stats in muted inner cards (`rounded-xl bg-background/60`)

### Exam mode (focus)

Exam mode is a **task interface**, not a marketing page. Optimize for: read question → select answer → next question, repeated 20–80 times without fatigue.

#### Layout architecture (target)

```
┌─────────────────────────────────────────────┐
│ STICKY TOP BAR (compact, ~48px)             │
│ progress · Q 3/20 · timer · autosaved ✓     │
├─────────────────────────────────────────────┤
│                                             │
│  SCROLLABLE CONTENT AREA                    │
│  (question + options + optional passage)    │
│                                             │
│  padding-bottom = height of bottom bar      │
├─────────────────────────────────────────────┤
│ FIXED BOTTOM NAV (floating bar, ~56px)      │
│  ← Prev    Flag    Review    Next →         │
└─────────────────────────────────────────────┘
```

**Rules:**
- Top bar: sticky, blurred, single row — merge badge/timer/count/autosave
- Bottom nav: `fixed bottom-0 inset-x-0` with safe-area padding — always reachable
- Content: `pb-[calc(4rem+env(safe-area-inset-bottom))]` so last option isn't hidden
- On question change: `scrollTo({ top: 0, behavior: 'instant' })` — user always starts at the question stem

#### Viewport-fit strategy

Goal: **typical question + 4 options visible without scrolling** on a 13" laptop and iPhone 14.

| Technique | Implementation |
|---|---|
| Compact header | One row, not three separate flex rows |
| Tighter card padding | `p-4 sm:p-5` in exam (not `p-6 sm:p-8`) |
| Tighter option gaps | `space-y-2` between options |
| Collapsible passage | Context/passage collapsed by default; expand in place |
| Exam density typography | Slightly smaller `.exam-question` if needed — never below 16px body |
| Remove exit link from flow | Move "Exit" to header overflow/menu — not below Next button |

If content still overflows (long passage, math-heavy stem): scroll **content area only**, not the whole page including nav.

#### Floating bottom nav bar (spec)

Primary pattern for exam navigation. Reference: Arc browser floating tab bar, Apple Music mini-player, Material bottom bar.

```tsx
// Target anatomy
<nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/50 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
  <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
    {/* Prev · Flag · Review · Next */}
  </div>
</nav>
```

| Control | Placement | Variant |
|---|---|---|
| Previous | Left | `outline`, disabled on Q1 |
| Flag | Center-left | `ghost` / `secondary` when active |
| Review | Center-right | `ghost` |
| Next / Finish | Right | `default` — primary, always obvious |

Optional: on desktop, also show `← →` keyboard hints as muted text inside buttons.

#### Scroll behavior

| Event | Behavior |
|---|---|
| Question index changes | Scroll to top instantly |
| Subject changes | Scroll to top + brief transition |
| Enter review mode | Scroll to top |
| Return from review | Scroll to top |
| User expands passage | Don't scroll — expand in place |

Use `scroll-padding-top` if sticky header overlaps anchor targets.

#### Keyboard shortcuts (surface these)

Already implemented in `useExamKeyboard`. **Must be visible** in exam UI:

| Key | Action |
|---|---|
| `1`–`4` | Select answer A–D |
| `N` or `→` | Next question |
| `P` or `←` | Previous question |
| `F` | Toggle flag |
| `R` | Review screen |
| `Enter` | *(planned)* Next when answer selected |

Show as a single muted line above or within the bottom nav — dismissible after first exam.

#### Autosave UX

Don't use Save buttons. Pattern from form UX best practices:

- Persistent quiet indicator: `Saved · 2:34 PM` in sticky header
- On resume: one-line banner, then dismiss — don't permanently eat vertical space
- Never block navigation while saving (localStorage is sync — no spinner needed)

#### Question navigator (20+ questions)

For longer exams, add a compact grid or sidebar (Quiz Navigator pattern):

- Desktop: sticky right rail or collapsible drawer with Q1–Q20 tiles
- Mobile: "Questions" button in bottom nav opens bottom sheet grid
- Tile states: empty · answered · flagged · current
- Tap tile = jump + scroll to top

Review screen already has a grid — reuse those styles for in-exam navigator.

#### Multi-subject exams

- Subject pills stay in sticky header (compact)
- Switching subject = new section, scroll to top, reset progress bar scope
- Completed subjects show checkmark on pill

#### What to strip in exam mode

- Decorative page gradients (flat `background`)
- Footer from root layout (or hide on `/exam`)
- Large hero spacing (`py-12` → `py-4`)
- BentoCard hover lift — static surface during exam
- "Exit to home" as a full-width ghost button below nav

### Results mode

- Celebrate briefly (score, pass/fail) then teach (breakdown, weak topics)
- Use Card for structured data
- One clear next action: "Practice weak topics" or "New exam"

### Import / admin

- Functional, denser layout OK — still use tokens and spacing scale
- Tables and forms follow shadcn defaults

---

## 11. Iconography

- **Library:** Lucide only
- **Stroke:** default thin stroke — matches modern SaaS
- **Sizes:** `size-4` inline, `size-5` in icon containers, `size-3` inside badges
- **Containers:** `size-8` or `size-10` rounded squares with `bg-primary/10` or `bg-background/80`

Icons clarify, never decorate. If removing an icon doesn't hurt comprehension, remove it.

---

## 12. Content & voice

### UI copy

- Short sentences. No exclamation marks.
- Buttons = verbs: "Start Quick Exam", "Continue", "Resume"
- Errors = what happened + what to do: "Connection issue. Try again."
- Empty states = one line of context + one action

### Labels

- Title case for headings
- Sentence case for descriptions
- Uppercase small-caps only for `.exam-label` style metadata

---

## 13. Patterns to steal from Modern SaaS

From Linear, Duolingo, Arc, and CRM-style UIs:

| Pattern | Mock Exam Prep application |
|---|---|
| **Keyboard-first + visible hints** | `1–4` / `N` / `P` shown in bottom nav |
| **Floating bottom bar** | Fixed Prev/Next/Flag/Review — never scroll to act |
| **Scroll-to-top on step change** | Every question jump starts at the stem |
| **Autosave, no Save button** | Header indicator; resume banner on return |
| **Submit only when ready** | Finish on last Q; full Submit on review screen |
| **Kanban columns** | Step indicator + subject pills during exam |
| **Question status grid** | Review grid → in-exam navigator for long tests |
| **Status dots / tile colors** | Answered · flagged · current in Q grid |
| **Pill badges for metrics** | "20 q · scaled time", selected count |
| **Card hover elevation** | BentoCard lift on setup — disabled in exam |
| **Semantic color borders** | Selected answer ring, flag amber, resume emerald |
| **Inner stat tiles** | Session preview 3-column grid |
| **Calm chrome** | Linear-style: metadata dims, question brightens |
| **Invisible details** | Safe scroll padding, instant scroll reset, no jank |

---

## 14. Checklist before shipping UI

### Every screen
- [ ] One primary CTA per screen
- [ ] All spacing from the 4px scale — no arbitrary values like `p-[13px]`
- [ ] Colors from tokens or documented semantic accents
- [ ] `text-muted-foreground` for secondary text
- [ ] Interactive elements have hover + focus + disabled states
- [ ] Dark mode: tested, borders use `/10` or `/15` opacity where needed
- [ ] Loading states don't shift layout
- [ ] No new one-off components if existing ones cover it

### Setup flow
- [ ] Mobile: tap targets ≥ 44px, step labels collapse gracefully
- [ ] Back/Continue always in same footer position

### Exam flow (critical)
- [ ] **Prev/Next reachable without scrolling** (fixed bottom nav)
- [ ] **Scroll to top on every question change**
- [ ] Content has bottom padding so options aren't hidden behind nav bar
- [ ] Keyboard shortcuts visible somewhere in exam UI
- [ ] Autosave status in header — no Save button
- [ ] Submit/Finish only appears when action is valid
- [ ] Exam screens use `.exam-*` typography classes
- [ ] Typical 4-option question fits viewport without scroll (or passage collapses)
- [ ] `scroll-padding` set if sticky header/footer overlap content
- [ ] Tested on mobile — thumb can reach Next one-handed

---

## 15. Anti-patterns (never do this)

- **Navigation at the bottom of scrollable content** — causes scroll-up-after-Next fatigue
- **Three rows of metadata above the question** — collapses content below the fold
- **Save buttons when autosave exists** — creates anxiety, not confidence
- **Submit visible but disabled** — users click randomly wondering what's wrong
- **Hidden keyboard shortcuts** — power without discoverability helps nobody
- Heavy borders on everything — use space and subtle rings instead
- Multiple primary buttons competing for attention
- Gradient text, neon colors, or glassmorphism overload
- Custom fonts beyond Plus Jakarta Sans
- Animation for animation's sake (parallax, bounce, spin on hover)
- Dense walls of text without hierarchy
- Modals when inline expansion works
- Removing focus rings for aesthetics
- Different card styles on the same step (breaks trust)
- Sticky nav that's taller than 64px — eats the screen on mobile

---

## 16. File reference

| File | Responsibility |
|---|---|
| `src/app/globals.css` | Tokens, base styles, exam typography utilities |
| `src/app/layout.tsx` | Root font + `SiteHeader` |
| `src/app/exam/layout.tsx` | Focus `PageShell` (no footer) |
| `src/app/results/layout.tsx` | Minimal `PageShell` |
| `src/components/site-header.tsx` | Route-aware app header |
| `src/components/bento-card.tsx` | Selection card (`static`, `compact` variants) |
| `src/components/step-indicator.tsx` | Setup progress |
| `src/components/ui/*` | shadcn primitives — extend, don't fork |
| `src/components/exam-setup.tsx` | Setup flow patterns |
| `src/components/exam-runner.tsx` | Focus-mode exam UI |
| `src/hooks/use-exam-keyboard.ts` | Keyboard shortcuts — pair with visible hints |
| `src/components/page-shell.tsx` | Page padding + footer backgrounds |
| `src/components/exam-header.tsx` | Sticky exam metadata bar |
| `src/components/exam-nav-bar.tsx` | Fixed bottom Prev/Flag/Review/Next |
| `src/components/setup-footer.tsx` | Fixed setup wizard footer |
| `src/components/results-footer.tsx` | Fixed results actions |
| `src/components/result-question-row.tsx` | Collapsible review row |
| `src/components/exam-question-nav.tsx` | Question grid, rail, mobile sheet |
| `src/components/keyboard-hints.tsx` | Dismissible shortcut reference |
| `docs/DESIGN-BIBLE.md` | This document |
| `docs/IMPLEMENTATION.md` | Phased redesign plan |

---

## 17. Evolution

This bible should grow with the product. When adding a new pattern:

1. Build it using existing tokens first
2. If reused 3+ times, extract a component
3. Document it in Section 8 before spreading it elsewhere
4. If it fixes a listed gap in Section 2c, check it off there

### Roadmap (UX priority) — shipped

1. ~~**ExamNavBar** — fixed bottom Prev/Flag/Review/Next~~
2. ~~**Scroll-to-top** — on `navigateToQuestion` in exam-runner~~
3. ~~**ExamHeader** — merge metadata into one sticky row~~
4. ~~**Compact exam density** — tighter padding utilities in `globals.css`~~
5. ~~**Keyboard hint bar** — dismissible shortcut reference~~
6. ~~**Question navigator** — grid/sheet for 20+ question exams~~

**Version:** 1.2 · Easy UX + Modern SaaS design system
