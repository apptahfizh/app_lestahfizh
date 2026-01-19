function normalizeStatus(status) {
  if (!status) return null;
  return status.toLowerCase().replace(/\s+/g, "_");
}

const tanggalInput = document.getElementById("tanggal");
const filterStatus = document.getElementById("filterStatus");
const tabel = document.getElementById("tabelDaftar");
const btnLoad = document.getElementById("btnLoad");
const mobileList = document.getElementById("daftar-absensiMobileList");

// rekap
const rekapTotal = document.getElementById("rekapTotal");
const rekapHadir = document.getElementById("rekapHadir");
const rekapIzin = document.getElementById("rekapIzin");
const rekapSakit = document.getElementById("rekapSakit");
const rekapTidakHadir = document.getElementById("rekapTidakHadir");

// default hari ini
tanggalInput.valueAsDate = new Date();

let allData = [];

// ===============================
// LOAD DATA
// ===============================
async function loadDaftarKehadiran() {
  const tanggal = tanggalInput.value;
  if (!tanggal) return alert("Tanggal wajib dipilih");

  window.AdminLoader?.show();

  try {
    const rawData = await apiRequest(`/absensi?tanggal=${tanggal}`);

    allData = rawData.map((p) => ({
      ...p,
      status: normalizeStatus(p.status),
    }));

    renderTable(); // desktop
    renderDaftarAbsensiCards(); // mobile
    renderRekap();
  } catch (err) {
    console.error(err);
    alert(err.message || "Gagal memuat daftar kehadiran");
  } finally {
    window.AdminLoader?.hide();
  }
}

// ===============================
// FUNGSI FILTER TERPUSAT
// ===============================
function getFilteredData() {
  const statusFilter = filterStatus.value;

  return allData.filter((p) => {
    if (!statusFilter) return true;
    return p.status === statusFilter;
  });
}

// ===============================
// TABLE
// ===============================
function renderTable() {
  tabel.innerHTML = "";

  const filtered = getFilteredData();

  const badgeMap = {
    hadir: "badge-success",
    izin: "badge-warning",
    sakit: "badge-info",
    tidak_hadir: "badge-danger",
  };

  filtered.forEach((p) => {
    let statusHtml = `<span class="text-muted">-</span>`;

    if (p.status) {
      const statusText = p.status.replace("_", " ").toUpperCase();
      const badgeClass = badgeMap[p.status] || "badge-secondary";

      statusHtml = `<span class="badge ${badgeClass}">${statusText}</span>`;
    }

    tabel.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${p.nama || "-"}</td>
        <td>${statusHtml}</td>
        <td>${p.keterangan || "-"}</td>
      </tr>
      `,
    );
  });
}

// ==============================
// RENDER DAFTAR ABSENSI CARD LIST (MOBILE)
// ==============================
function renderDaftarAbsensiCards() {
  if (!mobileList) return;

  mobileList.innerHTML = "";

  const filtered = getFilteredData();

  if (!filtered.length) {
    mobileList.innerHTML = `
      <div class="text-muted text-center mt-3">
        Tidak ada data absensi
      </div>
    `;
    return;
  }

  const badgeMap = {
    hadir: "badge-success",
    izin: "badge-warning",
    sakit: "badge-info",
    tidak_hadir: "badge-danger",
  };

  filtered.forEach((p) => {
    let statusHtml = `<span class="text-muted small">Belum diisi</span>`;

    if (p.status) {
      const statusText = p.status.replace("_", " ").toUpperCase();
      const badgeClass = badgeMap[p.status] || "badge-secondary";

      statusHtml = `<span class="badge ${badgeClass}">${statusText}</span>`;
    }

    const card = document.createElement("div");
    card.className = "daftarabsensi-card";

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-1">
        <div class="nama">👤 ${p.nama || "-"}</div>
        ${statusHtml}
      </div>

      <div class="keterangan text-muted small">
        ${p.keterangan || "-"}
      </div>
    `;

    mobileList.appendChild(card);
  });
}

// ===============================
// REKAP
// ===============================
function renderRekap() {
  const filtered = getFilteredData();

  const count = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    tidak_hadir: 0,
  };

  filtered.forEach((p) => {
    if (count[p.status] !== undefined) {
      count[p.status]++;
    }
  });

  rekapTotal.textContent = filtered.length;
  rekapHadir.textContent = count.hadir;
  rekapIzin.textContent = count.izin;
  rekapSakit.textContent = count.sakit;
  rekapTidakHadir.textContent = count.tidak_hadir;
}

// ===============================
btnLoad.addEventListener("click", loadDaftarKehadiran);
filterStatus.addEventListener("change", () => {
  renderTable();
  renderDaftarAbsensiCards();
});
// auto load
loadDaftarKehadiran();
