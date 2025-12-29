async function loadPage(page) {
  const container = document.getElementById("page-content");

  if (!container) {
    console.error("page-content belum ada di DOM");
    return;
  }

  try {
    const res = await fetch(`pages/${page}.html`);
    if (!res.ok) throw new Error("Page not found");

    const html = await res.text();
    container.innerHTML = html;

    // INIT PER PAGE
    if (page === "dashboard" && window.initDashboardPage) {
      initDashboardPage();
    }

    if (page === "peserta" && window.initPesertaPage) {
      initPesertaPage();
    }
  } catch (err) {
    container.innerHTML =
      "<h5 class='text-danger'>Halaman tidak ditemukan</h5>";
    console.error(err);
  }
}
