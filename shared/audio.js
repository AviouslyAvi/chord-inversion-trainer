/* Trainer.audio — sampled-instrument playback (gleitz FatBoy soundfonts via jsDelivr),
   with a synth fallback when samples can't be fetched. */
window.Trainer = window.Trainer || {};
Trainer.audio = (function(){
  "use strict";
  let audioCtx = null;
  function ac(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
  function midiToFreq(m){ return 440*Math.pow(2,(m-69)/12); }

  const SF_CDN = "https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FatBoy/";
  const FLAT = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
  const INSTRUMENTS = {
    piano:  { label:"Acoustic Piano", sf:"acoustic_grand_piano-mp3" },
    epiano: { label:"Electric Piano", sf:"electric_piano_1-mp3" },
    organ:  { label:"Organ",          sf:"drawbar_organ-mp3" },
    synth:  { label:"Synth",          sf:null },
  };
  const LOW = 48, HIGH = 84;

  const sampleCache = new Map();   // "inst:midi" -> AudioBuffer
  const sampleLoading = new Map();
  let current = "piano";
  let samplesReady = false;
  const active = new Set();        // live source/osc nodes, for stopAll()

  function noteFile(m){ return FLAT[m%12] + (Math.floor(m/12)-1) + ".mp3"; }
  function loadSample(instKey, m){
    const inst = INSTRUMENTS[instKey];
    if (!inst || !inst.sf) return Promise.resolve(null);
    const key = instKey+":"+m;
    if (sampleCache.has(key)) return Promise.resolve(sampleCache.get(key));
    if (sampleLoading.has(key)) return sampleLoading.get(key);
    const p = fetch(SF_CDN + inst.sf + "/" + noteFile(m))
      .then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); return r.arrayBuffer(); })
      .then(buf=> ac().decodeAudioData(buf))
      .then(audio=>{ sampleCache.set(key, audio); return audio; });
    sampleLoading.set(key, p);
    return p;
  }
  function loadInstrument(instKey, onStatus){
    current = instKey;
    const inst = INSTRUMENTS[instKey];
    const status = t => { if (typeof onStatus === "function") onStatus(t); };
    if (!inst.sf){ samplesReady = false; status("🎛 synth tone"); return; }
    samplesReady = false;
    status("loading " + inst.label.toLowerCase() + "…");
    const jobs = [];
    for (let m=LOW; m<=HIGH; m++) jobs.push(loadSample(instKey, m).catch(()=>null));
    Promise.all(jobs).then(res=>{
      if (current !== instKey) return; // user switched mid-load
      samplesReady = res.some(Boolean);
      status(samplesReady ? ("🎹 " + inst.label) : "⚠️ offline — synth tone");
    });
  }

  function track(node){ active.add(node); node.onended = ()=> active.delete(node); }
  function synthNote(m, dur, when, gain){
    const ctx=ac(), t=ctx.currentTime+when;
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.type="triangle"; osc.frequency.value=midiToFreq(m);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(gain,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t+dur+0.05); track(osc);
  }
  function sampledNote(instKey, m, dur, when, gain){
    const ctx=ac(), t=ctx.currentTime+when, buf=sampleCache.get(instKey+":"+m);
    if (!buf){ return synthNote(m,dur,when,gain); }
    const src=ctx.createBufferSource(); src.buffer=buf;
    const g=ctx.createGain();
    const vol=gain*2.6;                    // samples are quieter than the synth
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t+Math.max(0.05,dur-0.18));
    g.gain.linearRampToValueAtTime(0.0001, t+dur+0.12);
    src.connect(g).connect(ctx.destination);
    src.start(t); src.stop(t+dur+0.2); track(src);
  }
  function playMidi(m, dur, when, gain){
    if (samplesReady && INSTRUMENTS[current].sf && sampleCache.has(current+":"+m))
      sampledNote(current, m, dur, when, gain);
    else synthNote(m, dur, when, gain);
  }

  // ---- public: times in MILLISECONDS ----
  function playNote(m, durMs=700, whenMs=0, gain=0.16){ ac().resume(); playMidi(m, durMs/1000, whenMs/1000, gain); }
  function playNotes(midiArr, opts){
    const {stagger=550, durMs=700, gain=0.16} = opts || {};
    ac().resume();
    midiArr.forEach((n,i)=> playMidi(n, durMs/1000, (i*stagger)/1000, gain));
  }
  // arpeggiate ascending, then strike the whole set together (good for chords)
  function hearNotes(midiArr){
    ac().resume();
    const STEP=0.55, RING=0.7;
    midiArr.forEach((n,i)=> playMidi(n, RING, i*STEP, 0.16));
    const block = midiArr.length*STEP + 0.25;
    midiArr.forEach(n=> playMidi(n, 1.6, block, 0.13));
  }
  function stopAll(){ active.forEach(n=>{ try{ n.stop(); }catch(e){} }); active.clear(); }

  return { ac, INSTRUMENTS, LOW, HIGH, loadInstrument, playNote, playNotes, hearNotes, stopAll,
           setInstrument:k=>{ current=k; }, current:()=>current };
})();
