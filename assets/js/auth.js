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
// Login Handler (SAFE)
// =======================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("exampleInputPassword");

    if (!usernameInput || !passwordInput) {
      alert("Input login tidak ditemukan");
      return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // simpan token & user
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      const role = res.user.role;
      // ✅ TANDAI DARI LOGIN (INI YANG KITA BUTUHKAN)
      sessionStorage.setItem("ortuFromLogin", "1");

      // redirect berdasarkan role
      if (role === "admin" || role === "ustadz") {
        window.location.href = "index.html";
      } else if (role === "ortu") {
        window.location.href = "ortu.html";
      } else {
        alert("Role tidak dikenali");
        logout();
      }
    } catch (err) {
      alert("Login Gagal: " + err.message);
    }
  });
}

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

  // cek role
  if (roles.length && !roles.includes(user.role)) {
    Swal.fire("Akses ditolak", "Role tidak diizinkan", "error").then(() => {
      if (user.role === "ortu") {
        window.location.href = "ortu.html";
      } else {
        window.location.href = "index.html";
      }
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
