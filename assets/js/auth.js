// =======================
// Token Helpers
// =======================
function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

function isLoggedIn() {
  return !!getToken();
}

// =======================
// Login Handler
// =======================
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("inputpassword").value;

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST", // ⬅️ INI YANG PENTING
        body: JSON.stringify({
          username,
          password,
        }),
      });

      // simpan token
      localStorage.setItem("token", res.token);

      // redirect
      window.location.href = "index.html";
    } catch (err) {
      alert("Login Gagal: " + err.message);
    }
  });

// =======================
// Proteksi Halaman
// =======================
function checkAuth(roles = []) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = "login.html";
    return false;
  }

  // cek role (untuk UI)
  if (roles.length && !roles.includes(user.role)) {
    Swal.fire("Akses ditolak", "Role tidak diizinkan", "error").then(() => {
      logout(false);
    });
    return false;
  }

  return true;
}

// =======================
// Logout
// =======================
function logout(redirect = true) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (redirect) {
    window.location.href = "login.html";
  }
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);
