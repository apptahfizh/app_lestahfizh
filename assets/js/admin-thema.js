/*
 * admin-thema.js
 * FINAL — race-condition safe
 */

(function () {
  "use strict";

  const MOBILE_WIDTH = 768;
  let isToggling = false; // 🔒 LOCK STATE
  let isScrollingSidebar = false;

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
    ensureSidebarBackdrop().style.display = "none";
  }

  function expandSidebar() {
    document.body.classList.remove("sidebar-toggled");
    sidebar()?.classList.remove("toggled");
    ensureSidebarBackdrop().style.display = "block";
  }

  function toggleSidebar() {
    document.body.classList.toggle("sidebar-toggled");
    sidebar()?.classList.toggle("toggled");
  }

  /* ===============================
     BUAT BACKDROP (JS, NO HTML EDIT)
  =============================== */
  function ensureSidebarBackdrop() {
    let backdrop = document.getElementById("sidebarBackdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    document.body.appendChild(backdrop);

    return backdrop;
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
     SCROLL SIDEBAR (MOBILE)
  =============================== */
  document.addEventListener("DOMContentLoaded", () => {
    const sb = document.querySelector(".sidebar");
    if (!sb) return;

    sb.addEventListener("touchstart", () => {
      isScrollingSidebar = true;
    });

    sb.addEventListener("touchmove", () => {
      isScrollingSidebar = true;
    });

    sb.addEventListener("touchend", () => {
      // unlock setelah momentum scroll selesai
      setTimeout(() => {
        isScrollingSidebar = false;
      }, 150);
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
   TUTUP SIDEBAR HANYA DARI BACKDROP
=============================== */
  document.addEventListener("DOMContentLoaded", () => {
    const backdrop = ensureSidebarBackdrop();
    let startX = 0;
    let startY = 0;
    let moved = false;

    backdrop.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        moved = false;
      },
      { passive: true },
    );

    backdrop.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        const dx = Math.abs(t.clientX - startX);
        const dy = Math.abs(t.clientY - startY);

        // jika gesture scroll → JANGAN TUTUP
        if (dx > 10 || dy > 10) {
          moved = true;
        }
      },
      { passive: true },
    );

    backdrop.addEventListener("touchend", () => {
      // hanya TAP murni yang boleh nutup
      if (!moved) {
        collapseSidebar();
      }
    });

    // fallback desktop / mouse
    backdrop.addEventListener("click", () => {
      collapseSidebar();
    });
  });

  /* ===============================
   STOP TOUCH BUBBLE FROM SIDEBAR
=============================== */
  document.addEventListener("DOMContentLoaded", () => {
    const sb = document.querySelector(".sidebar");
    if (!sb) return;

    ["touchstart", "touchmove", "touchend"].forEach((evt) => {
      sb.addEventListener(
        evt,
        (e) => {
          e.stopPropagation();
        },
        { passive: true },
      );
    });
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

/* =====================================================
   HARD GUARD — BLOCK AUTO CLOSE WHEN ADDRESS BAR HIDDEN
===================================================== */
(function () {
  let lastHeight = window.innerHeight;

  window.addEventListener("scroll", () => {
    lastHeight = window.innerHeight;
  });

  document.addEventListener(
    "pointerdown",
    (e) => {
      const sidebar = document.querySelector(".sidebar");
      if (!sidebar) return;

      const sidebarOpen = !document.body.classList.contains("sidebar-toggled");
      if (!sidebarOpen) return;

      // 🔥 Jika viewport sedang berubah (address bar animating)
      if (window.innerHeight !== lastHeight) {
        e.stopImmediatePropagation();
        return;
      }
    },
    true,
  );
})();
