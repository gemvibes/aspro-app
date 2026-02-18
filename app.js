const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;
let currentPetugas = localStorage.getItem("aspro_petugas") || "";
let globalData = [];

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem("aspro_theme") === 'dark') document.body.setAttribute('data-theme', 'dark');
    
    if (localStorage.getItem("aspro_auth") === "true") {
        if (!currentPetugas) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
        } else { showApp(); }
    }

    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_auth", "true");
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
        } else alert("PIN Salah!");
    };

    document.getElementById('btnSetPetugas').onclick = () => {
        const val = document.getElementById('inputNamaPetugas').value.trim();
        if(val) { currentPetugas = val; localStorage.setItem("aspro_petugas", val); showApp(); }
    };

    document.getElementById('btnLogout').onclick = () => { localStorage.clear(); location.reload(); };
    document.getElementById('btnTheme').onclick = () => {
        const t = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', t); localStorage.setItem('aspro_theme', t);
    };

    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    document.getElementById('cariBarang').oninput = renderTable;
    document.getElementById('btnExport').onclick = exportExcel;
    document.getElementById('btnBackupJSON').onclick = backupToJSON;
    document.getElementById('fileRestore').onchange = restoreFromJSON;
});

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('petugasOverlay').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('tanggal').valueAsDate = new Date();
    loadItems();
}

async function loadItems() {
    let { data, error } = await _supabase.from("items").select("*").order("tanggal", { ascending: false });
    if (!error) {
        globalData = data;
        renderTable();
        renderStockCard();
        
        const dl = document.getElementById('listBarang');
        const names = [...new Set(data.map(i => i.nama))];
        dl.innerHTML = names.map(n => `<option value="${n}">`).join("");
    }
}

function formatTanggal(tglStr) {
    if (!tglStr) return "-";
    const tglHanya = tglStr.split('T')[0]; 
    const bagian = tglHanya.split('-'); 
    if (bagian.length !== 3) return tglStr;
    return `${bagian[2]}-${bagian[1]}-${bagian[0]}`; 
}

function renderTable() {
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    tbody.innerHTML = "";

    globalData.filter(i => i.nama.toLowerCase().includes(search)).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><b>${item.nama}</b></td>
            <td>${item.jumlah} ${item.satuan}</td>
            <td><span style="padding:4px 8px; border-radius:6px; font-size:10px; font-weight:bold; background:${item.jenis === 'Masuk' ? '#14b8a6' : '#3b82f6'}; color:white;">${item.jenis.toUpperCase()}</span></td>
            <td>${formatTanggal(item.tanggal)}</td>
            <td style="text-align:center">
                <button onclick='editData(${JSON.stringify(item)})' style="cursor:pointer; border:none; background:none; font-size:16px;">✏️</button>
                <button onclick="hapusData(${item.id})" style="cursor:pointer; border:none; background:none; color:red; margin-left:10px; font-size:16px;">🗑️</button>
            </td>`;
        tbody.appendChild(row);
    });
}

function renderStockCard() {
    const container = document.getElementById("stockListContainer");
    const stockMap = {};

    globalData.forEach(item => {
        if (!stockMap[item.nama]) stockMap[item.nama] = { qty: 0, satuan: item.satuan };
        stockMap[item.nama].qty += (item.jenis === 'Masuk' ? item.jumlah : -item.jumlah);
    });

    container.innerHTML = "";
    Object.entries(stockMap).forEach(([nama, val]) => {
        const div = document.createElement('div');
        div.className = 'stock-row';
        const lowStock = val.qty <= 5;
        div.innerHTML = `
            <span style="font-weight:600">${nama}</span>
            <span style="text-align:center"><span class="qty-badge" style="background:${lowStock ? '#f43f5e' : 'rgba(255,255,255,0.2)'}">${val.qty}</span></span>
            <span style="text-align:right; opacity:0.7;">${val.satuan}</span>
        `;
        container.appendChild(div);
    });
}

async function simpanData() {
    const payload = {
        nama: document.getElementById('namaBarang').value.trim(),
        jumlah: parseInt(document.getElementById('jumlah').value),
        satuan: document.getElementById('satuan').value.trim(),
        jenis: document.getElementById('jenis').value,
        tanggal: document.getElementById('tanggal').value,
        petugas: currentPetugas
    };
    if (!payload.nama || isNaN(payload.jumlah)) return alert("Lengkapi data!");
    if (isEditing) await _supabase.from("items").update(payload).eq('id', document.getElementById('editId').value);
    else await _supabase.from("items").insert([payload]);
    resetForm(); loadItems();
}

async function restoreFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm(`Impor ${data.length} data ke database?`)) {
                const cleanData = data.map(i => ({...i, petugas: i.petugas || "Imported"}));
                const { error } = await _supabase.from("items").insert(cleanData);
                if (error) throw error;
                alert("Restore Berhasil!"); loadItems();
            }
        } catch (err) { alert("File tidak sesuai!"); }
    };
    reader.readAsText(file);
}

function backupToJSON() {
    const dataStr = JSON.stringify(globalData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_aspro_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function editData(item) {
    isEditing = true;
    document.getElementById('editId').value = item.id;
    document.getElementById('namaBarang').value = item.nama;
    document.getElementById('jumlah').value = item.jumlah;
    document.getElementById('satuan').value = item.satuan;
    document.getElementById('jenis').value = item.jenis;
    document.getElementById('tanggal').value = item.tanggal;
    document.getElementById('btnSimpan').innerText = "UPDATE DATA";
    document.getElementById('btnBatal').style.display = "block";
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetForm() {
    isEditing = false;
    document.getElementById('stokForm').reset();
    document.getElementById('btnSimpan').innerText = "SIMPAN";
    document.getElementById('btnBatal').style.display = "none";
    document.getElementById('tanggal').valueAsDate = new Date();
}

async function hapusData(id) { 
    if(confirm("Hapus data ini?")) { await _supabase.from("items").delete().eq('id', id); loadItems(); } 
}

async function exportExcel() {
    // DATA SHEET 1: RIWAYAT
    const dataRiwayat = globalData.map(item => ({
        "Nama Barang": item.nama,
        "Jumlah": item.jumlah,
        "Satuan": item.satuan,
        "Status": item.jenis,
        "Tanggal": formatTanggal(item.tanggal),
        "Petugas": item.petugas || "-"
    }));

    // DATA SHEET 2: RINGKASAN STOK
    const stockMap = {};
    globalData.forEach(item => {
        if (!stockMap[item.nama]) stockMap[item.nama] = { qty: 0, satuan: item.satuan };
        stockMap[item.nama].qty += (item.jenis === 'Masuk' ? item.jumlah : -item.jumlah);
    });

    const dataStok = Object.entries(stockMap).map(([nama, val]) => ({
        "Nama Barang": nama,
        "Stok Akhir": val.qty,
        "Satuan": val.satuan,
        "Keterangan": val.qty <= 5 ? "⚠️ STOK KRITIS" : "✅ AMAN"
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(dataRiwayat);
    const ws2 = XLSX.utils.json_to_sheet(dataStok);
    
    XLSX.utils.book_append_sheet(wb, ws1, "Riwayat_Transaksi");
    XLSX.utils.book_append_sheet(wb, ws2, "Ringkasan_Stok");
    
    XLSX.writeFile(wb, `Laporan_Aspro_V2_${new Date().toISOString().split('T')[0]}.xlsx`);
}
