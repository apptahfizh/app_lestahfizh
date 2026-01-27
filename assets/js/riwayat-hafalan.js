// ===============================
// VALIDASI FILTER TANGGAL
// ===============================
function validateFilterTanggal() {
  const mulai = $("#filterTanggalMulai").val();
  const selesai = $("#filterTanggalSelesai").val();

  if (!mulai && !selesai) return true;

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
let isFirstLoad = true;
let isSearching = false;

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
    processing: false, // ❌ jangan pakai processing loader
    serverSide: true,
    searching: false,
    dom: "rt<'row mt-2 d-none d-md-flex'<'col-md-6'i><'col-md-6'p>>",

    ajax: function (dt, callback) {
      // LOAD PERTAMA → KOSONG
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

      const params = {
        draw: dt.draw,
        start: dt.start,
        length: dt.length,
        tanggal_mulai: $("#filterTanggalMulai").val(),
        tanggal_selesai: $("#filterTanggalSelesai").val(),
        peserta: $("#filterPeserta").val(),
      };

      apiRequest(`/hafalan/all?${new URLSearchParams(params)}`, {
        method: "GET",
      })
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
        })
        .finally(() => {
          if (window.AdminLoader) AdminLoader.hide();
        });
    },

    columns: [
      { data: null, render: (d, t, r, m) => m.row + 1 },
      {
        data: "tanggal",
        render: (d) => {
          const x = new Date(d);
          return `${String(x.getDate()).padStart(2, "0")}-${String(
            x.getMonth() + 1,
          ).padStart(2, "0")}-${x.getFullYear()}`;
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

    isFirstLoad = false;
    if (window.AdminLoader) AdminLoader.show();
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
    isFirstLoad = true;
    renderMobileCards([]);
    table.clear().draw();
  });
});
