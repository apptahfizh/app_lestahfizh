// assets/js/api.js
// =========================
// CENTRAL API HELPER
// =========================

// Relative path → aman di localhost & Vercel
const API_BASE = "/api";

/**
 * Ambil header Authorization jika token ada
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Helper request JSON
 */
async function apiRequest(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
}
