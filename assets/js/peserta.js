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

// ==============================
// AUTH
// ==============================
checkAuth(["admin", "ustadz"]); // hanya admin / ustadz

// ==============================
// peserta.js – FINAL CLEAN v3
// ==============================

let tabel = null;
let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadPeserta();

  // Buka modal tambah
  document.getElementById("btnTambahPeserta")?.addEventListener("click", () => {
    document.getElementById("namaPeserta").value = "";
    $("#modalPeserta").modal("show");
  });

  // Simpan peserta
  document
    .getElementById("btnSimpanPeserta")
    ?.addEventListener("click", simpanPeserta);
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
      scrollX: true,
      autoWidth: false,
      data,
      columns: [
        { data: "id" },
        { data: "nama" },
        {
          data: null,
          render: (d) => `
    <button class="btn btn-warning btn-sm mr-1"
      onclick="editPeserta(${d.id}, '${d.nama.replace(/'/g, "\\'")}')">
      <i class="fas fa-edit"></i>
    </button>

    <button class="btn btn-danger btn-sm"
      onclick="hapusPeserta(${d.id})">
      <i class="fas fa-trash"></i>
    </button>
  `,
        },
      ],
      initComplete() {
        // Data benar-benar sudah render
        hideLoader();
      },
    });
  } catch (err) {
    hideLoader();
    Swal.fire("Error", "Tidak dapat memuat data peserta", "error");
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
    showLoader();

    if (editingId) {
      // UPDATE
      await apiRequest(`/peserta/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({ nama }),
      });

      Swal.fire("Berhasil", "Data peserta diperbarui", "success");
    } else {
      // CREATE
      await apiRequest("/peserta", {
        method: "POST",
        body: JSON.stringify({ nama }),
      });

      Swal.fire("Berhasil", "Peserta berhasil ditambahkan", "success");
    }

    $("#modalPeserta").modal("hide");
    editingId = null;
    document.getElementById("btnSimpanPeserta").innerText = "Simpan";

    loadPeserta();
  } catch {
    Swal.fire("Error", "Gagal menyimpan data", "error");
  } finally {
    hideLoader();
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
    showLoader();

    await apiRequest(`/peserta/${id}`, {
      method: "DELETE",
    });

    Swal.fire("Terhapus", "Peserta sudah dihapus", "success");
    loadPeserta();
  } catch (err) {
    hideLoader();
    Swal.fire("Error", "Gagal menghapus peserta", "error");
  }
}
// ==============================
// EDIT PESERTA
// ==============================
function editPeserta(id, nama) {
  editingId = id;

  document.getElementById("namaPeserta").value = nama;

  // Ganti teks tombol
  document.getElementById("btnSimpanPeserta").innerText = "Update";

  $("#modalPeserta").modal("show");
}

$("#modalPeserta").on("hidden.bs.modal", () => {
  editingId = null;
  document.getElementById("namaPeserta").value = "";
  document.getElementById("btnSimpanPeserta").innerText = "Simpan";
});
