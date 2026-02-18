const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;
let currentPetugas = localStorage.getItem("aspro_petugas") || "";
let globalData = [];

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    if (localStorage.getItem("aspro_theme") === 'dark') document.body.setAttribute('data-theme', 'dark');
    
    // Auth Logic
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
    document.getElementById('filterJenis').onchange = renderTable;
    document.getElementById('cariStokSide').oninput = renderStockCard;
    document.getElementById('btnExport').onclick = exportExcel;
});

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('petugasOverlay').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('tanggal').valueAsDate = new Date();
    loadItems();
}

async function loadItems() {
    try {
        let { data, error } = await _supabase.from("items").select("*").order("tanggal", { ascending: false });
        if (error) throw error;
        globalData = data;
        renderTable();
        renderStockCard();
        
        const dl = document.getElementById('listBarang');
        const names = [...new Set(data.map(i => i.nama))];
        dl.innerHTML = names.map(n => `<option value="${n}">`).join("");
    } catch (e) { console.error(e); }
}

function renderTable() {
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;
    tbody.innerHTML = "";

    globalData.filter(i => i.nama.toLowerCase().includes(search) && (fJenis === "Semua" || i.jenis === fJenis))
        .forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:700">${item.nama}</td>
                <td>${item.jumlah} <small>${item.satuan}</small></td>
                <td><span style="padding:4px 8px; border-radius:6px; font-size:11px; font-weight:bold; background:${item.jenis === 'Masuk' ? '#14b8a6' : '#3b82f6'}; color:white;">${item.jenis.toUpperCase()}</span></td>
                <td>${item.tanggal}</td>
                <td style="font-size:12px;">👤 ${item.petugas || '-'}</td>
                <td style="text-align:center">
                    <button onclick='editData(${JSON.stringify(item)})' style="border:none; background:none; cursor:pointer;">✏️</button>
                    <button onclick="hapusData(${item.id})" style="border:none; background:none; cursor:pointer; color:red; margin-left:10px;">🗑️</button>
                </td>`;
            tbody.appendChild(row);
        });
}

function renderStockCard() {
    const container = document.getElementById("stockListContainer");
    const searchSide = document.getElementById('cariStokSide').value.toLowerCase();
    const stockMap = {};

    globalData.forEach(item => {
        if (!stockMap[item.nama]) stockMap[item.nama] = { qty: 0, satuan: item.satuan, freq: 0 };
        stockMap[item.nama].qty += (item.jenis === 'Masuk' ? item.jumlah : -item.jumlah);
        stockMap[item.nama].freq++;
    });

    let stockArray = Object.entries(stockMap).map(([nama, val]) => ({ nama, ...val }))
                     .sort((a, b) => b.freq - a.freq);

    if (searchSide) stockArray = stockArray.filter(i => i.nama.toLowerCase().includes(searchSide));

    container.innerHTML = "";
    stockArray.forEach(item => {
        const div = document.createElement('div');
        div.className = 'stock-row';
        const color = item.qty <= 5 ? '#f43f5e' : 'rgba(255,255,255,0.2)';
        div.innerHTML = `
            <span style="font-weight:600">${item.nama}</span>
            <span style="text-align:center"><span class="qty-badge" style="background:${color}">${item.qty}</span></span>
            <span style="text-align:right; font-size:11px; opacity:0.8;">${item.satuan}</span>
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
    if (!payload.nama || isNaN(payload.jumlah)) return alert("Isi data dengan lengkap!");
    
    if (isEditing) await _supabase.from("items").update(payload).eq('id', document.getElementById('editId').value);
    else await _supabase.from("items").insert([payload]);
    
    resetForm(); loadItems();
}

function editData(item) {
    isEditing = true;
    document.getElementById('editId').value = item.id;
    document.getElementById('namaBarang').value = item.nama;
    document.getElementById('jumlah').value = item.jumlah;
    document.getElementById('satuan').value = item.satuan;
    document.getElementById('jenis').value = item.jenis;
    document.getElementById('tanggal').value = item.tanggal;
    document.getElementById('btnSimpan').innerText = "UPDATE";
    document.getElementById('btnBatal').style.display = "block";
    window.scrollTo({top:0, behavior:'smooth'});
}

function resetForm() {
    isEditing = false;
    document.getElementById('stokForm').reset();
    document.getElementById('btnSimpan').innerText = "SIMPAN";
    document.getElementById('btnBatal').style.display = "none";
    document.getElementById('tanggal').valueAsDate = new Date();
}

async function hapusData(id) { if(confirm("Hapus data ini?")) { await _supabase.from("items").delete().eq('id', id); loadItems(); } }

async function exportExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(globalData);
    XLSX.utils.book_append_sheet(wb, ws, "Audit");
    XLSX.writeFile(wb, `ASPRO_REPORT.xlsx`);
}
