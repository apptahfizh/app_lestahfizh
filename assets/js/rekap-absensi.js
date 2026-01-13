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
const btnPdfPeserta = document.getElementById("btnPdfPeserta");

const filterPeserta = document.getElementById("filterPeserta");

let dataRekap = [];
let tabelDetail = null;

// ===============================
// LOAD REKAP BULANAN
// ===============================
async function loadRekap({ silent = false } = {}) {
  const periode = getBulanTahun();

  if (!periode) {
    if (!silent) {
      alert("Silakan pilih bulan");
    }
    return;
  }

  window.AdminLoader?.show();

  try {
    const res = await apiRequest(
      `/absensi/rekap-bulanan?bulan=${periode.bulan}&tahun=${periode.tahun}`
    );

    dataRekap = Array.isArray(res) ? res : [];
    renderRekapTable();
  } catch (err) {
    console.error("Gagal load rekap:", err);
    alert("Gagal load rekap");
  } finally {
    window.AdminLoader?.hide();
  }
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
  if (!periode) return;

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
btnPdfRekap.addEventListener("click", () => {
  if (!dataRekap.length) {
    alert("Data kosong");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  doc.setFontSize(14);
  doc.text("Rekap Absensi Bulanan", 14, 15);

  doc.setFontSize(10);
  const periode = getBulanTahun();

  doc.text(`Periode: ${periode.bulan}-${periode.tahun}`, 14, 22);

  const tableData = dataRekap.map((p) => [
    p.nama,
    p.hadir,
    p.izin,
    p.sakit,
    p.tidak_hadir,
  ]);

  doc.autoTable({
    startY: 28,
    head: [["Nama", "Hadir", "Izin", "Sakit", "tidak hadir"]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [52, 58, 64] },
  });

  doc.save(`rekap-absensi-${bulan.value}-${tahun.value}.pdf`);
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

  try {
    const res = await apiRequest(
      `/absensi/detail?peserta_id=${pesertaId}&bulan=${bulan.value}&tahun=${tahun.value}`
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
    doc.text(
      `Periode      : ${bulan.options[bulan.selectedIndex].text} ${
        tahun.value
      }`,
      14,
      31
    );

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
      .toLowerCase()}-${String(bulan.value).padStart(2, "0")}-${
      tahun.value
    }.pdf`;

    doc.save(fileName);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal export PDF", "error");
  }
}

// ===============================
// INIT
// ===============================
btnLoad.addEventListener("click", () => {
  loadRekap();
});

(async () => {
  await loadPeserta();
})();

document.getElementById("rekapAbsensiBulanan").value = new Date()
  .toISOString()
  .slice(0, 7);

// ===============================
// AUTO LOAD SAAT BULAN BERUBAH
// ===============================
const bulanInput = document.getElementById("pdfBulan");

bulanInput.addEventListener("change", () => {
  loadRekap();
});
