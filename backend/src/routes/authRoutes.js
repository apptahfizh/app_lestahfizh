// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// database path
const dbPath = path.join(__dirname, "..", "..", "lestahfizh_final.db");
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) console.error("Gagal connect ke database:", err.message);
  else console.log("Connected to SQLite database.");
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  console.log("===== LOGIN ATTEMPT =====");
  console.log("REQ BODY:", req.body);

  const { username, password } = req.body || {};

  if (!username || !password) {
    console.log("Missing username or password");
    return res.status(400).json({ message: "username & password required" });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    if (!user) {
      console.log(`User '${username}' not found`);
      return res.status(400).json({ message: "User tidak ditemukan" });
    }

    console.log("User found:", {
      username: user.username,
      password_hash: user.password_hash,
      peserta_id: user.peserta_id, // 🔥 pastikan ada
    });

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Password salah" });
    }

    // 🔥 TOKEN HARUS BAWA peserta_id
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      peserta_id: user.peserta_id || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("Login successful for user:", user.username);
    console.log("JWT PAYLOAD:", payload);

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
  });
});

module.exports = router;
