const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;
let currentPetugas = localStorage.getItem("aspro_petugas") || "";
let globalData = []; // Simpan data lokal untuk performa

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem("aspro_theme") === 'dark') document.body.setAttribute('data-theme', 'dark');
    
    // Cek Login
    if (localStorage.getItem("aspro_auth") === "true") {
        if (!currentPetugas) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
        } else { showApp(); }
    }

    // Event Listeners
    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_auth", "true");
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
        } else alert("PIN Salah!");
    };
    document.getElementById('pinInput').onkeypress = (e) => { if(e.key === 'Enter') document.getElementById('btnLogin').click(); };

    document.getElementById('btnSetPetugas').onclick = () => {
        const val = document.getElementById('inputNamaPetugas').value.trim();
        if(val) { currentPetugas = val; localStorage.setItem("aspro_petugas", val); showApp(); }
    };
    document.getElementById('inputNamaPetugas').onkeypress = (e) => { if(e.key === 'Enter') document.getElementById('btnSetPetugas').click(); };

    document.getElementById('btnLogout').onclick = () => { localStorage.clear(); location.reload(); };
    document.getElementById('btnTheme').onclick = () => {
        const t = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', t); localStorage.setItem('aspro_theme', t);
    };

    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    document.getElementById('cariBarang').oninput = renderTable; // Cari Tabel Kanan
    document.getElementById('filterJenis').onchange = renderTable;
    document.getElementById('cariStokSide').oninput = renderStockCard; // Cari Stok Kiri
    document.getElementById('btnExport').onclick = exportExcel;
});

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('petugasOverlay').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('tanggal').valueAsDate = new Date();
    loadItems();
}

// FUNGSI UTAMA LOAD DATA
async function loadItems() {
    try {
        let { data, error } = await _supabase.from("items").select("*").order("tanggal", { ascending: false });
        if (error) throw error;
        
        globalData = data; // Simpan di variabel global
        renderTable();
        renderStockCard();
        
        // Update Datalist (Auto Suggest)
        const dl = document.getElementById('listBarang');
        const names = [...new Set(data.map(i => i.nama))];
        dl.innerHTML = names.map(n => `<option value="${n}">`).join("");

    } catch (e) { console.error(e); }
}

// RENDER TABEL RIWAYAT (KANAN)
function renderTable() {
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;
    
    tbody.innerHTML = "";

    const filtered = globalData.filter(i => 
        i.nama.toLowerCase().includes(search) && 
        (fJenis === "Semua" || i.jenis === fJenis)
    );

    filtered.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight:700">${item.nama}</td>
            <td>${item.jumlah} <small>${item.satuan}</small></td>
            <td><span style="padding:4px 8px; border-radius:6px; font-size:11px; font-weight:bold; background:${item.jenis === 'Masuk' ? '#14b8a6' : '#3b82f6'}; color:white;">${item.jenis.toUpperCase()}</span></td>
            <td>${item.tanggal}</td>
            <td style="font-size:12px;">👤 ${item.petugas || '-'}</td>
            <td style="text-align:center">
                <button onclick='editData(${JSON.stringify(item)})' style="border:none; background:none; cursor:pointer; font-size:16px;">✏️</button>
                <button onclick="hapusData(${item.id})" style="border:none; background:none; cursor:pointer; color:red; margin-left:12px; font-size:16px;">🗑️</button>
            </td>`;
        tbody.appendChild(row);
    });
}

// RENDER KARTU STOK (KIRI - FITUR BARU)
function renderStockCard() {
    const container = document.getElementById("stockListContainer");
    const searchSide = document.getElementById('cariStokSide').value.toLowerCase();
    
    // 1. Hitung Stok & Frekuensi
    const stockMap = {};
    globalData.forEach(item => {
        const nameKey = item.nama; 
        if (!stockMap[nameKey]) {
            stockMap[nameKey] = { nama: item.nama, qty: 0, satuan: item.satuan, freq: 0 };
        }
        // Hitung saldo
        if (item.jenis === 'Masuk') stockMap[nameKey].qty += item.jumlah;
        else stockMap[nameKey].qty -= item.jumlah;
        
        // Hitung frekuensi transaksi (untuk sorting top 10)
        stockMap[nameKey].freq++;
    });

    // 2. Convert ke Array & Sort (Paling sering transaksi di atas)
    let stockArray = Object.values(stockMap);
    stockArray.sort((a, b) => b.freq - a.freq);

    // 3. Filter berdasarkan input search sidebar
    if (searchSide) {
        stockArray = stockArray.filter(i => i.nama.toLowerCase().includes(searchSide));
    }

    // 4. Render ke HTML
    container.innerHTML = "";
    if (stockArray.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:10px; color:rgba(255,255,255,0.6); font-size:12px;">Data tidak ditemukan</div>`;
        return;
    }

    stockArray.forEach(item => {
        const div = document.createElement('div');
        div.className = 'stock-item';
        // Warna indikator jika stok menipis (<= 5)
        const bgBadge = item.qty <= 5 ? '#f43f5e' : 'rgba(255,255,255,0.2)'; 
        
        div.innerHTML = `
            <span style="flex-grow:1; color:white; font-weight:500;">${item.nama}</span>
            <span class="qty-badge" style="background:${bgBadge}">${item.qty}</span>
            <span style="color:rgba(255,255,255,0.7); font-size:11px; margin-left:5px; width:30px;">${item.satuan}</span>
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
    
    const id = document.getElementById('editId').value;
    if (isEditing) await _supabase.from("items").update(payload).eq('id', id);
    else await _supabase.from("items").insert([payload]);
    
    resetForm(); loadItems(); // loadItems otomatis update tabel & stok card
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
    window.scrollTo({top:0, behavior:'smooth'});
}

function resetForm() {
    isEditing = false;
    document.getElementById('stokForm').reset();
    document.getElementById('btnSimpan').innerText = "SIMPAN TRANSAKSI";
    document.getElementById('btnBatal').style.display = "none";
    document.getElementById('tanggal').valueAsDate = new Date();
}

async function hapusData(id) { 
    if(confirm("Hapus data ini? Stok akan dikalkulasi ulang.")) { 
        await _supabase.from("items").delete().eq('id', id); 
        loadItems(); 
    } 
}

async function exportExcel() {
    const { data } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Laporan_Audit");
    XLSX.writeFile(wb, `Audit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}
