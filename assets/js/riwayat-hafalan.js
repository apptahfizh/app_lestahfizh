// =========================
// LOADER WRAPPER
// =========================
function withLoader(promise) {
  if (window.AdminLoader) AdminLoader.show();
  return promise.finally(() => {
    if (window.AdminLoader) AdminLoader.hide();
  });
}

// ===============================
// VALIDASI FILTER TANGGAL
// ===============================
function validateFilterTanggal() {
  const mulai = $("#filterTanggalMulai").val();
  const selesai = $("#filterTanggalSelesai").val();

  // kalau tidak pakai tanggal sama sekali → OK
  if (!mulai && !selesai) return true;

  // kalau pakai tanggal → harus lengkap
  if (!mulai || !selesai) {
    Swal.fire("Oops", "Tanggal mulai & selesai harus diisi", "warning");
    return false;
  }

  if (mulai > selesai) {
    Swal.fire("Oops", "Range tanggal tidak valid", "warning");
    return false;
  }

  return true;
}

// =========================
// GLOBAL FLAG
// =========================
let table = null;
let suppressLoader = false;
let isFirstLoad = true; // 🔥 penting

let selectedPdfPeserta = "";
let selectedPdfBulan = "";

// =========================
// RENDER MOBILE CARD
// =========================
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

    container.append(`
      <div class="riwayat-card">
        <div class="peserta">${row.peserta}</div>
        <div><b>Tanggal:</b> ${tanggal}</div>
        <div><b>Surah:</b> ${row.surah_nama}</div>
        <div><b>Ayat Hafal:</b> ${row.ayat_hafal}</div>
        <div><b>Ayat Setor:</b> ${row.ayat_setor}</div>
        ${row.keterangan ? `<div><b>Catatan:</b> ${row.keterangan}</div>` : ""}
      </div>
    `);
  });
}

// =========================
// BUTTON STATE
// =========================
function updateSearchButtonState() {
  const t1 = $("#filterTanggalMulai").val();
  const t2 = $("#filterTanggalSelesai").val();
  const p = $("#filterPeserta").val().trim();

  $("#btnSearch").prop("disabled", !t1 && !t2 && !p);
}

// =========================
// INIT
// =========================
$(document).ready(function () {
  checkAuth(["admin", "ustadz"]);
  updateSearchButtonState();

  $("#filterTanggalMulai, #filterTanggalSelesai, #filterPeserta").on(
    "input change",
    updateSearchButtonState,
  );

  // =========================
  // DATATABLE
  // =========================
  table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: false,
    dom: "rt<'row mt-2 d-none d-md-flex'<'col-md-6'i><'col-md-6'p>>",

    ajax: function (dt, callback) {
      // 🔥 LOAD PERTAMA → KOSONG
      if (isFirstLoad) {
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
          }),
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
  });

  // =========================
  // SEARCH
  // =========================
  $("#btnSearch").on("click", function () {
    if (!validateFilterTanggal()) return;

    isFirstLoad = false; // 🔥 baru boleh load API
    suppressLoader = false;
    table.ajax.reload();
  });

  // =========================
  // RESET
  // =========================
  $("#resetFilter").on("click", function () {
    $("#filterTanggalMulai").val("");
    $("#filterTanggalSelesai").val("");
    $("#filterPeserta").val("");

    updateSearchButtonState();
    isFirstLoad = true; // 🔥 kembali kosong
    renderMobileCards([]);
    table.clear().draw();
  });
});
