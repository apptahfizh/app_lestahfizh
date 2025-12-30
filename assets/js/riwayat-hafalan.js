checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses

$(document).ready(function () {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire({
      icon: "warning",
      title: "Sesi Habis",
      text: "Silakan login kembali",
    }).then(() => {
      window.location.href = "login.html";
    });
    return;
  }

  const table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: true,
    ajax: {
      url: "http://localhost:5000/api/hafalan/all",
      type: "GET",
      headers: { Authorization: "Bearer " + token },
      data: function (d) {
        // send custom filter values along with DataTables params
        d.tanggal_mulai = $("#filterTanggalMulai").val();
        d.tanggal_selesai = $("#filterTanggalSelesai").val();
        d.peserta = $("#filterPeserta").val();
      },
      dataSrc: function (json) {
        // DataTables expects json.data (we return that in backend)
        return json.data;
      },
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
