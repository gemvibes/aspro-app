const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Management
    const currentTheme = localStorage.getItem('aspro_theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    document.getElementById('btnTheme').innerText = currentTheme === 'light' ? "🌙 Dark Mode" : "☀️ Light Mode";

    // 2. Auth Check
    if (localStorage.getItem("aspro_auth") === "true") showApp();

    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_auth", "true");
            showApp();
        } else { alert("PIN Salah!"); }
    };

    document.getElementById('btnLogout').onclick = () => {
        localStorage.removeItem("aspro_auth");
        location.reload();
    };

    // 3. Theme Toggle
    document.getElementById('btnTheme').onclick = () => {
        const theme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('aspro_theme', theme);
        document.getElementById('btnTheme').innerText = theme === 'light' ? "🌙 Dark Mode" : "☀️ Light Mode";
    };

    // 4. CRUD & Filter
    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    document.getElementById('cariBarang').oninput = loadItems;
    document.getElementById('filterJenis').onchange = loadItems;
    document.getElementById('btnExport').onclick = exportExcel;
});

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('tanggal').valueAsDate = new Date();
    loadItems(); // Memanggil data tanpa filter bulan sama sekali
}

async function loadItems() {
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;

    try {
        let query = _supabase.from("items").select("*").order("tanggal", { ascending: false });

        // Filter Jenis (Masuk/Keluar)
        if (fJenis !== "Semua") query = query.eq('jenis', fJenis);

        const { data, error } = await query;
        if (error) throw error;

        let totalIn = 0, totalOut = 0;
        tbody.innerHTML = "";

        // Filter Pencarian Nama di Sisi Klien agar lebih responsif
        const filtered = data.filter(i => i.nama.toLowerCase().includes(search));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted)">Tidak ada data ditemukan.</td></tr>`;
        }

        filtered.forEach(item => {
            const isIn = item.jenis === 'Masuk';
            isIn ? totalIn += item.jumlah : totalOut += item.jumlah;

            const row = document.createElement('tr');
            row.style.backgroundColor = isIn ? 'var(--row-in)' : 'var(--row-out)';
            
            row.innerHTML = `
                <td style="font-weight: 600;">${item.nama}</td>
                <td>${item.jumlah} <small>${item.satuan}</small></td>
                <td><span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.05)">${item.jenis}</span></td>
                <td>${item.tanggal}</td>
                <td style="text-align: center;">
                    <button onclick='editData(${JSON.stringify(item)})' style="background:none; border:none; cursor:pointer; font-size:16px;">✏️</button>
                    <button onclick="hapusData(${item.id})" style="background:none; border:none; cursor:pointer; color:var(--danger); font-size:16px; margin-left:10px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('sumMasuk').innerText = totalIn;
        document.getElementById('sumKeluar').innerText = totalOut;

    } catch (e) { console.error("Load Error:", e); }
}

async function simpanData() {
    const id = document.getElementById('editId').value;
    const payload = {
        nama: document.getElementById('namaBarang').value.trim(),
        jumlah: parseInt(document.getElementById('jumlah').value),
        satuan: document.getElementById('satuan').value.trim(),
        jenis: document.getElementById('jenis').value,
        tanggal: document.getElementById('tanggal').value
    };

    if (!payload.nama || isNaN(payload.jumlah)) return alert("Mohon lengkapi data!");

    try {
        if (isEditing) {
            await _supabase.from("items").update(payload).eq('id', id);
        } else {
            await _supabase.from("items").insert([payload]);
        }
        resetForm();
        loadItems();
    } catch (e) { alert("Simpan Gagal: " + e.message); }
}

function editData(item) {
    isEditing = true;
    document.getElementById('formTitle').innerText = "✏️ Edit Transaksi";
    document.getElementById('btnSimpan').innerText = "Update Data";
    document.getElementById('btnBatal').style.display = "block";
    
    document.getElementById('editId').value = item.id;
    document.getElementById('namaBarang').value = item.nama;
    document.getElementById('jumlah').value = item.jumlah;
    document.getElementById('satuan').value = item.satuan;
    document.getElementById('jenis').value = item.jenis;
    document.getElementById('tanggal').value = item.tanggal;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (confirm("Hapus data ini secara permanen?")) {
        await _supabase.from("items").delete().eq('id', id);
        loadItems();
    }
}

async function exportExcel() {
    try {
        const { data } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Data Stok");
        XLSX.writeFile(wb, `AsproV2_Laporan.xlsx`);
    } catch (e) { alert("Export Gagal"); }
}
