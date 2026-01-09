/*
 * admin-thema.js
 * FINAL — race-condition safe
 */

(function () {
  "use strict";

  const MOBILE_WIDTH = 768;
  let isToggling = false; // 🔒 LOCK STATE

  /* ===============================
     UTIL
  =============================== */
  function isMobile() {
    return window.innerWidth <= MOBILE_WIDTH;
  }

  function sidebar() {
    return document.querySelector(".sidebar");
  }

  function collapseSidebar() {
    document.body.classList.add("sidebar-toggled");
    sidebar()?.classList.add("toggled");
  }

  function expandSidebar() {
    document.body.classList.remove("sidebar-toggled");
    sidebar()?.classList.remove("toggled");
  }

  function toggleSidebar() {
    document.body.classList.toggle("sidebar-toggled");
    sidebar()?.classList.toggle("toggled");
  }

  /* ===============================
     AUTO COLLAPSE ON LOAD (MOBILE)
  =============================== */
  document.addEventListener("DOMContentLoaded", () => {
    if (isMobile()) collapseSidebar();
  });

  /* ===============================
     TOGGLE ☰ — HARD SAFE
  =============================== */
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("sidebarToggleTop");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      isToggling = true;
      toggleSidebar();

      // 🔓 unlock AFTER event loop selesai
      setTimeout(() => {
        isToggling = false;
      }, 50);
    });
  });

  /* ===============================
     MENU CLICK (MOBILE)
  =============================== */
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const sidebar = document.querySelector(".sidebar");
      const isSidebarMobile = sidebar.classList.contains("toggled");

      // hanya mode mobile sidebar
      if (!isSidebarMobile) return;

      const targetId = link.dataset.target;

      // ==========================
      // MENU COLLAPSE (Absensi)
      // ==========================
      if (link.dataset.toggle === "collapse" && targetId) {
        e.preventDefault();

        const target = document.querySelector(targetId);
        if (!target) return;

        target.classList.toggle("show");

        // sync aria + class
        const expanded = target.classList.contains("show");
        link.setAttribute("aria-expanded", expanded);
        link.classList.toggle("collapsed", !expanded);

        return; // ❗ sidebar tetap terbuka
      }

      // ==========================
      // MENU BIASA
      // ==========================
      collapseSidebar();
    });
  });

  /* ===============================
     OUTSIDE CLICK — mousedown!
     (ANTI RACE)
  =============================== */
  document.addEventListener("mousedown", (e) => {
    if (!isMobile()) return;
    if (isToggling) return; // 🔥 KUNCI UTAMA

    const sb = sidebar();

    if (document.body.classList.contains("sidebar-toggled")) return;
    if (sb && sb.contains(e.target)) return;

    collapseSidebar();
  });

  /* ===============================
     RESIZE / ROTATE
  =============================== */
  window.addEventListener("resize", () => {
    if (isMobile()) collapseSidebar();
    else expandSidebar();
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(() => window.scrollTo(0, 0), 200);
  });
})();

/* ===============================
   GLOBAL ADMIN LOADER API
=============================== */
(function () {
  "use strict";

  function loader() {
    return document.getElementById("adminLoader");
  }

  window.AdminLoader = {
    show() {
      loader()?.classList.remove("hide");
    },
    hide() {
      loader()?.classList.add("hide");
    },
  };
})();

// ===============================
// CLOSE SIDEBAR (MOBILE) — FINAL FIX
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const closeBtn = document.getElementById("sidebarClose");
  const sidebar = document.querySelector(".sidebar");

  if (!closeBtn || !sidebar) return;

  closeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    // ⛔ TUTUP SIDEBAR (HARUS KEDUANYA)
    document.body.classList.add("sidebar-toggled");
    sidebar.classList.add("toggled");
  });
});
