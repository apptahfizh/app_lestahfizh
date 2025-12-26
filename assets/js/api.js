// assets/js/api.js

const api = axios.create({
  baseURL: "/api", // ⬅️ PENTING: RELATIVE (Vercel friendly)
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Inject JWT otomatis
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ❗ OPTIONAL: global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login.html";
    }
    return Promise.reject(error);
  }
);
