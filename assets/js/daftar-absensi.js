const API_BASE = "http://localhost:5000";

const tanggalInput = document.getElementById("tanggal");
const filterStatus = document.getElementById("filterStatus");
const tabel = document.getElementById("tabelDaftar");
const btnLoad = document.getElementById("btnLoad");

// rekap element
const rekapTotal = document.getElementById("rekapTotal");
const rekapHadir = document.getElementById("rekapHadir");
const rekapIzin = document.getElementById("rekapIzin");
const rekapSakit = document.getElementById("rekapSakit");
const rekaptidakhadir = document.getElementById("rekaptidak hadir");

// default hari ini
tanggalInput.valueAsDate = new Date();

let allData = [];

// ===============================
// LOAD DATA DARI API
// ===============================
async function loadDaftarKehadiran() {
  const tanggal = tanggalInput.value;

  if (!tanggal) {
    alert("Tanggal wajib dipilih");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/absensi?tanggal=${tanggal}`);
    allData = await res.json();

    renderTable();
    renderRekap();
  } catch (err) {
    console.error(err);
    alert("Gagal memuat daftar kehadiran");
  }
}

// ===============================
// RENDER TABLE (WITH FILTER)
// ===============================
function renderTable() {
  const statusFilter = filterStatus.value;
  tabel.innerHTML = "";

  const filtered = allData.filter((p) => {
    if (!statusFilter) return true;
    return p.status === statusFilter;
  });

  filtered.forEach((p) => {
    let statusText = "-";
    let badgeClass = "badge-secondary";

    if (p.status) {
      statusText = p.status.toUpperCase();
      badgeClass =
        {
          hadir: "badge-success",
          izin: "badge-warning",
          sakit: "badge-info",
          tidakhadir: "badge-danger",
        }[p.status] || "badge-secondary";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nama}</td>
      <td><span class="badge ${badgeClass}">${statusText}</span></td>
      <td>${p.keterangan || "-"}</td>
    `;

    tabel.appendChild(tr);
  });
}

// ===============================
// RENDER REKAP
// ===============================
function renderRekap() {
  const total = allData.length;

  const count = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    tidakhadir: 0,
  };

  allData.forEach((p) => {
    if (p.status && count[p.status] !== undefined) {
      count[p.status]++;
    }
  });

  rekapTotal.textContent = total;
  rekapHadir.textContent = count.hadir;
  rekapIzin.textContent = count.izin;
  rekapSakit.textContent = count.sakit;
  rekaptidakhadir.textContent = count.tidakhadir;
}

// ===============================
btnLoad.addEventListener("click", loadDaftarKehadiran);
filterStatus.addEventListener("change", renderTable);

// auto load
loadDaftarKehadiran();
