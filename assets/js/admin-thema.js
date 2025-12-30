/*
 * admin-thema.js
 * Global Admin Theme Controller (MPA SAFE)
 */

(function () {
  "use strict";

  const MOBILE_WIDTH = 768;

  const body = document.body;
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("sidebarToggleTop");

  if (!sidebar) return;

  // ===============================
  // STATE HELPERS
  // ===============================
  function isMobile() {
    return window.innerWidth <= MOBILE_WIDTH;
  }

  function isSidebarClosed() {
    return body.classList.contains("sidebar-toggled");
  }

  function closeSidebar() {
    body.classList.add("sidebar-toggled");
    sidebar.classList.add("toggled");
  }

  function openSidebar() {
    body.classList.remove("sidebar-toggled");
    sidebar.classList.remove("toggled");
  }

  function toggleSidebar() {
    isSidebarClosed() ? openSidebar() : closeSidebar();
  }

  // ===============================
  // INIT (ON LOAD)
  // ===============================
  document.addEventListener("DOMContentLoaded", () => {
    if (isMobile()) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // ===============================
  // TOGGLE BUTTON
  // ===============================
  if (toggleBtn) {
    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // ===============================
  // TOGGLE SIDEBAR BUTTON (TOPBAR)
  // ===============================
  document.addEventListener("click", function (e) {
    if (window.innerWidth > 768) return;

    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggleTop");
    const navLink = e.target.closest(".sidebar .nav-link");

    // CLICK TOGGLE
    if (toggleBtn && toggleBtn.contains(e.target)) {
      e.preventDefault();
      toggleSidebar();
      return;
    }

    // CLICK MENU SIDEBAR → BIARKAN NAVIGASI + TUTUP
    if (navLink) {
      collapseSidebar();
      return;
    }

    // SIDEBAR SUDAH TERTUTUP
    if (document.body.classList.contains("sidebar-toggled")) return;

    // CLICK DI DALAM SIDEBAR
    if (sidebar && sidebar.contains(e.target)) return;

    // CLICK DI LUAR SIDEBAR
    collapseSidebar();
  });

  // ===============================
  // AUTO CLOSE AFTER MENU CLICK (MOBILE)
  // ===============================
  sidebar.addEventListener("click", function (e) {
    const link = e.target.closest(".nav-link");
    if (!link) return;

    if (isMobile()) {
      closeSidebar();
    }
  });

  // ===============================
  // RESIZE / ROTATE
  // ===============================
  window.addEventListener("resize", () => {
    if (isMobile()) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 200);
  });
})();

/**
 * ADMIN GLOBAL LOADER
 */
(function () {
  "use strict";

  const id = "adminLoader";

  window.AdminLoader = {
    show() {
      const el = document.getElementById(id);
      if (el) el.classList.remove("hide");
    },
    hide() {
      const el = document.getElementById(id);
      if (el) el.classList.add("hide");
    },
  };
})();
