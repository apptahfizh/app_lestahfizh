// ================================
// GLOBAL PAGE LOADER
// ================================
function loadPage(page) {
  fetch(`pages/${page}.html`)
    .then((res) => {
      if (!res.ok) throw new Error("Page not found");
      return res.text();
    })
    .then((html) => {
      document.getElementById("page-content").innerHTML = html;

      // ================================
      // INIT PER PAGE
      // ================================
      if (page === "dashboard" && typeof initDashboardPage === "function") {
        initDashboardPage();
      }

      if (page === "peserta" && typeof initPesertaPage === "function") {
        initPesertaPage();
      }

      if (page === "hafalan" && typeof initHafalanPage === "function") {
        initHafalanPage();
      }

      if (page === "absensi" && typeof initAbsensiPage === "function") {
        initAbsensiPage();
      }
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("page-content").innerHTML = `
        <div class="container-fluid mt-4">
          <h5 class="text-danger">Halaman tidak ditemukan</h5>
        </div>`;
    });
}
// ==============================
// SIDEBAR TOGGLE (MOBILE SPA)
// ==============================
function initSidebarToggle() {
  const btn = document.getElementById("btnToggleSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const sidebar = document.getElementById("accordionSidebar");

  if (!btn || !overlay || !sidebar) return;

  // toggle open
  btn.onclick = () => {
    document.body.classList.toggle("sidebar-open");
  };

  // click overlay → close
  overlay.onclick = () => {
    document.body.classList.remove("sidebar-open");
  };

  // click menu → close
  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("sidebar-open");
    });
  });
}
