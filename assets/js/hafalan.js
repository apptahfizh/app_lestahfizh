checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses

// =========================
// HAFALAN.JS FINAL FIX
// =========================

let dataSurah = [];

$(document).ready(function () {
  loadPeserta();
  loadSurah();
  loadTabelHafalan();

  $("#mulai_setor_ayat, #selesai_setor_ayat").on("input", updateAyatAuto);

  $("#btnSimpanHafalan").on("click", function () {
    simpanHafalan();
  });
});

// =========================
// LOAD PESERTA
// =========================
async function loadPeserta() {
  try {
    const data = await apiRequest("/peserta/simple");

    const select = $("#peserta_id");
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

// =========================
// LOAD SURAH (SELECT2 AUTOCOMPLETE)
// =========================
async function loadSurah() {
  try {
    const data = await apiRequest("/surah");

    dataSurah = data;

    const select = $("#surah");
    select.empty();

    // Init Select2
    select.select2({
      data: data.map((s) => ({
        id: s.id,
        text: s.nama_surah, // 🔥 FIX: tanpa nomor
      })),
      placeholder: "Cari & pilih surah...",
      allowClear: true,
      width: "100%",
      dropdownParent: $("#modalHafalan"), // 🔥 wajib untuk modal
    });
  } catch (err) {
    console.error("Gagal load surah:", err);
    Swal.fire("Error", "Gagal memuat data surah", "error");
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
    return;
  }

  if (selesai > 0) {
    $("#ayat_hafal").val(`1 - ${selesai}`);
  } else {
    $("#ayat_hafal").val("");
  }

  if (mulai > 0 && selesai > 0) {
    $("#ayat_setor").val(`${mulai} - ${selesai}`);
  } else {
    $("#ayat_setor").val("");
  }
}

// =========================
// SIMPAN HAFALAN
// =========================
async function simpanHafalan() {
  const data = {
    peserta_id: $("#peserta_id").val(),
    tanggal: $("#tanggal").val(),
    surah: $("#surah").val(),
    mulai_setor_ayat: $("#mulai_setor_ayat").val(),
    selesai_setor_ayat: $("#selesai_setor_ayat").val(),
    ayat_hafal: $("#ayat_hafal").val(),
    ayat_setor: $("#ayat_setor").val(),
    keterangan: $("#keterangan").val(),
  };

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

  try {
    await apiRequest("/hafalan", {
      method: "POST",
      body: JSON.stringify(data),
    });

    Swal.fire("Berhasil", "Hafalan berhasil disimpan", "success");

    $("#formHafalan")[0].reset();
    loadTabelHafalan();
  } catch (err) {
    console.error("Gagal simpan hafalan:", err);
    Swal.fire("Error", "Gagal menyimpan hafalan", "error");
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
      searching: false,
      columns: [
        {
          data: null,
          render: (d, t, r, meta) => meta.row + 1,
        },
        {
          data: "tanggal",
          render: function (data) {
            if (!data) return "";
            const d = new Date(data);
            return d.toLocaleDateString("id-ID");
          },
        },
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
