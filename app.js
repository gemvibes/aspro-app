const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = localStorage.getItem('aspro_theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    document.getElementById('btnTheme').innerText = currentTheme === 'light' ? "🌙 Dark Mode" : "☀️ Light Mode";

    if (localStorage.getItem("aspro_auth") === "true") showApp();

    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_auth", "true");
            showApp();
        } else { alert("PIN Salah!"); }
    };

    document.getElementById('btnLogout').onclick = () => { localStorage.removeItem("aspro_auth"); location.reload(); };

    document.getElementById('btnTheme').onclick = () => {
        const theme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('aspro_theme', theme);
        document.getElementById('btnTheme').innerText = theme === 'light' ? "🌙 Dark Mode" : "☀️ Light Mode";
    };

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
    loadItems();
}

async function loadItems() {
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;

    try {
        let query = _supabase.from("items").select("*").order("tanggal", { ascending: false });
        if (fJenis !== "Semua") query = query.eq('jenis', fJenis);

        const { data, error } = await query;
        if (error) throw error;

        let totalIn = 0, totalOut = 0;
        tbody.innerHTML = "";
        const filtered = data.filter(i => i.nama.toLowerCase().includes(search));

        filtered.forEach(item => {
            const isIn = item.jenis === 'Masuk';
            isIn ? totalIn += item.jumlah : totalOut += item.jumlah;

            // FIX TANGGAL: Potong jam/menit
            const tgl = item.tanggal ? item.tanggal.split('T')[0] : "-";

            const row = document.createElement('tr');
            row.style.backgroundColor = isIn ? 'var(--row-in)' : 'var(--row-out)';
            row.innerHTML = `
                <td style="font-weight:600">${item.nama}</td>
                <td>${item.jumlah} <small>${item.satuan}</small></td>
                <td><small>${item.jenis}</small></td>
                <td>${tgl}</td>
                <td style="text-align:center">
                    <button onclick='editData(${JSON.stringify(item)})' style="border:none; background:none; cursor:pointer;">✏️</button>
                    <button onclick="hapusData(${item.id})" style="border:none; background:none; cursor:pointer; color:var(--danger); margin-left:10px;">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('sumMasuk').innerText = totalIn;
        document.getElementById('sumKeluar').innerText = totalOut;
    } catch (e) { console.error(e); }
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

    if (!payload.nama || isNaN(payload.jumlah)) return alert("Data tidak lengkap!");

    try {
        if (isEditing) { await _supabase.from("items").update(payload).eq('id', id); }
        else { await _supabase.from("items").insert([payload]); }
        resetForm(); loadItems();
    } catch (e) { alert("Gagal Simpan"); }
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
    document.getElementById('tanggal').value = item.tanggal.split('T')[0];
    window.scrollTo({top:0, behavior:'smooth'});
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
    if (confirm("Hapus data?")) { await _supabase.from("items").delete().eq('id', id); loadItems(); }
}

// FIX EXCEL: Menambahkan Sisa Stok Otomatis
async function exportExcel() {
    try {
        const { data, error } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
        if (error) throw error;

        // Sheet 1: Riwayat Transaksi
        const riwayat = data.map(i => ({
            "Tanggal": i.tanggal.split('T')[0],
            "Nama Barang": i.nama,
            "Jenis": i.jenis,
            "Jumlah": i.jumlah,
            "Satuan": i.satuan
        }));

        // Sheet 2: Perhitungan Sisa Stok
        const stokMap = {};
        data.forEach(i => {
            if (!stokMap[i.nama]) {
                stokMap[i.nama] = { "Nama Barang": i.nama, "Total Masuk": 0, "Total Keluar": 0, "Sisa Stok": 0, "Satuan": i.satuan };
            }
            if (i.jenis === "Masuk") stokMap[i.nama]["Total Masuk"] += i.jumlah;
            else stokMap[i.nama]["Total Keluar"] += i.jumlah;
            
            stokMap[i.nama]["Sisa Stok"] = stokMap[i.nama]["Total Masuk"] - stokMap[i.nama]["Total Keluar"];
        });
        const sisaStok = Object.values(stokMap);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riwayat), "Riwayat Transaksi");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sisaStok), "Laporan Sisa Stok");
        XLSX.writeFile(wb, `ASPRO_Laporan_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { alert("Export Gagal!"); }
}
