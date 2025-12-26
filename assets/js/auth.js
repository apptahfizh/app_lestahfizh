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
document.getElementById("loginForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("exampleInputPassword").value.trim();

  if (!username || !password) {
    Swal.fire("Oops!", "Username dan password wajib diisi!", "warning");
    return;
  }

  try {
    const res = await api.post("/auth/login", { username, password });
    const { token, user } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // redirect berdasarkan role
    if (user.role === "admin" || user.role === "ustadz") {
      window.location.href = "index.html";
    } else if (user.role === "ortu") {
      window.location.href = "ortu.html";
    } else {
      Swal.fire("Error", "Role tidak dikenali!", "error");
    }
  } catch (err) {
    Swal.fire(
      "Login Gagal",
      err?.response?.data?.message || "Username atau password salah",
      "error"
    );
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
