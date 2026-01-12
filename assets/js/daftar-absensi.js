function normalizeStatus(status) {
  return status ? status.toLowerCase().replace(/\s+/g, "_") : status;
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

  window.AdminLoader?.show();

  try {
    const data = await apiRequest(`/absensi?tanggal=${tanggal}`);

    // 🔥 NORMALIZE SEKALI SAAT FETCH
    allData = data.map((p) => ({
      ...p,
      status: normalizeStatus(p.status),
    }));

    renderTable();
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
filterStatus.addEventListener("change", renderTable);

// auto load
loadDaftarKehadiran();
