/* Trainer.piano — on-screen keyboard factory. Handles rendering, held state,
   mouse/touch latch, target highlighting, and sound-on-press. MIDI is fed in via
   the returned noteOn/noteOff. */
window.Trainer = window.Trainer || {};
Trainer.piano = (function(){
  "use strict";
  const isBlack = pc => [1,3,6,8,10].includes(pc);

  function create(container, opts){
    const o = Object.assign({
      labels:true, sound:true, lowMidi:48, highMidi:84,
      onNoteOn:()=>{}, onNoteOff:()=>{}
    }, opts||{});
    const LOW=o.lowMidi, HIGH=o.highMidi;
    const NN = Trainer.theory.NOTE_NAMES;
    const held = new Map();
    let targetPcs = new Set();

    function draw(){
      container.innerHTML="";
      let whiteX=0; const whiteW=40; const positions={};
      for (let n=LOW;n<=HIGH;n++){ if(!isBlack(n%12)){ positions[n]=whiteX; whiteX+=whiteW; } }
      container.style.width=whiteX+"px";
      for (let n=LOW;n<=HIGH;n++){
        const pc=n%12;
        const k=document.createElement("div");
        k.dataset.note=n;
        if (isBlack(pc)){ k.className="key black"; k.style.left=(positions[n-1]+whiteW-13)+"px"; }
        else { k.className="key white"; k.style.left=positions[n]+"px"; }
        if (held.has(n)) k.classList.add(isBlack(pc)?"held-black":"held-white");
        if (targetPcs.has(pc)) k.classList.add("target");
        // labels: true = every key, "c" = only C's (anchor, low bloat), false = none
        const showLbl = o.labels === "c" ? pc===0 : !!o.labels;
        if (showLbl){
          const lbl=document.createElement("div"); lbl.className="lbl";
          lbl.textContent = NN[pc] + (pc===0 ? Math.floor(n/12)-1 : "");
          k.appendChild(lbl);
        }
        container.appendChild(k);
      }
    }
    function noteOn(n){
      if (held.has(n)) return;
      held.set(n,true);
      if (o.sound && window.Trainer.audio) Trainer.audio.playNote(n, 900, 0, 0.16);
      draw(); o.onNoteOn(n);
    }
    function noteOff(n){
      if (!held.has(n)) return;
      held.delete(n);
      draw(); o.onNoteOff(n);
    }
    function latch(n){ if(n==null) return; held.has(n) ? noteOff(n) : noteOn(n); }
    function keyFromEl(t){ const k=t&&t.closest&&t.closest(".key"); return k?+k.dataset.note:null; }
    container.addEventListener("mousedown", e=>{ e.preventDefault(); latch(keyFromEl(e.target)); });
    container.addEventListener("touchstart", e=>{ e.preventDefault();
      latch(keyFromEl(document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY))); }, {passive:false});

    draw();
    return {
      draw, noteOn, noteOff, held,
      highlight(arr){ targetPcs = new Set(arr.map(x=>((x%12)+12)%12)); draw(); },
      clearHighlight(){ targetPcs = new Set(); draw(); },
      clear(){ held.clear(); targetPcs = new Set(); draw(); },
      setLabels(b){ o.labels=b; draw(); },
      setSound(b){ o.sound=b; },
    };
  }
  return { create, isBlack };
})();
