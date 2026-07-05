/* Trainer.curriculum — generic, TypingClub-style course engine.

   Renders a level-tile map from a COURSE definition, computes unlock state,
   persists per-lesson stars, and hands the page a controller. The prompt loop
   itself is domain-specific and lives in the exercise page: the engine calls
   onPlay(lesson, controller) when an unlocked tile is clicked, and the page
   drives the lesson, then calls controller.record(id, result) + showMap().

   Reuse: the same map/unlock/stars machinery hosts any lesson type. A future
   "campaign over existing modules" only needs a different onPlay + a lesson
   whose type deep-links into another exercise — no engine change. */
window.Trainer = window.Trainer || {};
Trainer.curriculum = (function(){
  "use strict";

  // lesson-type → tile icon (open registry: add a type, add an icon)
  const ICONS = { intro:"🎹", keys:"📦", learn:"🧩", review:"🔍", practice:"⏱️", play:"🥷", module:"🎯", free:"⚙️" };

  // Accuracy-first star score (TypingClub weights accuracy over speed).
  // `fast` grants one speed star once accuracy is already solid.
  function starsFor(accuracy, opts){
    opts = opts || {};
    let s;
    if (accuracy >= 0.98) s = 5;
    else if (accuracy >= 0.92) s = 4;
    else if (accuracy >= 0.82) s = 3;
    else if (accuracy >= 0.70) s = 2;
    else if (accuracy >= 0.50) s = 1;
    else s = 0;
    if (opts.fast && accuracy >= 0.85 && s < 5) s += 1;
    return s;
  }

  function starPips(n, max){
    max = max || 5;
    let h = "";
    for (let i=0;i<max;i++) h += `<span class="pip${i<n?" on":""}">${i<n?"★":"☆"}</span>`;
    return h;
  }

  function mount(cfg){
    const { mountEl, course, store, onPlay, onFreePractice } = cfg;

    // Flatten lessons and compute the cumulative note pool at each lesson.
    const flat = [];
    course.units.forEach((u,ui) => u.lessons.forEach(l => { l._unit = u.title; l._unitIdx = ui; flat.push(l); }));
    let pool = [];
    flat.forEach(l => {
      if (l.notes && l.notes.length){
        const set = new Set(pool.concat(l.notes));
        pool = Array.from(set).sort((a,b)=>a-b);
      }
      l._pool = pool.slice();
    });

    // Per-unit content, for the Free Practice panel ("only the things from this unit").
    course.units.forEach((u,ui) => {
      const notes = new Set(), qtypes = [];
      u.lessons.forEach(l => {
        (l.notes||[]).forEach(n => notes.add(n));
        (l.q||[]).forEach(q => { if (!qtypes.includes(q)) qtypes.push(q); });
      });
      u._idx = ui;
      u._notes = Array.from(notes).sort((a,b)=>a-b);
      u._qtypes = qtypes;
      // does this unit teach/touch inversions? (drives the inverted-review toggle)
      u._hasInv = u.lessons.some(l => l.inv || /invers/i.test(l.title||""));
      u._firstLesson = u.lessons[0];
    });

    store.data.lessons = store.data.lessons || {};
    const rec      = id => store.data.lessons[id];
    const getStars = id => (rec(id) && rec(id).stars) || 0;
    const idxOf    = id => flat.findIndex(l => l.id === id);
    const isUnlocked = l => { const i = idxOf(l.id); return i <= 0 || getStars(flat[i-1].id) >= 1; };

    function record(id, result){
      const prev = rec(id) || {};
      // keep the best star run, but always bump the play counter
      const best = Math.max(prev.stars || 0, result.stars || 0);
      store.data.lessons[id] = Object.assign({}, prev, result, { stars: best, plays: (prev.plays||0)+1 });
      store.save();
      renderMap();
    }

    function renderMap(){
      let n = 0;
      const unitsHtml = course.units.map(u => {
        const tiles = u.lessons.map(l => {
          n += 1;
          const stars = getStars(l.id);
          const unlocked = isUnlocked(l);
          const done = stars >= 1;
          const cls = "tile" + (unlocked ? "" : " locked") + (done ? " done" : "");
          const badge = unlocked
            ? `<div class="stars">${starPips(stars)}</div>`
            : `<div class="lock">🔒</div>`;
          return `<button class="${cls}" data-id="${l.id}" ${unlocked?"":"disabled"}>
              <span class="num">${n}</span>
              <span class="tico">${ICONS[l.type] || "•"}</span>
              <span class="tname">${l.title}</span>
              ${badge}
            </button>`;
        }).join("");
        // Free Practice tile — one per unit, drills only that unit's content.
        // Available once the unit is reachable (its first lesson is unlocked).
        let freeTile = "";
        if (onFreePractice && isUnlocked(u._firstLesson)){
          freeTile = `<button class="tile free" data-free="${u._idx}">
              <span class="num">∞</span>
              <span class="tico">${ICONS.free}</span>
              <span class="tname">Free Practice</span>
              <div class="freehint">customize this unit</div>
            </button>`;
        }
        return `<section class="unit">
            <h2 class="unit-title">${u.title}</h2>
            <div class="tiles">${tiles}${freeTile}</div>
          </section>`;
      }).join("");
      mapEl.innerHTML = unitsHtml;
      mapEl.querySelectorAll(".tile:not(.locked)").forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.free != null){ onFreePractice(course.units[+btn.dataset.free], controller); return; }
          const l = flat.find(x => x.id === btn.dataset.id);
          if (l) onPlay(l, controller);
        };
      });
    }

    // Two regions inside the mount: the map grid and the (page-owned) lesson view.
    const mapEl = document.createElement("div");
    mapEl.className = "course-map";
    const lessonEl = mountEl.querySelector("#lesson");
    mountEl.insertBefore(mapEl, lessonEl);

    function showMap(){ lessonEl.hidden = true; mapEl.hidden = false; }
    function showLesson(){ mapEl.hidden = true; lessonEl.hidden = false; }

    const controller = {
      showMap, showLesson, record, getStars,
      poolFor: l => l._pool,
      lessonById: id => flat.find(l => l.id === id),
      indexOf: idxOf, flat,
      resetProgress(){ store.data.lessons = {}; store.resetAll(); renderMap(); },
    };

    renderMap();
    showMap();
    return controller;
  }

  return { mount, starsFor, starPips, ICONS };
})();
