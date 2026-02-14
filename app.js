const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById("stokForm");
const tabelBody = document.getElementById("tabelBody");
const rekapBody = document.getElementById("rekapBody");
const totalBarang = document.getElementById("totalBarang");
const totalTransaksi = document.getElementById("totalTransaksi");

let data = [];

async function loadData() {
    const { data: rows, error } = await supabase
        .from("items")
        .select("*")
        .order("tanggal", { ascending: true });

    if (error) {
        alert("Gagal ambil data dari server");
        return;
    }

    data = rows;
    render();
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const item = {
        nama: namaBarang.value,
        jumlah: parseInt(jumlah.value),
        satuan: satuan.value,
        jenis: jenis.value,
        tanggal: tanggal.value
    };

    const { error } = await supabase.from("items").insert([item]);
    if (error) {
        alert("Gagal simpan data");
        return;
    }

    form.reset();
    loadData();
});

function render() {
    tabelBody.innerHTML = "";
    rekapBody.innerHTML = "";

    let stok = {};

    data.forEach((d, i) => {
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

        stok[d.nama] = stok[d.nama] || { jumlah: 0, satuan: d.satuan };
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

loadData();
