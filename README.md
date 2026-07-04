# Chord Inversion Trainer

A hands-free, browser-based trainer for practicing chord inversions on a MIDI keyboard. Plug in a MIDI controller (or use your mouse/touch), and the app prompts you with a chord + inversion to play — giving live feedback, ear-training, and weak-spot tracking as you go.

No build step, no dependencies to install. It's a single self-contained `index.html`.

## Features

- **Live MIDI input** via the Web MIDI API — auto-detects connected devices, or fall back to clicking the on-screen piano.
- **All the essentials** — major, minor, diminished, augmented, maj7, min7, and dominant 7th chords across root position and all three inversions.
- **Real-time chord identification** — shows what you're currently playing as you hold notes.
- **Two practice modes** — relaxed, or speed/timed with a countdown bar.
- **Ear-only mode** — hides the chord name so you reproduce what you hear.
- **Open-voicing mode** — accept any octave spread as long as the bass note and chord tones are right.
- **Weak-spot focus** — most-missed chords resurface more often; progress is saved to `localStorage`.
- **Sampled instruments** — acoustic piano, electric piano, organ, and a synth fallback (soundfonts loaded from a CDN, with an offline synth fallback).
- **Streak / accuracy stats** persisted on-device.

## Running it

Just open `index.html` in a modern browser. Web MIDI needs a Chromium-based browser (Chrome/Edge); the mouse/touch piano works everywhere.

For local development with a server (recommended so audio and MIDI permissions behave):

```bash
python3 -m http.server 4321
# then open http://localhost:4321
```

## Tech

Vanilla HTML/CSS/JS — no framework. Audio uses the Web Audio API with [gleitz MIDI-js soundfonts](https://github.com/gleitz/midi-js-soundfonts) via jsDelivr. Fonts: Space Grotesk, Inter, and JetBrains Mono via Google Fonts.

## License

MIT
