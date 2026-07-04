# Handoff — Chord Progression (guided courses)

**Goal:** add a mastery-gated *progression* to the chord portion of the suite, so a
learner starts simple and unlocks difficulty as they demonstrate understanding —
along two axes: **chord quality** (major → minor → diminished → 7ths → advanced)
and **inversion** (root → 1st → 2nd → 3rd).

---

## Key decisions (locked with the user)

| Decision | Choice |
|----------|--------|
| Scope | **Both** chord trainers get a guided progression, sharing one engine |
| Mastery gate | **3-in-a-row per skill** (a skill = one quality×inversion combo, pooled across roots). Miss → that skill's streak resets. Lesson clears when every active skill is mastered. |
| Roots ramp | **Naturals first** (white-key roots), widen to all 12 as a later milestone — applies to the *Inversion* course where roots matter |
| Ladder depth | **Full ladder to 3rd inversion** (requires 7th chords). Open to advanced chord types (aug, sus, extended) as later/advanced levels |
| Chord ID scope | User only cares about the **chord type**, not the specific notes/root. Renamed concept: **"Chord Type Identification."** Answers are type-only (`Major`, `Minor`, `Dominant 7th`…), not `C major`. Inversions appear in later levels as harder *recognition* (answer stays type-only). |
| Ordering pedagogy | **Blocked-intro → interleaved-review → spaced-finale.** Introduce each new shape in isolation (fast early wins), then fold it back into a mixed pool, then re-surface old shapes in later units so they don't decay. Do **not** group purely by shape-similarity end-to-end — it feels fast but kills long-term retention + discrimination between look-alike chords. (Discussed 2026-07-04; interleaving > blocking for retention.) |

---

## ⚠️ Architecture pivot (important)

The original pitch was "write a new engine + add a Guided toggle onto the two
existing chord trainers." **But the repo already has the engine and a template:**

- **`shared/curriculum.js`** — `Trainer.curriculum`, a reusable TypingClub-style
  course engine: renders a tile map from a `COURSE` def, computes unlock state
  (a lesson unlocks when the previous has ≥1 star), persists per-lesson stars in
  `Trainer.store`, and hands the page a controller. The prompt loop is
  domain-specific and lives in the page (`onPlay(lesson, controller)`).
- **`exercises/learn-keys.html`** — a complete guided course built on that engine
  (note-reading, C&D growing to a full octave, hearts, staff reading, a "Note
  Ninja" timed boss). **This is the copy-me template.**
- Both are **uncommitted WIP** (untracked) as of this handoff, alongside a
  modified `index.html` that lists Learn the Keys as the first hub card.

**Revised approach:** build the chord progression as **new guided course pages**
on the existing engine, mirroring `learn-keys.html` — not as a toggle on the
existing free-play pages. The existing `chord-id.html` / `chord-inversion.html`
stay as-is (free-play drilling). Keep the user's **3-in-a-row** rule as the
lesson-clear criterion, translated to the engine's star/unlock model.

### How the engine maps to our design
- `COURSE = { title, units:[{ title, lessons:[…] }] }`.
- Each **lesson** is a tile. Lesson `id` (stable string), `type` (icon +
  behavior), `title`. `learn-keys` uses a `notes:[…]` field that the engine
  accumulates into `lesson._pool`. **Chord lessons ignore `notes`** and instead
  carry an explicit descriptor the page reads in `onPlay`:
  `{ qualities:[…], inversions:[…], roots:"naturals"|"all" }`.
- Unlock = previous lesson has ≥1 star. To enforce true mastery, award **0 stars
  if the lesson wasn't mastered** (3-in-a-row on every active skill) so the next
  tile stays locked; award 3–5 stars on mastery scaled by accuracy/misses.
- `controller.record(id, {stars, …})`, `controller.showMap()`,
  `controller.showLesson()`, `controller.poolFor(lesson)`, `resetProgress()`.

---

## The two courses

### Course A — Learn Chord Types  (new file: `exercises/learn-chord-types.html`)
Recognize the **type** of a chord (multiple choice, type-only answers). Roots are
free variety (don't affect the answer). Inversions arrive as harder recognition.

| Unit | Lesson | type | Active qualities | Voicing |
|------|--------|------|------------------|---------|
| 1 · Triads | Intro: what's a chord? | intro | — | — |
| | Major | learn | maj | root |
| | Major & Minor | learn | maj, min | root |
| | + Diminished | learn | maj, min, dim | root |
| | Triad review | review | maj, min, dim | root |
| | Inverted triads | learn | maj, min, dim | any inversion |
| | Triad boss (timed) | play | maj, min, dim | any inversion |
| 2 · Sevenths | maj7 / min7 / dom7 | learn | maj7, min7, dom7 | root |
| | + Diminished 7th | learn | +dim7 | root |
| | Seventh review | review | all 7ths | root |
| | Inverted sevenths | learn | all 7ths | any inversion |
| | Seventh boss (timed) | play | all 7ths | any inversion |
| 3 · Mastery | Everything mixed | review | triads + 7ths | any inversion |
| | Grand boss | play | triads + 7ths | any inversion |

- **Gate:** in learn/review lessons, track a consecutive-correct counter per
  active *type*; mastered at 3; prompts weight toward not-yet-mastered types;
  lesson clears when all mastered. Boss lessons = timed survival (hearts) like
  Note Ninja.
- **First "Major" lesson** is near-trivial (only answer is Major) — treat it as
  familiarization with the major sound/shape.
- Store key: `learn-chord-types`.

### Course B — Learn Chord Inversions  (new file: `exercises/learn-inversions.html`)
*Play* the named chord in the required inversion (produce the exact voicing).
Naturals-first, full quality+inversion+root ladder.

| Unit | Lesson | Qualities | Inversions | Roots |
|------|--------|-----------|-----------|-------|
| 1 · Triads (white keys) | Major (root) | maj | root | naturals |
| | + Minor (root) | maj, min | root | naturals |
| | + Dim (root) | maj, min, dim | root | naturals |
| | + 1st inversion | triads | root, 1st | naturals |
| | + 2nd inversion | triads | root,1st,2nd | naturals |
| 2 · Triads (all keys) | Transpose triads | triads | all | **all 12** |
| 3 · Sevenths (white keys) | 7ths (root) | maj7,min7,dom7 | root | naturals |
| | + 1st | 7ths | root,1st | naturals |
| | + 2nd | 7ths | root,1st,2nd | naturals |
| | + 3rd (+dim7) | +dim7 | all four | naturals |
| | **Triads Return (mixed)** `i12` | **triads + 7ths** | all | naturals |
| 4 · Full Mastery (all keys) | Full mastery `i11` | **triads + 7ths** | all | **all 12** 🎉 |
| 5 · Advanced (white keys) | Augmented (root) `i13` | maj, aug | root | naturals |
| | Suspended (root) `i14` | sus2, sus4 | root | naturals |
| | + Suspended inversions `i15` | sus2, sus4 | root,1st,2nd | naturals |
| | Half-diminished 7th `i16` | min7, m7♭5 | all four | naturals |
| | Add 9 `i17` | maj, add9 | all four | naturals |
| 6 · Advanced Mastery (all keys) | Advanced Mastery `i18` | aug, sus2, sus4, m7♭5, add9 | all | **all 12** 🎉 |

- **Interleaving/spacing added 2026-07-04:** `i12` "Triads Return (mixed)" is a
  new spacing checkpoint at the end of Unit 3 — triads (learned in Units 1–2 then
  dropped) are shuffled back in with the sevenths, so the learner must discriminate
  e.g. min triad vs. min7, 2nd-inv triad vs. 2nd-inv 7th. `i11` "Full Mastery" was
  **fixed**: it previously tested only `maj7/min7/dom7/dim7` (triads silently
  omitted from the finale); now it mixes all 7 qualities × all inversions × all 12
  keys. All existing lesson `id`s preserved (only `i12` is new) so saved star
  progress survives. `skillsFor()` already guards `inv < n`, so triads in mixed
  lessons correctly get root/1st/2nd only while 7ths also get 3rd.
- **Gate:** 3-in-a-row per (quality×inversion) skill, pooled across active roots.
- Reuse `chord-inversion.html`'s evaluate() logic (exact voicing, or open-voicing
  option) for the lesson runner.
- Store key: `learn-inversions`.

---

## Build order
1. **Course A — Learn Chord Types** (`exercises/learn-chord-types.html`), copying
   `learn-keys.html` structure; add hub card in `index.html`. ← simplest, do first
2. **Course B — Learn Chord Inversions** (`exercises/learn-inversions.html`);
   add hub card.
3. (Later) advanced chord types as appended units — no engine change needed.

## Notes / gotchas
- Reuse `theory.js`: `CHORD_TYPES`, `INV_NAMES`, `voicing`, `voicingMidi`,
  `NOTE_NAMES`, `ROOTS`. Naturals = pitch classes `[0,2,4,5,7,9,11]`.
- 3rd inversion only exists on 4-note (7th) chords — triads top out at 2nd.
- `learn-keys.html` is the reference for: tile CSS, lesson view DOM, hearts,
  timer bar, stars (`C.starsFor`, `C.starPips`), primer screens, result screen.
- Everything is **static HTML** served by `python3 -m http.server 8872`
  (`.claude/launch.json` → "suite"). Verify via the preview tools.
- Uncommitted WIP present at handoff: `curriculum.js`, `learn-keys.html`,
  modified `index.html`. Don't clobber; build alongside.

## Status
- [x] Plan agreed, decisions locked, architecture pivot documented
- [x] **Course A — Learn Chord Types** — `exercises/learn-chord-types.html`, hub card
  added to `index.html`, `learn:"🧩"` icon added to `curriculum.js`. Verified in
  browser: map/unlock/stars, intro primer, 3-in-a-row mastery, wrong-answer reset
  + reveal, result screen, persistence. Boss (timed) lessons built on the proven
  learn-keys pattern but not yet play-tested end-to-end (needs unlocking to reach).
- [x] **Course B — Learn Chord Inversions** — `exercises/learn-inversions.html`, hub
  card added to `index.html`. A guided *play* course: you produce the exact voicing
  on the keys (reuses `chord-inversion.html`'s evaluate() logic — exact-voicing bottom→top
  or open-voicing option). Naturals-first, full quality×inversion×root ladder to 3rd
  inversion, capped by an all-12-keys "Full Mastery 🎉". Gate = 3-in-a-row per
  (quality×inversion) skill, pooled across active roots; a miss resets that skill's
  streak and you retry the same chord (notes reveal after 3 wrong). Store key
  `learn-inversions`. Browser-verified: map/unlock/stars, intro primer, correct→mastery,
  wrong→reset+reveal+highlight, full lesson clear (mastery pooled across roots C/G/E),
  result screen, localStorage persistence + unlock propagation, open-voicing accept,
  hub card link. No timed bosses in this course (pure mastery ladder, per spec).
- [x] **Course B interleaving + spacing pass** (2026-07-04) — added `i12` "Triads
  Return (mixed)" spacing checkpoint (triads shuffled back in with sevenths, white
  keys) and fixed the `i11` "Full Mastery" finale to actually mix triads + sevenths
  across all 12 keys (was sevenths-only). Unit 4 retitled "Full Mastery (all keys)".
  All old `id`s preserved (progress-safe); only `i12` new. Browser-verified: map
  renders 13 tiles in 4 units, new tile + retitle present, no console errors.
  **Open question for user:** `i12`/`i11` are heavy (7 qualities × 3-in-a-row). If
  they drag in play-testing, drop `masterN` 3→2 for `review`-type tiles. Left at 3
  pending user call.
- [x] **Advanced units built** (2026-07-04) — added 4 chord types to `theory.js`:
  `sus2 [0,2,7]`, `sus4 [0,5,7]`, `m7b5 [0,3,6,10]` (half-dim 7th), `add9 [0,4,7,2]`
  (`aug` already existed). Scope chosen = suspended + half-dim + add9, all **4-note
  max** so no 5-note voicings / no `INV_NAMES[4]` needed; `m7♭5` carries genuine
  "extended/altered" weight (the ii° of every minor key). **Course A** gained
  `Unit 4 · Advanced Colors` (`a1`–`a6`: Augmented → Suspended → Half-dim 7th →
  Add 9 → Advanced Review → Advanced Boss). **Course B** gained `Unit 5 · Advanced
  (white keys)` (`i13`–`i17`: aug/sus root → sus inversions → m7♭5 → add9) +
  `Unit 6 · Advanced Mastery (all keys)` (`i18`, all 5 across 12 keys). All new
  ids, no old ids touched (progress-safe). Browser-verified on port 8873: Course A
  = 4 units/20 tiles, Course B = 6 units/19 tiles; `skillsFor()` `inv<n` guard
  correctly gives aug/sus root/1st/2nd and m7♭5/add9 root→3rd; voicing math checked
  (`add9` inv1, `m7♭5` inv3); labels render; no console errors. **Side effect
  (intended):** the free-play `chord-id.html` / `chord-inversion.html` now include
  these 4 types by default (all type-chips start "on") — verified no ID ambiguity
  (only `dim7` is transposition-symmetric; the 4 new sets are unique).
- Advanced *extended* (5-note 9ths, aug7, etc.) still open as a future tier — would
  need `INV_NAMES` extended past 3rd inversion.
- [x] **Course A boss/timed lessons play-tested** (t6 Triad, s5 Seventh, m2 Grand).
  Verified in browser: all three init with correct type sets/chips/hearts/target;
  **win** path (12 correct → speed ramps 4600→2440ms, 5 stars, 100%); **lose** path
  (3 misses → hearts 3→0, game over, 0 stars, right answer revealed each miss);
  result + retry/map; no console errors.
- [ ] **Finding to fix:** Course A boss timer uses `requestAnimationFrame`
  (`startTimer`, ~line 410 of `learn-chord-types.html`). rAF pauses in a hidden/
  background tab, so the countdown freezes when the player tabs away (and can snap to
  time-up on return). `learn-keys.html` deliberately uses `setInterval` for this exact
  reason. Fix = swap Course A's `startTimer`/`stopTimer` to the `setInterval` shape
  learn-keys uses. Low-risk, recommended. (Only manifests in a backgrounded tab; the
  boss plays correctly when focused.)
- [ ] **Nothing committed yet** — all suite work is WIP (untracked/modified). User to
  review before any commit.
