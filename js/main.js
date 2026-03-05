/* ==========================================================================
   RidgeRelay demo JS (static, GitHub Pages friendly)
   WHAT:
   - Hero carousel (auto rotate + dots + keyboard; respects prefers-reduced-motion)
   - Client-side search filter (name + location keywords)
   - Activity filters (chips + browse cards)
   - Hearts / Saved list (localStorage)
   - Trail detail drawer with focus management + ESC close
   - Weather demo (fetch /assets/data/weather_demo.json)
   - Prototype banner -> Safety Disclaimer modal
   - Mobile drawer menu (ESC + focus trap + aria-expanded)
   - Dev tooling: ?dev=1 and press "G" toggles grid overlay (pointer-events none)

   WHY:
   - Provides a polished “concept demo” UX without any backend dependencies
   - Keeps privacy-first framing: everything stored locally in browser for this prototype

   FUTURE HOOKS (high level):
   - Replace trail data with real datasource (AllTrails-like), but privacy-aware
   - Wire “Plan a Safety Session” to actual session logic + offline flows
   - Replace weather JSON with an API gateway (no client keys) + caching
   ========================================================================== */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ---------------------------
  // Banner height -> header offset
  // ---------------------------
  function syncBannerHeightVar() {
    const banner = $(".proto-banner");
    if (!banner) return;
    const h = Math.round(banner.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--banner-h", `${h}px`);
  }
  window.addEventListener("resize", syncBannerHeightVar, { passive: true });

  // ---------------------------
  // Header condense on scroll
  // ---------------------------
  function setupHeaderCondense() {
    const header = $("[data-header]");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-condensed", window.scrollY > 10);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---------------------------
  // Simple focus trap helper for modals/drawers
  // ---------------------------
  function trapFocus(container, { onClose } = {}) {
    const focusables = () => $$(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter(el => el.offsetParent !== null);

    function handleKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", handleKeydown);
    return () => container.removeEventListener("keydown", handleKeydown);
  }

  // ---------------------------
  // Modal: Safety Disclaimer
  // ---------------------------
  function setupDisclaimerModal() {
    const modal = $('[data-modal="disclaimer"]');
    if (!modal) return;

    const panel = $(".modal__panel", modal);
    const openers = $$("[data-open-disclaimer]");
    const closers = $$("[data-modal-close]", modal);

    let lastFocus = null;
    let untrap = null;

    const open = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");

      untrap = trapFocus(panel, { onClose: close });

      // Focus first interactive item (close button)
      const focusTarget = $("[data-modal-close]", modal) || panel;
      focusTarget.focus();
    };

    const close = () => {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      untrap?.();
      untrap = null;
      lastFocus?.focus?.();
    };

    openers.forEach(btn => btn.addEventListener("click", open));
    closers.forEach(btn => btn.addEventListener("click", close));
  }

  // ---------------------------
  // Mobile drawer nav
  // ---------------------------
  function setupMobileDrawer() {
    const drawer = $("[data-mobile-drawer]");
    if (!drawer) return;

    const openBtn = $("[data-mobile-open]");
    const closeBtns = $$("[data-mobile-close]", drawer);
    const links = $$("[data-mobile-link]", drawer);

    let untrap = null;
    let lastFocus = null;

    const panel = $(".mobile-drawer__panel", drawer);

    function setOpen(isOpen) {
      drawer.setAttribute("aria-hidden", String(!isOpen));
      openBtn?.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        lastFocus = document.activeElement;
        untrap = trapFocus(panel, { onClose: () => setOpen(false) });
        (closeBtns[0] || panel).focus();
        document.body.style.overflow = "hidden";
      } else {
        untrap?.();
        untrap = null;
        document.body.style.overflow = "";
        lastFocus?.focus?.();
      }
    }

    openBtn?.addEventListener("click", () => setOpen(true));
    closeBtns.forEach(btn => btn.addEventListener("click", () => setOpen(false)));
    links.forEach(a => a.addEventListener("click", () => setOpen(false)));
  }

  // ---------------------------
  // Mega menu (desktop): click + keyboard friendly
  // - Closes on outside click, ESC, or focus leaving menus
  // ---------------------------
  function setupMegaMenus() {
    const triggers = $$("[data-mega-trigger]");
    const menus = $$("[data-mega]");

    function closeAll() {
      triggers.forEach(t => t.setAttribute("aria-expanded", "false"));
      menus.forEach(m => m.classList.remove("is-open"));
    }

    function openMenu(name) {
      closeAll();
      const menu = $(`[data-mega="${name}"]`);
      const trigger = $(`[data-mega-trigger="${name}"]`);
      if (!menu || !trigger) return;
      menu.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    triggers.forEach(trigger => {
      const name = trigger.getAttribute("data-mega-trigger");

      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const isExpanded = trigger.getAttribute("aria-expanded") === "true";
        if (isExpanded) closeAll();
        else openMenu(name);
      });

      // Open on ArrowDown for keyboard users
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          openMenu(name);
          // Focus first link inside menu
          const firstLink = $(`[data-mega="${name}"] a`);
          firstLink?.focus?.();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeAll();
          trigger.focus();
        }
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      const clickedInside = triggers.some(t => t.contains(e.target)) || menus.some(m => m.contains(e.target));
      if (!clickedInside) closeAll();
    });

    // Close on ESC from anywhere
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

    // Light hover assist (desktop only)
    const isDesktop = () => window.matchMedia("(min-width: 900px)").matches;
    menus.forEach(menu => {
      menu.addEventListener("mouseenter", () => {
        if (!isDesktop()) return;
        const name = menu.getAttribute("data-mega");
        openMenu(name);
      });
      menu.addEventListener("mouseleave", () => {
        if (!isDesktop()) return;
        closeAll();
      });
    });
  }

  // ---------------------------
  // Carousel
  // ---------------------------
  function setupCarousel() {
    const root = $("[data-carousel]");
    if (!root) return;

    const viewport = $("[data-carousel-viewport]", root);
    const slides = $$("[data-slide]", root);
    const dotsHost = $(".carousel__dots", root);
    const btnPrev = $("[data-carousel-prev]", root);
    const btnNext = $("[data-carousel-next]", root);

    // Replace missing images with a small inline SVG placeholder (not “giant base64”).
    const placeholderSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
        <rect width="1200" height="700" fill="#101217"/>
        <path d="M0 520 C 220 420, 420 660, 650 520 C 820 420, 980 560, 1200 460 L1200 700 L0 700 Z" fill="#0f1116"/>
        <circle cx="910" cy="190" r="54" fill="#F7FF00" opacity=".12"/>
        <path d="M220 520 L380 250 L540 520 Z" fill="none" stroke="#F7FF00" stroke-width="8" opacity=".35"/>
        <path d="M520 520 L690 200 L880 520 Z" fill="none" stroke="#ffffff" stroke-width="8" opacity=".15"/>
      </svg>
    `).trim();
    const placeholderUrl = `data:image/svg+xml;charset=utf-8,${placeholderSvg}`;

    slides.forEach(slide => {
      const img = $("img", slide);
      if (!img) return;
      img.addEventListener("error", () => {
        img.src = placeholderUrl;
      }, { once: true });
    });

    let index = 0;
    let timer = null;
    const intervalMs = 5200;

    function setActive(nextIndex, { focusDot = false } = {}) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === index));

      const dots = $$("[role='tab']", dotsHost);
      dots.forEach((d, i) => {
        d.setAttribute("aria-selected", String(i === index));
        d.tabIndex = i === index ? 0 : -1;
      });

      if (focusDot) {
        const dotsNow = $$("[role='tab']", dotsHost);
        dotsNow[index]?.focus?.();
      }
    }

    function buildDots() {
      dotsHost.innerHTML = "";
      slides.forEach((_, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dot";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-label", `Slide ${i + 1}`);
        btn.setAttribute("aria-selected", String(i === 0));
        btn.tabIndex = i === 0 ? 0 : -1;

        btn.addEventListener("click", () => {
          stopAuto();
          setActive(i, { focusDot: true });
        });

        btn.addEventListener("keydown", (e) => {
          // Keyboard: Left/Right changes slides while focused on dots
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            stopAuto();
            setActive(index - 1, { focusDot: true });
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            stopAuto();
            setActive(index + 1, { focusDot: true });
          }
        });

        dotsHost.appendChild(btn);
      });
    }

    function startAuto() {
      if (prefersReducedMotion.matches) return; // Respect reduced motion: no auto rotation
      stopAuto();
      timer = window.setInterval(() => setActive(index + 1), intervalMs);
    }

    function stopAuto() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    // Buttons
    btnPrev?.addEventListener("click", () => { stopAuto(); setActive(index - 1); });
    btnNext?.addEventListener("click", () => { stopAuto(); setActive(index + 1); });

    // Keyboard controls on viewport
    viewport?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); stopAuto(); setActive(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); stopAuto(); setActive(index + 1); }
    });

    buildDots();
    setActive(0);
    startAuto();

    // If user toggles reduced motion while open
    prefersReducedMotion.addEventListener?.("change", () => {
      if (prefersReducedMotion.matches) stopAuto();
      else startAuto();
    });
  }

  // ---------------------------
  // Demo data (trails)
  // ---------------------------
  const TRAILS = [
    {
      id: "bridal-veil-falls-wa",
      name: "Bridal Veil Falls",
      location: "Index, WA",
      activity: ["Hiking", "Dog-friendly"],
      distanceMi: 4.2,
      elevationFt: 1200,
      difficulty: "Moderate",
      img: "assets/img/trails/bridal-veil-falls.png",
      keywords: ["index", "skykomish", "waterfall", "snohomish"]
    },
    {
      id: "rattlesnake-ledge",
      name: "Rattlesnake Ledge",
      location: "North Bend, WA",
      activity: ["Hiking", "Trail Running", "Dog-friendly"],
      distanceMi: 4.0,
      elevationFt: 1160,
      difficulty: "Moderate",
      img: "assets/img/trails/rattlesnake-ledge.png",
      keywords: ["north bend", "rattlesnake lake", "issaquah", "snoqualmie"]
    },
    {
      id: "twin-falls",
      name: "Twin Falls",
      location: "North Bend, WA",
      activity: ["Hiking", "Dog-friendly"],
      distanceMi: 2.6,
      elevationFt: 500,
      difficulty: "Easy",
      img: "assets/img/trails/twin-falls.png",
      keywords: ["north bend", "snoqualmie", "waterfall"]
    },
    {
      id: "snow-lake",
      name: "Snow Lake",
      location: "Alpine Lakes Wilderness, WA",
      activity: ["Hiking", "Backpacking"],
      distanceMi: 7.2,
      elevationFt: 1800,
      difficulty: "Moderate",
      img: "assets/img/trails/snow-lake.png",
      keywords: ["alpine lakes", "snoqualmie pass", "lake"]
    },
    {
      id: "mount-si",
      name: "Mount Si",
      location: "North Bend, WA",
      activity: ["Hiking", "Trail Running"],
      distanceMi: 7.9,
      elevationFt: 3150,
      difficulty: "Hard",
      img: "assets/img/trails/mount-si.png",
      keywords: ["north bend", "snoqualmie", "peak"]
    },
    {
      id: "wallace-falls",
      name: "Wallace Falls",
      location: "Gold Bar, WA",
      activity: ["Hiking", "Dog-friendly"],
      distanceMi: 5.6,
      elevationFt: 1300,
      difficulty: "Moderate",
      img: "assets/img/trails/wallace-falls.png",
      keywords: ["gold bar", "waterfall", "snohomish"]
    },
  ];

  const ACTIVITIES = [
    { key: "Hiking", label: "Hiking" },
    { key: "Trail Running", label: "Trail Running" },
    { key: "Backpacking", label: "Backpacking" },
    { key: "Mountain Biking", label: "Mountain Biking" },
    { key: "Overlanding", label: "Overlanding" },
    { key: "Dog-friendly", label: "Dog-friendly" },
  ];

  // ---------------------------
  // localStorage helpers
  // ---------------------------
  const LS = {
    saved: "rr_saved_trails_v1",
    photos: "rr_gallery_photos_v1",
    plan: "rr_plan_demo_v1"
  };

  function loadSavedSet() {
    try {
      const raw = localStorage.getItem(LS.saved);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function persistSavedSet(set) {
    localStorage.setItem(LS.saved, JSON.stringify(Array.from(set)));
  }

  // ---------------------------
  // Rendering: Trails
  // ---------------------------
  const state = {
    q: "",
    activity: "All",
    saved: loadSavedSet(),
    weatherData: null,
    drawerTrailId: null
  };

  function formatMeta(trail) {
    return `${trail.distanceMi.toFixed(1)} mi • ${trail.elevationFt.toLocaleString()} ft • ${trail.difficulty}`;
  }

  function trailMatches(trail, q, activity) {
    const query = q.trim().toLowerCase();
    const activityOk = (activity === "All") || trail.activity.includes(activity);

    if (!query) return activityOk;

    const hay = [
      trail.name,
      trail.location,
      ...trail.keywords,
      ...trail.activity
    ].join(" ").toLowerCase();

    return activityOk && hay.includes(query);
  }

  function makeTrailCard(trail) {
    const isSaved = state.saved.has(trail.id);

    const el = document.createElement("article");
    el.className = "card trail-card";
    el.innerHTML = `
      <button class="trail-card__hit" type="button" aria-label="Open details for ${escapeHtml(trail.name)}"></button>

      <div class="trail-card__img">
        <img src="${escapeAttr(trail.img)}" alt="${escapeAttr(trail.name)} trail photo (placeholder)" loading="lazy"/>
      </div>

      <div class="trail-card__body">
        <div class="trail-card__top">
          <div>
            <h3 class="trail-card__name">${escapeHtml(trail.name)}</h3>
            <p class="trail-card__loc">${escapeHtml(trail.location)}</p>
          </div>

          <button class="heart" type="button" data-heart aria-pressed="${isSaved}" aria-label="${isSaved ? "Remove from saved" : "Save"} ${escapeAttr(trail.name)}">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-7-4.4-9.5-8.2C.7 9.7 2.4 6.5 6 6.1c1.8-.2 3.1.7 4 1.8.9-1.1 2.2-2 4-1.8 3.6.4 5.3 3.6 3.5 6.7C19 16.6 12 21 12 21z"
                fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="chiprow" aria-label="Trail attributes">
          <span class="pill">${escapeHtml(formatMeta(trail))}</span>
          <span class="pill">${escapeHtml(trail.activity[0])}</span>
        </div>
      </div>
    `;

    // Click target: full card opens drawer (but keep buttons working)
    const hit = $(".trail-card__hit", el);
    hit.addEventListener("click", () => openDrawer(trail.id));

    // Heart
    const heartBtn = $("[data-heart]", el);
    heartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSaved(trail.id);
    });

    // Image fallback
    const img = $("img", el);
    img.addEventListener("error", () => {
      img.remove();
      // Keep the image area; it already has a styled fallback background.
    }, { once: true });

    return el;
  }

  function renderTrails() {
    const grid = $("[data-trail-grid]");
    if (!grid) return;

    grid.setAttribute("aria-busy", "true");
    grid.innerHTML = "";

    const filtered = TRAILS.filter(t => trailMatches(t, state.q, state.activity));
    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "card";
      empty.style.padding = "16px";
      empty.innerHTML = `
        <h3 class="card__title">No matches</h3>
        <p class="muted">Try a different search term or activity filter.</p>
      `;
      grid.appendChild(empty);
      grid.setAttribute("aria-busy", "false");
      return;
    }

    filtered.forEach(trail => grid.appendChild(makeTrailCard(trail)));
    grid.setAttribute("aria-busy", "false");
  }

  // ---------------------------
  // Search (hero search filters featured)
  // ---------------------------
  function setupSearch() {
    const input = $("[data-search-input]");
    const form = $("[data-search-form]");
    if (!input || !form) return;

    const apply = () => {
      state.q = input.value;
      renderTrails();
      renderSaved(); // keep saved panel consistent
    };

    input.addEventListener("input", apply);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      apply();
      // Move focus to featured section for keyboard clarity
      $("#featured")?.scrollIntoView?.({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
    });
  }

  // ---------------------------
  // Activities: chips + browse cards
  // ---------------------------
  function setupActivities() {
    const chipsHost = $("[data-activity-chips]");
    const cardsHost = $("[data-activity-cards]");
    if (!chipsHost || !cardsHost) return;

    const allBtn = makeChip("All", "All");
    chipsHost.appendChild(allBtn);

    ACTIVITIES.forEach(a => chipsHost.appendChild(makeChip(a.key, a.label)));

    function makeChip(key, label) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip";
  btn.textContent = label;

  // ✅ Store the real key on the element (so labels can change later)
  btn.dataset.activity = key;

  btn.setAttribute("aria-pressed", String(key === state.activity));
  btn.addEventListener("click", () => setActivity(key));
  return btn;
}

    function renderChipStates() {
  $$("button.chip", chipsHost).forEach(btn => {
    const key = btn.dataset.activity || "All";
    btn.setAttribute("aria-pressed", String(key === state.activity));
  });
}

    function setActivity(key) {
      state.activity = key;
      renderChipStates();

      // Sync activity cards
      $$("button.activity", cardsHost).forEach(btn => {
        btn.setAttribute("aria-pressed", String(btn.dataset.activity === key));
      });

      renderTrails();
      renderSaved();

      // If user picked from Browse section, scroll back to Featured
      if (document.activeElement && cardsHost.contains(document.activeElement)) {
        $("#featured")?.scrollIntoView?.({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
      }
    }

    // Browse-by-activity round cards
    cardsHost.innerHTML = "";
    ACTIVITIES.forEach(a => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "activity";
      btn.dataset.activity = a.key;
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = a.label;
      btn.addEventListener("click", () => setActivity(a.key));
      cardsHost.appendChild(btn);
    });
  }

  // ---------------------------
  // Saved panel
  // ---------------------------
  function toggleSaved(trailId) {
    if (state.saved.has(trailId)) state.saved.delete(trailId);
    else state.saved.add(trailId);
    persistSavedSet(state.saved);
    renderTrails();
    renderSaved();
    // If drawer open for this trail, update drawer button label/state
    if (state.drawerTrailId === trailId) updateDrawerHeart();
  }

  function renderSaved() {
    const savedGrid = $("[data-saved-grid]");
    const savedPanel = $("[data-saved-panel]");
    if (!savedGrid || !savedPanel) return;

    savedGrid.innerHTML = "";
    const savedTrails = TRAILS.filter(t => state.saved.has(t.id));

    if (savedTrails.length === 0) {
      const empty = document.createElement("div");
      empty.className = "card";
      empty.style.padding = "14px";
      empty.innerHTML = `<p class="muted">No saved trails yet. Tap a heart on any trail card.</p>`;
      savedGrid.appendChild(empty);
      return;
    }

    savedTrails.forEach(t => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "chip";
      item.style.borderRadius = "14px";
      item.style.padding = "12px 12px";
      item.style.textAlign = "left";
      item.innerHTML = `<strong>${escapeHtml(t.name)}</strong><br/><span class="muted" style="font-weight:650">${escapeHtml(t.location)}</span>`;
      item.addEventListener("click", () => openDrawer(t.id));
      savedGrid.appendChild(item);
    });
  }

  function setupSavedPanel() {
    const btnShow = $("[data-show-saved]");
    const btnClose = $("[data-close-saved]");
    const panel = $("[data-saved-panel]");
    if (!btnShow || !btnClose || !panel) return;

    btnShow.addEventListener("click", () => {
      panel.hidden = false;
      btnClose.focus();
    });
    btnClose.addEventListener("click", () => {
      panel.hidden = true;
      btnShow.focus();
    });
  }

  // ---------------------------
  // Drawer (trail details)
  // ---------------------------
  function setupDrawer() {
    const drawer = $("[data-drawer]");
    if (!drawer) return;

    const panel = $(".drawer__panel", drawer);
    const closeBtns = $$("[data-drawer-close]", drawer);
    const heartBtn = $("[data-drawer-heart]", drawer);

    let untrap = null;
    let lastFocus = null;

    function close() {
      drawer.hidden = true;
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      untrap?.();
      untrap = null;
      state.drawerTrailId = null;
      lastFocus?.focus?.();
    }

    function open() {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      untrap = trapFocus(panel, { onClose: close });
      (closeBtns[0] || panel).focus();
    }

    closeBtns.forEach(btn => btn.addEventListener("click", close));

    // Drawer-level heart toggle
    heartBtn?.addEventListener("click", () => {
      if (!state.drawerTrailId) return;
      toggleSaved(state.drawerTrailId);
    });

    // Expose for openDrawer() below
    window.__RR_DRAWER__ = { open, close };
  }

  async function ensureWeatherLoaded() {
    if (state.weatherData) return state.weatherData;
    try {
      const res = await fetch("assets/data/weather_demo.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.weatherData = await res.json();
      return state.weatherData;
    } catch (err) {
      // Keep the UI graceful
      state.weatherData = { trails: {}, meta: { note: "Failed to load weather demo JSON." } };
      return state.weatherData;
    }
  }

  function riskHintFromForecast(forecastDays, trail) {
    // Mock logic (ok for demo): look for wind > 20 mph, precip >= 40%, or temp swing
    const windy = forecastDays.some(d => (d.wind_mph ?? 0) >= 20);
    const wet = forecastDays.some(d => (d.precip_chance ?? 0) >= 40);
    const cold = forecastDays.some(d => (d.low_f ?? 999) <= 34);
    const hard = trail.difficulty.toLowerCase() === "hard" || trail.elevationFt >= 3000;

    const tags = [];
    if (wet) tags.push("precipitation");
    if (windy) tags.push("wind");
    if (cold) tags.push("cold lows");
    if (hard) tags.push("steep effort");

    if (tags.length === 0) return "Low-signal risk hint: conditions look stable in this mock forecast. Still plan conservatively.";
    if (hard && (wet || windy || cold)) return `Low-signal risk hint: higher consequence day (${tags.join(", ")}). Consider tighter check-ins + earlier turnaround.`;
    return `Low-signal risk hint: watch for ${tags.join(", ")}. Consider an earlier start + a backup exit plan.`;
  }

  async function openDrawer(trailId) {
    const trail = TRAILS.find(t => t.id === trailId);
    if (!trail) return;

    state.drawerTrailId = trailId;

    // Fill header
    $("[data-drawer-title]")?.replaceChildren(document.createTextNode(trail.name));
    $("[data-drawer-meta]")?.replaceChildren(document.createTextNode(`${trail.location} • ${formatMeta(trail)}`));

    // Photo strip placeholders (no images required)
    const strip = $("[data-photo-strip]");
    if (strip) {
      strip.innerHTML = "";
      for (let i = 0; i < 4; i++) {
        const p = document.createElement("div");
        p.className = "photo";
        p.setAttribute("aria-label", `Placeholder photo ${i + 1}`);
        strip.appendChild(p);
      }
    }

    // Weather panel
    const weatherGrid = $("[data-weather-grid]");
    const weatherHint = $("[data-weather-hint]");
    if (weatherGrid) weatherGrid.innerHTML = "";

    const data = await ensureWeatherLoaded();
    const demo = data.trails?.[trailId];

    if (!demo || !Array.isArray(demo.forecast)) {
      if (weatherGrid) {
        weatherGrid.innerHTML = `<div class="weather-row"><span>Weather demo unavailable</span><span class="muted">Check JSON path</span></div>`;
      }
      if (weatherHint) weatherHint.textContent = "Low-signal risk hint: unavailable (demo data missing).";
    } else {
      demo.forecast.slice(0, 4).forEach(day => {
        const row = document.createElement("div");
        row.className = "weather-row";
        row.innerHTML = `
          <span>${escapeHtml(day.day)} • ${escapeHtml(day.summary)}</span>
          <span class="muted">${day.high_f}° / ${day.low_f}° • ${day.precip_chance}%</span>
        `;
        weatherGrid?.appendChild(row);
      });
      if (weatherHint) weatherHint.textContent = riskHintFromForecast(demo.forecast, trail);
    }

    // Update drawer heart button state/label
    updateDrawerHeart();

    // Open with focus management
    window.__RR_DRAWER__?.open?.();
  }

  function updateDrawerHeart() {
    const btn = $("[data-drawer-heart]");
    if (!btn || !state.drawerTrailId) return;
    const isSaved = state.saved.has(state.drawerTrailId);
    btn.setAttribute("aria-pressed", String(isSaved));
    btn.querySelector(".btn__icon")?.setAttribute("aria-hidden", "true");
    btn.lastChild.textContent = isSaved ? " Saved" : " Add to Wishlist";
  }

  // "Plan a Safety Session" CTA (demo)
  function setupPlanSessionCTA() {
    const btn = $("[data-plan-session]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      // Demo behavior: scroll to plan section
      $("#plan")?.scrollIntoView?.({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
    });
  }

  // ---------------------------
  // Plan form demo: store locally
  // ---------------------------
  function setupPlanForm() {
    const form = $("[data-plan-form]");
    const status = $("[data-plan-status]");
    const submit = $("[data-plan-submit]");
    if (!form || !status || !submit) return;

    submit.addEventListener("click", () => {
      const party = form.querySelector('input[name="party"]:checked')?.value || "solo";
      const dog = !!form.querySelector('input[name="dog"]')?.checked;
      const contact = $("#contactPrivate")?.value?.trim() || "";

      const payload = {
        party,
        dog,
        contact,
        savedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(LS.plan, JSON.stringify(payload));
        status.textContent = "Saved (demo). This info stays in your browser.";
      } catch {
        status.textContent = "Could not save (demo). Local storage may be disabled.";
      }
    });
  }

  // ---------------------------
  // Community upload demo: localStorage gallery
  // ---------------------------
  function setupGallery() {
    const input = $("[data-photo-input]");
    const grid = $("[data-gallery-grid]");
    const status = $("[data-photo-status]");
    const clearBtn = $("[data-clear-photos]");
    if (!input || !grid || !status || !clearBtn) return;

    const MAX_PHOTOS = 12;
    const MAX_BYTES_EACH = 650_000; // keep reasonable for localStorage

    function loadPhotos() {
      try {
        const raw = localStorage.getItem(LS.photos);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }

    function savePhotos(arr) {
      localStorage.setItem(LS.photos, JSON.stringify(arr));
    }

    function render() {
      const photos = loadPhotos();
      grid.innerHTML = "";
      if (photos.length === 0) {
        grid.innerHTML = `<p class="muted" style="grid-column:1/-1;margin:0">No photos yet.</p>`;
        return;
      }
      photos.forEach((src, i) => {
        const wrap = document.createElement("div");
        wrap.className = "thumb";
        wrap.innerHTML = `<img alt="Community photo ${i + 1}" loading="lazy" />`;
        const img = $("img", wrap);
        img.src = src;
        img.addEventListener("error", () => {
          wrap.innerHTML = `<div style="padding:12px" class="muted">Image failed to load.</div>`;
        }, { once: true });
        grid.appendChild(wrap);
      });
    }

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        status.textContent = "Please choose an image file.";
        return;
      }

      const photos = loadPhotos();
      if (photos.length >= MAX_PHOTOS) {
        status.textContent = `Gallery is full (max ${MAX_PHOTOS}). Clear some photos first.`;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        // Rough size guard: data URL length approximates bytes
        if (result.length > MAX_BYTES_EACH) {
          status.textContent = "That image is a bit large for a local demo. Try a smaller image.";
          return;
        }
        photos.unshift(result);
        try {
          savePhotos(photos);
          status.textContent = "Added to gallery (stored locally).";
          render();
        } catch {
          status.textContent = "Could not save photo (local storage may be full/disabled).";
        }
      };
      reader.readAsDataURL(file);
      input.value = "";
    });

    clearBtn.addEventListener("click", () => {
      localStorage.removeItem(LS.photos);
      status.textContent = "Cleared gallery.";
      render();
    });

    render();
  }

  // ---------------------------
  // Subscribe form demo (no network)
  // ---------------------------
  function setupSubscribe() {
    const form = $("[data-subscribe-form]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Demo-only: don't store emails, don't send.
      alert("Demo only — no subscription created.");
      form.reset();
    });
  }

  // ---------------------------
  // Dev tooling
  // ---------------------------
  function setupDevTools() {
    const grid = $("[data-dev-grid]");
    if (!grid) return;

    const url = new URL(window.location.href);
    const forcedDev = url.searchParams.get("dev") === "1";
    let devEnabled = forcedDev;

    function setGridVisible(v) {
      grid.hidden = !v;
    }

    // Default: only visible when dev enabled and toggled on
    let gridOn = false;
    setGridVisible(false);

    document.addEventListener("keydown", (e) => {
      // Press "G" toggles grid overlay when in dev mode
      if (!devEnabled) return;
      if (e.key.toLowerCase() === "g") {
        gridOn = !gridOn;
        setGridVisible(gridOn);
      }
    });

    // FUTURE HOOK: add other dev toggles (?debug=1, ?mock=weather2, etc.)
  }

  // ---------------------------
  // Safe HTML helpers
  // ---------------------------
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function escapeAttr(str) {
    // Attribute-safe minimal escape (reuse HTML escape)
    return escapeHtml(str);
  }

  // ---------------------------
  // Boot
  // ---------------------------
  function boot() {
    syncBannerHeightVar();
    setupHeaderCondense();
    setupDisclaimerModal();
    setupMobileDrawer();
    setupMegaMenus();
    setupCarousel();

    setupSearch();
    setupActivities();
    setupSavedPanel();
    setupDrawer();
    setupPlanSessionCTA();
    setupPlanForm();
    setupGallery();
    setupSubscribe();
    setupDevTools();

    renderTrails();
    renderSaved();

    // Small CSS/DOM fix: trail-card click target overlay (added in JS to avoid extra HTML clutter)
    // WHY: ensures the entire card is clickable while keeping buttons inside functional.
    injectTrailCardHitStyle();
  }

  function injectTrailCardHitStyle() {
    const style = document.createElement("style");
    style.textContent = `
      .trail-card__hit{
        position:absolute; inset:0;
        background: transparent;
        border: none;
        cursor:pointer;
      }
      .trail-card__hit:focus-visible{
        outline: 3px solid color-mix(in oklab, var(--accent), white 10%);
        outline-offset: -3px;
        border-radius: var(--radius);
      }
      .trail-card .heart{ position: relative; z-index: 2; }
      .trail-card a, .trail-card button, .trail-card input{ position: relative; z-index: 2; }
    `;
    document.head.appendChild(style);
  }

  boot();
})();
