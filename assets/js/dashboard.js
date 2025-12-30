// =========================
// LOAD DATA DASHBOARD
// =========================
async function loadDashboard() {
  try {
    console.log("🚀 loadDashboard dipanggil");

    const data = await apiRequest("/dashboard/peserta-progress");
    console.log("📦 data dashboard:", data);

    const list = Array.isArray(data) ? data : data.data || [];
    const container = document.getElementById("dashboardCards");
    if (!container) return;

    container.innerHTML = "";

    list.forEach((p) => {
      const prosentase = p.prosentase ?? 0;

      const card = document.createElement("div");
      card.className = "col-xl-4 col-lg-6 mb-4";

      card.innerHTML = `
        <div class="card shadow h-100">
          <div class="card-header bg-light py-3">
            <h5 class="font-weight-bold text-primary mb-0">
              ${p.nama_peserta}
            </h5>
          </div>
          <div class="card-body">
            <p class="mb-2 text-muted font-weight-bold">Surah Terakhir</p>
            <h6 class="mb-1">${p.surah || "-"}</h6>
            <div class="mb-2 fw-bold">Hafalan ${prosentase}%</div>
            <div class="progress mb-1" style="height:20px;">
              <div class="progress-bar"
                   style="width:0%;transition:width 1.5s"
                   aria-valuenow="${prosentase}">
              </div>
            </div>
            <div class="text-end fw-bold">
              ${p.ayat_terakhir || 0} / ${p.total_ayat || 0}
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);

      const bar = card.querySelector(".progress-bar");
      setTimeout(() => (bar.style.width = `${prosentase}%`), 100);
    });
  } catch (err) {
    console.error("❌ Gagal load dashboard:", err);
  }
}

// =========================
// INIT DASHBOARD (SPA)
// =========================
window.initDashboardPage = function () {
  console.log("🚀 initDashboardPage dipanggil");

  checkAuth(["admin", "ustadz"]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const el = document.getElementById("displayName");
  if (el) el.textContent = user.username || "User";

  loadDashboard();
};
