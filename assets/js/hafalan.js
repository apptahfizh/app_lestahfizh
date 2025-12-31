// =========================
// LOADER WRAPPER (PAGE LEVEL)
// =========================
function withLoader(promise) {
  if (window.AdminLoader) AdminLoader.show();

  return promise.finally(() => {
    if (window.AdminLoader) AdminLoader.hide();
  });
}

checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses

// =========================
// HAFALAN.JS FINAL FIX
// =========================

let dataSurah = [];

$(document).ready(function () {
  withLoader(loadPeserta());
  withLoader(loadSurah());
  withLoader(loadTabelHafalan());

  $("#mulai_setor_ayat, #selesai_setor_ayat").on("input", updateAyatAuto);

  $("#btnSimpanHafalan").on("click", function () {
    withLoader(simpanHafalan());
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
    peserta_id: parseInt($("#peserta_id").val(), 10),

    tanggal: $("#tanggal").val() || null,

    surah: $("#surah").val() ? parseInt($("#surah").val(), 10) : null,

    ayat_hafal: $("#ayat_hafal").val() || null,
    ayat_setor: $("#ayat_setor").val() || null,

    mulai_setor_ayat: $("#mulai_setor_ayat").val()
      ? parseInt($("#mulai_setor_ayat").val(), 10)
      : null,

    selesai_setor_ayat: $("#selesai_setor_ayat").val()
      ? parseInt($("#selesai_setor_ayat").val(), 10)
      : null,

    keterangan: $("#keterangan").val() || null,
  };

  if (!data.peserta_id || !data.surah || !data.tanggal) {
    Swal.fire("Lengkapi data!", "Field wajib tidak boleh kosong.", "warning");
    return;
  }

  try {
    await apiRequest("/hafalan", {
      method: "POST",
      body: JSON.stringify(data),
    });

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Hafalan berhasil disimpan",
      timer: 1200,
      showConfirmButton: false,
    }).then(() => {
      resetModalHafalan(); // 🔥 TUTUP & RESET MODAL
      loadTabelHafalan(); // 🔁 REFRESH TABEL
    });
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
    // MOBILE → CARD LIST
    if (window.innerWidth < 768) {
      renderHafalanCards(data);
      hideLoader();
      return;
    }

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

// =========================
// Helper Reset Modal
// =========================
function resetModalHafalan() {
  const modal = $("#modalHafalan");

  // Reset form native
  $("#formHafalan")[0].reset();

  // Reset Select2 (WAJIB manual)
  $("#surah").val(null).trigger("change");

  // Pastikan modal benar-benar tertutup
  modal.modal("hide");

  // Bersihkan backdrop & class (ANTI BUG BOOTSTRAP)
  setTimeout(() => {
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
  }, 200);
}

// ==============================
// RENDER HAFALAN CARD LIST (MOBILE)
// ==============================
function renderHafalanCards(data) {
  const container = document.getElementById("hafalanCardList");
  if (!container) return;

  container.innerHTML = "";

  data.forEach((h) => {
    const card = document.createElement("div");
    card.className = "hafalan-card";

    card.innerHTML = `
      <div class="nama">${h.nama_peserta}</div>

      <div class="meta">
        📅 ${h.tanggal || "-"}<br>
        📖 ${h.surah} (${h.ayat_hafal || "-"})
      </div>

      <div class="meta">
        ${h.keterangan || ""}
      </div>

      <div class="aksi">
        <button class="btn btn-warning btn-sm"
          onclick="editHafalan(${h.id})">
          <i class="fas fa-edit"></i>
        </button>

        <button class="btn btn-danger btn-sm"
          onclick="hapusHafalan(${h.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}
