// ===============================
// untuk UI & PDF
// ===============================
function getPeriodeText() {
  const el = document.getElementById("rekapAbsensiBulanan");
  if (!el || !el.value) return "";

  const [tahun, bulan] = el.value.split("-");
  const namaBulan = [
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
  ];

  return `${namaBulan[Number(bulan) - 1]} ${tahun}`;
}

// ===============================
// untuk API & logic
// ===============================
function getBulanTahun() {
  const el = document.getElementById("rekapAbsensiBulanan");
  if (!el || !el.value) return null;

  const [tahun, bulan] = el.value.split("-");
  return {
    bulan: Number(bulan),
    tahun: Number(tahun),
  };
}

// ===============================
// ELEMENT
// ===============================
const bulan = document.getElementById("bulan");
const tahun = document.getElementById("tahun");
const tabelRekap = document.getElementById("tabelRekap");

const btnLoad = document.getElementById("btnLoad");
const btnPdfRekap = document.getElementById("btnPdfRekap");
btnPdfRekap.disabled = true;

const btnPdfPeserta = document.getElementById("btnPdfPeserta");
const filterPeserta = document.getElementById("filterPeserta");
filterPeserta.disabled = true;

let dataRekap = [];
let tabelDetail = null;

// Helper Format Tanggal ID
function formatTanggalDMY(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);
  if (isNaN(d)) return "-";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

// ===============================
// LOAD REKAP BULANAN
// ===============================
async function loadRekap() {
  const periode = getBulanTahun();
  if (!periode) return; // ⛔ silent stop

  window.AdminLoader?.show();

  try {
    const res = await apiRequest(
      `/absensi/rekap-bulanan?bulan=${periode.bulan}&tahun=${periode.tahun}`
    );

    dataRekap = Array.isArray(res) ? res : [];

    renderRekapTable(); // DESKTOP (TABEL)
    renderRekapBulananMobile(dataRekap); // MOBILE (CARD)
  } catch (err) {
    console.error("Gagal load rekap:", err);
  } finally {
    window.AdminLoader?.hide();
  }
}

// fungsi kontrol tombol
function updateExportButtonState() {
  const periode = getBulanTahun();
  btnPdfRekap.disabled = !periode;
}

// ===============================
// RENDER TABEL REKAP
// ===============================
function renderRekapTable() {
  tabelRekap.innerHTML = "";

  if (!dataRekap.length) return;

  dataRekap.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.nama}</td>
      <td>${p.hadir || 0}</td>
      <td>${p.izin || 0}</td>
      <td>${p.sakit || 0}</td>
      <td>${p.tidak_hadir || 0}</td>
    `;
    tabelRekap.appendChild(tr);
  });
}

// ===============================
// LOAD PESERTA (DROPDOWN)
// ===============================
async function loadPeserta() {
  window.AdminLoader?.show();

  try {
    const res = await apiRequest("/peserta");

    res.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nama;
      filterPeserta.appendChild(opt);
    });
  } catch (err) {
    console.error("Gagal load peserta:", err);
    alert("Gagal memuat peserta");
  } finally {
    window.AdminLoader?.hide();
  }
}

// ===============================
// LOAD DETAIL ABSENSI PER PESERTA
// ===============================
async function loadDetailAbsensi() {
  const periode = getBulanTahun();
  const pesertaId = filterPeserta.value;

  if (!periode || !pesertaId) return;

  window.AdminLoader?.show(); // ✅ pakai loader global

  try {
    const res = await apiRequest(
      `/absensi/detail?peserta_id=${pesertaId}&bulan=${periode.bulan}&tahun=${periode.tahun}`
    );

    // === DESKTOP ===
    if (tabelDetail) {
      tabelDetail.clear().destroy();
    }

    tabelDetail = $("#tabelDetailAbsensi").DataTable({
      data: res,
      order: [[0, "asc"]],
      columns: [
        {
          data: "tanggal",
          render: (d) => formatTanggalDMY(d),
        },
        {
          data: "status",
          render: (s) => {
            const map = {
              hadir: "success",
              izin: "warning",
              sakit: "info",
              tidak_hadir: "danger",
            };
            return `<span class="badge badge-${map[s]}">
              ${s.toUpperCase()}
            </span>`;
          },
        },
        {
          data: "keterangan",
          defaultContent: "-",
        },
      ],
    });

    // === MOBILE ===
    renderDetailAbsensiMobile(res);
  } catch (err) {
    console.error("Gagal load detail absensi:", err);
    Swal.fire("Error", "Gagal memuat detail absensi", "error");
  } finally {
    window.AdminLoader?.hide(); // ✅ WAJIB di finally
  }
}

// ===============================
// EXPORT PDF REKAP BULANAN
// ===============================
btnPdfRekap.addEventListener("click", () => {
  const periode = getBulanTahun();
  if (!periode) {
    Swal.fire("Pilih Bulan", "Silakan pilih bulan terlebih dahulu", "warning");
    return;
  }

  if (!dataRekap.length) {
    Swal.fire("Data Kosong", "Tidak ada data untuk diexport", "info");
    return;
  }

  const periodeText = getPeriodeText();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("REKAP ABSENSI BULANAN", 105, 15, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("LES DZAH FITRIANI", 105, 21, { align: "center" });
  doc.line(14, 24, 196, 24);

  doc.setFontSize(10);

  let y = 32;
  const labelX = 14;
  const colonX = 45;
  const valueX = 48;

  function drawLabelValue(label, value) {
    doc.text(label, labelX, y);
    doc.text(":", colonX, y);
    doc.text(value, valueX, y);
    y += 6;
  }

  // ✅ HANYA PERIODE
  drawLabelValue("Bulan", periodeText);

  const tableData = dataRekap.map((p) => [
    p.nama,
    p.hadir,
    p.izin,
    p.sakit,
    p.tidak_hadir,
  ]);

  doc.autoTable({
    startY: y + 8,
    head: [["Nama", "Hadir", "Izin", "Sakit", "Tidak Hadir"]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [52, 58, 64] },
  });

  doc.save(
    `rekap-absensi-${String(periode.bulan).padStart(2, "0")}-${
      periode.tahun
    }.pdf`
  );
});

// ===============================
// EXPORT PDF DETAIL PER PESERTA
// ===============================
btnPdfPeserta.disabled = true;

filterPeserta.addEventListener("change", () => {
  btnPdfPeserta.disabled = !filterPeserta.value;
  loadDetailAbsensi();
});

btnPdfPeserta.addEventListener("click", exportPdfPeserta);

async function exportPdfPeserta() {
  const pesertaId = filterPeserta.value;
  if (!pesertaId) {
    Swal.fire("Pilih Peserta", "Silakan pilih peserta dulu", "warning");
    return;
  }

  const periode = getBulanTahun();
  if (!periode) {
    Swal.fire("Pilih Bulan", "Silakan pilih bulan terlebih dahulu", "warning");
    return;
  }

  const periodeText = getPeriodeText();
  const namaPeserta = filterPeserta.options[filterPeserta.selectedIndex].text;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  try {
    const res = await apiRequest(
      `/absensi/detail?peserta_id=${pesertaId}&bulan=${periode.bulan}&tahun=${periode.tahun}`
    );

    if (!res.length) {
      Swal.fire("Data kosong", "Tidak ada absensi bulan ini", "info");
      return;
    }

    // =======================
    // HEADER PDF
    // =======================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("REKAP ABSENSI", 105, 15, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("LES DZAH FITRIANI", 105, 21, { align: "center" });
    doc.line(14, 24, 196, 24);

    doc.setFontSize(10);

    let y = 32;
    const labelX = 14;
    const colonX = 45;
    const valueX = 48;

    function drawLabelValue(label, value) {
      doc.text(label, labelX, y);
      doc.text(":", colonX, y);
      doc.text(value, valueX, y);
      y += 6;
    }

    drawLabelValue("Nama", namaPeserta);
    drawLabelValue("Bulan", periodeText);

    // =======================
    // TABLE
    // =======================
    const tableData = res.map((r) => [
      formatTanggalDMY(r.tanggal),
      r.status.toUpperCase(),
      r.keterangan || "-",
    ]);

    doc.autoTable({
      startY: y + 8,
      head: [["Tanggal", "Status", "Keterangan"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9, halign: "left" },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
        2: { halign: "left" },
      },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // =======================
    // FOOTER
    // =======================
    const footerY = doc.lastAutoTable.finalY + 20;
    doc.text("Ustadzah,", 140, footerY);
    doc.text("FITRIANI, S.PdI.Gr", 140, footerY + 20);

    const fileName = `absensi-${namaPeserta
      .replace(/\s+/g, "-")
      .toLowerCase()}-${String(periode.bulan).padStart(2, "0")}-${
      periode.tahun
    }.pdf`;

    doc.save(fileName);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal export PDF", "error");
  }
}

// ===============================
// FUNGSI RESET Rekap Detail Per Peserta
// ===============================
function resetDetailAbsensi() {
  document.getElementById("detailAbsensiMobile").innerHTML = "";
  // reset dropdown peserta
  filterPeserta.value = "";
  filterPeserta.disabled = true;

  // disable tombol export detail
  btnPdfPeserta.disabled = true;

  // hapus DataTable jika ada
  if (tabelDetail) {
    tabelDetail.clear().destroy();
    tabelDetail = null;
  }
}

// ===============================
// INIT
// ===============================

(async () => {
  await loadPeserta();
  updateExportButtonState();
})();

const bulanInput = document.getElementById("rekapAbsensiBulanan");

// paksa kosong agar tidak auto pilih bulan
bulanInput.value = "";
// auto reload saat bulan berubah
bulanInput.addEventListener("change", () => {
  updateExportButtonState();
  loadRekap();
});

bulanInput.addEventListener("change", () => {
  const periode = getBulanTahun();

  resetDetailAbsensi();

  if (!periode) {
    filterPeserta.disabled = true;
    filterPeserta.value = "";
    btnPdfPeserta.disabled = true;
    return;
  }

  // ✅ aktifkan peserta
  filterPeserta.disabled = false;
  // reset pilihan peserta & detail
  filterPeserta.value = "";
  btnPdfPeserta.disabled = true;
  // load rekap bulanan
  loadRekap();
});

// ======================================
// RENDER CARD LIST MOBILE rekap bulanan
// ======================================
function renderRekapBulananMobile(data) {
  const container = document.getElementById("rekapBulananMobile");
  if (!container) return;

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = `
      <div class="text-center text-muted mt-4">
        Tidak ada data
      </div>
    `;
    return;
  }

  data.forEach((p) => {
    const card = document.createElement("div");
    card.className = "rekap-card";

    card.innerHTML = `
      <h6>👤 ${p.nama}</h6>

      <div class="rekap-row">
        <span>Hadir</span>
        <span>${p.hadir}</span>
      </div>

      <div class="rekap-row">
        <span>Izin</span>
        <span>${p.izin}</span>
      </div>

      <div class="rekap-row">
        <span>Sakit</span>
        <span>${p.sakit}</span>
      </div>

      <div class="rekap-row">
        <span>Tidak Hadir</span>
        <span>${p.tidak_hadir}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// ================================================
// RENDER CARD LIST MOBILE rekap detail per peserta
// ================================================
function renderDetailAbsensiMobile(data) {
  const container = document.getElementById("detailAbsensiMobile");
  container.innerHTML = "";

  if (!data || !data.length) {
    container.innerHTML = `
      <div class="text-muted text-center small">
        Tidak ada data absensi
      </div>`;
    return;
  }

  data.forEach((r) => {
    const badgeMap = {
      hadir: "success",
      izin: "warning",
      sakit: "info",
      tidak_hadir: "danger",
    };

    container.innerHTML += `
      <div class="card shadow-sm mb-2">
        <div class="card-body p-2">
          <div class="d-flex justify-content-between">
            <strong>${formatTanggalDMY(r.tanggal)}</strong>
            <span class="badge badge-${badgeMap[r.status]}">
              ${r.status.toUpperCase()}
            </span>
          </div>
          <div class="text-muted small mt-1">
            ${r.keterangan || "-"}
          </div>
        </div>
      </div>`;
  });
}
