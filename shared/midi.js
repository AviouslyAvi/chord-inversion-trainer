/* Trainer.midi — Web MIDI input: device selection, binding, status, and a
   browser-support help banner. Feeds note events to the exercise via callbacks. */
window.Trainer = window.Trainer || {};
Trainer.midi = (function(){
  "use strict";
  function onMsg(e, cb){
    const [cmd,note,vel]=e.data; const type=cmd&0xf0;
    if (type===0x90 && vel>0) cb.onNoteOn(note);
    else if (type===0x80 || (type===0x90 && vel===0)) cb.onNoteOff(note);
  }
  function setStatus(el, msg, ok){ if(!el) return; el.textContent=msg; el.className="status"+(ok?" connected":""); }

  function detectBrowser(){
    const ua = navigator.userAgent;
    const isGecko = ("MozAppearance" in document.documentElement.style) || /firefox|gecko\//i.test(ua);
    if (isGecko) return "gecko"; // Firefox, and Firefox-based browsers like Zen
    const isSafari = /safari/i.test(ua) && !/chrome|chromium|crios|android|edg|fxios/i.test(ua);
    if (isSafari) return "safari";
    return "other";
  }
  function showHelp(el, reason){
    if (!el) return;
    const b = detectBrowser();
    let html;
    if (b === "gecko"){
      html = `<h4>⚠️ Web MIDI is turned off in your browser (Firefox / Zen family)</h4>
        Zen is built on Firefox, which ships with Web MIDI <b>disabled</b>. To turn it on:
        <ol>
          <li>Open a new tab and go to <code>about:config</code>, then accept the warning.</li>
          <li>Search for <code>webmidi</code>.</li>
          <li>Double-click <code>dom.webmidi.enabled</code> so it reads <b>true</b>.</li>
          <li>Fully restart the browser, reload this page, and allow the MIDI permission if prompted.</li>
        </ol>
        Still not connecting? Try also setting <code>dom.webmidi.gated</code> to <b>false</b>. If your device still doesn't appear, open this page in <b>Chrome, Edge, or Brave</b> — it just works there. Mouse &amp; touch work here either way.`;
    } else if (b === "safari"){
      html = `<h4>⚠️ Safari doesn't support Web MIDI</h4>
        Safari (WebKit) has no Web MIDI at all. Open this page in <b>Chrome, Edge, or Brave</b> to use your MIDI keyboard. Mouse &amp; touch work here either way.`;
    } else {
      html = `<h4>⚠️ MIDI isn't available in this browser</h4>
        ${reason === "denied" ? "MIDI access was blocked — check the site permissions and reload." : "Web MIDI didn't load. Try <b>Chrome, Edge, or Brave</b>, and make sure the page is served over HTTPS."} Mouse &amp; touch work here either way.`;
    }
    html += ` <button class="linkbtn dismiss">dismiss ✕</button>`;
    el.innerHTML = html;
    el.style.display = "block";
    const d = el.querySelector(".dismiss");
    if (d) d.onclick = ()=>{ el.style.display="none"; };
  }

  function init(cfg){
    const { onNoteOn=()=>{}, onNoteOff=()=>{}, selectEl, statusEl, helpEl } = cfg || {};
    const cb = { onNoteOn, onNoteOff };
    let access = null;

    function bind(){
      if (!access) return;
      const sel = selectEl ? selectEl.value : "all";
      [...access.inputs.values()].forEach(inp=>{
        inp.onmidimessage = (sel==="all" || sel===inp.id) ? (e=>onMsg(e,cb)) : null;
      });
    }
    function refresh(){
      if (!access || !selectEl) return;
      const inputs = [...access.inputs.values()];
      const prev = selectEl.value;
      selectEl.innerHTML = "";
      if (!inputs.length){
        selectEl.innerHTML = '<option value="all">No MIDI device found</option>';
        setStatus(statusEl, "No MIDI device — plug in (or use mouse/touch)", false);
      } else {
        const all=document.createElement("option"); all.value="all"; all.textContent="🎹 All MIDI devices"; selectEl.appendChild(all);
        inputs.forEach(inp=>{ const op=document.createElement("option"); op.value=inp.id; op.textContent=inp.name; selectEl.appendChild(op); });
        if ([...selectEl.options].some(op=>op.value===prev)) selectEl.value = prev;
        setStatus(statusEl, "🎹 " + inputs.map(i=>i.name).join(", "), true);
      }
      bind();
    }

    if (selectEl) selectEl.onchange = bind;
    if (!navigator.requestMIDIAccess){
      setStatus(statusEl, "No Web MIDI in this browser — see note above · mouse/touch works", false);
      if (selectEl) selectEl.innerHTML = '<option>MIDI unsupported here</option>';
      showHelp(helpEl, "unsupported");
      return { refresh:()=>{}, bind:()=>{} };
    }
    navigator.requestMIDIAccess().then(a=>{
      access = a; refresh(); a.onstatechange = refresh;
    }).catch(()=>{
      setStatus(statusEl, "MIDI blocked — mouse/touch still works", false);
      if (selectEl) selectEl.innerHTML = '<option>MIDI blocked</option>';
      showHelp(helpEl, "denied");
    });
    return { refresh, bind };
  }

  return { init, setStatus, showHelp, detectBrowser };
})();
