function normalizeStatus(status) {
  return status ? status.replace(/\s+/g, "_") : status;
}

const tanggalInput = document.getElementById("tanggal");
const filterStatus = document.getElementById("filterStatus");
const tabel = document.getElementById("tabelDaftar");
const btnLoad = document.getElementById("btnLoad");

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

  // 🔥 TAMPILKAN LOADER
  window.AdminLoader?.show();

  try {
    allData = await apiRequest(`/absensi?tanggal=${tanggal}`);
    renderTable();
    renderRekap();
  } catch (err) {
    console.error(err);
    alert(err.message || "Gagal memuat daftar kehadiran");
  } finally {
    // 🔥 PASTI DISEMBUNYIKAN
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

  filtered.forEach((p) => {
    const badgeMap = {
      hadir: "badge-success",
      izin: "badge-warning",
      sakit: "badge-info",
      tidak_hadir: "badge-danger",
    };

    const statusText = statusKey
      ? statusKey.replace("_", " ").toUpperCase()
      : "-";

    const statusKey = normalizeStatus(p.status);
    const badgeClass = badgeMap[statusKey] || "badge-secondary";

    tabel.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${p.nama}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>${p.keterangan || "-"}</td>
      </tr>
    `
    );
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
    const key = normalizeStatus(p.status);
    if (count[key] !== undefined) count[key]++;
  });

  rekapTotal.textContent = allData.length;
  rekapHadir.textContent = count.hadir;
  rekapIzin.textContent = count.izin;
  rekapSakit.textContent = count.sakit;
  rekapTidakHadir.textContent = count.tidak_hadir;
}

// ===============================
btnLoad.addEventListener("click", loadDaftarKehadiran);
filterStatus.addEventListener("change", renderTable);

// auto load
loadDaftarKehadiran();
