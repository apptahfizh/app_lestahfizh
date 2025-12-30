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
 * ADMIN GLOBAL LOADER CONTROL
 */
(function () {
  "use strict";

  const loaderId = "adminLoader";

  function getLoader() {
    return document.getElementById(loaderId);
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

// ===============================
// CLOSE SIDEBAR ON OUTSIDE CLICK (MOBILE)
// ===============================
document.addEventListener("click", function (e) {
  if (window.innerWidth > 768) return;

  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("sidebarToggleTop");
  const clickedNavLink = e.target.closest(".sidebar .nav-link");

  // Sidebar sudah tertutup → tidak perlu apa-apa
  if (document.body.classList.contains("sidebar-toggled")) return;

  // Klik tombol toggle → biarkan toggle yang mengatur
  if (toggleBtn && toggleBtn.contains(e.target)) return;

  // Klik MENU SIDEBAR → BIARKAN NAVIGASI JALAN
  if (clickedNavLink) return;

  // Klik di dalam sidebar tapi BUKAN menu (area kosong)
  if (sidebar && sidebar.contains(e.target)) return;

  // Klik di luar sidebar → tutup sidebar
  document.body.classList.add("sidebar-toggled");
  sidebar?.classList.add("toggled");
});
