// ===== KONEKSI SUPABASE =====
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ===== LOGIN LOGIC =====
const PIN_BENAR = "1234";

function doLogin() {
    const pin = document.getElementById("pinInput").value;
    if (pin === PIN_BENAR) {
        localStorage.setItem("aspro_login", "true");
        tampilkanHalaman();
        loadItems();
    } else {
        alert("PIN Salah!");
    }
}

function handleLogout() {
    localStorage.removeItem("aspro_login");
    location.reload();
}

function tampilkanHalaman() {
    const isLogin = localStorage.getItem("aspro_login");
    if (isLogin === "true") {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("appPage").style.display = "block";
        document.getElementById('tanggal').valueAsDate = new Date();
    }
}

// ===== AMBIL DATA =====
async function loadItems() {
    const { data, error } = await _supabase
        .from("items")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const tbody = document.getElementById("tabelBody");
    tbody.innerHTML = "";
    data.forEach((item, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${item.nama}</td>
                <td>${item.jumlah}</td>
                <td>${item.satuan}</td>
                <td>${item.jenis}</td>
                <td>${item.tanggal}</td>
            </tr>`;
    });
}

// ===== SIMPAN DATA =====
async function simpanData() {
    const btn = document.querySelector("button[onclick='simpanData()']");
    
    // Ambil data dari input
    const payload = {
        nama: document.getElementById("namaBarang").value,
        jumlah: parseInt(document.getElementById("jumlah").value),
        satuan: document.getElementById("satuan").value,
        jenis: document.getElementById("jenis").value,
        tanggal: document.getElementById("tanggal").value
    };

    // Validasi
    if (!payload.nama || !payload.jumlah || !payload.tanggal) {
        alert("Mohon isi semua data!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Proses Simpan...";

    // Eksekusi ke Supabase
    const { error } = await _supabase.from("items").insert([payload]);

    if (error) {
        // ERROR DETECTOR: Akan muncul pesan jika kolom salah
        alert("GAGAL SIMPAN: " + error.message);
        console.error(error);
    } else {
        alert("Data Berhasil Tersimpan!");
        document.getElementById("stokForm").reset();
        document.getElementById('tanggal').valueAsDate = new Date();
        loadItems();
    }
    
    btn.disabled = false;
    btn.innerText = "Simpan";
}

// Cek status login saat web dibuka
window.onload = tampilkanHalaman;
