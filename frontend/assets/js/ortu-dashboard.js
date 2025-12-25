checkAuth(["ortu"]); // hanya ORTU bisa akses
// ✅ REGISTER PLUGIN (WAJIB UNTUK CHART.JS v2)
if (window.Chart && window.ChartDataLabels) {
  Chart.plugins.register(ChartDataLabels);
  console.log("ChartDataLabels registered & active");
} else {
  console.error("ChartDataLabels atau Chart belum siap");
}

const user = JSON.parse(localStorage.getItem("user") || "{}");
document.getElementById("displayName").textContent = user.username || "Ortu";

// =========================
// DASHBOARD ORTU FINAL
// =========================
async function loadOrtuDashboard() {
  try {
    // Ambil hafalan terakhir peserta
    const res = await api.get("/hafalan/last");
    const data = res.data?.[0];

    if (!data) {
      document.getElementById("dashboardCards").innerHTML = `
    <div class="col-12">
      <div class="alert alert-info">Belum ada data hafalan.</div>
    </div>`;

      safeHideLoader();
      return;
    }

    // Fungsi ambil angka terakhir dari range string "1-30" → 30
    const ambilAkhir = (range) => {
      if (!range) return 0;
      const parts = range.split("-");
      return Number(parts[parts.length - 1].trim());
    };

    const nama_peserta = data.peserta || "-";
    const surah_nama = data.surah_nama || "-";
    const ayat_terakhir = ambilAkhir(data.ayat_hafal); // angka terakhir
    const total_ayat = data.total_ayat || 1; // jumlah ayat dalam surah

    // Hitung prosentase progress
    const prosentase = Math.min(
      100,
      Math.round((ayat_terakhir / total_ayat) * 100)
    );

    // =========================
    // RENDER CARD PROGRESS BAR
    // =========================
    const container = document.getElementById("dashboardCards");
    container.innerHTML = "";

    const card = document.createElement("div");
    card.className = "col-xl-4 col-lg-6 mb-4";

    card.innerHTML = `
  <div class="card shadow h-100">
    <div class="card-header">
      <h6 class="font-weight-bold text-primary mb-0">Progres</h6>
    </div>
    <div class="card-body">
      <h6 class="mb-1">${surah_nama}</h6>

      <!-- Persentase di bawah nama surah -->
      <div style="font-weight:bold; font-size:0.9rem; margin-bottom: 0.5rem;">
        ${prosentase}%
      </div>

      <div class="progress mb-1" style="height: 20px; border-radius: 10px;">
        <div class="progress-bar"
          role="progressbar"
          style="width:0%; background: linear-gradient(90deg, #0baa05ff, #d8c30aff, #0609d8ff); transition: width 1.5s ease-in-out;"
          aria-valuenow="${prosentase}"
          aria-valuemin="0"
          aria-valuemax="100">
        </div>
      </div>

      <div style="text-align:right; font-weight:bold; font-size:0.9rem;">
        ${ayat_terakhir} / ${total_ayat}
      </div>
    </div>
  </div>
`;

    container.appendChild(card);

    // Animasi progress bar
    const bar = card.querySelector(".progress-bar");
    setTimeout(() => {
      bar.style.width = `${prosentase}%`;
    }, 120);

    // =========================
    // BAR CHART
    // =========================
    const barCanvas = document.getElementById("barChart");
    if (barCanvas) {
      const ctx = barCanvas.getContext("2d");
      const gradientBlue = ctx.createLinearGradient(0, 0, 0, 200);
      const gradientHafal = ctx.createLinearGradient(0, 0, 0, 220);
      gradientHafal.addColorStop(0, "#3fae2a");
      gradientHafal.addColorStop(0.5, "#158806");
      gradientHafal.addColorStop(1, "#4f7003ff");

      const gradientGreen = ctx.createLinearGradient(0, 0, 0, 200);
      const gradientTotal = ctx.createLinearGradient(0, 0, 0, 220);
      gradientTotal.addColorStop(0, "#6f8dff");
      gradientTotal.addColorStop(0.5, "#7bcdeeff");
      gradientTotal.addColorStop(1, "#1c4fd7");

      const maxValue = Math.max(ayat_terakhir, total_ayat);
      const yMax = Math.ceil(maxValue * 1.2);

      new Chart(ctx, {
        type: "bar",
        data: {
          labels: [surah_nama],
          datasets: [
            {
              label: "Ayat Yang Sudah Hafal",
              data: [ayat_terakhir],
              backgroundColor: gradientHafal,
            },
            {
              label: "Jumlah Ayat Dalam Surah",
              data: [total_ayat],
              backgroundColor: gradientTotal,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,

          legend: {
            position: "bottom",
            labels: {
              padding: 14,
              boxWidth: 12,
              fontColor: "#444",
            },
          },

          layout: {
            padding: {
              top: 40,
              bottom: 20,
            },
          },

          plugins: {
            datalabels: {
              anchor: "end",
              align: "end",
              offset: 4,
              clamp: true,
              font: {
                weight: "bold",
                size: 16,
              },
              color: (ctx) => (ctx.datasetIndex === 0 ? "#2f5d12" : "#243fa8"),
              formatter: (v) => v + " ayat",
            },
          },

          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  padding: 8,
                },
              },
            ],
          },
        },
      });
      /* ⬇️ TUNGGU FRAME RENDER */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          safeHideLoader(300);
        });
      });
    }
  } catch (err) {
    console.error("Gagal load dashboard ortu:", err);

    document.getElementById("dashboardCards").innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger">Gagal memuat data dashboard.</div>
    </div>`;

    safeHideLoader();
  }
}

// Jalankankan setelah DOM siap
document.addEventListener("DOMContentLoaded", () => {
  safeShowLoader("Memuat Dashboard…");
  loadOrtuDashboard();
  // ===============================
  // SET NAMA PESERTA di Topbar
  // ===============================
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nameEl = document.querySelector("#pageTitle .topbar-name");

  if (nameEl && user.username) {
    nameEl.textContent = user.username;
  }
});
