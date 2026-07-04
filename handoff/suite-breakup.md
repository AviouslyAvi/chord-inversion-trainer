# Chord Inversion Trainer → Music-Theory Suite — Parallel Build Handoff

Expanding the single-page **Chord Inversion Trainer** into a small **suite** of
music-theory exercise pages, mirroring musictheory.net's exercise set. This doc
splits the work into self-contained batches so each exercise can be built **in
parallel in its own fresh chat**.

**7 batches, split by exercise (the natural seam), with a blocking foundation batch first.**

Reusable internals confirmed in the current `index.html`:
- **Audio** — gleitz MIDI-js **FatBoy** soundfonts via jsDelivr (`ac()`, `loadInstrument()`, `SF_CDN`).
- **Piano** — absolute-positioned key divs with `data-note` (`drawPiano`, `noteOn`/`noteOff`, mouse/touch latch).
- **MIDI** — `initMIDI` / `refreshMidiSelect` / `bindMidiInputs` / `setStatus` / `showMidiHelp`.
- **Theory** — `NOTE_NAMES` / `ROOTS` / `CHORD_TYPES` (incl. `dim7`) / `INV_NAMES` / `voicing` / `voicingMidi`.

---

## Dependency / order table

| Batch | Scope | Items | Depends on |
|---|---|---|---|
| **0** | Shared foundation + landing hub | Extract theory/audio/piano/MIDI/store/CSS into `shared/*`; build `index.html` hub; move trainer stub | — |
| **1** | Chord Identification | keyboard-chord + ear-chord | Batch 0 |
| **2** | Interval Trainer | keyboard-interval + ear-interval | Batch 0 |
| **3** | Scale Identification | keyboard-scale | Batch 0 |
| **4** | Ear: Melody / Keyboard playback | ear-keyboard | Batch 0 |
| **5** | Note Finder (reverse) | keyboard-reverse | Batch 0 |
| **6** | Port existing Chord Inversion Trainer | move into `exercises/` on shared foundation | Batch 0 |

**Recommended order:** Batch 0 first, alone and **merged before anything else**.
Then Batches 1–6 in **any order, fully in parallel** (each touches only its own
`exercises/<name>.html` + its own settings, never another batch's files).

### Source links (musictheory.net) these map to
- keyboard-chord → Batch 1 (SEE mode) — https://www.musictheory.net/exercises/keyboard-chord
- ear-chord → Batch 1 (HEAR mode) — https://www.musictheory.net/exercises/ear-chord
- keyboard-interval → Batch 2 (SEE mode) — https://www.musictheory.net/exercises/keyboard-interval
- ear-interval → Batch 2 (HEAR mode) — https://www.musictheory.net/exercises/ear-interval
- keyboard-scale → Batch 3 — https://www.musictheory.net/exercises/keyboard-scale
- ear-keyboard → Batch 4 — https://www.musictheory.net/exercises/ear-keyboard
- keyboard-reverse → Batch 5 — https://www.musictheory.net/exercises/keyboard-reverse

---

## Shared context header — paste this at the top of EVERY batch chat

```text
PROJECT: "Chord Inversion Trainer" → expanding into a small music-theory exercise SUITE,
mirroring musictheory.net's exercises. Repo: github.com/AviouslyAvi/chord-inversion-trainer
(local: /Users/aviouslyavi/Claude/Projects/chord-inversion-trainer). Branch: master.

HARD CONSTRAINTS:
- NO build step. Static site: plain HTML/CSS/JS, served as files. Must work on GitHub Pages / Vercel and via a simple `python3 -m http.server`.
- Do NOT use ES modules (breaks file://-style simplicity). Shared code is loaded via classic
  <script src="../shared/xxx.js"> and attaches its API to a global `window.Trainer` namespace.
- Dark premium theme with animations is intentional and KEPT (glow, pop, toggle switches, chip pills).
- Answer style: PLAY IT ON THE MIDI KEYBOARD where natural (reproduce what you hear/see).
  For pure "name what's shown" identification where playing makes no sense, use tap/multiple-choice
  answer buttons styled like the existing `.chip` pills. Mouse/touch on the on-screen piano must
  always work as a fallback (Web MIDI is optional).

REPO LAYOUT (target, created by Batch 0):
  index.html                      ← landing/hub, links to each exercise
  exercises/<name>.html           ← one self-contained page per exercise
  shared/base.css                 ← theme vars + hero/controls/piano/modal/switch/chip/score styles
  shared/theory.js                ← window.Trainer.theory
  shared/audio.js                 ← window.Trainer.audio
  shared/piano.js                 ← window.Trainer.piano
  shared/midi.js                  ← window.Trainer.midi
  shared/store.js                 ← window.Trainer.store
  shared/shell.js                 ← window.Trainer.shell (topbar + settings-modal scaffold)

SHARED API CONTRACT (Batch 0 produces this; all exercise batches consume it):
  Trainer.theory: NOTE_NAMES[12], ROOTS[0..11], CHORD_TYPES{key:{label,symbol,intervals[]}}
    (incl. dim7 [0,3,6,9]), INV_NAMES[], INTERVALS{semitone:{name,short}} (0..12),
    SCALE_TYPES{key:{label,intervals[]}} (major, natural/harmonic/melodic minor, dorian,
    phrygian, lydian, mixolydian, locrian, major/minor pentatonic, blues, chromatic),
    voicing(rootPc,typeKey,inv), voicingMidi(rootPc,typeKey,inv,base=60),
    scaleMidi(rootPc,scaleKey,base=60), noteName(pc).
  Trainer.audio: ac(), loadInstrument(key), playNote(midi,durMs=700), playNotes(midiArr,{stagger,durMs}),
    hearNotes(midiArr), stopAll(); instruments: piano|epiano|organ|synth (gleitz FatBoy soundfonts, jsDelivr).
  Trainer.piano: create(containerEl,{onNoteOn,onNoteOff,labels,lowMidi,highMidi}) →
    {draw(), highlight(midiArr), clearHighlight(), held:Map, setLabels(bool)}; supports MIDI + mouse/touch latch.
  Trainer.midi: init({onNoteOn,onNoteOff,onStatus}), refreshSelect(selEl), bindInputs(selEl),
    setStatus(el,msg,ok), showHelp(containerEl,reason).
  Trainer.store: load(), save(), bumpMiss(key), misses, weightFor(key), stats{correct,total,best},
    resetAll(); localStorage-backed, per-exercise namespaced by a storeKey you pass in.
  Trainer.shell: mount(el,{title, settingsSections}) → builds the topbar (brand, MIDI device <select>,
    ⚙ gear) + a single settings MODAL overlay (Esc/backdrop closes); settingsSections is an array of
    {title, html} rendered as modal sections. Returns {openSettings, closeSettings, midiSelectEl}.

DESIGN NOTES: reuse the current index.html as the visual reference for colors, the hero card, the
circular ▶ play button (.playbtn), toggle switches (.switch/.track), chip pills (.chip), and the
compact score pill (.stats). Keep <=~1 screen of chrome; exercise is the focus, settings behind the gear.

VERIFY (every batch):
1. Serve: `python3 -m http.server 8848` then open the page.
2. Confirm no console errors; the exercise loads, generates a prompt, accepts input, scores correctly,
   and advances. Test with mouse (MIDI optional). Use the Claude Code preview/browser tools to screenshot.
3. Report: what files you added/changed, how you verified, anything you stubbed or left as TODO.

REPORTING: End with a short summary + a one-line git status. Do NOT push/merge unless asked.
```

---

## Batch 0 — Shared foundation + landing hub (BUILD & MERGE FIRST, blocks all others)

```text
[Paste shared context header first]

BATCH 0 — Foundation + landing. This is the blocking dependency for every other batch; it must be
finished and on master before the exercise batches start.

Source of truth: the current single-file app is `index.html` (~1000 lines). Extract its reusable
guts into the `shared/*` files per the SHARED API CONTRACT, without regressing behavior.

TASKS:
1. Create shared/base.css: pull the :root theme vars + styles for hero, .controls, .playbtn, piano
   (.piano/.key/.white/.black/.held-*/.target), .stats score pill, .chip pills, .switch toggles,
   the settings .modal-backdrop/.modal, and the MIDI .midihelp banner. One shared stylesheet.
2. Create shared/theory.js (window.Trainer.theory): move NOTE_NAMES, ROOTS, CHORD_TYPES (keep dim7),
   INV_NAMES, voicing(), voicingMidi(). ADD: INTERVALS (0..12 semitones w/ names: Unison, m2, M2, m3,
   M3, P4, Tritone, P5, m6, M6, m7, M7, Octave), SCALE_TYPES (major, natural/harmonic/melodic minor,
   the 7 modes, major/minor pentatonic, blues, chromatic) with interval arrays, scaleMidi(), noteName().
3. Create shared/audio.js (window.Trainer.audio): move ac(), SF_CDN, loadInstrument(), and the sample
   playback. Expose playNote/playNotes/hearNotes/stopAll with the documented signatures.
4. Create shared/piano.js (window.Trainer.piano): refactor drawPiano/noteOn/noteOff into a
   create(container,opts) factory returning {draw, highlight, clearHighlight, held, setLabels}.
   Keep mouse/touch latch + MIDI realtime behavior.
5. Create shared/midi.js (window.Trainer.midi): move initMIDI/refreshMidiSelect/bindMidiInputs/
   setStatus/showMidiHelp into the documented namespace (accept element args instead of hardcoded IDs).
6. Create shared/store.js (window.Trainer.store): move loadStore/saveStore/misses/weighting/stats,
   namespaced by a storeKey param so each exercise keeps separate progress.
7. Create shared/shell.js (window.Trainer.shell): factor the topbar + single settings-modal overlay
   (gear button, Esc/backdrop close) into mount(el,{title,settingsSections}).
8. Build the NEW index.html landing/hub: title + short blurb + a responsive grid of exercise cards,
   one per planned exercise (Chord Inversion Trainer, Chord ID, Interval Trainer, Scale ID, Ear:Melody,
   Note Finder). Each card = icon + name + one-line description, linking to exercises/<name>.html.
   Cards for not-yet-built exercises may link to a "coming soon" placeholder or a disabled state — but
   list ALL of them so later batches just fill in the page. Use base.css for styling.
9. Create an `exercises/` folder. Add a tiny shared page template comment/snippet (in the header of a
   sample exercise file, e.g. exercises/_template.html) showing the standard <script src="../shared/*">
   include order + Trainer.shell.mount usage, so parallel batches start from an identical skeleton.

Do NOT delete the old index.html logic until it's confirmed working from shared/*. Verify the hub loads,
links resolve, and shared/* have no console errors when included by the template. Keep it mergeable.
```

---

## Batch 1 — Chord Identification (keyboard-chord + ear-chord)

```text
[Paste shared context header first]

BATCH 1 — Build exercises/chord-id.html. Two modes in one page (toggle in settings):
- SEE mode (musictheory.net keyboard-chord): highlight a chord's notes on the on-screen piano →
  learner names it by tapping a .chip answer from the candidate chord types (play-answer doesn't fit
  "name what you see", so use tap here).
- HEAR mode (ear-chord): play the chord via Trainer.audio.hearNotes → learner PLAYS it back on the
  MIDI/on-screen keyboard (play where natural). Correct = the right pitch classes (respect an
  "accept any octave" open-voicing toggle like the current app).
Use Trainer.theory.CHORD_TYPES (incl. dim7) + voicing/voicingMidi, Trainer.piano, Trainer.audio,
Trainer.store (storeKey "chord-id"), Trainer.shell for the topbar+settings. Settings: which chord
types, root range, SEE/HEAR mode, open-voicing accept, weak-spot weighting. Reuse the score pill,
▶ play button, feedback animations. Wire it into the landing card. Verify per header.
```

---

## Batch 2 — Interval Trainer (keyboard-interval + ear-interval)

```text
[Paste shared context header first]

BATCH 2 — Build exercises/interval.html. Two modes (settings toggle):
- SEE mode (keyboard-interval): highlight two notes on the piano → learner taps the interval name
  (.chip answers from Trainer.theory.INTERVALS).
- HEAR mode (ear-interval): play the two notes (Trainer.audio; support harmonic=together and
  melodic=stagger) → learner PLAYS the two notes back on the keyboard (or taps the interval name if you
  offer a name-it sub-option). Correct = correct interval size (and direction if you add an up/down setting).
Settings: which intervals to include, ascending/descending/harmonic, root range, SEE/HEAR, weak-spot
weighting. Use Trainer.store storeKey "interval". Reuse score pill / play button / animations. Wire the
landing card. Verify per header.
```

---

## Batch 3 — Scale Identification (keyboard-scale)

```text
[Paste shared context header first]

BATCH 3 — Build exercises/scale.html.
- SEE mode (keyboard-scale): highlight a scale's notes ascending on the piano → learner taps the scale
  name (.chip from Trainer.theory.SCALE_TYPES).
- PLAY mode (play where natural): show a scale NAME + root → learner PLAYS the scale ascending on the
  keyboard; correct = the right ordered pitch classes from the tonic. Use Trainer.theory.scaleMidi.
Settings: which scale types (major, natural/harmonic/melodic minor, modes, pentatonics, blues,
chromatic), root range, SEE/PLAY mode, weak-spot weighting. Trainer.store storeKey "scale".
Reuse shared UI. Wire the landing card. Verify per header.
```

---

## Batch 4 — Ear Training: Melody / Keyboard playback (ear-keyboard)

```text
[Paste shared context header first]

BATCH 4 — Build exercises/ear-melody.html (musictheory.net ear-keyboard).
Play a short melodic sequence of N notes via Trainer.audio.playNotes (stagger) → learner PLAYS the
sequence back in order on the MIDI/on-screen keyboard. Correct = same ordered notes (allow a
setting for exact-octave vs pitch-class). A "replay" ▶ button re-plays the prompt.
Settings: sequence length (2–8), note pool (scale-constrained via Trainer.theory.SCALE_TYPES or free
chromatic), root/range, tempo, exact-octave toggle, weak-spot weighting. Trainer.store storeKey
"ear-melody". Reuse score pill / play button / animations. Wire the landing card. Verify per header.
```

---

## Batch 5 — Note Finder / reverse (keyboard-reverse)

```text
[Paste shared context header first]

BATCH 5 — Build exercises/note-finder.html (musictheory.net keyboard-reverse).
Show a note NAME (and optionally an octave) → learner PLAYS/taps that key on the keyboard. Correct =
the right key. Include an option for pitch-class-only (any octave) vs exact octave. Optional reverse
sub-mode: highlight a key → learner taps the note name (.chip) for pure reading practice.
Settings: naturals-only vs include accidentals, sharps/flats spelling, exact-octave vs pitch-class,
weak-spot weighting. Trainer.store storeKey "note-finder". Reuse shared UI. Wire the landing card.
Verify per header.
```

---

## Batch 6 — Port the existing Chord Inversion Trainer

```text
[Paste shared context header first]

BATCH 6 — Move the existing Chord Inversion Trainer onto the shared foundation as
exercises/chord-inversion.html. Behavior is UNCHANGED from the current app: show a chord name +
inversion + bass note → learner PLAYS the correct inversion on the keyboard; open-voicing toggle,
ear-only mode, speed mode, weak-spot weighting, instruments, reveal/skip/▶ all preserved.
Replace its inline theory/audio/piano/midi/store/CSS with the shared/* API + base.css; keep its
exercise-specific logic. Trainer.store storeKey "chord-inversion" (migrate the old "chordTrainer.v2"
localStorage key if present so users don't lose stats). Wire the landing card. Verify parity per header.
```
