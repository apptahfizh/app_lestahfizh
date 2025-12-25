// ===================================================
// THEME ORTU — GLOBAL (FINAL STABLE)
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // AUTH GUARD (ORTU ONLY)
  // ===============================
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  if (!user || user.role !== "ortu") {
    window.location.href = "login.html";
    return;
  }

  // ===============================
  // TOPBAR USER NAME
  // ===============================
  const displayName = document.getElementById("displayName");
  if (displayName) {
    displayName.textContent = user.username || "Orang Tua";
  }

  // ===============================
  // MOBILE SIDEBAR CONTROL (SINGLE SOURCE)
  // ===============================
  const body = document.body;
  const sidebar = document.getElementById("accordionSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const toggleBtn = document.getElementById("sidebarToggleTop");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      body.classList.toggle("sidebar-open");
    });
  }

  backdrop?.addEventListener("click", () => {
    body.classList.remove("sidebar-open");
  });

  sidebar?.addEventListener("click", (e) => {
    if (e.target.closest(".nav-link") && window.innerWidth < 768) {
      body.classList.remove("sidebar-open");
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      body.classList.remove("sidebar-open");
    }
  });

  // HARD RESET SB-ADMIN LEGACY STATE
  body.classList.remove("sidebar-toggled");
  sidebar?.classList.remove("toggled");

  // ===============================
  // MAIN CONTENT FADE-IN (OPTIONAL)
  // ===============================
  const main = document.getElementById("mainContent");
  if (main) main.classList.add("show");
});
// ===============================
// GLOBAL HELPERS (ORTU)
// ===============================
window.ambilAkhirAyat = function (range) {
  if (!range) return 0;
  const parts = range.split("-");
  return parseInt(parts[parts.length - 1].trim(), 10) || 0;
};

window.getVal = function (id) {
  return document.getElementById(id)?.value || "";
};

window.setVal = function (id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
};
