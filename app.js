const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;
let currentPetugas = localStorage.getItem("aspro_petugas") || "";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Theme
    const theme = localStorage.getItem('aspro_theme') || 'light';
    document.body.setAttribute('data-theme', theme);

    // 2. Cek Sesi Login
    if (localStorage.getItem("aspro_auth") === "true") {
        // Jika sudah login tapi nama petugas kosong (cache cleared), minta lagi
        if (!currentPetugas) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
        } else {
            showApp();
        }
    }

    // 3. Login dengan PIN
    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_auth", "true");
            document.getElementById('loginPage').style.display = 'none';
            
            // Cek apakah di PC ini sudah ada nama petugas tersimpan?
            if (currentPetugas) {
                showApp();
            } else {
                document.getElementById('petugasOverlay').style.display = 'flex';
            }
        } else { alert("PIN Salah!"); }
    };

    // 4. Simpan Nama Petugas (Log Audit)
    document.getElementById('btnSetPetugas').onclick = () => {
        const val = document.getElementById('inputNamaPetugas').value.trim();
        if (val) {
            currentPetugas = val;
            localStorage.setItem("aspro_petugas", val);
            document.getElementById('petugasOverlay').style.display = 'none';
            showApp();
        } else { alert("Mohon isi nama petugas!"); }
    };

    // 5. Logout
    document.getElementById('btnLogout').onclick = () => {
        localStorage.removeItem("aspro_auth");
        localStorage.removeItem("aspro_petugas"); // Hapus sesi petugas agar aman
        location.reload();
    };

    // 6. Event Listeners Lain
    document.getElementById('btnTheme').onclick = toggleTheme;
    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    document.getElementById('cariBarang').oninput = loadItems;
    document.getElementById('filterJenis').onchange = loadItems;
    document.getElementById('btnExport').onclick = exportExcel;
});

function toggleTheme() {
    const newTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('aspro_theme', newTheme);
}

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('displayPetugas').innerText = "👤 " + currentPetugas;
    document.getElementById('tanggal').valueAsDate = new Date();
    loadItems();
}

async function loadItems() {
    const tbody = document.getElementById("tabelBody");
    const dataList = document.getElementById("listBarang");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;

    try {
        let query = _supabase.from("items").select("*").order("tanggal", { ascending: false });
        if (fJenis !== "Semua") query = query.eq('jenis', fJenis);

        const { data, error } = await query;
        if (error) throw error;

        // --- AUTO SUGGEST LOGIC ---
        // Mengambil nama unik untuk saran input
        const uniqueNames = [...new Set(data.map(i => i.nama))];
        dataList.innerHTML = uniqueNames.map(name => `<option value="${name}">`).join("");

        let tIn = 0, tOut = 0;
        tbody.innerHTML = "";
        
        const filtered = data.filter(i => i.nama.toLowerCase().includes(search));

        filtered.forEach(item => {
            const isIn = item.jenis === 'Masuk';
            isIn ? tIn += item.jumlah : tOut += item.jumlah;
            // Format tanggal bersih YYYY-MM-DD
            const tgl = item.tanggal ? item.tanggal.split('T')[0] : "-";

            const row = document.createElement('tr');
            row.style.backgroundColor = isIn ? 'var(--row-in)' : 'var(--row-out)';
            row.innerHTML = `
                <td style="font-weight:600">${item.nama}</td>
                <td>${item.jumlah} <small>${item.satuan}</small></td>
                <td><small>${item.jenis}</small></td>
                <td>${tgl}</td>
                <td style="font-size:12px; color:var(--text-muted);">${item.petugas || '-'}</td>
                <td style="text-align:center">
                    <button onclick='editData(${JSON.stringify(item)})' style="border:none; background:none; cursor:pointer;">✏️</button>
                    <button onclick="hapusData(${item.id})" style="border:none; background:none; cursor:pointer; color:var(--danger); margin-left:10px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('sumMasuk').innerText = tIn;
        document.getElementById('sumKeluar').innerText = tOut;
    } catch (e) { console.error(e); }
}

async function simpanData() {
    const id = document.getElementById('editId').value;
    const payload = {
        nama: document.getElementById('namaBarang').value.trim(),
        jumlah: parseInt(document.getElementById('jumlah').value),
        satuan: document.getElementById('satuan').value.trim(),
        jenis: document.getElementById('jenis').value,
        tanggal: document.getElementById('tanggal').value,
        petugas: currentPetugas // Ambil nama dari sesi login
    };

    if (!payload.nama || isNaN(payload.jumlah)) return alert("Data belum lengkap!");

    try {
        if (isEditing) { 
            await _supabase.from("items").update(payload).eq('id', id); 
        } else { 
            await _supabase.from("items").insert([payload]); 
        }
        resetForm(); loadItems();
    } catch (e) { alert("Gagal Simpan. Pastikan kolom 'petugas' ada di Supabase!"); }
}

function editData(item) {
    isEditing = true;
    document.getElementById('formTitle').innerHTML = "<i data-lucide='edit-2' style='width:18px;'></i> Edit Data";
    document.getElementById('btnSimpan').innerText = "Update Data";
    document.getElementById('btnBatal').style.display = "block";
    
    document.getElementById('editId').value = item.id;
    document.getElementById('namaBarang').value = item.nama;
    document.getElementById('jumlah').value = item.jumlah;
    document.getElementById('satuan').value = item.satuan;
    document.getElementById('jenis').value = item.jenis;
    document.getElementById('tanggal').value = item.tanggal.split('T')[0];
    
    // Refresh Icon
    lucide.createIcons();
    window.scrollTo({top:0, behavior:'smooth'});
}

function resetForm() {
    isEditing = false;
    document.getElementById('formTitle').innerHTML = "<i data-lucide='file-plus-2' style='width:18px;'></i> Transaksi";
    document.getElementById('btnSimpan').innerText = "Simpan Data";
    document.getElementById('btnBatal').style.display = "none";
    document.getElementById('stokForm').reset();
    document.getElementById('tanggal').valueAsDate = new Date();
    lucide.createIcons();
}

async function hapusData(id) {
    if (confirm("Hapus data ini?")) { await _supabase.from("items").delete().eq('id', id); loadItems(); }
}

async function exportExcel() {
    try {
        const { data } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: Riwayat
        const riwayat = data.map(i => ({
            "Tanggal": i.tanggal.split('T')[0],
            "Nama Barang": i.nama,
            "Jenis": i.jenis,
            "Jumlah": i.jumlah,
            "Satuan": i.satuan,
            "Petugas": i.petugas || "-"
        }));

        // Sheet 2: Sisa Stok
        const stokMap = {};
        data.forEach(i => {
            if (!stokMap[i.nama]) stokMap[i.nama] = { "Nama Barang": i.nama, "Total Masuk": 0, "Total Keluar": 0, "Sisa Stok": 0, "Satuan": i.satuan };
            if (i.jenis === "Masuk") stokMap[i.nama]["Total Masuk"] += i.jumlah;
            else stokMap[i.nama]["Total Keluar"] += i.jumlah;
            stokMap[i.nama]["Sisa Stok"] = stokMap[i.nama]["Total Masuk"] - stokMap[i.nama]["Total Keluar"];
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riwayat), "Riwayat Transaksi");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(stokMap)), "Laporan Sisa Stok");
        XLSX.writeFile(wb, `ASPRO_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { alert("Gagal Export"); }
}
