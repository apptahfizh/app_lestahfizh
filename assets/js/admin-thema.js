// ===============================
// TOPBAR USER NAME
// ===============================
const displayName = document.getElementById("displayName");
if (displayName) {
  displayName.textContent = user.username || "admin";
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
  const link = e.target.closest(".nav-link");
  if (link && window.innerWidth < 768) {
    // tandai bahwa navigasi berasal dari sidebar
    sessionStorage.setItem("ortuFromSidebar", "1");

    // tutup sidebar
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
