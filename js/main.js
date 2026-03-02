/* =========================================================
   RidgeRelay — Demo App Logic (GitHub Pages Friendly)
   ---------------------------------------------------------
   Goals:
   - Familiar Explore/Saved/Plan/Safety structure
   - Engagement hooks: Save/Heart + browse cards
   - Safety remains the purpose (not social-first)
   - No backend required (localStorage only)
   ========================================================= */

"use strict";

/* -----------------------------
   Demo Data (replace later)
----------------------------- */
const TRAILS = [
  { id: "t1", name: "Rattlesnake Ledge (Demo)", difficulty: "moderate", distance: "4.0 mi", elevation: "1,160 ft", signal: "mixed", area: "WA" },
  { id: "t2", name: "Point Defiance Loop (Demo)", difficulty: "easy", distance: "5.0 mi", elevation: "350 ft", signal: "good", area: "Tacoma" },
  { id: "t3", name: "Mailbox Peak (Demo)", difficulty: "hard", distance: "9.4 mi", elevation: "4,000 ft", signal: "low-signal", area: "WA" },
  { id: "t4", name: "Snow Lake (Demo)", difficulty: "moderate", distance: "7.2 mi", elevation: "1,800 ft", signal: "mixed", area: "WA" },
  { id: "t5", name: "Tolmie Peak (Demo)", difficulty: "moderate", distance: "5.6 mi", elevation: "1,500 ft", signal: "low-signal", area: "Rainier" },
  { id: "t6", name: "Discovery Park Loop (Demo)", difficulty: "easy", distance: "2.8 mi", elevation: "250 ft", signal: "good", area: "Seattle" },
];

const LS_SAVED = "rr_saved_trails";

/* -----------------------------
   Helpers
----------------------------- */
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return document.querySelectorAll(sel); }

function getSavedSet(){
  try {
    const raw = localStorage.getItem(LS_SAVED);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}
function setSavedSet(set){
  localStorage.setItem(LS_SAVED, JSON.stringify([...set]));
}

/* -----------------------------
   Navigation (screens)
----------------------------- */
const screens = $all(".rr-screen");
const navButtons = $all("[data-nav]");

function showScreen(id){
  screens.forEach(s => s.classList.remove("show"));
  const target = document.getElementById(id);
  if (target) target.classList.add("show");

  // Sidebar active
  $all(".rr-navitem").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.nav === id);
  });

  // Bottom nav active
  $all(".rr-tab").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.nav === id);
  });

  // When entering Saved, refresh it
  if (id === "screen-saved") renderSaved();
}

navButtons.forEach(btn=>{
  btn.addEventListener("click", ()=> showScreen(btn.dataset.nav));
});

/* -----------------------------
   Render Trails
----------------------------- */
function trailCard(trail, savedSet){
  const isSaved = savedSet.has(trail.id);

  const el = document.createElement("div");
  el.className = "rr-card";

  el.innerHTML = `
    <div class="rr-row">
      <div>
        <h3>${trail.name}</h3>
        <div class="rr-muted">${trail.area} • Signal: ${trail.signal}</div>
      </div>
      <button class="rr-heart ${isSaved ? "on" : ""}" data-heart="${trail.id}" aria-label="Save trail">
        ${isSaved ? "♥" : "♡"}
      </button>
    </div>

    <div class="rr-trailmeta">
      <span>Difficulty: <strong>${trail.difficulty}</strong></span>
      <span>Distance: <strong>${trail.distance}</strong></span>
      <span>Gain: <strong>${trail.elevation}</strong></span>
    </div>

    <div class="rr-actions">
      <button class="rr-btn rr-btn-ghost" data-view="${trail.id}">Details</button>
      <button class="rr-btn rr-btn-primary" data-plan="${trail.id}">Plan</button>
    </div>
  `;

  return el;
}

function renderTrails(list){
  const grid = $("#trailGrid");
  if (!grid) return;

  const saved = getSavedSet();
  grid.innerHTML = "";
  list.forEach(t => grid.appendChild(trailCard(t, saved)));

  // Hook hearts
  $all("[data-heart]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-heart");
      const set = getSavedSet();
      if (set.has(id)) set.delete(id);
      else set.add(id);
      setSavedSet(set);
      renderTrails(list); // re-render quickly for demo
    });
  });

  // Hook plan buttons
  $all("[data-plan]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-plan");
      const trail = TRAILS.find(t => t.id === id);
      hydratePlan(trail);
      showScreen("screen-plan");
    });
  });

  // “Details” placeholder (for later)
  $all("[data-view]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-view");
      alert(`Demo: Trail details for ${id}.\nNext step: add a real details page layout like AllTrails.`);
    });
  });
}

function renderSaved(){
  const grid = $("#savedGrid");
  if (!grid) return;

  const saved = getSavedSet();
  const savedTrails = TRAILS.filter(t => saved.has(t.id));

  grid.innerHTML = "";
  if (savedTrails.length === 0){
    const empty = document.createElement("div");
    empty.className = "rr-card";
    empty.innerHTML = `<h3>No saved trails yet</h3><p class="rr-muted">Heart a trail in Explore to add it here.</p>`;
    grid.appendChild(empty);
    return;
  }

  savedTrails.forEach(t => grid.appendChild(trailCard(t, saved)));

  // Re-bind hearts within saved view
  $all("[data-heart]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-heart");
      const set = getSavedSet();
      if (set.has(id)) set.delete(id);
      else set.add(id);
      setSavedSet(set);
      renderSaved();
    });
  });

  // Plan buttons
  $all("[data-plan]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-plan");
      const trail = TRAILS.find(t => t.id === id);
      hydratePlan(trail);
      showScreen("screen-plan");
    });
  });
}

/* -----------------------------
   Plan Screen hydration
----------------------------- */
function hydratePlan(trail){
  const select = $("#trailSelect");
  if (!select) return;

  select.innerHTML = "";
  TRAILS.forEach(t=>{
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    select.appendChild(opt);
  });

  if (trail) select.value = trail.id;
}

/* -----------------------------
   Filters + search (demo)
----------------------------- */
let activeFilter = "all";

function applyFilter(){
  let list = [...TRAILS];

  if (activeFilter !== "all"){
    if (activeFilter === "low-signal"){
      list = list.filter(t => t.signal === "low-signal");
    } else {
      list = list.filter(t => t.difficulty === activeFilter);
    }
  }

  const q = ($("#searchInput")?.value || "").trim().toLowerCase();
  if (q){
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.area.toLowerCase().includes(q)
    );
  }

  renderTrails(list);
}

$all("[data-filter]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    $all(".rr-chip").forEach(x => x.classList.remove("rr-chip-active"));
    btn.classList.add("rr-chip-active");
    activeFilter = btn.getAttribute("data-filter");
    applyFilter();
  });
});

$("#btnSearch")?.addEventListener("click", applyFilter);
$("#searchInput")?.addEventListener("keydown", (e)=>{
  if (e.key === "Enter") applyFilter();
});

/* -----------------------------
   Active Trip demo events
----------------------------- */
const statusBadge = $("#statusBadge");
const statusDetail = $("#statusDetail");
const eventFeed = $("#eventFeed");

function logEvent(text){
  if (!eventFeed) return;
  const item = document.createElement("div");
  item.className = "rr-feeditem";
  item.innerHTML = `<span class="rr-time">Now</span> ${text}`;
  eventFeed.prepend(item);
}

$("#btnBoundary")?.addEventListener("click", ()=>{
  statusBadge.textContent = "Deviation";
  statusBadge.className = "rr-badge rr-badge-warn";
  statusDetail.textContent = "Outside corridor. Intent confirmation requested (demo).";
  logEvent("Deviation detected. User prompted: “Did you mean to leave your route?”");
});

$("#btnInactivity")?.addEventListener("click", ()=>{
  statusBadge.textContent = "Inactive";
  statusBadge.className = "rr-badge rr-badge-warn";
  statusDetail.textContent = "No movement detected. Check-in initiated (demo).";
  logEvent("Inactivity threshold reached. Check-in prompt sent.");
});

$("#btnOffline")?.addEventListener("click", ()=>{
  statusBadge.textContent = "Offline";
  statusBadge.className = "rr-badge rr-badge-bad";
  statusDetail.textContent = "Signal lost. Holding last known corridor segment (demo).";
  logEvent("Signal lost. System shifts to low-power monitoring behavior.");
});

$("#btnSOS")?.addEventListener("click", ()=>{
  statusBadge.textContent = "SOS";
  statusBadge.className = "rr-badge rr-badge-bad";
  statusDetail.textContent = "Emergency escalation initiated (demo).";
  logEvent("SOS triggered. Escalation path would notify POC with last known data.");
});

/* -----------------------------
   Init
----------------------------- */
hydratePlan(TRAILS[0]);
renderTrails(TRAILS);
