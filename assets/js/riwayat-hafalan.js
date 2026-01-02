// =========================
// LOADER WRAPPER (PAGE LEVEL)
// =========================
function withLoader(promise) {
  if (window.AdminLoader) AdminLoader.show();

  return promise.finally(() => {
    if (window.AdminLoader) AdminLoader.hide();
  });
}

// ===============================
// VALIDASI FILTER TANGGAL (GLOBAL)
// ===============================
function validateFilterTanggal() {
  const mulai = $("#filterTanggalMulai").val();
  const selesai = $("#filterTanggalSelesai").val();

  // Keduanya kosong → OK
  if (!mulai && !selesai) return true;

  // Salah satu saja → TOLAK
  if (!mulai || !selesai) {
    Swal.fire({
      icon: "warning",
      title: "Filter tanggal tidak valid",
      text: "Tanggal mulai dan tanggal selesai harus diisi bersamaan",
    });
    return false;
  }

  // Range terbalik
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
// FLAG LOADER
// =========================
let suppressLoader = false;

// ===================================
// RENDER RIWAYAT HAFALAN KE CARD LIST
// ===================================
function renderMobileCards(data) {
  const container = $("#riwayatCardList");
  container.empty();

  if (!data || data.length === 0) {
    container.html(
      `<div class="text-center text-muted py-4">Tidak ada data</div>`
    );
    return;
  }

  data.forEach((row) => {
    const d = new Date(row.tanggal);
    const tanggal = `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
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

  // Buat container footer jika belum ada
  if (!$("#riwayatTableFooter").length) {
    cardList.after(`
      <div id="riwayatTableFooter" class="mt-2 text-center"></div>
    `);
  }

  const footer = $("#riwayatTableFooter");

  footer.empty().append(info).append(paginate);
}

// helper GLOBAL untuk tombol cari
function updateSearchButtonState() {
  const tglMulai = $("#filterTanggalMulai").val();
  const tglSelesai = $("#filterTanggalSelesai").val();
  const peserta = $("#filterPeserta").val().trim();

  const isEmpty = !tglMulai && !tglSelesai && !peserta;

  $("#btnSearch").prop("disabled", isEmpty);
}

$(document).ready(function () {
  // =========================
  // AUTH
  // =========================
  checkAuth(["admin", "ustadz"]);

  updateSearchButtonState();

  $("#filterTanggalMulai, #filterTanggalSelesai, #filterPeserta").on(
    "change input",
    function () {
      updateSearchButtonState();
    }
  );

  // Fungsi load peserta untuk modal save pdf
  loadAllPesertaForPdf();
  async function loadAllPesertaForPdf() {
    try {
      const res = await apiRequest("/peserta/simple", {
        method: "GET",
      });

      const data = Array.isArray(res) ? res : res.data || [];
      const select = $("#pdfPeserta");

      select.empty().append(`<option value="">-- Pilih Peserta --</option>`);

      data.forEach((p) => {
        select.append(`<option value="${p.nama}">${p.nama}</option>`);
      });
    } catch (err) {
      console.error("Gagal load peserta:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat daftar peserta",
        text: "Periksa koneksi atau endpoint peserta",
      });
    }
  }

  // ===============================
  // DATATABLES INIT
  // ===============================
  table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: false,

    // DOM hanya untuk desktop
    dom: "rt<'row mt-2 d-none d-md-flex'<'col-md-6'i><'col-md-6'p>>",

    ajax: function (dt, callback) {
      const tanggalMulai = $("#filterTanggalMulai").val();
      const tanggalSelesai = $("#filterTanggalSelesai").val();
      const peserta = $("#filterPeserta").val();

      if (
        (tanggalMulai && !tanggalSelesai) ||
        (!tanggalMulai && tanggalSelesai)
      ) {
        Swal.fire({
          icon: "warning",
          title: "Filter Tanggal Tidak Lengkap",
          text: "Pilih tanggal mulai dan tanggal selesai",
        });

        callback({
          draw: dt.draw,
          recordsTotal: 0,
          recordsFiltered: 0,
          data: [],
        });
        return;
      }

      const params = {
        draw: dt.draw,
        start: dt.start,
        length: dt.length,
        search: dt.search?.value || "",
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        peserta,
      };

      const query = new URLSearchParams(params).toString();
      const request = apiRequest(`/hafalan/all?${query}`, { method: "GET" });
      const wrapped = suppressLoader ? request : withLoader(request);

      wrapped
        .then((res) => {
          callback(res);
          renderMobileCards(res.data);
        })
        .catch(() =>
          callback({
            draw: dt.draw,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          })
        );
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
            d.getMonth() + 1
          ).padStart(2, "0")}-${d.getFullYear()}`;
        },
      },
      { data: "peserta" },
      { data: "surah_nama" },
      { data: "ayat_hafal" },
      { data: "ayat_setor" },
      { data: "keterangan" },
    ],

    pageLength: 10,
    lengthMenu: [10, 25, 50, 100],

    // 🔥 INI POSISI drawCallback YANG BENAR
    drawCallback: function () {
      relocatePaginationToBottom();

      $(".page-item.previous .page-link").html("‹");
      $(".page-item.next .page-link").html("›");
    },
  });

  // ===============================
  // EVENT FILTER
  // ===============================

  // ❌ Tidak auto-search saat ketik
  $("#filterPeserta").on("input", function () {
    suppressLoader = true; // jangan tampilkan loader
  });

  // Filter tanggal → reload jika valid
  $("#filterTanggalMulai, #filterTanggalSelesai").on("change", function () {
    if (!validateFilterTanggal()) return;

    suppressLoader = false;
    table.ajax.reload();
  });

  // ===============================
  // TOMBOL SEARCH
  // ===============================
  $("#btnSearch").on("click", function () {
    if (!validateFilterTanggal()) return;

    suppressLoader = false; // loader aktif
    table.ajax.reload();
  });

  // ===============================
  // RESET FILTER
  // ===============================
  $("#resetFilter").on("click", function () {
    $("#filterTanggalMulai").val("");
    $("#filterTanggalSelesai").val("");
    $("#filterPeserta").val("");

    updateSearchButtonState(); // 🔥 ini penting untuk nonaktifkan cari saat reset
    suppressLoader = false;
    table.ajax.reload();
  });
});

// =========================
// GLOBAL VAR
// =========================
let table = null;
suppressLoader = false;
let selectedPdfPeserta = "";
let selectedPdfBulan = "";

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

// PESERTA AUTOCOMPLETE (Modal save pdf)
$("#pdfPeserta").on("input", function () {
  const val = $(this).val().trim();

  if (val.length < 2) {
    $("#pdfBulan").prop("disabled", true);
    return;
  }

  selectedPdfPeserta = val;
  $("#pdfBulan").prop("disabled", false);
});

// BULAN CLICK VALIDATION modal save pdf
$("#pdfBulan").on("focus", function () {
  if (!selectedPdfPeserta) {
    Swal.fire({
      icon: "warning",
      title: "Peserta belum dipilih",
      text: "Silakan pilih peserta terlebih dahulu",
    });
    $(this).blur();
  }
});

// BULAN CHANGE → AUTO GENERATE PDF
$("#pdfBulan").on("change", function () {
  if (!selectedPdfPeserta) return;

  selectedPdfBulan = $(this).val();

  generatePdfRiwayat(selectedPdfPeserta, selectedPdfBulan);
  $("#savePdfModal").modal("hide");
});

// helper format tanggal & waktu (GLOBAL)
function formatTanggalWaktuID(date = new Date()) {
  const d = new Date(date);

  const tanggal = String(d.getDate()).padStart(2, "0");
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tahun = d.getFullYear();

  const jam = String(d.getHours()).padStart(2, "0");
  const menit = String(d.getMinutes()).padStart(2, "0");

  return `${tanggal}-${bulan}-${tahun} ${jam}:${menit} WIB`;
}

// ===============================
// GENERATE PDF (jsPDF + autoTable)
// ===============================
async function generatePdfRiwayat(peserta, bulan) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // ===============================
  // AMBIL DATA RIWAYAT DARI API
  // ===============================
  const res = await apiRequest(
    `/hafalan/all?peserta=${encodeURIComponent(peserta)}`,
    { method: "GET" }
  );

  // ===============================
  // FILTER BULAN (YYYY-MM)
  // ===============================
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
    Swal.fire({
      icon: "warning",
      title: "Data tidak ditemukan",
      text: "Tidak ada riwayat hafalan pada bulan yang dipilih",
    });
    return;
  }

  // ===============================
  // HEADER PDF
  // ===============================
  const bulanLabel = new Date(bulan + "-01").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(14);
  doc.text("Hafalan Peserta", 14, 15);

  doc.setFontSize(11);
  doc.text(`Nama  : ${peserta}`, 14, 24);
  doc.text(`Bulan : ${bulanLabel}`, 14, 30);

  // 🔥 TANGGAL & WAKTU CETAK PDF
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Diunduh pada: ${formatTanggalWaktuID()}`, 14, 36);

  doc.setTextColor(0); // reset warna teks

  // ===============================
  // TABLE PDF
  // ===============================
  doc.autoTable({
    startY: 42,
    head: [["Tanggal", "Setor Ayat", "Surah", "Ayat Hafal", "Catatan"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 163, 74] },
  });

  doc.save(`Riwayat-Hafalan-${peserta}-${bulan}.pdf`);
}

// Helper format tanggal untuk hasil generate pdf
function formatTanggalID(dateString) {
  if (!dateString) return "-";

  const d = new Date(dateString);

  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;
}
