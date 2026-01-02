// ===============
// USER-CREATE.JS
// ===============

checkAuth(["admin", "ustadz"]);

let userTable = null;
let userDataCache = [];

// ==========================
// LOADER CONTROL
// ==========================
function showLoader() {
  $("#adminLoader").addClass("show");
}

function hideLoader() {
  $("#adminLoader").removeClass("show");
}

// ===================================================
// LOAD USERS
// ===================================================
async function loadUsers() {
  AdminLoader.show();
  try {
    const data = await apiRequest("/users");
    userDataCache = data || [];
    renderTable(userDataCache);
    renderUserCards(userDataCache);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data user", "error");
  } finally {
    AdminLoader.hide();
  }
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
      { data: "created_at" },
      {
        data: null,
        orderable: false,
        render: (row) => `
          <button class="btn btn-sm btn-warning btn-reset" data-id="${row.id}">
            Reset
          </button>
          <button class="btn btn-sm btn-info btn-edit"
            data-id="${row.id}"
            data-username="${row.username}"
            data-role="${row.role}"
            data-peserta_id="${row.peserta_id || ""}">
            Edit
          </button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id}">
            Hapus
          </button>
        `,
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
$(document).on("click", ".btn-edit", function () {
  $("#editUserId").val(this.dataset.id);
  $("#editUsername").val(this.dataset.username);
  $("#editRole").val(this.dataset.role);
  $("#editPassword").val("");
  $("#edit_peserta_id").val(this.dataset.peserta_id || "");

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
// SAVE EDIT USER
// ===================================================
$("#btnSaveEditUser").on("click", async function () {
  const id = $("#editUserId").val();
  const username = $("#editUsername").val();
  const role = $("#editRole").val();
  const password = $("#editPassword").val();
  const peserta_id = $("#edit_peserta_id").val() || null;

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
    await loadUsers();
  } finally {
    AdminLoader.hide();
  }
});

// ===================================================
// DELETE USER
// ===================================================
$(document).on("click", ".btn-delete", async function () {
  const id = $(this).data("id");

  const ok = await Swal.fire({
    title: "Hapus User?",
    icon: "warning",
    showCancelButton: true,
  });

  if (!ok.isConfirmed) return;

  AdminLoader.show();
  try {
    await apiRequest(`/users/${id}`, {
      method: "DELETE",
    });
    await loadUsers();
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
// INIT
// ===================================================
document.addEventListener("DOMContentLoaded", loadUsers);
