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

$(document).ready(function () {
  // =========================
  // AUTH
  // =========================
  checkAuth(["admin", "ustadz"]);

  // ===============================
  // DATATABLES INIT
  // ===============================
  const table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: false, // ❌ matikan search kanan atas

    ajax: function (dt, callback) {
      const tanggalMulai = $("#filterTanggalMulai").val();
      const tanggalSelesai = $("#filterTanggalSelesai").val();
      const peserta = $("#filterPeserta").val();

      // =============================
      // VALIDASI TANGGAL
      // =============================
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

      // =============================
      // PARAMETER DATATABLES
      // =============================
      const params = {
        draw: dt.draw,
        start: dt.start,
        length: dt.length,
        search: dt.search?.value || "",
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        peserta: peserta,
      };

      const query = new URLSearchParams(params).toString();

      const request = apiRequest(`/hafalan/all?${query}`, {
        method: "GET",
      });

      const wrappedRequest = suppressLoader ? request : withLoader(request);

      wrappedRequest
        .then((res) => {
          callback({
            draw: res.draw,
            recordsTotal: res.recordsTotal,
            recordsFiltered: res.recordsFiltered,
            data: res.data,
          });
        })
        .catch((err) => {
          console.error("DT error:", err);
          callback({
            draw: dt.draw,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: [],
          });
        });
    },

    columns: [
      {
        data: null,
        render: function (data, type, row, meta) {
          return meta.row + meta.settings._iDisplayStart + 1;
        },
      },
      { data: "tanggal" },
      { data: "peserta" },
      { data: "surah_nama" },
      { data: "ayat_hafal" },
      { data: "ayat_setor" },
      { data: "keterangan" },
    ],

    pageLength: 10,
    lengthMenu: [10, 25, 50, 100],
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

    suppressLoader = false;
    table.ajax.reload();
  });
});
