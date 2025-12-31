checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses
// =========================
// HAFALAN.JS FINAL FIX
// =========================

$(document).ready(function () {
  // Load data awal
  loadPeserta(); // apiRequest internal
  loadSurah(); // apiRequest internal
  loadTabelHafalan(); // apiRequest internal

  // Auto hitung ayat
  $("#mulai_setor_ayat, #selesai_setor_ayat").on("input", updateAyatAuto);

  // Simpan hafalan
  $("#btnSimpanHafalan").on("click", function () {
    simpanHafalan(); // token ditangani apiRequest
  });
});

// =========================
// LOAD PESERTA
// =========================
function loadPeserta(token) {
  async function loadPeserta() {
    try {
      const data = await apiRequest("/peserta/simple");

      const select = $("#pesertaId");
      select.empty();
      select.append(`<option value="">-- Pilih Peserta --</option>`);

      data.forEach((p) => {
        select.append(`<option value="${p.id}">${p.nama}</option>`);
      });
    } catch (err) {
      console.error("Gagal load peserta:", err);
      Swal.fire("Error", "Gagal memuat data peserta", "error");
    }
  }
}

// =========================
// LOAD SURAH
// =========================
let dataSurah = [];

function loadSurah() {
  async function loadSurah() {
    try {
      const data = await apiRequest("/surah");

      const select = $("#surah");
      select.empty();
      select.append(`<option value="">-- Pilih Surah --</option>`);

      data.forEach((s) => {
        select.append(`<option value="${s.id}">${s.nomor}. ${s.nama}</option>`);
      });
    } catch (err) {
      console.error("Gagal load surah:", err);
      Swal.fire("Error", "Gagal memuat data surah", "error");
    }
  }
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

  async function loadTabelHafalan() {
    try {
      const data = await apiRequest("/hafalan/table");

      if ($.fn.DataTable.isDataTable("#tabelHafalan")) {
        $("#tabelHafalan").DataTable().clear().destroy();
      }

      $("#tabelHafalan").DataTable({
        data,
        columns: [
          { data: "tanggal" },
          { data: "nama_peserta" },
          { data: "surah" },
          { data: "ayat" },
          { data: "nilai" },
        ],
      });
    } catch (err) {
      console.error("Gagal load tabel hafalan:", err);
      Swal.fire("Error", "Gagal memuat data hafalan", "error");
    }
  }
}

// =========================
// DATATABLE HAFALAN
// =========================
async function loadTabelHafalan() {
  try {
    const data = await apiRequest("/hafalan/table");

    if ($.fn.DataTable.isDataTable("#tabelHafalan")) {
      $("#tabelHafalan").DataTable().clear().destroy();
    }

    $("#tabelHafalan").DataTable({
      data,
      searching: false, // 🔥 MATIKAN SEARCH
      columns: [
        {
          data: null,
          render: (d, t, r, meta) => meta.row + 1,
        },
        { data: "tanggal" },
        { data: "peserta" },
        { data: "surah_nama" },
        { data: "ayat_hafal" },
        { data: "keterangan" },
      ],
    });
  } catch (err) {
    console.error("Gagal load tabel hafalan:", err);
    Swal.fire("Error", "Gagal memuat data hafalan", "error");
  }
}
