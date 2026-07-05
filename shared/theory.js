/* Trainer.theory — note/chord/scale/interval math shared across all exercises. */
window.Trainer = window.Trainer || {};
Trainer.theory = (function(){
  "use strict";
  const NOTE_NAMES = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
  const FLAT_NAMES = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
  const ROOTS = [0,1,2,3,4,5,6,7,8,9,10,11];

  const CHORD_TYPES = {
    "maj":  {label:"major",         symbol:"maj", intervals:[0,4,7]},
    "min":  {label:"minor",         symbol:"min", intervals:[0,3,7]},
    "dim":  {label:"diminished",    symbol:"dim", intervals:[0,3,6]},
    "aug":  {label:"augmented",     symbol:"aug", intervals:[0,4,8]},
    "sus2": {label:"suspended 2nd", symbol:"sus2",intervals:[0,2,7]},
    "sus4": {label:"suspended 4th", symbol:"sus4",intervals:[0,5,7]},
    "maj7": {label:"major 7th",     symbol:"maj7",intervals:[0,4,7,11]},
    "min7": {label:"minor 7th",     symbol:"min7",intervals:[0,3,7,10]},
    "dom7": {label:"dominant 7th",  symbol:"7",   intervals:[0,4,7,10]},
    "dim7": {label:"diminished 7th",symbol:"dim7",intervals:[0,3,6,9]},
    "m7b5": {label:"half-diminished 7th", symbol:"m7♭5", intervals:[0,3,6,10]},
    "add9": {label:"add 9",         symbol:"add9",intervals:[0,4,7,2]},
    // Extended tier (ext:true). aug7 is 4-note; the 9ths are true 5-note chords
    // that reach a 4th inversion. `ext` lets identification exercises opt out of
    // these (they're ambiguous/hard by ear) while play/inversion exercises keep them.
    "aug7": {label:"augmented 7th", symbol:"7♯5", intervals:[0,4,8,10],    ext:true},
    "dom9": {label:"dominant 9th",  symbol:"9",    intervals:[0,4,7,10,2], ext:true},
    "maj9": {label:"major 9th",     symbol:"maj9", intervals:[0,4,7,11,2], ext:true},
    "min9": {label:"minor 9th",     symbol:"min9", intervals:[0,3,7,10,2], ext:true},
  };
  const INV_NAMES = ["Root position","1st inversion","2nd inversion","3rd inversion","4th inversion"];

  // interval in semitones (0..12) -> names
  const INTERVALS = {
    0:  {name:"Unison",       short:"P1"},
    1:  {name:"Minor 2nd",    short:"m2"},
    2:  {name:"Major 2nd",    short:"M2"},
    3:  {name:"Minor 3rd",    short:"m3"},
    4:  {name:"Major 3rd",    short:"M3"},
    5:  {name:"Perfect 4th",  short:"P4"},
    6:  {name:"Tritone",      short:"TT"},
    7:  {name:"Perfect 5th",  short:"P5"},
    8:  {name:"Minor 6th",    short:"m6"},
    9:  {name:"Major 6th",    short:"M6"},
    10: {name:"Minor 7th",    short:"m7"},
    11: {name:"Major 7th",    short:"M7"},
    12: {name:"Octave",       short:"P8"},
  };

  const SCALE_TYPES = {
    major:        {label:"Major",            intervals:[0,2,4,5,7,9,11]},
    natural_minor:{label:"Natural minor",    intervals:[0,2,3,5,7,8,10]},
    harmonic_minor:{label:"Harmonic minor",  intervals:[0,2,3,5,7,8,11]},
    melodic_minor:{label:"Melodic minor",    intervals:[0,2,3,5,7,9,11]},
    dorian:       {label:"Dorian",           intervals:[0,2,3,5,7,9,10]},
    phrygian:     {label:"Phrygian",         intervals:[0,1,3,5,7,8,10]},
    lydian:       {label:"Lydian",           intervals:[0,2,4,6,7,9,11]},
    mixolydian:   {label:"Mixolydian",       intervals:[0,2,4,5,7,9,10]},
    locrian:      {label:"Locrian",          intervals:[0,1,3,5,6,8,10]},
    major_pent:   {label:"Major pentatonic", intervals:[0,2,4,7,9]},
    minor_pent:   {label:"Minor pentatonic", intervals:[0,3,5,7,10]},
    blues:        {label:"Blues",            intervals:[0,3,5,6,7,10]},
    chromatic:    {label:"Chromatic",        intervals:[0,1,2,3,4,5,6,7,8,9,10,11]},
  };

  function noteName(pc){ return NOTE_NAMES[((pc%12)+12)%12]; }

  // pitch classes for a chord in a given inversion (bottom -> top order)
  function voicing(rootPc, typeKey, inv){
    const abs = CHORD_TYPES[typeKey].intervals.map(i => (rootPc+i)%12);
    return abs.slice(inv).concat(abs.slice(0,inv));
  }
  // absolute stacked MIDI notes (bottom -> top) for a chord inversion above `base`
  function voicingMidi(rootPc, typeKey, inv, base=60){
    const pcs = voicing(rootPc, typeKey, inv);
    let prev = base + (((pcs[0]-base)%12)+12)%12;
    const notes = [prev];
    for (let i=1;i<pcs.length;i++){
      let n = prev + (((pcs[i]-prev)%12)+12)%12;
      if (n <= prev) n += 12;
      notes.push(n); prev = n;
    }
    return notes;
  }
  // ascending scale as absolute MIDI notes from the tonic at/above `base`
  function scaleMidi(rootPc, scaleKey, base=60){
    const start = base + (((rootPc-base)%12)+12)%12;
    return SCALE_TYPES[scaleKey].intervals.map(i => start + i);
  }

  return { NOTE_NAMES, FLAT_NAMES, ROOTS, CHORD_TYPES, INV_NAMES, INTERVALS, SCALE_TYPES,
           noteName, voicing, voicingMidi, scaleMidi };
})();
