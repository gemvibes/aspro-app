// 1. INISIALISASI SUPABASE (Data Sesuai Screenshot Anda)
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co"; //
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; //
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. LOGIKA LOGIN & ELEMENT SELECTOR
document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('loginPage');
    const appPage = document.getElementById('appPage');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnSimpan = document.getElementById('btnSimpan');

    // Cek Session saat aplikasi dibuka
    if (localStorage.getItem("aspro_auth") === "true") {
        showApp();
    }

    // Fungsi Masuk
    btnLogin.onclick = () => {
        const pin = document.getElementById('pinInput').value;
        if (pin === "1234") {
            localStorage.setItem("aspro_auth", "true");
            showApp();
        } else {
            alert("PIN Salah! Gunakan 1234");
        }
    };

    // Fungsi Keluar
    btnLogout.onclick = () => {
        localStorage.removeItem("aspro_auth");
        location.reload();
    };

    // Fungsi Simpan
    btnSimpan.onclick = simpanData;

    function showApp() {
        loginPage.style.display = 'none';
        appPage.style.display = 'block';
        document.getElementById('tanggal').valueAsDate = new Date();
        loadItems();
    }
});

// 3. FUNGSI LOAD DATA
async function loadItems() {
    const tbody = document.getElementById("tabelBody");
    try {
        const { data, error } = await _supabase
            .from("items") // Pastikan nama tabel di Supabase Anda 'items'
            .select("*")
            .order("id", { ascending: false });

        if (error) throw error;

        tbody.innerHTML = "";
        if (data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4'>Belum ada data.</td></tr>";
            return;
        }

        data.forEach(item => {
            const warna = item.jenis === 'Masuk' ? 'green' : 'red';
            tbody.innerHTML += `
                <tr>
                    <td style="text-align:left;">${item.nama}</td>
                    <td>${item.jumlah} ${item.satuan}</td>
                    <td style="color:${warna}; font-weight:bold;">${item.jenis}</td>
                    <td>${item.tanggal}</td>
                </tr>`;
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan='4' style='color:red;'>Error: ${err.message}</td></tr>`;
    }
}

// 4. FUNGSI SIMPAN DATA
async function simpanData() {
    const btn = document.getElementById('btnSimpan');
    const payload = {
        nama: document.getElementById("namaBarang").value,
        jumlah: parseInt(document.getElementById("jumlah").value),
        satuan: document.getElementById("satuan").value,
        jenis: document.getElementById("jenis").value,
        tanggal: document.getElementById("tanggal").value
    };

    if (!payload.nama || !payload.jumlah || !payload.tanggal) {
        alert("Lengkapi data!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "⏳ Menyimpan...";

    try {
        const { error } = await _supabase.from("items").insert([payload]);
        if (error) throw error;

        alert("✅ Berhasil Disimpan!");
        document.getElementById("stokForm").reset();
        document.getElementById('tanggal').valueAsDate = new Date();
        loadItems();
    } catch (err) {
        alert("❌ Gagal Simpan: " + err.message);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = "💾 SIMPAN DATA";
    }
}
