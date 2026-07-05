# Piano App UX Improvements — Handoff

Session date: 2026-07-04/05. All changes are **in the working tree, uncommitted**
(branch `master`). Verification dev server ran at `http://localhost:8899`
(launch config `suite-verify`; start via preview_start or `python3 -m http.server 8899`).

The guided courses are three self-contained pages, each built on the shared
`Trainer.*` modules + the `curriculum.js` engine:
- `exercises/learn-keys.html` — **Learn the Keys** (notes; has Note-Ninja timer)
- `exercises/learn-inversions.html` — **Learn Chord Inversions** (play the named chord/inversion)
- `exercises/learn-chord-types.html` — **Learn Chord Types** (identify-the-type; keys light up, tap a chip)

---

## ✅ DONE & verified in-browser

### Whole-course fixes (shared modules → apply to all courses automatically)
1. **Green wrong-note pill never cleared** — `shared/piano.js` `clear()` now also
   resets `targetPcs` (`clear(){ held.clear(); targetPcs = new Set(); draw(); }`).
   Root cause: on a miss, play-mode revealed the answer via `highlight()`, and the
   next prompt's `clear()` didn't wipe it. Verified: forced miss → advance → 0 stale targets.
2. **Dots → accuracy stars** — `shared/curriculum.js` `starPips()` emits `★`/`☆`.
   Shared star style added to `shared/base.css` (`.pip` / `.pip.on`, `.stars`).
   Removed the per-file dot `.pip` rules in all 3 courses; `.result-stars .pip`
   changed from `width/height:30px` → `font-size:34px`. Grading already
   accuracy-weighted via `starsFor()`.
3. **True randomization, repeats allowed** — removed the "avoid immediate repeat"
   guards. `learn-keys.html` `pickPc()` simplified (was forcing C-D-C-D on a
   2-note pool). `learn-inversions.html` `nextPrompt()` picking simplified (dropped
   the `lastPrompt` retry loop). `learn-chord-types.html` was already repeat-free.
4. **Labels → C-only** — `shared/piano.js` now supports `labels: "c"` (only pitch
   class 0 gets a label). All 3 courses pass `labels:"c"`. In `learn-inversions.html`
   the settings toggle is relabeled "Show C labels…" and its onchange maps
   checked→`"c"`, unchecked→`false`.

### Note conveyor (prev · current · next, slides left) — Learn the Keys ONLY
- New shared component `shared/conveyor.js` (`Trainer.conveyor.create(mountEl)` →
  `{reset(cur,next), advance(newNext), setCur, show, hide, clear, el}`). CSS in
  `base.css` under "prompt conveyor" (`.conveyor`, `.conv-item`, `.pos-in/next/cur/prev/out`).
- Wired in `learn-keys.html`: mounted in the hero; `nextPrompt()` branches on
  `useConveyor = play-mode && !isPlay && !earOnly && !timed`. Course owns a 1-ahead
  queue (`sess.queuePc`, `sess.convStarted`). `promptInner(pc)` returns letter or
  staff SVG (`staffSvg()` refactored out of `renderStaff`). Hidden in name mode,
  timed Note-Ninja, result, and map. Verified: C→(answer)→prev C / cur D / next D.
- **Decision (user):** conveyor is untimed-lessons only, so lookahead can't
  trivialize the speed games.

### Free Practice per unit — engine + Learn the Keys + Learn Chord Inversions
- **Engine** (`shared/curriculum.js`): computes per-unit content
  (`unit._notes`, `unit._qtypes`, `unit._hasInv`, `unit._idx`, `unit._firstLesson`);
  appends a ⚙️ **Free Practice** tile to each unit whose first lesson is unlocked,
  IF the page passes `onFreePractice`. Clicking calls `onFreePractice(unit, controller)`.
  Tile styling + `.freepanel` layout in `base.css`.
- **learn-keys.html**: `openFreePractice(unit)` panel (note chips from `unit._notes`
  + toggles: ear-only, weak-spot, timed). `startFree()` synthesizes an endless
  session; `finishFree()` (Stop) shows the result card (stars from accuracy) and
  rebinds Retry to reopen the panel. `nextPrompt()` gained an `earOnly` branch;
  `resolve()` done-check is `sess.endless ? false : …`. Timer starts when
  `sess.isPlay || sess.timed`. Verified end-to-end (Start → conveyor → Stop → ★★★★★).
- **learn-inversions.html**: `startLesson(lesson, opts)` now takes opts
  (`free, endless, earOnly, weakSpot, unit`); weak-spot filters skills by
  `store.misses["skill:"+key]`; free path swaps in a Stop button and hides the
  mastery row. `nextPrompt()` gained an ear-only branch (hides name/inv/bass,
  autoplays). `resolve()` done-check gated by `!sess.endless`.
  `openFreePractice(unit)` panel: chord-type chips from `unit._qtypes` +
  toggles: **inverted-review (defaults ON for triad units)**, all-keys, weak-spot,
  ear-only. Synthesizes `{q, inv:[0,1,2,3]|[0], roots}` and runs via `startLesson`.
  `finishFree()` mirrors keys. Verified: triads unit panel, inverted-review default-on, Stop→result.

---

## ✅ DONE & verified in-browser (this session, 2026-07-05)

### Free Practice in `learn-chord-types.html` (3rd course, identify-the-type)
- `onFreePractice: openFreePractice` passed to `C.mount`.
- `startLesson(lesson, opts)` gained `free/endless/earOnly/weakSpot/timed/unit`.
  Free path swaps in a **Stop** button, hides the mastery row (also gated in
  `renderMasterRow` via `sess.free`). Split `sess.types` (all selected → answer
  chips, so weak-spot never leaves a 1-chip quiz) from `sess.pool` (the
  weak-filtered draw set). `pickType()` draws uniformly from `sess.pool` when
  endless. `nextPrompt()` ear-only branch keeps the keys dark + always autoplays;
  starts the timer when `sess.isPlay || sess.timed`. `resolve()` done-check gated
  by `sess.endless ? false : …`; ninja-accel only when `isPlay`.
- Panel (`openFreePractice`): chord-type chips from `unit._qtypes` + toggles
  inverted-review (`inv:"any"`) · weak-spot · ear-only · **timed**. `finishFree()`
  reuses the result card; Retry re-opens the panel.
- Timer: reuses the existing boss `.timerbar` + `startTimer/stopTimer`; timed free
  practice uses a **fixed** `CFG.freeTimedMs` (6 s, non-accelerating). Verified:
  panel opens, ear-only dims keys, endless doesn't finish, Stop→★★★★★, Retry→panel.

### Conveyor in `learn-inversions.html`
- Added `../shared/conveyor.js` script tag; mounted just above `#invBadge`.
- 1-ahead queue mirrors keys: `sess.convStarted` + `sess.queue = pickPrompt()`
  (a `{skill, rootPc}`). `pickPrompt()`/`convItem()` helpers added; `convItem` HTML
  = `.cc` → `.cc-name` (root + qual) over `.cc-inv` (inversion name). `nextPrompt()`
  branches: ear-only (single, keys dark) · **useConveyor** (`!earOnly && !timed`;
  prompt hidden, invBadge cleared, conveyor shows, bass hint still shown for the
  current chord) · timed (single prompt). `pickSkill()` now draws from **all** skills
  when endless (fixes a latent bug where free practice would "master out" and finish).
  Conveyor hidden + `promptEl.hidden=false` restored in start/primer/result/finish/
  endToMap/openFreePractice. Verified: normal lesson + untimed free practice show the
  conveyor, it slides cur→prev / next→cur, bass hint tracks the current chord.

### Per-prompt timer in `learn-inversions.html`
- New `#timerbar` in the hero; `perfNow/startTimer/stopTimer` (setInterval, survives
  hidden tabs), `FREE_TIMED_MS = 8000` (voicings take longer to build than a chip tap).
  Honored only when `sess.timed`. On timeout → `resolve(false, true)` (skip semantics:
  reveal + advance) — session continues, no game-over. Verified: countdown runs, times
  out, advances to a fresh prompt, `sess.over` stays false.

### Shared CSS (`base.css`)
- `.conv-item` got a display font-size (`clamp(44px,11vw,72px)`) so the current
  conveyor prompt reads large in BOTH courses (keys letters were tiny before — now
  prominent). Added `.conv-item .cc/.cc-name/.cc-inv` for the chord-name slot.
- `.inv-badge:empty { display:none }` — no stray empty pill when the badge is cleared
  (ear-only / conveyor modes).

---

## ✅ DONE & verified in-browser (2026-07-05, branch `claude/cool-heisenberg-7ca8ee`)

### Recap ribbon in `learn-chord-types.html` (was the skipped "conveyor")
- Identify-mode still can't PREVIEW the upcoming prompt (the answer is the lit keys —
  showing the next type spoils it). So the shared `Trainer.conveyor` is reused as a
  **sliding history**: the now-slot shows `?` until you answer, then reveals the type
  (green `✓` / red `✗`) and drifts to `prev` as a fresh `?` eases in. Same motion as the
  other two courses, zero spoilers. Next-slot placeholder is `⬦`.
- Mounted below the "What type?" prompt; `.conveyor.recap` style variant (58px, smaller
  font, `.rc*` slot classes) lives in the page `<style>` (course-specific, not base.css).
- `recap.reset()` on the first prompt, `recap.advance("⬦")`+`setCur(rcQ())` on each
  subsequent one; reveal happens in `resolve()` via `recap.setCur(rcAns(type, ok))`.
- Shows in learn/review/play + free practice (incl. ear-only/timed — history never
  cheats). Hidden on primer, result, map, free-practice panel, and Stop.
- Committed `bfc84d9`. Verified: `?`→reveal→slide-to-prev, wrong reveals red correct
  type, hides on map/panel/Stop, no console errors.

## ⏳ REMAINING

- Nothing outstanding. All handoff items done + committed. Whole-course fixes / shared
  conveyor / free practice + timers are on `master` (ebea6ee, 66cfa58, fb495e2); the
  recap ribbon is on branch `claude/cool-heisenberg-7ca8ee` (bfc84d9) — **not yet merged
  to master.**

---

## Key files touched this session
- `shared/piano.js` — clear() highlight fix; `labels:"c"` mode
- `shared/curriculum.js` — star glyphs; per-unit content; Free Practice tile + `onFreePractice`
- `shared/conveyor.js` — NEW shared component
- `shared/base.css` — stars, conveyor, free-practice tile/panel styles
- `exercises/learn-keys.html` — conveyor + full Free Practice + labels + random
- `exercises/learn-inversions.html` — Free Practice + ear-only + labels + random
- `exercises/learn-chord-types.html` — labels + Free Practice + timed + **recap ribbon** (done)
