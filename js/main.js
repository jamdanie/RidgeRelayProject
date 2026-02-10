/* ==========================================================================
   RidgeRelay — main.js
   - Mobile drawer menu (accessible)
   - Leaflet map + local GeoJSON overlay (auto-fit bounds)
   - “Start Trip (Demo)” and “Send (Demo)” interactions (non-functional)
   ========================================================================== */

/* -----------------------------
   Helpers
   ----------------------------- */

/**
 * Safely query an element; throws a clear error in dev if missing.
 * (Helpful when learning / modifying the project.)
 */
function mustGetEl(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

/**
 * Format a datetime-local input value into a readable string.
 * Note: this is a lightweight display formatter, not a full i18n solution.
 */
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

/* -----------------------------
   Sticky header elevation on scroll
   ----------------------------- */
(function headerElevation() {
  const header = document.querySelector(".site-header");
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
   - toggles aria-expanded
   - closes on link click
   - closes on Escape
   ----------------------------- */
(function mobileMenu() {
  const btn = document.getElementById("menuBtn");
  const drawer = document.getElementById("mobileDrawer");
  if (!btn || !drawer) return;

  const navLinks = drawer.querySelectorAll("a");

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

  function toggleDrawer() {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    isOpen ? closeDrawer() : openDrawer();
  }

  btn.addEventListener("click", toggleDrawer);

  // Close when a user taps a link (keeps flow smooth on mobile)
  navLinks.forEach((link) => {
    link.addEventListener("click", () => closeDrawer());
  });

  // Close on Escape for keyboard accessibility
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // Close if user resizes to desktop layout (prevents “stuck open” state)
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 900) closeDrawer();
  });
})();

/* -----------------------------
   Demo interactions (non-functional, but “feels real”)
   ----------------------------- */
(function demoButtons() {
  const startTripBtn = document.getElementById("startTripBtn");
  const demoStatus = document.getElementById("demoStatus");
  const contactBtn = document.getElementById("contactBtn");
  const contactStatus = document.getElementById("contactStatus");

  if (startTripBtn && demoStatus) {
    startTripBtn.addEventListener("click", () => {
      // Read form values (purely for demo messaging)
      const intent = mustGetEl("#intent").value.trim() || "No intent text provided.";
      const startTime = prettyDate(mustGetEl("#startTime").value);
      const returnTime = prettyDate(mustGetEl("#returnTime").value);
      const cadence = mustGetEl("#cadence").value;
      const emergency = mustGetEl("#emergency").value.trim() || "—";

      demoStatus.innerHTML = `
        <strong>Demo started.</strong><br/>
        <span>Intent:</span> ${escapeHtml(intent)}<br/>
        <span>Start:</span> ${escapeHtml(startTime)}<br/>
        <span>Expected return:</span> ${escapeHtml(returnTime)}<br/>
        <span>Check-ins:</span> Every ${escapeHtml(String(cadence))} minutes<br/>
        <span>Emergency contact:</span> ${escapeHtml(emergency)}<br/>
        <em>Prototype note:</em> No data is sent anywhere (static site).
      `;
    });
  }

  if (contactBtn && contactStatus) {
    contactBtn.addEventListener("click", () => {
      contactStatus.textContent =
        "Demo only — this site is static. Use the email button to send feedback.";
    });
  }

  /**
   * Escape user-provided strings to avoid injecting HTML into the page.
   * This is good practice even for a “demo” UI.
   */
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();

/* -----------------------------
   Leaflet map + local GeoJSON overlay
   Requirements:
   - Leaflet.js + OpenStreetMap tiles
   - Load /assets/map/rattlesnake-ridge-demo.geojson
   - Draw on map and fit bounds
   ----------------------------- */
(async function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl || typeof L === "undefined") return;

  // 1) Create the map.
  // Start with a reasonable default in WA; we'll fit bounds after GeoJSON loads.
  const map = L.map("map", {
    scrollWheelZoom: false, // Calm UX: avoid accidental scroll-zoom in page flow
    tap: true,
  }).setView([47.50, -122.10], 11);

  // 2) OpenStreetMap tiles (standard public tile server).
  // Note: For heavy production usage, consider a tile provider with an API key.
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // 3) Load the local GeoJSON and add it to the map.
  try {
    // IMPORTANT: Your repo has assets/map (singular), so use this path:
    const geojsonUrl = "./assets/map/rattlesnake-ridge-demo.geojson";

    const res = await fetch(geojsonUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);

    const data = await res.json();

    // Style is intentionally simple and calm.
    const trailLayer = L.geoJSON(data, {
      style: {
        weight: 4,
        opacity: 0.9,
      },
    }).addTo(map);

    // Fit map to the loaded trail bounds with padding for comfort.
    const bounds = trailLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }

    // Optional: Add a quiet marker at the approximate trailhead (demo).
    // This is purely illustrative and not authoritative.
    const trailhead = L.marker([47.4845, -121.7860]).addTo(map);
    trailhead.bindPopup(
      "<strong>Demo trailhead</strong><br/>Rattlesnake Ledge area"
    );
  } catch (err) {
    console.error(err);

    // If something fails, keep the site usable and communicate gently.
    const fallback = document.createElement("div");
    fallback.className = "map-fallback";
    fallback.textContent =
      "Map failed to load the demo trail. Check that the GeoJSON file path exists.";
    mapEl.appendChild(fallback);
  }
})();

/* =========================================================
   SaaS UI Upgrade: reveal-on-scroll animations
   - Adds .reveal to main sections and reveals them on view
   ========================================================= */
(function revealOnScroll() {
  const sections = document.querySelectorAll("main section");
  sections.forEach((s) => s.classList.add("reveal"));

  // Reveal the first section immediately (hero)
  if (sections[0]) sections[0].classList.add("is-visible");

  // Use IntersectionObserver for lightweight scroll animations
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  sections.forEach((s, idx) => {
    // skip hero since we revealed it already
    if (idx === 0) return;
    io.observe(s);
  });
})();

// ---------- Reveal-on-scroll (subtle SaaS motion) ----------
(function revealOnScroll() {
  const sections = document.querySelectorAll("main section");
  sections.forEach((s) => s.classList.add("reveal"));
  if (sections[0]) sections[0].classList.add("is-visible");

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  sections.forEach((s, i) => { if (i !== 0) io.observe(s); });
})();

