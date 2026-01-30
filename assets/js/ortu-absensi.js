// ===================================================
// GLOBAL STATE
// ===================================================
// Satu-satunya sumber kebenaran untuk filter
let filterState = {
  bulan: null, // format: YYYY-MM
};

// ===================================================
// HELPER Split Hari Tanggal
// ===================================================
function splitHariTanggal(value) {
  if (!value) {
    return { hari: "-", tanggal: "-" };
  }

  // Case 1: ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return {
      hari: new Date(value).toLocaleDateString("id-ID", { weekday: "long" }),
      tanggal: `${d}/${m}/${y}`,
    };
  }

  // Case 2: "Rabu, 2026-01-07" atau "Rabu 2026-01-07"
  const match = value.match(
    /^(?<hari>[A-Za-zÀ-ÿ]+)[,\s]+(?<tanggal>\d{4}-\d{2}-\d{2})$/,
  );

  if (match?.groups) {
    const { hari, tanggal } = match.groups;
    const [y, m, d] = tanggal.split("-");
    return {
      hari,
      tanggal: `${d}/${m}/${y}`,
    };
  }

  // fallback aman
  return { hari: "-", tanggal: value };
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
  // EVENT FILTER BULAN (type="month")
  // ===================================================
  const filterBulan = document.getElementById("filterBulan");
  const btnFilter = document.getElementById("btnFilter");

  if (btnFilter && filterBulan) {
    btnFilter.addEventListener("click", () => {
      if (!filterBulan.value) {
        Swal.fire("Info", "Silakan pilih bulan terlebih dahulu", "info");
        return;
      }

      filterState.bulan = filterBulan.value; // YYYY-MM
      showGlobalLoading();
      loadAbsensi();
    });
  }
  // fungsi pemanggilan FILTER BULAN ketika berisi berubah warna
  if (filterBulan) {
    filterBulan.addEventListener("input", () =>
      toggleFilterActive(filterBulan),
    );

    // set status awal (reload / back)
    toggleFilterActive(filterBulan);
  }

  // ===================================================
  // ELEMENT REFERENCES (FILTER & TABLE)
  // ===================================================
  const tbody = document.querySelector("#tabelAbsensi tbody");
  const tableWrapper = document.querySelector(".table-responsive");

  let table = null;

  // ===================================================
  // DATA BULAN
  // ===================================================
  const currentYear = new Date().getFullYear();

  // ===================================================
  // HELPER KHUSUS
  // ===================================================

  renderEmptyState();

  // ===================================================
  // EMPTY STATE
  // ===================================================
  function renderEmptyState() {
    const wrapper = document.getElementById("absensiCardWrapper");
    if (!wrapper) return;

    wrapper.innerHTML = `
    <div class="text-center text-muted py-4">
      Silakan Pilih Bulan Lalu Klik <b>Cari</b>
    </div>
  `;
  }

  renderEmptyState();

  // ===================================================
  // LOAD ABSENSI DATA
  // ===================================================
  async function loadAbsensi() {
    if (!filterState.bulan) return;

    const [tahun, bulan] = filterState.bulan.split("-");

    showGlobalLoading();
    await new Promise((r) => setTimeout(r, 3000)); // durasi loading
    showLoadingTable();

    try {
      const params = new URLSearchParams({
        bulan,
        tahun,
      });

      const res = await fetch(`/api/ortu/absensi/kehadiran?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Gagal mengambil data");

      const { data: rows = [] } = await res.json();
      absensiRows = rows;

      // MOBILE
      if (window.innerWidth < 768) {
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
          {
            data: "tanggal_hari",
            render: (val) => {
              const { hari, tanggal } = splitHariTanggal(val);
              return `${hari}, ${tanggal}`;
            },
          },
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
      const { hari, tanggal } = splitHariTanggal(row.tanggal_hari);

      wrapper.innerHTML += `
    <div class="absensi-card">
      <div class="tanggal">
  <svg width="14" height="14" viewBox="0 0 448 512"
       class="mr-1" style="vertical-align:-2px">
    <path fill="currentColor"
      d="M152 64c0-13.3-10.7-24-24-24H24C10.7 40 0 50.7 0 64v384c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V64c0-13.3-10.7-24-24-24h-104c-13.3 0-24 10.7-24 24v40H152V64z"/>
  </svg>
  ${hari}, ${tanggal}
</div>

      <div class="status">
        <span class="badge badge-${
          statusColor[row.status] || "secondary"
        } px-3">
          ${(row.status || "-").toUpperCase()}
        </span>
      </div>
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
  // CEK: bulan belum dipilih
  if (!filterState.bulan) {
    Swal.fire(
      "Info",
      "Silakan pilih bulan dan klik Cari terlebih dahulu",
      "info",
    );
    return;
  }

  // CEK: data belum dimuat / kosong
  if (!window.absensiRows || !absensiRows.length) {
    Swal.fire("Info", "Data absensi belum tersedia untuk diunduh", "info");
    return;
  }

  const [tahun, bulan] = filterState.bulan.split("-");

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
  ][parseInt(bulan)];

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text(`Laporan Kehadiran`, 105, 15, { align: "center" });
  doc.text(`Bulan: ${bulanNama} ${tahun}`, 105, 22, { align: "center" });

  doc.autoTable({
    head: [["Hari", "Tanggal", "Status", "Keterangan"]],
    body: absensiRows.map((r) => {
      const { hari, tanggal } = splitHariTanggal(r.tanggal_hari);
      return [hari, tanggal, r.status || "-", r.keterangan || "-"];
    }),
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

// ===============================
// FILTER bulan terisi berubah warna
// ===============================
function toggleFilterActive(input) {
  if (!input) return;

  if (input.value && input.value !== "") {
    input.classList.add("filter-active");
  } else {
    input.classList.remove("filter-active");
  }
}
