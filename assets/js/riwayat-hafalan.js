// ===============================
// VALIDASI FILTER TANGGAL
// ===============================
function validateFilterTanggal() {
  const mulai = $("#filterTanggalMulai").val();
  const selesai = $("#filterTanggalSelesai").val();

  if (!mulai && !selesai) return true;

  if (!mulai || !selesai) {
    Swal.fire({
      icon: "warning",
      title: "Filter tanggal tidak valid",
      text: "Tanggal mulai dan tanggal selesai harus diisi bersamaan",
    });
    return false;
  }

  if (mulai > selesai) {
    Swal.fire({
      icon: "warning",
      title: "Range tanggal salah",
      text: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
    });
    return false;
  }

  return true;
}

// =========================
// FLAG
// =========================
let hasSearched = false;

// ===================================
// RENDER RIWAYAT HAFALAN KE CARD LIST
// ===================================
function renderMobileCards(data) {
  const container = $("#riwayatCardList");
  container.empty();

  if (!data || data.length === 0) {
    container.html(
      `<div class="text-center text-muted py-4">Tidak ada data</div>`,
    );
    return;
  }

  data.forEach((row) => {
    const d = new Date(row.tanggal);
    const tanggal = `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}-${d.getFullYear()}`;

    const card = `
      <div class="riwayat-card">
        <div class="peserta">${row.peserta}</div>

        <div class="row-item">
          <span class="label">Tanggal</span>
          <span class="value">${tanggal}</span>
        </div>

        <div class="row-item">
          <span class="label">Setor Ayat</span>
          <span class="value">${row.ayat_setor}</span>
        </div>

        <div class="row-item">
          <span class="label">Surah</span>
          <span class="value">${row.surah_nama}</span>
        </div>

        <div class="row-item">
          <span class="label">Ayat Hafal</span>
          <span class="value">${row.ayat_hafal}</span>
        </div>

        ${
          row.keterangan
            ? `<div class="row-item">
                <span class="label">Catatan</span>
                <span class="value">${row.keterangan}</span>
              </div>`
            : ""
        }
      </div>
    `;
    container.append(card);
  });
}

function relocatePaginationToBottom() {
  if (window.innerWidth > 768) return;

  const wrapper = $("#riwayatHafalanTable").closest(".dataTables_wrapper");
  const info = wrapper.find(".dataTables_info");
  const paginate = wrapper.find(".dataTables_paginate");
  const cardList = $("#riwayatCardList");

  if (!cardList.length) return;

  if (!$("#riwayatTableFooter").length) {
    cardList.after(
      `<div id="riwayatTableFooter" class="mt-2 text-center"></div>`,
    );
  }

  const footer = $("#riwayatTableFooter");
  footer.empty().append(info).append(paginate);
}

function updateSearchButtonState() {
  const tglMulai = $("#filterTanggalMulai").val();
  const tglSelesai = $("#filterTanggalSelesai").val();
  const peserta = $("#filterPeserta").val().trim();

  const isEmpty = !tglMulai && !tglSelesai && !peserta;
  $("#btnSearch").prop("disabled", isEmpty);
}

let table = null;
let selectedPdfPeserta = "";
let selectedPdfBulan = "";

$(document).ready(function () {
  checkAuth(["admin", "ustadz"]);

  updateSearchButtonState();
  $("#filterTanggalMulai, #filterTanggalSelesai, #filterPeserta").on(
    "change input",
    updateSearchButtonState,
  );

  // ===============================
  // DATATABLE INIT (TIDAK AUTO LOAD)
  // ===============================
  table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: false,
    dom: "rt<'row mt-2 d-none d-md-flex'<'col-md-6'i><'col-md-6'p>>",

    ajax: function (dt, callback) {
      if (!hasSearched) {
        callback({
          draw: dt.draw,
          recordsTotal: 0,
          recordsFiltered: 0,
          data: [],
        });
        renderMobileCards([]);
        return;
      }

      const params = {
        draw: dt.draw,
        start: dt.start,
        length: dt.length,
        tanggal_mulai: $("#filterTanggalMulai").val(),
        tanggal_selesai: $("#filterTanggalSelesai").val(),
        peserta: $("#filterPeserta").val(),
      };

      const query = new URLSearchParams(params).toString();

      if (window.AdminLoader) AdminLoader.show();

      apiRequest(`/hafalan/all?${query}`, { method: "GET" })
        .then((res) => {
          callback(res);
          renderMobileCards(res.data);
        })
        .catch(() => {
          callback({
            draw: dt.draw,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          });
          renderMobileCards([]);
        })
        .finally(() => {
          if (window.AdminLoader) AdminLoader.hide();
        });
    },

    columns: [
      {
        data: null,
        render: (d, t, r, m) => m.row + m.settings._iDisplayStart + 1,
      },
      {
        data: "tanggal",
        render: (data) => {
          if (!data) return "-";
          const d = new Date(data);
          return `${String(d.getDate()).padStart(2, "0")}-${String(
            d.getMonth() + 1,
          ).padStart(2, "0")}-${d.getFullYear()}`;
        },
      },
      { data: "peserta" },
      { data: "surah_nama" },
      { data: "ayat_hafal" },
      { data: "ayat_setor" },
      { data: "keterangan" },
    ],

    drawCallback: function () {
      relocatePaginationToBottom();
      $(".page-item.previous .page-link").html("‹");
      $(".page-item.next .page-link").html("›");
    },
  });

  // ===============================
  // BUTTON SEARCH
  // ===============================
  $("#btnSearch").on("click", function () {
    if (!validateFilterTanggal()) return;
    hasSearched = true;
    table.ajax.reload();
  });

  // ===============================
  // RESET
  // ===============================
  $("#resetFilter").on("click", function () {
    $("#filterTanggalMulai").val("");
    $("#filterTanggalSelesai").val("");
    $("#filterPeserta").val("");

    updateSearchButtonState();

    hasSearched = false;
    table.clear().draw();
    renderMobileCards([]);
  });

  // ===============================
  // OPEN MODAL SAVE PDF
  // ===============================
  $("#btnSavePdf").on("click", function () {
    $("#pdfPeserta").val("");
    $("#pdfBulan").val("").prop("disabled", true);
    selectedPdfPeserta = "";
    selectedPdfBulan = "";
    $("#savePdfModal").modal("show");
  });

  $("#pdfPeserta").on("input", function () {
    const val = $(this).val().trim();
    if (val.length < 2) {
      $("#pdfBulan").prop("disabled", true);
      return;
    }
    selectedPdfPeserta = val;
    $("#pdfBulan").prop("disabled", false);
  });

  $("#pdfBulan").on("change", function () {
    if (!selectedPdfPeserta) return;
    selectedPdfBulan = $(this).val();
    generatePdfRiwayat(selectedPdfPeserta, selectedPdfBulan);
    $("#savePdfModal").modal("hide");
  });
});

// ===============================
// HELPER FORMAT
// ===============================
function formatTanggalID(dateString) {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}-${d.getFullYear()}`;
}

function formatTanggalWaktuID(date = new Date()) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}-${d.getFullYear()} ${String(d.getHours()).padStart(
    2,
    "0",
  )}:${String(d.getMinutes()).padStart(2, "0")} WIB`;
}

// ===============================
// GENERATE PDF (ANTI LOADER NYANGKUT)
// ===============================
async function generatePdfRiwayat(peserta, bulan) {
  try {
    if (window.AdminLoader) AdminLoader.show();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const res = await apiRequest(
      `/hafalan/all?peserta=${encodeURIComponent(peserta)}`,
      { method: "GET" },
    );

    const rows = res.data
      .filter((d) => d.tanggal.startsWith(bulan))
      .map((d) => [
        formatTanggalID(d.tanggal),
        d.ayat_setor,
        d.surah_nama,
        d.ayat_hafal,
        d.keterangan || "-",
      ]);

    if (rows.length === 0) {
      Swal.fire("Info", "Tidak ada data pada bulan tersebut", "info");
      return;
    }

    const bulanLabel = new Date(bulan + "-01").toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(14);
    doc.text("Hafalan Peserta", 14, 15);
    doc.setFontSize(11);
    doc.text(`Nama: ${peserta}`, 14, 24);
    doc.text(`Bulan: ${bulanLabel}`, 14, 30);
    doc.setFontSize(9);
    doc.text(`Diunduh: ${formatTanggalWaktuID()}`, 14, 36);

    doc.autoTable({
      startY: 42,
      head: [["Tanggal", "Setor Ayat", "Surah", "Ayat Hafal", "Catatan"]],
      body: rows,
      styles: { fontSize: 9 },
    });

    doc.save(`Riwayat-Hafalan-${peserta}-${bulan}.pdf`);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal membuat PDF", "error");
  } finally {
    if (window.AdminLoader) AdminLoader.hide();
  }
}
