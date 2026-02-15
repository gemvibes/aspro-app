const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let isEditing = false;
let currentPetugas = localStorage.getItem("aspro_petugas") || "";

document.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('aspro_theme') || 'light';
    document.body.setAttribute('data-theme', theme);

    // CEK SESI
    if (localStorage.getItem("aspro_auth") === "true") {
        if (!currentPetugas) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('petugasOverlay').style.display = 'flex';
            document.getElementById('inputNamaPetugas').focus();
        } else { showApp(); }
    }

    // LOGIN PIN + ENTER
    document.getElementById('btnLogin').onclick = handleLogin;
    document.getElementById('pinInput').addEventListener('keypress', (e) => { if(e.key === 'Enter') handleLogin(); });

    // SET PETUGAS + ENTER
    document.getElementById('btnSetPetugas').onclick = handleSetPetugas;
    document.getElementById('inputNamaPetugas').addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSetPetugas(); });

    // OTHER EVENTS
    document.getElementById('btnLogout').onclick = () => { localStorage.clear(); location.reload(); };
    document.getElementById('btnTheme').onclick = () => {
        const t = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', t); localStorage.setItem('aspro_theme', t);
    };
    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('btnBatal').onclick = resetForm;
    document.getElementById('cariBarang').oninput = loadItems;
    document.getElementById('filterJenis').onchange = loadItems;
    document.getElementById('btnExport').onclick = exportExcel;
});

function handleLogin() {
    if (document.getElementById('pinInput').value === "1234") {
        localStorage.setItem("aspro_auth", "true");
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('petugasOverlay').style.display = 'flex';
        document.getElementById('inputNamaPetugas').focus();
    } else { alert("PIN Salah!"); }
}

function handleSetPetugas() {
    const val = document.getElementById('inputNamaPetugas').value.trim();
    if (val) {
        currentPetugas = val;
        localStorage.setItem("aspro_petugas", val);
        document.getElementById('petugasOverlay').style.display = 'none';
        showApp();
    } else { alert("Isi nama petugas!"); }
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

        const uniqueNames = [...new Set(data.map(i => i.nama))];
        dataList.innerHTML = uniqueNames.map(n => `<option value="${n}">`).join("");

        let tIn = 0, tOut = 0; tbody.innerHTML = "";
        data.filter(i => i.nama.toLowerCase().includes(search)).forEach(item => {
            const isIn = item.jenis === 'Masuk';
            isIn ? tIn += item.jumlah : tOut += item.jumlah;
            const row = document.createElement('tr');
            row.style.backgroundColor = isIn ? 'var(--row-in)' : 'var(--row-out)';
            row.innerHTML = `
                <td style="font-weight:600">${item.nama}</td>
                <td>${item.jumlah} <small>${item.satuan}</small></td>
                <td><small>${item.jenis}</small></td>
                <td>${item.tanggal.split('T')[0]}</td>
                <td style="font-size:11px;">${item.petugas || '-'}</td>
                <td style="text-align:center">
                    <button onclick='editData(${JSON.stringify(item)})' style="border:none; background:none; cursor:pointer;">✏️</button>
                    <button onclick="hapusData(${item.id})" style="border:none; background:none; cursor:pointer; color:var(--danger); margin-left:8px;">🗑️</button>
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
    if (!payload.nama || isNaN(payload.jumlah)) return alert("Lengkapi data!");
    const id = document.getElementById('editId').value;
    if (isEditing) { await _supabase.from("items").update(payload).eq('id', id); }
    else { await _supabase.from("items").insert([payload]); }
    resetForm(); loadItems();
}

function editData(item) {
    isEditing = true;
    document.getElementById('editId').value = item.id;
    document.getElementById('namaBarang').value = item.nama;
    document.getElementById('jumlah').value = item.jumlah;
    document.getElementById('satuan').value = item.satuan;
    document.getElementById('jenis').value = item.jenis;
    document.getElementById('tanggal').value = item.tanggal.split('T')[0];
    document.getElementById('btnSimpan').innerText = "Update Data";
    document.getElementById('btnBatal').style.display = "block";
    window.scrollTo({top:0, behavior:'smooth'});
}

function resetForm() {
    isEditing = false;
    document.getElementById('stokForm').reset();
    document.getElementById('btnSimpan').innerText = "Simpan Data";
    document.getElementById('btnBatal').style.display = "none";
    document.getElementById('tanggal').valueAsDate = new Date();
}

async function hapusData(id) { if (confirm("Hapus?")) { await _supabase.from("items").delete().eq('id', id); loadItems(); } }

async function exportExcel() {
    const { data } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
    const wb = XLSX.utils.book_new();
    const riwayat = data.map(i => ({ "Tgl": i.tanggal.split('T')[0], "Barang": i.nama, "Jenis": i.jenis, "Qty": i.jumlah, "Satuan": i.satuan, "Petugas": i.petugas }));
    
    const stokMap = {};
    data.forEach(i => {
        if (!stokMap[i.nama]) stokMap[i.nama] = { "Barang": i.nama, "Masuk": 0, "Keluar": 0, "Sisa": 0, "Satuan": i.satuan };
        if (i.jenis === "Masuk") stokMap[i.nama]["Masuk"] += i.jumlah; else stokMap[i.nama]["Keluar"] += i.jumlah;
        stokMap[i.nama]["Sisa"] = stokMap[i.nama]["Masuk"] - stokMap[i.nama]["Keluar"];
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riwayat), "Riwayat");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(stokMap)), "Stok Akhir");
    XLSX.writeFile(wb, `ASPRO_Report.xlsx`);
}
