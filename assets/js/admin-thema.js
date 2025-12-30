// ===============================
// GLOBAL LOADER (ORTU)
// ===============================
function showGlobalLoading(text = "Memuat Data…") {
  const loading = document.getElementById("globalLoading");
  if (!loading) return;

  const textEl = loading.querySelector(".latin");
  if (textEl) textEl.textContent = text;

  document.body.classList.add("loading");
  loading.classList.remove("d-none");
}

function hideGlobalLoading(delay = 300) {
  const loading = document.getElementById("globalLoading");
  if (!loading) return;

  setTimeout(() => {
    loading.classList.add("d-none");
    document.body.classList.remove("loading");
  }, delay);
}

// ===============================
// SAFE GLOBAL LOADER WRAPPER
// ===============================
function safeShowLoader(text) {
  if (typeof showGlobalLoading === "function") {
    showGlobalLoading(text);
  }
}

function safeHideLoader(delay) {
  if (typeof hideGlobalLoading === "function") {
    hideGlobalLoading(delay);
  }
}
