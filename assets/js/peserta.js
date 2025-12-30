// ==============================
// GLOBAL LOADER CONTROL
// ==============================
function showLoader() {
  const loader = document.getElementById("adminLoader");
  if (loader) loader.classList.remove("hide");
}

function hideLoader() {
  const loader = document.getElementById("adminLoader");
  if (loader) loader.classList.add("hide");
}

checkAuth(["admin", "ustadz"]); // hanya admin/ustadz bisa akses
// ==============================
// peserta.js – FINAL CLEAN v2
// ==============================

// Pastikan user sudah login
checkAuth();

let tabel = null;

document.addEventListener("DOMContentLoaded", () => {
  showLoader(); // ⬅️ tampilkan loader
  // Load data pertama kali
  loadPeserta();

  // Buka modal tambah
  document.getElementById("btnTambahPeserta").addEventListener("click", () => {
    document.getElementById("namaPeserta").value = "";
    $("#modalPeserta").modal("show");
  });

  // Simpan peserta
  document.getElementById("btnSimpanPeserta").addEventListener("click", () => {
    simpanPeserta();
  });
});

// ==============================
// LOAD PESERTA
// ==============================
async function loadPeserta() {
  try {
    const data = await apiRequest("/peserta");

    if (tabel) {
      tabel.clear();
      tabel.destroy();
      $("#tabelPeserta tbody").empty();
    }

    tabel = $("#tabelPeserta").DataTable({
      data,
      columns: [
        { data: "id" },
        { data: "nama" },
        {
          data: null,
          render: (d) => `
            <button class="btn btn-danger btn-sm" onclick="hapusPeserta(${d.id})">
              <i class="fas fa-trash"></i>
            </button>
          `,
        },
      ],
      initComplete: function () {
        // ⬅️ Data benar-benar sudah render
        hideLoader();
      },
    });
  } catch (err) {
    hideLoader();
    Swal.fire("Error", "Tidak dapat memuat data peserta", "error");
  }
}

async function simpanPeserta() {
  const nama = document.getElementById("namaPeserta").value.trim();

  if (!nama) {
    Swal.fire("Oops!", "Nama peserta tidak boleh kosong", "warning");
    return;
  }

  try {
    showLoader();
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
  } catch {
    Swal.fire("Error", "Gagal menambah peserta", "error");
  }
}

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
    showLoader();
    await apiRequest(`/peserta/${id}`, {
      method: "DELETE",
    });

    Swal.fire("Terhapus", "Peserta sudah dihapus", "success");
    loadPeserta();
  } catch {
    Swal.fire("Error", "Gagal menghapus peserta", "error");
  }
}

// ==============================
// SIMPAN PESERTA
// ==============================
async function simpanPeserta() {
  const nama = document.getElementById("namaPeserta").value.trim();

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
  } catch {
    Swal.fire("Error", "Gagal menghapus peserta", "error");
  }
}
