/* Trainer.store — localStorage-backed per-exercise progress (stats + weak-spot
   miss counts). Namespaced by a storeKey so each exercise keeps separate history. */
window.Trainer = window.Trainer || {};
Trainer.store = (function(){
  "use strict";
  function read(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }

  // open("chord-id") or open("chord-inversion", "chordTrainer.v2") to migrate an old key
  function open(storeKey, migrateFrom){
    const KEY = "trainer." + storeKey;
    let data = read(KEY);
    if (!data && migrateFrom){ const old = read(migrateFrom); if (old) data = old; }
    data = data || {};
    data.correct = data.correct || 0;
    data.total   = data.total   || 0;
    data.best    = data.best    || 0;
    data.misses  = data.misses  || {};

    function save(){ try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){} }

    return {
      data,
      misses: data.misses,
      get correct(){ return data.correct; }, set correct(v){ data.correct = v; },
      get total(){ return data.total; },     set total(v){ data.total = v; },
      get best(){ return data.best; },       set best(v){ data.best = v; },
      bumpMiss(key){ data.misses[key] = (data.misses[key]||0) + 1; },
      weightFor(key){ return 1 + (data.misses[key]||0)*2; },
      save,
      resetAll(){
        data.correct = 0; data.total = 0; data.best = 0;
        Object.keys(data.misses).forEach(k=> delete data.misses[k]);
        save();
      },
    };
  }
  return { open };
})();
