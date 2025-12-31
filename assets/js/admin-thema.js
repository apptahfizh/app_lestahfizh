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
    document.body.classList.remove("sidebar-open");
    sidebar()?.classList.add("toggled");
  }

  function expandSidebar() {
    document.body.classList.remove("sidebar-toggled");
    document.body.classList.remove("sidebar-open");
    sidebar()?.classList.remove("toggled");
  }

  function toggleSidebar() {
    document.body.classList.toggle("sidebar-toggled");
    document.body.classList.toggle("sidebar-open");
    getSidebar()?.classList.toggle("toggled");
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
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (isMobile()) collapseSidebar();
      });
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
