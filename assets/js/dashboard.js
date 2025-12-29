checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses

// tampilkan nama user
const user = JSON.parse(localStorage.getItem("user") || "{}");
document.getElementById("displayName").textContent = user.username || "User";

// =========================
// LOAD DATA KE DASHBOARD
// =========================
async function loadDashboard() {
  try {
    const data = await apiRequest("/dashboard/peserta-progress");

    const list = Array.isArray(data) ? data : data.data || [];

    const container = document.getElementById("dashboardCards");
    if (!container) return; // 🔒 cegah error SPA
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

            <div style="font-weight:bold;font-size:0.9rem;margin-bottom:10px;">
              Hafalan ${prosentase}%
            </div>

            <div class="progress mb-1" style="height:20px;border-radius:10px;">
              <div class="progress-bar"
                   role="progressbar"
                   style="width:0%;background:linear-gradient(90deg,#4e73df,#1cc88a);transition:width 1.5s ease-in-out;"
                   aria-valuenow="${prosentase}"
                   aria-valuemin="0"
                   aria-valuemax="100">
              </div>
            </div>

            <div style="text-align:right;font-weight:bold;font-size:0.9rem;">
              ${p.ayat_terakhir || 0} / ${p.total_ayat || 0}
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);

      const progressBar = card.querySelector(".progress-bar");
      setTimeout(() => {
        progressBar.style.width = `${prosentase}%`;
      }, 100);
    });
  } catch (error) {
    console.error("Gagal load dashboard:", error);
  }
}

// =========================
// INIT DASHBOARD (SPA)
// =========================
function initDashboardPage() {
  checkAuth(["admin", "ustadz"]); // auth tetap di sini

  // tampilkan nama user (topbar milik layout)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayNameEl = document.getElementById("displayName");
  if (displayNameEl) {
    displayNameEl.textContent = user.username || "User";
  }

  loadDashboard();
}
