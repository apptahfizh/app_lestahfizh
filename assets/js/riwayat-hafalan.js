checkAuth(["admin", "ustadz"]); // hanya admin / ustadz

$(document).ready(function () {
  /* ===============================
     VALIDASI FILTER TANGGAL
  =============================== */
  function validateFilterTanggal() {
    const mulai = $("#filterTanggalMulai").val();
    const selesai = $("#filterTanggalSelesai").val();

    // Keduanya kosong → OK (tampilkan semua data)
    if (!mulai && !selesai) return true;

    // Salah satu saja diisi → TOLAK
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

  /* ===============================
     DATATABLES
  =============================== */
  const table = $("#riwayatHafalanTable").DataTable({
    processing: true,
    serverSide: true,
    searching: true,

    ajax: function (data, callback) {
      const tanggalMulai = $("#filterTanggalMulai").val();
      const tanggalSelesai = $("#filterTanggalSelesai").val();
      const peserta = $("#filterPeserta").val();

      // VALIDASI FRONTEND (khusus DataTables)
      if (
        (tanggalMulai && !tanggalSelesai) ||
        (!tanggalMulai && tanggalSelesai)
      ) {
        Swal.fire({
          icon: "warning",
          title: "Filter Tanggal Tidak Lengkap",
          text: "Pilih tanggal mulai dan tanggal selesai",
        });

        // 🔴 INI PENTING → HENTIKAN PROCESSING
        callback({
          draw: data.draw,
          recordsTotal: 0,
          recordsFiltered: 0,
          data: [],
        });
        return;
      }

      const params = {
        ...data,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        peserta,
      };

      apiRequest("/hafalan/all", "GET", params)
        .then((res) => {
          callback({
            draw: res.draw ?? data.draw,
            recordsTotal: res.recordsTotal ?? 0,
            recordsFiltered: res.recordsFiltered ?? 0,
            data: res.data ?? [],
          });
        })
        .catch((err) => {
          console.error(err);
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

  /* ===============================
     EVENT FILTER
  =============================== */

  // Filter tanggal → WAJIB valid
  $("#filterTanggalMulai, #filterTanggalSelesai").on("change", function () {
    if (!validateFilterTanggal()) return;
    table.ajax.reload();
  });

  // Filter peserta → boleh sendiri, tapi tetap cek tanggal
  let pesertaTimer = null;
  $("#filterPeserta").on("input", function () {
    clearTimeout(pesertaTimer);
    pesertaTimer = setTimeout(() => {
      if (!validateFilterTanggal()) return;
      table.ajax.reload();
    }, 350);
  });

  // Reset → selalu valid
  $("#resetFilter").on("click", function () {
    $("#filterTanggalMulai").val("");
    $("#filterTanggalSelesai").val("");
    $("#filterPeserta").val("");
    table.ajax.reload();
  });
});
