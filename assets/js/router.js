const app = document.getElementById("app");
const content = () => document.getElementById("app-content");

/* ===============================
   LOAD LAYOUT
=============================== */
async function loadLayout() {
  const res = await fetch("layout/layout.html");
  app.innerHTML = await res.text();
}

/* ===============================
   LOAD PAGE
=============================== */
async function loadPage(page, script = null) {
  const res = await fetch(`pages/${page}.html`);
  content().innerHTML = await res.text();

  if (script) {
    const s = document.createElement("script");
    s.src = script;
    s.defer = true;
    document.body.appendChild(s);
  }

  setActiveMenu(page);
}

/* ===============================
   MENU ACTIVE
=============================== */
function setActiveMenu(page) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  const active = document.querySelector(`[data-page="${page}"]`);
  if (active) active.classList.add("active");
}

/* ===============================
   INIT
=============================== */
(async function init() {
  checkAuth(["admin", "ustadz"]);

  await loadLayout();

  // default page
  loadPage("dashboard", "assets/js/dashboard.js");
})();
