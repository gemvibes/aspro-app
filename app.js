const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;
let currentPetugas = localStorage.getItem("aspro_petugas") || "";

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem("aspro_theme") === 'dark') document.body.setAttribute('data-theme', 'dark');
    
    // Auth Check
    if (localStorage.getItem("aspro_auth") === "true") {
        if (!currentPetugas) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
        } else { showApp(); }
    }

    // Login Event
    document.getElementById('btnLogin').onclick = () => {
        if (document.getElementById('pinInput').value === "1234") {
            localStorage.setItem("aspro_auth", "true");
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
        } else alert("PIN Salah!");
    };
    document.getElementById('pinInput').onkeypress = (e) => { if(e.key === 'Enter') document.getElementById('btnLogin').click(); };

    // Petugas Event
    document.getElementById('btnSetPetugas').onclick = () => {
        const val = document.getElementById('inputNamaPetugas').value.trim();
        if(val) { currentPetugas = val; localStorage.setItem("aspro_petugas", val); showApp(); }
    };
    document.getElementById('inputNamaPetugas').onkeypress = (e) => { if(e.key === 'Enter') document.getElementById('btnSetPetugas').click(); };

    // Global UI Events
    document.getElementById('btnLogout').onclick = () => { localStorage.clear(); location.reload(); };
    document.getElementById('btnTheme').onclick = () => {
        const t = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', t); localStorage.setItem('aspro_theme', t);
    };

    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    document.getElementById('cariBarang').oninput = loadItems;
    document.getElementById('filterJenis').onchange = loadItems;
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
    const tbody = document.getElementById("tabelBody");
    const search = document.getElementById('cariBarang').value.toLowerCase();
    const fJenis = document.getElementById('filterJenis').value;

    try {
        let { data, error } = await _supabase.from("items").select("*").order("tanggal", { ascending: false });
        if (error) throw error;

        // Update Auto Suggest
        const dl = document.getElementById('listBarang');
        const names = [...new Set(data.map(i => i.nama))];
        dl.innerHTML = names.map(n => `<option value="${n}">`).join("");

        let tIn = 0, tOut = 0; tbody.innerHTML = "";
        data.filter(i => i.nama.toLowerCase().includes(search) && (fJenis === "Semua" || i.jenis === fJenis))
            .forEach(item => {
                item.jenis === 'Masuk' ? tIn += item.jumlah : tOut += item.jumlah;
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

        document.getElementById('sumMasuk').innerText = tIn;
        document.getElementById('sumKeluar').innerText = tOut;
    } catch (e) { console.error(e); }
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
    if (!payload.nama || isNaN(payload.jumlah)) return alert("Data belum lengkap!");
    
    const id = document.getElementById('editId').value;
    if (isEditing) await _supabase.from("items").update(payload).eq('id', id);
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

async function hapusData(id) { if(confirm("Hapus baris data ini?")) { await _supabase.from("items").delete().eq('id', id); loadItems(); } }

async function exportExcel() {
    const { data } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Audit_Log");
    XLSX.writeFile(wb, `ASPRO_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
}
