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
let suppressLoader = false;
let hasSearched = false; // 🔥 penting: cegah auto load

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

$(document).ready(function () {
  checkAuth(["admin", "ustadz"]);

  updateSearchButtonState();

  $("#filterTanggalMulai, #filterTanggalSelesai, #filterPeserta").on(
    "change input",
    function () {
      updateSearchButtonState();
    },
  );

  // ===============================
  // LOAD PESERTA UNTUK PDF
  // ===============================
  loadAllPesertaForPdf();
  async function loadAllPesertaForPdf() {
    try {
      const res = await apiRequest("/peserta/simple", { method: "GET" });
      const data = Array.isArray(res) ? res : res.data || [];
      const select = $("#pdfPeserta");

      select.empty().append(`<option value="">-- Pilih Peserta --</option>`);
      data.forEach((p) => {
        select.append(`<option value="${p.nama}">${p.nama}</option>`);
      });
    } catch (err) {
      console.error("Gagal load peserta:", err);
    }
  }

  // ===============================
  // DATATABLE INIT
  // ===============================
  table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: false,
    dom: "rt<'row mt-2 d-none d-md-flex'<'col-md-6'i><'col-md-6'p>>",

    ajax: function (dt, callback) {
      // ⛔ BELUM KLIK CARI → JANGAN LOAD
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

      const tanggalMulai = $("#filterTanggalMulai").val();
      const tanggalSelesai = $("#filterTanggalSelesai").val();
      const peserta = $("#filterPeserta").val();

      const params = {
        draw: dt.draw,
        start: dt.start,
        length: dt.length,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        peserta,
      };

      const query = new URLSearchParams(params).toString();
      const request = apiRequest(`/hafalan/all?${query}`, { method: "GET" });
      const wrapped = suppressLoader ? request : withLoader(request);

      wrapped.then((res) => {
        callback(res);
        renderMobileCards(res.data);
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
  // FILTER INPUT (TIDAK AUTO LOAD)
  // ===============================
  $("#filterPeserta").on("input", function () {
    suppressLoader = true;
  });

  // ❌ TIDAK ADA AUTO RELOAD DI TANGGAL

  // ===============================
  // BUTTON SEARCH
  // ===============================
  $("#btnSearch").on("click", function () {
    if (!validateFilterTanggal()) return;

    hasSearched = true;
    suppressLoader = false;
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
});

// =========================
// GLOBAL VAR
// =========================
let table = null;
let selectedPdfPeserta = "";
let selectedPdfBulan = "";

// ===============================
// PDF SECTION (TETAP)
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
