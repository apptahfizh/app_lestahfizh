// ===================================================
// GLOBAL STATE
// ===================================================
// Satu-satunya sumber kebenaran untuk filter
let filterState = {
  bulan: null,
  tahun: null,
};

// Sumber data global (table, card, export)
let absensiRows = [];
function updateTriggerText() {
  const btnBulan = document.getElementById("btnOpenBulan");
  const btnTahun = document.getElementById("btnOpenTahun");

  if (!btnBulan || !btnTahun) return;

  // Text Bulan
  if (filterState.bulan) {
    const bulanText = bulanData.find((b) => b.v === filterState.bulan)?.t;

    btnBulan.textContent = bulanText || "Pilih Bulan";
  } else {
    btnBulan.textContent = "Pilih Bulan";
  }

  // Text Tahun
  btnTahun.textContent = filterState.tahun ? filterState.tahun : "Pilih Tahun";
}

// ===================================================
// MAIN INIT
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  // ===================================================
  // AUTH CHECK (ORTU ONLY)
  // ===================================================
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user || user.role !== "ortu") {
    alert("Anda harus login sebagai ORTU");
    window.location.href = "login.html";
    return;
  }
  // ===================================================
  // HELPER: UPDATE TRIGGER TEXT (SCOPED & SAFE)
  // ===================================================
  function updateTriggerText() {
    const placeholder = "Pilih Bulan & Tahun";

    if (!filterState.bulan || !filterState.tahun) {
      if (mobileTrigger) mobileTrigger.value = placeholder;
      if (desktopTrigger) desktopTrigger.value = placeholder;
      return;
    }

    const bulanNama = bulanData.find((x) => x.v === filterState.bulan)?.t;

    const text = `${bulanNama} ${filterState.tahun}`;

    if (mobileTrigger) mobileTrigger.value = text;
    if (desktopTrigger) desktopTrigger.value = text;
  }

  // ===================================================
  // ELEMENT REFERENCES (FILTER & TABLE)
  // ===================================================
  const tbody = document.querySelector("#tabelAbsensi tbody");
  const tableWrapper = document.querySelector(".table-responsive");

  const desktopTrigger = document.getElementById("filterDesktopTrigger");
  const mobileTrigger = document.getElementById("filterMobileTrigger");

  const bulanPicker = document.getElementById("bulanPicker");
  const tahunMobileInput = document.getElementById("tahunMobileInput");

  let table = null;
  // ===================================================
  // EVENT BUKA PILIHAN (BUKAN MODAL)
  // ===================================================
  const btnOpenBulan = document.getElementById("btnOpenBulan");
  const btnOpenTahun = document.getElementById("btnOpenTahun");

  if (btnOpenBulan) {
    btnOpenBulan.addEventListener("click", () => {
      document.getElementById("bulanList")?.classList.toggle("d-none");
      document.getElementById("tahunList")?.classList.add("d-none");
      renderMonthPicker();
    });
  }

  if (btnOpenTahun) {
    btnOpenTahun.addEventListener("click", () => {
      document.getElementById("tahunList")?.classList.toggle("d-none");
      document.getElementById("bulanList")?.classList.add("d-none");
      renderYearPicker();
    });
  }

  // ===================================================
  // DATA BULAN
  // ===================================================
  const currentYear = new Date().getFullYear();

  // Rentang tahun (misalnya -1 sampai +2)
  const tahunData = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 1 + i;
    return { v: y, t: String(y) };
  });

  // ===================================================
  // DATA BULAN
  // ===================================================
  const bulanData = [
    { v: 1, t: "Januari" },
    { v: 2, t: "Februari" },
    { v: 3, t: "Maret" },
    { v: 4, t: "April" },
    { v: 5, t: "Mei" },
    { v: 6, t: "Juni" },
    { v: 7, t: "Juli" },
    { v: 8, t: "Agustus" },
    { v: 9, t: "September" },
    { v: 10, t: "Oktober" },
    { v: 11, t: "November" },
    { v: 12, t: "Desember" },
  ];
  // ===================================================
  // HELPER: UPDATE LABEL BUTTON BULAN & TAHUN
  // ===================================================
  function updateBulanButton() {
    const btn = document.getElementById("btnOpenBulan");
    if (!btn) return;

    if (!filterState.bulan) {
      btn.textContent = "Pilih Bulan";
      btn.classList.add("text-muted");
      return;
    }

    const bulanText = bulanData.find((b) => b.v === filterState.bulan)?.t;

    btn.textContent = bulanText || "Pilih Bulan";
    btn.classList.remove("text-muted");
  }

  function updateTahunButton() {
    const btn = document.getElementById("btnOpenTahun");
    if (!btn) return;

    if (!filterState.tahun) {
      btn.textContent = "Pilih Tahun";
      btn.classList.add("text-muted");
      return;
    }

    btn.textContent = filterState.tahun;
    btn.classList.remove("text-muted");
  }

  // ===================================================
  // HELPER KHUSUS
  // ===================================================
  function renderEmptyState() {
    const wrapper = document.getElementById("absensiCardWrapper");
    if (!wrapper) return;

    wrapper.innerHTML = `
    <div class="text-center text-muted py-4">
      <div class="mb-2" style="color:#4ecdc4;">Belum Ada Data Absensi.</div>
      <div style="color:#4ecdc4;">Silakan Search Dengan Bulan dan Tahun</div>
    </div>
  `;
  }

  // Set nilai awal modal

  renderEmptyState();
  // ===================================================
  // OPEN MODAL (DESKTOP & MOBILE)
  // ===================================================
  [desktopTrigger, mobileTrigger].forEach((trigger) => {
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      $("#filterModal").modal("show");
    });
  });
  // PREPARE CONTENT WHEN MODAL OPENS
  $("#filterModal").on("show.bs.modal", () => {
    document.getElementById("bulanList").classList.add("d-none");
    document.getElementById("tahunList").classList.add("d-none");

    updateBulanButton();
    updateTahunButton();
  });

  // ===================================================
  // fungsi render month picker
  // ===================================================
  function renderMonthPicker() {
    const list = document.getElementById("bulanList");
    list.innerHTML = "";

    bulanData.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "list-group-item list-group-item-action" +
        (b.v === filterState.bulan ? " active" : "");

      btn.textContent = b.t;

      btn.onclick = () => {
        filterState.bulan = b.v;

        list.classList.add("d-none");

        updateBulanButton(); // ⬅️ INI PENTING
        updateTriggerText(); // untuk trigger utama

        if (filterState.tahun) {
          $("#filterModal").modal("hide");

          setTimeout(() => {
            showGlobalLoading(); // ⬅️ TAMBAHKAN DI SINI
            loadAbsensi();
          }, 300);
        }
      };

      list.appendChild(btn);
    });
  }

  // ===================================================
  // fungsi render year picker
  // ===================================================
  function renderYearPicker() {
    const list = document.getElementById("tahunList");
    list.innerHTML = "";

    const startYear = new Date().getFullYear() - 1;
    const endYear = new Date().getFullYear() + 2;

    for (let y = startYear; y <= endYear; y++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "list-group-item list-group-item-action" +
        (y === filterState.tahun ? " active" : "");

      btn.textContent = y;

      btn.onclick = () => {
        filterState.tahun = y;

        list.classList.add("d-none");
        updateTriggerText();

        if (filterState.bulan) {
          $("#filterModal").modal("hide");

          setTimeout(() => {
            showGlobalLoading(); // ⬅️ TAMBAHKAN DI SINI
            loadAbsensi();
          }, 300);
        }
      };

      list.appendChild(btn);
    }
  }

  // ===================================================
  // LOAD ABSENSI DATA
  // ===================================================
  async function loadAbsensi() {
    if (!filterState.bulan || !filterState.tahun) return;

    showGlobalLoading();
    await new Promise((r) => setTimeout(r, 3000)); // durasi loading
    showLoadingTable();

    try {
      const params = new URLSearchParams({
        bulan: filterState.bulan,
        tahun: filterState.tahun,
      });

      const res = await fetch(`/api/ortu/absensi/kehadiran?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Gagal mengambil data");

      const { data: rows = [] } = await res.json();
      absensiRows = rows;

      // MOBILE
      if (window.innerWidth < 768) {
        if (table) table.destroy();
        table = null;
        tableWrapper.classList.add("d-none");
        renderMobileCards(rows);
        hideGlobalLoading();
        return;
      }

      // DESKTOP
      tableWrapper.classList.remove("d-none");
      document.getElementById("absensiCardWrapper").innerHTML = "";

      if (table) table.destroy();

      table = $("#tabelAbsensi").DataTable({
        responsive: true,
        paging: true,
        searching: false,
        info: false,
        ordering: true,
        data: rows,
        columns: [
          { data: "tanggal_hari" },
          { data: "status" },
          { data: "keterangan", defaultContent: "-" },
        ],
      });
      hideGlobalLoading();
    } catch (err) {
      console.error(err);
      hideGlobalLoading();

      Swal.fire("Error", "Gagal memuat data", "error");
    }
  }

  // ===================================================
  // RENDER MOBILE CARD VIEW FUNCTION
  // ===================================================
  function renderMobileCards(rows) {
    const wrapper = document.getElementById("absensiCardWrapper");
    if (!wrapper) return;

    wrapper.innerHTML = "";

    if (!rows.length) {
      wrapper.innerHTML = `<div class="text-center text-muted py-4">Tidak ada data absensi pada bulan ini</div>`;
      return;
    }

    const statusColor = {
      hadir: "success",
      izin: "warning",
      sakit: "info",
      tidakhadir: "danger",
    };

    rows.forEach((row) => {
      wrapper.innerHTML += `
        <div class="absensi-card">
          <div class="tanggal">${row.tanggal_hari || "-"}</div>
          <div class="status"><span class="badge badge-${
            statusColor[row.status] || "secondary"
          } px-3">${(row.status || "-").toUpperCase()}</span></div>
          <div class="keterangan">${row.keterangan || "-"}</div>
        </div>
      `;
    });
  }

  // ===================================================
  // LOADING STATE FUNCTION
  // ===================================================
  function showLoadingTable() {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin fa-lg mb-2"></i><br>Memuat data absensi...</td></tr>`;
  }
});

// ===================================================
// TOPBAR USER NAME
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const displayName = document.getElementById("displayName");
  if (!displayName) return;
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));
  displayName.textContent = user?.username || "Orang Tua";
});

// ===================================================
// EXPORT PDF (PAKAI filterState)
// ===================================================
document.getElementById("btnExportPDF")?.addEventListener("click", () => {
  if (!absensiRows.length) {
    Swal.fire("Info", "Tidak ada data untuk diexport", "info");
    return;
  }
  if (!filterState.bulan || !filterState.tahun) {
    Swal.fire("Info", "Pilih bulan dan tahun terlebih dahulu", "info");
    return;
  }

  const bulanNama = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ][filterState.bulan];

  const tahun = filterState.tahun;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text(`Laporan Kehadiran`, 105, 15, { align: "center" });
  doc.text(`Bulan: ${bulanNama} ${tahun}`, 105, 22, { align: "center" });

  doc.autoTable({
    head: [["Hari/Tanggal", "Status", "Keterangan"]],
    body: absensiRows.map((r) => [
      r.tanggal_hari || "-",
      r.status || "-",
      r.keterangan || "-",
    ]),
    startY: 30,
  });

  doc.save(`Kehadiran_${bulanNama}_${tahun}.pdf`);
});

document.addEventListener("DOMContentLoaded", () => {
  const main = document.getElementById("mainContent");
  if (main) main.classList.add("show");
});

document.querySelectorAll("#accordionSidebar .nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    requestAnimationFrame(() => {
      document.body.classList.remove("sidebar-open");
    });
  });
});
