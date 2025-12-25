// src/routes/authRoutes.js
// =======================
// AUTH ROUTES (POSTGRES)
// =======================

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");

// =======================
// DATABASE (PostgreSQL)
// =======================
// menggunakan pool dari pg (Neon / PostgreSQL cloud)

// =======================
// POST /api/auth/login
// =======================
// 🔐 Login user
// - cek username
// - verifikasi password
// - generate JWT (bawa peserta_id)
router.post("/login", async (req, res) => {
  try {
    console.log("===== LOGIN ATTEMPT =====");
    console.log("REQ BODY:", req.body);

    const { username, password } = req.body || {};

    // =======================
    // VALIDASI INPUT
    // =======================
    if (!username || !password) {
      console.log("Missing username or password");
      return res.status(400).json({ message: "username & password required" });
    }

    // =======================
    // QUERY USER (POSTGRES)
    // =======================
    // $1 = parameter binding (AMAN dari SQL injection)
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    // user tidak ditemukan
    if (result.rows.length === 0) {
      console.log(`User '${username}' not found`);
      return res.status(400).json({ message: "User tidak ditemukan" });
    }

    const user = result.rows[0];

    console.log("User found:", {
      username: user.username,
      password_hash: user.password_hash,
      peserta_id: user.peserta_id, // 🔥 tetap dibawa
    });

    // =======================
    // CEK PASSWORD
    // =======================
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Password salah" });
    }

    // =======================
    // JWT PAYLOAD
    // =======================
    // 🔥 peserta_id WAJIB ikut token
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      peserta_id: user.peserta_id || null,
    };

    // =======================
    // GENERATE TOKEN
    // =======================
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("Login successful for user:", user.username);
    console.log("JWT PAYLOAD:", payload);

    // =======================
    // RESPONSE
    // =======================
    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        peserta_id: user.peserta_id,
      },
    });
  } catch (err) {
    // =======================
    // ERROR HANDLING
    // =======================
    console.error("Login error:", err);
    res.status(500).json({
      message: "Terjadi kesalahan saat login",
      error: err.message,
    });
  }
});

module.exports = router;
