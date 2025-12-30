// ==============================
// SIDEBAR TOGGLE (GLOBAL)
// ==============================
function initSidebarToggle() {
  const btn = document.getElementById("btnToggleSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const sidebar = document.getElementById("accordionSidebar");

  if (!btn || !overlay || !sidebar) return;

  // Toggle sidebar
  btn.onclick = () => {
    document.body.classList.toggle("sidebar-open");
  };

  // Click overlay = close
  overlay.onclick = () => {
    document.body.classList.remove("sidebar-open");
  };

  // Click menu = close (mobile UX)
  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("sidebar-open");
    });
  });
}
