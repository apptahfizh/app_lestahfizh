// ==============================
// peserta.js – SPA SAFE VERSION
// ==============================

let tabelPeserta = null;

// ==============================
// INIT PESERTA PAGE (WAJIB SPA)
// ==============================
window.initPesertaPage = function () {
  console.log("🚀 initPesertaPage dipanggil");

  checkAuth(["admin", "ustadz"]);

  // BUTTON TAMBAH
  const btnTambah = document.getElementById("btnTambahPeserta");
  if (btnTambah) {
    btnTambah.onclick = () => {
      document.getElementById("namaPeserta").value = "";
      $("#modalPeserta").modal("show");
    };
  }

  // BUTTON SIMPAN
  const btnSimpan = document.getElementById("btnSimpanPeserta");
  if (btnSimpan) {
    btnSimpan.onclick = simpanPeserta;
  }

  loadPeserta();
};

// ==============================
// LOAD PESERTA
// ==============================
async function loadPeserta() {
  try {
    const data = await apiRequest("/peserta");

    if (tabelPeserta) {
      tabelPeserta.clear().destroy();
      $("#tabelPeserta tbody").empty();
    }

    tabelPeserta = $("#tabelPeserta").DataTable({
      data,
      destroy: true,
      columns: [
        { data: "id" },
        { data: "nama" },
        {
          data: null,
          orderable: false,
          render: (d) => `
            <button class="btn btn-danger btn-sm"
                    onclick="hapusPeserta(${d.id})">
              <i class="fas fa-trash"></i>
            </button>
          `,
        },
      ],
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Tidak dapat memuat data peserta", "error");
  }
}

// ==============================
// SIMPAN PESERTA
// ==============================
async function simpanPeserta() {
  const nama = document.getElementById("namaPeserta")?.value.trim();

  if (!nama) {
    Swal.fire("Oops!", "Nama peserta tidak boleh kosong", "warning");
    return;
  }

  try {
    await apiRequest("/peserta", {
      method: "POST",
      body: JSON.stringify({ nama }),
    });

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Peserta berhasil ditambahkan",
      timer: 1200,
      showConfirmButton: false,
    });

    $("#modalPeserta").modal("hide");
    loadPeserta();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal menambah peserta", "error");
  }
}

// ==============================
// HAPUS PESERTA
// ==============================
async function hapusPeserta(id) {
  const confirm = await Swal.fire({
    title: "Hapus?",
    text: "Data tidak bisa dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
  });

  if (!confirm.isConfirmed) return;

  try {
    await apiRequest(`/peserta/${id}`, {
      method: "DELETE",
    });

    Swal.fire("Terhapus", "Peserta sudah dihapus", "success");
    loadPeserta();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal menghapus peserta", "error");
  }
}
