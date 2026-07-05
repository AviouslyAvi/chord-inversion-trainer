/* Trainer.conveyor — a prev / current / next prompt strip that slides left as the
   lesson advances, so the upcoming prompt eases into the "now" slot. Content is
   arbitrary HTML (a letter, a chord name, a staff SVG), so every course reuses it.

   The course owns the queue (what the next prompt is); the conveyor only handles
   layout + the slide animation. Two entry points:
     reset(curHtml, nextHtml)   start fresh — no previous, current centered
     advance(newNextHtml)       slide left: cur→prev, next→cur, newNext eases in
*/
window.Trainer = window.Trainer || {};
Trainer.conveyor = (function(){
  "use strict";

  function create(mountEl){
    const el = document.createElement("div");
    el.className = "conveyor";
    mountEl.appendChild(el);

    // live references to the three on-stage items
    let prevEl = null, curEl = null, nextEl = null;

    function make(html, pos){
      const d = document.createElement("div");
      d.className = "conv-item " + pos;
      d.innerHTML = html;
      el.appendChild(d);
      return d;
    }
    function retire(node){
      if (!node) return;
      node.className = "conv-item pos-out";
      // remove after the slide finishes (transition ~ .4s)
      setTimeout(()=>{ if (node && node.parentNode) node.parentNode.removeChild(node); }, 460);
    }

    function reset(curHtml, nextHtml){
      el.innerHTML = "";
      prevEl = null;
      curEl  = make(curHtml, "pos-cur");
      nextEl = (nextHtml != null) ? make(nextHtml, "pos-next") : null;
    }

    function advance(newNextHtml){
      retire(prevEl);                       // old previous drifts off the left
      if (curEl)  curEl.className  = "conv-item pos-prev";
      if (nextEl) nextEl.className = "conv-item pos-cur";
      prevEl = curEl;
      curEl  = nextEl;
      if (newNextHtml != null){
        nextEl = make(newNextHtml, "pos-in");   // start off-stage right...
        void nextEl.offsetWidth;                // reflow so the transition runs
        nextEl.className = "conv-item pos-next"; // ...then ease into the next slot
      } else {
        nextEl = null;
      }
    }

    function setCur(html){ if (curEl) curEl.innerHTML = html; }  // re-render current in place

    return {
      el, reset, advance, setCur,
      show(){ el.hidden = false; },
      hide(){ el.hidden = true; },
      clear(){ el.innerHTML = ""; prevEl = curEl = nextEl = null; },
    };
  }

  return { create };
})();
