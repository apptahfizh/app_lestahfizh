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

  // ===============================
  // SURAH INPUT LISTENER
  // ===============================
  const surahInput = document.getElementById("filterSurah");
  const surahIdInput = document.getElementById("filterSurahId");

  if (surahInput && surahIdInput) {
    surahInput.addEventListener("input", () => {
      surahIdInput.value = "";
      toggleSurahFilterActive();
      syncFilterLock();
    });

    toggleSurahFilterActive();
  }

  // ===============================
  // FILTER BULAN
  // ===============================
  const filterBulan = document.getElementById("filterBulan");

  if (filterBulan) {
    filterBulan.addEventListener("input", () => {
      toggleFilterActive(filterBulan);
      syncFilterLock();
    });

    toggleFilterActive(filterBulan);
  }

  // ===============================
  // LOADER
  // ===============================
  (async () => {
    showGlobalLoading("Menyiapkan halaman…");

    await loadSurah();
    renderRiwayatEmptyState();

    hideGlobalLoading();
    syncFilterLock();
  })();

  // ===============================
  // FILTER BUTTON
  // ===============================
  document.getElementById("btnFilter")?.addEventListener("click", () => {
    const filter = {
      bulan: getVal("filterBulan"),
      surah_id: getVal("filterSurahId"),
    };

    if (!validateRiwayatFilter(filter)) return;

    safeShowLoader("Memuat riwayat hafalan…");
    loadRiwayatHafalan(filter);
  });

  // ===============================
  // RESET BUTTON
  // ===============================
  document.getElementById("btnReset")?.addEventListener("click", () => {
    ["filterBulan", "filterSurah", "filterSurahId"].forEach((id) =>
      setVal(id, ""),
    );

    document.getElementById("surahList")?.replaceChildren();

    toggleFilterActive(document.getElementById("filterBulan"));
    toggleSurahFilterActive();
    syncFilterLock();

    renderRiwayatEmptyState();
  });

  // ===============================
  // AUTOCOMPLETE SURAH
  // ===============================
  setupAutocompleteSurah();

  // ===============================
  // SAVE PDF
  // ===============================
  document.getElementById("pdfBulan")?.addEventListener("change", async (e) => {
    const bulan = e.target.value;
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
      e.target.value = "";
    }
  });

  document.getElementById("btnSavePdf")?.addEventListener("click", () => {
    const input = document.getElementById("pdfBulan");
    if (input) input.value = "";
    $("#filterModal").modal("show");
  });
});

// ===============================
// MUTUAL EXCLUSIVE FILTER
// ===============================
function syncFilterLock() {
  const bulanInput = document.getElementById("filterBulan");
  const surahInput = document.getElementById("filterSurah");
  const surahIdInput = document.getElementById("filterSurahId");

  if (!bulanInput || !surahInput || !surahIdInput) return;

  if (bulanInput.value) {
    surahInput.disabled = true;
    surahInput.classList.add("disabled-filter");
  } else if (surahIdInput.value) {
    bulanInput.disabled = true;
    bulanInput.classList.add("disabled-filter");
  } else {
    bulanInput.disabled = false;
    surahInput.disabled = false;
    bulanInput.classList.remove("disabled-filter");
    surahInput.classList.remove("disabled-filter");
  }
}

// ===============================
// VALIDASI
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

    if (!res.ok) throw new Error("Gagal mengambil data");

    const { data = [] } = await res.json();
    tbody.innerHTML = "";
    Swal.close();

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

    if (rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            Tidak ada data
          </td>
        </tr>
      `;
      renderRiwayatCardEmptyState();
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
          <td>${persen}%</td>
          <td>${row.keterangan || "-"}</td>
        </tr>
      `,
      );
    });

    renderRiwayatCards(rows);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data", "error");
  } finally {
    safeHideLoader();
  }
}

// ===============================
// AUTOCOMPLETE SURAH
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
          syncFilterLock();
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
// HELPERS
// ===============================
function toggleFilterActive(input) {
  if (!input) return;
  input.classList.toggle("filter-active", !!input.value);
}

function toggleSurahFilterActive() {
  const surahInput = document.getElementById("filterSurah");
  const surahIdInput = document.getElementById("filterSurahId");
  if (!surahInput || !surahIdInput) return;

  surahInput.classList.toggle("filter-active", !!surahIdInput.value);
}

function showLoadingTable() {
  const tbody = document.querySelector("#tabelRiwayat tbody");
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center py-4">Memuat data...</td>
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
