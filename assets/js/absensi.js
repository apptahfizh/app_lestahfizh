// ==============================
// absensi.js – SPA SAFE VERSION
// ==============================

let tanggalInputAbsensi = null;
let tabelAbsensi = null;

// ==============================
// INIT ABSENSI PAGE (SPA)
// ==============================
window.initAbsensiPage = function () {
  console.log("🚀 initAbsensiPage dipanggil");

  checkAuth(["admin", "ustadz"]);

  tanggalInputAbsensi = document.getElementById("tanggal");
  tabelAbsensi = document.getElementById("tabelAbsensi");

  const btnLoad = document.getElementById("btnLoad");
  const btnSimpan = document.getElementById("btnSimpan");

  if (!tanggalInputAbsensi || !tabelAbsensi) {
    console.warn("⛔ Elemen absensi belum siap");
    return;
  }

  // default tanggal hari ini
  tanggalInputAbsensi.valueAsDate = new Date();

  if (btnLoad) btnLoad.onclick = loadAbsensi;
  if (btnSimpan) btnSimpan.onclick = simpanAbsensi;

  // auto load saat page dibuka
  loadAbsensi();
};

// ===============================
// LOAD ABSENSI
// ===============================
async function loadAbsensi() {
  const tanggal = tanggalInputAbsensi?.value;
  if (!tanggal) {
    Swal.fire("Peringatan", "Tanggal wajib dipilih", "warning");
    return;
  }

  try {
    const res = await api.get("/absensi", {
      params: { tanggal },
    });

    const data = res.data || [];
    tabelAbsensi.innerHTML = "";

    if (data.length === 0) {
      tabelAbsensi.innerHTML = `
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

      tabelAbsensi.appendChild(tr);
    });
  } catch (err) {
    console.error("Load absensi error:", err);
    Swal.fire("Error", "Gagal load data absensi", "error");
  }
}

// ===============================
// SIMPAN ABSENSI
// ===============================
async function simpanAbsensi() {
  const tanggal = tanggalInputAbsensi?.value;
  if (!tanggal) {
    Swal.fire("Peringatan", "Tanggal wajib dipilih", "warning");
    return;
  }

  const statusEls = document.querySelectorAll(".status");
  let total = 0;

  try {
    for (const el of statusEls) {
      if (!el.value) continue;

      const peserta_id = el.dataset.id;
      const ketEl = document.querySelector(
        `.keterangan[data-id="${peserta_id}"]`
      );

      await api.post("/absensi", {
        peserta_id,
        tanggal,
        status: el.value,
        keterangan: ketEl?.value || "",
      });

      total++;
    }

    Swal.fire("Berhasil", `Absensi tersimpan (${total} peserta)`, "success");
    loadAbsensi();
  } catch (err) {
    console.error("Simpan absensi error:", err);
    Swal.fire("Error", "Gagal menyimpan absensi", "error");
  }
}
