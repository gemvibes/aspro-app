const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;

// 1. INISIALISASI & THEME
document.addEventListener('DOMContentLoaded', () => {
    // Load Theme
    const savedTheme = localStorage.getItem('aspro_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);

    // Cek Session
    if (localStorage.getItem("aspro_auth") === "true") showApp();

    // Event Handler Login
    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_auth", "true");
            showApp();
        } else { alert("PIN Salah!"); }
    };

    // Logout & Theme Toggle
    document.getElementById('btnLogout').onclick = () => { localStorage.removeItem("aspro_auth"); location.reload(); };
    document.getElementById('btnThemeToggle').onclick = toggleTheme;

    // Form & Filter
    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    document.getElementById('cariBarang').oninput = loadItems;
    document.getElementById('filterJenis').onchange = loadItems;
    document.getElementById('filterBulan').onchange = loadItems;
    document.getElementById('btnExport').onclick = exportExcel;
});

// 2. FUNGSI TEMA
function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const target = current === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', target);
    localStorage.setItem('aspro_theme', target);
    updateThemeButton(target);
}

function updateThemeButton(theme) {
    document.getElementById('btnThemeToggle').innerText = theme === 'light' ? "🌙 Mode Gelap" : "☀️ Mode Terang";
}

// 3. CORE LOGIC
function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('tanggal').valueAsDate = new Date();
    // Default filter bulan ke bulan ini tapi bisa dikosongkan jika ingin lihat semua data
    document.getElementById('filterBulan').value = new Date().toISOString().slice(0, 7);
    loadItems();
}

async function loadItems() {
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;
    const fBulan = document.getElementById('filterBulan').value; // format YYYY-MM

    try {
        let query = _supabase.from("items").select("*").order("tanggal", { ascending: false });

        if (fJenis !== "Semua") query = query.eq('jenis', fJenis);
        
        // Perbaikan filter bulan: Menggunakan pattern matching (Contoh: 2024-05%)
        if (fBulan) query = query.ilike('tanggal', `${fBulan}%`);

        const { data, error } = await query;
        if (error) throw error;

        let inQty = 0, outQty = 0;
        tbody.innerHTML = "";

        // Jika data kosong
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted)">Data tidak ditemukan untuk periode ini.</td></tr>`;
        }

        data.filter(i => i.nama.toLowerCase().includes(search)).forEach(item => {
            const isIn = item.jenis === 'Masuk';
            isIn ? inQty += item.jumlah : outQty += item.jumlah;

            const row = document.createElement('tr');
            row.style.backgroundColor = isIn ? 'var(--row-in)' : 'var(--row-out)';
            row.style.color = 'var(--text-main)';
            
            row.innerHTML = `
                <td><b>${item.nama}</b></td>
                <td>${item.jumlah} ${item.satuan}</td>
                <td><small>${item.jenis}</small></td>
                <td>${item.tanggal}</td>
                <td style="text-align:center">
                    <button onclick='editData(${JSON.stringify(item)})' style="background:none; border:none; cursor:pointer;">✏️</button>
                    <button onclick="hapusData(${item.id})" style="background:none; border:none; cursor:pointer; color:red; margin-left:10px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('sumMasuk').innerText = inQty;
        document.getElementById('sumKeluar').innerText = outQty;
    } catch (e) { console.error("Error load data:", e); }
}

async function simpanData() {
    const id = document.getElementById('editId').value;
    const payload = {
        nama: document.getElementById('namaBarang').value,
        jumlah: parseInt(document.getElementById('jumlah').value),
        satuan: document.getElementById('satuan').value,
        jenis: document.getElementById('jenis').value,
        tanggal: document.getElementById('tanggal').value
    };

    if(!payload.nama || isNaN(payload.jumlah)) return alert("Lengkapi data!");

    try {
        if (isEditing) {
            const { error } = await _supabase.from("items").update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await _supabase.from("items").insert([payload]);
            if (error) throw error;
        }
        resetForm();
        loadItems();
    } catch (e) { alert("Error: " + e.message); }
}

function editData(item) {
    isEditing = true;
    document.getElementById('formTitle').innerText = "✏️ Edit Transaksi";
    document.getElementById('btnSimpan').innerText = "Update Data";
    document.getElementById('btnBatal').style.display = "inline";
    
    document.getElementById('editId').value = item.id;
    document.getElementById('namaBarang').value = item.nama;
    document.getElementById('jumlah').value = item.jumlah;
    document.getElementById('satuan').value = item.satuan;
    document.getElementById('jenis').value = item.jenis;
    document.getElementById('tanggal').value = item.tanggal;
}

function resetForm() {
    isEditing = false;
    document.getElementById('formTitle').innerText = "📝 Transaksi Baru";
    document.getElementById('btnSimpan').innerText = "Simpan Data";
    document.getElementById('btnBatal').style.display = "none";
    document.getElementById('stokForm').reset();
    document.getElementById('tanggal').valueAsDate = new Date();
}

async function hapusData(id) {
    if(confirm("Hapus data ini selamanya?")) {
        await _supabase.from("items").delete().eq('id', id);
        loadItems();
    }
}

async function exportExcel() {
    const { data } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Laporan Stok");
    XLSX.writeFile(wb, `Laporan_ASPRO_V2_${new Date().toLocaleDateString()}.xlsx`);
}
