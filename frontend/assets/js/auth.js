// frontend/assets/js/auth.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document
        .getElementById("exampleInputPassword")
        .value.trim();

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
  }
});

// =======================
// Fungsi proteksi halaman
// =======================
function checkAuth(roles = []) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(userStr);

  // cek role
  if (roles.length && !roles.includes(user.role)) {
    Swal.fire("Akses ditolak", "Role tidak diizinkan", "error").then(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // redirect sesuai role
      if (user.role === "admin" || user.role === "ustadz") {
        window.location.href = "index.html";
      } else if (user.role === "ortu") {
        window.location.href = "ortu.html";
      } else {
        window.location.href = "login.html";
      }
    });
    return;
  }

  // set header axios
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// =======================
// Logout
// =======================
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
});
