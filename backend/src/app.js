// backend/src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authMiddleware = require("./middlewares/auth");

const app = express();

// =======================
// MIDDLEWARE GLOBAL
// =======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// DATABASE (PostgreSQL)
// =======================
// IMPORTANT:
// Semua routes sekarang langsung import db dari ../config/db
// Tidak perlu app.locals.db lagi
require("./config/db"); // memastikan koneksi pg aktif saat app start

// =======================
// ROUTES
// =======================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const pesertaRoutes = require("./routes/pesertaRoutes");
const hafalanRoutes = require("./routes/hafalanRoutes");
const surahRoutes = require("./routes/surahRoutes");
const absensiRoutes = require("./routes/absensiRoutes");
const ortuAbsensiRoutes = require("./routes/ortuAbsensiRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/peserta", pesertaRoutes);
app.use("/api/hafalan", hafalanRoutes);
app.use("/api/surah", surahRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/ortu/absensi", authMiddleware("ortu"), ortuAbsensiRoutes);

// =======================
// TEST ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("API app_lestahfizh berjalan ✔ (PostgreSQL)");
});

// =======================
// ERROR HANDLING
// =======================
app.use((req, res) => {
  res.status(404).json({ message: "Route tidak ditemukan" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Terjadi error di server",
    error: err.message,
  });
});

// =======================
// ⛔ JANGAN app.listen()
// =======================
module.exports = app;
