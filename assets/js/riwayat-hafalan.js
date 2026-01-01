checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses

$(document).ready(function () {
  const table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: true,

    ajax: function (data, callback, settings) {
      // gabungkan parameter DataTables + filter custom
      const params = {
        ...data,
        tanggal_mulai: $("#filterTanggalMulai").val(),
        tanggal_selesai: $("#filterTanggalSelesai").val(),
        peserta: $("#filterPeserta").val(),
      };

      apiRequest("/hafalan/all", "GET", params)
        .then((res) => {
          // pastikan format sesuai DataTables
          callback({
            draw: res.draw,
            recordsTotal: res.recordsTotal,
            recordsFiltered: res.recordsFiltered,
            data: res.data,
          });
        })
        .catch((err) => {
          console.error("Gagal load riwayat hafalan:", err);
          callback({
            draw: data.draw,
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

  // Trigger reload ketika filter berubah (tanggal or peserta)
  $("#filterTanggalMulai, #filterTanggalSelesai").on("change", function () {
    table.ajax.reload();
  });

  // peserta filter: reload on typing after small debounce
  let pesertaTimer = null;
  $("#filterPeserta").on("input", function () {
    clearTimeout(pesertaTimer);
    pesertaTimer = setTimeout(() => {
      table.ajax.reload();
    }, 350); // 350ms debounce
  });

  $("#resetFilter").on("click", function () {
    $("#filterTanggalMulai").val("");
    $("#filterTanggalSelesai").val("");
    $("#filterPeserta").val("");
    table.ajax.reload();
  });
});
