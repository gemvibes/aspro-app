const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI"; 
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    // Session Checker
    if (localStorage.getItem("aspro_session") === "active") { showApp(); }

    // Event Listeners
    document.getElementById('btnLogin').onclick = handleLogin;
    document.getElementById('btnLogout').onclick = handleLogout;
    document.getElementById('btnSimpan').onclick = simpanData;
    document.getElementById('cariBarang').onkeyup = filterTable;
    document.getElementById('btnExport').onclick = exportPro;
});

function handleLogin() {
    if (document.getElementById('pinInput').value === "1234") {
        localStorage.setItem("aspro_session", "active");
        showApp();
    } else { alert("PIN Tidak Terdaftar!"); }
}

function handleLogout() {
    if(confirm("Keluar dari aplikasi?")) {
        localStorage.removeItem("aspro_session");
        location.reload();
    }
}

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    document.getElementById('tanggal').valueAsDate = new Date();
    loadItems();
}

async function loadItems() {
    const tbody = document.getElementById("tabelBody");
    try {
        const { data, error } = await _supabase.from("items").select("*").order("id", { ascending: false });
        if (error) throw error;

        let inTotal = 0, outTotal = 0;
        tbody.innerHTML = "";

        data.forEach(item => {
            const isMasuk = item.jenis === 'Masuk';
            isMasuk ? inTotal += Number(item.jumlah) : outTotal += Number(item.jumlah);

            // User Request: Hijau untuk Masuk, Biru Langit untuk Keluar
            const rowColor = isMasuk ? '#e8f5e9' : '#e1f5fe'; 
            
            tbody.innerHTML += `
                <tr style="background-color: ${rowColor};">
                    <td>
                        <strong>${item.nama}</strong><br>
                        <small style="color:#555">${item.jenis}</small>
                    </td>
                    <td>${item.jumlah} <small>${item.satuan}</small></td>
                    <td><small>${item.tanggal}</small></td>
                    <td>
                        <button onclick="hapusData(${item.id})" class="btn-icon">🗑️</button>
                    </td>
                </tr>`;
        });

        document.getElementById('summaryMasuk').innerText = inTotal;
        document.getElementById('summaryKeluar').innerText = outTotal;
    } catch (err) { console.error(err); }
}

async function simpanData() {
    const btn = document.getElementById('btnSimpan');
    const data = {
        nama: document.getElementById("namaBarang").value.trim(),
        jumlah: parseInt(document.getElementById("jumlah").value),
        satuan: document.getElementById("satuan").value.trim(),
        jenis: document.getElementById("jenis").value,
        tanggal: document.getElementById("tanggal").value
    };

    if (!data.nama || isNaN(data.jumlah)) return alert("Mohon lengkapi data!");

    btn.disabled = true;
    btn.innerText = "MEMPROSES...";

    try {
        const { error } = await _supabase.from("items").insert([data]);
        if (error) throw error;
        document.getElementById("stokForm").reset();
        document.getElementById('tanggal').valueAsDate = new Date();
        loadItems();
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; btn.innerText = "💾 SIMPAN TRANSAKSI"; }
}

async function hapusData(id) {
    if (confirm("Hapus data transaksi ini secara permanen?")) {
        await _supabase.from("items").delete().eq('id', id);
        loadItems();
    }
}

function filterTable() {
    const query = document.getElementById('cariBarang').value.toUpperCase();
    const rows = document.querySelectorAll("#tabelBody tr");
    rows.forEach(row => {
        row.style.display = row.innerText.toUpperCase().includes(query) ? "" : "none";
    });
}

async function exportPro() {
    try {
        const { data, error } = await _supabase.from("items").select("*").order("tanggal", { ascending: true });
        if (error) throw error;

        // Sheet 1: Riwayat Transaksi
        const riwayat = data.map(i => ({
            "Tanggal": i.tanggal,
            "Nama ATK": i.nama,
            "Jenis": i.jenis,
            "Qty": i.jumlah,
            "Satuan": i.satuan
        }));

        // Sheet 2: Sisa Stok (Agregasi)
        const sisa = {};
        data.forEach(i => {
            if (!sisa[i.nama]) sisa[i.nama] = { "Nama ATK": i.nama, "Total Stok": 0, "Satuan": i.satuan };
            i.jenis === "Masuk" ? sisa[i.nama]["Total Stok"] += i.jumlah : sisa[i.nama]["Total Stok"] -= i.jumlah;
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riwayat), "Rekap Transaksi");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(sisa)), "Sisa Stok");
        XLSX.writeFile(wb, `Laporan_ASPRO_V2_${new Date().getMonth()+1}.xlsx`);
    } catch (e) { alert("Export Gagal: " + e.message); }
}
