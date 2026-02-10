/* ==========================================================================
   RidgeRelay — main.js (v4)
   - Sticky header elevation
   - Mobile drawer nav (accessible)
   - Tabs (planner)
   - Dropdown tools close behavior
   - Leaflet map + local GeoJSON overlay + toggles
   - Live summary + gentle risk meter
   - Save/Load plan (localStorage)
   - Copy share text + download plan + print
   - Pets: include pet in share + lost pet report + photo preview (local only)
   - FAQ search
   - Toast + back-to-top
   ========================================================================== */

const DEMO = {
  trailName: "Rattlesnake Ridge / Rattlesnake Ledge, WA (Demo)",
  googleMaps: "https://maps.app.goo.gl/r79LstcUM4UWg4s27",
  allTrails: "https://www.alltrails.com/trail/us/washington/rattlesnake-ledge",
  geojsonUrl: "./assets/maps/rattlesnake-ridge-demo.geojson",
  // Map default center (approx Rattlesnake Ledge area)
  defaultView: { lat: 47.485, lng: -121.786, zoom: 12 }
};

const STORAGE_KEYS = {
  plan: "ridgerelay_demo_plan_v4",
  petReport: "ridgerelay_demo_pet_report_v4"
};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-visible");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove("is-visible"), 2200);
}

function prettyDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------------
   Sticky header elevation
----------------------------- */
(function headerElevation() {
  const header = $(".site-header");
  if (!header) return;

  const onScroll = () => {
    const elevated = window.scrollY > 8;
    header.setAttribute("data-elevate", elevated ? "true" : "false");
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* -----------------------------
   Mobile drawer menu
----------------------------- */
(function mobileMenu() {
  const btn = $("#menuBtn");
  const drawer = $("#mobileDrawer");
  if (!btn || !drawer) return;

  const links = drawer.querySelectorAll("a");

  function openDrawer() {
    drawer.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close menu");
  }

  function closeDrawer() {
    drawer.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
  }

  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    isOpen ? closeDrawer() : openDrawer();
  });

  links.forEach(a => a.addEventListener("click", closeDrawer));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  window.addEventListener("resize", () => {
    // Drawer is always mobile style here, but prevent stuck open on wide layouts
    if (window.innerWidth >= 980) closeDrawer();
  });
})();

/* -----------------------------
   Tabs (planner)
----------------------------- */
(function tabs() {
  const tabBtns = $all(".tab");
  const panels = $all(".panel");
  if (!tabBtns.length || !panels.length) return;

  function activate(name) {
    tabBtns.forEach(b => {
      const active = b.dataset.tab === name;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
      if (active) b.focus({ preventScroll: true });
    });

    panels.forEach(p => p.classList.toggle("is-active", p.id === `panel-${name}`));
  }

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => activate(btn.dataset.tab));
    btn.addEventListener("keydown", (e) => {
      // Basic arrow nav between tabs
      const idx = tabBtns.indexOf(btn);
      if (e.key === "ArrowRight") tabBtns[(idx + 1) % tabBtns.length].click();
      if (e.key === "ArrowLeft") tabBtns[(idx - 1 + tabBtns.length) % tabBtns.length].click();
    });
  });
})();

/* -----------------------------
   Dropdown tools: close on outside click / Escape
----------------------------- */
(function dropdownClose() {
  const dd = $("#toolsDropdown");
  if (!dd) return;

  document.addEventListener("click", (e) => {
    if (!dd.open) return;
    if (!dd.contains(e.target)) dd.open = false;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dd.open) dd.open = false;
  });
})();

/* -----------------------------
   Defaults + live summary + risk meter + share text
----------------------------- */
function getPlan() {
  return {
    trailName: $("#trailName")?.value || DEMO.trailName,
    intent: $("#intent")?.value?.trim() || "",
    startTime: $("#startTime")?.value || "",
    returnTime: $("#returnTime")?.value || "",
    cadence: $("#cadence")?.value || "60",
    emergency: $("#emergency")?.value?.trim() || "",
    vehicle: $("#vehicle")?.value?.trim() || "",
    partySize: $("#partySize")?.value || "",
    weatherRisk: $("#weatherRisk")?.value || "",
    daylight: $("#daylight")?.value || "",
    gearNotes: $("#gearNotes")?.value?.trim() || "",
    readiness: {
      water: $("#chkWater")?.checked || false,
      layers: $("#chkLayers")?.checked || false,
      light: $("#chkLight")?.checked || false,
      nav: $("#chkNav")?.checked || false,
      battery: $("#chkBattery")?.checked || false,
      aid: $("#chkAid")?.checked || false,
      turn: $("#chkTurn")?.checked || false,
    },
    pet: {
      name: $("#petName")?.value?.trim() || "",
      type: $("#petType")?.value || "",
      desc: $("#petDesc")?.value?.trim() || "",
      includeInShare: $("#includePetInShare")?.checked || false
    }
  };
}

function setPlan(p) {
  if ($("#trailName")) $("#trailName").value = p.trailName ?? DEMO.trailName;
  if ($("#intent")) $("#intent").value = p.intent ?? "";
  if ($("#startTime")) $("#startTime").value = p.startTime ?? "";
  if ($("#returnTime")) $("#returnTime").value = p.returnTime ?? "";
  if ($("#cadence")) $("#cadence").value = p.cadence ?? "60";
  if ($("#emergency")) $("#emergency").value = p.emergency ?? "";

  if ($("#vehicle")) $("#vehicle").value = p.vehicle ?? "";
  if ($("#partySize")) $("#partySize").value = p.partySize ?? "2";
  if ($("#weatherRisk")) $("#weatherRisk").value = p.weatherRisk ?? "low";
  if ($("#daylight")) $("#daylight").value = p.daylight ?? "plenty";
  if ($("#gearNotes")) $("#gearNotes").value = p.gearNotes ?? "";

  const r = p.readiness || {};
  if ($("#chkWater")) $("#chkWater").checked = !!r.water;
  if ($("#chkLayers")) $("#chkLayers").checked = !!r.layers;
  if ($("#chkLight")) $("#chkLight").checked = !!r.light;
  if ($("#chkNav")) $("#chkNav").checked = !!r.nav;
  if ($("#chkBattery")) $("#chkBattery").checked = !!r.battery;
  if ($("#chkAid")) $("#chkAid").checked = !!r.aid;
  if ($("#chkTurn")) $("#chkTurn").checked = !!r.turn;

  const pet = p.pet || {};
  if ($("#petName")) $("#petName").value = pet.name ?? "";
  if ($("#petType")) $("#petType").value = pet.type ?? "Dog";
  if ($("#petDesc")) $("#petDesc").value = pet.desc ?? "";
  if ($("#includePetInShare")) $("#includePetInShare").checked = !!pet.includeInShare;

  refreshUI();
}

function defaultPlan() {
  // Prefill: calm + realistic
  return {
    trailName: DEMO.trailName,
    intent:
      "Day hike to Rattlesnake Ledge. Staying on main trail. Turning around if weather shifts. Parking at the main lot.",
    startTime: "",
    returnTime: "",
    cadence: "60",
    emergency: "",
    vehicle: "",
    partySize: "2",
    weatherRisk: "low",
    daylight: "plenty",
    gearNotes: "Headlamp, extra layer, water, basic first aid",
    readiness: {
      water: false, layers: false, light: false, nav: false, battery: false, aid: false, turn: false
    },
    pet: { name: "", type: "Dog", desc: "", includeInShare: false }
  };
}

function computeRisk(plan) {
  // Gentle and explainable: encourages completeness (not a safety authority)
  let score = 0;

  // Missing key planning fields
  if (!plan.intent) score += 1;
  if (!plan.emergency) score += 2;

  // Check-in cadence: longer = higher risk
  const cad = Number(plan.cadence || "60");
  if (cad >= 90) score += 2;
  else if (cad >= 60) score += 1;

  // Duration: if both times present and long
  if (plan.startTime && plan.returnTime) {
    const a = new Date(plan.startTime).getTime();
    const b = new Date(plan.returnTime).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) {
      const hrs = (b - a) / 36e5;
      if (hrs >= 6) score += 2;
      else if (hrs >= 4) score += 1;
    } else {
      score += 1; // bad time order
    }
  } else {
    score += 1; // missing time completeness
  }

  // Readiness completeness
  const readyCount = Object.values(plan.readiness || {}).filter(Boolean).length;
  if (readyCount <= 2) score += 2;
  else if (readyCount <= 4) score += 1;

  // Optional: weather risk + daylight
  if (plan.weatherRisk === "high") score += 2;
  else if (plan.weatherRisk === "med") score += 1;

  if (plan.daylight === "low") score += 2;
  else if (plan.daylight === "tight") score += 1;

  // Clamp + label
  if (score <= 3) return { level: "low", label: "Risk: Low (demo)" };
  if (score <= 7) return { level: "med", label: "Risk: Medium (demo)" };
  return { level: "high", label: "Risk: High (demo)" };
}

function buildShareText(plan) {
  const start = prettyDate(plan.startTime);
  const ret = prettyDate(plan.returnTime);
  const cadenceLabel = plan.cadence ? `Every ${plan.cadence} minutes` : "—";

  const lines = [];
  lines.push("RidgeRelay Trip Plan (Demo)");
  lines.push(`Trail: ${plan.trailName}`);
  lines.push(`Start: ${start}`);
  lines.push(`Expected return: ${ret}`);
  lines.push(`Check-ins: ${cadenceLabel}`);
  lines.push(`Emergency contact: ${plan.emergency || "—"}`);
  lines.push("");

  lines.push("Intent:");
  lines.push(plan.intent || "—");
  lines.push("");

  if (plan.vehicle) lines.push(`Vehicle/Plate: ${plan.vehicle}`);
  if (plan.partySize) lines.push(`Party size: ${plan.partySize}`);
  if (plan.gearNotes) lines.push(`Gear notes: ${plan.gearNotes}`);
  lines.push("");

  if (plan.pet?.includeInShare && (plan.pet.name || plan.pet.desc)) {
    lines.push("Pet (optional):");
    lines.push(`- ${plan.pet.type || "Pet"}: ${plan.pet.name || "—"}`);
    lines.push(`- Description: ${plan.pet.desc || "—"}`);
    lines.push("");
  }

  lines.push("References:");
  lines.push(`Google Maps: ${DEMO.googleMaps}`);
  lines.push(`AllTrails: ${DEMO.allTrails}`);
  lines.push("");
  lines.push("Prototype note: Static demo — no data sent anywhere.");

  return lines.join("\n");
}

function refreshUI() {
  const plan = getPlan();

  // Summary
  if ($("#sumTrail")) $("#sumTrail").textContent = plan.trailName || "—";
  if ($("#sumStart")) $("#sumStart").textContent = prettyDate(plan.startTime);
  if ($("#sumReturn")) $("#sumReturn").textContent = prettyDate(plan.returnTime);
  if ($("#sumCadence")) $("#sumCadence").textContent = plan.cadence ? `Every ${plan.cadence} minutes` : "—";
  if ($("#sumEmergency")) $("#sumEmergency").textContent = plan.emergency || "—";

  const intentShort = plan.intent ? plan.intent.slice(0, 140) + (plan.intent.length > 140 ? "…" : "") : "—";
  if ($("#sumIntent")) $("#sumIntent").textContent = intentShort;

  // Risk
  const risk = computeRisk(plan);
  const badge = $("#riskBadge");
  if (badge) {
    badge.textContent = risk.label;
    badge.classList.remove("low", "med", "high");
    badge.classList.add(risk.level);
  }

  // Share
  const share = $("#shareText");
  if (share) share.value = buildShareText(plan);

  // Pet report preview
  refreshPetReportText();
}

function wireLiveUpdates() {
  const ids = [
    "#intent","#startTime","#returnTime","#cadence","#emergency",
    "#vehicle","#partySize","#weatherRisk","#daylight","#gearNotes",
    "#chkWater","#chkLayers","#chkLight","#chkNav","#chkBattery","#chkAid","#chkTurn",
    "#petName","#petType","#petDesc","#includePetInShare",
    "#seenDesc","#seenWhere","#seenTime"
  ];
  ids.forEach(sel => {
    const el = $(sel);
    if (!el) return;
    el.addEventListener("input", refreshUI);
    el.addEventListener("change", refreshUI);
  });
}

/* -----------------------------
   Demo interactions: Start Trip + Contact demo + Readiness all
----------------------------- */
(function demoButtons() {
  const startBtn = $("#startTripBtn");
  const demoStatus = $("#demoStatus");

  if (startBtn && demoStatus) {
    startBtn.addEventListener("click", () => {
      const plan = getPlan();
      demoStatus.innerHTML = `
        <strong>Demo started.</strong><br/>
        <span>Trail:</span> ${escapeHtml(plan.trailName)}<br/>
        <span>Start:</span> ${escapeHtml(prettyDate(plan.startTime))}<br/>
        <span>Expected return:</span> ${escapeHtml(prettyDate(plan.returnTime))}<br/>
        <span>Check-ins:</span> Every ${escapeHtml(String(plan.cadence))} minutes<br/>
        <span>Emergency contact:</span> ${escapeHtml(plan.emergency || "—")}<br/>
        <em>Prototype note:</em> No data is sent anywhere.
      `;
      toast("Demo started (no data sent).");
    });
  }

  const contactBtn = $("#contactBtn");
  const contactStatus = $("#contactStatus");
  if (contactBtn && contactStatus) {
    contactBtn.addEventListener("click", () => {
      contactStatus.textContent = "Demo only — this site is static. Use the email button to send feedback.";
      toast("Contact form is demo-only.");
    });
  }

  const readyAll = $("#readyAllBtn");
  if (readyAll) {
    readyAll.addEventListener("click", () => {
      ["#chkWater","#chkLayers","#chkLight","#chkNav","#chkBattery","#chkAid","#chkTurn"]
        .forEach(id => { const el = $(id); if (el) el.checked = true; });
      refreshUI();
      toast("Marked all readiness items.");
    });
  }
})();

/* -----------------------------
   Save / Load / Clear plan (localStorage)
----------------------------- */
(function persistence() {
  const saveBtn = $("#savePlanBtn");
  const loadBtn = $("#loadPlanBtn");
  const clearBtn = $("#clearPlanBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const plan = getPlan();
      localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(plan));
      toast("Saved plan locally.");
    });
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const raw = localStorage.getItem(STORAGE_KEYS.plan);
      if (!raw) return toast("No saved plan found.");
      try {
        setPlan(JSON.parse(raw));
        toast("Loaded saved plan.");
      } catch {
        toast("Saved plan was invalid.");
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.plan);
      toast("Cleared saved plan.");
    });
  }
})();

/* -----------------------------
   Download plan (.txt) + Print + Reset demo
----------------------------- */
(function exports() {
  const downloadBtn = $("#downloadPlanBtn");
  const printBtn = $("#printPlanBtn");
  const resetBtn = $("#resetDemoBtn");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const text = buildShareText(getPlan());
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "ridgerelay-demo-plan.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast("Downloaded plan text.");
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      toast("Opening print dialog…");
      window.print();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setPlan(defaultPlan());
      toast("Reset demo defaults.");
    });
  }
})();

/* -----------------------------
   Copy share text + refresh share
----------------------------- */
(function share() {
  const copyBtn = $("#copyShareBtn");
  const refreshBtn = $("#refreshShareBtn");
  const shareText = $("#shareText");

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      toast("Copied to clipboard.");
    } catch {
      // Fallback for older browsers
      const t = document.createElement("textarea");
      t.value = value;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
      toast("Copied (fallback).");
    }
  }

  if (copyBtn && shareText) {
    copyBtn.addEventListener("click", () => copyText(shareText.value));
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshUI();
      toast("Refreshed share text.");
    });
  }
})();

/* -----------------------------
   Pets: lost pet report + photo preview + save/copy
----------------------------- */
function buildPetReportText() {
  const desc = $("#seenDesc")?.value?.trim() || "—";
  const where = $("#seenWhere")?.value?.trim() || "—";
  const when = prettyDate($("#seenTime")?.value || "");

  const lines = [];
  lines.push("Lost Pet Seen (Demo Note)");
  lines.push(`Trail: ${DEMO.trailName}`);
  lines.push(`Where seen: ${where}`);
  lines.push(`Approx time: ${when}`);
  lines.push("");
  lines.push("Description:");
  lines.push(desc);
  lines.push("");
  lines.push("Prototype note: Saved locally only (no upload).");
  return lines.join("\n");
}

function refreshPetReportText() {
  const box = $("#petReportText");
  if (!box) return;
  box.value = buildPetReportText();
}

(function petModule() {
  const photo = $("#seenPhoto");
  const preview = $("#photoPreview");

  if (photo && preview) {
    photo.addEventListener("change", () => {
      preview.innerHTML = "";
      const file = photo.files?.[0];
      if (!file) return;

      const img = document.createElement("img");
      img.alt = "Selected pet photo preview (local only)";
      img.src = URL.createObjectURL(file);
      preview.appendChild(img);

      const note = document.createElement("div");
      note.className = "tiny";
      note.textContent = "Preview only (not uploaded).";
      preview.appendChild(note);

      toast("Photo preview loaded.");
    });
  }

  const saveBtn = $("#savePetReportBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const data = {
        seenDesc: $("#seenDesc")?.value || "",
        seenWhere: $("#seenWhere")?.value || "",
        seenTime: $("#seenTime")?.value || ""
        // Photo is intentionally not stored (demo + privacy + simplicity)
      };
      localStorage.setItem(STORAGE_KEYS.petReport, JSON.stringify(data));
      toast("Saved pet report locally.");
    });
  }

  const copyBtn = $("#copyPetReportBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const txt = buildPetReportText();
      try {
        await navigator.clipboard.writeText(txt);
        toast("Copied pet report text.");
      } catch {
        toast("Copy failed in this browser.");
      }
    });
  }

  // Load saved pet report on startup (if exists)
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.petReport);
    if (raw) {
      const d = JSON.parse(raw);
      if ($("#seenDesc")) $("#seenDesc").value = d.seenDesc || "";
      if ($("#seenWhere")) $("#seenWhere").value = d.seenWhere || "";
      if ($("#seenTime")) $("#seenTime").value = d.seenTime || "";
    }
  } catch { /* ignore */ }
})();

/* -----------------------------
   FAQ search (filters <details>)
----------------------------- */
(function faqSearch() {
  const input = $("#faqSearch");
  const list = $("#faqList");
  if (!input || !list) return;

  const items = Array.from(list.querySelectorAll(".faq-item"));

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    items.forEach(d => {
      const text = d.textContent?.toLowerCase() || "";
      d.style.display = text.includes(q) ? "" : "none";
    });
  });
})();

/* -----------------------------
   Back-to-top button
----------------------------- */
(function backToTop() {
  const btn = $("#toTopBtn");
  if (!btn) return;

  const onScroll = () => {
    btn.classList.toggle("is-visible", window.scrollY > 600);
  };

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* -----------------------------
   Leaflet map + GeoJSON overlay + toggles
----------------------------- */
let rrMap = null;
let rrTrailLayer = null;
let rrTrailBounds = null;

async function initMap() {
  const mapEl = $("#map");
  if (!mapEl || typeof L === "undefined") return;

  rrMap = L.map("map", {
    scrollWheelZoom: false,
    tap: true
  }).setView([DEMO.defaultView.lat, DEMO.defaultView.lng], DEMO.defaultView.zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(rrMap);

  // Load local GeoJSON
  const res = await fetch(DEMO.geojsonUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);
  const data = await res.json();

  rrTrailLayer = L.geoJSON(data, {
    style: { weight: 4, opacity: 0.9 }
  }).addTo(rrMap);

  rrTrailBounds = rrTrailLayer.getBounds();
  if (rrTrailBounds?.isValid()) rrMap.fitBounds(rrTrailBounds.pad(0.2));

  // Quiet marker near trailhead (illustrative)
  L.marker([47.4845, -121.7860]).addTo(rrMap)
    .bindPopup("<strong>Demo trailhead</strong><br/>Rattlesnake Ledge area");

  // Wire map toggles
  const toggleTrail = $("#toggleTrail");
  if (toggleTrail) {
    toggleTrail.addEventListener("change", () => {
      if (!rrMap || !rrTrailLayer) return;
      if (toggleTrail.checked) rrTrailLayer.addTo(rrMap);
      else rrMap.removeLayer(rrTrailLayer);
      toast(toggleTrail.checked ? "Trail overlay on." : "Trail overlay off.");
    });
  }

  const toggleScroll = $("#toggleScrollLock");
  if (toggleScroll) {
    toggleScroll.addEventListener("change", () => {
      if (!rrMap) return;
      if (toggleScroll.checked) rrMap.scrollWheelZoom.disable();
      else rrMap.scrollWheelZoom.enable();
      toast(toggleScroll.checked ? "Scroll zoom locked." : "Scroll zoom enabled.");
    });
  }

  const recenterBtn = $("#recenterBtn");
  if (recenterBtn) {
    recenterBtn.addEventListener("click", () => {
      if (!rrMap) return;
      if (rrTrailBounds?.isValid()) rrMap.fitBounds(rrTrailBounds.pad(0.2));
      else rrMap.setView([DEMO.defaultView.lat, DEMO.defaultView.lng], DEMO.defaultView.zoom);
      toast("Re-centered map.");
    });
  }
}

(async function boot() {
  // Set demo defaults
  setPlan(defaultPlan());
  wireLiveUpdates();
  refreshUI();

  // Init map
  try {
    await initMap();
  } catch (err) {
    console.error(err);
    toast("Map failed to load. Check GeoJSON path.");
  }
})();

