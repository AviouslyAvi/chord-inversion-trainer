/* Trainer.shell — builds the shared page chrome: a topbar (brand, MIDI device
   selector, status, ⚙ gear) + a MIDI help banner + a single settings modal
   overlay. Exercises supply their settings as [{title, html}] sections and query
   the injected inputs by id after mount. */
window.Trainer = window.Trainer || {};
Trainer.shell = (function(){
  "use strict";
  function mount(opts){
    const { mountEl, title="Trainer", subtitle="", settingsSections=[], home=true } = opts || {};

    const topbar = document.createElement("div");
    topbar.className = "topbar";
    topbar.innerHTML = `
      <div class="brand">
        ${home ? '<a href="../index.html" class="home" title="All exercises" aria-label="All exercises">←</a>' : ''}
        <span class="dot"></span>${title}${subtitle ? ` <small>— ${subtitle}</small>` : ''}
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="midiSel" class="picker" title="MIDI input device"><option>MIDI: scanning…</option></select>
        <div id="status" class="status">Looking for MIDI…</div>
        <button id="settingsBtn" class="iconbtn" title="Settings" aria-label="Settings">⚙️</button>
      </div>`;
    mountEl.prepend(topbar);

    const help = document.createElement("div");
    help.id = "midiHelp"; help.className = "midihelp"; help.style.display = "none";
    topbar.after(help);

    const modal = document.createElement("div");
    modal.className = "modal-backdrop"; modal.id = "settingsModal";
    modal.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="modal-head">Settings
          <button id="settingsClose" class="modal-close" aria-label="Close settings">✕</button>
        </div>
        <div class="modal-body settings-body">
          ${settingsSections.map(s=>`<div class="modal-section"><div class="sec-title">${s.title}</div>${s.html}</div>`).join("")}
        </div>
      </div>`;
    document.body.appendChild(modal);

    const open  = ()=> modal.classList.add("open");
    const close = ()=> modal.classList.remove("open");
    topbar.querySelector("#settingsBtn").onclick = open;
    modal.querySelector("#settingsClose").onclick = close;
    modal.addEventListener("click", e=>{ if(e.target===modal) close(); });
    document.addEventListener("keydown", e=>{ if(e.key==="Escape" && modal.classList.contains("open")) close(); });

    return {
      openSettings: open, closeSettings: close, modalEl: modal,
      isSettingsOpen: ()=> modal.classList.contains("open"),
      midiSelectEl: topbar.querySelector("#midiSel"),
      statusEl: topbar.querySelector("#status"),
      helpEl: help,
    };
  }
  return { mount };
})();
