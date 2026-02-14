// ========================
// Supabase config
// ========================
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ========================
// DOM elements
// ========================
const form = document.getElementById("stokForm");
const tabelBody = document.getElementById("tabelBody");
const rekapBody = document.getElementById("rekapBody");
const totalBarang = document.getElementById("totalBarang");
const totalTransaksi = document.getElementById("totalTransaksi");

let data = [];

// ========================
// Load data dari Supabase
// ========================
async function loadData() {
    const { data: rows, error } = await supabase
        .from("items")
        .select("*")
        .order("tanggal", { ascending: true });

    if (error) {
        alert("Gagal load data: " + error.message);
        return;
    }

    data = rows || [];
    render();
}

// ========================
// Submit form
// ========================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
        nama: document.getElementById("namaBarang").value,
        jumlah: Number(document.getElementById("jumlah").value),
        satuan: document.getElementById("satuan").value,
        jenis: document.getElementById("jenis").value,
        tanggal: document.getElementById("tanggal").value
    };

    // Insert ke Supabase
    const { error } = await supabase.from("items").insert([payload]);

    if (error) {
        alert("Gagal simpan: " + error.message);
        return;
    }

    alert("Berhasil disimpan!");
    form.reset();
    loadData();
});

// ========================
// Render tabel & rekap
// ========================
function render() {
    tabelBody.innerHTML = "";
    rekapBody.innerHTML = "";

    let stok = {};

    data.forEach((d, i) => {
        // Tabel transaksi
        tabelBody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${d.tanggal}</td>
                <td>${d.nama}</td>
                <td>${d.jumlah}</td>
                <td>${d.satuan}</td>
                <td>${d.jenis}</td>
            </tr>
        `;

        // Hitung rekap
        if (!stok[d.nama]) stok[d.nama] = { jumlah: 0, satuan: d.satuan };
        stok[d.nama].jumlah += d.jenis === "Masuk" ? d.jumlah : -d.jumlah;
    });

    Object.keys(stok).forEach(nama => {
        rekapBody.innerHTML += `
            <tr>
                <td>${nama}</td>
                <td>${stok[nama].jumlah}</td>
                <td>${stok[nama].satuan}</td>
            </tr>
        `;
    });

    totalBarang.textContent = Object.keys(stok).length;
    totalTransaksi.textContent = data.length;
}

// ========================
// Export CSV
// ========================
document.getElementById("exportCSV").onclick = () => {
    let csv = "Tanggal,Nama,Jumlah,Satuan,Jenis\n";
    data.forEach(d => {
        csv += `${d.tanggal},${d.nama},${d.jumlah},${d.satuan},${d.jenis}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aspro-stok.csv";
    a.click();
};

// ========================
// Load data awal
// ========================
loadData();
