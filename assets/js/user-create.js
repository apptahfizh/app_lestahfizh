// USER-CREATE.JS

checkAuth(["admin", "ustadz"]);

let userTable = null;
let userDataCache = [];

// ==========================
// Helper: deteksi mobile
// ==========================
function isMobile() {
  return window.innerWidth <= 768;
}

// ==========================
// Helper: HANCURKAN DATATABLE SAAT MOBILE
// ==========================
function destroyUserTable() {
  if (userTable) {
    userTable.destroy();
    userTable = null;
  }

  const wrapper = document.getElementById("tableUsers_wrapper");
  if (wrapper) wrapper.remove();
}

// ==========================
// Helper: BERSIHKAN MOBILE CARD SAAT DESKTOP
// ==========================
function clearMobileUsers() {
  const container = document.getElementById("userMobileList");
  if (container) container.innerHTML = "";
}

// ==========================
// LOADER CONTROL
// ==========================
function showLoader() {
  $("#adminLoader").addClass("show");
}

function hideLoader() {
  $("#adminLoader").removeClass("show");
}

// ==========================
// TOGGLE PESERTA FORM
// ==========================
function togglePesertaForm(role, wrapperSelector) {
  const wrapper = document.querySelector(wrapperSelector);
  if (!wrapper) return;

  if (role === "ortu") {
    wrapper.classList.remove("d-none");
  } else {
    wrapper.classList.add("d-none");
  }
}

// ===================================================
// LOAD USERS
// ===================================================
async function loadUsers() {
  AdminLoader.show();
  try {
    const data = await apiRequest("/users");
    userDataCache = data || [];

    if (isMobile()) {
      destroyUserTable(); // ❌ pastikan DataTable mati
      renderUserMobile(userDataCache); // ✅ card only
    } else {
      clearMobileUsers(); // ❌ pastikan card kosong
      renderTable(userDataCache); // ✅ DataTable only
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data user", "error");
  } finally {
    AdminLoader.hide();
  }
}

// ==========================
// LOAD PESERTA OPTIONS
// ==========================
async function loadPesertaOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="">-- Pilih Peserta --</option>`;

  try {
    const data = await apiRequest("/peserta");

    data.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.nama;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data peserta", "error");
  }
}
// ==========================
// ROLE CHANGE (ADD USER)
// ==========================
$(document).on("change", "#role", async function () {
  const role = this.value;

  togglePesertaForm(role, "#formPesertaWrapper");

  if (role === "ortu") {
    await loadPesertaOptions("peserta_id");
  } else {
    $("#peserta_id").val("");
  }
});
// ==========================
// ROLE CHANGE (EDIT USER)
// ==========================
$(document).on("change", "#editRole", async function () {
  const role = this.value;

  togglePesertaForm(role, "#editFormPesertaWrapper");

  if (role === "ortu") {
    await loadPesertaOptions("edit_peserta_id");
  } else {
    $("#edit_peserta_id").val("");
  }
});

// ===================================================
// HELPER FORMAT TANGGAL (WIB)
// ===================================================
function formatTanggalWIB(iso) {
  if (!iso) return "-";

  const d = new Date(iso);

  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ===================================================
// RENDER TABLE (DESKTOP)
// ===================================================
function renderTable(data) {
  if (userTable) {
    userTable.clear().rows.add(data).draw();
    return;
  }

  userTable = $("#tableUsers").DataTable({
    data,
    autoWidth: false,
    responsive: false,
    columns: [
      { data: "id" },
      { data: "username" },
      { data: "role" },
      { data: "peserta_nama", render: (d) => d || "-" },
      {
        data: "created_at",
        render: (d) => formatTanggalWIB(d),
      },
      {
        data: null,
        orderable: false,
        render: (row) => {
          return `
      <button
        type="button"
        class="btn btn-sm btn-warning btn-reset"
        data-id="${row.id}">
        Reset
      </button>

      <button
        type="button"
        class="btn btn-sm btn-info btn-edit"
        data-id="${row.id}"
        data-username="${row.username}"
        data-role="${row.role}"
        data-peserta_id="${row.peserta_id || ""}">
        Edit
      </button>

      <button
        type="button"
        class="btn btn-sm btn-danger btn-delete"
        data-id="${row.id}">
        Hapus
      </button>
    `;
        },
      },
    ],
  });
}

// ===================================================
// RESET PASSWORD
// ===================================================
$(document).on("click", ".btn-reset", async function () {
  const id = $(this).data("id");

  const ok = await Swal.fire({
    title: "Reset Password?",
    text: "Password akan direset ke 12345678",
    icon: "warning",
    showCancelButton: true,
  });

  if (!ok.isConfirmed) return;

  AdminLoader.show();
  try {
    await apiRequest(`/users/reset/${id}`, { method: "PUT" });
    Swal.fire("Berhasil", "Password direset", "success");
  } finally {
    AdminLoader.hide();
  }
});

// ===================================================
// OPEN EDIT MODAL
// ===================================================
$(document).on("click", ".btn-edit", async function () {
  const role = this.dataset.role;

  $("#editUserId").val(this.dataset.id);
  $("#editUsername").val(this.dataset.username);
  $("#editRole").val(role);
  $("#editPassword").val("");

  togglePesertaForm(role, "#editFormPesertaWrapper");

  if (role === "ortu") {
    await loadPesertaOptions("edit_peserta_id");
    $("#edit_peserta_id").val(this.dataset.peserta_id || "");
  } else {
    $("#edit_peserta_id").val("");
  }

  $("#modalEditUser").modal("show");
});

// ===================================================
// TOGGLE PASSWORD (ADD + EDIT)
// ===================================================
$(document).on("click", "#togglePassword", function () {
  const input = $("#password");
  const icon = $(this).find("i");

  input.attr("type", input.attr("type") === "password" ? "text" : "password");
  icon.toggleClass("fa-eye fa-eye-slash");
});

$(document).on("click", "#toggleEditPassword", function () {
  const input = $("#editPassword");
  const icon = $(this).find("i");

  input.attr("type", input.attr("type") === "password" ? "text" : "password");
  icon.toggleClass("fa-eye fa-eye-slash");
});

// ===================================================
// DELETE USER
// ===================================================
$(document).on("click", ".btn-delete", async function (e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation(); // 🔥 PENTING

  const id = $(this).data("id");
  console.log("DELETE CLICKED ID:", id); // 🔎 DEBUG

  const ok = await Swal.fire({
    title: "Hapus User?",
    text: "Data tidak bisa dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });

  if (!ok.isConfirmed) return;

  AdminLoader.show();
  try {
    await apiRequest(`/users/${id}`, {
      method: "DELETE",
    });

    Swal.fire("Berhasil", "User berhasil dihapus", "success");
    await loadUsers();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message || "Gagal menghapus user", "error");
  } finally {
    AdminLoader.hide();
  }
});

// ===================================================
// SAVE EDIT USER (FIXED)
// ===================================================
$("#btnSaveEditUser").on("click", async function () {
  const id = $("#editUserId").val();
  const username = $("#editUsername").val().trim();
  const role = $("#editRole").val();
  const password = $("#editPassword").val();
  const peserta_id =
    role === "ortu" ? $("#edit_peserta_id").val() || null : null;

  if (!username || !role) {
    Swal.fire("Error", "Username dan role wajib diisi", "warning");
    return;
  }

  if (role === "ortu" && !peserta_id) {
    Swal.fire("Error", "Pilih peserta untuk role Ortu", "warning");
    return;
  }

  AdminLoader.show();
  try {
    await apiRequest(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ username, role, peserta_id }),
    });

    if (password) {
      await apiRequest(`/users/update-password/${id}`, {
        method: "PUT",
        body: JSON.stringify({ password }),
      });
    }

    $("#modalEditUser").modal("hide");

    Swal.fire("Berhasil", "Data user berhasil diperbarui", "success");

    await loadUsers();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message || "Gagal mengedit user", "error");
  } finally {
    AdminLoader.hide();
  }
});

// ===================================================
// FIX ARIA WARNING
// ===================================================
$(".modal").on("hidden.bs.modal", function () {
  document.activeElement?.blur();
});

// ===================================================
// CREATE USER (SUBMIT TAMBAH USER)
// ===================================================
$("#userForm").on("submit", async function (e) {
  e.preventDefault();

  const username = $("#username").val().trim();
  const password = $("#password").val();
  const role = $("#role").val();
  const peserta_id = role === "ortu" ? $("#peserta_id").val() || null : null;

  if (!username || !password || !role) {
    Swal.fire("Error", "Lengkapi semua data", "warning");
    return;
  }

  if (role === "ortu" && !peserta_id) {
    Swal.fire("Error", "Pilih peserta untuk role Ortu", "warning");
    return;
  }

  AdminLoader.show();
  try {
    await apiRequest("/users", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        role,
        peserta_id,
      }),
    });

    $("#addUserModal").modal("hide");
    $("#userForm")[0].reset();
    $("#formPesertaWrapper").addClass("d-none");

    await loadUsers();

    Swal.fire("Berhasil", "User berhasil ditambahkan", "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message || "Gagal menyimpan user", "error");
  } finally {
    AdminLoader.hide();
  }
});

// ===================================================
// INIT
// ===================================================
document.addEventListener("DOMContentLoaded", loadUsers);

// ===================================================
// RENDER MOBILE CARD
// ===================================================

function renderUserMobile(data) {
  console.log("renderUserMobile CALLED", data);
  const container = document.getElementById("userMobileList");
  console.log("container:", container);
  if (!container) return;

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML =
      "<div class='text-center text-muted'>Tidak ada data</div>";
    return;
  }

  data.forEach((u) => {
    const div = document.createElement("div");
    div.className = "usercreate-card";

    div.innerHTML = `
      <div class="nama">${u.username}</div>
      <div class="role">
        Role: <strong>${u.role}</strong>
      </div>
      <div class="peserta">
        Peserta: ${u.peserta_nama || "-"}
      </div>
      <div class="aksi">
        <button class="btn btn-sm btn-info btn-edit"
          data-id="${u.id}"
          data-username="${u.username}"
          data-role="${u.role}"
          data-peserta_id="${u.peserta_id || ""}">
          Edit
        </button>
        <button class="btn btn-sm btn-danger btn-delete" data-id="${u.id}">
          Hapus
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}
