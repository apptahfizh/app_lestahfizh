checkAuth(["admin", "ustadz"]); // hanya admin / ustadz

// State Lokal Absensi
let absensiDraft = {};

function updateAbsensiLocal(peserta_id, status, keterangan) {
  absensiDraft[peserta_id] = {
    peserta_id,
    status,
    keterangan,
  };
}

const tanggalInput = document.getElementById("tanggal");
const tabel = document.getElementById("tabelAbsensi");
const btnLoad = document.getElementById("btnLoad");
const btnSimpan = document.getElementById("btnSimpan");

// default hari ini
tanggalInput.valueAsDate = new Date();

// ===============================
// LOAD ABSENSI
// ===============================
async function loadAbsensi() {
  const tanggal = tanggalInput.value;
  if (!tanggal) {
    Swal.fire("Peringatan", "Tanggal wajib dipilih", "warning");
    return;
  }

  AdminLoader.show();

  try {
    const data = await apiRequest(`/absensi?tanggal=${tanggal}`);

    tabel.innerHTML = "";

    // ===============================
    // MODE MOBILE → CARD ONLY
    // ===============================
    if (window.innerWidth < 768) {
      renderAbsensiCards(data);
      return; // 🔥 PENTING: STOP DI SINI
    }

    // ===============================
    // MODE DESKTOP → TABLE ONLY
    // ===============================
    if (data.length === 0) {
      tabel.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-muted">
            Tidak ada data peserta
          </td>
        </tr>
      `;
      return;
    }

    data.forEach((p) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${p.nama}</td>
        <td>
          <select class="form-control status" data-id="${p.peserta_id}">
            <option value="">-- pilih --</option>
            <option value="hadir" ${
              p.status === "hadir" ? "selected" : ""
            }>Hadir</option>
            <option value="izin" ${
              p.status === "izin" ? "selected" : ""
            }>Izin</option>
            <option value="sakit" ${
              p.status === "sakit" ? "selected" : ""
            }>Sakit</option>
            <option value="tidak hadir" ${
              p.status === "tidak hadir" ? "selected" : ""
            }>Tidak Hadir</option>
          </select>
        </td>
        <td>
          <input
            type="text"
            class="form-control keterangan"
            data-id="${p.peserta_id}"
            value="${p.keterangan || ""}"
          />
        </td>
      `;

      tabel.appendChild(tr);
    });
  } catch (err) {
    console.error("Load absensi error:", err);
    Swal.fire("Error", "Gagal load data absensi", "error");
  } finally {
    AdminLoader.hide();
  }
}

// ===============================
// SIMPAN ABSENSI (DESKTOP + MOBILE)
// ===============================
async function simpanAbsensi() {
  const tanggal = tanggalInput.value;
  if (!tanggal) {
    Swal.fire("Peringatan", "Tanggal wajib dipilih", "warning");
    return;
  }

  AdminLoader.show();

  try {
    let payloadData = [];

    // ===============================
    // MODE MOBILE (pakai absensiDraft)
    // ===============================
    if (window.innerWidth < 768) {
      payloadData = Object.values(absensiDraft);

      if (!payloadData.length) {
        Swal.fire("Info", "Belum ada absensi diisi", "info");
        return;
      }
    }

    // ===============================
    // MODE DESKTOP (ambil dari table)
    // ===============================
    else {
      const statusEls = document.querySelectorAll(".status");

      statusEls.forEach((el) => {
        if (!el.value) return;

        const peserta_id = el.dataset.id;
        const keterangan = document.querySelector(
          `.keterangan[data-id="${peserta_id}"]`
        ).value;

        payloadData.push({
          peserta_id,
          status: el.value,
          keterangan,
        });
      });

      if (!payloadData.length) {
        Swal.fire("Info", "Belum ada absensi diisi", "info");
        return;
      }
    }

    // ===============================
    // KIRIM SEKALI (ANTI DUPLICATE)
    // ===============================
    const payload = {
      tanggal,
      data: payloadData,
    };

    await apiRequest("/absensi", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    Swal.fire(
      "Berhasil",
      `Absensi tersimpan (${payloadData.length} peserta)`,
      "success"
    );

    absensiDraft = {}; // reset draft mobile
    loadAbsensi();
  } catch (err) {
    console.error("Simpan absensi error:", err);
    Swal.fire("Error", "Gagal menyimpan absensi", "error");
  } finally {
    AdminLoader.hide();
  }
}

// ==============================
// RENDER ABSENSI CARD LIST (MOBILE)
// ==============================
function renderAbsensiCards(data) {
  const container = document.getElementById("absensiMobileList");
  if (!container) return;

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = `
      <div class="text-muted text-center mt-3">
        Tidak ada data peserta
      </div>
    `;
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "absensi-card";

    card.innerHTML = `
      <div class="nama">👤 ${item.nama}</div>

      <div class="field">
        <select class="form-select status-select">
          ${renderStatusOptions(item.status)}
        </select>
      </div>

      <div class="field">
        <textarea
          class="form-control keterangan-input"
          rows="2"
          placeholder="Keterangan..."
        >${item.keterangan || ""}</textarea>
      </div>
    `;

    const statusEl = card.querySelector(".status-select");
    const ketEl = card.querySelector(".keterangan-input");

    // simpan ke state lokal (mirip edit hafalan)
    statusEl.addEventListener("change", () => {
      updateAbsensiLocal(item.peserta_id, statusEl.value, ketEl.value);
    });

    ketEl.addEventListener("input", () => {
      updateAbsensiLocal(item.peserta_id, statusEl.value, ketEl.value);
    });

    container.appendChild(card);
  });
}

// ===============================
// Helper Render Status
// ===============================
function renderStatusOptions(selected) {
  const statuses = ["hadir", "izin", "sakit", "tidak hadir"];

  return statuses
    .map(
      (s) =>
        `<option value="${s}" ${s === selected ? "selected" : ""}>${s}</option>`
    )
    .join("");
}

// ===============================
// EVENT
// ===============================
btnLoad.addEventListener("click", loadAbsensi);
btnSimpan.addEventListener("click", simpanAbsensi);

// auto load saat buka halaman
loadAbsensi();
