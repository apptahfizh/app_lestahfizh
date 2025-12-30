console.log("🔥 router.js loaded");

async function loadPage(page) {
  console.log("➡️ loadPage:", page);

  const container = document.getElementById("page-content");
  if (!container) {
    console.error("❌ #page-content tidak ditemukan");
    return;
  }

  try {
    const res = await fetch(`pages/${page}.html`);
    if (!res.ok) throw new Error("Page not found");

    const html = await res.text();
    container.innerHTML = html;

    // 🔥 PANGGIL INIT SETELAH HTML MASUK
    if (page === "dashboard" && window.initDashboardPage) {
      initDashboardPage();
    }

    if (page === "peserta" && window.initPesertaPage) {
      initPesertaPage();
    }

    if (page === "hafalan" && window.initHafalanPage) {
      initHafalanPage();
    }

    if (page === "absensi" && window.initAbsensiPage) {
      initAbsensiPage();
    }
  } catch (err) {
    console.error(err);
    container.innerHTML =
      "<h5 class='text-danger'>Halaman tidak ditemukan</h5>";
  }
}

async function init() {
  console.log("🔥 init dipanggil");

  const res = await fetch("layout/layout.html");
  const layoutHTML = await res.text();

  document.getElementById("app").innerHTML = layoutHTML;

  console.log("✅ layout dimuat");

  // 🔥 LOAD DEFAULT PAGE
  loadPage("dashboard");
}

document.addEventListener("DOMContentLoaded", init);
