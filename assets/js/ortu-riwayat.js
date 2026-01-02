checkAuth(["ortu"]);
// ===================================================
// GLOBAL STATE (ORTU RIWAYAT PDF)
// ===================================================
let riwayatFilterState = {
  bulan: null,
  tahun: null,
};
// ===============================
// DATA BULAN (GLOBAL)
// ===============================
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

document.addEventListener("DOMContentLoaded", () => {
  const safeShowLoader = (text) =>
    typeof showGlobalLoading === "function" && showGlobalLoading(text);

  const safeHideLoader = () =>
    typeof hideGlobalLoading === "function" && hideGlobalLoading();

  // SET JUDUL HALAMAN (NAMA PESERTA)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nameEl = document.querySelector("#pageTitle .topbar-name");

  if (nameEl && user.username) {
    nameEl.textContent = user.username;
  }
  // END SET JUDUL HALAMAN (NAMA PESERTA)

  // SURAH INPUT LISTENER
  const surahInput = document.getElementById("filterSurah");
  const surahIdInput = document.getElementById("filterSurahId");

  if (surahInput && surahIdInput) {
    surahInput.addEventListener("input", () => {
      // Jika user mengubah teks manual → invalidasi ID
      surahIdInput.value = "";
      toggleSurahFilterActive();
    });

    // Saat reload halaman
    toggleSurahFilterActive();
  }
  // END SURAH INPUT LISTENER

  // LOADER
  (async () => {
    showGlobalLoading("Menyiapkan halaman…");

    await loadSurah();
    renderRiwayatEmptyState(); // ⬅️ tampilkan tabel kosong

    hideGlobalLoading();
  })();
  // END LOADER

  // ===============================
  // FILTER BUTTON
  // ===============================
  document.getElementById("btnFilter")?.addEventListener("click", () => {
    const filter = {
      tanggal_mulai: getVal("filterTanggalMulai"),
      tanggal_selesai: getVal("filterTanggalSelesai"),
      surah_id: getVal("filterSurahId"),
    };

    // VALIDASI WAJIB (SEBELUM FETCH)
    if (!validateRiwayatFilter(filter)) return;

    // LOADER + FETCH
    safeShowLoader("Memuat riwayat hafalan…");
    loadRiwayatHafalan(filter);
  });

  // ===============================
  // RESET BUTTON
  // ===============================
  document.getElementById("btnReset")?.addEventListener("click", () => {
    [
      "filterTanggalMulai",
      "filterTanggalSelesai",
      "filterSurah",
      "filterSurahId",
    ].forEach((id) => setVal(id, ""));

    document.getElementById("surahList")?.replaceChildren();

    renderRiwayatEmptyState(); // ⬅️ BALIK KOSONG
    toggleSurahFilterActive();
    toggleFilterActive(document.getElementById("filterTanggalMulai"));
    toggleFilterActive(document.getElementById("filterTanggalSelesai"));
    toggleSurahFilterActive();

    safeShowLoader("Memuat ulang data…");
    loadRiwayatHafalan();
  });

  // ===============================
  // TANGGAL FILTER STYLE
  // ===============================
  const tanggalMulai = document.getElementById("filterTanggalMulai");
  const tanggalSelesai = document.getElementById("filterTanggalSelesai");

  [tanggalMulai, tanggalSelesai].forEach((input) => {
    if (!input) return;

    // saat user memilih tanggal
    input.addEventListener("input", () => toggleFilterActive(input));

    // saat reload halaman (persist value)
    toggleFilterActive(input);
  });

  // ===============================
  // AUTOCOMPLETE SURAH
  // ===============================
  setupAutocompleteSurah();

  // ===============================
  // SAVE PDF → BUKA MODAL PILIH BULAN
  // ===============================
  document.getElementById("btnSavePdf")?.addEventListener("click", () => {
    $("#filterModal").modal("show");
  });
});

// ===============================
//BUTTON HANDLER
// ===============================

//Open Bulan
document.getElementById("btnOpenBulan")?.addEventListener("click", () => {
  document.getElementById("bulanList")?.classList.toggle("d-none");
  document.getElementById("tahunList")?.classList.add("d-none");
  renderRiwayatMonthPicker();
});
//Open Tahun
document.getElementById("btnOpenTahun")?.addEventListener("click", () => {
  document.getElementById("tahunList")?.classList.toggle("d-none");
  document.getElementById("bulanList")?.classList.add("d-none");
  renderRiwayatYearPicker();
});
//RENDER BULAN
function renderRiwayatMonthPicker() {
  const list = document.getElementById("bulanList");
  if (!list) return;

  list.innerHTML = "";

  bulanData.forEach((b) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "list-group-item list-group-item-action" +
      (b.v === riwayatFilterState.bulan ? " active" : "");

    btn.textContent = b.t;

    btn.onclick = () => {
      riwayatFilterState.bulan = b.v;
      list.classList.add("d-none");
      updateRiwayatButtonText();

      if (riwayatFilterState.tahun) {
        $("#filterModal").modal("hide");
        triggerRiwayatPdf();
      }
    };

    list.appendChild(btn);
  });
}
//RENDER TAHUN
function renderRiwayatYearPicker() {
  const list = document.getElementById("tahunList");
  if (!list) return;

  list.innerHTML = "";

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 1;
  const endYear = currentYear + 2;

  for (let y = startYear; y <= endYear; y++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "list-group-item list-group-item-action" +
      (y === riwayatFilterState.tahun ? " active" : "");

    btn.textContent = y;

    btn.onclick = () => {
      riwayatFilterState.tahun = y;
      list.classList.add("d-none");
      updateRiwayatButtonText();

      if (riwayatFilterState.bulan) {
        $("#filterModal").modal("hide");
        triggerRiwayatPdf();
      }
    };

    list.appendChild(btn);
  }
} //END BUTTON HANDLER

// ===============================
// UPDATE TEXT BUTTON (BULAN & TAHUN) — GLOBAL
// ===============================
function updateRiwayatButtonText() {
  const btnBulan = document.getElementById("btnOpenBulan");
  const btnTahun = document.getElementById("btnOpenTahun");

  if (btnBulan) {
    if (riwayatFilterState.bulan) {
      const bulan = bulanData.find((b) => b.v === riwayatFilterState.bulan);
      btnBulan.textContent = bulan ? bulan.t : "Pilih Bulan";
    } else {
      btnBulan.textContent = "Pilih Bulan";
    }
  }

  if (btnTahun) {
    btnTahun.textContent = riwayatFilterState.tahun || "Pilih Tahun";
  }
}

// ===============================
//TRIGGER PDF
// ===============================
async function triggerRiwayatPdf() {
  if (!riwayatFilterState.bulan || !riwayatFilterState.tahun) return;

  const bulan = String(riwayatFilterState.bulan).padStart(2, "0");
  const periode = `${riwayatFilterState.tahun}-${bulan}`;

  safeShowLoader(`Menyiapkan laporan ${periode}…`);

  try {
    await generatePdfRiwayatBulanan(periode);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal membuat PDF", "error");
  } finally {
    safeHideLoader();
  }
}

// ===============================
// validasi riwayat hafalan/ filter
// ===============================
function validateRiwayatFilter({ tanggal_mulai, tanggal_selesai, surah_id }) {
  const startFilled = !!tanggal_mulai;
  const endFilled = !!tanggal_selesai;
  const surahFilled = !!surah_id;

  // 🚫 1️⃣ SEMUA KOSONG → BLOK
  if (!startFilled && !endFilled && !surahFilled) {
    Swal.fire({
      icon: "warning",
      title: "Filter belum diisi",
      text: "Silakan isi minimal salah satu filter (tanggal atau surah).",
    });
    return false;
  }

  // 🚫 2️⃣ SALAH SATU TANGGAL SAJA
  if (startFilled !== endFilled) {
    Swal.fire({
      icon: "warning",
      title: "Filter tanggal tidak lengkap",
      text: "Tanggal mulai dan tanggal selesai harus diisi keduanya.",
    });
    return false;
  }

  // 🚫 3️⃣ URUTAN TANGGAL SALAH
  if (startFilled && endFilled) {
    const startDate = new Date(tanggal_mulai);
    const endDate = new Date(tanggal_selesai);

    if (endDate < startDate) {
      Swal.fire({
        icon: "warning",
        title: "Rentang tanggal tidak valid",
        text: "Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.",
      });
      return false;
    }
  }

  // ✅ VALID
  return true;
}

// ===============================
// LOAD RIWAYAT HAFALAN
// ===============================
async function loadRiwayatHafalan(filter = {}) {
  const tbody = document.querySelector("#tabelRiwayat tbody");
  if (!tbody) return;

  showLoadingTable();

  try {
    const params = new URLSearchParams({ length: 100 });

    if (filter.tanggal_mulai)
      params.append("tanggal_mulai", filter.tanggal_mulai);
    if (filter.tanggal_selesai)
      params.append("tanggal_selesai", filter.tanggal_selesai);
    if (filter.surah_id) params.append("surah", filter.surah_id);

    const res = await fetch(`/api/hafalan/all?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) throw new Error("Gagal mengambil data riwayat hafalan");

    const { data: rows = [] } = await res.json();
    tbody.innerHTML = "";
    Swal.close();

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            <i class="fas fa-inbox fa-2x mb-2"></i><br>
            Belum ada riwayat hafalan<br>
            <small class="text-muted">
              Silakan ubah filter atau tunggu setoran berikutnya
            </small>
          </td>
        </tr>
      `;
      return;
    }

    rows.forEach((row, i) => {
      const ayatHafal = ambilAkhirAyat(row.ayat_hafal);
      const totalAyat = Number(row.total_ayat) || 0;
      const persen = totalAyat ? Math.round((ayatHafal / totalAyat) * 100) : 0;

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${i + 1}</td>
          <td>${formatTanggalIndo(row.tanggal)}</td>
          <td>${row.ayat_setor || "-"}</td>
          <td>QS ${row.surah_nama}</td>
          <td>${ayatHafal}</td>
          <td>
            <div class="progress-wrapper">
              <div class="progress">
                <div
                  class="progress-bar bg-success"
                  style="width:${persen}%"
                ></div>
              </div>
              <div class="progress-text">${persen}%</div>
            </div>
          </td>
          <td>${row.keterangan || "-"}</td>
        </tr>
      `
      );
    });
  } catch (err) {
    console.error(err);

    Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: "Silakan coba kembali beberapa saat lagi.",
    });

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          Terjadi kesalahan saat memuat data
        </td>
      </tr>
    `;
  } finally {
    safeHideLoader();
  }
}

// ===============================
// AUTOCOMPLETE SURAH (MOBILE FRIENDLY)
// ===============================
let daftarSurah = [];

function setupAutocompleteSurah() {
  const input = document.getElementById("filterSurah");
  const list = document.getElementById("surahList");
  if (!input || !list) return;

  input.addEventListener("input", () => {
    const keyword = input.value.toLowerCase();
    list.innerHTML = "";
    if (!keyword) return;

    daftarSurah
      .filter((s) => s.nama_surah.toLowerCase().includes(keyword))
      .slice(0, 6)
      .forEach((s) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "list-group-item list-group-item-action py-3";
        btn.textContent = s.nama_surah;
        btn.onclick = () => {
          input.value = s.nama_surah;
          setVal("filterSurahId", s.id);
          list.innerHTML = "";
          toggleSurahFilterActive();
        };
        list.appendChild(btn);
      });
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.innerHTML = "";
    }
  });

  toggleSurahFilterActive();
}

// ===============================
// LOAD SURAH
// ===============================
async function loadSurah() {
  try {
    const res = await fetch("/api/surah", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    daftarSurah = await res.json();
  } catch (err) {
    console.error("Gagal load surah", err);
  }
}

// ===============================
// UI HELPERS
// ===============================
function showLoadingTable() {
  const tbody = document.querySelector("#tabelRiwayat tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center text-muted py-4">
        <i class="fas fa-spinner fa-spin fa-lg mb-2"></i><br>
        Memuat riwayat hafalan...
      </td>
    </tr>
  `;
}

function ambilAkhirAyat(range) {
  if (!range) return 0;
  const parts = range.split("-");
  return parseInt(parts[parts.length - 1].trim()) || 0;
}

function getVal(id) {
  return document.getElementById(id)?.value || "";
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
// ===============================
// FILTER INPUT BACKGROUND HANDLER
// ===============================
function toggleFilterActive(input) {
  if (!input) return;

  if (input.value && input.value !== "") {
    input.classList.add("filter-active");
  } else {
    input.classList.remove("filter-active");
  }
}
// ===============================
// SURAH FILTER BACKGROUND HANDLER
// ===============================
function toggleSurahFilterActive() {
  const surahInput = document.getElementById("filterSurah");
  const surahIdInput = document.getElementById("filterSurahId");

  if (!surahInput || !surahIdInput) return;

  if (surahIdInput.value) {
    surahInput.classList.add("filter-active");
  } else {
    surahInput.classList.remove("filter-active");
  }
}
// ===============================
// SAFE GLOBAL LOADER
// ===============================
function safeShowLoader(text = "Memuat data…") {
  if (typeof showGlobalLoading === "function") {
    showGlobalLoading(text);
  }
}

function safeHideLoader() {
  if (typeof hideGlobalLoading === "function") {
    hideGlobalLoading();
  }
}

// =================================================
// GENERATE PDF RIWAYAT HAFALAN BULANAN (FINAL)
// =================================================
async function generatePdfRiwayatBulanan(monthYear) {
  // monthYear = "YYYY-MM"
  const [year, month] = monthYear.split("-");

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const bulanLabel = new Date(year, month - 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    // ===== HEADER =====
    doc.setFontSize(14);
    doc.text("Riwayat Hafalan", 14, 15);

    doc.setFontSize(10);
    doc.text(`Nama: ${user.username || "-"}`, 14, 22);
    doc.text(`Bulan: ${bulanLabel}`, 14, 28);

    // ===== FETCH DATA =====
    const params = new URLSearchParams({
      month,
      year,
      length: 1000,
    });

    const res = await fetch(`/api/hafalan/all?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) throw new Error("Gagal mengambil data");

    const { data = [] } = await res.json();

    const filteredData = data.filter((r) => {
      if (!r.tanggal) return false;
      const d = new Date(r.tanggal);
      return (
        d.getFullYear() === Number(year) && d.getMonth() + 1 === Number(month)
      );
    });

    if (!filteredData.length) {
      Swal.fire({
        icon: "info",
        title: "Data kosong",
        text: `Tidak ada riwayat hafalan pada bulan ${bulanLabel}.`,
      });
      return;
    }

    // ===== TABLE =====
    const body = filteredData.map((r, i) => {
      const ayat = ambilAkhirAyat(r.ayat_hafal);
      const total = Number(r.total_ayat) || 0;
      const persen = total ? Math.round((ayat / total) * 100) : 0;

      return [
        i + 1,
        formatTanggalIndo(r.tanggal),
        r.ayat_setor || "-",
        `QS ${r.surah_nama}`,
        ayat,
        `${persen}%`,
        r.keterangan || "-",
      ];
    });

    doc.autoTable({
      startY: 35,
      head: [
        [
          "No",
          "Tanggal",
          "Ayat Setor",
          "Surah",
          "Ayat Hafal",
          "Progress",
          "Keterangan",
        ],
      ],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save(`Riwayat-Hafalan-${bulanLabel}.pdf`);
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Gagal membuat PDF",
      text: "Terjadi kesalahan saat membuat laporan.",
    });
  }
}

//EMPTY STATE
function renderRiwayatEmptyState() {
  const tbody = document.querySelector("#tabelRiwayat tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center text-muted py-5">
        <i class="fas fa-filter fa-2x mb-2"></i><br>
        Silakan gunakan filter untuk menampilkan riwayat hafalan
      </td>
    </tr>
  `;
}

function formatTanggalIndo(dateString) {
  if (!dateString) return "-";

  const d = new Date(dateString);

  if (isNaN(d)) return "-";

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
