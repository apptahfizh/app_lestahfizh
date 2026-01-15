checkAuth(["ortu"]);

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

  // FILTER BULAN STYLE
  const filterBulan = document.getElementById("filterBulan");

  if (filterBulan) {
    filterBulan.addEventListener("input", () =>
      toggleFilterActive(filterBulan)
    );

    // set status awal (reload / back)
    toggleFilterActive(filterBulan);
  }

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
      bulan: getVal("filterBulan"), // YYYY-MM
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
    // RESET INPUT
    ["filterBulan", "filterSurah", "filterSurahId"].forEach((id) =>
      setVal(id, "")
    );

    document.getElementById("surahList")?.replaceChildren();

    // RESET UI STATE
    toggleFilterActive(document.getElementById("filterBulan"));
    toggleSurahFilterActive();

    // KEMBALIKAN KE EMPTY STATE
    renderRiwayatEmptyState(); // ❌ JANGAN loadRiwayatHafalan()
  });

  // ===============================
  // AUTOCOMPLETE SURAH
  // ===============================
  setupAutocompleteSurah();

  // ===============================
  // SAVE PDF → BUKA MODAL PILIH BULAN
  // ===============================
  document.getElementById("pdfBulan")?.addEventListener("change", async (e) => {
    const bulan = e.target.value; // YYYY-MM
    if (!bulan) return;

    $("#filterModal").modal("hide");

    safeShowLoader(`Menyiapkan laporan ${bulan}…`);

    try {
      await generatePdfRiwayatBulanan(bulan);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal membuat PDF", "error");
    } finally {
      safeHideLoader();
      e.target.value = ""; // reset agar bisa pilih ulang
    }
  });
  // ===============================
  // BUKA MODAL → SAVE PDF
  // ===============================
  document.getElementById("btnSavePdf")?.addEventListener("click", () => {
    const input = document.getElementById("pdfBulan");

    // reset agar change selalu terpanggil
    if (input) input.value = "";

    $("#filterModal").modal("show");
  });
});

// ===============================
// validasi riwayat hafalan/ filter
// ===============================
function validateRiwayatFilter({ bulan, surah_id }) {
  if (!bulan && !surah_id) {
    Swal.fire({
      icon: "warning",
      title: "Filter belum diisi",
      text: "Silakan pilih bulan atau surah.",
    });
    return false;
  }

  return true;
}

// ===============================
// LOAD RIWAYAT HAFALAN
// ===============================
async function loadRiwayatHafalan(filter = {}) {
  const tbody = document.querySelector("#tabelRiwayat tbody");
  if (!tbody) return;

  showLoadingTable();

  // RESET CARD LIST SEBELUM LOAD
  const cardList = document.getElementById("riwayatCardList");
  if (cardList) cardList.innerHTML = "";

  try {
    const params = new URLSearchParams({ length: 100 });

    if (filter.bulan) {
      const [year, month] = filter.bulan.split("-");
      params.append("year", year);
      params.append("month", month);
    }

    if (filter.surah_id) params.append("surah", filter.surah_id);

    const res = await fetch(`/api/hafalan/all?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) throw new Error("Gagal mengambil data riwayat hafalan");

    const { data = [] } = await res.json();
    tbody.innerHTML = "";
    Swal.close();

    // ===============================
    // FILTER CLIENT-SIDE (BULAN)
    // ===============================
    let rows = data;

    if (filter.bulan) {
      const [year, month] = filter.bulan.split("-");

      rows = data.filter((r) => {
        if (!r.tanggal) return false;
        const d = new Date(r.tanggal);
        return (
          d.getFullYear() === Number(year) && d.getMonth() + 1 === Number(month)
        );
      });
    }

    // ===============================
    // EMPTY STATE
    // ===============================
    if (rows.length === 0) {
      // EMPTY TABLE (DESKTOP)
      tbody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center text-muted py-4">
        <i class="fas fa-inbox fa-2x mb-2"></i><br>
        Belum ada riwayat hafalan<br>
        <small class="text-muted">
          Tidak ada data pada bulan/surah yang dipilih
        </small>
      </td>
    </tr>
  `;

      // EMPTY CARD LIST (MOBILE)
      renderRiwayatCardEmptyState();

      return;
    }

    // ===============================
    // RENDER TABLE
    // ===============================
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

    // RENDER CARD (MOBILE)
    renderRiwayatCards(rows);
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
// RENDER CARD LIST
// ===============================
function renderRiwayatCards(rows) {
  const container = document.getElementById("riwayatCardList");
  if (!container) return;

  container.innerHTML = "";

  rows.forEach((row) => {
    const ayatHafal = ambilAkhirAyat(row.ayat_hafal);
    const totalAyat = Number(row.total_ayat) || 0;
    const persen = totalAyat ? Math.round((ayatHafal / totalAyat) * 100) : 0;

    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="riwayat-card">
        <div class="tanggal">
          ${formatTanggalIndo(row.tanggal)}
        </div>

        <div class="surah">
          QS ${row.surah_nama}
        </div>

        <div class="label-row">
          <span class="label">Setor Ayat ke:</span>
          <span class="value">${row.ayat_setor || "-"}</span>
        </div>

        <div class="label-row">
          <span class="label">Hafalan:</span>
          <span class="value">${ayatHafal} ayat</span>
        </div>
        
         ${
           row.keterangan
             ? `<div class="keterangan">${row.keterangan}</div>`
             : ""
         }

        <div class="progress-wrapper mt-2">
          <div class="progress">
            <div
              class="progress-bar bg-success"
              style="width:${persen}%"
            ></div>
          </div>
          <div class="progress-text">${persen}%</div>
        </div>
      </div>
    `
    );
  });
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
  const cardList = document.getElementById("riwayatCardList");

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-5">
          <i class="fas fa-filter fa-2x mb-2"></i><br>
          Silakan gunakan filter untuk menampilkan riwayat hafalan
        </td>
      </tr>
    `;
  }

  if (cardList) {
    cardList.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="fas fa-filter fa-2x mb-2"></i><br>
        Silakan gunakan filter untuk menampilkan riwayat hafalan
      </div>
    `;
  }
}

//EMPTY STATE KHUSUS CARD
function renderRiwayatCardEmptyState() {
  const container = document.getElementById("riwayatCardList");
  if (!container) return;

  container.innerHTML = `
    <div class="text-center text-muted py-5">
      <i class="fas fa-inbox fa-2x mb-2"></i><br>
      Belum ada riwayat hafalan<br>
      <small class="text-muted">
        Tidak ada data pada bulan/surah yang dipilih
      </small>
    </div>
  `;
}

//FORMAT TANGGAL
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
