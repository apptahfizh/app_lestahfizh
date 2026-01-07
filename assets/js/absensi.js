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

  AdminLoader.show(); // 🔥 START LOADER

  try {
    const data = await apiRequest(`/absensi?tanggal=${tanggal}`);

    tabel.innerHTML = "";

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
            placeholder="Opsional"
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
    AdminLoader.hide(); // 🔥 STOP LOADER (WAJIB)
  }
}

renderAbsensiMobile(data);
if (window.innerWidth < 768) {
  renderAbsensiMobile(data);
}

// ===============================
// SIMPAN ABSENSI
// ===============================
async function simpanAbsensi() {
  const tanggal = tanggalInput.value;
  if (!tanggal) {
    Swal.fire("Peringatan", "Tanggal wajib dipilih", "warning");
    return;
  }

  const statusEls = document.querySelectorAll(".status");
  let total = 0;

  AdminLoader.show(); // 🔥

  try {
    for (const el of statusEls) {
      if (!el.value) continue;

      const peserta_id = el.dataset.id;
      const keterangan = document.querySelector(
        `.keterangan[data-id="${peserta_id}"]`
      ).value;

      await apiRequest("/absensi", {
        method: "POST",
        body: JSON.stringify({
          peserta_id,
          tanggal,
          status: el.value,
          keterangan,
        }),
      });

      total++;
    }

    Swal.fire("Berhasil", `Absensi tersimpan (${total} peserta)`, "success");
    loadAbsensi();
  } catch (err) {
    console.error("Simpan absensi error:", err);
    Swal.fire("Error", "Gagal menyimpan absensi", "error");
  } finally {
    AdminLoader.hide(); // 🔥
  }
}

// ===============================
// RENDER MOBILE CARD
// ===============================
function renderAbsensiMobile(data) {
  const container = document.getElementById("absensiMobileList");
  if (!container) return;

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = `<div class="text-muted text-center">Tidak ada data</div>`;
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "absensi-card";

    card.innerHTML = `
      <h6>${item.nama}</h6>

      <select class="form-select mb-2 status-select">
        ${renderStatusOptions(item.status)}
      </select>

      <textarea
        class="form-control keterangan-input"
        rows="2"
        placeholder="Keterangan..."
      >${item.keterangan || ""}</textarea>
    `;

    // bind event
    const statusEl = card.querySelector(".status-select");
    const ketEl = card.querySelector(".keterangan-input");

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
