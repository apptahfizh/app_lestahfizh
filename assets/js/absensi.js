checkAuth(["admin", "ustadz"]); // hanya admin / ustadz

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

  try {
    const data = await apiRequest("/absensi", "GET", null, { tanggal });

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
            }>tidak hadir</option>
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
  }
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

  try {
    for (const el of statusEls) {
      if (!el.value) continue;

      const peserta_id = el.dataset.id;
      const keterangan = document.querySelector(
        `.keterangan[data-id="${peserta_id}"]`
      ).value;

      await apiRequest("/absensi", "POST", {
        peserta_id,
        tanggal,
        status: el.value,
        keterangan,
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

// ===============================
// EVENT
// ===============================
btnLoad.addEventListener("click", loadAbsensi);
btnSimpan.addEventListener("click", simpanAbsensi);

// auto load saat buka halaman
loadAbsensi();
