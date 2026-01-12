function normalizeStatus(status) {
  return status ? status.toLowerCase().replace(/\s+/g, "_") : status;
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
    allData = await apiRequest(`/absensi?tanggal=${tanggal}`);

    renderTable(); // desktop
    renderMobileList(); // mobile
    renderRekap();
  } catch (err) {
    console.error(err);
    alert(err.message || "Gagal memuat daftar kehadiran");
  } finally {
    window.AdminLoader?.hide();
  }
}

// ===============================
// TABLE
// ===============================
function renderTable() {
  const statusFilter = filterStatus.value;
  tabel.innerHTML = "";

  const filtered = allData.filter((p) => {
    if (!statusFilter) return true;
    return p.status === statusFilter;
  });

  const badgeMap = {
    hadir: "badge-success",
    izin: "badge-warning",
    sakit: "badge-info",
    tidak_hadir: "badge-danger",
  };

  filtered.forEach((p) => {
    const statusText = p.status
      ? p.status.replace("_", " ").toUpperCase()
      : "-";

    const badgeClass = badgeMap[p.status] || "badge-secondary";

    const tr = document.createElement("tr");
    tr.classList.add("absensi-row");

    tr.innerHTML = `
      <td data-label="Nama">${p.nama}</td>
      <td data-label="Status">
        <span class="badge ${badgeClass}">${statusText}</span>
      </td>
      <td data-label="Keterangan">${p.keterangan || "-"}</td>
    `;

    tabel.appendChild(tr);
  });
}

// ==============================
// RENDER DAFTAR ABSENSI CARD LIST (MOBILE)
// ==============================
function renderMobileList() {
  if (!mobileList) return;

  const statusFilter = filterStatus.value;
  mobileList.innerHTML = "";

  const filtered = allData.filter((p) => {
    if (!statusFilter) return true;
    return p.status === statusFilter;
  });

  const badgeMap = {
    hadir: "badge-success",
    izin: "badge-warning",
    sakit: "badge-info",
    tidak_hadir: "badge-danger",
  };

  filtered.forEach((p) => {
    const statusText = p.status
      ? p.status.replace("_", " ").toUpperCase()
      : "-";

    const badgeClass = badgeMap[p.status] || "badge-secondary";

    const card = document.createElement("div");
    card.className = "card shadow-sm mb-2";

    card.innerHTML = `
      <div class="card-body p-2">
        <div class="d-flex justify-content-between">
          <strong>${p.nama}</strong>
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>
        <div class="text-muted small mt-1">
          ${p.keterangan || "-"}
        </div>
      </div>
    `;

    mobileList.appendChild(card);
  });
}

// ===============================
// REKAP
// ===============================
function renderRekap() {
  const count = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    tidak_hadir: 0,
  };

  allData.forEach((p) => {
    if (count[p.status] !== undefined) {
      count[p.status]++;
    }
  });

  rekapTotal.textContent = allData.length;
  rekapHadir.textContent = count.hadir;
  rekapIzin.textContent = count.izin;
  rekapSakit.textContent = count.sakit;
  rekapTidakHadir.textContent = count.tidak_hadir;
}

// ===============================
btnLoad.addEventListener("click", loadDaftarKehadiran);
filterStatus.addEventListener("change", () => {
  renderTable();
  renderMobileList();
});
// auto load
loadDaftarKehadiran();
