const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem("aspro_v2") === "true") showApp();

    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_v2", "true");
            showApp();
        } else { alert("PIN Salah!"); }
    };

    document.getElementById('btnLogout').onclick = () => {
        localStorage.removeItem("aspro_v2");
        location.reload();
    };

    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    
    // Listeners Filter
    document.getElementById('cariBarang').onkeyup = loadItems;
    document.getElementById('filterJenis').onchange = loadItems;
    document.getElementById('filterBulan').onchange = loadItems;
    document.getElementById('btnExport').onclick = exportExcel;
});

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('tanggal').valueAsDate = new Date();
    // Default filter bulan ke bulan ini
    const now = new Date();
    document.getElementById('filterBulan').value = now.toISOString().slice(0, 7);
    loadItems();
}

async function loadItems() {
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;
    const fBulan = document.getElementById('filterBulan').value;

    try {
        let query = _supabase.from("items").select("*").order("id", { ascending: false });

        if (fJenis !== "Semua") query = query.eq('jenis', fJenis);
        if (fBulan) query = query.gte('tanggal', `${fBulan}-01`).lte('tanggal', `${fBulan}-31`);

        const { data, error } = await query;
        if (error) throw error;

        let inQty = 0, outQty = 0;
        tbody.innerHTML = "";

        data.filter(i => i.nama.toLowerCase().includes(search)).forEach(item => {
            const isIn = item.jenis === 'Masuk';
            isIn ? inQty += item.jumlah : outQty += item.jumlah;

            const row = document.createElement('tr');
            row.style.backgroundColor = isIn ? '#e8f5e9' : '#e1f5fe';
            row.innerHTML = `
                <td><b>${item.nama}</b></td>
                <td>${item.jumlah} ${item.satuan}</td>
                <td><span class="badge ${item.jenis}">${item.jenis}</span></td>
                <td>${item.tanggal}</td>
                <td>
                    <button onclick="editData(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="btn-edit">✏️</button>
                    <button onclick="hapusData(${item.id})" class="btn-del">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('sumMasuk').innerText = inQty;
        document.getElementById('sumKeluar').innerText = outQty;
    } catch (e) { console.error(e); }
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

    try {
        if (isEditing) {
            await _supabase.from("items").update(payload).eq('id', id);
            alert("Berhasil diperbarui");
        } else {
            await _supabase.from("items").insert([payload]);
        }
        resetForm();
        loadItems();
    } catch (e) { alert(e.message); }
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
    window.scrollTo(0, 0);
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
    if(confirm("Hapus data ini?")) {
        await _supabase.from("items").delete().eq('id', id);
        loadItems();
    }
}

async function exportExcel() {
    const { data } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Rekap");
    XLSX.writeFile(wb, "AsproV2_Report.xlsx");
}
