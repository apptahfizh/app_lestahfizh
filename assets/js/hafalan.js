checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses
// =========================
// HAFALAN.JS FINAL FIX
// =========================

$(document).ready(function () {
  // Ambil token dari localStorage
  const token = localStorage.getItem("token");

  // Load data awal
  loadPeserta(token);
  loadSurah();
  loadTabelHafalan(token);

  // Trigger otomatis perhitungan ayat
  $("#mulai_setor_ayat, #selesai_setor_ayat").on("input", updateAyatAuto);

  // Simpan hafalan
  $("#btnSimpanHafalan").on("click", function () {
    simpanHafalan(token);
  });
});

// =========================
// LOAD PESERTA
// =========================
function loadPeserta(token) {
  $.ajax({
    url: "http://localhost:5000/api/peserta/simple",
    method: "GET",
    headers: { Authorization: "Bearer " + token }, // pastikan token dikirim
    success: function (res) {
      $("#peserta_id")
        .empty()
        .append(`<option value="">-- Pilih Peserta --</option>`);

      res.forEach((r) => {
        $("#peserta_id").append(`<option value="${r.id}">${r.nama}</option>`);
      });

      // Initialize Select2
      $("#peserta_id").select2({
        dropdownParent: $("#modalHafalan"),
        width: "100%",
      });
    },
    error: function (err) {
      console.error("Gagal load peserta:", err);
    },
  });
}

// =========================
// LOAD SURAH
// =========================
let dataSurah = [];

function loadSurah() {
  $.ajax({
    url: "http://localhost:5000/api/surah",
    method: "GET",
    success: function (res) {
      dataSurah = res;

      $("#surah").empty().append(`<option value="">-- Pilih Surah --</option>`);

      res.forEach((s) => {
        $("#surah").append(
          `<option value="${s.id}" data-ayat="${s.jumlah_ayat}">
            ${s.nama_surah}
          </option>`
        );
      });

      $("#surah").select2({
        dropdownParent: $("#modalHafalan"),
        width: "100%",
      });

      $("#surah").on("change", updateAyatAuto);
    },
    error: function (err) {
      console.error("Gagal load surah:", err);
    },
  });
}

// =========================
// AUTO CALCULATE AYAT
// =========================
function updateAyatAuto() {
  let mulai = parseInt($("#mulai_setor_ayat").val()) || 0;
  let selesai = parseInt($("#selesai_setor_ayat").val()) || 0;

  let surahId = $("#surah").val();
  let surah = dataSurah.find((s) => s.id == surahId);

  if (surah && selesai > surah.jumlah_ayat) {
    Swal.fire(
      "Ayat Maksimal!",
      `Surah ini hanya memiliki ${surah.jumlah_ayat} ayat`,
      "warning"
    );
    $("#selesai_setor_ayat").val("");
    selesai = 0;
  }

  // Ayat Hafal = 1 - selesai
  if (selesai > 0) {
    $("#ayat_hafal").val(`1 - ${selesai}`);
  } else {
    $("#ayat_hafal").val("");
  }

  // Ayat Setor = mulai - selesai
  if (mulai > 0 && selesai > 0) {
    $("#ayat_setor").val(`${mulai} - ${selesai}`);
  } else {
    $("#ayat_setor").val("");
  }
}

// =========================
// SIMPAN HAFALAN
// =========================
function simpanHafalan(token) {
  let data = {
    peserta_id: $("#peserta_id").val(),
    tanggal: $("#tanggal").val(),
    surah: $("#surah").val(),
    mulai_setor_ayat: $("#mulai_setor_ayat").val(),
    selesai_setor_ayat: $("#selesai_setor_ayat").val(),
    ayat_hafal: $("#ayat_hafal").val(),
    ayat_setor: $("#ayat_setor").val(),
    keterangan: $("#keterangan").val(),
  };

  // Validasi wajib isi
  if (
    !data.peserta_id ||
    !data.surah ||
    !data.tanggal ||
    !data.mulai_setor_ayat ||
    !data.selesai_setor_ayat
  ) {
    Swal.fire("Lengkapi data!", "Field wajib tidak boleh kosong.", "warning");
    return;
  }

  $.ajax({
    url: "http://localhost:5000/api/hafalan",
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function () {
      Swal.fire("Berhasil!", "Data hafalan berhasil disimpan", "success");

      $("#modalHafalan").modal("hide");
      $("#formHafalan")[0].reset();

      $("#tabelHafalan").DataTable().ajax.reload();
    },
    error: function (err) {
      console.error(err);
      Swal.fire("Gagal!", "Terjadi kesalahan saat menyimpan", "error");
    },
  });
}

// =========================
// DATATABLE HAFALAN
// =========================
function loadTabelHafalan(token) {
  $("#tabelHafalan").DataTable({
    ajax: {
      url: "http://localhost:5000/api/hafalan/table", // untuk tampilkan seluruh peserta gunakan /table bukan /last
      headers: { Authorization: "Bearer " + token },
      dataSrc: "",
    },
    searching: false, // 🔥 MATIKAN FITUR SEARCH
    columns: [
      { data: null, render: (d, t, r, meta) => meta.row + 1 },
      { data: "tanggal" },
      { data: "peserta" },
      { data: "surah_nama" }, // gunakan nama surah
      { data: "ayat_hafal" }, // kolom ayat hafal benar
      { data: "keterangan" },
    ],
    destroy: true, // supaya bisa reload ulang
  });
}
