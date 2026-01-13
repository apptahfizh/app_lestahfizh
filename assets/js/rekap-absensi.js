// ===============================
// ELEMENT
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
    renderRekapTable();
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

  try {
    const res = await apiRequest(
      `/absensi/detail?peserta_id=${pesertaId}&bulan=${periode.bulan}&tahun=${periode.tahun}`
    );

    if (tabelDetail) {
      tabelDetail.clear().destroy();
    }

    tabelDetail = $("#tabelDetailAbsensi").DataTable({
      data: res,
      order: [[0, "asc"]],
      columns: [
        { data: "tanggal" },
        {
          data: "status",
          render: (s) => {
            const map = {
              hadir: "success",
              izin: "warning",
              sakit: "info",
              tidak_hadir: "danger",
            };
            return `<span class="badge badge-${
              map[s]
            }">${s.toUpperCase()}</span>`;
          },
        },
        {
          data: "keterangan",
          defaultContent: "-",
        },
      ],
    });
  } catch (err) {
    console.error("Gagal load detail absensi:", err);
  }
}

// ===============================
// EXPORT PDF REKAP BULANAN
// ===============================
// ===============================
// EXPORT PDF REKAP BULANAN
// ===============================
btnPdfRekap.addEventListener("click", () => {
  const periode = getBulanTahun();

  // ⛔ GUARD: belum pilih bulan
  if (!periode) {
    Swal.fire("Pilih Bulan", "Silakan pilih bulan terlebih dahulu", "warning");
    return;
  }

  // ⛔ GUARD: data kosong
  if (!dataRekap.length) {
    Swal.fire("Data Kosong", "Tidak ada data untuk diexport", "info");
    return;
  }

  // ===============================
  // LANJUT EXPORT
  // ===============================
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFontSize(14);
  doc.text("Rekap Absensi Bulanan", 14, 15);

  doc.setFontSize(10);
  doc.text(
    `Periode: ${String(periode.bulan).padStart(2, "0")}-${periode.tahun}`,
    14,
    22
  );

  const tableData = dataRekap.map((p) => [
    p.nama,
    p.hadir,
    p.izin,
    p.sakit,
    p.tidak_hadir,
  ]);

  doc.autoTable({
    startY: 28,
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
  const periode = getBulanTahun();

  if (!periode) {
    Swal.fire("Pilih Bulan", "Silakan pilih bulan terlebih dahulu", "warning");
    return;
  }

  if (!pesertaId) {
    Swal.fire("Pilih Peserta", "Silakan pilih peserta dulu", "warning");
    return;
  }

  try {
    const res = await apiRequest(
      `/absensi/detail?peserta_id=${pesertaId}&bulan=${periode.bulan}&tahun=${periode.tahun}`
    );

    if (!res.length) {
      Swal.fire("Data kosong", "Tidak ada absensi bulan ini", "info");
      return;
    }

    const namaPeserta = filterPeserta.options[filterPeserta.selectedIndex].text;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    // HEADER
    doc.setFontSize(14);
    doc.text("REKAP ABSENSI PESERTA", 105, 15, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Nama Peserta : ${namaPeserta}`, 14, 25);
    doc.text(`Periode      : ${periode.bulan}-${periode.tahun}`, 14, 31);

    // TABLE
    const tableData = res.map((r) => [
      r.tanggal,
      r.status.toUpperCase(),
      r.keterangan || "-",
    ]);

    doc.autoTable({
      startY: 38,
      head: [["Tanggal", "Status", "Keterangan"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9, halign: "center" },
      columnStyles: { 2: { halign: "left" } },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // FOOTER
    const y = doc.lastAutoTable.finalY + 20;
    doc.text("Ustadzah,", 140, y);
    doc.text("FITRIANI, S.PdI.Gr", 140, y + 20);

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
