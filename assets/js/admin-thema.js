/*
 * admin-theme.js
 * Theme & UX helper khusus halaman admin / ustadz
 */

(function () {
  "use strict";

  // ===============================
  // KONFIGURASI
  // ===============================
  const MOBILE_WIDTH = 768;

  // ===============================
  // UTIL
  // ===============================
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

  // ===============================
  // AUTO COLLAPSE SAAT LOAD (MOBILE)
  // ===============================
  document.addEventListener("DOMContentLoaded", function () {
    if (isMobile()) {
      collapseSidebar();
    }
  });

  // ===============================
  // TOGGLE SIDEBAR BUTTON (TOPBAR)
  // ===============================
  document.addEventListener("click", function (e) {
    const toggleBtn = e.target.closest("#sidebarToggleTop");
    if (!toggleBtn) return;

    e.preventDefault();
    toggleSidebar();
  });

  // ===============================
  // AUTO CLOSE SIDEBAR SAAT MENU DIKLIK (MOBILE)
  // ===============================
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    link.addEventListener("click", function () {
      if (isMobile()) {
        collapseSidebar();
      }
    });
  });

  // ===============================
  // HANDLE RESIZE (ROTATE HP / RESIZE WINDOW)
  // ===============================
  window.addEventListener("resize", function () {
    if (isMobile()) {
      collapseSidebar();
    } else {
      expandSidebar();
    }
  });
})();
// Fix viewport jump on mobile rotate
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 200);
});
// ===============================
// ENSURE TOGGLE BUTTON STATE
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  if (window.innerWidth <= 768) {
    document.body.classList.add("sidebar-toggled");
  }
});

/**
 * admin-loader.js
 * Loader global untuk halaman admin / ustadz (MPA)
 */

(function () {
  "use strict";

  const loader = document.getElementById("adminLoader");

  if (!loader) return;

  // Hide loader setelah DOM siap
  window.addEventListener("load", () => {
    // Delay kecil agar transisi halus
    setTimeout(() => {
      loader.classList.add("hide");
    }, 200);
  });
})();
