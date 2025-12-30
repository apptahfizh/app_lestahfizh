/*
 * admin-thema.js
 * Theme & UX helper global
 * Admin / Ustadz (MPA)
 */

(function () {
  "use strict";

  const MOBILE_WIDTH = 768;

  /* ===============================
     UTIL
  =============================== */
  function isMobile() {
    return window.innerWidth <= MOBILE_WIDTH;
  }

  function getSidebar() {
    return document.querySelector(".sidebar");
  }

  function collapseSidebar() {
    document.body.classList.add("sidebar-toggled");
    getSidebar()?.classList.add("toggled");
  }

  function expandSidebar() {
    document.body.classList.remove("sidebar-toggled");
    getSidebar()?.classList.remove("toggled");
  }

  function toggleSidebar() {
    document.body.classList.toggle("sidebar-toggled");
    getSidebar()?.classList.toggle("toggled");
  }

  /* ===============================
     AUTO COLLAPSE SAAT LOAD (MOBILE)
  =============================== */
  document.addEventListener("DOMContentLoaded", () => {
    if (isMobile()) {
      collapseSidebar();
    }
  });

  /* ===============================
     TOGGLE ☰ (EVENT LANGSUNG)
     🔥 INI KUNCI UTAMA
  =============================== */
  document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("sidebarToggleTop");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); // 🔥 WAJIB
      toggleSidebar();
    });
  });

  /* ===============================
     MENU SIDEBAR CLICK (MOBILE)
     → Tutup sidebar, BIARKAN NAVIGASI
  =============================== */
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (isMobile()) {
          collapseSidebar();
        }
      });
    });
  });

  /* ===============================
     OUTSIDE CLICK (MOBILE ONLY)
     → Tutup sidebar jika klik di luar
  =============================== */
  document.addEventListener("click", function (e) {
    if (!isMobile()) return;

    const sidebar = getSidebar();

    // Jika sidebar sudah tertutup → skip
    if (document.body.classList.contains("sidebar-toggled")) return;

    // Klik di dalam sidebar → skip
    if (sidebar && sidebar.contains(e.target)) return;

    collapseSidebar();
  });

  /* ===============================
     HANDLE RESIZE / ROTATE
  =============================== */
  window.addEventListener("resize", () => {
    if (isMobile()) {
      collapseSidebar();
    } else {
      expandSidebar();
    }
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 200);
  });
})();

/* ===============================
   ADMIN GLOBAL LOADER API
   (dipakai oleh peserta.js, dll)
=============================== */
(function () {
  "use strict";

  function getLoader() {
    return document.getElementById("adminLoader");
  }

  window.AdminLoader = {
    show() {
      const loader = getLoader();
      if (!loader) return;
      loader.classList.remove("hide");
    },
    hide() {
      const loader = getLoader();
      if (!loader) return;
      loader.classList.add("hide");
    },
  };
})();
