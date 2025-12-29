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
// LOGIN UI STATE
// =======================
function setLoginLoading(isLoading) {
  const btn = document.getElementById("loginBtn");
  const overlay = document.getElementById("loginLoading");

  if (isLoading) {
    btn.disabled = true;
    overlay?.classList.remove("d-none");
  } else {
    btn.disabled = false;
    overlay?.classList.add("d-none");
  }
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
      setLoginLoading(true); // 🔥 UX ON

      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      sessionStorage.setItem("ortuFromLogin", "1");

      const role = res.user.role;

      if (role === "admin" || role === "ustadz") {
        window.location.href = "index.html";
      } else if (role === "ortu") {
        window.location.href = "ortu.html";
      } else {
        alert("Role tidak dikenali");
        logout();
      }
    } catch (err) {
      setLoginLoading(false); // ⛔ BALIK NORMAL

      Swal.fire({
        icon: "error",
        title: "Login gagal",
        text: err.message || "Username atau password salah",
      });
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
function loadPage(page) {
  fetch(`pages/${page}.html`)
    .then((res) => {
      if (!res.ok) throw new Error("Page not found");
      return res.text();
    })
    .then((html) => {
      document.getElementById("page-content").innerHTML = html;

      // 🔥 INIT PER PAGE
      if (page === "peserta") initPesertaPage();
      if (page === "dashboard") initDashboardPage?.();
    })
    .catch((err) => {
      document.getElementById("page-content").innerHTML =
        "<h5 class='text-danger'>Halaman tidak ditemukan</h5>";
      console.error(err);
    });
}
