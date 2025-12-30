// ==============================
// hafalan.js – SPA SAFE VERSION
// ==============================

let dataSurah = [];
let hafalanTable = null;

// ==============================
// INIT HAFALAN PAGE (SPA)
// ==============================
window.initHafalanPage = function () {
  console.log("🚀 initHafalanPage dipanggil");

  checkAuth(["admin", "ustadz"]);

  const token = localStorage.getItem("token");

  const pesertaSelect = $("#peserta_id");
  const surahSelect = $("#surah");

  if (!pesertaSelect.length || !surahSelect.length) {
    console.warn("⛔ Elemen hafalan belum siap");
    return;
  }

  loadPeserta(token);
  loadSurah();
  loadTabelHafalan(token);

  $("#mulai_setor_ayat, #selesai_setor_ayat").off().on("input", updateAyatAuto);

  $("#btnSimpanHafalan")
    .off()
    .on("click", () => simpanHafalan(token));
};

// =========================
// LOAD PESERTA
// =========================
function loadPeserta(token) {
  $.ajax({
    url: "/api/peserta/simple",
    headers: { Authorization: "Bearer " + token },
    success: function (res) {
      const select = $("#peserta_id");
      select.empty().append(`<option value="">-- Pilih Peserta --</option>`);

      res.forEach((r) => {
        select.append(`<option value="${r.id}">${r.nama}</option>`);
      });

      select.select2({
        dropdownParent: $("#modalHafalan"),
        width: "100%",
      });
    },
    error: (err) => console.error("Gagal load peserta:", err),
  });
}

// =========================
// LOAD SURAH
// =========================
function loadSurah() {
  $.ajax({
    url: "/api/surah",
    success: function (res) {
      dataSurah = res;
      const select = $("#surah");

      select.empty().append(`<option value="">-- Pilih Surah --</option>`);

      res.forEach((s) => {
        select.append(
          `<option value="${s.id}" data-ayat="${s.jumlah_ayat}">
            ${s.nama_surah}
          </option>`
        );
      });

      select.select2({
        dropdownParent: $("#modalHafalan"),
        width: "100%",
      });

      select.off().on("change", updateAyatAuto);
    },
    error: (err) => console.error("Gagal load surah:", err),
  });
}

// =========================
// AUTO AYAT
// =========================
function updateAyatAuto() {
  let mulai = parseInt($("#mulai_setor_ayat").val()) || 0;
  let selesai = parseInt($("#selesai_setor_ayat").val()) || 0;

  const surahId = $("#surah").val();
  const surah = dataSurah.find((s) => s.id == surahId);

  if (surah && selesai > surah.jumlah_ayat) {
    Swal.fire(
      "Ayat Maksimal!",
      `Surah ini hanya ${surah.jumlah_ayat} ayat`,
      "warning"
    );
    $("#selesai_setor_ayat").val("");
    return;
  }

  $("#ayat_hafal").val(selesai ? `1 - ${selesai}` : "");
  $("#ayat_setor").val(mulai && selesai ? `${mulai} - ${selesai}` : "");
}

// =========================
// SIMPAN HAFALAN
// =========================
function simpanHafalan(token) {
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
    Swal.fire("Lengkapi data!", "Field wajib belum diisi", "warning");
    return;
  }

  $.ajax({
    url: "/api/hafalan",
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function () {
      Swal.fire("Berhasil", "Hafalan tersimpan", "success");
      $("#modalHafalan").modal("hide");
      $("#formHafalan")[0].reset();
      hafalanTable.ajax.reload();
    },
    error: () =>
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan", "error"),
  });
}

// =========================
// DATATABLE
// =========================
function loadTabelHafalan(token) {
  if (hafalanTable) {
    hafalanTable.destroy();
    $("#tabelHafalan tbody").empty();
  }

  hafalanTable = $("#tabelHafalan").DataTable({
    ajax: {
      url: "/api/hafalan/table",
      headers: { Authorization: "Bearer " + token },
      dataSrc: "",
    },
    searching: false,
    columns: [
      { data: null, render: (_, __, ___, meta) => meta.row + 1 },
      { data: "tanggal" },
      { data: "peserta" },
      { data: "surah_nama" },
      { data: "ayat_hafal" },
      { data: "keterangan" },
    ],
    destroy: true,
  });
}
